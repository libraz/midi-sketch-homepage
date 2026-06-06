# API Reference

## Module Functions

### `init()`

Initialize the WASM module. Must be called before using other functions.

```javascript
await midisketch.init()
```

::: warning Required First Call
You must call `init()` before using any other API functions. Calling other functions before initialization will result in errors.
:::

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

### `getBlueprints()`

Returns all available production blueprints.

```javascript
const blueprints = midisketch.getBlueprints()
// [{ id: 0, name: 'Traditional', paradigm: 0, riffPolicy: 0, weight: 42 }, ...]
```

### `getBlueprintCount()`

Returns the number of available blueprints.

```javascript
const count = midisketch.getBlueprintCount()
// 10
```

### `getBlueprintName(id)`

Returns the name of a blueprint by ID.

```javascript
const name = midisketch.getBlueprintName(1)
// 'RhythmLock'
```

### `getBlueprintParadigm(id)`

Returns the generation paradigm of a blueprint.

```javascript
const paradigm = midisketch.getBlueprintParadigm(1)
// 1 (GenerationParadigm.RhythmSync)
```

### `getBlueprintRiffPolicy(id)`

Returns the riff policy of a blueprint.

```javascript
const policy = midisketch.getBlueprintRiffPolicy(1)
// 1 (RiffPolicy.Locked)
```

### `getBlueprintWeight(id)`

Returns the selection weight (percentage) of a blueprint.

```javascript
const weight = midisketch.getBlueprintWeight(0)
// 42
```

### `getBlueprintDrumsRequired(id)`

Returns whether a blueprint requires the drums track. Blueprints 1 (RhythmLock), 5 (IdolHyper), and 7 (IdolCoolPop) require drums; for these, `drumsEnabled` is forced on unless `drumsEnabledExplicit: true` is set.

