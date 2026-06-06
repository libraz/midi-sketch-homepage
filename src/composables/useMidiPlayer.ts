import { ref, onUnmounted } from 'vue'
import { Soundfont, DrumMachine } from 'smplr'
import { devLog } from '@/utils/devLog'
import { type ChordTiming, getRootMidiNote } from '@/utils/chordUtils'
import {
  DEMO_SOUNDFONT_KIT,
  type DrumKitName,
  gmToDrumSample,
  loadDrumMachine,
  loadInstrumentsForTracks,
  getRequiredInstruments,
  scaleTrackVelocity,
} from '@/utils/gmInstruments'

interface MidiNote {
  // Support both naming conventions from WASM
  note?: number
  pitch?: number
  start?: number
  start_ticks?: number
  duration?: number
  duration_ticks?: number
  velocity: number
  track?: number
}

// Helper to get note values (handles both naming conventions)
function getNoteValue(note: MidiNote, key: 'pitch' | 'start' | 'duration'): number {
  if (key === 'pitch') return note.pitch ?? note.note ?? 60
  if (key === 'start') return note.start_ticks ?? note.start ?? 0
  if (key === 'duration') return note.duration_ticks ?? note.duration ?? 480
  return 0
}

interface Section {
  start_ticks?: number
  startTick?: number
  end_ticks?: number
  endTick?: number
  name?: string
}

interface EventData {
  bpm: number
  ppq: number
  tracks: {
    name: string
    channel?: number
    program?: number
    notes: MidiNote[]
  }[]
  sections?: Section[]
}

let audioContext: AudioContext | null = null
let bass: Soundfont | null = null  // For optional root note playback
let drums: DrumMachine | null = null
let initPromise: Promise<void> | null = null
let isInitialized = false

// Dynamically loaded instruments per track
let trackInstrumentMap = new Map<string, Soundfont>()

// Global loading state for sharing across components
const globalIsLoading = ref(false)
const globalIsReady = ref(false)

// Track mute settings (SE track is muted by default)
const trackMuted = ref<Record<string, boolean>>({
  SE: true
})

export interface PlayOptions {
  chordTimings?: ChordTiming[]
  musicKey?: number
  playRootNotes?: boolean
  /** Drum machine kit (per song image); defaults to TR-808 */
  drumKit?: DrumKitName
}

// ============================================
// Module-level singleton playback state
// ============================================
// The audio engine (audioContext, instruments) is module-level, so the
// reactive transport state must be too: every useMidiPlayer() caller —
// StudioPlayer (transport), useStudioGeneration (regen playback
// preservation), StudioOutputBar, etc. — observes and controls the same
// playback. Per-call refs used to split this state across instances,
// so regeneration could not see (or stop) the audio started elsewhere.
const isPlaying = ref(false)
const isPaused = ref(false)
const currentTick = ref(0)
const duration = ref(0)

let animationFrame: number | null = null
let startTime = 0
let pausedTick = 0
let bpm = 120
let ppq = 480
let stopTimeout: ReturnType<typeof setTimeout> | null = null
let cachedEventData: EventData | null = null
// Cached play options for resume
let cachedPlayOptions: PlayOptions = {}

