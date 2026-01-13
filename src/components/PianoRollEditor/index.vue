<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  type PlacedNote,
  type PianoRollSafetyInfo,
  type ChordInfo,
  type ChordAtBar,
  type SectionAtBar,
  NoteSafety,
  type NoteSafetyLevel,
} from './types'
import { useViewport } from './composables/useViewport'
import { useNoteInteraction } from './composables/useNoteInteraction'
import { useLayeredCanvas } from './composables/useLayeredCanvas'
import { useClipboard } from './composables/useClipboard'
import { useContextMenuActions } from './composables/useContextMenuActions'
import { usePlaybackControl } from './composables/usePlaybackControl'
import { useEditorEvents } from './composables/useEditorEvents'
import { usePlayheadDrag } from './composables/usePlayheadDrag'
import PianoRollHeader from './PianoRollHeader.vue'
import PianoRollPianoKeys from './PianoRollPianoKeys.vue'
import PianoRollFooter from './PianoRollFooter.vue'
import PianoRollContextMenu from './PianoRollContextMenu.vue'
import PianoRollPlayhead from './PianoRollPlayhead.vue'
import PianoRollTooltip from './PianoRollTooltip.vue'

// ============================================================================
// Props & Emits
// ============================================================================

const props = defineProps<{
  currentTick?: number
  vocalLow?: number
  vocalHigh?: number
  currentKey?: number
  safetyInfo?: PianoRollSafetyInfo | null
  placedNotes?: PlacedNote[]
  previewPitch?: number | null
  gridSnap?: number
  totalBars?: number
  showSafetyAlways?: boolean
  chordsInView?: ChordAtBar[]
  sectionsInView?: SectionAtBar[]
  getSafetyAtTick?: (tick: number) => PianoRollSafetyInfo | null
  allowHarmony?: boolean
  bpm?: number
  soundEnabled?: boolean
}>()

const emit = defineEmits<{
  noteClick: [pitch: number, tick: number]
  noteHover: [pitch: number | null]
  noteAdd: [note: { pitch: number; startTick: number; duration: number }]
  noteDelete: [noteId: string]
  noteUpdate: [note: PlacedNote]
  noteDurationChange: [noteId: string, duration: number]
  noteMove: [noteId: string, pitch: number, startTick: number]
  noteSplit: [noteId: string, splitTick: number]
  noteMerge: [noteIds: string[]]
  scroll: [scrollLeft: number, scrollTop: number]
  zoomChange: [zoomLevel: number]
  playbackUpdate: [tick: number | null, isPlaying: boolean]
}>()

// ============================================================================
// Refs
// ============================================================================

// Layered canvas refs for performance
const gridCanvasRef = ref<HTMLCanvasElement | null>(null)
const noteCanvasRef = ref<HTMLCanvasElement | null>(null)
const overlayCanvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const editorBodyRef = ref<HTMLElement | null>(null)
const headerRef = ref<InstanceType<typeof PianoRollHeader> | null>(null)
const currentDuration = ref(480)

// Tooltip state
const tooltipPosition = ref<{ x: number; y: number } | null>(null)

// ============================================================================
// Computed Props
// ============================================================================

const gridSnapRef = computed(() => props.gridSnap ?? 120)
const totalBarsRef = computed(() => props.totalBars ?? 4)
const vocalLowRef = computed(() => props.vocalLow ?? 55)
const vocalHighRef = computed(() => props.vocalHigh ?? 79)
const allowHarmonyRef = computed(() => props.allowHarmony ?? false)
const placedNotesRef = computed(() => props.placedNotes)
const bpmRef = computed(() => props.bpm ?? 120)
const soundEnabledRef = computed(() => props.soundEnabled ?? true)

// Refs for props (needed for layered canvas reactivity)
const safetyInfoRef = computed(() => props.safetyInfo)
const showSafetyAlwaysRef = computed(() => props.showSafetyAlways)
const getSafetyAtTickRef = computed(() => props.getSafetyAtTick)

// ============================================================================
// Composables
// ============================================================================

const viewport = useViewport({
  totalBars: totalBarsRef,
  gridSnap: gridSnapRef,
  vocalLow: vocalLowRef,
  vocalHigh: vocalHighRef,
})

