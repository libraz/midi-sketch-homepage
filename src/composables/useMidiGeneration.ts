import { ref, shallowRef } from 'vue'
import type { WizardConfig } from '@/stores/useWizardStore'
import type { PlacedNote } from '@/components/PianoRollEditor/types'
import { placedNotesToNoteInput } from '@/utils/noteConversion'

// ============================================
// Types
// ============================================

export interface BgmConfig {
  stylePresetId: number
  key: number
  bpm: number
  seed: number
  chordProgressionId: number
  formId: number
  vocalAttitude: number
  drumsEnabled: boolean
  arpeggioEnabled: boolean
  arpeggioPattern: number
  arpeggioSpeed: number
  arpeggioOctaveRange: number
  arpeggioGate: number
  arpeggioSyncChord: boolean
  vocalLow: number
  vocalHigh: number
  skipVocal: boolean
  humanize: boolean
  humanizeTiming: number
  humanizeVelocity: number
  chordExtSus: boolean
  chordExt7th: boolean
  chordExt9th: boolean
  chordExtSusProb: number
  chordExt7thProb: number
  chordExt9thProb: number
  compositionStyle: number
  targetDurationSeconds: number
  modulationTiming: number
  modulationSemitones: number
  callEnabled: boolean
  callNotesEnabled: boolean
  introChant: number
  mixPattern: number
  callDensity: number
  melodyTemplate: number
  arrangementGrowth: number
  motifRepeatScope: number
  motifFixedProgression: boolean
  motifMaxChordCount: number
  melodicComplexity?: number
  hookIntensity?: number
}

export interface VocalParams {
  seed: number
  vocalLow: number
  vocalHigh: number
  vocalAttitude: number
  vocalStyle: number
  melodyTemplate: number
  melodicComplexity: number
  hookIntensity: number
  vocalGroove: number
  compositionStyle: number
}

/**
 * Config for generateVocal API (Vocal-first flow)
 * This is a SongConfig with vocal-specific settings
 */
export interface VocalConfig {
  stylePresetId: number
  key: number
  bpm: number
  seed: number
  chordProgressionId: number
  formId: number
  targetDurationSeconds: number
  vocalLow: number
  vocalHigh: number
  vocalAttitude: number
  vocalStyle: number
  melodyTemplate: number
  melodicComplexity: number
  hookIntensity: number
  vocalGroove: number
  compositionStyle: number
}

/**
 * Config for generateAccompaniment API
 */
export interface AccompanimentConfig {
  seed?: number
  drumsEnabled?: boolean
  arpeggioEnabled?: boolean
  arpeggioPattern?: number
  arpeggioSpeed?: number
  arpeggioOctaveRange?: number
  arpeggioGate?: number
  arpeggioSyncChord?: boolean
  chordExtSus?: boolean
  chordExt7th?: boolean
  chordExt9th?: boolean
  chordExtSusProb?: number
  chordExt7thProb?: number
  chordExt9thProb?: number
  humanize?: boolean
  humanizeTiming?: number
  humanizeVelocity?: number
  seEnabled?: boolean
  callEnabled?: boolean
  callDensity?: number
  introChant?: number
  mixPattern?: number
  callNotesEnabled?: boolean
}

// Module-level singleton state
let _midisketch: typeof import('../wasm/index.js') | null = null
let _instance: any | null = null
let _isInitialized = false
let _initPromise: Promise<any> | null = null

// ============================================
// Singleton accessors
// ============================================

/**
 * Get the shared MidiSketch module
 */
export function getMidiSketchModule() {
  return _midisketch
}

/**
 * Get the shared MidiSketch instance
 */
export function getMidiSketchInstance() {
  return _instance
}

/**
 * Check if the module is initialized
 */
export function isModuleInitialized() {
  return _isInitialized
}

// ============================================
// Composable
// ============================================

/**
 * Composable for MIDI generation logic.
 * Manages WASM initialization, BGM generation, and vocal generation.
 * Uses a singleton pattern to share the MidiSketch instance across components.
 */
