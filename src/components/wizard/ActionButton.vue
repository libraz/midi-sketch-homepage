<script setup lang="ts">
/**
 * Unified Action Button component
 * Provides consistent sizing and styling across all action buttons
 */
defineProps<{
  label: string
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
  color?: 'purple' | 'green' | 'blue' | 'orange' | 'pink'
  icon?: 'download' | 'link' | 'check' | 'refresh' | 'share'
  fullWidth?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <button
    class="action-btn"
    :class="[
      `action-btn--${variant || 'primary'}`,
      `action-btn--${color || 'purple'}`,
      { 'action-btn--full': fullWidth !== false },
      { 'action-btn--loading': loading }
    ]"
    :disabled="disabled || loading"
    @click="emit('click')"
  >
    <!-- Icon -->
    <span v-if="icon" class="action-btn__icon">
      <!-- Download -->
      <svg v-if="icon === 'download'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      <!-- Link -->
      <svg v-else-if="icon === 'link'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
      </svg>
      <!-- Check -->
      <svg v-else-if="icon === 'check'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      <!-- Refresh -->
      <svg v-else-if="icon === 'refresh'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>
      <!-- Share -->
      <svg v-else-if="icon === 'share'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
      </svg>
    </span>

    <!-- Label -->
    <span class="action-btn__label">{{ label }}</span>

    <!-- Loading spinner -->
    <span v-if="loading" class="action-btn__spinner"></span>
  </button>
</template>

<style scoped>
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.action-btn--full {
  width: 100%;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.action-btn__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.action-btn__label {
  white-space: nowrap;
}

/* Loading state */
.action-btn--loading .action-btn__icon {
  opacity: 0;
}

.action-btn__spinner {
  position: absolute;
  left: 1.5rem;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========================================
   PRIMARY VARIANT - Gradient backgrounds
   ======================================== */
.action-btn--primary {
  color: white;
}

.action-btn--primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.action-btn--primary:hover:not(:disabled)::before {
  opacity: 1;
}

.action-btn--primary:hover:not(:disabled) {
  transform: translateY(-2px);
}

.action-btn--primary:hover:not(:disabled) .action-btn__icon {
  transform: translateY(2px);
}

/* Primary color variants */
.action-btn--primary.action-btn--purple {
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  box-shadow:
    0 4px 16px -4px rgba(139, 92, 246, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.action-btn--primary.action-btn--purple:hover:not(:disabled) {
  box-shadow:
    0 8px 24px -4px rgba(139, 92, 246, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.action-btn--primary.action-btn--green {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  box-shadow:
    0 4px 16px -4px rgba(16, 185, 129, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.action-btn--primary.action-btn--green:hover:not(:disabled) {
  box-shadow:
    0 8px 24px -4px rgba(16, 185, 129, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.action-btn--primary.action-btn--blue {
  background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%);
  box-shadow:
    0 4px 16px -4px rgba(96, 165, 250, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.action-btn--primary.action-btn--blue:hover:not(:disabled) {
  box-shadow:
    0 8px 24px -4px rgba(96, 165, 250, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.action-btn--primary.action-btn--orange {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  box-shadow:
    0 4px 16px -4px rgba(245, 158, 11, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.action-btn--primary.action-btn--orange:hover:not(:disabled) {
  box-shadow:
    0 8px 24px -4px rgba(245, 158, 11, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.action-btn--primary.action-btn--pink {
  background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%);
  box-shadow:
    0 4px 16px -4px rgba(236, 72, 153, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.action-btn--primary.action-btn--pink:hover:not(:disabled) {
  box-shadow:
    0 8px 24px -4px rgba(236, 72, 153, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* ========================================
   SECONDARY VARIANT - Outlined style
   ======================================== */
.action-btn--secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(250, 250, 250, 0.8);
}

.action-btn--secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: #FAFAFA;
}

/* Secondary color accents */
.action-btn--secondary.action-btn--purple:hover:not(:disabled) {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.1);
}

.action-btn--secondary.action-btn--green:hover:not(:disabled) {
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.1);
}

.action-btn--secondary.action-btn--blue:hover:not(:disabled) {
  border-color: rgba(96, 165, 250, 0.3);
  background: rgba(96, 165, 250, 0.1);
}

/* ========================================
   GHOST VARIANT - Minimal style
   ======================================== */
.action-btn--ghost {
  background: transparent;
  color: rgba(250, 250, 250, 0.5);
  padding: 0.75rem 1rem;
}

.action-btn--ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(250, 250, 250, 0.7);
}
</style>
