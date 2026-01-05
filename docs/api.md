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

### `generateFromConfig(config)`

Generate MIDI from a SongConfig object.

```javascript
sketch.generateFromConfig({
  // Basic settings
  stylePresetId: 0,           // Style preset ID
  key: 0,                     // Key (0-11: C to B)
  bpm: 120,                   // Tempo (0=use style default)
  seed: 12345,                // Random seed (0=random)
  chordProgressionId: 0,      // Chord progression ID
  formId: 0,                  // Form/structure ID
  vocalAttitude: 0,           // 0=Clean, 1=Expressive, 2=Raw
  drumsEnabled: true,         // Enable drums track

  // Arpeggio settings
  arpeggioEnabled: false,     // Enable arpeggio track
  arpeggioPattern: 0,         // 0=Up, 1=Down, 2=UpDown, 3=Random
  arpeggioSpeed: 1,           // 0=Eighth, 1=Sixteenth, 2=Triplet
  arpeggioOctaveRange: 2,     // 1-3 octaves
  arpeggioGate: 80,           // Gate length (0-100)
  arpeggioSyncChord: true,    // Sync arpeggio with chord changes

  // Vocal settings
  vocalLow: 55,               // Vocal range lower bound (MIDI note)
  vocalHigh: 74,              // Vocal range upper bound (MIDI note)
  skipVocal: false,           // Skip vocal generation (for BGM-first workflow)

  // Vocal detail settings
  vocalNoteDensity: 0,        // Note density (0=style default, 70=standard, 100=idol, 150=vocaloid)
  vocalMinNoteDivision: 0,    // Min note division (0=default, 4=quarter, 8=eighth, 16=sixteenth)
  vocalRestRatio: 0,          // Rest ratio (0-50, percentage of phrase rest time)
  vocalAllowExtremLeap: false, // Allow extreme leaps for vocaloid-style melodies

  // Humanization
  humanize: true,             // Enable humanization
  humanizeTiming: 50,         // Timing variation (0-100)
  humanizeVelocity: 50,       // Velocity variation (0-100)

  // Chord extensions
  chordExtSus: false,         // Enable sus2/sus4 chords
  chordExt7th: false,         // Enable 7th chords
  chordExt9th: false,         // Enable 9th chords
  chordExtSusProb: 20,        // Sus chord probability (0-100)
  chordExt7thProb: 30,        // 7th chord probability (0-100)
  chordExt9thProb: 25,        // 9th chord probability (0-100)

  // Composition style
  compositionStyle: 0,        // 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven

  // Duration
  targetDurationSeconds: 0,   // Target duration (0=use formId)

  // Modulation settings
  modulationTiming: 0,        // 0=None, 1=LastChorus, 2=AfterBridge, 3=EachChorus, 4=Random
  modulationSemitones: 1,     // Modulation amount (+1 to +4 semitones)

  // Call/SE settings (for idol-style music)
  seEnabled: false,           // Enable SE track
  callEnabled: false,         // Enable call feature
  callNotesEnabled: false,    // Output calls as notes
  introChant: 0,              // 0=None, 1=Gachikoi, 2=Shouting
  mixPattern: 0,              // 0=None, 1=Standard, 2=Tiger
  callDensity: 0,             // 0=None, 1=Minimal, 2=Standard, 3=Intense

  // Arrangement settings
  arrangementGrowth: 0,       // 0=LayerAdd (add instruments), 1=RegisterAdd (expand register)

  // Motif settings
  motifRepeatScope: 0,        // 0=FullSong (same motif), 1=Section (per-section motif)
  motifFixedProgression: true, // Use same chord progression for all sections
  motifMaxChordCount: 0,      // Max chord count (0=no limit, 2-8)
})
```

### `regenerateVocal(params)`

Regenerate only the vocal track. BGM tracks (chord, bass, drums, arpeggio) remain unchanged.
Use after `generateFromConfig()` with `skipVocal: true` for BGM-first workflow.

```javascript
sketch.regenerateVocal({
  seed: 0,                     // Random seed (0=new random)
  vocalLow: 55,                // Vocal range lower bound (MIDI note)
  vocalHigh: 74,               // Vocal range upper bound (MIDI note)
  vocalAttitude: 1,            // 0=Clean, 1=Expressive, 2=Raw

  // Optional: Fine-tune vocal generation
  vocalNoteDensity: 100,       // Note density (0=style default, 70=standard, 100=idol, 150=vocaloid)
  vocalMinNoteDivision: 8,     // Min note division (0=default, 4=quarter, 8=eighth, 16=sixteenth)
  vocalRestRatio: 20,          // Rest ratio (0-50, percentage of phrase rest time)
  vocalAllowExtremLeap: false, // Allow extreme leaps for vocaloid-style melodies
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
// { sections: [...], tracks: [...], bpm: 120, duration_ticks: ... }
```

### `destroy()`

Clean up resources.

```javascript
sketch.destroy()
```

## BGM-First Workflow

Generate backing track first, then add vocals:

```javascript
const sketch = new midisketch.MidiSketch()

// Step 1: Generate BGM only
const config = midisketch.createDefaultConfig(0)
config.skipVocal = true
sketch.generateFromConfig(config)

// Preview BGM...

// Step 2: Add vocals
sketch.regenerateVocal({
  seed: 0,
  vocalLow: 55,
  vocalHigh: 74,
  vocalAttitude: 1,
})

const midiData = sketch.getMidi()
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

### `ModulationTiming`

```javascript
ModulationTiming.None        // 0 - No modulation
ModulationTiming.LastChorus  // 1 - Modulate at last chorus
ModulationTiming.AfterBridge // 2 - Modulate after bridge
ModulationTiming.EachChorus  // 3 - Modulate at each chorus
ModulationTiming.Random      // 4 - Random modulation timing
```

### `IntroChant`

```javascript
IntroChant.None     // 0 - No intro chant
IntroChant.Gachikoi // 1 - Gachikoi style chant
IntroChant.Shouting // 2 - Shouting style chant
```

### `MixPattern`

```javascript
MixPattern.None     // 0 - No mix pattern
MixPattern.Standard // 1 - Standard call & response
MixPattern.Tiger    // 2 - Tiger fire pattern
```

### `CallDensity`

```javascript
CallDensity.None     // 0 - No calls
CallDensity.Minimal  // 1 - Minimal call insertions
CallDensity.Standard // 2 - Standard call frequency
CallDensity.Intense  // 3 - High-density calls
```

### `ArrangementGrowth`

```javascript
ArrangementGrowth.LayerAdd    // 0 - Add layers/instruments over time
ArrangementGrowth.RegisterAdd // 1 - Expand register range over time
```

### `MotifRepeatScope`

```javascript
MotifRepeatScope.FullSong // 0 - Same motif throughout song
MotifRepeatScope.Section  // 1 - Different motif per section
```
