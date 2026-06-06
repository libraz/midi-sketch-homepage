<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { AUTO_BLUEPRINT_ID, blueprintIgnoresMotifScope } from '@/data/blueprints'
import { getRecommendedBlueprintId } from '@/data/songImageBlueprint'

defineProps<{
  compact?: boolean
}>()

const { t } = useI18n()
const store = useWizardStore()

// Get the effective blueprint ID (resolve Auto)
const effectiveBlueprintId = computed(() => {
  if (store.config.blueprintId === AUTO_BLUEPRINT_ID) {
    return getRecommendedBlueprintId(store.config.songImageId)
  }
  return store.config.blueprintId
})

// Check if motifRepeatScope is controlled by Blueprint (should be hidden)
const hideRepeatScope = computed(() => {
  return blueprintIgnoresMotifScope(effectiveBlueprintId.value)
})

// Motif length options
const motifLengthOptions = [
  { key: 'auto', value: 0 },
  { key: '1beat', value: 1 },
  { key: '2beat', value: 2 },
  { key: '4beat', value: 4 }
]

// Motif motion options
const motifMotionOptions = [
  { key: 'auto', value: 255 },
  { key: 'stepwise', value: 0 },
  { key: 'gentleLeap', value: 1 },
  { key: 'wideLeap', value: 2 },
  { key: 'narrowStep', value: 3 },
  { key: 'disjunct', value: 4 },
  { key: 'ostinato', value: 5 }
]

// Sentinel-mapped slider models: the WASM API rejects 1 for maxChordCount
// (valid: 0=no limit, 2-8) and 1-2 for noteCount (valid: 0=auto, 3-8),
// so map the sentinel to the leftmost slider position.
const maxChordCountModel = computed({
  get: () => store.config.motifMaxChordCount === 0 ? 1 : store.config.motifMaxChordCount,
  set: (v: number) => { store.config.motifMaxChordCount = v <= 1 ? 0 : v }
})

const noteCountModel = computed({
  get: () => store.config.motifNoteCount === 0 ? 2 : store.config.motifNoteCount,
  set: (v: number) => { store.config.motifNoteCount = v <= 2 ? 0 : v }
})

// Motif register options
const motifRegisterOptions = [
  { key: 'auto', value: 0 },
  { key: 'low', value: 1 },
  { key: 'high', value: 2 }
]

// Motif rhythm density options
const motifRhythmDensityOptions = [
  { key: 'auto', value: 255 },
  { key: 'sparse', value: 0 },
  { key: 'medium', value: 1 },
  { key: 'driving', value: 2 }
]
</script>

