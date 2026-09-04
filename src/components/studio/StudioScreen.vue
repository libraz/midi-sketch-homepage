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
const isClient = ref(false)
let observer: IntersectionObserver | null = null

const showDockedApply = computed(() =>
  isClient.value &&
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

onMounted(() => {
  isClient.value = true
  nextTick(observeEssentials)
})

// The Essentials bar only mounts once a result exists, so re-attach when it does
watch(() => studio.eventData.value, () => nextTick(observeEssentials))

onBeforeUnmount(() => observer?.disconnect())
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
    <Teleport v-if="isClient" to="body">
      <Transition name="apply-dock">
        <div v-if="showDockedApply" class="apply-dock">
          <div class="apply-dock__inner">
            <span v-if="dockedDetail" class="apply-dock__detail">{{ dockedDetail }}</span>
            <div class="apply-dock__button">
              <StudioApplyButton />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
  border: 1px solid rgba(var(--studio-purple-rgb), 0.15);
  border-radius: 100px;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: rgba(var(--studio-ink-rgb), 0.55);
  cursor: pointer;
  transition: all 0.2s ease;
}

.studio-screen__back:hover {
  background: rgba(var(--studio-purple-rgb), 0.08);
  border-color: rgba(var(--studio-purple-rgb), 0.35);
  color: rgba(var(--studio-ink-rgb), 0.85);
  transform: translateX(-2px);
}

/* Docked apply CTA */
.apply-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
  background: rgba(var(--studio-panel-deep-rgb), 0.92);
  border-top: 1px solid rgba(var(--studio-purple-rgb), 0.18);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 -12px 32px -20px var(--studio-shadow-strong);
}

.apply-dock__inner {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 920px;
  margin: 0 auto;
}

.apply-dock__detail {
  flex: 1;
  min-width: 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(var(--studio-ink-rgb), 0.65);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.apply-dock__button {
  flex: 0 0 auto;
  width: 15rem;
}

.apply-dock-enter-active,
.apply-dock-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
}

.apply-dock-enter-from,
.apply-dock-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (max-width: 640px) {
  .apply-dock__detail {
    display: none;
  }

  .apply-dock__button {
    flex: 1 1 auto;
    width: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .apply-dock-enter-active,
  .apply-dock-leave-active {
    transition: opacity 0.2s ease;
  }

  .apply-dock-enter-from,
  .apply-dock-leave-to {
    transform: none;
  }
}
</style>
