# Features

MIDI Sketch is a music theory-based MIDI generator that creates complete pop music arrangements.

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
- 8 separate tracks (vocal, aux, chord, bass, drums, motif, arpeggio, SE)
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
- **RunUpTarget**: YOASOBI/Ado style - ascending runs to target notes
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
- Avoid note detection (minor 2nd with chord tones, tritone with root)
:::

### Non-Chord Tone (NCT) Decoration

Based on Kostka & Payne's *Tonal Harmony* framework:

::: info Strong Beats and Weak Beats
In 4/4 time, **strong beats** (1 and 3) feel accented and stable, while **weak beats** (2 and 4) feel lighter. Melodies typically place chord tones on strong beats for harmonic clarity.
:::

::: details NCT Types
| Type | Placement | Description |
|------|-----------|-------------|
| Passing Tone | Weak beat | Stepwise connection between chord tones |
| Neighbor Tone | Weak beat | Step away from chord tone and return |
| Appoggiatura | Strong beat | Accented dissonance resolving by step |
| Anticipation | Before beat | Early arrival of next chord tone |
| Tension | Context-dependent | 9th, 11th, 13th extensions |
:::

::: details Mood-Dependent Configuration
- **Bright/Upbeat**: 75% chord tones, pentatonic focus
- **CityPop**: 50% chord tones, jazz tensions enabled
- **Ballad**: 65% chord tones, expressive appoggiaturas
- **Dark/Dramatic**: Chromatic approach notes enabled
:::

### Harmony Context & Collision Avoidance

::: details Multi-Track Coordination
- **Track collision detection**: Registers all notes from vocal, bass, chord, aux tracks
- **Low register strictness**: 3-semitone threshold below C4 to prevent muddiness
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
./midisketch_cli --seed 12345 --style jpop
./midisketch_cli --seed 12345 --style jpop
```

::: tip Reproducibility Benefits
- Reproducible results for iterative workflows
- Share seeds with collaborators
- Metadata embedded in MIDI files enables regeneration
:::

## Candidate Selection System

For melody generation, MIDI Sketch doesn't just output the first result. It generates **20-100 candidates** per section and selects the best one through evaluation:

1. **Culling**: Filter out melodies with issues (high register strain, monotony, scattered notes)
2. **Scoring**: Rank survivors on singability, chord tone alignment, contour shape
3. **Selection**: Choose the highest-scoring candidate

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

20 mood presets covering:

- J-Pop / K-Pop / City Pop
- EDM / Electro Pop / Synthwave
- Ballad / R&B / Chill
- Rock / Light Rock
- Anime / Vocaloid
- And more

::: details What Each Preset Configures
- BPM range
- Drum patterns
- Chord voicing style
- Melody template preferences
- Evaluation weights
:::

## Multiple Composition Styles

Three composition paradigms:

| Style | Primary Element | Use Case |
|-------|----------------|----------|
| **MelodyLead** | Vocal melody | Songs with vocals |
| **BackgroundMotif** | Repeating motif | BGM, lo-fi |
| **SynthDriven** | Arpeggios | Electronic, EDM |

::: warning BGM-Only Modes
BackgroundMotif and SynthDriven are BGM-only modes - no vocal track is generated.
:::

## Vocal-First Workflow

For MelodyLead style, iterate on the melody before generating accompaniment:

```mermaid
flowchart LR
    A[Generate Vocal] --> B[Preview]
    B --> C{Satisfied?}
    C -->|No| D[Change Seed]
    D --> A
    C -->|Yes| E[Generate Accompaniment]
    E --> F[Export MIDI]
```

::: tip Iterate Until Satisfied
Keep regenerating the vocal with different seeds until you find one you like, then generate the backing tracks.
:::

## Lightweight & Portable

- **~309KB WASM** + ~69KB JS
- **No external dependencies** (pure C++17)
- Runs in browser, Node.js, or native CLI
- No API calls, no internet required

## Open Source

::: info License
Apache 2.0 licensed - use generated MIDI commercially, modify and redistribute freely.
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

