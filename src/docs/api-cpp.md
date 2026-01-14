# C++ API Reference

This document covers the C++ API for native applications and the C API for FFI/WASM bindings.

## MidiSketch Class

### Constructor

```cpp
#include "midisketch.h"

midisketch::MidiSketch sketch;
```

::: info Header Files
- `midisketch.h` - C++ class API
- `midisketch_c.h` - C API for FFI/WASM bindings
- `core/types.h` - Type definitions (includes all core types)
:::

### `generateFromConfig(config)`

Generate MIDI from a SongConfig object.

```cpp
SongConfig config;
config.style_preset_id = 0;       // Style preset ID (0-16)
config.key = Key::C;              // Key (C=0 through B=11)
config.bpm = 120;                 // Tempo (0=use style default)
config.seed = 12345;              // Random seed (0=random)
config.chord_progression_id = 0;  // Chord progression ID
config.form = StructurePattern::StandardPop;  // Form/structure
config.vocal_attitude = VocalAttitude::Clean; // 0=Clean, 1=Expressive, 2=Raw
config.drums_enabled = true;      // Enable drums track

// Arpeggio settings
config.arpeggio_enabled = false;
config.arpeggio.pattern = ArpeggioPattern::Up;
config.arpeggio.speed = ArpeggioSpeed::Sixteenth;
config.arpeggio.octave_range = 2;
config.arpeggio.gate = 0.8f;
config.arpeggio.sync_chord = true;

// Vocal settings
config.vocal_low = 55;            // Vocal range lower bound (MIDI note)
config.vocal_high = 74;           // Vocal range upper bound (MIDI note)
config.skip_vocal = false;        // Skip vocal generation (for BGM-first workflow)

// Vocal style settings
config.vocal_style = VocalStylePreset::Auto;
config.melody_template = MelodyTemplateId::Auto;
config.melodic_complexity = MelodicComplexity::Standard;
config.hook_intensity = HookIntensity::Normal;
config.vocal_groove = VocalGrooveFeel::Straight;

// Humanization
config.humanize = true;
config.humanize_timing = 0.5f;    // 0.0-1.0
config.humanize_velocity = 0.5f;  // 0.0-1.0

// Chord extensions
config.chord_extension.enable_sus = false;
config.chord_extension.enable_7th = false;
config.chord_extension.enable_9th = false;

// Composition style
config.composition_style = CompositionStyle::MelodyLead;

// Modulation settings
config.modulation_timing = ModulationTiming::None;
config.modulation_semitones = 2;  // +1 to +4

// Call/SE settings (for idol-style music)
config.se_enabled = false;
config.call_setting = CallSetting::Auto;
config.intro_chant = IntroChant::None;
config.mix_pattern = MixPattern::None;
config.call_density = CallDensity::Standard;

sketch.generateFromConfig(config);
```

::: info Parameter Dependencies
Many parameters depend on parent options being enabled. For example, `arpeggio.pattern` has no effect if `arpeggio_enabled=false`. See [Option Relationships](/docs/option-relationships) for the full dependency tree.
:::

### `regenerateVocal(config)`

Regenerate only the vocal track (and Aux track). BGM tracks (chord, bass, drums, arpeggio) remain unchanged.
Use after `generateFromConfig()` with `skip_vocal=true` for BGM-first workflow.

```cpp
// With seed only
sketch.regenerateVocal(12345);

// With full configuration
VocalConfig vocal_config;
vocal_config.seed = 0;                    // Random seed (0=new random)
vocal_config.vocal_low = 55;              // Vocal range lower bound
vocal_config.vocal_high = 74;             // Vocal range upper bound
vocal_config.vocal_attitude = VocalAttitude::Expressive;
vocal_config.vocal_style = VocalStylePreset::Auto;
vocal_config.melody_template = MelodyTemplateId::Auto;
vocal_config.melodic_complexity = MelodicComplexity::Standard;
vocal_config.hook_intensity = HookIntensity::Normal;
vocal_config.vocal_groove = VocalGrooveFeel::Straight;

sketch.regenerateVocal(vocal_config);
```

### `getMidi()`

Returns the generated MIDI data as `std::vector<uint8_t>`.

```cpp
std::vector<uint8_t> midi_data = sketch.getMidi();

// Save to file
std::ofstream out("output.mid", std::ios::binary);
out.write(reinterpret_cast<const char*>(midi_data.data()), midi_data.size());
```

