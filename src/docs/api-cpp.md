# C++ API Reference

This page documents the native C++ API and the C ABI used by FFI and WASM bindings. The C ABI accepts JSON for configuration; it has no binary configuration structs.

## MidiSketch Class

### Constructor

~~~cpp
#include "midisketch.h"

midisketch::MidiSketch sketch;
~~~

::: info Header Files
- midisketch.h - C++ class API
- midisketch_c.h - C ABI for FFI/WASM bindings
- core/types.h - Core types included by the C++ API
:::

### generate(params)

Generate a song from the lower-level GeneratorParams type.

~~~cpp
midisketch::GeneratorParams params;
params.key = midisketch::Key::C;
params.bpm = 120;
params.seed = 12345;
sketch.generate(params);
~~~

### generateFromConfig(config)

Generate MIDI from SongConfig. bpm = 0 and seed = 0 select the style default tempo and a generated seed. chord_progression_id = 255 selects a progression from the style recommendations.

~~~cpp
using namespace midisketch;

SongConfig config;
config.style_preset_id = 0;
config.key = Key::C;
config.bpm = 120;
config.seed = 12345;
config.chord_progression_id = 255;
config.form = StructurePattern::StandardPop;
config.vocal_attitude = VocalAttitude::Expressive;
config.drums_enabled = true;
config.guitar_enabled = true;

config.arpeggio_enabled = false;
config.arpeggio.pattern = ArpeggioPattern::Up;
config.arpeggio.speed = ArpeggioSpeed::Sixteenth;
config.arpeggio.octave_range = 2;
config.arpeggio.gate = 0.8f;
config.arpeggio.sync_chord = true;

config.chord_extension.enable_7th = false;
config.chord_extension.seventh_probability = 0.15f;
config.humanize = false;
config.call_setting = CallSetting::Auto;
config.call_density = CallDensity::Standard;

sketch.generateFromConfig(config);
~~~

::: info Parameter Dependencies
Some fields take effect only when their parent option is enabled. For example, arpeggio.pattern is ignored when arpeggio_enabled is false. See [Option Relationships](/docs/option-relationships) for the dependency tree.
:::

### generateVocal(config)

Generate the vocal track without accompaniment.

~~~cpp
SongConfig config;
config.style_preset_id = 0;
config.key = Key::C;
config.bpm = 120;
config.vocal_attitude = VocalAttitude::Expressive;
sketch.generateVocal(config);
~~~

### regenerateVocal(config)

Regenerate the vocal track while retaining the current chord progression and structure. The seed overload regenerates with a new seed.

~~~cpp
sketch.regenerateVocal(12345);

VocalConfig vocal_config;
vocal_config.seed = 12345;
vocal_config.vocal_low = 60;
vocal_config.vocal_high = 79;
vocal_config.vocal_attitude = VocalAttitude::Expressive;
vocal_config.vocal_style = VocalStylePreset::Auto;
vocal_config.keep_motif = false;
sketch.regenerateVocal(vocal_config);
~~~

VocalConfig constructed in C++ has present_fields = kAllFields, so all declared fields participate. JSON updates can provide a subset; readFrom records the supplied fields in present_fields.

### generateAccompanimentForVocal(config?)

Generate enabled accompaniment tracks for an existing vocal. Call this after generateVocal(), generateWithVocal(), or setVocalNotes().

~~~cpp
sketch.generateAccompanimentForVocal();

AccompanimentConfig accompaniment;
accompaniment.seed = 12345;
accompaniment.drums_enabled = true;
accompaniment.guitar_enabled = true;
accompaniment.arpeggio_enabled = false;
accompaniment.arpeggio_gate = 80;       // 0-100
accompaniment.humanize_timing = 0.4f;   // 0.0-1.0
accompaniment.humanize_velocity = 0.3f; // 0.0-1.0
sketch.generateAccompanimentForVocal(accompaniment);
~~~

AccompanimentConfig constructed in C++ has present_fields = kAllFields. Its probability and humanization fields use normalized 0.0-1.0 floats; arpeggio_gate uses 0-100.

### regenerateAccompaniment(seedOrConfig)

Keep the current vocal and regenerate accompaniment tracks with a new seed or configuration.

~~~cpp
sketch.regenerateAccompaniment(12345);

AccompanimentConfig accompaniment;
accompaniment.seed = 12345;
accompaniment.drums_enabled = true;
accompaniment.arpeggio_enabled = true;
sketch.regenerateAccompaniment(accompaniment);
~~~

### generateWithVocal(config)

Generate all tracks with vocal-first priority.

~~~cpp
SongConfig config;
config.style_preset_id = 0;
config.key = Key::C;
config.bpm = 120;
sketch.generateWithVocal(config);
~~~

### setVocalNotes(config, notes)

Initialize structure and chords from config, replace the vocal track with supplied notes, and then generate accompaniment. NoteEvent constructors are private; use NoteEventBuilder::create().

~~~cpp
SongConfig config;
config.style_preset_id = 0;
config.key = Key::C;
config.bpm = 120;

