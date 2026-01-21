<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore, type ChordProgression } from '@/stores/useWizardStore'
import { useChordPlayer, warmupChordPlayer } from '@/composables/useChordPlayer'
import { chordDegreeColors } from '@/data/chordColors'
import { songImages } from '@/data/songImages'
import StepHeader from '@/components/wizard/StepHeader.vue'
import SectionHeader from '@/components/wizard/SectionHeader.vue'

const { t } = useI18n()
const store = useWizardStore()
const { isPlaying, currentChordIndex, playChord, playProgression, stop } = useChordPlayer()
const playingChordId = ref<number | null>(null)
const clickedBadgeKey = ref<string | null>(null)
const chordFlowRefs = ref<Map<number, HTMLElement>>(new Map())

// WASM module for getting chord progressions
let midisketch: any = null
const validProgressionIds = ref<number[]>([])
const isWasmLoaded = ref(false)

// Use store's chordProgressions
const chordProgressions = computed(() => store.chordProgressions.value)

onMounted(async () => {
  if (typeof window === 'undefined') return

  try {
    const mod = await import('../../wasm/index.js')
    midisketch = mod
    const wasmPath = new URL('../../wasm/midisketch.wasm', import.meta.url).href
    await mod.init({ wasmPath })
    isWasmLoaded.value = true
    store.libVersion.value = mod.getVersion()
    // Load chord progressions from WASM and store in store
    loadChordProgressions()
    updateValidProgressions()
  } catch {
    // WASM load failed - no fallback data available
    validProgressionIds.value = []
  }
})

function loadChordProgressions() {
  if (!midisketch || !isWasmLoaded.value) return
  const chords = midisketch.getChords()
  const progressions = chords.map((c: { name: string; display: string }, index: number) => ({
    id: index,
    name: c.name,
    display: c.display
  }))
  store.setChordProgressions(progressions)
}

function updateValidProgressions() {
  if (!midisketch || !isWasmLoaded.value) return
  validProgressionIds.value = midisketch.getProgressionsByStyle(store.config.stylePresetId)
}

// Watch for style changes
watch(() => store.config.stylePresetId, () => {
  updateValidProgressions()
})

watch(isPlaying, (playing) => {
  if (!playing) {
    playingChordId.value = null
  }
})

// Auto-scroll to current playing chord
watch(currentChordIndex, async (index) => {
  if (playingChordId.value === null || index < 0) return

  await nextTick()
  const flowEl = chordFlowRefs.value.get(playingChordId.value)
  if (!flowEl) return

  const badges = flowEl.querySelectorAll('.chord-badge')
  const currentBadge = badges[index] as HTMLElement
  if (!currentBadge) return

  // Always center the current badge smoothly
  const badgeLeft = currentBadge.offsetLeft
  const badgeWidth = currentBadge.offsetWidth
  const containerWidth = flowEl.clientWidth
  const targetScroll = badgeLeft - (containerWidth / 2) + (badgeWidth / 2)

  flowEl.scrollTo({
    left: Math.max(0, targetScroll),
    behavior: 'smooth'
  })
})

function setChordFlowRef(id: number, el: HTMLElement | null) {
  if (el) {
    chordFlowRefs.value.set(id, el)
  } else {
    chordFlowRefs.value.delete(id)
  }
}

const currentSongImage = computed(() =>
  songImages.find(s => s.id === store.config.songImageId)
)

const recommendedChordIds = computed(() => {
  const validIds = validProgressionIds.value

  // If no valid progressions from WASM, fall back to songImage recommendations
  if (validIds.length === 0) {
    return currentSongImage.value?.recommendedChords || []
  }

  // Filter songImage recommendations by WASM valid progressions
  const recommended = currentSongImage.value?.recommendedChords || []
  const filtered = recommended.filter(id => validIds.includes(id))

  // If no match, use first 3 valid progressions as recommendations
  if (filtered.length === 0) {
    return validIds.slice(0, 3)
  }

  return filtered
})

// Recommended chords (filtered and sorted by recommendation order)
const recommendedChords = computed(() => {
  const ids = recommendedChordIds.value
  return ids
    .map(id => chordProgressions.value.find(c => c.id === id))
    .filter((c): c is ChordProgression => c !== undefined)
})