const interaction = useNoteInteraction({
  placedNotes: placedNotesRef,
  allowHarmony: allowHarmonyRef,
  vocalRange: viewport.vocalRange,
  gridSnap: gridSnapRef,
  pixelsPerTick: viewport.pixelsPerTick,
  noteToY: viewport.noteToY,
  yToNote: viewport.yToNote,
  tickToX: viewport.tickToX,
  xToTick: viewport.xToTick,
  snapToGrid: viewport.snapToGrid,
})

const clipboard = useClipboard({
  placedNotes: placedNotesRef,
  selectedNoteIds: interaction.selectedNoteIds,
  snapToGrid: viewport.snapToGrid,
})

// ============================================================================
// Drawing with Layered Canvas
// ============================================================================

const currentChord = computed<ChordInfo>(() => {
  return props.safetyInfo?.chord ?? {
    name: 'C',
    degree: 'I',
    root: 0,
    type: 'major' as const,
    tones: [0, 4, 7],
  }
})

// Initialize layered canvas composable
const layeredCanvas = useLayeredCanvas({
  canvasRefs: {
    gridCanvas: gridCanvasRef,
    noteCanvas: noteCanvasRef,
    overlayCanvas: overlayCanvasRef,
  },
  editorBody: editorBodyRef,
  canvasWidth: viewport.canvasWidth,
  canvasHeight: viewport.canvasHeight,
  dpr: viewport.dpr,
  zoomLevel: viewport.zoomLevel,
  totalTicks: viewport.totalTicks,
  pixelsPerTick: viewport.pixelsPerTick,
  gridSnap: gridSnapRef,
  noteHeight: viewport.noteHeight,
  vocalRange: viewport.vocalRange,
  placedNotes: placedNotesRef,
  safetyInfo: safetyInfoRef,
  chordsInView: computed(() => props.chordsInView),
  showSafetyAlways: showSafetyAlwaysRef,
  getSafetyAtTick: getSafetyAtTickRef,
  currentChord,
  hoveredNote: interaction.hoveredNote,
  hoveredNoteId: interaction.hoveredNoteId,
  selectedNoteIds: interaction.selectedNoteIds,
  isDragging: interaction.isDragging,
  dragType: interaction.dragType,
  dragNoteId: interaction.dragNoteId,
  dragStartTick: interaction.dragStartTick,
  dragStartDuration: interaction.dragStartDuration,
  dragPreviewPitch: interaction.dragPreviewPitch,
  dragPreviewTick: interaction.dragPreviewTick,
  dragPreviewDuration: interaction.dragPreviewDuration,
  isSelecting: interaction.isSelecting,
  selectionStart: interaction.selectionStart,
  selectionEnd: interaction.selectionEnd,
  dragMultipleNotes: interaction.dragMultipleNotes,
  dragPitchDelta: interaction.dragPitchDelta,
  dragTickDelta: interaction.dragTickDelta,
  noteToY: viewport.noteToY,
  yToNote: viewport.yToNote,
  tickToX: viewport.tickToX,
  xToTick: viewport.xToTick,
  isInVocalRange: viewport.isInVocalRange,
  playheadTick: ref(null), // Playhead is now CSS-based
})

// Redraw functions with layer awareness
function redrawGrid() {
  layeredCanvas.markGridDirty()
  layeredCanvas.scheduleRedraw()
}

function redrawNotes() {
  layeredCanvas.markNotesDirty()
  layeredCanvas.scheduleRedraw()
}

function redrawOverlay() {
  layeredCanvas.markOverlayDirty()
  layeredCanvas.scheduleRedraw()
}

function redrawAll() {
  layeredCanvas.redrawAll()
}

// Backward compatible redraw (marks notes + overlay dirty)
function redraw() {
  layeredCanvas.markNotesDirty()
  layeredCanvas.markOverlayDirty()
  layeredCanvas.scheduleRedraw()
}

// ============================================================================
// Playback Control (with CSS-based playhead)
// ============================================================================

const playback = usePlaybackControl({
  placedNotes: placedNotesRef,
  totalBars: totalBarsRef,
  bpm: bpmRef,
  soundEnabled: soundEnabledRef,
  chordsInView: computed(() => props.chordsInView),
  tickToX: viewport.tickToX,
  editorBodyRef,
  onRedraw: () => {
    // Playhead position is updated via watch below (playheadDrag.updatePosition)
  },
})

