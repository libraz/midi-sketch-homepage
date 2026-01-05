<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import { useMidiPlayer } from '../../composables/useMidiPlayer'
import { songImages } from '../../data/songImages'
import { chordProgressions } from '../../data/chordColors'
import PianoRoll from '../PianoRoll.vue'

const { t } = useI18n()
const store = useWizardStore()
const { isPlaying, currentTick, duration, play, stop } = useMidiPlayer()

function handleSeek(tick: number) {
  stop()
  if (eventData.value) {
    play(eventData.value, tick)
  }
}

const isLoading = ref(true)
const isGenerating = ref(false)
const isGenerated = ref(false)
const error = ref<string | null>(null)
const midiData = ref<Uint8Array | null>(null)
const eventData = ref<any>(null)

let midisketch: any = null
let instance: any = null

const KEY_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

const currentSongImage = computed(() =>
  songImages.find(s => s.id === store.config.songImageId)
)

const currentChord = computed(() =>
  chordProgressions.find(c => c.id === store.config.chordProgressionId)
)

const summary = computed(() => [
  {
    label: t('generateStep.summary.style'),
    value: currentSongImage.value ? t(`songImages.${currentSongImage.value.id}.name`) : '-'
  },
  {
    label: t('generateStep.summary.chordProgression'),
    value: currentChord.value?.name || '-'
  },
  {
    label: t('generateStep.summary.key'),
    value: `${KEY_NAMES[store.config.key]} ${t('settingsStep.key.major')}`
  },
  {
    label: t('generateStep.summary.tempo'),
    value: `${store.config.bpm} BPM`
  }
])

onMounted(async () => {
  if (typeof window === 'undefined') return

  try {
    midisketch = await import('../../wasm/index.js')
    const wasmPath = new URL('../../wasm/midisketch.wasm', import.meta.url).href
    await midisketch.init({ wasmPath })
    instance = new midisketch.MidiSketch()
    isLoading.value = false
  } catch (e: any) {
    error.value = e.message
    isLoading.value = false
  }
})

async function generate() {
  if (!instance) return

  isGenerating.value = true
  error.value = null

  try {
    instance.generate({
      structureId: store.config.stylePresetId % 11,
      moodId: store.config.stylePresetId,
      key: store.config.key,
      bpm: store.config.bpm,
      seed: store.config.seed || Math.floor(Math.random() * 0xFFFFFFFF)
    })

    midiData.value = instance.getMidi()

    // Get event data for piano roll
    try {
      eventData.value = instance.getEvents()
    } catch {
      // Event data is optional
      eventData.value = null
    }

    isGenerated.value = true
  } catch (e: any) {
    error.value = e.message
  } finally {
    isGenerating.value = false
  }
}

function download() {
  if (!midiData.value || !midisketch) return
  midisketch.downloadMidi(midiData.value, 'midi-sketch.mid')
}

function regenerate() {
  store.config.seed = Math.floor(Math.random() * 0xFFFFFFFF)
  generate()
}

