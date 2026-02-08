/**
 * midi-sketch - MIDI Auto-Generation Library
 * @packageDocumentation
 */

// From types.ts
/**
 * Types and interfaces for midi-sketch
 */
/**
 * Song configuration for style-based generation
 */
export interface SongConfig {
    /** Style preset ID */
    stylePresetId: number;
    /** Key (0-11) */
    key: number;
    /** BPM (0 = use style default) */
    bpm: number;
    /** Random seed (0 = random) */
    seed: number;
    /** Chord progression ID */
    chordProgressionId: number;
    /** Form/structure pattern ID */
    formId: number;
    /** Vocal attitude: 0=Clean, 1=Expressive, 2=Raw */
    vocalAttitude: number;
    /** Enable drums */
    drumsEnabled: boolean;
    /** True if drumsEnabled was explicitly set by user */
    drumsEnabledExplicit: boolean;
    /** Blueprint ID: 0=Traditional, 1=Orangestar, 2=YOASOBI, 3=Ballad, 255=random */
    blueprintId: number;
    /** Enable arpeggio */
    arpeggioEnabled: boolean;
    /** Enable guitar track */
    guitarEnabled: boolean;
    /** Arpeggio pattern: 0=Up, 1=Down, 2=UpDown, 3=Random */
    arpeggioPattern: number;
    /** Arpeggio speed: 0=Eighth, 1=Sixteenth, 2=Triplet */
    arpeggioSpeed: number;
    /** Arpeggio octave range (1-3) */
    arpeggioOctaveRange: number;
    /** Arpeggio gate length (0-100) */
    arpeggioGate: number;
    /** Vocal range lower bound (MIDI note) */
    vocalLow: number;
    /** Vocal range upper bound (MIDI note) */
    vocalHigh: number;
    /** Skip vocal generation (for BGM-first workflow) */
    skipVocal: boolean;
    /** Enable humanization */
    humanize: boolean;
    /** Timing variation (0-100) */
    humanizeTiming: number;
    /** Velocity variation (0-100) */
    humanizeVelocity: number;
    /** Enable sus2/sus4 chords */
    chordExtSus: boolean;
    /** Enable 7th chords */
    chordExt7th: boolean;
    /** Enable 9th chords */
    chordExt9th: boolean;
    /** Sus chord probability (0-100) */
    chordExtSusProb: number;
    /** 7th chord probability (0-100) */
    chordExt7thProb: number;
    /** 9th chord probability (0-100) */
    chordExt9thProb: number;
    /** Composition style: 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven */
    compositionStyle: number;
    /** Target duration in seconds (0 = use formId) */
    targetDurationSeconds: number;
    /** Modulation timing: 0=None, 1=LastChorus, 2=AfterBridge, 3=EachChorus, 4=Random */
    modulationTiming: number;
    /** Modulation semitones (+1 to +4) */
    modulationSemitones: number;
    /** Enable SE track */
    seEnabled: boolean;
    /** Enable call feature (maps to call_setting: false=Auto(0), true=Enabled(1)) */
    callEnabled: boolean;
    /** Output calls as notes */
    callNotesEnabled: boolean;
    /** Intro chant: 0=None, 1=Gachikoi, 2=Shouting */
    introChant: number;
    /** Mix pattern: 0=None, 1=Standard, 2=Tiger */
    mixPattern: number;
    /** Call density: 0=None, 1=Minimal, 2=Standard, 3=Intense */
    callDensity: number;
    /** Vocal style preset: 0=Auto, 1=Standard, 2=Vocaloid, etc. */
    vocalStyle: number;
    /** Melody template: 0=Auto, 1=PlateauTalk, 2=RunUpTarget, etc. */
    melodyTemplate: number;
    /** Arrangement growth: 0=LayerAdd, 1=RegisterAdd */
    arrangementGrowth: number;
    /** Sync arpeggio with chord changes (default=true) */
    arpeggioSyncChord: boolean;
    /** Motif repeat scope: 0=FullSong, 1=Section */
    motifRepeatScope: number;
    /** Same progression for all sections (default=true) */
    motifFixedProgression: boolean;
    /** Max chord count (0=no limit, 2-8) */
    motifMaxChordCount: number;
    /** Melodic complexity: 0=Simple, 1=Standard, 2=Complex */
    melodicComplexity: number;
    /** Hook intensity: 0=Off, 1=Light, 2=Normal, 3=Strong */
    hookIntensity: number;
    /** Vocal groove feel: 0=Straight, 1=OffBeat, 2=Swing, 3=Syncopated, 4=Driving16th, 5=Bouncy8th */
    vocalGroove: number;
    /** Mood preset override (0-23, used when moodExplicit=true) */
    mood: number;
    /** 0=derive from style, 1=use mood field */
    moodExplicit: boolean;
    /** 0=may randomize, 1=use formId exactly */
    formExplicit: boolean;
    /** Drive feel: 0=laid-back, 50=neutral, 100=aggressive */
    driveFeel: number;
    /** Enable Behavioral Loop mode (fixed riff, maximum hook) */
    addictiveMode: boolean;
    /** Mora rhythm mode: 0=Standard, 1=MoraTimed, 2=Auto */
    moraRhythmMode: number;
    /** Enable syncopation effects (default=false) */
    enableSyncopation: boolean;
    /** Energy curve: 0=GradualBuild, 1=FrontLoaded, 2=WavePattern, 3=SteadyState */
    energyCurve: number;
    /** Max leap interval: 0=preset, 1-12=override */
    melodyMaxLeap: number;
    /** Syncopation probability: 0xFF=preset, 0-100=override */
    melodySyncopationProb: number;
    /** Phrase length in bars: 0=preset, 1-8 */
    melodyPhraseLength: number;
    /** Long note ratio: 0xFF=preset, 0-100=override */
    melodyLongNoteRatio: number;
    /** Chorus register shift: -128=preset, -12 to +12 */
    melodyChorusRegisterShift: number;
    /** Hook repetition: 0=preset, 1=off, 2=on */
    melodyHookRepetition: number;
    /** Leading tone: 0=preset, 1=off, 2=on */
    melodyUseLeadingTone: number;
    /** Motif length: 0=auto, 1/2/4 beats */
    motifLength: number;
    /** Motif note count: 0=auto, 3-8 */
    motifNoteCount: number;
    /** Motif motion: 0xFF=preset, 0-4=override (0=Stepwise..4=Disjunct) */
    motifMotion: number;
    /** Motif register: 0=auto, 1=low, 2=high */
    motifRegisterHigh: number;
    /** Motif rhythm density: 0xFF=preset, 0-2=override (0=Sparse..2=Driving) */
    motifRhythmDensity: number;
    /** True if chord extension probabilities were explicitly set by user */
    chordExtProbExplicit: boolean;
}
/**
 * Note input for custom vocal track
 */
