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
const { stop: stopPlayer } = useMidiPlayer()

type Phase = 'entry' | 'studio'
const phase = ref<Phase>('entry')

function handleGenerate() {
  phase.value = 'studio'
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
    <!-- Atmospheric Background -->
    <div class="midi-studio__atmosphere">
      <div class="midi-studio__gradient-orb midi-studio__gradient-orb--purple"></div>
      <div class="midi-studio__gradient-orb midi-studio__gradient-orb--pink"></div>
      <div class="midi-studio__noise"></div>
    </div>

    <!-- Header -->
    <header class="midi-studio__header">
      <div class="midi-studio__logo">
        <span class="midi-studio__logo-icon">◈</span>
        <span class="midi-studio__logo-text">{{ t('wizard.logo') }}</span>
      </div>
      <div class="midi-studio__subtitle">{{ t('wizard.subtitle') }}</div>
    </header>

    <!-- Content -->
    <main class="midi-studio__content">
      <div class="midi-studio__panel">
        <Transition name="studio-fade" mode="out-in">
          <EntryScreen v-if="phase === 'entry'" key="entry" @generate="handleGenerate" />
          <StudioScreen v-else key="studio" @back="backToEntry" />
        </Transition>
      </div>
    </main>
  </div>
</template>

<style scoped>

.midi-studio {
  position: relative;
  background: var(--studio-bg-deep);
  border-radius: 24px;
  overflow: hidden;
  font-family: var(--font-body);
  isolation: isolate;
}

.midi-studio__atmosphere {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.midi-studio__gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: var(--studio-orb-opacity);
  animation: orb-drift 20s ease-in-out infinite;
}

.midi-studio__gradient-orb--purple {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, var(--studio-purple) 0%, transparent 70%);
  top: -200px;
  left: -100px;
}

.midi-studio__gradient-orb--pink {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--studio-pink) 0%, transparent 70%);
  bottom: -100px;
  right: -50px;
  animation-delay: -10s;
}

@keyframes orb-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 15px) scale(0.95); }
}

.midi-studio__noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: var(--studio-noise-opacity);
  mix-blend-mode: overlay;
}

.midi-studio__header {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2.5rem 2rem 1.5rem;
}

.midi-studio__logo {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.midi-studio__logo-icon {
  font-size: 1.5rem;
  color: var(--studio-purple);
  text-shadow: 0 0 20px rgba(var(--studio-purple-rgb), 0.4);
  animation: logo-breathe 5s ease-in-out infinite;
}

@keyframes logo-breathe {
  0%, 100% {
    text-shadow: 0 0 20px rgba(var(--studio-purple-rgb), 0.4);
    transform: scale(1);
  }
  50% {
    text-shadow: 0 0 28px rgba(var(--studio-purple-rgb), 0.7);
    transform: scale(1.06);
  }
}

@media (prefers-reduced-motion: reduce) {
  .midi-studio__logo-icon {
    animation: none;
  }
}

.midi-studio__logo-text {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 650;
  letter-spacing: 0.2em;
  /* Gradient ink: text-primary fading into the purple accent at the tail */
  background: linear-gradient(
    100deg,
    var(--studio-text-primary) 55%,
    var(--studio-purple-soft) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: var(--studio-text-primary); /* fallback */
}

.midi-studio__subtitle {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(var(--studio-ink-rgb), 0.35);
}

.midi-studio__content {
  position: relative;
  z-index: 1;
  padding: 0 2rem 2rem;
}

.midi-studio__panel {
  position: relative;
  background: rgba(var(--studio-panel-deep-rgb), 0.85);
  border: 1px solid rgba(var(--studio-purple-rgb), 0.12);
  border-radius: 20px;
  padding: 2rem;
  min-height: 400px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    0 0 0 1px rgba(var(--studio-ink-rgb), 0.03) inset,
    0 24px 48px -12px var(--studio-shadow-strong);
  overflow: hidden;
}

/* Powered-on rail: a thin accent gradient along the panel's top edge */
.midi-studio__panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--studio-purple-rgb), 0.55) 35%,
    rgba(var(--studio-pink-rgb), 0.45) 65%,
    transparent
  );
  pointer-events: none;
}

.studio-fade-enter-active,
.studio-fade-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.studio-fade-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.studio-fade-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}

@media (max-width: 640px) {
  .midi-studio {
    border-radius: 16px;
  }

  .midi-studio__header {
    padding: 1.5rem 1rem 1rem;
  }

  .midi-studio__logo-text {
    font-size: 1.25rem;
  }

  .midi-studio__content {
    padding: 0 0 1rem;
  }

  .midi-studio__panel {
    padding: 1.25rem 0.75rem;
    border-radius: 16px;
  }
}
</style>