// Playhead drag composable
const playheadDrag = usePlayheadDrag({
  editorBodyRef,
  tickToX: viewport.tickToX,
  xToTick: viewport.xToTick,
  snapToGrid: viewport.snapToGrid,
  totalTicks: viewport.totalTicks,
  isPlaying: playback.isPlaying,
  stop: playback.stop,
  seek: playback.seek,
  suspendScrollFollow: playback.suspendScrollFollow,
})

// Watch playhead tick to update CSS position
watch(() => playback.playheadTick.value, (tick) => {
  if (!playheadDrag.isDragging.value) {
    playheadDrag.updatePosition(tick)
  }
})

// ============================================================================
// Context Menu Actions
// ============================================================================

const contextMenuActions = useContextMenuActions(
  {
    placedNotes: placedNotesRef,
    selectedNoteIds: interaction.selectedNoteIds,
    contextMenuTick: interaction.contextMenuTick,
    clearSelection: interaction.clearSelection,
    closeContextMenu: interaction.closeContextMenu,
  },
  {
    onDelete: (noteId) => emit('noteDelete', noteId),
    onDurationChange: (noteId, duration) => emit('noteDurationChange', noteId, duration),
    onSplit: (noteId, splitTick) => emit('noteSplit', noteId, splitTick),
    onMerge: (noteIds) => emit('noteMerge', noteIds),
  }
)

// ============================================================================
// Event Handlers (use overlay canvas for mouse events)
// ============================================================================

const events = useEditorEvents(
  {
    canvasRef: overlayCanvasRef, // Mouse events on topmost canvas
    editorBodyRef,
    placedNotes: placedNotesRef,
    gridSnap: gridSnapRef,
    soundEnabled: soundEnabledRef,
    viewport,
    interaction,
    clipboard,
    onRedraw: redrawOverlay, // Only redraw overlay for interactions
    playNotePreview: playback.playNotePreview,
    togglePlay: playback.togglePlay,
  },
  {
    onNoteHover: (pitch) => emit('noteHover', pitch),
    onNoteClick: (pitch, tick) => emit('noteClick', pitch, tick),
    onNoteDelete: (noteId) => {
      emit('noteDelete', noteId)
      redrawNotes() // Note deleted, redraw notes layer
    },
    onNoteMove: (noteId, pitch, tick) => {
      emit('noteMove', noteId, pitch, tick)
      redrawNotes() // Note moved, redraw notes layer
    },
    onNoteDurationChange: (noteId, duration) => {
      emit('noteDurationChange', noteId, duration)
      redrawNotes() // Note resized, redraw notes layer
    },
    onNoteSplit: (noteId, splitTick) => {
      emit('noteSplit', noteId, splitTick)
      redrawNotes() // Note split, redraw notes layer
    },
    onNoteAdd: (note) => {
      emit('noteAdd', note)
      redrawNotes() // Note added, redraw notes layer
    },
  }
)

// ============================================================================
// Safety Functions
// ============================================================================

function getNoteSafety(pitch: number): NoteSafetyLevel {
  if (props.safetyInfo?.safety?.[pitch] !== undefined) {
    return props.safetyInfo.safety[pitch]
  }
  if (!viewport.isInVocalRange(pitch)) return NoteSafety.Dissonant
  const chord = currentChord.value
  const relativeNote = (pitch - chord.root + 120) % 12
  if (chord.tones.includes(relativeNote)) return NoteSafety.Safe
  if ([2, 5, 9].includes(relativeNote)) return NoteSafety.Warning
  return NoteSafety.Dissonant
}

function getNoteReason(pitch: number): number {
  return props.safetyInfo?.reason?.[pitch] ?? 0
}

// ============================================================================
// Scroll Sync (optimized - no canvas redraw needed)
// ============================================================================

function handleEditorScroll() {
  if (editorBodyRef.value) {
    const scrollLeft = editorBodyRef.value.scrollLeft
    const scrollTop = editorBodyRef.value.scrollTop

    // Sync header scroll immediately (cheap operation)
    if (headerRef.value?.sectionBarRef) {
      headerRef.value.sectionBarRef.scrollLeft = scrollLeft
    }
    if (headerRef.value?.chordBarRef) {
      headerRef.value.chordBarRef.scrollLeft = scrollLeft
    }
    emit('scroll', scrollLeft, scrollTop)

    // NO canvas redraw on scroll - canvas is pre-rendered at full size
    // Scrolling just moves the viewport over the existing canvas
  }
}

