import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { PlacedNote, PianoRollSafetyInfo } from '../types'
import { RESIZE_HANDLE_WIDTH, MIN_NOTE, MAX_NOTE, NOTE_HEIGHT_PX } from '../types'

// ============================================================================
// Note Interaction Composable - Handles drag, selection, and editing
// ============================================================================

export interface UseNoteInteractionOptions {
  placedNotes: Ref<PlacedNote[] | undefined>
  allowHarmony: Ref<boolean>
  vocalRange: ComputedRef<{ low: number; high: number }>
  gridSnap: Ref<number>
  pixelsPerTick: ComputedRef<number>
  noteToY: (pitch: number) => number
  yToNote: (y: number) => number
  tickToX: (tick: number) => number
  xToTick: (x: number) => number
  snapToGrid: (tick: number) => number
}

export interface DragState {
  isDragging: Ref<boolean>
  dragType: Ref<'move' | 'resize' | null>
  dragNoteId: Ref<string | null>
  dragStartX: Ref<number>
  dragStartY: Ref<number>
  dragStartPitch: Ref<number>
  dragStartTick: Ref<number>
  dragStartDuration: Ref<number>
  dragPreviewPitch: Ref<number | null>
  dragPreviewTick: Ref<number | null>
  dragPreviewDuration: Ref<number | null>
  didDrag: Ref<boolean>
}

export interface SelectionState {
  selectedNoteIds: Ref<Set<string>>
  isSelecting: Ref<boolean>
  selectionStart: Ref<{ x: number; y: number }>
  selectionEnd: Ref<{ x: number; y: number }>
}

export interface HoverState {
  hoveredNote: Ref<number | null>
  hoveredNoteId: Ref<string | null>
}

export interface ContextMenuState {
  showContextMenu: Ref<boolean>
  contextMenuPosition: Ref<{ x: number; y: number }>
  contextMenuTick: Ref<number | null>
  contextMenuNoteId: Ref<string | null>
}

