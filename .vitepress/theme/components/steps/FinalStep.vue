<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import { useMidiPlayer } from '../../composables/useMidiPlayer'
import { useMidiRegeneration } from '../../composables/useMidiRegeneration'
import { useSeedHistory } from '../../composables/useSeedHistory'
import { midiToNoteName } from '../../utils/midiUtils'
import { devLog } from '../../utils/devLog'
import PianoRoll from '../PianoRoll.vue'
import ShareButtons from '../ShareButtons.vue'

const { t } = useI18n()
const store = useWizardStore()
const player = useMidiPlayer()

// Vocal style options (matching MelodyStep)
const vocalStyleOptions = [
  { key: 'standard', value: 1 },
  { key: 'vocaloid', value: 2 },
  { key: 'ultraVocaloid', value: 3 },
  { key: 'idol', value: 4 },
  { key: 'ballad', value: 5 },
  { key: 'rock', value: 6 },
  { key: 'cityPop', value: 7 },
  { key: 'anime', value: 8 },
  { key: 'brightKira', value: 9 },
  { key: 'coolSynth', value: 10 },
  { key: 'cuteAffected', value: 11 },
  { key: 'powerfulShout', value: 12 }
]

// Vocal groove options (matching MelodyStep)
const vocalGrooveOptions = [
  { key: 'straight', value: 0 },
  { key: 'offBeat', value: 1 },
  { key: 'swing', value: 2 },
  { key: 'syncopated', value: 3 },
  { key: 'driving16th', value: 4 },
  { key: 'bouncy8th', value: 5 }
]
const {
  isPlaying,
  isPaused,
  isLoading: isSoundfontLoading,
  isReady: isSoundfontReady,
  currentTick,
  togglePlay: playerTogglePlay,
  stop,
  rewind,
  play,
  setTrackInstrument
} = player

const {
  isGenerating,
  error,
  justRegenerated,
  safeGetEvents,
  showFeedback,
  withPlaybackPreservation
} = useMidiRegeneration(player)

const {
  canUndo: canUndoVocal,
  canRedo: canRedoVocal,
  pushSeed: pushVocalSeed,
  initWithSeed: initVocalSeed,
  undo: undoVocalSeed,
  redo: redoVocalSeed,
  generateSeed
} = useSeedHistory()

function handleSeek(tick: number) {
  stop()
  if (eventData.value) {
    play(eventData.value, tick)
  }
}

function handleInstrumentChange(payload: { track: string; instrument: 'piano' | 'guitar' }) {
  setTrackInstrument(payload.track, payload.instrument)
  if (isPlaying.value && eventData.value) {
    const currentPos = currentTick.value
    stop()
    play(eventData.value, currentPos)
  }
}

const midiData = ref<Uint8Array | null>(null)
const eventData = ref<any>(null)
const isAdvancedOpen = ref(false)

// Melody template options (matching MelodyStep)
const melodyTemplateOptions = [
  { key: 'auto', value: 0 },
  { key: 'plateauTalk', value: 1 },
  { key: 'runUpTarget', value: 2 },
  { key: 'downResolve', value: 3 },
  { key: 'hookRepeat', value: 4 },
  { key: 'sparseAnchor', value: 5 },
  { key: 'callResponse', value: 6 },
  { key: 'jumpAccent', value: 7 }
]

let midisketch: any = null
let instance: any = null

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

// Internal generation function that accepts a seed
async function generateWithSeed(seed: number) {
  if (!instance) return

  const vocalParams = {
    seed,
    vocalLow: store.config.vocalLow,
    vocalHigh: store.config.vocalHigh,
    vocalAttitude: store.config.vocalAttitude,
    vocalStyle: store.config.vocalStyle,
    melodyTemplate: store.config.melodyTemplate,
    melodicComplexity: store.config.melodicComplexity,
    hookIntensity: store.config.hookIntensity,
    vocalGroove: store.config.vocalGroove,
    compositionStyle: store.config.compositionStyle
  }

  devLog('Vocal regenerateVocal', vocalParams)

  instance.regenerateVocal(vocalParams)

  midiData.value = instance.getMidi()
  eventData.value = safeGetEvents(instance)
}

async function generateMelody() {
  if (!instance) return

  if (isPlaying.value) {
    stop()
  }

  isGenerating.value = true
  error.value = null

  try {
    // Generate initial seed and add to history
    const initialSeed = generateSeed()
    initVocalSeed(initialSeed)
    await generateWithSeed(initialSeed)
  } catch (e: any) {
    error.value = e.message
    devLog('Vocal Generate Error', e.message)
  } finally {
    isGenerating.value = false
  }
}

