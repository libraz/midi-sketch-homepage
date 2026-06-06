<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { useMidiPlayer } from '@/composables/useMidiPlayer'
import { useStudioGeneration } from '@/composables/useStudioGeneration'
import { blueprintIsRhythmSync, AUTO_BLUEPRINT_ID } from '@/data/blueprints'
import { getRecommendedBlueprintId } from '@/data/songImageBlueprint'
import GenerationPreview from '@/components/wizard/GenerationPreview.vue'
import RegenerateCard from '@/components/wizard/RegenerateCard.vue'
import GenerationState from '@/components/wizard/GenerationState.vue'

const { t } = useI18n()
const store = useWizardStore()
const studio = useStudioGeneration()

const {
  isPlaying,
  isPaused,
  isLoading: isSoundfontLoading,
  isReady: isSoundfontReady,
  currentTick,
  togglePlay: playerTogglePlay,
  rewind,
  stop,
  play,
  setTrackMuted
} = useMidiPlayer()

const eventData = studio.eventData

const isVocalFirst = computed(() => store.config.flowType === 'vocal-first')

const currentChord = computed(() =>
  store.getChordProgressionById(store.config.chordProgressionId)
)

const chordProgressionDisplay = computed(() => currentChord.value?.display || '')

// Loading text depends on the pipeline stage
const generatingText = computed(() => {
  switch (studio.status.value) {
    case 'generating-vocal':
      return t('studio.player.generatingVocal')
    case 'generating-accomp':
      return t('studio.player.generatingAccomp')
    default:
      return t('studio.player.initializing')
  }
})

// ============================================
// Keep Motif (RhythmSync only)
// ============================================
const effectiveBlueprintId = computed(() => {
  if (store.config.blueprintId === AUTO_BLUEPRINT_ID) {
    return getRecommendedBlueprintId(store.config.songImageId)
  }
  return store.config.blueprintId
})

const isRhythmSync = computed(() => blueprintIsRhythmSync(effectiveBlueprintId.value))

const keepMotifOnRegenerate = ref(false)

// ============================================
// Playback handlers
// ============================================

async function togglePlay() {
  if (!eventData.value) return
  await playerTogglePlay(eventData.value)
}