export function useNoteInteraction(options: UseNoteInteractionOptions) {
  const {
    placedNotes,
    allowHarmony,
    vocalRange,
    gridSnap,
    pixelsPerTick,
    noteToY,
    yToNote,
    tickToX,
    xToTick,
    snapToGrid,
  } = options

  const noteHeight = NOTE_HEIGHT_PX

  // Drag state
  const isDragging = ref(false)
  const dragType = ref<'move' | 'resize' | null>(null)
  const dragNoteId = ref<string | null>(null)
  const dragStartX = ref(0)
  const dragStartY = ref(0)
  const dragStartPitch = ref(0)
  const dragStartTick = ref(0)
  const dragStartDuration = ref(0)
  const dragPreviewPitch = ref<number | null>(null)
  const dragPreviewTick = ref<number | null>(null)
  const dragPreviewDuration = ref<number | null>(null)
  const didDrag = ref(false)

  // Multi-note drag state
  const dragMultipleNotes = ref<{ id: string; pitch: number; startTick: number; duration: number }[]>([])
  const dragPitchDelta = ref(0)
  const dragTickDelta = ref(0)

  // Selection state
  const selectedNoteIds = ref<Set<string>>(new Set())
  const isSelecting = ref(false)
  const selectionStart = ref({ x: 0, y: 0 })
  const selectionEnd = ref({ x: 0, y: 0 })

  // Hover state
  const hoveredNote = ref<number | null>(null)
  const hoveredNoteId = ref<string | null>(null)

  // Context menu state
  const showContextMenu = ref(false)
  const contextMenuPosition = ref({ x: 0, y: 0 })
  const contextMenuTick = ref<number | null>(null)
  const contextMenuNoteId = ref<string | null>(null)

  // Computed
  const canSplitSelected = computed(() => {
    if (!contextMenuTick.value || selectedNoteIds.value.size === 0 || !placedNotes.value) return false

    const tick = contextMenuTick.value
    return placedNotes.value.some(n => {
      if (!selectedNoteIds.value.has(n.id)) return false
      const minDuration = 120
      return tick > n.startTick + minDuration && tick < n.startTick + n.duration - minDuration
    })
  })

  const canMergeSelected = computed(() => {
    if (selectedNoteIds.value.size < 2 || !placedNotes.value) return false

    const selectedNotes = placedNotes.value.filter(n => selectedNoteIds.value.has(n.id))
    if (selectedNotes.length < 2) return false

    const firstPitch = selectedNotes[0].pitch
    if (!selectedNotes.every(n => n.pitch === firstPitch)) return false

    const sorted = [...selectedNotes].sort((a, b) => a.startTick - b.startTick)
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEnd = sorted[i].startTick + sorted[i].duration
      const nextStart = sorted[i + 1].startTick
      if (nextStart > currentEnd + 120) return false
    }

    return true
  })

  // Get note at position
  function getNoteAtPosition(x: number, y: number): { note: PlacedNote; isResizeHandle: boolean } | null {
    if (!placedNotes.value) return null

    for (const note of placedNotes.value) {
      if (note.pitch < MIN_NOTE || note.pitch > MAX_NOTE) continue

      const noteY = noteToY(note.pitch)
      const noteX = tickToX(note.startTick)
      const noteWidth = Math.max(20, note.duration * pixelsPerTick.value)

      if (y >= noteY && y <= noteY + noteHeight && x >= noteX && x <= noteX + noteWidth) {
        const isResizeHandle = x >= noteX + noteWidth - RESIZE_HANDLE_WIDTH
        return { note, isResizeHandle }
      }
    }
    return null
  }

  // Check if a note position would overlap with existing notes (for monophonic mode)
  function wouldOverlap(noteId: string, startTick: number, duration: number): boolean {
    if (allowHarmony.value || !placedNotes.value) return false

    return placedNotes.value.some(n =>
      n.id !== noteId &&
      n.startTick < startTick + duration &&
      n.startTick + n.duration > startTick
    )
  }

  // Find the nearest valid position that doesn't overlap
  function findNearestValidTick(noteId: string, targetTick: number, duration: number, originalTick: number): number {
    if (allowHarmony.value || !placedNotes.value) return targetTick

    if (!wouldOverlap(noteId, targetTick, duration)) return targetTick

    const otherNotes = placedNotes.value.filter(n => n.id !== noteId)
    if (otherNotes.length === 0) return targetTick

    const sortedNotes = [...otherNotes].sort((a, b) => a.startTick - b.startTick)

    // Check gap before first note
    if (targetTick < sortedNotes[0].startTick) {
      const gapEnd = sortedNotes[0].startTick
      if (duration <= gapEnd) {
        return Math.min(targetTick, gapEnd - duration)
      }
    }

    // Check gaps between notes
    for (let i = 0; i < sortedNotes.length - 1; i++) {
      const gapStart = sortedNotes[i].startTick + sortedNotes[i].duration
      const gapEnd = sortedNotes[i + 1].startTick
      const gapSize = gapEnd - gapStart

      if (gapSize >= duration && targetTick >= gapStart && targetTick < gapEnd) {
        return Math.max(gapStart, Math.min(targetTick, gapEnd - duration))
      }
    }

    // Check gap after last note
    const lastNote = sortedNotes[sortedNotes.length - 1]
    const afterLastStart = lastNote.startTick + lastNote.duration
    if (targetTick >= afterLastStart) {
      return Math.max(afterLastStart, targetTick)
    }

    return originalTick
  }

  // Update cursor style
  function updateCursor(canvas: HTMLCanvasElement | null, x: number, y: number) {
    if (!canvas) return

    const result = getNoteAtPosition(x, y)
    if (result) {
      canvas.style.cursor = result.isResizeHandle ? 'ew-resize' : 'grab'
    } else {
      canvas.style.cursor = 'crosshair'
    }
  }

  // Start drag operation
  function startDrag(note: PlacedNote, isResizeHandle: boolean, x: number, y: number, canvas: HTMLCanvasElement | null) {
    dragNoteId.value = note.id
    dragStartX.value = x
    dragStartY.value = y
    dragStartPitch.value = note.pitch
    dragStartTick.value = note.startTick
    dragStartDuration.value = note.duration
    dragPreviewDuration.value = note.duration

    if (isResizeHandle) {
      isDragging.value = true
      dragType.value = 'resize'
      dragMultipleNotes.value = []
      if (canvas) canvas.style.cursor = 'ew-resize'
    } else {
      isDragging.value = true
      dragType.value = 'move'
      dragPreviewPitch.value = note.pitch
      dragPreviewTick.value = note.startTick
      dragPitchDelta.value = 0
      dragTickDelta.value = 0

      // Save all selected notes for multi-drag
      if (selectedNoteIds.value.size > 1 && selectedNoteIds.value.has(note.id) && placedNotes.value) {
        dragMultipleNotes.value = placedNotes.value
          .filter(n => selectedNoteIds.value.has(n.id))
          .map(n => ({ id: n.id, pitch: n.pitch, startTick: n.startTick, duration: n.duration }))
      } else {
        dragMultipleNotes.value = []
      }

      if (canvas) canvas.style.cursor = 'grabbing'
    }
  }

  // Update drag preview
  function updateDrag(x: number, y: number) {
    if (!isDragging.value || !dragNoteId.value) return

    didDrag.value = true

    if (dragType.value === 'move') {
      const newPitch = Math.max(vocalRange.value.low, Math.min(vocalRange.value.high, yToNote(y)))
      let newTick = snapToGrid(xToTick(x) - (dragStartX.value - tickToX(dragStartTick.value)))
      newTick = Math.max(0, newTick)

      // For single note drag, check overlap
      if (dragMultipleNotes.value.length === 0) {
        const duration = dragPreviewDuration.value ?? dragStartDuration.value
        newTick = findNearestValidTick(dragNoteId.value, newTick, duration, dragStartTick.value)
      }

      dragPreviewPitch.value = newPitch
      dragPreviewTick.value = newTick

      // Calculate delta for multi-note drag
      dragPitchDelta.value = newPitch - dragStartPitch.value
      dragTickDelta.value = newTick - dragStartTick.value
    } else if (dragType.value === 'resize') {
      const tick = xToTick(x)
      let newDuration = snapToGrid(Math.max(gridSnap.value, tick - dragStartTick.value))

      // In monophonic mode, limit duration to avoid overlap with next note
      if (!allowHarmony.value && placedNotes.value) {
        const nextNote = placedNotes.value
          .filter(n => n.id !== dragNoteId.value && n.startTick > dragStartTick.value)
          .sort((a, b) => a.startTick - b.startTick)[0]
        if (nextNote) {
          const maxDuration = nextNote.startTick - dragStartTick.value
          newDuration = Math.min(newDuration, maxDuration)
        }
      }

      dragPreviewDuration.value = newDuration
    }
  }

  // End drag operation
  function endDrag(canvas: HTMLCanvasElement | null): {
    type: 'move' | 'resize' | 'multi-move' | null
    noteId?: string | null
    pitch?: number
    tick?: number
    duration?: number
    moves?: { noteId: string; pitch: number; tick: number }[]
  } | null {
    if (!isDragging.value) return null

    let result: {
      type: 'move' | 'resize' | 'multi-move' | null
      noteId?: string | null
      pitch?: number
      tick?: number
      duration?: number
      moves?: { noteId: string; pitch: number; tick: number }[]
    } | null = null

    if (dragNoteId.value) {
      if (dragType.value === 'move' && dragPreviewPitch.value !== null && dragPreviewTick.value !== null) {
        if (dragPreviewPitch.value !== dragStartPitch.value || dragPreviewTick.value !== dragStartTick.value) {
          // Multi-note move
          if (dragMultipleNotes.value.length > 1) {
            result = {
              type: 'multi-move',
              moves: dragMultipleNotes.value.map(n => ({
                noteId: n.id,
                pitch: Math.max(vocalRange.value.low, Math.min(vocalRange.value.high, n.pitch + dragPitchDelta.value)),
                tick: Math.max(0, n.startTick + dragTickDelta.value),
              })),
            }
          } else {
            // Single note move
            result = {
              type: 'move',
              noteId: dragNoteId.value,
              pitch: dragPreviewPitch.value,
              tick: dragPreviewTick.value,
            }
          }
        }
      } else if (dragType.value === 'resize' && dragPreviewDuration.value !== null) {
        if (dragPreviewDuration.value !== dragStartDuration.value) {
          result = {
            type: 'resize',
            noteId: dragNoteId.value,
            duration: dragPreviewDuration.value,
          }
        }
      }
    }

    // Reset drag state
    isDragging.value = false
    dragType.value = null
    dragNoteId.value = null
    dragPreviewPitch.value = null
    dragPreviewTick.value = null
    dragPreviewDuration.value = null
    dragMultipleNotes.value = []
    dragPitchDelta.value = 0
    dragTickDelta.value = 0

    if (canvas) {
      canvas.style.cursor = 'default'
    }

    return result
  }

  // Selection methods
  function startSelection(x: number, y: number, additive: boolean) {
    if (!additive) {
      selectedNoteIds.value.clear()
    }
    isSelecting.value = true
    selectionStart.value = { x, y }
    selectionEnd.value = { x, y }
  }

  function updateSelection(x: number, y: number) {
    if (!isSelecting.value) return
    selectionEnd.value = { x, y }
    didDrag.value = true
  }

  function endSelection(): void {
    if (!isSelecting.value) return

    const sx = Math.min(selectionStart.value.x, selectionEnd.value.x)
    const sy = Math.min(selectionStart.value.y, selectionEnd.value.y)
    const sw = Math.abs(selectionEnd.value.x - selectionStart.value.x)
    const sh = Math.abs(selectionEnd.value.y - selectionStart.value.y)

    // Select notes within the box
    if (placedNotes.value && sw > 5 && sh > 5) {
      for (const note of placedNotes.value) {
        const noteY = noteToY(note.pitch)
        const noteX = tickToX(note.startTick)
        const noteW = Math.max(20, note.duration * pixelsPerTick.value)

        if (noteX + noteW > sx && noteX < sx + sw &&
            noteY + noteHeight > sy && noteY < sy + sh) {
          selectedNoteIds.value.add(note.id)
        }
      }
    }

    isSelecting.value = false
  }

  function toggleNoteSelection(noteId: string) {
    if (selectedNoteIds.value.has(noteId)) {
      selectedNoteIds.value.delete(noteId)
    } else {
      selectedNoteIds.value.add(noteId)
    }
  }

  function selectOnlyNote(noteId: string) {
    selectedNoteIds.value.clear()
    selectedNoteIds.value.add(noteId)
  }

  function selectAllNotes() {
    if (!placedNotes.value) return
    for (const note of placedNotes.value) {
      selectedNoteIds.value.add(note.id)
    }
  }

  function clearSelection() {
    selectedNoteIds.value.clear()
  }

  // Context menu
  function openContextMenu(x: number, y: number, tick: number, noteId: string | null) {
    contextMenuPosition.value = { x, y }
    contextMenuTick.value = tick
    contextMenuNoteId.value = noteId
    showContextMenu.value = true
  }

  function closeContextMenu() {
    showContextMenu.value = false
  }

  return {
    // Drag state
    isDragging,
    dragType,
    dragNoteId,
    dragStartX,
    dragStartY,
    dragStartPitch,
    dragStartTick,
    dragStartDuration,
    dragPreviewPitch,
    dragPreviewTick,
    dragPreviewDuration,
    didDrag,

    // Multi-note drag state
    dragMultipleNotes,
    dragPitchDelta,
    dragTickDelta,

    // Selection state
    selectedNoteIds,
    isSelecting,
    selectionStart,
    selectionEnd,

    // Hover state
    hoveredNote,
    hoveredNoteId,

    // Context menu state
    showContextMenu,
    contextMenuPosition,
    contextMenuTick,
    contextMenuNoteId,

    // Computed
    canSplitSelected,
    canMergeSelected,

    // Methods
    getNoteAtPosition,
    wouldOverlap,
    findNearestValidTick,
    updateCursor,
    startDrag,
    updateDrag,
    endDrag,
    startSelection,
    updateSelection,
    endSelection,
    toggleNoteSelection,
    selectOnlyNote,
    selectAllNotes,
    clearSelection,
    openContextMenu,
    closeContextMenu,
  }
}