<template>
  <div class="motif-settings" :class="{ 'motif-settings--compact': compact }">
    <div class="motif-settings__header">
      <span class="motif-settings__icon">🎼</span>
      <span class="motif-settings__title">{{ t('settingsStep.advanced.compositionStyle.motifSettings.label') }}</span>
    </div>

    <div class="motif-settings__grid" :class="{ 'motif-settings__grid--single': hideRepeatScope }">
      <!-- Repeat Scope (hidden when Blueprint controls it) -->
      <div v-if="!hideRepeatScope" class="motif-param">
        <label class="motif-param__label">{{ t('settingsStep.advanced.compositionStyle.motifSettings.repeatScope') }}</label>
        <div class="toggle-group">
          <button
            class="toggle-btn"
            :class="{ 'toggle-btn--active': store.config.motifRepeatScope === 0 }"
            @click="store.config.motifRepeatScope = 0"
          >
            {{ t('settingsStep.advanced.compositionStyle.motifSettings.repeatScopeOptions.fullSong') }}
          </button>
          <button
            class="toggle-btn"
            :class="{ 'toggle-btn--active': store.config.motifRepeatScope === 1 }"
            @click="store.config.motifRepeatScope = 1"
          >
            {{ t('settingsStep.advanced.compositionStyle.motifSettings.repeatScopeOptions.section') }}
          </button>
        </div>
      </div>

      <!-- Max Chord Count -->
      <div class="motif-param">
        <label class="motif-param__label">{{ t('settingsStep.advanced.compositionStyle.motifSettings.maxChordCount') }}</label>
        <div class="slider-row">
          <input
            type="range"
            v-model.number="maxChordCountModel"
            min="1"
            max="8"
            class="motif-slider"
          />
          <span class="motif-value">{{ store.config.motifMaxChordCount === 0 ? '∞' : store.config.motifMaxChordCount }}</span>
        </div>
      </div>
    </div>

    <!-- Fixed Progression -->
    <label class="switch-row">
      <input type="checkbox" v-model="store.config.motifFixedProgression" />
      <span class="switch-track"></span>
      <div class="switch-content">
        <span class="switch-label">{{ t('settingsStep.advanced.compositionStyle.motifSettings.fixedProgression') }}</span>
        <span class="switch-desc">{{ t('settingsStep.advanced.compositionStyle.motifSettings.fixedProgressionDesc') }}</span>
      </div>
    </label>

    <!-- Motif Detail Overrides -->
    <div class="motif-detail">
      <div class="motif-detail__header">
        <span class="motif-settings__icon">🔧</span>
        <span class="motif-settings__title">{{ t('settingsStep.advanced.compositionStyle.motifSettings.detailLabel') }}</span>
      </div>

      <div class="motif-settings__grid">
        <!-- Motif Length -->
        <div class="motif-param">
          <label class="motif-param__label">{{ t('settingsStep.advanced.compositionStyle.motifSettings.motifLength') }}</label>
          <div class="toggle-group">
            <button
              v-for="opt in motifLengthOptions"
              :key="opt.key"
              class="toggle-btn"
              :class="{ 'toggle-btn--active': store.config.motifLength === opt.value }"
              @click="store.config.motifLength = opt.value"
            >
              {{ t(`settingsStep.advanced.compositionStyle.motifSettings.motifLengthOptions.${opt.key}`) }}
            </button>
          </div>
        </div>

        <!-- Motif Note Count -->
        <div class="motif-param">
          <label class="motif-param__label">{{ t('settingsStep.advanced.compositionStyle.motifSettings.motifNoteCount') }}</label>
          <div class="slider-row">
            <input
              type="range"
              v-model.number="noteCountModel"
              min="2"
              max="8"
              class="motif-slider"
            />
            <span class="motif-value">{{ store.config.motifNoteCount === 0 ? 'Auto' : store.config.motifNoteCount }}</span>
          </div>
        </div>
      </div>

      <div class="motif-settings__grid">
        <!-- Motif Motion -->
        <div class="motif-param">
          <label class="motif-param__label">{{ t('settingsStep.advanced.compositionStyle.motifSettings.motifMotion') }}</label>
          <div class="toggle-group toggle-group--wrap">
            <button
              v-for="opt in motifMotionOptions"
              :key="opt.key"
              class="toggle-btn"
              :class="{ 'toggle-btn--active': store.config.motifMotion === opt.value }"
              @click="store.config.motifMotion = opt.value"
            >
              {{ t(`settingsStep.advanced.compositionStyle.motifSettings.motifMotionOptions.${opt.key}`) }}
            </button>
          </div>
        </div>

        <!-- Motif Register -->
        <div class="motif-param">
          <label class="motif-param__label">{{ t('settingsStep.advanced.compositionStyle.motifSettings.motifRegister') }}</label>
          <div class="toggle-group">
            <button
              v-for="opt in motifRegisterOptions"
              :key="opt.key"
              class="toggle-btn"
              :class="{ 'toggle-btn--active': store.config.motifRegisterHigh === opt.value }"
              @click="store.config.motifRegisterHigh = opt.value"
            >
              {{ t(`settingsStep.advanced.compositionStyle.motifSettings.motifRegisterOptions.${opt.key}`) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Motif Rhythm Density -->
      <div class="motif-param">
        <label class="motif-param__label">{{ t('settingsStep.advanced.compositionStyle.motifSettings.motifRhythmDensity') }}</label>
        <div class="toggle-group">
          <button
            v-for="opt in motifRhythmDensityOptions"
            :key="opt.key"
            class="toggle-btn"
            :class="{ 'toggle-btn--active': store.config.motifRhythmDensity === opt.value }"
            @click="store.config.motifRhythmDensity = opt.value"
          >
            {{ t(`settingsStep.advanced.compositionStyle.motifSettings.motifRhythmDensityOptions.${opt.key}`) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.motif-settings {
  --accent-color: var(--step-accent, #60A5FA);
  --accent-rgb: 96, 165, 250;
  padding: 1rem;
  background: rgba(var(--accent-rgb), 0.05);
  border: 1px solid rgba(var(--accent-rgb), 0.15);
  border-radius: 10px;
}

.motif-settings--compact {
  padding: 0.75rem;
}

.motif-settings__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.motif-settings--compact .motif-settings__header {
  margin-bottom: 0.75rem;
}

.motif-settings__icon {
  font-size: 1rem;
}

.motif-settings__title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: #FAFAFA;
}

.motif-settings__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.motif-settings__grid--single {
  grid-template-columns: 1fr;
}

.motif-settings--compact .motif-settings__grid {
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

@media (max-width: 640px) {
  .motif-settings__grid {
    grid-template-columns: 1fr;
  }
}

.motif-param {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.motif-param__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.7);
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

.motif-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(var(--accent-rgb), 0.15);
  border-radius: 3px;
  cursor: pointer;
}

.motif-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: var(--accent-color);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(var(--accent-rgb), 0.4);
}

.motif-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-color);
  min-width: 1.5rem;
  text-align: right;
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

.motif-settings--compact .switch-row {
  padding: 0.5rem;
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

/* Motif Detail */
.motif-detail {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(var(--accent-rgb), 0.1);
}

.motif-detail__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.toggle-group--wrap {
  flex-wrap: wrap;
}
</style>
