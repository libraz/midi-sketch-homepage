<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  isPlaying: boolean
  isPaused?: boolean
  disabled?: boolean
  showRewind?: boolean
  /** Loading the sound engine: the transport stays put but cannot be pressed. */
  busy?: boolean
  playLabel: string
  pauseLabel: string
  rewindLabel: string
}>()

const emit = defineEmits<{
  (e: 'toggle-play'): void
  (e: 'rewind'): void
}>()

const isPlayRippling = ref(false)
const isRewindRippling = ref(false)

function handlePlayClick() {
  isPlayRippling.value = true
  setTimeout(() => isPlayRippling.value = false, 500)
  emit('toggle-play')
}

function handleRewindClick() {
  isRewindRippling.value = true
  setTimeout(() => isRewindRippling.value = false, 500)
  emit('rewind')
}
</script>

<template>
  <div class="transport-bar">
    <!-- Rewind Button -->
    <button
      v-if="showRewind !== false"
      class="transport-btn transport-btn--rewind"
      :class="{ 'transport-btn--rippling': isRewindRippling }"
      :aria-label="rewindLabel"
      :title="rewindLabel"
      @click="handleRewindClick"
      :disabled="disabled"
    >
      <span class="btn-ripple"></span>
      <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/>
      </svg>
    </button>

    <!-- Play/Pause Button -->
    <button
      class="transport-btn transport-btn--play"
      :class="{
        'transport-btn--active': isPlaying,
        'transport-btn--paused': isPaused,
        'transport-btn--busy': busy,
        'transport-btn--rippling': isPlayRippling
      }"
      :aria-label="isPlaying ? pauseLabel : playLabel"
      :title="isPlaying ? pauseLabel : playLabel"
      @click="handlePlayClick"
      :disabled="disabled"
    >
      <!-- Sound engine still loading: the button holds its place and spins -->
      <span v-if="busy" class="transport-btn__busy" aria-hidden="true"></span>

      <span class="btn-ripple"></span>

      <!-- Icon container -->
      <span class="icon-wrap">
        <!-- Pause icon -->
        <svg
          class="btn-icon btn-icon--morphing"
          :class="{ 'btn-icon--visible': isPlaying }"
          viewBox="0 0 24 24"
        >
          <rect class="pause-bar pause-bar--left" x="6" y="4" width="4" height="16" rx="1" />
          <rect class="pause-bar pause-bar--right" x="14" y="4" width="4" height="16" rx="1" />
        </svg>

        <!-- Play icon -->
        <svg
          class="btn-icon btn-icon--morphing"
          :class="{ 'btn-icon--visible': !isPlaying }"
          viewBox="0 0 24 24"
        >
          <path class="play-triangle" d="M8 5v14l11-7L8 5z" />
        </svg>
      </span>
    </button>
  </div>
</template>

<style scoped>
.transport-bar {
  --accent: rgb(var(--accent-rgb, var(--studio-purple-rgb)));

  display: flex;
  align-items: center;
  gap: 6px;
}

/* Base button style */
.transport-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: rgba(var(--studio-ink-rgb), 0.7);
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  transition:
    color 0.15s ease,
    background-color 0.2s ease,
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.25s ease;
  -webkit-tap-highlight-color: transparent;
}

.transport-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

.transport-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Rewind: a quiet secondary control */
.transport-btn--rewind {
  width: 40px;
  height: 40px;
  background: rgba(var(--studio-ink-rgb), 0.05);
  border: 1px solid rgba(var(--studio-ink-rgb), 0.08);
}

.transport-btn--rewind:hover:not(:disabled) {
  color: var(--studio-text-primary);
  background: rgba(var(--studio-ink-rgb), 0.09);
}

/* Play: the primary control, always filled */
.transport-btn--play {
  width: 52px;
  height: 52px;
  color: var(--studio-on-accent);
  background: var(--accent);
  box-shadow: 0 8px 20px -8px rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.7);
}

.transport-btn--play:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 10px 26px -8px rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.8);
}

/* Active press */
.transport-btn:active:not(:disabled) {
  transform: scale(0.94);
  transition-duration: 0.06s;
}

/* Icon */
.btn-icon {
  position: relative;
  z-index: 2;
  fill: currentColor;
}

/* Icon container for the play/pause cross-fade */
.icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  z-index: 2;
}

.btn-icon--morphing {
  position: absolute;
  width: 20px;
  height: 20px;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.15s ease, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.btn-icon--morphing.btn-icon--visible {
  opacity: 1;
  transform: scale(1);
}

/* Pause bars: a gentle level meter while playing */
.pause-bar {
  transform-origin: center;
}

.transport-btn--active .pause-bar--left {
  animation: eqLeft 0.9s ease-in-out infinite;
}

.transport-btn--active .pause-bar--right {
  animation: eqRight 0.9s ease-in-out infinite;
}

@keyframes eqLeft {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.75); }
}

@keyframes eqRight {
  0%, 100% { transform: scaleY(0.75); }
  50% { transform: scaleY(1); }
}

/* Press ripple */
.btn-ripple {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 70%);
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
}

.transport-btn--rewind .btn-ripple {
  background: radial-gradient(circle at center, rgba(var(--studio-ink-rgb), 0.25) 0%, rgba(var(--studio-ink-rgb), 0) 70%);
}

.transport-btn--rippling .btn-ripple {
  animation: ripple 0.45s ease-out forwards;
}

@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* Playing: a soft halo around the filled button */
.transport-btn--active {
  box-shadow:
    0 0 0 4px rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.18),
    0 8px 20px -8px rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.7);
}

.transport-btn--active:hover:not(:disabled) {
  box-shadow:
    0 0 0 5px rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.22),
    0 10px 26px -8px rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.8);
}

/* Busy (sound engine loading) */
.transport-btn--busy .icon-wrap {
  opacity: 0.3;
}

.transport-btn__busy {
  position: absolute;
  inset: 8px;
  z-index: 3;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--studio-on-accent);
  border-radius: 50%;
  animation: transport-busy-spin 0.8s linear infinite;
  pointer-events: none;
}

@keyframes transport-busy-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .transport-btn__busy {
    animation-duration: 2.4s;
  }

  .transport-btn--active .pause-bar--left,
  .transport-btn--active .pause-bar--right {
    animation: none;
  }

  .transport-btn--rippling .btn-ripple {
    animation: none;
  }
}
</style>
