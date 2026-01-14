# CLI Reference

MIDI Sketch includes a command-line tool for generation, analysis, and debugging. This is useful for batch processing, CI/CD pipelines, and investigating MIDI quality issues.

## Installation

Build the CLI from source:

```bash
cd midi-sketch
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make midisketch_cli
```

The binary will be at `build/midisketch_cli`.

## Basic Usage

```bash
# Generate with defaults
./midisketch_cli

# Generate with specific style and mood
./midisketch_cli --style 5 --mood 3 --bpm 128

# Generate and analyze for dissonance
./midisketch_cli --style 5 --analyze

# Analyze existing MIDI file
./midisketch_cli --input existing.mid --analyze
```

## Command Reference

### Generation Parameters

| Flag | Description | Default |
|------|-------------|---------|
| `--seed N` | Random seed (0 = auto-random) | 0 |
| `--style N` | Style preset ID (0-16) | 0 |
| `--mood N` | Mood ID (0-19), overrides style mapping | - |
| `--chord N` | Chord progression ID (0-19) | - |
| `--bpm N` | BPM (40-240) | Style preset |
| `--key N` | Key (0-11: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B) | 0 |
| `--form N` | Form/structure pattern ID (0-17) | - |
| `--duration N` | Target duration in seconds (0 = use pattern) | 0 |

### Vocal Parameters

| Flag | Description | Default |
|------|-------------|---------|
| `--skip-vocal` | Skip vocal in initial generation (BGM-first workflow) | - |
| `--regenerate-vocal` | Regenerate vocal after initial generation | - |
| `--vocal-seed N` | Seed for vocal regeneration | - |
| `--vocal-attitude N` | Vocal attitude (0=Clean, 1=Expressive, 2=Raw) | 1 |
| `--vocal-low N` | Vocal range lower bound (MIDI note) | 57 |
| `--vocal-high N` | Vocal range upper bound (MIDI note) | 79 |
| `--vocal-style N` | Vocal style preset | 0 (Auto) |

Vocal style options (13 presets):
- 0: Auto (selects based on style preset)
- 1: Standard
- 2: Vocaloid (fast, wide leaps)
- 3: UltraVocaloid (extreme speed, 32nd notes)
- 4: Idol (catchy, hook-heavy)
- 5: Ballad (slow, sustained)
- 6: Rock (powerful, register shift)
- 7: CityPop (jazzy, syncopated)
- 8: Anime (dynamic, expressive)
- 9: BrightKira (high, sparkling)
- 10: CoolSynth (electronic, precise)
- 11: CuteAffected (playful)
- 12: PowerfulShout (intense)

### File Operations

| Flag | Description |
|------|-------------|
| `--input FILE` | Analyze existing MIDI file |
| `--validate FILE` | Validate MIDI file structure |
| `--regenerate FILE` | Regenerate from embedded metadata |
| `--new-seed N` | Use new seed when regenerating |
| `--format FMT` | MIDI format: `smf1` or `smf2` (default) |

### Analysis & Debugging

| Flag | Description |
|------|-------------|
| `--analyze` | Analyze generated/input MIDI for dissonance |
| `--json` | Output analysis as JSON to stdout |
| `--bar N` | Inspect notes at bar N (1-indexed) |

## Dissonance Analysis

The `--analyze` flag performs music theory-based analysis to detect potential issues.

### Issue Types

| Type | Description | Severity |
|------|-------------|----------|
| **SimultaneousClash** | Two notes with dissonant interval (minor 2nd, major 7th) | High |
| **NonChordTone** | Note not in current chord | Low-Medium |
| **SustainedOverChordChange** | Note held over chord boundary | Medium |
| **NonDiatonicNote** | Note outside the key's scale | High |

### Severity Levels

- **CRITICAL (High)**: Definitely wrong, requires fixing
- **WARNING (Medium)**: Worth reviewing
- **INFO (Low)**: Normal musical tension (passing tones, neighbor tones)

### Example Output

