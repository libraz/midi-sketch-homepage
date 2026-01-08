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
export const ConfigError = {
    OK: 0,
    InvalidStyle: 1,
    InvalidChord: 2,
    InvalidForm: 3,
    InvalidAttitude: 4,
    InvalidVocalRange: 5,
    InvalidBpm: 6,
    DurationTooShort: 7,
    InvalidModulation: 8,
    InvalidKey: 9,
    InvalidCompositionStyle: 10,
    InvalidArpeggioPattern: 11,
    InvalidArpeggioSpeed: 12,
    InvalidVocalStyle: 13,
    InvalidMelodyTemplate: 14,
    InvalidMelodicComplexity: 15,
    InvalidHookIntensity: 16,
    InvalidVocalGroove: 17,
    InvalidCallDensity: 18,
    InvalidIntroChant: 19,
    InvalidMixPattern: 20,
    InvalidMotifRepeatScope: 21,
    InvalidArrangementGrowth: 22,
    InvalidModulationTiming: 23,
};
/**
 * Custom error class for MidiSketch configuration errors
 */
export class MidiSketchConfigError extends Error {
    constructor(code, nativeMessage) {
        super(`MidiSketch config error [${code}]: ${nativeMessage}`);
        this.name = 'MidiSketchConfigError';
        this.code = code;
        this.nativeMessage = nativeMessage;
    }
}
/**
 * Custom error class for MidiSketch generation errors
 */
export class MidiSketchGenerationError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'MidiSketchGenerationError';
        this.code = code;
    }
}
// Vocal attitude constants
export const VocalAttitude = {
    Clean: 0,
    Expressive: 1,
    Raw: 2,
};
// Composition style constants
export const CompositionStyle = {
    MelodyLead: 0,
    BackgroundMotif: 1,
    SynthDriven: 2,
};
// Attitude bit flags
export const ATTITUDE_CLEAN = 1 << 0;
export const ATTITUDE_EXPRESSIVE = 1 << 1;
export const ATTITUDE_RAW = 1 << 2;
// Modulation timing constants
export const ModulationTiming = {
    None: 0,
    LastChorus: 1,
    AfterBridge: 2,
    EachChorus: 3,
    Random: 4,
};
// Intro chant constants
export const IntroChant = {
    None: 0,
    Gachikoi: 1,
    Shouting: 2,
};
// Mix pattern constants
export const MixPattern = {
    None: 0,
    Standard: 1,
    Tiger: 2,
};
// Call density constants
export const CallDensity = {
    None: 0,
    Minimal: 1,
    Standard: 2,
    Intense: 3,
};
// Arrangement growth constants
export const ArrangementGrowth = {
    LayerAdd: 0,
    RegisterAdd: 1,
};
// Motif repeat scope constants
export const MotifRepeatScope = {
    FullSong: 0,
    Section: 1,
};
// Melodic complexity constants
export const MelodicComplexity = {
    Simple: 0,
    Standard: 1,
    Complex: 2,
};
// Hook intensity constants
export const HookIntensity = {
    Off: 0,
    Light: 1,
    Normal: 2,
    Strong: 3,
};
// Vocal groove feel constants
export const VocalGrooveFeel = {
    Straight: 0,
    OffBeat: 1,
    Swing: 2,
    Syncopated: 3,
    Driving16th: 4,
    Bouncy8th: 5,
};
// Vocal style preset constants
export const VocalStylePreset = {
    Auto: 0,
    Standard: 1,
    Vocaloid: 2,
    UltraVocaloid: 3,
    Idol: 4,
    Ballad: 5,
    Rock: 6,
    CityPop: 7,
    Anime: 8,
    // Extended styles (9-12)
    BrightKira: 9,
    CoolSynth: 10,
    CuteAffected: 11,
    PowerfulShout: 12,
};
let moduleInstance = null;
let api = null;
function getModule() {
    if (!moduleInstance) {
        throw new Error('Module not initialized. Call init() first.');
    }
    return moduleInstance;
}
function getApi() {
    if (!api) {
        throw new Error('Module not initialized. Call init() first.');
    }
    return api;
}
/**
 * Initialize the WASM module
 */
