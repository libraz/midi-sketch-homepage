import { ref, onUnmounted } from 'vue'
import { Soundfont, DrumMachine } from 'smplr'

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

interface EventData {
  bpm: number
  ppq: number
  tracks: {
    name: string
    notes: MidiNote[]
  }[]
}

let audioContext: AudioContext | null = null
let piano: any = null
let guitar: any = null
let pad: any = null  // For Aux track
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
    if (isInitialized && piano && guitar && pad && drums) {
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

        // Load piano, guitar, pad, and drums in parallel
        const [loadedPiano, loadedGuitar, loadedPad, loadedDrums] = await Promise.all([
          new Soundfont(audioContext, { instrument: 'acoustic_grand_piano' }).load,
          new Soundfont(audioContext, { instrument: 'distortion_guitar' }).load,
          new Soundfont(audioContext, { instrument: 'pad_2_warm' }).load,  // For Aux track
          new DrumMachine(audioContext, { instrument: 'Roland CR-8000' }).load
        ])

        piano = loadedPiano
        guitar = loadedGuitar
        pad = loadedPad
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

  async function play(eventData: EventData, fromTick: number = 0) {
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
    bpm = eventData.bpm || 120
    ppq = eventData.ppq || 480

    // Calculate total duration and schedule notes from the given tick
    let maxTick = 0
    const offsetSeconds = ticksToSeconds(fromTick)
    startTime = audioContext.currentTime - offsetSeconds

    for (const track of eventData.tracks) {
      // Check by name or MIDI channel 10 (index 9)
      const isDrumTrack = track.name === 'Drums' || (track as any).channel === 9
      const notes = track.notes || (track as any).events || []

      for (const note of notes) {
        const noteNum = getNoteValue(note, 'pitch')
        const startTicks = getNoteValue(note, 'start')
        const durationTicks = getNoteValue(note, 'duration')
        const endTick = startTicks + durationTicks

        if (endTick > maxTick) maxTick = endTick

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
    const remainingSeconds = ticksToSeconds(maxTick - fromTick)
    stopTimeout = setTimeout(() => {
      stop()
    }, remainingSeconds * 1000 + 500)

    // Update current position
    function updatePosition() {
      if (!isPlaying.value || !audioContext) return

      const elapsed = audioContext.currentTime - startTime
      currentTick.value = secondsToTicks(elapsed)

      if (currentTick.value >= duration.value) {
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
    if (drums) {
      drums.stop()
    }
  }

  async function resume() {
    if (!isPaused.value || !cachedEventData) return
    await play(cachedEventData, pausedTick)
  }

  async function togglePlay(eventData: EventData) {
    // Block if still loading
    if (globalIsLoading.value) return

    if (isPlaying.value) {
      pause()
    } else if (isPaused.value) {
      await resume()
    } else {
      await play(eventData, 0)
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
