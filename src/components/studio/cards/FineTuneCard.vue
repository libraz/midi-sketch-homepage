<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import type { WizardConfig } from '@/stores/useWizardStore'
import SettingSection from '@/components/wizard/SettingSection.vue'

const { t } = useI18n()
const store = useWizardStore()

/**
 * Apply a config change and route regeneration invalidation through the store.
 * @param key Config key being mutated.
 * @param value New value to assign.
 */
function setConfig<K extends keyof WizardConfig>(key: K, value: WizardConfig[K]) {
  store.config[key] = value
  store.onConfigChange(key)
}

// Tri-state options (preset / off / on)
const triStateOptions = [
  { key: 'preset', value: 0 },
  { key: 'off', value: 1 },
  { key: 'on', value: 2 }
]

// ---------------------------------------------
// Sentinel-mapped slider models.
// The WASM API only accepts 0-100 or the sentinel (255 / -128) for these
// overrides; raw sliders over the full byte range would produce invalid
// configs (e.g. 150). Map the sentinel to one end of the slider instead.
// ---------------------------------------------

/** 0-100 = override %, rightmost position (101) = preset (255) */
const syncopationProbModel = computed({
  get: () => store.config.melodySyncopationProb === 255 ? 101 : store.config.melodySyncopationProb,
  set: (v: number) => { setConfig('melodySyncopationProb', v >= 101 ? 255 : v) }
})

/** 0-100 = override %, rightmost position (101) = preset (255) */
const longNoteRatioModel = computed({
  get: () => store.config.melodyLongNoteRatio === 255 ? 101 : store.config.melodyLongNoteRatio,
  set: (v: number) => { setConfig('melodyLongNoteRatio', v >= 101 ? 255 : v) }
})

/** -12..+12 = override semitones, leftmost position (-13) = preset (-128) */
const chorusRegisterShiftModel = computed({
  get: () => store.config.melodyChorusRegisterShift === -128 ? -13 : store.config.melodyChorusRegisterShift,
  set: (v: number) => { setConfig('melodyChorusRegisterShift', v <= -13 ? -128 : v) }
})

/** 0 = preset, otherwise override value */
const maxLeapModel = computed({
  get: () => store.config.melodyMaxLeap,
  set: (v: number) => { setConfig('melodyMaxLeap', v) }
})

/** 0 = preset, otherwise override value */
const phraseLengthModel = computed({
  get: () => store.config.melodyPhraseLength,
  set: (v: number) => { setConfig('melodyPhraseLength', v) }
})
</script>