export async function init(options) {
    if (moduleInstance) {
        return;
    }
    const createModule = await import('./midisketch.js');
    moduleInstance = await createModule.default({
        locateFile: (path) => {
            if (path.endsWith('.wasm') && options?.wasmPath) {
                return options.wasmPath;
            }
            return path;
        },
    });
    const m = moduleInstance;
    // Setup cwrap bindings with proper types
    api = {
        create: m.cwrap('midisketch_create', 'number', []),
        destroy: m.cwrap('midisketch_destroy', null, ['number']),
        regenerateVocal: m.cwrap('midisketch_regenerate_vocal', 'number', ['number', 'number']),
        getMidi: m.cwrap('midisketch_get_midi', 'number', ['number']),
        freeMidi: m.cwrap('midisketch_free_midi', null, ['number']),
        getEvents: m.cwrap('midisketch_get_events', 'number', ['number']),
        freeEvents: m.cwrap('midisketch_free_events', null, ['number']),
        structureCount: m.cwrap('midisketch_structure_count', 'number', []),
        moodCount: m.cwrap('midisketch_mood_count', 'number', []),
        chordCount: m.cwrap('midisketch_chord_count', 'number', []),
        structureName: m.cwrap('midisketch_structure_name', 'string', ['number']),
        moodName: m.cwrap('midisketch_mood_name', 'string', ['number']),
        chordName: m.cwrap('midisketch_chord_name', 'string', ['number']),
        chordDisplay: m.cwrap('midisketch_chord_display', 'string', ['number']),
        moodDefaultBpm: m.cwrap('midisketch_mood_default_bpm', 'number', ['number']),
        version: m.cwrap('midisketch_version', 'string', []),
        stylePresetCount: m.cwrap('midisketch_style_preset_count', 'number', []),
        stylePresetName: m.cwrap('midisketch_style_preset_name', 'string', ['number']),
        stylePresetDisplayName: m.cwrap('midisketch_style_preset_display_name', 'string', [
            'number',
        ]),
        stylePresetDescription: m.cwrap('midisketch_style_preset_description', 'string', [
            'number',
        ]),
        stylePresetTempoDefault: m.cwrap('midisketch_style_preset_tempo_default', 'number', [
            'number',
        ]),
        stylePresetAllowedAttitudes: m.cwrap('midisketch_style_preset_allowed_attitudes', 'number', [
            'number',
        ]),
        getProgressionsByStylePtr: m.cwrap('midisketch_get_progressions_by_style_ptr', 'number', [
            'number',
        ]),
        getFormsByStylePtr: m.cwrap('midisketch_get_forms_by_style_ptr', 'number', ['number']),
        createDefaultConfigPtr: m.cwrap('midisketch_create_default_config_ptr', 'number', [
            'number',
        ]),
        validateConfig: m.cwrap('midisketch_validate_config', 'number', ['number']),
        generateFromConfig: m.cwrap('midisketch_generate_from_config', 'number', [
            'number',
            'number',
        ]),
        configErrorString: m.cwrap('midisketch_config_error_string', 'string', ['number']),
    };
}
/**
 * Get library version
 */
export function getVersion() {
    return getApi().version();
}
/**
 * Get structure presets
 */
export function getStructures() {
    const a = getApi();
    const count = a.structureCount();
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push({ name: a.structureName(i) });
    }
    return result;
}
/**
 * Get mood presets
 */
export function getMoods() {
    const a = getApi();
    const count = a.moodCount();
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push({
            name: a.moodName(i),
            defaultBpm: a.moodDefaultBpm(i),
        });
    }
    return result;
}
/**
 * Get chord progression presets
 */
