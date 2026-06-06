import { ref, computed, reactive, watch } from 'vue'
import { songImages } from '@/data/songImages'
import { useWizardFlow, STEP_DEFINITIONS, type FlowType } from '@/composables/useWizardFlow'
import { getRecommendedBlueprintId } from '@/data/songImageBlueprint'
import type { PlacedNote } from '@/components/PianoRollEditor/types'

// Chord progression type from WASM
export interface ChordProgression {
  id: number
  name: string
  display: string
}

// ============================================
// Flow Type Definitions
// ============================================
export type { FlowType }

export interface WizardConfig {
  // Flow selection
  flowType: FlowType

  // Style & Chord
  songImageId: string
  stylePresetId: number
  chordProgressionId: number
  activeCategory: string

  // Key & Tempo
  key: number
  bpm: number
  formId: number
  targetDurationSeconds: number

  // Seeds
  seed: number       // BGM seed
  vocalSeed: number  // Vocal seed (for vocal-first flow)

  // Vocal settings
  vocalLow: number
  vocalHigh: number
  vocalAttitude: number
  vocalStyle: number
  melodyTemplate: number
  vocalGroove: number
  melodicComplexity: number
  hookIntensity: number

  // BGM settings
  drumsEnabled: boolean
  arpeggioEnabled: boolean
  arpeggioPattern: number
  arpeggioSpeed: number
  arpeggioOctaveRange: number
  arpeggioGate: number
  arpeggioSyncChord: boolean

  // Chord extensions (probabilities are 0-100 integers; converted per API in builders)
  chordExtSus: boolean
  chordExt7th: boolean
  chordExt9th: boolean
  chordExtTritoneSub: boolean
  chordExtSusProb: number
  chordExt7thProb: number
  chordExt9thProb: number
  chordExtTritoneSubProb: number

  // Composition style (for BGM-only flow)
  compositionStyle: number

  // Modulation
  modulationTiming: number
  modulationSemitones: number

  // SE/Call settings
  seEnabled: boolean
  callEnabled: boolean
  callNotesEnabled: boolean
  introChant: number
  mixPattern: number
  callDensity: number

  // Arrangement
  arrangementGrowth: number

  // Motif settings (for BackgroundMotif style)
  motifRepeatScope: number
  motifFixedProgression: boolean
  motifMaxChordCount: number

  // Guitar
  guitarEnabled: boolean

  // Syncopation
  enableSyncopation: boolean

  // Energy & Drive
  energyCurve: number
  driveFeel: number

  // Mora rhythm
  moraRhythmMode: number

  // Melody overrides
  melodyMaxLeap: number
  melodySyncopationProb: number
  melodyPhraseLength: number
  melodyLongNoteRatio: number
  melodyChorusRegisterShift: number
  melodyHookRepetition: number
  melodyUseLeadingTone: number

  // Motif overrides
  motifLength: number
  motifNoteCount: number
  motifMotion: number
  motifRegisterHigh: number
  motifRhythmDensity: number

  // Humanize
  humanize: boolean
  humanizeTiming: number
  humanizeVelocity: number

  // Explicit flags
  chordExtProbExplicit: boolean
  drumsEnabledExplicit: boolean
  formExplicit: boolean

  // Production Blueprint
  blueprintId: number

  // Legacy
  timbreId: string
}

