import { ref, type Ref, type ComputedRef } from 'vue'
import type { PlacedNote } from '../types'

export interface UseClipboardOptions {
  placedNotes: ComputedRef<PlacedNote[] | undefined>
  selectedNoteIds: Ref<Set<string>>
  snapToGrid: (tick: number) => number
}

export interface ClipboardNote {
  pitch: number
  startTick: number
  duration: number
}

export function useClipboard(options: UseClipboardOptions) {
  const { placedNotes, selectedNoteIds, snapToGrid } = options

  // Clipboard storage
  const clipboardNotes = ref<ClipboardNote[]>([])
  // Track last click position for paste target
  const lastClickTick = ref(0)

  /**
   * Copy selected notes to clipboard.
   * Notes are stored with relative positions (first note at tick 0).
   */
  function copy(): boolean {
    const notes = placedNotes.value
    if (!notes || selectedNoteIds.value.size === 0) return false

    const selectedNotes = notes.filter(n => selectedNoteIds.value.has(n.id))
    if (selectedNotes.length === 0) return false

    // Find minimum startTick as reference point
    const minTick = Math.min(...selectedNotes.map(n => n.startTick))

    // Store notes with relative positions
    clipboardNotes.value = selectedNotes.map(n => ({
      pitch: n.pitch,
      startTick: n.startTick - minTick,
      duration: n.duration,
    }))

    return true
  }

  /**
   * Get notes to paste at the last click position.
   * Returns notes with absolute positions, or empty array if clipboard is empty.
   */
  function paste(): ClipboardNote[] {
    if (clipboardNotes.value.length === 0) return []

    const pasteBaseTick = snapToGrid(lastClickTick.value)
    return clipboardNotes.value.map(note => ({
      pitch: note.pitch,
      startTick: pasteBaseTick + note.startTick,
      duration: note.duration,
    }))
  }

  /**
   * Update the last click position for paste target.
   */
  function setLastClickTick(tick: number) {
    lastClickTick.value = tick
  }

  /**
   * Check if clipboard has content.
   */
  function hasContent(): boolean {
    return clipboardNotes.value.length > 0
  }

  /**
   * Clear clipboard.
   */
  function clear() {
    clipboardNotes.value = []
  }

  return {
    clipboardNotes,
    lastClickTick,
    copy,
    paste,
    setLastClickTick,
    hasContent,
    clear,
  }
}