export function getChords() {
    const a = getApi();
    const count = a.chordCount();
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push({
            name: a.chordName(i),
            display: a.chordDisplay(i),
        });
    }
    return result;
}
/**
 * Get style presets
 */
export function getStylePresets() {
    const a = getApi();
    const count = a.stylePresetCount();
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push({
            id: i,
            name: a.stylePresetName(i),
            displayName: a.stylePresetDisplayName(i),
            description: a.stylePresetDescription(i),
            tempoDefault: a.stylePresetTempoDefault(i),
            allowedAttitudes: a.stylePresetAllowedAttitudes(i),
        });
    }
    return result;
}
/**
 * Get chord progressions compatible with a style
 */
export function getProgressionsByStyle(styleId) {
    const a = getApi();
    const m = getModule();
    const retPtr = a.getProgressionsByStylePtr(styleId);
    const view = new DataView(m.HEAPU8.buffer);
    const count = view.getUint8(retPtr);
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(view.getUint8(retPtr + 1 + i));
    }
    return result;
}
/**
 * Get forms compatible with a style
 */
export function getFormsByStyle(styleId) {
    const a = getApi();
    const m = getModule();
    const retPtr = a.getFormsByStylePtr(styleId);
    const view = new DataView(m.HEAPU8.buffer);
    const count = view.getUint8(retPtr);
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(view.getUint8(retPtr + 1 + i));
    }
    return result;
}
/**
 * Create a default song config for a style
 */
export function createDefaultConfig(styleId) {
    const a = getApi();
    const m = getModule();
    const retPtr = a.createDefaultConfigPtr(styleId);
    const view = new DataView(m.HEAPU8.buffer);
    return {
        // Basic settings
        stylePresetId: view.getUint8(retPtr + 0),
        key: view.getUint8(retPtr + 1),
        bpm: view.getUint16(retPtr + 2, true),
        seed: view.getUint32(retPtr + 4, true),
        chordProgressionId: view.getUint8(retPtr + 8),
        formId: view.getUint8(retPtr + 9),
        vocalAttitude: view.getUint8(retPtr + 10),
        drumsEnabled: view.getUint8(retPtr + 11) !== 0,
        // Arpeggio settings
        arpeggioEnabled: view.getUint8(retPtr + 12) !== 0,
        arpeggioPattern: view.getUint8(retPtr + 13),
        arpeggioSpeed: view.getUint8(retPtr + 14),
        arpeggioOctaveRange: view.getUint8(retPtr + 15),
        arpeggioGate: view.getUint8(retPtr + 16),
        // Vocal settings
        vocalLow: view.getUint8(retPtr + 17),
        vocalHigh: view.getUint8(retPtr + 18),
        skipVocal: view.getUint8(retPtr + 19) !== 0,
        // Humanization
        humanize: view.getUint8(retPtr + 20) !== 0,
        humanizeTiming: view.getUint8(retPtr + 21),
        humanizeVelocity: view.getUint8(retPtr + 22),
        // Chord extensions
        chordExtSus: view.getUint8(retPtr + 23) !== 0,
        chordExt7th: view.getUint8(retPtr + 24) !== 0,
        chordExt9th: view.getUint8(retPtr + 25) !== 0,
        chordExtSusProb: view.getUint8(retPtr + 26),
        chordExt7thProb: view.getUint8(retPtr + 27),
        chordExt9thProb: view.getUint8(retPtr + 28),
        // Composition style
        compositionStyle: view.getUint8(retPtr + 29),
        // Duration
        targetDurationSeconds: view.getUint16(retPtr + 32, true),
        // Modulation settings
        modulationTiming: view.getUint8(retPtr + 34),
        modulationSemitones: view.getInt8(retPtr + 35),
        // SE/Call settings (offset 36-41)
        seEnabled: view.getUint8(retPtr + 36) !== 0,
        callSetting: view.getUint8(retPtr + 37),
        callNotesEnabled: view.getUint8(retPtr + 38) !== 0,
        introChant: view.getUint8(retPtr + 39),
        mixPattern: view.getUint8(retPtr + 40),
        callDensity: view.getUint8(retPtr + 41),
        // Vocal style settings (offset 42-43)
        vocalStyle: view.getUint8(retPtr + 42),
        melodyTemplate: view.getUint8(retPtr + 43),
        // Arrangement settings (offset 44)
        arrangementGrowth: view.getUint8(retPtr + 44),
        // Arpeggio sync settings (offset 45)
        arpeggioSyncChord: view.getUint8(retPtr + 45) !== 0,
        // Motif settings (offset 46-48)
        motifRepeatScope: view.getUint8(retPtr + 46),
        motifFixedProgression: view.getUint8(retPtr + 47) !== 0,
        motifMaxChordCount: view.getUint8(retPtr + 48),
        // Melodic complexity and hook control (offset 49-51)
        melodicComplexity: view.getUint8(retPtr + 49),
        hookIntensity: view.getUint8(retPtr + 50),
        vocalGroove: view.getUint8(retPtr + 51),
    };
}
/**
 * Validate a song config before generation.
 * Returns the error code (0 = OK, non-zero = error).
 * Use getConfigErrorMessage() to get human-readable error message.
 */
