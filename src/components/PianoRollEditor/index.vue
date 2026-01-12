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
import { useCanvasDrawing } from './composables/useCanvasDrawing'
import { useClipboard } from './composables/useClipboard'
import { useContextMenuActions } from './composables/useContextMenuActions'
import { usePlaybackControl } from './composables/usePlaybackControl'
import { useEditorEvents } from './composables/useEditorEvents'
import PianoRollHeader from './PianoRollHeader.vue'
import PianoRollPianoKeys from './PianoRollPianoKeys.vue'
import PianoRollFooter from './PianoRollFooter.vue'
import PianoRollContextMenu from './PianoRollContextMenu.vue'

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
}>()

// ============================================================================
// Refs
// ============================================================================

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const editorBodyRef = ref<HTMLElement | null>(null)
const headerRef = ref<InstanceType<typeof PianoRollHeader> | null>(null)
const currentDuration = ref(480)

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

const { draw } = useCanvasDrawing()

const clipboard = useClipboard({
  placedNotes: placedNotesRef,
  selectedNoteIds: interaction.selectedNoteIds,
  snapToGrid: viewport.snapToGrid,
})

// ============================================================================
// Drawing
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

function redraw() {
  draw({
    canvas: canvasRef.value,
    editorBody: editorBodyRef.value,
    canvasWidth: viewport.canvasWidth,
    canvasHeight: viewport.canvasHeight,
    dpr: viewport.dpr,
    zoomLevel: viewport.zoomLevel,
    totalTicks: viewport.totalTicks,
    pixelsPerTick: viewport.pixelsPerTick,
    gridSnap: gridSnapRef,
    noteHeight: viewport.noteHeight,
    vocalRange: viewport.vocalRange,
    placedNotes: props.placedNotes,
    safetyInfo: props.safetyInfo,
    chordsInView: props.chordsInView,
    showSafetyAlways: props.showSafetyAlways,
    getSafetyAtTick: props.getSafetyAtTick,
    currentChord: currentChord.value,
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
    playheadTick: playback.playheadTick,
  })
}

// ============================================================================
// Playback Control
// ============================================================================

const playback = usePlaybackControl({
  placedNotes: placedNotesRef,
  totalBars: totalBarsRef,
  bpm: bpmRef,
  soundEnabled: soundEnabledRef,
  tickToX: viewport.tickToX,
  editorBodyRef,
  onRedraw: redraw,
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
// Event Handlers
// ============================================================================

const events = useEditorEvents(
  {
    canvasRef,
    editorBodyRef,
    placedNotes: placedNotesRef,
    gridSnap: gridSnapRef,
    soundEnabled: soundEnabledRef,
    viewport,
    interaction,
    clipboard,
    onRedraw: redraw,
    playNotePreview: playback.playNotePreview,
    togglePlay: playback.togglePlay,
  },
  {
    onNoteHover: (pitch) => emit('noteHover', pitch),
    onNoteClick: (pitch, tick) => emit('noteClick', pitch, tick),
    onNoteDelete: (noteId) => emit('noteDelete', noteId),
    onNoteMove: (noteId, pitch, tick) => emit('noteMove', noteId, pitch, tick),
    onNoteDurationChange: (noteId, duration) => emit('noteDurationChange', noteId, duration),
    onNoteSplit: (noteId, splitTick) => emit('noteSplit', noteId, splitTick),
    onNoteAdd: (note) => emit('noteAdd', note),
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
// Scroll Sync
// ============================================================================

function handleEditorScroll() {
  if (editorBodyRef.value) {
    const scrollLeft = editorBodyRef.value.scrollLeft
    if (headerRef.value?.sectionBarRef) {
      headerRef.value.sectionBarRef.scrollLeft = scrollLeft
    }
    if (headerRef.value?.chordBarRef) {
      headerRef.value.chordBarRef.scrollLeft = scrollLeft
    }
    redraw()
  }
}

// ============================================================================
// Setup & Lifecycle
// ============================================================================

function setupCanvas() {
  viewport.setupCanvas(canvasRef.value)
  redraw()
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
})

// ============================================================================
// Watchers
// ============================================================================

watch([
  () => props.safetyInfo,
  () => props.placedNotes,
  () => props.previewPitch,
  () => props.showSafetyAlways,
  interaction.hoveredNote,
  interaction.hoveredNoteId,
  interaction.selectedNoteIds,
  interaction.isSelecting,
], () => {
  redraw()
}, { deep: true })

watch([viewport.zoomLevel, totalBarsRef], () => {
  setupCanvas()
})

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  setupCanvas()
  window.addEventListener('resize', setupCanvas)
  window.addEventListener('click', events.handleGlobalClick)
  window.addEventListener('mouseup', events.handleGlobalMouseUp)
  window.addEventListener('keydown', events.handleKeyDown)

  if (soundEnabledRef.value) {
    playback.preload()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', setupCanvas)
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
      @zoom-in="viewport.zoomIn(); redraw()"
      @zoom-out="viewport.zoomOut(); redraw()"
      @reset-zoom="viewport.resetZoom(); redraw()"
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

      <!-- Canvas -->
      <div class="canvas-wrapper" ref="containerRef">
        <canvas
          ref="canvasRef"
          class="editor-canvas"
          @mousemove="events.handleMouseMove"
          @mouseleave="events.handleMouseLeave"
          @mousedown="events.handleMouseDown"
          @mouseup="events.handleMouseUp"
          @click="events.handleClick"
          @dblclick="events.handleDoubleClick"
          @contextmenu="events.handleContextMenu"
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

.editor-canvas {
  display: block;
}
</style>
