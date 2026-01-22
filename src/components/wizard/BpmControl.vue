<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const props = defineProps<{
  modelValue: number
  recommendedMin: number
  recommendedMax: number
  compact?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const { t } = useI18n()

// Calculate beat duration in seconds for CSS animation
const beatDuration = computed(() => 60 / props.modelValue)

const isInRecommendedRange = computed(() => {
  return props.modelValue >= props.recommendedMin && props.modelValue <= props.recommendedMax
})

// Dynamic tempo presets based on recommended range
const dynamicTempoPresets = computed(() => {
  const { recommendedMin: min, recommendedMax: max } = props
  const range = max - min
  const defaultBpm = Math.round(min + range * 0.5)

  const presets = [
    { icon: '🌙', labelKey: 'slow', bpm: min },
    { icon: '🎵', labelKey: 'medium', bpm: Math.round(min + range * 0.33) },
    { icon: '✨', labelKey: 'standard', bpm: Math.round(min + range * 0.66) },
    { icon: '⚡', labelKey: 'fast', bpm: max }
  ]

  // Find closest to default and mark it
  let closestIndex = 0
  let closestDiff = Math.abs(presets[0].bpm - defaultBpm)
  presets.forEach((p, i) => {
    const diff = Math.abs(p.bpm - defaultBpm)
    if (diff < closestDiff) {
      closestDiff = diff
      closestIndex = i
    }
  })

  return presets.map((p, i) => ({
    ...p,
    isDefault: i === closestIndex
  }))
})

function isPresetActive(presetBpm: number, index: number): boolean {
  const presets = dynamicTempoPresets.value
  const bpm = props.modelValue

  for (let i = 0; i < presets.length; i++) {
    const current = presets[i].bpm
    const next = presets[i + 1]?.bpm ?? current + 1

    if (i === presets.length - 1) {
      if (bpm >= current - 2) return index === i
    } else {
      const midpoint = (current + next) / 2
      if (bpm < midpoint) return index === i
    }
  }
  return index === 0
}

function updateBpm(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', parseInt(target.value))
}

function selectPreset(bpm: number) {
  emit('update:modelValue', bpm)
}

// Hide boundary labels when they're too close to edge labels (60 or 180)
const showLeftBoundaryLabel = computed(() => props.recommendedMin > 68)
const showRightBoundaryLabel = computed(() => props.recommendedMax < 172)
</script>

<template>
  <div class="bpm-control" :class="{ 'bpm-control--compact': compact }">
    <div class="bpm-display" :class="{ 'bpm-display--compact': compact }">
      <!-- Metronome Visualizer -->
      <div class="metronome" :class="{ 'metronome--compact': compact }" :style="{ '--beat-duration': `${beatDuration}s` }">
        <div class="metronome__ring"></div>
        <div class="metronome__dot"></div>
      </div>

      <div class="bpm-display__text">
        <span
          class="bpm-display__value"
          :class="{ 'bpm-display__value--outside': !isInRecommendedRange }"
          :style="{ '--beat-duration': `${beatDuration}s` }"
        >{{ modelValue }}</span>
        <span class="bpm-display__unit">BPM</span>
      </div>

      <!-- BPM Range Warning -->
      <Transition name="bpm-warning">
        <div v-if="!isInRecommendedRange" class="bpm-range-warning">
          <div class="bpm-range-warning__indicator"></div>
          <span class="bpm-range-warning__text">
            {{ modelValue < recommendedMin ? t('settingsStep.tempo.belowRange') : t('settingsStep.tempo.aboveRange') }}
          </span>
          <span class="bpm-range-warning__hint">{{ recommendedMin }}–{{ recommendedMax }}</span>
        </div>
      </Transition>
    </div>

    <div class="bpm-slider-wrap bpm-slider-wrap--extended">
      <!-- Multi-zone track -->
      <div class="bpm-track-zones">
        <!-- Left extended zone -->
        <div
          class="bpm-zone bpm-zone--extended-left"
          :style="{ width: `${((recommendedMin - 60) / 120) * 100}%` }"
        ></div>
        <!-- Recommended zone -->
        <div
          class="bpm-zone bpm-zone--recommended"
          :style="{
            left: `${((recommendedMin - 60) / 120) * 100}%`,
            width: `${((recommendedMax - recommendedMin) / 120) * 100}%`
          }"
        >
          <div class="bpm-zone__glow"></div>
        </div>
        <!-- Right extended zone -->
        <div
          class="bpm-zone bpm-zone--extended-right"
          :style="{
            left: `${((recommendedMax - 60) / 120) * 100}%`,
            width: `${((180 - recommendedMax) / 120) * 100}%`
          }"
        ></div>

        <!-- Boundary markers -->
        <div class="bpm-boundary bpm-boundary--left" :style="{ left: `${((recommendedMin - 60) / 120) * 100}%` }">
          <span v-if="showLeftBoundaryLabel" class="bpm-boundary__label">{{ recommendedMin }}</span>
        </div>
        <div class="bpm-boundary bpm-boundary--right" :style="{ left: `${((recommendedMax - 60) / 120) * 100}%` }">
          <span v-if="showRightBoundaryLabel" class="bpm-boundary__label">{{ recommendedMax }}</span>
        </div>
      </div>

      <!-- Edge labels -->
      <div class="bpm-edge-labels">
        <span class="bpm-edge-label">60</span>
        <span class="bpm-edge-label">180</span>
      </div>

      <!-- Slider thumb position indicator -->
      <div
        class="bpm-thumb-indicator"
        :class="{ 'bpm-thumb-indicator--outside': !isInRecommendedRange }"
        :style="{ left: `${((modelValue - 60) / 120) * 100}%` }"
      >
        <div class="bpm-thumb-indicator__pulse"></div>
      </div>

      <!-- Invisible range input -->
      <input
        type="range"
        class="bpm-slider bpm-slider--extended"
        :value="modelValue"
        min="60"
        max="180"
        @input="updateBpm"
      />
    </div>

    <div class="tempo-presets" :class="{ 'tempo-presets--compact': compact }">
      <button
        v-for="(preset, index) in dynamicTempoPresets"
        :key="index"
        class="tempo-preset"
        :class="{
          'tempo-preset--active': isPresetActive(preset.bpm, index),
          'tempo-preset--default': preset.isDefault,
          'tempo-preset--compact': compact
        }"
        @click="selectPreset(preset.bpm)"
      >
        <span class="tempo-preset__bpm">{{ preset.bpm }}</span>
        <span v-if="preset.isDefault" class="tempo-preset__star">&#9733;</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.bpm-control {
  --accent-color: var(--step-accent, #8B5CF6);
  --accent-rgb: var(--accent-rgb-value, 139, 92, 246);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.bpm-control--compact {
  gap: 0.75rem;
}

/* BPM Display - Vintage Synthesizer LED Readout */
.bpm-display {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.875rem;
  padding: 0.625rem 1rem;
  padding-bottom: 1.75rem; /* Space for warning */
  margin-bottom: -1rem; /* Pull up slider */
  background:
    linear-gradient(180deg,
      rgba(8, 8, 12, 0.95) 0%,
      rgba(12, 12, 18, 0.9) 50%,
      rgba(8, 8, 12, 0.95) 100%);
  border: 1px solid rgba(40, 40, 55, 0.6);
  border-radius: 8px;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 -1px 0 rgba(255, 255, 255, 0.02),
    0 1px 0 rgba(255, 255, 255, 0.03);
}

.bpm-display--compact {
  gap: 0.625rem;
  justify-content: center;
  padding: 0.5rem 0.875rem;
  border-radius: 6px;
}

/* Metronome - Hardware LED Indicator */
.metronome {
  --beat-duration: 0.5s;
  position: relative;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.5),
    0 1px 0 rgba(255, 255, 255, 0.03);
}

