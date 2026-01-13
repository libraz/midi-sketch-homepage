import { ref, watch, type Ref, type ComputedRef } from 'vue'
import type { PlacedNote, ChordAtBar } from '@/components/PianoRollEditor/types'
import { PPQ } from '@/components/PianoRollEditor/types'
import { usePianoSound } from './usePianoSound'

export interface UsePlaybackControlOptions {
  placedNotes: ComputedRef<PlacedNote[] | undefined>
  totalBars: ComputedRef<number>
  bpm: ComputedRef<number>
  soundEnabled: ComputedRef<boolean>
  chordsInView?: ComputedRef<ChordAtBar[] | undefined>
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
    chordsInView,
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
   * Play all notes from the beginning with chord bass accompaniment.
   */
  async function play() {
    const notes = placedNotes.value
    if (!notes || notes.length === 0) return
    const chords = chordsInView?.value
    await sound.play(notes, 0, getTotalTicks(), chords)
  }

  /**
   * Toggle between play and pause.
   */
  async function togglePlay() {
    const notes = placedNotes.value
    if (!notes || notes.length === 0) return
    const chords = chordsInView?.value
    await sound.togglePlay(notes, getTotalTicks(), chords)
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
   * Seek to a specific tick position.
   */
  function seek(tick: number) {
    sound.seek(tick)
    playheadTick.value = tick
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

  // Track if scroll follow is suspended (after manual seek/drag)
  let scrollFollowSuspended = false

  // Watch playback position and update playhead (CSS-based, no canvas redraw)
  watch(sound.currentTick, (tick) => {
    if (sound.isPlaying.value || sound.isPaused.value) {
      playheadTick.value = tick

      // Auto-scroll to follow playhead during playback (DAW-style smooth follow)
      if (sound.isPlaying.value && editorBodyRef.value) {
        const playheadX = tickToX(tick)
        const viewportWidth = editorBodyRef.value.clientWidth
        const currentScroll = editorBodyRef.value.scrollLeft

        // Target position: playhead at 25% from left
        const targetPlayheadPosition = currentScroll + viewportWidth * 0.25

        // Resume follow when playhead reaches the 25% position
        if (scrollFollowSuspended && playheadX >= targetPlayheadPosition) {
          scrollFollowSuspended = false
        }

        // Keep playhead at ~25% from left edge (when follow is active)
        if (!scrollFollowSuspended) {
          const targetScrollLeft = Math.max(0, playheadX - viewportWidth * 0.25)
          editorBodyRef.value.scrollLeft = targetScrollLeft
        }
      }

      // Only call onRedraw for CSS playhead update (no canvas redraw needed)
      onRedraw()
    }
  })

  /**
   * Suspend scroll follow (called after manual seek/drag)
   */
  function suspendScrollFollow() {
    scrollFollowSuspended = true
  }

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
    seek,
    suspendScrollFollow,
    playNotePreview,
    preload,
  }
}
