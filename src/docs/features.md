# Features

MIDI Sketch is a music theory-based MIDI generator that creates complete pop music arrangements.

::: tip New to music theory?
This page describes features in musical terms — keys, progressions, hooks, song forms. If any are unfamiliar, the [Course](/docs/course/primer) teaches the basics behind every feature with playable examples.
:::

## MIDI Output, Not Audio

Unlike AI audio generators (Suno, Udio, etc.), MIDI Sketch outputs **editable MIDI data**.

| | AI Audio Generators | MIDI Sketch |
|---|---|---|
| Output | Finished audio (MP3/WAV) | MIDI files |
| Editing | Limited or none | Full control in DAW |
| Sounds | Fixed | Your choice |
| Mixing | Baked in | You decide |
| Reproducibility | Often inconsistent | Deterministic (seed-based) |

::: tip What You Get
- 9 separate tracks (vocal, aux, chord, bass, motif, guitar, arpeggio, drums, SE)
- Each track on its own MIDI channel
- Import directly into any DAW
- Use your own instruments and effects
:::

## Music Theory Foundation

MIDI Sketch doesn't use machine learning or neural networks. It implements classical harmony principles combined with modern pop music analysis.

### Melody Generation

::: details Template-Driven Architecture
7 melody templates model specific vocal styles:
- **PlateauTalk**: NewJeans/Billie Eilish style - high plateau with talk-sing
- **RunUpTarget**: Anime high-energy/dramatic pop style - ascending runs to target notes
- **HookRepeat**: TikTok/K-POP style - short repeating hooks
- **SparseAnchor**: Official髭男dism style - sparse anchor notes
- And more (DownResolve, CallResponse, JumpAccent)
:::

::: details Singability Constraints
- **Direction inertia**: Accumulated momentum tracking prevents erratic direction changes
- **Tessitura enforcement**: Real-time pitch adjustments for comfortable singing range
- **Leap compensation**: Automatic stabilization steps after large intervals
- **Vowel constraints**: Pitch movement limited within vowel sections for natural phrasing
:::

### Voice Leading & Chord Voicing

::: details Three Voicing Types
- **Close voicing**: Notes within one octave (warm, suitable for verses)
- **Open voicing**: Drop2, Drop3, Spread variations (powerful, for choruses)
- **Rootless voicing**: Root omitted when bass provides it (jazz-influenced)
:::

::: details Voice Leading Optimization
- Weighted distance calculation (bass and soprano get 2x priority)
- Common tone maximization between successive chords
- Parallel 5ths/octaves detection with context-aware enforcement
- Avoid-note detection, measured from the chord root and gated by harmonic function: the perfect 4th over a major tonic, the minor 6th over a minor chord, and the minor 2nd and major 7th generally. The tritone is an avoid note over tonic and subdominant chords but is required over a dominant, where it is the chord's resolving core.
:::

### Non-Chord Tone (NCT) Decoration

Based on Kostka & Payne's *Tonal Harmony* framework:

::: info Strong Beats and Weak Beats
In 4/4 time, beats 1 and 3 are **strong**, beats 2 and 4 are **medium**, offbeat eighth-note subdivisions are **weak**, and other sixteenth-note subdivisions are **very weak**. Melodies typically place chord tones on strong beats for harmonic clarity.
:::

::: details NCT Types
| Type | Placement | Description |
|------|-----------|-------------|
| Passing Tone | Non-strong beat | Stepwise connection between chord tones |
| Neighbor Tone | Non-strong beat | Step away from chord tone and return |
| Appoggiatura | Strong beat | Accented dissonance resolving by step |
| Anticipation | Before beat | Early arrival of next chord tone |
| Suspension | Chord change | A tone held over from the previous chord, resolving down by step |
| Tension | Context-dependent | 9th, 11th, 13th extensions |
:::

::: details Mood-Dependent Configuration
- **Bright/Upbeat, Idol, Anthem**: 71% chord tones, pentatonic focus
- **Energetic/Dance, Light Rock, Future Bass**: 77% chord tones, rhythm-led
- **Chill, Synthwave**: 66% chord tones
- **Dark/Dramatic, Nostalgic**: 57% chord tones, chromatic approach notes enabled
- **Ballad, Sentimental, Emotional Pop**: 52% chord tones, expressive appoggiaturas, tensions enabled
- **CityPop**: 48% chord tones, jazz tensions and chromatic approach enabled
:::

### Harmony Context & Collision Avoidance

::: details Multi-Track Coordination
- **Track collision detection**: Registers all notes from Vocal, Chord, Bass, Motif, Aux, Guitar, and Arpeggio tracks
- **Low-register guard**: When both pitches are below C4, short passing-tone tolerance is disabled to prevent muddiness; this is not a general 3-semitone threshold
- **Safe pitch resolution**: Multi-strategy fallback (chord tones → consonant intervals → range search)
:::

### Emotion Curve System