export function validateConfig(config) {
    const a = getApi();
    const m = getModule();
    const configPtr = allocSongConfigStatic(m, config);
    try {
        return a.validateConfig(configPtr);
    }
    finally {
        m._free(configPtr);
    }
}
/**
 * Get human-readable error message for a config error code.
 */
export function getConfigErrorMessage(errorCode) {
    const a = getApi();
    return a.configErrorString(errorCode);
}
// Helper function to allocate SongConfig without class context
function allocSongConfigStatic(m, config) {
    const ptr = m._malloc(52);
    const view = new DataView(m.HEAPU8.buffer);
    // Basic settings (offset 0-11)
    view.setUint8(ptr + 0, config.stylePresetId ?? 0);
    view.setUint8(ptr + 1, config.key ?? 0);
    view.setUint16(ptr + 2, config.bpm ?? 0, true);
    view.setUint32(ptr + 4, config.seed ?? 0, true);
    view.setUint8(ptr + 8, config.chordProgressionId ?? 0);
    view.setUint8(ptr + 9, config.formId ?? 0);
    view.setUint8(ptr + 10, config.vocalAttitude ?? 0);
    view.setUint8(ptr + 11, config.drumsEnabled !== false ? 1 : 0);
    // Arpeggio settings (offset 12-16)
    view.setUint8(ptr + 12, config.arpeggioEnabled ? 1 : 0);
    view.setUint8(ptr + 13, config.arpeggioPattern ?? 0);
    view.setUint8(ptr + 14, config.arpeggioSpeed ?? 1);
    view.setUint8(ptr + 15, config.arpeggioOctaveRange ?? 2);
    view.setUint8(ptr + 16, config.arpeggioGate ?? 80);
    // Vocal settings (offset 17-19)
    view.setUint8(ptr + 17, config.vocalLow ?? 55);
    view.setUint8(ptr + 18, config.vocalHigh ?? 74);
    view.setUint8(ptr + 19, config.skipVocal ? 1 : 0);
    // Humanization (offset 20-22)
    view.setUint8(ptr + 20, config.humanize ? 1 : 0);
    view.setUint8(ptr + 21, config.humanizeTiming ?? 50);
    view.setUint8(ptr + 22, config.humanizeVelocity ?? 50);
    // Chord extensions (offset 23-28)
    view.setUint8(ptr + 23, config.chordExtSus ? 1 : 0);
    view.setUint8(ptr + 24, config.chordExt7th ? 1 : 0);
    view.setUint8(ptr + 25, config.chordExt9th ? 1 : 0);
    view.setUint8(ptr + 26, config.chordExtSusProb ?? 20);
    view.setUint8(ptr + 27, config.chordExt7thProb ?? 30);
    view.setUint8(ptr + 28, config.chordExt9thProb ?? 25);
    // Composition style (offset 29)
    view.setUint8(ptr + 29, config.compositionStyle ?? 0);
    // Reserved + padding (offset 30-31)
    view.setUint8(ptr + 30, 0);
    view.setUint8(ptr + 31, 0);
    // Duration (offset 32-33)
    view.setUint16(ptr + 32, config.targetDurationSeconds ?? 0, true);
    // Modulation settings (offset 34-35)
    view.setUint8(ptr + 34, config.modulationTiming ?? 0);
    view.setInt8(ptr + 35, config.modulationSemitones ?? 2);
    // SE/Call settings (offset 36-41)
    view.setUint8(ptr + 36, config.seEnabled !== false ? 1 : 0);
    view.setUint8(ptr + 37, config.callSetting ?? 0); // 0=Auto, 1=Enabled, 2=Disabled
    view.setUint8(ptr + 38, config.callNotesEnabled !== false ? 1 : 0);
    view.setUint8(ptr + 39, config.introChant ?? 0);
    view.setUint8(ptr + 40, config.mixPattern ?? 0);
    view.setUint8(ptr + 41, config.callDensity ?? 2);
    // Vocal style settings (offset 42-43)
    view.setUint8(ptr + 42, config.vocalStyle ?? 0);
    view.setUint8(ptr + 43, config.melodyTemplate ?? 0);
    // Arrangement settings (offset 44)
    view.setUint8(ptr + 44, config.arrangementGrowth ?? 0);
    // Arpeggio sync settings (offset 45)
    view.setUint8(ptr + 45, config.arpeggioSyncChord !== false ? 1 : 0);
    // Motif settings (offset 46-48)
    view.setUint8(ptr + 46, config.motifRepeatScope ?? 0);
    view.setUint8(ptr + 47, config.motifFixedProgression !== false ? 1 : 0);
    view.setUint8(ptr + 48, config.motifMaxChordCount ?? 4);
    // Melodic complexity and hook control (offset 49-51)
    view.setUint8(ptr + 49, config.melodicComplexity ?? 1);
    view.setUint8(ptr + 50, config.hookIntensity ?? 2);
    view.setUint8(ptr + 51, config.vocalGroove ?? 0);
    return ptr;
}
/**
 * MidiSketch instance for MIDI generation
 */
