<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import {
  BLUEPRINT_OPTIONS,
  AUTO_BLUEPRINT_ID,
  blueprintRequiresDrums,
  blueprintRecommendsArpeggio,
  blueprintIsRhythmSync,
} from '@/data/blueprints'
import { getRecommendedBlueprintId } from '@/data/songImageBlueprint'
import SettingSection from '@/components/wizard/SettingSection.vue'
import OptionCard from '@/components/wizard/OptionCard.vue'
import MotifSettingsPanel from '@/components/wizard/MotifSettingsPanel.vue'
import RangeSlider from '@/components/wizard/RangeSlider.vue'

const { t, locale } = useI18n()
const store = useWizardStore()

// BGM-only flow gates a few sections (composition style, energy curve, growth).
const isBgmOnly = computed(() => store.config.flowType === 'bgm-only')

// Composition style options (BGM-only flow)
const compositionStyleOptions = [
  { key: 'melodyLead', value: 0, icon: '🎤' },
  { key: 'backgroundMotif', value: 1, icon: '🎹' },
  { key: 'synthDriven', value: 2, icon: '🎛️' }
]

// Recommended blueprint based on current songImage
const recommendedBlueprintId = computed(() => getRecommendedBlueprintId(store.config.songImageId))

// Get effective blueprint ID (resolve Auto to recommended)
const effectiveBlueprintId = computed(() => {
  if (store.config.blueprintId === AUTO_BLUEPRINT_ID) {
    return recommendedBlueprintId.value
  }
  return store.config.blueprintId
})

// Blueprint constraints
const blueprintNeedsDrums = computed(() => blueprintRequiresDrums(effectiveBlueprintId.value))
const blueprintWantsArpeggio = computed(() => blueprintRecommendsArpeggio(effectiveBlueprintId.value))
const blueprintIsRhythmSyncActive = computed(() => blueprintIsRhythmSync(effectiveBlueprintId.value))

// Blueprint options with recommended badge and RhythmSync/drums tags (excludes Auto)
const blueprintOptions = computed(() => {
  const lang = locale.value as 'en' | 'ja'
  return BLUEPRINT_OPTIONS
    .filter(bp => bp.id !== AUTO_BLUEPRINT_ID)
    .map(bp => ({
      ...bp,
      label: bp.label[lang],
      description: bp.description[lang],
      isRecommended: bp.id === recommendedBlueprintId.value,
      isRhythmSync: bp.paradigm === 'rhythm',
    }))
})

function selectBlueprint(id: number) {
  store.config.blueprintId = id
  store.onConfigChange('blueprintId')
}

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

