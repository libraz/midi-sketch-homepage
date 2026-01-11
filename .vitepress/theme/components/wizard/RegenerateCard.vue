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
  <div class="regen-card" :class="[`regen-card--${color || 'orange'}`]">
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
.regen-card {
  display: flex;
  align-items: stretch;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.regen-card:hover {
  transform: translateY(-2px);
}

/* Color variants */
.regen-card--orange {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  box-shadow:
    0 4px 16px -4px rgba(245, 158, 11, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.regen-card--orange:hover {
  box-shadow:
    0 8px 24px -4px rgba(245, 158, 11, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.regen-card--pink {
  background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%);
  box-shadow:
    0 4px 16px -4px rgba(236, 72, 153, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.regen-card--pink:hover {
  box-shadow:
    0 8px 24px -4px rgba(236, 72, 153, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.regen-card--purple {
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  box-shadow:
    0 4px 16px -4px rgba(139, 92, 246, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.regen-card--purple:hover {
  box-shadow:
    0 8px 24px -4px rgba(139, 92, 246, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.regen-card--green {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  box-shadow:
    0 4px 16px -4px rgba(16, 185, 129, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.regen-card--green:hover {
  box-shadow:
    0 8px 24px -4px rgba(16, 185, 129, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.regen-card--blue {
  background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%);
  box-shadow:
    0 4px 16px -4px rgba(96, 165, 250, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.regen-card--blue:hover {
  box-shadow:
    0 8px 24px -4px rgba(96, 165, 250, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Inline History Buttons */
.history-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  min-width: 44px;
  background: rgba(0, 0, 0, 0.15);
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-inline:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.25);
  color: white;
}

.history-inline:active:not(:disabled) {
  background: rgba(0, 0, 0, 0.3);
}

.history-inline:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.history-inline svg {
  transition: transform 0.2s ease;
}

.history-inline:hover:not(:disabled) svg {
  transform: scale(1.1);
}

/* Main Regenerate Button */
.regen-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 0.875rem 1.5rem;
  background: transparent;
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.15);
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.regen-main:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.regen-main:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.regen-main__icon {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.regen-main:hover:not(:disabled) .regen-main__icon {
  transform: rotate(180deg);
}
</style>