export interface NoteInput {
    /** Note start time in ticks */
    startTick: number;
    /** Note duration in ticks */
    duration: number;
    /** MIDI note number (0-127) */
    pitch: number;
    /** Note velocity (0-127) */
    velocity: number;
}
/**
 * Vocal regeneration configuration
 */
export interface VocalConfig {
    /** Random seed (0 = new random) */
    seed?: number;
    /** Vocal range lower bound (MIDI note, 36-96) */
    vocalLow?: number;
    /** Vocal range upper bound (MIDI note, 36-96) */
    vocalHigh?: number;
    /** Vocal attitude: 0=Clean, 1=Expressive, 2=Raw */
    vocalAttitude?: number;
    /** Vocal style preset: 0=Auto, 1=Standard, 2=Vocaloid, etc. */
    vocalStyle?: number;
    /** Melody template: 0=Auto, 1=PlateauTalk, 2=RunUpTarget, etc. */
    melodyTemplate?: number;
    /** Melodic complexity: 0=Simple, 1=Standard, 2=Complex */
    melodicComplexity?: number;
    /** Hook intensity: 0=Off, 1=Light, 2=Normal, 3=Strong */
    hookIntensity?: number;
    /** Vocal groove feel: 0=Straight, 1=OffBeat, 2=Swing, etc. */
    vocalGroove?: number;
    /** Composition style: 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven */
    compositionStyle?: number;
}
/**
 * Configuration for accompaniment generation/regeneration.
 */
export interface AccompanimentConfig {
    /** Random seed for BGM (0 = auto-generate) */
    seed?: number;
    /** Enable drums */
    drumsEnabled?: boolean;
    /** Enable arpeggio */
    arpeggioEnabled?: boolean;
    /** Enable guitar track */
    guitarEnabled?: boolean;
    /** Arpeggio pattern: 0=Up, 1=Down, 2=UpDown, 3=Random */
    arpeggioPattern?: number;
    /** Arpeggio speed: 0=Eighth, 1=Sixteenth, 2=Triplet */
    arpeggioSpeed?: number;
    /** Arpeggio octave range: 1-3 */
    arpeggioOctaveRange?: number;
    /** Arpeggio gate length: 0-100 */
    arpeggioGate?: number;
    /** Sync arpeggio with chord changes */
    arpeggioSyncChord?: boolean;
    /** Enable sus chord extension */
    chordExtSus?: boolean;
    /** Enable 7th chord extension */
    chordExt7th?: boolean;
    /** Enable 9th chord extension */
    chordExt9th?: boolean;
    /** Enable tritone substitution (V7 -> bII7) */
    chordExtTritoneSub?: boolean;
    /** Sus probability: 0-100 */
    chordExtSusProb?: number;
    /** 7th probability: 0-100 */
    chordExt7thProb?: number;
    /** 9th probability: 0-100 */
    chordExt9thProb?: number;
    /** Tritone substitution probability: 0-100 */
    chordExtTritoneSubProb?: number;
    /** Enable humanization */
    humanize?: boolean;
    /** Timing variation: 0-100 */
    humanizeTiming?: number;
    /** Velocity variation: 0-100 */
    humanizeVelocity?: number;
    /** Enable SE track */
    seEnabled?: boolean;
    /** Enable call system */
    callEnabled?: boolean;
    /** Call density: 0=Sparse, 1=Light, 2=Standard, 3=Dense */
    callDensity?: number;
    /** Intro chant: 0=None, 1=Gachikoi, 2=Mix */
    introChant?: number;
    /** Mix pattern: 0=None, 1=Standard, 2=Tiger */
    mixPattern?: number;
    /** Output call as MIDI notes */
    callNotesEnabled?: boolean;
}
/**
 * Note safety level for piano roll visualization
 */
