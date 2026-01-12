/**
 * midi-sketch - MIDI Auto-Generation Library
 *
 * @example
 * ```typescript
 * import { MidiSketch, init, createDefaultConfig } from '@libraz/midi-sketch';
 *
 * await init();
 * const sketch = new MidiSketch();
 * const config = createDefaultConfig(0);
 * sketch.generateFromConfig(config);
 * const midiData = sketch.getMidi();
 * ```
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
    /** Enable arpeggio */
    arpeggioEnabled: boolean;
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
    /** Enable call feature */
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
    /** Sus probability: 0-100 */
    chordExtSusProb?: number;
    /** 7th probability: 0-100 */
    chordExt7thProb?: number;
    /** 9th probability: 0-100 */
    chordExt9thProb?: number;
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
/**
 * Initialize the WASM module
 */
export declare function init(options?: {
    wasmPath?: string;
}): Promise<void>;
/**
 * Get library version
 */
export declare function getVersion(): string;
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
/**
 * Create a default song config for a style
 */
export declare function createDefaultConfig(styleId: number): SongConfig;
/**
 * Validate a song config before generation.
 * Returns the error code (0 = OK, non-zero = error).
 * Use getConfigErrorMessage() to get human-readable error message.
 */
export declare function validateConfig(config: SongConfig): ConfigErrorCode;
/**
 * Get human-readable error message for a config error code.
 */
export declare function getConfigErrorMessage(errorCode: ConfigErrorCode): string;
/**
 * MidiSketch instance for MIDI generation
 */
export declare class MidiSketch {
    private handle;
    constructor();
    /**
     * Generate MIDI from a SongConfig
     * @throws {MidiSketchConfigError} If config validation fails
     * @throws {MidiSketchGenerationError} If generation fails for other reasons
     */
    generateFromConfig(config: SongConfig): void;
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
     * Generates: Aux → Bass → Chord → Drums (adapting to vocal).
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
     * Allocate and populate AccompanimentConfig in WASM memory.
     */
    private allocAccompanimentConfig;
    /**
     * Generate all tracks with vocal-first priority.
     * Generation order: Vocal → Aux → Bass → Chord → Drums.
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
     * Allocate and populate NoteInput array in WASM memory.
     */
    private allocNoteInputArray;
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
     * Destroy the instance and free resources
     */
    destroy(): void;
    private allocSongConfig;
    private allocVocalConfig;
}
/**
 * Download MIDI data as a file (browser only)
 */
export declare function downloadMidi(midiData: Uint8Array, filename?: string): void;
export default MidiSketch;
//# sourceMappingURL=index.d.ts.map