std::vector<NoteEvent> notes = {
    NoteEventBuilder::create(0, 480, 60, 100),
    NoteEventBuilder::create(480, 480, 62, 100),
    NoteEventBuilder::create(960, 960, 64, 100),
};

sketch.setVocalNotes(config, notes);
sketch.generateAccompanimentForVocal();
auto midi = sketch.getMidi();
~~~

### getMidi()

Return the generated MIDI file as an owning std::vector<uint8_t> copy.

~~~cpp
std::vector<uint8_t> midi_data = sketch.getMidi();
std::ofstream out("output.mid", std::ios::binary);
out.write(reinterpret_cast<const char*>(midi_data.data()),
          static_cast<std::streamsize>(midi_data.size()));
~~~

### getVocalPreviewMidi()

Return a minimal MIDI file containing the vocal melody and root-bass guide as an owning byte-vector copy.

~~~cpp
auto preview = sketch.getVocalPreviewMidi();
~~~

### getEventsJson()

Return event data for visualization or playback as an owning std::string copy.

~~~cpp
std::string events_json = sketch.getEventsJson();
~~~

### getMelody() / setMelody(melody)

Save and restore vocal melody candidates.

~~~cpp
MelodyData candidate = sketch.getMelody();
// ...try another candidate...
sketch.setMelody(candidate);
~~~

### getSong() / getParams() / getWarnings()

Return read-only references to state owned by sketch. The references remain valid until destruction; later generation calls can change their contents.

~~~cpp
const Song& song = sketch.getSong();
const GeneratorParams& params = sketch.getParams();
const std::vector<std::string>& warnings = sketch.getWarnings();
~~~

getWarnings() reports non-fatal warnings from the latest generation operation.

### getHarmonyContext()

Return the read-only harmony context used by the piano-roll safety API.

~~~cpp
const IHarmonyContext& harmony = sketch.getHarmonyContext();
~~~

### setMidiFormat(format) / getMidiFormat()

Select or query the MIDI output format. New MidiSketch instances use MidiFormat::SMF1 by default.

~~~cpp
sketch.setMidiFormat(MidiFormat::SMF1); // Standard MIDI File Type 1
sketch.setMidiFormat(MidiFormat::SMF2); // MIDI 2.0 Container File
MidiFormat format = sketch.getMidiFormat();
~~~

### resolvedBlueprintId()

Return the blueprint selected by the latest generation. Call this after generation.

~~~cpp
uint8_t blueprint_id = sketch.resolvedBlueprintId();
~~~

### version()

Return the library version string as a borrowed static string.

~~~cpp
const char* version = MidiSketch::version();
~~~

---

## Generation Workflows

MidiSketch supports BGM-first, vocal-first, and custom-vocal workflows.

::: tip Choosing a Workflow
| Workflow | Use case |
|----------|----------|
| BGM-first | Generate accompaniment before adding vocals |
| Vocal-first | Iterate on a generated melody before accompaniment |
| Custom Vocal | Import notes and generate matching accompaniment |
:::

### BGM-First Workflow

~~~cpp
MidiSketch sketch;
SongConfig config;
config.style_preset_id = 0;
config.skip_vocal = true;
sketch.generateFromConfig(config);

VocalConfig vocal;
vocal.seed = 0;
vocal.vocal_low = 60;
vocal.vocal_high = 79;
sketch.regenerateVocal(vocal);
auto midi = sketch.getMidi();
~~~

### Vocal-First Workflow

~~~cpp
MidiSketch sketch;
SongConfig config;
config.style_preset_id = 0;
sketch.generateVocal(config);

VocalConfig vocal;
vocal.seed = 12345;
vocal.vocal_attitude = VocalAttitude::Expressive;
sketch.regenerateVocal(vocal);
sketch.generateAccompanimentForVocal();
auto midi = sketch.getMidi();
~~~

### Custom Vocal Import Workflow

~~~cpp
MidiSketch sketch;
SongConfig config;
config.style_preset_id = 0;

std::vector<NoteEvent> notes = {
    NoteEventBuilder::create(0, 480, 60, 100),
    NoteEventBuilder::create(480, 480, 62, 100),
    NoteEventBuilder::create(960, 960, 64, 100),
};
sketch.setVocalNotes(config, notes);
sketch.generateAccompanimentForVocal();
auto midi = sketch.getMidi();
~~~

---

## Core Types

### SongConfig

The high-level configuration passed to generateFromConfig(), generateVocal(), generateWithVocal(), and setVocalNotes().

~~~cpp
struct SongConfig {
  uint8_t style_preset_id = 0;
  uint8_t blueprint_id = 0;       // 255 = random blueprint
  uint8_t mood = 0;
  bool mood_explicit = false;

  Key key = Key::C;
  uint16_t bpm = 0;                  // 0 = style default
  uint32_t seed = 0;                 // 0 = random
  uint8_t chord_progression_id = 255; // 255 = style auto-selection

  StructurePattern form = StructurePattern::StandardPop;
  bool form_explicit = false;
  uint16_t target_duration_seconds = 0; // 0 = use form