export declare const NoteSafety: {
    /** Green: chord tone, safe to use */
    readonly Safe: 0;
    /** Yellow: tension, low register, or passing tone */
    readonly Warning: 1;
    /** Red: dissonant or out of range */
    readonly Dissonant: 2;
};
export type NoteSafetyLevel = (typeof NoteSafety)[keyof typeof NoteSafety];
/**
 * Reason flags for note safety (bitfield, can be combined)
 */
export declare const NoteReason: {
    readonly None: 0;
    readonly ChordTone: 1;
    readonly Tension: 2;
    readonly ScaleTone: 4;
    readonly LowRegister: 8;
    readonly Tritone: 16;
    readonly LargeLeap: 32;
    readonly Minor2nd: 64;
    readonly Major7th: 128;
    readonly NonScale: 256;
    readonly PassingTone: 512;
    readonly OutOfRange: 1024;
    readonly TooHigh: 2048;
    readonly TooLow: 4096;
};
export type NoteReasonFlags = number;
/**
 * Collision info for a note that collides with BGM
 */
export interface CollisionInfo {
    /** Track role of colliding track */
    trackRole: number;
    /** MIDI pitch of colliding note */
    collidingPitch: number;
    /** Collision interval in semitones (1, 6, or 11) */
    intervalSemitones: number;
}
/**
 * Piano roll safety info for a single tick
 */
export interface PianoRollInfo {
    /** Tick position */
    tick: number;
    /** Current chord degree (0=I, 1=ii, etc.) */
    chordDegree: number;
    /** Current key (0-11, considering modulation) */
    currentKey: number;
    /** Safety level for each MIDI note (0-127) */
    safety: NoteSafetyLevel[];
    /** Reason flags for each note (0-127) */
    reason: NoteReasonFlags[];
    /** Collision details for each note */
    collision: CollisionInfo[];
    /** Recommended notes (priority order, max 8) */
    recommended: number[];
}
/**
 * Preset information
 */
export interface PresetInfo {
    /** Preset name */
    name: string;
    /** Display string (for chords) */
    display?: string;
    /** Default BPM (for moods) */
    defaultBpm?: number;
}
/**
 * Style preset information
 */
export interface StylePresetInfo {
    /** Style preset ID */
    id: number;
    /** Internal name */
    name: string;
    /** Display name */
    displayName: string;
    /** Description */
    description: string;
    /** Default tempo */
    tempoDefault: number;
    /** Bit flags for allowed vocal attitudes */
    allowedAttitudes: number;
}
/**
 * Event data from generation
 */
export interface EventData {
    bpm: number;
    division: number;
    duration_ticks: number;
    duration_seconds: number;
    tracks: Array<{
        name: string;
        channel: number;
        program: number;
        notes: Array<{
            pitch: number;
            velocity: number;
            start_ticks: number;
            duration_ticks: number;
            start_seconds: number;
            duration_seconds: number;
        }>;
    }>;
    sections: Array<{
        name: string;
        type: string;
        startTick: number;
        endTick: number;
        start_bar: number;
        bars: number;
        start_seconds: number;
        end_seconds: number;
    }>;
}
//# sourceMappingURL=types.d.ts.map
// From constants.ts
/**
 * Constants and error classes for midi-sketch
 */
/**
 * Config validation error codes
 */
export declare const ConfigError: {
    readonly OK: 0;
    readonly InvalidStyle: 1;
    readonly InvalidChord: 2;
    readonly InvalidForm: 3;
    readonly InvalidAttitude: 4;
    readonly InvalidVocalRange: 5;
    readonly InvalidBpm: 6;
    readonly DurationTooShort: 7;
    readonly InvalidModulation: 8;
    readonly InvalidKey: 9;
    readonly InvalidCompositionStyle: 10;
    readonly InvalidArpeggioPattern: 11;
    readonly InvalidArpeggioSpeed: 12;
    readonly InvalidVocalStyle: 13;
    readonly InvalidMelodyTemplate: 14;
    readonly InvalidMelodicComplexity: 15;
    readonly InvalidHookIntensity: 16;
    readonly InvalidVocalGroove: 17;
    readonly InvalidCallDensity: 18;
    readonly InvalidIntroChant: 19;
    readonly InvalidMixPattern: 20;
    readonly InvalidMotifRepeatScope: 21;
    readonly InvalidArrangementGrowth: 22;
    readonly InvalidModulationTiming: 23;
};
export type ConfigErrorCode = (typeof ConfigError)[keyof typeof ConfigError];
/**
 * Custom error class for MidiSketch configuration errors
 */
export declare class MidiSketchConfigError extends Error {
    /** Numeric error code */
    readonly code: ConfigErrorCode;
    /** Human-readable error message from native library */
    readonly nativeMessage: string;
    constructor(code: number, nativeMessage: string);
}
/**
 * Custom error class for MidiSketch generation errors
 */