export function useMidiGeneration() {
  const isInitializing = ref(false)
  const isGenerating = ref(false)
  const error = ref<string | null>(null)
  const eventData = ref<any>(null)

  /**
   * Initialize the WASM module and create a MidiSketch instance.
   * Returns the existing instance if already initialized.
   */
  async function initialize(): Promise<any> {
    // Return existing instance if already initialized
    if (_isInitialized && _instance) {
      return _instance
    }

    // Wait for existing initialization if in progress
    if (_initPromise) {
      return _initPromise
    }

    isInitializing.value = true
    error.value = null

    _initPromise = (async () => {
      try {
        const mod = await import('../wasm/index.js')
        _midisketch = mod
        const wasmPath = new URL('../wasm/midisketch.wasm', import.meta.url).href
        await mod.init({ wasmPath })
        _instance = new mod.MidiSketch()
        _isInitialized = true

        // Also set global reference for legacy compatibility
        if (typeof window !== 'undefined') {
          ;(window as any).__midiSketchInstance = _instance
        }

        return _instance
      } catch (e: any) {
        error.value = e.message
        throw e
      } finally {
        isInitializing.value = false
        _initPromise = null
      }
    })()

    return _initPromise
  }

  /**
   * Validate and fix config values for the current style.
   * Ensures formId, chordProgressionId, and vocalAttitude are valid.
   */
  function validateConfigForStyle(config: WizardConfig): void {
    if (!_midisketch) return

    // Validate formId for current style
    const validForms = _midisketch.getFormsByStyle(config.stylePresetId)
    if (validForms.length > 0 && !validForms.includes(config.formId)) {
      config.formId = validForms[0]
    }

    // Validate chordProgressionId for current style
    const validProgressions = _midisketch.getProgressionsByStyle(config.stylePresetId)
    if (validProgressions.length > 0 && !validProgressions.includes(config.chordProgressionId)) {
      config.chordProgressionId = validProgressions[0]
    }

    // Validate vocalAttitude for current style
    const presets = _midisketch.getStylePresets()
    const preset = presets.find((p: any) => p.id === config.stylePresetId)
    if (preset) {
      const allowedAttitudes = preset.allowedAttitudes
      const attitudeFlag = 1 << config.vocalAttitude
      if ((allowedAttitudes & attitudeFlag) === 0) {
        // Find first allowed attitude
        for (let i = 0; i < 3; i++) {
          if ((allowedAttitudes & (1 << i)) !== 0) {
            config.vocalAttitude = i
            break
          }
        }
      }
    }
  }

  /**
   * Build BGM config from WizardConfig
   */
  function buildBgmConfig(config: WizardConfig, overrideSeed?: number): BgmConfig {
    const seed = overrideSeed || config.seed || Math.floor(Math.random() * 0xFFFFFFFF)

    return {
      stylePresetId: config.stylePresetId,
      key: config.key,
      bpm: config.bpm,
      seed,
      chordProgressionId: config.chordProgressionId,
      formId: config.formId,
      vocalAttitude: config.vocalAttitude,
      drumsEnabled: config.drumsEnabled,
      arpeggioEnabled: config.arpeggioEnabled,
      arpeggioPattern: config.arpeggioPattern,
      arpeggioSpeed: config.arpeggioSpeed,
      arpeggioOctaveRange: config.arpeggioOctaveRange,
      arpeggioGate: config.arpeggioGate,
      arpeggioSyncChord: config.arpeggioSyncChord,
      vocalLow: config.vocalLow,
      vocalHigh: config.vocalHigh,
      skipVocal: true, // BGM only, vocal generated separately
      humanize: config.humanize,
      humanizeTiming: config.humanizeTiming,
      humanizeVelocity: config.humanizeVelocity,
      chordExtSus: config.chordExtSus,
      chordExt7th: config.chordExt7th,
      chordExt9th: config.chordExt9th,
      chordExtSusProb: config.chordExtSusProb,
      chordExt7thProb: config.chordExt7thProb,
      chordExt9thProb: config.chordExt9thProb,
      compositionStyle: config.compositionStyle,
      targetDurationSeconds: config.targetDurationSeconds,
      modulationTiming: config.modulationTiming,
      modulationSemitones: config.modulationSemitones,
      callEnabled: config.callEnabled,
      callNotesEnabled: config.callNotesEnabled,
      introChant: config.introChant,
      mixPattern: config.mixPattern,
      callDensity: config.callDensity,
      melodyTemplate: config.melodyTemplate,
      arrangementGrowth: config.arrangementGrowth,
      motifRepeatScope: config.motifRepeatScope,
      motifFixedProgression: config.motifFixedProgression,
      motifMaxChordCount: config.motifMaxChordCount,
      melodicComplexity: config.melodicComplexity,
      hookIntensity: config.hookIntensity
    }
  }

  /**
   * Build vocal params from WizardConfig (for regenerateVocal)
   */
  function buildVocalParams(config: WizardConfig, seed: number): VocalParams {
    return {
      seed,
      vocalLow: config.vocalLow,
      vocalHigh: config.vocalHigh,
      vocalAttitude: config.vocalAttitude,
      vocalStyle: config.vocalStyle,
      melodyTemplate: config.melodyTemplate,
      melodicComplexity: config.melodicComplexity,
      hookIntensity: config.hookIntensity,
      vocalGroove: config.vocalGroove,
      compositionStyle: config.compositionStyle
    }
  }

  /**
   * Build vocal config from WizardConfig (for generateVocal in vocal-first flow)
   */
  function buildVocalConfig(config: WizardConfig, overrideSeed?: number): VocalConfig {
    const seed = overrideSeed || config.vocalSeed || Math.floor(Math.random() * 0xFFFFFFFF)

    return {
      stylePresetId: config.stylePresetId,
      key: config.key,
      bpm: config.bpm,
      seed,
      chordProgressionId: config.chordProgressionId,
      formId: config.formId,
      targetDurationSeconds: config.targetDurationSeconds,
      vocalLow: config.vocalLow,
      vocalHigh: config.vocalHigh,
      vocalAttitude: config.vocalAttitude,
      vocalStyle: config.vocalStyle,
      melodyTemplate: config.melodyTemplate,
      melodicComplexity: config.melodicComplexity,
      hookIntensity: config.hookIntensity,
      vocalGroove: config.vocalGroove,
      compositionStyle: 0 // MelodyLead for vocal-first flow
    }
  }

  /**
   * Build accompaniment config from WizardConfig
   */
  function buildAccompanimentConfig(config: WizardConfig, overrideSeed?: number): AccompanimentConfig {
    const seed = overrideSeed || config.seed || Math.floor(Math.random() * 0xFFFFFFFF)

    return {
      seed,
      drumsEnabled: config.drumsEnabled,
      arpeggioEnabled: config.arpeggioEnabled,
      arpeggioPattern: config.arpeggioPattern,
      arpeggioSpeed: config.arpeggioSpeed,
      arpeggioOctaveRange: config.arpeggioOctaveRange,
      arpeggioGate: config.arpeggioGate,
      arpeggioSyncChord: config.arpeggioSyncChord,
      chordExtSus: config.chordExtSus,
      chordExt7th: config.chordExt7th,
      chordExt9th: config.chordExt9th,
      chordExtSusProb: config.chordExtSusProb,
      chordExt7thProb: config.chordExt7thProb,
      chordExt9thProb: config.chordExt9thProb,
      humanize: config.humanize,
      humanizeTiming: config.humanizeTiming,
      humanizeVelocity: config.humanizeVelocity,
      seEnabled: config.seEnabled,
      callEnabled: config.callEnabled,
      callDensity: config.callDensity,
      introChant: config.introChant,
      mixPattern: config.mixPattern,
      callNotesEnabled: config.callNotesEnabled
    }
  }

  /**
   * Generate BGM from wizard config.
   * Automatically validates config and initializes WASM if needed.
   */
  async function generateBgm(config: WizardConfig, overrideSeed?: number): Promise<any> {
    await initialize()

    if (!_instance || !_midisketch) {
      throw new Error('WASM module not initialized')
    }

    isGenerating.value = true
    error.value = null

    try {
      // Validate and fix config
      validateConfigForStyle(config)

      // Build BGM config
      const bgmConfig = buildBgmConfig(config, overrideSeed)

      // Update store seed if we generated one
      if (!overrideSeed && !config.seed) {
        config.seed = bgmConfig.seed
      }

      // Generate
      _instance.generateFromConfig(bgmConfig)

      // Get events
      eventData.value = safeGetEvents(_instance)

      return eventData.value
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Generate vocal track from wizard config (legacy - for chord-first flow).
   * Must call generateBgm first to have a valid instance.
   */
  async function generateVocal(config: WizardConfig, seed: number): Promise<any> {
    if (!_instance) {
      throw new Error('No BGM generated yet. Call generateBgm first.')
    }

    isGenerating.value = true
    error.value = null

    try {
      const vocalParams = buildVocalParams(config, seed)
      _instance.regenerateVocal(vocalParams)
      eventData.value = safeGetEvents(_instance)
      return eventData.value
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Generate vocal track only (for vocal-first flow).
   * Uses the new generateVocal API which generates vocal without accompaniment.
   */
  async function generateVocalOnly(config: WizardConfig, overrideSeed?: number): Promise<any> {
    await initialize()

    if (!_instance || !_midisketch) {
      throw new Error('WASM module not initialized')
    }

    isGenerating.value = true
    error.value = null

    try {
      // Validate and fix config
      validateConfigForStyle(config)

      // Build vocal config
      const vocalConfig = buildVocalConfig(config, overrideSeed)

      // Update store seed if we generated one
      if (!overrideSeed && !config.vocalSeed) {
        config.vocalSeed = vocalConfig.seed
      }

      // Generate vocal only using new API
      _instance.generateVocal(vocalConfig)

      // Get events
      eventData.value = safeGetEvents(_instance)

      return eventData.value
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Generate accompaniment for existing vocal (for vocal-first flow).
   * Must call generateVocalOnly first to have a valid vocal track.
   */
  async function generateAccompanimentTracks(config: WizardConfig, overrideSeed?: number): Promise<any> {
    if (!_instance) {
      throw new Error('No vocal generated yet. Call generateVocalOnly first.')
    }

    isGenerating.value = true
    error.value = null

    try {
      // Build accompaniment config
      const accompConfig = buildAccompanimentConfig(config, overrideSeed)

      // Update store seed if we generated one
      if (accompConfig.seed && !overrideSeed && !config.seed) {
        config.seed = accompConfig.seed
      }

      // Generate accompaniment using new API
      _instance.generateAccompaniment(accompConfig)

      // Get events
      eventData.value = safeGetEvents(_instance)

      return eventData.value
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Regenerate accompaniment with new seed (for vocal-first flow).
   * Keeps the existing vocal track intact.
   */
  async function regenerateAccompaniment(config: WizardConfig, seed: number): Promise<any> {
    if (!_instance) {
      throw new Error('No vocal generated yet.')
    }

    isGenerating.value = true
    error.value = null

    try {
      // Build accompaniment config with new seed
      const accompConfig = buildAccompanimentConfig(config, seed)

      // Regenerate accompaniment
      _instance.regenerateAccompaniment(accompConfig)

      // Get events
      eventData.value = safeGetEvents(_instance)

      return eventData.value
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Set custom vocal notes (for edited vocal melody).
   * Replaces the generated vocal track with user-edited notes.
   * Must be called before generateAccompanimentTracks for vocal-first flow.
   */
  async function setVocalNotes(config: WizardConfig, placedNotes: PlacedNote[]): Promise<void> {
    if (!_instance) {
      throw new Error('No instance available. Call generateVocalOnly first.')
    }

    try {
      // Build vocal config for song structure
      const vocalConfig = buildVocalConfig(config)

      // Convert PlacedNotes to NoteInput format
      const noteInputs = placedNotesToNoteInput(placedNotes)

      // Call WASM setVocalNotes API
      _instance.setVocalNotes(vocalConfig, noteInputs)
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  /**
   * Safely retrieve event data from the instance.
   */
  function safeGetEvents(instance: any): any | null {
    try {
      return instance.getEvents()
    } catch {
      return null
    }
  }

  /**
   * Get MIDI data as Uint8Array
   */
  function getMidi(): Uint8Array {
    if (!_instance) {
      throw new Error('No instance available')
    }
    return _instance.getMidi()
  }

  /**
   * Download MIDI file
   */
  function downloadMidi(filename?: string): void {
    if (!_instance || !_midisketch) {
      throw new Error('No instance available')
    }

    const midiData = getMidi()
    const finalFilename = filename || `midi-sketch-${Date.now()}.mid`
    _midisketch.downloadMidi(midiData, finalFilename)
  }

  /**
   * Reset the instance (for re-generation)
   */
  function resetInstance(): void {
    if (_instance) {
      _instance.destroy()
      _instance = null
      _isInitialized = false
      if (typeof window !== 'undefined') {
        ;(window as any).__midiSketchInstance = null
      }
    }
    eventData.value = null
  }

  /**
   * Get valid form IDs for a style
   */
  function getFormsByStyle(styleId: number): number[] {
    if (!_midisketch) return []
    return _midisketch.getFormsByStyle(styleId)
  }

  /**
   * Get valid progression IDs for a style
   */
  function getProgressionsByStyle(styleId: number): number[] {
    if (!_midisketch) return []
    return _midisketch.getProgressionsByStyle(styleId)
  }

  /**
   * Get style presets
   */
  function getStylePresets(): any[] {
    if (!_midisketch) return []
    return _midisketch.getStylePresets()
  }

  return {
    // State
    isInitializing,
    isGenerating,
    error,
    eventData,

    // Initialization
    initialize,

    // Generation (legacy chord-first flow)
    generateBgm,
    generateVocal,

    // Generation (new vocal-first flow)
    generateVocalOnly,
    generateAccompanimentTracks,
    regenerateAccompaniment,
    setVocalNotes,

    // Config builders
    buildBgmConfig,
    buildVocalParams,
    buildVocalConfig,
    buildAccompanimentConfig,
    validateConfigForStyle,

    // Data retrieval
    getMidi,
    downloadMidi,
    safeGetEvents,

    // Instance management
    resetInstance,
    getInstance: () => _instance,
    getModule: () => _midisketch,

    // WASM utilities
    getFormsByStyle,
    getProgressionsByStyle,
    getStylePresets
  }
}