  VocalAttitude vocal_attitude = VocalAttitude::Clean;
  VocalStylePreset vocal_style = VocalStylePreset::Auto;
  uint8_t drive_feel = 50;           // 0-100

  bool drums_enabled = true;
  bool drums_enabled_explicit = false;
  bool arpeggio_enabled = false;
  bool guitar_enabled = true;
  bool skip_vocal = false;
  uint8_t vocal_low = 60;
  uint8_t vocal_high = 79;

  ArpeggioParams arpeggio;
  ChordExtensionParams chord_extension;
  bool chord_ext_prob_explicit = false;

  CompositionStyle composition_style = CompositionStyle::MelodyLead;
  bool composition_style_explicit = false;
  MotifChordParams motif_chord;
  MotifRepeatScope motif_repeat_scope = MotifRepeatScope::FullSong;
  ArrangementGrowth arrangement_growth = ArrangementGrowth::LayerAdd;

  bool humanize = false;
  float humanize_timing = 0.4f;
  float humanize_velocity = 0.3f;

  ModulationTiming modulation_timing = ModulationTiming::None;
  int8_t modulation_semitones = 2;

  bool se_enabled = true;
  CallSetting call_setting = CallSetting::Auto;
  bool call_notes_enabled = true;
  IntroChant intro_chant = IntroChant::None;
  MixPattern mix_pattern = MixPattern::None;
  CallDensity call_density = CallDensity::Standard;

  MelodyTemplateId melody_template = MelodyTemplateId::Auto;
  MelodicComplexity melodic_complexity = MelodicComplexity::Standard;
  HookIntensity hook_intensity = HookIntensity::Normal;
  VocalGrooveFeel vocal_groove = VocalGrooveFeel::Straight;
  bool enable_syncopation = false;
  EnergyCurve energy_curve = EnergyCurve::GradualBuild;

  uint8_t melody_max_leap = 0;
  uint8_t melody_syncopation_prob = 0xFF;
  uint8_t melody_phrase_length = 0;
  uint8_t melody_long_note_ratio = 0xFF;
  int8_t melody_chorus_register_shift = INT8_MIN;
  uint8_t melody_hook_repetition = 0;
  uint8_t melody_use_leading_tone = 0;

  uint8_t motif_length = 0;
  uint8_t motif_note_count = 0;
  uint8_t motif_motion = 0xFF;
  uint8_t motif_register_high = 0;
  uint8_t motif_rhythm_density = 0xFF;

  bool addictive_mode = false;
  uint8_t mora_rhythm_mode = 2;
  uint8_t syllabic_sub_rate = 0;
};
~~~

The JSON field names are the snake_case names shown above. Nested fields are arpeggio, chord_extension, and motif_chord.

### ArpeggioParams / ChordExtensionParams

~~~cpp
struct ArpeggioParams {
  ArpeggioPattern pattern = ArpeggioPattern::Auto;
  ArpeggioSpeed speed = ArpeggioSpeed::Auto;
  uint8_t octave_range = 2;
  float gate = -1.0f;       // 0.0-1.0; -1 = style default
  bool sync_chord = true;
  uint8_t base_velocity = 90;
};

struct ChordExtensionParams {
  bool enable_sus = false;
  bool enable_7th = false;
  bool enable_9th = false;
  bool tritone_sub = false;
  float sus_probability = 0.2f;
  float seventh_probability = 0.15f;
  float ninth_probability = 0.25f;
  float tritone_sub_probability = 0.5f;
};
~~~

### VocalConfig

Direct C++ construction supplies every field because present_fields defaults to kAllFields (~0u). JSON parsing sets present_fields to the fields present in the object, enabling partial updates.

~~~cpp
struct VocalConfig {
  static constexpr uint32_t kAllFields = ~0u;
  uint32_t present_fields = kAllFields;
  uint32_t seed = 0;
  uint8_t vocal_low = 60;
  uint8_t vocal_high = 79;
  VocalAttitude vocal_attitude = VocalAttitude::Clean;
  VocalStylePreset vocal_style = VocalStylePreset::Auto;
  MelodyTemplateId melody_template = MelodyTemplateId::Auto;
  MelodicComplexity melodic_complexity = MelodicComplexity::Standard;
  HookIntensity hook_intensity = HookIntensity::Normal;
  VocalGrooveFeel vocal_groove = VocalGrooveFeel::Straight;
  CompositionStyle composition_style = CompositionStyle::MelodyLead;
  bool keep_motif = false;
};
~~~

### AccompanimentConfig

~~~cpp
struct AccompanimentConfig {
  static constexpr uint32_t kAllFields = ~0u;
  uint32_t present_fields = kAllFields;
  uint32_t seed = 0;
  bool drums_enabled = true;
  bool arpeggio_enabled = false;
  bool guitar_enabled = true;
  uint8_t arpeggio_pattern = 0;
  uint8_t arpeggio_speed = 1;
  uint8_t arpeggio_octave_range = 2;
  uint8_t arpeggio_gate = 80;
  bool arpeggio_sync_chord = true;
  bool chord_ext_sus = false;
  bool chord_ext_7th = false;
  bool chord_ext_9th = false;
  bool chord_ext_tritone_sub = false;
  float chord_ext_sus_prob = 0.2f;
  float chord_ext_7th_prob = 0.15f;
  float chord_ext_9th_prob = 0.25f;
  float chord_ext_tritone_sub_prob = 0.5f;
  bool humanize = false;
  float humanize_timing = 0.4f;
  float humanize_velocity = 0.3f;
  bool se_enabled = true;
  bool call_enabled = false;
  uint8_t call_density = 2;
  uint8_t intro_chant = 0;
  uint8_t mix_pattern = 0;
  bool call_notes_enabled = true;
};
~~~