async function regenerateVocalTrack() {
  if (!instance) return

  await withPlaybackPreservation(async () => {
    const newSeed = pushVocalSeed()
    await generateWithSeed(newSeed)
  }, () => eventData.value)
  showFeedback()
}

async function undoVocalGeneration() {
  const seed = undoVocalSeed()
  if (seed === null || !instance) return

  await withPlaybackPreservation(async () => {
    await generateWithSeed(seed)
  }, () => eventData.value)
}

async function redoVocalGeneration() {
  const seed = redoVocalSeed()
  if (seed === null || !instance) return

  await withPlaybackPreservation(async () => {
    await generateWithSeed(seed)
  }, () => eventData.value)
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
      <!-- Settings Summary -->
      <div class="settings-summary">
        <div class="summary-row">
          <span class="summary-label">{{ t('finalStep.summary.vocalRange') }}</span>
          <span class="summary-value">{{ vocalSummary }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">{{ t('finalStep.summary.vocalStyle') }}</span>
          <span class="summary-value">{{ store.config.vocalStyle === 0 ? t('finalStep.summary.auto') : t(`melodyStep.advanced.vocalStyle.options.${vocalStyleOptions[store.config.vocalStyle - 1]?.key || 'auto'}`) }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">{{ t('finalStep.summary.melodyTemplate') }}</span>
          <span class="summary-value">{{ t(`melodyStep.advanced.melodyTemplate.options.${melodyTemplateOptions[store.config.melodyTemplate]?.key || 'auto'}`) }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">{{ t('finalStep.summary.vocalGroove') }}</span>
          <span class="summary-value">{{ t(`melodyStep.advanced.vocalGroove.options.${vocalGrooveOptions[store.config.vocalGroove]?.key || 'straight'}`) }}</span>
        </div>
      </div>

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
              <div class="transport-bar">
                <button
                  class="transport-btn transport-btn--rewind"
                  @click="handleRewind"
                  :title="t('finalStep.rewind')"
                  :disabled="!isSoundfontReady"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/>
                  </svg>
                </button>
                <div class="transport-divider"></div>
                <button
                  class="transport-btn transport-btn--play"
                  :class="{ 'transport-btn--active': isPlaying, 'transport-btn--paused': isPaused }"
                  @click="togglePlay"
                  :disabled="!isSoundfontReady"
                >
                  <svg v-if="isPlaying" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7L8 5z"/>
                  </svg>
                </button>
              </div>
            </template>
          </div>
        </div>
        <PianoRoll :events="eventData" :current-tick="currentTick" :is-playing="isPlaying" @seek="handleSeek" @instrument-change="handleInstrumentChange" />
      </div>

      <!-- Actions -->
      <div class="result-actions">
        <!-- Regenerate Button with integrated history -->
        <div class="regen-card">
          <button
            class="history-inline history-inline--undo"
            :disabled="!canUndoVocal || isGenerating"
            @click="undoVocalGeneration"
            :title="t('finalStep.undo')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
            </svg>
          </button>
          <button
            class="regen-main"
            :disabled="isGenerating"
            @click="regenerateVocalTrack"
          >
            <svg class="regen-main__icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            <span>{{ t('finalStep.regenerateVocal') }}</span>
          </button>
          <button
            class="history-inline history-inline--redo"
            :disabled="!canRedoVocal || isGenerating"
            @click="redoVocalGeneration"
            :title="t('finalStep.redo')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.4 10.6C16.55 9 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
            </svg>
          </button>
        </div>

        <!-- Download Button -->
        <button class="action-btn action-btn--download" @click="download">
          <svg class="action-btn__icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          <span>{{ t('finalStep.download') }}</span>
        </button>

        <!-- Share Buttons -->
        <ShareButtons share-type="vocal" />
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

/* Settings Summary */
.settings-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  padding: 0.75rem 1rem;
  background: rgba(20, 20, 28, 0.5);
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 12px;
  margin-bottom: 1rem;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.5);
}

.summary-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--step-accent);
  padding: 0.125rem 0.5rem;
  background: rgba(16, 185, 129, 0.15);
  border-radius: 4px;
}

.implicit-info {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 0.25rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(16, 185, 129, 0.1);
}

.implicit-info__icon {
  font-size: 0.9rem;
  color: rgba(16, 185, 129, 0.7);
  flex-shrink: 0;
}

.implicit-info__text {
  font-size: 0.7rem;
  color: rgba(250, 250, 250, 0.5);
  line-height: 1.4;
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
  z-index: 100;
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
}