```
=== Dissonance Analysis ===

Action Summary:
  CRITICAL: 2 issues require fixing
  WARNING:  5 issues worth reviewing
  INFO:     12 normal musical tensions (no action needed)

Technical Breakdown:
  Simultaneous clashes:      2
  Non-chord tones:           8 (usually acceptable)
  Sustained over chord:      3
  Non-diatonic notes:        1

=== CRITICAL Issues (require fixing) ===

Bar 4, beat 2.0 (tick 7680):
  Clash: minor 2nd between Vocal(E4) vs Chord(F4)
  Chord: Dm7
  Playing: Vocal(E4), Chord(D3,F4,A4,C5), Bass(D2)
```

### JSON Output

Use `--json` for machine-readable output:

```bash
./midisketch_cli --input song.mid --analyze --json > analysis.json
```

JSON structure:

```json
{
  "summary": {
    "total_issues": 19,
    "simultaneous_clashes": 2,
    "non_chord_tones": 8,
    "sustained_over_chord_change": 3,
    "non_diatonic_notes": 1,
    "high_severity": 2,
    "medium_severity": 5,
    "low_severity": 12
  },
  "issues": [
    {
      "type": "simultaneous_clash",
      "severity": "high",
      "tick": 7680,
      "bar": 4,
      "beat": 2.0,
      "interval_semitones": 1,
      "interval_name": "minor 2nd",
      "notes": [
        { "track": "Vocal", "pitch": 64, "name": "E4" },
        { "track": "Chord", "pitch": 65, "name": "F4" }
      ]
    }
  ]
}
```

## Bar Inspection

The `--bar N` flag shows all notes in a specific bar, grouped by track:

```bash
./midisketch_cli --input song.mid --bar 8
```

Output format:

```
=== Bar 8 (tick 13440-15360) ===

Vocal:
  beat 1.0: G4 (2 beats)
  beat 3.0: E4 (1 beat)

Chord:
  beat 1.0: C4,E4,G4,B4 (4 beats)

Bass:
  beat 1.0: C2 (2 beats)
  beat 3.0: G2 (2 beats)

Drums:
  beat 1.0: kick
  beat 2.0: snare
  beat 3.0: kick
  beat 4.0: snare
```

Notes sustained from previous bars show `(sustained)`:

```
Vocal:
  → A4 (sustained from bar 7)
  beat 2.5: G4 (1 beat)
```

## MIDI Regeneration

Regenerate a song from its embedded metadata:

```bash
# Regenerate with original seed
./midisketch_cli --regenerate song.mid

# Regenerate with new seed
./midisketch_cli --regenerate song.mid --new-seed 54321
```

The CLI auto-detects MIDI format (SMF1, SMF2/ktmidi, SMF2/Clip) and extracts generation parameters embedded in the file.

## Workflow Examples

### BGM-First Workflow

Generate accompaniment first, then add vocal:

```bash
# Generate BGM only
./midisketch_cli --style 5 --skip-vocal -o bgm.mid

# Listen and decide on vocal style, then regenerate with vocal
./midisketch_cli --regenerate bgm.mid --regenerate-vocal --vocal-attitude 2
```

### Quality Iteration

Generate, analyze, and iterate until no critical issues:

```bash
# Generate and analyze
./midisketch_cli --seed 12345 --analyze

# If issues found, try different seed
./midisketch_cli --seed 12346 --analyze

# Or adjust parameters
./midisketch_cli --seed 12345 --vocal-attitude 0 --analyze
```

### Batch Analysis

Analyze multiple files:

```bash
for f in *.mid; do
  echo "=== $f ==="
  ./midisketch_cli --input "$f" --json | jq '.summary'
done
```

## Output Files

Standard generation creates:

| File | Description |
|------|-------------|
| `output.mid` | Generated MIDI (SMF Type 1 or 2) |
| `output.json` | Generation events and metadata |

With `--analyze`:

| File | Description |
|------|-------------|
| `analysis.json` | Dissonance analysis report |

## Interval Reference

Intervals detected in clash analysis:

| Semitones | Name | Risk |
|-----------|------|------|
| 1 | minor 2nd | High (clash) |
| 2 | major 2nd | Low |
| 3 | minor 3rd | Safe |
| 4 | major 3rd | Safe |
| 5 | perfect 4th | Safe |
| 6 | tritone | Medium |
| 7 | perfect 5th | Safe |
| 8 | minor 6th | Safe |
| 9 | major 6th | Safe |
| 10 | minor 7th | Low |
| 11 | major 7th | High (clash) |