```javascript
const required = midisketch.getBlueprintDrumsRequired(1)
// true
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

### `validateConfig(config)`

Validates a `SongConfig` without generating. Returns a `ConfigError` code (`0` = OK).

```javascript
const code = midisketch.validateConfig(config)
if (code !== midisketch.ConfigError.OK) {
  console.error(midisketch.getConfigErrorMessage(code))
}
```

### `getConfigErrorMessage(code)`

Returns a human-readable message for a `ConfigError` code.

```javascript
const message = midisketch.getConfigErrorMessage(6)
// e.g. "Invalid BPM"
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
  stylePresetId: 0,           // Style preset ID (0-16)
  key: 0,                     // Key (0-11: C to B)
  bpm: 120,                   // Tempo (0=use style default)
  seed: 12345,                // Random seed (0=random)
  chordProgressionId: 0,      // Chord progression ID (0-21)
  formId: 0,                  // Form/structure ID (0-17)
  vocalAttitude: 0,           // 0=Clean, 1=Expressive, 2=Raw
  drumsEnabled: true,         // Enable drums track

  // Arpeggio settings
  arpeggioEnabled: false,     // Enable arpeggio track
  arpeggioPattern: 0,         // 0=Up, 1=Down, 2=UpDown, 3=Random, 4=Pinwheel, 5=PedalRoot, 6=Alberti, 7=BrokenChord
  arpeggioSpeed: 1,           // 0=Eighth, 1=Sixteenth, 2=Triplet
  arpeggioOctaveRange: 2,     // 1-3 octaves
  arpeggioGate: 0.8,          // Gate length (0.0-1.0)
  arpeggioSyncChord: true,    // Sync arpeggio with chord changes
  arpeggioBaseVelocity: 90,   // Base velocity for arpeggio notes (0-127)

  // Vocal settings
  vocalLow: 60,               // Vocal range lower bound (MIDI note, default C4)
  vocalHigh: 79,              // Vocal range upper bound (MIDI note, default G5)
  skipVocal: false,           // Skip vocal generation (for BGM-first workflow)

  // Vocal style settings
  vocalStyle: 0,              // Vocal style preset (0=Auto, 1-13=specific presets)
  melodyTemplate: 0,          // Melody template (0=Auto, 1-7=specific templates)
  melodicComplexity: 1,       // Melody complexity (0=Simple, 1=Standard, 2=Complex)
  hookIntensity: 2,           // Hook intensity (0=Off, 1=Light, 2=Normal, 3=Strong, 4=Maximum - normally set by Behavioral Loop)
  vocalGroove: 0,             // Groove feel (0=Straight, 1=OffBeat, 2=Swing, 3=Syncopated, 4=Driving16th, 5=Bouncy8th)

  // Humanization
  humanize: true,             // Enable humanization
  humanizeTiming: 0.4,        // Timing variation (0.0-1.0)
  humanizeVelocity: 0.3,      // Velocity variation (0.0-1.0)

  // Chord extensions
  chordExtSus: false,         // Enable sus2/sus4 chords
  chordExt7th: false,         // Enable 7th chords
  chordExt9th: false,         // Enable 9th chords
  chordExtTritoneSub: false,  // Enable tritone substitution (V7 -> bII7)
  chordExtSusProb: 0.2,       // Sus chord probability (0.0-1.0)
  chordExt7thProb: 0.15,      // 7th chord probability (0.0-1.0)
  chordExt9thProb: 0.25,      // 9th chord probability (0.0-1.0)
  chordExtTritoneSubProb: 0.5, // Tritone substitution probability (0.0-1.0)

  // Composition style
  compositionStyle: 0,        // 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven

  // Duration
  targetDurationSeconds: 0,   // Target duration (0=use formId)

  // Modulation settings
  modulationTiming: 0,        // 0=None, 1=LastChorus, 2=AfterBridge, 3=EachChorus, 4=Random
  modulationSemitones: 2,     // Modulation amount (+1 to +4 semitones)

  // Call/SE settings (for idol-style music)
  seEnabled: true,            // Enable SE track
  callSetting: 0,             // Call feature: 0=Auto (style decides), 1=Enabled, 2=Disabled
  callNotesEnabled: true,     // Output calls as notes
  introChant: 0,              // 0=None, 1=Gachikoi, 2=Shouting
  mixPattern: 0,              // 0=None, 1=Standard, 2=Tiger
  callDensity: 2,             // 0=None, 1=Minimal, 2=Standard, 3=Intense

  // Arrangement settings
  arrangementGrowth: 0,       // 0=LayerAdd (add instruments), 1=RegisterAdd (expand register)

  // Motif settings
  motifRepeatScope: 0,        // 0=FullSong (same motif), 1=Section (per-section motif)
  motifFixedProgression: true, // Use same chord progression for all sections
  motifMaxChordCount: 4,      // Max chord count (default 4)

  // Blueprint settings
  blueprintId: 0,             // Production blueprint (0=Traditional, 1-9=specific, 255=random)

  // Guitar settings
  guitarEnabled: true,        // Enable guitar track (default: true)

  // Drums explicit
  drumsEnabledExplicit: false, // True if drumsEnabled was explicitly set (allows overriding blueprint drums_required)

  // Mood settings
  mood: 0,                    // Mood preset override (0-23, used when moodExplicit=true)
  moodExplicit: false,        // Use explicit mood (true) or derive from stylePresetId (false)

  // Form settings
  formExplicit: false,        // Use formId exactly (true) or allow blueprint/randomization (false)

  // Drive feel
  driveFeel: 50,              // Drive feel: 0=laid-back, 50=neutral, 100=aggressive

  // Behavioral Loop
  addictiveMode: false,       // Enable Behavioral Loop mode (fixed riff, maximum hook)

  // Mora rhythm
  moraRhythmMode: 2,          // Mora rhythm mode: 0=Standard, 1=MoraTimed, 2=Auto

  // Syncopation
  enableSyncopation: false,   // Enable syncopation effects for VocalGroove

  // Energy curve
  energyCurve: 0,             // Energy curve: 0=GradualBuild, 1=FrontLoaded, 2=WavePattern, 3=SteadyState

  // Chord extension explicit
  chordExtProbExplicit: false, // True if chord extension probabilities were explicitly set (suppresses mood-based auto-adjustment)

  // Melody fine-grained control
  melodyMaxLeap: 0,           // Max leap interval: 0=preset, 1-12=semitones override
  melodySyncopationProb: 0xFF, // Syncopation probability: 0xFF=preset, 0-100=% override
  melodyPhraseLength: 0,      // Phrase length: 0=preset, 1-8=bars
  melodyLongNoteRatio: 0xFF,  // Long note ratio: 0xFF=preset, 0-100=% override
  melodyChorusRegisterShift: -128, // Chorus register shift: -128=preset, -12 to +12=semitones
  melodyHookRepetition: 0,    // Hook repetition: 0=preset, 1=off, 2=on (tri-state)
  melodyUseLeadingTone: 0,    // Leading tone insertion: 0=preset, 1=off, 2=on (tri-state)

  // Motif fine-grained control
  motifLength: 0,             // Motif length: 0=auto, 1/2/4=beats
  motifNoteCount: 0,          // Motif note count: 0=auto, 3-8
  motifMotion: 0xFF,          // Motif motion: 0xFF=preset, 0=Stepwise, 1=GentleLeap, 2=WideLeap, 3=NarrowStep, 4=Disjunct
  motifRegisterHigh: 0,       // Motif register: 0=auto, 1=low, 2=high
  motifRhythmDensity: 0xFF,   // Motif rhythm density: 0xFF=preset, 0=Sparse, 1=Medium, 2=Driving
})
```

::: info Parameter Dependencies
Many parameters depend on parent options being enabled. For example, `arpeggioPattern` has no effect if `arpeggioEnabled=false`. See [Option Relationships](/docs/option-relationships) for the full dependency tree.
:::

::: warning callEnabled is Legacy
`callSetting` (0=Auto, 1=Enabled, 2=Disabled) is the source of truth for the call feature. The boolean `callEnabled` is kept only for backward compatibility: when serializing, `callEnabled: true` maps to `callSetting: 1` and `false` to `callSetting: 2`; when reading a config back, `callEnabled` is derived from `callSetting` (and left `undefined` for Auto). Use `callSetting` in new code.
:::

### `regenerateVocal(configOrSeed)`

Regenerate only the vocal track (and Aux track). Keeps the same chord progression and structure.
Use after `generateVocal()` for vocal-first trial-and-error, or after `generateFromConfig()` with `skipVocal: true` for BGM-first workflow.
Accepts either a `VocalConfig` object or a seed number (default: 0 = new random).

```javascript
// With VocalConfig object
sketch.regenerateVocal({
  seed: 0,                     // Random seed (0=new random)
  vocalLow: 60,                // Vocal range lower bound (MIDI note, 36-96)
  vocalHigh: 79,               // Vocal range upper bound (MIDI note, 36-96)
  vocalAttitude: 1,            // 0=Clean, 1=Expressive, 2=Raw

  // Optional: Fine-tune vocal generation
  vocalStyle: 0,               // Vocal style preset (0=Auto, 1-13=specific presets)
  melodyTemplate: 0,           // Melody template (0=Auto, 1-7=specific templates)
  melodicComplexity: 1,        // Melody complexity (0=Simple, 1=Standard, 2=Complex)
  hookIntensity: 2,            // Hook intensity (0=Off, 1=Light, 2=Normal, 3=Strong)
  vocalGroove: 0,              // Groove feel (0=Straight, 1=OffBeat, 2=Swing, etc.)
  compositionStyle: 0,         // Composition style (0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven)
  keepMotif: false,            // RhythmSync only: keep the existing Motif as the rhythmic axis (false=regenerate both)
})

