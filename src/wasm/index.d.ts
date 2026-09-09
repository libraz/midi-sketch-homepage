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
interface SongConfig {
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
    /** Blueprint ID: 0=Traditional, 1=RhythmLock, 2=StoryPop, 3=Ballad, 255=random */
    blueprintId: number;
    /** Enable arpeggio */
    arpeggioEnabled: boolean;
    /** Enable guitar track */
    guitarEnabled: boolean;
    /** Arpeggio pattern: 0=Up, 1=Down, 2=UpDown, 3=Random, 4=Pinwheel, 5=PedalRoot, 6=Alberti, 7=BrokenChord, 255=Auto (default) */
    arpeggioPattern: number;
    /** Arpeggio speed: 0=Eighth, 1=Sixteenth, 2=Triplet, 255=Auto (default) */
    arpeggioSpeed: number;
    /** Arpeggio octave range (1-3) */
    arpeggioOctaveRange: number;
    /** Arpeggio gate length (0.0-1.0), or -1 for the style default (default) */
    arpeggioGate: number;
    /** Vocal range lower bound (MIDI note) */
    vocalLow: number;
    /** Vocal range upper bound (MIDI note) */
    vocalHigh: number;
    /** Skip vocal generation (for BGM-first workflow) */
    skipVocal: boolean;
    /** Enable humanization */
    humanize: boolean;
    /** Timing variation (0.0-1.0) */
    humanizeTiming: number;
    /** Velocity variation (0.0-1.0) */
    humanizeVelocity: number;
    /** Enable sus2/sus4 chords */
    chordExtSus: boolean;
    /** Enable 7th chords */
    chordExt7th: boolean;
    /** Enable 9th chords */
    chordExt9th: boolean;
    /** Enable tritone substitution (V7 -> bII7) */
    chordExtTritoneSub: boolean;
    /** Sus chord probability (0.0-1.0) */
    chordExtSusProb: number;
    /** 7th chord probability (0.0-1.0) */
    chordExt7thProb: number;
    /** 9th chord probability (0.0-1.0) */
    chordExt9thProb: number;
    /** Tritone substitution probability (0.0-1.0) */
    chordExtTritoneSubProb: number;
    /** Composition style: 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven */
    compositionStyle: number;
    /** True when compositionStyle should override the style preset. */
    compositionStyleExplicit: boolean;
    /** Target duration in seconds (0 = use formId) */
    targetDurationSeconds: number;
    /** Modulation timing: 0=None, 1=LastChorus, 2=AfterBridge, 3=EachChorus, 4=Random */
    modulationTiming: number;
    /** Modulation semitones (+1 to +4) */
    modulationSemitones: number;
    /** Enable SE track */
    seEnabled: boolean;
    /** Call setting: 0=Auto, 1=Enabled, 2=Disabled. Source of truth for call state. */
    callSetting?: number;
    /**
     * Enable call feature (legacy boolean view of callSetting).
     * Deprecated for config state; use callSetting for the Auto/Enabled/Disabled distinction.
     * Derived as: Enabled(1) -> true, Disabled(2) -> false, Auto(0) -> undefined.
     */
    callEnabled?: boolean;
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
    /** Base velocity for arpeggio notes (0-127, default=90) */
    arpeggioBaseVelocity: number;
    /** Motif repeat scope: 0=FullSong, 1=Section */
    motifRepeatScope: number;
    /** Max chord count (0=no limit, 2-8) */
    motifMaxChordCount: number;
    /** Melodic complexity: 0=Simple, 1=Standard, 2=Complex */
    melodicComplexity: number;
    /** Hook intensity: 0=Off, 1=Light, 2=Normal, 3=Strong, 4=Maximum */
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
    /** Syllabic subdivision rate: 0=style default, 1-100=override % */
    syllabicSubRate?: number;
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
    /** Motif length: 0=auto, 1/2/4 bars */
    motifLength: number;
    /** Motif note count: 0=auto, 3-8 */
    motifNoteCount: number;
    /** Motif motion: 0xFF=preset, 0-5=override (0=Stepwise..5=Ostinato) */
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
interface NoteInput {
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
 * Serializable vocal melody returned by MidiSketch.getMelody().
 */
interface MelodyData {
    /** Random seed used to generate the melody */
    seed: number;
    /** Vocal notes in playback order */
    notes: NoteInput[];
}
/**
 * Vocal regeneration configuration
 */
interface VocalConfig {
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
    /** Hook intensity: 0=Off, 1=Light, 2=Normal, 3=Strong, 4=Maximum */
    hookIntensity?: number;
    /** Vocal groove feel: 0=Straight, 1=OffBeat, 2=Swing, etc. */
    vocalGroove?: number;
    /** Composition style: 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven */
    compositionStyle?: number;
    /** RhythmSync: keep existing Motif as coordinate axis (default: regenerate both) */
    keepMotif?: boolean;
}
/**
 * Configuration for accompaniment generation/regeneration.
 */
interface AccompanimentConfig {
    /** Random seed for BGM (0 = auto-generate) */
    seed?: number;
    /** Enable drums */
    drumsEnabled?: boolean;
    /** Enable arpeggio */
    arpeggioEnabled?: boolean;
    /** Enable guitar track */
    guitarEnabled?: boolean;
    /** Arpeggio pattern: 0=Up, 1=Down, 2=UpDown, 3=Random, 4=Pinwheel, 5=PedalRoot, 6=Alberti, 7=BrokenChord */
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
    /** Sus probability: 0.0-1.0 */
    chordExtSusProb?: number;
    /** 7th probability: 0.0-1.0 */
    chordExt7thProb?: number;
    /** 9th probability: 0.0-1.0 */
    chordExt9thProb?: number;
    /** Tritone substitution probability: 0.0-1.0 */
    chordExtTritoneSubProb?: number;
    /** Enable humanization */
    humanize?: boolean;
    /** Timing variation: 0.0-1.0 */
    humanizeTiming?: number;
    /** Velocity variation: 0.0-1.0 */
    humanizeVelocity?: number;
    /** Enable SE track */
    seEnabled?: boolean;
    /** Enable call system */
    callEnabled?: boolean;
    /** Call density: 0=None, 1=Minimal, 2=Standard, 3=Intense. None emits no calls. */
    callDensity?: number;
    /** Intro chant: 0=None, 1=Gachikoi, 2=Shouting */
    introChant?: number;
    /** Mix pattern: 0=None, 1=Standard, 2=Tiger */
    mixPattern?: number;
    /** Output call as MIDI notes */
    callNotesEnabled?: boolean;
}
/**
 * Note safety level for piano roll visualization
 */
declare const NoteSafety: {
    /** Green: chord tone, safe to use */
    readonly Safe: 0;
    /** Yellow: tension, low register, or passing tone */
    readonly Warning: 1;
    /** Red: dissonant or out of range */
    readonly Dissonant: 2;
};
type NoteSafetyLevel = (typeof NoteSafety)[keyof typeof NoteSafety];
/**
 * Reason flags for note safety (bitfield, can be combined)
 */
declare const NoteReason: {
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
type NoteReasonFlags = number;
/**
 * Collision info for a note that collides with BGM
 */
interface CollisionInfo {
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
interface PianoRollInfo {
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
interface PresetInfo {
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
interface StylePresetInfo {
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
 * Chord event from generation (includes secondary dominants)
 */
interface ChordEvent {
    /** Start tick */
    tick: number;
    /** End tick */
    endTick: number;
    /** Scale degree (0-6) */
    degree: number;
    /** Whether this is a secondary dominant (V/x) */
    isSecondaryDominant: boolean;
}
/**
 * Event data from generation
 */
/**
 * Dissonance analysis result returned by MidiSketch.getDissonanceReport().
 *
 * Pitches are the ones the generator reasoned about, which is a key of C. The
 * summary states the offset to the key the song sounds in:
 * `sounding = pitch + key + (modulation_tick > 0 && tick >= modulation_tick ?
 * modulation_amount : 0)`.
 */
interface DissonanceReport {
    summary: {
        total_issues: number;
        simultaneous_clashes: number;
        non_chord_tones: number;
        sustained_over_chord_change: number;
        non_diatonic_notes: number;
        high_severity: number;
        medium_severity: number;
        low_severity: number;
        /** Key the song sounds in, as a semitone offset from the reported pitches. */
        key: number;
        /** Name of that key, e.g. "E major". */
        key_name: string;
        modulation_tick: number;
        modulation_amount: number;
        pre_modulation_issues: number;
        post_modulation_issues: number;
    };
    issues: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high';
        tick: number;
        bar: number;
        beat: number;
        [key: string]: unknown;
    }>;
}
interface EventData {
    bpm: number;
    division: number;
    duration_ticks: number;
    duration_seconds: number;
    /** Resolved vocal style preset ID. */
    vocal_style: number;
    /** Generation inputs resolved by the core. */
    metadata: {
        blueprint: number;
        style: number;
        mood: number;
        seed: number;
    };
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
        /** Text/chant events, emitted for the SE track. */
        textEvents?: Array<{
            tick: number;
            time_seconds: number;
            text: string;
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
    /** Chord timeline with secondary dominant info */
    chords?: ChordEvent[];
    /** Tempo changes, including the initial tempo event when present. */
    tempo_map: Array<{
        tick: number;
        bpm: number;
        seconds: number;
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
declare const ConfigError: {
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
    readonly InvalidBlueprint: 24;
    readonly InvalidCallSetting: 25;
    readonly InvalidEnergyCurve: 26;
    readonly InvalidDriveFeel: 27;
    readonly InvalidMoraRhythmMode: 28;
    readonly InvalidProbability: 29;
    readonly InvalidArpeggioRange: 30;
    readonly InvalidMelodyOverride: 31;
    readonly InvalidMotifOverride: 32;
    readonly InvalidJson: 33;
    readonly InvalidMood: 34;
    readonly InvalidTargetDuration: 35;
};
type ConfigErrorCode = (typeof ConfigError)[keyof typeof ConfigError];
/**
 * Custom error class for MidiSketch configuration errors
 */
declare class MidiSketchConfigError extends Error {
    /** Numeric error code */
    readonly code: ConfigErrorCode;
    /** Human-readable error message from native library */
    readonly nativeMessage: string;
    constructor(code: number, nativeMessage: string);
}
/**
 * Custom error class for MidiSketch generation errors
 */
declare class MidiSketchGenerationError extends Error {
    /** Numeric error code */
    readonly code: number;
    constructor(code: number, message: string);
}
/** MIDI file formats accepted by MidiSketch.setMidiFormat(). */
declare const MidiFormat: {
    readonly SMF1: 1;
    readonly SMF2: 2;
};
type MidiFormatType = (typeof MidiFormat)[keyof typeof MidiFormat];
declare const VocalAttitude: {
    readonly Clean: 0;
    readonly Expressive: 1;
    readonly Raw: 2;
};
declare const CompositionStyle: {
    readonly MelodyLead: 0;
    readonly BackgroundMotif: 1;
    readonly SynthDriven: 2;
};
declare const ATTITUDE_CLEAN: number;
declare const ATTITUDE_EXPRESSIVE: number;
declare const ATTITUDE_RAW: number;
declare const ModulationTiming: {
    readonly None: 0;
    readonly LastChorus: 1;
    readonly AfterBridge: 2;
    /** Falls back to a single final-chorus modulation. */
    readonly EachChorus: 3;
    readonly Random: 4;
};
declare const IntroChant: {
    readonly None: 0;
    readonly Gachikoi: 1;
    readonly Shouting: 2;
};
declare const MixPattern: {
    readonly None: 0;
    readonly Standard: 1;
    readonly Tiger: 2;
};
declare const CallDensity: {
    readonly None: 0;
    readonly Minimal: 1;
    readonly Standard: 2;
    readonly Intense: 3;
};
/** Arpeggio pattern IDs accepted by SongConfig and AccompanimentConfig. */
declare const ArpeggioPattern: {
    readonly Up: 0;
    readonly Down: 1;
    readonly UpDown: 2;
    readonly Random: 3;
    readonly Pinwheel: 4;
    readonly PedalRoot: 5;
    readonly Alberti: 6;
    readonly BrokenChord: 7;
    /** Let the mood/blueprint style pick the pattern. This is the SongConfig default. */
    readonly Auto: 255;
};
/** Arpeggio note speeds accepted by SongConfig and AccompanimentConfig. */
declare const ArpeggioSpeed: {
    readonly Eighth: 0;
    readonly Sixteenth: 1;
    readonly Triplet: 2;
    /** Let the mood/blueprint style pick the speed. This is the SongConfig default. */
    readonly Auto: 255;
};
/** Sentinel for SongConfig.arpeggioGate meaning "use the style default gate". */
declare const ARPEGGIO_GATE_AUTO = -1;
declare const ArrangementGrowth: {
    readonly LayerAdd: 0;
    readonly RegisterAdd: 1;
};
declare const MotifRepeatScope: {
    readonly FullSong: 0;
    readonly Section: 1;
};
declare const MelodicComplexity: {
    readonly Simple: 0;
    readonly Standard: 1;
    readonly Complex: 2;
};
declare const HookIntensity: {
    readonly Off: 0;
    readonly Light: 1;
    readonly Normal: 2;
    readonly Strong: 3;
    readonly Maximum: 4;
};
declare const VocalGrooveFeel: {
    readonly Straight: 0;
    readonly OffBeat: 1;
    readonly Swing: 2;
    readonly Syncopated: 3;
    readonly Driving16th: 4;
    readonly Bouncy8th: 5;
};
declare const VocalStylePreset: {
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
    readonly KPop: 13;
};
//# sourceMappingURL=constants.d.ts.map
// From blueprint.ts
/**
 * Production Blueprint API
 */
/**
 * Generation paradigm for blueprint
 */
declare const GenerationParadigm: {
    /** Existing behavior */
    readonly Traditional: 0;
    /** Rhythm-synced lead style */
    readonly RhythmSync: 1;
    /** Melody-driven story pop style */
    readonly MelodyDriven: 2;
};
type GenerationParadigmType = (typeof GenerationParadigm)[keyof typeof GenerationParadigm];
/**
 * Riff policy for blueprint
 */
declare const RiffPolicy: {
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
type RiffPolicyType = (typeof RiffPolicy)[keyof typeof RiffPolicy];
/**
 * Blueprint information
 */
interface BlueprintInfo {
    /** Blueprint ID (0-9) */
    id: number;
    /** Blueprint name */
    name: string;
    /** Generation paradigm */
    paradigm: GenerationParadigmType;
    /** Riff policy */
    riffPolicy: RiffPolicyType;
    /** Selection weight (0-100) */
    weight: number;
    /** Recommended minimum BPM */
    tempoMin: number;
    /** Recommended maximum BPM */
    tempoMax: number;
}
/**
 * Get number of available blueprints
 */
declare function getBlueprintCount(): number;
/**
 * Get blueprint name by ID
 * @param id Blueprint ID (0-9)
 */
declare function getBlueprintName(id: number): string;
/**
 * Get blueprint paradigm by ID
 * @param id Blueprint ID (0-9)
 */
declare function getBlueprintParadigm(id: number): GenerationParadigmType;
/**
 * Get blueprint riff policy by ID
 * @param id Blueprint ID (0-9)
 */
declare function getBlueprintRiffPolicy(id: number): RiffPolicyType;
/**
 * Get blueprint weight by ID
 * @param id Blueprint ID (0-9)
 */
declare function getBlueprintWeight(id: number): number;
/**
 * Whether the blueprint requires drums (drums_required constraint).
 *
 * Source of truth is the C++ blueprint table (production_blueprint.cpp),
 * exposed via midisketch_blueprint_drums_required.
 *
 * @param id Blueprint ID (0-9)
 */
declare function getBlueprintDrumsRequired(id: number): boolean;
/** Get the recommended BPM range for a blueprint. */
declare function getBlueprintTempoRange(id: number): Readonly<{
    min: number;
    max: number;
}>;
/**
 * Get all blueprints as an array
 */
declare function getBlueprints(): BlueprintInfo[];
//# sourceMappingURL=blueprint.d.ts.map
// From presets.ts
/**
 * Preset retrieval functions
 */
/**
 * Get structure presets
 */
declare function getStructures(): PresetInfo[];
/**
 * Get mood presets
 */
declare function getMoods(): PresetInfo[];
/**
 * Get chord progression presets
 */
declare function getChords(): PresetInfo[];
/**
 * Get style presets
 */
declare function getStylePresets(): StylePresetInfo[];
/**
 * Get chord progressions compatible with a style
 */
declare function getProgressionsByStyle(styleId: number): number[];
/**
 * Get forms compatible with a style
 */
declare function getFormsByStyle(styleId: number): number[];
/**
 * Whether a vocal style's arrangement expects an audience call track.
 *
 * Source of truth is `isCallEnabled` in the core (src/track/generators/se.cpp),
 * which is also what resolves `CallSetting::Auto` during generation. Exposed
 * via midisketch_vocal_style_call_enabled so a caller does not have to keep a
 * copy of the list in step with it.
 *
 * @param style Vocal style preset ID
 */
declare function isCallOrientedVocalStyle(style: number): boolean;
//# sourceMappingURL=presets.d.ts.map
// From internal.ts
/**
 * Internal WASM module bindings and initialization
 * @internal
 */
interface EmscriptenModule {
    cwrap: (name: string, returnType: string | null, argTypes: string[]) => (...args: unknown[]) => unknown;
    UTF8ToString: (ptr: number) => string;
    _malloc: (size: number) => number;
    _free: (ptr: number) => void;
    HEAPU8: Uint8Array;
    HEAPU32: Uint32Array;
}
interface Api {
    create: () => number;
    destroy: (handle: number) => void;
    setMidiFormat: (handle: number, format: number) => number;
    getMidiFormat: (handle: number) => number;
    getMidi: (handle: number) => number;
    getVocalPreviewMidi: (handle: number) => number;
    freeMidi: (ptr: number) => void;
    getEvents: (handle: number) => number;
    freeEvents: (ptr: number) => void;
    getDissonance: (handle: number) => number;
    freeDissonance: (ptr: number) => void;
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
    errorString: (error: number) => string;
    configErrorString: (error: number) => string;
    getLastConfigError: (handle: number) => number;
    generateAccompaniment: (handle: number) => number;
    regenerateAccompaniment: (handle: number, seed: number) => number;
    getPianoRollSafety: (handle: number, startTick: number, endTick: number, step: number) => number;
    getPianoRollSafetyAt: (handle: number, tick: number) => number;
    getPianoRollSafetyWithContext: (handle: number, tick: number, prevPitch: number) => number;
    freePianoRollData: (ptr: number) => void;
    getPianoRollDataCount: (ptr: number) => number;
    pianoRollDataWasTruncated: (ptr: number) => number;
    reasonToString: (reason: number) => string;
    collisionToString: (collisionPtr: number) => string;
    generateFromJson: (handle: number, json: string, length: number) => number;
    createDefaultConfigJson: (styleId: number) => string;
    validateConfigJson: (json: string, length: number) => number;
    generateVocalFromJson: (handle: number, json: string, length: number) => number;
    generateWithVocalFromJson: (handle: number, json: string, length: number) => number;
    regenerateVocalFromJson: (handle: number, json: string, length: number) => number;
    generateAccompanimentFromJson: (handle: number, json: string, length: number) => number;
    regenerateAccompanimentFromJson: (handle: number, json: string, length: number) => number;
    setVocalNotesFromJson: (handle: number, json: string, length: number) => number;
    getMelodyJson: (handle: number) => string;
    setMelodyFromJson: (handle: number, json: string, length: number) => number;
    blueprintCount: () => number;
    blueprintName: (id: number) => string;
    blueprintParadigm: (id: number) => number;
    blueprintRiffPolicy: (id: number) => number;
    blueprintWeight: (id: number) => number;
    blueprintDrumsRequired: (id: number) => number;
    vocalStyleCallEnabled: (style: number) => number;
    blueprintTempoMin: (id: number) => number;
    blueprintTempoMax: (id: number) => number;
    getResolvedBlueprintId: (handle: number) => number;
    getWarningsJson: (handle: number) => string;
}
/**
 * Get the WASM module instance
 * @throws Error if module not initialized
 * @internal
 */
declare function getModule(): EmscriptenModule;
/**
 * Get the API bindings
 * @throws Error if module not initialized
 * @internal
 */
declare function getApi(): Api;
/**
 * Initialize the WASM module
 */
declare function init(options?: {
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
declare function createDefaultConfig(styleId: number): SongConfig;
/**
 * Validate a song config before generation (JSON API).
 * Returns the error code (0 = OK, non-zero = error).
 * Use getConfigErrorMessage() to get human-readable error message.
 */
declare function validateConfig(config: SongConfig): ConfigErrorCode;
/**
 * Get human-readable error message for a config error code.
 */
declare function getConfigErrorMessage(errorCode: ConfigErrorCode): string;
//# sourceMappingURL=config.d.ts.map
// From config-fields.ts
/**
 * Field mapping table for SongConfig JSON serialization.
 *
 * Single source of truth for JS camelCase <-> C++ snake_case mapping.
 * When adding a new field: add one entry here + update SongConfig type in types.ts.
 */
interface ConfigField {
    js: keyof SongConfig;
    cpp: string;
    default: number | boolean;
    type: 'number' | 'boolean';
}
interface NestedField {
    cpp: string;
    fields: readonly ConfigField[];
}
declare const CONFIG_FIELDS: readonly ConfigField[];
/**
 * Nested SongConfig structs, by their C++ object key.
 *
 * Exported so a test can ask whether every key the core writes is one the
 * table knows about: a nested group is a key in the JSON without being a field
 * in CONFIG_FIELDS, so a check that only knows the flat list reads three of
 * them as unmapped.
 */
declare const NESTED_STRUCTS: readonly NestedField[];
declare const VOCAL_FIELDS: readonly {
    js: string;
    cpp: string;
    default: number | boolean;
    type: 'number' | 'boolean';
}[];
declare const ACCOMPANIMENT_FIELDS: readonly {
    js: string;
    cpp: string;
    default: number | boolean;
    type: 'number' | 'boolean';
}[];
/**
 * Serialize a JS VocalConfig to a C++ snake_case JSON string.
 */
declare function serializeVocalConfig(config: VocalConfig): string;
/**
 * Serialize a JS AccompanimentConfig to a C++ snake_case JSON string.
 */
declare function serializeAccompanimentConfig(config: AccompanimentConfig): string;
/**
 * Serialize a JS SongConfig to a C++ snake_case JSON string.
 */
declare function serializeConfig(config: SongConfig): string;
/**
 * Deserialize a C++ snake_case JSON string to a JS SongConfig.
 */
declare function deserializeConfig(json: string): SongConfig;
//# sourceMappingURL=config-fields.d.ts.map
// From builder.ts
/**
 * SongConfigBuilder - Fluent API for building SongConfig with cascade detection
 */
/**
 * Category of parameter changes
 */
type ParameterCategory = 'paradigm' | 'riffPolicy' | 'drums' | 'motif' | 'bpm' | 'hook' | 'vocal' | 'trackEnable' | 'arpeggio' | 'chord' | 'modulation' | 'call' | 'basic';
/**
 * Information about a single parameter change
 */
interface ParameterChange {
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
interface ParameterChangeResult {
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
declare class SongConfigBuilder {
    private config;
    private explicitFields;
    private lastChangeResult;
    /**
     * Create a new builder with default config for the given style
     * @param styleId Style preset ID (0-16)
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
     * @param id Form ID. Marks the form as explicit, preventing automatic form selection.
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
     * Call-oriented vocal styles (Idol, BrightKira, CuteAffected) auto-enable the
     * call system if callSetting/callEnabled is not explicitly set.
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
     * @param timing Timing variation (0.0-1.0; values outside the range are clamped)
     * @param velocity Velocity variation (0.0-1.0; values outside the range are clamped)
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
        tritone?: boolean;
        susProb?: number;
        seventhProb?: number;
        ninthProb?: number;
        tritoneProb?: number;
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
        baseVelocity?: number;
    }): this;
    /**
     * Set motif settings
     * @param opts Motif options
     */
    setMotif(opts: {
        repeatScope?: number;
        maxChordCount?: number;
        length?: number;
        noteCount?: number;
        motion?: number;
        registerHigh?: number;
        rhythmDensity?: number;
    }): this;
    /**
     * Set call/SE settings
     * @param opts Call options
     */
    setCall(opts: {
        enabled?: boolean;
        setting?: number;
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
     * @param intensity 0=Off, 1=Light, 2=Normal, 3=Strong, 4=Maximum
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
     * Set target duration.
     *
     * The duration has to reach between 12 and 144 bars at the resolved tempo, so the
     * accepted range in seconds depends on the BPM. A value outside it is rejected when
     * the config is validated rather than being shortened to fit, which is the same
     * answer the native CLI gives for the same config.
     *
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
    /** Set the syllabic subdivision rate (0 = style default, 1-100 = override). */
    setSyllabicSubdivisionRate(rate: number): this;
    /** Enable or disable melodic syncopation. */
    setSyncopation(enabled: boolean): this;
    /** Set the section energy curve (0=GradualBuild through 3=SteadyState). */
    setEnergyCurve(curve: number): this;
    /** Set the optional per-song melody overrides. */
    setMelodyOverrides(opts: {
        maxLeap?: number;
        syncopationProb?: number;
        phraseLength?: number;
        longNoteRatio?: number;
        chorusRegisterShift?: number;
        hookRepetition?: number;
        useLeadingTone?: number;
    }): this;
    /** Enable or disable the guitar accompaniment track. */
    setGuitar(enabled: boolean): this;
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
     * - drumsEnabled (if the blueprint has drums_required=true, per the C++
     *   blueprint table via getBlueprintDrumsRequired)
     * - hookIntensity (BehavioralLoop forces Maximum)
     * - BPM warning or auto-adjustment for RhythmSync paradigm
     *
     * BehavioralLoop (ID 9): Forces HookIntensity=Maximum, RiffPolicy=LockedPitch
     *
     * @param id Blueprint ID (0-9, 255=random)
     */
    setBlueprint(id: number): this;
    /**
     * Set BPM with cascade detection
     *
     * Warns if BPM is outside the selected blueprint's declared tempo range.
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
     * @param id Style preset ID (0-16)
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
 * Largest number of ticks a single getPianoRollSafety() call may sample.
 * Mirrors the batch cap the C API enforces.
 */
declare const MAX_PIANO_ROLL_SAMPLES = 100000;
/**
 * MidiSketch instance for MIDI generation
 */
declare class MidiSketch {
    private handle;
    constructor();
    /**
     * Handle a generation result code, throwing appropriate errors.
     * For config-backed calls, result===1 is resolved through the handle's last config error.
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
     * Select the MIDI format used by subsequent generation calls.
     *
     * The WebAssembly build currently supports SMF1 only. Selecting SMF2 throws
     * MidiSketchGenerationError instead of silently producing SMF1.
     */
    setMidiFormat(format: MidiFormatType): void;
    /** Get the selected MIDI output format. */
    getMidiFormat(): MidiFormatType;
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
     * Get the current vocal melody for saving or comparing candidates.
     *
     * The returned value can be restored later with setMelody().
     */
    getMelody(): MelodyData;
    /**
     * Restore a vocal melody previously returned by getMelody().
     */
    setMelody(melody: MelodyData): void;
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
    private readMidi;
    /** Get the generated MIDI data. */
    getMidi(): Uint8Array;
    /**
     * Get a compact vocal-practice preview containing the vocal melody and chord-root bass.
     * Generate a vocal or full song before calling this method.
     */
    getVocalPreviewMidi(): Uint8Array;
    /**
     * Get the event data as a parsed object
     */
    getEvents(): EventData;
    /**
     * Analyze the generated song for harmonic dissonance.
     */
    getDissonanceReport(): DissonanceReport;
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
     * At most {@link MAX_PIANO_ROLL_SAMPLES} samples may be requested. The limit is
     * checked against the requested range before any work happens, so an oversized
     * request costs nothing.
     *
     * @param startTick Start tick
     * @param endTick End tick (must be >= startTick)
     * @param step Step size in ticks (e.g., 120 for 16th notes, 480 for quarter notes)
     * @returns Array of piano roll safety info for each step
     * @throws {RangeError} If step is not positive, the range is inverted, or the
     *   request would exceed the sample limit
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
     * Convert collision info to human-readable string.
     *
     * @param collision Collision entry from PianoRollInfo.collision
     * @returns Human-readable string like "Bass F3 minor 2nd", or an empty
     *   string when the entry records no collision
     */
    collisionToString(collision: CollisionInfo): string;
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
     * @returns Resolved blueprint ID (0-9), or 255 if not generated
     */
    getResolvedBlueprintId(): number;
    /** Get non-fatal warnings produced by the latest generation operation. */
    getWarnings(): string[];
    /**
     * Destroy the instance and free resources
     */
    destroy(): void;
}
//# sourceMappingURL=midi-sketch.d.ts.map
// From utils.ts
/**
 * Utility functions for midi-sketch
 */
/**
 * Get library version
 */
declare function getVersion(): string;
/**
 * Download MIDI data as a file (browser only)
 */
declare function downloadMidi(midiData: Uint8Array, filename?: string): void;
//# sourceMappingURL=utils.d.ts.map
// Public surface, mirroring the re-exports of index.ts
export {
  type BlueprintInfo,
  GenerationParadigm,
  type GenerationParadigmType,
  getBlueprintCount,
  getBlueprintDrumsRequired,
  getBlueprintName,
  getBlueprintParadigm,
  getBlueprintRiffPolicy,
  getBlueprints,
  getBlueprintTempoRange,
  getBlueprintWeight,
  RiffPolicy,
  type RiffPolicyType,
  type ParameterCategory,
  type ParameterChange,
  type ParameterChangeResult,
  SongConfigBuilder,
  createDefaultConfig,
  getConfigErrorMessage,
  validateConfig,
  deserializeConfig,
  serializeAccompanimentConfig,
  serializeConfig,
  serializeVocalConfig,
  ARPEGGIO_GATE_AUTO,
  ArpeggioPattern,
  ArpeggioSpeed,
  ArrangementGrowth,
  ATTITUDE_CLEAN,
  ATTITUDE_EXPRESSIVE,
  ATTITUDE_RAW,
  CallDensity,
  CompositionStyle,
  ConfigError,
  type ConfigErrorCode,
  HookIntensity,
  IntroChant,
  MelodicComplexity,
  MidiFormat,
  type MidiFormatType,
  MidiSketchConfigError,
  MidiSketchGenerationError,
  MixPattern,
  ModulationTiming,
  MotifRepeatScope,
  VocalAttitude,
  VocalGrooveFeel,
  VocalStylePreset,
  init,
  MAX_PIANO_ROLL_SAMPLES,
  MidiSketch,
  getChords,
  getFormsByStyle,
  getMoods,
  getProgressionsByStyle,
  getStructures,
  getStylePresets,
  isCallOrientedVocalStyle,
  type AccompanimentConfig,
  type ChordEvent,
  type CollisionInfo,
  type DissonanceReport,
  type EventData,
  type MelodyData,
  type NoteInput,
  type NoteReasonFlags,
  type NoteSafetyLevel,
  type PianoRollInfo,
  type PresetInfo,
  type SongConfig,
  type StylePresetInfo,
  type VocalConfig,
  NoteReason,
  NoteSafety,
  downloadMidi,
  getVersion,
};
export default MidiSketch;
