<script setup lang="ts">
defineProps<{
  isPlaying: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()
</script>

<template>
  <button
    class="play-button"
    :class="[
      `play-button--${size || 'md'}`,
      { 'play-button--active': isPlaying }
    ]"
    :disabled="disabled"
    @click.stop="emit('toggle')"
  >
    <svg v-if="isPlaying" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
    </svg>
    <svg v-else viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7L8 5z"/>
    </svg>
  </button>
</template>

<style scoped>
.play-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--accent-rgb, 139, 92, 246), 0.15);
  border: 1px solid rgba(var(--accent-rgb, 139, 92, 246), 0.25);
  border-radius: 50%;
  color: rgb(var(--accent-rgb, 139, 92, 246));
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

/* Size variants */
.play-button--sm {
  width: 28px;
  height: 28px;
}

.play-button--sm svg {
  width: 12px;
  height: 12px;
}

.play-button--md {
  width: 36px;
  height: 36px;
}

.play-button--md svg {
  width: 14px;
  height: 14px;
}

.play-button--lg {
  width: 48px;
  height: 48px;
}

.play-button--lg svg {
  width: 20px;
  height: 20px;
}

/* Ring pulse effect */
.play-button::before {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid rgb(var(--accent-rgb, 139, 92, 246));
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s ease;
}

.play-button:hover:not(:disabled) {
  background: rgba(var(--accent-rgb, 139, 92, 246), 0.25);
  border-color: rgba(var(--accent-rgb, 139, 92, 246), 0.5);
  transform: scale(1.05);
}

.play-button:hover:not(:disabled)::before {
  opacity: 0.5;
  transform: scale(1);
}

.play-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Active (playing) state */
.play-button--active {
  background: linear-gradient(135deg, rgb(var(--accent-rgb, 139, 92, 246)), #EC4899);
  color: white;
  border-color: transparent;
  animation: play-active-pulse 1.5s ease-in-out infinite;
}

.play-button--active::before {
  opacity: 0;
}

.play-button--active:hover:not(:disabled) {
  transform: scale(1.05);
}

@keyframes play-active-pulse {
  0%, 100% {
    box-shadow:
      0 0 0 0 rgba(var(--accent-rgb, 139, 92, 246), 0.4),
      0 0 16px 0 rgba(var(--accent-rgb, 139, 92, 246), 0.3);
  }
  50% {
    box-shadow:
      0 0 0 4px rgba(var(--accent-rgb, 139, 92, 246), 0.1),
      0 0 24px 4px rgba(var(--accent-rgb, 139, 92, 246), 0.2);
  }
}
</style>
