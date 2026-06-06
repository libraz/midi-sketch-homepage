<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import type { WizardConfig } from '@/stores/useWizardStore'
import SettingSection from '@/components/wizard/SettingSection.vue'
import OptionCard from '@/components/wizard/OptionCard.vue'
import RangeSlider from '@/components/wizard/RangeSlider.vue'

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

// Call density options (0=None, 1=Minimal, 2=Standard, 3=Intense)
const callDensityOptions = [
  { key: 'none', value: 0 },
  { key: 'minimal', value: 1 },
  { key: 'standard', value: 2 },
  { key: 'intense', value: 3 }
]

// Intro chant options (0=None, 1=Gachikoi, 2=Shouting)
const introChantOptions = [
  { key: 'none', value: 0 },
  { key: 'gachikoi', value: 1 },
  { key: 'shouting', value: 2 }
]

// MIX pattern options (0=None, 1=Standard, 2=Tiger)
const mixPatternOptions = [
  { key: 'none', value: 0 },
  { key: 'standard', value: 1 },
  { key: 'tiger', value: 2 }
]
</script>

<template>
  <div class="effects-calls-card">
    <!-- Call & SE -->
    <SettingSection
      icon="📣"
      :title="t('settingsStep.advanced.se.label')"
      :description="t('settingsStep.advanced.se.description')"
    >
      <div class="call-se-settings">
        <!-- SE Track -->
        <div class="sub-setting">
          <label class="sub-setting__label">{{ t('settingsStep.advanced.se.seEnabled') }}</label>
          <div class="option-cards option-cards--row">
            <OptionCard
              title="OFF"
              :is-active="!store.config.seEnabled"
              compact
              @select="setConfig('seEnabled', false)"
            />
            <OptionCard
              title="ON"
              :is-active="store.config.seEnabled"
              compact
              @select="setConfig('seEnabled', true)"
            />
          </div>
          <span class="sub-setting__hint">{{ t('settingsStep.advanced.se.seEnabledDesc') }}</span>
        </div>

        <!-- Call Feature -->
        <div class="sub-setting">
          <label class="sub-setting__label">{{ t('settingsStep.advanced.se.callEnabled') }}</label>
          <div class="option-cards option-cards--row">
            <OptionCard
              title="OFF"
              :is-active="!store.config.callEnabled"
              compact
              @select="setConfig('callEnabled', false)"
            />
            <OptionCard
              title="ON"
              :is-active="store.config.callEnabled"
              compact
              @select="setConfig('callEnabled', true)"
            />
          </div>
          <span class="sub-setting__hint">{{ t('settingsStep.advanced.se.callEnabledDesc') }}</span>
        </div>

        <template v-if="store.config.callEnabled">
          <!-- Call Density -->
          <div class="sub-setting">
            <label class="sub-setting__label">{{ t('settingsStep.advanced.se.callDensity') }}</label>
            <div class="compact-btns">
              <button
                v-for="opt in callDensityOptions"
                :key="opt.key"
                class="compact-btn"
                :class="{ 'compact-btn--active': store.config.callDensity === opt.value }"
                @click="setConfig('callDensity', opt.value)"
              >
                {{ t(`settingsStep.advanced.se.callDensityOptions.${opt.key}`) }}
              </button>
            </div>
          </div>
          <!-- Intro Chant -->
          <div class="sub-setting">
            <label class="sub-setting__label">{{ t('settingsStep.advanced.se.introChant') }}</label>
            <div class="compact-btns">
              <button
                v-for="opt in introChantOptions"
                :key="opt.key"
                class="compact-btn"
                :class="{ 'compact-btn--active': store.config.introChant === opt.value }"
                @click="setConfig('introChant', opt.value)"
              >
                {{ t(`settingsStep.advanced.se.introChantOptions.${opt.key}`) }}
              </button>
            </div>
            <span class="sub-setting__hint">{{ t('settingsStep.advanced.se.introChantDesc') }}</span>
          </div>
          <!-- MIX Pattern -->
          <div class="sub-setting">
            <label class="sub-setting__label">{{ t('settingsStep.advanced.se.mixPattern') }}</label>
            <div class="compact-btns">
              <button
                v-for="opt in mixPatternOptions"
                :key="opt.key"
                class="compact-btn"
                :class="{ 'compact-btn--active': store.config.mixPattern === opt.value }"
                @click="setConfig('mixPattern', opt.value)"
              >
                {{ t(`settingsStep.advanced.se.mixPatternOptions.${opt.key}`) }}
              </button>
            </div>
            <span class="sub-setting__hint">{{ t('settingsStep.advanced.se.mixPatternDesc') }}</span>
          </div>
          <!-- Call Notes -->
          <div class="sub-setting">
            <label class="sub-setting__label">{{ t('settingsStep.advanced.se.callNotesEnabled') }}</label>
            <div class="option-cards option-cards--row">
              <OptionCard
                title="OFF"
                :is-active="!store.config.callNotesEnabled"
                compact
                @select="setConfig('callNotesEnabled', false)"
              />
              <OptionCard
                title="ON"
                :is-active="store.config.callNotesEnabled"
                compact
                @select="setConfig('callNotesEnabled', true)"
              />
            </div>
          </div>
        </template>
      </div>
    </SettingSection>

    <!-- Humanize -->
    <SettingSection
      icon="🎯"
      :title="t('settingsStep.advanced.humanize.label')"
      :description="t('settingsStep.advanced.humanize.description')"
    >
      <div class="humanize-settings">
        <div class="option-cards option-cards--row">
          <OptionCard
            title="OFF"
            :is-active="!store.config.humanize"
            compact
            @select="setConfig('humanize', false)"
          />
          <OptionCard
            title="ON"
            :is-active="store.config.humanize"
            compact
            @select="setConfig('humanize', true)"
          />
        </div>

        <template v-if="store.config.humanize">
          <div class="sub-setting">
            <RangeSlider
              :model-value="store.config.humanizeTiming"
              :label="t('settingsStep.advanced.humanize.timing')"
              @update:model-value="setConfig('humanizeTiming', $event)"
            />
          </div>
          <div class="sub-setting">
            <RangeSlider
              :model-value="store.config.humanizeVelocity"
              :label="t('settingsStep.advanced.humanize.velocity')"
              @update:model-value="setConfig('humanizeVelocity', $event)"
            />
          </div>
        </template>
      </div>
    </SettingSection>
  </div>
</template>

<style scoped>
.effects-calls-card {
  --step-accent: #60A5FA;
  --accent-rgb: 96, 165, 250;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Option cards container */
.option-cards {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Horizontal option cards */
.option-cards--row {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
}

/* Call & SE Settings */
.call-se-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Humanize Settings */
.humanize-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Sub-setting */
.sub-setting {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 0.5rem;
  border-left: 2px solid rgba(96, 165, 250, 0.2);
}

.sub-setting__label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.6);
}

.sub-setting__hint {
  font-size: 0.7rem;
  color: rgba(250, 250, 250, 0.45);
}

/* Compact Buttons */
.compact-btns {
  display: flex;
  width: 100%;
  gap: 0.375rem;
}

.compact-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.5rem 0.5rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(96, 165, 250, 0.12);
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
  border-color: rgba(96, 165, 250, 0.3);
  color: #FAFAFA;
  background: rgba(96, 165, 250, 0.08);
}

.compact-btn--active {
  background: rgba(96, 165, 250, 0.2);
  border-color: var(--step-accent);
  color: #FAFAFA;
  box-shadow: 0 0 12px -4px rgba(96, 165, 250, 0.4);
}
</style>
