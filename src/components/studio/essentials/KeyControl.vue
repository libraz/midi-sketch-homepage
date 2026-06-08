<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { KEY_NAMES } from '@/utils/midiUtils'
import KeySelector from '@/components/wizard/KeySelector.vue'
import EssentialPill from './EssentialPill.vue'
import StudioSheet from '../StudioSheet.vue'

const { t } = useI18n()
const store = useWizardStore()

const open = ref(false)
const ACCENT = 'var(--studio-cyan)'

const value = computed(() => `${KEY_NAMES[store.config.key]} ${t('settingsStep.key.major')}`)

const modified = computed(
  () => store.config.key !== store.baselineConfig.value.key
)

const currentChord = computed(() =>
  store.getChordProgressionById(store.config.chordProgressionId)
)
</script>

<template>
  <div class="key-control">
    <EssentialPill
      :label="t('studio.essentials.key')"
      :value="value"
      :accent="ACCENT"
      icon="♯"
      :modified="modified"
      @open="open = true"
    />

    <StudioSheet
      :open="open"
      :title="t('studio.essentials.keyTitle')"
      icon="♯"
      :accent="ACCENT"
      @close="open = false"
    >
      <div class="key-control__inner">
        <KeySelector
          :model-value="store.config.key"
          :chord-progression-name="currentChord?.name"
          :chord-progression-chords="currentChord?.display"
          @update:model-value="store.setKey($event)"
        />
      </div>
    </StudioSheet>
  </div>
</template>

<style scoped>
/* Stretch the pill to the full grid-cell height so all essentials align */
.key-control {
  display: flex;
}

.key-control__inner {
  --section-accent: var(--studio-cyan);
  --section-accent-rgb: var(--studio-cyan-rgb);
  display: flex;
  justify-content: center;
  padding: 0.5rem 0;
}
</style>