.metronome--compact {
  width: 24px;
  height: 24px;
}

.metronome__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #C4B5FD 0%, #8B5CF6 60%, #6D28D9 100%);
  box-shadow:
    0 0 8px rgba(var(--accent-rgb), 0.6),
    inset 0 -1px 2px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.2);
  animation: ledBlink var(--beat-duration) ease-out infinite;
  z-index: 2;
}

.metronome--compact .metronome__dot {
  width: 8px;
  height: 8px;
}

.metronome__ring {
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  border: 1px solid transparent;
  animation: ledRingPulse var(--beat-duration) ease-out infinite;
  pointer-events: none;
}

.metronome--compact .metronome__ring {
  inset: 2px;
}

@keyframes ledBlink {
  0%, 100% {
    opacity: 0.4;
    box-shadow:
      0 0 4px rgba(var(--accent-rgb), 0.3),
      inset 0 -1px 2px rgba(0, 0, 0, 0.3),
      inset 0 1px 1px rgba(255, 255, 255, 0.1);
  }
  8% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(var(--accent-rgb), 0.8),
      0 0 20px rgba(var(--accent-rgb), 0.4),
      inset 0 -1px 2px rgba(0, 0, 0, 0.2),
      inset 0 1px 1px rgba(255, 255, 255, 0.3);
  }
  25% {
    opacity: 0.5;
  }
}