export function useMidiPlayer() {

  async function init() {
    // Already initialized
    if (isInitialized && bass && drums) {
      globalIsReady.value = true
      return
    }

    // Already loading, wait for completion
    if (initPromise) {
      await initPromise
      return
    }

    globalIsLoading.value = true
    globalIsReady.value = false

    initPromise = (async () => {
      try {
        audioContext = new AudioContext()

        // Load only bass and drums at init (minimal footprint).
        // The default kit is a warm-up; play() swaps in the song image's kit.
        const [loadedBass, loadedDrums] = await Promise.all([
          new Soundfont(audioContext, {
            instrument: 'electric_bass_finger',
            kit: DEMO_SOUNDFONT_KIT,
          }).load,
          loadDrumMachine(audioContext)
        ])

        bass = loadedBass
        drums = loadedDrums
        isInitialized = true
        globalIsReady.value = true
      } finally {
        globalIsLoading.value = false
      }
    })()

    await initPromise
  }

  // Preload soundfont without playing
  async function preload() {
    await init()
  }

  function ticksToSeconds(ticks: number): number {
    return (ticks / ppq) * (60 / bpm)
  }

  function secondsToTicks(seconds: number): number {
    return (seconds * bpm / 60) * ppq
  }

  async function play(eventData: EventData, fromTick: number = 0, options: PlayOptions = {}) {
    // Block playback if not ready
    if (!globalIsReady.value) {
      await init()
    }

    if (!audioContext || !bass) return

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    cachedEventData = eventData
    cachedPlayOptions = options
    bpm = eventData.bpm || 120
    ppq = eventData.ppq || 480

    // Dynamically load instruments for tracks if needed
    const required = getRequiredInstruments(eventData.tracks)
    const needsLoad = [...required.keys()].some(trackName => !trackInstrumentMap.has(trackName))

    // Rebuild the track map for each playback so role-based preview instruments
    // stay in sync even when the generated MIDI program changes.
    globalIsLoading.value = needsLoad
    try {
      const result = await loadInstrumentsForTracks(audioContext, eventData.tracks, {
        drumKit: options.drumKit,
      })
      trackInstrumentMap = result.trackMap
      drums = result.drums // kit follows the current song image (cached per kit)
    } finally {
      globalIsLoading.value = false
    }

    // Calculate total duration from sections (most reliable)
    let maxTick = 0

    // Get end tick from last section if available
    if (eventData.sections && eventData.sections.length > 0) {
      const lastSection = eventData.sections[eventData.sections.length - 1]
      const sectionEndTick = lastSection.end_ticks ?? lastSection.endTick ?? 0
      maxTick = sectionEndTick
    }

    const offsetSeconds = ticksToSeconds(fromTick)

    // Anchor ALL note scheduling to a single timestamp. audioContext.currentTime
    // keeps advancing while the scheduling loop below runs, so reading it per
    // note would skew tracks scheduled later in the loop. The small margin also
    // keeps the first notes from landing in the past (= played late).
    const SCHEDULE_AHEAD_SECONDS = 0.1
    const scheduleAnchor = audioContext.currentTime + SCHEDULE_AHEAD_SECONDS
    startTime = scheduleAnchor - offsetSeconds

    // Play root notes if enabled
    if (options.playRootNotes && options.chordTimings && bass) {
      const musicKey = options.musicKey ?? 0
      for (const timing of options.chordTimings) {
        // Skip chords that end before fromTick
        if (timing.endTick <= fromTick) continue

        const rootNote = getRootMidiNote(musicKey, timing.chord.semitone, 2) // Octave 2 for bass
        const startTicks = timing.startTick
        const durationTicks = timing.endTick - timing.startTick

        const startSeconds = ticksToSeconds(startTicks)
        const durationSeconds = ticksToSeconds(durationTicks)

        const adjustedStartSeconds = Math.max(0, startSeconds - offsetSeconds)
        const adjustedDuration = startTicks < fromTick
          ? durationSeconds - (offsetSeconds - startSeconds)
          : durationSeconds

        if (adjustedDuration > 0) {
          bass.start({
            note: rootNote,
            velocity: 62,  // Moderate velocity for root notes
            time: scheduleAnchor + adjustedStartSeconds,
            duration: Math.min(adjustedDuration, ticksToSeconds(ppq * 2))  // Max 2 beats duration
          })
        }
      }
    }

    for (const track of eventData.tracks) {
      // Skip muted tracks (SE track is muted by default)
      if (trackMuted.value[track.name]) continue

      // Check by name or MIDI channel 10 (index 9)
      const isDrumTrack = track.name === 'Drums' || track.channel === 9
      const notes = track.notes || (track as any).events || []

      for (const note of notes) {
        const noteNum = getNoteValue(note, 'pitch')
        const startTicks = getNoteValue(note, 'start')
        const durationTicks = getNoteValue(note, 'duration')
        const endTick = startTicks + durationTicks

        // Only update maxTick from notes if sections not available
        if (!eventData.sections?.length && endTick > maxTick) {
          maxTick = endTick
        }

        // Skip notes that are before the current position
        if (endTick <= fromTick) continue

        const startSeconds = ticksToSeconds(startTicks)
        const durationSeconds = ticksToSeconds(durationTicks)

        // Adjust start time if note started before fromTick
        const adjustedStartSeconds = Math.max(0, startSeconds - offsetSeconds)
        const adjustedDuration = startTicks < fromTick
          ? durationSeconds - (offsetSeconds - startSeconds)
          : durationSeconds

        if (adjustedDuration > 0) {
          if (isDrumTrack && drums) {
            // Convert GM drum note to the current kit's sample name
            const drumSample = gmToDrumSample(noteNum, options.drumKit)
            if (drumSample) {
              drums.start({
                note: drumSample,
                velocity: scaleTrackVelocity(track, note.velocity),
                time: scheduleAnchor + adjustedStartSeconds,
                duration: adjustedDuration
              })
            }
          } else if (!isDrumTrack) {
            // Select instrument from dynamic track map
            const instrument = trackInstrumentMap.get(track.name)
            if (instrument) {
              instrument.start({
                note: noteNum,
                velocity: scaleTrackVelocity(track, note.velocity),
                time: scheduleAnchor + adjustedStartSeconds,
                duration: adjustedDuration
              })
            }
          }
        }
      }
    }

    devLog('Player play', { fromTick: Math.round(fromTick), tracks: eventData.tracks.length })

    duration.value = maxTick
    isPlaying.value = true
    isPaused.value = false
    currentTick.value = fromTick

    // Auto-stop after playback ends
    const totalDurationSeconds = ticksToSeconds(maxTick)
    const remainingSeconds = ticksToSeconds(maxTick - fromTick)
    stopTimeout = setTimeout(() => {
      stop()
    }, remainingSeconds * 1000 + 500)

    // Update current position
    function updatePosition() {
      if (!isPlaying.value || !audioContext) return

      const elapsed = audioContext.currentTime - startTime
      // Clamp: elapsed is briefly negative while the schedule-ahead margin elapses
      currentTick.value = Math.max(0, secondsToTicks(elapsed))

      // Check both tick-based and time-based conditions for stopping
      if (currentTick.value >= duration.value || elapsed >= totalDurationSeconds + 0.1) {
        stop()
        return
      }

      animationFrame = requestAnimationFrame(updatePosition)
    }

    updatePosition()
  }

  function pause() {
    if (!isPlaying.value) return

    pausedTick = currentTick.value
    isPlaying.value = false
    isPaused.value = true

    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }

    if (stopTimeout) {
      clearTimeout(stopTimeout)
      stopTimeout = null
    }

    // Stop all dynamically loaded instruments
    for (const [, instrument] of trackInstrumentMap) {
      instrument.stop()
    }
    if (bass) {
      bass.stop()
    }
    if (drums) {
      (drums as any).stop()
    }
  }

  async function resume() {
    if (!isPaused.value || !cachedEventData) return
    await play(cachedEventData, pausedTick, cachedPlayOptions)
  }

  async function togglePlay(eventData: EventData, options: PlayOptions = {}) {
    // Block if still loading
    if (globalIsLoading.value) return

    if (isPlaying.value) {
      pause()
    } else if (isPaused.value) {
      await resume()
    } else {
      await play(eventData, 0, options)
    }
  }

  function stop() {
    if (isPlaying.value || isPaused.value) {
      devLog('Player stop', { atTick: Math.round(currentTick.value) })
    }
    isPlaying.value = false
    isPaused.value = false
    currentTick.value = 0
    pausedTick = 0

    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }

    if (stopTimeout) {
      clearTimeout(stopTimeout)
      stopTimeout = null
    }

    // Stop all dynamically loaded instruments
    for (const [, instrument] of trackInstrumentMap) {
      instrument.stop()
    }
    if (bass) {
      bass.stop()
    }
    if (drums) {
      (drums as any).stop()
    }
  }

  function setTrackMuted(track: string, muted: boolean) {
    trackMuted.value[track] = muted
  }

  function isTrackMuted(track: string): boolean {
    return trackMuted.value[track] ?? false
  }

  function rewind() {
    stop()
  }

  function seek(tick: number) {
    currentTick.value = tick
    pausedTick = tick
  }

  onUnmounted(() => {
    stop()
  })

  return {
    isPlaying,
    isPaused,
    isLoading: globalIsLoading,
    isReady: globalIsReady,
    currentTick,
    duration,
    preload,
    play,
    pause,
    resume,
    togglePlay,
    stop,
    rewind,
    seek,
    setTrackMuted,
    isTrackMuted
  }
}
