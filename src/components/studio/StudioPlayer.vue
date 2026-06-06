<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { useMidiPlayer } from '@/composables/useMidiPlayer'
import { useStudioGeneration } from '@/composables/useStudioGeneration'
import { blueprintIsRhythmSync, AUTO_BLUEPRINT_ID } from '@/data/blueprints'
import { getRecommendedBlueprintId } from '@/data/songImageBlueprint'
import { chordEventsToTimings, type ChordTiming } from '@/utils/chordUtils'
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

// Pre-computed chord timings from the WASM chord timeline (includes secondary
// dominants); the PianoRoll falls back to parsing the display string when empty.
const chordTimings = computed((): ChordTiming[] => {
  if (!eventData.value?.chords?.length) return []
  const ppq = eventData.value.ppq || eventData.value.division || 480
  return chordEventsToTimings(eventData.value.chords, ppq)
})

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

// Playback options derived from the current song image (drum kit etc.)
const playOptions = computed(() => ({
  drumKit: store.currentSongImage.value?.drumKit,
}))

async function togglePlay() {
  // While regenerating, the visible events are about to be replaced —
  // starting playback on them would desync from the regen restore logic.
  if (!eventData.value || studio.isGenerating.value) return
  await playerTogglePlay(eventData.value, playOptions.value)
}

function handleSeek(tick: number) {
  if (studio.isGenerating.value) return
  stop()
  if (eventData.value) {
    play(eventData.value, tick, playOptions.value)
  }
}

function handleTrackMuteChange(payload: { track: string; muted: boolean }) {
  setTrackMuted(payload.track, payload.muted)
  if (isPlaying.value && eventData.value) {
    const currentPos = currentTick.value
    stop()
    play(eventData.value, currentPos, playOptions.value)
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
    <!-- Loading / Generating / Error State.
         The generating spinner only shows for the initial generation; while a
         preview exists, regeneration happens in place so the player (scroll
         position, mixer state, playback) survives the update. -->
    <GenerationState
      :is-loading="studio.status.value === 'init'"
      :is-generating="studio.isGenerating.value && !eventData"
      :error="studio.error.value"
      :loading-text="t('studio.player.initializing')"
      :generating-text="generatingText"
    />

    <!-- Preview Player (kept mounted during regeneration) -->
    <template v-if="eventData">
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
        :disabled="studio.isGenerating.value"
        :just-regenerated="studio.justRegenerated.value"
        :title="isVocalFirst ? t('finalStep.preview') : t('bgmGenerationStep.preview')"
        :regenerated-text="t('finalStep.regenerated')"
        :loading-audio-text="t('bgmStep.result.loadingAudio')"
        :rewind-title="t('finalStep.rewind')"
        :chord-progression="chordProgressionDisplay"
        :music-key="store.config.key"
        :precomputed-chord-timings="chordTimings"
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
        <label
          v-if="isVocalFirst && isRhythmSync"
          class="keep-motif-toggle"
          :class="{ 'keep-motif-toggle--on': keepMotifOnRegenerate }"
        >
          <input type="checkbox" v-model="keepMotifOnRegenerate" />
          <span class="keep-motif-toggle__switch" aria-hidden="true"></span>
          <span class="keep-motif-toggle__text">
            <span class="keep-motif-toggle__label">{{ t('vocalGenerationStep.keepMotif.label') }}</span>
            <span class="keep-motif-toggle__desc">{{ t('vocalGenerationStep.keepMotif.description') }}</span>
          </span>
          <span class="keep-motif-toggle__state" aria-hidden="true">
            {{ keepMotifOnRegenerate ? 'ON' : 'OFF' }}
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
  --accent-rgb: var(--studio-purple-rgb);
  text-align: center;
}

.studio-player__stale-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.45rem 0.9rem;
  background: rgba(var(--studio-orange-rgb), 0.12);
  border: 1px solid rgba(var(--studio-orange-rgb), 0.35);
  border-radius: 100px;
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--studio-amber);
  cursor: pointer;
  transition: all 0.2s ease;
}

.studio-player__stale-pill:hover {
  background: rgba(var(--studio-orange-rgb), 0.2);
  border-color: rgba(var(--studio-orange-rgb), 0.5);
}

.studio-player__stale-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--studio-orange);
  animation: stale-pulse 1.5s ease-in-out infinite;
}

@keyframes stale-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.studio-player__stale-action {
  padding-left: 0.5rem;
  border-left: 1px solid rgba(var(--studio-orange-rgb), 0.3);
  color: var(--studio-amber);
}

.dark .studio-player__stale-action {
  color: #fde68a;
}

.studio-player__edited {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.75rem;
  padding: 0.4rem 0.8rem;
  background: rgba(var(--studio-pink-rgb), 0.1);
  border: 1px solid rgba(var(--studio-pink-rgb), 0.2);
  border-radius: 100px;
  font-size: 0.8rem;
  color: var(--studio-pink-soft);
}

.studio-player__actions {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-top: 1.25rem;
}

/* Keep Motif toggle (RhythmSync only).
   Styled as a hardware switch tied to the pink melody-regenerate action
   it modifies: pink track + glowing ON readout when engaged. */
.keep-motif-toggle {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: rgba(var(--studio-panel-rgb), 0.6);
  border: 1px solid rgba(var(--studio-ink-rgb), 0.1);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.25s ease;
}

.keep-motif-toggle:hover {
  border-color: rgba(var(--studio-pink-rgb), 0.35);
}

.keep-motif-toggle--on {
  background: rgba(var(--studio-pink-rgb), 0.06);
  border-color: rgba(var(--studio-pink-rgb), 0.4);
}

/* Visually hidden but still focusable for keyboard users */
.keep-motif-toggle input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

/* Switch track */
.keep-motif-toggle__switch {
  position: relative;
  flex-shrink: 0;
  width: 34px;
  height: 20px;
  border-radius: 100px;
  background: rgba(var(--studio-ink-rgb), 0.12);
  box-shadow: inset 0 1px 3px var(--studio-shadow-mid);
  transition: background 0.25s ease, box-shadow 0.25s ease;
}

/* Switch thumb */
.keep-motif-toggle__switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.keep-motif-toggle input:checked ~ .keep-motif-toggle__switch {
  background: linear-gradient(135deg, #ec4899, #db2777);
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.2),
    0 0 12px -2px rgba(var(--studio-pink-rgb), 0.5);
}

.keep-motif-toggle input:checked ~ .keep-motif-toggle__switch::after {
  transform: translateX(14px);
}

.keep-motif-toggle input:focus-visible ~ .keep-motif-toggle__switch {
  outline: 2px solid var(--studio-pink);
  outline-offset: 2px;
}

.keep-motif-toggle__text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  flex: 1;
}

.keep-motif-toggle__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(var(--studio-ink-rgb), 0.85);
}

.keep-motif-toggle__desc {
  font-size: 0.7rem;
  line-height: 1.4;
  color: rgba(var(--studio-ink-rgb), 0.5);
}

/* Hardware-style state readout */
.keep-motif-toggle__state {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  color: rgba(var(--studio-ink-rgb), 0.35);
  background: rgba(var(--studio-ink-rgb), 0.05);
  border: 1px solid rgba(var(--studio-ink-rgb), 0.08);
  transition: all 0.25s ease;
}

.keep-motif-toggle--on .keep-motif-toggle__state {
  color: var(--studio-pink);
  background: rgba(var(--studio-pink-rgb), 0.1);
  border-color: rgba(var(--studio-pink-rgb), 0.3);
  text-shadow: 0 0 8px rgba(var(--studio-pink-rgb), 0.4);
}
</style>