export class MidiSketch {
    constructor() {
        const a = getApi();
        this.handle = a.create();
        if (!this.handle) {
            throw new Error('Failed to create MidiSketch instance');
        }
    }
    /**
     * Generate MIDI from a SongConfig
     * @throws {MidiSketchConfigError} If config validation fails
     * @throws {MidiSketchGenerationError} If generation fails for other reasons
     */
    generateFromConfig(config) {
        const a = getApi();
        const m = getModule();
        const configPtr = this.allocSongConfig(m, config);
        try {
            const result = a.generateFromConfig(this.handle, configPtr);
            if (result !== 0) {
                // Error code 1 = INVALID_PARAM, which includes config validation errors
                // Try to get detailed error message
                const errorMessage = a.configErrorString(result);
                if (result === 1) {
                    // Config validation error - get more specific error from validation
                    const validationResult = a.validateConfig(configPtr);
                    if (validationResult !== 0) {
                        const validationMessage = a.configErrorString(validationResult);
                        throw new MidiSketchConfigError(validationResult, validationMessage);
                    }
                }
                throw new MidiSketchGenerationError(result, `Generation failed: ${errorMessage}`);
            }
        }
        finally {
            m._free(configPtr);
        }
    }
    /**
     * Regenerate only the vocal track with the given parameters.
     * BGM tracks (chord, bass, drums, arpeggio) remain unchanged.
     * Use after generateFromConfig with skipVocal=true.
     * @throws {MidiSketchGenerationError} If regeneration fails
     */
    regenerateVocal(params) {
        const a = getApi();
        const m = getModule();
        const paramsPtr = this.allocVocalParams(m, params);
        try {
            const result = a.regenerateVocal(this.handle, paramsPtr);
            if (result !== 0) {
                throw new MidiSketchGenerationError(result, `Vocal regeneration failed with error code: ${result}`);
            }
        }
        finally {
            m._free(paramsPtr);
        }
    }
    /**
     * Get the generated MIDI data
     */
    getMidi() {
        const a = getApi();
        const m = getModule();
        const midiDataPtr = a.getMidi(this.handle);
        if (!midiDataPtr) {
            throw new Error('No MIDI data available');
        }
        try {
            const dataPtr = m.HEAPU32[midiDataPtr >> 2];
            const size = m.HEAPU32[(midiDataPtr + 4) >> 2];
            const result = new Uint8Array(size);
            result.set(m.HEAPU8.subarray(dataPtr, dataPtr + size));
            return result;
        }
        finally {
            a.freeMidi(midiDataPtr);
        }
    }
    /**
     * Get the event data as a parsed object
     */
    getEvents() {
        const a = getApi();
        const m = getModule();
        const eventDataPtr = a.getEvents(this.handle);
        if (!eventDataPtr) {
            throw new Error('No event data available');
        }
        try {
            const jsonPtr = m.HEAPU32[eventDataPtr >> 2];
            const json = m.UTF8ToString(jsonPtr);
            return JSON.parse(json);
        }
        finally {
            a.freeEvents(eventDataPtr);
        }
    }
    /**
     * Destroy the instance and free resources
     */
    destroy() {
        if (this.handle) {
            const a = getApi();
            a.destroy(this.handle);
            this.handle = 0;
        }
    }
    allocSongConfig(m, config) {
        const ptr = m._malloc(52); // MidiSketchSongConfig size
        const view = new DataView(m.HEAPU8.buffer);
        // Basic settings (offset 0-11)
        view.setUint8(ptr + 0, config.stylePresetId ?? 0);
        view.setUint8(ptr + 1, config.key ?? 0);
        view.setUint16(ptr + 2, config.bpm ?? 0, true);
        view.setUint32(ptr + 4, config.seed ?? 0, true);
        view.setUint8(ptr + 8, config.chordProgressionId ?? 0);
        view.setUint8(ptr + 9, config.formId ?? 0);
        view.setUint8(ptr + 10, config.vocalAttitude ?? 0);
        view.setUint8(ptr + 11, config.drumsEnabled !== false ? 1 : 0);
        // Arpeggio settings (offset 12-16)
        view.setUint8(ptr + 12, config.arpeggioEnabled ? 1 : 0);
        view.setUint8(ptr + 13, config.arpeggioPattern ?? 0);
        view.setUint8(ptr + 14, config.arpeggioSpeed ?? 1);
        view.setUint8(ptr + 15, config.arpeggioOctaveRange ?? 2);
        view.setUint8(ptr + 16, config.arpeggioGate ?? 80);
        // Vocal settings (offset 17-19)
        view.setUint8(ptr + 17, config.vocalLow ?? 55);
        view.setUint8(ptr + 18, config.vocalHigh ?? 74);
        view.setUint8(ptr + 19, config.skipVocal ? 1 : 0);
        // Humanization (offset 20-22)
        view.setUint8(ptr + 20, config.humanize ? 1 : 0);
        view.setUint8(ptr + 21, config.humanizeTiming ?? 50);
        view.setUint8(ptr + 22, config.humanizeVelocity ?? 50);
        // Chord extensions (offset 23-28)
        view.setUint8(ptr + 23, config.chordExtSus ? 1 : 0);
        view.setUint8(ptr + 24, config.chordExt7th ? 1 : 0);
        view.setUint8(ptr + 25, config.chordExt9th ? 1 : 0);
        view.setUint8(ptr + 26, config.chordExtSusProb ?? 20);
        view.setUint8(ptr + 27, config.chordExt7thProb ?? 30);
        view.setUint8(ptr + 28, config.chordExt9thProb ?? 25);
        // Composition style (offset 29)
        view.setUint8(ptr + 29, config.compositionStyle ?? 0);
        // Reserved + padding (offset 30-31)
        view.setUint8(ptr + 30, 0);
        view.setUint8(ptr + 31, 0);
        // Duration (offset 32-33)
        view.setUint16(ptr + 32, config.targetDurationSeconds ?? 0, true);
        // Modulation settings (offset 34-35)
        view.setUint8(ptr + 34, config.modulationTiming ?? 0);
        view.setInt8(ptr + 35, config.modulationSemitones ?? 2);
        // SE/Call settings (offset 36-41)
        view.setUint8(ptr + 36, config.seEnabled !== false ? 1 : 0);
        view.setUint8(ptr + 37, config.callSetting ?? 0); // 0=Auto, 1=Enabled, 2=Disabled
        view.setUint8(ptr + 38, config.callNotesEnabled !== false ? 1 : 0);
        view.setUint8(ptr + 39, config.introChant ?? 0);
        view.setUint8(ptr + 40, config.mixPattern ?? 0);
        view.setUint8(ptr + 41, config.callDensity ?? 2);
        // Vocal style settings (offset 42-43)
        view.setUint8(ptr + 42, config.vocalStyle ?? 0);
        view.setUint8(ptr + 43, config.melodyTemplate ?? 0);
        // Arrangement settings (offset 44)
        view.setUint8(ptr + 44, config.arrangementGrowth ?? 0);
        // Arpeggio sync settings (offset 45)
        view.setUint8(ptr + 45, config.arpeggioSyncChord !== false ? 1 : 0);
        // Motif settings (offset 46-48)
        view.setUint8(ptr + 46, config.motifRepeatScope ?? 0);
        view.setUint8(ptr + 47, config.motifFixedProgression !== false ? 1 : 0);
        view.setUint8(ptr + 48, config.motifMaxChordCount ?? 4);
        // Melodic complexity and hook control (offset 49-51)
        view.setUint8(ptr + 49, config.melodicComplexity ?? 1); // Default: Standard
        view.setUint8(ptr + 50, config.hookIntensity ?? 2); // Default: Normal
        view.setUint8(ptr + 51, config.vocalGroove ?? 0); // Default: Straight
        return ptr;
    }
    allocVocalParams(m, params) {
        const ptr = m._malloc(16); // 16 bytes (padded)
        const view = new DataView(m.HEAPU8.buffer);
        view.setUint32(ptr + 0, params.seed ?? 0, true);
        view.setUint8(ptr + 4, params.vocalLow ?? 60);
        view.setUint8(ptr + 5, params.vocalHigh ?? 79);
        view.setUint8(ptr + 6, params.vocalAttitude ?? 0);
        view.setUint8(ptr + 7, params.vocalStyle ?? 0);
        view.setUint8(ptr + 8, params.melodyTemplate ?? 0);
        view.setUint8(ptr + 9, params.melodicComplexity ?? 1); // Default: Standard
        view.setUint8(ptr + 10, params.hookIntensity ?? 2); // Default: Normal
        view.setUint8(ptr + 11, params.vocalGroove ?? 0); // Default: Straight
        view.setUint8(ptr + 12, params.compositionStyle ?? 0); // Default: MelodyLead
        // Padding bytes 13-15
        return ptr;
    }
}
/**
 * Download MIDI data as a file (browser only)
 */
export function downloadMidi(midiData, filename = 'output.mid') {
    // Copy to regular ArrayBuffer to ensure compatibility
    const buffer = new ArrayBuffer(midiData.length);
    new Uint8Array(buffer).set(midiData);
    const blob = new Blob([buffer], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}
export default MidiSketch;
//# sourceMappingURL=index.js.map