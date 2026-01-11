import { type Ref, type ComputedRef } from 'vue'
import {
  type PlacedNote,
  type PianoRollSafetyInfo,
  type ChordInfo,
  type ChordAtBar,
  NoteSafety,
  type NoteSafetyLevel,
  SAFETY_COLORS,
  NOTE_NAMES,
  MIN_NOTE,
  MAX_NOTE,
  PPQ,
  NOTE_HEIGHT_PX,
  isBlackKey,
  getReasonText,
} from '../types'

// ============================================================================
// Canvas Drawing Composable - All drawing logic for the piano roll
// ============================================================================

export interface DrawingContext {
  canvas: HTMLCanvasElement | null
  editorBody: HTMLElement | null
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
  placedNotes?: PlacedNote[]
  safetyInfo?: PianoRollSafetyInfo | null
  chordsInView?: ChordAtBar[]
  showSafetyAlways?: boolean
  getSafetyAtTick?: (tick: number) => PianoRollSafetyInfo | null
  currentChord: ChordInfo

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
  playheadTick?: Ref<number | null>
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

export function useCanvasDrawing() {
  function draw(ctx: DrawingContext) {
    const { canvas, editorBody, canvasWidth, canvasHeight, dpr } = ctx
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const width = canvasWidth.value
    const height = canvasHeight.value
    const noteH = ctx.noteHeight.value

    // Calculate visible viewport for optimized rendering
    const scrollLeft = editorBody?.scrollLeft ?? 0
    const scrollTop = editorBody?.scrollTop ?? 0
    const viewportWidth = editorBody?.clientWidth ?? width
    const viewportHeight = editorBody?.clientHeight ?? height

    const PADDING = 100
    const visibleLeft = Math.max(0, scrollLeft - PADDING)
    const visibleRight = Math.min(width, scrollLeft + viewportWidth + PADDING)
    const visibleTop = Math.max(0, scrollTop - PADDING)
    const visibleBottom = Math.min(height, scrollTop + viewportHeight + PADDING)

    const visibleStartTick = Math.max(0, ctx.xToTick(visibleLeft))
    const visibleEndTick = Math.min(ctx.totalTicks.value, ctx.xToTick(visibleRight))
    const visibleMinPitch = Math.max(MIN_NOTE, ctx.yToNote(visibleBottom))
    const visibleMaxPitch = Math.min(MAX_NOTE, ctx.yToNote(visibleTop))

    // Find last note end tick for safety suggestion area
    let lastNoteEndTick = 0
    if (ctx.placedNotes) {
      for (const note of ctx.placedNotes) {
        if (ctx.isDragging.value && ctx.dragNoteId.value === note.id) continue
        const endTick = note.startTick + note.duration
        if (endTick > lastNoteEndTick) lastNoteEndTick = endTick
      }
    }
    if (ctx.isDragging.value && ctx.dragNoteId.value) {
      const dragTick = ctx.dragPreviewTick.value ?? ctx.dragStartTick.value
      const dragDuration = ctx.dragPreviewDuration.value ?? ctx.dragStartDuration.value
      const dragEndTick = dragTick + dragDuration
      if (dragEndTick > lastNoteEndTick) lastNoteEndTick = dragEndTick
    }
    const suggestionStartX = Math.max(8, ctx.tickToX(lastNoteEndTick) - 4)
    const suggestionStartTick = lastNoteEndTick

    // Calculate bar segments
    const ticksPerBar = 4 * PPQ
    const totalEndTick = ctx.totalTicks.value

    // Full screen bar segments
    const fullScreenBarSegments: { startTick: number; endTick: number; startX: number; endX: number }[] = []
    const visibleBarStart = Math.floor(visibleStartTick / ticksPerBar) * ticksPerBar
    for (let barTick = visibleBarStart; barTick < visibleEndTick && barTick < totalEndTick; barTick += ticksPerBar) {
      const segEndTick = Math.min(barTick + ticksPerBar, totalEndTick)
      fullScreenBarSegments.push({
        startTick: barTick,
        endTick: segEndTick,
        startX: ctx.tickToX(barTick),
        endX: barTick + ticksPerBar >= totalEndTick ? width - 4 : ctx.tickToX(segEndTick),
      })
    }

    // Suggestion area segments
    const suggestionBarSegments: { startTick: number; endTick: number; startX: number; endX: number }[] = []
    const suggestionVisibleStart = Math.max(suggestionStartTick, visibleStartTick)
    const suggestionVisibleEnd = Math.min(totalEndTick, visibleEndTick)
    if (suggestionStartTick < suggestionVisibleEnd && suggestionVisibleStart < suggestionVisibleEnd) {
      let segStartTick = suggestionVisibleStart
      const firstBarBoundary = Math.ceil(segStartTick / ticksPerBar) * ticksPerBar

      for (let barTick = firstBarBoundary; barTick < suggestionVisibleEnd; barTick += ticksPerBar) {
        if (barTick > segStartTick) {
          suggestionBarSegments.push({
            startTick: segStartTick,
            endTick: barTick,
            startX: Math.max(suggestionStartX, ctx.tickToX(segStartTick)),
            endX: ctx.tickToX(barTick),
          })
          segStartTick = barTick
        }
      }
      if (segStartTick < suggestionVisibleEnd) {
        suggestionBarSegments.push({
          startTick: segStartTick,
          endTick: suggestionVisibleEnd,
          startX: Math.max(suggestionStartX, ctx.tickToX(segStartTick)),
          endX: suggestionVisibleEnd >= totalEndTick ? width - 4 : ctx.tickToX(suggestionVisibleEnd),
        })
      }
    }

    context.clearRect(0, 0, width * dpr.value, height * dpr.value)
    context.save()
    context.scale(dpr.value, dpr.value)

    // Background
    context.fillStyle = 'rgba(12, 12, 18, 0.98)'
    context.fillRect(visibleLeft, visibleTop, visibleRight - visibleLeft, visibleBottom - visibleTop)

    // Draw note rows
    for (let pitch = visibleMinPitch; pitch <= visibleMaxPitch; pitch++) {
      const y = ctx.noteToY(pitch)
      const black = isBlackKey(pitch)
      const inRange = ctx.isInVocalRange(pitch)
      const safety = getNoteSafety(pitch, ctx.safetyInfo, ctx.currentChord, inRange)
      const isHovered = ctx.hoveredNote.value === pitch

      // Base row color
      context.fillStyle = black ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.03)'
      context.fillRect(0, y, width, noteH)

      // Vocal range indicator
      if (inRange) {
        context.fillStyle = 'rgba(139, 92, 246, 0.08)'
        context.fillRect(0, y, width, noteH)
      } else {
        context.fillStyle = 'rgba(0, 0, 0, 0.5)'
        context.fillRect(0, y, width, noteH)
        context.strokeStyle = 'rgba(60, 60, 70, 0.4)'
        context.lineWidth = 1
        const stripeSpacing = 8
        for (let sx = -noteH; sx < width + noteH; sx += stripeSpacing) {
          context.beginPath()
          context.moveTo(sx, y + noteH)
          context.lineTo(sx + noteH, y)
          context.stroke()
        }
      }

      // Safety display
      const showSafetyAlways = ctx.showSafetyAlways && fullScreenBarSegments.length > 0
      const isInSuggestionArea = suggestionBarSegments.length > 0

      if (showSafetyAlways && inRange) {
        drawSafetySegments(context, fullScreenBarSegments, pitch, y, noteH, ctx, isHovered, suggestionStartTick, width)

        if (isInSuggestionArea) {
          const firstSuggestionSeg = suggestionBarSegments[0]
          const firstSegSafetyInfo = ctx.getSafetyAtTick
            ? ctx.getSafetyAtTick(firstSuggestionSeg.startTick)
            : ctx.safetyInfo
          const firstSegSafety = firstSegSafetyInfo?.safety?.[pitch] ?? safety
          const firstColors = SAFETY_COLORS[firstSegSafety]
          context.fillStyle = firstColors.border
          context.fillRect(firstSuggestionSeg.startX, y + 1, 2, noteH - 2)
        }
        context.textAlign = 'left'
      }

      // Hover highlight (suggestion area only)
      if (isHovered && isInSuggestionArea && !ctx.showSafetyAlways) {
        if (inRange) {
          drawSafetySegments(context, suggestionBarSegments, pitch, y, noteH, ctx, true, 0, width)
          context.textAlign = 'left'
        } else {
          const areaWidth = width - suggestionStartX - 4
          context.fillStyle = 'rgba(248, 113, 113, 0.15)'
          context.fillRect(suggestionStartX, y, areaWidth, noteH)
          context.font = '10px JetBrains Mono, monospace'
          context.fillStyle = 'rgba(248, 113, 113, 0.8)'
          context.textAlign = 'right'
          context.fillText('Out of Range', width - 8, y + noteH / 2)
          context.textAlign = 'left'
        }
      }

      // Grid line
      context.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      context.lineWidth = 0.5
      context.beginPath()
      context.moveTo(0, y + noteH)
      context.lineTo(width, y + noteH)
      context.stroke()

      // Octave line
      if (pitch % 12 === 0) {
        context.strokeStyle = 'rgba(139, 92, 246, 0.3)'
        context.lineWidth = 1
        context.beginPath()
        context.moveTo(0, y + noteH)
        context.lineTo(width, y + noteH)
        context.stroke()
      }
    }

    // Draw vertical grid lines
    const gridStartTick = Math.floor(visibleStartTick / ctx.gridSnap.value) * ctx.gridSnap.value
    for (let tick = gridStartTick; tick <= visibleEndTick; tick += ctx.gridSnap.value) {
      const x = ctx.tickToX(tick)
      if (x < visibleLeft - 10 || x > visibleRight + 10) continue

      const isBar = tick % (4 * PPQ) === 0
      const isBeat = tick % PPQ === 0

      if (isBar) {
        context.strokeStyle = 'rgba(139, 92, 246, 0.3)'
        context.lineWidth = 1
      } else if (isBeat) {
        context.strokeStyle = 'rgba(139, 92, 246, 0.15)'
        context.lineWidth = 0.5
      } else {
        context.strokeStyle = 'rgba(255, 255, 255, 0.05)'
        context.lineWidth = 0.5
      }

      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, height)
      context.stroke()

      if (isBar) {
        const barNum = tick / (4 * PPQ) + 1
        context.fillStyle = 'rgba(255, 255, 255, 0.4)'
        context.font = '9px JetBrains Mono, monospace'
        context.fillText(String(barNum), x + 3, 12)
      }
    }

