<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { midiToNoteName } from '../../utils/midiUtils'

const { t } = useI18n()

// Props
const props = defineProps<{
  vocalLow: number
  vocalHigh: number
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:vocalLow', value: number): void
  (e: 'update:vocalHigh', value: number): void
}>()

// Vocal range presets (MIDI note numbers)
const vocalRangePresets = [
  { id: 'female-standard', icon: '👩', low: 55, high: 76 },  // G3-E5
  { id: 'female-high', icon: '✨', low: 57, high: 79 },      // A3-G5
  { id: 'female-low', icon: '🎶', low: 52, high: 72 },       // E3-C5
  { id: 'male-standard', icon: '👨', low: 48, high: 67 },    // C3-G4
  { id: 'male-high', icon: '🎤', low: 52, high: 69 },        // E3-A4
  { id: 'male-low', icon: '🎵', low: 45, high: 64 },         // A2-E4
  { id: 'wide', icon: '📢', low: 52, high: 76 },             // E3-E5
  { id: 'narrow', icon: '🎯', low: 55, high: 74 },           // G3-D5
  { id: 'yuuki-sakuna', icon: '🌸', low: 59, high: 83 }      // B3-B5
]

function selectVocalPreset(preset: typeof vocalRangePresets[0]) {
  emit('update:vocalLow', preset.low)
  emit('update:vocalHigh', preset.high)
}

function isVocalPresetActive(preset: typeof vocalRangePresets[0]): boolean {
  return props.vocalLow === preset.low && props.vocalHigh === preset.high
}

// Visual range bar calculations (C2=36 to C7=96)
const RANGE_MIN = 36
const RANGE_MAX = 96
const rangeBarStyle = computed(() => {
  const total = RANGE_MAX - RANGE_MIN
  const lowPercent = ((props.vocalLow - RANGE_MIN) / total) * 100
  const highPercent = ((props.vocalHigh - RANGE_MIN) / total) * 100
  return {
    left: `${lowPercent}%`,
    width: `${highPercent - lowPercent}%`
  }
})
</script>

<template>
  <div class="vocal-range-selector">
    <!-- Vocal Range Presets -->
    <h4 class="preset-label">{{ t('melodyStep.advanced.vocalRange.presets.label') }}</h4>
    <div class="vocal-presets">
      <button
        v-for="preset in vocalRangePresets"
        :key="preset.id"
        class="vocal-preset"
        :class="{ 'vocal-preset--active': isVocalPresetActive(preset) }"
        @click="selectVocalPreset(preset)"
      >
        <span class="vocal-preset__icon">{{ preset.icon }}</span>
        <span class="vocal-preset__label">{{ t(`melodyStep.advanced.vocalRange.presets.${preset.id}`) }}</span>
        <span class="vocal-preset__range">{{ midiToNoteName(preset.low) }}–{{ midiToNoteName(preset.high) }}</span>
      </button>
    </div>

    <!-- Visual Range Bar -->
    <div class="range-bar-container">
      <div class="range-bar">
        <div class="range-bar__fill" :style="rangeBarStyle"></div>
        <div class="range-bar__low-marker" :style="{ left: rangeBarStyle.left }">
          <span class="range-bar__note">{{ midiToNoteName(vocalLow) }}</span>
        </div>
        <div class="range-bar__high-marker" :style="{ left: `calc(${rangeBarStyle.left} + ${rangeBarStyle.width})` }">
          <span class="range-bar__note">{{ midiToNoteName(vocalHigh) }}</span>
        </div>
      </div>
      <div class="range-bar__labels">
        <span>C2</span>
        <span>C7</span>
      </div>
    </div>

    <!-- Sliders -->
    <div class="range-inputs">
      <div class="range-input">
        <label>{{ t('melodyStep.advanced.vocalRange.low') }}</label>
        <div class="range-value">{{ midiToNoteName(vocalLow) }}</div>
        <input
          type="range"
          :value="vocalLow"
          @input="emit('update:vocalLow', Number(($event.target as HTMLInputElement).value))"
          min="36"
          max="72"
          class="slider"
        />
      </div>
      <div class="range-input">
        <label>{{ t('melodyStep.advanced.vocalRange.high') }}</label>
        <div class="range-value">{{ midiToNoteName(vocalHigh) }}</div>
        <input
          type="range"
          :value="vocalHigh"
          @input="emit('update:vocalHigh', Number(($event.target as HTMLInputElement).value))"
          min="60"
          max="96"
          class="slider"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.vocal-range-selector {
  --accent-color: var(--step-accent, #EC4899);
}

.preset-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.5);
  margin: 0 0 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.vocal-presets {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.vocal-preset {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(236, 72, 153, 0.12);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.vocal-preset:hover {
  border-color: rgba(236, 72, 153, 0.3);
  transform: translateY(-2px);
}

.vocal-preset--active {
  background: rgba(236, 72, 153, 0.15);
  border-color: var(--accent-color);
  box-shadow: 0 0 16px -4px rgba(236, 72, 153, 0.4);
}

.vocal-preset__icon {
  font-size: 1.25rem;
}

.vocal-preset__label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  color: #FAFAFA;
  text-align: center;
  line-height: 1.2;
}

.vocal-preset__range {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  color: rgba(250, 250, 250, 0.4);
}

/* Visual Range Bar */
.range-bar-container {
  margin-bottom: 1.5rem;
}

.range-bar {
  position: relative;
  height: 24px;
  background: rgba(30, 30, 42, 0.8);
  border-radius: 12px;
  overflow: visible;
}

.range-bar__fill {
  position: absolute;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--accent-color), #DB2777);
  border-radius: 12px;
  box-shadow: 0 0 16px rgba(236, 72, 153, 0.4);
  transition: left 0.15s ease, width 0.15s ease;
}

.range-bar__low-marker,
.range-bar__high-marker {
  position: absolute;
  top: -8px;
  transform: translateX(-50%);
  transition: left 0.15s ease;
}

.range-bar__note {
  display: block;
  padding: 2px 6px;
  background: rgba(20, 20, 28, 0.95);
  border: 1px solid var(--accent-color);
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  color: #FAFAFA;
  white-space: nowrap;
}

.range-bar__high-marker .range-bar__note {
  border-color: #DB2777;
}

.range-bar__labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: rgba(250, 250, 250, 0.3);
}

.range-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.range-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.range-input label {
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.5);
}

.range-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
  font-weight: 600;
  color: #FAFAFA;
}

.slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(236, 72, 153, 0.15);
  border-radius: 3px;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: var(--accent-color);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.4);
}
</style>