// Other chords (valid for style but not recommended)
const otherChords = computed(() => {
  const ids = recommendedChordIds.value
  // Only show valid progressions that are not already recommended
  if (validProgressionIds.value.length === 0) {
    return chordProgressions.value.filter(c => !ids.includes(c.id))
  }
  return chordProgressions.value.filter(c =>
    validProgressionIds.value.includes(c.id) && !ids.includes(c.id)
  )
})

// Show other chords section toggle
const showOtherChords = ref(false)

const KEY_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

function parseDegreesToColors(display: string) {
  const parts = display.split(/\s*-\s*/)
  return parts.map(part => {
    const degree = part.replace(/maj7|7|dim|aug/g, '')
    return {
      degree: part,
      color: chordDegreeColors[degree] || '#757575'
    }
  })
}

function transposeToKey(degree: string, key: number): string {
  const degreeMap: Record<string, number> = {
    'I': 0, 'II': 2, 'III': 4, 'IV': 5, 'V': 7, 'VI': 9, 'VII': 11,
    'i': 0, 'ii': 2, 'iii': 4, 'iv': 5, 'v': 7, 'vi': 9, 'vii': 11,
    'bII': 1, 'bIII': 3, 'bVI': 8, 'bVII': 10
  }

  const baseDegree = degree.replace(/maj7|7|dim|aug/g, '')
  const suffix = degree.replace(baseDegree, '')
  const interval = degreeMap[baseDegree]

  if (interval === undefined) return degree

  const noteIndex = (key + interval) % 12
  let noteName = KEY_NAMES[noteIndex]

  if (baseDegree === baseDegree.toLowerCase() && !baseDegree.startsWith('b')) {
    noteName += 'm'
  }

  return noteName + suffix
}

function selectChord(id: number) {
  store.selectChordProgression(id)
  // Warmup audio on first interaction
  warmupChordPlayer()
}

async function togglePlay(id: number) {
  // Ensure audio is warmed up
  await warmupChordPlayer()
  const chord = chordProgressions.value.find(c => c.id === id)
  if (!chord) return

  if (playingChordId.value === id && isPlaying.value) {
    stop()
    playingChordId.value = null
  } else {
    // Stop any current playback first
    if (isPlaying.value) {
      stop()
    }
    playingChordId.value = id
    await playProgression(chord.display, store.config.key, store.config.bpm)
  }
}

async function handleBadgeClick(chordId: number, index: number, degree: string) {
  await warmupChordPlayer()
  const key = `${chordId}-${index}`
  clickedBadgeKey.value = key
  playChord(degree, store.config.key)
  // Reset after animation
  setTimeout(() => {
    if (clickedBadgeKey.value === key) {
      clickedBadgeKey.value = null
    }
  }, 500)
}
</script>

