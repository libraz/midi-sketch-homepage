<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { useChordCatalog } from '@/composables/useChordCatalog'
import ChordCard from '../cards/ChordCard.vue'
import EssentialPill from './EssentialPill.vue'
import StudioSheet from '../StudioSheet.vue'

const { t } = useI18n()
const store = useWizardStore()
const chordCatalog = useChordCatalog()

const open = ref(false)
const ACCENT = 'var(--studio-purple)'

const currentChord = computed(() =>
  store.getChordProgressionById(store.config.chordProgressionId)
)

const value = computed(() => {
  const chord = currentChord.value
  return chord ? chord.name : t('studio.essentials.chordAuto')
})

const modified = computed(
  () => store.config.chordProgressionId !== store.baselineConfig.value.chordProgressionId
)

// Load the chord catalog so the pill shows a name before the sheet is opened
onMounted(() => {
  chordCatalog.ensureLoaded()
})
</script>

<template>
  <div class="chord-control">
    <EssentialPill
      :label="t('studio.essentials.chord')"
      :value="value"
      :accent="ACCENT"
      icon="♫"
      :modified="modified"
      @open="open = true"
    />

    <StudioSheet
      :open="open"
      :title="t('studio.essentials.chordTitle')"
      icon="♫"
      :accent="ACCENT"
      wide
      @close="open = false"
    >
      <ChordCard v-if="open" />
    </StudioSheet>
  </div>
</template>

<style scoped>
/* Stretch the pill to the full grid-cell height so all essentials align */
.chord-control {
  display: flex;
}
</style>