// Or with seed only
sketch.regenerateVocal(12345)
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

### `generateVocal(config)`

Generate only the vocal track without accompaniment. Use for trial-and-error workflow: generate vocal, preview, regenerate if needed. Call `generateAccompaniment()` when satisfied with the vocal.

```javascript
sketch.generateVocal({
  stylePresetId: 0,
  key: 0,
  bpm: 120,
  seed: 0,
  chordProgressionId: 0,
  formId: 0,
  vocalLow: 60,
  vocalHigh: 79,
  vocalAttitude: 1,
  // ... other SongConfig options
})
```

### `generateAccompaniment(config?)`

Generate accompaniment tracks for existing vocal. Must be called after `generateVocal()` or `setVocalNotes()`. Generates: Aux → Bass → Chord → Guitar → Arpeggio → Drums → SE (adapting to vocal).

```javascript
// Simple: use default settings
sketch.generateAccompaniment()

// With configuration
sketch.generateAccompaniment({
  seed: 12345,                // Random seed (0 = auto)
  drumsEnabled: true,
  guitarEnabled: false,       // Disable guitar track (default: true)
  arpeggioEnabled: false,
  arpeggioPattern: 0,         // 0=Up, 1=Down, 2=UpDown, 3=Random, 4=Pinwheel, 5=PedalRoot, 6=Alberti, 7=BrokenChord
  arpeggioSpeed: 1,           // 0=Eighth, 1=Sixteenth, 2=Triplet
  arpeggioOctaveRange: 2,
  arpeggioGate: 80,           // 0-100
  arpeggioSyncChord: true,
  chordExtSus: false,
  chordExt7th: false,
  chordExt9th: false,
  chordExtTritoneSub: false,  // Tritone substitution (V7 -> bII7)
  chordExtSusProb: 20,        // 0-100
  chordExt7thProb: 30,        // 0-100
  chordExt9thProb: 25,        // 0-100
  chordExtTritoneSubProb: 50, // 0-100
  humanize: false,
  humanizeTiming: 50,         // 0-100
  humanizeVelocity: 50,       // 0-100
  seEnabled: true,
  callEnabled: false,
  callDensity: 2,             // 0=None, 1=Minimal, 2=Standard, 3=Intense
  introChant: 0,              // 0=None, 1=Gachikoi, 2=Shouting
  mixPattern: 0,              // 0=None, 1=Standard, 2=Tiger
  callNotesEnabled: true,
})
```

### `regenerateAccompaniment(seedOrConfig)`

Regenerate accompaniment tracks with a new seed or configuration. Keeps current vocal, regenerates all accompaniment tracks (Aux, Bass, Chord, Drums, etc.).

```javascript
// With seed only
sketch.regenerateAccompaniment(12345)

// With full configuration
sketch.regenerateAccompaniment({
  seed: 12345,
  drumsEnabled: true,
  arpeggioEnabled: true,
  // ... other AccompanimentConfig options
})
```

### `generateWithVocal(config)`

Generate all tracks with vocal-first priority. Generation order: Vocal → Aux → Bass → Chord → Guitar → Arpeggio → Drums → SE. Accompaniment adapts to vocal melody.

```javascript
sketch.generateWithVocal({
  stylePresetId: 0,
  key: 0,
  bpm: 120,
  seed: 0,
  // ... other SongConfig options
})
```

### `setVocalNotes(config, notes)`

Set custom vocal notes for accompaniment generation. Initializes the song structure and chord progression from config, then replaces the vocal track with the provided notes. Call `generateAccompaniment()` after this.

```javascript
// Set custom vocal notes
sketch.setVocalNotes(config, [
  { startTick: 0, duration: 480, pitch: 60, velocity: 100 },
  { startTick: 480, duration: 480, pitch: 62, velocity: 100 },
  { startTick: 960, duration: 960, pitch: 64, velocity: 100 },
])

// Generate accompaniment for the custom vocal
sketch.generateAccompaniment()

// Get the MIDI data
const midi = sketch.getMidi()
```

### `getPianoRollSafetyAt(tick, prevPitch?)`

Get piano roll safety info for a single tick. Returns safety level, reason flags, and collision info for each MIDI note (0-127). Use this before placing custom vocal notes to see which notes are safe.

