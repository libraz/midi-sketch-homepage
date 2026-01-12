import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { PPQ, PIXELS_PER_BAR_BASE, TOTAL_NOTES, NOTE_HEIGHT_PX, MIN_NOTE, MAX_NOTE } from '@/components/PianoRollEditor/types'

// ============================================================================
// Viewport Composable - Handles zoom, scroll, and coordinate transformations
// ============================================================================

export interface UseViewportOptions {
  totalBars: Ref<number>
  gridSnap: Ref<number>
  vocalLow: Ref<number>
  vocalHigh: Ref<number>
}

export interface ViewportState {
  zoomLevel: Ref<number>
  canvasWidth: Ref<number>
  canvasHeight: Ref<number>
  dpr: Ref<number>
}

export interface ViewportComputed {
  totalTicks: ComputedRef<number>
  pixelsPerTick: ComputedRef<number>
  contentWidth: ComputedRef<number>
  barWidth: ComputedRef<number>
  noteHeight: ComputedRef<number>
  totalEditorHeight: ComputedRef<number>
  vocalRange: ComputedRef<{ low: number; high: number }>
}

export interface ViewportMethods {
  noteToY: (pitch: number) => number
  yToNote: (y: number) => number
  tickToX: (tick: number) => number
  xToTick: (x: number) => number
  snapToGrid: (tick: number) => number
  isInVocalRange: (pitch: number) => boolean
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  scrollToBar: (bar: number, editorBodyRef: HTMLElement | null) => void
  handleWheel: (e: WheelEvent, editorBodyRef: HTMLElement | null) => void
  setupCanvas: (canvas: HTMLCanvasElement | null) => void
}

export function useViewport(options: UseViewportOptions): ViewportState & ViewportComputed & ViewportMethods {
  const { totalBars, gridSnap, vocalLow, vocalHigh } = options

  // Zoom state
  const zoomLevel = ref(1.0)
  const MIN_ZOOM = 0.25
  const MAX_ZOOM = 4.0
  const ZOOM_STEP = 0.1

  // Canvas dimensions
  const canvasWidth = ref(400)
  const canvasHeight = ref(300)
  const dpr = ref(1)

  // Computed values
  const totalTicks = computed(() => totalBars.value * 4 * PPQ)
  const pixelsPerTick = computed(() => (PIXELS_PER_BAR_BASE * zoomLevel.value) / (4 * PPQ))
  const contentWidth = computed(() => Math.max(400, totalBars.value * PIXELS_PER_BAR_BASE * zoomLevel.value + 16))
  const barWidth = computed(() => PIXELS_PER_BAR_BASE * zoomLevel.value)
  const noteHeight = computed(() => NOTE_HEIGHT_PX)
  const totalEditorHeight = computed(() => TOTAL_NOTES * NOTE_HEIGHT_PX)
  const vocalRange = computed(() => ({
    low: Math.max(vocalLow.value, MIN_NOTE),
    high: Math.min(vocalHigh.value, MAX_NOTE),
  }))

  // Coordinate transformation methods
  function noteToY(pitch: number): number {
    return (MAX_NOTE - pitch) * noteHeight.value
  }

  function yToNote(y: number): number {
    return MAX_NOTE - Math.floor(y / noteHeight.value)
  }

  function tickToX(tick: number): number {
    return 8 + tick * pixelsPerTick.value
  }

  function xToTick(x: number): number {
    return Math.max(0, (x - 8) / pixelsPerTick.value)
  }

  function snapToGrid(tick: number): number {
    return Math.floor(tick / gridSnap.value) * gridSnap.value
  }

  function isInVocalRange(pitch: number): boolean {
    return pitch >= vocalRange.value.low && pitch <= vocalRange.value.high
  }

  // Zoom methods
  function zoomIn() {
    zoomLevel.value = Math.min(MAX_ZOOM, zoomLevel.value + ZOOM_STEP * 2)
  }

  function zoomOut() {
    zoomLevel.value = Math.max(MIN_ZOOM, zoomLevel.value - ZOOM_STEP * 2)
  }

  function resetZoom() {
    zoomLevel.value = 1.0
  }

  function scrollToBar(bar: number, editorBodyRef: HTMLElement | null) {
    if (!editorBodyRef) return
    const barStartX = (bar - 1) * PIXELS_PER_BAR_BASE * zoomLevel.value
    editorBodyRef.scrollLeft = Math.max(0, barStartX)
  }

  function handleWheel(e: WheelEvent, editorBodyRef: HTMLElement | null) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel.value + delta))

      // Zoom towards mouse position
      if (editorBodyRef && newZoom !== zoomLevel.value) {
        const rect = editorBodyRef.getBoundingClientRect()
        const mouseX = e.clientX - rect.left + editorBodyRef.scrollLeft
        const ratio = mouseX / (canvasWidth.value || 1)

        zoomLevel.value = newZoom

        // Adjust scroll to keep mouse position stable
        requestAnimationFrame(() => {
          if (editorBodyRef) {
            const newWidth = contentWidth.value
            editorBodyRef.scrollLeft = ratio * newWidth - (e.clientX - rect.left)
          }
        })
      }
    }
  }

  function setupCanvas(canvas: HTMLCanvasElement | null) {
    if (!canvas) return

    dpr.value = window.devicePixelRatio || 1

    // Canvas width is based on content (total bars), not container
    canvasWidth.value = contentWidth.value
    canvasHeight.value = totalEditorHeight.value

    canvas.width = canvasWidth.value * dpr.value
    canvas.height = canvasHeight.value * dpr.value
    canvas.style.width = `${canvasWidth.value}px`
    canvas.style.height = `${canvasHeight.value}px`
  }

  return {
    // State
    zoomLevel,
    canvasWidth,
    canvasHeight,
    dpr,

    // Computed
    totalTicks,
    pixelsPerTick,
    contentWidth,
    barWidth,
    noteHeight,
    totalEditorHeight,
    vocalRange,

    // Methods
    noteToY,
    yToNote,
    tickToX,
    xToTick,
    snapToGrid,
    isInVocalRange,
    zoomIn,
    zoomOut,
    resetZoom,
    scrollToBar,
    handleWheel,
    setupCanvas,
  }
}