    // Draw placed notes
    if (ctx.placedNotes) {
      drawPlacedNotes(context, ctx, ticksPerBar, visibleStartTick, visibleEndTick, visibleMinPitch, visibleMaxPitch, width, height)
    }

    // Draw drag preview ghost notes
    if (ctx.isDragging.value && ctx.dragType.value === 'move' && ctx.dragPreviewPitch.value !== null && ctx.dragPreviewTick.value !== null) {
      context.setLineDash([4, 4])

      // Multi-note drag: draw ghost for all dragged notes
      if (ctx.dragMultipleNotes.value.length > 1) {
        for (const dragNote of ctx.dragMultipleNotes.value) {
          const ghostPitch = Math.max(MIN_NOTE, Math.min(MAX_NOTE, dragNote.pitch + ctx.dragPitchDelta.value))
          const ghostTick = Math.max(0, dragNote.startTick + ctx.dragTickDelta.value)
          const ghostY = ctx.noteToY(ghostPitch)
          const ghostX = ctx.tickToX(ghostTick)
          const ghostWidth = Math.max(20, dragNote.duration * ctx.pixelsPerTick.value)
          const ghostSafety = getNoteSafety(ghostPitch, ctx.safetyInfo, ctx.currentChord, ctx.isInVocalRange(ghostPitch))
          const ghostColors = SAFETY_COLORS[ghostSafety]

          context.fillStyle = ghostColors.bg
          context.strokeStyle = ghostColors.border
          context.lineWidth = 2
          drawRoundRect(context, ghostX, ghostY + 2, ghostWidth, noteH - 4, 4)
          context.fill()
          context.stroke()
        }
      } else {
        // Single note drag
        const ghostY = ctx.noteToY(ctx.dragPreviewPitch.value)
        const ghostX = ctx.tickToX(ctx.dragPreviewTick.value)
        const ghostWidth = Math.max(20, (ctx.dragPreviewDuration.value ?? 480) * ctx.pixelsPerTick.value)
        const ghostSafety = getNoteSafety(ctx.dragPreviewPitch.value, ctx.safetyInfo, ctx.currentChord, ctx.isInVocalRange(ctx.dragPreviewPitch.value))
        const ghostColors = SAFETY_COLORS[ghostSafety]

        context.fillStyle = ghostColors.bg
        context.strokeStyle = ghostColors.border
        context.lineWidth = 2
        drawRoundRect(context, ghostX, ghostY + 2, ghostWidth, noteH - 4, 4)
        context.fill()
        context.stroke()
      }

      context.setLineDash([])
    }