@keyframes ledRingPulse {
  0% {
    border-color: rgba(var(--accent-rgb), 0.5);
    transform: scale(1);
  }
  20% {
    border-color: rgba(var(--accent-rgb), 0.2);
    transform: scale(1.1);
  }
  100% {
    border-color: transparent;
    transform: scale(1);
  }
}

.bpm-display__text {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

/* 7-Segment LED Display Style */
.bpm-display__value {
  --beat-duration: 0.5s;
  font-family: 'JetBrains Mono', monospace;
  font-size: 2.25rem;
  font-weight: 700;
  color: #C4B5FD;
  line-height: 1;
  letter-spacing: 0.02em;
  text-shadow:
    0 0 10px rgba(var(--accent-rgb), 0.6),
    0 0 20px rgba(var(--accent-rgb), 0.3),
    0 0 2px rgba(196, 181, 253, 0.8);
  animation: ledValuePulse var(--beat-duration) ease-out infinite;
  filter: blur(0.2px);
}

.bpm-display--compact .bpm-display__value {
  font-size: 2rem;
}

@keyframes ledValuePulse {
  0%, 100% {
    text-shadow:
      0 0 10px rgba(var(--accent-rgb), 0.5),
      0 0 20px rgba(var(--accent-rgb), 0.2),
      0 0 2px rgba(196, 181, 253, 0.6);
    opacity: 0.9;
  }
  8% {
    text-shadow:
      0 0 12px rgba(var(--accent-rgb), 0.8),
      0 0 25px rgba(var(--accent-rgb), 0.4),
      0 0 3px rgba(196, 181, 253, 1);
    opacity: 1;
  }
  25% {
    opacity: 0.92;
  }
}

.bpm-display__unit {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(var(--accent-rgb), 0.5);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-left: 0.125rem;
  text-shadow: 0 0 4px rgba(var(--accent-rgb), 0.3);
}

.bpm-display--compact .bpm-display__unit {
  font-size: 0.6rem;
}

/* BPM value outside recommended range - Amber LED warning */
.bpm-display__value--outside {
  color: #FCD34D !important;
  text-shadow:
    0 0 10px rgba(251, 191, 36, 0.7),
    0 0 20px rgba(245, 158, 11, 0.4),
    0 0 2px rgba(252, 211, 77, 0.9) !important;
  animation: ledValuePulseWarning var(--beat-duration) ease-out infinite !important;
}

@keyframes ledValuePulseWarning {
  0%, 100% {
    text-shadow:
      0 0 10px rgba(251, 191, 36, 0.6),
      0 0 20px rgba(245, 158, 11, 0.3),
      0 0 2px rgba(252, 211, 77, 0.7);
    opacity: 0.9;
  }
  8% {
    text-shadow:
      0 0 12px rgba(251, 191, 36, 0.9),
      0 0 25px rgba(245, 158, 11, 0.5),
      0 0 3px rgba(252, 211, 77, 1);
    opacity: 1;
  }
  25% {
    opacity: 0.92;
  }
}

/* Metronome LED also turns amber when outside range */
.bpm-display:has(.bpm-display__value--outside) .metronome__dot {
  background: radial-gradient(circle at 30% 30%, #FDE68A 0%, #FBBF24 60%, #D97706 100%);
  box-shadow:
    0 0 8px rgba(251, 191, 36, 0.6),
    inset 0 -1px 2px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.2);
  animation: ledBlinkWarning var(--beat-duration) ease-out infinite;
}

@keyframes ledBlinkWarning {
  0%, 100% {
    opacity: 0.4;
    box-shadow:
      0 0 4px rgba(251, 191, 36, 0.3),
      inset 0 -1px 2px rgba(0, 0, 0, 0.3),
      inset 0 1px 1px rgba(255, 255, 255, 0.1);
  }
  8% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(251, 191, 36, 0.8),
      0 0 20px rgba(245, 158, 11, 0.4),
      inset 0 -1px 2px rgba(0, 0, 0, 0.2),
      inset 0 1px 1px rgba(255, 255, 255, 0.3);
  }
  25% {
    opacity: 0.5;
  }
}

