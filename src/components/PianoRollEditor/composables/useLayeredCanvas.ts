import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import {
  type PlacedNote,
  type PianoRollSafetyInfo,
  type ChordInfo,
  type ChordAtBar,
  NoteSafety,
  type NoteSafetyLevel,
  NOTE_NAMES,
  MIN_NOTE,
  MAX_NOTE,
  PPQ,
  NOTE_HEIGHT_PX,
  isBlackKey,
  getReasonText,
} from '@/components/PianoRollEditor/types'
import type { PianoRollPalette } from '@/components/PianoRollEditor/palette'

// ============================================================================
// Layered Canvas Composable - Separates drawing into layers for performance
// ============================================================================
// Layer 1: Grid (static, only redraws on zoom change)
// Layer 2: Notes (redraws on note changes)
// Layer 3: Overlay (playhead, selection, drag preview - redraws frequently)

export interface CanvasRefs {
  gridCanvas: Ref<HTMLCanvasElement | null>
  noteCanvas: Ref<HTMLCanvasElement | null>
  overlayCanvas: Ref<HTMLCanvasElement | null>
}

export interface LayeredCanvasContext {
  canvasRefs: CanvasRefs
  editorBody: Ref<HTMLElement | null>
  canvasWidth: Ref<number>
  canvasHeight: Ref<number>
  dpr: Ref<number>
  zoomLevel: Ref<number>
  totalTicks: ComputedRef<number>
  pixelsPerTick: ComputedRef<number>
  gridSnap: Ref<number>
  noteHeight: ComputedRef<number>
  vocalRange: ComputedRef<{ low: number; high: number }>

  // Props
  placedNotes: Ref<PlacedNote[] | undefined>
  safetyInfo: Ref<PianoRollSafetyInfo | null | undefined>
  chordsInView: Ref<ChordAtBar[] | undefined>
  showSafetyAlways: Ref<boolean | undefined>
  getSafetyAtTick: Ref<((tick: number) => PianoRollSafetyInfo | null) | undefined>
  currentChord: ComputedRef<ChordInfo>

  // Interaction state
  hoveredNote: Ref<number | null>
  hoveredNoteId: Ref<string | null>
  selectedNoteIds: Ref<Set<string>>
  isDragging: Ref<boolean>
  dragType: Ref<'move' | 'resize' | null>
  dragNoteId: Ref<string | null>
  dragStartTick: Ref<number>
  dragStartDuration: Ref<number>
  dragPreviewPitch: Ref<number | null>
  dragPreviewTick: Ref<number | null>
  dragPreviewDuration: Ref<number | null>
  isSelecting: Ref<boolean>
  selectionStart: Ref<{ x: number; y: number }>
  selectionEnd: Ref<{ x: number; y: number }>

  // Multi-note drag state
  dragMultipleNotes: Ref<{ id: string; pitch: number; startTick: number; duration: number }[]>
  dragPitchDelta: Ref<number>
  dragTickDelta: Ref<number>

  // Coordinate functions
  noteToY: (pitch: number) => number
  yToNote: (y: number) => number
  tickToX: (tick: number) => number
  xToTick: (x: number) => number
  isInVocalRange: (pitch: number) => boolean

  // Playback
  playheadTick: Ref<number | null>

  // Theme-aware canvas palette (re-render when it changes)
  palette: Ref<PianoRollPalette> | ComputedRef<PianoRollPalette>
}

// Helper function for rounded rectangles
function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function getNoteSafety(pitch: number, safetyInfo: PianoRollSafetyInfo | null | undefined, currentChord: ChordInfo, isInVocalRange: boolean): NoteSafetyLevel {
  if (safetyInfo?.safety?.[pitch] !== undefined) {
    return safetyInfo.safety[pitch]
  }
  if (!isInVocalRange) return NoteSafety.Dissonant
  const relativeNote = (pitch - currentChord.root + 120) % 12
  if (currentChord.tones.includes(relativeNote)) return NoteSafety.Safe
  if ([2, 5, 9].includes(relativeNote)) return NoteSafety.Warning
  return NoteSafety.Dissonant
}

