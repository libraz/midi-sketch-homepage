# Getting Started

::: warning Alpha Version
This package is currently in alpha and not yet published to npm. For now, please build from source or use the demo on this site.
:::

MIDI Sketch is a lightweight library for auto-generating pop music MIDI sketches. It runs entirely in the browser using WebAssembly.

## Quick Start

```javascript
import midisketch from 'midi-sketch'

// Initialize the WASM module
await midisketch.init()

// Create an instance
const sketch = new midisketch.MidiSketch()

// Generate MIDI
sketch.generate({
  structureId: 0,  // Song structure
  moodId: 0,       // Mood preset
  chordId: 0,      // Chord progression
  key: 0,          // Key (0 = C)
  bpm: 120         // Tempo
})

// Get the MIDI data
const midiData = sketch.getMidi()

// Download the file
midisketch.downloadMidi(midiData, 'my-song.mid')
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
