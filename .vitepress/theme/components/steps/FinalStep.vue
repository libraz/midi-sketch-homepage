<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import { useMidiPlayer } from '../../composables/useMidiPlayer'
import PianoRoll from '../PianoRoll.vue'

const { t } = useI18n()
const store = useWizardStore()
const {
  isPlaying,
  isPaused,
  isLoading: isSoundfontLoading,
  isReady: isSoundfontReady,
  currentTick,
  togglePlay: playerTogglePlay,
  stop,
  rewind,
  play
} = useMidiPlayer()

function handleSeek(tick: number) {
  stop()
  if (eventData.value) {
    play(eventData.value, tick)
  }
}

const isGenerating = ref(false)
const error = ref<string | null>(null)
const midiData = ref<Uint8Array | null>(null)
const eventData = ref<any>(null)
const justRegenerated = ref(false)

let midisketch: any = null
let instance: any = null

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function midiToNoteName(midi: number): string {
  const note = NOTE_NAMES[midi % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${note}${octave}`
}

// Summary of vocal settings
const vocalSummary = computed(() => {
  const range = `${midiToNoteName(store.config.vocalLow)}–${midiToNoteName(store.config.vocalHigh)}`
  return range
})

onMounted(async () => {
  // Get instance from BgmStep via window
  instance = (window as any).__midiSketchInstance

  if (!instance) {
    error.value = t('finalStep.error.noInstance')
    return
  }

  // Load midisketch for download function
  try {
    midisketch = await import('../../wasm/index.js')
  } catch (e: any) {
    // Non-critical, download just won't work
  }

  // Generate melody on mount
  await generateMelody()
})

async function generateMelody() {
  if (!instance) return

  if (isPlaying.value) {
    stop()
  }

  isGenerating.value = true
  error.value = null

  try {
    instance.regenerateVocal({
      seed: Math.floor(Math.random() * 0xFFFFFFFF),
      vocalLow: store.config.vocalLow,
      vocalHigh: store.config.vocalHigh,
      vocalAttitude: store.config.vocalAttitude
    })

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

async function regenerateVocalTrack() {
  if (!instance) return

  if (isPlaying.value) {
    stop()
  }

  isGenerating.value = true

  try {
    instance.regenerateVocal({
      seed: Math.floor(Math.random() * 0xFFFFFFFF),
      vocalLow: store.config.vocalLow,
      vocalHigh: store.config.vocalHigh,
      vocalAttitude: store.config.vocalAttitude
    })

    midiData.value = instance.getMidi()

    try {
      eventData.value = instance.getEvents()
    } catch {
      eventData.value = null
    }

    // Show regeneration feedback
    justRegenerated.value = true
    setTimeout(() => {
      justRegenerated.value = false
    }, 1500)
  } catch (e: any) {
    error.value = e.message
  } finally {
    isGenerating.value = false
  }
}

function download() {
  if (!midiData.value || !midisketch) return
  midisketch.downloadMidi(midiData.value, `midi-sketch-${Date.now()}.mid`)
}

async function togglePlay() {
  if (!eventData.value) return
  await playerTogglePlay(eventData.value)
}

function handleRewind() {
  rewind()
}
</script>

<template>
  <div class="final-step">
    <!-- Header -->
    <header class="step-header">
      <h2 class="step-header__title">{{ t('finalStep.title') }}</h2>
      <p class="step-header__subtitle">{{ t('finalStep.subtitle') }}</p>
    </header>

    <!-- Loading State -->
    <div v-if="isGenerating && !eventData" class="loading-state">
      <div class="loading-spinner"></div>
      <p>{{ t('finalStep.generating') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="error-state__icon">⚠</span>
      <p>{{ error }}</p>
    </div>

    <!-- Result -->
    <template v-else-if="eventData">
      <!-- Piano Roll Preview -->
      <div class="piano-roll-container" :class="{ 'piano-roll-container--regenerated': justRegenerated }">
        <!-- Regenerated Indicator -->
        <Transition name="regen-badge">
          <div v-if="justRegenerated" class="regenerated-badge">
            <span class="regenerated-badge__icon">✓</span>
            <span>{{ t('finalStep.regenerated') }}</span>
          </div>
        </Transition>

        <div class="piano-roll-header">
          <h3 class="piano-roll-title">{{ t('finalStep.preview') }}</h3>
          <div class="player-controls">
            <!-- Soundfont loading indicator -->
            <div v-if="isSoundfontLoading" class="soundfont-loading">
              <div class="soundfont-loading__spinner"></div>
              <span class="soundfont-loading__text">{{ t('bgmStep.result.loadingAudio') }}</span>
            </div>
            <template v-else>
              <button
                class="control-btn control-btn--rewind"
                @click="handleRewind"
                :title="t('finalStep.rewind')"
                :disabled="!isSoundfontReady"
              >
                <span>⏮</span>
              </button>
              <button
                class="control-btn control-btn--play"
                :class="{ 'control-btn--playing': isPlaying, 'control-btn--paused': isPaused }"
                @click="togglePlay"
                :disabled="!isSoundfontReady"
              >
                <span v-if="isPlaying">⏸</span>
                <span v-else>▶</span>
              </button>
            </template>
          </div>
        </div>
        <PianoRoll :events="eventData" :current-tick="currentTick" :is-playing="isPlaying" @seek="handleSeek" />
      </div>

      <!-- Actions -->
      <div class="result-actions">
        <button class="download-btn" @click="download">
          <span class="download-btn__icon">⬇</span>
          <span>{{ t('finalStep.download') }}</span>
        </button>

        <button
          class="regenerate-btn"
          :disabled="isPlaying || isGenerating"
          @click="regenerateVocalTrack"
        >
          <span class="regenerate-btn__icon">↻</span>
          <span>{{ t('finalStep.regenerateVocal') }}</span>
        </button>
      </div>

      <p class="result-hint">{{ t('finalStep.hint') }}</p>
    </template>
  </div>
</template>

<style scoped>
.final-step {
  --step-accent: #10B981;
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: rgba(250, 250, 250, 0.5);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(16, 185, 129, 0.2);
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

.piano-roll-container {
  position: relative;
  margin-bottom: 1.5rem;
  border-radius: 12px;
  transition: box-shadow 0.3s ease;
}

.piano-roll-container--regenerated {
  animation: regenPulse 0.6s ease-out;
}

@keyframes regenPulse {
  0% {
    box-shadow:
      0 0 0 0 rgba(16, 185, 129, 0.4),
      0 0 30px 0 rgba(16, 185, 129, 0.3);
  }
  50% {
    box-shadow:
      0 0 0 8px rgba(16, 185, 129, 0),
      0 0 50px 10px rgba(16, 185, 129, 0.2);
  }
  100% {
    box-shadow:
      0 0 0 0 rgba(16, 185, 129, 0),
      0 0 0 0 rgba(16, 185, 129, 0);
  }
}

/* Regenerated Badge */
.regenerated-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95));
  border-radius: 100px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  box-shadow:
    0 8px 32px -4px rgba(16, 185, 129, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset;
  backdrop-filter: blur(8px);
}

.regenerated-badge__icon {
  font-size: 1.1rem;
}

/* Badge transition */
.regen-badge-enter-active {
  animation: badgeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.regen-badge-leave-active {
  animation: badgeOut 0.25s ease-in forwards;
}

@keyframes badgeIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes badgeOut {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9) translateY(-10px);
  }
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

.player-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  color: #FAFAFA;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: rgba(16, 185, 129, 0.25);
  border-color: var(--step-accent);
}

.control-btn--play {
  width: 44px;
  height: 44px;
  font-size: 1.2rem;
}

.control-btn--playing {
  background: linear-gradient(135deg, var(--step-accent), #059669);
  border-color: transparent;
}

.control-btn--paused {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
}

.control-btn--rewind:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Soundfont loading indicator */
.soundfont-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
}

.soundfont-loading__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(16, 185, 129, 0.3);
  border-top-color: var(--step-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.soundfont-loading__text {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.7);
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: center;
}

.download-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1.25rem 2rem;
  background: linear-gradient(135deg, var(--step-accent) 0%, #059669 100%);
  border: none;
  border-radius: 16px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow:
    0 8px 32px -8px rgba(16, 185, 129, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 40px -8px rgba(16, 185, 129, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset;
}

.download-btn__icon {
  font-size: 1.25rem;
}

.regenerate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 1.5rem;
  background: rgba(236, 72, 153, 0.15);
  border: 1px solid rgba(236, 72, 153, 0.3);
  border-radius: 14px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #FAFAFA;
  cursor: pointer;
  transition: all 0.25s ease;
}

.regenerate-btn:hover:not(:disabled) {
  background: rgba(236, 72, 153, 0.25);
  border-color: #EC4899;
  transform: translateY(-1px);
}

.regenerate-btn__icon {
  font-size: 1.25rem;
  transition: transform 0.3s ease;
}

.regenerate-btn:hover:not(:disabled) .regenerate-btn__icon {
  transform: rotate(180deg);
}

.regenerate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-hint {
  margin-top: 1.5rem;
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.4);
  text-align: center;
}

@media (max-width: 640px) {
  .download-btn {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
}
</style>
