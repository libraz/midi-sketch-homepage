// js/src/internal.ts
var moduleInstance = null;
var api = null;
function getModule() {
  if (!moduleInstance) {
    throw new Error("Module not initialized. Call init() first.");
  }
  return moduleInstance;
}
function getApi() {
  if (!api) {
    throw new Error("Module not initialized. Call init() first.");
  }
  return api;
}
async function init(options) {
  if (moduleInstance) {
    return;
  }
  const createModule = await import("./midisketch.js");
  moduleInstance = await createModule.default({
    locateFile: (path) => {
      if (path.endsWith(".wasm") && options?.wasmPath) {
        return options.wasmPath;
      }
      return path;
    }
  });
  const m = moduleInstance;
  api = {
    create: m.cwrap("midisketch_create", "number", []),
    destroy: m.cwrap("midisketch_destroy", null, ["number"]),
    getMidi: m.cwrap("midisketch_get_midi", "number", ["number"]),
    freeMidi: m.cwrap("midisketch_free_midi", null, ["number"]),
    getEvents: m.cwrap("midisketch_get_events", "number", ["number"]),
    freeEvents: m.cwrap("midisketch_free_events", null, ["number"]),
    structureCount: m.cwrap("midisketch_structure_count", "number", []),
    moodCount: m.cwrap("midisketch_mood_count", "number", []),
    chordCount: m.cwrap("midisketch_chord_count", "number", []),
    structureName: m.cwrap("midisketch_structure_name", "string", ["number"]),
    moodName: m.cwrap("midisketch_mood_name", "string", ["number"]),
    chordName: m.cwrap("midisketch_chord_name", "string", ["number"]),
    chordDisplay: m.cwrap("midisketch_chord_display", "string", ["number"]),
    moodDefaultBpm: m.cwrap("midisketch_mood_default_bpm", "number", ["number"]),
    version: m.cwrap("midisketch_version", "string", []),
    stylePresetCount: m.cwrap("midisketch_style_preset_count", "number", []),
    stylePresetName: m.cwrap("midisketch_style_preset_name", "string", ["number"]),
    stylePresetDisplayName: m.cwrap("midisketch_style_preset_display_name", "string", [
      "number"
    ]),
    stylePresetDescription: m.cwrap("midisketch_style_preset_description", "string", [
      "number"
    ]),
    stylePresetTempoDefault: m.cwrap("midisketch_style_preset_tempo_default", "number", [
      "number"
    ]),
    stylePresetAllowedAttitudes: m.cwrap("midisketch_style_preset_allowed_attitudes", "number", [
      "number"
    ]),
    getProgressionsByStylePtr: m.cwrap("midisketch_get_progressions_by_style_ptr", "number", [
      "number"
    ]),
    getFormsByStylePtr: m.cwrap("midisketch_get_forms_by_style_ptr", "number", ["number"]),
    configErrorString: m.cwrap("midisketch_config_error_string", "string", ["number"]),
    // Vocal-first generation APIs (no-config versions)
    generateAccompaniment: m.cwrap("midisketch_generate_accompaniment", "number", ["number"]),
    regenerateAccompaniment: m.cwrap("midisketch_regenerate_accompaniment", "number", [
      "number",
      "number"
    ]),
    // Piano Roll Safety API
    getPianoRollSafety: m.cwrap("midisketch_get_piano_roll_safety", "number", [
      "number",
      "number",
      "number",
      "number"
    ]),
    getPianoRollSafetyAt: m.cwrap("midisketch_get_piano_roll_safety_at", "number", [
      "number",
      "number"
    ]),
    getPianoRollSafetyWithContext: m.cwrap(
      "midisketch_get_piano_roll_safety_with_context",
      "number",
      ["number", "number", "number"]
    ),
    freePianoRollData: m.cwrap("midisketch_free_piano_roll_data", null, ["number"]),
    reasonToString: m.cwrap("midisketch_reason_to_string", "string", ["number"]),
    // JSON Config API
    generateFromJson: m.cwrap("midisketch_generate_from_json", "number", [
      "number",
      "string",
      "number"
    ]),
    createDefaultConfigJson: m.cwrap("midisketch_create_default_config_json", "string", [
      "number"
    ]),
    validateConfigJson: m.cwrap("midisketch_validate_config_json", "number", [
      "string",
      "number"
    ]),
    generateVocalFromJson: m.cwrap("midisketch_generate_vocal_from_json", "number", [
      "number",
      "string",
      "number"
    ]),
    generateWithVocalFromJson: m.cwrap("midisketch_generate_with_vocal_from_json", "number", [
      "number",
      "string",
      "number"
    ]),
    regenerateVocalFromJson: m.cwrap("midisketch_regenerate_vocal_from_json", "number", [
      "number",
      "string",
      "number"
    ]),
    generateAccompanimentFromJson: m.cwrap(
      "midisketch_generate_accompaniment_from_json",
      "number",
      ["number", "string", "number"]
    ),
    regenerateAccompanimentFromJson: m.cwrap(
      "midisketch_regenerate_accompaniment_from_json",
      "number",
      ["number", "string", "number"]
    ),
    setVocalNotesFromJson: m.cwrap("midisketch_set_vocal_notes_from_json", "number", [
      "number",
      "string",
      "number"
    ]),
    // Production Blueprint API
    blueprintCount: m.cwrap("midisketch_blueprint_count", "number", []),
    blueprintName: m.cwrap("midisketch_blueprint_name", "string", ["number"]),
    blueprintParadigm: m.cwrap("midisketch_blueprint_paradigm", "number", ["number"]),
    blueprintRiffPolicy: m.cwrap("midisketch_blueprint_riff_policy", "number", ["number"]),
    blueprintWeight: m.cwrap("midisketch_blueprint_weight", "number", ["number"]),
    getResolvedBlueprintId: m.cwrap("midisketch_get_resolved_blueprint_id", "number", [
      "number"
    ])
  };
}

// js/src/blueprint.ts
var GenerationParadigm = {
  /** Existing behavior */
  Traditional: 0,
  /** Orangestar style (rhythm-synced) */
  RhythmSync: 1,
  /** YOASOBI style (melody-driven) */
  MelodyDriven: 2
};
var RiffPolicy = {
  /** Free variation per section */
  Free: 0,
  /** Pitch contour fixed, expression variable (recommended) */
  LockedContour: 1,
  /** Pitch completely fixed, velocity variable */
  LockedPitch: 2,
  /** Completely fixed (monotonous, not recommended) */
  LockedAll: 3,
  /** Gradual evolution with variations */
  Evolving: 4,
  /** Alias for LockedContour (backward compatibility) */
  Locked: 1
};
function getBlueprintCount() {
  return getApi().blueprintCount();
}
function getBlueprintName(id) {
  return getApi().blueprintName(id);
}
function getBlueprintParadigm(id) {
  return getApi().blueprintParadigm(id);
}
function getBlueprintRiffPolicy(id) {
  return getApi().blueprintRiffPolicy(id);
}
function getBlueprintWeight(id) {
  return getApi().blueprintWeight(id);
}
function getBlueprints() {
  const a = getApi();
  const count = a.blueprintCount();
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push({
      id: i,
      name: a.blueprintName(i),
      paradigm: a.blueprintParadigm(i),
      riffPolicy: a.blueprintRiffPolicy(i),
      weight: a.blueprintWeight(i)
    });
  }
  return result;
}

