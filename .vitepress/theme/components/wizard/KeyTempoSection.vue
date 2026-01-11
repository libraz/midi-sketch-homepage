<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import { songImages } from '../../data/songImages'
import KeySelector from './KeySelector.vue'
import BpmControl from './BpmControl.vue'
import ModulationPanel from './ModulationPanel.vue'

const { t } = useI18n()
const store = useWizardStore()

// Props for accent color theming
defineProps<{
  accentColor?: 'purple' | 'pink' | 'blue'
}>()

// Current song image for recommended BPM range
const currentSongImage = computed(() =>
  songImages.find(s => s.id === store.config.songImageId)
)
const recommendedMin = computed(() => currentSongImage.value?.tempoRange.min || 60)
const recommendedMax = computed(() => currentSongImage.value?.tempoRange.max || 180)
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

      <!-- Modulation Panel -->
      <ModulationPanel />
    </div>
  </section>
</template>

<style scoped>
.key-tempo-section {
  --section-accent: #8B5CF6;
  --section-accent-rgb: 139, 92, 246;
}

.key-tempo-section--purple {
  --section-accent: #8B5CF6;
  --section-accent-rgb: 139, 92, 246;
}

.key-tempo-section--pink {
  --section-accent: #EC4899;
  --section-accent-rgb: 236, 72, 153;
}

.key-tempo-section--blue {
  --section-accent: #60A5FA;
  --section-accent-rgb: 96, 165, 250;
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
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.9);
  margin: 0;
}

.setting-label__icon {
  font-size: 1.1rem;
  color: var(--section-accent);
}

/* Mobile: stack vertically */
@media (max-width: 640px) {
  .key-tempo-row {
    flex-direction: column;
    gap: 1rem;
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
}
</style>
