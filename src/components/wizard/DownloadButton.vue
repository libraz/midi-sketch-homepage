<script setup lang="ts">
// Props
defineProps<{
  label: string
  disabled?: boolean
  color?: 'purple' | 'green' | 'pink' | 'orange'
}>()

// Emits
const emit = defineEmits<{
  (e: 'download'): void
}>()
</script>

<template>
  <button
    class="download-btn"
    :class="[`download-btn--${color || 'purple'}`]"
    :disabled="disabled"
    @click="emit('download')"
  >
    <svg class="download-btn__icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
    </svg>
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.download-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--studio-on-accent);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.download-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.download-btn:hover::before {
  opacity: 1;
}

.download-btn__icon {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.download-btn:hover:not(:disabled) .download-btn__icon {
  transform: translateY(2px);
}

/* Color variants. Saturated brand gradients stay literal so the call-to-action
   reads the same in both themes; only the colored glow uses the accent token. */
.download-btn--purple {
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  box-shadow:
    0 4px 16px -4px rgba(var(--studio-purple-rgb), 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.download-btn--purple:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px -4px rgba(var(--studio-purple-rgb), 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.download-btn--green {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  box-shadow:
    0 4px 16px -4px rgba(var(--studio-green-rgb), 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.download-btn--green:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px -4px rgba(var(--studio-green-rgb), 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.download-btn--pink {
  background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%);
  box-shadow:
    0 4px 16px -4px rgba(var(--studio-pink-rgb), 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.download-btn--pink:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px -4px rgba(var(--studio-pink-rgb), 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.download-btn--orange {
  background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
  box-shadow:
    0 4px 16px -4px rgba(var(--studio-orange-rgb), 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.download-btn--orange:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px -4px rgba(var(--studio-orange-rgb), 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}
</style>
