import { type Ref, type ComputedRef } from 'vue'
import type { PlacedNote } from '@/components/PianoRollEditor/types'

export interface UseContextMenuActionsOptions {
  placedNotes: ComputedRef<PlacedNote[] | undefined>
  selectedNoteIds: Ref<Set<string>>
  contextMenuTick: Ref<number | null>
  clearSelection: () => void
  closeContextMenu: () => void
}

export interface ContextMenuActionCallbacks {
  onDelete: (noteId: string) => void
  onDurationChange: (noteId: string, duration: number) => void
  onSplit: (noteId: string, splitTick: number) => void
  onMerge: (noteIds: string[]) => void
}

export function useContextMenuActions(
  options: UseContextMenuActionsOptions,
  callbacks: ContextMenuActionCallbacks
) {
  const {
    placedNotes,
    selectedNoteIds,
    contextMenuTick,
    clearSelection,
    closeContextMenu,
  } = options

  const {
    onDelete,
    onDurationChange,
    onSplit,
    onMerge,
  } = callbacks

  /**
   * Delete all selected notes.
   */
  function deleteSelectedNotes() {
    for (const noteId of selectedNoteIds.value) {
      onDelete(noteId)
    }
    clearSelection()
    closeContextMenu()
  }

  /**
   * Set duration for all selected notes.
   */
  function setSelectedNotesDuration(duration: number) {
    for (const noteId of selectedNoteIds.value) {
      onDurationChange(noteId, duration)
    }
    closeContextMenu()
  }

  /**
   * Merge selected notes into one.
   * Requires at least 2 notes selected.
   */
  function mergeSelectedNotes() {
    if (selectedNoteIds.value.size >= 2) {
      onMerge(Array.from(selectedNoteIds.value))
      clearSelection()
    }
    closeContextMenu()
  }

  /**
   * Split selected notes at the context menu click position.
   * Only splits notes where the click position is within the note.
   */
  function splitSelectedNotes() {
    if (!contextMenuTick.value || !placedNotes.value) {
      closeContextMenu()
      return
    }

    const tick = contextMenuTick.value
    const minDuration = 120 // Minimum resulting duration

    for (const noteId of selectedNoteIds.value) {
      const note = placedNotes.value.find(n => n.id === noteId)
      if (!note) continue

      // Only split if click is within note and leaves valid durations
      if (
        tick > note.startTick + minDuration &&
        tick < note.startTick + note.duration - minDuration
      ) {
        onSplit(noteId, tick)
      }
    }

    closeContextMenu()
  }

  return {
    deleteSelectedNotes,
    setSelectedNotesDuration,
    mergeSelectedNotes,
    splitSelectedNotes,
  }
}
