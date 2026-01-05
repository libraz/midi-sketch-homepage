import { ref, computed, reactive } from 'vue'
import { songImages } from '../data/songImages'

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
  seEnabled: boolean
  callEnabled: boolean
  callNotesEnabled: boolean
  introChant: number // 0=None, 1=Gachikoi, 2=Shouting
  mixPattern: number // 0=None, 1=Standard, 2=Tiger
  callDensity: number // 0=None, 1=Minimal, 2=Standard, 3=Intense
  // Vocal detail settings
  vocalNoteDensity: number // 0-200 (0=style default, 70=standard, 100=idol, 150=vocaloid)
  vocalMinNoteDivision: number // 0=default, 4=quarter, 8=eighth, 16=sixteenth
  vocalRestRatio: number // 0-50 (percentage of phrase rest time)
  vocalAllowExtremLeap: boolean // Allow extreme leaps for vocaloid-style melodies
}

const currentStep = ref(1)
const totalSteps = 6
const bgmGenerated = ref(false)
const bgmVersion = ref(0)

const config = reactive<WizardConfig>({
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
  targetDurationSeconds: 150,  // 2:30 default
  // Modulation settings
  modulationTiming: 0,  // None
  modulationSemitones: 2,
  // SE/Call settings
  seEnabled: true,
  callEnabled: false,
  callNotesEnabled: true,
  introChant: 0,  // None
  mixPattern: 0,  // None
  callDensity: 2,  // Standard
  // Vocal detail settings
  vocalNoteDensity: 0,  // 0=use style default
  vocalMinNoteDivision: 0,  // 0=default
  vocalRestRatio: 20,  // 20% rest ratio
  vocalAllowExtremLeap: false
})

export function useWizardStore() {
  const canGoNext = computed(() => currentStep.value < totalSteps)
  const canGoBack = computed(() => currentStep.value > 1)

  const currentSongImage = computed(() =>
    songImages.find(s => s.id === config.songImageId)
  )

  function nextStep() {
    if (canGoNext.value) currentStep.value++
  }

  function prevStep() {
    if (canGoBack.value) {
      const newStep = currentStep.value - 1
      clearStepsAfter(newStep)
      currentStep.value = newStep
    }
  }

  function goToStep(step: number) {
    if (step >= 1 && step <= totalSteps) {
      // If going backwards, clear settings for steps after the target
      if (step < currentStep.value) {
        clearStepsAfter(step)
      }
      currentStep.value = step
    }
  }

  // Clear settings for steps after the given step
  function clearStepsAfter(step: number) {
    // Step 4 is BGM generation - clear if going before it
    if (step < 4) {
      bgmGenerated.value = false
      bgmVersion.value++  // Force BgmStep remount
      // Clear the shared instance reference
      if (typeof window !== 'undefined') {
        ;(window as any).__midiSketchInstance = null
      }
    }
    // Step 5 is Melody settings, Step 6 is Final - clear if going before step 6
    if (step < 6) {
      // Final step will regenerate melody on mount
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
    // Clamp BPM to current song image's tempo range
    const image = songImages.find(s => s.id === config.songImageId)
    if (image) {
      const min = image.tempoRange.min
      const max = image.tempoRange.max
      config.bpm = Math.max(min, Math.min(max, bpm))
    } else {
      config.bpm = bpm
    }
  }

  function setActiveCategory(category: string) {
    config.activeCategory = category
  }

  function reset() {
    currentStep.value = 1
    bgmGenerated.value = false
    config.songImageId = 'idol-classic'
    config.stylePresetId = 3
    config.chordProgressionId = 0
    config.key = 0
    config.bpm = 132
    config.seed = 0
    config.activeCategory = 'idol'
  }

  function setBgmGenerated(value: boolean) {
    bgmGenerated.value = value
  }

  return {
    currentStep,
    totalSteps,
    bgmGenerated,
    bgmVersion,
    config,
    canGoNext,
    canGoBack,
    currentSongImage,
    nextStep,
    prevStep,
    goToStep,
    selectSongImage,
    selectChordProgression,
    setKey,
    setBpm,
    setActiveCategory,
    setBgmGenerated,
    reset
  }
}
