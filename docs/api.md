# API Reference

## Module Functions

### `init()`

Initialize the WASM module. Must be called before using other functions.

```javascript
await midisketch.init()
```

### `getVersion()`

Returns the library version string.

```javascript
const version = midisketch.getVersion()
```

### `getStructures()`

Returns available song structure presets.

```javascript
const structures = midisketch.getStructures()
// [{ name: 'StandardPop' }, { name: 'FullPop' }, ...]
```

### `getMoods()`

Returns available mood presets.

```javascript
const moods = midisketch.getMoods()
// [{ name: 'Straight Pop', defaultBpm: 120 }, ...]
```

### `getChords()`

Returns available chord progressions.

```javascript
const chords = midisketch.getChords()
// [{ name: 'Pop4', display: 'I-V-vi-IV' }, ...]
```

### `getStylePresets()`

Returns available style presets with detailed information.

```javascript
const presets = midisketch.getStylePresets()
// [{ id: 0, name: 'jpop', displayName: 'J-Pop', description: '...', tempoDefault: 120, allowedAttitudes: 7 }, ...]
```

### `getProgressionsByStyle(styleId)`

Returns chord progression IDs compatible with the given style.

```javascript
const progressions = midisketch.getProgressionsByStyle(0)
// [0, 1, 2, ...]
```

### `getFormsByStyle(styleId)`

Returns form/structure IDs compatible with the given style.

```javascript
const forms = midisketch.getFormsByStyle(0)
// [0, 1, 2, ...]
```

### `createDefaultConfig(styleId)`

Creates a default SongConfig for the given style preset.

```javascript
const config = midisketch.createDefaultConfig(0)
// { stylePresetId: 0, key: 0, bpm: 120, ... }
```

### `downloadMidi(midiData, filename)`

Downloads MIDI data as a file.

```javascript
midisketch.downloadMidi(midiData, 'song.mid')
```

## MidiSketch Class

### Constructor

```javascript
const sketch = new midisketch.MidiSketch()
```

### `generate(params)`

Generate MIDI with the given parameters.

```javascript
sketch.generate({
  structureId: 0,              // Structure pattern (0-10)
  moodId: 0,                   // Mood preset (0-19)
  chordId: 0,                  // Chord progression (0-21)
  key: 0,                      // Key (0-11: C to B)
  bpm: 120,                    // Tempo (60-180, 0=use default)
  seed: 12345,                 // Random seed (0=auto)
  drumsEnabled: true,          // Enable drums track
  targetDurationSeconds: 0,    // Target duration (0=use structure, 60-300)
})
```

### `getMidi()`

Returns the generated MIDI data as `Uint8Array`.

```javascript
const midiData = sketch.getMidi()
```

### `getEvents()`

Returns the event data for visualization/playback.

```javascript
const events = sketch.getEvents()
// { sections: [...], tracks: [...], bpm: 120, totalTicks: ... }
```

### `regenerateMelody(seed?)`

Regenerate only the melody track.

```javascript
sketch.regenerateMelody() // New random seed
sketch.regenerateMelody(42) // Specific seed
```

### `regenerateMelodyEx(params)`

Regenerate only the melody track with full parameter control. BGM tracks remain unchanged.

```javascript
sketch.regenerateMelodyEx({
  seed: 0,               // Random seed (0=new random)
  vocalLow: 55,          // Vocal range lower bound (MIDI note)
  vocalHigh: 74,         // Vocal range upper bound (MIDI note)
  vocalAttitude: 1,      // 0=Clean, 1=Expressive, 2=Raw
  compositionStyle: 0,   // 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven
})
```

### `generateFromConfig(config)`

Generate MIDI from a SongConfig object.

```javascript
sketch.generateFromConfig({
  stylePresetId: 0,
  key: 0,
  bpm: 120,
  seed: 12345,
  chordProgressionId: 0,
  formId: 0,
  vocalAttitude: 0,
  drumsEnabled: true,
  arpeggioEnabled: false,
  vocalLow: 55,
  vocalHigh: 74,
  humanize: true,
  humanizeTiming: 50,
  humanizeVelocity: 50,
  targetDurationSeconds: 0,
})
```

### `destroy()`

Clean up resources.

```javascript
sketch.destroy()
```

## Constants

### `VocalAttitude`

```javascript
VocalAttitude.Clean      // 0 - Clean, controlled vocals
VocalAttitude.Expressive // 1 - Expressive, dynamic vocals
VocalAttitude.Raw        // 2 - Raw, emotional vocals
```

### `CompositionStyle`

```javascript
CompositionStyle.MelodyLead     // 0 - Traditional melody-driven
CompositionStyle.BackgroundMotif // 1 - Motif-driven with subdued vocals
CompositionStyle.SynthDriven    // 2 - Arpeggio-forward electronic
```