### `getEventsJson()`

Returns the event data as JSON string for visualization/playback.

```cpp
std::string events_json = sketch.getEventsJson();
// { "sections": [...], "tracks": [...], "bpm": 120, "duration_ticks": ... }
```

### `generateVocal(config)`

Generate only the vocal track without accompaniment. Use for trial-and-error workflow: generate vocal, preview, regenerate if needed. Call `generateAccompanimentForVocal()` when satisfied with the vocal.

```cpp
SongConfig config;
config.style_preset_id = 0;
config.key = Key::C;
config.bpm = 120;
config.vocal_attitude = VocalAttitude::Expressive;

sketch.generateVocal(config);
```

### `generateAccompanimentForVocal(config?)`

Generate accompaniment tracks for existing vocal. Must be called after `generateVocal()` or `setVocalNotes()`. Generates: Aux -> Bass -> Chord -> Drums (adapting to vocal).

```cpp
// Simple: use default settings
sketch.generateAccompanimentForVocal();

// With configuration
AccompanimentConfig acc_config;
acc_config.seed = 12345;
acc_config.drums_enabled = true;
acc_config.arpeggio_enabled = false;
acc_config.humanize = true;
acc_config.humanize_timing = 50;
acc_config.humanize_velocity = 50;

sketch.generateAccompanimentForVocal(acc_config);
```

### `regenerateAccompaniment(seedOrConfig)`

Regenerate accompaniment tracks with a new seed or configuration. Keeps current vocal, regenerates all accompaniment tracks (Aux, Bass, Chord, Drums, etc.).

```cpp
// With seed only
sketch.regenerateAccompaniment(12345);

// With full configuration
AccompanimentConfig acc_config;
acc_config.seed = 12345;
acc_config.drums_enabled = true;
acc_config.arpeggio_enabled = true;

sketch.regenerateAccompaniment(acc_config);
```

### `generateWithVocal(config)`

Generate all tracks with vocal-first priority. Generation order: Vocal -> Aux -> Bass -> Chord -> Drums. Accompaniment adapts to vocal melody.

```cpp
SongConfig config;
config.style_preset_id = 0;
config.key = Key::C;
config.bpm = 120;

sketch.generateWithVocal(config);
```

### `setVocalNotes(config, notes)`

Set custom vocal notes for accompaniment generation. Initializes the song structure and chord progression from config, then replaces the vocal track with the provided notes. Call `generateAccompanimentForVocal()` after this.

```cpp
SongConfig config;
config.style_preset_id = 0;
config.key = Key::C;
config.bpm = 120;

std::vector<NoteEvent> notes = {
  NoteEvent(0, 480, 60, 100),      // C4 at tick 0, duration 480
  NoteEvent(480, 480, 62, 100),    // D4 at tick 480
  NoteEvent(960, 960, 64, 100),    // E4 at tick 960, duration 960
};

sketch.setVocalNotes(config, notes);

// Generate accompaniment for the custom vocal
sketch.generateAccompanimentForVocal();

// Get the MIDI data
auto midi = sketch.getMidi();
```

### `getHarmonyContext()`

Get harmony context for piano roll safety API.

```cpp
const IHarmonyContext& harmony = sketch.getHarmonyContext();
```

### `getMelody()` / `setMelody(melody)`

Get/set melody data for saving/restoring candidates.

```cpp
// Save current melody
MelodyData melody = sketch.getMelody();

// ... try other melodies ...

// Restore saved melody
sketch.setMelody(melody);
```

### `setMidiFormat(format)` / `getMidiFormat()`

Set/get MIDI output format.

```cpp
sketch.setMidiFormat(MidiFormat::SMF1);  // Standard MIDI File Type 1
// or
sketch.setMidiFormat(MidiFormat::SMF2);  // MIDI 2.0 Container File (default)

MidiFormat format = sketch.getMidiFormat();
```

### `version()`

Get library version string.

```cpp
const char* version = MidiSketch::version();
// "0.1.0"
```

---

## Generation Workflows

MIDI Sketch supports three generation workflows, each suited to different use cases:

::: tip Choosing a Workflow
| Workflow | Use Case |
|----------|----------|
| **BGM-First** | Preview accompaniment before adding vocals |
| **Vocal-First** | Iterate on melody before generating backing tracks |
| **Custom Vocal** | Import your own melody and generate fitting accompaniment |
:::