function getNoteReason(pitch: number, safetyInfo: PianoRollSafetyInfo | null | undefined): number {
  return safetyInfo?.reason?.[pitch] ?? 0
}

export function useLayeredCanvas(ctx: LayeredCanvasContext) {
  // Dirty flags for selective redraw
  const gridDirty = ref(true)
  const notesDirty = ref(true)
  const overlayDirty = ref(true)

  // Cache for grid canvas (only regenerate on zoom/size change)
  let gridCacheValid = false

  // Get visible viewport bounds
  function getVisibleBounds() {
    const body = ctx.editorBody.value
    const width = ctx.canvasWidth.value
    const height = ctx.canvasHeight.value

    const scrollLeft = body?.scrollLeft ?? 0
    const scrollTop = body?.scrollTop ?? 0
    const viewportWidth = body?.clientWidth ?? width
    const viewportHeight = body?.clientHeight ?? height

    const PADDING = 100
    return {
      left: Math.max(0, scrollLeft - PADDING),
      right: Math.min(width, scrollLeft + viewportWidth + PADDING),
      top: Math.max(0, scrollTop - PADDING),
      bottom: Math.min(height, scrollTop + viewportHeight + PADDING),
      startTick: Math.max(0, ctx.xToTick(Math.max(0, scrollLeft - PADDING))),
      endTick: Math.min(ctx.totalTicks.value, ctx.xToTick(Math.min(width, scrollLeft + viewportWidth + PADDING))),
      minPitch: Math.max(MIN_NOTE, ctx.yToNote(Math.min(height, scrollTop + viewportHeight + PADDING))),
      maxPitch: Math.min(MAX_NOTE, ctx.yToNote(Math.max(0, scrollTop - PADDING))),
    }
  }

  // ============================================================================
  // Layer 1: Grid Drawing (full canvas, drawn once)
  // ============================================================================
  function drawGrid() {
    const canvas = ctx.canvasRefs.gridCanvas.value
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const width = ctx.canvasWidth.value
    const height = ctx.canvasHeight.value
    const noteH = ctx.noteHeight.value
    const dpr = ctx.dpr.value
    const totalTicks = ctx.totalTicks.value
    const palette = ctx.palette.value

    context.clearRect(0, 0, width * dpr, height * dpr)
    context.save()
    context.scale(dpr, dpr)

    // Background - full canvas
    context.fillStyle = palette.background
    context.fillRect(0, 0, width, height)

    // Draw ALL note rows (full height)
    for (let pitch = MIN_NOTE; pitch <= MAX_NOTE; pitch++) {
      const y = ctx.noteToY(pitch)
      const black = isBlackKey(pitch)
      const inRange = ctx.isInVocalRange(pitch)

      // Base row color
      context.fillStyle = black ? palette.blackKeyRow : palette.whiteKeyRow
      context.fillRect(0, y, width, noteH)

      // Vocal range indicator
      if (inRange) {
        context.fillStyle = palette.vocalRangeHighlight
        context.fillRect(0, y, width, noteH)
      } else {
        context.fillStyle = palette.outOfRangeOverlay
        context.fillRect(0, y, width, noteH)
      }
    }

    // Draw stripe pattern for out-of-range rows (batched)
    context.strokeStyle = palette.outOfRangeStripe
    context.lineWidth = 1
    context.beginPath()
    for (let pitch = MIN_NOTE; pitch <= MAX_NOTE; pitch++) {
      const inRange = ctx.isInVocalRange(pitch)
      if (inRange) continue

      const y = ctx.noteToY(pitch)
      const stripeSpacing = 20 // Wider spacing for performance
      for (let sx = -noteH; sx < width + noteH; sx += stripeSpacing) {
        context.moveTo(sx, y + noteH)
        context.lineTo(sx + noteH, y)
      }
    }
    context.stroke()

    // Draw horizontal grid lines (batched)
    context.strokeStyle = palette.horizontalGridLine
    context.lineWidth = 0.5
    context.beginPath()
    for (let pitch = MIN_NOTE; pitch <= MAX_NOTE; pitch++) {
      const y = ctx.noteToY(pitch)
      context.moveTo(0, y + noteH)
      context.lineTo(width, y + noteH)
    }
    context.stroke()

    // Draw octave lines (batched)
    context.strokeStyle = palette.octaveLine
    context.lineWidth = 1
    context.beginPath()
    for (let pitch = MIN_NOTE; pitch <= MAX_NOTE; pitch++) {
      if (pitch % 12 === 0) {
        const y = ctx.noteToY(pitch)
        context.moveTo(0, y + noteH)
        context.lineTo(width, y + noteH)
      }
    }
    context.stroke()

    // Draw vertical grid lines - ALL ticks
    // Sub-beat lines
    context.strokeStyle = palette.subBeatLine
    context.lineWidth = 0.5
    context.beginPath()
    for (let tick = 0; tick <= totalTicks; tick += ctx.gridSnap.value) {
      if (tick % PPQ !== 0) {
        const x = ctx.tickToX(tick)
        context.moveTo(x, 0)
        context.lineTo(x, height)
      }
    }
    context.stroke()

    // Beat lines
    context.strokeStyle = palette.beatLine
    context.lineWidth = 0.5
    context.beginPath()
    for (let tick = 0; tick <= totalTicks; tick += PPQ) {
      if (tick % (4 * PPQ) !== 0) {
        const x = ctx.tickToX(tick)
        context.moveTo(x, 0)
        context.lineTo(x, height)
      }
    }
    context.stroke()

    // Bar lines
    context.strokeStyle = palette.barLine
    context.lineWidth = 1
    context.beginPath()
    for (let tick = 0; tick <= totalTicks; tick += 4 * PPQ) {
      const x = ctx.tickToX(tick)
      context.moveTo(x, 0)
      context.lineTo(x, height)
    }
    context.stroke()

    // Bar numbers
    context.fillStyle = palette.barNumber
    context.font = '9px JetBrains Mono, monospace'
    for (let tick = 0; tick <= totalTicks; tick += 4 * PPQ) {
      const x = ctx.tickToX(tick)
      const barNum = Math.floor(tick / (4 * PPQ)) + 1
      context.fillText(String(barNum), x + 3, 12)
    }

    context.restore()
    gridDirty.value = false
  }

  // ============================================================================
  // Layer 2: Notes Drawing (full canvas)
  // ============================================================================
  function drawNotes() {
    const canvas = ctx.canvasRefs.noteCanvas.value
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const width = ctx.canvasWidth.value
    const height = ctx.canvasHeight.value
    const noteH = ctx.noteHeight.value
    const dpr = ctx.dpr.value
    const placedNotes = ctx.placedNotes.value
    const ticksPerBar = 4 * PPQ

    context.clearRect(0, 0, width * dpr, height * dpr)
    context.save()
    context.scale(dpr, dpr)

    // Draw safety hints if enabled (full canvas)
    if (ctx.showSafetyAlways.value) {
      drawSafetyHintsFull(context, noteH, width)
    }

    // Draw ALL placed notes
    if (placedNotes) {
      for (const note of placedNotes) {
        const isDraggingThis = ctx.isDragging.value && ctx.dragNoteId.value === note.id
        const isSelected = ctx.selectedNoteIds.value.has(note.id)
        const isHoveredNote = ctx.hoveredNoteId.value === note.id

        // Skip dragged note (drawn in overlay)
        if (isDraggingThis && ctx.dragType.value === 'move') continue

        let pitch = note.pitch
        let startTick = note.startTick
        let duration = note.duration

        if (isDraggingThis && ctx.dragType.value === 'resize') {
          duration = ctx.dragPreviewDuration.value ?? note.duration
        }

        drawSingleNote(context, note, pitch, startTick, duration, noteH, ticksPerBar, width, isSelected, isHoveredNote, isDraggingThis)
      }
    }

    context.restore()
    notesDirty.value = false
  }

  function drawSafetyHintsFull(context: CanvasRenderingContext2D, noteH: number, width: number) {
    const ticksPerBar = 4 * PPQ
    const totalEndTick = ctx.totalTicks.value

    // Pre-calculate all bar segments once
    const segments: { startTick: number; endTick: number; startX: number; endX: number }[] = []
    for (let barTick = 0; barTick < totalEndTick; barTick += ticksPerBar) {
      const segEndTick = Math.min(barTick + ticksPerBar, totalEndTick)
      segments.push({
        startTick: barTick,
        endTick: segEndTick,
        startX: ctx.tickToX(barTick),
        endX: barTick + ticksPerBar >= totalEndTick ? width - 4 : ctx.tickToX(segEndTick),
      })
    }

    // Draw safety for all pitches in vocal range
    for (let pitch = MIN_NOTE; pitch <= MAX_NOTE; pitch++) {
      const inRange = ctx.isInVocalRange(pitch)
      if (!inRange) continue

      const y = ctx.noteToY(pitch)

      for (const seg of segments) {
        const segWidth = seg.endX - seg.startX
        if (segWidth <= 0) continue

        const segSafetyInfo = ctx.getSafetyAtTick.value
          ? ctx.getSafetyAtTick.value(seg.startTick)
          : ctx.safetyInfo.value
        const segSafety = segSafetyInfo?.safety?.[pitch] ?? getNoteSafety(pitch, ctx.safetyInfo.value, ctx.currentChord.value, inRange)
        const colors = ctx.palette.value.safety[segSafety]

        context.fillStyle = colors.bg
        context.fillRect(seg.startX, y, segWidth, noteH)
      }
    }
  }

  function drawSingleNote(
    context: CanvasRenderingContext2D,
    note: PlacedNote,
    pitch: number,
    startTick: number,
    duration: number,
    noteH: number,
    ticksPerBar: number,
    width: number,
    isSelected: boolean,
    isHoveredNote: boolean,
    isDraggingThis: boolean
  ) {
    const palette = ctx.palette.value
    const endTick = startTick + duration
    const y = ctx.noteToY(pitch)
    const fullX = ctx.tickToX(startTick)
    const fullWidth = Math.max(20, duration * ctx.pixelsPerTick.value)
    const cornerRadius = 4

    if (fullX + fullWidth < 8 || fullX > width - 8) return

    // Find bar boundaries within this note
    const segments: { startTick: number; endTick: number; isFirst: boolean; isLast: boolean }[] = []
    let segStart = startTick
    const firstBarBoundary = Math.ceil(startTick / ticksPerBar) * ticksPerBar

    for (let barTick = firstBarBoundary; barTick < endTick; barTick += ticksPerBar) {
      if (barTick > segStart) {
        segments.push({ startTick: segStart, endTick: barTick, isFirst: segStart === startTick, isLast: false })
        segStart = barTick
      }
    }
    segments.push({ startTick: segStart, endTick: endTick, isFirst: segStart === startTick, isLast: true })

    // Draw each segment
    for (const seg of segments) {
      const segX = ctx.tickToX(seg.startTick)
      const segWidth = (seg.endTick - seg.startTick) * ctx.pixelsPerTick.value
      if (segWidth < 1) continue

      const segSafetyInfo = ctx.getSafetyAtTick.value
        ? ctx.getSafetyAtTick.value(seg.startTick)
        : ctx.safetyInfo.value
      const segSafety = segSafetyInfo?.safety?.[pitch] ?? getNoteSafety(pitch, ctx.safetyInfo.value, ctx.currentChord.value, ctx.isInVocalRange(pitch))
      const segColors = ctx.palette.value.safety[segSafety]

      context.fillStyle = segColors.text
      context.globalAlpha = isDraggingThis ? 0.9 : (isSelected ? 1 : 0.85)

      const leftRadius = seg.isFirst ? cornerRadius : 0
      const rightRadius = seg.isLast ? cornerRadius : 0

      context.beginPath()
      context.moveTo(segX + leftRadius, y + 2)
      context.lineTo(segX + segWidth - rightRadius, y + 2)
      if (rightRadius > 0) context.arcTo(segX + segWidth, y + 2, segX + segWidth, y + 2 + rightRadius, rightRadius)
      else context.lineTo(segX + segWidth, y + 2)
      context.lineTo(segX + segWidth, y + noteH - 4 - rightRadius)
      if (rightRadius > 0) context.arcTo(segX + segWidth, y + noteH - 4, segX + segWidth - rightRadius, y + noteH - 4, rightRadius)
      else context.lineTo(segX + segWidth, y + noteH - 4)
      context.lineTo(segX + leftRadius, y + noteH - 4)
      if (leftRadius > 0) context.arcTo(segX, y + noteH - 4, segX, y + noteH - 4 - leftRadius, leftRadius)
      else context.lineTo(segX, y + noteH - 4)
      context.lineTo(segX, y + 2 + leftRadius)
      if (leftRadius > 0) context.arcTo(segX, y + 2, segX + leftRadius, y + 2, leftRadius)
      else context.lineTo(segX, y + 2)
      context.closePath()
      context.fill()
      context.globalAlpha = 1

      if (isSelected) {
        context.strokeStyle = palette.selectedNoteBorder
        context.lineWidth = 2
      } else if (isHoveredNote) {
        context.strokeStyle = palette.hoveredNoteBorder
        context.lineWidth = 2
      } else {
        context.strokeStyle = segColors.border
        context.lineWidth = 1
      }
      context.stroke()
    }

    // Selection indicator
    if (isSelected) {
      context.fillStyle = palette.selectionIndicator
      context.beginPath()
      context.moveTo(fullX, y + 2)
      context.lineTo(fullX + 6, y + 2)
      context.lineTo(fullX, y + 8)
      context.closePath()
      context.fill()
    }

    // Hover resize handle
    if (isHoveredNote && !ctx.isDragging.value && fullWidth >= 20) {
      const dotRadius = 1.5
      const dotSpacing = 4
      const gridSize = 3
      const gridWidth = (gridSize - 1) * dotSpacing
      const gridX = fullX + fullWidth - gridWidth - 6
      const centerY = y + noteH / 2

      context.fillStyle = palette.resizeHandleDot
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const dotX = gridX + col * dotSpacing
          const dotY = centerY - gridWidth / 2 + row * dotSpacing
          context.beginPath()
          context.arc(dotX, dotY, dotRadius, 0, Math.PI * 2)
          context.fill()
        }
      }
    }
  }

  // ============================================================================
  // Layer 3: Overlay Drawing (selection box, drag preview only)
  // Playhead is now CSS-based for better performance
  // ============================================================================
  function drawOverlay() {
    const canvas = ctx.canvasRefs.overlayCanvas.value
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const width = ctx.canvasWidth.value
    const height = ctx.canvasHeight.value
    const noteH = ctx.noteHeight.value
    const dpr = ctx.dpr.value

    context.clearRect(0, 0, width * dpr, height * dpr)
    context.save()
    context.scale(dpr, dpr)

    // Draw drag preview ghost notes
    if (ctx.isDragging.value && ctx.dragType.value === 'move' && ctx.dragPreviewPitch.value !== null && ctx.dragPreviewTick.value !== null) {
      drawDragPreview(context, noteH)
    }

    // Draw selection box
    if (ctx.isSelecting.value) {
      const sx = Math.min(ctx.selectionStart.value.x, ctx.selectionEnd.value.x)
      const sy = Math.min(ctx.selectionStart.value.y, ctx.selectionEnd.value.y)
      const sw = Math.abs(ctx.selectionEnd.value.x - ctx.selectionStart.value.x)
      const sh = Math.abs(ctx.selectionEnd.value.y - ctx.selectionStart.value.y)

      context.fillStyle = ctx.palette.value.selectionBoxFill
      context.fillRect(sx, sy, sw, sh)
      context.strokeStyle = ctx.palette.value.selectionBoxBorder
      context.lineWidth = 1
      context.setLineDash([4, 2])
      context.strokeRect(sx, sy, sw, sh)
      context.setLineDash([])
    }

    context.restore()
    overlayDirty.value = false
  }

  function drawDragPreview(context: CanvasRenderingContext2D, noteH: number) {
    const palette = ctx.palette.value
    context.setLineDash([4, 4])

    // Multi-note drag: draw ghost for all dragged notes
    if (ctx.dragMultipleNotes.value.length > 1) {
      for (const dragNote of ctx.dragMultipleNotes.value) {
        const ghostPitch = Math.max(MIN_NOTE, Math.min(MAX_NOTE, dragNote.pitch + ctx.dragPitchDelta.value))
        const ghostTick = Math.max(0, dragNote.startTick + ctx.dragTickDelta.value)
        const ghostY = ctx.noteToY(ghostPitch)
        const ghostX = ctx.tickToX(ghostTick)
        const ghostWidth = Math.max(20, dragNote.duration * ctx.pixelsPerTick.value)
        const ghostSafety = getNoteSafety(ghostPitch, ctx.safetyInfo.value, ctx.currentChord.value, ctx.isInVocalRange(ghostPitch))
        const ghostColors = palette.safety[ghostSafety]

        context.fillStyle = ghostColors.bg
        context.strokeStyle = ghostColors.border
        context.lineWidth = 2
        drawRoundRect(context, ghostX, ghostY + 2, ghostWidth, noteH - 4, 4)
        context.fill()
        context.stroke()
      }
    } else {
      // Single note drag
      const ghostY = ctx.noteToY(ctx.dragPreviewPitch.value!)
      const ghostX = ctx.tickToX(ctx.dragPreviewTick.value!)
      const ghostWidth = Math.max(20, (ctx.dragPreviewDuration.value ?? 480) * ctx.pixelsPerTick.value)
      const ghostSafety = getNoteSafety(ctx.dragPreviewPitch.value!, ctx.safetyInfo.value, ctx.currentChord.value, ctx.isInVocalRange(ctx.dragPreviewPitch.value!))
      const ghostColors = palette.safety[ghostSafety]

      context.fillStyle = ghostColors.bg
      context.strokeStyle = ghostColors.border
      context.lineWidth = 2
      drawRoundRect(context, ghostX, ghostY + 2, ghostWidth, noteH - 4, 4)
      context.fill()
      context.stroke()
    }

    context.setLineDash([])
  }

  // ============================================================================
  // Public API
  // ============================================================================

  function markGridDirty() {
    gridDirty.value = true
  }

  function markNotesDirty() {
    notesDirty.value = true
  }

  function markOverlayDirty() {
    overlayDirty.value = true
  }

  function redrawAll() {
    gridDirty.value = true
    notesDirty.value = true
    overlayDirty.value = true
    performRedraw()
  }

  let redrawScheduled = false

  function scheduleRedraw() {
    if (redrawScheduled) return
    redrawScheduled = true
    requestAnimationFrame(() => {
      redrawScheduled = false
      performRedraw()
    })
  }

  function performRedraw() {
    if (gridDirty.value) {
      drawGrid()
    }
    if (notesDirty.value) {
      drawNotes()
    }
    if (overlayDirty.value) {
      drawOverlay()
    }
  }

  // Setup all canvases
  function setupCanvases(width: number, height: number, dpr: number) {
    const canvases = [
      ctx.canvasRefs.gridCanvas.value,
      ctx.canvasRefs.noteCanvas.value,
      ctx.canvasRefs.overlayCanvas.value,
    ]

    for (const canvas of canvases) {
      if (!canvas) continue
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }

    // Mark all layers dirty after resize
    gridDirty.value = true
    notesDirty.value = true
    overlayDirty.value = true
  }

  return {
    // Dirty flags
    gridDirty,
    notesDirty,
    overlayDirty,

    // Mark functions
    markGridDirty,
    markNotesDirty,
    markOverlayDirty,

    // Draw functions
    drawGrid,
    drawNotes,
    drawOverlay,
    redrawAll,
    scheduleRedraw,
    performRedraw,
    setupCanvases,
  }
}
