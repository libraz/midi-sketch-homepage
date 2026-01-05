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
const {
  isPlaying,
  isPaused,
  isLoading: isSoundfontLoading,
  isReady: isSoundfontReady,
  currentTick,
  togglePlay: playerTogglePlay,
  rewind,
  preload,
  stop,
  pause,
  play,
  setTrackInstrument
} = useMidiPlayer()

function handleSeek(tick: number) {
  stop()
  if (eventData.value) {
    play(eventData.value, tick)
  }
}

function handleInstrumentChange(payload: { track: string; instrument: 'piano' | 'guitar' }) {
  setTrackInstrument(payload.track, payload.instrument)
  // If playing, restart to apply the new instrument
  if (isPlaying.value && eventData.value) {
    const currentPos = currentTick.value
    stop()
    play(eventData.value, currentPos)
  }
}

const isLoading = ref(true)
const isGenerating = ref(false)
const isGenerated = ref(false)
const error = ref<string | null>(null)
const eventData = ref<any>(null)
const justRegenerated = ref(false)

let midisketch: any = null
let instance: any = null

// Expose instance for melody step
defineExpose({ getInstance: () => instance })

const KEY_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

const currentSongImage = computed(() =>
  songImages.find(s => s.id === store.config.songImageId)
)

const currentChord = computed(() =>
  chordProgressions.find(c => c.id === store.config.chordProgressionId)
)

// Build advanced settings summary
const advancedSummary = computed(() => {
  const items: string[] = []

  if (store.config.drumsEnabled) {
    items.push(t('bgmStep.summary.drums'))
  }

  if (store.config.arpeggioEnabled) {
    items.push(t('bgmStep.summary.arpeggio'))
  }

  const extensions: string[] = []
  if (store.config.chordExtSus) extensions.push('Sus')
  if (store.config.chordExt7th) extensions.push('7th')
  if (store.config.chordExt9th) extensions.push('9th')
  if (extensions.length > 0) {
    items.push(extensions.join(', '))
  }

  return items.length > 0 ? items.join(' / ') : '-'
})

const summary = computed(() => [
  {
    label: t('bgmStep.summary.style'),
    value: currentSongImage.value ? t(`songImages.${currentSongImage.value.id}.name`) : '-'
  },
  {
    label: t('bgmStep.summary.chordProgression'),
    value: currentChord.value ? `${currentChord.value.name} (${currentChord.value.display})` : '-'
  },
  {
    label: t('bgmStep.summary.key'),
    value: `${KEY_NAMES[store.config.key]} ${t('settingsStep.key.major')}`
  },
  {
    label: t('bgmStep.summary.tempo'),
    value: `${store.config.bpm} BPM`
  },
  {
    label: t('bgmStep.summary.options'),
    value: advancedSummary.value
  }
])

onMounted(async () => {
  if (typeof window === 'undefined') return

  try {
    // Start soundfont preload in parallel with WASM init
    preload()

    const mod = await import('../../wasm/index.js')
    midisketch = mod
    const wasmPath = new URL('../../wasm/midisketch.wasm', import.meta.url).href
    await mod.init({ wasmPath })
    instance = new mod.MidiSketch()
    isLoading.value = false

    // Store instance reference for melody step
    ;(window as any).__midiSketchInstance = instance

    // Auto-generate on mount
    generate()
  } catch (e: any) {
    error.value = e.message
    isLoading.value = false
  }
})

