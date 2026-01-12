<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import StepHeader from '@/components/wizard/StepHeader.vue'
import SettingSection from '@/components/wizard/SettingSection.vue'
import OptionCard from '@/components/wizard/OptionCard.vue'
import VocalRangeSelector from '@/components/wizard/VocalRangeSelector.vue'

const { t } = useI18n()
const store = useWizardStore()

// Melody template options (new WASM parameter)
const melodyTemplateOptions = [
  { key: 'auto', value: 0, icon: '🔮' },
  { key: 'plateauTalk', value: 1, icon: '💭' },
  { key: 'runUpTarget', value: 2, icon: '🎯' },
  { key: 'downResolve', value: 3, icon: '📉' },
  { key: 'hookRepeat', value: 4, icon: '🔁' },
  { key: 'sparseAnchor', value: 5, icon: '🎵' },
  { key: 'callResponse', value: 6, icon: '🎤' },
  { key: 'jumpAccent', value: 7, icon: '⚡' }
]

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
  { key: 'straight', value: 0, icon: '▬' },
  { key: 'offBeat', value: 1, icon: '⌐' },
  { key: 'swing', value: 2, icon: '♪' },
  { key: 'syncopated', value: 3, icon: '⚡' },
  { key: 'driving16th', value: 4, icon: '»' },
  { key: 'bouncy8th', value: 5, icon: '∿' }
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
</script>

<template>
  <div class="melody-step">
    <!-- Header -->
    <StepHeader
      :title="t('melodyStep.title')"
      :subtitle="t('melodyStep.subtitle')"
    />

    <!-- Melody Settings -->
    <div class="melody-settings">
        <!-- Melody Template (NEW - primary setting) -->
        <SettingSection
          icon="🎹"
          :title="t('melodyStep.advanced.melodyTemplate.label')"
          :description="t('melodyStep.advanced.melodyTemplate.description')"
          featured
        >
          <div class="compact-btns compact-btns--grid compact-btns--melody-template">
            <button
              v-for="opt in melodyTemplateOptions"
              :key="opt.key"
              class="compact-btn"
              :class="{ 'compact-btn--active': store.config.melodyTemplate === opt.value }"
              @click="store.config.melodyTemplate = opt.value"
            >
              <span class="compact-btn__icon">{{ opt.icon }}</span>
              <span>{{ t(`melodyStep.advanced.melodyTemplate.options.${opt.key}`) }}</span>
            </button>
          </div>
          <!-- Show description only for selected template -->
          <div v-if="store.config.melodyTemplate !== 0" class="selected-desc">
            <span class="selected-desc__text">{{ t(`melodyStep.advanced.melodyTemplate.options.${melodyTemplateOptions.find(o => o.value === store.config.melodyTemplate)?.key}Desc`) }}</span>
          </div>
        </SettingSection>

        <!-- Vocal Range -->
        <SettingSection
          icon="🎵"
          :title="t('melodyStep.advanced.vocalRange.label')"
          :description="t('melodyStep.advanced.vocalRange.description')"
        >
          <VocalRangeSelector
            :vocal-low="store.config.vocalLow"
            :vocal-high="store.config.vocalHigh"
            @update:vocal-low="store.config.vocalLow = $event"
            @update:vocal-high="store.config.vocalHigh = $event"
          />
        </SettingSection>

        <!-- Vocal Attitude -->
        <SettingSection
          icon="🎤"
          :title="t('melodyStep.advanced.vocalAttitude.label')"
          :description="t('melodyStep.advanced.vocalAttitude.description')"
        >
          <div class="option-cards">
            <OptionCard
              v-for="option in vocalAttitudeOptions"
              :key="option.key"
              :title="t(`melodyStep.advanced.vocalAttitude.options.${option.key}`)"
              :description="t(`melodyStep.advanced.vocalAttitude.options.${option.key}Desc`)"
              :is-active="store.config.vocalAttitude === option.value"
              @select="store.config.vocalAttitude = option.value"
            />
          </div>
        </SettingSection>

        <!-- Vocal Style -->
        <SettingSection
          icon="🎼"
          :title="t('melodyStep.advanced.vocalStyle.label')"
          :description="t('melodyStep.advanced.vocalStyle.description')"
        >
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
        </SettingSection>

        <!-- Vocal Groove -->
        <SettingSection
          icon="🎸"
          :title="t('melodyStep.advanced.vocalGroove.label')"
          :description="t('melodyStep.advanced.vocalGroove.description')"
        >
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
        </SettingSection>

        <!-- Melodic Complexity -->
        <SettingSection
          icon="🎼"
          :title="t('melodyStep.advanced.melodicComplexity.label')"
          :description="t('melodyStep.advanced.melodicComplexity.description')"
        >
          <div class="option-cards option-cards--row">
            <OptionCard
              v-for="opt in melodicComplexityOptions"
              :key="opt.key"
              :title="t(`melodyStep.advanced.melodicComplexity.options.${opt.key}`)"
              :is-active="store.config.melodicComplexity === opt.value"
              compact
              @select="store.config.melodicComplexity = opt.value"
            />
          </div>
        </SettingSection>

        <!-- Hook Intensity -->
        <SettingSection
          icon="🎯"
          :title="t('melodyStep.advanced.hookIntensity.label')"
          :description="t('melodyStep.advanced.hookIntensity.description')"
        >
          <div class="option-cards option-cards--row">
            <OptionCard
              v-for="opt in hookIntensityOptions"
              :key="opt.key"
              :title="t(`melodyStep.advanced.hookIntensity.options.${opt.key}`)"
              :is-active="store.config.hookIntensity === opt.value"
              compact
              @select="store.config.hookIntensity = opt.value"
            />
          </div>
        </SettingSection>

      </div>
  </div>
</template>

<style scoped>
.melody-step {
  --step-accent: #EC4899;
  --accent-rgb: 236, 72, 153;
}

/* Melody Settings */
.melody-settings {
  margin-bottom: 1.5rem;
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

/* 4-column grid for melody template (8 items) */
.compact-btns--melody-template {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 480px) {
  .compact-btns--melody-template {
    grid-template-columns: repeat(2, 1fr);
  }
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
  .compact-btns--grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