export declare class MidiSketchGenerationError extends Error {
    /** Numeric error code */
    readonly code: number;
    constructor(code: number, message: string);
}
export declare const VocalAttitude: {
    readonly Clean: 0;
    readonly Expressive: 1;
    readonly Raw: 2;
};
export declare const CompositionStyle: {
    readonly MelodyLead: 0;
    readonly BackgroundMotif: 1;
    readonly SynthDriven: 2;
};
export declare const ATTITUDE_CLEAN: number;
export declare const ATTITUDE_EXPRESSIVE: number;
export declare const ATTITUDE_RAW: number;
export declare const ModulationTiming: {
    readonly None: 0;
    readonly LastChorus: 1;
    readonly AfterBridge: 2;
    readonly EachChorus: 3;
    readonly Random: 4;
};
export declare const IntroChant: {
    readonly None: 0;
    readonly Gachikoi: 1;
    readonly Shouting: 2;
};
export declare const MixPattern: {
    readonly None: 0;
    readonly Standard: 1;
    readonly Tiger: 2;
};
export declare const CallDensity: {
    readonly None: 0;
    readonly Minimal: 1;
    readonly Standard: 2;
    readonly Intense: 3;
};
export declare const ArrangementGrowth: {
    readonly LayerAdd: 0;
    readonly RegisterAdd: 1;
};
export declare const MotifRepeatScope: {
    readonly FullSong: 0;
    readonly Section: 1;
};
export declare const MelodicComplexity: {
    readonly Simple: 0;
    readonly Standard: 1;
    readonly Complex: 2;
};
export declare const HookIntensity: {
    readonly Off: 0;
    readonly Light: 1;
    readonly Normal: 2;
    readonly Strong: 3;
};
export declare const VocalGrooveFeel: {
    readonly Straight: 0;
    readonly OffBeat: 1;
    readonly Swing: 2;
    readonly Syncopated: 3;
    readonly Driving16th: 4;
    readonly Bouncy8th: 5;
};
export declare const VocalStylePreset: {
    readonly Auto: 0;
    readonly Standard: 1;
    readonly Vocaloid: 2;
    readonly UltraVocaloid: 3;
    readonly Idol: 4;
    readonly Ballad: 5;
    readonly Rock: 6;
    readonly CityPop: 7;
    readonly Anime: 8;
    readonly BrightKira: 9;
    readonly CoolSynth: 10;
    readonly CuteAffected: 11;
    readonly PowerfulShout: 12;
};
//# sourceMappingURL=constants.d.ts.map
// From blueprint.ts
/**
 * Production Blueprint API
 */
/**
 * Generation paradigm for blueprint
 */
export declare const GenerationParadigm: {
    /** Existing behavior */
    readonly Traditional: 0;
    /** Orangestar style (rhythm-synced) */
    readonly RhythmSync: 1;
    /** YOASOBI style (melody-driven) */
    readonly MelodyDriven: 2;
};
export type GenerationParadigmType = (typeof GenerationParadigm)[keyof typeof GenerationParadigm];
/**
 * Riff policy for blueprint
 */
export declare const RiffPolicy: {
    /** Free variation per section */
    readonly Free: 0;
    /** Pitch contour fixed, expression variable (recommended) */
    readonly LockedContour: 1;
    /** Pitch completely fixed, velocity variable */
    readonly LockedPitch: 2;
    /** Completely fixed (monotonous, not recommended) */
    readonly LockedAll: 3;
    /** Gradual evolution with variations */
    readonly Evolving: 4;
    /** Alias for LockedContour (backward compatibility) */
    readonly Locked: 1;
};
export type RiffPolicyType = (typeof RiffPolicy)[keyof typeof RiffPolicy];
/**
 * Blueprint information
 */
export interface BlueprintInfo {
    /** Blueprint ID (0-3) */
    id: number;
    /** Blueprint name */
    name: string;
    /** Generation paradigm */
    paradigm: GenerationParadigmType;
    /** Riff policy */
    riffPolicy: RiffPolicyType;
    /** Selection weight (0-100) */
    weight: number;
}
/**
 * Get number of available blueprints
 */
export declare function getBlueprintCount(): number;
/**
 * Get blueprint name by ID
 * @param id Blueprint ID (0-3)
 */
export declare function getBlueprintName(id: number): string;
/**
 * Get blueprint paradigm by ID
 * @param id Blueprint ID (0-3)
 */
export declare function getBlueprintParadigm(id: number): GenerationParadigmType;
/**
 * Get blueprint riff policy by ID
 * @param id Blueprint ID (0-3)
 */
export declare function getBlueprintRiffPolicy(id: number): RiffPolicyType;
/**
 * Get blueprint weight by ID
 * @param id Blueprint ID (0-3)
 */
export declare function getBlueprintWeight(id: number): number;
/**
 * Get all blueprints as an array
 */
export declare function getBlueprints(): BlueprintInfo[];
//# sourceMappingURL=blueprint.d.ts.map
// From presets.ts
/**
 * Preset retrieval functions
 */
/**
 * Get structure presets
 */
export declare function getStructures(): PresetInfo[];
/**
 * Get mood presets
 */
export declare function getMoods(): PresetInfo[];
/**
 * Get chord progression presets
 */
export declare function getChords(): PresetInfo[];
/**
 * Get style presets
 */
export declare function getStylePresets(): StylePresetInfo[];
/**
 * Get chord progressions compatible with a style
 */