async function regenerateMelody() {
  if (!instance) return

  // Stop playback if playing
  if (isPlaying.value) {
    stop()
  }

  isGenerating.value = true
  error.value = null

  try {
    const newSeed = Math.floor(Math.random() * 0xFFFFFFFF)
    instance.regenerateMelody(newSeed)

    midiData.value = instance.getMidi()

    try {
      eventData.value = instance.getEvents()
    } catch {
      eventData.value = null
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    isGenerating.value = false
  }
}

async function togglePlay() {
  if (!eventData.value) return
  await play(eventData.value)
}
</script>

<template>
  <div class="generate-step">
    <!-- Header -->
    <header class="step-header">
      <h2 class="step-header__title">{{ t('generateStep.title') }}</h2>
      <p class="step-header__subtitle">{{ t('generateStep.subtitle') }}</p>
    </header>

    <!-- Summary Card -->
    <div class="summary-card">
      <div class="summary-card__header">
        <span class="summary-card__icon">◈</span>
        <span class="summary-card__title">{{ t('generateStep.summary.title') }}</span>
      </div>

      <div class="summary-list">
        <div v-for="item in summary" :key="item.label" class="summary-item">
          <span class="summary-item__label">{{ item.label }}</span>
          <span class="summary-item__value">{{ item.value }}</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>{{ t('generateStep.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="error-state__icon">⚠</span>
      <p>{{ error }}</p>
    </div>

    <!-- Generate Button -->
    <template v-else>
      <button
        v-if="!isGenerated"
        class="generate-btn"
        :class="{ 'generate-btn--loading': isGenerating }"
        :disabled="isGenerating"
        @click="generate"
      >
        <span v-if="isGenerating" class="generate-btn__spinner"></span>
        <span class="generate-btn__icon" v-else>✦</span>
        <span class="generate-btn__text">
          {{ isGenerating ? t('generateStep.button.generating') : t('generateStep.button.generate') }}
        </span>
      </button>

      <!-- Result Panel -->
      <div v-else class="result-panel">
        <div class="result-panel__success">
          <span class="result-panel__check">✓</span>
          <span>{{ t('generateStep.result.success') }}</span>
        </div>

        <!-- Piano Roll with Player -->
        <div v-if="eventData" class="piano-roll-container">
          <div class="piano-roll-header">
            <h3 class="piano-roll-title">{{ t('generateStep.result.preview') }}</h3>
            <button
              class="play-btn"
              :class="{ 'play-btn--playing': isPlaying }"
              @click="togglePlay"
            >
              <span v-if="isPlaying">◼</span>
              <span v-else>▶</span>
              <span class="play-btn__text">{{ isPlaying ? t('generateStep.result.stop') : t('generateStep.result.play') }}</span>
            </button>
          </div>
          <PianoRoll :events="eventData" :current-tick="currentTick" :is-playing="isPlaying" @seek="handleSeek" />
        </div>

        <div class="result-actions">
          <button class="action-btn action-btn--primary" @click="download">
            <span class="action-btn__icon">↓</span>
            <span>{{ t('generateStep.result.download') }}</span>
          </button>

          <button
            class="action-btn action-btn--melody"
            :disabled="isGenerating"
            @click="regenerateMelody"
          >
            <span class="action-btn__icon">♪</span>
            <span>{{ t('generateStep.result.regenerateMelody') }}</span>
          </button>

          <button class="action-btn action-btn--secondary" @click="regenerate">
            <span class="action-btn__icon">↻</span>
            <span>{{ t('generateStep.result.regenerate') }}</span>
          </button>
        </div>

        <p class="result-hint">{{ t('generateStep.result.hint') }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.generate-step {
  --step-accent: #8B5CF6;
}

.step-header {
  text-align: center;
  margin-bottom: 2rem;
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

.summary-card {
  background: rgba(20, 20, 28, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.summary-card__icon {
  color: var(--step-accent);
  font-size: 1.25rem;
}

.summary-card__title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-list {
  display: grid;
  gap: 0.75rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-item__label {
  font-size: 0.9rem;
  color: rgba(250, 250, 250, 0.5);
}

.summary-item__value {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: #FAFAFA;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: rgba(250, 250, 250, 0.5);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(139, 92, 246, 0.2);
  border-top-color: var(--step-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  color: #FCA5A5;
}

.error-state__icon {
  font-size: 1.5rem;
}

.generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1.25rem 2rem;
  background: linear-gradient(135deg, var(--step-accent) 0%, #7C3AED 50%, #EC4899 100%);
  background-size: 200% 100%;
  border: none;
  border-radius: 16px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow:
    0 8px 32px -8px rgba(139, 92, 246, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.generate-btn:hover:not(:disabled) {
  background-position: 100% 0;
  transform: translateY(-2px);
  box-shadow:
    0 12px 40px -8px rgba(139, 92, 246, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset;
}

.generate-btn:disabled {
  cursor: not-allowed;
}

.generate-btn--loading {
  background-position: 100% 0;
}

.generate-btn__icon {
  font-size: 1.25rem;
  animation: icon-float 2s ease-in-out infinite;
}

@keyframes icon-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.generate-btn__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.result-panel {
  text-align: center;
}

.result-panel__success {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 100px;
  color: #4ADE80;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.result-panel__check {
  font-size: 1.1rem;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.action-btn__icon {
  font-size: 1.1rem;
}

.action-btn--primary {
  background: linear-gradient(135deg, var(--step-accent), #7C3AED);
  border: none;
  color: white;
  box-shadow: 0 4px 16px -4px rgba(139, 92, 246, 0.4);
}

.action-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -4px rgba(139, 92, 246, 0.5);
}

.action-btn--melody {
  background: rgba(236, 72, 153, 0.15);
  border: 1px solid rgba(236, 72, 153, 0.3);
  color: #FAFAFA;
}

.action-btn--melody:hover:not(:disabled) {
  background: rgba(236, 72, 153, 0.25);
  border-color: #EC4899;
}

.action-btn--melody:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn--secondary {
  background: transparent;
  border: 1px solid rgba(139, 92, 246, 0.25);
  color: rgba(250, 250, 250, 0.8);
}

.action-btn--secondary:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.4);
}

.result-hint {
  margin-top: 1.5rem;
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.4);
}

.piano-roll-container {
  margin: 1.5rem 0;
}

.piano-roll-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.piano-roll-title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.7);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.play-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  color: #FAFAFA;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.play-btn:hover {
  background: rgba(139, 92, 246, 0.25);
  border-color: var(--step-accent);
}

.play-btn--playing {
  background: linear-gradient(135deg, var(--step-accent), #7C3AED);
  border-color: transparent;
}

.play-btn__text {
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .generate-btn {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }

  .summary-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