### BGM-First Workflow

Generate backing track first, then add vocals:

```cpp
MidiSketch sketch;

// Step 1: Generate BGM only
SongConfig config;
config.style_preset_id = 0;
config.skip_vocal = true;
sketch.generateFromConfig(config);

// Preview BGM...

// Step 2: Add vocals
VocalConfig vocal_config;
vocal_config.seed = 0;
vocal_config.vocal_low = 55;
vocal_config.vocal_high = 74;
vocal_config.vocal_attitude = VocalAttitude::Expressive;

sketch.regenerateVocal(vocal_config);

auto midi_data = sketch.getMidi();
```

### Vocal-First Workflow

Generate vocal first, preview, iterate, then generate accompaniment:

```cpp
MidiSketch sketch;

SongConfig config;
config.style_preset_id = 0;

// Step 1: Generate vocal only
sketch.generateVocal(config);

// Preview and iterate until satisfied...
VocalConfig vocal_config;
vocal_config.seed = 12345;
vocal_config.vocal_attitude = VocalAttitude::Raw;
sketch.regenerateVocal(vocal_config);

// Step 2: Generate accompaniment for the vocal
sketch.generateAccompanimentForVocal();

auto midi_data = sketch.getMidi();
```

### Custom Vocal Import Workflow

Import your own melody and generate fitting accompaniment:

```cpp
MidiSketch sketch;

SongConfig config;
config.style_preset_id = 0;

// Step 1: Set custom vocal notes
std::vector<NoteEvent> notes = {
  NoteEvent(0, 480, 60, 100),
  NoteEvent(480, 480, 62, 100),
  NoteEvent(960, 960, 64, 100),
};

sketch.setVocalNotes(config, notes);

// Step 2: Generate accompaniment
sketch.generateAccompanimentForVocal();

auto midi_data = sketch.getMidi();
```

---

## Core Types

### SongConfig

Main configuration structure for MIDI generation.

```cpp
struct SongConfig {
  uint8_t style_preset_id = 0;      // Style preset ID (0-16)
  Key key = Key::C;                 // Musical key
  uint16_t bpm = 0;                 // Tempo (0 = use style default)
  uint32_t seed = 0;                // Random seed (0 = random)
  uint8_t chord_progression_id = 0; // Chord progression ID
  StructurePattern form;            // Song structure
  VocalAttitude vocal_attitude;     // Vocal expression style
  bool drums_enabled = true;
  bool arpeggio_enabled = false;
  bool skip_vocal = false;          // Skip vocal (for BGM-first)
  uint8_t vocal_low = 60;           // C4
  uint8_t vocal_high = 79;          // G5
  ArpeggioParams arpeggio;          // Arpeggio settings
  ChordExtensionParams chord_extension;
  CompositionStyle composition_style;
  // ... and more
};
```