export declare function getProgressionsByStyle(styleId: number): number[];
/**
 * Get forms compatible with a style
 */
export declare function getFormsByStyle(styleId: number): number[];
//# sourceMappingURL=presets.d.ts.map
// From internal.ts
/**
 * Internal WASM module bindings and initialization
 * @internal
 */
export interface EmscriptenModule {
    cwrap: (name: string, returnType: string | null, argTypes: string[]) => (...args: unknown[]) => unknown;
    UTF8ToString: (ptr: number) => string;
    HEAPU8: Uint8Array;
    HEAPU32: Uint32Array;
}
export interface Api {
    create: () => number;
    destroy: (handle: number) => void;
    getMidi: (handle: number) => number;
    freeMidi: (ptr: number) => void;
    getEvents: (handle: number) => number;
    freeEvents: (ptr: number) => void;
    structureCount: () => number;
    moodCount: () => number;
    chordCount: () => number;
    structureName: (id: number) => string;
    moodName: (id: number) => string;
    chordName: (id: number) => string;
    chordDisplay: (id: number) => string;
    moodDefaultBpm: (id: number) => number;
    version: () => string;
    stylePresetCount: () => number;
    stylePresetName: (id: number) => string;
    stylePresetDisplayName: (id: number) => string;
    stylePresetDescription: (id: number) => string;
    stylePresetTempoDefault: (id: number) => number;
    stylePresetAllowedAttitudes: (id: number) => number;
    getProgressionsByStylePtr: (styleId: number) => number;
    getFormsByStylePtr: (styleId: number) => number;
    configErrorString: (error: number) => string;
    generateAccompaniment: (handle: number) => number;
    regenerateAccompaniment: (handle: number, seed: number) => number;
    getPianoRollSafety: (handle: number, startTick: number, endTick: number, step: number) => number;
    getPianoRollSafetyAt: (handle: number, tick: number) => number;
    getPianoRollSafetyWithContext: (handle: number, tick: number, prevPitch: number) => number;
    freePianoRollData: (ptr: number) => void;
    reasonToString: (reason: number) => string;
    generateFromJson: (handle: number, json: string, length: number) => number;
    createDefaultConfigJson: (styleId: number) => string;
    validateConfigJson: (json: string, length: number) => number;
    generateVocalFromJson: (handle: number, json: string, length: number) => number;
    generateWithVocalFromJson: (handle: number, json: string, length: number) => number;
    regenerateVocalFromJson: (handle: number, json: string, length: number) => number;
    generateAccompanimentFromJson: (handle: number, json: string, length: number) => number;
    regenerateAccompanimentFromJson: (handle: number, json: string, length: number) => number;
    setVocalNotesFromJson: (handle: number, json: string, length: number) => number;
    blueprintCount: () => number;
    blueprintName: (id: number) => string;
    blueprintParadigm: (id: number) => number;
    blueprintRiffPolicy: (id: number) => number;
    blueprintWeight: (id: number) => number;
    getResolvedBlueprintId: (handle: number) => number;
}
/**
 * Get the WASM module instance
 * @throws Error if module not initialized
 * @internal
 */
export declare function getModule(): EmscriptenModule;
/**
 * Get the API bindings
 * @throws Error if module not initialized
 * @internal
 */
export declare function getApi(): Api;
/**
 * Initialize the WASM module
 */
export declare function init(options?: {
    wasmPath?: string;
}): Promise<void>;
//# sourceMappingURL=internal.d.ts.map
// From config.ts
/**
 * Configuration utilities for SongConfig
 */
/**
 * Create a default song config for a style (JSON API)
 */
export declare function createDefaultConfig(styleId: number): SongConfig;
/**
 * Validate a song config before generation (JSON API).
 * Returns the error code (0 = OK, non-zero = error).
 * Use getConfigErrorMessage() to get human-readable error message.
 */
export declare function validateConfig(config: SongConfig): ConfigErrorCode;
/**
 * Get human-readable error message for a config error code.
 */
export declare function getConfigErrorMessage(errorCode: ConfigErrorCode): string;
//# sourceMappingURL=config.d.ts.map
// From builder.ts
/**
 * SongConfigBuilder - Fluent API for building SongConfig with cascade detection
 */
/**
 * Category of parameter changes
 */
export type ParameterCategory = 'paradigm' | 'riffPolicy' | 'drums' | 'motif' | 'bpm' | 'hook' | 'vocal' | 'trackEnable' | 'arpeggio' | 'chord' | 'modulation' | 'call' | 'basic';
/**
 * Information about a single parameter change
 */
export interface ParameterChange {
    /** Category of the change */
    category: ParameterCategory;
    /** Field name that was changed */
    field: string;
    /** Previous value */
    oldValue: unknown;
    /** New value */
    newValue: unknown;
    /** Reason for the change */
    reason: string;
}
/**
 * Result of a configuration change
 */
