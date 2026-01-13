import { ref, type Ref, onUnmounted } from 'vue'

export interface UsePlayheadDragOptions {
  editorBodyRef: Ref<HTMLElement | null>
  tickToX: (tick: number) => number
  xToTick: (x: number) => number
  snapToGrid: (tick: number) => number
  totalTicks: Ref<number>
  isPlaying: Ref<boolean>
  stop: () => void
  seek: (tick: number) => void
  suspendScrollFollow: () => void
}

export function usePlayheadDrag(options: UsePlayheadDragOptions) {
  const {
    editorBodyRef,
    tickToX,
    xToTick,
    snapToGrid,
    totalTicks,
    isPlaying,
    stop,
    seek,
    suspendScrollFollow,
  } = options

  const isDragging = ref(false)
  const playheadX = ref<number | null>(null)

  let lastDraggedTick = 0

  function handleDragStart(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    isDragging.value = true

    // Stop playback when starting to drag
    if (isPlaying.value) {
      stop()
    }

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', handleDragEnd)
  }

  function handleDrag(e: MouseEvent) {
    if (!isDragging.value || !editorBodyRef.value) return

    const rect = editorBodyRef.value.getBoundingClientRect()
    const scrollLeft = editorBodyRef.value.scrollLeft
    const x = e.clientX - rect.left + scrollLeft - 40 // 40 = piano keys width

    // Convert x to tick and clamp
    const tick = Math.max(0, Math.min(xToTick(x), totalTicks.value))
    const snappedTick = snapToGrid(tick)

    // Update playhead position visually
    playheadX.value = tickToX(snappedTick)
    lastDraggedTick = snappedTick
  }

  function handleDragEnd() {
    // Seek to the dragged position
    seek(lastDraggedTick)
    // Suspend scroll follow until playhead exits right edge
    suspendScrollFollow()

    isDragging.value = false
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', handleDragEnd)
  }

  // Update playhead position (called when playback tick changes)
  function updatePosition(tick: number | null) {
    if (tick === null) {
      playheadX.value = null
    } else {
      playheadX.value = tickToX(tick)
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', handleDragEnd)
  })

  return {
    isDragging,
    playheadX,
    handleDragStart,
    updatePosition,
  }
}