async function generate() {
  if (!instance || !midisketch) return

  isGenerating.value = true
  error.value = null

  try {
    // Validate formId for current style
    const validForms = midisketch.getFormsByStyle(store.config.stylePresetId)
    if (validForms.length > 0 && !validForms.includes(store.config.formId)) {
      store.config.formId = validForms[0]
    }

    // Validate chordProgressionId for current style
    const validProgressions = midisketch.getProgressionsByStyle(store.config.stylePresetId)
    if (validProgressions.length > 0 && !validProgressions.includes(store.config.chordProgressionId)) {
      store.config.chordProgressionId = validProgressions[0]
    }

    // Validate vocalAttitude for current style
    const presets = midisketch.getStylePresets()
    const preset = presets.find((p: any) => p.id === store.config.stylePresetId)
    if (preset) {
      const allowedAttitudes = preset.allowedAttitudes
      const attitudeFlag = 1 << store.config.vocalAttitude
      if ((allowedAttitudes & attitudeFlag) === 0) {
        // Find first allowed attitude
        for (let i = 0; i < 3; i++) {
          if ((allowedAttitudes & (1 << i)) !== 0) {
            store.config.vocalAttitude = i
            break
          }
        }
      }
    }

    instance.generateFromConfig({
      stylePresetId: store.config.stylePresetId,
      key: store.config.key,
      bpm: store.config.bpm,
      seed: store.config.seed || Math.floor(Math.random() * 0xFFFFFFFF),
      chordProgressionId: store.config.chordProgressionId,
      formId: store.config.formId,
      vocalAttitude: store.config.vocalAttitude,
      drumsEnabled: store.config.drumsEnabled,
      arpeggioEnabled: store.config.arpeggioEnabled,
      arpeggioPattern: store.config.arpeggioPattern,
      arpeggioSpeed: store.config.arpeggioSpeed,
      arpeggioOctaveRange: store.config.arpeggioOctaveRange,
      arpeggioGate: store.config.arpeggioGate,
      vocalLow: store.config.vocalLow,
      vocalHigh: store.config.vocalHigh,
      skipVocal: true,  // BGM only, vocal generated in FinalStep
      humanize: store.config.humanize,
      humanizeTiming: store.config.humanizeTiming,
      humanizeVelocity: store.config.humanizeVelocity,
      chordExtSus: store.config.chordExtSus,
      chordExt7th: store.config.chordExt7th,
      chordExt9th: store.config.chordExt9th,
      chordExtSusProb: store.config.chordExtSusProb,
      chordExt7thProb: store.config.chordExt7thProb,
      chordExt9thProb: store.config.chordExt9thProb,
      compositionStyle: store.config.compositionStyle,
      targetDurationSeconds: store.config.targetDurationSeconds,
      // Modulation settings
      modulationTiming: store.config.modulationTiming,
      modulationSemitones: store.config.modulationSemitones,
      // SE/Call settings
      seEnabled: store.config.seEnabled,
      callEnabled: store.config.callEnabled,
      callNotesEnabled: store.config.callNotesEnabled,
      introChant: store.config.introChant,
      mixPattern: store.config.mixPattern,
      callDensity: store.config.callDensity,
      // Vocal detail settings
      vocalNoteDensity: store.config.vocalNoteDensity,
      vocalMinNoteDivision: store.config.vocalMinNoteDivision,
      vocalRestRatio: store.config.vocalRestRatio,
      vocalAllowExtremLeap: store.config.vocalAllowExtremLeap
    })

    try {
      eventData.value = instance.getEvents()
    } catch {
      eventData.value = null
    }

    isGenerated.value = true
    store.setBgmGenerated(true)
  } catch (e: any) {
    error.value = e.message
  } finally {
    isGenerating.value = false
  }
}

async function regenerate() {
  // Pause playback before regenerating (keeps position)
  if (isPlaying.value) {
    pause()
  }

  store.config.seed = Math.floor(Math.random() * 0xFFFFFFFF)
  await generate()

  // Show regeneration feedback
  justRegenerated.value = true
  setTimeout(() => {
    justRegenerated.value = false
  }, 1500)
}

async function togglePlay() {
  if (!eventData.value) return
  await playerTogglePlay(eventData.value)
}

function handleRewind() {
  rewind()
}