// ============================================================================
// Setup & Lifecycle
// ============================================================================

function setupCanvases() {
  const width = viewport.contentWidth.value
  const height = viewport.totalEditorHeight.value
  const dpr = window.devicePixelRatio || 1

  viewport.dpr.value = dpr
  viewport.canvasWidth.value = width
  viewport.canvasHeight.value = height

  // Setup all canvas layers
  layeredCanvas.setupCanvases(width, height, dpr)

  // Initial draw
  redrawAll()
}

function scrollToBar(bar: number) {
  viewport.scrollToBar(bar, editorBodyRef.value)
}

defineExpose({
  scrollToBar,
  play: playback.play,
  togglePlay: playback.togglePlay,
  stop: playback.stop,
  isPlaying: playback.isPlaying,
  isPaused: playback.isPaused,
  preloadSound: playback.preload,
  // For staff view sync
  zoomLevel: viewport.zoomLevel,
  playheadTick: playback.playheadTick,
  getScrollLeft: () => editorBodyRef.value?.scrollLeft ?? 0,
})

// ============================================================================
// Watchers (Highly optimized - minimal redraws)
// ============================================================================

// Watch for note array reference change only (not deep)
// Parent should replace array reference when notes change
watch(
  () => props.placedNotes,
  () => redrawNotes()
)

// Watch for safety info changes - redraw notes layer
watch(safetyInfoRef, () => redrawNotes())

// Watch for hover NOTE changes only (not pitch - pitch doesn't need redraw)
let lastHoveredNoteId: string | null = null
watch(interaction.hoveredNoteId, (newId) => {
  if (newId !== lastHoveredNoteId) {
    lastHoveredNoteId = newId
    redrawNotes() // Redraw notes to update hover state on note

    // Update tooltip position
    if (newId && placedNotesRef.value) {
      const note = placedNotesRef.value.find(n => n.id === newId)
      if (note) {
        const x = viewport.tickToX(note.startTick) + 40 // 40 = piano keys width
        const y = viewport.noteToY(note.pitch)
        tooltipPosition.value = { x, y }
      }
    } else {
      tooltipPosition.value = null
    }
  }
})

// Watch zoom/size changes - setup all canvases
watch([viewport.zoomLevel, totalBarsRef], () => {
  setupCanvases()
})

// Emit zoom change for external sync (e.g., staff view)
watch(viewport.zoomLevel, (newZoom) => {
  emit('zoomChange', newZoom)
})

// Emit playback updates for external sync (e.g., staff view)
watch([playback.playheadTick, playback.isPlaying], ([tick, playing]) => {
  emit('playbackUpdate', tick, playing)
})

// Watch drag/select state - redraw overlay only
watch([interaction.isDragging, interaction.isSelecting], () => {
  redrawOverlay()
})

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  setupCanvases()
  window.addEventListener('resize', setupCanvases)
  window.addEventListener('click', events.handleGlobalClick)
  window.addEventListener('mouseup', events.handleGlobalMouseUp)
  window.addEventListener('keydown', events.handleKeyDown)

  if (soundEnabledRef.value) {
    playback.preload()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', setupCanvases)
  window.removeEventListener('click', events.handleGlobalClick)
  window.removeEventListener('mouseup', events.handleGlobalMouseUp)
  window.removeEventListener('keydown', events.handleKeyDown)
})
</script>