::: details Song Emotional Arc
The Emotion Curve system plans the emotional journey of a song, assigning specific characteristics to each section:
- **Intro**: Anticipation (low tension, building energy)
- **Verse (A)**: Expectation (moderate tension)
- **Pre-chorus (B)**: Tension build (high tension, upward pitch tendency)
- **Chorus**: Release/resolution (peak energy, maximum density)
- **Bridge**: Reflection (lower energy, contrast)
- **Outro**: Closure (decreasing tension)

Each section receives emotion parameters (tension, energy, resolution need, pitch tendency, density) that guide generation across all tracks.
:::

### Euclidean Rhythms

::: details Mathematical Rhythm Patterns
Drum patterns use Bjorklund's algorithm to distribute hits evenly across steps, creating natural-sounding rhythms found in many musical traditions:

| Pattern | Hits/Steps | Traditional Name |
|---------|-----------|------------------|
| E(3,8) | [x..x..x.] | Cuban tresillo |
| E(5,8) | [x.xx.xx.] | Cuban cinquillo |
| E(5,16) | Bossa nova feel | - |
| E(4,16) | Four-on-the-floor | - |

These mathematically-spaced patterns feel more natural than probability-based random placement.
:::

### Secondary Dominants

::: details Harmonic Enrichment
Secondary dominants (V/V, V/vi, etc.) are automatically inserted to create stronger harmonic pull toward target chords. This enriches chord progressions without requiring manual configuration.
:::

### Guitar Track

::: details Accompaniment Guitar Generation
A dedicated guitar track generates accompaniment patterns influenced by Blueprint constraints such as guitar skill level and guitar-below-vocal positioning. Guitar appears on its own MIDI channel and can be enabled or disabled independently.
:::

### Energy Curve

::: details Song Energy Progression
The Energy Curve system controls how energy progresses through the song, providing high-level control over dynamics beyond per-section settings:
- **GradualBuild**: Energy increases steadily from start to finish
- **FrontLoaded**: High energy at the start, tapering toward the end
- **WavePattern**: Alternating high and low energy across sections
- **SteadyState**: Consistent energy level throughout
:::

### Melody & Motif Overrides

::: details Fine-Grained Parameter Control
**Melody Override** allows fine-grained control over melody generation parameters:
- Max leap, syncopation probability, phrase length
- Long note ratio, chorus register shift
- Hook repetition, leading tone behavior

**Motif Override** allows fine-grained control over motif generation parameters:
- Motif length, note count, motion (0-5)
- Register (high/mid), rhythm density
:::

### Expanded Arpeggio Patterns

::: details 8 Arpeggio Patterns
Alongside the basic Up, Down, UpDown and Random patterns:
- **Pinwheel**: Alternating direction pattern
- **PedalRoot**: Returns to root between each note
- **Alberti**: Classical broken chord pattern (low-high-mid-high)
- **BrokenChord**: Root-3rd-5th-octave up, then back down through the 5th and 3rd
:::

### Performance Controls

::: details DriveFeel, Syncopation & Mora Rhythm
- **DriveFeel**: Controls performance intensity from laid-back (0) to aggressive (100), affecting timing tightness and velocity emphasis
- **Syncopation**: `enableSyncopation` toggle adds groove effects by shifting notes off the grid
- **MoraRhythmMode**: Support for Japanese mora-timed rhythm, aligning note durations to syllable timing patterns
- **SyllabicSubRate**: `0` keeps the style default; `1`-`100` overrides the syllabic subdivision ratio as a percentage
:::

### Piano Roll Safety API

::: details Note Safety Analysis
The Piano Roll Safety API analyzes pitch safety at any point in the generated song. For each MIDI pitch (0-127), it reports:
- **Safety level**: Safe (chord tone), Warning (tension/low register/passing tone), or Dissonant (non-scale/collision)
- **Reason flags**: Detailed bit flags indicating why a pitch is rated at its level (e.g., ChordTone, Tension, LargeLeap, Minor2nd collision)
- **Collision detection**: Identifies which tracks would collide with a given pitch
- **Recommended pitches**: Up to 8 suggested pitches for the current harmonic context

Use after any generation call (`generateVocal`, `generateFromConfig`, etc.) for real-time pitch guidance in piano roll editors.
:::

### Custom Vocal API

::: details User-Defined Melody Input
The `setVocalNotes` API allows injecting a custom melody (as an array of note events) instead of using the built-in melody generator. The accompaniment is then generated around the user-provided vocal, with full harmony context coordination including chord recognition, collision avoidance, and Aux track generation.
:::

### Chord Timeline API

::: details Harmonic Context Retrieval
The `getChordTimeline` API returns the chord progression timeline for the generated song, including tick positions, chord degrees, and secondary dominant information. This is used for playback synchronization and harmonic analysis.
:::

### SongConfigBuilder

::: details Fluent Configuration API
The `SongConfigBuilder` provides a fluent API for constructing song configurations with cascade change detection. When a parameter changes, dependent parameters are automatically recalculated, ensuring consistent configurations without manual coordination.
:::

