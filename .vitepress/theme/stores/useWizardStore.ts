import { ref, computed, reactive, watch } from 'vue'
import { songImages } from '../data/songImages'

// ============================================
// Step Dependencies
// ============================================
// Step 1 (Style) → affects Step 4 (BGM)
// Step 2 (Chord) → affects Step 4 (BGM)
// Step 3 (Settings) → affects Step 4 (BGM)
// Step 4 (BGM) → affects Step 6 (Final)
// Step 5 (Melody) → affects Step 6 (Final)
// Step 6 (Final) → terminal

// Config keys that affect BGM generation (Step 4)
const BGM_AFFECTING_KEYS: (keyof WizardConfig)[] = [
  'songImageId', 'stylePresetId', 'chordProgressionId', 'key', 'bpm', 'formId',
  'drumsEnabled', 'arpeggioEnabled', 'arpeggioPattern', 'arpeggioSpeed',
  'arpeggioOctaveRange', 'arpeggioGate', 'arpeggioSyncChord',
  'chordExtSus', 'chordExt7th', 'chordExt9th',
  'chordExtSusProb', 'chordExt7thProb', 'chordExt9thProb',
  'compositionStyle', 'targetDurationSeconds',
  'modulationTiming', 'modulationSemitones',
  'callEnabled', 'callNotesEnabled', 'introChant', 'mixPattern', 'callDensity',
  'arrangementGrowth', 'motifRepeatScope', 'motifFixedProgression', 'motifMaxChordCount',
  'humanize', 'humanizeTiming', 'humanizeVelocity',
  'melodicComplexity', 'hookIntensity'
]

// Config keys that affect Vocal generation (Step 6)
const VOCAL_AFFECTING_KEYS: (keyof WizardConfig)[] = [
  'vocalLow', 'vocalHigh', 'vocalAttitude', 'vocalStyle',
  'melodyTemplate', 'vocalGroove'
]

// ============================================
// Step-specific Config Keys (for reset on navigation)
// ============================================
// Step 2: Chord selection
const STEP2_KEYS: (keyof WizardConfig)[] = ['chordProgressionId']

// Step 3: Key, Tempo, and advanced settings
const STEP3_KEYS: (keyof WizardConfig)[] = [
  'key', 'bpm', 'formId', 'drumsEnabled', 'arpeggioEnabled',
  'arpeggioPattern', 'arpeggioSpeed', 'arpeggioOctaveRange', 'arpeggioGate', 'arpeggioSyncChord',
  'chordExtSus', 'chordExt7th', 'chordExt9th',
  'chordExtSusProb', 'chordExt7thProb', 'chordExt9thProb',
  'compositionStyle', 'targetDurationSeconds',
  'modulationTiming', 'modulationSemitones',
  'callEnabled', 'callNotesEnabled', 'introChant', 'mixPattern', 'callDensity',
  'arrangementGrowth', 'motifRepeatScope', 'motifFixedProgression', 'motifMaxChordCount',
  'humanize', 'humanizeTiming', 'humanizeVelocity',
  'melodicComplexity', 'hookIntensity'
]

// Step 5: Melody/Vocal settings
const STEP5_KEYS: (keyof WizardConfig)[] = [
  'vocalLow', 'vocalHigh', 'vocalAttitude', 'vocalStyle',
  'melodyTemplate', 'vocalGroove'
]

