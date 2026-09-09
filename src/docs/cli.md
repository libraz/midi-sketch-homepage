# CLI Reference

MIDI Sketch includes a command-line tool for generation, MIDI analysis, validation, and regeneration.

## Installation

Build the CLI from the `midi-sketch` source tree:

```bash
cd midi-sketch
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --target midisketch_cli
```

The binary is `build/bin/midisketch_cli`.

## Basic Usage

```bash
# Generate with defaults. Writes output.mid and output.json.
./build/bin/midisketch_cli

# Generate with a style, mood, and tempo.
./build/bin/midisketch_cli --style 5 --mood 3 --bpm 128 -o song.mid

# Generate and write a dissonance report.
./build/bin/midisketch_cli --style 5 --analyze

# Analyze an existing SMF1 MIDI file.
./build/bin/midisketch_cli --input existing.mid --analyze

# Validate a MIDI file.
./build/bin/midisketch_cli --validate existing.mid
```

## Command Reference

### Generation Parameters

| Flag | Description | Default |
|------|-------------|---------|
| `--seed N` | Random seed (`0` selects a random seed) | `0` |
| `--style N` | Style preset ID (`0-16`) | `0` |
| `--blueprint N\|NAME` | Production blueprint (`0-9`, `255` for random, or a name) | `0` |
| `--mood N\|NAME` | Mood ID (`0-23`) or name; an explicit mood overrides the style mapping | Style mapping |
| `--chord N\|NAME` | Chord progression (`0-21`) or name | Auto |
| `--vocal-style N` | Vocal style (`0-13`; see the list below) | `0` (Auto) |
| `--bpm N` | BPM (`0` or `40-240`) | Auto from style/mood |
| `--duration N` | Target duration in seconds (`0` uses the selected form) | `0` |
| `--form N\|NAME` | Form/structure pattern (`0-17`) or name | Style-compatible form |
| `--key N` | Key (`0-11`: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B) | `0` (C) |
| `--config FILE` | Generate from a `SongConfig` JSON file with snake_case field names | — |
| `-o`, `--output FILE` | Set the primary output path | `output.mid` |
| `--format FMT` | MIDI output format: `smf1` or `smf2` (MIDI 2.0 Container File) | `smf1` |
| `--skip-vocal` | Skip vocal generation for a BGM-first workflow | Disabled |
| `--vocal-attitude N` | Vocal attitude (`0-2`: Clean, Expressive, Raw) | `0` |
| `--vocal-low N` | Lower vocal range bound in MIDI notes (`36-96`) | `60` |
| `--vocal-high N` | Upper vocal range bound in MIDI notes (`36-96`) | `79` |

`--duration` targets a song structure between 12 and 144 bars. The resolved tempo determines the duration that a form can produce; an impossible target is rejected or adjusted and reported.

Controls such as mora rhythm mode and melody syncopation probability are available as the `mora_rhythm_mode` and `melody_syncopation_prob` fields in `SongConfig` JSON. Guitar is enabled by default; use `--no-guitar` to disable it.

### Vocal Parameters

Vocal-only regeneration is not a CLI operation. `--regenerate FILE` restores the complete configuration embedded in the input and rejects generation options. Use a new `SongConfig` with `--config`, or use the native API when a vocal-only regeneration workflow is required.

Vocal style IDs are:

| ID | Style |
|----|-------|
| 0 | Auto |
| 1 | Standard |
| 2 | Vocaloid |
| 3 | UltraVocaloid |
| 4 | Idol |
| 5 | Ballad |
| 6 | Rock |
| 7 | CityPop |
| 8 | Anime |
| 9 | BrightKira |
| 10 | CoolSynth |
| 11 | CuteAffected |
| 12 | PowerfulShout |
| 13 | KPop |

### Melody Overrides

