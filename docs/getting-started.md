# Getting Started

::: warning Alpha Version
This package is currently in alpha and not yet published to npm. For now, please build from source or use the demo on this site.
:::

MIDI Sketch is a lightweight library for auto-generating pop music MIDI sketches. It runs entirely in the browser using WebAssembly.

## Quick Start

```javascript
import { MidiSketch, init, createDefaultConfig, downloadMidi } from 'midi-sketch'

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

- **Vocal** - Main melody line
- **Chord** - Harmonic backing
- **Bass** - Bass line
- **Drums** - Rhythm patterns
- **Motif** - Background repetitive patterns
- **Arpeggio** - Synth arpeggio patterns

## Next Steps

- [Installation](./installation) - Install the library
- [API Reference](./api) - Full API documentation
