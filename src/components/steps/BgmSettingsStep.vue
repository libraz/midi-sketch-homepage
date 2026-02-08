<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { useWizardFlow } from '@/composables/useWizardFlow'
import { blueprintRequiresDrums, blueprintRecommendsArpeggio, AUTO_BLUEPRINT_ID } from '@/data/blueprints'
import { getRecommendedBlueprintId } from '@/data/songImageBlueprint'
import StepHeader from '@/components/wizard/StepHeader.vue'
import SettingSection from '@/components/wizard/SettingSection.vue'
import OptionCard from '@/components/wizard/OptionCard.vue'
import MotifSettingsPanel from '@/components/wizard/MotifSettingsPanel.vue'
import RangeSlider from '@/components/wizard/RangeSlider.vue'

const { t } = useI18n()
const store = useWizardStore()
const { isBgmOnly } = useWizardFlow()

// Composition style options (BGM-only flow)
const compositionStyleOptions = [
  { key: 'melodyLead', value: 0, icon: '🎤' },
  { key: 'backgroundMotif', value: 1, icon: '🎹' },
  { key: 'synthDriven', value: 2, icon: '🎛️' }
]

// Get effective blueprint ID (resolve Auto to recommended)
const effectiveBlueprintId = computed(() => {
  if (store.config.blueprintId === AUTO_BLUEPRINT_ID) {
    return getRecommendedBlueprintId(store.config.songImageId)
  }
  return store.config.blueprintId
})

// Blueprint constraints
const blueprintNeedsDrums = computed(() => blueprintRequiresDrums(effectiveBlueprintId.value))
const blueprintWantsArpeggio = computed(() => blueprintRecommendsArpeggio(effectiveBlueprintId.value))

// Arpeggio pattern options with icons
const arpeggioPatternOptions = [
  { key: 'up', value: 0, icon: '↑' },
  { key: 'down', value: 1, icon: '↓' },
  { key: 'updown', value: 2, icon: '↕' },
  { key: 'random', value: 3, icon: '⚡' },
  { key: 'pinwheel', value: 4, icon: '🔄' },
  { key: 'pedalRoot', value: 5, icon: '🎹' },
  { key: 'alberti', value: 6, icon: '🎶' },
  { key: 'brokenChord', value: 7, icon: '💫' }
]

// Energy curve options
const energyCurveOptions = [
  { key: 'gradualBuild', value: 0, icon: '📈' },
  { key: 'frontLoaded', value: 1, icon: '⚡' },
  { key: 'wavePattern', value: 2, icon: '🌊' },
  { key: 'steadyState', value: 3, icon: '▬' }
]

// Modulation timing options
const modulationTimingOptions = [
  { key: 'none', value: 0 },
  { key: 'lastChorus', value: 1 },
  { key: 'afterBridge', value: 2 },
  { key: 'eachChorus', value: 3 },
  { key: 'random', value: 4 }
]

// Arpeggio speed options
const arpeggioSpeedOptions = [
  { key: 'eighth', value: 0, icon: '♪' },
  { key: 'sixteenth', value: 1, icon: '♬' },
  { key: 'triplet', value: 2, icon: '³' }
]

// No automatic overrides for compositionStyle changes
// User controls arpeggio and modulation explicitly