::: details Full SongConfig Fields
See [preset_types.h](https://github.com/libraz/midi-sketch/blob/main/src/core/preset_types.h) for the complete structure definition.
:::

### VocalConfig

Configuration for vocal regeneration.

```cpp
struct VocalConfig {
  uint32_t seed = 0;                // Random seed (0 = new random)
  uint8_t vocal_low = 60;           // Vocal range lower bound
  uint8_t vocal_high = 79;          // Vocal range upper bound
  VocalAttitude vocal_attitude = VocalAttitude::Clean;
  VocalStylePreset vocal_style = VocalStylePreset::Auto;
  MelodyTemplateId melody_template = MelodyTemplateId::Auto;
  MelodicComplexity melodic_complexity = MelodicComplexity::Standard;
  HookIntensity hook_intensity = HookIntensity::Normal;
  VocalGrooveFeel vocal_groove = VocalGrooveFeel::Straight;
  CompositionStyle composition_style = CompositionStyle::MelodyLead;
};
```

### AccompanimentConfig

Configuration for accompaniment generation/regeneration.

```cpp
struct AccompanimentConfig {
  uint32_t seed = 0;                // Random seed (0 = auto-generate)

  // Drums
  bool drums_enabled = true;

  // Arpeggio
  bool arpeggio_enabled = false;
  uint8_t arpeggio_pattern = 0;     // 0=Up, 1=Down, 2=UpDown, 3=Random
  uint8_t arpeggio_speed = 1;       // 0=Eighth, 1=Sixteenth, 2=Triplet
  uint8_t arpeggio_octave_range = 2;
  uint8_t arpeggio_gate = 80;       // 0-100
  bool arpeggio_sync_chord = true;

  // Chord Extensions
  bool chord_ext_sus = false;
  bool chord_ext_7th = false;
  bool chord_ext_9th = false;
  uint8_t chord_ext_sus_prob = 20;  // 0-100
  uint8_t chord_ext_7th_prob = 30;
  uint8_t chord_ext_9th_prob = 25;

  // Humanization
  bool humanize = false;
  uint8_t humanize_timing = 50;     // 0-100
  uint8_t humanize_velocity = 50;

  // SE/Call
  bool se_enabled = true;
  bool call_enabled = false;
  uint8_t call_density = 2;         // 0-3
};
```

### NoteEvent

Note event structure.

```cpp
struct NoteEvent {
  Tick start_tick;    // Start time in ticks
  Tick duration;      // Duration in ticks
  uint8_t note;       // MIDI note number (0-127)
  uint8_t velocity;   // MIDI velocity (0-127)

  NoteEvent(Tick start, Tick dur, uint8_t n, uint8_t vel);
};
```

::: details Understanding Ticks
MIDI Sketch uses **ticks** as the time unit (480 ticks per quarter note):
- **Quarter note**: 480 ticks
- **Eighth note**: 240 ticks
- **Sixteenth note**: 120 ticks
- **Whole note**: 1920 ticks
- **One bar (4/4)**: 1920 ticks

Example: A note at beat 2 (tick 480) lasting one beat:
```cpp
NoteEvent(480, 480, 60, 100)  // C4 at beat 2, duration 1 beat
```
:::

### MelodyData

Melody data for saving/restoring candidates.

```cpp
struct MelodyData {
  uint32_t seed;                   // Random seed used
  std::vector<NoteEvent> notes;    // Melody notes
};
```

---

## Enums

### Key

Musical key (0-11).

```cpp
enum class Key : uint8_t {
  C = 0, Cs, D, Eb, E, F, Fs, G, Ab, A, Bb, B
};
```

### VocalAttitude

Vocal expression style.

```cpp
enum class VocalAttitude : uint8_t {
  Clean = 0,      // Clean, controlled
  Expressive,     // Expressive, dynamic
  Raw             // Raw, emotional
};
```

### CompositionStyle

Overall musical approach.

```cpp
enum class CompositionStyle : uint8_t {
  MelodyLead = 0,    // Traditional: melody is foreground
  BackgroundMotif,   // Motif is foreground
  SynthDriven        // Synth/arpeggio as foreground
};
```

### VocalStylePreset

Vocal style presets.

```cpp
enum class VocalStylePreset : uint8_t {
  Auto = 0,          // Auto-select based on style
  Standard,          // Standard pop vocal
  Vocaloid,          // Vocaloid-style (fast, wide leaps)
  UltraVocaloid,     // Ultra-fast vocaloid (32nd notes)
  Idol,              // Idol-style (catchy, hook-heavy)
  Ballad,            // Ballad (slow, long notes)
  Rock,              // Rock (powerful, chorus register shift)
  CityPop,           // City pop (jazzy, syncopated)
  Anime,             // Anime-style (dynamic, expressive)
  BrightKira,        // Bright/kira-kira (high, sparkling)
  CoolSynth,         // Cool synth (electronic, precise)
  CuteAffected,      // Cute/affected (playful)
  PowerfulShout      // Powerful shout (intense)
};
```

### MelodyTemplateId

Melody template patterns.

```cpp
enum class MelodyTemplateId : uint8_t {
  Auto = 0,          // Auto-select based on VocalStylePreset
  PlateauTalk,       // High same-pitch ratio (NewJeans, Billie Eilish)
  RunUpTarget,       // Ascending toward target (YOASOBI, Ado)
  DownResolve,       // Descending resolution (B-section)
  HookRepeat,        // Short repeated hooks (TikTok, K-POP)
  SparseAnchor,      // Sparse anchor notes (Ballad)
  CallResponse,      // Duet-style call and response
  JumpAccent         // Emotional peak jumps
};
```

### MelodicComplexity

Melody complexity level.

```cpp
enum class MelodicComplexity : uint8_t {
  Simple = 0,    // Simple melodies with minimal intervals
  Standard,      // Standard melodic complexity
  Complex        // Complex with larger intervals
};
```

### HookIntensity

Hook repetition intensity.

```cpp
enum class HookIntensity : uint8_t {
  Off = 0,     // No hook repetition
  Light,       // Light hook presence
  Normal,      // Normal hook repetition (default)
  Strong       // Strong, catchy hook emphasis
};
```

### VocalGrooveFeel

Vocal groove/rhythm feel.

```cpp
enum class VocalGrooveFeel : uint8_t {
  Straight = 0,   // Straight rhythm
  OffBeat,        // Off-beat emphasis
  Swing,          // Swing feel
  Syncopated,     // Syncopated rhythm
  Driving16th,    // Driving 16th note feel
  Bouncy8th       // Bouncy 8th note feel
};
```

### ModulationTiming

Key modulation timing.

```cpp
enum class ModulationTiming : uint8_t {
  None = 0,        // No modulation
  LastChorus,      // Modulate at last chorus
  AfterBridge,     // Modulate after bridge
  EachChorus,      // Modulate at each chorus
  Random           // Random modulation timing
};
```

### TrackRole

Track role identifier.

```cpp
enum class TrackRole : uint8_t {
  Vocal = 0,   // Main melody track
  Chord,       // Chord voicing track
  Bass,        // Bass line track
  Drums,       // Drum pattern track
  SE,          // Sound effects (calls, chants)
  Motif,       // Background motif track
  Arpeggio,    // Synth arpeggio track
  Aux          // Auxiliary vocal track
};
```

### ArpeggioPattern / ArpeggioSpeed

Arpeggio settings.

```cpp
enum class ArpeggioPattern : uint8_t {
  Up,        // Ascending notes
  Down,      // Descending notes
  UpDown,    // Ascending then descending
  Random     // Random order
};

enum class ArpeggioSpeed : uint8_t {
  Eighth,      // 8th notes
  Sixteenth,   // 16th notes (default)
  Triplet      // Triplet feel
};
```

### MidiFormat

MIDI file format.

```cpp
enum class MidiFormat : uint8_t {
  SMF1 = 1,    // Standard MIDI File Type 1 (legacy)
  SMF2 = 2     // MIDI 2.0 Container File (ktmidi format)
};
```

---

## Constants

```cpp
constexpr Tick TICKS_PER_BEAT = 480;     // Ticks per quarter note
constexpr uint8_t BEATS_PER_BAR = 4;     // Beats per bar (4/4)
constexpr Tick TICKS_PER_BAR = 1920;     // Ticks per bar
constexpr uint8_t MIDI_C4 = 60;          // Middle C
constexpr MidiFormat kDefaultMidiFormat = MidiFormat::SMF2;
```

---

## C API (midisketch_c.h)

The C API provides FFI bindings for WASM and other language integrations.

::: warning Memory Management
Functions returning pointers (e.g., `midisketch_get_midi`) allocate memory that must be freed with the corresponding free function (e.g., `midisketch_free_midi`).
:::

### Handle Management

```c
// Create a new MidiSketch instance
MidiSketchHandle midisketch_create(void);

// Destroy a MidiSketch instance
void midisketch_destroy(MidiSketchHandle handle);
```

### Generation Functions

```c
// Generate from song config
MidiSketchError midisketch_generate_from_config(
    MidiSketchHandle handle,
    const MidiSketchSongConfig* config
);

// Generate only vocal
MidiSketchError midisketch_generate_vocal(
    MidiSketchHandle handle,
    const MidiSketchSongConfig* config
);

// Regenerate vocal with new config
MidiSketchError midisketch_regenerate_vocal(
    MidiSketchHandle handle,
    const MidiSketchVocalConfig* config
);

// Generate accompaniment
MidiSketchError midisketch_generate_accompaniment(MidiSketchHandle handle);

// Regenerate accompaniment with new seed
MidiSketchError midisketch_regenerate_accompaniment(
    MidiSketchHandle handle,
    uint32_t new_seed
);

// Generate all tracks with vocal-first priority
MidiSketchError midisketch_generate_with_vocal(
    MidiSketchHandle handle,
    const MidiSketchSongConfig* config
);

// Set custom vocal notes
MidiSketchError midisketch_set_vocal_notes(
    MidiSketchHandle handle,
    const MidiSketchSongConfig* config,
    const MidiSketchNoteInput* notes,
    size_t count
);
```

### Output Functions

```c
// Get MIDI data (must free with midisketch_free_midi)
MidiSketchMidiData* midisketch_get_midi(MidiSketchHandle handle);

// Get vocal preview MIDI
MidiSketchMidiData* midisketch_get_vocal_preview_midi(MidiSketchHandle handle);

// Free MIDI data
void midisketch_free_midi(MidiSketchMidiData* data);

// Get event data as JSON (must free with midisketch_free_events)
MidiSketchEventData* midisketch_get_events(MidiSketchHandle handle);

// Free event data
void midisketch_free_events(MidiSketchEventData* data);
```

### Preset Information

```c
// Get counts
uint8_t midisketch_style_preset_count(void);
uint8_t midisketch_structure_count(void);
uint8_t midisketch_chord_count(void);

// Get names
const char* midisketch_style_preset_name(uint8_t id);
const char* midisketch_style_preset_display_name(uint8_t id);

// Get compatible progressions/forms for a style (WASM-friendly)
MidiSketchChordCandidates* midisketch_get_progressions_by_style_ptr(uint8_t style_id);
MidiSketchFormCandidates* midisketch_get_forms_by_style_ptr(uint8_t style_id);

// Create default config for a style (WASM-friendly)
MidiSketchSongConfig* midisketch_create_default_config_ptr(uint8_t style_id);

// Validate config
MidiSketchConfigError midisketch_validate_config(const MidiSketchSongConfig* config);
```

### Error Codes

```c
typedef enum {
  MIDISKETCH_OK = 0,
  MIDISKETCH_ERROR_INVALID_PARAM = 1,
  MIDISKETCH_ERROR_INVALID_STRUCTURE = 2,
  MIDISKETCH_ERROR_INVALID_MOOD = 3,
  MIDISKETCH_ERROR_INVALID_CHORD = 4,
  MIDISKETCH_ERROR_GENERATION_FAILED = 5,
  MIDISKETCH_ERROR_OUT_OF_MEMORY = 6,
} MidiSketchError;
```

### C API Structures

```c
// MIDI binary output
typedef struct {
  uint8_t* data;
  size_t size;
} MidiSketchMidiData;

// Event JSON output
typedef struct {
  char* json;
  size_t length;
} MidiSketchEventData;

// Note input for custom vocal
typedef struct {
  uint32_t start_tick;
  uint32_t duration;
  uint8_t pitch;
  uint8_t velocity;
} MidiSketchNoteInput;
```

---

## Complete Example

### C++ Example

```cpp
#include "midisketch.h"
#include <fstream>

int main() {
    using namespace midisketch;

    // Create instance
    MidiSketch sketch;

    // Configure
    SongConfig config;
    config.style_preset_id = 0;  // J-Pop
    config.key = Key::C;
    config.bpm = 120;
    config.seed = 12345;
    config.drums_enabled = true;
    config.vocal_attitude = VocalAttitude::Expressive;

    // Generate
    sketch.generateFromConfig(config);

    // Get MIDI data
    auto midi = sketch.getMidi();

    // Save to file
    std::ofstream out("output.mid", std::ios::binary);
    out.write(reinterpret_cast<const char*>(midi.data()), midi.size());

    return 0;
}
```

### C Example

```c
#include "midisketch_c.h"
#include <stdio.h>

int main() {
    // Create instance
    MidiSketchHandle handle = midisketch_create();

    // Get default config for J-Pop style
    MidiSketchSongConfig* config = midisketch_create_default_config_ptr(0);
    config->key = 0;  // C
    config->bpm = 120;
    config->seed = 12345;

    // Generate
    MidiSketchError err = midisketch_generate_from_config(handle, config);
    if (err != MIDISKETCH_OK) {
        printf("Generation failed: %d\n", err);
        midisketch_destroy(handle);
        return 1;
    }

    // Get MIDI data
    MidiSketchMidiData* midi = midisketch_get_midi(handle);

    // Save to file
    FILE* f = fopen("output.mid", "wb");
    fwrite(midi->data, 1, midi->size, f);
    fclose(f);

    // Cleanup
    midisketch_free_midi(midi);
    midisketch_destroy(handle);

    return 0;
}
```
