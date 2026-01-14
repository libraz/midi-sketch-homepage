# Generation Pipeline

This document explains the step-by-step music generation process in [MIDI Sketch](https://github.com/libraz/midi-sketch).

## Pipeline Overview

MIDI Sketch supports multiple generation workflows depending on the composition style and use case.

### Vocal-First Workflow

For iterative vocal refinement:

::: tip When to Use Vocal-First
Use this workflow when melody quality is critical. You can iterate on the vocal endlessly with `regenerateVocal()` before committing to the full arrangement.
:::

```mermaid
flowchart TD
    subgraph Step1 [Step 1: Vocal Generation]
        V1[generateVocal] --> V2[Preview/Iterate]
        V2 -->|Not satisfied| V3[regenerateVocal]
        V3 --> V2
    end

    subgraph Step2 [Step 2: Accompaniment]
        A1[generateAccompaniment]
        A1 --> A2[Aux → Bass → Chord → Drums]
    end

    V2 -->|Satisfied| A1
```

### BGM-Only Modes

For `BackgroundMotif` and `SynthDriven` composition styles, vocal generation is skipped:

```mermaid
flowchart LR
    subgraph BGMMode [BGM-Only Pipeline]
        B1[Structure] --> B2[Motif/Arpeggio]
        B2 --> B3[Bass]
        B3 --> B4[Chord]
        B4 --> B5[Drums]
    end
```

## CompositionStyle Branching

| Style | Primary Track | Vocal | Generation Order |
|-------|---------------|-------|------------------|
| **MelodyLead** | Vocal | Yes | Vocal → Aux → Bass → Chord → Drums |
| **BackgroundMotif** | Motif | No | Motif → Bass → Chord → Drums |
| **SynthDriven** | Arpeggio | No | Bass → Chord → Arpeggio → Drums |

## Phase 1: Structure Building

The generator first creates the song structure based on `StructurePattern`:

```cpp
void Generator::buildStructure() {
    arrangement_ = StructureBuilder::build(params_.structure);
}
```

### Structure Patterns

| Pattern | Bars | Sections |
|---------|------|----------|
| StandardPop | 24 | A(8)-B(8)-Chorus(8) |
| BuildUp | 28 | Intro(4)-A(8)-B(8)-Chorus(8) |
| DirectChorus | 16 | A(8)-Chorus(8) |
| RepeatChorus | 32 | A(8)-B(8)-Chorus(8)-Chorus(8) |
| FullPop | 56 | Intro-A-B-Chorus-A-B-Chorus-Outro |
| FullWithBridge | 52 | Intro-A-B-Chorus-Bridge-Chorus-Outro |
| Ballad | 56 | Intro(8)-A-B-Chorus-Interlude-B-Chorus-Outro |
| ExtendedFull | 90 | Full form with bridge and extended sections |

### Section Types

Each section has properties that affect generation:

```cpp
struct Section {
    SectionType type;         // Intro, A, B, Chorus, Bridge, Interlude, Outro
    uint8_t bars;             // Length in bars
    VocalDensity vocal_density;    // Full, Sparse, None
    BackingDensity backing_density; // Normal, Thin, Thick
};
```

## Phase 2: Track Generation

### Vocal Track (MelodyLead only)

The most complex generator with phrase caching and template-driven design:

```mermaid
flowchart TD
    A[Get section] --> B{Phrase cached?}
    B -->|Yes| C[Retrieve cached phrase]
    B -->|No| D[Select melody template]
    D --> E[Generate phrase contour]
    E --> F[Apply chord tones on strong beats]
    F --> G[Add embellishments]
    G --> H[Store in cache]
    C --> I[Apply voice leading]
    H --> I
    I --> J[Apply attitude]
    J --> K[Clamp to vocal range]
```

**Melody Templates:**

| Template | Characteristics |
|----------|-----------------|
| Auto | Auto-select based on style and section |
| PlateauTalk | NewJeans/Billie style: high plateau, talk-sing |
| RunUpTarget | YOASOBI/Ado style: run up to target note |
| DownResolve | B-melody: descending resolution |
| HookRepeat | TikTok/K-POP: short repeating hook |
| SparseAnchor | 髭男 style: sparse anchor notes |
| CallResponse | Duet style: call and response |
| JumpAccent | Emotional: jump accent |

::: info Auto Template Selection
When `melodyTemplate=Auto`, the system selects based on vocalStyle and section type. For example, Anime style in Chorus sections tends to use HookRepeat or JumpAccent.
:::

**Vocal Attitudes:**

| Attitude | Characteristics |
|----------|-----------------|
| Clean | Chord tones only, on-beat rhythms |
| Expressive | Tensions with delayed resolution, slight timing deviation |
| Raw | Non-chord tones, phrase boundary breaking |

::: warning Attitude Restrictions
Not all attitudes are available for every style preset. Use `midisketch_style_preset_allowed_attitudes()` to check which attitudes are permitted. Specifying an unsupported attitude results in a validation error.
:::

### Aux Track

Generates sub-melody support that adapts to the vocal:

```mermaid
flowchart TD
    A[Analyze vocal phrase] --> B{Section type?}
    B -->|Chorus| C[Reduced density, lower register]
    B -->|Verse| D[Normal density]
    C --> E[Select aux function]
    D --> E
    E --> F{Function type}
    F -->|PulseLoop| G[Rhythmic anchor pulses]
    F -->|TargetHint| H[Melodic target notes]
    F -->|GrooveAccent| I[Syncopated accents]
    G --> J[Avoid vocal collision]
    H --> J
    I --> J
```

**Aux Functions:**

| Function | Purpose | When Used |
|----------|---------|-----------|
| PulseLoop | Addictive repetition pattern | Straight rhythms |
| TargetHint | Hints at melody destination | Complex melodies |
| GrooveAccent | Physical groove accent | Syncopated grooves |
| PhraseTail | Phrase ending fill | Phrase transitions |
| EmotionalPad | Emotional pad/floor | Ballad, emotional sections |
| Unison | Vocal unison doubling | Chorus emphasis |
| MelodicHook | Melodic hook riff | Hook-focused sections |
| MotifCounter | Counter melody (contrary motion) | Polyphonic textures |

### Bass Generation

Bass provides the harmonic foundation, adapting to vocal when present:

```mermaid
flowchart TD
    A[Get chord for bar] --> B[Determine root note]
    B --> C{Vocal present?}
    C -->|Yes| D[Apply collision avoidance]
    C -->|No| E[Standard generation]
    D --> F{Section type?}
    E --> F
    F -->|Chorus| G[Higher octave]
    F -->|Intro| H[Lower octave]
    F -->|Other| I[Mid octave]
    G --> J[Add approach notes]
    H --> J
    I --> J
    J --> K[Apply pattern]
```

**Bass Patterns:**
- **Sparse**: Quarter notes on beats 1 and 3 (ballad, chill)
- **Standard**: Quarter note rhythm with occasional eighths
- **Driving**: Eighth note patterns with approach notes

### Chord Generation

Chord voicing coordinates with bass and vocal:

```cpp
void Generator::generateChord() {
    BassAnalysis bassAnalysis = analyzeBass(song_.bass);
    VocalAnalysis vocalAnalysis = analyzeVocal(song_.vocal);

    // Use rootless voicing when bass has root
    if (bassAnalysis.hasRootOnBeat1) {
        useRootlessVoicing();
    }

    // Avoid collision with vocal
    if (vocalAnalysis.hasNoteAt(tick)) {
        adjustVoicing(vocalAnalysis.pitchAt(tick));
    }
}
```

**Voice Leading Algorithm:**
1. Calculate distance between consecutive voicings
2. Minimize movement (sum of semitone distances)
3. Maximize common tone retention
4. Apply inversions to optimize transitions

::: info Rootless Voicing
When bass plays the root on beat 1, chord voicing automatically omits the root to avoid muddiness. This creates cleaner, more professional-sounding arrangements.
:::

### Drums Generation

Drum patterns are selected based on mood:

| Style | Characteristics | Used By |
|-------|-----------------|---------|
| Sparse | Half-time feel, minimal | Ballad, Chill |
| Standard | 8th hi-hat, 2&4 snare | StraightPop |
| FourOnFloor | 4-on-floor kick | ElectroPop, IdolPop |
| Upbeat | Syncopated, 16th hi-hat | BrightUpbeat |
| Rock | Ride cymbal, crash accents | LightRock |
| Synth | Tight 16th hi-hat | Yoasobi, Synthwave |

**Fill Generation:**
- Tom descend/ascend patterns
- Snare rolls
- Combination fills at section transitions

### Motif Track (BackgroundMotif style)

Generates repeating patterns as the primary melodic element:

```cpp
MotifParams params {
    .length = MotifLength::TwoBars,    // 2 or 4 bars
    .rhythm_density = RhythmDensity::Medium,
    .motion = MotifMotion::Stepwise,
    .repeat_scope = RepeatScope::FullSong
};
```

### Arpeggio Track (SynthDriven style)

Generates arpeggiated patterns as the primary harmonic element:

```cpp
ArpeggioParams params {
    .pattern = ArpeggioPattern::UpDown,
    .speed = ArpeggioSpeed::Sixteenth,
    .octave_range = 2,
    .gate = 0.5f  // Note length ratio
};
```

### SE Track

Generates section markers and sound effect cues:
- Section boundary markers (text events)
- Call timing hints (when callEnabled)
- Intro chant markers

## Phase 3: Polish

### Transition Dynamics

Automatically applies energy transitions:

```mermaid
flowchart LR
    A[B Section] -->|Crescendo| B[Chorus]
    B -->|Step-up| C[Chorus 2]
```

**Section Energy Multipliers:**

| Section | Multiplier |
|---------|-----------|
| Intro | 0.75 |
| A | 0.85 |
| B | 1.00 |
| Chorus | 1.20 |
| Bridge | 0.90 |
| Outro | 0.80 |

### Humanization

Adds natural variation to timing and velocity:

```cpp
void applyHumanization(Song& song, float intensity) {
    // Timing: random offset ±ms
    // Velocity: random ±value
    // Not applied to drums
}
```

::: tip Drums Exception
Humanization is intentionally **not applied to drums** to maintain tight rhythmic feel. Melodic and harmonic tracks receive humanization while drums stay quantized.
:::

## MIDI Output

Finally, the Song is converted to SMF Type 1 or Type 2:

```mermaid
flowchart TD
    A[Song] --> B[MidiWriter::build]
    B --> C[Write header]
    C --> D[Embed generation metadata]
    D --> E[For each track]
    E --> F[Convert NoteEvents to MidiEvents]
    F --> G[Apply transposition to target key]
    G --> H[Write variable-length timing]
    H --> I[SMF Binary]
```

**Track Mapping:**

| Track | Channel | Program |
|-------|---------|---------|
| Vocal | 0 | 0 (Piano) |
| Aux | 1 | 4 (E.Piano) |
| Chord | 2 | 4 (E.Piano) |
| Bass | 3 | 33 (E.Bass) |
| Motif | 4 | 81 (Synth Lead) |
| Arpeggio | 5 | 81 (Saw Lead) |
| Drums | 9 | GM Drums |
| SE | 15 | Text events |

## Key Transposition

All generation happens in C major. Final transposition is applied at output:

```cpp
uint8_t MidiWriter::transposePitch(uint8_t pitch, Key key) {
    return pitch + static_cast<uint8_t>(key);
}
```

::: info Internal C Major
All melodic logic operates in C major for simplicity. The `key` parameter (0-11) determines the final transposition: 0=C, 1=C#, 2=D, etc. This means chord progression analysis and scale-degree logic don't need key-specific handling.
:::

## Metadata Embedding

Generated MIDI files include metadata for regeneration:

```cpp
struct MidiMetadata {
    uint32_t seed;
    uint8_t style_preset_id;
    uint8_t chord_progression_id;
    uint8_t form_id;
    uint8_t composition_style;
    uint8_t vocal_attitude;
    uint8_t vocal_style;
    uint8_t melody_template;
    // ... additional parameters
};
```

This enables exact reproduction via CLI: `./midisketch_cli --regenerate song.mid`

::: tip Regeneration from MIDI
Any MIDI file generated by MIDI Sketch can be used to reproduce the exact same output. The embedded metadata stores all parameters, making it easy to iterate on a song weeks or months later.
:::
