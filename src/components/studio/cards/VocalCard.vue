<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore, type WizardConfig } from '@/stores/useWizardStore'
import { useMidiGeneration } from '@/composables/useMidiGeneration'
import SettingSection from '@/components/wizard/SettingSection.vue'
import OptionCard from '@/components/wizard/OptionCard.vue'
import VocalRangeSelector from '@/components/wizard/VocalRangeSelector.vue'
import RangeSlider from '@/components/wizard/RangeSlider.vue'

const { t } = useI18n()
const store = useWizardStore()
const midiGen = useMidiGeneration()

/**
 * Mutate a config value and route the change through the store so the
 * affected generation is invalidated.
 */
function setConfig<K extends keyof WizardConfig>(key: K, value: WizardConfig[K]) {
  store.config[key] = value
  store.onConfigChange(key)
}

// Advanced settings accordion state
const isAdvancedOpen = ref(false)

// Store style presets for attitude validation
const stylePresets = ref<any[]>([])

onMounted(async () => {
  // In the studio, WASM is already initialized before this drawer opens;
  // guard against SSR where window is undefined.
  if (typeof window === 'undefined') return
  await midiGen.initialize()
  stylePresets.value = midiGen.getStylePresets()
})

// Get allowed attitudes for current style (bitmask)
const allowedAttitudes = computed(() => {
  const preset = stylePresets.value.find((p: any) => p.id === store.config.stylePresetId)
  // Default: all attitudes allowed (0b111 = 7)
  return preset?.allowedAttitudes ?? 7
})

// Count how many attitudes are allowed
const allowedAttitudeCount = computed(() => {
  let count = 0
  for (let i = 0; i < 3; i++) {
    if ((allowedAttitudes.value & (1 << i)) !== 0) count++
  }
  return count
})

// Show attitude section only if there are multiple choices
const showAttitudeSection = computed(() => allowedAttitudeCount.value > 1)

// Check if a specific attitude is allowed
function isAttitudeAllowed(attitudeValue: number): boolean {
  const flag = 1 << attitudeValue
  return (allowedAttitudes.value & flag) !== 0
}

// Filter attitude options to only show allowed ones
const filteredAttitudeOptions = computed(() =>
  vocalAttitudeOptions.filter(opt => isAttitudeAllowed(opt.value))
)

// Watch for style changes and auto-fix invalid attitude (ensures valid selection)
watch(allowedAttitudes, (newAllowed) => {
  const currentFlag = 1 << store.config.vocalAttitude
  if ((newAllowed & currentFlag) === 0) {
    // Current attitude not allowed, find first allowed one
    for (let i = 0; i < 3; i++) {
      if ((newAllowed & (1 << i)) !== 0) {
        setConfig('vocalAttitude', i)
        break
      }
    }
  }
})

// Melody template options
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
  { key: 'powerfulShout', value: 12, icon: '🔥' },
  { key: 'kpop', value: 13, icon: '🇰🇷' }
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

// Hook intensity options (4=Maximum: loop-style maximum repetition)
const hookIntensityOptions = [
  { key: 'off', value: 0 },
  { key: 'light', value: 1 },
  { key: 'normal', value: 2 },
  { key: 'strong', value: 3 },
  { key: 'maximum', value: 4 }
]

// Energy curve options (vocal-first: the song structure, including the
// energy arc, is fixed when the vocal is generated)
const energyCurveOptions = [
  { key: 'gradualBuild', value: 0, icon: '📈' },
  { key: 'frontLoaded', value: 1, icon: '⚡' },
  { key: 'wavePattern', value: 2, icon: '🌊' },
  { key: 'steadyState', value: 3, icon: '▬' }
]

// Mora rhythm mode options
const moraRhythmModeOptions = [
  { key: 'standard', value: 0 },
  { key: 'moraTimed', value: 1 },
  { key: 'auto', value: 2 }
]

// ---------------------------------------------
// Sentinel-mapped slider model.
// The WASM API only accepts 0-100 or the sentinel (255) for this override;
// a raw slider over the full byte range would produce invalid configs.
// Map the sentinel (preset) to the rightmost slider position instead.
// ---------------------------------------------

