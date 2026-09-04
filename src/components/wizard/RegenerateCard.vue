<script setup lang="ts">
// Props
defineProps<{
  canUndo: boolean
  canRedo: boolean
  isGenerating: boolean
  label: string
  undoTitle?: string
  redoTitle?: string
  color?: 'orange' | 'pink' | 'purple' | 'green' | 'blue'
}>()

// Emits
const emit = defineEmits<{
  (e: 'regenerate'): void
  (e: 'undo'): void
  (e: 'redo'): void
}>()
</script>

<template>
  <div
    class="regen-card"
    :class="[`regen-card--${color || 'orange'}`, { 'regen-card--busy': isGenerating }]"
  >
    <button
      class="history-inline history-inline--undo"
      :disabled="!canUndo || isGenerating"
      @click="emit('undo')"
      :title="undoTitle"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
      </svg>
    </button>
    <button
      class="regen-main"
      :disabled="isGenerating"
      @click="emit('regenerate')"
    >
      <svg class="regen-main__icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>
      <span>{{ label }}</span>
    </button>
    <button
      class="history-inline history-inline--redo"
      :disabled="!canRedo || isGenerating"
      @click="emit('redo')"
      :title="redoTitle"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.4 10.6C16.55 9 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* Shuffling a seed is an exploratory move, not the page's primary action. The
   card therefore reads as a tinted control that carries its accent through the
   border and the label, leaving the saturated fills to the transport and the
   apply CTA. */
.regen-card {
  --regen-accent: var(--studio-purple);
  --regen-accent-rgb: var(--studio-purple-rgb);

  display: flex;
  align-items: stretch;
  border: 1px solid rgba(var(--regen-accent-rgb), 0.28);
  border-radius: 12px;
  background: color-mix(in srgb, var(--regen-accent) 8%, transparent);
  overflow: hidden;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.regen-card:not(.regen-card--busy):hover {
  border-color: rgba(var(--regen-accent-rgb), 0.55);
  background: color-mix(in srgb, var(--regen-accent) 13%, transparent);
  box-shadow: 0 6px 20px -12px rgba(var(--regen-accent-rgb), 0.7);
}

/* Color variants map onto the theme tokens so both appearances stay in step. */
.regen-card--orange {
  --regen-accent: var(--studio-orange);
  --regen-accent-rgb: var(--studio-orange-rgb);
}

.regen-card--pink {
  --regen-accent: var(--studio-pink);
  --regen-accent-rgb: var(--studio-pink-rgb);
}

.regen-card--purple {
  --regen-accent: var(--studio-purple);
  --regen-accent-rgb: var(--studio-purple-rgb);
}

.regen-card--green {
  --regen-accent: var(--studio-green);
  --regen-accent-rgb: var(--studio-green-rgb);
}

.regen-card--blue {
  --regen-accent: var(--studio-blue);
  --regen-accent-rgb: var(--studio-blue-rgb);
}

/* Inline History Buttons */
.history-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  min-width: 40px;
  background: transparent;
  border: none;
  color: rgba(var(--studio-ink-rgb), 0.45);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.history-inline:hover:not(:disabled) {
  background: rgba(var(--regen-accent-rgb), 0.14);
  color: var(--regen-accent);
}

.history-inline:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.history-inline:focus-visible {
  outline: 2px solid var(--regen-accent);
  outline-offset: -2px;
}

/* Main Regenerate Button */
.regen-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.7rem 1rem;
  background: transparent;
  border: none;
  border-left: 1px solid rgba(var(--regen-accent-rgb), 0.2);
  border-right: 1px solid rgba(var(--regen-accent-rgb), 0.2);
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--regen-accent);
  cursor: pointer;
  transition: background 0.2s ease;
}

.regen-main:hover:not(:disabled) {
  background: rgba(var(--regen-accent-rgb), 0.1);
}

.regen-main:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.regen-main:focus-visible {
  outline: 2px solid var(--regen-accent);
  outline-offset: -2px;
}

.regen-main__icon {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.regen-main:hover:not(:disabled) .regen-main__icon {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .regen-main__icon {
    transition: none;
  }

  .regen-main:hover:not(:disabled) .regen-main__icon {
    transform: none;
  }
}
</style>