```javascript
const info = sketch.getPianoRollSafetyAt(0)

// Check if C4 (pitch 60) is safe
if (info.safety[60] === 0) { // NoteSafety.Safe
  console.log('C4 is a chord tone, safe to use')
}

// Get recommended notes
console.log('Recommended:', info.recommended)
```

### `getPianoRollSafety(startTick, endTick, step)`

Get piano roll safety info for a range of ticks. Useful for visualizing safe notes over time in a piano roll editor.

```javascript
// Get safety info for first 4 bars, sampled at 16th note resolution
const infos = sketch.getPianoRollSafety(0, 1920 * 4, 120)

for (const info of infos) {
  console.log(`Tick ${info.tick}: chord degree ${info.chordDegree}`)
  console.log('Recommended notes:', info.recommended)
}
```

### `reasonToString(reason)`

Convert reason flags to human-readable string.

```javascript
const info = sketch.getPianoRollSafetyAt(0)
const reasonText = sketch.reasonToString(info.reason[60])
// "ChordTone" or "LowRegister, Tritone"
```

### `generateFromBuilder(builder)`

Generate MIDI from a SongConfigBuilder instance. The builder provides a fluent API with cascade detection for parameter changes.

```javascript
const builder = new midisketch.SongConfigBuilder(0)
  .setBpm(165)
  .setBlueprint(1)
  .setSeed(12345)

sketch.generateFromBuilder(builder)
```

### `getResolvedBlueprintId()`

Returns the actually used blueprint ID after generation. When `blueprintId=255` (random), this returns the randomly selected blueprint.

```javascript
sketch.generateFromConfig({ blueprintId: 255 })  // Random select
const actualId = sketch.getResolvedBlueprintId()
console.log(`Used blueprint: ${midisketch.getBlueprintName(actualId)}`)
```

### `destroy()`

Clean up resources.

```javascript
sketch.destroy()
```

## Generation Workflows

MIDI Sketch supports three generation workflows, each suited to different use cases:

::: tip Choosing a Workflow
| Workflow | Use Case |
|----------|----------|
| **BGM-First** | Preview accompaniment before adding vocals |
| **Vocal-First** | Iterate on melody before generating backing tracks |
| **Custom Vocal** | Import your own melody and generate fitting accompaniment |
:::

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
  vocalLow: 60,
  vocalHigh: 79,
  vocalAttitude: 1,
})

const midiData = sketch.getMidi()
```

## Vocal-First Workflow

Generate vocal first, preview, iterate, then generate accompaniment:

```javascript
const sketch = new midisketch.MidiSketch()
const config = midisketch.createDefaultConfig(0)

// Step 1: Generate vocal only
sketch.generateVocal(config)

// Preview and iterate until satisfied...
sketch.regenerateVocal({ seed: 12345, vocalAttitude: 2 })

// Step 2: Generate accompaniment for the vocal
sketch.generateAccompaniment()

const midiData = sketch.getMidi()
```

## Custom Vocal Import Workflow

Import your own melody and generate fitting accompaniment:

```javascript
const sketch = new midisketch.MidiSketch()
const config = midisketch.createDefaultConfig(0)

// Step 1: Set custom vocal notes
sketch.setVocalNotes(config, [
  { startTick: 0, duration: 480, pitch: 60, velocity: 100 },
  { startTick: 480, duration: 480, pitch: 62, velocity: 100 },
  { startTick: 960, duration: 960, pitch: 64, velocity: 100 },
])

// Step 2: Use Piano Roll Safety API to validate notes (optional)
const safety = sketch.getPianoRollSafetyAt(0)
console.log('Recommended notes at tick 0:', safety.recommended)

// Step 3: Generate accompaniment
sketch.generateAccompaniment()

const midiData = sketch.getMidi()
```

## Advanced Examples

### Energy Curve Control

```javascript
// FrontLoaded - high energy from the start
sketch.generateFromConfig({
  ...midisketch.createDefaultConfig(0),
  energyCurve: 1
})
```

### Melody Fine-Grained Control

```javascript
// Custom melody behavior: max 5 semitone leaps, 4-bar phrases, hook enabled
sketch.generateFromConfig({
  ...midisketch.createDefaultConfig(0),
  melodyMaxLeap: 5,
  melodyPhraseLength: 4,
  melodyHookRepetition: 2  // on
})
```

### Motif Fine-Grained Control

```javascript
// 4-beat motif with 5 notes, gentle leap motion
sketch.generateFromConfig({
  ...midisketch.createDefaultConfig(0),
  motifLength: 4,
  motifNoteCount: 5,
  motifMotion: 1  // GentleLeap
})
```

### Guitar Track

```javascript
sketch.generateFromConfig({
  ...midisketch.createDefaultConfig(0),
  guitarEnabled: true
})
```

### Syncopation + Groove

```javascript
sketch.generateFromConfig({
  ...midisketch.createDefaultConfig(0),
  enableSyncopation: true,
  vocalGroove: 3  // Syncopated
})
```

### Using SongConfigBuilder

```javascript
const builder = new midisketch.SongConfigBuilder(0)
  .setBpm(165)
  .setBlueprint(1)
  .setSeed(12345)

// Check for cascade changes
const changes = builder.getLastChangeResult()
if (changes) {
  for (const change of changes.changes) {
    console.log(`${change.field}: ${change.oldValue} → ${change.newValue}`)
  }
}

