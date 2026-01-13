<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { useWizardFlow } from '@/composables/useWizardFlow'
import { useMidiPlayer } from '@/composables/useMidiPlayer'
import { useMidiRegeneration } from '@/composables/useMidiRegeneration'
import { useSeedHistory } from '@/composables/useSeedHistory'
import { useMidiGeneration } from '@/composables/useMidiGeneration'
import { useAudioExport } from '@/composables/useAudioExport'
import { songImages } from '@/data/songImages'
import { chordProgressions } from '@/data/chordColors'
import { KEY_NAMES, transposeProgressionToKey } from '@/utils/midiUtils'
import { devLog } from '@/utils/devLog'
import GenerationPreview from '@/components/wizard/GenerationPreview.vue'
import RegenerateCard from '@/components/wizard/RegenerateCard.vue'
import DownloadButton from '@/components/wizard/DownloadButton.vue'
import GenerationState from '@/components/wizard/GenerationState.vue'
import SettingsSummary from '@/components/wizard/SettingsSummary.vue'
import StepHeader from '@/components/wizard/StepHeader.vue'
import ShareButtons from '@/components/ShareButtons.vue'

const { t } = useI18n()
const store = useWizardStore()
const { isVocalFirst, isBgmOnly } = useWizardFlow()
const player = useMidiPlayer()
const midiGen = useMidiGeneration()
const audioExport = useAudioExport()

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
  setTrackInstrument,
  setTrackMuted
} = player

const {
  error,
  justRegenerated,
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
  if (isPlaying.value && eventData.value) {
    const currentPos = currentTick.value
    stop()
    play(eventData.value, currentPos)
  }
}

function handleTrackMuteChange(payload: { track: string; muted: boolean }) {
  setTrackMuted(payload.track, payload.muted)
  if (isPlaying.value && eventData.value) {
    const currentPos = currentTick.value
    stop()
    play(eventData.value, currentPos)
  }
}

const isLoading = ref(true)
const isGenerated = ref(false)
const eventData = ref<any>(null)
const isGenerating = midiGen.isGenerating

// Expose instance for next steps
defineExpose({ getInstance: () => midiGen.getInstance() })

const currentSongImage = computed(() =>
  songImages.find(s => s.id === store.config.songImageId)
)

const currentChord = computed(() =>
  chordProgressions.find(c => c.id === store.config.chordProgressionId)
)

// Chord progression display string for PianoRoll
const chordProgressionDisplay = computed(() => currentChord.value?.display || '')

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

const summaryItems = computed(() => [
  {
    label: t('bgmStep.summary.style'),
    value: currentSongImage.value ? t(`songImages.${currentSongImage.value.id}.name`) : '-'
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
    label: t('bgmStep.summary.chordProgression'),
    value: currentChord.value?.name || '-'
  },
  {
    label: 'Chords',
    value: currentChord.value ? transposeProgressionToKey(currentChord.value.display, store.config.key) : '-'
  },
  {
    label: t('bgmStep.summary.options'),
    value: advancedSummary.value
  }
])

