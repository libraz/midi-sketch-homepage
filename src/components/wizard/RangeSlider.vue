<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number
  min?: number
  max?: number
  label?: string
  unit?: string
  accentColor?: string
  /** Custom formatter for the display value */
  formatValue?: (value: number) => string
}>()

defineEmits<{
  'update:modelValue': [value: number]
}>()

const displayValue = computed(() => {
  if (props.formatValue) {
    return props.formatValue(props.modelValue)
  }
  return `${props.modelValue}${props.unit ?? '%'}`
})
</script>

<template>
  <div class="range-slider" :style="accentColor ? { '--slider-accent': accentColor } : {}">
    <label v-if="label" class="range-slider__label">
      <span>{{ label }}</span>
      <span class="range-slider__value">{{ displayValue }}</span>
    </label>
    <input
      type="range"
      :min="min ?? 0"
      :max="max ?? 100"
      :value="modelValue"
      @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
      class="range-slider__input"
    />
  </div>
</template>

<style scoped>
.range-slider {
  --slider-accent: var(--step-accent, #8B5CF6);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.range-slider__label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.6);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.range-slider__value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--slider-accent);
}

.range-slider__input {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: color-mix(in srgb, var(--slider-accent) 15%, transparent);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.range-slider__input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--slider-accent);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px -2px color-mix(in srgb, var(--slider-accent) 50%, transparent);
  transition: transform 0.15s ease;
}

.range-slider__input::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.range-slider__input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--slider-accent);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px -2px color-mix(in srgb, var(--slider-accent) 50%, transparent);
}
</style>
