<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { useWizardFlow } from '@/composables/useWizardFlow'
import { blueprintRequiresDrums, blueprintRecommendsArpeggio, blueprintIsRhythmSync, AUTO_BLUEPRINT_ID } from '@/data/blueprints'
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
const blueprintIsRhythmSyncActive = computed(() => blueprintIsRhythmSync(effectiveBlueprintId.value))

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

// Energy curve options (BGM-only flow; in vocal-first flow this is set
// in vocal settings because the song structure is fixed at vocal generation)
const energyCurveOptions = [
  { key: 'gradualBuild', value: 0, icon: '📈' },
  { key: 'frontLoaded', value: 1, icon: '⚡' },
  { key: 'wavePattern', value: 2, icon: '🌊' },
  { key: 'steadyState', value: 3, icon: '▬' }
]

// Arrangement growth options (BGM-only flow)
const arrangementGrowthOptions = [
  { key: 'layerAdd', value: 0, icon: '🧱' },
  { key: 'registerAdd', value: 1, icon: '🪜' }
]

// Arpeggio speed options
const arpeggioSpeedOptions = [
  { key: 'eighth', value: 0, icon: '♪' },
  { key: 'sixteenth', value: 1, icon: '♬' },
  { key: 'triplet', value: 2, icon: '³' }
]

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

// Descriptions for currently enabled chord extensions
const enabledExtDescriptions = computed(() => {
  const list: Array<{ name: string; text: string }> = []
  if (store.config.chordExtSus) list.push({ name: 'sus', text: t('settingsStep.advanced.chordExt.susDesc') })
  if (store.config.chordExt7th) list.push({ name: '7th', text: t('settingsStep.advanced.chordExt.seventhDesc') })
  if (store.config.chordExt9th) list.push({ name: '9th', text: t('settingsStep.advanced.chordExt.ninthDesc') })
  if (store.config.chordExtTritoneSub) {
    list.push({ name: t('settingsStep.advanced.chordExt.tritone'), text: t('settingsStep.advanced.chordExt.tritoneDesc') })
  }
  return list
})

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

    <!-- RhythmSync Info Banner -->
    <div v-if="blueprintIsRhythmSyncActive" class="rhythm-sync-banner">
      <span class="rhythm-sync-banner__icon">🥁</span>
      <span class="rhythm-sync-banner__text">{{ t('bgmSettingsStep.rhythmSyncInfo') }}</span>
    </div>

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
            <!-- Octave Range -->
            <div class="sub-setting">
              <label class="sub-setting__label">{{ t('settingsStep.advanced.arpeggio.octaveRange') }}</label>
              <div class="compact-btns">
                <button
                  v-for="n in 3"
                  :key="n"
                  class="compact-btn"
                  :class="{ 'compact-btn--active': store.config.arpeggioOctaveRange === n }"
                  @click="store.config.arpeggioOctaveRange = n"
                >
                  {{ n }} oct
                </button>
              </div>
            </div>
            <!-- Gate -->
            <div class="sub-setting">
              <RangeSlider
                v-model="store.config.arpeggioGate"
                :min="10"
                :max="100"
                :label="t('settingsStep.advanced.arpeggio.gate')"
              />
              <span class="sub-setting__hint">{{ t('settingsStep.advanced.arpeggio.gateHint') }}</span>
            </div>
            <!-- Chord Sync -->
            <div class="sub-setting">
              <label class="sub-setting__label">{{ t('settingsStep.advanced.arpeggio.syncChord') }}</label>
              <div class="option-cards option-cards--row">
                <OptionCard
                  title="OFF"
                  :is-active="!store.config.arpeggioSyncChord"
                  compact
                  @select="store.config.arpeggioSyncChord = false"
                />
                <OptionCard
                  title="ON"
                  :is-active="store.config.arpeggioSyncChord"
                  compact
                  @select="store.config.arpeggioSyncChord = true"
                />
              </div>
              <span class="sub-setting__hint">{{ t('settingsStep.advanced.arpeggio.syncChordDesc') }}</span>
            </div>
          </template>
        </div>
      </SettingSection>

      <!-- Chord Extensions -->
      <SettingSection
        icon="🎵"
        :title="t('settingsStep.advanced.chordExt.label')"
        :description="t('settingsStep.advanced.chordExt.desc1')"
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
          <OptionCard
            :title="t('settingsStep.advanced.chordExt.tritone')"
            :is-active="store.config.chordExtTritoneSub"
            compact
            @select="store.config.chordExtTritoneSub = !store.config.chordExtTritoneSub"
          />
        </div>
        <!-- Explain the enabled extensions -->
        <div v-if="enabledExtDescriptions.length" class="ext-desc-list">
          <p v-for="d in enabledExtDescriptions" :key="d.name" class="ext-desc-list__item">
            <strong>{{ d.name }}</strong> — {{ d.text }}
          </p>
        </div>
      </SettingSection>

      <!-- Energy Curve (BGM-only: in vocal-first the structure is fixed at vocal generation) -->
      <SettingSection
        v-if="isBgmOnly"
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

      <!-- Arrangement Growth (BGM-only) -->
      <SettingSection
        v-if="isBgmOnly"
        icon="🏗️"
        :title="t('bgmSettingsStep.arrangementGrowth.label')"
        :description="t('bgmSettingsStep.arrangementGrowth.description')"
      >
        <div class="compact-btns">
          <button
            v-for="opt in arrangementGrowthOptions"
            :key="opt.key"
            class="compact-btn"
            :class="{ 'compact-btn--active': store.config.arrangementGrowth === opt.value }"
            @click="store.config.arrangementGrowth = opt.value"
          >
            <span class="compact-btn__icon">{{ opt.icon }}</span>
            <span>{{ t(`bgmSettingsStep.arrangementGrowth.options.${opt.key}`) }}</span>
          </button>
        </div>
      </SettingSection>

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
                @select="store.config.seEnabled = false"
              />
              <OptionCard
                title="ON"
                :is-active="store.config.seEnabled"
                compact
                @select="store.config.seEnabled = true"
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
                @select="store.config.callEnabled = false"
              />
              <OptionCard
                title="ON"
                :is-active="store.config.callEnabled"
                compact
                @select="store.config.callEnabled = true"
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
                  @click="store.config.callDensity = opt.value"
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
                  @click="store.config.introChant = opt.value"
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
                  @click="store.config.mixPattern = opt.value"
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
                  @select="store.config.callNotesEnabled = false"
                />
                <OptionCard
                  title="ON"
                  :is-active="store.config.callNotesEnabled"
                  compact
                  @select="store.config.callNotesEnabled = true"
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

/* RhythmSync Info Banner */
.rhythm-sync-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 10px;
}

.rhythm-sync-banner__icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.rhythm-sync-banner__text {
  font-size: 0.8rem;
  color: rgba(167, 139, 250, 0.9);
  line-height: 1.5;
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

/* Call & SE Settings */
.call-se-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Chord extension descriptions */
.ext-desc-list {
  margin-top: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: rgba(96, 165, 250, 0.06);
  border: 1px solid rgba(96, 165, 250, 0.15);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.ext-desc-list__item {
  margin: 0;
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.65);
  line-height: 1.5;
}

.ext-desc-list__item strong {
  color: rgba(147, 197, 253, 0.9);
}

.sub-setting__hint {
  font-size: 0.7rem;
  color: rgba(250, 250, 250, 0.45);
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