::: info Academic Foundation
The implementation references:
- [Kostka & Payne: *Tonal Harmony*](https://www.mheducation.com/highered/product/tonal-harmony-kostka.html) - NCT classification and voice leading
- [Huron: *Sweet Anticipation*](https://mitpress.mit.edu/9780262582780/sweet-anticipation/) - Psychology of musical expectation
- [de Clercq & Temperley: *A Corpus Analysis of Rock Harmony*](http://davidtemperley.com/wp-content/uploads/2015/11/declercq-temperley-pm11.pdf) - Pop/rock chord progression patterns
- J-POP pentatonic "yonanuki" analysis
:::

## Deterministic Generation

Same seed + same parameters = same output. Every time.

```bash
# These will always produce identical MIDI files
./midisketch_cli --seed 12345 --style 0
./midisketch_cli --seed 12345 --style 0
```

`--style` takes a style-preset ID (0-16).

::: tip Reproducibility Benefits
- Reproducible results for iterative workflows
- Share seeds with collaborators
- Metadata embedded in MIDI files enables regeneration
:::

## Candidate Selection System

For melody generation, MIDI Sketch doesn't just output the first result. It generates **20-100 candidates** per section and selects one through evaluation:

1. **Scoring**: Score every candidate on style quality, penalty-based singability, and interval-distribution fit
2. **Culling**: Discard the bottom half by score — high register strain, monotony and scattered notes push a candidate down
3. **Selection**: Draw the winner from the surviving half, weighted by score, so strong candidates usually win without every repeat converging on the same melody

::: details Candidate Counts by Section
| Section | Candidates |
|---------|-----------|
| Chorus | 100 |
| Pre-chorus (B) | 50 |
| Bridge / Chant | 30 |
| Verse / Intro / Outro | 20 |

More candidates for important sections where melody quality matters most.
:::

## Style Presets

17 style presets (stylePresetId 0-16) determine the overall musical character, each mapped to one of 24 internal moods. Moods (0-23) can also be set explicitly via `moodExplicit`, covering:

- J-Pop / K-Pop / City Pop
- EDM / Electro Pop / Synthwave / Future Bass
- Ballad / R&B / R&B Neo Soul / Chill / Lofi
- Rock / Light Rock
- Anime / Vocaloid
- Latin Pop / Trap
- And more

::: details What Each Preset Configures
- BPM range
- Drum patterns
- Chord voicing style
- Melody template preferences
- Evaluation weights
- Mood-dependent chord extension probabilities
:::

14 vocal style presets are available (Auto, Standard, Vocaloid, UltraVocaloid, Idol, Ballad, Rock, CityPop, Anime, BrightKira, CoolSynth, CuteAffected, PowerfulShout, KPop) to fine-tune melody generation characteristics independently from mood.

## Multiple Composition Styles

Three composition paradigms:

| Style | Vocal | Aux | Motif | Arpeggio | Use Case |
|-------|:-----:|:---:|:-----:|:--------:|----------|
| **MelodyLead (0)** | Yes | Yes | Paradigm/riff/Blueprint-dependent | Optional | Songs with vocals |
| **BackgroundMotif (1)** | No | Yes | Enabled | Optional | BGM, lo-fi |
| **SynthDriven (2)** | No | No | Enabled | Optional (manual enable) | Electronic, EDM |

::: warning BGM-Only Modes
BackgroundMotif disables Vocal, keeps Aux enabled, and enables Motif generation. SynthDriven disables both Vocal and Aux and enables Motif generation. Section masks and layer schedules determine where Motif notes remain; Arpeggio must be manually enabled with `arpeggioEnabled=true`.
:::

## Vocal-First Workflow

For MelodyLead style, iterate on the melody before generating accompaniment:

<DocFigure name="vocal-first-iteration" />

::: tip Iterate Until Satisfied
Use `generateVocal()` to create the initial melody, then call `regenerateVocal()` with a new seed or VocalConfig to try variations. Once satisfied, call `generateAccompaniment()` to add the backing tracks. Alternatively, use `generateWithVocal()` for vocal-priority one-shot generation.
:::

## Lightweight & Portable

- **~<WasmStat type="size" /> WASM** (gzip: ~<WasmStat type="gzip" />) + ~<WasmStat type="js" /> JS
- **No external dependencies** (pure C++17)
- Runs in browser, Node.js, or native CLI
- No API calls, no internet required

## Open Source

::: info License
AGPL-3.0 / Commercial dual licensed. The MIDI you generate is yours to use commercially. The engine is free to use, modify, and redistribute under AGPL-3.0; embedding it in a closed-source product or proprietary SaaS requires a commercial license.
:::

---

## Use Cases

::: details Demo Production
Generate quick song sketches to test ideas before investing time in full production.
:::

::: details Learning Tool
Study how chord progressions, voice leading, and arrangement work by examining the output.
:::

::: details DAW Templates
Generate starting points for tracks, then customize with your own sounds and mixing.
:::

::: details Game/Video BGM
Create reproducible background music with deterministic seeds.
:::

::: details Songwriting Aid
Get melody ideas and chord progressions to build upon.
:::

---

## What MIDI Sketch Is Not

::: warning Important Distinctions
- **Not an AI audio generator** - It outputs MIDI, not audio
- **Not a replacement for composers** - It's a tool to generate starting points
- **Not machine learning** - It uses explicit music theory rules
- **Not cloud-based** - Everything runs locally
:::

