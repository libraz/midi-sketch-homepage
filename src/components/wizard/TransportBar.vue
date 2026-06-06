<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  isPlaying: boolean
  isPaused?: boolean
  disabled?: boolean
  showRewind?: boolean
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
      @click="handleRewindClick"
      :disabled="disabled"
    >
      <span class="btn-ripple"></span>
      <span class="btn-glow"></span>
      <svg class="btn-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/>
      </svg>
    </button>

    <!-- Play/Pause Button -->
    <button
      class="transport-btn transport-btn--play"
      :class="{
        'transport-btn--active': isPlaying,
        'transport-btn--paused': isPaused,
        'transport-btn--rippling': isPlayRippling
      }"
      @click="handlePlayClick"
      :disabled="disabled"
    >
      <!-- Animated rings for playing state -->
      <div class="play-rings" v-if="isPlaying">
        <span class="play-ring play-ring--1"></span>
        <span class="play-ring play-ring--2"></span>
        <span class="play-ring play-ring--3"></span>
      </div>

      <span class="btn-ripple"></span>
      <span class="btn-glow btn-glow--play"></span>

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
  --accent-alpha: rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.15);
  --pink: var(--studio-pink);
  --bg-dark: rgba(var(--studio-panel-deep-rgb), 0.9);

  display: flex;
  align-items: center;
  background: var(--bg-dark);
  border: 1px solid var(--accent-alpha);
  border-radius: 28px;
  padding: 4px;
  gap: 4px;
  backdrop-filter: blur(12px);
  box-shadow:
    0 4px 16px var(--studio-shadow-strong),
    inset 0 1px 0 rgba(var(--studio-ink-rgb), 0.04);
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
    color 0.2s ease,
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.25s ease;
  -webkit-tap-highlight-color: transparent;
}

.transport-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none !important;
}

/* Rewind button */
.transport-btn--rewind {
  width: 36px;
  height: 36px;
}

/* Play button */
.transport-btn--play {
  width: 44px;
  height: 44px;
  color: var(--studio-text-primary);
}

/* Hover states */
.transport-btn:hover:not(:disabled) {
  color: var(--studio-text-primary);
  transform: scale(1.08);
}

.transport-btn--rewind:hover:not(:disabled) {
  box-shadow: 0 0 20px rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.3);
}

.transport-btn--play:hover:not(:disabled) {
  box-shadow: 0 0 24px rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.4);
}

/* Active press */
.transport-btn:active:not(:disabled) {
  transform: scale(0.92);
  transition-duration: 0.08s;
}

/* Icon */
.btn-icon {
  position: relative;
  z-index: 2;
  fill: currentColor;
  transition: transform 0.2s ease;
}

/* Icon container for morphing */
.icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  z-index: 2;
}

/* Morphing icons */
.btn-icon--morphing {
  position: absolute;
  width: 16px;
  height: 16px;
  opacity: 0;
  transform: scale(0.6) rotate(-120deg);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.btn-icon--morphing.btn-icon--visible {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}

/* Play triangle micro-animation */
.play-triangle {
  transition: transform 0.2s ease;
}

.transport-btn--play:hover:not(:disabled):not(.transport-btn--active) .btn-icon--visible .play-triangle {
  transform: translateX(1px);
}

/* Pause bars equalizer animation */
.pause-bar {
  transform-origin: center;
}

.transport-btn--active .pause-bar--left {
  animation: eqLeft 0.6s ease-in-out infinite;
}

.transport-btn--active .pause-bar--right {
  animation: eqRight 0.6s ease-in-out infinite;
  animation-delay: 0.08s;
}

@keyframes eqLeft {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.65); }
}

@keyframes eqRight {
  0%, 100% { transform: scaleY(0.65); }
  50% { transform: scaleY(1); }
}

/* Ripple effect */
.btn-ripple {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(var(--studio-ink-rgb), 0.5) 0%, rgba(var(--studio-ink-rgb), 0) 70%);
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
}

.transport-btn--rippling .btn-ripple {
  animation: ripple 0.5s ease-out forwards;
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

/* Glow effect */
.btn-glow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0;
  filter: blur(10px);
  z-index: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.btn-glow--play {
  background: linear-gradient(135deg, var(--accent), var(--pink));
}

.transport-btn:hover:not(:disabled) .btn-glow {
  opacity: 0.35;
}

/* Playing rings */
.play-rings {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.play-ring {
  position: absolute;
  inset: -3px;
  border: 2px solid var(--accent);
  border-radius: 50%;
  opacity: 0;
}

.play-ring--1 { animation: ringPulse 1.8s ease-out infinite; }
.play-ring--2 { animation: ringPulse 1.8s ease-out infinite 0.5s; }
.play-ring--3 { animation: ringPulse 1.8s ease-out infinite 1s; }

@keyframes ringPulse {
  0% {
    opacity: 0.6;
    transform: scale(0.95);
    border-color: var(--accent);
  }
  60% {
    border-color: var(--pink);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
    border-color: var(--pink);
  }
}

/* Active (playing) state */
.transport-btn--active {
  background: linear-gradient(135deg, var(--accent), var(--pink));
  color: var(--studio-on-accent);
  box-shadow:
    0 0 20px rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.5),
    0 0 40px rgba(var(--studio-pink-rgb), 0.2);
}

.transport-btn--active .btn-glow {
  opacity: 0.5;
  animation: glowBreathe 1.2s ease-in-out infinite;
}

@keyframes glowBreathe {
  0%, 100% {
    opacity: 0.4;
    filter: blur(10px);
  }
  50% {
    opacity: 0.6;
    filter: blur(14px);
  }
}

.transport-btn--active:hover:not(:disabled) {
  box-shadow:
    0 0 28px rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.6),
    0 0 50px rgba(var(--studio-pink-rgb), 0.25);
}

/* Paused state */
.transport-btn--paused {
  background: rgba(var(--studio-pink-rgb), 0.25);
}

.transport-btn--paused:hover:not(:disabled) {
  background: rgba(var(--studio-pink-rgb), 0.35);
}
</style>
