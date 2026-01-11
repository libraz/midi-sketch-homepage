<script setup lang="ts">
export interface ButtonOption {
  key: string
  value: number
  icon?: string
  label: string
}

const props = defineProps<{
  options: ButtonOption[]
  modelValue: number
  columns?: number  // Default: 3
  columnsOnMobile?: number  // Default: 2
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

function selectOption(value: number) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div
    class="compact-btns"
    :style="{
      '--columns': columns || 3,
      '--columns-mobile': columnsOnMobile || 2
    }"
  >
    <button
      v-for="opt in options"
      :key="opt.key"
      class="compact-btn"
      :class="{ 'compact-btn--active': modelValue === opt.value }"
      @click="selectOption(opt.value)"
    >
      <span v-if="opt.icon" class="compact-btn__icon">{{ opt.icon }}</span>
      <span>{{ opt.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.compact-btns {
  --accent-color: var(--step-accent, #8B5CF6);
  --accent-rgb: var(--accent-rgb-value, 139, 92, 246);
  display: grid;
  grid-template-columns: repeat(var(--columns), 1fr);
  gap: 0.5rem;
}

.compact-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.5rem 0.5rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(var(--accent-rgb), 0.12);
  border-radius: 8px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.compact-btn:hover {
  border-color: rgba(var(--accent-rgb), 0.3);
  color: #FAFAFA;
  background: rgba(var(--accent-rgb), 0.08);
}

.compact-btn--active {
  background: rgba(var(--accent-rgb), 0.2);
  border-color: var(--accent-color);
  color: #FAFAFA;
  box-shadow: 0 0 12px -4px rgba(var(--accent-rgb), 0.4);
}

.compact-btn__icon {
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .compact-btns {
    grid-template-columns: repeat(var(--columns-mobile), 1fr);
  }
}
</style>
