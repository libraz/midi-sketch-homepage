import { ref, computed } from 'vue'

/**
 * Composable for managing seed-based generation history.
 * Enables undo/redo functionality for deterministic generation.
 */
export function useSeedHistory() {
  const history = ref<number[]>([])
  const currentIndex = ref(-1)

  const canUndo = computed(() => currentIndex.value > 0)
  const canRedo = computed(() => currentIndex.value < history.value.length - 1)
  const currentSeed = computed(() =>
    currentIndex.value >= 0 ? history.value[currentIndex.value] : null
  )
  const historyLength = computed(() => history.value.length)

  /**
   * Generate a new random seed
   */
  function generateSeed(): number {
    return Math.floor(Math.random() * 0xFFFFFFFF)
  }

  /**
   * Add a new seed to history (used when regenerating)
   * Clears any redo history after current position
   */
  function pushSeed(seed?: number): number {
    const newSeed = seed ?? generateSeed()

    // Clear history after current position (discard redo stack)
    history.value = history.value.slice(0, currentIndex.value + 1)

    // Add new seed
    history.value.push(newSeed)
    currentIndex.value = history.value.length - 1

    return newSeed
  }

  /**
   * Initialize history with a seed (used on first generation)
   */
  function initWithSeed(seed: number): void {
    if (history.value.length === 0) {
      history.value.push(seed)
      currentIndex.value = 0
    }
  }

  /**
   * Go back to previous seed (undo)
   * Returns the seed to use, or null if can't undo
   */
  function undo(): number | null {
    if (!canUndo.value) return null
    currentIndex.value--
    return history.value[currentIndex.value]
  }

  /**
   * Go forward to next seed (redo)
   * Returns the seed to use, or null if can't redo
   */
  function redo(): number | null {
    if (!canRedo.value) return null
    currentIndex.value++
    return history.value[currentIndex.value]
  }

  /**
   * Clear all history
   */
  function clear(): void {
    history.value = []
    currentIndex.value = -1
  }

  return {
    // State
    history,
    currentIndex,
    currentSeed,
    historyLength,

    // Computed
    canUndo,
    canRedo,

    // Actions
    generateSeed,
    pushSeed,
    initWithSeed,
    undo,
    redo,
    clear
  }
}