| Flag | Description | Default |
|------|-------------|---------|
| `--melody-max-leap N` | Maximum melody leap in semitones (`0` for preset, `1-12` to override) | Preset |
| `--melody-phrase-length N` | Phrase length in bars (`0` for preset, `1-8` to override) | Preset |
| `--melody-long-note-ratio N` | Long-note ratio (`0-100`); omit the flag to use the preset | Preset |
| `--melody-chorus-register-shift N` | Chorus register shift (`-12` to `12`); omit the flag to use the preset | Preset |
| `--melody-hook-repetition N` | Hook repetition (`0` preset, `1` off, `2` on) | Preset |
| `--melody-use-leading-tone N` | Leading tone (`0` preset, `1` off, `2` on) | Preset |

`melody_syncopation_prob` can be set in `SongConfig` JSON with `0-100` or `255` for the preset value. It is not a command-line option.

### Motif Overrides

| Flag | Description | Default |
|------|-------------|---------|
| `--motif-length N` | Motif length in bars (`0` auto, `1`, `2`, or `4`) | `0` (auto) |
| `--motif-note-count N` | Motif note count (`0` auto, `3-8`) | `0` (auto) |
| `--motif-motion N` | Motif motion (`255` preset, `0` Stepwise, `1` GentleLeap, `2` WideLeap, `3` NarrowStep, `4` Disjunct, `5` Ostinato) | Preset |
| `--motif-register-high N` | Motif register (`0` auto, `1` low, `2` high) | `0` (auto) |
| `--motif-rhythm-density N` | Motif rhythm density (`255` preset, `0` Sparse, `1` Medium, `2` Driving) | Preset |

### Additional Generation Controls

| Flag | Description |
|------|-------------|
| `--addictive` | Enable Behavioral Loop mode |
| `--arpeggio` | Enable the arpeggio track |
| `--modulation N` | Modulation timing (`0` None, `1` LastChorus, `2` AfterBridge, `3` EachChorus, `4` Random) |
| `--composition N` | Composition style (`0` MelodyLead, `1` BackgroundMotif, `2` SynthDriven) |
| `--enable-sus` | Enable sus2/sus4 chord substitutions |
| `--enable-9th` | Enable 9th chord extensions |
| `--syncopation` | Enable syncopation effects in melody rhythm |
| `--drive N` | Drive feel (`0` laid-back, `50` neutral, `100` aggressive) |
| `--no-drums` | Disable the drums track |
| `--no-guitar` | Disable the guitar track |
| `--vocal-groove N` | Vocal groove (`0` Straight, `1` OffBeat, `2` Swing, `3` Syncopated, `4` Driving16th, `5` Bouncy8th) |
| `--melodic-complexity N` | Melodic complexity (`0` Simple, `1` Standard, `2` Complex) |
| `--hook-intensity N` | Hook intensity (`0` Off, `1` Light, `2` Normal, `3` Strong, `4` Maximum) |
| `--melody-template N` | Melody template (`0` Auto, `1-7`) |
| `--arrangement N` | Arrangement growth (`0` LayerAdd, `1` RegisterAdd) |
| `--motif-repeat-scope N` | Motif repeat scope (`0` FullSong, `1` PerSection) |
| `--energy-curve N` | Energy curve (`0` GradualBuild, `1` FrontLoaded, `2` WavePattern, `3` SteadyState) |

### Humanization

| Flag | Description |
|------|-------------|
| `--humanize` | Enable timing and velocity humanization |
| `--humanize-timing N` | Timing variation amount (`0-100`); also enables humanization |
| `--humanize-velocity N` | Velocity variation amount (`0-100`); also enables humanization |

### Arpeggio

Use these options with `--arpeggio`. Setting a pattern or speed also enables the arpeggio track.

| Flag | Description |
|------|-------------|
| `--arpeggio-pattern N` | Pattern (`0` Up, `1` Down, `2` UpDown, `3` Random, `4` Pinwheel, `5` PedalRoot, `6` Alberti, `7` BrokenChord) |
| `--arpeggio-speed N` | Speed (`0` Eighth, `1` Sixteenth, `2` Triplet) |
| `--arpeggio-octave N` | Octave range (`1-3`) |
| `--arpeggio-gate N` | Gate amount (`0-100`) |

### SE, Call, and MIX

