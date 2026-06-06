# Chapter 7 — Mapping Concepts to Config

Every concept in this course is a dial on a single struct. This capstone chapter consolidates the whole course into lookup tables: concept on the left, `SongConfig` field on the right. By the end you will be able to translate any musical intent into a config object and reproduce the result byte-for-byte.

## One idea, many configs

The central claim of the course is that a song idea is independent of the parameters that render it. Melody shape, chord progression, and key are orthogonal dials — change one and the others survive. The score below renders the same hook over a `I–V` move first in C, then transposed to D: the idea is identical, only `key` changed.

<ScoreExample example="configKeyTranspose" locale="en" />

::: info Blueprint
A **blueprint** is a high-level recipe that bundles a generation strategy with sensible defaults — paradigm, drum policy, hook behaviour, and arrangement weights. Selecting `blueprintId` is the fastest way to get a coherent song; you then override individual fields. MidiSketch ships 10 blueprints (`blueprintId` 0–9), or `255` to pick one at random by weight.
:::

::: info Generation paradigm
A **paradigm** is the axis the engine builds a song around. **Traditional** generates the vocal first; **RhythmSync** builds from a rhythmic motif first; **MelodyDriven** centres everything on the melody. Each blueprint commits to one paradigm, which decides which track leads and which follow.
:::

::: info Seed
A **seed** is the integer that initialises the random generator. The same config plus the same `seed` reproduces the same song, bit-for-bit — the engine is deterministic. Use `seed: 0` for a fresh random song each run, or any non-zero value to lock a result you want to keep.
:::

::: info Humanize
**Humanize** adds small, controlled deviations to timing and velocity so the output sounds played rather than quantized. `humanizeTiming` (default `0.4`) nudges note onsets; `humanizeVelocity` (default `0.3`) varies loudness. Both are `0.0`–`1.0`; higher is looser, `0.0` is mechanically exact.
:::

## Mapping by chapter

The tables below mirror the course chapter by chapter. Treat them as the reference you return to after you have read the prose once.

### Chapter 0 — Primer (pitch, time, tempo)

| Concept | Config field | Range / notes |
| --- | --- | --- |
| Tonic pitch class | `key` | `0`–`11` (`0` = C, `7` = G) |
| Playback tempo | `bpm` | `40`–`240`; `0` = style default |
| Lowest melody note | `vocalLow` | MIDI number, default `60` (C4) |
| Highest melody note | `vocalHigh` | MIDI number, default `79` (G5) |

### Chapter 1 — Scales & Keys

| Concept | Config field | Range / notes |
| --- | --- | --- |
| Key / tonic | `key` | `0`–`11` |
| Overall mood (selects scale colour) | `mood` | `0`–`23`; needs `moodExplicit: true` to apply exactly |

### Chapter 2 — Chords & Triads

| Concept | Config field | Range / notes |
| --- | --- | --- |
| Broken-chord texture | `arpeggioEnabled` / `arpeggioPattern` | bool; pattern `0`–`7` (Up … BrokenChord) |
| Style preset (bundles chord & melody defaults) | `stylePresetId` | `0`–`16` (e.g. 3 = Idol Standard, 12 = Background Motif, 14 = Anime Opening) |

### Chapter 3 — Chord Progressions

| Concept | Config field | Range / notes |
| --- | --- | --- |
| Chord progression preset | `chordProgressionId` | `0`–`21` (22 progressions) |

### Chapter 4 — Harmony & Color

| Concept | Config field | Range / notes |
| --- | --- | --- |
| Sus chords | `chordExtSus` / `chordExtSusProb` | flag + probability `0.0`–`1.0` (default `0.2`) |
| 7th chords | `chordExt7th` / `chordExt7thProb` | flag + probability `0.0`–`1.0` (default `0.15`) |
| 9th chords | `chordExt9th` / `chordExt9thProb` | flag + probability `0.0`–`1.0` (default `0.25`) |
| Tritone substitution | `chordExtTritoneSub` / `chordExtTritoneSubProb` | flag + probability `0.0`–`1.0` (default `0.5`) |

