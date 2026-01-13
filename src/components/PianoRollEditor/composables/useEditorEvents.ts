import { type Ref, type ComputedRef } from 'vue'
import type { PlacedNote } from '@/components/PianoRollEditor/types'
import { MIN_NOTE, MAX_NOTE } from '@/components/PianoRollEditor/types'
import type { useNoteInteraction } from './useNoteInteraction'
import type { useViewport } from './useViewport'
import type { useClipboard } from './useClipboard'

type InteractionReturn = ReturnType<typeof useNoteInteraction>
type ViewportReturn = ReturnType<typeof useViewport>
type ClipboardReturn = ReturnType<typeof useClipboard>

export interface UseEditorEventsOptions {
  canvasRef: Ref<HTMLCanvasElement | null>
  editorBodyRef: Ref<HTMLElement | null>
  placedNotes: ComputedRef<PlacedNote[] | undefined>
  gridSnap: ComputedRef<number>
  soundEnabled: ComputedRef<boolean>
  viewport: ViewportReturn
  interaction: InteractionReturn
  clipboard: ClipboardReturn
  onRedraw: () => void
  playNotePreview: (pitch: number) => void
  togglePlay: () => void
}

export interface EditorEventEmits {
  onNoteHover: (pitch: number | null) => void
  onNoteClick: (pitch: number, tick: number) => void
  onNoteDelete: (noteId: string) => void
  onNoteMove: (noteId: string, pitch: number, tick: number) => void
  onNoteDurationChange: (noteId: string, duration: number) => void
  onNoteSplit: (noteId: string, splitTick: number) => void
  onNoteAdd: (note: { pitch: number; startTick: number; duration: number }) => void
}