export interface WizardConfig {
  songImageId: string
  stylePresetId: number
  chordProgressionId: number
  key: number
  bpm: number
  seed: number
  formId: number
  vocalAttitude: number
  drumsEnabled: boolean
  arpeggioEnabled: boolean
  vocalLow: number
  vocalHigh: number
  humanize: boolean
  humanizeTiming: number
  humanizeVelocity: number
  timbreId: string
  activeCategory: string
  // Arpeggio settings
  arpeggioPattern: number  // 0=Up, 1=Down, 2=UpDown, 3=Random
  arpeggioSpeed: number    // 0=Eighth, 1=Sixteenth, 2=Triplet
  arpeggioOctaveRange: number  // 1-3
  arpeggioGate: number     // 0-100
  // Chord extensions
  chordExtSus: boolean
  chordExt7th: boolean
  chordExt9th: boolean
  chordExtSusProb: number  // 0-100
  chordExt7thProb: number  // 0-100
  chordExt9thProb: number  // 0-100
  // Composition
  compositionStyle: number // 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven
  // Duration
  targetDurationSeconds: number // 0=use formId, or target duration in seconds
  // Modulation settings
  modulationTiming: number // 0=None, 1=LastChorus, 2=AfterBridge, 3=EachChorus, 4=Random
  modulationSemitones: number // +1 to +4
  // SE/Call settings
  callEnabled: boolean
  callNotesEnabled: boolean
  introChant: number // 0=None, 1=Gachikoi, 2=Shouting
  mixPattern: number // 0=None, 1=Standard, 2=Tiger
  callDensity: number // 0=None, 1=Minimal, 2=Standard, 3=Intense
  // Melody template (0=Auto, 1-7=specific template)
  melodyTemplate: number // 0=Auto, 1=PlateauTalk, 2=RunUpTarget, 3=DownResolve, 4=HookRepeat, 5=SparseAnchor, 6=CallResponse, 7=JumpAccent
  // Arrangement settings
  arrangementGrowth: number // 0=LayerAdd, 1=RegisterAdd
  // Arpeggio sync settings
  arpeggioSyncChord: boolean // Sync arpeggio with chord changes
  // Motif settings (for BackgroundMotif style)
  motifRepeatScope: number // 0=FullSong, 1=Section
  motifFixedProgression: boolean // Same progression all sections
  motifMaxChordCount: number // Max chord count (0=no limit, 2-8)
  // Vocal style preset
  vocalStyle: number // 0=Auto, 1=Standard, 2=Vocaloid, 3=UltraVocaloid, 4=Idol, 5=Ballad, 6=Rock, 7=CityPop, 8=Anime, 9=BrightKira, 10=CoolSynth, 11=CuteAffected, 12=PowerfulShout
  // Melodic complexity (BGM)
  melodicComplexity: number // 0=Simple, 1=Standard, 2=Complex
  // Hook intensity (BGM)
  hookIntensity: number // 0=Off, 1=Light, 2=Normal, 3=Strong
  // Vocal groove feel
  vocalGroove: number // 0=Straight, 1=OffBeat, 2=Swing, 3=Syncopated, 4=Driving16th, 5=Bouncy8th
}

// ============================================
// Default Configuration
// ============================================
const DEFAULT_CONFIG: WizardConfig = {
  songImageId: 'idol-classic',
  stylePresetId: 3,
  chordProgressionId: 0,
  key: 0,
  bpm: 132,
  seed: 0,
  formId: 5,
  vocalAttitude: 0,
  drumsEnabled: true,
  arpeggioEnabled: false,
  vocalLow: 57,
  vocalHigh: 79,
  humanize: false,
  humanizeTiming: 50,
  humanizeVelocity: 50,
  timbreId: 'pop_clean',
  activeCategory: 'idol',
  // Arpeggio
  arpeggioPattern: 0,
  arpeggioSpeed: 1,
  arpeggioOctaveRange: 2,
  arpeggioGate: 80,
  arpeggioSyncChord: true,
  // Chord extensions
  chordExtSus: false,
  chordExt7th: false,
  chordExt9th: false,
  chordExtSusProb: 20,
  chordExt7thProb: 30,
  chordExt9thProb: 25,
  // Composition
  compositionStyle: 0,
  // Duration
  targetDurationSeconds: 150,
  // Modulation
  modulationTiming: 0,
  modulationSemitones: 2,
  // SE/Call
  callEnabled: false,
  callNotesEnabled: true,
  introChant: 0,
  mixPattern: 0,
  callDensity: 2,
  // Melody template (0=Auto, 1-7=specific template)
  melodyTemplate: 0,
  // Arrangement
  arrangementGrowth: 0,
  // Motif
  motifRepeatScope: 0,
  motifFixedProgression: true,
  motifMaxChordCount: 4,
  // Vocal style
  vocalStyle: 0,
  // Melodic complexity
  melodicComplexity: 1,
  // Hook intensity
  hookIntensity: 2,
  // Vocal groove
  vocalGroove: 0
}

// ============================================
// State
// ============================================
const currentStep = ref(1)
const totalSteps = 6
const bgmGenerated = ref(false)
const bgmVersion = ref(0)
const melodyVersion = ref(0)

const config = reactive<WizardConfig>({ ...DEFAULT_CONFIG })

// ============================================
// Step Invalidation
// ============================================
/**
 * Invalidate a step, forcing it to regenerate when visited.
 * Also clears any dependent state.
 */
function invalidateStep(step: 4 | 6) {
  if (step === 4) {
    bgmGenerated.value = false
    bgmVersion.value++
    // Clear the shared instance reference
    if (typeof window !== 'undefined') {
      ;(window as any).__midiSketchInstance = null
    }
    // BGM invalidation also invalidates Final step
    invalidateStep(6)
  } else if (step === 6) {
    melodyVersion.value++
  }
}

/**
 * Check if a config key affects a specific step and invalidate if needed.
 */
function onConfigChange(key: keyof WizardConfig) {
  // Only invalidate if we're past the affected step
  if (BGM_AFFECTING_KEYS.includes(key) && currentStep.value >= 4) {
    invalidateStep(4)
  } else if (VOCAL_AFFECTING_KEYS.includes(key) && currentStep.value >= 6) {
    invalidateStep(6)
  }
}