onMounted(async () => {
  if (typeof window === 'undefined') return

  try {
    preload()
    await midiGen.initialize()
    isLoading.value = false

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
  const instance = midiGen.getInstance()
  if (!instance) return

  error.value = null

  try {
    const seed = overrideSeed || store.config.seed || Math.floor(Math.random() * 0xFFFFFFFF)
    store.config.seed = seed

    if (isVocalFirst.value) {
      // Vocal-first flow: use generateAccompaniment API
      // Check if user has edited vocal notes
      if (store.editedVocalNotes.value) {
        devLog('BGM setVocalNotes (edited)', { noteCount: store.editedVocalNotes.value.length })
        await midiGen.setVocalNotes(store.config, store.editedVocalNotes.value)
      }

      devLog('BGM generateAccompaniment (vocal-first)', { seed })
      eventData.value = await midiGen.generateAccompanimentTracks(store.config, seed)
    } else {
      // BGM-only flow: use generateFromConfig with skipVocal=true or compositionStyle
      const bgmConfig = midiGen.buildBgmConfig(store.config, seed)
      devLog('BGM generateFromConfig (bgm-only)', bgmConfig)

      midiGen.validateConfigForStyle(store.config)
      instance.generateFromConfig(bgmConfig)
      eventData.value = midiGen.safeGetEvents(instance)
    }

    isGenerated.value = true
    store.setBgmGenerated(true)
  } catch (e: any) {
    error.value = e.message
    devLog('BGM Generate Error', e.message)
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
  try {
    midiGen.downloadMidi(`midi-sketch-${Date.now()}.mid`)
  } catch {
    // Download failed silently
  }
}

async function downloadMp3() {
  if (!eventData.value) return

  // Stop playback during export
  if (isPlaying.value) {
    stop()
  }

  try {
    await audioExport.exportToMp3(
      eventData.value,
      `midi-sketch-${Date.now()}.mp3`,
      { mutedTracks: { SE: true } }
    )
  } catch (e: any) {
    devLog('MP3 Export Error', e.message)
  }
}
</script>

<template>
  <div class="bgm-generation-step">
    <!-- Header -->
    <StepHeader
      :title="isVocalFirst ? t('finalStep.title') : t('bgmGenerationStep.title')"
      :subtitle="isVocalFirst ? t('finalStep.subtitle') : t('bgmGenerationStep.subtitle')"
    />

    <!-- Settings Summary -->
    <SettingsSummary :items="summaryItems" />

    <!-- Loading / Generating / Error State -->
    <GenerationState
      :is-loading="isLoading"
      :is-generating="isGenerating"
      :error="error"
      :loading-text="t('bgmStep.loading')"
      :generating-text="isVocalFirst ? t('finalStep.generating') : t('bgmGenerationStep.generating')"
    />

    <!-- Result Panel -->
    <div v-if="!isLoading && !isGenerating && !error && isGenerated" class="result-panel">
      <!-- Piano Roll with Player -->
      <GenerationPreview
        v-if="eventData"
        :event-data="eventData"
        :current-tick="currentTick"
        :is-playing="isPlaying"
        :is-paused="isPaused"
        :is-soundfont-loading="isSoundfontLoading"
        :is-soundfont-ready="isSoundfontReady"
        :just-regenerated="justRegenerated"
        :title="isVocalFirst ? t('finalStep.preview') : t('bgmGenerationStep.preview')"
        :regenerated-text="isVocalFirst ? t('finalStep.regenerated') : t('bgmGenerationStep.regenerated')"
        :loading-audio-text="t('bgmStep.result.loadingAudio')"
        :rewind-title="isVocalFirst ? t('finalStep.rewind') : t('bgmStep.result.rewind')"
        :chord-progression="chordProgressionDisplay"
        :music-key="store.config.key"
        @seek="handleSeek"
        @toggle-play="togglePlay"
        @rewind="handleRewind"
        @instrument-change="handleInstrumentChange"
        @track-mute-change="handleTrackMuteChange"
      />

      <div class="result-actions">
        <!-- Regenerate Button with integrated history -->
        <RegenerateCard
          :can-undo="canUndoBgm"
          :can-redo="canRedoBgm"
          :is-generating="isGenerating"
          :label="isVocalFirst ? t('finalStep.regenerateBgm') : t('bgmGenerationStep.regenerate')"
          :undo-title="isVocalFirst ? t('finalStep.undo') : t('bgmStep.result.undo')"
          :redo-title="isVocalFirst ? t('finalStep.redo') : t('bgmStep.result.redo')"
          color="blue"
          @regenerate="regenerate"
          @undo="undoGeneration"
          @redo="redoGeneration"
        />

        <!-- Download Button -->
        <DownloadButton
          :label="isVocalFirst ? t('finalStep.download') : t('bgmGenerationStep.download')"
          color="green"
          @download="downloadMidi"
        />

        <!-- Share Buttons -->
        <ShareButtons :share-type="isVocalFirst ? 'vocal' : 'bgm'" />
      </div>

      <!-- Hint -->
      <p class="result-hint">{{ isVocalFirst ? t('finalStep.hint') : t('bgmGenerationStep.hint') }}</p>

      <!-- Beta Features Section -->
      <details class="beta-section">
        <summary class="beta-section__header">
          <span class="beta-section__title">
            <span class="beta-badge">{{ t('beta.badge') }}</span>
            {{ t('beta.title') }}
          </span>
          <svg class="beta-section__chevron" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.47 5.47a.75.75 0 0 1 1.06 0L8 7.94l2.47-2.47a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 0-1.06z"/>
          </svg>
        </summary>
        <div class="beta-section__content">
          <p class="beta-section__description">{{ t('beta.description') }}</p>
          <button
            class="beta-button"
            :class="{ 'beta-button--loading': audioExport.isExporting.value }"
            :disabled="audioExport.isExporting.value"
            @click="downloadMp3"
          >
            <svg
              v-if="audioExport.isExporting.value"
              class="beta-button__spinner"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-dasharray="50 20"
              />
            </svg>
            <svg
              v-else
              class="beta-button__icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            <span>
              {{ audioExport.isExporting.value
                ? t(`finalStep.exportStatus.${audioExport.exportStatus.value}`)
                : t('finalStep.downloadMp3')
              }}
            </span>
            <span class="beta-badge beta-badge--small">{{ t('beta.badge') }}</span>
          </button>
        </div>
      </details>
    </div>
  </div>
</template>

<style scoped>
.bgm-generation-step {
  --step-accent: #60A5FA;
  --accent-rgb: 96, 165, 250;
  --accent-dark-rgb: 59, 130, 246;
  --accent-light-rgb: 147, 197, 253;
}

.result-panel {
  text-align: center;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-top: 1.25rem;
}

.result-hint {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: rgba(250, 250, 250, 0.5);
  text-align: center;
}

/* Beta Section Styles */
.beta-section {
  margin-top: 1.5rem;
  border: 1px dashed rgba(250, 250, 250, 0.15);
  border-radius: 8px;
  overflow: hidden;
}

.beta-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  background: rgba(250, 250, 250, 0.02);
  transition: background 0.2s ease;
  list-style: none;
}

.beta-section__header::-webkit-details-marker {
  display: none;
}

.beta-section__header:hover {
  background: rgba(250, 250, 250, 0.04);
}

.beta-section__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.5);
}

.beta-section__chevron {
  color: rgba(250, 250, 250, 0.3);
  transition: transform 0.2s ease;
}

.beta-section[open] .beta-section__chevron {
  transform: rotate(180deg);
}

.beta-section__content {
  padding: 0.75rem 1rem 1rem;
  border-top: 1px dashed rgba(250, 250, 250, 0.1);
}

.beta-section__description {
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.4);
  margin: 0 0 0.75rem 0;
}

.beta-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.4rem;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #F59E0B;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 4px;
}

.beta-badge--small {
  padding: 0.1rem 0.3rem;
  font-size: 0.55rem;
}

.beta-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: transparent;
  border: 1px solid rgba(250, 250, 250, 0.15);
  border-radius: 6px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.beta-button:hover:not(:disabled) {
  background: rgba(250, 250, 250, 0.05);
  border-color: rgba(250, 250, 250, 0.25);
  color: rgba(250, 250, 250, 0.8);
}

.beta-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.beta-button--loading {
  color: rgba(99, 102, 241, 0.8);
  border-color: rgba(99, 102, 241, 0.3);
}

.beta-button__icon {
  opacity: 0.7;
}

.beta-button__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