// Arpeggio speed options
const arpeggioSpeedOptions = [
  { key: 'eighth', value: 0, icon: '♪' },
  { key: 'sixteenth', value: 1, icon: '♬' },
  { key: 'triplet', value: 2, icon: '³' }
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

// Chord extension probability sliders, paired with their toggle/recommendation hint
const chordExtProbControls = [
  { enabledKey: 'chordExtSus', probKey: 'chordExtSusProb', hint: 'settingsStep.advanced.chordExt.susHint' },
  { enabledKey: 'chordExt7th', probKey: 'chordExt7thProb', hint: 'settingsStep.advanced.chordExt.seventhHint' },
  { enabledKey: 'chordExt9th', probKey: 'chordExt9thProb', hint: 'settingsStep.advanced.chordExt.ninthHint' },
  { enabledKey: 'chordExtTritoneSub', probKey: 'chordExtTritoneSubProb', hint: '' },
] as const

// Labels for the probability sliders (reuse the toggle labels)
const chordExtLabel: Record<string, string> = {
  chordExtSus: 'sus',
  chordExt7th: '7th',
  chordExt9th: '9th',
}

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

// Any enabled extension reveals the advanced probability subsection
const hasEnabledExt = computed(() =>
  store.config.chordExtSus || store.config.chordExt7th || store.config.chordExt9th || store.config.chordExtTritoneSub
)

const showProbAdvanced = ref(false)

// Editing a probability slider marks the values as user-controlled
function onProbInput(key: string) {
  store.config.chordExtProbExplicit = true
  store.onConfigChange(key as Parameters<typeof store.onConfigChange>[0])
}

// Auto-enable drums when blueprint requires it
watch(blueprintNeedsDrums, (needsDrums) => {
  if (needsDrums && !store.config.drumsEnabled) {
    store.config.drumsEnabled = true
  }
}, { immediate: true })
</script>

<template>
  <div class="arrangement-card">
    <!-- RhythmSync Info Banner -->
    <div v-if="blueprintIsRhythmSyncActive" class="rhythm-sync-banner">
      <span class="rhythm-sync-banner__icon">🥁</span>
      <span class="rhythm-sync-banner__text">{{ t('bgmSettingsStep.rhythmSyncInfo') }}</span>
    </div>

    <div class="arrangement-body">
      <!-- Production Blueprint -->
      <SettingSection
        icon="🎛️"
        :title="t('styleStep.arrangementStyle.title')"
        :description="t('styleStep.arrangementStyle.description')"
        featured
      >
        <span class="arrangement-hint">{{ t('styleStep.arrangementStyle.affectsHint') }}</span>

        <div class="blueprint-grid">
          <article
            v-for="bp in blueprintOptions"
            :key="bp.id"
            class="blueprint-card"
            :class="{ 'blueprint-card--selected': store.config.blueprintId === bp.id }"
            @click="selectBlueprint(bp.id)"
            role="button"
            :aria-pressed="store.config.blueprintId === bp.id"
          >
            <div class="blueprint-card__glow"></div>

            <div class="blueprint-card__content">
              <div class="blueprint-card__head">
                <div class="blueprint-card__icon-wrap">
                  <span class="blueprint-card__icon">{{ bp.icon }}</span>
                </div>
                <div class="blueprint-card__chips">
                  <span v-if="bp.isRecommended" class="blueprint-card__badge">{{ t('styleStep.arrangementStyle.recommendedBadge') }}</span>
                  <span v-if="bp.isRhythmSync" class="blueprint-card__rhythm-tag">{{ t('styleStep.arrangementStyle.rhythmSyncTag') }}</span>
                  <span v-if="bp.requiresDrums" class="blueprint-card__drums-tag" :title="t('styleStep.arrangementStyle.drumsRequiredTag')">🥁</span>
                </div>
              </div>

              <h3 class="blueprint-card__name">{{ bp.label }}</h3>
              <p class="blueprint-card__desc">{{ bp.description }}</p>
            </div>

            <div class="blueprint-card__check" v-if="store.config.blueprintId === bp.id">
              <span>✓</span>
            </div>
          </article>
        </div>
      </SettingSection>

      <!-- Composition Style (BGM-only flow) -->
      <SettingSection
        v-if="isBgmOnly"
        icon="🎹"
        :title="t('settingsStep.advanced.compositionStyle.label')"
        :description="t('settingsStep.advanced.compositionStyle.description')"
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

        <!-- Advanced: per-extension probability sliders (collapsed) -->
        <div v-if="hasEnabledExt" class="prob-advanced">
          <button class="prob-advanced__toggle" type="button" @click="showProbAdvanced = !showProbAdvanced">
            <span class="prob-advanced__caret" :class="{ 'prob-advanced__caret--open': showProbAdvanced }">▸</span>
            <span>{{ t('settingsStep.advanced.chordExt.probability') }}</span>
          </button>

          <div v-if="showProbAdvanced" class="prob-advanced__body">
            <span class="sub-setting__hint">{{ t('settingsStep.advanced.chordExt.desc2') }}</span>

            <template v-for="ctrl in chordExtProbControls" :key="ctrl.probKey">
              <div v-if="store.config[ctrl.enabledKey]" class="sub-setting">
                <RangeSlider
                  :model-value="store.config[ctrl.probKey]"
                  :min="0"
                  :max="100"
                  :label="ctrl.enabledKey === 'chordExtTritoneSub' ? t('settingsStep.advanced.chordExt.tritone') : chordExtLabel[ctrl.enabledKey]"
                  @update:model-value="(v: number) => { store.config[ctrl.probKey] = v; onProbInput(ctrl.probKey) }"
                />
                <span v-if="ctrl.hint" class="sub-setting__hint">{{ t(ctrl.hint) }}</span>
              </div>
            </template>
          </div>
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
    </div>
  </div>
</template>

<style scoped>
.arrangement-card {
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

.arrangement-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.arrangement-hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: rgba(96, 165, 250, 0.7);
  padding: 0.375rem 0.5rem;
  background: rgba(96, 165, 250, 0.08);
  border-radius: 6px;
  display: inline-block;
  margin-bottom: 0.75rem;
}

/* Blueprint Grid - 2 column card layout for the drawer width */
.blueprint-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.625rem;
}