The C++ type uses normalized floats for chord-extension probabilities and humanization. The integer 0-100 field is arpeggio_gate only.

### NoteEvent

~~~cpp
struct NoteEvent {
  Tick start_tick;
  Tick duration;
  uint8_t note;       // MIDI note number, 0-127
  uint8_t velocity;   // MIDI velocity, 0-127
  bool is_syllabic_subdivision = false;
};
~~~

The default and four-argument constructors are private. Use NoteEventBuilder::create(start, duration, note, velocity) for direct construction. Tick is uint32_t.

::: details Understanding Ticks
The core timing constants are 480 ticks per quarter note, 240 per eighth note, 120 per sixteenth note, and 1,920 per 4/4 bar. MIDI_C4 is 60.

~~~cpp
auto note = NoteEventBuilder::create(480, 480, 60, 100);
~~~
:::

### MelodyData

~~~cpp
struct MelodyData {
  uint32_t seed;
  std::vector<NoteEvent> notes;
};
~~~

---

## Enums

### Key

~~~cpp
enum class Key : uint8_t {
  C = 0, Cs, D, Eb, E, F, Fs, G, Ab, A, Bb, B
};
~~~

### VocalAttitude

~~~cpp
enum class VocalAttitude : uint8_t { Clean = 0, Expressive, Raw };
~~~

### CompositionStyle

~~~cpp
enum class CompositionStyle : uint8_t {
  MelodyLead = 0, BackgroundMotif, SynthDriven
};
~~~

### VocalStylePreset

~~~cpp
enum class VocalStylePreset : uint8_t {
  Auto = 0, Standard, Vocaloid, UltraVocaloid, Idol, Ballad, Rock,
  CityPop, Anime, BrightKira, CoolSynth, CuteAffected, PowerfulShout, KPop
};
~~~

### MelodyTemplateId

~~~cpp
enum class MelodyTemplateId : uint8_t {
  Auto = 0, PlateauTalk, RunUpTarget, DownResolve,
  HookRepeat, SparseAnchor, CallResponse, JumpAccent
};
~~~

### MelodicComplexity / HookIntensity

~~~cpp
enum class MelodicComplexity : uint8_t { Simple = 0, Standard, Complex };
enum class HookIntensity : uint8_t { Off = 0, Light, Normal, Strong, Maximum };
~~~

### VocalGrooveFeel

~~~cpp
enum class VocalGrooveFeel : uint8_t {
  Straight = 0, OffBeat, Swing, Syncopated, Driving16th, Bouncy8th
};
~~~

### StructurePattern

StructurePattern has 18 values, numbered 0 through 17 in declaration order.

~~~cpp
enum class StructurePattern : uint8_t {
  StandardPop = 0, BuildUp, DirectChorus, RepeatChorus, ShortForm,
  FullPop, FullWithBridge, DriveUpbeat, Ballad, AnthemStyle, ExtendedFull,
  ChorusFirst, ChorusFirstShort, ChorusFirstFull,
  ImmediateVocal, ImmediateVocalFull, AChorusB, DoubleVerse
};
~~~

### ModulationTiming / EnergyCurve

~~~cpp
enum class ModulationTiming : uint8_t {
  None = 0, LastChorus, AfterBridge, EachChorus, Random
};
enum class EnergyCurve : uint8_t {
  GradualBuild = 0, FrontLoaded, WavePattern, SteadyState
};
~~~

### CallSetting / CallDensity / IntroChant / MixPattern

~~~cpp
enum class CallSetting : uint8_t { Auto = 0, Enabled, Disabled };
enum class CallDensity : uint8_t { None = 0, Minimal, Standard, Intense };
enum class IntroChant : uint8_t { None = 0, Gachikoi, Shouting };
enum class MixPattern : uint8_t { None = 0, Standard, Tiger };
~~~

### ArrangementGrowth / MotifRepeatScope

~~~cpp
enum class ArrangementGrowth : uint8_t { LayerAdd = 0, RegisterAdd };
enum class MotifRepeatScope : uint8_t { FullSong = 0, Section };
~~~

### TrackRole

~~~cpp
enum class TrackRole : uint8_t {
  Vocal = 0, Chord, Bass, Drums, SE, Motif, Arpeggio, Aux, Guitar
};
~~~

### ArpeggioPattern / ArpeggioSpeed

Both enums have an Auto = 255 sentinel for style or blueprint selection.

