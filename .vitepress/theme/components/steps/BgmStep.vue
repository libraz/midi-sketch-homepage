<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import { useMidiPlayer } from '../../composables/useMidiPlayer'
import { useMidiRegeneration } from '../../composables/useMidiRegeneration'
import { useSeedHistory } from '../../composables/useSeedHistory'
import { songImages } from '../../data/songImages'
import { chordProgressions } from '../../data/chordColors'
import { KEY_NAMES } from '../../utils/midiUtils'
import PianoRoll from '../PianoRoll.vue'
import ShareButtons from '../ShareButtons.vue'

const { t } = useI18n()
const store = useWizardStore()
const player = useMidiPlayer()
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
  canUndo: canUndoBgm,
  canRedo: canRedoBgm,
  pushSeed: pushBgmSeed,
  initWithSeed: initBgmSeed,
  undo: undoBgmSeed,
  redo: redoBgmSeed,
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
  // If playing, restart to apply the new instrument
  if (isPlaying.value && eventData.value) {
    const currentPos = currentTick.value
    stop()
    play(eventData.value, currentPos)
  }
}

const isLoading = ref(true)
const isGenerated = ref(false)
const eventData = ref<any>(null)

let midisketch: any = null
let instance: any = null

// Expose instance for melody step
defineExpose({ getInstance: () => instance })

const currentSongImage = computed(() =>
  songImages.find(s => s.id === store.config.songImageId)
)

const currentChord = computed(() =>
  chordProgressions.find(c => c.id === store.config.chordProgressionId)
)

// Compute effective vocalAllowExtremLeap boolean value
// 0=Auto (follow vocalStyle), 1=On, 2=Off
const effectiveVocalAllowExtremLeap = computed(() => {
  const setting = store.config.vocalAllowExtremLeap
  if (setting === 1) return true  // On
  if (setting === 2) return false // Off
  // Auto: UltraVocaloid (3) implies extreme leap
  return store.config.vocalStyle === 3
})

// Compute effective vocalRestRatio value
// 0=Auto (follow vocalStyle), 1=Custom (use slider)
const vocalStyleRestRatioMap: Record<number, number> = {
  0: 15,  // Auto - use moderate default
  1: 15,  // Standard
  2: 5,   // Vocaloid
  3: 0,   // UltraVocaloid
  4: 15,  // Idol
  5: 25,  // Ballad
  6: 15, 7: 15, 8: 15, 9: 15, 10: 15, 11: 15, 12: 15
}

const effectiveVocalRestRatio = computed(() => {
  if (store.config.vocalRestRatioMode === 1) {
    return store.config.vocalRestRatio
  }
  return vocalStyleRestRatioMap[store.config.vocalStyle] ?? 15
})

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

    // Auto-generate on mount with initial seed
    const initialSeed = store.config.seed || generateSeed()
    initBgmSeed(initialSeed)
    store.config.seed = initialSeed
    generate()
  } catch (e: any) {
    error.value = e.message
    isLoading.value = false
  }
})

async function generate(overrideSeed?: number) {
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

    // Use override seed if provided, otherwise use store seed or generate new one
    const seed = overrideSeed ?? store.config.seed ?? Math.floor(Math.random() * 0xFFFFFFFF)

    instance.generateFromConfig({
      stylePresetId: store.config.stylePresetId,
      key: store.config.key,
      bpm: store.config.bpm,
      seed,
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
      callEnabled: store.config.callEnabled,
      callNotesEnabled: store.config.callNotesEnabled,
      introChant: store.config.introChant,
      mixPattern: store.config.mixPattern,
      callDensity: store.config.callDensity,
      // Vocal detail settings
      vocalNoteDensity: store.config.vocalNoteDensity,
      vocalMinNoteDivision: store.config.vocalMinNoteDivision,
      vocalRestRatio: effectiveVocalRestRatio.value,
      vocalAllowExtremLeap: effectiveVocalAllowExtremLeap.value,
      // Arrangement settings
      arrangementGrowth: store.config.arrangementGrowth,
      // Arpeggio sync settings
      arpeggioSyncChord: store.config.arpeggioSyncChord,
      // Motif settings
      motifRepeatScope: store.config.motifRepeatScope,
      motifFixedProgression: store.config.motifFixedProgression,
      motifMaxChordCount: store.config.motifMaxChordCount
    })

    eventData.value = safeGetEvents(instance)

    isGenerated.value = true
    store.setBgmGenerated(true)
  } catch (e: any) {
    error.value = e.message
  } finally {
    isGenerating.value = false
  }
}