<template>
  <div class="fine-tune-card">
    <SettingSection
      icon="🎶"
      :title="t('melodyStep.advanced.melodyDetail.label')"
      :description="t('melodyStep.advanced.melodyDetail.description')"
    >
      <div class="detail-panel">
        <!-- Row 1: Max Leap / Phrase Length -->
        <div class="detail-panel__grid">
          <div class="detail-param">
            <label class="detail-param__label">{{ t('melodyStep.advanced.melodyDetail.maxLeap') }}</label>
            <div class="detail-param__slider-row">
              <input type="range" v-model.number="maxLeapModel" min="0" max="12" class="detail-param__slider" />
              <span class="detail-param__value">{{ store.config.melodyMaxLeap === 0 ? t('melodyStep.advanced.melodyDetail.preset') : store.config.melodyMaxLeap }}</span>
            </div>
          </div>
          <div class="detail-param">
            <label class="detail-param__label">{{ t('melodyStep.advanced.melodyDetail.phraseLength') }}</label>
            <div class="detail-param__slider-row">
              <input type="range" v-model.number="phraseLengthModel" min="0" max="8" class="detail-param__slider" />
              <span class="detail-param__value">{{ store.config.melodyPhraseLength === 0 ? t('melodyStep.advanced.melodyDetail.preset') : store.config.melodyPhraseLength }}</span>
            </div>
          </div>
        </div>

        <!-- Row 2: Syncopation Prob / Long Note Ratio -->
        <div class="detail-panel__grid">
          <div class="detail-param">
            <label class="detail-param__label">{{ t('melodyStep.advanced.melodyDetail.syncopationProb') }}</label>
            <div class="detail-param__slider-row">
              <input type="range" v-model.number="syncopationProbModel" min="0" max="101" class="detail-param__slider" :disabled="!store.config.enableSyncopation" />
              <span class="detail-param__value">{{ store.config.melodySyncopationProb === 255 ? t('melodyStep.advanced.melodyDetail.preset') : store.config.melodySyncopationProb + '%' }}</span>
            </div>
          </div>
          <div class="detail-param">
            <label class="detail-param__label">{{ t('melodyStep.advanced.melodyDetail.longNoteRatio') }}</label>
            <div class="detail-param__slider-row">
              <input type="range" v-model.number="longNoteRatioModel" min="0" max="101" class="detail-param__slider" />
              <span class="detail-param__value">{{ store.config.melodyLongNoteRatio === 255 ? t('melodyStep.advanced.melodyDetail.preset') : store.config.melodyLongNoteRatio + '%' }}</span>
            </div>
          </div>
        </div>

        <!-- Row 3: Chorus Register Shift (full width) -->
        <div class="detail-param">
          <label class="detail-param__label">{{ t('melodyStep.advanced.melodyDetail.chorusRegisterShift') }}</label>
          <div class="detail-param__slider-row">
            <input type="range" v-model.number="chorusRegisterShiftModel" min="-13" max="12" class="detail-param__slider" />
            <span class="detail-param__value">{{ store.config.melodyChorusRegisterShift === -128 ? t('melodyStep.advanced.melodyDetail.preset') : (store.config.melodyChorusRegisterShift > 0 ? '+' : '') + store.config.melodyChorusRegisterShift }}</span>
          </div>
        </div>

        <!-- Row 4: Hook Repetition / Leading Tone (toggle groups) -->
        <div class="detail-panel__grid">
          <div class="detail-param">
            <label class="detail-param__label">{{ t('melodyStep.advanced.melodyDetail.hookRepetition') }}</label>
            <div class="detail-toggle-group">
              <button
                v-for="opt in triStateOptions"
                :key="opt.key"
                class="detail-toggle-btn"
                :class="{ 'detail-toggle-btn--active': store.config.melodyHookRepetition === opt.value }"
                @click="setConfig('melodyHookRepetition', opt.value)"
              >
                {{ t(`melodyStep.advanced.melodyDetail.triState.${opt.key}`) }}
              </button>
            </div>
          </div>
          <div class="detail-param">
            <label class="detail-param__label">{{ t('melodyStep.advanced.melodyDetail.useLeadingTone') }}</label>
            <div class="detail-toggle-group">
              <button
                v-for="opt in triStateOptions"
                :key="opt.key"
                class="detail-toggle-btn"
                :class="{ 'detail-toggle-btn--active': store.config.melodyUseLeadingTone === opt.value }"
                @click="setConfig('melodyUseLeadingTone', opt.value)"
              >
                {{ t(`melodyStep.advanced.melodyDetail.triState.${opt.key}`) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SettingSection>
  </div>
</template>

<style scoped>
.fine-tune-card {
  --step-accent: var(--studio-pink);
  --accent-rgb: var(--studio-pink-rgb);
  --section-accent: var(--studio-pink);
  --section-accent-rgb: var(--studio-pink-rgb);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Detail Panel (matches MotifSettingsPanel pattern) */
.detail-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: rgba(var(--accent-rgb), 0.05);
  border: 1px solid rgba(var(--accent-rgb), 0.15);
  border-radius: 10px;
}

.detail-panel__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 480px) {
  .detail-panel__grid {
    grid-template-columns: 1fr;
  }
}

.detail-param {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-param__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(var(--studio-ink-rgb), 0.7);
}

.detail-param__slider-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detail-param__slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(var(--accent-rgb), 0.15);
  border-radius: 3px;
  cursor: pointer;
}

.detail-param__slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: var(--step-accent);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(var(--accent-rgb), 0.4);
}

.detail-param__slider:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.detail-param__value {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--step-accent);
  min-width: 3rem;
  text-align: right;
}

/* Toggle group (matches MotifSettingsPanel) */
.detail-toggle-group {
  display: flex;
  gap: 0.25rem;
  background: rgba(var(--studio-panel-rgb), 0.6);
  border-radius: 8px;
  padding: 0.25rem;
}

.detail-toggle-btn {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(var(--studio-ink-rgb), 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.detail-toggle-btn:hover {
  color: rgba(var(--studio-ink-rgb), 0.8);
}

.detail-toggle-btn--active {
  background: rgba(var(--accent-rgb), 0.2);
  color: var(--studio-text-primary);
}
</style>
