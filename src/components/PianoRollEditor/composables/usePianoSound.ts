import { ref, onUnmounted, type Ref } from 'vue'
import { Soundfont } from 'smplr'
import type { PlacedNote, ChordAtBar } from '@/components/PianoRollEditor/types'
import { PPQ } from '@/components/PianoRollEditor/types'

// ============================================================================
// Piano Sound Composable - Sound playback for Piano Roll Editor
// ============================================================================

// Shared audio context and piano instance
let audioContext: AudioContext | null = null
let piano: any = null
let bass: any = null
let initPromise: Promise<void> | null = null
let isInitialized = false

// Global loading state
const globalIsLoading = ref(false)
const globalIsReady = ref(false)

export interface UsePianoSoundOptions {
  bpm?: Ref<number>
}

export function usePianoSound(options: UsePianoSoundOptions = {}) {
  const bpm = options.bpm ?? ref(120)

  const isPlaying = ref(false)
  const isPaused = ref(false)
  const currentTick = ref(0)
  const duration = ref(0)

  let animationFrame: number | null = null
  let startTime = 0
  let pausedTick = 0
  let stopTimeout: ReturnType<typeof setTimeout> | null = null
  let scheduledNotes: { noteId: string; stopTime: number }[] = []

  // Store playback context for resume after visibility change
  let lastPlaybackContext: {
    notes: PlacedNote[]
    totalTicks?: number
    chords?: ChordAtBar[]
  } | null = null

  // Initialize audio
  async function init() {
    if (isInitialized && piano && bass) {
      globalIsReady.value = true
      return
    }

    if (initPromise) {
      await initPromise
      return
    }

    globalIsLoading.value = true
    globalIsReady.value = false

    initPromise = (async () => {
      try {
        audioContext = new AudioContext()
        // Load piano and bass in parallel (same as useMidiPlayer)
        const [loadedPiano, loadedBass] = await Promise.all([
          new Soundfont(audioContext, { instrument: 'acoustic_grand_piano' }).load,
          new Soundfont(audioContext, { instrument: 'acoustic_bass' }).load,
        ])
        piano = loadedPiano
        bass = loadedBass
        isInitialized = true
        globalIsReady.value = true
      } finally {
        globalIsLoading.value = false
      }
    })()

    await initPromise
  }

  // Preload without playing
  async function preload() {
    await init()
  }

  // Convert ticks to seconds
  function ticksToSeconds(ticks: number): number {
    return (ticks / PPQ) * (60 / bpm.value)
  }

  // Convert seconds to ticks
  function secondsToTicks(seconds: number): number {
    return (seconds * bpm.value / 60) * PPQ
  }

  // Play a single note (for preview/click)
  async function playNote(pitch: number, velocity: number = 100, durationMs: number = 300) {
    if (!globalIsReady.value) {
      await init()
    }

    if (!audioContext || !piano) return

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    piano.start({
      note: pitch,
      velocity,
      time: audioContext.currentTime,
      duration: durationMs / 1000
    })
  }

  // Stop a specific note
  function stopNote(pitch: number) {
    if (!piano) return
    // smplr doesn't have a stopNote method, notes will decay naturally
    // For immediate stop, we could stop all and replay active ones
  }

  // Play all placed notes from a specific tick, with optional chord bass accompaniment
  async function play(notes: PlacedNote[], fromTick: number = 0, totalTicks?: number, chords?: ChordAtBar[]) {
    if (!globalIsReady.value) {
      await init()
    }

    if (!audioContext || !piano) return

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    // Store playback context for potential resume after visibility change
    lastPlaybackContext = { notes, totalTicks, chords }

    // Calculate total duration
    let maxEndTick = totalTicks ?? 0
    if (!totalTicks) {
      for (const note of notes) {
        const endTick = note.startTick + note.duration
        if (endTick > maxEndTick) maxEndTick = endTick
      }
    }

    const offsetSeconds = ticksToSeconds(fromTick)
    startTime = audioContext.currentTime - offsetSeconds
    scheduledNotes = []

    // Schedule melody notes
    for (const note of notes) {
      const noteEndTick = note.startTick + note.duration

      // Skip notes that end before current position
      if (noteEndTick <= fromTick) continue

      const startSeconds = ticksToSeconds(note.startTick)
      const durationSeconds = ticksToSeconds(note.duration)

      // Adjust for notes that started before fromTick
      const adjustedStartSeconds = Math.max(0, startSeconds - offsetSeconds)
      const adjustedDuration = note.startTick < fromTick
        ? durationSeconds - (offsetSeconds - startSeconds)
        : durationSeconds

      if (adjustedDuration > 0) {
        const playTime = audioContext.currentTime + adjustedStartSeconds
        piano.start({
          note: note.pitch,
          velocity: 100,
          time: playTime,
          duration: adjustedDuration
        })
        scheduledNotes.push({
          noteId: note.id,
          stopTime: playTime + adjustedDuration
        })
      }
    }

    // Schedule bass notes for chord progression
    if (chords && chords.length > 0 && bass) {
      const ticksPerBar = 4 * PPQ
      for (const chord of chords) {
        // Skip invalid chords
        if (!chord || !chord.name) {
          continue
        }

        const barStartTick = (chord.bar - 1) * ticksPerBar
        const barEndTick = chord.bar * ticksPerBar

        // Skip bars before current position
        if (barEndTick <= fromTick) {
          continue
        }

        // Parse chord root from name (e.g., "Cmaj7" -> "C", "F#m" -> "F#")
        const rootMatch = chord.name.match(/^([A-G][#b]?)/)
        if (!rootMatch) continue

        const rootName = rootMatch[1]
        const noteMap: Record<string, number> = {
          'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
          'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
          'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        }
        const rootPitch = noteMap[rootName]
        if (rootPitch === undefined) continue

        // Bass note at octave 2 (MIDI 36-47)
        const bassPitch = 36 + rootPitch

        const startSeconds = ticksToSeconds(barStartTick)
        const durationSeconds = ticksToSeconds(ticksPerBar)

        // Adjust for bars that started before fromTick
        const adjustedStartSeconds = Math.max(0, startSeconds - offsetSeconds)
        const adjustedDuration = barStartTick < fromTick
          ? durationSeconds - (offsetSeconds - startSeconds)
          : durationSeconds

        if (adjustedDuration > 0) {
          const playTime = audioContext.currentTime + adjustedStartSeconds
          bass.start({
            note: bassPitch,
            velocity: 70,
            time: playTime,
            duration: Math.min(adjustedDuration, ticksToSeconds(ticksPerBar * 0.9)) // Slightly shorter for clarity
          })
        }
      }
    }

    duration.value = maxEndTick
    isPlaying.value = true
    isPaused.value = false
    currentTick.value = fromTick

    // Auto-stop after playback ends
    const remainingSeconds = ticksToSeconds(maxEndTick - fromTick)
    stopTimeout = setTimeout(() => {
      stop()
    }, remainingSeconds * 1000 + 200)

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

  // Pause playback
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
    if (bass) {
      bass.stop()
    }
  }

  // Resume playback
  async function resume(notes: PlacedNote[], totalTicks?: number, chords?: ChordAtBar[]) {
    if (!isPaused.value) return
    await play(notes, pausedTick, totalTicks, chords)
  }

  // Toggle play/pause
  async function togglePlay(notes: PlacedNote[], totalTicks?: number, chords?: ChordAtBar[]) {
    if (globalIsLoading.value) return

    if (isPlaying.value) {
      pause()
    } else if (isPaused.value) {
      await resume(notes, totalTicks, chords)
    } else {
      await play(notes, 0, totalTicks, chords)
    }
  }

  // Stop playback
  function stop() {
    isPlaying.value = false
    isPaused.value = false
    currentTick.value = 0
    pausedTick = 0
    scheduledNotes = []
    lastPlaybackContext = null

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
    if (bass) {
      bass.stop()
    }
  }

  // Seek to position
  function seek(tick: number) {
    currentTick.value = tick
    pausedTick = tick
  }

  // Handle visibility change (tab switch)
  function handleVisibilityChange() {
    if (document.hidden) {
      // Tab became hidden - pause if playing
      if (isPlaying.value) {
        pause()
      }
    } else {
      // Tab became visible - resume audio context if needed
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume()
      }
    }
  }

  // Setup visibility change listener
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stop()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  return {
    // State
    isLoading: globalIsLoading,
    isReady: globalIsReady,
    isPlaying,
    isPaused,
    currentTick,
    duration,

    // Methods
    preload,
    playNote,
    stopNote,
    play,
    pause,
    resume,
    togglePlay,
    stop,
    seek,
    ticksToSeconds,
    secondsToTicks,
  }
}