~~~cpp
enum class ArpeggioPattern : uint8_t {
  Up = 0, Down, UpDown, Random, Pinwheel, PedalRoot, Alberti, BrokenChord,
  Auto = 255
};
enum class ArpeggioSpeed : uint8_t {
  Eighth = 0, Sixteenth, Triplet, Auto = 255
};
~~~

### MoraRhythmMode

MoraRhythmMode is represented by the uint8_t mora_rhythm_mode field in SongConfig.

~~~cpp
enum class MoraRhythmMode : uint8_t { Standard = 0, MoraTimed, Auto };
~~~

### MotifMotion / MotifRhythmDensity

~~~cpp
enum class MotifMotion : uint8_t {
  Stepwise = 0, GentleLeap, WideLeap, NarrowStep, Disjunct, Ostinato
};
enum class MotifRhythmDensity : uint8_t { Sparse = 0, Medium, Driving };
~~~

### MidiFormat

~~~cpp
enum class MidiFormat : uint8_t {
  SMF1 = 1, // Standard MIDI File Type 1
  SMF2 = 2  // MIDI 2.0 Container File
};
~~~

---

## Constants

~~~cpp
using Tick = uint32_t;
constexpr Tick TICKS_PER_BEAT = 480;
constexpr uint8_t BEATS_PER_BAR = 4;
constexpr Tick TICKS_PER_BAR = 1920;
constexpr uint8_t MIDI_C4 = 60;
constexpr MidiFormat kDefaultMidiFormat = MidiFormat::SMF1;
~~~

---

## C API (midisketch_c.h)

The C ABI is intended for FFI and WASM bindings. Configuration and melody inputs are JSON strings. Binary configuration structs are not part of the current header.

::: warning Memory and Threading
midisketch_get_midi(), midisketch_get_vocal_preview_midi(), midisketch_get_events(), midisketch_get_dissonance(), and midisketch_get_piano_roll_safety() allocate result objects. Free them with their matching midisketch_free_* function.

Names, error messages, and other const char* results are borrowed; never pass them to midisketch_free(). midisketch_get_warnings_json() and midisketch_get_melody_json() return thread-local storage replaced by the next call on the same thread. The default-config JSON, pointer candidate getters, single-tick piano-roll results, and string-conversion helpers use shared static storage. Synchronize calls that share a handle and synchronize pointer-returning query calls when they can run concurrently.
:::

### Handle Management

~~~c
MidiSketchHandle midisketch_create(void);
void midisketch_destroy(MidiSketchHandle handle);
~~~

### MIDI Format

~~~c
MidiSketchError midisketch_set_midi_format(
    MidiSketchHandle handle, MidiSketchMidiFormat format);
MidiSketchMidiFormat midisketch_get_midi_format(MidiSketchHandle handle);
~~~

The default is MIDISKETCH_MIDI_FORMAT_SMF1. Native builds support both formats. WASM builds return MIDISKETCH_ERROR_UNSUPPORTED_FORMAT (7) when asked to select SMF2.

### Generation Functions

~~~c
MidiSketchError midisketch_generate_accompaniment(MidiSketchHandle handle);
MidiSketchError midisketch_regenerate_accompaniment(
    MidiSketchHandle handle, uint32_t new_seed);
~~~

These no-config entry points require a generated song. The JSON entry points are listed below.

### Output Functions

~~~c
MidiSketchMidiData* midisketch_get_midi(MidiSketchHandle handle);
MidiSketchMidiData* midisketch_get_vocal_preview_midi(MidiSketchHandle handle);
void midisketch_free_midi(MidiSketchMidiData* data);

MidiSketchEventData* midisketch_get_events(MidiSketchHandle handle);
void midisketch_free_events(MidiSketchEventData* data);

MidiSketchDissonanceData* midisketch_get_dissonance(MidiSketchHandle handle);
void midisketch_free_dissonance(MidiSketchDissonanceData* data);

MidiSketchInfo midisketch_get_info(MidiSketchHandle handle);
~~~

MidiSketchInfo.track_count is the engine's nine defined track roles, including disabled or empty roles. Serialized MIDI omits empty tracks; event JSON may include track roles with empty notes.

### Preset Information

~~~c
uint8_t midisketch_structure_count(void);
uint8_t midisketch_mood_count(void);
uint8_t midisketch_chord_count(void);
const char* midisketch_structure_name(uint8_t id);
const char* midisketch_mood_name(uint8_t id);
const char* midisketch_chord_name(uint8_t id);
const char* midisketch_chord_display(uint8_t id);
uint16_t midisketch_mood_default_bpm(uint8_t id);

uint8_t midisketch_style_preset_count(void);
const char* midisketch_style_preset_name(uint8_t id);
const char* midisketch_style_preset_display_name(uint8_t id);
const char* midisketch_style_preset_description(uint8_t id);
uint16_t midisketch_style_preset_tempo_default(uint8_t id);
uint8_t midisketch_style_preset_allowed_attitudes(uint8_t id);
MidiSketchStylePresetSummary midisketch_get_style_preset(uint8_t id);