/* Transport Bar - DAW-style unified control */
.transport-bar {
  display: flex;
  align-items: center;
  background: rgba(20, 20, 28, 0.8);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 24px;
  padding: 4px;
  gap: 0;
  backdrop-filter: blur(8px);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.transport-divider {
  width: 1px;
  height: 20px;
  background: rgba(16, 185, 129, 0.2);
  margin: 0 2px;
}

.transport-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: rgba(250, 250, 250, 0.7);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 20px;
}

.transport-btn:hover:not(:disabled) {
  color: #FAFAFA;
  background: rgba(16, 185, 129, 0.15);
}

.transport-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.transport-btn--rewind {
  width: 32px;
  height: 32px;
}

.transport-btn--play {
  width: 40px;
  height: 40px;
  color: #FAFAFA;
}

.transport-btn--play:hover:not(:disabled) {
  background: rgba(16, 185, 129, 0.2);
  transform: scale(1.05);
}

.transport-btn--active {
  background: linear-gradient(135deg, var(--step-accent), #059669);
  color: white;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.4);
}

.transport-btn--active:hover:not(:disabled) {
  background: linear-gradient(135deg, #34D399, #10B981);
}

.transport-btn--paused {
  background: rgba(139, 92, 246, 0.2);
}

.transport-btn--paused:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.3);
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
  gap: 0.625rem;
  margin-top: 1.25rem;
}

/* ============================================
   Regenerate Card - Integrated History Controls
   ============================================ */
.regen-card {
  display: flex;
  align-items: stretch;
  background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%);
  border-radius: 12px;
  box-shadow:
    0 4px 16px -4px rgba(236, 72, 153, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.regen-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px -4px rgba(236, 72, 153, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Inline History Buttons */
.history-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  min-width: 44px;
  background: rgba(0, 0, 0, 0.15);
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-inline:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.25);
  color: white;
}

.history-inline:active:not(:disabled) {
  background: rgba(0, 0, 0, 0.3);
}

.history-inline:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.history-inline svg {
  transition: transform 0.2s ease;
}

.history-inline:hover:not(:disabled) svg {
  transform: scale(1.1);
}

