# Getting Started

MIDI Sketch is a lightweight library for auto-generating pop music MIDI sketches. It runs entirely in the browser using WebAssembly.

## Quick Start

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

- **Vocal** - Main melody line
- **Aux** - Sub-melody support (pulse loops, target hints, groove accents)
- **Chord** - Harmonic backing with voice leading
- **Bass** - Bass line with approach notes
- **Drums** - Rhythm patterns with fills
- **Motif** - Background repetitive patterns (BackgroundMotif style)
- **Arpeggio** - Synth arpeggio patterns (SynthDriven style)
- **SE** - Section markers

## Next Steps

- [Installation](./installation) - Install the library
- [API Reference](./api) - Full API documentation
