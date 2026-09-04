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
  precomputedChordTimings?: ChordTiming[]  // Pre-computed timings (overrides chordProgression)
  playRootNotes?: boolean    // Enable root note playback (default: false)
  disabled?: boolean         // Disable transport controls (e.g. while regenerating)
  mutedTracks?: Record<string, boolean>  // Mute flags owned by the transport
  playLabel: string
  pauseLabel: string
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
        <!-- The transport keeps its slot while the sound engine loads; only its
             state changes, so the header never reflows mid-load. -->
        <span v-if="isSoundfontLoading" class="soundfont-loading__text">
          {{ loadingAudioText }}
        </span>
        <TransportBar
          :is-playing="isPlaying"
          :is-paused="isPaused"
          :busy="isSoundfontLoading"
          :disabled="!isSoundfontReady || isSoundfontLoading || disabled"
          :show-rewind="true"
          :play-label="playLabel"
          :pause-label="pauseLabel"
          :rewind-label="rewindTitle || ''"
          @toggle-play="emit('toggle-play')"
          @rewind="emit('rewind')"
        />
      </div>
    </div>
    <PianoRoll
      :events="eventData"
      :current-tick="currentTick"
      :is-playing="isPlaying"
      :chord-progression="chordProgression"
      :music-key="musicKey"
      :precomputed-chord-timings="precomputedChordTimings"
      :muted-tracks="mutedTracks"
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
      0 0 0 0 rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.4),
      0 0 30px 0 rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.3);
  }
  50% {
    box-shadow:
      0 0 0 8px rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0),
      0 0 50px 10px rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.2);
  }
  100% {
    box-shadow:
      0 0 0 0 rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0),
      0 0 0 0 rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0);
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
  /* Darker gradient stop falls back to the brand purple-700 so the badge keeps
     its saturated two-stop look when no --accent-dark-rgb is supplied. */
  background: linear-gradient(135deg, rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.95), rgba(var(--accent-dark-rgb, 124, 58, 237), 0.95));
  border-radius: 100px;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--studio-on-accent);
  box-shadow:
    0 8px 32px -4px rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.5),
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
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(var(--studio-ink-rgb), 0.7);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.soundfont-loading__text {
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(var(--studio-ink-rgb), 0.55);
}

@media (max-width: 640px) {
  .preview-header {
    padding: 0 1rem;
  }
}
</style>