export function useWizardStore() {
  const canGoNext = computed(() => currentStep.value < totalSteps)
  const canGoBack = computed(() => currentStep.value > 1)

  const currentSongImage = computed(() =>
    songImages.find(s => s.id === config.songImageId)
  )

  function nextStep() {
    if (canGoNext.value) {
      // Increment melody version when advancing to FinalStep to force remount
      if (currentStep.value === 5) {
        melodyVersion.value++
      }
      currentStep.value++
    }
  }

  function prevStep() {
    if (canGoBack.value) {
      const newStep = currentStep.value - 1
      // Going back exactly one step: preserve settings
      clearStepsAfter(newStep, true)
      currentStep.value = newStep
    }
  }

  function goToStep(step: number) {
    if (step >= 1 && step <= totalSteps) {
      // If going backwards, clear settings for steps after the target
      if (step < currentStep.value) {
        const stepsBack = currentStep.value - step
        // Preserve settings only if going back exactly one step
        const preserveSettings = stepsBack === 1
        clearStepsAfter(step, preserveSettings)
      }
      currentStep.value = step
    }
  }

  // Reset specific config keys to their default values
  // For song-image-dependent values, use the current song image's defaults
  function resetConfigKeys(keys: (keyof WizardConfig)[]) {
    const image = currentSongImage.value
    for (const key of keys) {
      if (key === 'bpm') {
        // Use the selected song image's default BPM
        config.bpm = image?.tempoRange.default ?? DEFAULT_CONFIG.bpm
      } else if (key === 'chordProgressionId') {
        // Use the selected song image's first recommended chord
        config.chordProgressionId = image?.recommendedChords[0] ?? DEFAULT_CONFIG.chordProgressionId
      } else {
        (config as any)[key] = DEFAULT_CONFIG[key]
      }
    }
  }

  // Clear settings for steps after the given step (only when jumping multiple steps)
  // When going back exactly one step, settings are preserved
  // When going back 2+ steps, intermediate step settings are reset
  function clearStepsAfter(step: number, preserveSettings: boolean = false) {
    // Reset settings only if not preserving (i.e., jumping multiple steps back)
    if (!preserveSettings) {
      if (step <= 1) {
        // Going back to step 1: reset step 2, 3, 5 settings
        resetConfigKeys(STEP2_KEYS)
        resetConfigKeys(STEP3_KEYS)
        resetConfigKeys(STEP5_KEYS)
      } else if (step <= 2) {
        // Going back to step 2: reset step 3, 5 settings
        resetConfigKeys(STEP3_KEYS)
        resetConfigKeys(STEP5_KEYS)
      } else if (step <= 3) {
        // Going back to step 3: reset step 5 settings
        resetConfigKeys(STEP5_KEYS)
      } else if (step <= 4) {
        // Going back to step 4: reset step 5 settings
        resetConfigKeys(STEP5_KEYS)
      }
      // Step 5, 6: no settings to reset
    }

    // Always invalidate generation results
    if (step <= 4) {
      invalidateStep(4)
    } else if (step <= 5) {
      invalidateStep(6)
    }
  }

  function selectSongImage(id: string) {
    const image = songImages.find(s => s.id === id)
    if (!image) return

    config.songImageId = id
    config.stylePresetId = image.stylePresetIds[0]
    config.bpm = image.tempoRange.default
    config.timbreId = image.defaultTimbre

    // Select first recommended chord
    if (image.recommendedChords.length > 0) {
      config.chordProgressionId = image.recommendedChords[0]
    }
  }

  function selectChordProgression(id: number) {
    config.chordProgressionId = id
  }

  function setKey(key: number) {
    config.key = key
  }

  function setBpm(bpm: number) {
    // Clamp BPM to library's full range (60-180)
    // Song image's tempoRange is now just a recommendation, not a hard limit
    config.bpm = Math.max(60, Math.min(180, bpm))
  }

  function setActiveCategory(category: string) {
    config.activeCategory = category
  }

  function reset() {
    currentStep.value = 1
    invalidateStep(4)  // This also invalidates step 6
    melodyVersion.value = 0

    // Reset all config to defaults
    Object.assign(config, DEFAULT_CONFIG)
  }

  function setBgmGenerated(value: boolean) {
    bgmGenerated.value = value
  }

  return {
    // State
    currentStep,
    totalSteps,
    bgmGenerated,
    bgmVersion,
    melodyVersion,
    config,

    // Computed
    canGoNext,
    canGoBack,
    currentSongImage,

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

    // Step management
    invalidateStep,
    onConfigChange,
    setBgmGenerated,
    reset
  }
}