// Auto-enable drums when blueprint requires it
watch(blueprintNeedsDrums, (needsDrums) => {
  if (needsDrums && !store.config.drumsEnabled) {
    store.config.drumsEnabled = true
  }
}, { immediate: true })
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
            @select="store.config.drumsEnabled = false; store.config.drumsEnabledExplicit = true"
          />
          <OptionCard
            title="ON"
            :is-active="store.config.drumsEnabled"
            compact
            @select="store.config.drumsEnabled = true; store.config.drumsEnabledExplicit = true"
          />
        </div>
        <div v-if="blueprintNeedsDrums && !store.config.drumsEnabled" class="warning-hint">
          {{ t('bgmSettingsStep.drumsRequiredWarning') }}
        </div>
      </SettingSection>

      <!-- Guitar -->
      <SettingSection
        icon="🎸"
        :title="t('bgmSettingsStep.guitar.label')"
        :description="t('bgmSettingsStep.guitar.description')"
      >
        <div class="option-cards option-cards--row">
          <OptionCard
            title="OFF"
            :is-active="!store.config.guitarEnabled"
            compact
            @select="store.config.guitarEnabled = false"
          />
          <OptionCard
            title="ON"
            :is-active="store.config.guitarEnabled"
            compact
            @select="store.config.guitarEnabled = true"
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
              compact
              @select="store.config.arpeggioEnabled = false"
            />
            <OptionCard
              title="ON"
              :is-active="store.config.arpeggioEnabled"
              compact
              @select="store.config.arpeggioEnabled = true"
            />
            <span v-if="blueprintWantsArpeggio && !store.config.arpeggioEnabled" class="recommended-badge">{{ t('bgmSettingsStep.recommendedByBlueprint') }}</span>
          </div>

          <template v-if="store.config.arpeggioEnabled">
            <!-- Pattern -->
            <div class="sub-setting">
              <label class="sub-setting__label">{{ t('settingsStep.advanced.arpeggio.pattern') }}</label>
              <div class="compact-btns compact-btns--grid">
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

      <!-- Energy Curve -->
      <SettingSection
        icon="📊"
        :title="t('bgmSettingsStep.energyCurve.label')"
        :description="t('bgmSettingsStep.energyCurve.description')"
      >
        <div class="compact-btns compact-btns--grid">
          <button
            v-for="opt in energyCurveOptions"
            :key="opt.key"
            class="compact-btn"
            :class="{ 'compact-btn--active': store.config.energyCurve === opt.value }"
            @click="store.config.energyCurve = opt.value"
          >
            <span class="compact-btn__icon">{{ opt.icon }}</span>
            <span>{{ t(`bgmSettingsStep.energyCurve.options.${opt.key}`) }}</span>
          </button>
        </div>
      </SettingSection>

      <!-- Modulation (Key Change) -->
      <SettingSection
        icon="🔀"
        :title="t('settingsStep.tabs.modulation')"
        :description="t('settingsStep.advanced.modulation.description')"
      >
        <div class="sub-setting">
          <label class="sub-setting__label">{{ t('settingsStep.advanced.modulation.timing') }}</label>
          <div class="compact-btns compact-btns--grid">
            <button
              v-for="opt in modulationTimingOptions"
              :key="opt.key"
              class="compact-btn"
              :class="{ 'compact-btn--active': store.config.modulationTiming === opt.value }"
              @click="store.config.modulationTiming = opt.value"
            >
              {{ t(`settingsStep.advanced.modulation.timingOptions.${opt.key}`) }}
            </button>
          </div>
        </div>
        <template v-if="store.config.modulationTiming > 0">
          <div class="sub-setting">
            <label class="sub-setting__label">{{ t('settingsStep.advanced.modulation.semitones') }}</label>
            <div class="compact-btns">
              <button
                v-for="n in 4"
                :key="n"
                class="compact-btn"
                :class="{ 'compact-btn--active': store.config.modulationSemitones === n }"
                @click="store.config.modulationSemitones = n"
              >
                +{{ n }}
              </button>
            </div>
          </div>
        </template>
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
              @select="store.config.humanize = false"
            />
            <OptionCard
              title="ON"
              :is-active="store.config.humanize"
              compact
              @select="store.config.humanize = true"
            />
          </div>

          <template v-if="store.config.humanize">
            <div class="sub-setting">
              <RangeSlider
                v-model="store.config.humanizeTiming"
                :label="t('settingsStep.advanced.humanize.timing')"
              />
            </div>
            <div class="sub-setting">
              <RangeSlider
                v-model="store.config.humanizeVelocity"
                :label="t('settingsStep.advanced.humanize.velocity')"
              />
            </div>
          </template>
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

/* Recommended badge (for blueprint suggestions) */
.recommended-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  padding: 0.25rem 0.5rem;
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 4px;
  color: #22C55E;
  margin-left: 0.5rem;
}

/* Arpeggio Settings */
.arpeggio-settings {
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

/* Warning hint */
.warning-hint {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.2);
  border-radius: 8px;
  font-size: 0.75rem;
  color: rgba(234, 179, 8, 0.9);
}

/* Compact Buttons */
.compact-btns {
  display: flex;
  width: 100%;
  gap: 0.375rem;
}

.compact-btns--grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.375rem;
}

@media (max-width: 640px) {
  .compact-btns--grid {
    grid-template-columns: repeat(2, 1fr);
  }
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
