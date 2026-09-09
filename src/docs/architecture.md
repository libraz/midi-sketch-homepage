# Architecture Overview

This document explains the internal architecture of [MIDI Sketch](https://github.com/libraz/midi-sketch).

## Project Structure

```
midi-sketch/
├── src/
│   ├── core/          # Generator, Coordinator, harmony context, presets, blueprints
│   ├── track/         # Per-track generators (track/generators/) + shared melody,
│   │                  #   vocal, chord and drum helpers in sibling subdirectories
│   ├── instrument/    # Physical instrument models (fretted, keyboard, drums)
│   ├── midi/          # MIDI output and channel/program assignment
│   ├── analysis/      # Dissonance analysis
│   ├── midisketch.h   # Public C++ API
│   └── midisketch_c.h # C API (WASM interface)
├── tests/
├── dist/
└── demo/
```

## Core Components

### MidiSketch Class

The main entry point providing a high-level API:

::: tip Two Generation Workflows
- **Vocal-First**: Use `generateVocal()` → iterate with `regenerateVocal()` → finalize with `generateAccompanimentForVocal()` (the JS/WASM wrapper names it `generateAccompaniment()`)
- **Standard**: Use `generate()` or `generateFromConfig()` for one-shot generation

Configurations can be constructed using the **SongConfigBuilder**, a fluent API with cascade change detection that automatically recalculates dependent parameters when upstream values change.
:::

```cpp
class MidiSketch {
  void generate(const GeneratorParams& params);
  void generateFromConfig(const SongConfig& config);
  void generateWithVocal(const SongConfig& config);   // Vocal-priority full generation
  void generateVocal(const SongConfig& config);
  void regenerateVocal(uint32_t new_seed = 0);
  void regenerateVocal(const VocalConfig& config);
  void generateAccompanimentForVocal();
  void generateAccompanimentForVocal(const AccompanimentConfig& config);
  void regenerateAccompaniment(uint32_t new_seed = 0);
  void regenerateAccompaniment(const AccompanimentConfig& config);
  void setVocalNotes(const SongConfig& config, const std::vector<NoteEvent>& notes);

  std::vector<uint8_t> getMidi() const;
  std::string getEventsJson() const;
  const Song& getSong() const;
};
```

### Generator

The central stateful API (`src/core/generator.h`) owns the generated `Song` and delegates track work to the `Coordinator`:

```cpp
class Generator {
 public:
  void generate(const GeneratorParams& params);
  void generateFromConfig(const SongConfig& config);
  void generateVocal(const GeneratorParams& params);
  void generateAccompanimentForVocal();
  void regenerateVocal(uint32_t new_seed = 0);
  void generateWithVocal(const GeneratorParams& params);
  const Song& getSong() const;
};
```

`generate()` returns `void`; callers read the result through `getSong()`. `Coordinator::generateAllTracks()` selects the paradigm order and invokes the registered `ITrackBase` generators, including `GuitarGenerator`. Structure building and post-processing remain internal stages of the generation call rather than public `Generator` members.

### Song Container

Holds all generated data (9 tracks):

```cpp
// Song holds nine tracks, addressed by TrackRole (src/core/song.h).
// Channel assignments live in src/midi/track_config.h:
//   Vocal 0 | Chord 1 | Bass 2 | Motif 3 | Arpeggio 4
//   Aux 5   | Guitar 6 | Drums 9 | SE 15
class Song {
  MidiTrack& track(TrackRole role);
  const Arrangement& arrangement() const;
};
```

::: info Dedicated Channels
Every track has its own MIDI channel (`src/midi/track_config.h`). Aux (Ch 5) and Arpeggio (Ch 4) are separate channels, so both can appear in the same song depending on the composition style and settings.
:::

## Data Flow

### Standard Generation (Traditional paradigm)

<DocFigure name="standard-generation" />

::: details Generation Order by Paradigm
The track generation order varies depending on the Blueprint paradigm:
- **Traditional / MelodyDriven**: Vocal -> Aux -> Motif -> Bass -> Chord -> Guitar -> Arpeggio -> Drums -> SE
- **RhythmSync**: Motif -> Vocal -> Aux -> Bass -> Chord -> Guitar -> Arpeggio -> Drums -> SE
:::

### Vocal-First Generation

<DocFigure name="vocal-first-generation" />

### Cross-Track Voice Limiting

Sections may cap the number of pitched tracks that are allowed to change from one bar to the next with `max_moving_voices`. When the cap is exceeded, the coordinator freezes the lowest-priority moving tracks by copying the previous bar. The priority order, highest to lowest, is **Vocal → Guitar → Motif → Aux → Chord → Arpeggio → Bass**; Drums and SE are outside this limit.

The coordinator preserves track-specific phrase-tail silence during the copy/quantization pass, then restores guitar rake order after pitch resolution. See [Cross-Track Voice Limiting and Final Repair](/docs/generation-pipeline#cross-track-voice-limiting-and-final-repair) for the pass order and tail gate.

## Time Representation

MIDI Sketch uses tick-based timing throughout:

```cpp
using Tick = uint32_t;
constexpr Tick TICKS_PER_BEAT = 480;    // Standard MIDI resolution
constexpr Tick TICKS_PER_BAR = 1920;    // 4/4 time signature
constexpr uint8_t BEATS_PER_BAR = 4;
```

::: tip Tick Calculation
- Quarter note = 480 ticks
- Eighth note = 240 ticks
- Sixteenth note = 120 ticks
- One bar (4/4) = 1920 ticks
:::

## Note Representation

Two-layer note representation:

```cpp
// Intermediate musical representation (internal)
struct NoteEvent {
  Tick start_tick;     // Absolute start time
  Tick duration;       // Duration in ticks
  uint8_t note;        // MIDI note (0-127)
  uint8_t velocity;    // MIDI velocity (0-127)
};

// Low-level MIDI bytes (output only)
struct MidiEvent {
  Tick tick;           // Absolute time
  uint8_t status;      // MIDI status byte
  uint8_t data1;       // First data byte
  uint8_t data2;       // Second data byte
};
```

## Section Definition

Songs are divided into sections:

```cpp
struct Section {
  SectionType type;              // Intro, A, B, Chorus, Bridge, Interlude, Outro, Chant, MixBreak, Drop
  std::string name;              // Display name
  uint8_t bars;                  // Bar count
  Tick start_bar;                // Start position (bars)
  Tick start_tick;               // Start position (ticks)
  VocalDensity vocal_density;    // Full, Sparse, None
  BackingDensity backing_density; // Normal, Thin, Thick
};
```

## Composition Styles

Three composition styles affect the generation approach:

| Style | Vocal | Aux | Motif | Arpeggio | Description |
|-------|:-----:|:---:|:-----:|:--------:|-------------|
| **MelodyLead (0)** | Yes | Yes | Blueprint-dependent | Optional | Traditional arrangement with prominent vocal melody |
| **BackgroundMotif (1)** | No | Yes | Yes | Optional | Vocal disabled, Aux enabled, Motif as primary focus |
| **SynthDriven (2)** | No | No | Yes | Optional (manual enable) | Vocal/Aux disabled, synth/arpeggio-forward electronic style |

::: warning BGM-Only Modes
BackgroundMotif disables Vocal but keeps Aux enabled and forces Motif generation. SynthDriven disables both Vocal and Aux, and also generates Motif unconditionally; Arpeggio must be manually enabled with `arpeggioEnabled=true`. Use MelodyLead for songs with vocals.
:::

## Production Blueprints

Blueprints are high-level production templates that control track generation order, motif behavior, and implicit overrides. There are 10 blueprints (ID 0-9), plus ID 255 for random selection.

| ID | Name | Paradigm | RiffPolicy | Drums Required | Weight |
|----|------|----------|------------|:--------------:|--------|
| 0 | Traditional | Traditional | Free | - | 42% |
| 1 | RhythmLock | RhythmSync | LockedContour | **Yes** | 14% |
| 2 | StoryPop | MelodyDriven | Evolving | - | 10% |
| 3 | Ballad | MelodyDriven | Free | - | 4% |
| 4 | IdolStandard | MelodyDriven | Evolving | - | 10% |
| 5 | IdolHyper | RhythmSync | LockedContour | **Yes** | 6% |
| 6 | IdolKawaii | MelodyDriven | LockedContour | - | 5% |
| 7 | IdolCoolPop | RhythmSync | LockedContour | **Yes** | 5% |
| 8 | IdolEmo | MelodyDriven | LockedContour | - | 4% |
| 9 | BehavioralLoop | RhythmSync | LockedPitch | - | 0%* |

\* BehavioralLoop (ID 9) has weight 0% and must be explicitly selected (never chosen randomly). It forces `addictive_mode=true`, `RiffPolicy::LockedPitch`, and `HookIntensity::Maximum`.

::: details Paradigms
- **Traditional**: Vocal -> Aux -> Motif -> Bass -> Chord -> Guitar -> Arpeggio -> Drums -> SE
- **RhythmSync**: Motif -> Vocal -> Aux -> Bass -> Chord -> Guitar -> Arpeggio -> Drums -> SE (Motif as coordinate axis)
- **MelodyDriven**: Vocal -> Aux -> Motif -> Bass -> Chord -> Guitar -> Arpeggio -> Drums -> SE (same order as Traditional but Motif follows melody)
:::

::: details RiffPolicy
The public C++, C, and JavaScript APIs expose five `RiffPolicy` values:
- **Free (0)**: `FullSong` generates a fresh motif for each section; `Section` caches and reuses a pattern by section type
- **LockedContour (1)**: Keep the pitch contour while allowing expression changes; `Locked` is a compatibility alias
- **LockedPitch (2)**: Keep pitches fixed while allowing velocity changes
- **LockedAll (3)**: Keep the complete cached riff fixed
- **Evolving (4)**: Mutate the cached riff once per section while retaining its identity

Blueprints copy their selected policy into the generator parameters. `MotifRepeatScope` selects the `Free` policy's `FullSong` or `Section` behavior.
:::

::: details Blueprint Overrides
Blueprints can override several SongConfig parameters:
- `section_flow` overrides `formId` (when present and `formExplicit=false`)
- `riff_policy` selects the cross-section riff policy and is copied into the generator parameters
- `drums_required` forces `drums_enabled=true` (unless `drumsEnabledExplicit=true` and `drumsEnabled=false`)
- `drums_sync_vocal` overrides the SongConfig setting
- `mood_mask` restricts compatible moods (check with `isMoodCompatible()`)
:::

## Parameter Application Order

Parameters are applied in a specific cascade order, where later stages can override earlier ones:

```
StylePreset → VocalStylePreset → MelodicComplexity → SongConfig Overrides → Master Switch
```

1. **StylePreset**: Sets base parameters including melody configuration
2. **VocalStylePreset**: Adjusts max_leap, syncopation, density, and other vocal characteristics
3. **MelodicComplexity**: Applies density/leap multipliers (Simple reduces, Complex amplifies)
4. **SongConfig Overrides**: User-specified melody/motif override parameters take highest priority
5. **Master Switch**: `enableSyncopation=false` forces syncopation_prob=0.0 and allow_bar_crossing=false

## Random Number Generation

Deterministic generation using Mersenne Twister:

```cpp
std::mt19937 rng(seed);  // Same seed = same output
```

::: info Reproducibility
- **seed > 0**: Fully deterministic - same seed with same parameters always produces identical output
- **seed = 0**: Random - uses current clock time, different each run
:::

When seed is 0, current clock time is used for randomization.

## WASM Compilation

The library compiles to WebAssembly via Emscripten:

- **Output**: ~<WasmStat type="size" /> WASM (gzip: ~<WasmStat type="gzip" />) + ~<WasmStat type="js" /> JS (wrapper + glue)
- **No external dependencies**: Pure C++17
- **ES6 module**: Modular JavaScript wrapper

```bash
# Build flags
-sWASM=1 -sMODULARIZE=1 -sEXPORT_ES6=1
-sALLOW_MEMORY_GROWTH=1 -sSTACK_SIZE=1048576
```

## C API Layer

For WASM interop, a C API wraps the C++ classes:

```c
// Lifecycle
MidiSketchHandle handle = midisketch_create();
midisketch_generate_from_json(handle, config_json, json_length);
MidiSketchMidiData* midi = midisketch_get_midi(handle);
midisketch_free_midi(midi);
midisketch_destroy(handle);
```

Key functions:
- `midisketch_generate_from_json()` - Core generation
- `midisketch_generate_vocal_from_json()` - Vocal-only generation
- `midisketch_regenerate_vocal_from_json()` - Vocal regeneration
- `midisketch_generate_accompaniment_from_json()` - Accompaniment generation
- `midisketch_regenerate_accompaniment_from_json()` - Accompaniment regeneration
- `midisketch_generate_with_vocal_from_json()` - Vocal-priority full generation
- `midisketch_set_vocal_notes_from_json()` - Custom vocal injection
- `midisketch_get_piano_roll_safety()` - Piano roll safety analysis
- `midisketch_get_midi()` - MIDI binary output
- `midisketch_get_events()` - JSON event data
- `midisketch_get_info()` - Metadata (bars, ticks, BPM)
- `midisketch_blueprint_count()` / `midisketch_blueprint_name()` - Blueprint information
