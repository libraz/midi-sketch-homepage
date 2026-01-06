<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import { midiToNoteName } from '../../utils/midiUtils'

const { t } = useI18n()
const store = useWizardStore()

// Note: vocalRestRatio and vocalAllowExtremLeap are now computed at WASM call time
// based on their respective mode settings (Auto/Custom, Auto/On/Off)

const vocalAttitudeOptions = [
  { key: 'clean', value: 0 },
  { key: 'expressive', value: 1 },
  { key: 'raw', value: 2 }
]

// Vocal style presets with icons
const vocalStyleOptions = [
  { key: 'auto', value: 0, icon: '🔮' },
  { key: 'standard', value: 1, icon: '🎵' },
  { key: 'vocaloid', value: 2, icon: '💫' },
  { key: 'ultraVocaloid', value: 3, icon: '⚡' },
  { key: 'idol', value: 4, icon: '🎀' },
  { key: 'ballad', value: 5, icon: '🌙' },
  { key: 'rock', value: 6, icon: '🎸' },
  { key: 'cityPop', value: 7, icon: '🌃' },
  { key: 'anime', value: 8, icon: '✨' },
  { key: 'brightKira', value: 9, icon: '☀' },
  { key: 'coolSynth', value: 10, icon: '🔷' },
  { key: 'cuteAffected', value: 11, icon: '🍬' },
  { key: 'powerfulShout', value: 12, icon: '🔥' }
]

// Vocal groove options with visual rhythm patterns
const vocalGrooveOptions = [
  { key: 'straight', value: 0, pattern: [1, 1, 1, 1, 1, 1, 1, 1], icon: '▬' },
  { key: 'offBeat', value: 1, pattern: [0.3, 1, 0.3, 1, 0.3, 1, 0.3, 1], icon: '⌐' },
  { key: 'swing', value: 2, pattern: [1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5], icon: '♪' },
  { key: 'syncopated', value: 3, pattern: [0.5, 1, 0.3, 1, 0.7, 0.4, 1, 0.6], icon: '⚡' },
  { key: 'driving16th', value: 4, pattern: [0.8, 0.6, 0.8, 0.6, 0.8, 0.6, 0.8, 1], icon: '»' },
  { key: 'bouncy8th', value: 5, pattern: [1, 0.4, 0.8, 0.4, 1, 0.4, 0.8, 0.4], icon: '∿' }
]

// Melodic complexity options
const melodicComplexityOptions = [
  { key: 'simple', value: 0 },
  { key: 'standard', value: 1 },
  { key: 'complex', value: 2 }
]

// Hook intensity options
const hookIntensityOptions = [
  { key: 'off', value: 0 },
  { key: 'light', value: 1 },
  { key: 'normal', value: 2 },
  { key: 'strong', value: 3 }
]

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
  store.config.vocalLow = preset.low
  store.config.vocalHigh = preset.high
}

function isVocalPresetActive(preset: typeof vocalRangePresets[0]): boolean {
  return store.config.vocalLow === preset.low && store.config.vocalHigh === preset.high
}

// Visual range bar calculations (C2=36 to C7=96)
const RANGE_MIN = 36
const RANGE_MAX = 96
const rangeBarStyle = computed(() => {
  const total = RANGE_MAX - RANGE_MIN
  const lowPercent = ((store.config.vocalLow - RANGE_MIN) / total) * 100
  const highPercent = ((store.config.vocalHigh - RANGE_MIN) / total) * 100
  return {
    left: `${lowPercent}%`,
    width: `${highPercent - lowPercent}%`
  }
})

</script>

