import { ref, watch, type Ref, type ComputedRef } from 'vue'
import type { PlacedNote } from '../types'
import { PPQ } from '../types'
import { usePianoSound } from './usePianoSound'

export interface UsePlaybackControlOptions {
  placedNotes: ComputedRef<PlacedNote[] | undefined>
  totalBars: ComputedRef<number>
  bpm: ComputedRef<number>
  soundEnabled: ComputedRef<boolean>
  tickToX: (tick: number) => number
  editorBodyRef: Ref<HTMLElement | null>
  onRedraw: () => void
}

export function usePlaybackControl(options: UsePlaybackControlOptions) {
  const {
    placedNotes,
    totalBars,
    bpm,
    soundEnabled,
    tickToX,
    editorBodyRef,
    onRedraw,
  } = options

  // Sound composable
  const sound = usePianoSound({ bpm })

  // Playhead position for drawing
  const playheadTick = ref<number | null>(null)

  // Total ticks based on total bars
  const getTotalTicks = () => totalBars.value * 4 * PPQ

  /**
   * Play all notes from the beginning.
   */
  async function play() {
    const notes = placedNotes.value
    if (!notes || notes.length === 0) return
    await sound.play(notes, 0, getTotalTicks())
  }

  /**
   * Toggle between play and pause.
   */
  async function togglePlay() {
    const notes = placedNotes.value
    if (!notes || notes.length === 0) return
    await sound.togglePlay(notes, getTotalTicks())
  }

  /**
   * Stop playback and clear playhead.
   */
  function stop() {
    sound.stop()
    playheadTick.value = null
    onRedraw()
  }

  /**
   * Rewind to beginning and scroll editor.
   */
  function rewind() {
    sound.stop()
    playheadTick.value = 0
    // Scroll to start
    if (editorBodyRef.value) {
      editorBodyRef.value.scrollLeft = 0
    }
    onRedraw()
  }

  /**
   * Play a single note preview.
   */
  async function playNotePreview(pitch: number) {
    if (!soundEnabled.value) return
    await sound.playNote(pitch)
  }

  /**
   * Preload sound font for instant playback.
   */
  async function preload() {
    if (soundEnabled.value) {
      await sound.preload()
    }
  }

  // Watch playback position and update playhead
  watch(sound.currentTick, (tick) => {
    if (sound.isPlaying.value || sound.isPaused.value) {
      playheadTick.value = tick

      // Auto-scroll to follow playhead during playback (DAW-style smooth follow)
      if (sound.isPlaying.value && editorBodyRef.value) {
        const playheadX = tickToX(tick)
        const viewportWidth = editorBodyRef.value.clientWidth
        // Keep playhead at ~25% from left edge
        const targetScrollLeft = Math.max(0, playheadX - viewportWidth * 0.25)
        editorBodyRef.value.scrollLeft = targetScrollLeft
      }

      onRedraw()
    }
  })

  return {
    // State
    isPlaying: sound.isPlaying,
    isPaused: sound.isPaused,
    isLoading: sound.isLoading,
    playheadTick,

    // Methods
    play,
    togglePlay,
    stop,
    rewind,
    playNotePreview,
    preload,
  }
}