/* BPM Range Warning - positioned at bottom of bpm-display */
.bpm-range-warning {
  position: absolute;
  bottom: -70px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.2rem 0.5rem;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 4px;
  white-space: nowrap;
  z-index: 10;
}

.bpm-range-warning__indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #FBBF24;
  box-shadow: 0 0 6px rgba(251, 191, 36, 0.6);
  animation: warningBlink 1s ease-in-out infinite;
}

@keyframes warningBlink {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.bpm-range-warning__text {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  color: #FCD34D;
}

.bpm-range-warning__hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: rgba(252, 211, 77, 0.7);
}

/* Warning transition */
.bpm-warning-enter-active {
  transition: all 0.25s ease-out;
}

.bpm-warning-leave-active {
  transition: all 0.2s ease-in;
}

.bpm-warning-enter-from,
.bpm-warning-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px) scale(0.95);
}

/* Slider */
.bpm-slider-wrap {
  position: relative;
  width: 100%;
  max-width: 400px;
  height: 8px;
}

.bpm-slider-wrap--extended {
  height: auto;
  padding-top: 8px;
  padding-bottom: 24px;
}

/* Multi-zone track */
.bpm-track-zones {
  position: relative;
  height: 10px;
  border-radius: 5px;
  overflow: visible;
  background: rgba(30, 30, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.bpm-zone {
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.3s ease;
}

.bpm-zone--extended-left {
  left: 0;
  background: linear-gradient(90deg,
    rgba(100, 100, 120, 0.2) 0%,
    rgba(100, 100, 120, 0.15) 100%
  );
  border-radius: 5px 0 0 5px;
}

.bpm-zone--extended-right {
  background: linear-gradient(90deg,
    rgba(100, 100, 120, 0.15) 0%,
    rgba(100, 100, 120, 0.2) 100%
  );
  border-radius: 0 5px 5px 0;
}

.bpm-zone--recommended {
  background: linear-gradient(90deg,
    rgba(var(--accent-rgb), 0.3) 0%,
    rgba(var(--accent-rgb), 0.45) 50%,
    rgba(236, 72, 153, 0.3) 100%
  );
  border-top: 1px solid rgba(var(--accent-rgb), 0.5);
  border-bottom: 1px solid rgba(var(--accent-rgb), 0.5);
  box-shadow:
    inset 0 0 8px rgba(var(--accent-rgb), 0.3),
    0 0 12px rgba(var(--accent-rgb), 0.2);
  overflow: hidden;
}

.bpm-zone__glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(var(--accent-rgb), 0.15) 50%,
    transparent 100%
  );
  animation: zoneGlow 3s ease-in-out infinite;
}