### Chapter 5 — Melody, Motifs & Hooks

| Concept | Config field | Range / notes |
| --- | --- | --- |
| Hook intensity | `hookIntensity` | `0`–`4` (`4` = Maximum, set via BehavioralLoop) |
| Vocal delivery style | `vocalStyle` | `0`–`13` (`0` = Auto, `13` = KPop) |
| Melody template | `melodyTemplate` | `0` = Auto, `1`–`7` |
| Call & response | `callSetting` | `0` = Auto, `1` = Enabled, `2` = Disabled |

### Chapter 6 — Song Structure

| Concept | Config field | Range / notes |
| --- | --- | --- |
| Song form preset | `formId` | `0`–`17` |
| Honour the form exactly | `formExplicit` | `true` / `false` |
| Target length (auto-build) | `targetDurationSeconds` | seconds; `0` = use `formId` |

## Blueprints at a glance

Picking a `blueprintId` sets the paradigm, drum policy, and arrangement weights in one move. The weight column is the selection probability when `blueprintId: 255` (random); `9` has weight 0, meaning it is reachable only by asking for it explicitly.

| ID | Blueprint | Paradigm | Drums required | Weight |
| --- | --- | --- | --- | --- |
| 0 | Traditional | Traditional | no | 42% |
| 1 | RhythmLock | RhythmSync | yes | 14% |
| 2 | StoryPop | MelodyDriven | no | 10% |
| 3 | Ballad | MelodyDriven | no | 4% |
| 4 | IdolStandard | MelodyDriven | no | 10% |
| 5 | IdolHyper | RhythmSync | yes | 6% |
| 6 | IdolKawaii | MelodyDriven | no | 5% |
| 7 | IdolCoolPop | RhythmSync | yes | 5% |
| 8 | IdolEmo | MelodyDriven | no | 4% |
| 9 | BehavioralLoop | Traditional | no | 0% (explicit only) |

Drums-required blueprints (`1`, `5`, `7`) force a drum track; query this at runtime with `getBlueprintDrumsRequired(id)`. BehavioralLoop (`9`) forces addictive mode, sets `hookIntensity` to Maximum, and locks the riff.

## A minimal recipe

Putting the dials together, a complete, reproducible song is a few lines:

```javascript
const config = createDefaultConfig(0)
config.key = 7                 // G major (ch1)
config.chordProgressionId = 0  // preset progression (ch3)
config.chordExt7th = true      // mellow color (ch4)
config.hookIntensity = 3       // strong hook (ch5)
config.seed = 42               // reproducible
sketch.generateFromConfig(config)
```

Call `validateConfig(config)` first to check every field is in range before generating — it returns an error code if any value is out of bounds, which saves you debugging a rejected generation.

Across all nine generated tracks (Vocal ch0, Chord ch1, Bass ch2, Motif ch3, Arpeggio ch4, Aux ch5, Guitar ch6, Drums ch9, SE ch15), the guitar track is on by default (`guitarEnabled: true`).

## MidiSketch mapping

| Concept | Config field | Range / notes |
| --- | --- | --- |
| Generation recipe | `blueprintId` | `0`–`9`, or `255` = random by weight |
| Reproducibility | `seed` | integer; `0` = random, non-zero = locked |
| Timing looseness | `humanizeTiming` | `0.0`–`1.0` (default `0.4`) |
| Velocity looseness | `humanizeVelocity` | `0.0`–`1.0` (default `0.3`) |
| Pre-flight check | `validateConfig(config)` | returns an error code if a field is out of range |

For the full field list and runtime behaviour, see [Option relationships](/docs/option-relationships) and the [Presets reference](/docs/presets).

Put it into practice with [Getting Started](/docs/getting-started) and the [JavaScript API](/docs/api-js), or look up any term in the [Glossary](/docs/course/glossary).