MidiSketchChordCandidates* midisketch_get_progressions_by_style_ptr(uint8_t style_id);
MidiSketchFormCandidates* midisketch_get_forms_by_style_ptr(uint8_t style_id);
MidiSketchChordCandidates midisketch_get_progressions_by_style(uint8_t style_id);
MidiSketchFormCandidates midisketch_get_forms_by_style(uint8_t style_id);
~~~

The _ptr candidate getters return shared static buffers and are not thread-safe. The by-value variants return a copy. Pointers inside MidiSketchStylePresetSummary refer to library-owned strings.

### Blueprint Information

~~~c
typedef enum {
  MIDISKETCH_PARADIGM_TRADITIONAL = 0,
  MIDISKETCH_PARADIGM_RHYTHM_SYNC = 1,
  MIDISKETCH_PARADIGM_MELODY_DRIVEN = 2
} MidiSketchParadigm;

typedef enum {
  MIDISKETCH_RIFF_FREE = 0,
  MIDISKETCH_RIFF_LOCKED_CONTOUR = 1,
  MIDISKETCH_RIFF_LOCKED_PITCH = 2,
  MIDISKETCH_RIFF_LOCKED_ALL = 3,
  MIDISKETCH_RIFF_EVOLVING = 4,
  MIDISKETCH_RIFF_LOCKED = MIDISKETCH_RIFF_LOCKED_CONTOUR
} MidiSketchRiffPolicy;

uint8_t midisketch_blueprint_count(void);
const char* midisketch_blueprint_name(uint8_t id);
MidiSketchParadigm midisketch_blueprint_paradigm(uint8_t id);
MidiSketchRiffPolicy midisketch_blueprint_riff_policy(uint8_t id);
uint8_t midisketch_blueprint_weight(uint8_t id);
uint8_t midisketch_blueprint_drums_required(uint8_t id);
uint8_t midisketch_vocal_style_call_enabled(uint8_t style);
uint16_t midisketch_blueprint_tempo_min(uint8_t id);
uint16_t midisketch_blueprint_tempo_max(uint8_t id);
uint8_t midisketch_get_resolved_blueprint_id(MidiSketchHandle handle);
const char* midisketch_get_warnings_json(MidiSketchHandle handle);
~~~

The blueprint tempo getters return 0 for an invalid ID. The resolved ID is 255 before generation. The warning JSON is an array string such as [] and its pointer is thread-local and borrowed.

### JSON Config API (WASM)

~~~c
MidiSketchError midisketch_generate_from_json(
    MidiSketchHandle handle, const char* config_json, size_t json_length);
MidiSketchError midisketch_generate_vocal_from_json(
    MidiSketchHandle handle, const char* config_json, size_t json_length);
MidiSketchError midisketch_generate_with_vocal_from_json(
    MidiSketchHandle handle, const char* config_json, size_t json_length);

const char* midisketch_create_default_config_json(uint8_t style_id);
MidiSketchConfigError midisketch_validate_config_json(
    const char* config_json, size_t json_length);
MidiSketchConfigError midisketch_get_last_config_error(MidiSketchHandle handle);

MidiSketchError midisketch_regenerate_vocal_from_json(
    MidiSketchHandle handle, const char* config_json, size_t json_length);
MidiSketchError midisketch_generate_accompaniment_from_json(
    MidiSketchHandle handle, const char* config_json, size_t json_length);
MidiSketchError midisketch_regenerate_accompaniment_from_json(
    MidiSketchHandle handle, const char* config_json, size_t json_length);
MidiSketchError midisketch_set_vocal_notes_from_json(
    MidiSketchHandle handle, const char* json, size_t json_length);
const char* midisketch_get_melody_json(MidiSketchHandle handle);
MidiSketchError midisketch_set_melody_from_json(
    MidiSketchHandle handle, const char* json, size_t json_length);
~~~

config_json uses the snake_case SongConfig fields. midisketch_create_default_config_json() returns a borrowed static string replaced by the next call. Passing NULL or an empty string to midisketch_regenerate_vocal_from_json() selects the seed-only overload. Accompaniment JSON uses AccompanimentConfig fields; its probability and humanization values are normalized floats (0.0-1.0), while arpeggio_gate is 0-100. The C implementation records supplied JSON fields for partial VocalConfig and AccompanimentConfig updates.

midisketch_set_vocal_notes_from_json() accepts this shape:

~~~json
{
  "config": {"style_preset_id": 0, "key": 0, "bpm": 120},
  "notes": [
    {"start_tick": 0, "duration": 480, "pitch": 60, "velocity": 100}
  ]
}
~~~

midisketch_get_melody_json() returns {"seed":N,"notes":[...]}. Its pointer is thread-local and replaced by the next call on the same thread.

### Piano Roll Safety API

~~~c
MidiSketchPianoRollData* midisketch_get_piano_roll_safety(
    MidiSketchHandle handle, uint32_t start_tick, uint32_t end_tick, uint32_t step);
MidiSketchPianoRollInfo* midisketch_get_piano_roll_safety_at(
    MidiSketchHandle handle, uint32_t tick);
MidiSketchPianoRollInfo* midisketch_get_piano_roll_safety_with_context(
    MidiSketchHandle handle, uint32_t tick, uint8_t prev_pitch);
