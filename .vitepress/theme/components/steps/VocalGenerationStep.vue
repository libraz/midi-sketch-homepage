<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import { useMidiPlayer, type PlayOptions } from '../../composables/useMidiPlayer'
import { useMidiRegeneration } from '../../composables/useMidiRegeneration'
import { useSeedHistory } from '../../composables/useSeedHistory'
import { useMidiGeneration } from '../../composables/useMidiGeneration'
import { songImages } from '../../data/songImages'
import { chordProgressions } from '../../data/chordColors'
import { KEY_NAMES } from '../../utils/midiUtils'
import { devLog } from '../../utils/devLog'
import { parseChordProgression, generateChordTimings, type ChordTiming } from '../../utils/chordUtils'
import GenerationPreview from '../wizard/GenerationPreview.vue'
import RegenerateCard from '../wizard/RegenerateCard.vue'
import SettingsSummary from '../wizard/SettingsSummary.vue'
import GenerationState from '../wizard/GenerationState.vue'
import StepHeader from '../wizard/StepHeader.vue'

const { t } = useI18n()
const store = useWizardStore()
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
  setTrackInstrument
} = player

const {
  error,
  justRegenerated,
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

// Play options for root note playback
const playOptions = computed((): PlayOptions => ({
  chordTimings: chordTimings.value,
  musicKey: store.config.key,
  playRootNotes: true  // Always enabled for vocal preview
}))

function handleSeek(tick: number) {
  stop()
  if (eventData.value) {
    play(eventData.value, tick, playOptions.value)
  }
}

function handleInstrumentChange(payload: { track: string; instrument: 'piano' | 'guitar' }) {
  setTrackInstrument(payload.track, payload.instrument)
  if (isPlaying.value && eventData.value) {
    const currentPos = currentTick.value
    stop()
    play(eventData.value, currentPos, playOptions.value)
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

// Generate chord timings for root note playback
const chordTimings = computed((): ChordTiming[] => {
  if (!chordProgressionDisplay.value || !eventData.value?.sections) return []

  const parsedChords = parseChordProgression(chordProgressionDisplay.value)
  if (parsedChords.length === 0) return []

  const sections = eventData.value.sections.map((s: any) => ({
    startTick: s.start_ticks ?? s.startTick,
    endTick: s.end_ticks ?? s.endTick,
    bars: s.bars,
    type: s.type
  }))

  return generateChordTimings({
    chords: parsedChords,
    sections,
    ppq: eventData.value.ppq || 480,
    barsPerChord: 1
  })
})

// Vocal style name for display
const vocalStyleName = computed(() => {
  const styles = [
    'auto', 'standard', 'vocaloid', 'ultraVocaloid', 'idol', 'ballad',
    'rock', 'cityPop', 'anime', 'brightKira', 'coolSynth', 'cuteAffected', 'powerfulShout'
  ]
  return styles[store.config.vocalStyle] || 'auto'
})

// Melody template name for display
const melodyTemplateName = computed(() => {
  const templates = [
    'auto', 'plateauTalk', 'runUpTarget', 'downResolve',
    'hookRepeat', 'sparseAnchor', 'callResponse', 'jumpAccent'
  ]
  return templates[store.config.melodyTemplate] || 'auto'
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
    label: t('vocalGenerationStep.summary.vocalStyle'),
    value: t(`melodyStep.advanced.vocalStyle.options.${vocalStyleName.value}`)
  },
  {
    label: t('vocalGenerationStep.summary.melodyTemplate'),
    value: t(`melodyStep.advanced.melodyTemplate.options.${melodyTemplateName.value}`)
  }
])

onMounted(async () => {
  if (typeof window === 'undefined') return

  try {
    preload()
    await midiGen.initialize()
    isLoading.value = false

    const initialSeed = store.config.vocalSeed || generateSeed()
    initVocalSeed(initialSeed)
    store.config.vocalSeed = initialSeed
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
    const seed = overrideSeed || store.config.vocalSeed || Math.floor(Math.random() * 0xFFFFFFFF)
    store.config.vocalSeed = seed

    // Validate config first (fixes vocalAttitude if not allowed for style)
    midiGen.validateConfigForStyle(store.config)

    // Build config for vocal generation (after validation)
    const vocalConfig = midiGen.buildVocalConfig(store.config, seed)
    devLog('Vocal generateVocal', vocalConfig)

    // Use the new generateVocal API
    instance.generateVocal(vocalConfig)
    eventData.value = midiGen.safeGetEvents(instance)

    isGenerated.value = true
    store.setVocalGenerated(true)
  } catch (e: any) {
    error.value = e.message
    devLog('Vocal Generate Error', e.message)
  }
}

async function regenerate() {
  await withPlaybackPreservation(async () => {
    const newSeed = pushVocalSeed()
    store.config.vocalSeed = newSeed
    await generate(newSeed)
  }, () => eventData.value, () => playOptions.value)
  showFeedback()
}

async function undoGeneration() {
  const seed = undoVocalSeed()
  if (seed === null) return

  await withPlaybackPreservation(async () => {
    store.config.vocalSeed = seed
    await generate(seed)
  }, () => eventData.value, () => playOptions.value)
}

async function redoGeneration() {
  const seed = redoVocalSeed()
  if (seed === null) return

  await withPlaybackPreservation(async () => {
    store.config.vocalSeed = seed
    await generate(seed)
  }, () => eventData.value, () => playOptions.value)
}

async function togglePlay() {
  if (!eventData.value) return
  await playerTogglePlay(eventData.value, playOptions.value)
}

function handleRewind() {
  rewind()
}
</script>

<template>
  <div class="vocal-generation-step">
    <!-- Header -->
    <StepHeader
      :title="t('vocalGenerationStep.title')"
      :subtitle="t('vocalGenerationStep.subtitle')"
    />

    <!-- Settings Summary -->
    <SettingsSummary :items="summaryItems" />

    <!-- Loading / Generating / Error State -->
    <GenerationState
      :is-loading="isLoading"
      :is-generating="isGenerating"
      :error="error"
      :loading-text="t('bgmStep.loading')"
      :generating-text="t('vocalGenerationStep.generating')"
    />

    <!-- Result Panel -->
    <div v-if="!isLoading && !isGenerating && !error && isGenerated" class="result-panel">
      <!-- Piano Roll with Player (shows vocal track only) -->
      <GenerationPreview
        v-if="eventData"
        :event-data="eventData"
        :current-tick="currentTick"
        :is-playing="isPlaying"
        :is-paused="isPaused"
        :is-soundfont-loading="isSoundfontLoading"
        :is-soundfont-ready="isSoundfontReady"
        :just-regenerated="justRegenerated"
        :title="t('vocalGenerationStep.preview')"
        :regenerated-text="t('vocalGenerationStep.regenerated')"
        :loading-audio-text="t('bgmStep.result.loadingAudio')"
        :rewind-title="t('bgmStep.result.rewind')"
        :chord-progression="chordProgressionDisplay"
        :music-key="store.config.key"
        :play-root-notes="true"
        @seek="handleSeek"
        @toggle-play="togglePlay"
        @rewind="handleRewind"
        @instrument-change="handleInstrumentChange"
      />

      <div class="result-actions">
        <!-- Regenerate Button with integrated history -->
        <RegenerateCard
          :can-undo="canUndoVocal"
          :can-redo="canRedoVocal"
          :is-generating="isGenerating"
          :label="t('vocalGenerationStep.regenerate')"
          :undo-title="t('bgmStep.result.undo')"
          :redo-title="t('bgmStep.result.redo')"
          color="pink"
          @regenerate="regenerate"
          @undo="undoGeneration"
          @redo="redoGeneration"
        />
      </div>

      <!-- Hint for next step -->
      <p class="next-hint">{{ t('vocalGenerationStep.nextHint') }}</p>
    </div>
  </div>
</template>

<style scoped>
.vocal-generation-step {
  --step-accent: #EC4899;
  --accent-rgb: 236, 72, 153;
  --accent-dark-rgb: 219, 39, 119;
  --accent-light-rgb: 244, 114, 182;
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

.next-hint {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: rgba(250, 250, 250, 0.5);
  text-align: center;
}
</style>