<template>
  <div class="chord-step">
    <!-- Header -->
    <StepHeader :title="t('chordStep.title')" :subtitle="t('chordStep.subtitle')" />

    <!-- Recommended Section -->
    <section class="chord-section">
      <SectionHeader
        icon="★"
        :title="t('chordStep.recommended')"
        :subtitle="currentSongImage ? t(`songImages.${currentSongImage.id}.name`) : undefined"
        type="warning"
      />

      <div class="chord-grid">
        <article
          v-for="chord in recommendedChords"
          :key="chord.id"
          class="chord-card chord-card--recommended"
          :class="{
            'chord-card--selected': store.config.chordProgressionId === chord.id,
            'chord-card--playing': playingChordId === chord.id
          }"
          @click="selectChord(chord.id)"
        >
          <div class="chord-card__star">★</div>

          <div class="chord-card__header">
            <h3 class="chord-card__name">{{ chord.name }}</h3>
            <button
              class="chord-card__play"
              :class="{ 'chord-card__play--active': playingChordId === chord.id }"
              @click.stop="togglePlay(chord.id)"
              :aria-label="playingChordId === chord.id ? 'Stop' : 'Play'"
            >
              <span v-if="playingChordId === chord.id">◼</span>
              <span v-else>▶</span>
            </button>
          </div>

          <div
            class="chord-flow"
            :ref="(el) => setChordFlowRef(chord.id, el as HTMLElement)"
          >
            <div
              v-for="(item, index) in parseDegreesToColors(chord.display)"
              :key="index"
              class="chord-badge"
              :class="{
                'chord-badge--playing': playingChordId === chord.id && currentChordIndex === index,
                'chord-badge--clicked': clickedBadgeKey === `${chord.id}-${index}`
              }"
              :style="{ backgroundColor: item.color }"
              @click.stop="handleBadgeClick(chord.id, index, item.degree)"
            >
              <span class="chord-badge__note">{{ transposeToKey(item.degree, store.config.key) }}</span>
              <span class="chord-badge__degree">{{ item.degree }}</span>
            </div>
          </div>

          <p class="chord-card__description">
            {{ t(`chordProgressions.${chord.id}.description`) }}
          </p>

          <div v-if="playingChordId === chord.id" class="chord-visualizer">
            <span class="chord-visualizer__bar"></span>
            <span class="chord-visualizer__bar"></span>
            <span class="chord-visualizer__bar"></span>
            <span class="chord-visualizer__bar"></span>
          </div>
        </article>
      </div>
    </section>

    <!-- Other Chords Section (Collapsible) -->
    <section class="chord-section chord-section--other">
      <SectionHeader
        :title="t('chordStep.otherChords')"
        :count="otherChords.length"
        is-collapsible
        :is-expanded="showOtherChords"
        @toggle="showOtherChords = !showOtherChords"
      />

      <div v-if="showOtherChords" class="chord-grid chord-grid--other">
        <article
          v-for="chord in otherChords"
          :key="chord.id"
          class="chord-card"
          :class="{
            'chord-card--selected': store.config.chordProgressionId === chord.id,
            'chord-card--playing': playingChordId === chord.id
          }"
          @click="selectChord(chord.id)"
        >
          <div class="chord-card__header">
            <h3 class="chord-card__name">{{ chord.name }}</h3>
            <button
              class="chord-card__play"
              :class="{ 'chord-card__play--active': playingChordId === chord.id }"
              @click.stop="togglePlay(chord.id)"
              :aria-label="playingChordId === chord.id ? 'Stop' : 'Play'"
            >
              <span v-if="playingChordId === chord.id">◼</span>
              <span v-else>▶</span>
            </button>
          </div>

          <div
            class="chord-flow"
            :ref="(el) => setChordFlowRef(chord.id, el as HTMLElement)"
          >
            <div
              v-for="(item, index) in parseDegreesToColors(chord.display)"
              :key="index"
              class="chord-badge"
              :class="{
                'chord-badge--playing': playingChordId === chord.id && currentChordIndex === index,
                'chord-badge--clicked': clickedBadgeKey === `${chord.id}-${index}`
              }"
              :style="{ backgroundColor: item.color }"
              @click.stop="handleBadgeClick(chord.id, index, item.degree)"
            >
              <span class="chord-badge__note">{{ transposeToKey(item.degree, store.config.key) }}</span>
              <span class="chord-badge__degree">{{ item.degree }}</span>
            </div>
          </div>

          <p class="chord-card__description">
            {{ t(`chordProgressions.${chord.id}.description`) }}
          </p>

          <div v-if="playingChordId === chord.id" class="chord-visualizer">
            <span class="chord-visualizer__bar"></span>
            <span class="chord-visualizer__bar"></span>
            <span class="chord-visualizer__bar"></span>
            <span class="chord-visualizer__bar"></span>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.chord-step {
  --step-accent: #8B5CF6;
  --accent-rgb: 139, 92, 246;
  overflow: visible;
}

.chord-section {
  margin-bottom: 1.5rem;
  overflow: visible;
}

.chord-section--other {
  margin-top: 1rem;
}

.chord-grid--other {
  margin-top: 1rem;
  opacity: 0.8;
}

.chord-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
  padding: 0.5rem;
  margin: 1rem -0.5rem -0.5rem -0.5rem;
}