// js/src/config-fields.ts
var CONFIG_FIELDS = [
  { js: "stylePresetId", cpp: "style_preset_id", default: 0, type: "number" },
  { js: "blueprintId", cpp: "blueprint_id", default: 0, type: "number" },
  { js: "mood", cpp: "mood", default: 0, type: "number" },
  { js: "moodExplicit", cpp: "mood_explicit", default: false, type: "boolean" },
  { js: "key", cpp: "key", default: 0, type: "number" },
  { js: "bpm", cpp: "bpm", default: 0, type: "number" },
  { js: "seed", cpp: "seed", default: 0, type: "number" },
  { js: "chordProgressionId", cpp: "chord_progression_id", default: 0, type: "number" },
  { js: "formId", cpp: "form", default: 0, type: "number" },
  { js: "formExplicit", cpp: "form_explicit", default: false, type: "boolean" },
  { js: "targetDurationSeconds", cpp: "target_duration_seconds", default: 0, type: "number" },
  { js: "vocalAttitude", cpp: "vocal_attitude", default: 0, type: "number" },
  { js: "vocalStyle", cpp: "vocal_style", default: 0, type: "number" },
  { js: "driveFeel", cpp: "drive_feel", default: 50, type: "number" },
  { js: "drumsEnabled", cpp: "drums_enabled", default: true, type: "boolean" },
  { js: "drumsEnabledExplicit", cpp: "drums_enabled_explicit", default: false, type: "boolean" },
  { js: "arpeggioEnabled", cpp: "arpeggio_enabled", default: false, type: "boolean" },
  { js: "guitarEnabled", cpp: "guitar_enabled", default: false, type: "boolean" },
  { js: "skipVocal", cpp: "skip_vocal", default: false, type: "boolean" },
  { js: "vocalLow", cpp: "vocal_low", default: 60, type: "number" },
  { js: "vocalHigh", cpp: "vocal_high", default: 79, type: "number" },
  { js: "compositionStyle", cpp: "composition_style", default: 0, type: "number" },
  { js: "motifRepeatScope", cpp: "motif_repeat_scope", default: 0, type: "number" },
  { js: "arrangementGrowth", cpp: "arrangement_growth", default: 0, type: "number" },
  { js: "humanize", cpp: "humanize", default: false, type: "boolean" },
  { js: "humanizeTiming", cpp: "humanize_timing", default: 0.4, type: "number" },
  { js: "humanizeVelocity", cpp: "humanize_velocity", default: 0.3, type: "number" },
  { js: "modulationTiming", cpp: "modulation_timing", default: 0, type: "number" },
  { js: "modulationSemitones", cpp: "modulation_semitones", default: 2, type: "number" },
  { js: "seEnabled", cpp: "se_enabled", default: true, type: "boolean" },
  { js: "callEnabled", cpp: "call_setting", default: 0, type: "number" },
  { js: "callNotesEnabled", cpp: "call_notes_enabled", default: true, type: "boolean" },
  { js: "introChant", cpp: "intro_chant", default: 0, type: "number" },
  { js: "mixPattern", cpp: "mix_pattern", default: 0, type: "number" },
  { js: "callDensity", cpp: "call_density", default: 2, type: "number" },
  { js: "melodyTemplate", cpp: "melody_template", default: 0, type: "number" },
  { js: "melodicComplexity", cpp: "melodic_complexity", default: 1, type: "number" },
  { js: "hookIntensity", cpp: "hook_intensity", default: 2, type: "number" },
  { js: "vocalGroove", cpp: "vocal_groove", default: 0, type: "number" },
  { js: "enableSyncopation", cpp: "enable_syncopation", default: false, type: "boolean" },
  { js: "energyCurve", cpp: "energy_curve", default: 0, type: "number" },
  { js: "addictiveMode", cpp: "addictive_mode", default: false, type: "boolean" },
  { js: "moraRhythmMode", cpp: "mora_rhythm_mode", default: 2, type: "number" },
  { js: "syllabicSubRate", cpp: "syllabic_sub_rate", default: 0, type: "number" },
  // Melody overrides
  { js: "melodyMaxLeap", cpp: "melody_max_leap", default: 0, type: "number" },
  { js: "melodySyncopationProb", cpp: "melody_syncopation_prob", default: 255, type: "number" },
  { js: "melodyPhraseLength", cpp: "melody_phrase_length", default: 0, type: "number" },
  { js: "melodyLongNoteRatio", cpp: "melody_long_note_ratio", default: 255, type: "number" },
  {
    js: "melodyChorusRegisterShift",
    cpp: "melody_chorus_register_shift",
    default: -128,
    type: "number"
  },
  { js: "melodyHookRepetition", cpp: "melody_hook_repetition", default: 0, type: "number" },
  { js: "melodyUseLeadingTone", cpp: "melody_use_leading_tone", default: 0, type: "number" },
  // Motif overrides
  { js: "motifLength", cpp: "motif_length", default: 0, type: "number" },
  { js: "motifNoteCount", cpp: "motif_note_count", default: 0, type: "number" },
  { js: "motifMotion", cpp: "motif_motion", default: 255, type: "number" },
  { js: "motifRegisterHigh", cpp: "motif_register_high", default: 0, type: "number" },
  { js: "motifRhythmDensity", cpp: "motif_rhythm_density", default: 255, type: "number" },
  // Explicit override flags
  { js: "chordExtProbExplicit", cpp: "chord_ext_prob_explicit", default: false, type: "boolean" }
];
var ARPEGGIO_FIELDS = [
  { js: "arpeggioPattern", cpp: "pattern", default: 0, type: "number" },
  { js: "arpeggioSpeed", cpp: "speed", default: 1, type: "number" },
  {
    js: "arpeggioOctaveRange",
    cpp: "octave_range",
    default: 2,
    type: "number"
  },
  { js: "arpeggioGate", cpp: "gate", default: 0.8, type: "number" },
  {
    js: "arpeggioSyncChord",
    cpp: "sync_chord",
    default: true,
    type: "boolean"
  }
];
var CHORD_EXT_FIELDS = [
  { js: "chordExtSus", cpp: "enable_sus", default: false, type: "boolean" },
  { js: "chordExt7th", cpp: "enable_7th", default: false, type: "boolean" },
  { js: "chordExt9th", cpp: "enable_9th", default: false, type: "boolean" },
  {
    js: "chordExtSusProb",
    cpp: "sus_probability",
    default: 0.2,
    type: "number"
  },
  {
    js: "chordExt7thProb",
    cpp: "seventh_probability",
    default: 0.15,
    type: "number"
  },
  {
    js: "chordExt9thProb",
    cpp: "ninth_probability",
    default: 0.25,
    type: "number"
  }
];
var MOTIF_CHORD_FIELDS = [
  {
    js: "motifFixedProgression",
    cpp: "fixed_progression",
    default: true,
    type: "boolean"
  },
  {
    js: "motifMaxChordCount",
    cpp: "max_chord_count",
    default: 4,
    type: "number"
  }
];
var NESTED_STRUCTS = [
  { cpp: "arpeggio", fields: ARPEGGIO_FIELDS },
  { cpp: "chord_extension", fields: CHORD_EXT_FIELDS },
  { cpp: "motif_chord", fields: MOTIF_CHORD_FIELDS }
];
var VOCAL_FIELDS = [
  { js: "seed", cpp: "seed", default: 0, type: "number" },
  { js: "vocalLow", cpp: "vocal_low", default: 60, type: "number" },
  { js: "vocalHigh", cpp: "vocal_high", default: 79, type: "number" },
  { js: "vocalAttitude", cpp: "vocal_attitude", default: 0, type: "number" },
  { js: "vocalStyle", cpp: "vocal_style", default: 0, type: "number" },
  { js: "melodyTemplate", cpp: "melody_template", default: 0, type: "number" },
  { js: "melodicComplexity", cpp: "melodic_complexity", default: 1, type: "number" },
  { js: "hookIntensity", cpp: "hook_intensity", default: 2, type: "number" },
  { js: "vocalGroove", cpp: "vocal_groove", default: 0, type: "number" },
  { js: "compositionStyle", cpp: "composition_style", default: 0, type: "number" }
];
var ACCOMPANIMENT_FIELDS = [
  { js: "seed", cpp: "seed", default: 0, type: "number" },
  { js: "drumsEnabled", cpp: "drums_enabled", default: true, type: "boolean" },
  { js: "arpeggioEnabled", cpp: "arpeggio_enabled", default: false, type: "boolean" },
  { js: "guitarEnabled", cpp: "guitar_enabled", default: false, type: "boolean" },
  { js: "arpeggioPattern", cpp: "arpeggio_pattern", default: 0, type: "number" },
  { js: "arpeggioSpeed", cpp: "arpeggio_speed", default: 1, type: "number" },
  { js: "arpeggioOctaveRange", cpp: "arpeggio_octave_range", default: 2, type: "number" },
  { js: "arpeggioGate", cpp: "arpeggio_gate", default: 80, type: "number" },
  { js: "arpeggioSyncChord", cpp: "arpeggio_sync_chord", default: true, type: "boolean" },
  { js: "chordExtSus", cpp: "chord_ext_sus", default: false, type: "boolean" },
  { js: "chordExt7th", cpp: "chord_ext_7th", default: false, type: "boolean" },
  { js: "chordExt9th", cpp: "chord_ext_9th", default: false, type: "boolean" },
  { js: "chordExtTritoneSub", cpp: "chord_ext_tritone_sub", default: false, type: "boolean" },
  { js: "chordExtSusProb", cpp: "chord_ext_sus_prob", default: 20, type: "number" },
  { js: "chordExt7thProb", cpp: "chord_ext_7th_prob", default: 30, type: "number" },
  { js: "chordExt9thProb", cpp: "chord_ext_9th_prob", default: 25, type: "number" },
  { js: "chordExtTritoneSubProb", cpp: "chord_ext_tritone_sub_prob", default: 50, type: "number" },
  { js: "humanize", cpp: "humanize", default: false, type: "boolean" },
  { js: "humanizeTiming", cpp: "humanize_timing", default: 50, type: "number" },
  { js: "humanizeVelocity", cpp: "humanize_velocity", default: 50, type: "number" },
  { js: "seEnabled", cpp: "se_enabled", default: true, type: "boolean" },
  { js: "callEnabled", cpp: "call_enabled", default: false, type: "boolean" },
  { js: "callDensity", cpp: "call_density", default: 2, type: "number" },
  { js: "introChant", cpp: "intro_chant", default: 0, type: "number" },
  { js: "mixPattern", cpp: "mix_pattern", default: 0, type: "number" },
  { js: "callNotesEnabled", cpp: "call_notes_enabled", default: true, type: "boolean" }
];
function serializeWithFields(config, fields) {
  const obj = {};
  for (const { js, cpp } of fields) {
    const val = config[js];
    if (val !== void 0) {
      obj[cpp] = val;
    }
  }
  return JSON.stringify(obj);
}
function serializeVocalConfig(config) {
  return serializeWithFields(config, VOCAL_FIELDS);
}
function serializeAccompanimentConfig(config) {
  return serializeWithFields(config, ACCOMPANIMENT_FIELDS);
}
function serializeConfig(config) {
  const obj = {};
  const c = config;
  for (const { js, cpp } of CONFIG_FIELDS) {
    const val = c[js];
    if (val !== void 0) {
      if (js === "callEnabled") {
        obj[cpp] = val ? 1 : 0;
      } else {
        obj[cpp] = val;
      }
    }
  }
  for (const { cpp: nestedKey, fields } of NESTED_STRUCTS) {
    const nested = {};
    for (const { js, cpp } of fields) {
      const val = c[js];
      if (val !== void 0) {
        nested[cpp] = val;
      }
    }
    if (Object.keys(nested).length > 0) {
      obj[nestedKey] = nested;
    }
  }
  return JSON.stringify(obj);
}
function deserializeConfig(json) {
  const obj = JSON.parse(json);
  const config = {};
  for (const { js, cpp, default: def } of CONFIG_FIELDS) {
    if (js === "callEnabled") {
      config[js] = (obj[cpp] ?? def) !== 0;
    } else {
      config[js] = obj[cpp] ?? def;
    }
  }
  for (const { cpp: nestedKey, fields } of NESTED_STRUCTS) {
    const nested = obj[nestedKey];
    if (nested) {
      for (const { js, cpp, default: def } of fields) {
        config[js] = nested[cpp] ?? def;
      }
    }
  }
  return config;
}

