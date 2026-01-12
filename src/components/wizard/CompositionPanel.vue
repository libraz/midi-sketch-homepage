<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import OptionCard from './OptionCard.vue'
import MotifSettingsPanel from './MotifSettingsPanel.vue'

const props = defineProps<{
  isExpanded: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

const { t } = useI18n()
const store = useWizardStore()

// Composition style options
const compositionStyleOptions = [
  { key: 'melodyLead', value: 0, icon: '🎤' },
  { key: 'backgroundMotif', value: 1, icon: '🎹' },
  { key: 'synthDriven', value: 2, icon: '🎛️' }
]

// Summary value for header
const summaryValue = computed(() => {
  const labels = [
    t('settingsStep.rack.values.lead'),
    t('settingsStep.rack.values.motif'),
    t('settingsStep.rack.values.synth')
  ]
  return labels[store.config.compositionStyle] || labels[0]
})
</script>

<template>
  <div class="settings-panel" :class="{ 'settings-panel--open': isExpanded }">
    <button class="settings-panel__header" @click="emit('toggle')">
      <span class="settings-panel__title">{{ t('settingsStep.advanced.compositionStyle.label') }}</span>
      <span class="settings-panel__value">{{ summaryValue }}</span>
      <span class="settings-panel__chevron">›</span>
    </button>
    <div v-show="isExpanded" class="settings-panel__body">
      <!-- Composition Mode -->
      <div class="param-group">
        <label class="param-label">{{ t('settingsStep.rack.params.mode') }}</label>
        <p class="param-desc">{{ t('settingsStep.advanced.compositionStyle.description') }}</p>
        <div class="option-cards">
          <OptionCard
            v-for="option in compositionStyleOptions"
            :key="option.key"
            :icon="option.icon"
            :title="t(`settingsStep.advanced.compositionStyle.options.${option.key}`)"
            :description="t(`settingsStep.advanced.compositionStyle.options.${option.key}Desc`)"
            :is-active="store.config.compositionStyle === option.value"
            @select="store.config.compositionStyle = option.value"
          />
        </div>
      </div>

      <!-- Motif Settings (when BackgroundMotif) -->
      <MotifSettingsPanel v-if="store.config.compositionStyle === 1" compact />

      <!-- Arrangement -->
      <div class="param-group">
        <label class="param-label">{{ t('settingsStep.advanced.arrangement.label') }}</label>
        <p class="param-desc">{{ t('settingsStep.advanced.arrangement.growth') }}</p>
        <div class="toggle-group">
          <button class="toggle-btn" :class="{ 'toggle-btn--active': store.config.arrangementGrowth === 0 }" @click="store.config.arrangementGrowth = 0">
            {{ t('settingsStep.advanced.arrangement.growthOptions.layerAdd') }}
          </button>
          <button class="toggle-btn" :class="{ 'toggle-btn--active': store.config.arrangementGrowth === 1 }" @click="store.config.arrangementGrowth = 1">
            {{ t('settingsStep.advanced.arrangement.growthOptions.registerAdd') }}
          </button>
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

/* Option Cards */
.option-cards {
  display: flex;
  gap: 0.5rem;
}

/* Param Group */
.param-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.param-group--half {
  flex: 1;
  min-width: 140px;
}

.param-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
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

/* Toggle Group */
.toggle-group {
  display: flex;
  gap: 0.25rem;
  background: rgba(20, 20, 28, 0.6);
  border-radius: 8px;
  padding: 0.25rem;
}

.toggle-btn {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  color: rgba(250, 250, 250, 0.8);
}

.toggle-btn--active {
  background: rgba(var(--accent-rgb), 0.2);
  color: #FAFAFA;
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
