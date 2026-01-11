import { ref, onUnmounted } from 'vue'
import { Soundfont, DrumMachine } from 'smplr'
import { type ChordTiming, getRootMidiNote } from '../utils/chordUtils'

// GM drum note number to Roland CR-8000 sample name mapping
const GM_TO_DRUM: Record<number, string> = {
  35: 'kick',         // Acoustic Bass Drum
  36: 'kick',         // Bass Drum 1
  37: 'rimshot',      // Side Stick
  38: 'snare',        // Acoustic Snare
  39: 'clap',         // Hand Clap
  40: 'snare',        // Electric Snare
  41: 'tom-low',      // Low Floor Tom
  42: 'hihat-closed', // Closed Hi-Hat
  43: 'tom-low',      // High Floor Tom
  44: 'hihat-closed', // Pedal Hi-Hat
  45: 'tom-low',      // Low Tom
  46: 'hihat-open',   // Open Hi-Hat
  47: 'tom-low',      // Low-Mid Tom
  48: 'tom-high',     // Hi-Mid Tom
  49: 'cymball',      // Crash Cymbal 1
  50: 'tom-high',     // High Tom
  51: 'cymball',      // Ride Cymbal 1
  52: 'cymball',      // Chinese Cymbal
  53: 'cymball',      // Ride Bell
  54: 'clave',        // Tambourine -> clave
  55: 'cymball',      // Splash Cymbal
  56: 'cowbell',      // Cowbell
  57: 'cymball',      // Crash Cymbal 2
  60: 'conga-high',   // Hi Bongo
  61: 'conga-low',    // Low Bongo
  62: 'conga-high',   // Mute Hi Conga
  63: 'conga-high',   // Open Hi Conga
  64: 'conga-low',    // Low Conga
  75: 'clave',        // Claves
}

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
    notes: MidiNote[]
  }[]
  sections?: Section[]
}

let audioContext: AudioContext | null = null
let piano: any = null
let guitar: any = null
let pad: any = null  // For Aux track
let bass: any = null  // For root note playback
let drums: any = null
let initPromise: Promise<void> | null = null
let isInitialized = false

// Global loading state for sharing across components
const globalIsLoading = ref(false)
const globalIsReady = ref(false)

// Track-specific instrument settings
const trackInstruments = ref<Record<string, 'piano' | 'guitar'>>({
  Chord: 'piano'
})

export interface PlayOptions {
  chordTimings?: ChordTiming[]
  musicKey?: number
  playRootNotes?: boolean
}

export function useMidiPlayer() {
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

  async function init() {
    // Already initialized
    if (isInitialized && piano && guitar && pad && bass && drums) {
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

        // Load piano, guitar, pad, bass, and drums in parallel
        const [loadedPiano, loadedGuitar, loadedPad, loadedBass, loadedDrums] = await Promise.all([
          new Soundfont(audioContext, { instrument: 'acoustic_grand_piano' }).load,
          new Soundfont(audioContext, { instrument: 'distortion_guitar' }).load,
          new Soundfont(audioContext, { instrument: 'pad_2_warm' }).load,  // For Aux track
          new Soundfont(audioContext, { instrument: 'acoustic_bass' }).load,  // For root notes
          new DrumMachine(audioContext, { instrument: 'Roland CR-8000' }).load
        ])

        piano = loadedPiano
        guitar = loadedGuitar
        pad = loadedPad
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

  // Cached play options for resume
  let cachedPlayOptions: PlayOptions = {}

  async function play(eventData: EventData, fromTick: number = 0, options: PlayOptions = {}) {
    // Block playback if not ready
    if (!globalIsReady.value) {
      await init()
    }

    if (!audioContext || !piano) return

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    cachedEventData = eventData
    cachedPlayOptions = options
    bpm = eventData.bpm || 120
    ppq = eventData.ppq || 480

    // Calculate total duration from sections (most reliable)
    let maxTick = 0

    // Get end tick from last section if available
    if (eventData.sections && eventData.sections.length > 0) {
      const lastSection = eventData.sections[eventData.sections.length - 1]
      const sectionEndTick = lastSection.end_ticks ?? lastSection.endTick ?? 0
      maxTick = sectionEndTick
    }

    const offsetSeconds = ticksToSeconds(fromTick)
    startTime = audioContext.currentTime - offsetSeconds

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
            velocity: 70,  // Moderate velocity for root notes
            time: audioContext.currentTime + adjustedStartSeconds,
            duration: Math.min(adjustedDuration, ticksToSeconds(ppq * 2))  // Max 2 beats duration
          })
        }
      }
    }

    for (const track of eventData.tracks) {
      // Check by name or MIDI channel 10 (index 9)
      const isDrumTrack = track.name === 'Drums' || (track as any).channel === 9
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
            // Convert GM drum note to Roland CR-8000 sample name
            const drumSample = GM_TO_DRUM[noteNum]
            if (drumSample) {
              drums.start({
                note: drumSample,
                velocity: note.velocity,
                time: audioContext.currentTime + adjustedStartSeconds,
                duration: adjustedDuration
              })
            }
          } else if (!isDrumTrack) {
            // Select instrument based on track name
            let instrument = piano
            if (track.name === 'Aux' && pad) {
              instrument = pad
            } else if (track.name === 'Chord' && trackInstruments.value.Chord === 'guitar' && guitar) {
              instrument = guitar
            }

            // Play melodic sound with selected instrument
            instrument.start({
              note: noteNum,
              velocity: note.velocity,
              time: audioContext.currentTime + adjustedStartSeconds,
              duration: adjustedDuration
            })
          }
        }
      }
    }

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
      currentTick.value = secondsToTicks(elapsed)

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

    if (piano) {
      piano.stop()
    }
    if (guitar) {
      guitar.stop()
    }
    if (pad) {
      pad.stop()
    }
    if (bass) {
      bass.stop()
    }
    if (drums) {
      drums.stop()
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

    if (piano) {
      piano.stop()
    }
    if (guitar) {
      guitar.stop()
    }
    if (pad) {
      pad.stop()
    }
    if (bass) {
      bass.stop()
    }
    if (drums) {
      drums.stop()
    }
  }

  function setTrackInstrument(track: string, instrument: 'piano' | 'guitar') {
    trackInstruments.value[track] = instrument
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
    setTrackInstrument
  }
}