void midisketch_free_piano_roll_data(MidiSketchPianoRollData* data);
size_t midisketch_piano_roll_data_count(const MidiSketchPianoRollData* data);
uint8_t midisketch_piano_roll_data_was_truncated(const MidiSketchPianoRollData* data);
const char* midisketch_reason_to_string(uint16_t reason);
const char* midisketch_collision_to_string(const MidiSketchCollisionInfo* collision);
~~~

Batch results own an array and are limited to 100,000 samples. Use the count and truncation helpers instead of reading the encoded count field directly. Single-tick results and the two string-conversion functions use shared static storage and must be consumed before the next call.

The safety values and reason flags are bit-compatible with the header:

~~~c
typedef enum {
  MIDISKETCH_NOTE_SAFE = 0,
  MIDISKETCH_NOTE_WARNING = 1,
  MIDISKETCH_NOTE_DISSONANT = 2
} MidiSketchNoteSafety;

typedef enum {
  MIDISKETCH_REASON_NONE = 0,
  MIDISKETCH_REASON_CHORD_TONE = 1,
  MIDISKETCH_REASON_TENSION = 2,
  MIDISKETCH_REASON_SCALE_TONE = 4,
  MIDISKETCH_REASON_LOW_REGISTER = 8,
  MIDISKETCH_REASON_TRITONE = 16,
  MIDISKETCH_REASON_LARGE_LEAP = 32,
  MIDISKETCH_REASON_MINOR_2ND = 64,
  MIDISKETCH_REASON_MAJOR_7TH = 128,
  MIDISKETCH_REASON_NON_SCALE = 256,
  MIDISKETCH_REASON_PASSING_TONE = 512,
  MIDISKETCH_REASON_OUT_OF_RANGE = 1024,
  MIDISKETCH_REASON_TOO_HIGH = 2048,
  MIDISKETCH_REASON_TOO_LOW = 4096
} MidiSketchNoteReason;

typedef struct {
  uint8_t track_role;
  uint8_t colliding_pitch;
  uint8_t interval_semitones;
} MidiSketchCollisionInfo;

typedef struct {
  uint32_t tick;
  int8_t chord_degree;
  uint8_t current_key;
  uint8_t safety[128];
  uint16_t reason[128];
  MidiSketchCollisionInfo collision[128];
  uint8_t recommended[8];
  uint8_t recommended_count;
} MidiSketchPianoRollInfo;

typedef struct {
  MidiSketchPianoRollInfo* data;
  size_t count;
} MidiSketchPianoRollData;
~~~

### Error Codes

~~~c
typedef enum {
  MIDISKETCH_OK = 0,
  MIDISKETCH_ERROR_INVALID_PARAM = 1,
  MIDISKETCH_ERROR_INVALID_STRUCTURE = 2, /* deprecated, ABI compatibility */
  MIDISKETCH_ERROR_INVALID_MOOD = 3,      /* deprecated, ABI compatibility */
  MIDISKETCH_ERROR_INVALID_CHORD = 4,     /* deprecated, ABI compatibility */
  MIDISKETCH_ERROR_GENERATION_FAILED = 5, /* deprecated, ABI compatibility */
  MIDISKETCH_ERROR_OUT_OF_MEMORY = 6,     /* deprecated, ABI compatibility */
  MIDISKETCH_ERROR_UNSUPPORTED_FORMAT = 7
} MidiSketchError;

const char* midisketch_error_string(MidiSketchError error);
const char* midisketch_config_error_string(MidiSketchConfigError error);
~~~

The error-string functions return borrowed static messages. MidiSketchConfigError values run from MIDISKETCH_CONFIG_OK = 0 through MIDISKETCH_CONFIG_INVALID_TARGET_DURATION = 35; the enum in midisketch_c.h is authoritative.