async function regenerate() {
  await withPlaybackPreservation(async () => {
    const newSeed = pushBgmSeed()
    store.config.seed = newSeed
    await generate(newSeed)
  }, () => eventData.value)
  showFeedback()
}

async function undoGeneration() {
  const seed = undoBgmSeed()
  if (seed === null) return

  await withPlaybackPreservation(async () => {
    store.config.seed = seed
    await generate(seed)
  }, () => eventData.value)
}

async function redoGeneration() {
  const seed = redoBgmSeed()
  if (seed === null) return

  await withPlaybackPreservation(async () => {
    store.config.seed = seed
    await generate(seed)
  }, () => eventData.value)
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
  } catch {
    // Download failed silently
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

    <!-- Settings Summary -->
    <div class="settings-summary">
      <div v-for="item in summary" :key="item.label" class="summary-row">
        <span class="summary-label">{{ item.label }}</span>
        <span class="summary-value">{{ item.value }}</span>
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
              <div class="transport-bar">
                <button
                  class="transport-btn transport-btn--rewind"
                  @click="handleRewind"
                  :title="t('bgmStep.result.rewind')"
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

      <div class="result-actions">
        <!-- Regenerate Button with integrated history -->
        <div class="regen-card">
          <button
            class="history-inline history-inline--undo"
            :disabled="!canUndoBgm || isGenerating"
            @click="undoGeneration"
            :title="t('bgmStep.result.undo')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
            </svg>
          </button>
          <button
            class="regen-main"
            :disabled="isGenerating"
            @click="regenerate"
          >
            <svg class="regen-main__icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            <span>{{ t('bgmStep.result.regenerate') }}</span>
          </button>
          <button
            class="history-inline history-inline--redo"
            :disabled="!canRedoBgm || isGenerating"
            @click="redoGeneration"
            :title="t('bgmStep.result.redo')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.4 10.6C16.55 9 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
            </svg>
          </button>
        </div>

        <!-- Download Button -->
        <button class="action-btn action-btn--download" @click="downloadMidi">
          <svg class="action-btn__icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          <span>{{ t('bgmStep.result.download') }}</span>
        </button>

        <!-- Share Buttons -->
        <ShareButtons share-type="bgm" />
      </div>
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

/* Settings Summary (matches FinalStep) */
.settings-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  padding: 0.75rem 1rem;
  background: rgba(20, 20, 28, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 12px;
  margin-bottom: 1.25rem;
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
  background: rgba(139, 92, 246, 0.15);
  border-radius: 4px;
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
  z-index: 100;
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
}

/* Transport Bar - DAW-style unified control */
.transport-bar {
  display: flex;
  align-items: center;
  background: rgba(20, 20, 28, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
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
  background: rgba(139, 92, 246, 0.2);
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
  background: rgba(139, 92, 246, 0.15);
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
  background: rgba(139, 92, 246, 0.2);
  transform: scale(1.05);
}

.transport-btn--active {
  background: linear-gradient(135deg, var(--step-accent), #7C3AED);
  color: white;
  box-shadow: 0 0 16px rgba(139, 92, 246, 0.4);
}

.transport-btn--active:hover:not(:disabled) {
  background: linear-gradient(135deg, #9D6FFA, #8B5CF6);
}

.transport-btn--paused {
  background: rgba(236, 72, 153, 0.2);
}

.transport-btn--paused:hover:not(:disabled) {
  background: rgba(236, 72, 153, 0.3);
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
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  border-radius: 12px;
  box-shadow:
    0 4px 16px -4px rgba(245, 158, 11, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.regen-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px -4px rgba(245, 158, 11, 0.5),
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
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  box-shadow:
    0 4px 16px -4px rgba(139, 92, 246, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.action-btn--download:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px -4px rgba(139, 92, 246, 0.5),
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

@media (max-width: 640px) {
  .summary-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
