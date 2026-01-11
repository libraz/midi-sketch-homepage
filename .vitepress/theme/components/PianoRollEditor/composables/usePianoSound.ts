import { ref, onUnmounted, type Ref } from 'vue'
import { Soundfont } from 'smplr'
import type { PlacedNote } from '../types'
import { PPQ } from '../types'

// ============================================================================
// Piano Sound Composable - Sound playback for Piano Roll Editor
// ============================================================================

// Shared audio context and piano instance
let audioContext: AudioContext | null = null
let piano: any = null
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

  // Initialize audio
  async function init() {
    if (isInitialized && piano) {
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
        const loadedPiano = await new Soundfont(audioContext, {
          instrument: 'acoustic_grand_piano'
        }).load
        piano = loadedPiano
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

  // Play all placed notes from a specific tick
  async function play(notes: PlacedNote[], fromTick: number = 0, totalTicks?: number) {
    if (!globalIsReady.value) {
      await init()
    }

    if (!audioContext || !piano || notes.length === 0) return

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

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

    // Schedule all notes
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
  }

  // Resume playback
  async function resume(notes: PlacedNote[], totalTicks?: number) {
    if (!isPaused.value) return
    await play(notes, pausedTick, totalTicks)
  }

  // Toggle play/pause
  async function togglePlay(notes: PlacedNote[], totalTicks?: number) {
    if (globalIsLoading.value) return

    if (isPlaying.value) {
      pause()
    } else if (isPaused.value) {
      await resume(notes, totalTicks)
    } else {
      await play(notes, 0, totalTicks)
    }
  }

  // Stop playback
  function stop() {
    isPlaying.value = false
    isPaused.value = false
    currentTick.value = 0
    pausedTick = 0
    scheduledNotes = []

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
  }

  // Seek to position
  function seek(tick: number) {
    currentTick.value = tick
    pausedTick = tick
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stop()
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
