<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { useStudioGeneration } from '@/composables/useStudioGeneration'
import { getBlueprintById, AUTO_BLUEPRINT_ID } from '@/data/blueprints'
import { getRecommendedBlueprintId } from '@/data/songImageBlueprint'
import { KEY_NAMES } from '@/utils/midiUtils'
import { CARD_KEYS, type StudioCardId } from './cardKeys'
import CustomizationCard from './CustomizationCard.vue'
import CardDrawer from './CardDrawer.vue'
import ChordCard from './cards/ChordCard.vue'
import KeyTempoCard from './cards/KeyTempoCard.vue'
import VocalCard from './cards/VocalCard.vue'
import ArrangementCard from './cards/ArrangementCard.vue'
import EffectsCallsCard from './cards/EffectsCallsCard.vue'
import FineTuneCard from './cards/FineTuneCard.vue'

const { t, locale } = useI18n()
const store = useWizardStore()
const studio = useStudioGeneration()

const isVocalFirst = computed(() => store.config.flowType === 'vocal-first')

// ============================================
// Card face summaries
// ============================================

const chordSummary = computed(() => {
  const chord = store.getChordProgressionById(store.config.chordProgressionId)
  return chord ? `${chord.name} (${chord.display})` : '—'
})

const keyTempoSummary = computed(() => {
  const parts = [
    `${KEY_NAMES[store.config.key]} ${t('settingsStep.key.major')}`,
    `${store.config.bpm} BPM`
  ]
  if (store.config.modulationTiming !== 0) {
    parts.push(`♯+${store.config.modulationSemitones}`)
  }
  return parts.join(' · ')
})

const VOCAL_STYLE_NAMES = [
  'auto', 'standard', 'vocaloid', 'ultraVocaloid', 'idol', 'ballad',
  'rock', 'cityPop', 'anime', 'brightKira', 'coolSynth', 'cuteAffected', 'powerfulShout', 'kpop'
]

const MELODY_TEMPLATE_NAMES = [
  'auto', 'plateauTalk', 'runUpTarget', 'downResolve',
  'hookRepeat', 'sparseAnchor', 'callResponse', 'jumpAccent'
]

const vocalSummary = computed(() => {
  const styleName = VOCAL_STYLE_NAMES[store.config.vocalStyle] || 'auto'
  const templateName = MELODY_TEMPLATE_NAMES[store.config.melodyTemplate] || 'auto'
  return [
    t(`melodyStep.advanced.vocalStyle.options.${styleName}`),
    t(`melodyStep.advanced.melodyTemplate.options.${templateName}`)
  ].join(' · ')
})

const blueprintLabel = computed(() => {
  const lang = locale.value as 'en' | 'ja'
  if (store.config.blueprintId === AUTO_BLUEPRINT_ID) {
    const rec = getBlueprintById(getRecommendedBlueprintId(store.config.songImageId))
    return `${rec?.label[lang] ?? ''}${t('styleStep.arrangementStyle.recommended')}`
  }
  return getBlueprintById(store.config.blueprintId)?.label[lang] ?? '—'
})

const arrangementSummary = computed(() => {
  const parts: string[] = [blueprintLabel.value]
  if (store.config.drumsEnabled) parts.push(t('bgmStep.summary.drums'))
  if (store.config.arpeggioEnabled) parts.push(t('bgmStep.summary.arpeggio'))
  const extensions: string[] = []
  if (store.config.chordExtSus) extensions.push('sus')
  if (store.config.chordExt7th) extensions.push('7th')
  if (store.config.chordExt9th) extensions.push('9th')
  if (store.config.chordExtTritoneSub) extensions.push('tritone')
  if (extensions.length) parts.push(extensions.join('/'))
  return parts.join(' · ')
})

const effectsSummary = computed(() => {
  const parts: string[] = []
  if (store.config.seEnabled) parts.push('SE')
  if (store.config.callEnabled) parts.push(t('studio.cards.effects.call'))
  if (store.config.humanize) parts.push(t('studio.cards.effects.humanize'))
  return parts.length ? parts.join(' · ') : t('studio.cards.effects.none')
})

const fineTuneSummary = computed(() => {
  const count = CARD_KEYS.fineTune.filter(
    key => store.config[key] !== store.baselineConfig.value[key]
  ).length
  return count > 0
    ? t('studio.cards.fineTune.overrides').replace('{n}', String(count))
    : t('studio.cards.fineTune.auto')
})

// ============================================
// Card definitions
// ============================================

