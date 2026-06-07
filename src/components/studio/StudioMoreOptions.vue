<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { CARD_KEYS } from './cardKeys'
import type { WizardConfig } from '@/stores/useWizardStore'
import VocalCard from './cards/VocalCard.vue'
import ArrangementCard from './cards/ArrangementCard.vue'
import EffectsCallsCard from './cards/EffectsCallsCard.vue'
import FineTuneCard from './cards/FineTuneCard.vue'
import DurationPanel from '@/components/wizard/DurationPanel.vue'
import ModulationPanel from '@/components/wizard/ModulationPanel.vue'

const { t } = useI18n()
const store = useWizardStore()

const isVocalFirst = computed(() => store.config.flowType === 'vocal-first')

const expanded = ref(false)

type SectionId = 'vocal' | 'arrangement' | 'structure' | 'effects' | 'fineTune'

interface SectionDef {
  id: SectionId
  icon: string
  accent: string
  keys: (keyof WizardConfig)[]
  show: boolean
}

const STRUCTURE_KEYS: (keyof WizardConfig)[] = [
  'targetDurationSeconds', 'modulationTiming', 'modulationSemitones'
]

const sections = computed<SectionDef[]>(() => [
  {
    id: 'vocal',
    icon: '🎤',
    accent: 'var(--studio-pink)',
    keys: CARD_KEYS.vocal,
    show: isVocalFirst.value
  },
  {
    id: 'arrangement',
    icon: '◈',
    accent: 'var(--studio-blue)',
    keys: CARD_KEYS.arrangement,
    show: true
  },
  {
    id: 'structure',
    icon: '⏱',
    accent: 'var(--studio-cyan)',
    keys: STRUCTURE_KEYS,
    show: true
  },
  {
    id: 'effects',
    icon: '✦',
    accent: 'var(--studio-orange)',
    keys: CARD_KEYS.effects,
    show: true
  },
  {
    id: 'fineTune',
    icon: '⚙',
    accent: 'var(--studio-purple-soft)',
    keys: CARD_KEYS.fineTune,
    show: isVocalFirst.value
  }
])

const visibleSections = computed(() => sections.value.filter(s => s.show))

const activeId = ref<SectionId>('arrangement')

const activeSection = computed(
  () => visibleSections.value.find(s => s.id === activeId.value) ?? visibleSections.value[0]
)

function selectSection(id: SectionId) {
  activeId.value = id
}

function isModified(keys: (keyof WizardConfig)[]): boolean {
  return store.isModifiedFromBaseline(keys)
}

// Count of modified deep-setting sections, shown on the collapsed header
const modifiedCount = computed(
  () => visibleSections.value.filter(s => isModified(s.keys)).length
)
</script>

<template>
  <section class="studio-more">
    <button
      class="studio-more__toggle"
      :class="{ 'studio-more__toggle--open': expanded }"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span class="studio-more__toggle-icon" aria-hidden="true">⚙</span>
      <span class="studio-more__toggle-label">{{ t('studio.moreOptions.toggle') }}</span>
      <span v-if="modifiedCount > 0" class="studio-more__badge">{{ modifiedCount }}</span>
      <span class="studio-more__chevron" aria-hidden="true">⌄</span>
    </button>

    <Transition name="studio-more-expand">
      <div v-show="expanded" class="studio-more__body">
        <!-- Section tabs -->
        <div class="studio-more__tabs" role="tablist">
          <button
            v-for="section in visibleSections"
            :key="section.id"
            class="studio-more__tab"
            :class="{ 'studio-more__tab--active': activeId === section.id }"
            :style="{ '--tab-accent': section.accent }"
            role="tab"
            :aria-selected="activeId === section.id"
            @click="selectSection(section.id)"
          >
            <span class="studio-more__tab-icon" aria-hidden="true">{{ section.icon }}</span>
            <span class="studio-more__tab-label">{{ t(`studio.moreOptions.sections.${section.id}`) }}</span>
            <span
              v-if="isModified(section.keys)"
              class="studio-more__tab-dot"
              aria-hidden="true"
            ></span>
          </button>
        </div>

        <!-- Active section content -->
        <div class="studio-more__panel" role="tabpanel">
          <VocalCard v-if="activeSection?.id === 'vocal'" />
          <ArrangementCard v-else-if="activeSection?.id === 'arrangement'" />
          <template v-else-if="activeSection?.id === 'structure'">
            <div class="studio-more__structure">
              <DurationPanel />
              <ModulationPanel />
            </div>
          </template>
          <EffectsCallsCard v-else-if="activeSection?.id === 'effects'" />
          <FineTuneCard v-else-if="activeSection?.id === 'fineTune'" />
        </div>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.studio-more {
  border: 1px solid rgba(var(--studio-purple-rgb), 0.1);
  border-radius: 16px;
  overflow: hidden;
  background: rgba(var(--studio-panel-rgb), 0.35);
}

.studio-more__toggle {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s ease;
}

.studio-more__toggle:hover {
  background: rgba(var(--studio-purple-rgb), 0.05);
}

.studio-more__toggle-icon {
  font-size: 0.95rem;
  color: rgba(var(--studio-ink-rgb), 0.55);
}

.studio-more__toggle-label {
  flex: 1;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--studio-text-primary);
}

.studio-more__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 0.35rem;
  border-radius: 9px;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--studio-on-accent);
  background: var(--studio-purple);
}

.studio-more__chevron {
  font-size: 0.9rem;
  color: rgba(var(--studio-ink-rgb), 0.4);
  transition: transform 0.25s ease;
}

.studio-more__toggle--open .studio-more__chevron {
  transform: rotate(180deg);
}

.studio-more__body {
  border-top: 1px solid rgba(var(--studio-purple-rgb), 0.1);
}

.studio-more__tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.625rem 0.625rem 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.studio-more__tabs::-webkit-scrollbar {
  display: none;
}

.studio-more__tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  padding: 0.55rem 0.85rem;
  background: transparent;
  border: none;
  border-radius: 10px 10px 0 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(var(--studio-ink-rgb), 0.55);
  transition: all 0.2s ease;
}

.studio-more__tab:hover {
  color: var(--studio-text-primary);
  background: rgba(var(--studio-ink-rgb), 0.04);
}

.studio-more__tab--active {
  color: var(--tab-accent);
  background: color-mix(in srgb, var(--tab-accent) 8%, transparent);
}

.studio-more__tab--active::after {
  content: '';
  position: absolute;
  left: 0.5rem;
  right: 0.5rem;
  bottom: 0;
  height: 2px;
  border-radius: 1px;
  background: var(--tab-accent);
}

.studio-more__tab-icon {
  font-size: 0.9rem;
}

.studio-more__tab-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tab-accent);
  box-shadow: 0 0 6px var(--tab-accent);
}

.studio-more__panel {
  padding: 1.25rem;
  border-top: 1px solid rgba(var(--studio-purple-rgb), 0.1);
}

.studio-more__structure {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Expand transition */
.studio-more-expand-enter-active,
.studio-more-expand-leave-active {
  transition: opacity 0.2s ease;
}

.studio-more-expand-enter-from,
.studio-more-expand-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .studio-more__tab-label {
    display: none;
  }

  .studio-more__tab {
    padding: 0.55rem 0.7rem;
  }

  .studio-more__tab-icon {
    font-size: 1.05rem;
  }

  .studio-more__panel {
    padding: 1rem;
  }
}
</style>
