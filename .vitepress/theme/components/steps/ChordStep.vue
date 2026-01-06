<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import { useChordPlayer } from '../../composables/useChordPlayer'
import { chordProgressions, chordDegreeColors } from '../../data/chordColors'
import { songImages } from '../../data/songImages'

const { t } = useI18n()
const store = useWizardStore()
const { isPlaying, currentChordIndex, playChord, playProgression, stop } = useChordPlayer()
const playingChordId = ref<number | null>(null)

// WASM module for getting valid progressions
let midisketch: any = null
const validProgressionIds = ref<number[]>([])
const isWasmLoaded = ref(false)

onMounted(async () => {
  if (typeof window === 'undefined') return

  try {
    const mod = await import('../../wasm/index.js')
    midisketch = mod
    const wasmPath = new URL('../../wasm/midisketch.wasm', import.meta.url).href
    await mod.init({ wasmPath })
    isWasmLoaded.value = true
    updateValidProgressions()
  } catch {
    // WASM load failed, fall back to showing all progressions
    validProgressionIds.value = chordProgressions.map(c => c.id)
  }
})

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
    .map(id => chordProgressions.find(c => c.id === id))
    .filter((c): c is typeof chordProgressions[0] => c !== undefined)
})

// Other chords (valid for style but not recommended)
const otherChords = computed(() => {
  const ids = recommendedChordIds.value
  // Only show valid progressions that are not already recommended
  if (validProgressionIds.value.length === 0) {
    return chordProgressions.filter(c => !ids.includes(c.id))
  }
  return chordProgressions.filter(c =>
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
}

async function togglePlay(id: number) {
  const chord = chordProgressions.find(c => c.id === id)
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
</script>

<template>
  <div class="chord-step">
    <!-- Header -->
    <header class="step-header">
      <h2 class="step-header__title">{{ t('chordStep.title') }}</h2>
      <p class="step-header__subtitle">{{ t('chordStep.subtitle') }}</p>
    </header>

    <!-- Recommended Section -->
    <section class="chord-section">
      <div class="section-header">
        <span class="section-header__icon">★</span>
        <span class="section-header__title">{{ t('chordStep.recommended') }}</span>
        <span v-if="currentSongImage" class="section-header__subtitle">
          {{ t(`songImages.${currentSongImage.id}.name`) }}
        </span>
      </div>

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

          <div class="chord-flow">
            <div
              v-for="(item, index) in parseDegreesToColors(chord.display)"
              :key="index"
              class="chord-badge"
              :class="{ 'chord-badge--playing': playingChordId === chord.id && currentChordIndex === index }"
              :style="{ backgroundColor: item.color }"
              @click.stop="playChord(item.degree, store.config.key)"
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
      <button
        class="section-toggle"
        @click="showOtherChords = !showOtherChords"
      >
        <span class="section-toggle__icon">{{ showOtherChords ? '−' : '+' }}</span>
        <span class="section-toggle__title">{{ t('chordStep.otherChords') }}</span>
        <span class="section-toggle__count">({{ otherChords.length }})</span>
      </button>

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

          <div class="chord-flow">
            <div
              v-for="(item, index) in parseDegreesToColors(chord.display)"
              :key="index"
              class="chord-badge"
              :class="{ 'chord-badge--playing': playingChordId === chord.id && currentChordIndex === index }"
              :style="{ backgroundColor: item.color }"
              @click.stop="playChord(item.degree, store.config.key)"
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
  overflow: visible;
}

.step-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.step-header__title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #FAFAFA;
  margin: 0 0 0.5rem;
}

.step-header__subtitle {
  font-size: 0.9rem;
  color: rgba(250, 250, 250, 0.5);
  margin: 0;
}

.chord-section {
  margin-bottom: 1.5rem;
  overflow: visible;
}

.chord-section--other {
  margin-top: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
}

.section-header__icon {
  color: #F59E0B;
  font-size: 1rem;
}

.section-header__title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #FAFAFA;
}

.section-header__subtitle {
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.5);
  margin-left: auto;
}

.section-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.section-toggle:hover {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.2);
}

.section-toggle__icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 4px;
  color: var(--step-accent);
  font-size: 0.9rem;
  font-weight: 700;
}

.section-toggle__title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.6);
}

.section-toggle__count {
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.4);
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
  margin: -0.5rem;
}

.chord-card {
  position: relative;
  background: rgba(20, 20, 28, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 16px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chord-card:hover {
  border-color: rgba(139, 92, 246, 0.25);
  transform: translateY(-2px);
}

.chord-card--selected {
  border-color: var(--step-accent);
  border-width: 2px;
  background: rgba(139, 92, 246, 0.15);
  box-shadow:
    0 0 0 4px rgba(139, 92, 246, 0.15),
    0 0 32px -8px rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
}

.chord-card--recommended {
  border-color: rgba(245, 158, 11, 0.3);
}

.chord-card--playing {
  animation: card-pulse 1s ease-in-out infinite;
}

@keyframes card-pulse {
  0%, 100% { box-shadow: 0 0 24px -4px rgba(139, 92, 246, 0.3); }
  50% { box-shadow: 0 0 40px -4px rgba(139, 92, 246, 0.5); }
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
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 50%;
  color: var(--step-accent);
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chord-card__play:hover {
  background: rgba(139, 92, 246, 0.25);
  transform: scale(1.1);
}

.chord-card__play--active {
  background: var(--step-accent);
  color: white;
  box-shadow: 0 0 16px -2px rgba(139, 92, 246, 0.6);
}

.chord-flow {
  display: flex;
  gap: 0.5rem;
  margin: 0.5rem -0.25rem 0.75rem;
  overflow: visible;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.chord-badge {
  flex: 1;
  min-width: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
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

.chord-badge--playing {
  transform: translateY(-3px) scale(1.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    inset 0 -2px 4px rgba(0, 0, 0, 0.1),
    0 12px 32px 6px rgba(255, 255, 255, 0.15),
    0 0 0 2px rgba(255, 255, 255, 0.2);
  filter: brightness(1.25);
  animation: badge-glow 0.6s ease-out;
}

@keyframes badge-glow {
  0% {
    transform: translateY(-4px) scale(1.1);
    filter: brightness(1.2);
  }
  100% {
    transform: translateY(-4px) scale(1.05);
    filter: brightness(1);
  }
}

.chord-badge__note {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: white;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.4),
    0 0 8px rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.chord-badge__degree {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 3px;
  padding: 1px 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  position: relative;
  z-index: 1;
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
    flex-wrap: nowrap;
    padding: 0.375rem;
    gap: 0.375rem;
  }

  .chord-badge {
    min-width: 42px;
    padding: 0.5rem 0.375rem;
  }

  .chord-badge__note {
    font-size: 0.85rem;
  }

  .chord-badge__degree {
    font-size: 0.55rem;
    padding: 1px 4px;
  }

  .chord-badge::after {
    font-size: 0.5rem;
    right: -0.375rem;
  }
}
</style>