.chord-card {
  position: relative;
  background: rgba(20, 20, 28, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 16px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* Ambient glow layer */
.chord-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 100% 80% at 50% 120%,
    rgba(139, 92, 246, 0.15),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

/* Ripple container */
.chord-card::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  opacity: 0;
}

.chord-card:hover {
  border-color: rgba(139, 92, 246, 0.25);
  transform: translateY(-2px);
}

.chord-card:hover::before {
  opacity: 1;
}

/* Active press effect */
.chord-card:active {
  transform: translateY(0) scale(0.98);
  transition: transform 0.1s ease;
}

.chord-card:active::after {
  animation: ripple-expand 0.6s ease-out;
}

@keyframes ripple-expand {
  0% {
    width: 0;
    height: 0;
    opacity: 0.6;
  }
  100% {
    width: 400px;
    height: 400px;
    opacity: 0;
  }
}

.chord-card--selected {
  border-color: var(--step-accent);
  border-width: 2px;
  background: rgba(139, 92, 246, 0.12);
  animation: selected-glow 2s ease-in-out infinite;
}

.chord-card--selected::before {
  opacity: 1;
  background: radial-gradient(
    ellipse 120% 100% at 50% 100%,
    rgba(139, 92, 246, 0.25),
    transparent 60%
  );
}

@keyframes selected-glow {
  0%, 100% {
    box-shadow:
      0 0 0 3px rgba(139, 92, 246, 0.15),
      0 0 24px -4px rgba(139, 92, 246, 0.3),
      inset 0 0 20px -10px rgba(139, 92, 246, 0.2);
  }
  50% {
    box-shadow:
      0 0 0 4px rgba(139, 92, 246, 0.2),
      0 0 36px -4px rgba(139, 92, 246, 0.4),
      inset 0 0 30px -10px rgba(139, 92, 246, 0.3);
  }
}

.chord-card--recommended {
  border-color: rgba(245, 158, 11, 0.3);
}

.chord-card--playing {
  border-color: var(--step-accent);
  animation: playing-pulse 0.8s ease-in-out infinite, playing-border 1.6s linear infinite;
}

.chord-card--playing::before {
  opacity: 1;
  animation: playing-glow 0.8s ease-in-out infinite;
}

@keyframes playing-pulse {
  0%, 100% {
    box-shadow:
      0 0 0 2px rgba(139, 92, 246, 0.3),
      0 0 30px -4px rgba(139, 92, 246, 0.5),
      0 0 60px -8px rgba(139, 92, 246, 0.3);
    transform: translateY(-2px);
  }
  50% {
    box-shadow:
      0 0 0 4px rgba(139, 92, 246, 0.4),
      0 0 50px -4px rgba(139, 92, 246, 0.6),
      0 0 80px -8px rgba(139, 92, 246, 0.4);
    transform: translateY(-4px);
  }
}

@keyframes playing-glow {
  0%, 100% {
    background: radial-gradient(
      ellipse 100% 80% at 50% 120%,
      rgba(139, 92, 246, 0.3),
      transparent 60%
    );
  }
  50% {
    background: radial-gradient(
      ellipse 120% 100% at 50% 100%,
      rgba(139, 92, 246, 0.5),
      transparent 70%
    );
  }
}

@keyframes playing-border {
  0% {
    border-color: rgba(139, 92, 246, 0.6);
  }
  50% {
    border-color: rgba(236, 72, 153, 0.6);
  }
  100% {
    border-color: rgba(139, 92, 246, 0.6);
  }
}

.chord-card__star {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  color: #F59E0B;
  font-size: 0.9rem;
  filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5));
}

.chord-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.chord-card__name {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #FAFAFA;
  margin: 0;
}

.chord-card__play {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 50%;
  color: var(--step-accent);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

/* Ring pulse effect */
.chord-card__play::before {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid var(--step-accent);
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s ease;
}

.chord-card__play:hover {
  background: rgba(139, 92, 246, 0.3);
  transform: scale(1.1);
  box-shadow: 0 0 20px -4px rgba(139, 92, 246, 0.5);
}

.chord-card__play:hover::before {
  opacity: 0.5;
  transform: scale(1);
}

.chord-card__play:active {
  transform: scale(0.95);
  transition: transform 0.1s ease;
}

.chord-card__play--active {
  background: linear-gradient(135deg, var(--step-accent), #EC4899);
  color: white;
  border-color: transparent;
  animation: play-active-pulse 0.6s ease-in-out infinite;
}

.chord-card__play--active::before {
  animation: play-ring-expand 1s ease-out infinite;
}

@keyframes play-active-pulse {
  0%, 100% {
    box-shadow:
      0 0 0 0 rgba(139, 92, 246, 0.4),
      0 0 20px -2px rgba(139, 92, 246, 0.6);
    transform: scale(1);
  }
  50% {
    box-shadow:
      0 0 0 4px rgba(139, 92, 246, 0.2),
      0 0 30px -2px rgba(236, 72, 153, 0.6);
    transform: scale(1.05);
  }
}

@keyframes play-ring-expand {
  0% {
    opacity: 0.6;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}

.chord-flow {
  display: flex;
  gap: 0.5rem;
  margin: 0.5rem -0.25rem 0.75rem;
  overflow-x: auto;
  overflow-y: visible;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  /* Hide scrollbar but keep scrollable */
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 92, 246, 0.3) transparent;
}

/* Webkit scrollbar styling */
.chord-flow::-webkit-scrollbar {
  height: 4px;
}

.chord-flow::-webkit-scrollbar-track {
  background: transparent;
}

.chord-flow::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 2px;
}

.chord-flow::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.5);
}