| Flag | Description |
|------|-------------|
| `--no-se` | Disable the SE track |
| `--call N` | Call setting (`0` Auto, `1` Enabled, `2` Disabled) |
| `--no-call-notes` | Disable call-note output |
| `--intro-chant N` | Intro chant (`0` None, `1` Gachikoi, `2` Shouting) |
| `--mix-pattern N` | MIX pattern (`0` None, `1` Standard, `2` Tiger) |
| `--call-density N` | Call density (`0` None, `1` Minimal, `2` Standard, `3` Intense) |

### Chord Extensions and Modulation

| Flag | Description |
|------|-------------|
| `--enable-7th` | Enable 7th chord extensions |
| `--enable-tritone-sub` | Enable tritone substitutions |
| `--modulation-semitones N` | Modulation amount (`1-4` semitones) |

### File Operations

| Flag | Description |
|------|-------------|
| `--input FILE` | Analyze an existing MIDI file; implies `--analyze` |
| `--validate FILE` | Validate MIDI file structure |
| `--regenerate FILE` | Regenerate from embedded midi-sketch metadata |
| `--new-seed N` | Use a new seed with `--regenerate` (`0` is valid) |
| `--format FMT` | Select `smf1` or `smf2` (MIDI 2.0 Container File); regeneration keeps the input format when omitted |
| `-o`, `--output FILE` | Set the generated or regenerated MIDI path |

`--regenerate` accepts only `--new-seed`, `--format`, `--output`, `--analyze`, `--json`, `--bar`, and `--dump-collisions-at` in addition to the input path. Generation options are rejected. The command detects SMF1, SMF2 Clip, and the supported SMF2 container forms and restores the embedded configuration.

The default output format is SMF1. `--input` dissonance analysis currently works for SMF1; SMF2 input is recognized and its metadata can be displayed, but dissonance analysis and note inspection are not implemented. `--validate` supports SMF1, SMF2 Clip, and the supported ktmidi container; `SMF2CON1` validation is not implemented.

### Analysis & Debugging

| Flag | Description |
|------|-------------|
| `--analyze` | Analyze generated or input MIDI for dissonance |
| `--json` | Write validation or analysis JSON to stdout |
| `--bar N` | Inspect notes at bar `N` (1-indexed); note inspection is available for SMF1 |
| `--dump-collisions-at N` | Dump notes and collision state at tick `N` |
| `--help`, `-h` | Show the command reference printed by the binary |

With `--analyze --json`, stdout contains only the analysis document. The generated MIDI and event sidecars are still written. With `--validate --json` or `--input --json`, stdout contains only the corresponding JSON report. `--json` without `--analyze` or `--validate` does not switch ordinary generation output to JSON.

## SongConfig JSON

`--config` reads a `SongConfig` JSON object. Field names use snake_case, and nested `arpeggio` and `chord_extension` objects use the same names as the native configuration type. This is the configuration path for controls that have no CLI flag.

```json
{
  "style_preset_id": 3,
  "seed": 12345,
  "bpm": 120,
  "guitar_enabled": false,
  "enable_syncopation": true,
  "mora_rhythm_mode": 1,
  "melody_syncopation_prob": 60,
  "arpeggio_enabled": true,
  "arpeggio": {
    "pattern": 0,
    "speed": 1,
    "octave_range": 2,
    "gate": 0.8
  }
}
```

```bash
./build/bin/midisketch_cli --config song-config.json -o configured.mid
```

## Dissonance Analysis

The `--analyze` flag reports four issue types:

| Type | Description | Typical severity |
|------|-------------|------------------|
| **SimultaneousClash** | Simultaneous notes form a dissonant interval, such as a minor 2nd or major 7th | High |
| **NonChordTone** | A note is outside the current chord | Low-Medium |
| **SustainedOverChordChange** | A note is held across a chord change | Medium |
| **NonDiatonicNote** | A note is outside the key scale | High |

The text report groups findings as `CRITICAL`, `WARNING`, and `INFO`. Critical findings include high-severity simultaneous clashes and non-diatonic notes. Passing tones and neighbor tones can appear as informational tension.

### Example Output

```
=== Dissonance Analysis ===

Action Summary:
  INFO:     47 normal musical tensions (no action needed)

Technical Breakdown:
  Simultaneous clashes:      0
  Non-chord tones:           47 (usually acceptable)
  Sustained over chord:      0
  Non-diatonic notes:        0
```