export interface ParameterChangeResult {
    /** Number of fields that changed */
    changedCount: number;
    /** Categories of changes */
    changedCategories: ParameterCategory[];
    /** Detailed list of changes */
    changes: ParameterChange[];
    /** Warning messages */
    warnings: string[];
}
/**
 * Builder for SongConfig with fluent API and cascade change detection.
 *
 * @example
 * ```typescript
 * const builder = new SongConfigBuilder(0)
 *   .setBpm(165)
 *   .setBlueprint(1)
 *   .setSeed(12345);
 *
 * // Check what changed
 * const changes = builder.getLastChangeResult();
 * if (changes) {
 *   console.log('Auto-changes:', changes.changes);
 * }
 *
 * // Generate
 * sketch.generateFromBuilder(builder);
 * ```
 */
export declare class SongConfigBuilder {
    private config;
    private explicitFields;
    private lastChangeResult;
    /**
     * Create a new builder with default config for the given style
     * @param styleId Style preset ID (0-12)
     */
    constructor(styleId?: number);
    /**
     * Get the result of the last change operation
     */
    getLastChangeResult(): ParameterChangeResult | null;
    /**
     * Get list of explicitly set field names
     */
    getExplicitFields(): string[];
    /**
     * Get list of fields that would be derived/auto-set
     */
    getDerivedFields(): string[];
    /**
     * Build and return the SongConfig
     */
    build(): SongConfig;
    /**
     * Reset all settings to defaults
     * @param styleId Optional new style ID (defaults to current)
     */
    reset(styleId?: number): this;
    /**
     * Reset to defaults but keep explicitly set values
     * @param styleId Optional new style ID (defaults to current)
     */
    resetKeepExplicit(styleId?: number): this;
    /**
     * Set random seed
     * @param seed Seed value (0 = random)
     */
    setSeed(seed: number): this;
    /**
     * Set key
     * @param key Key (0-11, 0=C, 1=C#, etc.)
     */
    setKey(key: number): this;
    /**
     * Set chord progression
     * @param id Chord progression ID
     */
    setChordProgression(id: number): this;
    /**
     * Set form/structure pattern
     * @param id Form ID
     */
    setForm(id: number): this;
    /**
     * Set vocal range
     * @param low Lower MIDI note bound
     * @param high Upper MIDI note bound
     */
    setVocalRange(low: number, high: number): this;
    /**
     * Set vocal style preset with cascade detection
     *
     * Idol-style vocalStyles (4=Idol, 9=BrightKira, 11=CuteAffected) will
     * auto-enable call system if callEnabled is not explicitly set.
     *
     * @param style Vocal style ID (0=Auto, 1=Standard, 2=Vocaloid, etc.)
     */
    setVocalStyle(style: number): this;
    /**
     * Set vocal attitude
     * @param attitude 0=Clean, 1=Expressive, 2=Raw
     */
    setVocalAttitude(attitude: number): this;
    /**
     * Set humanization settings
     * @param enabled Enable humanization
     * @param timing Timing variation (0-100)
     * @param velocity Velocity variation (0-100)
     */
    setHumanize(enabled: boolean, timing?: number, velocity?: number): this;
    /**
     * Set modulation settings with validation
     *
     * Warning: If timing≠0 and semitones=0, validation will fail.
     * When modulation is enabled, semitones must be 1-4.
     *
     * @param timing Modulation timing (0=None, 1=LastChorus, 2=AfterBridge, 3=EachChorus, 4=Random)
     * @param semitones Modulation amount (+1 to +4), required when timing≠0
     */
    setModulation(timing: number, semitones?: number): this;
    /**
     * Set chord extension settings
     * @param opts Chord extension options
     */
    setChordExtensions(opts: {
        sus?: boolean;
        seventh?: boolean;
        ninth?: boolean;
        susProb?: number;
        seventhProb?: number;
        ninthProb?: number;
    }): this;
    /**
     * Set arpeggio settings
     * @param enabled Enable arpeggio
     * @param opts Arpeggio options
     */
    setArpeggio(enabled: boolean, opts?: {
        pattern?: number;
        speed?: number;
        octaveRange?: number;
        gate?: number;
        syncChord?: boolean;
    }): this;
    /**
     * Set motif settings
     * @param opts Motif options
     */
    setMotif(opts: {
        repeatScope?: number;
        fixedProgression?: boolean;
        maxChordCount?: number;
    }): this;
    /**
     * Set call/SE settings
     * @param opts Call options
     */
    setCall(opts: {
        enabled?: boolean;
        notesEnabled?: boolean;
        density?: number;
        introChant?: number;
        mixPattern?: number;
        seEnabled?: boolean;
    }): this;
    /**
     * Set melodic complexity
     * @param complexity 0=Simple, 1=Standard, 2=Complex
     */
    setMelodicComplexity(complexity: number): this;
    /**
     * Set hook intensity
     * @param intensity 0=Off, 1=Light, 2=Normal, 3=Strong
     */
    setHookIntensity(intensity: number): this;
    /**
     * Set vocal groove feel
     * @param groove 0=Straight, 1=OffBeat, 2=Swing, 3=Syncopated, 4=Driving16th, 5=Bouncy8th
     */
    setVocalGroove(groove: number): this;
    /**
     * Set melody template
     * @param template 0=Auto, 1=PlateauTalk, 2=RunUpTarget, etc.
     */
    setMelodyTemplate(template: number): this;
    /**
     * Set arrangement growth
     * @param growth 0=LayerAdd, 1=RegisterAdd
     */
    setArrangementGrowth(growth: number): this;
    /**
     * Set target duration
     * @param seconds Target duration in seconds (0 = use formId)
     */
    setTargetDuration(seconds: number): this;
    /**
     * Skip vocal generation
     * @param skip Whether to skip vocal generation
     */
    setSkipVocal(skip: boolean): this;
    /**
     * Set drive feel
     * @param feel 0=laid-back, 50=neutral, 100=aggressive
     */
    setDriveFeel(feel: number): this;
    /**
     * Set addictive mode (Behavioral Loop)
     * @param enabled Enable addictive mode
     */
    setAddictiveMode(enabled: boolean): this;
    /**
     * Set mora rhythm mode
     * @param mode 0=Standard, 1=MoraTimed, 2=Auto
     */
    setMoraRhythmMode(mode: number): this;
    /**
     * Set mood override
     * @param mood Mood preset ID (0-23)
     */
    setMood(mood: number): this;
    /**
     * Set form explicit mode (use formId exactly, no randomization)
     * @param explicit Whether formId should be used exactly
     */
    setFormExplicit(explicit: boolean): this;
    /**
     * Set blueprint with cascade detection
     *
     * Setting a blueprint may automatically change:
     * - drumsEnabled (if blueprint requires drums: ID 1,5,6,7)
     * - hookIntensity (BehavioralLoop forces Maximum)
     * - BPM clamping for RhythmSync paradigm
     *
     * Blueprint drums_required: IDs 1 (RhythmLock), 5 (IdolHyper), 6 (IdolKawaii), 7 (IdolCoolPop)
     * BehavioralLoop (ID 9): Forces HookIntensity=Maximum, RiffPolicy=LockedPitch
     *
     * @param id Blueprint ID (0-9, 255=random)
     */
    setBlueprint(id: number): this;
    /**
     * Set BPM with cascade detection
     *
     * For RhythmSync blueprints, warns if BPM is outside 160-175 range.
     * C++ respects explicit BPM and skips clamping.
     *
     * @param bpm BPM value (0 = use style default)
     */
    setBpm(bpm: number): this;
    /**
     * Set composition style with cascade detection
     *
     * Setting composition style may automatically change:
     * - skipVocal (for BackgroundMotif/SynthDriven)
     * - arpeggioEnabled (for SynthDriven)
     *
     * @param style 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven
     */
    setCompositionStyle(style: number): this;
    /**
     * Set style preset with cascade detection
     *
     * Changing style preset resets mood, chord, form, bpm to style defaults.
     *
     * @param id Style preset ID (0-12)
     */
    setStylePreset(id: number): this;
    /**
     * Set drums enabled with cascade detection
     *
     * Disabling drums may trigger warnings for blueprints that require drums.
     *
     * @param enabled Whether drums are enabled
     */
    setDrums(enabled: boolean): this;
    private setConfigValue;
    private setField;
}
//# sourceMappingURL=builder.d.ts.map
// From midi-sketch.ts
/**
 * MidiSketch class for MIDI generation
 */