<template>
  <div class="melody-step">
    <!-- Header -->
    <header class="step-header">
      <h2 class="step-header__title">{{ t('melodyStep.title') }}</h2>
      <p class="step-header__subtitle">{{ t('melodyStep.subtitle') }}</p>
    </header>

    <!-- Melody Settings -->
    <div class="melody-settings">
        <!-- Vocal Range -->
        <section class="setting-section">
          <h3 class="setting-label">
            <span class="setting-label__icon">🎵</span>
            <span>{{ t('melodyStep.advanced.vocalRange.label') }}</span>
          </h3>
          <p class="setting-description">{{ t('melodyStep.advanced.vocalRange.description') }}</p>

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
                <span class="range-bar__note">{{ midiToNoteName(store.config.vocalLow) }}</span>
              </div>
              <div class="range-bar__high-marker" :style="{ left: `calc(${rangeBarStyle.left} + ${rangeBarStyle.width})` }">
                <span class="range-bar__note">{{ midiToNoteName(store.config.vocalHigh) }}</span>
              </div>
            </div>
            <div class="range-bar__labels">
              <span>C2</span>
              <span>C7</span>
            </div>
          </div>

          <div class="range-inputs">
            <div class="range-input">
              <label>{{ t('melodyStep.advanced.vocalRange.low') }}</label>
              <div class="range-value">{{ midiToNoteName(store.config.vocalLow) }}</div>
              <input
                type="range"
                v-model.number="store.config.vocalLow"
                min="36"
                max="72"
                class="slider"
              />
            </div>
            <div class="range-input">
              <label>{{ t('melodyStep.advanced.vocalRange.high') }}</label>
              <div class="range-value">{{ midiToNoteName(store.config.vocalHigh) }}</div>
              <input
                type="range"
                v-model.number="store.config.vocalHigh"
                min="60"
                max="96"
                class="slider"
              />
            </div>
          </div>
        </section>

        <!-- Vocal Attitude -->
        <section class="setting-section">
          <h3 class="setting-label">
            <span class="setting-label__icon">🎤</span>
            <span>{{ t('melodyStep.advanced.vocalAttitude.label') }}</span>
          </h3>
          <p class="setting-description">{{ t('melodyStep.advanced.vocalAttitude.description') }}</p>

          <div class="option-cards">
            <button
              v-for="option in vocalAttitudeOptions"
              :key="option.key"
              class="option-card"
              :class="{ 'option-card--active': store.config.vocalAttitude === option.value }"
              @click="store.config.vocalAttitude = option.value"
            >
              <span class="option-card__title">{{ t(`melodyStep.advanced.vocalAttitude.options.${option.key}`) }}</span>
              <span class="option-card__desc">{{ t(`melodyStep.advanced.vocalAttitude.options.${option.key}Desc`) }}</span>
            </button>
          </div>
        </section>

        <!-- Vocal Style -->
        <section class="setting-section">
          <h3 class="setting-label">
            <span class="setting-label__icon">🎼</span>
            <span>{{ t('melodyStep.advanced.vocalStyle.label') }}</span>
          </h3>
          <p class="setting-description">{{ t('melodyStep.advanced.vocalStyle.description') }}</p>

          <div class="compact-btns compact-btns--grid">
            <button
              v-for="opt in vocalStyleOptions"
              :key="opt.key"
              class="compact-btn"
              :class="{ 'compact-btn--active': store.config.vocalStyle === opt.value }"
              @click="store.config.vocalStyle = opt.value"
            >
              <span class="compact-btn__icon">{{ opt.icon }}</span>
              <span>{{ t(`melodyStep.advanced.vocalStyle.options.${opt.key}`) }}</span>
            </button>
          </div>
          <!-- Show description only for selected style -->
          <div v-if="store.config.vocalStyle !== 0" class="selected-desc">
            <span class="selected-desc__text">{{ t(`melodyStep.advanced.vocalStyle.options.${vocalStyleOptions.find(o => o.value === store.config.vocalStyle)?.key}Desc`) }}</span>
          </div>
        </section>

        <!-- Vocal Groove -->
        <section class="setting-section">
          <h3 class="setting-label">
            <span class="setting-label__icon">🎸</span>
            <span>{{ t('melodyStep.advanced.vocalGroove.label') }}</span>
          </h3>
          <p class="setting-description">{{ t('melodyStep.advanced.vocalGroove.description') }}</p>

          <div class="compact-btns compact-btns--grid">
            <button
              v-for="opt in vocalGrooveOptions"
              :key="opt.key"
              class="compact-btn"
              :class="{ 'compact-btn--active': store.config.vocalGroove === opt.value }"
              @click="store.config.vocalGroove = opt.value"
            >
              <span class="compact-btn__icon">{{ opt.icon }}</span>
              <span>{{ t(`melodyStep.advanced.vocalGroove.options.${opt.key}`) }}</span>
            </button>
          </div>
          <!-- Show description only for selected groove -->
          <div v-if="store.config.vocalGroove !== 0" class="selected-desc">
            <span class="selected-desc__text">{{ t(`melodyStep.advanced.vocalGroove.options.${vocalGrooveOptions.find(o => o.value === store.config.vocalGroove)?.key}Desc`) }}</span>
          </div>
        </section>

        <!-- Melodic Complexity -->
        <section class="setting-section">
          <h3 class="setting-label">
            <span class="setting-label__icon">🎼</span>
            <span>{{ t('melodyStep.advanced.melodicComplexity.label') }}</span>
          </h3>
          <p class="setting-description">{{ t('melodyStep.advanced.melodicComplexity.description') }}</p>

          <div class="option-cards option-cards--row">
            <button
              v-for="opt in melodicComplexityOptions"
              :key="opt.key"
              class="option-card option-card--compact"
              :class="{ 'option-card--active': store.config.melodicComplexity === opt.value }"
              @click="store.config.melodicComplexity = opt.value"
            >
              <span class="option-card__title">{{ t(`melodyStep.advanced.melodicComplexity.options.${opt.key}`) }}</span>
            </button>
          </div>
        </section>

        <!-- Hook Intensity -->
        <section class="setting-section">
          <h3 class="setting-label">
            <span class="setting-label__icon">🎯</span>
            <span>{{ t('melodyStep.advanced.hookIntensity.label') }}</span>
          </h3>
          <p class="setting-description">{{ t('melodyStep.advanced.hookIntensity.description') }}</p>

          <div class="option-cards option-cards--row">
            <button
              v-for="opt in hookIntensityOptions"
              :key="opt.key"
              class="option-card option-card--compact"
              :class="{ 'option-card--active': store.config.hookIntensity === opt.value }"
              @click="store.config.hookIntensity = opt.value"
            >
              <span class="option-card__title">{{ t(`melodyStep.advanced.hookIntensity.options.${opt.key}`) }}</span>
            </button>
          </div>
        </section>

      </div>
  </div>