### JSON Output

Use `--json` for machine-readable output:

```bash
./build/bin/midisketch_cli --input song.mid --json > analysis.json
```

The report contains a `summary` object and an `issues` array. The summary includes issue counts, the key, and modulation information. An issue object includes `type`, `severity`, `tick`, `bar`, and `beat`; clash issues also include interval and note details. The following excerpt comes from a fixed-seed run; only the first issue is shown.

```json
{
  "summary": {
    "total_issues": 47,
    "simultaneous_clashes": 0,
    "non_chord_tones": 47,
    "sustained_over_chord_change": 0,
    "non_diatonic_notes": 0,
    "high_severity": 0,
    "medium_severity": 2,
    "low_severity": 45,
    "key": 0,
    "key_name": "C major",
    "modulation_tick": 0,
    "modulation_amount": 0,
    "pre_modulation_issues": 47,
    "post_modulation_issues": 0
  },
  "issues": [
    {
      "type": "non_chord_tone",
      "severity": "low",
      "tick": 6720,
      "bar": 4,
      "beat": 3.00,
      "track": "motif",
      "pitch": 62,
      "pitch_name": "D4",
      "chord_degree": 2,
      "chord_name": "Em",
      "chord_tones": ["E", "G", "B"],
      "provenance": {
        "generation_chord_degree": 2,
        "generation_lookup_tick": 6720,
        "generation_source": "motif",
        "original_pitch": 60
      }
    }
  ]
}
```

## Bar Inspection

The `--bar N` flag shows notes in a bar grouped by track. It is available for SMF1 input and SMF1 generation output.

```bash
./build/bin/midisketch_cli --input song.mid --bar 4
```

Output format (excerpt from a fixed-seed SMF1 run; values depend on the input):

```
=== Bar 4 (tick 5760-7680) ===

Chord:
  beat 1.0: G3 (240 tick)
  beat 1.0: B3 (240 tick)
  beat 1.0: E4 (240 tick)
  beat 1.5: G3 (240 tick)
  beat 2.0: G3 (240 tick)
  beat 2.5: G3 (240 tick)
  beat 3.0: E3 (240 tick)
  beat 3.0: G3 (240 tick)
  beat 3.0: B3 (240 tick)
  beat 3.5: G3 (240 tick)
  beat 4.0: G3 (240 tick)
  beat 4.5: G3 (240 tick)

Motif:
  beat 1.0: G4 (1 beat)
  beat 3.0: D4 (1 beat)

Aux:
  beat 1.0: B4 (1 beat)
  beat 3.0: B4 (1 beat)

Drums:
  beat 1.0: G#2 (240 tick)
  beat 1.0: D#3 (240 tick)
  beat 2.0: C#2 (240 tick)
  beat 2.0: G#2 (240 tick)
  beat 3.0: G#2 (240 tick)
  beat 4.0: C#2 (240 tick)
  beat 4.0: G#2 (240 tick)
```

Notes that started in a previous bar are shown as `(sustained)` without a beat number:

```
Vocal:
  → A4 (sustained)
  beat 2.5: G4 (1 beat)
```

## MIDI Regeneration

Regenerate a song from its embedded `midi-sketch` metadata:

```bash
# Keep the embedded seed and write regenerated.mid.
./build/bin/midisketch_cli --regenerate song.mid

# Use a new seed and an explicit output path.
./build/bin/midisketch_cli --regenerate song.mid --new-seed 54321 -o variant.mid
```

The CLI detects SMF1 and supported SMF2 forms, restores the embedded `SongConfig`, and writes the regenerated MIDI. Without `--format`, regeneration keeps the input's SMF1 or SMF2 family. Use `--format smf1` or `--format smf2` to choose the output explicitly.

### Blueprint Parameters

| ID | Blueprint |
|----|-----------|
| 0 | Traditional |
| 1 | RhythmLock |
| 2 | StoryPop |
| 3 | Ballad |
| 4 | IdolStandard |
| 5 | IdolHyper |
| 6 | IdolKawaii |
| 7 | IdolCoolPop |
| 8 | IdolEmo |
| 9 | BehavioralLoop |
| 255 | Random selection |

