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
}
/**
 * Vocal regeneration parameters
 */
export interface VocalParams {
    /** Random seed (0 = new random) */
    seed: number;
    /** Vocal range lower bound (MIDI note) */
    vocalLow: number;
    /** Vocal range upper bound (MIDI note) */
    vocalHigh: number;
    /** Vocal attitude: 0=Clean, 1=Expressive, 2=Raw */
    vocalAttitude: number;
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
 * MidiSketch instance for MIDI generation
 */
export declare class MidiSketch {
    private handle;
    constructor();
    /**
     * Generate MIDI from a SongConfig
     */
    generateFromConfig(config: SongConfig): void;
    /**
     * Regenerate only the vocal track with the given parameters.
     * BGM tracks (chord, bass, drums, arpeggio) remain unchanged.
     * Use after generateFromConfig with skipVocal=true.
     */
    regenerateVocal(params: VocalParams): void;
    /**
     * Get the generated MIDI data
     */
    getMidi(): Uint8Array;
    /**
     * Get the event data as a parsed object
     */
    getEvents(): EventData;
    /**
     * Destroy the instance and free resources
     */
    destroy(): void;
    private allocSongConfig;
    private allocVocalParams;
}
/**
 * Download MIDI data as a file (browser only)
 */
export declare function downloadMidi(midiData: Uint8Array, filename?: string): void;
export default MidiSketch;
//# sourceMappingURL=index.d.ts.map