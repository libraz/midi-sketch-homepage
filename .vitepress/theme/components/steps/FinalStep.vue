<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import { useMidiPlayer } from '../../composables/useMidiPlayer'
import { useMidiRegeneration } from '../../composables/useMidiRegeneration'
import { useSeedHistory } from '../../composables/useSeedHistory'
import { useMidiGeneration } from '../../composables/useMidiGeneration'
import { chordProgressions } from '../../data/chordColors'
import { midiToNoteName } from '../../utils/midiUtils'
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
const player = useMidiPlayer()
const midiGen = useMidiGeneration()

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
  setTrackInstrument,
  setTrackMuted
} = player

const {
  error,
  justRegenerated,
  showFeedback,
  withPlaybackPreservation
} = useMidiRegeneration(player)

const isGenerating = midiGen.isGenerating

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

function handleTrackMuteChange(payload: { track: string; muted: boolean }) {
  setTrackMuted(payload.track, payload.muted)
  if (isPlaying.value && eventData.value) {
    const currentPos = currentTick.value
    stop()
    play(eventData.value, currentPos)
  }
}

const eventData = ref<any>(null)

// Chord progression for display
const currentChord = computed(() =>
  chordProgressions.find(c => c.id === store.config.chordProgressionId)
)
const chordProgressionDisplay = computed(() => currentChord.value?.display || '')

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

// Summary of vocal settings
const vocalSummary = computed(() => {
  const range = `${midiToNoteName(store.config.vocalLow)}–${midiToNoteName(store.config.vocalHigh)}`
  return range
})

const summaryItems = computed(() => [
  {
    label: t('finalStep.summary.vocalRange'),
    value: vocalSummary.value
  },
  {
    label: t('finalStep.summary.vocalStyle'),
    value: store.config.vocalStyle === 0
      ? t('finalStep.summary.auto')
      : t(`melodyStep.advanced.vocalStyle.options.${vocalStyleOptions[store.config.vocalStyle - 1]?.key || 'auto'}`)
  },
  {
    label: t('finalStep.summary.melodyTemplate'),
    value: t(`melodyStep.advanced.melodyTemplate.options.${melodyTemplateOptions[store.config.melodyTemplate]?.key || 'auto'}`)
  },
  {
    label: t('finalStep.summary.vocalGroove'),
    value: t(`melodyStep.advanced.vocalGroove.options.${vocalGrooveOptions[store.config.vocalGroove]?.key || 'straight'}`)
  }
])

onMounted(async () => {
  const instance = midiGen.getInstance()

  if (!instance) {
    error.value = t('finalStep.error.noInstance')
    return
  }

  await generateMelody()
})

// Internal generation function that accepts a seed
async function generateWithSeed(seed: number) {
  const instance = midiGen.getInstance()
  if (!instance) return

  const vocalParams = midiGen.buildVocalParams(store.config, seed)
  devLog('Vocal regenerateVocal', vocalParams)

  instance.regenerateVocal(vocalParams)
  eventData.value = midiGen.safeGetEvents(instance)
}

async function generateMelody() {
  const instance = midiGen.getInstance()
  if (!instance) return

  if (isPlaying.value) {
    stop()
  }

  error.value = null

  try {
    const initialSeed = generateSeed()
    initVocalSeed(initialSeed)
    await generateWithSeed(initialSeed)
  } catch (e: any) {
    error.value = e.message
    devLog('Vocal Generate Error', e.message)
  }
}

async function regenerateVocalTrack() {
  if (!midiGen.getInstance()) return

  await withPlaybackPreservation(async () => {
    const newSeed = pushVocalSeed()
    await generateWithSeed(newSeed)
  }, () => eventData.value)
  showFeedback()
}

async function undoVocalGeneration() {
  const seed = undoVocalSeed()
  if (seed === null || !midiGen.getInstance()) return

  await withPlaybackPreservation(async () => {
    await generateWithSeed(seed)
  }, () => eventData.value)
}

async function redoVocalGeneration() {
  const seed = redoVocalSeed()
  if (seed === null || !midiGen.getInstance()) return

  await withPlaybackPreservation(async () => {
    await generateWithSeed(seed)
  }, () => eventData.value)
}

function download() {
  try {
    midiGen.downloadMidi(`midi-sketch-${Date.now()}.mid`)
  } catch {
    // Download failed silently
  }
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
    <StepHeader :title="t('finalStep.title')" :subtitle="t('finalStep.subtitle')" />

    <!-- Loading / Generating / Error State -->
    <GenerationState
      :is-generating="isGenerating && !eventData"
      :error="error"
      :generating-text="t('finalStep.generating')"
    />

    <!-- Result -->
    <template v-if="eventData && !error">
      <!-- Settings Summary -->
      <SettingsSummary :items="summaryItems" />

      <!-- Piano Roll Preview -->
      <GenerationPreview
        :event-data="eventData"
        :current-tick="currentTick"
        :is-playing="isPlaying"
        :is-paused="isPaused"
        :is-soundfont-loading="isSoundfontLoading"
        :is-soundfont-ready="isSoundfontReady"
        :just-regenerated="justRegenerated"
        :title="t('finalStep.preview')"
        :regenerated-text="t('finalStep.regenerated')"
        :loading-audio-text="t('bgmStep.result.loadingAudio')"
        :rewind-title="t('finalStep.rewind')"
        :chord-progression="chordProgressionDisplay"
        :music-key="store.config.key"
        @seek="handleSeek"
        @toggle-play="togglePlay"
        @rewind="handleRewind"
        @instrument-change="handleInstrumentChange"
        @track-mute-change="handleTrackMuteChange"
      />

      <!-- Actions -->
      <div class="result-actions">
        <!-- Regenerate Button with integrated history -->
        <RegenerateCard
          :can-undo="canUndoVocal"
          :can-redo="canRedoVocal"
          :is-generating="isGenerating"
          :label="t('finalStep.regenerateVocal')"
          :undo-title="t('finalStep.undo')"
          :redo-title="t('finalStep.redo')"
          color="pink"
          @regenerate="regenerateVocalTrack"
          @undo="undoVocalGeneration"
          @redo="redoVocalGeneration"
        />

        <!-- Download Button -->
        <DownloadButton
          :label="t('finalStep.download')"
          color="green"
          @download="download"
        />

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
  --accent-rgb: 16, 185, 129;
  --accent-dark-rgb: 5, 150, 105;
  --accent-light-rgb: 52, 211, 153;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-top: 1.25rem;
}

.result-hint {
  margin-top: 1.5rem;
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.4);
  text-align: center;
}
</style>