// ============================================
// Default Configuration
// ============================================
const DEFAULT_CONFIG: WizardConfig = {
  // Flow
  flowType: 'vocal-first',

  // Style & Chord
  songImageId: 'idol-classic',
  stylePresetId: 3,
  chordProgressionId: 0,
  activeCategory: 'idol',

  // Key & Tempo
  key: 0,
  bpm: 132,
  formId: 5,
  targetDurationSeconds: 150,

  // Seeds
  seed: 0,
  vocalSeed: 0,

  // Vocal settings
  vocalLow: 57,
  vocalHigh: 79,
  vocalAttitude: 0,
  vocalStyle: 0,
  melodyTemplate: 0,
  vocalGroove: 0,
  melodicComplexity: 1,
  hookIntensity: 2,

  // BGM settings
  drumsEnabled: true,
  arpeggioEnabled: false,
  arpeggioPattern: 0,
  arpeggioSpeed: 1,
  arpeggioOctaveRange: 2,
  arpeggioGate: 80,
  arpeggioSyncChord: true,

  // Chord extensions
  chordExtSus: false,
  chordExt7th: false,
  chordExt9th: false,
  chordExtTritoneSub: false,
  chordExtSusProb: 20,
  chordExt7thProb: 15,
  chordExt9thProb: 25,
  chordExtTritoneSubProb: 50,

  // Composition style
  compositionStyle: 0,

  // Modulation
  modulationTiming: 0,
  modulationSemitones: 2,

  // SE/Call
  seEnabled: true,
  callEnabled: false,
  callNotesEnabled: true,
  introChant: 0,
  mixPattern: 0,
  callDensity: 2,

  // Arrangement
  arrangementGrowth: 0,

  // Motif
  motifRepeatScope: 0,
  motifFixedProgression: true,
  motifMaxChordCount: 4,

  // Guitar
  guitarEnabled: false,

  // Syncopation
  enableSyncopation: false,

  // Energy & Drive
  energyCurve: 0,
  driveFeel: 50,

  // Mora rhythm
  moraRhythmMode: 2,

  // Melody overrides (sentinel values = use preset)
  melodyMaxLeap: 0,
  melodySyncopationProb: 255,
  melodyPhraseLength: 0,
  melodyLongNoteRatio: 255,
  melodyChorusRegisterShift: -128,
  melodyHookRepetition: 0,
  melodyUseLeadingTone: 0,

  // Motif overrides (sentinel values = auto/preset)
  motifLength: 0,
  motifNoteCount: 0,
  motifMotion: 255,
  motifRegisterHigh: 0,
  motifRhythmDensity: 255,

  // Humanize
  humanize: false,
  humanizeTiming: 40,
  humanizeVelocity: 30,

  // Explicit flags
  chordExtProbExplicit: false,
  drumsEnabledExplicit: false,
  formExplicit: false,

  // Production Blueprint (default matches initial songImageId 'idol-classic' → 4)
  blueprintId: 4,

  // Legacy
  timbreId: 'pop_clean'
}

// ============================================
// State
// ============================================
const currentStep = ref(1)
const bgmGenerated = ref(false)
const vocalGenerated = ref(false)
const bgmVersion = ref(0)
const vocalVersion = ref(0)
const libVersion = ref<string | null>(null)

// Chord progressions loaded from WASM
const chordProgressions = ref<ChordProgression[]>([])

const config = reactive<WizardConfig>({ ...DEFAULT_CONFIG })

// Edited vocal notes (null = not edited, use generated)
const editedVocalNotes = ref<PlacedNote[] | null>(null)

// ============================================
// Flow Management
// ============================================
const wizardFlow = useWizardFlow()

// Sync flow type between config and useWizardFlow
watch(() => config.flowType, (newType) => {
  wizardFlow.setFlowType(newType)
})

// ============================================
// Step Invalidation
// ============================================

/**
 * Invalidate vocal generation
 */
function invalidateVocal() {
  vocalGenerated.value = false
  vocalVersion.value++
  // Clear edited vocal notes when regenerating
  editedVocalNotes.value = null
  // Vocal invalidation also invalidates BGM in vocal-first flow
  if (config.flowType === 'vocal-first') {
    invalidateBgm()
  }
}

/**
 * Invalidate BGM generation
 */
function invalidateBgm() {
  bgmGenerated.value = false
  bgmVersion.value++
  // Clear the shared instance reference
  if (typeof window !== 'undefined') {
    ;(window as any).__midiSketchInstance = null
  }
}

