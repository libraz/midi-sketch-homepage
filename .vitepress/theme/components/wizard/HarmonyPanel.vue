<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'

const props = defineProps<{
  isExpanded: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

const { t } = useI18n()
const store = useWizardStore()

// Modulation timing options
const modulationTimingOptions = [
  { key: 'none', value: 0 },
  { key: 'lastChorus', value: 1 },
  { key: 'afterBridge', value: 2 },
  { key: 'eachChorus', value: 3 },
  { key: 'random', value: 4 }
]

// Summary value for header
const summaryValue = computed(() => {
  const parts: string[] = []
  if (store.config.chordExtSus) parts.push('Sus')
  if (store.config.chordExt7th) parts.push('7th')
  if (store.config.chordExt9th) parts.push('9th')
  if (store.config.modulationTiming !== 0) parts.push('+Mod')
  if (parts.length === 0) return t('settingsStep.rack.values.basic')
  return parts.join(' ')
})
</script>

<template>
  <div class="settings-panel" :class="{ 'settings-panel--open': isExpanded }">
    <button class="settings-panel__header" @click="emit('toggle')">
      <span class="settings-panel__title">{{ t('settingsStep.advanced.chordExt.label') }}</span>
      <span class="settings-panel__value">{{ summaryValue }}</span>
      <span class="settings-panel__chevron">›</span>
    </button>
    <div v-show="isExpanded" class="settings-panel__body">
      <!-- Chord Extensions -->
      <p class="section-desc">{{ t('settingsStep.advanced.chordExt.desc1') }}</p>
      <div class="chord-ext-grid">
        <div class="chord-ext-card">
          <label class="chord-ext-toggle">
            <input type="checkbox" v-model="store.config.chordExtSus" />
            <span class="chord-ext-check"></span>
            <div class="chord-ext-content">
              <span class="chord-ext-name">{{ t('settingsStep.advanced.chordExt.sus') }}</span>
              <span class="chord-ext-desc">{{ t('settingsStep.advanced.chordExt.susDesc') }}</span>
            </div>
          </label>
          <div v-if="store.config.chordExtSus" class="chord-ext-slider">
            <span class="chord-ext-hint">{{ t('settingsStep.advanced.chordExt.susHint') }}</span>
            <div class="slider-row">
              <input type="range" v-model.number="store.config.chordExtSusProb" min="0" max="100" class="param-slider" />
              <span class="param-value">{{ store.config.chordExtSusProb }}%</span>
            </div>
          </div>
        </div>
        <div class="chord-ext-card">
          <label class="chord-ext-toggle">
            <input type="checkbox" v-model="store.config.chordExt7th" />
            <span class="chord-ext-check"></span>
            <div class="chord-ext-content">
              <span class="chord-ext-name">{{ t('settingsStep.advanced.chordExt.seventh') }}</span>
              <span class="chord-ext-desc">{{ t('settingsStep.advanced.chordExt.seventhDesc') }}</span>
            </div>
          </label>
          <div v-if="store.config.chordExt7th" class="chord-ext-slider">
            <span class="chord-ext-hint">{{ t('settingsStep.advanced.chordExt.seventhHint') }}</span>
            <div class="slider-row">
              <input type="range" v-model.number="store.config.chordExt7thProb" min="0" max="100" class="param-slider" />
              <span class="param-value">{{ store.config.chordExt7thProb }}%</span>
            </div>
          </div>
        </div>
        <div class="chord-ext-card">
          <label class="chord-ext-toggle">
            <input type="checkbox" v-model="store.config.chordExt9th" />
            <span class="chord-ext-check"></span>
            <div class="chord-ext-content">
              <span class="chord-ext-name">{{ t('settingsStep.advanced.chordExt.ninth') }}</span>
              <span class="chord-ext-desc">{{ t('settingsStep.advanced.chordExt.ninthDesc') }}</span>
            </div>
          </label>
          <div v-if="store.config.chordExt9th" class="chord-ext-slider">
            <span class="chord-ext-hint">{{ t('settingsStep.advanced.chordExt.ninthHint') }}</span>
            <div class="slider-row">
              <input type="range" v-model.number="store.config.chordExt9thProb" min="0" max="100" class="param-slider" />
              <span class="param-value">{{ store.config.chordExt9thProb }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Modulation -->
      <div class="param-group">
        <label class="param-label">{{ t('settingsStep.advanced.modulation.timing') }}</label>
        <p class="param-desc">{{ t('settingsStep.advanced.modulation.description') }}</p>
        <div class="btn-group btn-group--wrap">
          <button
            v-for="option in modulationTimingOptions"
            :key="option.key"
            class="btn-option"
            :class="{ 'btn-option--active': store.config.modulationTiming === option.value }"
            @click="store.config.modulationTiming = option.value"
          >{{ t(`settingsStep.advanced.modulation.timingOptions.${option.key}`) }}</button>
        </div>
      </div>
      <div v-if="store.config.modulationTiming !== 0" class="param-group">
        <label class="param-label">{{ t('settingsStep.advanced.modulation.semitones') }}</label>
        <p class="param-desc">{{ t('settingsStep.advanced.modulation.semitonesHint') }}</p>
        <div class="slider-row">
          <input type="range" v-model.number="store.config.modulationSemitones" min="1" max="4" class="param-slider" />
          <span class="param-value">+{{ store.config.modulationSemitones }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  --accent-color: var(--step-accent, #8B5CF6);
  --accent-rgb: 139, 92, 246;
  border: 1px solid rgba(var(--accent-rgb), 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.settings-panel--open {
  border-color: rgba(var(--accent-rgb), 0.25);
}

.settings-panel__header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(25, 25, 35, 0.6);
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.settings-panel__header:hover {
  background: rgba(30, 30, 42, 0.8);
}

.settings-panel__title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: #FAFAFA;
}

.settings-panel__value {
  margin-left: auto;
  margin-right: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--accent-color);
}

.settings-panel__chevron {
  font-size: 1rem;
  color: rgba(250, 250, 250, 0.4);
  transition: transform 0.2s ease;
}

.settings-panel--open .settings-panel__chevron {
  transform: rotate(90deg);
}

.settings-panel__body {
  padding: 1rem;
  background: rgba(20, 20, 28, 0.4);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-desc {
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.5);
  margin: 0;
}

/* Chord Extension Grid */
.chord-ext-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.chord-ext-card {
  background: rgba(25, 25, 35, 0.5);
  border: 1px solid rgba(var(--accent-rgb), 0.1);
  border-radius: 10px;
  padding: 0.75rem;
  transition: border-color 0.2s ease;
}

.chord-ext-card:has(input:checked) {
  border-color: rgba(var(--accent-rgb), 0.3);
}

.chord-ext-toggle {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  cursor: pointer;
}

.chord-ext-toggle input {
  display: none;
}

.chord-ext-check {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(var(--accent-rgb), 0.3);
  border-radius: 4px;
  position: relative;
  transition: all 0.2s ease;
}

.chord-ext-check::after {
  content: '✓';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: white;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.chord-ext-toggle input:checked + .chord-ext-check {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.chord-ext-toggle input:checked + .chord-ext-check::after {
  opacity: 1;
}

.chord-ext-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.chord-ext-name {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: #FAFAFA;
}

.chord-ext-desc {
  font-size: 0.65rem;
  color: rgba(250, 250, 250, 0.45);
}

.chord-ext-slider {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(var(--accent-rgb), 0.1);
}

.chord-ext-hint {
  display: block;
  font-size: 0.65rem;
  color: rgba(250, 250, 250, 0.5);
  margin-bottom: 0.5rem;
}

/* Param Group */
.param-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.param-label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: #FAFAFA;
}

.param-desc {
  font-size: 0.7rem;
  color: rgba(250, 250, 250, 0.45);
  margin: 0;
}

.param-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-color);
  min-width: 2.5rem;
  text-align: right;
}

/* Slider Row */
.slider-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.param-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(var(--accent-rgb), 0.15);
  border-radius: 3px;
  cursor: pointer;
}

.param-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: var(--accent-color);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(var(--accent-rgb), 0.4);
}

/* Button Group */
.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.btn-group--wrap {
  flex-wrap: wrap;
}

.btn-option {
  padding: 0.4rem 0.6rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(var(--accent-rgb), 0.12);
  border-radius: 6px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-option:hover {
  border-color: rgba(var(--accent-rgb), 0.3);
  color: #FAFAFA;
}

.btn-option--active {
  background: rgba(var(--accent-rgb), 0.2);
  border-color: var(--accent-color);
  color: #FAFAFA;
}
</style>