<template>
  <div class="piano-roll-editor">
    <PianoRollHeader
      ref="headerRef"
      :sections-in-view="sectionsInView"
      :chords-in-view="chordsInView"
      :current-chord="currentChord"
      :bar-width="viewport.barWidth.value"
      :current-duration="currentDuration"
      :zoom-level="viewport.zoomLevel.value"
      :is-playing="playback.isPlaying.value"
      :is-paused="playback.isPaused.value"
      :is-loading="playback.isLoading.value"
      :sound-enabled="soundEnabledRef"
      @update:current-duration="currentDuration = $event"
      @zoom-in="viewport.zoomIn(); emit('zoomChange', viewport.zoomLevel.value); redraw()"
      @zoom-out="viewport.zoomOut(); emit('zoomChange', viewport.zoomLevel.value); redraw()"
      @reset-zoom="viewport.resetZoom(); emit('zoomChange', viewport.zoomLevel.value); redraw()"
      @toggle-play="playback.togglePlay"
      @stop="playback.stop"
      @rewind="playback.rewind"
    />

    <!-- Main editor area -->
    <div class="editor-body" ref="editorBodyRef" @scroll="handleEditorScroll" @wheel="events.handleWheel">
      <PianoRollPianoKeys
        :hovered-note="interaction.hoveredNote.value"
        :vocal-range="viewport.vocalRange.value"
      />

      <!-- Layered Canvas Stack -->
      <div class="canvas-wrapper" ref="containerRef">
        <!-- Layer 1: Grid (static, bottom) -->
        <canvas ref="gridCanvasRef" class="editor-canvas grid-layer" />
        <!-- Layer 2: Notes (middle) -->
        <canvas ref="noteCanvasRef" class="editor-canvas note-layer" />
        <!-- Layer 3: Overlay (interactions, top) -->
        <canvas
          ref="overlayCanvasRef"
          class="editor-canvas overlay-layer"
          @mousemove="events.handleMouseMove"
          @mouseleave="events.handleMouseLeave"
          @mousedown="events.handleMouseDown"
          @mouseup="events.handleMouseUp"
          @click="events.handleClick"
          @dblclick="events.handleDoubleClick"
          @contextmenu="events.handleContextMenu"
        />
        <!-- CSS Playhead (draggable, smooth animation without canvas redraw) -->
        <PianoRollPlayhead
          :x="playheadDrag.playheadX.value"
          :is-dragging="playheadDrag.isDragging.value"
          @drag-start="playheadDrag.handleDragStart"
        />
        <!-- Note Tooltip -->
        <PianoRollTooltip
          :position="tooltipPosition"
          :pitch="interaction.hoveredNote.value"
          :safety="getNoteSafety(interaction.hoveredNote.value ?? 0)"
          :reason="getNoteReason(interaction.hoveredNote.value ?? 0)"
        />
      </div>
    </div>

    <PianoRollFooter
      :hovered-note="interaction.hoveredNote.value"
      :selected-count="interaction.selectedNoteIds.value.size"
      :zoom-level="viewport.zoomLevel.value"
      :total-bars="totalBarsRef"
      :note-count="placedNotes?.length ?? 0"
      :get-note-safety="getNoteSafety"
      :get-note-reason="getNoteReason"
    />

    <PianoRollContextMenu
      :show="interaction.showContextMenu.value"
      :position="interaction.contextMenuPosition.value"
      :selected-count="interaction.selectedNoteIds.value.size"
      :can-split="interaction.canSplitSelected.value"
      :can-merge="interaction.canMergeSelected.value"
      @close="interaction.closeContextMenu"
      @delete="contextMenuActions.deleteSelectedNotes"
      @set-duration="contextMenuActions.setSelectedNotesDuration"
      @split="contextMenuActions.splitSelectedNotes"
      @merge="contextMenuActions.mergeSelectedNotes"
    />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap');

.piano-roll-editor {
  --accent: #8B5CF6;
  --safe: #4ADE80;
  --warning: #FBBF24;
  --danger: #F87171;
  --surface: rgba(12, 12, 18, 0.98);
  --surface-elevated: rgba(22, 22, 32, 0.95);
  --border: rgba(139, 92, 246, 0.15);
  --text-primary: #FAFAFA;
  --text-secondary: rgba(250, 250, 250, 0.6);

  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  font-family: 'Outfit', sans-serif;
  position: relative;
  user-select: none;
}

/* Body - scrollable container */
.editor-body {
  display: flex;
  height: 400px;
  overflow: auto;
  position: relative;
}

.canvas-wrapper {
  flex-shrink: 0;
  position: relative;
}

/* Layered canvas stack */
.editor-canvas {
  display: block;
}

.editor-canvas.grid-layer,
.editor-canvas.note-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.editor-canvas.overlay-layer {
  position: relative;
  z-index: 1;
}
</style>