// js/src/config.ts
function createDefaultConfig(styleId) {
  const a = getApi();
  const json = a.createDefaultConfigJson(styleId);
  return deserializeConfig(json);
}
function validateConfig(config) {
  const a = getApi();
  const json = serializeConfig(config);
  return a.validateConfigJson(json, json.length);
}
function getConfigErrorMessage(errorCode) {
  const a = getApi();
  return a.configErrorString(errorCode);
}

// js/src/constants.ts
var ConfigError = {
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
  InvalidModulationTiming: 23
};
var MidiSketchConfigError = class extends Error {
  constructor(code, nativeMessage) {
    super(`MidiSketch config error [${code}]: ${nativeMessage}`);
    this.name = "MidiSketchConfigError";
    this.code = code;
    this.nativeMessage = nativeMessage;
  }
};
var MidiSketchGenerationError = class extends Error {
  constructor(code, message) {
    super(message);
    this.name = "MidiSketchGenerationError";
    this.code = code;
  }
};
var VocalAttitude = {
  Clean: 0,
  Expressive: 1,
  Raw: 2
};
var CompositionStyle = {
  MelodyLead: 0,
  BackgroundMotif: 1,
  SynthDriven: 2
};
var ATTITUDE_CLEAN = 1 << 0;
var ATTITUDE_EXPRESSIVE = 1 << 1;
var ATTITUDE_RAW = 1 << 2;
var ModulationTiming = {
  None: 0,
  LastChorus: 1,
  AfterBridge: 2,
  EachChorus: 3,
  Random: 4
};
var IntroChant = {
  None: 0,
  Gachikoi: 1,
  Shouting: 2
};
var MixPattern = {
  None: 0,
  Standard: 1,
  Tiger: 2
};
var CallDensity = {
  None: 0,
  Minimal: 1,
  Standard: 2,
  Intense: 3
};
var ArrangementGrowth = {
  LayerAdd: 0,
  RegisterAdd: 1
};
var MotifRepeatScope = {
  FullSong: 0,
  Section: 1
};
var MelodicComplexity = {
  Simple: 0,
  Standard: 1,
  Complex: 2
};
var HookIntensity = {
  Off: 0,
  Light: 1,
  Normal: 2,
  Strong: 3
};
var VocalGrooveFeel = {
  Straight: 0,
  OffBeat: 1,
  Swing: 2,
  Syncopated: 3,
  Driving16th: 4,
  Bouncy8th: 5
};
var VocalStylePreset = {
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
  PowerfulShout: 12
};