function downloadMidi() {
  if (!instance) return

  try {
    const midiData = instance.getMidi()
    const blob = new Blob([midiData], { type: 'audio/midi' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `midi-sketch-bgm-${Date.now()}.mid`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    console.error('Failed to download MIDI:', e)
  }
}
</script>

<template>
  <div class="bgm-step">
    <!-- Header -->
    <header class="step-header">
      <h2 class="step-header__title">{{ t('bgmStep.title') }}</h2>
      <p class="step-header__subtitle">{{ t('bgmStep.subtitle') }}</p>
    </header>

    <!-- Summary Card -->
    <div class="summary-card">
      <div class="summary-card__header">
        <span class="summary-card__icon">◈</span>
        <span class="summary-card__title">{{ t('bgmStep.summary.title') }}</span>
      </div>

      <div class="summary-list">
        <div v-for="item in summary" :key="item.label" class="summary-item">
          <span class="summary-item__label">{{ item.label }}</span>
          <span class="summary-item__value">{{ item.value }}</span>
        </div>
      </div>
    </div>

    <!-- Loading / Generating State -->
    <div v-if="isLoading || isGenerating" class="loading-state">
      <div class="loading-spinner"></div>
      <p>{{ isLoading ? t('bgmStep.loading') : t('bgmStep.button.generating') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="error-state__icon">⚠</span>
      <p>{{ error }}</p>
    </div>

    <!-- Result Panel -->
    <div v-else-if="isGenerated" class="result-panel">
      <!-- Piano Roll with Player -->
      <div v-if="eventData" class="piano-roll-container" :class="{ 'piano-roll-container--regenerated': justRegenerated }">
        <!-- Regenerated Indicator -->
        <Transition name="regen-badge">
          <div v-if="justRegenerated" class="regenerated-badge">
            <span class="regenerated-badge__icon">✓</span>
            <span>{{ t('bgmStep.result.regenerated') }}</span>
          </div>
        </Transition>

        <div class="piano-roll-header">
          <h3 class="piano-roll-title">{{ t('bgmStep.result.preview') }}</h3>
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
                :title="t('bgmStep.result.rewind')"
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
        <PianoRoll :events="eventData" :current-tick="currentTick" :is-playing="isPlaying" @seek="handleSeek" @instrument-change="handleInstrumentChange" />
      </div>

      <div class="result-actions">
        <button class="download-btn" @click="downloadMidi">
          <span class="download-btn__icon">⬇</span>
          <span>{{ t('bgmStep.result.download') }}</span>
        </button>
        <button
          class="regenerate-btn"
          :disabled="isGenerating"
          @click="regenerate"
        >
          <span class="regenerate-btn__icon">↻</span>
          <span>{{ t('bgmStep.result.regenerate') }}</span>
        </button>
      </div>

      <p class="result-hint">{{ t('bgmStep.result.hint') }}</p>
    </div>
  </div>
</template>

<style scoped>
.bgm-step {
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
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
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
    0 8px 32px -8px rgba(16, 185, 129, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 12px 40px -8px rgba(16, 185, 129, 0.6),
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

.piano-roll-container {
  position: relative;
  margin-bottom: 1rem;
  border-radius: 12px;
  transition: box-shadow 0.3s ease;
}

.piano-roll-container--regenerated {
  animation: regenPulse 0.6s ease-out;
}

@keyframes regenPulse {
  0% {
    box-shadow:
      0 0 0 0 rgba(139, 92, 246, 0.4),
      0 0 30px 0 rgba(139, 92, 246, 0.3);
  }
  50% {
    box-shadow:
      0 0 0 8px rgba(139, 92, 246, 0),
      0 0 50px 10px rgba(139, 92, 246, 0.2);
  }
  100% {
    box-shadow:
      0 0 0 0 rgba(139, 92, 246, 0),
      0 0 0 0 rgba(139, 92, 246, 0);
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
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(124, 58, 237, 0.95));
  border-radius: 100px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  box-shadow:
    0 8px 32px -4px rgba(139, 92, 246, 0.5),
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
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  color: #FAFAFA;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: rgba(139, 92, 246, 0.25);
  border-color: var(--step-accent);
}

.control-btn--play {
  width: 44px;
  height: 44px;
  font-size: 1.2rem;
}

.control-btn--playing {
  background: linear-gradient(135deg, var(--step-accent), #7C3AED);
  border-color: transparent;
}

.control-btn--paused {
  background: rgba(236, 72, 153, 0.2);
  border-color: rgba(236, 72, 153, 0.4);
}

.control-btn--rewind:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.download-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  border: none;
  border-radius: 14px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow:
    0 6px 24px -6px rgba(139, 92, 246, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 32px -6px rgba(139, 92, 246, 0.6),
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
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  border: none;
  border-radius: 14px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow:
    0 6px 24px -6px rgba(245, 158, 11, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.regenerate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 10px 32px -6px rgba(245, 158, 11, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset;
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
  transform: none;
}

.result-hint {
  margin-top: 1.5rem;
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.4);
}

/* Soundfont loading indicator */
.soundfont-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
}

.soundfont-loading__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(139, 92, 246, 0.3);
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

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .summary-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