.chord-badge {
  flex: 0 0 auto;
  width: 64px;
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 10px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  /* Add subtle inner glow and depth */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -2px 4px rgba(0, 0, 0, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Glossy highlight overlay */
.chord-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    transparent 100%
  );
  border-radius: 10px 10px 0 0;
  pointer-events: none;
}

/* Connector arrow between badges */
.chord-badge::after {
  content: '→';
  position: absolute;
  right: -0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.25);
  z-index: 1;
}

.chord-badge:last-child::after {
  display: none;
}

.chord-badge:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 4px rgba(0, 0, 0, 0.15),
    0 8px 24px 4px rgba(255, 255, 255, 0.12),
    0 0 0 2px rgba(255, 255, 255, 0.15);
  filter: brightness(1.15);
}

.chord-badge--playing,
.chord-badge--clicked {
  transform: translateY(-4px) scale(1.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -2px 4px rgba(0, 0, 0, 0.1),
    0 8px 24px 4px rgba(255, 255, 255, 0.2),
    0 0 0 3px rgba(255, 255, 255, 0.3),
    0 0 40px 4px currentColor;
  filter: brightness(1.3) saturate(1.2);
  animation: badge-playing 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 10;
}

/* Outer ring effect for playing/clicked badge */
.chord-badge--playing::after,
.chord-badge--clicked::after {
  content: '♪';
  position: absolute;
  right: auto;
  left: 50%;
  top: -12px;
  transform: translateX(-50%);
  font-size: 0.7rem;
  color: white;
  text-shadow: 0 0 8px currentColor;
  animation: note-float 0.6s ease-out forwards;
}

@keyframes badge-playing {
  0% {
    transform: translateY(0) scale(1);
    filter: brightness(1);
  }
  30% {
    transform: translateY(-6px) scale(1.18);
    filter: brightness(1.4) saturate(1.3);
  }
  100% {
    transform: translateY(-4px) scale(1.12);
    filter: brightness(1.3) saturate(1.2);
  }
}

@keyframes note-float {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(8px) scale(0.5);
  }
  30% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-16px) scale(0.8);
  }
}

.chord-badge__note {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.4),
    0 0 8px rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
  line-height: 1;
}

.chord-badge__degree {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4px;
  width: 44px;
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  position: relative;
  z-index: 1;
  white-space: nowrap;
}

.chord-card__description {
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.5);
  margin: 0;
  line-height: 1.4;
}

.chord-visualizer {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 20px;
}

.chord-visualizer__bar {
  width: 3px;
  background: var(--step-accent);
  border-radius: 2px;
  animation: visualize 0.5s ease-in-out infinite alternate;
}

.chord-visualizer__bar:nth-child(1) { height: 40%; animation-delay: 0s; }
.chord-visualizer__bar:nth-child(2) { height: 80%; animation-delay: 0.1s; }
.chord-visualizer__bar:nth-child(3) { height: 60%; animation-delay: 0.2s; }
.chord-visualizer__bar:nth-child(4) { height: 100%; animation-delay: 0.3s; }

@keyframes visualize {
  from { transform: scaleY(0.4); }
  to { transform: scaleY(1); }
}

@media (max-width: 640px) {
  .chord-grid {
    grid-template-columns: 1fr;
  }

  .chord-flow {
    padding: 0.5rem;
    gap: 0.375rem;
    /* Show subtle scroll indicator on mobile */
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .chord-flow::-webkit-scrollbar {
    display: none;
  }

  .chord-badge {
    width: 52px;
    height: 52px;
    padding: 0.25rem;
  }

  .chord-badge__note {
    font-size: 0.95rem;
  }

  .chord-badge__degree {
    font-size: 0.55rem;
    width: 36px;
  }

  .chord-badge::after {
    font-size: 0.5rem;
    right: -0.375rem;
  }
}
</style>
