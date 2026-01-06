import { ref, type Ref } from 'vue'

interface PlaybackState {
  wasPlaying: boolean
  wasPaused: boolean
  savedTick: number
}

interface PlayerMethods {
  isPlaying: Ref<boolean>
  isPaused: Ref<boolean>
  currentTick: Ref<number>
  stop: () => void
  play: (eventData: any, startTick?: number) => Promise<void>
}

/**
 * Composable for managing MIDI regeneration logic.
 * Provides utilities for playback state preservation, seed generation,
 * event data retrieval, and regeneration feedback.
 */
export function useMidiRegeneration(player: PlayerMethods) {
  const isGenerating = ref(false)
  const error = ref<string | null>(null)
  const justRegenerated = ref(false)

  /**
   * Generate a random seed for MIDI generation.
   */
  function generateSeed(): number {
    return Math.floor(Math.random() * 0xFFFFFFFF)
  }

  /**
   * Safely retrieve event data from a MidiSketch instance.
   * Returns null if getEvents() throws an error.
   */
  function safeGetEvents(instance: any): any | null {
    try {
      return instance.getEvents()
    } catch {
      return null
    }
  }

  /**
   * Show regeneration feedback for the specified duration.
   */
  function showFeedback(duration: number = 1500): void {
    justRegenerated.value = true
    setTimeout(() => {
      justRegenerated.value = false
    }, duration)
  }

  /**
   * Save current playback state before regeneration.
   */
  function savePlaybackState(): PlaybackState {
    return {
      wasPlaying: player.isPlaying.value,
      wasPaused: player.isPaused.value,
      savedTick: player.currentTick.value
    }
  }

  /**
   * Restore playback from saved state after regeneration.
   */
  async function restorePlayback(state: PlaybackState, eventData: any): Promise<void> {
    if (state.wasPlaying && eventData) {
      await player.play(eventData, state.savedTick)
    }
  }

  /**
   * Execute a regeneration function with automatic playback state preservation.
   * Handles:
   * - Saving playback state (playing, paused, position)
   * - Stopping playback before regeneration
   * - Setting isGenerating state
   * - Catching and storing errors
   * - Resuming playback after regeneration (if was playing)
   *
   * @param regenerateFn - The async function that performs the actual regeneration
   * @param getEventData - Function to retrieve current event data after regeneration
   * @returns The result of regenerateFn, or undefined if an error occurred
   */
  async function withPlaybackPreservation<T>(
    regenerateFn: () => Promise<T>,
    getEventData: () => any
  ): Promise<T | undefined> {
    // Save playback state
    const state = savePlaybackState()

    // Stop playback before regeneration
    if (state.wasPlaying || state.wasPaused) {
      player.stop()
    }

    isGenerating.value = true
    error.value = null

    try {
      const result = await regenerateFn()

      // Restore playback if was playing
      await restorePlayback(state, getEventData())

      return result
    } catch (e: any) {
      error.value = e.message
      return undefined
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Execute a regeneration function without playback preservation.
   * Useful for initial generation on mount.
   */
  async function withGenerationState<T>(
    regenerateFn: () => Promise<T>
  ): Promise<T | undefined> {
    isGenerating.value = true
    error.value = null

    try {
      return await regenerateFn()
    } catch (e: any) {
      error.value = e.message
      return undefined
    } finally {
      isGenerating.value = false
    }
  }

  return {
    // State
    isGenerating,
    error,
    justRegenerated,

    // Utilities
    generateSeed,
    safeGetEvents,
    showFeedback,

    // Playback preservation
    savePlaybackState,
    restorePlayback,
    withPlaybackPreservation,
    withGenerationState
  }
}