// js/src/builder.ts
var ChangeTracker = class {
  constructor() {
    this.changes = [];
    this.warnings = [];
    this.categories = /* @__PURE__ */ new Set();
  }
  addChange(category, field, oldValue, newValue, reason) {
    this.changes.push({ category, field, oldValue, newValue, reason });
    this.categories.add(category);
  }
  addWarning(message) {
    this.warnings.push(message);
  }
  toResult() {
    return {
      changedCount: this.changes.length,
      changedCategories: Array.from(this.categories),
      changes: this.changes,
      warnings: this.warnings
    };
  }
};
var SongConfigBuilder = class {
  /**
   * Create a new builder with default config for the given style
   * @param styleId Style preset ID (0-12)
   */
  constructor(styleId = 0) {
    this.explicitFields = /* @__PURE__ */ new Set();
    this.lastChangeResult = null;
    this.config = createDefaultConfig(styleId);
  }
  // ============================================================================
  // State Management
  // ============================================================================
  /**
   * Get the result of the last change operation
   */
  getLastChangeResult() {
    return this.lastChangeResult;
  }
  /**
   * Get list of explicitly set field names
   */
  getExplicitFields() {
    return Array.from(this.explicitFields);
  }
  /**
   * Get list of fields that would be derived/auto-set
   */
  getDerivedFields() {
    const allFields = Object.keys(this.config);
    return allFields.filter((f) => !this.explicitFields.has(f));
  }
  /**
   * Build and return the SongConfig
   */
  build() {
    return { ...this.config };
  }
  /**
   * Reset all settings to defaults
   * @param styleId Optional new style ID (defaults to current)
   */
  reset(styleId) {
    const sid = styleId ?? this.config.stylePresetId;
    this.config = createDefaultConfig(sid);
    this.explicitFields.clear();
    this.lastChangeResult = null;
    return this;
  }
  /**
   * Reset to defaults but keep explicitly set values
   * @param styleId Optional new style ID (defaults to current)
   */
  resetKeepExplicit(styleId) {
    const sid = styleId ?? this.config.stylePresetId;
    const defaultConfig = createDefaultConfig(sid);
    const preserved = {};
    for (const field of this.explicitFields) {
      preserved[field] = this.config[field];
    }
    this.config = defaultConfig;
    Object.assign(this.config, preserved);
    this.lastChangeResult = null;
    return this;
  }
  // ============================================================================
  // Basic Setters (No Cascade)
  // ============================================================================
  /**
   * Set random seed
   * @param seed Seed value (0 = random)
   */
  setSeed(seed) {
    this.setField("seed", seed, "basic");
    return this;
  }
  /**
   * Set key
   * @param key Key (0-11, 0=C, 1=C#, etc.)
   */
  setKey(key) {
    this.setField("key", key, "basic");
    return this;
  }
  /**
   * Set chord progression
   * @param id Chord progression ID
   */
  setChordProgression(id) {
    this.setField("chordProgressionId", id, "chord");
    return this;
  }
  /**
   * Set form/structure pattern
   * @param id Form ID
   */
  setForm(id) {
    this.setField("formId", id, "basic");
    return this;
  }
  /**
   * Set vocal range
   * @param low Lower MIDI note bound
   * @param high Upper MIDI note bound
   */
  setVocalRange(low, high) {
    const actualLow = Math.min(low, high);
    const actualHigh = Math.max(low, high);
    this.setField("vocalLow", actualLow, "vocal");
    this.setField("vocalHigh", actualHigh, "vocal");
    return this;
  }
  /**
   * Set vocal style preset with cascade detection
   *
   * Idol-style vocalStyles (4=Idol, 9=BrightKira, 11=CuteAffected) will
   * auto-enable call system if callEnabled is not explicitly set.
   *
   * @param style Vocal style ID (0=Auto, 1=Standard, 2=Vocaloid, etc.)
   */
  setVocalStyle(style) {
    const tracker = new ChangeTracker();
    const oldStyle = this.config.vocalStyle;
    this.config.vocalStyle = style;
    this.explicitFields.add("vocalStyle");
    tracker.addChange("vocal", "vocalStyle", oldStyle, style, "User set vocal style");
    const idolStyles = [4, 9, 11];
    if (idolStyles.includes(style) && !this.explicitFields.has("callEnabled")) {
      if (!this.config.callEnabled) {
        const oldCall = this.config.callEnabled;
        this.config.callEnabled = true;
        tracker.addChange(
          "call",
          "callEnabled",
          oldCall,
          true,
          `Idol-style vocalStyle (${style}) auto-enables call system`
        );
      }
    }
    this.lastChangeResult = tracker.toResult();
    return this;
  }
  /**
   * Set vocal attitude
   * @param attitude 0=Clean, 1=Expressive, 2=Raw
   */
  setVocalAttitude(attitude) {
    this.setField("vocalAttitude", attitude, "vocal");
    return this;
  }
  /**
   * Set humanization settings
   * @param enabled Enable humanization
   * @param timing Timing variation (0-100)
   * @param velocity Velocity variation (0-100)
   */
  setHumanize(enabled, timing, velocity) {
    this.setField("humanize", enabled, "basic");
    if (timing !== void 0) {
      this.setField("humanizeTiming", timing, "basic");
    }
    if (velocity !== void 0) {
      this.setField("humanizeVelocity", velocity, "basic");
    }
    return this;
  }
  /**
   * Set modulation settings with validation
   *
   * Warning: If timing≠0 and semitones=0, validation will fail.
   * When modulation is enabled, semitones must be 1-4.
   *
   * @param timing Modulation timing (0=None, 1=LastChorus, 2=AfterBridge, 3=EachChorus, 4=Random)
   * @param semitones Modulation amount (+1 to +4), required when timing≠0
   */
  setModulation(timing, semitones) {
    const tracker = new ChangeTracker();
    const oldTiming = this.config.modulationTiming;
    this.config.modulationTiming = timing;
    this.explicitFields.add("modulationTiming");
    tracker.addChange(
      "modulation",
      "modulationTiming",
      oldTiming,
      timing,
      "User set modulation timing"
    );
    if (semitones !== void 0) {
      const oldSemitones = this.config.modulationSemitones;
      this.config.modulationSemitones = semitones;
      this.explicitFields.add("modulationSemitones");
      tracker.addChange(
        "modulation",
        "modulationSemitones",
        oldSemitones,
        semitones,
        "User set modulation semitones"
      );
    }
    if (timing !== 0) {
      const currentSemitones = semitones ?? this.config.modulationSemitones;
      if (currentSemitones === 0 || currentSemitones < 1 || currentSemitones > 4) {
        tracker.addWarning(
          `Modulation timing=${timing} requires modulationSemitones to be 1-4. Current value: ${currentSemitones}`
        );
      }
    }
    this.lastChangeResult = tracker.toResult();
    return this;
  }
  /**
   * Set chord extension settings
   * @param opts Chord extension options
   */
  setChordExtensions(opts) {
    if (opts.sus !== void 0) {
      this.setField("chordExtSus", opts.sus, "chord");
    }
    if (opts.seventh !== void 0) {
      this.setField("chordExt7th", opts.seventh, "chord");
    }
    if (opts.ninth !== void 0) {
      this.setField("chordExt9th", opts.ninth, "chord");
    }
    if (opts.susProb !== void 0) {
      this.setField("chordExtSusProb", opts.susProb, "chord");
    }
    if (opts.seventhProb !== void 0) {
      this.setField("chordExt7thProb", opts.seventhProb, "chord");
    }
    if (opts.ninthProb !== void 0) {
      this.setField("chordExt9thProb", opts.ninthProb, "chord");
    }
    if (opts.susProb !== void 0 || opts.seventhProb !== void 0 || opts.ninthProb !== void 0) {
      this.config.chordExtProbExplicit = true;
    }
    return this;
  }
  /**
   * Set arpeggio settings
   * @param enabled Enable arpeggio
   * @param opts Arpeggio options
   */
  setArpeggio(enabled, opts) {
    this.setField("arpeggioEnabled", enabled, "arpeggio");
    if (opts) {
      if (opts.pattern !== void 0) {
        this.setField("arpeggioPattern", opts.pattern, "arpeggio");
      }
      if (opts.speed !== void 0) {
        this.setField("arpeggioSpeed", opts.speed, "arpeggio");
      }
      if (opts.octaveRange !== void 0) {
        this.setField("arpeggioOctaveRange", opts.octaveRange, "arpeggio");
      }
      if (opts.gate !== void 0) {
        this.setField("arpeggioGate", opts.gate, "arpeggio");
      }
      if (opts.syncChord !== void 0) {
        this.setField("arpeggioSyncChord", opts.syncChord, "arpeggio");
      }
    }
    return this;
  }
  /**
   * Set motif settings
   * @param opts Motif options
   */
  setMotif(opts) {
    if (opts.repeatScope !== void 0) {
      this.setField("motifRepeatScope", opts.repeatScope, "motif");
    }
    if (opts.fixedProgression !== void 0) {
      this.setField("motifFixedProgression", opts.fixedProgression, "motif");
    }
    if (opts.maxChordCount !== void 0) {
      this.setField("motifMaxChordCount", opts.maxChordCount, "motif");
    }
    return this;
  }
  /**
   * Set call/SE settings
   * @param opts Call options
   */
  setCall(opts) {
    if (opts.enabled !== void 0) {
      this.setField("callEnabled", opts.enabled, "call");
    }
    if (opts.notesEnabled !== void 0) {
      this.setField("callNotesEnabled", opts.notesEnabled, "call");
    }
    if (opts.density !== void 0) {
      this.setField("callDensity", opts.density, "call");
    }
    if (opts.introChant !== void 0) {
      this.setField("introChant", opts.introChant, "call");
    }
    if (opts.mixPattern !== void 0) {
      this.setField("mixPattern", opts.mixPattern, "call");
    }
    if (opts.seEnabled !== void 0) {
      this.setField("seEnabled", opts.seEnabled, "call");
    }
    return this;
  }
  /**
   * Set melodic complexity
   * @param complexity 0=Simple, 1=Standard, 2=Complex
   */
  setMelodicComplexity(complexity) {
    this.setField("melodicComplexity", complexity, "vocal");
    return this;
  }
  /**
   * Set hook intensity
   * @param intensity 0=Off, 1=Light, 2=Normal, 3=Strong
   */
  setHookIntensity(intensity) {
    this.setField("hookIntensity", intensity, "hook");
    return this;
  }
  /**
   * Set vocal groove feel
   * @param groove 0=Straight, 1=OffBeat, 2=Swing, 3=Syncopated, 4=Driving16th, 5=Bouncy8th
   */
  setVocalGroove(groove) {
    this.setField("vocalGroove", groove, "vocal");
    return this;
  }
  /**
   * Set melody template
   * @param template 0=Auto, 1=PlateauTalk, 2=RunUpTarget, etc.
   */
  setMelodyTemplate(template) {
    this.setField("melodyTemplate", template, "vocal");
    return this;
  }
  /**
   * Set arrangement growth
   * @param growth 0=LayerAdd, 1=RegisterAdd
   */
  setArrangementGrowth(growth) {
    this.setField("arrangementGrowth", growth, "basic");
    return this;
  }
  /**
   * Set target duration
   * @param seconds Target duration in seconds (0 = use formId)
   */
  setTargetDuration(seconds) {
    this.setField("targetDurationSeconds", seconds, "basic");
    return this;
  }
  /**
   * Skip vocal generation
   * @param skip Whether to skip vocal generation
   */
  setSkipVocal(skip) {
    this.setField("skipVocal", skip, "vocal");
    return this;
  }
  /**
   * Set drive feel
   * @param feel 0=laid-back, 50=neutral, 100=aggressive
   */
  setDriveFeel(feel) {
    this.setField("driveFeel", feel, "basic");
    return this;
  }
  /**
   * Set addictive mode (Behavioral Loop)
   * @param enabled Enable addictive mode
   */
  setAddictiveMode(enabled) {
    this.setField("addictiveMode", enabled, "basic");
    return this;
  }
  /**
   * Set mora rhythm mode
   * @param mode 0=Standard, 1=MoraTimed, 2=Auto
   */
  setMoraRhythmMode(mode) {
    this.setField("moraRhythmMode", mode, "vocal");
    return this;
  }
  /**
   * Set mood override
   * @param mood Mood preset ID (0-23)
   */
  setMood(mood) {
    this.setField("mood", mood, "basic");
    this.setField("moodExplicit", true, "basic");
    return this;
  }
  /**
   * Set form explicit mode (use formId exactly, no randomization)
   * @param explicit Whether formId should be used exactly
   */
  setFormExplicit(explicit) {
    this.setField("formExplicit", explicit, "basic");
    return this;
  }
  // ============================================================================
  // Cascade Setters
  // ============================================================================
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
  setBlueprint(id) {
    const tracker = new ChangeTracker();
    const oldBlueprint = this.config.blueprintId;
    this.config.blueprintId = id;
    this.explicitFields.add("blueprintId");
    tracker.addChange("basic", "blueprintId", oldBlueprint, id, "User set blueprint");
    if (id !== 255) {
      const paradigm = getBlueprintParadigm(id);
      const riffPolicy = getBlueprintRiffPolicy(id);
      const drumsRequiredBlueprints = [1, 5, 6, 7];
      const isDrumsRequired = drumsRequiredBlueprints.includes(id);
      if (isDrumsRequired) {
        if (!this.config.drumsEnabled) {
          const oldDrums = this.config.drumsEnabled;
          this.config.drumsEnabled = true;
          tracker.addChange(
            "drums",
            "drumsEnabled",
            oldDrums,
            true,
            `Blueprint ${getBlueprintName(id)} requires drums (drums_required=true)`
          );
          tracker.addWarning(
            `Blueprint ${getBlueprintName(id)} has drums_required=true; drumsEnabled forced to true`
          );
        }
      } else if (paradigm === GenerationParadigm.RhythmSync) {
        if (!this.config.drumsEnabled && !this.explicitFields.has("drumsEnabled")) {
          const oldDrums = this.config.drumsEnabled;
          this.config.drumsEnabled = true;
          tracker.addChange(
            "drums",
            "drumsEnabled",
            oldDrums,
            true,
            "RhythmSync blueprint works best with drums"
          );
        } else if (!this.config.drumsEnabled) {
          tracker.addWarning("RhythmSync blueprint works best with drums enabled");
        }
      }
      if (paradigm === GenerationParadigm.RhythmSync) {
        if (this.config.bpm > 0 && (this.config.bpm < 160 || this.config.bpm > 175) && !this.explicitFields.has("bpm")) {
          const oldBpm = this.config.bpm;
          const newBpm = Math.max(160, Math.min(175, this.config.bpm));
          this.config.bpm = newBpm;
          tracker.addChange(
            "bpm",
            "bpm",
            oldBpm,
            newBpm,
            "RhythmSync blueprint prefers BPM 160-175"
          );
        } else if (this.config.bpm > 0 && (this.config.bpm < 160 || this.config.bpm > 175)) {
          tracker.addWarning("RhythmSync blueprint works best with BPM 160-175");
        }
      }
      if (id === 9) {
        const HOOK_INTENSITY_MAXIMUM = 4;
        if (this.config.hookIntensity !== HOOK_INTENSITY_MAXIMUM && !this.explicitFields.has("hookIntensity")) {
          const oldHook = this.config.hookIntensity;
          this.config.hookIntensity = HOOK_INTENSITY_MAXIMUM;
          tracker.addChange(
            "hook",
            "hookIntensity",
            oldHook,
            HOOK_INTENSITY_MAXIMUM,
            "BehavioralLoop blueprint forces HookIntensity=Maximum"
          );
        }
        tracker.addWarning(
          "BehavioralLoop (ID 9) enables addictive_mode with maximum hook repetition and LockedPitch riff policy"
        );
      }
      if (riffPolicy === RiffPolicy.LockedPitch || riffPolicy === RiffPolicy.LockedAll) {
        tracker.addChange(
          "riffPolicy",
          "_riffPolicy",
          null,
          riffPolicy,
          `Blueprint uses ${riffPolicy === RiffPolicy.LockedPitch ? "LockedPitch" : "LockedAll"} riff policy`
        );
      }
    }
    this.lastChangeResult = tracker.toResult();
    return this;
  }
  /**
   * Set BPM with cascade detection
   *
   * For RhythmSync blueprints, warns if BPM is outside 160-175 range.
   * C++ respects explicit BPM and skips clamping.
   *
   * @param bpm BPM value (0 = use style default)
   */
  setBpm(bpm) {
    const tracker = new ChangeTracker();
    const oldBpm = this.config.bpm;
    if (this.config.blueprintId !== 255 && bpm > 0) {
      const paradigm = getBlueprintParadigm(this.config.blueprintId);
      if (paradigm === GenerationParadigm.RhythmSync && (bpm < 160 || bpm > 175)) {
        tracker.addWarning(`RhythmSync blueprint works best with BPM 160-175 (set: ${bpm})`);
      }
    }
    this.config.bpm = bpm;
    this.explicitFields.add("bpm");
    tracker.addChange("bpm", "bpm", oldBpm, bpm, "User set BPM");
    this.lastChangeResult = tracker.toResult();
    return this;
  }
  /**
   * Set composition style with cascade detection
   *
   * Setting composition style may automatically change:
   * - skipVocal (for BackgroundMotif/SynthDriven)
   * - arpeggioEnabled (for SynthDriven)
   *
   * @param style 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven
   */
  setCompositionStyle(style) {
    const tracker = new ChangeTracker();
    const oldStyle = this.config.compositionStyle;
    this.config.compositionStyle = style;
    this.explicitFields.add("compositionStyle");
    tracker.addChange("basic", "compositionStyle", oldStyle, style, "User set composition style");
    if ((style === CompositionStyle.BackgroundMotif || style === CompositionStyle.SynthDriven) && !this.explicitFields.has("skipVocal")) {
      const oldSkipVocal = this.config.skipVocal;
      if (!oldSkipVocal) {
        this.config.skipVocal = true;
        tracker.addChange(
          "vocal",
          "skipVocal",
          oldSkipVocal,
          true,
          style === CompositionStyle.BackgroundMotif ? "BackgroundMotif style skips vocal" : "SynthDriven style skips vocal"
        );
      }
    }
    if (style === CompositionStyle.SynthDriven && !this.explicitFields.has("arpeggioEnabled")) {
      const oldArpeggio = this.config.arpeggioEnabled;
      if (!oldArpeggio) {
        this.config.arpeggioEnabled = true;
        tracker.addChange(
          "arpeggio",
          "arpeggioEnabled",
          oldArpeggio,
          true,
          "SynthDriven style enables arpeggio"
        );
      }
    }
    this.lastChangeResult = tracker.toResult();
    return this;
  }
  /**
   * Set style preset with cascade detection
   *
   * Changing style preset resets mood, chord, form, bpm to style defaults.
   *
   * @param id Style preset ID (0-12)
   */
  setStylePreset(id) {
    const tracker = new ChangeTracker();
    const oldStyleId = this.config.stylePresetId;
    const defaultConfig = createDefaultConfig(id);
    this.config.stylePresetId = id;
    this.explicitFields.add("stylePresetId");
    tracker.addChange("basic", "stylePresetId", oldStyleId, id, "User set style preset");
    const fieldsToReset = [
      "chordProgressionId",
      "formId",
      "bpm",
      "vocalAttitude"
    ];
    for (const field of fieldsToReset) {
      if (!this.explicitFields.has(field) && this.config[field] !== defaultConfig[field]) {
        const oldValue = this.config[field];
        this.setConfigValue(field, defaultConfig[field]);
        tracker.addChange("basic", field, oldValue, defaultConfig[field], "Reset to style default");
      }
    }
    this.lastChangeResult = tracker.toResult();
    return this;
  }
  /**
   * Set drums enabled with cascade detection
   *
   * Disabling drums may trigger warnings for blueprints that require drums.
   *
   * @param enabled Whether drums are enabled
   */
  setDrums(enabled) {
    const tracker = new ChangeTracker();
    const oldDrums = this.config.drumsEnabled;
    this.config.drumsEnabled = enabled;
    this.config.drumsEnabledExplicit = true;
    this.explicitFields.add("drumsEnabled");
    tracker.addChange("drums", "drumsEnabled", oldDrums, enabled, "User set drums");
    if (!enabled && this.config.blueprintId !== 255) {
      const paradigm = getBlueprintParadigm(this.config.blueprintId);
      if (paradigm === GenerationParadigm.RhythmSync) {
        tracker.addWarning("RhythmSync blueprint works best with drums enabled");
      }
    }
    this.lastChangeResult = tracker.toResult();
    return this;
  }
  // ============================================================================
  // Private Helpers
  // ============================================================================
  setConfigValue(field, value) {
    this.config[field] = value;
  }
  setField(field, value, category) {
    const oldValue = this.config[field];
    this.setConfigValue(field, value);
    this.explicitFields.add(field);
    this.lastChangeResult = {
      changedCount: 1,
      changedCategories: [category],
      changes: [
        {
          category,
          field,
          oldValue,
          newValue: value,
          reason: "User set value"
        }
      ],
      warnings: []
    };
  }
};

