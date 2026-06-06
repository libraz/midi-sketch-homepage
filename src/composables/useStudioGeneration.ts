import { ref, computed } from 'vue'
import { useWizardStore } from '@/stores/useWizardStore'
import { useMidiGeneration } from '@/composables/useMidiGeneration'
import { useMidiPlayer } from '@/composables/useMidiPlayer'
import { useMidiRegeneration } from '@/composables/useMidiRegeneration'
import { useSeedHistory } from '@/composables/useSeedHistory'
import { devLog } from '@/utils/devLog'

/**
 * Studio generation status.
 * idle → init → generating-vocal → generating-accomp → ready | error
 */
export type StudioStatus =
  | 'idle'
  | 'init'
  | 'generating-vocal'
  | 'generating-accomp'
  | 'ready'
  | 'error'

// ============================================
// Module-level singleton state
// ============================================

const _status = ref<StudioStatus>('idle')
const _eventData = ref<any>(null)
const _error = ref<string | null>(null)

// Generation token for stale-result handling: each generation request
// bumps the token; superseded requests are skipped and outdated results
// are discarded (last-write-wins).
let _genToken = 0
// Serialization queue: the WASM instance is not re-entrant, so generation
// runs are chained one after another.
let _queue: Promise<void> = Promise.resolve()

// Seed histories (vocal and accompaniment are independent)
const _vocalSeedHistory = useSeedHistory()
const _bgmSeedHistory = useSeedHistory()

// ============================================
// Composable
// ============================================

/**
 * Composable orchestrating the generate-first studio pipeline.
 * Wraps useMidiGeneration with status tracking, stale-result protection,
 * and the cheapest-path regeneration routing (vocal vs accompaniment).
 */
