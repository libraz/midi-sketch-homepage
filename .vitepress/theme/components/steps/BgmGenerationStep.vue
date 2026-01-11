<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import { useWizardFlow } from '../../composables/useWizardFlow'
import { useMidiPlayer } from '../../composables/useMidiPlayer'
import { useMidiRegeneration } from '../../composables/useMidiRegeneration'
import { useSeedHistory } from '../../composables/useSeedHistory'
import { useMidiGeneration } from '../../composables/useMidiGeneration'
import { songImages } from '../../data/songImages'
import { chordProgressions } from '../../data/chordColors'
import { KEY_NAMES } from '../../utils/midiUtils'
import { devLog } from '../../utils/devLog'
import GenerationPreview from '../wizard/GenerationPreview.vue'
import RegenerateCard from '../wizard/RegenerateCard.vue'
import DownloadButton from '../wizard/DownloadButton.vue'
import GenerationState from '../wizard/GenerationState.vue'
import SettingsSummary from '../wizard/SettingsSummary.vue'
import StepHeader from '../wizard/StepHeader.vue'
import ShareButtons from '../ShareButtons.vue'

const { t } = useI18n()
const store = useWizardStore()
const { isVocalFirst, isBgmOnly } = useWizardFlow()
const player = useMidiPlayer()
const midiGen = useMidiGeneration()

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
      // Vocal should already be generated at this point
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
</style>
