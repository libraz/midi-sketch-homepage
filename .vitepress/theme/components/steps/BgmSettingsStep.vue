<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import { useWizardFlow } from '../../composables/useWizardFlow'
import StepHeader from '../wizard/StepHeader.vue'
import SettingSection from '../wizard/SettingSection.vue'
import OptionCard from '../wizard/OptionCard.vue'
import MotifSettingsPanel from '../wizard/MotifSettingsPanel.vue'

const { t } = useI18n()
const store = useWizardStore()
const { isBgmOnly } = useWizardFlow()

// Composition style options (BGM-only flow)
const compositionStyleOptions = [
  { key: 'melodyLead', value: 0, icon: '🎤' },
  { key: 'backgroundMotif', value: 1, icon: '🎹' },
  { key: 'synthDriven', value: 2, icon: '🎛️' }
]

// SynthDriven forces arpeggio on
const isSynthDriven = computed(() => store.config.compositionStyle === 2)

// Arpeggio pattern options with icons
const arpeggioPatternOptions = [
  { key: 'up', value: 0, icon: '↑' },
  { key: 'down', value: 1, icon: '↓' },
  { key: 'updown', value: 2, icon: '↕' },
  { key: 'random', value: 3, icon: '⚡' }
]

// Arpeggio speed options
const arpeggioSpeedOptions = [
  { key: 'eighth', value: 0, icon: '♪' },
  { key: 'sixteenth', value: 1, icon: '♬' },
  { key: 'triplet', value: 2, icon: '³' }
]

// Sync implicit settings when compositionStyle changes
watch(() => store.config.compositionStyle, (newStyle, oldStyle) => {
  if (newStyle === 2) {
    store.config.arpeggioEnabled = true
  } else if (oldStyle === 2) {
    store.config.arpeggioEnabled = false
  }
  if (newStyle === 1 || newStyle === 2) {
    store.config.modulationTiming = 0
  }
})
</script>

<template>
  <div class="bgm-settings-step">
    <!-- Header -->
    <StepHeader
      :title="t('bgmSettingsStep.title')"
      :subtitle="t('bgmSettingsStep.subtitle')"
    />

    <div class="bgm-settings">
      <!-- Composition Style (BGM-only flow) -->
      <SettingSection
        v-if="isBgmOnly"
        icon="🎹"
        :title="t('settingsStep.advanced.compositionStyle.label')"
        :description="t('settingsStep.advanced.compositionStyle.description')"
        featured
      >
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
        <!-- Motif Settings (when BackgroundMotif) -->
        <MotifSettingsPanel v-if="store.config.compositionStyle === 1" class="motif-panel" />
      </SettingSection>

      <!-- Drums -->
      <SettingSection
        icon="🥁"
        :title="t('settingsStep.advanced.drums.label')"
        :description="t('settingsStep.advanced.drums.description')"
      >
        <div class="option-cards option-cards--row">
          <OptionCard
            title="OFF"
            :is-active="!store.config.drumsEnabled"
            compact
            @select="store.config.drumsEnabled = false"
          />
          <OptionCard
            title="ON"
            :is-active="store.config.drumsEnabled"
            compact
            @select="store.config.drumsEnabled = true"
          />
        </div>
      </SettingSection>

      <!-- Arpeggio -->
      <SettingSection
        icon="🎹"
        :title="t('settingsStep.advanced.arpeggio.label')"
        :description="t('settingsStep.advanced.arpeggio.description')"
      >
        <div class="arpeggio-settings">
          <div class="option-cards option-cards--row">
            <OptionCard
              title="OFF"
              :is-active="!store.config.arpeggioEnabled"
              :disabled="isSynthDriven"
              compact
              @select="store.config.arpeggioEnabled = false"
            />
            <OptionCard
              title="ON"
              :is-active="store.config.arpeggioEnabled"
              :disabled="isSynthDriven"
              compact
              @select="store.config.arpeggioEnabled = true"
            />
            <span v-if="isSynthDriven" class="auto-badge">AUTO</span>
          </div>

          <template v-if="store.config.arpeggioEnabled">
            <!-- Pattern -->
            <div class="sub-setting">
              <label class="sub-setting__label">{{ t('settingsStep.advanced.arpeggio.pattern') }}</label>
              <div class="compact-btns">
                <button
                  v-for="opt in arpeggioPatternOptions"
                  :key="opt.key"
                  class="compact-btn"
                  :class="{ 'compact-btn--active': store.config.arpeggioPattern === opt.value }"
                  @click="store.config.arpeggioPattern = opt.value"
                >
                  <span class="compact-btn__icon">{{ opt.icon }}</span>
                  <span>{{ t(`settingsStep.advanced.arpeggio.patterns.${opt.key}`) }}</span>
                </button>
              </div>
            </div>
            <!-- Speed -->
            <div class="sub-setting">
              <label class="sub-setting__label">{{ t('settingsStep.advanced.arpeggio.speed') }}</label>
              <div class="compact-btns">
                <button
                  v-for="opt in arpeggioSpeedOptions"
                  :key="opt.key"
                  class="compact-btn"
                  :class="{ 'compact-btn--active': store.config.arpeggioSpeed === opt.value }"
                  @click="store.config.arpeggioSpeed = opt.value"
                >
                  <span class="compact-btn__icon">{{ opt.icon }}</span>
                  <span>{{ t(`settingsStep.advanced.arpeggio.speeds.${opt.key}`) }}</span>
                </button>
              </div>
            </div>
          </template>
        </div>
      </SettingSection>

      <!-- Chord Extensions -->
      <SettingSection
        icon="🎵"
        :title="t('settingsStep.advanced.chordExt.label')"
        :description="t('settingsStep.advanced.chordExt.description')"
      >
        <div class="option-cards option-cards--row">
          <OptionCard
            title="sus"
            :is-active="store.config.chordExtSus"
            compact
            @select="store.config.chordExtSus = !store.config.chordExtSus"
          />
          <OptionCard
            title="7th"
            :is-active="store.config.chordExt7th"
            compact
            @select="store.config.chordExt7th = !store.config.chordExt7th"
          />
          <OptionCard
            title="9th"
            :is-active="store.config.chordExt9th"
            compact
            @select="store.config.chordExt9th = !store.config.chordExt9th"
          />
        </div>
      </SettingSection>

      <!-- Humanize -->
      <SettingSection
        icon="🎯"
        :title="t('settingsStep.advanced.humanize.label')"
        :description="t('settingsStep.advanced.humanize.description')"
      >
        <div class="option-cards option-cards--row">
          <OptionCard
            title="OFF"
            :is-active="!store.config.humanize"
            compact
            @select="store.config.humanize = false"
          />
          <OptionCard
            title="ON"
            :is-active="store.config.humanize"
            compact
            @select="store.config.humanize = true"
          />
        </div>
      </SettingSection>
    </div>
  </div>
</template>

<style scoped>
.bgm-settings-step {
  --step-accent: #60A5FA;
  --accent-rgb: 96, 165, 250;
}

.bgm-settings {
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

/* Motif panel */
.motif-panel {
  margin-top: 1rem;
}

/* Auto badge */
.auto-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  padding: 0.25rem 0.5rem;
  background: rgba(96, 165, 250, 0.2);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 4px;
  color: var(--step-accent);
  margin-left: 0.5rem;
}

/* Arpeggio Settings */
.arpeggio-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Sub-setting (Pattern, Speed) */
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

.compact-btn__icon {
  font-size: 0.9rem;
}
</style>