/**
 * Get step IDs that should be reset when navigating back.
 * Returns all steps after the target step (up to and including fromStep).
 * @param targetStep - Destination step (1-based)
 * @param fromStep - Current step (1-based)
 */
function getStepsToReset(targetStep: number, fromStep: number): string[] {
  // Only reset when going back
  if (targetStep >= fromStep) return []

  const stepsToReset: string[] = []
  // From targetStep+1 to fromStep (excluding targetStep itself)
  for (let i = targetStep + 1; i <= fromStep; i++) {
    const stepDef = wizardFlow.getStepByIndex(i)
    if (stepDef) {
      stepsToReset.push(stepDef.id)
    }
  }
  return stepsToReset
}

/**
 * Reset config values for specified steps to defaults
 * @param stepIds - Step IDs to reset
 * @param targetStepId - Target step ID (its keys should NOT be reset)
 */
function resetStepConfigs(stepIds: string[], targetStepId?: string): void {
  const keysToReset = new Set<keyof WizardConfig>()

  // Get keys that should be preserved (from target step)
  const keysToPreserve = new Set<string>()
  if (targetStepId) {
    const targetStepDef = STEP_DEFINITIONS[targetStepId]
    if (targetStepDef?.affectingKeys) {
      targetStepDef.affectingKeys.forEach(key => keysToPreserve.add(key))
    }
  }

  for (const stepId of stepIds) {
    const stepDef = STEP_DEFINITIONS[stepId]
    if (stepDef?.affectingKeys) {
      stepDef.affectingKeys.forEach(key => {
        // Don't reset keys that are in the target step
        if (!keysToPreserve.has(key)) {
          keysToReset.add(key as keyof WizardConfig)
        }
      })
    }
  }

  for (const key of keysToReset) {
    ;(config as any)[key] = DEFAULT_CONFIG[key]
  }
}

/**
 * Check if a config key affects a specific generation and invalidate if needed.
 */
function onConfigChange(key: keyof WizardConfig) {
  const affectedStep = wizardFlow.getAffectedGenerationStep(key)

  if (affectedStep === 'vocal' && vocalGenerated.value) {
    invalidateVocal()
  } else if (affectedStep === 'bgm' && bgmGenerated.value) {
    invalidateBgm()
  }
}