/**
 * MidiSketch instance for MIDI generation
 */
export declare class MidiSketch {
    private handle;
    constructor();
    /**
     * Handle a generation result code, throwing appropriate errors.
     * For methods that accept a full config JSON (result===1 triggers validation).
     */
    private handleGenerationResult;
    /**
     * Throw a generation error with a resolved error message.
     * For methods that don't take a full config JSON.
     */
    private throwGenerationError;
    /**
     * Generate MIDI from a SongConfig
     * @throws {MidiSketchConfigError} If config validation fails
     * @throws {MidiSketchGenerationError} If generation fails for other reasons
     */
    generateFromConfig(config: SongConfig): void;
    /**
     * Generate MIDI from a SongConfigBuilder
     *
     * @param builder The SongConfigBuilder instance
     * @throws {MidiSketchConfigError} If config validation fails
     * @throws {MidiSketchGenerationError} If generation fails for other reasons
     *
     * @example
     * ```typescript
     * const builder = new SongConfigBuilder(0)
     *   .setBpm(120)
     *   .setBlueprint(1)
     *   .setSeed(12345);
     *
     * sketch.generateFromBuilder(builder);
     * ```
     */
    generateFromBuilder(builder: SongConfigBuilder): void;
    /**
     * Generate only the vocal track without accompaniment.
     * Use for trial-and-error workflow: generate vocal, listen, regenerate if needed.
     * Call generateAccompaniment() when satisfied with the vocal.
     * @throws {MidiSketchConfigError} If config validation fails
     * @throws {MidiSketchGenerationError} If generation fails
     */
    generateVocal(config: SongConfig): void;
    /**
     * Regenerate vocal track with new configuration or seed.
     * Keeps the same chord progression and structure.
     * @param configOrSeed VocalConfig object or seed number (default: 0 = new random)
     * @throws {MidiSketchGenerationError} If regeneration fails
     */
    regenerateVocal(configOrSeed?: VocalConfig | number): void;
    /**
     * Generate accompaniment tracks for existing vocal.
     * Must be called after generateVocal() or generateWithVocal().
     * Generates: Aux -> Bass -> Chord -> Drums (adapting to vocal).
     * @param config Optional accompaniment configuration
     * @throws {MidiSketchGenerationError} If generation fails
     */
    generateAccompaniment(config?: AccompanimentConfig): void;
    /**
     * Regenerate accompaniment tracks with a new seed or configuration.
     * Keeps current vocal, regenerates all accompaniment tracks
     * (Aux, Bass, Chord, Drums, etc.) with the specified seed/config.
     * Must have existing vocal (call generateVocal() first).
     * @param seedOrConfig Random seed (0 = auto-generate) or AccompanimentConfig
     * @throws {MidiSketchGenerationError} If regeneration fails
     */
    regenerateAccompaniment(seedOrConfig?: number | AccompanimentConfig): void;
    /**
     * Generate all tracks with vocal-first priority.
     * Generation order: Vocal -> Aux -> Bass -> Chord -> Drums.
     * Accompaniment adapts to vocal melody.
     * @throws {MidiSketchConfigError} If config validation fails
     * @throws {MidiSketchGenerationError} If generation fails
     */
    generateWithVocal(config: SongConfig): void;
    /**
     * Set custom vocal notes for accompaniment generation.
     *
     * Initializes the song structure and chord progression from config,
     * then replaces the vocal track with the provided notes.
     * Call generateAccompaniment() after this to generate
     * accompaniment tracks that fit the custom vocal melody.
     *
     * @param config Song configuration (for structure/chord setup)
     * @param notes Array of note inputs representing the custom vocal
     * @throws {MidiSketchConfigError} If config validation fails
     * @throws {MidiSketchGenerationError} If operation fails
     *
     * @example
     * ```typescript
     * // Set custom vocal notes
     * sketch.setVocalNotes(config, [
     *   { startTick: 0, duration: 480, pitch: 60, velocity: 100 },
     *   { startTick: 480, duration: 480, pitch: 62, velocity: 100 },
     * ]);
     *
     * // Generate accompaniment for the custom vocal
     * sketch.generateAccompaniment();
     *
     * // Get the MIDI data
     * const midi = sketch.getMidi();
     * ```
     */
    setVocalNotes(config: SongConfig, notes: NoteInput[]): void;
    /**
     * Get the generated MIDI data
     */
    getMidi(): Uint8Array;
    /**
     * Get the event data as a parsed object
     */
    getEvents(): EventData;
    /**
     * Get piano roll safety info for a single tick.
     *
     * Returns safety level, reason flags, and collision info for each MIDI note (0-127).
     * Use this before placing custom vocal notes to see which notes are safe.
     *
     * @param tick Tick position to query
     * @param prevPitch Previous note pitch for leap detection (optional, 255 if none)
     * @returns Piano roll safety info for all 128 MIDI notes
     *
     * @example
     * ```typescript
     * // Get safety info at tick 0
     * const info = sketch.getPianoRollSafetyAt(0);
     *
     * // Check if C4 (pitch 60) is safe
     * if (info.safety[60] === NoteSafety.Safe) {
     *   console.log('C4 is a chord tone, safe to use');
     * }
     *
     * // Get recommended notes
     * console.log('Recommended:', info.recommended);
     * ```
     */
    getPianoRollSafetyAt(tick: number, prevPitch?: number): PianoRollInfo;
    /**
     * Get piano roll safety info for a range of ticks.
     *
     * Useful for visualizing safe notes over time in a piano roll editor.
     *
     * @param startTick Start tick
     * @param endTick End tick
     * @param step Step size in ticks (e.g., 120 for 16th notes, 480 for quarter notes)
     * @returns Array of piano roll safety info for each step
     *
     * @example
     * ```typescript
     * // Get safety info for first 4 bars, sampled at 16th note resolution
     * const infos = sketch.getPianoRollSafety(0, 1920 * 4, 120);
     *
     * for (const info of infos) {
     *   console.log(`Tick ${info.tick}: chord degree ${info.chordDegree}`);
     *   console.log('Recommended notes:', info.recommended);
     * }
     * ```
     */
    getPianoRollSafety(startTick: number, endTick: number, step: number): PianoRollInfo[];
    /**
     * Convert reason flags to human-readable string.
     *
     * @param reason Reason flags from PianoRollInfo
     * @returns Human-readable string like "ChordTone" or "LowRegister, Tritone"
     */
    reasonToString(reason: NoteReasonFlags): string;
    /**
     * Parse MidiSketchPianoRollInfo from WASM memory.
     * @internal
     */
    private parsePianoRollInfo;
    /**
     * Get the resolved blueprint ID after generation.
     *
     * Returns the actual blueprint ID used for generation.
     * If blueprintId was set to 255 (random), this returns the selected ID.
     *
     * @returns Resolved blueprint ID (0-3), or 255 if not generated
     */
    getResolvedBlueprintId(): number;
    /**
     * Destroy the instance and free resources
     */
    destroy(): void;
}
export default MidiSketch;
//# sourceMappingURL=midi-sketch.d.ts.map
// From utils.ts
/**
 * Utility functions for midi-sketch
 */
/**
 * Get library version
 */
export declare function getVersion(): string;
/**
 * Download MIDI data as a file (browser only)
 */
export declare function downloadMidi(midiData: Uint8Array, filename?: string): void;
//# sourceMappingURL=utils.d.ts.map