    // Draw selection box
    if (ctx.isSelecting.value) {
      const sx = Math.min(ctx.selectionStart.value.x, ctx.selectionEnd.value.x)
      const sy = Math.min(ctx.selectionStart.value.y, ctx.selectionEnd.value.y)
      const sw = Math.abs(ctx.selectionEnd.value.x - ctx.selectionStart.value.x)
      const sh = Math.abs(ctx.selectionEnd.value.y - ctx.selectionStart.value.y)

      context.fillStyle = 'rgba(139, 92, 246, 0.15)'
      context.fillRect(sx, sy, sw, sh)
      context.strokeStyle = 'rgba(139, 92, 246, 0.6)'
      context.lineWidth = 1
      context.setLineDash([4, 2])
      context.strokeRect(sx, sy, sw, sh)
      context.setLineDash([])
    }

    // Draw playhead
    if (ctx.playheadTick?.value !== null && ctx.playheadTick?.value !== undefined) {
      const playheadX = ctx.tickToX(ctx.playheadTick.value)

      // Playhead line
      context.strokeStyle = '#F87171'
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(playheadX, 0)
      context.lineTo(playheadX, height)
      context.stroke()

      // Playhead triangle marker at top
      context.fillStyle = '#F87171'
      context.beginPath()
      context.moveTo(playheadX - 6, 0)
      context.lineTo(playheadX + 6, 0)
      context.lineTo(playheadX, 10)
      context.closePath()
      context.fill()

      // Glow effect
      context.strokeStyle = 'rgba(248, 113, 113, 0.3)'
      context.lineWidth = 6
      context.beginPath()
      context.moveTo(playheadX, 0)
      context.lineTo(playheadX, height)
      context.stroke()
    }