export function useWizardStore() {
  // Total steps is dynamic based on flow type
  const totalSteps = computed(() => wizardFlow.totalSteps.value)

  const canGoNext = computed(() => currentStep.value < totalSteps.value)
  const canGoBack = computed(() => currentStep.value > 1)

  const currentSongImage = computed(() =>
    songImages.find(s => s.id === config.songImageId)
  )

  /**
   * Get current step definition
   */
  const currentStepDef = computed(() =>
    wizardFlow.getStepByIndex(currentStep.value)
  )

  function nextStep() {
    if (canGoNext.value) {
      currentStep.value++
    }
  }

  function prevStep() {
    if (canGoBack.value) {
      goToStep(currentStep.value - 1)
    }
  }

  function goToStep(step: number) {
    if (step < 1 || step > totalSteps.value) return

    const oldStep = currentStep.value

    // Reset everything when going back to the first step
    if (step === 1 && oldStep > 1) {
      Object.assign(config, DEFAULT_CONFIG)
      wizardFlow.setFlowType('vocal-first')
      invalidateVocal()
      invalidateBgm()
      editedVocalNotes.value = null
      currentStep.value = 1
      return
    }

    // Reset skipped step configs when going back
    if (step < oldStep) {
      const stepsToReset = getStepsToReset(step, oldStep)
      const targetStepDef = wizardFlow.getStepByIndex(step)
      resetStepConfigs(stepsToReset, targetStepDef?.id)

      // Invalidate generation state if generation steps are in the reset list
      for (const stepId of stepsToReset) {
        if (stepId === 'vocalGeneration' || stepId === 'vocalSettings') {
          invalidateVocal()
        }
        if (stepId === 'bgmGeneration' || stepId === 'bgmSettings') {
          invalidateBgm()
        }
      }
    }

    currentStep.value = step
  }

  function selectSongImage(id: string) {
    const image = songImages.find(s => s.id === id)
    if (!image) return

    config.songImageId = id
    config.stylePresetId = image.stylePresetIds[0]
    config.bpm = image.tempoRange.default
    config.timbreId = image.defaultTimbre
    config.blueprintId = getRecommendedBlueprintId(id)

    // Select first recommended chord
    if (image.recommendedChords.length > 0) {
      config.chordProgressionId = image.recommendedChords[0]
    }

    // Invalidate generation if already past this step
    if (vocalGenerated.value) invalidateVocal()
    if (bgmGenerated.value) invalidateBgm()
  }

  function selectChordProgression(id: number) {
    config.chordProgressionId = id
    if (vocalGenerated.value) invalidateVocal()
    if (bgmGenerated.value) invalidateBgm()
  }

  function setKey(key: number) {
    config.key = key
    if (vocalGenerated.value) invalidateVocal()
    if (bgmGenerated.value) invalidateBgm()
  }

  function setBpm(bpm: number) {
    config.bpm = Math.max(40, Math.min(240, bpm))
    if (vocalGenerated.value) invalidateVocal()
    if (bgmGenerated.value) invalidateBgm()
  }

  function setActiveCategory(category: string) {
    config.activeCategory = category
  }

  function setFlowType(type: FlowType) {
    config.flowType = type
    wizardFlow.setFlowType(type)

    // Invalidate generations when flow type changes
    invalidateVocal()
    invalidateBgm()
  }

  function setVocalGenerated(value: boolean) {
    vocalGenerated.value = value
  }

  function setBgmGenerated(value: boolean) {
    bgmGenerated.value = value
  }

  function reset() {
    currentStep.value = 1
    invalidateVocal()
    invalidateBgm()
    vocalVersion.value = 0
    bgmVersion.value = 0
    editedVocalNotes.value = null

    // Reset all config to defaults
    Object.assign(config, DEFAULT_CONFIG)
    wizardFlow.setFlowType('vocal-first')
  }

  /**
   * Set edited vocal notes
   */
  function setEditedVocalNotes(notes: PlacedNote[]) {
    editedVocalNotes.value = notes
  }

  /**
   * Clear edited vocal notes (revert to generated)
   */
  function clearEditedVocalNotes() {
    editedVocalNotes.value = null
  }

  /**
   * Check if vocal notes have been edited
   */
  function hasEditedVocalNotes(): boolean {
    return editedVocalNotes.value !== null
  }

  /**
   * Set chord progressions from WASM
   */
  function setChordProgressions(progressions: ChordProgression[]) {
    chordProgressions.value = progressions
  }

  /**
   * Get chord progression by ID
   */
  function getChordProgressionById(id: number): ChordProgression | undefined {
    return chordProgressions.value.find(c => c.id === id)
  }

  return {
    // State
    currentStep,
    totalSteps,
    bgmGenerated,
    vocalGenerated,
    bgmVersion,
    vocalVersion,
    libVersion,
    chordProgressions,
    config,
    editedVocalNotes,

    // Computed
    canGoNext,
    canGoBack,
    currentSongImage,
    currentStepDef,

    // Navigation
    nextStep,
    prevStep,
    goToStep,

    // Config helpers
    selectSongImage,
    selectChordProgression,
    setKey,
    setBpm,
    setActiveCategory,
    setFlowType,

    // Step management
    invalidateVocal,
    invalidateBgm,
    onConfigChange,
    setVocalGenerated,
    setBgmGenerated,
    reset,

    // Vocal editing
    setEditedVocalNotes,
    clearEditedVocalNotes,
    hasEditedVocalNotes,

    // Chord progressions
    setChordProgressions,
    getChordProgressionById
  }
}
