import { ref, computed } from 'vue'

// ============================================
// Types
// ============================================

/**
 * Flow types for the wizard
 * - vocal-first: Vocal priority flow (Style → Chord → FlowSelection → VocalSettings → VocalGeneration → BgmSettings → BgmGeneration)
 * - bgm-only: BGM only flow (Style → Chord → FlowSelection → BgmSettings → BgmGeneration → Final)
 */
export type FlowType = 'vocal-first' | 'bgm-only'

/**
 * Step definition for wizard navigation
 */
export interface StepDefinition {
  id: string
  component: string
  label: string
  /** Steps that must be completed before this step */
  dependencies: string[]
  /** Config keys that affect this step's generation */
  affectingKeys: string[]
  /** Whether this step involves generation (vs just config) */
  hasGeneration: boolean
}

// ============================================
// Step Definitions
// ============================================

/**
 * All possible steps in the wizard
 */
export const STEP_DEFINITIONS: Record<string, StepDefinition> = {
  style: {
    id: 'style',
    component: 'StyleStep',
    label: 'wizard.steps.style',
    dependencies: [],
    affectingKeys: ['songImageId', 'stylePresetId'],
    hasGeneration: false
  },
  chord: {
    id: 'chord',
    component: 'ChordStep',
    label: 'wizard.steps.chords',
    dependencies: ['style'],
    affectingKeys: ['chordProgressionId'],
    hasGeneration: false
  },
  keyTempo: {
    id: 'keyTempo',
    component: 'KeyTempoStep',
    label: 'wizard.steps.keyTempo',
    dependencies: ['style', 'chord'],
    affectingKeys: ['key', 'bpm'],
    hasGeneration: false
  },
  flowSelection: {
    id: 'flowSelection',
    component: 'FlowSelectionStep',
    label: 'wizard.steps.flowSelection',
    dependencies: ['style', 'chord', 'keyTempo'],
    affectingKeys: ['flowType', 'compositionStyle'],
    hasGeneration: false
  },
  vocalSettings: {
    id: 'vocalSettings',
    component: 'VocalSettingsStep',
    label: 'wizard.steps.vocalSettings',
    dependencies: ['flowSelection'],
    affectingKeys: [
      'vocalLow', 'vocalHigh', 'vocalAttitude', 'vocalStyle',
      'melodyTemplate', 'vocalGroove', 'melodicComplexity', 'hookIntensity'
    ],
    hasGeneration: false
  },
  vocalGeneration: {
    id: 'vocalGeneration',
    component: 'VocalGenerationStep',
    label: 'wizard.steps.vocalGeneration',
    dependencies: ['vocalSettings'],
    affectingKeys: [],
    hasGeneration: true
  },
  bgmSettings: {
    id: 'bgmSettings',
    component: 'BgmSettingsStep',
    label: 'wizard.steps.bgmSettings',
    dependencies: ['flowSelection'],
    affectingKeys: [
      'key', 'bpm', 'formId', 'targetDurationSeconds',
      'drumsEnabled', 'arpeggioEnabled',
      'arpeggioPattern', 'arpeggioSpeed', 'arpeggioOctaveRange', 'arpeggioGate', 'arpeggioSyncChord',
      'chordExtSus', 'chordExt7th', 'chordExt9th',
      'chordExtSusProb', 'chordExt7thProb', 'chordExt9thProb',
      'modulationTiming', 'modulationSemitones',
      'callEnabled', 'callNotesEnabled', 'introChant', 'mixPattern', 'callDensity',
      'arrangementGrowth', 'motifRepeatScope', 'motifFixedProgression', 'motifMaxChordCount',
      'humanize', 'humanizeTiming', 'humanizeVelocity'
    ],
    hasGeneration: false
  },
  bgmGeneration: {
    id: 'bgmGeneration',
    component: 'BgmGenerationStep',
    label: 'wizard.steps.bgmGeneration',
    dependencies: ['bgmSettings'],
    affectingKeys: [],
    hasGeneration: true
  },
  final: {
    id: 'final',
    component: 'FinalStep',
    label: 'wizard.steps.complete',
    dependencies: ['bgmGeneration'],
    affectingKeys: [],
    hasGeneration: false
  },
  // Legacy steps for backward compatibility
  settings: {
    id: 'settings',
    component: 'SettingsStep',
    label: 'wizard.steps.keyTempo',
    dependencies: ['style', 'chord'],
    affectingKeys: [
      'key', 'bpm', 'formId', 'drumsEnabled', 'arpeggioEnabled',
      'arpeggioPattern', 'arpeggioSpeed', 'arpeggioOctaveRange', 'arpeggioGate',
      'chordExtSus', 'chordExt7th', 'chordExt9th',
      'compositionStyle', 'targetDurationSeconds',
      'modulationTiming', 'modulationSemitones',
      'callEnabled', 'callNotesEnabled', 'introChant', 'mixPattern', 'callDensity',
      'arrangementGrowth', 'humanize', 'humanizeTiming', 'humanizeVelocity'
    ],
    hasGeneration: false
  },
  bgm: {
    id: 'bgm',
    component: 'BgmStep',
    label: 'wizard.steps.bgm',
    dependencies: ['style', 'chord', 'settings'],
    affectingKeys: [],
    hasGeneration: true
  },
  melody: {
    id: 'melody',
    component: 'MelodyStep',
    label: 'wizard.steps.melody',
    dependencies: ['bgm'],
    affectingKeys: [
      'vocalLow', 'vocalHigh', 'vocalAttitude', 'vocalStyle',
      'melodyTemplate', 'vocalGroove', 'melodicComplexity', 'hookIntensity'
    ],
    hasGeneration: false
  }
}

