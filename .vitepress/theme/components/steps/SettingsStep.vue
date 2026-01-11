<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import { songImages } from '../../data/songImages'
import StepHeader from '../wizard/StepHeader.vue'
import KeySelector from '../wizard/KeySelector.vue'
import BpmControl from '../wizard/BpmControl.vue'
import CompositionPanel from '../wizard/CompositionPanel.vue'
import InstrumentsPanel from '../wizard/InstrumentsPanel.vue'
import HarmonyPanel from '../wizard/HarmonyPanel.vue'
import OutputPanel from '../wizard/OutputPanel.vue'

const { t } = useI18n()
const store = useWizardStore()

// DAW-style rack modules (collapsible sections - all collapsed by default)
type RackModule = 'track' | 'instruments' | 'harmony' | 'output'
const expandedModules = ref<Set<RackModule>>(new Set())

function toggleModule(module: RackModule) {
  if (expandedModules.value.has(module)) {
    expandedModules.value.delete(module)
  } else {
    expandedModules.value.add(module)
  }
  // Force reactivity
  expandedModules.value = new Set(expandedModules.value)
}

function isModuleExpanded(module: RackModule): boolean {
  return expandedModules.value.has(module)
}

const currentSongImage = computed(() =>
  songImages.find(s => s.id === store.config.songImageId)
)

// Recommended BPM range from current song image
const recommendedMin = computed(() => currentSongImage.value?.tempoRange.min || 60)
const recommendedMax = computed(() => currentSongImage.value?.tempoRange.max || 180)

// SynthDriven forces arpeggio on (WASM constraint)
const isSynthDriven = computed(() => store.config.compositionStyle === 2)

// Sync implicit settings when compositionStyle changes
// Based on wasm-js-option-relationships.md Section 8.3
watch(() => store.config.compositionStyle, (newStyle, oldStyle) => {
  // SynthDriven (2): force arpeggio on
  if (newStyle === 2) {
    store.config.arpeggioEnabled = true
  } else if (oldStyle === 2) {
    // Switching away from SynthDriven: turn off arpeggio
    store.config.arpeggioEnabled = false
  }

  // BackgroundMotif (1) or SynthDriven (2): auto-disable modulation
  if (newStyle === 1 || newStyle === 2) {
    store.config.modulationTiming = 0
  }
})
</script>

<template>
  <div class="settings-step">
    <!-- Header -->
    <StepHeader
      :title="t('settingsStep.title')"
      :subtitle="t('settingsStep.subtitle')"
    />

    <div class="settings-layout">
      <!-- Key & Tempo Combined Section -->
      <section class="setting-section setting-section--combined">
        <div class="key-tempo-grid">
          <!-- Key Selector (Left) -->
          <div class="key-panel">
            <h3 class="setting-label setting-label--compact">
              <span class="setting-label__icon">&#9839;</span>
              <span>{{ t('settingsStep.key.label') }}</span>
            </h3>
            <KeySelector
              v-model="store.config.key"
              compact
              @update:model-value="store.setKey($event)"
            />
          </div>

          <!-- Divider -->
          <div class="key-tempo-divider"></div>

          <!-- Tempo Panel (Right) -->
          <div class="tempo-panel">
            <h3 class="setting-label setting-label--compact">
              <span class="setting-label__icon">&#9833;</span>
              <span>{{ t('settingsStep.tempo.label') }}</span>
            </h3>
            <BpmControl
              v-model="store.config.bpm"
              :recommended-min="recommendedMin"
              :recommended-max="recommendedMax"
              compact
              @update:model-value="store.setBpm($event)"
            />
          </div>
        </div>
      </section>

      <!-- Advanced Settings -->
      <section class="setting-section advanced-section">
        <div class="advanced-header" @click="expandedModules.size === 0 ? Object.keys({'track':1,'instruments':1,'harmony':1,'output':1}).forEach(m => expandedModules.add(m as RackModule)) : expandedModules.clear(); expandedModules = new Set(expandedModules)">
          <h3 class="setting-label">
            <span class="setting-label__icon">&#9881;</span>
            <span>{{ t('settingsStep.advanced.toggle') }}</span>
          </h3>
          <span class="advanced-expand-hint">{{ expandedModules.size > 0 ? '&#9650;' : '&#9660;' }}</span>
        </div>

        <!-- TRACK Panel -->
        <CompositionPanel
          :is-expanded="isModuleExpanded('track')"
          @toggle="toggleModule('track')"
        />

        <!-- INSTRUMENTS Panel -->
        <InstrumentsPanel
          :is-expanded="isModuleExpanded('instruments')"
          :is-synth-driven="isSynthDriven"
          @toggle="toggleModule('instruments')"
        />

        <!-- HARMONY Panel -->
        <HarmonyPanel
          :is-expanded="isModuleExpanded('harmony')"
          @toggle="toggleModule('harmony')"
        />

        <!-- OUTPUT Panel -->
        <OutputPanel
          :is-expanded="isModuleExpanded('output')"
          @toggle="toggleModule('output')"
        />
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-step {
  --step-accent: #8B5CF6;
  --accent-rgb: 139, 92, 246;
}

.settings-layout {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Setting Section */
.setting-section {
  background: rgba(20, 20, 28, 0.4);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
}

.setting-section--combined {
  padding: 1rem 1.25rem;
}

/* Setting Label */
.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #FAFAFA;
  margin: 0 0 0.5rem;
}

.setting-label__icon {
  color: var(--step-accent);
}

.setting-label--compact {
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
}

/* Key & Tempo Grid Layout */
.key-tempo-grid {
  display: grid;
  grid-template-columns: minmax(180px, 220px) 1px 1fr;
  gap: 1.25rem;
  align-items: start;
}

.key-panel,
.tempo-panel {
  display: flex;
  flex-direction: column;
}

.key-tempo-divider {
  width: 1px;
  height: 100%;
  min-height: 120px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(139, 92, 246, 0.2) 20%,
    rgba(139, 92, 246, 0.3) 50%,
    rgba(139, 92, 246, 0.2) 80%,
    transparent 100%
  );
}

/* Advanced Settings Section */
.advanced-section {
  margin-top: 1.5rem;
}

.advanced-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-radius: 12px;
  transition: background 0.2s ease;
}

.advanced-header:hover {
  background: rgba(139, 92, 246, 0.05);
}

.advanced-expand-hint {
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.4);
  transition: transform 0.2s ease;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .key-tempo-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .key-tempo-divider {
    display: none;
  }
}
</style>
