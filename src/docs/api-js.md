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
// 9
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

  // Vocal style settings
  vocalStyle: 0,              // Vocal style preset (0=Auto, 1-12=specific presets)
  melodyTemplate: 0,          // Melody template (0=Auto, 1-7=specific templates)
  melodicComplexity: 1,       // Melody complexity (0=Simple, 1=Standard, 2=Complex)
  hookIntensity: 2,           // Hook intensity (0=Off, 1=Light, 2=Normal, 3=Strong)
  vocalGroove: 0,             // Groove feel (0=Straight, 1=OffBeat, 2=Swing, 3=Syncopated, 4=Driving16th, 5=Bouncy8th)

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

  // Blueprint settings
  blueprintId: 0,             // Production blueprint (0=Traditional, 1-8=specific, 255=auto)
})
```

::: info Parameter Dependencies
Many parameters depend on parent options being enabled. For example, `arpeggioPattern` has no effect if `arpeggioEnabled=false`. See [Option Relationships](/docs/option-relationships) for the full dependency tree.
:::

### `regenerateVocal(params)`

Regenerate only the vocal track (and Aux track). BGM tracks (chord, bass, drums, arpeggio) remain unchanged.
Use after `generateFromConfig()` with `skipVocal: true` for BGM-first workflow.

```javascript
sketch.regenerateVocal({
  seed: 0,                     // Random seed (0=new random)
  vocalLow: 55,                // Vocal range lower bound (MIDI note)
  vocalHigh: 74,               // Vocal range upper bound (MIDI note)
  vocalAttitude: 1,            // 0=Clean, 1=Expressive, 2=Raw

  // Optional: Fine-tune vocal generation
  vocalStyle: 0,               // Vocal style preset (0=Auto, 1-12=specific presets)
  melodyTemplate: 0,           // Melody template (0=Auto, 1-7=specific templates)
  melodicComplexity: 1,        // Melody complexity (0=Simple, 1=Standard, 2=Complex)
  hookIntensity: 2,            // Hook intensity (0=Off, 1=Light, 2=Normal, 3=Strong)
  vocalGroove: 0,              // Groove feel (0=Straight, 1=OffBeat, 2=Swing, etc.)
  compositionStyle: 0,         // Composition style (0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven)
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
  vocalLow: 55,
  vocalHigh: 74,
  vocalAttitude: 1,
  // ... other SongConfig options
})
```

### `generateAccompaniment(config?)`

Generate accompaniment tracks for existing vocal. Must be called after `generateVocal()` or `setVocalNotes()`. Generates: Aux → Bass → Chord → Drums (adapting to vocal).

```javascript
// Simple: use default settings
sketch.generateAccompaniment()

// With configuration
sketch.generateAccompaniment({
  seed: 12345,                // Random seed (0 = auto)
  drumsEnabled: true,
  arpeggioEnabled: false,
  arpeggioPattern: 0,         // 0=Up, 1=Down, 2=UpDown, 3=Random
  arpeggioSpeed: 1,           // 0=Eighth, 1=Sixteenth, 2=Triplet
  arpeggioOctaveRange: 2,
  arpeggioGate: 80,
  arpeggioSyncChord: true,
  chordExtSus: false,
  chordExt7th: false,
  chordExt9th: false,
  humanize: true,
  humanizeTiming: 50,
  humanizeVelocity: 50,
  seEnabled: false,
  callEnabled: false,
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

Generate all tracks with vocal-first priority. Generation order: Vocal → Aux → Bass → Chord → Drums. Accompaniment adapts to vocal melody.

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

### `getResolvedBlueprintId()`

Returns the actually used blueprint ID after generation. When `blueprintId=255` (auto), this returns the randomly selected blueprint.

```javascript
sketch.generateFromConfig({ blueprintId: 255 })  // Auto-select
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
  vocalLow: 55,
  vocalHigh: 74,
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
```

### `MelodyTemplate`

```javascript
MelodyTemplate.Auto         // 0 - Auto-select based on VocalStylePreset
MelodyTemplate.PlateauTalk  // 1 - High same-pitch ratio (NewJeans, Billie Eilish)
MelodyTemplate.RunUpTarget  // 2 - Ascending toward target (YOASOBI, Ado)
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
HookIntensity.Off    // 0 - No hook repetition
HookIntensity.Light  // 1 - Light hook presence
HookIntensity.Normal // 2 - Normal hook repetition (default)
HookIntensity.Strong // 3 - Strong, catchy hook emphasis
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

### `GenerationParadigm`

```javascript
GenerationParadigm.Traditional  // 0 - Classic generation (Bass→Chord→Vocal)
GenerationParadigm.RhythmSync   // 1 - Drums & bass sync with melody
GenerationParadigm.MelodyDriven // 2 - Melody-centered arrangement
```

### `RiffPolicy`

```javascript
RiffPolicy.Free          // 0 - Each section varies independently
RiffPolicy.LockedContour // 1 - Contour locked, rhythm varies
RiffPolicy.LockedPitch   // 2 - Pitch locked, contour varies
RiffPolicy.LockedAll     // 3 - All aspects locked
RiffPolicy.Evolving      // 4 - Gradual changes (30% every 2 sections)
RiffPolicy.Locked        // Alias for LockedContour (1)
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
NoteReason.LargeLeap    // 32 - Large leap (6+ semitones from prev note)
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
}
```

### `AccompanimentConfig`

Configuration for accompaniment generation/regeneration:

```typescript
interface AccompanimentConfig {
  seed?: number               // Random seed (0 = auto)
  // Drums
  drumsEnabled?: boolean
  // Arpeggio
  arpeggioEnabled?: boolean
  arpeggioPattern?: number    // 0=Up, 1=Down, 2=UpDown, 3=Random
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
  // Humanization
  humanize?: boolean
  humanizeTiming?: number     // 0-100
  humanizeVelocity?: number   // 0-100
  // SE/Call
  seEnabled?: boolean
  callEnabled?: boolean
  callDensity?: number        // 0=None, 1=Minimal, 2=Standard, 3=Intense
  introChant?: number         // 0=None, 1=Gachikoi, 2=Shouting
  mixPattern?: number         // 0=None, 1=Standard, 2=Tiger
  callNotesEnabled?: boolean
}
```

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

### `BlueprintInfo`

Information about a production blueprint:

```typescript
interface BlueprintInfo {
  id: number                // Blueprint ID (0-8)
  name: string              // Blueprint name
  paradigm: number          // Generation paradigm (0-2)
  riffPolicy: number        // Riff policy (0-2)
  weight: number            // Selection weight percentage
}
```