function handleSeek(tick: number) {
  stop()
  if (eventData.value) {
    play(eventData.value, tick)
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

function handleRewind() {
  rewind()
}

// ============================================
// Regeneration handlers
// ============================================

function shuffleVocal() {
  studio.shuffleVocal(keepMotifOnRegenerate.value && isRhythmSync.value)
}
</script>

<template>
  <div class="studio-player">
    <!-- Loading / Generating / Error State -->
    <GenerationState
      :is-loading="studio.status.value === 'init'"
      :is-generating="studio.status.value === 'generating-vocal' || studio.status.value === 'generating-accomp'"
      :error="studio.error.value"
      :loading-text="t('studio.player.initializing')"
      :generating-text="generatingText"
    />

    <!-- Preview Player -->
    <template v-if="studio.isReady.value && eventData">
      <!-- Stale indicator: settings changed since last generation -->
      <button
        v-if="studio.isStale.value"
        class="studio-player__stale-pill"
        @click="studio.applyChanges()"
      >
        <span class="studio-player__stale-dot"></span>
        <span>{{ t('studio.player.stale') }}</span>
        <span class="studio-player__stale-action">{{ t('studio.player.apply') }}</span>
      </button>

      <GenerationPreview
        :event-data="eventData"
        :current-tick="currentTick"
        :is-playing="isPlaying"
        :is-paused="isPaused"
        :is-soundfont-loading="isSoundfontLoading"
        :is-soundfont-ready="isSoundfontReady"
        :just-regenerated="studio.justRegenerated.value"
        :title="isVocalFirst ? t('finalStep.preview') : t('bgmGenerationStep.preview')"
        :regenerated-text="t('finalStep.regenerated')"
        :loading-audio-text="t('bgmStep.result.loadingAudio')"
        :rewind-title="t('finalStep.rewind')"
        :chord-progression="chordProgressionDisplay"
        :music-key="store.config.key"
        @seek="handleSeek"
        @toggle-play="togglePlay"
        @rewind="handleRewind"
        @track-mute-change="handleTrackMuteChange"
      />

      <!-- Edited indicator -->
      <div v-if="store.hasEditedVocalNotes()" class="studio-player__edited">
        <span>✎</span>
        <span>{{ t('vocalGenerationStep.edited') }}</span>
      </div>

      <div class="studio-player__actions">
        <!-- Keep Motif option (RhythmSync blueprints only) -->
        <label v-if="isVocalFirst && isRhythmSync" class="keep-motif-toggle">
          <input type="checkbox" v-model="keepMotifOnRegenerate" />
          <span class="keep-motif-toggle__box" aria-hidden="true"></span>
          <span class="keep-motif-toggle__text">
            <span class="keep-motif-toggle__label">{{ t('vocalGenerationStep.keepMotif.label') }}</span>
            <span class="keep-motif-toggle__desc">{{ t('vocalGenerationStep.keepMotif.description') }}</span>
          </span>
        </label>

        <!-- Vocal melody shuffle (vocal-first only) -->
        <RegenerateCard
          v-if="isVocalFirst"
          :can-undo="studio.canUndoVocal.value"
          :can-redo="studio.canRedoVocal.value"
          :is-generating="studio.isGenerating.value"
          :label="t('studio.player.regenerateMelody')"
          :undo-title="t('bgmStep.result.undo')"
          :redo-title="t('bgmStep.result.redo')"
          color="pink"
          @regenerate="shuffleVocal"
          @undo="studio.undoVocalSeed()"
          @redo="studio.redoVocalSeed()"
        />

        <!-- Accompaniment/BGM shuffle -->
        <RegenerateCard
          :can-undo="studio.canUndoBgm.value"
          :can-redo="studio.canRedoBgm.value"
          :is-generating="studio.isGenerating.value"
          :label="t('studio.player.regenerateBgm')"
          :undo-title="t('bgmStep.result.undo')"
          :redo-title="t('bgmStep.result.redo')"
          color="blue"
          @regenerate="studio.shuffleBgm()"
          @undo="studio.undoBgmSeed()"
          @redo="studio.redoBgmSeed()"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.studio-player {
  --accent-rgb: 139, 92, 246;
  text-align: center;
}

.studio-player__stale-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.45rem 0.9rem;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 100px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: #FBBF24;
  cursor: pointer;
  transition: all 0.2s ease;
}

.studio-player__stale-pill:hover {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.5);
}

.studio-player__stale-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #F59E0B;
  animation: stale-pulse 1.5s ease-in-out infinite;
}

@keyframes stale-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.studio-player__stale-action {
  padding-left: 0.5rem;
  border-left: 1px solid rgba(245, 158, 11, 0.3);
  color: #FDE68A;
}

.studio-player__edited {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.75rem;
  padding: 0.4rem 0.8rem;
  background: rgba(236, 72, 153, 0.1);
  border: 1px solid rgba(236, 72, 153, 0.2);
  border-radius: 100px;
  font-size: 0.8rem;
  color: #F472B6;
}

.studio-player__actions {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-top: 1.25rem;
}

/* Keep Motif toggle (RhythmSync only) */
.keep-motif-toggle {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  background: rgba(139, 92, 246, 0.06);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
}

.keep-motif-toggle input {
  display: none;
}

.keep-motif-toggle__box {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  border: 1.5px solid rgba(167, 139, 250, 0.6);
  border-radius: 5px;
  position: relative;
  transition: all 0.15s ease;
}

.keep-motif-toggle input:checked + .keep-motif-toggle__box {
  background: #8B5CF6;
  border-color: #8B5CF6;
}

.keep-motif-toggle input:checked + .keep-motif-toggle__box::after {
  content: '✓';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
}

.keep-motif-toggle__text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.keep-motif-toggle__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.85);
}

.keep-motif-toggle__desc {
  font-size: 0.7rem;
  color: rgba(250, 250, 250, 0.5);
}
</style>
