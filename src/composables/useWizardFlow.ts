import { ref, computed } from 'vue'

// ============================================
// Types
// ============================================

/**
 * Flow types for generation
 * - vocal-first: Vocal melody is generated first, then the accompaniment follows it
 * - bgm-only: Instrumental BGM is generated in a single pass
 */
export type FlowType = 'vocal-first' | 'bgm-only'

/**
 * Config keys that affect BGM generation for each flow
 */
export const BGM_AFFECTING_KEYS: Record<FlowType, string[]> = {
  'vocal-first': [
    // For vocal-first, BGM is generated after vocal.
    // Only keys present in AccompanimentConfig belong here.
    'drumsEnabled', 'guitarEnabled', 'arpeggioEnabled', 'arpeggioPattern', 'arpeggioSpeed',
    'arpeggioOctaveRange', 'arpeggioGate', 'arpeggioSyncChord',
    'chordExtSus', 'chordExt7th', 'chordExt9th', 'chordExtTritoneSub',
    'chordExtSusProb', 'chordExt7thProb', 'chordExt9thProb', 'chordExtTritoneSubProb',
    'seEnabled', 'callEnabled', 'callNotesEnabled', 'introChant', 'mixPattern', 'callDensity',
    'humanize', 'humanizeTiming', 'humanizeVelocity'
  ],
  'bgm-only': [
    // For bgm-only, all BGM settings matter
    'songImageId', 'stylePresetId', 'chordProgressionId', 'key', 'bpm', 'formId',
    'blueprintId',
    'drumsEnabled', 'guitarEnabled', 'arpeggioEnabled', 'arpeggioPattern', 'arpeggioSpeed',
    'arpeggioOctaveRange', 'arpeggioGate', 'arpeggioSyncChord',
    'chordExtSus', 'chordExt7th', 'chordExt9th', 'chordExtTritoneSub',
    'chordExtSusProb', 'chordExt7thProb', 'chordExt9thProb', 'chordExtTritoneSubProb',
    'compositionStyle', 'targetDurationSeconds',
    'modulationTiming', 'modulationSemitones',
    'seEnabled', 'callEnabled', 'callNotesEnabled', 'introChant', 'mixPattern', 'callDensity',
    'arrangementGrowth', 'motifRepeatScope', 'motifFixedProgression', 'motifMaxChordCount',
    'motifLength', 'motifNoteCount', 'motifMotion', 'motifRegisterHigh', 'motifRhythmDensity',
    'energyCurve', 'enableSyncopation', 'driveFeel', 'moraRhythmMode',
    'vocalStyle', 'vocalGroove',
    'melodyMaxLeap', 'melodySyncopationProb', 'melodyPhraseLength',
    'melodyLongNoteRatio', 'melodyChorusRegisterShift',
    'melodyHookRepetition', 'melodyUseLeadingTone',
    'humanize', 'humanizeTiming', 'humanizeVelocity'
  ]
}

/**
 * Config keys that affect Vocal generation (only for vocal-first flow)
 */
export const VOCAL_AFFECTING_KEYS: Record<FlowType, string[]> = {
  'vocal-first': [
    'songImageId', 'stylePresetId', 'chordProgressionId', 'key', 'bpm', 'formId',
    'targetDurationSeconds', 'blueprintId',
    'modulationTiming', 'modulationSemitones', 'energyCurve',
    'vocalLow', 'vocalHigh', 'vocalAttitude', 'vocalStyle',
    'melodyTemplate', 'vocalGroove', 'melodicComplexity', 'hookIntensity',
    'enableSyncopation', 'driveFeel', 'moraRhythmMode',
    'melodyMaxLeap', 'melodySyncopationProb', 'melodyPhraseLength',
    'melodyLongNoteRatio', 'melodyChorusRegisterShift',
    'melodyHookRepetition', 'melodyUseLeadingTone'
  ],
  'bgm-only': [] // No vocal in bgm-only flow
}

// ============================================
// Module-level state (singleton)
// ============================================

const _flowType = ref<FlowType>('vocal-first')

// ============================================
// Composable
// ============================================

/**
 * Composable for the generation flow type and its invalidation rules.
 * Determines which generation pass (vocal / bgm) a config key change affects.
 */
export function useWizardFlow() {
  /**
   * Current flow type
   */
  const flowType = _flowType

  /**
   * Get BGM affecting keys for current flow
   */
  const bgmAffectingKeys = computed(() => BGM_AFFECTING_KEYS[flowType.value])

  /**
   * Get Vocal affecting keys for current flow
   */
  const vocalAffectingKeys = computed(() => VOCAL_AFFECTING_KEYS[flowType.value])

  /**
   * Set flow type
   */
  function setFlowType(type: FlowType): void {
    _flowType.value = type
  }

  /**
   * Check if a config key affects BGM generation
   */
  function affectsBgm(key: string): boolean {
    return bgmAffectingKeys.value.includes(key)
  }

  /**
   * Check if a config key affects Vocal generation
   */
  function affectsVocal(key: string): boolean {
    return vocalAffectingKeys.value.includes(key)
  }

  /**
   * Get the generation step that would be affected by a config key change
   * Returns 'bgm', 'vocal', or null
   */
  function getAffectedGenerationStep(key: string): 'bgm' | 'vocal' | null {
    // In vocal-first flow, vocal-affecting keys affect vocal step
    if (flowType.value === 'vocal-first' && affectsVocal(key)) return 'vocal'
    if (affectsBgm(key)) return 'bgm'
    return null
  }

  /**
   * Check if current flow is vocal-first
   */
  const isVocalFirst = computed(() => flowType.value === 'vocal-first')

  /**
   * Check if current flow is bgm-only
   */
  const isBgmOnly = computed(() => flowType.value === 'bgm-only')

  return {
    // State
    flowType,
    isVocalFirst,
    isBgmOnly,

    // Config key utilities
    bgmAffectingKeys,
    vocalAffectingKeys,
    affectsBgm,
    affectsVocal,
    getAffectedGenerationStep,

    // Actions
    setFlowType
  }
}
