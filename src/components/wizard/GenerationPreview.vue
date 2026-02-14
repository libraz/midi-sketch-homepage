<script setup lang="ts">
import PianoRoll from '@/components/PianoRoll.vue'
import TransportBar from './TransportBar.vue'
import type { ChordTiming } from '@/utils/chordUtils'

// Props
defineProps<{
  eventData: any
  currentTick: number
  isPlaying: boolean
  isPaused: boolean
  isSoundfontLoading: boolean
  isSoundfontReady: boolean
  justRegenerated: boolean
  title: string
  regeneratedText: string
  loadingAudioText: string
  rewindTitle?: string
  chordProgression?: string  // e.g., "I - V - vi - IV"
  musicKey?: number          // 0-11 (0=C)
  playRootNotes?: boolean    // Enable root note playback (default: false)
  precomputedChordTimings?: ChordTiming[]  // Pre-computed timings (overrides chordProgression)
}>()

// Emits
const emit = defineEmits<{
  (e: 'seek', tick: number): void
  (e: 'toggle-play'): void
  (e: 'rewind'): void
  (e: 'track-mute-change', payload: { track: string; muted: boolean }): void
}>()

function handleSeek(tick: number) {
  emit('seek', tick)
}

function handleTrackMuteChange(payload: { track: string; muted: boolean }) {
  emit('track-mute-change', payload)
}
</script>

<template>
  <div class="generation-preview" :class="{ 'generation-preview--regenerated': justRegenerated }">
    <!-- Regenerated Indicator -->
    <Transition name="regen-badge">
      <div v-if="justRegenerated" class="regenerated-badge">
        <span class="regenerated-badge__icon">✓</span>
        <span>{{ regeneratedText }}</span>
      </div>
    </Transition>

    <div class="preview-header">
      <h3 class="preview-title">{{ title }}</h3>
      <div class="player-controls">
        <!-- Soundfont loading indicator -->
        <div v-if="isSoundfontLoading" class="soundfont-loading">
          <div class="soundfont-loading__spinner"></div>
          <span class="soundfont-loading__text">{{ loadingAudioText }}</span>
        </div>
        <template v-else>
          <TransportBar
            :is-playing="isPlaying"
            :is-paused="isPaused"
            :disabled="!isSoundfontReady"
            :show-rewind="true"
            @toggle-play="emit('toggle-play')"
            @rewind="emit('rewind')"
          />
        </template>
      </div>
    </div>
    <PianoRoll
      :events="eventData"
      :current-tick="currentTick"
      :is-playing="isPlaying"
      :chord-progression="chordProgression"
      :music-key="musicKey"
      :precomputed-chord-timings="precomputedChordTimings"
      @seek="handleSeek"
      @track-mute-change="handleTrackMuteChange"
    />
  </div>
</template>

<style scoped>
.generation-preview {
  position: relative;
  margin-bottom: 1rem;
  border-radius: 12px;
  transition: box-shadow 0.3s ease;
}

.generation-preview--regenerated {
  animation: regenPulse 0.6s ease-out;
}

@keyframes regenPulse {
  0% {
    box-shadow:
      0 0 0 0 rgba(var(--accent-rgb, 139, 92, 246), 0.4),
      0 0 30px 0 rgba(var(--accent-rgb, 139, 92, 246), 0.3);
  }
  50% {
    box-shadow:
      0 0 0 8px rgba(var(--accent-rgb, 139, 92, 246), 0),
      0 0 50px 10px rgba(var(--accent-rgb, 139, 92, 246), 0.2);
  }
  100% {
    box-shadow:
      0 0 0 0 rgba(var(--accent-rgb, 139, 92, 246), 0),
      0 0 0 0 rgba(var(--accent-rgb, 139, 92, 246), 0);
  }
}

/* Regenerated Badge */
.regenerated-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, rgba(var(--accent-rgb, 139, 92, 246), 0.95), rgba(var(--accent-dark-rgb, 124, 58, 237), 0.95));
  border-radius: 100px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  box-shadow:
    0 8px 32px -4px rgba(var(--accent-rgb, 139, 92, 246), 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset;
  backdrop-filter: blur(8px);
}

.regenerated-badge__icon {
  font-size: 1.1rem;
}

/* Badge transition */
.regen-badge-enter-active {
  animation: badgeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.regen-badge-leave-active {
  animation: badgeOut 0.25s ease-in forwards;
}

@keyframes badgeIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes badgeOut {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9) translateY(-10px);
  }
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.preview-title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.7);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.player-controls {
  display: flex;
  align-items: center;
}

/* Soundfont loading indicator */
.soundfont-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(var(--accent-rgb, 139, 92, 246), 0.1);
  border: 1px solid rgba(var(--accent-rgb, 139, 92, 246), 0.2);
  border-radius: 8px;
}

.soundfont-loading__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(var(--accent-rgb, 139, 92, 246), 0.3);
  border-top-color: rgb(var(--accent-rgb, 139, 92, 246));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.soundfont-loading__text {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.7);
}

@media (max-width: 640px) {
  .preview-header {
    padding: 0 1rem;
  }
}
</style>
