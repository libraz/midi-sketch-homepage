<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { useMidiPlayer } from '@/composables/useMidiPlayer'
import { useStudioGeneration } from '@/composables/useStudioGeneration'
import { decodeShareUrl } from '@/utils/shareEncoder'
import { songImages, songImageCategories } from '@/data/songImages'
import EntryScreen from './EntryScreen.vue'
import StudioScreen from './StudioScreen.vue'

const { t } = useI18n()
const store = useWizardStore()
const studio = useStudioGeneration()
// The studio root owns the shared transport's lifetime.
const { stop: stopPlayer } = useMidiPlayer({ stopOnUnmount: true })

type Phase = 'entry' | 'studio'
const phase = ref<Phase>('entry')

// The phase switch replaces the whole panel; whatever was scrolled to (the
// Generate button sits at the bottom of the entry screen) no longer exists.
function scrollToPanelTop() {
  if (typeof window === 'undefined' || window.scrollY === 0) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
}

function handleGenerate() {
  phase.value = 'studio'
  scrollToPanelTop()
  if (typeof window !== 'undefined') {
    history.pushState({ studioPhase: 'studio' }, '', '')
  }
  studio.start()
}

function backToEntry() {
  stopPlayer()
  studio.resetStudio()
  // Fresh seeds for the next generation
  store.config.seed = 0
  store.config.vocalSeed = 0
  store.invalidateVocal()
  store.invalidateBgm()
  phase.value = 'entry'
  scrollToPanelTop()
}

/**
 * In-app back. When entering the studio pushed a history entry, pop it and let
 * popstate do the work — otherwise the browser's own Back button would have to
 * be pressed twice to get anywhere. A studio restored from a share URL never
 * pushed an entry, so it returns directly.
 */
function requestBackToEntry() {
  if (typeof window !== 'undefined' && history.state?.studioPhase === 'studio') {
    history.back()
    return
  }
  backToEntry()
}

// Browser back returns from studio to entry
function handlePopState() {
  if (phase.value === 'studio') {
    backToEntry()
  }
}

/**
 * Restore a shared configuration from the URL hash (V6 share format).
 * Returns true when a valid share was restored.
 */
function restoreFromShareHash(): boolean {
  const hash = window.location.hash
  if (!hash || hash.length < 2) return false

  const decoded = decodeShareUrl(hash)
  if (!decoded) return false

  // Seed 0 is invalid: the share would not reproduce deterministically
  const requiredSeed = decoded.shareType === 'vocal'
    ? decoded.config.vocalSeed
    : decoded.config.seed
  if (!requiredSeed) return false

  // Merge the decoded config (UI-only keys are not in the hash)
  Object.assign(store.config, decoded.config)
  store.config.flowType = decoded.shareType === 'vocal' ? 'vocal-first' : 'bgm-only'

  // Reconstruct songImageId / category from stylePresetId
  const image = songImages.find(s => s.stylePresetIds.includes(store.config.stylePresetId))
  if (image) {
    store.config.songImageId = image.id
    const category = songImageCategories.find(c => c.images.includes(image.id))
    if (category) store.config.activeCategory = category.id
  }

  // The restored share becomes the baseline for "modified" indicators
  store.snapshotBaseline()

  // Clear the hash: further tweaks/regens in the studio diverge from the share
  history.replaceState({ studioPhase: 'studio' }, '', window.location.pathname + window.location.search)
  return true
}

onMounted(() => {
  if (typeof window === 'undefined') return

  if (restoreFromShareHash()) {
    phase.value = 'studio'
    studio.start()
  } else {
    history.replaceState({ studioPhase: 'entry' }, '', '')
  }

  window.addEventListener('popstate', handlePopState)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('popstate', handlePopState)
  }
})
</script>

<template>
  <div class="midi-studio">
    <div class="midi-studio__panel">
      <Transition name="studio-fade" mode="out-in">
        <EntryScreen v-if="phase === 'entry'" key="entry" @generate="handleGenerate" />
        <StudioScreen v-else key="studio" @back="requestBackToEntry" />
      </Transition>
    </div>
  </div>
</template>

<style scoped>

.midi-studio {
  position: relative;
  font-family: var(--font-body);
  isolation: isolate;
}

.midi-studio__panel {
  position: relative;
  background: rgba(var(--studio-panel-deep-rgb), 0.86);
  border: 1px solid rgba(var(--studio-purple-rgb), 0.12);
  border-radius: 20px;
  padding: 2rem;
  min-height: 400px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    0 0 0 1px rgba(var(--studio-ink-rgb), 0.03) inset,
    0 30px 60px -24px var(--studio-shadow-strong);
}

/* Phase switch: a short cross-fade with a small lift, not a page slide */
.studio-fade-enter-active,
.studio-fade-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.studio-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.studio-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .studio-fade-enter-from,
  .studio-fade-leave-to {
    transform: none;
  }
}

@media (max-width: 640px) {
  .midi-studio__panel {
    padding: 1.25rem 0.75rem;
    border-radius: 16px;
  }
}
</style>