@keyframes zoneGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* Edge labels */
.bpm-edge-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.bpm-edge-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.3);
}

/* Boundary markers */
.bpm-boundary {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  transform: translateX(-50%);
  z-index: 2;
}

.bpm-boundary::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: linear-gradient(180deg,
    rgba(var(--accent-rgb), 0.9) 0%,
    rgba(var(--accent-rgb), 0.6) 100%
  );
  border-radius: 1px;
  box-shadow: 0 0 6px rgba(var(--accent-rgb), 0.5);
}

.bpm-boundary__label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--accent-color);
  white-space: nowrap;
  text-shadow: 0 0 8px rgba(var(--accent-rgb), 0.4);
}

/* Thumb indicator */
.bpm-thumb-indicator {
  position: absolute;
  top: 8px;
  width: 18px;
  height: 18px;
  margin-left: -9px;
  margin-top: -4px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A78BFA 0%, #8B5CF6 50%, #7C3AED 100%);
  box-shadow:
    0 0 12px rgba(var(--accent-rgb), 0.6),
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
  transition: transform 0.1s ease, box-shadow 0.2s ease;
  z-index: 3;
  pointer-events: none;
}

.bpm-thumb-indicator::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
  opacity: 0.9;
}

.bpm-thumb-indicator__pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid rgba(var(--accent-rgb), 0.5);
  animation: thumbPulse 1.5s ease-out infinite;
  opacity: 0;
}

@keyframes thumbPulse {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

.bpm-thumb-indicator--outside {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%);
  box-shadow:
    0 0 16px rgba(245, 158, 11, 0.6),
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.bpm-thumb-indicator--outside .bpm-thumb-indicator__pulse {
  border-color: rgba(245, 158, 11, 0.5);
}

/* Slider input */
.bpm-slider--extended {
  position: absolute;
  top: 8px;
  width: 100%;
  height: 18px;
  margin-top: -4px;
  opacity: 0;
  cursor: pointer;
  z-index: 4;
}

/* Tempo Presets */
.tempo-presets {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 400px;
}

.tempo-presets--compact {
  gap: 0;
  flex-wrap: nowrap;
  padding: 2px;
  border-radius: 8px;
}

.tempo-preset {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(var(--accent-rgb), 0.15);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tempo-preset:hover {
  background: rgba(var(--accent-rgb), 0.1);
  border-color: rgba(var(--accent-rgb), 0.3);
}

.tempo-preset--active {
  background: rgba(var(--accent-rgb), 0.2);
  border-color: var(--accent-color);
  box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.3);
}

.tempo-preset--compact {
  min-width: 52px;
  padding: 0.55rem 0.65rem 0.4rem;
  flex-direction: row;
  gap: 0.2rem;
  border-radius: 6px;
}

.tempo-preset__bpm {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.8);
}

.tempo-preset--active .tempo-preset__bpm {
  color: #FAFAFA;
}

.tempo-preset--compact .tempo-preset__bpm {
  font-size: 0.82rem;
  padding-left: 2px;
}

.tempo-preset__star {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 0.6rem;
  color: #FBBF24;
}

.tempo-preset--compact .tempo-preset__star {
  position: absolute;
  top: 2px;
  right: 3px;
  font-size: 0.45rem;
}

/* Mobile: narrower slider */
@media (max-width: 640px) {
  .bpm-slider-wrap,
  .tempo-presets {
    max-width: 80%;
  }
}
</style>