    context.restore()
  }

  return { draw }
}

// Helper function for drawing safety segments
function drawSafetySegments(
  ctx: CanvasRenderingContext2D,
  segments: { startTick: number; endTick: number; startX: number; endX: number }[],
  pitch: number,
  y: number,
  noteH: number,
  drawCtx: DrawingContext,
  isHovered: boolean,
  suggestionStartTick: number,
  width: number
) {
  for (const seg of segments) {
    const segWidth = seg.endX - seg.startX
    if (segWidth <= 0) continue

    const segSafetyInfo = drawCtx.getSafetyAtTick
      ? drawCtx.getSafetyAtTick(seg.startTick)
      : drawCtx.safetyInfo
    const segSafety = segSafetyInfo?.safety?.[pitch] ?? getNoteSafety(pitch, drawCtx.safetyInfo, drawCtx.currentChord, drawCtx.isInVocalRange(pitch))
    const segReason = segSafetyInfo?.reason?.[pitch] ?? getNoteReason(pitch, drawCtx.safetyInfo)
    const segRecommended = segSafetyInfo?.recommended?.includes(pitch) ?? false
    const colors = SAFETY_COLORS[segSafety]

    ctx.fillStyle = colors.bg
    ctx.fillRect(seg.startX, y, segWidth, noteH)

    const reasonText = getReasonText(segReason)
    if (reasonText && segWidth > 30) {
      ctx.font = '9px JetBrains Mono, monospace'
      ctx.fillStyle = isHovered ? colors.text : `${colors.text}bb`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'right'
      const maxTextWidth = segWidth - 8
      let displayText = reasonText
      if (ctx.measureText(displayText).width > maxTextWidth) {
        displayText = reasonText.substring(0, 3)
      }
      ctx.fillText(displayText, seg.endX - 4, y + noteH / 2)
    }

    if (segRecommended && seg.startTick >= suggestionStartTick && segWidth > 20) {
      ctx.font = '10px JetBrains Mono, monospace'
      ctx.fillStyle = isHovered ? colors.text : `${colors.text}88`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      ctx.fillText('\u2605', seg.startX + 4, y + noteH / 2)
    }
  }
}