export function useStudioGeneration() {
  const store = useWizardStore()
  const midiGen = useMidiGeneration()
  const player = useMidiPlayer()
  const regen = useMidiRegeneration(player)

  const status = _status
  const eventData = _eventData
  const error = _error

  const isGenerating = computed(() =>
    _status.value === 'init' ||
    _status.value === 'generating-vocal' ||
    _status.value === 'generating-accomp'
  )

  const isReady = computed(() => _status.value === 'ready')

  /** Whether the current preview is stale (config changed since last generation). */
  const isStale = computed(() => {
    if (_status.value !== 'ready') return false
    if (store.config.flowType === 'vocal-first') {
      return !store.vocalGenerated.value || !store.bgmGenerated.value
    }
    return !store.bgmGenerated.value
  })

  // ============================================
  // Internal pipeline steps
  // ============================================

  function ensureSeeds() {
    if (!store.config.vocalSeed) {
      store.config.vocalSeed = _vocalSeedHistory.generateSeed()
    }
    if (!store.config.seed) {
      store.config.seed = _bgmSeedHistory.generateSeed()
    }
    _vocalSeedHistory.initWithSeed(store.config.vocalSeed)
    _bgmSeedHistory.initWithSeed(store.config.seed)
  }

  /**
   * Run the full vocal-first pipeline: vocal → (edited notes) → accompaniment.
   */
  async function runVocalFirstPipeline(keepMotif = false) {
    _status.value = 'generating-vocal'
    midiGen.validateConfigForStyle(store.config)

    const instance = await midiGen.initialize()
    const vocalSeed = store.config.vocalSeed

    if (keepMotif && store.vocalGenerated.value) {
      // RhythmSync: keep the existing motif as the rhythmic anchor,
      // only the vocal melody is rewritten
      const vocalParams = midiGen.buildVocalParams(store.config, vocalSeed, true)
      devLog('Studio regenerateVocal (keepMotif)', vocalParams)
      instance.regenerateVocal(vocalParams)
    } else {
      devLog('Studio generateVocal', { seed: vocalSeed })
      await midiGen.generateVocalOnly(store.config, vocalSeed)
    }
    store.setVocalGenerated(true)

    _status.value = 'generating-accomp'

    // Re-apply edited vocal notes before accompaniment (preserves edits)
    if (store.editedVocalNotes.value) {
      devLog('Studio setVocalNotes (edited)', { noteCount: store.editedVocalNotes.value.length })
      await midiGen.setVocalNotes(store.config, store.editedVocalNotes.value)
    }

    devLog('Studio generateAccompaniment', { seed: store.config.seed })
    await midiGen.generateAccompanimentTracks(store.config, store.config.seed)
    store.setBgmGenerated(true)
  }

  /**
   * Regenerate accompaniment only (vocal-first cheap path).
   * Keeps the vocal track (including user edits) intact.
   */
  async function runAccompanimentOnly() {
    _status.value = 'generating-accomp'

    // Re-apply edited vocal notes before accompaniment (preserves edits)
    if (store.editedVocalNotes.value) {
      devLog('Studio setVocalNotes (edited)', { noteCount: store.editedVocalNotes.value.length })
      await midiGen.setVocalNotes(store.config, store.editedVocalNotes.value)
    }

    devLog('Studio generateAccompaniment (only)', { seed: store.config.seed })
    await midiGen.generateAccompanimentTracks(store.config, store.config.seed)
    store.setBgmGenerated(true)
  }

  /**
   * Run the BGM-only pipeline (generateFromConfig).
   */
  async function runBgmOnlyPipeline() {
    _status.value = 'generating-accomp'
    devLog('Studio generateBgm (bgm-only)', { seed: store.config.seed })
    await midiGen.generateBgm(store.config, store.config.seed)
    store.setBgmGenerated(true)
  }

  /**
   * Execute a generation run with stale-result protection.
   * Runs are serialized (the WASM instance is not re-entrant); a request
   * superseded by a newer one before its turn is skipped entirely.
   */
  function runGuarded(fn: () => Promise<void>): Promise<void> {
    const token = ++_genToken

    const task = async () => {
      // Skip if a newer request arrived while waiting in the queue
      if (token !== _genToken) return

      _error.value = null
      try {
        await fn()
        if (token === _genToken) {
          _eventData.value = midiGen.safeGetEvents(midiGen.getInstance())
          _status.value = 'ready'
        }
      } catch (e: any) {
        if (token === _genToken) {
          _error.value = e.message
          _status.value = 'error'
        }
        devLog('Studio generation error', e.message)
      }
    }

    // Chain regardless of previous run's outcome
    _queue = _queue.then(task, task)
    return _queue
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Full generation from the entry screen (image picked → generate everything).
   */
  async function start(): Promise<void> {
    if (typeof window === 'undefined') return

    _status.value = 'init'
    _error.value = null
    _eventData.value = null

    await runGuarded(async () => {
      player.preload()
      await midiGen.initialize()
      ensureSeeds()

      if (store.config.flowType === 'vocal-first') {
        await runVocalFirstPipeline()
      } else {
        await runBgmOnlyPipeline()
      }
    })
  }

  /**
   * Regenerate only what the dirty flags say is needed.
   * vocal dirty → full pipeline; only accompaniment dirty → cheap path.
   */
  async function applyChanges(): Promise<void> {
    if (store.config.flowType === 'vocal-first') {
      if (!store.vocalGenerated.value) {
        await regenerateWithPlayback(() => runVocalFirstPipeline())
      } else if (!store.bgmGenerated.value) {
        await regenerateWithPlayback(() => runAccompanimentOnly())
      }
    } else if (!store.bgmGenerated.value) {
      await regenerateWithPlayback(() => runBgmOnlyPipeline())
    }
  }

  /** Wrap a pipeline run with playback position/state preservation. */
  async function regenerateWithPlayback(fn: () => Promise<void>): Promise<void> {
    await regen.withPlaybackPreservation(
      () => runGuarded(fn),
      () => _eventData.value
    )
    regen.showFeedback()
  }

  /**
   * Shuffle the vocal melody with a new seed (vocal-first only).
   * Accompaniment is regenerated afterwards to follow the new melody.
   */
  async function shuffleVocal(keepMotif = false): Promise<void> {
    store.config.vocalSeed = _vocalSeedHistory.pushSeed()
    await regenerateWithPlayback(() => runVocalFirstPipeline(keepMotif))
  }

  /**
   * Shuffle the accompaniment/BGM with a new seed.
   */
  async function shuffleBgm(): Promise<void> {
    store.config.seed = _bgmSeedHistory.pushSeed()
    if (store.config.flowType === 'vocal-first') {
      await regenerateWithPlayback(() => runAccompanimentOnly())
    } else {
      await regenerateWithPlayback(() => runBgmOnlyPipeline())
    }
  }

  async function undoVocalSeed(): Promise<void> {
    const seed = _vocalSeedHistory.undo()
    if (seed === null) return
    store.config.vocalSeed = seed
    await regenerateWithPlayback(() => runVocalFirstPipeline())
  }

  async function redoVocalSeed(): Promise<void> {
    const seed = _vocalSeedHistory.redo()
    if (seed === null) return
    store.config.vocalSeed = seed
    await regenerateWithPlayback(() => runVocalFirstPipeline())
  }

  async function undoBgmSeed(): Promise<void> {
    const seed = _bgmSeedHistory.undo()
    if (seed === null) return
    store.config.seed = seed
    if (store.config.flowType === 'vocal-first') {
      await regenerateWithPlayback(() => runAccompanimentOnly())
    } else {
      await regenerateWithPlayback(() => runBgmOnlyPipeline())
    }
  }

  async function redoBgmSeed(): Promise<void> {
    const seed = _bgmSeedHistory.redo()
    if (seed === null) return
    store.config.seed = seed
    if (store.config.flowType === 'vocal-first') {
      await regenerateWithPlayback(() => runAccompanimentOnly())
    } else {
      await regenerateWithPlayback(() => runBgmOnlyPipeline())
    }
  }

  /**
   * Reset studio state (returning to the entry screen).
   */
  function resetStudio(): void {
    _genToken++
    _status.value = 'idle'
    _eventData.value = null
    _error.value = null
    _vocalSeedHistory.clear()
    _bgmSeedHistory.clear()
  }

  return {
    // State
    status,
    eventData,
    error,
    isGenerating,
    isReady,
    isStale,
    justRegenerated: regen.justRegenerated,

    // Seed history
    canUndoVocal: _vocalSeedHistory.canUndo,
    canRedoVocal: _vocalSeedHistory.canRedo,
    canUndoBgm: _bgmSeedHistory.canUndo,
    canRedoBgm: _bgmSeedHistory.canRedo,

    // Actions
    start,
    applyChanges,
    shuffleVocal,
    shuffleBgm,
    undoVocalSeed,
    redoVocalSeed,
    undoBgmSeed,
    redoBgmSeed,
    resetStudio
  }
}