// Generate using the builder
sketch.generateFromBuilder(builder)
```

## SongConfigBuilder

The `SongConfigBuilder` provides a fluent API for building `SongConfig` with automatic cascade detection. When you change one parameter, related parameters may be auto-adjusted.

### Constructor

```javascript
const builder = new midisketch.SongConfigBuilder(styleId)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `styleId` | number | 0 | Style preset ID to create defaults from |

### Setter Methods

All setter methods return `this` for chaining:

| Method | Parameters | Description |
|--------|------------|-------------|
| `setSeed(seed)` | number | Set random seed (0=random) |
| `setKey(key)` | number | Set key (0-11, 0=C) |
| `setBpm(bpm)` | number | Set BPM (0=style default). Warns if outside 160-175 for RhythmSync blueprints |
| `setBlueprint(id)` | number | Set blueprint (0-9, 255=random). May cascade: drums, hookIntensity |
| `setStylePreset(id)` | number | Set style preset. Resets mood, chord, form, BPM to style defaults |
| `setVocalStyle(style)` | number | Set vocal style (0=Auto, 1-13). Idol styles auto-enable call |
| `setVocalAttitude(attitude)` | number | Set vocal attitude (0=Clean, 1=Expressive, 2=Raw) |
| `setVocalRange(low, high)` | number, number | Set vocal range (MIDI note bounds) |
| `setCompositionStyle(style)` | number | Set composition style (0-2). May cascade: skipVocal, arpeggioEnabled |
| `setModulation(timing, semitones?)` | number, number | Set modulation (timing 0-4, semitones 1-4) |
| `setChordExtensions(opts)` | object | Set chord extensions ({sus, seventh, ninth, susProb, seventhProb, ninthProb}) |
| `setArpeggio(enabled, opts?)` | boolean, object | Set arpeggio ({pattern, speed, octaveRange, gate, syncChord}) |
| `setMotif(opts)` | object | Set motif ({repeatScope, fixedProgression, maxChordCount}) |
| `setCall(opts)` | object | Set call/SE ({setting (0=Auto/1=Enabled/2=Disabled), enabled (legacy boolean), notesEnabled, density, introChant, mixPattern, seEnabled}) |
| `setMelodicComplexity(complexity)` | number | Set melodic complexity (0-2) |
| `setHookIntensity(intensity)` | number | Set hook intensity (0-3; 4=Maximum is normally set automatically by Behavioral Loop) |
| `setVocalGroove(groove)` | number | Set vocal groove feel (0-5) |
| `setMelodyTemplate(template)` | number | Set melody template (0-7) |
| `setArrangementGrowth(growth)` | number | Set arrangement growth (0-1) |
| `setTargetDuration(seconds)` | number | Set target duration (0=use formId) |
| `setSkipVocal(skip)` | boolean | Skip vocal generation |
| `setDriveFeel(feel)` | number | Set drive feel (0=laid-back, 50=neutral, 100=aggressive) |
| `setAddictiveMode(enabled)` | boolean | Enable Behavioral Loop mode |
| `setMoraRhythmMode(mode)` | number | Set mora rhythm mode (0=Standard, 1=MoraTimed, 2=Auto) |
| `setMood(mood)` | number | Set mood preset override (0-23, sets moodExplicit=true) |
| `setFormExplicit(explicit)` | boolean | Use formId exactly (no randomization) |
| `setHumanize(enabled, timing?, velocity?)` | boolean, number, number | Set humanization |
| `setDrums(enabled)` | boolean | Set drums enabled. Warns if disabling with drums-required blueprint |

### Query Methods

```javascript
// Build the final SongConfig
const config = builder.build()

// Get the result of the last setter call (cascade info)
const changes = builder.getLastChangeResult()
// Returns: ParameterChangeResult | null

// Get list of explicitly set field names
const explicit = builder.getExplicitFields()
// ['bpm', 'blueprintId', 'seed']

// Get list of auto-derived field names
const derived = builder.getDerivedFields()
// ['drumsEnabled', 'hookIntensity']
```

### Reset Methods

```javascript
// Reset all settings to defaults
builder.reset(styleId?)

// Reset to defaults but keep explicitly set values
builder.resetKeepExplicit(styleId?)
```

### Cascade Detection

Certain parameter changes trigger cascading updates to related parameters:

- **Blueprint change**: May auto-adjust `drumsEnabled` (blueprints 1, 5, 7 require drums), `hookIntensity` (BehavioralLoop forces Maximum)
- **Composition style change**: May auto-adjust `skipVocal`, `arpeggioEnabled` (SynthDriven enables arpeggio)
- **Vocal style change**: Idol-style presets (4=Idol, 9=BrightKira, 11=CuteAffected) auto-enable call if not explicitly set
- **BPM change**: Warns if BPM is outside 160-175 range for RhythmSync blueprints
- **Drums change**: Warns if disabling drums for a blueprint that requires them

```javascript
const builder = new midisketch.SongConfigBuilder(0)
  .setBlueprint(1)  // RhythmLock - requires drums

const changes = builder.getLastChangeResult()
if (changes) {
  for (const change of changes.changes) {
    console.log(`${change.field}: ${change.oldValue} → ${change.newValue} (${change.reason})`)
  }
  // e.g. "drumsEnabled: false → true (Blueprint RhythmLock requires drums)"
}
```

### ParameterChangeResult