/** 0-100 = override %, rightmost position (101) = preset (255) */
const syncopationProbModel = computed({
  get: () => store.config.melodySyncopationProb === 255 ? 101 : store.config.melodySyncopationProb,
  set: (v: number) => { setConfig('melodySyncopationProb', v >= 101 ? 255 : v) }
})

// Summary for advanced settings
const advancedSummary = computed(() => {
  const parts: string[] = []

  // Vocal Range
  const lowNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][store.config.vocalLow % 12]
  const lowOctave = Math.floor(store.config.vocalLow / 12) - 1
  const highNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][store.config.vocalHigh % 12]
  const highOctave = Math.floor(store.config.vocalHigh / 12) - 1
  parts.push(`${lowNote}${lowOctave}-${highNote}${highOctave}`)

  // Groove (if not straight)
  if (store.config.vocalGroove !== 0) {
    const grooveKey = vocalGrooveOptions.find(o => o.value === store.config.vocalGroove)?.key
    if (grooveKey) {
      parts.push(t(`melodyStep.advanced.vocalGroove.options.${grooveKey}`))
    }
  }

  return parts.join(' · ')
})
</script>

<template>
  <div class="vocal-card">
    <!-- PRIMARY settings -->
    <div class="vocal-card__primary">
      <!-- Melody Template -->
      <SettingSection
        icon="📐"
        :title="t('melodyStep.advanced.melodyTemplate.label')"
        :description="t('melodyStep.advanced.melodyTemplate.description')"
        :hint="t('melodyStep.advanced.melodyTemplate.affectsHint')"
        featured
      >
        <div class="compact-btns compact-btns--grid compact-btns--melody-template">
          <button
            v-for="opt in melodyTemplateOptions"
            :key="opt.key"
            class="compact-btn"
            :class="{ 'compact-btn--active': store.config.melodyTemplate === opt.value }"
            @click="setConfig('melodyTemplate', opt.value)"
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

      <!-- Vocal Style -->
      <SettingSection
        icon="🎭"
        :title="t('melodyStep.advanced.vocalStyle.label')"
        :description="t('melodyStep.advanced.vocalStyle.description')"
        :hint="t('melodyStep.advanced.vocalStyle.affectsHint')"
      >
        <div class="compact-btns compact-btns--grid">
          <button
            v-for="opt in vocalStyleOptions"
            :key="opt.key"
            class="compact-btn"
            :class="{ 'compact-btn--active': store.config.vocalStyle === opt.value }"
            @click="setConfig('vocalStyle', opt.value)"
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

      <!-- Vocal Range -->
      <SettingSection
        icon="🎵"
        :title="t('melodyStep.advanced.vocalRange.label')"
        :description="t('melodyStep.advanced.vocalRange.description')"
      >
        <VocalRangeSelector
          :vocal-low="store.config.vocalLow"
          :vocal-high="store.config.vocalHigh"
          @update:vocal-low="setConfig('vocalLow', $event)"
          @update:vocal-high="setConfig('vocalHigh', $event)"
        />
      </SettingSection>

      <!-- Vocal Attitude (hidden when only one choice available) -->
      <SettingSection
        v-if="showAttitudeSection"
        icon="🎤"
        :title="t('melodyStep.advanced.vocalAttitude.label')"
        :description="t('melodyStep.advanced.vocalAttitude.description')"
      >
        <div class="option-cards">
          <OptionCard
            v-for="option in filteredAttitudeOptions"
            :key="option.key"
            :title="t(`melodyStep.advanced.vocalAttitude.options.${option.key}`)"
            :description="t(`melodyStep.advanced.vocalAttitude.options.${option.key}Desc`)"
            :is-active="store.config.vocalAttitude === option.value"
            @select="setConfig('vocalAttitude', option.value)"
          />
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
            @select="setConfig('melodicComplexity', opt.value)"
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
            @select="setConfig('hookIntensity', opt.value)"
          />
        </div>
      </SettingSection>
    </div>

    <!-- ADVANCED settings accordion -->
    <div class="advanced-accordion" :class="{ 'advanced-accordion--open': isAdvancedOpen }">
      <button class="advanced-accordion__header" @click="isAdvancedOpen = !isAdvancedOpen">
        <span class="advanced-accordion__icon">⚙</span>
        <span class="advanced-accordion__title">{{ t('settingsStep.advanced.toggle') }}</span>
        <span class="advanced-accordion__summary">{{ advancedSummary }}</span>
        <span class="advanced-accordion__chevron">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>

      <Transition name="accordion">
        <div v-show="isAdvancedOpen" class="advanced-accordion__body">
          <div class="advanced-accordion__content">
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
                  @click="setConfig('vocalGroove', opt.value)"
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

            <!-- Energy Curve (song structure is fixed at vocal generation) -->
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
                  @click="setConfig('energyCurve', opt.value)"
                >
                  <span class="compact-btn__icon">{{ opt.icon }}</span>
                  <span>{{ t(`bgmSettingsStep.energyCurve.options.${opt.key}`) }}</span>
                </button>
              </div>
            </SettingSection>

            <!-- Enable Syncopation (+ probability) -->
            <SettingSection
              icon="⚡"
              :title="t('melodyStep.advanced.enableSyncopation.label')"
              :description="t('melodyStep.advanced.enableSyncopation.description')"
            >
              <div class="option-cards option-cards--row">
                <OptionCard
                  title="OFF"
                  :is-active="!store.config.enableSyncopation"
                  compact
                  @select="setConfig('enableSyncopation', false)"
                />
                <OptionCard
                  title="ON"
                  :is-active="store.config.enableSyncopation"
                  compact
                  @select="setConfig('enableSyncopation', true)"
                />
              </div>
              <div v-if="!store.config.enableSyncopation && store.config.vocalGroove >= 3" class="selected-desc">
                <span class="selected-desc__text">{{ t('melodyStep.advanced.enableSyncopation.disabledHint') }}</span>
              </div>
              <!-- Syncopation probability (tied to the toggle above) -->
              <div class="detail-param detail-param--spaced">
                <label class="detail-param__label">{{ t('melodyStep.advanced.melodyDetail.syncopationProb') }}</label>
                <div class="detail-param__slider-row">
                  <input type="range" v-model.number="syncopationProbModel" min="0" max="101" class="detail-param__slider" :disabled="!store.config.enableSyncopation" />
                  <span class="detail-param__value">{{ store.config.melodySyncopationProb === 255 ? t('melodyStep.advanced.melodyDetail.preset') : store.config.melodySyncopationProb + '%' }}</span>
                </div>
              </div>
            </SettingSection>

            <!-- Drive Feel -->
            <SettingSection
              icon="🏎"
              :title="t('melodyStep.advanced.driveFeel.label')"
              :description="t('melodyStep.advanced.driveFeel.description')"
            >
              <RangeSlider
                :model-value="store.config.driveFeel"
                :min="0"
                :max="100"
                :label="t('melodyStep.advanced.driveFeel.label')"
                @update:model-value="setConfig('driveFeel', $event)"
              />
              <div class="slider-labels">
                <span>{{ t('melodyStep.advanced.driveFeel.relaxed') }}</span>
                <span>{{ t('melodyStep.advanced.driveFeel.neutral') }}</span>
                <span>{{ t('melodyStep.advanced.driveFeel.aggressive') }}</span>
              </div>
            </SettingSection>

            <!-- Mora Rhythm Mode -->
            <SettingSection
              icon="🇯🇵"
              :title="t('melodyStep.advanced.moraRhythmMode.label')"
              :description="t('melodyStep.advanced.moraRhythmMode.description')"
            >
              <div class="option-cards option-cards--row">
                <OptionCard
                  v-for="opt in moraRhythmModeOptions"
                  :key="opt.key"
                  :title="t(`melodyStep.advanced.moraRhythmMode.options.${opt.key}`)"
                  :is-active="store.config.moraRhythmMode === opt.value"
                  compact
                  @select="setConfig('moraRhythmMode', opt.value)"
                />
              </div>
            </SettingSection>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.vocal-card {
  --step-accent: var(--studio-pink);
  --accent-rgb: var(--studio-pink-rgb);
  --section-accent: var(--studio-pink);
  --section-accent-rgb: var(--studio-pink-rgb);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vocal-card__primary {
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

/* Fixed-width grid variant - 2 columns (narrow drawer) */
.compact-btns--grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

/* 3-column grid for melody template (8 items) */
.compact-btns--melody-template {
  grid-template-columns: repeat(3, 1fr);
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
  background: rgba(var(--studio-panel-raised-rgb), 0.6);
  border: 1px solid rgba(var(--studio-pink-rgb), 0.12);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(var(--studio-ink-rgb), 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.compact-btn:hover {
  border-color: rgba(var(--studio-pink-rgb), 0.3);
  color: var(--studio-text-primary);
  background: rgba(var(--studio-pink-rgb), 0.08);
}

.compact-btn--active {
  background: rgba(var(--studio-pink-rgb), 0.2);
  border-color: var(--step-accent);
  color: var(--studio-text-primary);
  box-shadow: 0 0 12px -4px rgba(var(--studio-pink-rgb), 0.4);
}

.compact-btn__icon {
  font-size: 0.9rem;
}

/* Selected Description (appears below buttons) */
.selected-desc {
  margin-top: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: linear-gradient(135deg, rgba(var(--studio-pink-rgb), 0.1) 0%, rgba(var(--studio-pink-rgb), 0.08) 100%);
  border: 1px solid rgba(var(--studio-pink-rgb), 0.2);
  border-radius: 10px;
  animation: descFadeIn 0.2s ease-out;
}

/* Preserve the original two-tone pink blend on dark */
.dark .selected-desc {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.08) 100%);
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
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: rgba(var(--studio-ink-rgb), 0.75);
  line-height: 1.5;
}

/* Slider labels (for driveFeel) */
.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.25rem;
  font-size: 0.65rem;
  color: rgba(var(--studio-ink-rgb), 0.4);
}

/* Inline parameter row (syncopation probability) */
.detail-param {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-param--spaced {
  margin-top: 0.875rem;
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

/* Advanced Settings Accordion */
.advanced-accordion {
  border: 1px solid rgba(var(--accent-rgb), 0.12);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(var(--studio-panel-rgb), 0.3);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.advanced-accordion--open {
  border-color: rgba(var(--accent-rgb), 0.25);
  background: rgba(var(--studio-panel-rgb), 0.5);
}

.advanced-accordion__header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
  gap: 0.625rem;
}

.advanced-accordion__header:hover {
  background: rgba(var(--accent-rgb), 0.05);
}

.advanced-accordion__icon {
  font-size: 0.9rem;
  color: rgba(var(--studio-ink-rgb), 0.5);
  transition: color 0.2s ease;
}

.advanced-accordion--open .advanced-accordion__icon {
  color: var(--step-accent);
}

.advanced-accordion__title {
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(var(--studio-ink-rgb), 0.7);
  transition: color 0.2s ease;
}

.advanced-accordion--open .advanced-accordion__title {
  color: rgba(var(--studio-ink-rgb), 0.9);
}

.advanced-accordion__summary {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--step-accent);
  opacity: 0.8;
  padding-right: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50%;
}

.advanced-accordion__chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: rgba(var(--studio-ink-rgb), 0.4);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease;
}

.advanced-accordion--open .advanced-accordion__chevron {
  transform: rotate(180deg);
  color: var(--step-accent);
}

.advanced-accordion__body {
  overflow: hidden;
}

.advanced-accordion__content {
  padding: 0 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Accordion transition */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 640px) {
  .advanced-accordion__header {
    padding: 0.75rem;
  }

  .advanced-accordion__summary {
    display: none;
  }

  .advanced-accordion__content {
    padding: 0 0.75rem 0.75rem;
  }
}
</style>