export function useEditorEvents(
  options: UseEditorEventsOptions,
  emits: EditorEventEmits
) {
  const {
    canvasRef,
    editorBodyRef,
    placedNotes,
    gridSnap,
    soundEnabled,
    viewport,
    interaction,
    clipboard,
    onRedraw,
    playNotePreview,
    togglePlay,
  } = options

  // ============================================================================
  // Mouse Events
  // ============================================================================

  function handleMouseMove(e: MouseEvent) {
    if (interaction.showContextMenu.value) return

    const canvas = canvasRef.value
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const pitch = viewport.yToNote(y)

    // Update hovered pitch (watch will trigger redraw if changed)
    if (pitch >= MIN_NOTE && pitch <= MAX_NOTE) {
      interaction.hoveredNote.value = pitch
      emits.onNoteHover(pitch)
    } else {
      interaction.hoveredNote.value = null
      emits.onNoteHover(null)
    }

    // Update hovered note (watch will trigger redraw if changed)
    const noteAtPos = interaction.getNoteAtPosition(x, y)
    interaction.hoveredNoteId.value = noteAtPos?.note.id ?? null

    // Handle selection box - needs immediate redraw
    if (interaction.isSelecting.value) {
      interaction.updateSelection(x, y)
      onRedraw()
      return
    }

    // Handle dragging - needs immediate redraw
    if (interaction.isDragging.value && interaction.dragNoteId.value) {
      interaction.updateDrag(x, y)
      onRedraw()
    } else {
      // Just update cursor style, no redraw needed
      // Watch handles hover state changes
      interaction.updateCursor(canvas, x, y)
    }
  }

  function handleMouseLeave() {
    interaction.hoveredNote.value = null
    interaction.hoveredNoteId.value = null
    emits.onNoteHover(null)
    // Redraw is handled by watch on hoveredNote/hoveredNoteId
  }

  function handleMouseDown(e: MouseEvent) {
    if (e.button === 2) return

    interaction.didDrag.value = false

    const canvas = canvasRef.value
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const result = interaction.getNoteAtPosition(x, y)
    if (result) {
      const noteId = result.note.id
      const isAlreadySelected = interaction.selectedNoteIds.value.has(noteId)

      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        interaction.toggleNoteSelection(noteId)
      } else if (!isAlreadySelected) {
        interaction.selectOnlyNote(noteId)
      }

      interaction.startDrag(result.note, result.isResizeHandle, x, y, canvas)
      onRedraw()
      return
    }

    interaction.startSelection(x, y, e.shiftKey || e.ctrlKey || e.metaKey)
    onRedraw()
  }

  function handleMouseUp(e: MouseEvent) {
    const canvas = canvasRef.value

    if (interaction.isSelecting.value) {
      interaction.endSelection()
      onRedraw()
      return
    }

    if (!interaction.isDragging.value) return

    const result = interaction.endDrag(canvas)
    if (result) {
      if (result.type === 'move' && result.pitch !== undefined && result.tick !== undefined) {
        emits.onNoteMove(result.noteId!, result.pitch, result.tick)
        // Play sound after move completes
        if (soundEnabled.value) {
          playNotePreview(result.pitch)
        }
      } else if (result.type === 'multi-move' && result.moves) {
        // Move all selected notes
        for (const move of result.moves) {
          emits.onNoteMove(move.noteId, move.pitch, move.tick)
        }
        // Play the first moved note's pitch
        if (soundEnabled.value && result.moves.length > 0) {
          playNotePreview(result.moves[0].pitch)
        }
      } else if (result.type === 'resize' && result.duration !== undefined) {
        emits.onNoteDurationChange(result.noteId!, result.duration)
      }
    }

    onRedraw()
  }

  function handleClick(e: MouseEvent) {
    if (interaction.showContextMenu.value) {
      interaction.closeContextMenu()
      return
    }

    if (interaction.isDragging.value || interaction.didDrag.value) {
      interaction.didDrag.value = false
      return
    }

    const canvas = canvasRef.value
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const pitch = viewport.yToNote(y)
    const tick = viewport.snapToGrid(viewport.xToTick(x))

    const noteAtPos = interaction.getNoteAtPosition(x, y)
    if (noteAtPos && e.altKey) {
      const note = noteAtPos.note
      const exactTick = Math.round(viewport.xToTick(x) / gridSnap.value) * gridSnap.value
      if (exactTick > note.startTick && exactTick < note.startTick + note.duration) {
        emits.onNoteSplit(note.id, exactTick)
      }
      return
    }

    if (noteAtPos) {
      // Play note preview when clicking on existing note
      if (soundEnabled.value) {
        playNotePreview(noteAtPos.note.pitch)
      }
      return
    }

    // Track last click position for paste
    clipboard.setLastClickTick(tick)

    if (pitch >= viewport.vocalRange.value.low && pitch <= viewport.vocalRange.value.high && tick >= 0) {
      // Play note preview when adding new note
      if (soundEnabled.value) {
        playNotePreview(pitch)
      }
      emits.onNoteClick(pitch, tick)
    }
  }

  function handleDoubleClick(e: MouseEvent) {
    const canvas = canvasRef.value
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const result = interaction.getNoteAtPosition(x, y)
    if (result) {
      emits.onNoteDelete(result.note.id)
      interaction.selectedNoteIds.value.delete(result.note.id)
      onRedraw()
    }
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault()

    const canvas = canvasRef.value
    if (!canvas || !placedNotes.value) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const clickTick = viewport.snapToGrid(viewport.xToTick(x))

    const result = interaction.getNoteAtPosition(x, y)
    if (result) {
      if (!interaction.selectedNoteIds.value.has(result.note.id)) {
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
          interaction.clearSelection()
        }
        interaction.selectedNoteIds.value.add(result.note.id)
      }
      interaction.openContextMenu(e.clientX, e.clientY, clickTick, result.note.id)
      onRedraw()
    } else if (interaction.selectedNoteIds.value.size > 0) {
      interaction.openContextMenu(e.clientX, e.clientY, clickTick, null)
    }
  }

  // ============================================================================
  // Keyboard Events
  // ============================================================================

  function handleKeyDown(e: KeyboardEvent) {
    // Delete selected notes
    if (interaction.selectedNoteIds.value.size > 0 && (e.key === 'Delete' || e.key === 'Backspace')) {
      for (const noteId of interaction.selectedNoteIds.value) {
        emits.onNoteDelete(noteId)
      }
      interaction.clearSelection()
      onRedraw()
    }

    // Select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && placedNotes.value) {
      e.preventDefault()
      interaction.selectAllNotes()
      onRedraw()
    }

    // Copy (Ctrl+C)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && placedNotes.value && interaction.selectedNoteIds.value.size > 0) {
      e.preventDefault()
      clipboard.copy()
    }

    // Paste (Ctrl+V)
    if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard.hasContent()) {
      e.preventDefault()
      const notesToPaste = clipboard.paste()
      for (const note of notesToPaste) {
        emits.onNoteAdd(note)
      }
    }

    // Space bar for play/pause
    if (e.key === ' ' && soundEnabled.value) {
      e.preventDefault()
      togglePlay()
    }
  }

  // ============================================================================
  // Wheel Events
  // ============================================================================

  function handleWheel(e: WheelEvent) {
    viewport.handleWheel(e, editorBodyRef.value)
  }

  // ============================================================================
  // Global Events
  // ============================================================================

  function handleGlobalClick(e: MouseEvent) {
    if (interaction.showContextMenu.value) {
      const target = e.target as HTMLElement
      if (!target.closest('.context-menu')) {
        interaction.closeContextMenu()
      }
    }
  }

  function handleGlobalMouseUp(e: MouseEvent) {
    if (interaction.isDragging.value) {
      handleMouseUp(e)
    }
  }

  return {
    // Canvas event handlers
    handleMouseMove,
    handleMouseLeave,
    handleMouseDown,
    handleMouseUp,
    handleClick,
    handleDoubleClick,
    handleContextMenu,
    handleWheel,

    // Global event handlers (to be bound to window)
    handleKeyDown,
    handleGlobalClick,
    handleGlobalMouseUp,
  }
}