~~~c
typedef enum {
  MIDISKETCH_CONFIG_OK = 0,
  MIDISKETCH_CONFIG_INVALID_STYLE = 1,
  MIDISKETCH_CONFIG_INVALID_CHORD = 2,
  MIDISKETCH_CONFIG_INVALID_FORM = 3,
  MIDISKETCH_CONFIG_INVALID_ATTITUDE = 4,
  MIDISKETCH_CONFIG_INVALID_VOCAL_RANGE = 5,
  MIDISKETCH_CONFIG_INVALID_BPM = 6,
  MIDISKETCH_CONFIG_DURATION_TOO_SHORT = 7,
  MIDISKETCH_CONFIG_INVALID_MODULATION = 8,
  MIDISKETCH_CONFIG_INVALID_KEY = 9,
  MIDISKETCH_CONFIG_INVALID_COMPOSITION_STYLE = 10,
  MIDISKETCH_CONFIG_INVALID_ARPEGGIO_PATTERN = 11,
  MIDISKETCH_CONFIG_INVALID_ARPEGGIO_SPEED = 12,
  MIDISKETCH_CONFIG_INVALID_VOCAL_STYLE = 13,
  MIDISKETCH_CONFIG_INVALID_MELODY_TEMPLATE = 14,
  MIDISKETCH_CONFIG_INVALID_MELODIC_COMPLEXITY = 15,
  MIDISKETCH_CONFIG_INVALID_HOOK_INTENSITY = 16,
  MIDISKETCH_CONFIG_INVALID_VOCAL_GROOVE = 17,
  MIDISKETCH_CONFIG_INVALID_CALL_DENSITY = 18,
  MIDISKETCH_CONFIG_INVALID_INTRO_CHANT = 19,
  MIDISKETCH_CONFIG_INVALID_MIX_PATTERN = 20,
  MIDISKETCH_CONFIG_INVALID_MOTIF_REPEAT_SCOPE = 21,
  MIDISKETCH_CONFIG_INVALID_ARRANGEMENT_GROWTH = 22,
  MIDISKETCH_CONFIG_INVALID_MODULATION_TIMING = 23,
  MIDISKETCH_CONFIG_INVALID_BLUEPRINT = 24,
  MIDISKETCH_CONFIG_INVALID_CALL_SETTING = 25,
  MIDISKETCH_CONFIG_INVALID_ENERGY_CURVE = 26,
  MIDISKETCH_CONFIG_INVALID_DRIVE_FEEL = 27,
  MIDISKETCH_CONFIG_INVALID_MORA_RHYTHM_MODE = 28,
  MIDISKETCH_CONFIG_INVALID_PROBABILITY = 29,
  MIDISKETCH_CONFIG_INVALID_ARPEGGIO_RANGE = 30,
  MIDISKETCH_CONFIG_INVALID_MELODY_OVERRIDE = 31,
  MIDISKETCH_CONFIG_INVALID_MOTIF_OVERRIDE = 32,
  MIDISKETCH_CONFIG_INVALID_JSON = 33,
  MIDISKETCH_CONFIG_INVALID_MOOD = 34,
  MIDISKETCH_CONFIG_INVALID_TARGET_DURATION = 35
} MidiSketchConfigError;
~~~

### C API Structures

~~~c
typedef struct {
  uint8_t* data;
  size_t size;
} MidiSketchMidiData;

typedef struct {
  char* json;
  size_t length;
} MidiSketchEventData;

typedef struct {
  char* json;
  size_t length;
} MidiSketchDissonanceData;

typedef struct {
  uint16_t total_bars;
  uint32_t total_ticks;
  uint16_t bpm;
  uint8_t track_count;
} MidiSketchInfo;

typedef struct {
  uint8_t id;
  const char* name;
  const char* display_name;
  const char* description;
  uint16_t tempo_default;
  uint8_t allowed_attitudes;
} MidiSketchStylePresetSummary;

typedef struct { uint8_t count; uint8_t ids[20]; } MidiSketchChordCandidates;
typedef struct { uint8_t count; uint8_t ids[10]; } MidiSketchFormCandidates;
~~~

The piano-roll safety structs and MidiSketchNoteSafety, MidiSketchNoteReason, and MidiSketchCollisionInfo declarations are also defined in midisketch_c.h; their arrays contain 128 MIDI pitches.

### Utilities

~~~c
const char* midisketch_version(void);
void* midisketch_malloc(size_t size);
void midisketch_free(void* ptr);
~~~

midisketch_version() returns a borrowed static string. midisketch_malloc() and midisketch_free() are the allocator pair for FFI memory explicitly allocated through the C ABI.

---

## Complete Example

### C++ Example

~~~cpp
#include "midisketch.h"
#include <fstream>

int main() {
  using namespace midisketch;

  MidiSketch sketch;
  SongConfig config;
  config.style_preset_id = 0;
  config.key = Key::C;
  config.bpm = 120;
  config.seed = 12345;
  config.vocal_attitude = VocalAttitude::Expressive;

  sketch.generateFromConfig(config);
  const auto midi = sketch.getMidi();

  std::ofstream out("output.mid", std::ios::binary);
  out.write(reinterpret_cast<const char*>(midi.data()),
            static_cast<std::streamsize>(midi.size()));
  return 0;
}
~~~

### C Example

~~~c
#include "midisketch_c.h"
#include <stdio.h>
#include <string.h>

int main(void) {
  MidiSketchHandle handle = midisketch_create();
  if (!handle) return 1;

  const char config[] =
      "{\"style_preset_id\":0,\"key\":0,\"bpm\":120,\"seed\":12345}";
  const size_t config_length = sizeof(config) - 1;
  MidiSketchError error = midisketch_generate_from_json(
      handle, config, config_length);
  if (error != MIDISKETCH_OK) {
    fprintf(stderr, "%s\n", midisketch_error_string(error));
    midisketch_destroy(handle);
    return 1;
  }

  MidiSketchMidiData* midi = midisketch_get_midi(handle);
  if (!midi) {
    midisketch_destroy(handle);
    return 1;
  }

  FILE* file = fopen("output.mid", "wb");
  if (file) {
    fwrite(midi->data, 1, midi->size, file);
    fclose(file);
  }
  midisketch_free_midi(midi);
  midisketch_destroy(handle);
  return file ? 0 : 1;
}
~~~
