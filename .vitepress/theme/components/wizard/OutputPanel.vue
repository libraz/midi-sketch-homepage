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

// Duration presets
const durationPresets = [
  { label: '1:30', seconds: 90 },
  { label: '2:00', seconds: 120 },
  { label: '2:30', seconds: 150 },
  { label: '3:00', seconds: 180 },
  { label: '4:00', seconds: 240 }
]

// Options
const introChantOptions = [
  { key: 'none', value: 0 },
  { key: 'gachikoi', value: 1 },
  { key: 'shouting', value: 2 }
]

const mixPatternOptions = [
  { key: 'none', value: 0 },
  { key: 'standard', value: 1 },
  { key: 'tiger', value: 2 }
]

const callDensityOptions = [
  { key: 'none', value: 0 },
  { key: 'minimal', value: 1 },
  { key: 'standard', value: 2 },
  { key: 'intense', value: 3 }
]

// Formatted duration
const formattedDuration = computed(() => {
  const seconds = store.config.targetDurationSeconds
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

// Summary value for header
const summaryValue = computed(() => {
  let value = formattedDuration.value
  if (store.config.callEnabled) value += ' + Call'
  return value
})
</script>

<template>
  <div class="settings-panel" :class="{ 'settings-panel--open': isExpanded }">
    <button class="settings-panel__header" @click="emit('toggle')">
      <span class="settings-panel__title">{{ t('settingsStep.rack.modules.output') }}</span>
      <span class="settings-panel__value">{{ summaryValue }}</span>
      <span class="settings-panel__chevron">›</span>
    </button>
    <div v-show="isExpanded" class="settings-panel__body">
      <!-- Duration -->
      <div class="param-group">
        <div class="duration-header">
          <label class="param-label">{{ t('settingsStep.duration.label') }}</label>
          <span class="duration-display">{{ formattedDuration }}</span>
        </div>
        <p class="param-desc">{{ t('settingsStep.duration.description') }}</p>
        <div class="duration-presets">
          <button
            v-for="preset in durationPresets"
            :key="preset.seconds"
            class="duration-btn"
            :class="{ 'duration-btn--active': store.config.targetDurationSeconds === preset.seconds }"
            @click="store.config.targetDurationSeconds = preset.seconds"
          >{{ preset.label }}</button>
        </div>
        <div class="slider-row">
          <input type="range" v-model.number="store.config.targetDurationSeconds" min="60" max="300" step="15" class="param-slider" />
        </div>
      </div>

      <!-- Call/Response -->
      <div class="param-section">
        <p class="section-desc">{{ t('settingsStep.advanced.se.description') }}</p>
        <label class="switch-row switch-row--main">
          <input type="checkbox" v-model="store.config.callEnabled" />
          <span class="switch-track"></span>
          <div class="switch-content">
            <span class="switch-label">{{ t('settingsStep.advanced.se.callEnabled') }}</span>
            <span class="switch-desc">{{ t('settingsStep.advanced.se.callEnabledDesc') }}</span>
          </div>
        </label>
        <template v-if="store.config.callEnabled">
          <label class="switch-row">
            <input type="checkbox" v-model="store.config.callNotesEnabled" />
            <span class="switch-track"></span>
            <span class="switch-label">{{ t('settingsStep.advanced.se.callNotesEnabled') }}</span>
          </label>
          <div class="param-group">
            <label class="param-label">{{ t('settingsStep.advanced.se.introChant') }}</label>
            <p class="param-desc">{{ t('settingsStep.advanced.se.introChantDesc') }}</p>
            <div class="btn-group">
              <button
                v-for="option in introChantOptions"
                :key="option.key"
                class="btn-option"
                :class="{ 'btn-option--active': store.config.introChant === option.value }"
                @click="store.config.introChant = option.value"
              >{{ t(`settingsStep.advanced.se.introChantOptions.${option.key}`) }}</button>
            </div>
          </div>
          <div class="param-group">
            <label class="param-label">{{ t('settingsStep.advanced.se.mixPattern') }}</label>
            <p class="param-desc">{{ t('settingsStep.advanced.se.mixPatternDesc') }}</p>
            <div class="btn-group">
              <button
                v-for="option in mixPatternOptions"
                :key="option.key"
                class="btn-option"
                :class="{ 'btn-option--active': store.config.mixPattern === option.value }"
                @click="store.config.mixPattern = option.value"
              >{{ t(`settingsStep.advanced.se.mixPatternOptions.${option.key}`) }}</button>
            </div>
          </div>
          <div class="param-group">
            <label class="param-label">{{ t('settingsStep.advanced.se.callDensity') }}</label>
            <p class="param-desc">{{ t('settingsStep.advanced.se.callDensityDesc') }}</p>
            <div class="btn-group">
              <button
                v-for="option in callDensityOptions"
                :key="option.key"
                class="btn-option"
                :class="{ 'btn-option--active': store.config.callDensity === option.value }"
                @click="store.config.callDensity = option.value"
              >{{ t(`settingsStep.advanced.se.callDensityOptions.${option.key}`) }}</button>
            </div>
          </div>
        </template>
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

/* Duration */
.duration-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.duration-display {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-color);
  text-shadow: 0 0 12px rgba(var(--accent-rgb), 0.4);
}

.duration-presets {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.duration-btn {
  padding: 0.4rem 0.75rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(var(--accent-rgb), 0.12);
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.duration-btn:hover {
  border-color: rgba(var(--accent-rgb), 0.3);
  color: #FAFAFA;
}

.duration-btn--active {
  background: rgba(var(--accent-rgb), 0.2);
  border-color: var(--accent-color);
  color: #FAFAFA;
}

/* Param Section */
.param-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(var(--accent-rgb), 0.08);
}

.section-desc {
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.5);
  margin: 0;
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

/* Switch Row */
.switch-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.switch-row:hover {
  background: rgba(var(--accent-rgb), 0.05);
}

.switch-row--main {
  background: rgba(25, 25, 35, 0.4);
}

.switch-row input {
  display: none;
}

.switch-track {
  flex-shrink: 0;
  width: 40px;
  height: 22px;
  background: rgba(60, 60, 80, 0.6);
  border-radius: 11px;
  position: relative;
  transition: background 0.2s ease;
}

.switch-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  background: rgba(250, 250, 250, 0.8);
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.switch-row input:checked + .switch-track {
  background: var(--accent-color);
}

.switch-row input:checked + .switch-track::after {
  transform: translateX(18px);
}

.switch-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.switch-label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: #FAFAFA;
}

.switch-desc {
  font-size: 0.7rem;
  color: rgba(250, 250, 250, 0.45);
}
</style>
