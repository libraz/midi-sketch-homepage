<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { useStudioGeneration } from '@/composables/useStudioGeneration'
import StudioPlayer from './StudioPlayer.vue'
import StudioCardGrid from './StudioCardGrid.vue'
import StudioOutputBar from './StudioOutputBar.vue'
import StudioVocalEditor from './StudioVocalEditor.vue'

const emit = defineEmits<{
  (e: 'back'): void
}>()

const { t } = useI18n()
const store = useWizardStore()
const studio = useStudioGeneration()

// ============================================
// Vocal melody editor overlay
// ============================================
const isEditing = ref(false)

function startEditing() {
  isEditing.value = true
}

function handleEditorClose() {
  isEditing.value = false
}

function handleEditorSaved() {
  isEditing.value = false
  // Edited notes change the vocal track: the accompaniment must follow.
  // invalidateBgm (not invalidateVocal — that would clear the edits),
  // then regenerate via the cheap accompaniment-only path which re-applies
  // the edited notes through setVocalNotes.
  store.invalidateBgm()
  studio.applyChanges()
}
</script>

<template>
  <div class="studio-screen">
    <!-- Back to entry -->
    <button class="studio-screen__back" @click="emit('back')">
      <span>←</span>
      <span>{{ t('studio.backToEntry') }}</span>
    </button>

    <!-- Player -->
    <StudioPlayer />

    <!-- Customization cards: stay mounted during regeneration so an open
         drawer survives an Apply (eventData keeps the previous result) -->
    <StudioCardGrid v-if="studio.eventData.value" />

    <!-- Output actions -->
    <StudioOutputBar v-if="studio.eventData.value" @edit="startEditing" />

    <!-- Vocal melody editor (fullscreen overlay) -->
    <StudioVocalEditor
      v-if="isEditing && studio.eventData.value"
      :event-data="studio.eventData.value"
      @close="handleEditorClose"
      @saved="handleEditorSaved"
    />
  </div>
</template>

<style scoped>
.studio-screen {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.studio-screen__back {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.8rem;
  background: transparent;
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 100px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: rgba(250, 250, 250, 0.55);
  cursor: pointer;
  transition: all 0.2s ease;
}

.studio-screen__back:hover {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.35);
  color: rgba(250, 250, 250, 0.85);
  transform: translateX(-2px);
}
</style>