// ============================================
// Flow Definitions
// ============================================

/**
 * Step order for each flow type
 */
export const FLOW_STEPS: Record<FlowType, string[]> = {
  'vocal-first': [
    'style',           // 1: Select song image/style
    'chord',           // 2: Select chord progression
    'keyTempo',        // 3: Select key and tempo
    'flowSelection',   // 4: Choose flow type (vocal-first selected)
    'vocalSettings',   // 5: Configure vocal parameters
    'vocalGeneration', // 6: Generate vocal track
    'bgmSettings',     // 7: Configure BGM parameters
    'bgmGeneration'    // 8: Generate accompaniment
  ],
  'bgm-only': [
    'style',           // 1: Select song image/style
    'chord',           // 2: Select chord progression
    'keyTempo',        // 3: Select key and tempo
    'flowSelection',   // 4: Choose flow type (bgm-only selected)
    'bgmSettings',     // 5: Configure BGM parameters (includes compositionStyle)
    'bgmGeneration'    // 6: Generate BGM (final step)
  ]
}

/**
 * Config keys that affect BGM generation for each flow
 */
export const BGM_AFFECTING_KEYS: Record<FlowType, string[]> = {
  'vocal-first': [
    // For vocal-first, BGM is generated after vocal
    'drumsEnabled', 'arpeggioEnabled', 'arpeggioPattern', 'arpeggioSpeed',
    'arpeggioOctaveRange', 'arpeggioGate', 'arpeggioSyncChord',
    'chordExtSus', 'chordExt7th', 'chordExt9th',
    'chordExtSusProb', 'chordExt7thProb', 'chordExt9thProb',
    'callEnabled', 'callNotesEnabled', 'introChant', 'mixPattern', 'callDensity',
    'humanize', 'humanizeTiming', 'humanizeVelocity'
  ],
  'bgm-only': [
    // For bgm-only, all BGM settings matter
    'songImageId', 'stylePresetId', 'chordProgressionId', 'key', 'bpm', 'formId',
    'drumsEnabled', 'arpeggioEnabled', 'arpeggioPattern', 'arpeggioSpeed',
    'arpeggioOctaveRange', 'arpeggioGate', 'arpeggioSyncChord',
    'chordExtSus', 'chordExt7th', 'chordExt9th',
    'chordExtSusProb', 'chordExt7thProb', 'chordExt9thProb',
    'compositionStyle', 'targetDurationSeconds',
    'modulationTiming', 'modulationSemitones',
    'callEnabled', 'callNotesEnabled', 'introChant', 'mixPattern', 'callDensity',
    'arrangementGrowth', 'motifRepeatScope', 'motifFixedProgression', 'motifMaxChordCount',
    'humanize', 'humanizeTiming', 'humanizeVelocity'
  ]
}

/**
 * Config keys that affect Vocal generation (only for vocal-first flow)
 */
export const VOCAL_AFFECTING_KEYS: Record<FlowType, string[]> = {
  'vocal-first': [
    'songImageId', 'stylePresetId', 'chordProgressionId', 'key', 'bpm', 'formId',
    'targetDurationSeconds',
    'vocalLow', 'vocalHigh', 'vocalAttitude', 'vocalStyle',
    'melodyTemplate', 'vocalGroove', 'melodicComplexity', 'hookIntensity'
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
 * Composable for managing wizard flow configuration.
 * Provides dynamic step definitions based on the selected flow type.
 */
export function useWizardFlow() {
  /**
   * Current flow type
   */
  const flowType = _flowType

  /**
   * Current steps based on flow type
   */
  const steps = computed(() => FLOW_STEPS[flowType.value])

  /**
   * Total number of steps
   */
  const totalSteps = computed(() => steps.value.length)

  /**
   * Get step definition by ID
   */
  function getStepDefinition(stepId: string): StepDefinition | undefined {
    return STEP_DEFINITIONS[stepId]
  }

  /**
   * Get step definition by index (1-based)
   */
  function getStepByIndex(index: number): StepDefinition | undefined {
    const stepId = steps.value[index - 1]
    return stepId ? STEP_DEFINITIONS[stepId] : undefined
  }

  /**
   * Get step index (1-based) by ID
   */
  function getStepIndex(stepId: string): number {
    const index = steps.value.indexOf(stepId)
    return index >= 0 ? index + 1 : -1
  }

  /**
   * Check if a step has generation
   */
  function stepHasGeneration(stepId: string): boolean {
    const step = STEP_DEFINITIONS[stepId]
    return step?.hasGeneration ?? false
  }

  /**
   * Get config keys that affect a step
   */
  function getAffectingKeys(stepId: string): string[] {
    const step = STEP_DEFINITIONS[stepId]
    return step?.affectingKeys ?? []
  }

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
    steps,
    totalSteps,
    isVocalFirst,
    isBgmOnly,

    // Step utilities
    getStepDefinition,
    getStepByIndex,
    getStepIndex,
    stepHasGeneration,
    getAffectingKeys,

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