interface CardDef {
  id: StudioCardId
  icon: string
  accent: string
  title: string
  summary: string
  show: boolean
}

const cards = computed<CardDef[]>(() => [
  {
    id: 'chord',
    icon: '♫',
    accent: 'var(--studio-purple)',
    title: t('studio.cards.chord.title'),
    summary: chordSummary.value,
    show: true
  },
  {
    id: 'keyTempo',
    icon: '♯',
    accent: 'var(--studio-cyan)',
    title: t('studio.cards.keyTempo.title'),
    summary: keyTempoSummary.value,
    show: true
  },
  {
    id: 'vocal',
    icon: '🎤',
    accent: 'var(--studio-pink)',
    title: t('studio.cards.vocal.title'),
    summary: vocalSummary.value,
    show: isVocalFirst.value
  },
  {
    id: 'arrangement',
    icon: '◈',
    accent: 'var(--studio-blue)',
    title: t('studio.cards.arrangement.title'),
    summary: arrangementSummary.value,
    show: true
  },
  {
    id: 'effects',
    icon: '✦',
    accent: 'var(--studio-orange)',
    title: t('studio.cards.effects.title'),
    summary: effectsSummary.value,
    show: true
  },
  {
    id: 'fineTune',
    icon: '⚙',
    accent: 'var(--studio-purple-soft)',
    title: t('studio.cards.fineTune.title'),
    summary: fineTuneSummary.value,
    show: isVocalFirst.value
  }
])

const visibleCards = computed(() => cards.value.filter(c => c.show))

function isCardModified(id: StudioCardId): boolean {
  return store.isModifiedFromBaseline(CARD_KEYS[id])
}

// ============================================
// Drawer state (one open at a time)
// ============================================

const openCardId = ref<StudioCardId | null>(null)

const openCard = computed(() =>
  openCardId.value ? cards.value.find(c => c.id === openCardId.value) ?? null : null
)

const CARD_COMPONENTS: Record<StudioCardId, any> = {
  chord: ChordCard,
  keyTempo: KeyTempoCard,
  vocal: VocalCard,
  arrangement: ArrangementCard,
  effects: EffectsCallsCard,
  fineTune: FineTuneCard
}

function openDrawer(id: StudioCardId) {
  openCardId.value = id
}

function closeDrawer() {
  openCardId.value = null
}

function applyAndStayOpen() {
  studio.applyChanges()
}
</script>

<template>
  <div class="studio-card-grid">
    <div class="studio-card-grid__header">
      <span class="studio-card-grid__rule" aria-hidden="true"></span>
      <h3 class="studio-card-grid__title">{{ t('studio.cards.title') }}</h3>
      <span class="studio-card-grid__rule" aria-hidden="true"></span>
    </div>
    <p class="studio-card-grid__hint">{{ t('studio.cards.hint') }}</p>

    <div class="studio-card-grid__grid">
      <CustomizationCard
        v-for="card in visibleCards"
        :key="card.id"
        :icon="card.icon"
        :title="card.title"
        :summary="card.summary"
        :accent="card.accent"
        :modified="isCardModified(card.id)"
        @open="openDrawer(card.id)"
      />
    </div>

    <!-- Drawer host -->
    <CardDrawer
      :open="openCardId !== null"
      :title="openCard?.title ?? ''"
      :icon="openCard?.icon"
      :accent="openCard?.accent"
      :stale="studio.isStale.value"
      :generating="studio.isGenerating.value"
      @close="closeDrawer"
      @apply="applyAndStayOpen"
    >
      <component
        :is="openCardId ? CARD_COMPONENTS[openCardId] : null"
        v-if="openCardId"
      />
    </CardDrawer>
  </div>
</template>

<style scoped>
.studio-card-grid__header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 0.375rem;
}

.studio-card-grid__rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--studio-purple-rgb), 0.3));
}

.studio-card-grid__rule:last-of-type {
  background: linear-gradient(90deg, rgba(var(--studio-purple-rgb), 0.3), transparent);
}

.studio-card-grid__title {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(var(--studio-purple-soft-rgb), 0.85);
  margin: 0;
  flex-shrink: 0;
}

.studio-card-grid__hint {
  font-size: 0.72rem;
  color: rgba(var(--studio-ink-rgb), 0.4);
  text-align: center;
  margin: 0 0 1rem;
}

.studio-card-grid__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .studio-card-grid__grid {
    grid-template-columns: 1fr;
  }
}
</style>
