<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import { songImages } from '../../data/songImages'
import KeySelector from './KeySelector.vue'
import BpmControl from './BpmControl.vue'

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

      <!-- Divider -->
      <div class="key-tempo-divider"></div>

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
  </section>
</template>

<style scoped>
.key-tempo-section {
  --section-accent: #8B5CF6;
}

.key-tempo-section--purple {
  --section-accent: #8B5CF6;
}

.key-tempo-section--pink {
  --section-accent: #EC4899;
}

.key-tempo-section--blue {
  --section-accent: #60A5FA;
}

.key-tempo-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.key-panel,
.tempo-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.key-tempo-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(
    90deg,
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
</style>