Specify a blueprint by name or ID:

```bash
./build/bin/midisketch_cli --blueprint rhythmlock
./build/bin/midisketch_cli --blueprint ballad
```

## Workflow Examples

### BGM-Only Generation

Generate accompaniment first and skip the vocal track. Use the library API, including the JavaScript [`regenerateVocal`](./api-js#regeneratevocal-configorseed) method, to add or revise a vocal track later; CLI `--regenerate` recreates the embedded configuration and does not add a vocal.

```bash
# Generate BGM only.
./build/bin/midisketch_cli --style 5 --skip-vocal -o bgm.mid

# Recreate the embedded configuration in a separate file.
./build/bin/midisketch_cli --regenerate bgm.mid -o bgm-regenerated.mid
```

### Advanced Generation

```bash
# Guitar is enabled by default; set drive and energy explicitly.
./build/bin/midisketch_cli --style 6 --drive 80 --energy-curve 1

# K-Pop vocal style with syncopation and Behavioral Loop mode.
./build/bin/midisketch_cli --style 0 --vocal-style 13 --syncopation --addictive

# Melody and motif overrides.
./build/bin/midisketch_cli --style 3 --melody-max-leap 7 --melody-chorus-register-shift 4 \
  --motif-motion 2 --motif-rhythm-density 2

# Disable guitar and drums, then humanize timing and velocity.
./build/bin/midisketch_cli --style 0 --no-guitar --no-drums --humanize-timing 25 \
  --humanize-velocity 20
```

### Quality Iteration

```bash
# Generate and analyze.
./build/bin/midisketch_cli --seed 12345 --analyze

# Try another seed if the report needs improvement.
./build/bin/midisketch_cli --seed 12346 --analyze

# Adjust a supported generation parameter.
./build/bin/midisketch_cli --seed 12345 --vocal-attitude 0 --analyze
```

### Batch Analysis

```bash
for f in *.mid; do
  echo "=== $f ==="
  ./build/bin/midisketch_cli --input "$f" --json | jq '.summary'
done
```

## Output Files

Generation writes the MIDI file and an event JSON sidecar:

| Invocation | Files |
|------------|-------|
| No `--output` | `output.mid`, `output.json` |
| `--output song.mid` | `song.mid`, `song.mid.json` |
| Generation with `--analyze` and no `--json` | Adds `analysis.json`, or `song.mid.analysis.json` with a custom output |

Regeneration writes `regenerated.mid` by default and does not write an event sidecar. With `--analyze` and no `--json`, its report is `analysis.json`, or `<output>.analysis.json` with a custom output. With `--json --analyze`, the report is written to stdout instead of an analysis sidecar.

For `--input`, `--output report.json` names the analysis report when `--json` is not used. `--validate` writes its text or JSON report to stdout.

## Interval Reference

The analyzer compares actual semitone distances in the context of the notes and chords it evaluates. Chord voicings, prepared suspensions, passing durations, and metric position can suppress or change a finding. Distances above 24 semitones are normally skipped; a low-register bass major seventh is a special case. The rows below describe the common interval labels; a label alone does not determine whether a finding is emitted.

| Semitones | Name | Typical treatment |
|-----------|------|-------------------|
| 1 | minor 2nd | High-risk clash candidate |
| 2 | major 2nd | Context-dependent; a close interval can be high severity |
| 3 | minor 3rd | Usually consonant |
| 4 | major 3rd | Usually consonant |
| 5 | perfect 4th | Context-dependent |
| 6 | tritone | Context-dependent; close intervals are medium severity |
| 7 | perfect 5th | Usually consonant |
| 8 | minor 6th | Usually consonant |
| 9 | major 6th | Usually consonant |
| 10 | minor 7th | Often accepted as a color tone |
| 11 | major 7th | Context-dependent; close intervals can be medium or high severity |

Compound intervals are evaluated by their actual distance. For example, 13 semitones is a minor 9th, 18 or 30 semitones is a tritone, and 23 or 35 semitones is a major seventh; a compound major seventh can be lower severity than a close major seventh.
