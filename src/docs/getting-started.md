# Getting Started

MIDI Sketch is a lightweight library for auto-generating pop music MIDI sketches. It runs entirely in the browser using WebAssembly.

::: tip New to music theory?
If terms like chord progression, key, or motif are unfamiliar, start with the [Course](/docs/course/primer) — it teaches the music basics behind every MidiSketch setting, with playable notation examples.
:::

## Quick Start

::: warning BETA
The npm package is not yet published. During the beta period, please use the library via the [demo page](/) or build from source. See [Installation](./installation) for details.
:::

```javascript
import { MidiSketch, init, createDefaultConfig, downloadMidi } from '@libraz/midi-sketch'

// Initialize the WASM module
await init()

// Create an instance
const sketch = new MidiSketch()

// Create a config for a style preset (0 = first style)
const config = createDefaultConfig(0)

// Customize as needed
config.key = 0           // Key (0 = C)
config.bpm = 120         // Tempo (0 = use style default)
config.seed = 12345      // Random seed (0 = random)

// Generate MIDI
sketch.generateFromConfig(config)

// Get the MIDI data
const midiData = sketch.getMidi()

// Download the file
downloadMidi(midiData, 'my-song.mid')
```

## What It Generates

MIDI Sketch generates multi-track MIDI files with:

| Track | Channel | Description |
|-------|---------|-------------|
| **Vocal** | 0 | Main melody line (piano roll-safe) |
| **Chord** | 1 | Harmonic backing with voice leading |
| **Bass** | 2 | Bass line with approach notes |
| **Motif** | 3 | Background patterns (BackgroundMotif style) |
| **Arpeggio** | 4 | Synth arpeggios (SynthDriven style) |
| **Aux** | 5 | Sub-melody support (pulse loops, groove accents) |
| **Guitar** | 6 | Accompaniment guitar (enabled by default) |
| **Drums** | 9 | Rhythm patterns with fills (GM drums) |
| **SE** | 15 | Section markers |

::: info Track Availability
Not all tracks are generated for every style:
- **Motif** track: Only in `BackgroundMotif` composition style
- **Arpeggio** track: Only when `arpeggioEnabled: true` (must be explicitly enabled, even in `SynthDriven` style)
- **Guitar** track: Enabled by default (`guitarEnabled: true`); set `guitarEnabled: false` to disable
- **Vocal/Aux**: Can be skipped with `skipVocal: true` for BGM-only generation
:::

## Next Steps

- [Installation](./installation) - Install the library
- [JavaScript API](./api-js) - JavaScript/WASM API documentation
- [C++ API](./api-cpp) - C++/C API documentation