// js/src/midi-sketch.ts
var PIANO_ROLL_INFO_SIZE = 784;
var MidiSketch = class {
  constructor() {
    const a = getApi();
    this.handle = a.create();
    if (!this.handle) {
      throw new Error("Failed to create MidiSketch instance");
    }
  }
  /**
   * Handle a generation result code, throwing appropriate errors.
   * For methods that accept a full config JSON (result===1 triggers validation).
   */
  handleGenerationResult(result, json, operation) {
    if (result === 0) {
      return;
    }
    const a = getApi();
    if (result === 1) {
      const validationResult = a.validateConfigJson(json, json.length);
      if (validationResult !== 0) {
        const msg = a.configErrorString(validationResult);
        throw new MidiSketchConfigError(validationResult, msg);
      }
    }
    const errorMessage = a.configErrorString(result);
    throw new MidiSketchGenerationError(result, `${operation} failed: ${errorMessage}`);
  }
  /**
   * Throw a generation error with a resolved error message.
   * For methods that don't take a full config JSON.
   */
  throwGenerationError(result, operation) {
    const a = getApi();
    const errorMessage = a.configErrorString(result);
    throw new MidiSketchGenerationError(result, `${operation} failed: ${errorMessage}`);
  }
  /**
   * Generate MIDI from a SongConfig
   * @throws {MidiSketchConfigError} If config validation fails
   * @throws {MidiSketchGenerationError} If generation fails for other reasons
   */
  generateFromConfig(config) {
    const a = getApi();
    const json = serializeConfig(config);
    const result = a.generateFromJson(this.handle, json, json.length);
    this.handleGenerationResult(result, json, "Generation");
  }
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
  generateFromBuilder(builder) {
    this.generateFromConfig(builder.build());
  }
  /**
   * Generate only the vocal track without accompaniment.
   * Use for trial-and-error workflow: generate vocal, listen, regenerate if needed.
   * Call generateAccompaniment() when satisfied with the vocal.
   * @throws {MidiSketchConfigError} If config validation fails
   * @throws {MidiSketchGenerationError} If generation fails
   */
  generateVocal(config) {
    const a = getApi();
    const json = serializeConfig(config);
    const result = a.generateVocalFromJson(this.handle, json, json.length);
    this.handleGenerationResult(result, json, "Vocal generation");
  }
  /**
   * Regenerate vocal track with new configuration or seed.
   * Keeps the same chord progression and structure.
   * @param configOrSeed VocalConfig object or seed number (default: 0 = new random)
   * @throws {MidiSketchGenerationError} If regeneration fails
   */
  regenerateVocal(configOrSeed = 0) {
    const a = getApi();
    const vocalConfig = typeof configOrSeed === "number" ? { seed: configOrSeed } : configOrSeed;
    const json = serializeVocalConfig(vocalConfig);
    const result = a.regenerateVocalFromJson(this.handle, json, json.length);
    if (result !== 0) {
      this.throwGenerationError(result, "Vocal regeneration");
    }
  }
  /**
   * Generate accompaniment tracks for existing vocal.
   * Must be called after generateVocal() or generateWithVocal().
   * Generates: Aux -> Bass -> Chord -> Drums (adapting to vocal).
   * @param config Optional accompaniment configuration
   * @throws {MidiSketchGenerationError} If generation fails
   */
  generateAccompaniment(config) {
    const a = getApi();
    if (config === void 0) {
      const result = a.generateAccompaniment(this.handle);
      if (result !== 0) {
        this.throwGenerationError(result, "Accompaniment generation");
      }
    } else {
      const json = serializeAccompanimentConfig(config);
      const result = a.generateAccompanimentFromJson(this.handle, json, json.length);
      if (result !== 0) {
        this.throwGenerationError(result, "Accompaniment generation");
      }
    }
  }
  /**
   * Regenerate accompaniment tracks with a new seed or configuration.
   * Keeps current vocal, regenerates all accompaniment tracks
   * (Aux, Bass, Chord, Drums, etc.) with the specified seed/config.
   * Must have existing vocal (call generateVocal() first).
   * @param seedOrConfig Random seed (0 = auto-generate) or AccompanimentConfig
   * @throws {MidiSketchGenerationError} If regeneration fails
   */
  regenerateAccompaniment(seedOrConfig = 0) {
    const a = getApi();
    if (typeof seedOrConfig === "number") {
      const result = a.regenerateAccompaniment(this.handle, seedOrConfig);
      if (result !== 0) {
        this.throwGenerationError(result, "Accompaniment regeneration");
      }
    } else {
      const json = serializeAccompanimentConfig(seedOrConfig);
      const result = a.regenerateAccompanimentFromJson(this.handle, json, json.length);
      if (result !== 0) {
        this.throwGenerationError(result, "Accompaniment regeneration");
      }
    }
  }
  /**
   * Generate all tracks with vocal-first priority.
   * Generation order: Vocal -> Aux -> Bass -> Chord -> Drums.
   * Accompaniment adapts to vocal melody.
   * @throws {MidiSketchConfigError} If config validation fails
   * @throws {MidiSketchGenerationError} If generation fails
   */
  generateWithVocal(config) {
    const a = getApi();
    const json = serializeConfig(config);
    const result = a.generateWithVocalFromJson(this.handle, json, json.length);
    this.handleGenerationResult(result, json, "Generation");
  }
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
  setVocalNotes(config, notes) {
    const a = getApi();
    const configJson = serializeConfig(config);
    const notesArray = notes.map((note) => ({
      start_tick: note.startTick,
      duration: note.duration,
      pitch: note.pitch,
      velocity: note.velocity
    }));
    const combined = `{"config":${configJson},"notes":${JSON.stringify(notesArray)}}`;
    const result = a.setVocalNotesFromJson(this.handle, combined, combined.length);
    this.handleGenerationResult(result, configJson, "Set vocal notes");
  }
  /**
   * Get the generated MIDI data
   */
  getMidi() {
    const a = getApi();
    const m = getModule();
    const midiDataPtr = a.getMidi(this.handle);
    if (!midiDataPtr) {
      throw new Error("No MIDI data available");
    }
    try {
      const dataPtr = m.HEAPU32[midiDataPtr >> 2];
      const size = m.HEAPU32[midiDataPtr + 4 >> 2];
      const result = new Uint8Array(size);
      result.set(m.HEAPU8.subarray(dataPtr, dataPtr + size));
      return result;
    } finally {
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
      throw new Error("No event data available");
    }
    try {
      const jsonPtr = m.HEAPU32[eventDataPtr >> 2];
      const json = m.UTF8ToString(jsonPtr);
      return JSON.parse(json);
    } finally {
      a.freeEvents(eventDataPtr);
    }
  }
  // ============================================================================
  // Piano Roll Safety API
  // ============================================================================
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
  getPianoRollSafetyAt(tick, prevPitch) {
    const a = getApi();
    const m = getModule();
    const infoPtr = prevPitch !== void 0 ? a.getPianoRollSafetyWithContext(this.handle, tick, prevPitch) : a.getPianoRollSafetyAt(this.handle, tick);
    if (!infoPtr) {
      throw new Error("Failed to get piano roll safety info. Generate MIDI first.");
    }
    return this.parsePianoRollInfo(m, infoPtr);
  }
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
  getPianoRollSafety(startTick, endTick, step) {
    const a = getApi();
    const m = getModule();
    const dataPtr = a.getPianoRollSafety(this.handle, startTick, endTick, step);
    if (!dataPtr) {
      throw new Error("Failed to get piano roll safety data. Generate MIDI first.");
    }
    try {
      const infoArrayPtr = m.HEAPU32[dataPtr >> 2];
      const count = m.HEAPU32[dataPtr + 4 >> 2];
      const results = [];
      for (let idx = 0; idx < count; idx++) {
        const infoPtr = infoArrayPtr + idx * PIANO_ROLL_INFO_SIZE;
        results.push(this.parsePianoRollInfo(m, infoPtr));
      }
      return results;
    } finally {
      a.freePianoRollData(dataPtr);
    }
  }
  /**
   * Convert reason flags to human-readable string.
   *
   * @param reason Reason flags from PianoRollInfo
   * @returns Human-readable string like "ChordTone" or "LowRegister, Tritone"
   */
  reasonToString(reason) {
    const a = getApi();
    return a.reasonToString(reason);
  }
  /**
   * Parse MidiSketchPianoRollInfo from WASM memory.
   * @internal
   */
  parsePianoRollInfo(m, ptr) {
    const view = new DataView(m.HEAPU8.buffer);
    const tick = view.getUint32(ptr + 0, true);
    const chordDegree = view.getInt8(ptr + 4);
    const currentKey = view.getUint8(ptr + 5);
    const safety = [];
    for (let idx = 0; idx < 128; idx++) {
      safety.push(view.getUint8(ptr + 6 + idx));
    }
    const reason = [];
    for (let idx = 0; idx < 128; idx++) {
      reason.push(view.getUint16(ptr + 134 + idx * 2, true));
    }
    const collision = [];
    for (let idx = 0; idx < 128; idx++) {
      const collisionOffset = ptr + 390 + idx * 3;
      collision.push({
        trackRole: view.getUint8(collisionOffset),
        collidingPitch: view.getUint8(collisionOffset + 1),
        intervalSemitones: view.getUint8(collisionOffset + 2)
      });
    }
    const recommendedCount = view.getUint8(ptr + 782);
    const recommended = [];
    for (let idx = 0; idx < recommendedCount && idx < 8; idx++) {
      recommended.push(view.getUint8(ptr + 774 + idx));
    }
    return {
      tick,
      chordDegree,
      currentKey,
      safety,
      reason,
      collision,
      recommended
    };
  }
  /**
   * Get the resolved blueprint ID after generation.
   *
   * Returns the actual blueprint ID used for generation.
   * If blueprintId was set to 255 (random), this returns the selected ID.
   *
   * @returns Resolved blueprint ID (0-3), or 255 if not generated
   */
  getResolvedBlueprintId() {
    const a = getApi();
    return a.getResolvedBlueprintId(this.handle);
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
};
var midi_sketch_default = MidiSketch;

// js/src/presets.ts
function getStructures() {
  const a = getApi();
  const count = a.structureCount();
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push({ name: a.structureName(i) });
  }
  return result;
}
function getMoods() {
  const a = getApi();
  const count = a.moodCount();
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push({
      name: a.moodName(i),
      defaultBpm: a.moodDefaultBpm(i)
    });
  }
  return result;
}
function getChords() {
  const a = getApi();
  const count = a.chordCount();
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push({
      name: a.chordName(i),
      display: a.chordDisplay(i)
    });
  }
  return result;
}
function getStylePresets() {
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
      allowedAttitudes: a.stylePresetAllowedAttitudes(i)
    });
  }
  return result;
}
function getProgressionsByStyle(styleId) {
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
function getFormsByStyle(styleId) {
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

// js/src/types.ts
var NoteSafety = {
  /** Green: chord tone, safe to use */
  Safe: 0,
  /** Yellow: tension, low register, or passing tone */
  Warning: 1,
  /** Red: dissonant or out of range */
  Dissonant: 2
};
var NoteReason = {
  None: 0,
  // Positive reasons (green)
  ChordTone: 1,
  // Chord tone (root, 3rd, 5th, 7th)
  Tension: 2,
  // Tension (9th, 11th, 13th)
  ScaleTone: 4,
  // Scale tone (not chord but in scale)
  // Warning reasons (yellow)
  LowRegister: 8,
  // Low register (below C4), may sound muddy
  Tritone: 16,
  // Tritone interval (unstable except on V7)
  LargeLeap: 32,
  // Large leap (6+ semitones from prev note)
  // Dissonant reasons (red)
  Minor2nd: 64,
  // Minor 2nd (1 semitone) collision
  Major7th: 128,
  // Major 7th (11 semitones) collision
  NonScale: 256,
  // Non-scale tone (chromatic)
  PassingTone: 512,
  // Can be used as passing tone
  // Out of range reasons (red)
  OutOfRange: 1024,
  // Outside vocal range
  TooHigh: 2048,
  // Too high to sing
  TooLow: 4096
  // Too low to sing
};

// js/src/utils.ts
function getVersion() {
  return getApi().version();
}
function downloadMidi(midiData, filename = "output.mid") {
  const buffer = new ArrayBuffer(midiData.length);
  new Uint8Array(buffer).set(midiData);
  const blob = new Blob([buffer], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
export {
  ATTITUDE_CLEAN,
  ATTITUDE_EXPRESSIVE,
  ATTITUDE_RAW,
  ArrangementGrowth,
  CallDensity,
  CompositionStyle,
  ConfigError,
  GenerationParadigm,
  HookIntensity,
  IntroChant,
  MelodicComplexity,
  MidiSketch,
  MidiSketchConfigError,
  MidiSketchGenerationError,
  MixPattern,
  ModulationTiming,
  MotifRepeatScope,
  NoteReason,
  NoteSafety,
  RiffPolicy,
  SongConfigBuilder,
  VocalAttitude,
  VocalGrooveFeel,
  VocalStylePreset,
  createDefaultConfig,
  midi_sketch_default as default,
  deserializeConfig,
  downloadMidi,
  getBlueprintCount,
  getBlueprintName,
  getBlueprintParadigm,
  getBlueprintRiffPolicy,
  getBlueprintWeight,
  getBlueprints,
  getChords,
  getConfigErrorMessage,
  getFormsByStyle,
  getMoods,
  getProgressionsByStyle,
  getStructures,
  getStylePresets,
  getVersion,
  init,
  serializeAccompanimentConfig,
  serializeConfig,
  serializeVocalConfig,
  validateConfig
};