// Helper function for drawing placed notes
function drawPlacedNotes(
  ctx: CanvasRenderingContext2D,
  drawCtx: DrawingContext,
  ticksPerBar: number,
  visibleStartTick: number,
  visibleEndTick: number,
  visibleMinPitch: number,
  visibleMaxPitch: number,
  width: number,
  height: number
) {
  const noteH = drawCtx.noteHeight.value

  for (const note of drawCtx.placedNotes!) {
    if (note.pitch < MIN_NOTE || note.pitch > MAX_NOTE) continue
    if (note.pitch < visibleMinPitch - 1 || note.pitch > visibleMaxPitch + 1) continue

    const noteEndTick = note.startTick + note.duration
    if (noteEndTick < visibleStartTick || note.startTick > visibleEndTick) continue

    const isDraggingThis = drawCtx.isDragging.value && drawCtx.dragNoteId.value === note.id
    const isSelected = drawCtx.selectedNoteIds.value.has(note.id)

    let pitch = note.pitch
    let startTick = note.startTick
    let duration = note.duration

    if (isDraggingThis) {
      if (drawCtx.dragType.value === 'move') {
        pitch = drawCtx.dragPreviewPitch.value ?? note.pitch
        startTick = drawCtx.dragPreviewTick.value ?? note.startTick
      } else if (drawCtx.dragType.value === 'resize') {
        duration = drawCtx.dragPreviewDuration.value ?? note.duration
      }
    }

    const endTick = startTick + duration
    const y = drawCtx.noteToY(pitch)
    const fullX = drawCtx.tickToX(startTick)
    const fullWidth = Math.max(20, duration * drawCtx.pixelsPerTick.value)
    const cornerRadius = 4
    const isHoveredNote = drawCtx.hoveredNoteId.value === note.id

    if (fullX + fullWidth < 8 || fullX > width - 8) continue

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
    const segmentReasons: { reason: number; safety: NoteSafetyLevel; colors: typeof SAFETY_COLORS[0] }[] = []

    for (const seg of segments) {
      const segX = drawCtx.tickToX(seg.startTick)
      const segWidth = (seg.endTick - seg.startTick) * drawCtx.pixelsPerTick.value
      if (segWidth < 1) continue

      const segSafetyInfo = drawCtx.getSafetyAtTick
        ? drawCtx.getSafetyAtTick(seg.startTick)
        : drawCtx.safetyInfo
      const segSafety = segSafetyInfo?.safety?.[pitch] ?? getNoteSafety(pitch, drawCtx.safetyInfo, drawCtx.currentChord, drawCtx.isInVocalRange(pitch))
      const segReason = segSafetyInfo?.reason?.[pitch] ?? getNoteReason(pitch, drawCtx.safetyInfo)
      const segColors = SAFETY_COLORS[segSafety]

      segmentReasons.push({ reason: segReason, safety: segSafety, colors: segColors })

      ctx.fillStyle = segColors.text
      ctx.globalAlpha = isDraggingThis ? 0.9 : (isSelected ? 1 : 0.85)

      const leftRadius = seg.isFirst ? cornerRadius : 0
      const rightRadius = seg.isLast ? cornerRadius : 0

      ctx.beginPath()
      ctx.moveTo(segX + leftRadius, y + 2)
      ctx.lineTo(segX + segWidth - rightRadius, y + 2)
      if (rightRadius > 0) ctx.arcTo(segX + segWidth, y + 2, segX + segWidth, y + 2 + rightRadius, rightRadius)
      else ctx.lineTo(segX + segWidth, y + 2)
      ctx.lineTo(segX + segWidth, y + noteH - 4 - rightRadius)
      if (rightRadius > 0) ctx.arcTo(segX + segWidth, y + noteH - 4, segX + segWidth - rightRadius, y + noteH - 4, rightRadius)
      else ctx.lineTo(segX + segWidth, y + noteH - 4)
      ctx.lineTo(segX + leftRadius, y + noteH - 4)
      if (leftRadius > 0) ctx.arcTo(segX, y + noteH - 4, segX, y + noteH - 4 - leftRadius, leftRadius)
      else ctx.lineTo(segX, y + noteH - 4)
      ctx.lineTo(segX, y + 2 + leftRadius)
      if (leftRadius > 0) ctx.arcTo(segX, y + 2, segX + leftRadius, y + 2, leftRadius)
      else ctx.lineTo(segX, y + 2)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1

      if (isSelected) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.lineWidth = 2
      } else if (isDraggingThis || isHoveredNote) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.lineWidth = 2
      } else {
        ctx.strokeStyle = segColors.border
        ctx.lineWidth = 1
      }
      ctx.stroke()
    }

    // Hover resize handle
    if (isHoveredNote && !drawCtx.isDragging.value && fullWidth >= 20) {
      const dotRadius = 1.5
      const dotSpacing = 4
      const gridSize = 3
      const gridWidth = (gridSize - 1) * dotSpacing
      const gridX = fullX + fullWidth - gridWidth - 6
      const centerY = y + noteH / 2

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const dotX = gridX + col * dotSpacing
          const dotY = centerY - gridWidth / 2 + row * dotSpacing
          ctx.beginPath()
          ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // Selection indicator
    if (isSelected) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.beginPath()
      ctx.moveTo(fullX, y + 2)
      ctx.lineTo(fullX + 6, y + 2)
      ctx.lineTo(fullX, y + 8)
      ctx.closePath()
      ctx.fill()
    }

    // Hover tooltip
    if (isHoveredNote && !isDraggingThis) {
      const reasonTexts: string[] = []
      let prevReasonText = ''
      for (const sr of segmentReasons) {
        const text = getReasonText(sr.reason)
        if (text && text !== prevReasonText) {
          reasonTexts.push(text)
          prevReasonText = text
        }
      }
      const reasonText = reasonTexts.join(' \u2192 ')

      if (reasonText) {
        ctx.font = '10px JetBrains Mono, monospace'
        const textWidth = ctx.measureText(reasonText).width
        const tooltipW = textWidth + 10
        const tooltipH = 16

        // Check for adjacent notes
        let hasNoteBelow = false
        let hasNoteAbove = false
        let hasNoteRight = false

        for (const other of drawCtx.placedNotes!) {
          if (other.id === note.id) continue
          const otherX = drawCtx.tickToX(other.startTick)
          const otherW = Math.max(20, other.duration * drawCtx.pixelsPerTick.value)

          if (other.pitch === pitch - 1 && otherX < fullX + fullWidth && otherX + otherW > fullX) hasNoteBelow = true
          if (other.pitch === pitch + 1 && otherX < fullX + fullWidth && otherX + otherW > fullX) hasNoteAbove = true
          if (other.pitch === pitch && otherX > fullX && otherX < fullX + fullWidth + tooltipW + 8) hasNoteRight = true
        }

        let tooltipX: number
        let tooltipY: number

        if (!hasNoteBelow && y + noteH + tooltipH + 4 < height) {
          tooltipX = fullX + (fullWidth - tooltipW) / 2
          tooltipY = y + noteH + 2
        } else if (!hasNoteAbove && y - tooltipH - 4 > 20) {
          tooltipX = fullX + (fullWidth - tooltipW) / 2
          tooltipY = y - tooltipH - 2
        } else if (!hasNoteRight) {
          tooltipX = fullX + fullWidth + 4
          tooltipY = y + (noteH - tooltipH) / 2
        } else {
          tooltipX = fullX - tooltipW - 4
          tooltipY = y + (noteH - tooltipH) / 2
        }

        tooltipX = Math.max(4, Math.min(width - tooltipW - 4, tooltipX))
        tooltipY = Math.max(22, Math.min(height - tooltipH - 4, tooltipY))

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
        drawRoundRect(ctx, tooltipX, tooltipY, tooltipW, tooltipH, 3)
        ctx.fill()

        const worstSafety = Math.max(...segmentReasons.map(sr => sr.safety)) as NoteSafetyLevel
        const tooltipColors = SAFETY_COLORS[worstSafety]

        ctx.strokeStyle = tooltipColors.border
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.fillStyle = tooltipColors.text
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(reasonText, tooltipX + tooltipW / 2, tooltipY + tooltipH / 2)
        ctx.textAlign = 'left'
      }
    }
  }
}