```typescript
interface ParameterChangeResult {
  changedCount: number                // Number of fields that changed
  changedCategories: ParameterCategory[] // Categories of changes
  changes: ParameterChange[]          // Detailed list of changes
  warnings: string[]                  // Warning messages
}

interface ParameterChange {
  category: ParameterCategory         // Category (e.g. 'drums', 'hook', 'vocal')
  field: string                       // Field name that was changed
  oldValue: unknown                   // Previous value
  newValue: unknown                   // New value
  reason: string                      // Reason for the change
}
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
CompositionStyle.BackgroundMotif // 1 - Motif-driven BGM (vocal disabled, aux active)
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

### `VocalStylePreset`

```javascript
VocalStylePreset.Auto          // 0 - Auto-select based on style
VocalStylePreset.Standard      // 1 - Standard pop vocal
VocalStylePreset.Vocaloid      // 2 - Vocaloid-style (fast, wide leaps)
VocalStylePreset.UltraVocaloid // 3 - Ultra-fast vocaloid (32nd notes)
VocalStylePreset.Idol          // 4 - Idol-style (catchy, hook-heavy)
VocalStylePreset.Ballad        // 5 - Ballad (slow, long notes)
VocalStylePreset.Rock          // 6 - Rock (powerful, chorus register shift)
VocalStylePreset.CityPop       // 7 - City pop (jazzy, syncopated)
VocalStylePreset.Anime         // 8 - Anime-style (dynamic, expressive)
VocalStylePreset.BrightKira    // 9 - Bright/kira-kira (high, sparkling)
VocalStylePreset.CoolSynth     // 10 - Cool synth (electronic, precise)
VocalStylePreset.CuteAffected  // 11 - Cute/affected (playful)
VocalStylePreset.PowerfulShout // 12 - Powerful shout (intense)
VocalStylePreset.KPop          // 13 - K-Pop style
```

### `MelodyTemplate`

```javascript
MelodyTemplate.Auto         // 0 - Auto-select based on VocalStylePreset
MelodyTemplate.PlateauTalk  // 1 - High same-pitch ratio (NewJeans, Billie Eilish)
MelodyTemplate.RunUpTarget  // 2 - Ascending toward target (anime high-energy, dramatic pop)
MelodyTemplate.DownResolve  // 3 - Descending resolution (B-section)
MelodyTemplate.HookRepeat   // 4 - Short repeated hooks (TikTok, K-POP)
MelodyTemplate.SparseAnchor // 5 - Sparse anchor notes (Ballad)
MelodyTemplate.CallResponse // 6 - Duet-style call and response
MelodyTemplate.JumpAccent   // 7 - Emotional peak jumps
```

### `MelodicComplexity`

```javascript
MelodicComplexity.Simple   // 0 - Simple melodies with minimal intervals
MelodicComplexity.Standard // 1 - Standard melodic complexity
MelodicComplexity.Complex  // 2 - Complex with larger intervals and more variation
```

### `HookIntensity`

```javascript
HookIntensity.Off     // 0 - No hook repetition
HookIntensity.Light   // 1 - Light hook presence
HookIntensity.Normal  // 2 - Normal hook repetition (default)
HookIntensity.Strong  // 3 - Strong, catchy hook emphasis
HookIntensity.Maximum // 4 - Maximum repetition (used by Behavioral Loop / addictiveMode)
```

### `VocalGrooveFeel`

```javascript
VocalGrooveFeel.Straight   // 0 - Straight rhythm (default)
VocalGrooveFeel.OffBeat    // 1 - Off-beat emphasis
VocalGrooveFeel.Swing      // 2 - Swing feel
VocalGrooveFeel.Syncopated // 3 - Syncopated rhythm
VocalGrooveFeel.Driving16th // 4 - Driving 16th note feel
VocalGrooveFeel.Bouncy8th  // 5 - Bouncy 8th note feel
```

### `ArpeggioPattern`

```javascript
ArpeggioPattern.Up          // 0 - Ascending arpeggio
ArpeggioPattern.Down        // 1 - Descending arpeggio
ArpeggioPattern.UpDown      // 2 - Ascending then descending
ArpeggioPattern.Random      // 3 - Random order
ArpeggioPattern.Pinwheel    // 4 - Pinwheel pattern
ArpeggioPattern.PedalRoot   // 5 - Pedal root pattern
ArpeggioPattern.Alberti     // 6 - Alberti bass pattern
ArpeggioPattern.BrokenChord // 7 - Broken chord pattern
```

### `EnergyCurve`

```javascript
EnergyCurve.GradualBuild // 0 - Gradually increasing energy
EnergyCurve.FrontLoaded  // 1 - High energy from the start
EnergyCurve.WavePattern  // 2 - Alternating energy levels
EnergyCurve.SteadyState  // 3 - Consistent energy throughout
```

### `MoraRhythmMode`

```javascript
MoraRhythmMode.Standard  // 0 - Standard rhythm timing
MoraRhythmMode.MoraTimed // 1 - Mora-based timing (Japanese syllable rhythm)
MoraRhythmMode.Auto      // 2 - Automatic selection (default)
```

### `DriveFeel`

Continuous value from 0 to 100 controlling the rhythmic intensity:

| Value | Feel |
|-------|------|
| 0 | Laid-back |
| 50 | Neutral (default) |
| 100 | Aggressive |

### `GenerationParadigm`

```javascript
GenerationParadigm.Traditional  // 0 - Classic generation (Vocal→Aux→Motif→Bass→Chord→Guitar→Arpeggio→Drums→SE)
GenerationParadigm.RhythmSync   // 1 - Rhythm-synced (Motif→Vocal→Aux→Bass→Chord→Guitar→Arpeggio→Drums→SE)
GenerationParadigm.MelodyDriven // 2 - Melody-centered (Vocal→Aux→Motif→Bass→Chord→Guitar→Arpeggio→Drums→SE)
```

### `RiffPolicy`

```javascript
RiffPolicy.Free          // 0 - Each section varies independently
RiffPolicy.LockedContour // 1 - Pitch contour fixed, expression variable
RiffPolicy.LockedPitch   // 2 - Pitch completely fixed, velocity variable
RiffPolicy.LockedAll     // 3 - Completely fixed (monotonous, not recommended)
RiffPolicy.Evolving      // 4 - 30% chance of change every 2 sections
RiffPolicy.Locked        // Alias for LockedContour (1)
```

### `ConfigError`

Validation error codes returned by `validateConfig()` (and carried by `MidiSketchConfigError`):

```javascript
ConfigError.OK                      // 0
ConfigError.InvalidStyle            // 1
ConfigError.InvalidChord            // 2
ConfigError.InvalidForm             // 3
ConfigError.InvalidAttitude         // 4
ConfigError.InvalidVocalRange       // 5
ConfigError.InvalidBpm              // 6
ConfigError.DurationTooShort        // 7
ConfigError.InvalidModulation       // 8
ConfigError.InvalidKey              // 9
ConfigError.InvalidCompositionStyle // 10
ConfigError.InvalidArpeggioPattern  // 11
ConfigError.InvalidArpeggioSpeed    // 12
ConfigError.InvalidVocalStyle       // 13
ConfigError.InvalidMelodyTemplate   // 14
ConfigError.InvalidMelodicComplexity // 15
ConfigError.InvalidHookIntensity    // 16
ConfigError.InvalidVocalGroove      // 17
ConfigError.InvalidCallDensity      // 18
ConfigError.InvalidIntroChant       // 19
ConfigError.InvalidMixPattern       // 20
ConfigError.InvalidMotifRepeatScope // 21
ConfigError.InvalidArrangementGrowth // 22
ConfigError.InvalidModulationTiming // 23
ConfigError.InvalidBlueprint        // 24
ConfigError.InvalidCallSetting      // 25
ConfigError.InvalidEnergyCurve      // 26
ConfigError.InvalidDriveFeel        // 27
ConfigError.InvalidMoraRhythmMode   // 28
ConfigError.InvalidProbability      // 29
ConfigError.InvalidArpeggioRange    // 30
ConfigError.InvalidMelodyOverride   // 31
ConfigError.InvalidMotifOverride    // 32
```

### `NoteSafety`

```javascript
NoteSafety.Safe      // 0 - Green: chord tone, safe to use
NoteSafety.Warning   // 1 - Yellow: tension, low register, or passing tone
NoteSafety.Dissonant // 2 - Red: dissonant or out of range
```

### `NoteReason`

Reason flags for note safety (bitfield, can be combined):

```javascript
NoteReason.None         // 0
// Positive reasons (green)
NoteReason.ChordTone    // 1 - Chord tone (root, 3rd, 5th, 7th)
NoteReason.Tension      // 2 - Tension (9th, 11th, 13th)
NoteReason.ScaleTone    // 4 - Scale tone (not chord but in scale)
// Warning reasons (yellow)
NoteReason.LowRegister  // 8 - Low register (below C4), may sound muddy
NoteReason.Tritone      // 16 - Tritone interval (unstable except on V7)
NoteReason.LargeLeap    // 32 - Large leap (9+ semitones from prev note)
// Dissonant reasons (red)
NoteReason.Minor2nd     // 64 - Minor 2nd (1 semitone) collision
NoteReason.Major7th     // 128 - Major 7th (11 semitones) collision
NoteReason.NonScale     // 256 - Non-scale tone (chromatic)
NoteReason.PassingTone  // 512 - Can be used as passing tone
// Out of range reasons (red)
NoteReason.OutOfRange   // 1024 - Outside vocal range
NoteReason.TooHigh      // 2048 - Too high to sing
NoteReason.TooLow       // 4096 - Too low to sing
```

## Types

### `VocalConfig`

Configuration for vocal regeneration:

```typescript
interface VocalConfig {
  seed?: number              // Random seed (0 = new random)
  vocalLow?: number          // Vocal range lower bound (MIDI note, 36-96)
  vocalHigh?: number         // Vocal range upper bound (MIDI note, 36-96)
  vocalAttitude?: number     // 0=Clean, 1=Expressive, 2=Raw
  vocalStyle?: number        // Vocal style preset (0=Auto)
  melodyTemplate?: number    // Melody template (0=Auto)
  melodicComplexity?: number // 0=Simple, 1=Standard, 2=Complex
  hookIntensity?: number     // 0=Off, 1=Light, 2=Normal, 3=Strong
  vocalGroove?: number       // 0=Straight, 1=OffBeat, etc.
  compositionStyle?: number  // 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven
  keepMotif?: boolean        // RhythmSync only: keep existing Motif as the rhythmic axis (default: false)
}
```

### `AccompanimentConfig`

Configuration for accompaniment generation/regeneration:

```typescript
interface AccompanimentConfig {
  seed?: number               // Random seed (0 = auto)
  // Drums
  drumsEnabled?: boolean
  // Guitar
  guitarEnabled?: boolean     // Enable guitar track
  // Arpeggio
  arpeggioEnabled?: boolean
  arpeggioPattern?: number    // 0=Up, 1=Down, 2=UpDown, 3=Random, 4=Pinwheel, 5=PedalRoot, 6=Alberti, 7=BrokenChord
  arpeggioSpeed?: number      // 0=Eighth, 1=Sixteenth, 2=Triplet
  arpeggioOctaveRange?: number // 1-3
  arpeggioGate?: number       // 0-100
  arpeggioSyncChord?: boolean
  // Chord Extensions
  chordExtSus?: boolean
  chordExt7th?: boolean
  chordExt9th?: boolean
  chordExtSusProb?: number    // 0-100
  chordExt7thProb?: number    // 0-100
  chordExt9thProb?: number    // 0-100
  chordExtTritoneSub?: boolean   // Enable tritone substitution (V7 → bII7)
  chordExtTritoneSubProb?: number // Tritone substitution probability (0-100)
  // Humanization
  humanize?: boolean
  humanizeTiming?: number     // 0-100
  humanizeVelocity?: number   // 0-100
  // SE/Call
  seEnabled?: boolean
  callEnabled?: boolean       // Plain boolean here (callSetting exists only on SongConfig)
  callDensity?: number        // 0=None, 1=Minimal, 2=Standard, 3=Intense
  introChant?: number         // 0=None, 1=Gachikoi, 2=Shouting
  mixPattern?: number         // 0=None, 1=Standard, 2=Tiger
  callNotesEnabled?: boolean
}
```

::: warning AccompanimentConfig Uses 0-100 Ranges
Unlike `SongConfig` (which uses normalized `0.0-1.0` values), `AccompanimentConfig` keeps integer `0-100` ranges for `arpeggioGate` (default 80), `chordExtSusProb` (20), `chordExt7thProb` (30), `chordExt9thProb` (25), `chordExtTritoneSubProb` (50), `humanizeTiming` (50), and `humanizeVelocity` (50). Also note `guitarEnabled` defaults to `true` when omitted.
:::

### `NoteInput`

Note input for custom vocal track:

```typescript
interface NoteInput {
  startTick: number  // Note start time in ticks
  duration: number   // Note duration in ticks
  pitch: number      // MIDI note number (0-127)
  velocity: number   // Note velocity (0-127)
}
```

::: details Understanding Ticks
MIDI Sketch uses **ticks** as the time unit (480 ticks per quarter note):
- **Quarter note**: 480 ticks
- **Eighth note**: 240 ticks
- **Sixteenth note**: 120 ticks
- **Whole note**: 1920 ticks
- **One bar (4/4)**: 1920 ticks

Example: A note at beat 2 (tick 480) lasting one beat:
```javascript
{ startTick: 480, duration: 480, pitch: 60, velocity: 100 }
```
:::

### `PianoRollInfo`

Piano roll safety info for a single tick:

```typescript
interface PianoRollInfo {
  tick: number                // Tick position
  chordDegree: number         // Current chord degree (0=I, 1=ii, etc.)
  currentKey: number          // Current key (0-11, considering modulation)
  safety: NoteSafetyLevel[]   // Safety level for each MIDI note (0-127)
  reason: NoteReasonFlags[]   // Reason flags for each note (0-127)
  collision: CollisionInfo[]  // Collision details for each note
  recommended: number[]       // Recommended notes (priority order, max 8)
}
```

### `CollisionInfo`

Collision info for a note that collides with BGM:

```typescript
interface CollisionInfo {
  trackRole: number         // Track role of colliding track
  collidingPitch: number    // MIDI pitch of colliding note
  intervalSemitones: number // Collision interval in semitones (1, 6, or 11)
}
```

### `ChordEvent`

Chord event from generation timeline (includes secondary dominant info):

```typescript
interface ChordEvent {
  tick: number              // Start tick
  endTick: number           // End tick
  degree: number            // Scale degree (0-6)
  isSecondaryDominant: boolean // Whether this is a secondary dominant (V/x)
}
```

### `EventData`

Event data from generation:

```typescript
interface EventData {
  bpm: number
  division: number
  duration_ticks: number
  duration_seconds: number
  tracks: Array<{
    name: string
    channel: number
    program: number
    notes: Array<{
      pitch: number
      velocity: number
      start_ticks: number
      duration_ticks: number
      start_seconds: number
      duration_seconds: number
    }>
  }>
  sections: Array<{
    name: string
    type: string
    startTick: number
    endTick: number
    start_bar: number
    bars: number
    start_seconds: number
    end_seconds: number
  }>
  chords?: ChordEvent[]    // Chord timeline with secondary dominant info
}
```

### `BlueprintInfo`

Information about a production blueprint:

```typescript
interface BlueprintInfo {
  id: number                // Blueprint ID (0-9)
  name: string              // Blueprint name
  paradigm: number          // Generation paradigm (0-2)
  riffPolicy: number        // Riff policy (0-4)
  weight: number            // Selection weight percentage
}
```
