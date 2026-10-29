<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { useStudioGeneration } from '@/composables/useStudioGeneration'
import StudioPlayer from './StudioPlayer.vue'
import StudioEssentialsBar from './StudioEssentialsBar.vue'
import StudioMoreOptions from './StudioMoreOptions.vue'
import StudioOutputBar from './StudioOutputBar.vue'
import StudioVocalEditor from './StudioVocalEditor.vue'
import StudioApplyButton from './StudioApplyButton.vue'
import StudioDock from './StudioDock.vue'

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

// ============================================
// Follow-along apply bar
// ============================================
// The apply CTA lives with the Essentials, but most settings that dirty the
// preview sit in the expanded deep-settings panel far below it. Once the inline
// button scrolls out of view the pending change becomes invisible, so a compact
// copy docks to the bottom of the viewport until it is dealt with.
const essentialsRef = ref<HTMLElement | null>(null)
const isEssentialsVisible = ref(true)
let observer: IntersectionObserver | null = null

const showDockedApply = computed(() =>
  !isEssentialsVisible.value &&
  !isEditing.value &&
  (studio.isStale.value || studio.isGenerating.value)
)

const dockedDetail = computed(() =>
  studio.staleScope.value === 'vocal'
    ? t('studio.apply.pendingVocal')
    : studio.staleScope.value === 'bgm'
      ? t('studio.apply.pendingBgm')
      : ''
)

function observeEssentials() {
  observer?.disconnect()
  const target = essentialsRef.value
  if (!target) return
  observer = new IntersectionObserver(
    ([entry]) => { isEssentialsVisible.value = entry.isIntersecting },
    { threshold: 0 }
  )
  observer.observe(target)
}

onMounted(() => nextTick(observeEssentials))

// The Essentials bar only mounts once a result exists, so re-attach when it does
watch(() => studio.eventData.value, () => nextTick(observeEssentials))

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="studio-screen">
    <!-- Back to entry -->
    <button class="studio-screen__back" @click="emit('back')">
      <span class="studio-screen__back-arrow" aria-hidden="true">←</span>
      <span>{{ t('studio.backToEntry') }}</span>
    </button>

    <!-- Player -->
    <StudioPlayer />

    <!-- Essentials: always-visible high-value controls + single Apply CTA -->
    <div ref="essentialsRef">
      <StudioEssentialsBar v-if="studio.eventData.value" />
    </div>

    <!-- Deep settings: progressive-disclosure container (tabbed sections) -->
    <StudioMoreOptions v-if="studio.eventData.value" />

    <!-- Output actions -->
    <StudioOutputBar v-if="studio.eventData.value" @edit="startEditing" />

    <!-- Vocal melody editor (fullscreen overlay) -->
    <StudioVocalEditor
      v-if="isEditing && studio.eventData.value"
      :event-data="studio.eventData.value"
      @close="handleEditorClose"
      @saved="handleEditorSaved"
    />

    <!-- Docked apply CTA, shown only while the inline one is off-screen -->
    <StudioDock :show="showDockedApply" :detail="dockedDetail">
      <StudioApplyButton />
    </StudioDock>
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
  gap: 0.45rem;
  margin: -0.5rem 0 -0.25rem -0.5rem;
  padding: 0.4rem 0.7rem 0.4rem 0.5rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(var(--studio-ink-rgb), 0.55);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.studio-screen__back-arrow {
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.studio-screen__back:hover {
  background: rgba(var(--studio-purple-rgb), 0.08);
  color: var(--studio-text-primary);
}

.studio-screen__back:hover .studio-screen__back-arrow {
  transform: translateX(-3px);
}

.studio-screen__back:focus-visible {
  outline: 2px solid var(--studio-purple);
  outline-offset: 2px;
}
</style>