/* Main Regenerate Button */
.regen-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 0.9rem 1.5rem;
  background: transparent;
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.15);
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.regen-main:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.regen-main:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.regen-main__icon {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.regen-main:hover:not(:disabled) .regen-main__icon {
  transform: rotate(180deg);
}

/* ============================================
   Download Button
   ============================================ */
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.9rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.action-btn:hover::before {
  opacity: 1;
}

.action-btn__icon {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.action-btn--download {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  box-shadow:
    0 4px 16px -4px rgba(16, 185, 129, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.action-btn--download:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px -4px rgba(16, 185, 129, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.action-btn--download:hover:not(:disabled) .action-btn__icon {
  transform: translateY(2px);
}

.result-hint {
  margin-top: 1.5rem;
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.4);
  text-align: center;
}

/* Vocal Console */
.vocal-console {
  background: rgba(15, 15, 22, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 16px;
  margin-bottom: 1.5rem;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.vocal-console--open {
  border-color: rgba(139, 92, 246, 0.25);
  box-shadow: 0 0 20px -8px rgba(139, 92, 246, 0.2);
}

.vocal-console__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem 1.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.vocal-console__header:hover {
  background: rgba(139, 92, 246, 0.05);
}

.vocal-console__title {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.vocal-console__icon {
  font-size: 1.1rem;
}

.vocal-console__chevron {
  font-size: 0.7rem;
  color: rgba(250, 250, 250, 0.4);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.vocal-console__chevron--open {
  transform: rotate(180deg);
  color: #8B5CF6;
}

.vocal-console__panel {
  padding: 0 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Panel expand transition */
.panel-expand-enter-active {
  animation: panelExpandIn 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-expand-leave-active {
  animation: panelExpandOut 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes panelExpandIn {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 600px;
    transform: translateY(0);
  }
}

@keyframes panelExpandOut {
  from {
    opacity: 1;
    max-height: 600px;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
}

/* Vocal Setting Item */
.vocal-setting {
  background: rgba(20, 20, 28, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.08);
  border-radius: 12px;
  padding: 1rem;
}

.vocal-setting__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.vocal-setting__label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.9);
}

.vocal-setting__value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: #8B5CF6;
  padding: 0.2rem 0.5rem;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 4px;
}

.vocal-setting__hint {
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.45);
  margin: 0 0 0.875rem;
  line-height: 1.4;
}

/* Density Presets */
.density-presets {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.875rem;
  flex-wrap: wrap;
}

.density-preset {
  flex: 1;
  min-width: 70px;
  padding: 0.5rem 0.625rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 8px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.density-preset:hover {
  border-color: rgba(139, 92, 246, 0.3);
  color: #FAFAFA;
  background: rgba(139, 92, 246, 0.08);
}

.density-preset--active {
  background: rgba(139, 92, 246, 0.2);
  border-color: #8B5CF6;
  color: #FAFAFA;
  box-shadow: 0 0 12px -4px rgba(139, 92, 246, 0.4);
}

/* Slider */
.slider-wrap {
  position: relative;
  height: 6px;
}

.vocal-slider {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.slider-track {
  position: absolute;
  inset: 0;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 3px;
  overflow: hidden;
}

.slider-fill {
  height: 100%;
  background: linear-gradient(90deg, #8B5CF6, #EC4899);
  border-radius: 3px;
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
  transition: width 0.1s ease;
}

/* Division Buttons */
.division-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.division-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.625rem 0.5rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.division-btn:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.08);
}

.division-btn--active {
  background: rgba(139, 92, 246, 0.2);
  border-color: #8B5CF6;
  box-shadow: 0 0 12px -4px rgba(139, 92, 246, 0.4);
}

.division-btn__icon {
  font-size: 1rem;
  color: rgba(250, 250, 250, 0.6);
  transition: color 0.2s ease;
}

.division-btn--active .division-btn__icon {
  color: #8B5CF6;
}

.division-btn__label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.7);
  text-align: center;
}

.division-btn--active .division-btn__label {
  color: #FAFAFA;
}

/* Leap Selector (3-value: Auto/On/Off) */
.leap-selector {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 0.5rem;
}

.leap-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-height: 56px;
  padding: 0.5rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.leap-btn:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.08);
}

.leap-btn--active {
  background: rgba(139, 92, 246, 0.2);
  border-color: #8B5CF6;
  box-shadow: 0 0 12px -4px rgba(139, 92, 246, 0.4);
}

.leap-btn__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(250, 250, 250, 0.5);
  transition: all 0.2s ease;
}

.leap-btn__icon svg {
  width: 18px;
  height: 18px;
}

.leap-btn--active .leap-btn__icon {
  color: #8B5CF6;
}

/* On button - green accent when active */
.leap-btn--active .leap-btn__icon--on {
  color: #10B981;
}

/* Off button - red/coral accent when active */
.leap-btn--active .leap-btn__icon--off {
  color: #F87171;
}

.leap-btn__label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.7);
  text-align: center;
}

.leap-btn--active .leap-btn__label {
  color: #FAFAFA;
}

/* Rest Ratio Mode Selector */
.rest-mode-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.rest-mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.rest-mode-btn:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.08);
}

.rest-mode-btn--active {
  background: rgba(139, 92, 246, 0.2);
  border-color: #8B5CF6;
  box-shadow: 0 0 12px -4px rgba(139, 92, 246, 0.4);
}

.rest-mode-btn__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(250, 250, 250, 0.5);
  transition: color 0.2s ease;
}

.rest-mode-btn--active .rest-mode-btn__icon {
  color: #8B5CF6;
}

.rest-mode-btn__label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.7);
}

.rest-mode-btn--active .rest-mode-btn__label {
  color: #FAFAFA;
}

.slider-wrap--with-margin {
  margin-top: 0.75rem;
}

/* Slider expand transition */
.slider-expand-enter-active,
.slider-expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.slider-expand-enter-from,
.slider-expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
}

.slider-expand-enter-to,
.slider-expand-leave-from {
  opacity: 1;
  max-height: 50px;
  margin-top: 0.75rem;
}

/* Toggle */
.vocal-setting--toggle {
  padding: 0.875rem 1rem;
}

.toggle-label {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  cursor: pointer;
}

.toggle-input {
  display: none;
}

.toggle-switch {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.25s ease;
  margin-top: 2px;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-switch {
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
  box-shadow: 0 0 12px -2px rgba(139, 92, 246, 0.5);
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(20px);
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.toggle-title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.9);
}

.toggle-desc {
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.45);
  line-height: 1.4;
}

@media (max-width: 640px) {
  .piano-roll-header {
    padding: 0 1rem;
  }

  .download-btn {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }

  .division-buttons {
    grid-template-columns: repeat(2, 1fr);
  }

  .density-presets {
    flex-wrap: wrap;
  }

  .density-preset {
    flex: 0 0 calc(50% - 0.25rem);
  }
}
</style>
