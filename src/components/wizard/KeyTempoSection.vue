<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { songImages } from '@/data/songImages'
import { transposeProgressionToKey } from '@/utils/midiUtils'
import KeySelector from './KeySelector.vue'
import BpmControl from './BpmControl.vue'
import ModulationPanel from './ModulationPanel.vue'
import DurationPanel from './DurationPanel.vue'

const { t } = useI18n()
const store = useWizardStore()

// Props for accent color theming
defineProps<{
  accentColor?: 'purple' | 'pink' | 'blue'
}>()

// Advanced settings accordion state
const isAdvancedOpen = ref(false)

// Current song image for recommended BPM range
const currentSongImage = computed(() =>
  songImages.find(s => s.id === store.config.songImageId)
)
const recommendedMin = computed(() => currentSongImage.value?.tempoRange.min || 60)
const recommendedMax = computed(() => currentSongImage.value?.tempoRange.max || 180)

// Current chord progression with key-based display
const currentChord = computed(() =>
  store.getChordProgressionById(store.config.chordProgressionId)
)
const chordDisplay = computed(() => {
  if (!currentChord.value) return null
  return {
    name: currentChord.value.name,
    chords: transposeProgressionToKey(currentChord.value.display, store.config.key)
  }
})

// Formatted duration for summary
const formattedDuration = computed(() => {
  const seconds = store.config.targetDurationSeconds
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

// Modulation timing keys for translation
const modulationTimingKeys: Record<number, string> = {
  0: 'none',
  1: 'lastChorus',
  2: 'afterBridge',
  3: 'eachChorus',
  4: 'random'
}

// Summary value for advanced settings
const advancedSummary = computed(() => {
  const parts: string[] = []

  // Duration
  parts.push(formattedDuration.value)

  // Modulation
  if (store.config.modulationTiming !== 0) {
    const key = modulationTimingKeys[store.config.modulationTiming] || 'none'
    const label = t(`settingsStep.advanced.modulation.timingOptions.${key}`)
    parts.push(`♯+${store.config.modulationSemitones} ${label}`)
  }

  return parts.join(' · ')
})
</script>

<template>
  <section class="key-tempo-section" :class="`key-tempo-section--${accentColor || 'purple'}`">
    <div class="key-tempo-stack">
      <!-- Key & Tempo Row -->
      <div class="key-tempo-row">
        <!-- Key Selector -->
        <div class="key-panel">
          <h3 class="setting-label">
            <span class="setting-label__icon">&#9839;</span>
            <span>{{ t('settingsStep.key.label') }}</span>
          </h3>
          <KeySelector
            v-model="store.config.key"
            :chord-progression-name="chordDisplay?.name"
            :chord-progression-chords="chordDisplay?.chords"
            @update:model-value="store.setKey($event)"
          />
        </div>

        <!-- Vertical Divider -->
        <div class="key-tempo-divider-vertical"></div>

        <!-- Tempo Panel -->
        <div class="tempo-panel">
          <h3 class="setting-label">
            <span class="setting-label__icon">&#9833;</span>
            <span>{{ t('settingsStep.tempo.label') }}</span>
          </h3>
          <BpmControl
            v-model="store.config.bpm"
            :recommended-min="recommendedMin"
            :recommended-max="recommendedMax"
            @update:model-value="store.setBpm($event)"
          />
        </div>
      </div>

      <!-- Advanced Settings Accordion -->
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
              <!-- Duration Panel -->
              <DurationPanel />

              <!-- Modulation Panel -->
              <ModulationPanel />
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </section>
</template>

<style scoped>
.key-tempo-section {
  --section-accent: var(--studio-purple);
  --section-accent-rgb: var(--studio-purple-rgb);
}

.key-tempo-section--purple {
  --section-accent: var(--studio-purple);
  --section-accent-rgb: var(--studio-purple-rgb);
}

.key-tempo-section--pink {
  --section-accent: var(--studio-pink);
  --section-accent-rgb: var(--studio-pink-rgb);
}

.key-tempo-section--blue {
  --section-accent: var(--studio-blue);
  --section-accent-rgb: var(--studio-blue-rgb);
}

.key-tempo-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Horizontal row for Key & Tempo */
.key-tempo-row {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.key-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tempo-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Vertical divider between key and tempo */
.key-tempo-divider-vertical {
  width: 1px;
  align-self: stretch;
  background: linear-gradient(
    180deg,
    transparent 0%,
    color-mix(in srgb, var(--section-accent) 25%, transparent) 20%,
    color-mix(in srgb, var(--section-accent) 25%, transparent) 80%,
    transparent 100%
  );
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(var(--studio-ink-rgb), 0.9);
  margin: 0;
}

.setting-label__icon {
  font-size: 1.1rem;
  color: var(--section-accent);
}

/* Advanced Settings Accordion */
.advanced-accordion {
  border: 1px solid rgba(var(--section-accent-rgb), 0.12);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(var(--studio-panel-rgb), 0.3);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.advanced-accordion--open {
  border-color: rgba(var(--section-accent-rgb), 0.25);
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
  background: rgba(var(--section-accent-rgb), 0.05);
}

.advanced-accordion__icon {
  font-size: 0.9rem;
  color: rgba(var(--studio-ink-rgb), 0.5);
  transition: color 0.2s ease;
}

.advanced-accordion--open .advanced-accordion__icon {
  color: var(--section-accent);
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
  color: var(--section-accent);
  opacity: 0.8;
  padding-right: 0.5rem;
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
  color: var(--section-accent);
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

/* Mobile: stack vertically */
@media (max-width: 640px) {
  .key-tempo-row {
    flex-direction: column;
    gap: 1rem;
  }

  .key-panel,
  .tempo-panel {
    width: 100%;
    flex: none;
  }

  .key-tempo-divider-vertical {
    width: 100%;
    height: 1px;
    align-self: auto;
    background: linear-gradient(
      90deg,
      transparent 0%,
      color-mix(in srgb, var(--section-accent) 25%, transparent) 20%,
      color-mix(in srgb, var(--section-accent) 25%, transparent) 80%,
      transparent 100%
    );
  }

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
