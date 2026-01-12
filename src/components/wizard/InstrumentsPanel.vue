<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'

const props = defineProps<{
  isExpanded: boolean
  isSynthDriven?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

const { t } = useI18n()
const store = useWizardStore()

// Summary value for header
const summaryValue = computed(() => {
  const parts: string[] = []
  if (store.config.drumsEnabled) parts.push('Drums')
  if (store.config.arpeggioEnabled) parts.push('Arp')
  if (parts.length === 0) return t('settingsStep.rack.values.off')
  return parts.join(' + ')
})
</script>

<template>
  <div class="settings-panel" :class="{ 'settings-panel--open': isExpanded }">
    <button class="settings-panel__header" @click="emit('toggle')">
      <span class="settings-panel__title">{{ t('settingsStep.rack.modules.inst') }}</span>
      <span class="settings-panel__value">{{ summaryValue }}</span>
      <span class="settings-panel__chevron">›</span>
    </button>
    <div v-show="isExpanded" class="settings-panel__body">
      <!-- Drums -->
      <label class="switch-row switch-row--main">
        <input type="checkbox" v-model="store.config.drumsEnabled" />
        <span class="switch-track"></span>
        <div class="switch-content">
          <span class="switch-label">{{ t('settingsStep.advanced.drums.label') }}</span>
          <span class="switch-desc">{{ t('settingsStep.advanced.drums.description') }}</span>
        </div>
      </label>

      <!-- Arpeggio -->
      <div class="param-section">
        <label class="switch-row switch-row--main" :class="{ 'switch-row--forced': isSynthDriven }">
          <input type="checkbox" v-model="store.config.arpeggioEnabled" :disabled="isSynthDriven" />
          <span class="switch-track"></span>
          <div class="switch-content">
            <span class="switch-label">{{ t('settingsStep.advanced.arpeggio.label') }}</span>
            <span class="switch-desc">{{ t('settingsStep.advanced.arpeggio.description') }}</span>
          </div>
          <span v-if="isSynthDriven" class="auto-badge">{{ t('settingsStep.rack.values.auto') }}</span>
        </label>

        <template v-if="store.config.arpeggioEnabled">
          <div class="param-row">
            <div class="param-group param-group--half">
              <label class="param-label">{{ t('settingsStep.advanced.arpeggio.pattern') }}</label>
              <p class="param-desc">{{ t('settingsStep.advanced.arpeggio.patternHint') }}</p>
              <div class="btn-group">
                <button
                  v-for="(p, i) in ['up', 'down', 'updown', 'random']"
                  :key="i"
                  class="btn-option"
                  :class="{ 'btn-option--active': store.config.arpeggioPattern === i }"
                  @click="store.config.arpeggioPattern = i"
                >{{ t(`settingsStep.advanced.arpeggio.patterns.${p}`) }}</button>
              </div>
            </div>
            <div class="param-group param-group--half">
              <label class="param-label">{{ t('settingsStep.advanced.arpeggio.speed') }}</label>
              <p class="param-desc">{{ t('settingsStep.advanced.arpeggio.speedHint') }}</p>
              <div class="btn-group">
                <button
                  v-for="(s, i) in ['eighth', 'sixteenth', 'triplet']"
                  :key="i"
                  class="btn-option"
                  :class="{ 'btn-option--active': store.config.arpeggioSpeed === i }"
                  @click="store.config.arpeggioSpeed = i"
                >{{ t(`settingsStep.advanced.arpeggio.speeds.${s}`) }}</button>
              </div>
            </div>
          </div>
          <div class="param-row">
            <div class="param-group param-group--half">
              <label class="param-label">{{ t('settingsStep.advanced.arpeggio.octaveRange') }}</label>
              <p class="param-desc">{{ t('settingsStep.advanced.arpeggio.octaveRangeHint') }}</p>
              <div class="slider-row">
                <input type="range" v-model.number="store.config.arpeggioOctaveRange" min="1" max="3" class="param-slider" />
                <span class="param-value">{{ store.config.arpeggioOctaveRange }}</span>
              </div>
            </div>
            <div class="param-group param-group--half">
              <label class="param-label">{{ t('settingsStep.advanced.arpeggio.gate') }}</label>
              <p class="param-desc">{{ t('settingsStep.advanced.arpeggio.gateHint') }}</p>
              <div class="slider-row">
                <input type="range" v-model.number="store.config.arpeggioGate" min="10" max="100" class="param-slider" />
                <span class="param-value">{{ store.config.arpeggioGate }}%</span>
              </div>
            </div>
          </div>
          <label class="switch-row">
            <input type="checkbox" v-model="store.config.arpeggioSyncChord" />
            <span class="switch-track"></span>
            <div class="switch-content">
              <span class="switch-label">{{ t('settingsStep.advanced.arpeggio.syncChord') }}</span>
              <span class="switch-desc">{{ t('settingsStep.advanced.arpeggio.syncChordDesc') }}</span>
            </div>
          </label>
        </template>
      </div>

      <!-- Humanize -->
      <div class="param-section">
        <label class="switch-row switch-row--main">
          <input type="checkbox" v-model="store.config.humanize" />
          <span class="switch-track"></span>
          <div class="switch-content">
            <span class="switch-label">{{ t('settingsStep.advanced.humanize.label') }}</span>
            <span class="switch-desc">{{ t('settingsStep.advanced.humanize.description') }}</span>
          </div>
        </label>
        <template v-if="store.config.humanize">
          <div class="param-row">
            <div class="param-group param-group--half">
              <label class="param-label">{{ t('settingsStep.advanced.humanize.timing') }}</label>
              <p class="param-desc">{{ t('settingsStep.advanced.humanize.timingHint') }}</p>
              <div class="slider-row">
                <input type="range" v-model.number="store.config.humanizeTiming" min="0" max="100" class="param-slider" />
                <span class="param-value">{{ store.config.humanizeTiming }}%</span>
              </div>
            </div>
            <div class="param-group param-group--half">
              <label class="param-label">{{ t('settingsStep.advanced.humanize.velocity') }}</label>
              <p class="param-desc">{{ t('settingsStep.advanced.humanize.velocityHint') }}</p>
              <div class="slider-row">
                <input type="range" v-model.number="store.config.humanizeVelocity" min="0" max="100" class="param-slider" />
                <span class="param-value">{{ store.config.humanizeVelocity }}%</span>
              </div>
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

/* Param Section */
.param-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(var(--accent-rgb), 0.08);
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

.switch-row--forced {
  opacity: 0.7;
  cursor: not-allowed;
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

.auto-badge {
  padding: 0.2rem 0.5rem;
  background: rgba(var(--accent-rgb), 0.2);
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--accent-color);
  text-transform: uppercase;
}
</style>