.blueprint-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 110px;
  background: rgba(20, 20, 28, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  padding: 0.875rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.blueprint-card__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 60% at 50% 120%,
    var(--step-accent),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.blueprint-card:hover {
  border-color: rgba(139, 92, 246, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.3);
}

.blueprint-card:hover .blueprint-card__glow {
  opacity: 0.15;
}

.blueprint-card--selected,
.blueprint-card--selected:hover {
  border-color: var(--step-accent);
  background: rgba(96, 165, 250, 0.08);
  box-shadow:
    0 0 0 2px var(--step-accent),
    0 0 32px -8px rgba(96, 165, 250, 0.4);
}

.blueprint-card--selected .blueprint-card__glow,
.blueprint-card--selected:hover .blueprint-card__glow {
  opacity: 0.25;
}

.blueprint-card__content {
  position: relative;
  z-index: 1;
}

.blueprint-card__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.625rem;
}

.blueprint-card__icon-wrap {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1));
  border-radius: 9px;
  flex-shrink: 0;
}

.blueprint-card__icon {
  font-size: 1.1rem;
  filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.4));
}

.blueprint-card__chips {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
  margin-left: auto;
}

.blueprint-card__badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--step-accent);
  background: rgba(96, 165, 250, 0.2);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.blueprint-card__rhythm-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 600;
  color: #F59E0B;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.blueprint-card__drums-tag {
  font-size: 0.7rem;
  padding: 0.1rem 0.3rem;
  background: rgba(96, 165, 250, 0.12);
  border: 1px solid rgba(96, 165, 250, 0.25);
  border-radius: 4px;
  cursor: help;
}

.blueprint-card__name {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  color: #FAFAFA;
  margin: 0 0 0.25rem;
  letter-spacing: -0.01em;
}

.blueprint-card__desc {
  font-size: 0.72rem;
  color: rgba(250, 250, 250, 0.5);
  margin: 0;
  line-height: 1.4;
}

.blueprint-card__check {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--step-accent);
  border-radius: 50%;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  box-shadow: 0 2px 8px -2px rgba(96, 165, 250, 0.5);
  animation: check-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
}

@keyframes check-pop {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

/* Option cards container */
.option-cards {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-cards--row {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
}

/* Motif panel */
.motif-panel {
  margin-top: 1rem;
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

/* Advanced probability subsection */
.prob-advanced {
  margin-top: 0.75rem;
}

.prob-advanced__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.6rem;
  background: transparent;
  border: none;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(147, 197, 253, 0.9);
  cursor: pointer;
}

.prob-advanced__caret {
  display: inline-block;
  font-size: 0.7rem;
  transition: transform 0.2s ease;
}

.prob-advanced__caret--open {
  transform: rotate(90deg);
}

.prob-advanced__body {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  margin-top: 0.5rem;
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

  .blueprint-grid {
    grid-template-columns: 1fr;
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
