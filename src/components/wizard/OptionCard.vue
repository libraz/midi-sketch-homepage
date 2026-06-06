<script setup lang="ts">
const props = defineProps<{
  title: string
  description?: string
  icon?: string
  isActive: boolean
  compact?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'select'): void
}>()

function handleClick() {
  if (!props.disabled) {
    emit('select')
  }
}
</script>

<template>
  <button
    class="option-card"
    :class="{
      'option-card--active': isActive,
      'option-card--compact': compact,
      'option-card--disabled': disabled
    }"
    :disabled="disabled"
    @click="handleClick"
  >
    <span v-if="icon" class="option-card__icon">{{ icon }}</span>
    <span class="option-card__title">{{ title }}</span>
    <span v-if="description && !compact" class="option-card__desc">{{ description }}</span>
  </button>
</template>

<style scoped>
.option-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.875rem 1rem;
  background: rgba(var(--studio-panel-raised-rgb), 0.6);
  border: 1px solid rgba(var(--accent-rgb, 139, 92, 246), 0.12);
  border-radius: 12px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.option-card:hover {
  border-color: rgba(var(--accent-rgb, 139, 92, 246), 0.3);
  background: rgba(var(--accent-rgb, 139, 92, 246), 0.05);
}

.option-card--active {
  background: rgba(var(--accent-rgb, 139, 92, 246), 0.15);
  border-color: rgb(var(--accent-rgb, 139, 92, 246));
}

.option-card__icon {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.option-card__title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--studio-text-primary);
}

.option-card--active .option-card__title {
  color: rgb(var(--accent-rgb, 139, 92, 246));
}

.option-card__desc {
  font-size: 0.75rem;
  font-weight: 400;
  color: rgba(var(--studio-ink-rgb), 0.5);
  line-height: 1.4;
}

.option-card--active .option-card__desc {
  color: rgba(var(--studio-ink-rgb), 0.7);
}

/* Disabled state */
.option-card--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.option-card--disabled:hover {
  border-color: rgba(var(--accent-rgb, 139, 92, 246), 0.12);
  background: rgba(var(--studio-panel-raised-rgb), 0.6);
}

/* Compact variant */
.option-card--compact {
  flex: 1;
  min-width: 80px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 0.75rem;
  gap: 0.5rem;
}

.option-card--compact .option-card__icon {
  font-size: 1rem;
  margin-bottom: 0;
}

.option-card--compact .option-card__title {
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .option-card {
    padding: 0.75rem 0.875rem;
  }

  .option-card__title {
    font-size: 0.85rem;
  }

  .option-card__desc {
    font-size: 0.7rem;
  }
}
</style>