</template>

<style scoped>
.melody-step {
  --step-accent: #EC4899;
}

.step-header {
  text-align: center;
  margin-bottom: 2rem;
}

.step-header__title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #FAFAFA;
  margin: 0 0 0.5rem;
}

.step-header__subtitle {
  font-size: 0.9rem;
  color: rgba(250, 250, 250, 0.5);
  margin: 0;
}

/* Melody Settings */
.melody-settings {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-section {
  background: rgba(20, 20, 28, 0.4);
  border: 1px solid rgba(236, 72, 153, 0.1);
  border-radius: 16px;
  padding: 1.25rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: #FAFAFA;
  margin: 0 0 0.5rem;
}

.setting-label__icon {
  font-size: 1rem;
}

.setting-description {
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.45);
  margin: 0 0 1rem;
}

.option-cards {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.875rem 1rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(236, 72, 153, 0.12);
  border-radius: 12px;
  font-family: 'Instrument Sans', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.option-card:hover {
  border-color: rgba(236, 72, 153, 0.3);
  background: rgba(236, 72, 153, 0.05);
}

.option-card--active {
  background: rgba(236, 72, 153, 0.15);
  border-color: var(--step-accent);
}

.option-card__title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #FAFAFA;
}

.option-card--active .option-card__title {
  color: var(--step-accent);
}

.option-card__desc {
  font-size: 0.75rem;
  font-weight: 400;
  color: rgba(250, 250, 250, 0.5);
  line-height: 1.4;
}

.option-card--active .option-card__desc {
  color: rgba(250, 250, 250, 0.7);
}

/* Horizontal option cards */
.option-cards--row {
  flex-direction: row;
  flex-wrap: wrap;
}

.option-card--compact {
  flex: 1;
  min-width: 80px;
  align-items: center;
  padding: 0.625rem 0.75rem;
}

.option-card--compact .option-card__title {
  font-size: 0.8rem;
}

/* Vocal Range Styles */
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
  border-color: var(--step-accent);
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
  background: linear-gradient(90deg, var(--step-accent), #DB2777);
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
  border: 1px solid var(--step-accent);
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
  background: var(--step-accent);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.4);
}

/* Compact Buttons Grid */
.compact-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

/* Fixed-width grid variant - 3 columns */
.compact-btns--grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.compact-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.5rem 0.5rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(236, 72, 153, 0.12);
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
  border-color: rgba(236, 72, 153, 0.3);
  color: #FAFAFA;
  background: rgba(236, 72, 153, 0.08);
}

.compact-btn--active {
  background: rgba(236, 72, 153, 0.2);
  border-color: var(--step-accent);
  color: #FAFAFA;
  box-shadow: 0 0 12px -4px rgba(236, 72, 153, 0.4);
}

.compact-btn__icon {
  font-size: 0.9rem;
}

/* Selected Description (appears below buttons) */
.selected-desc {
  margin-top: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.08) 100%);
  border: 1px solid rgba(236, 72, 153, 0.2);
  border-radius: 10px;
  animation: descFadeIn 0.2s ease-out;
}

@keyframes descFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.selected-desc__text {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.75);
  line-height: 1.5;
}

@media (max-width: 640px) {
  .melody-btn {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }

  .option-card {
    padding: 0.75rem 0.875rem;
  }

  .option-card__title {
    font-size: 0.85rem;
  }

  .option-card__desc {
    font-size: 0.7rem;
  }

  .style-buttons {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
