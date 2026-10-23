# Track Generators

This document details each track generator in [MIDI Sketch](https://github.com/libraz/midi-sketch).

::: tip New to music theory?
The tracks below map onto musical roles — melody, chords, bass, motif, arpeggio. If those terms are new, start with the [Course](/docs/course/primer); it teaches the concepts behind every generator with playable notation.
:::

## Track Overview

MIDI Sketch generates 9 tracks across different MIDI channels:

<DocFigure name="tracks-channel-map" />

### Channel Assignment

| Track | Channel | Default Program | Role |
|-------|---------|-----------------|------|
| Vocal | 0 | Piano (0) | Main melody |
| Chord | 1 | E.Piano (4) | Harmonic backing |
| Bass | 2 | E.Bass (33) | Harmonic foundation |
| Motif | 3 | Synth Lead (81) | BackgroundMotif style |
| Arpeggio | 4 | Synth Lead (81) | SynthDriven style |
| Aux | 5 | Warm Pad (89) | Sub-melody support |
| Guitar | 6 | E.Guitar clean (27) | Accompaniment guitar |
| Drums | 9 | GM Drums | Rhythm |
| SE | 15 | - | Section markers |

::: info Mood-Dependent Programs
The programs above are the built-in fallbacks (`src/midi/track_config.h`). The actual GM program for each track is selected per mood (`getMoodPrograms`), so the instruments you hear vary with the mood preset.
:::

## Vocal Track

**Source:** `src/track/generators/vocal.cpp`, `src/track/vocal/melody_designer.cpp`

The vocal system uses a **template-driven melody designer** with **style-aware evaluation** for predictable, stylistically-accurate melody generation.

::: tip Why "Vocal" Track?
The Vocal track generates the main melody line. It's called "Vocal" because it's designed to be sung or played as the lead part. Use MIDI channel 0 (piano) in your DAW to preview it, or assign any instrument you prefer.
:::

### Architecture

The vocal generation consists of three major components:

1. **MelodyDesigner** (`melody_designer.cpp`) - Template-driven pitch selection with evaluation
2. **Vocal Generator** (`vocal.cpp`) - Section structure, caching, and coordination
3. **VocalStyleProfile** - Unified bias and evaluation configuration per style

<DocFigure name="tracks-vocal-architecture" />

### Melody Templates

7 melody templates define melodic characteristics:

| ID | Name | Plateau | Max Step | Use Case |
|----|------|---------|----------|----------|
| 0 | Auto | - | - | VocalStyle-based selection |
| 1 | PlateauTalk | 0.70 | 2 | Talk-like, narrow-range pop |
| 2 | RunUpTarget | 0.20 | 3 | Anime high-energy, dramatic pop |
| 3 | DownResolve | 0.40 | 2 | B-section, pre-chorus |
| 4 | HookRepeat | 0.55 | 2 | Short-form, K-POP hooks |
| 5 | SparseAnchor | 0.30 | 4 | Sparse, sustained ballad phrasing |
| 6 | CallResponse | 0.35 | 3 | Duet patterns |
| 7 | JumpAccent | 0.25 | 5 | Emotional peaks |

- **Plateau ratio**: Probability of staying on the same pitch (higher = more repetitive)
- **Max step**: Maximum step size in semitones (lower = smoother)

### Generation Flow

<DocFigure name="tracks-vocal-phrase-flow" />

::: info Octave Fold (Range Safety)
Notes that land outside the allowed range are folded by octaves (±12 semitones) back into range, preserving the pitch class — a chord tone stays a chord tone. A chromatic clamp to the range boundary is used only as a last resort, because clamping can turn a safe note into a dissonance (e.g. G folded down an octave stays G, while clamping G to a ceiling of F# would create a tritone).
:::

### Pitch Selection (4 Choices Only)

The MelodyDesigner limits pitch selection to 4 options:

```cpp
enum class PitchChoice {
    Same,       // Stay on current pitch (plateau_ratio)
    StepUp,     // Up one scale step (whole step preferred over half)
    StepDown,   // Down one scale step
    TargetStep  // Move toward the template's target pitch, bounded by max_step
};
```

This constrained approach produces more natural, singable melodies.

### Vocal Attitudes

| Attitude | Description | Implementation |
|----------|-------------|----------------|
| **Clean** | Conservative, singable | Chord tones only, on-beat |
| **Expressive** | Emotional, dynamic | Tensions allowed, timing variance |
| **Raw** | Edgy, unconventional | Non-chord tones, boundary breaking |

### Phrase Caching

The first occurrence of each section type is cached and replayed by every later section of that type, the way a pop song restates its tune with new lyrics. The cache is keyed by section type alone:

```cpp
std::unordered_map<SectionType, CachedPhrase> phrase_cache;  // A, B, Chorus, ...
```

The starting chord is deliberately not part of the key. The progression restarts at every section, and the chords a replay meets are answered by its own collision pass. A later section of a different length replays the bars it shares with the cached one: a shorter section ends on the cached head, a longer one continues with freshly written bars. What is cached is the resolved melody, before the approach into the next section and the hook emphasis, which a restatement takes from its own context.

Each restatement is exact with a probability that falls as the phrase is reused: 80% on the first restatement, 60% on the second and 30% from the third onward, so later sections are fresher. Exact repetition is also forced to stop after two consecutive identical statements.

::: info Phrase Variation
When a reuse is not exact, one of six variations is applied. All of them preserve the melodic identity of the phrase — none of them transpose, invert or re-cut it:

- **LastNoteShift**: Move the final note by one or two scale degrees
- **LastNoteLong**: Extend the final note for a more dramatic ending
- **BreathRestInsert**: Insert a short rest before the phrase ends
- **DynamicAccent**: Raise the final note's velocity
- **LateOnset**: Start the phrase a sixteenth note late
- **EchoRepeat**: Echo the final note, shorter and quieter

A phrase that opens on its hook (a chorus or drop) never takes LateOnset, so the hook keeps its downbeat entry.
:::

### Range Constraints

```cpp
struct VocalRangeResult {
    uint8_t effective_low;
    uint8_t effective_high;
    float velocity_scale;
};
```

The effective range starts with the singer bounds (`vocal_low` and `vocal_high`), then applies the Blueprint `max_pitch` ceiling and reserves headroom for a later upward modulation by lowering the effective high bound by the modulation amount. The lower bound is preserved. When positive modulation is requested, the adjusted high is clamped so at least one octave remains; a Blueprint `max_pitch` cap without modulation may produce a narrower span. Composition styles change `velocity_scale`; they do not create a separate foreground/background vocal range. Motif-follow-vocal behavior is a separate constraint: when a vocal exists, the motif generator still narrows its register around the vocal median.

### Non-Chord Tone Decoration

The vocal track uses non-chord tones (NCT) to add melodic interest beyond simple chord-tone melodies:

::: info Beat strength
The engine grades beats four ways in 4/4: **strong** (beats 1 and 3), **medium** (beats 2 and 4), **weak** (off-beat 8ths) and **very weak** (16ths). Chord tones and accented appoggiaturas belong on strong beats; passing tones, neighbour tones and anticipations go on the weak subdivisions between beats, not on beats 2 and 4.
:::

| NCT Type | Description | Placement |
|----------|-------------|-----------|
| **ChordTone** | Notes belonging to the current chord (baseline) | Strong beats |
| **PassingTone** | Stepwise connection between two chord tones | Off-beat subdivisions |
| **NeighborTone** | Step away from a chord tone and return | Off-beat subdivisions |
| **Appoggiatura** | Accented dissonance that resolves by step | Strong beats |
| **Anticipation** | Early arrival of the next chord's tone | Off-beat subdivisions, before the chord change |
| **Suspension** | A tone held over from the previous chord, resolving down by step | Strong beat, resolving on the following weak one |
| **Tension** | Extended chord tones (9th, 11th, 13th) | Based on style |

Configuration varies by mood:
- **Bright**: More chord tones, less dissonance
- **Jazzy**: More tensions, syncopation
- **Ballad**: Balanced with expressive appoggiaturas
- **J-POP**: Prefers pentatonic scale (yonanuki) intervals

### VocalStyleProfile

Each vocal style has a unified profile with two parts: four **interval-mix weights** that feed the bias score, and the **evaluation weights** of the style score. Eight profiles are shared across the fourteen vocal styles (Idol/BrightKira/CuteAffected → Idol; Vocaloid/UltraVocaloid/CoolSynth → Vocaloid; Rock/PowerfulShout → Rock; Auto/Standard → Standard):

| Profile | Same pitch | Stepwise | Skip | Leap | Singability | Surprise |
|---------|-----------|----------|------|------|-------------|----------|
| **Standard** | 1.00 | 1.00 | 1.00 | 0.50 | 0.15 | 0.15 |
| **Idol** | 1.25 | 1.45 | 1.00 | 0.45 | 0.18 | 0.05 |
| **Rock** | 0.80 | 0.80 | 1.00 | 0.80 | 0.15 | 0.20 |
| **Ballad** | 1.00 | 1.60 | 1.00 | 0.20 | 0.30 | 0.05 |
| **Anime** | 1.30 | 1.00 | 1.20 | 0.60 | 0.10 | 0.15 |
| **Vocaloid** | 0.90 | 0.70 | 1.00 | 1.00 | 0.10 | 0.20 |
| **CityPop** | 0.90 | 1.20 | 1.10 | 0.40 | 0.15 | 0.15 |
| **KPop** | 1.40 | 0.90 | 1.10 | 0.60 | 0.12 | 0.18 |

### UltraVocaloid Mode

Enhanced Vocaloid-style generation with:
- **Machine-gun rhythm**: Rapid-fire 16th note sequences characteristic of Vocaloid songs
- **Breathing points**: Automatic insertion of micro-pauses for phrasing even in dense passages
- **Per-section rhythm lock**: Each section maintains consistent rhythmic identity

::: details Profile Parameters
- **Same pitch**, **Stepwise**, **Skip** (3rds), **Leap** (5ths and wider): multipliers on how common each interval kind is in a candidate (1.0 = neutral). A candidate's share of each kind, weighted and normalised, becomes its bias score. A higher same-pitch weight favours repetitive lines
- **Singability**: Weight for human-singable melodies (higher = easier to sing)
- **Surprise**: Weight for unexpected melodic turns (higher = more dynamic)

The profile does not bias register: where a melody sits in the vocal range comes from the section's range shift and tessitura, not from the style.
:::

### Melody Evaluation System

The MelodyDesigner generates a batch of candidate melodies — 100 for a chorus, 50 for a B section, 30 for a bridge or chant, 20 everywhere else — and scores each one:

The shared scoring reference is [Melody Evaluation](/docs/melody-evaluation); this page keeps only the track-level wiring and constraints.

<DocFigure name="tracks-melody-evaluation" />

**Combined score:**

| Component | Weight | Criteria |
|-----------|--------|----------|
| Style score | 40% | Seven weighted qualities, listed below |
| Culling score | 40% | Penalty-based: singing difficulty, monotony, awkward gaps |
| Bias score | 20% | Interval distribution matching style preferences |

A global-motif bonus is added on top, weighted by section: 0.35 in the chorus, 0.25 in a repeated A section, 0.22 in B, 0.15 in the first A section and 0.05 in the bridge, where contrast is wanted instead.

**The style score** is itself seven components whose weights come from the vocal style profile and sum to 1.0. The values below are the Standard profile:

| Component | Standard weight | Criteria |
|-----------|-----------------|----------|
| Singability | 0.15 | Interval distribution: step-heavy, few large leaps |
| Chord tone ratio | 0.15 | Chord tones landing on strong beats |
| Contour | 0.15 | Recognisable arch / wave / descending shape |
| Surprise | 0.15 | One or two deliberate leaps of a 4th or more |
| AAAB pattern | 0.15 | Three-plus-one repetition structure |
| Rhythm-interval fit | 0.15 | Long note before a leap, short note for a step |
| Catchiness | 0.10 | Short-cell repetition, rhythmic consistency, hook contour |

**The culling score** starts at 1.0 and subtracts penalties: consecutive high notes, a leap onto a high note, rapid direction changes, non-chord tones on strong beats, melodically isolated notes, low phrase cohesion, excessive silence, and breathless runs of short notes.

Candidates are then sorted by combined score, the bottom half is discarded, and one of the survivors is drawn at random with higher scores weighted more heavily. The top-scoring candidate is only the fallback, so equally good phrases stay in rotation.

### Hook System

Chorus sections use a dedicated hook generation system built from **17 rhythm patterns** and **25 hook skeletons**. The most common are:

**Common rhythm patterns:**

| Pattern | Rhythm | Character |
|---------|--------|-----------|
| **Buildup** | 8-8-4 | Classic step resolution |
| **Syncopated** | 4-8-8 | Syncopated start |
| **FourNote** | 8-8-8-4 | High energy |
| **Powerful** | 4-4 | Simple, strong |
| **Dotted** | 8-4-8 | Dotted rhythm feel |
| **CallResponse** | 4-8-8-8 | Call and response |

**Common hook skeletons:**

| Skeleton | Description |
|----------|-------------|
| Repeat | Same pitch repeated |
| Ascending | Rising contour |
| AscendDrop | Rise then fall |
| LeapReturn | Jump and return |
| RhythmRepeat | Pitch varies, rhythm constant |

**Hook Intensity** controls hook prominence:
- **Off (0)**: No hook emphasis
- **Light (1)**: Chorus start only
- **Normal (2)**: Chorus start and middle
- **Strong (3)**: All hook points
- **Maximum (4)**: Maximum repetition, simple patterns only

### Global Motif System

The vocal track extracts a **global motif** from the chorus hook and uses it as a light evaluation bonus for later sections — it biases selection, it does not constrain generation:

```cpp
struct GlobalMotif {
    ContourType contour_type;        // Ascending, Descending, Peak, Valley, Plateau
    int8_t  interval_signature[8];   // Relative pitch changes
    uint8_t interval_count;
    uint8_t rhythm_signature[8];     // Relative duration ratios
    uint8_t rhythm_count;
};
```

Each section compares its candidates against a transformation of the motif chosen to suit that section: the original in the chorus, a diminished version in A, a sequenced version in B, an inverted version in the bridge and a fragmented version in the outro. The bonus is then scaled by the section weights listed above, so the chorus preserves the hook identity most strongly and the bridge is left free to contrast.

### Piano Roll Safety API

**Source:** `src/core/piano_roll_safety.cpp`

The read-only [Piano Roll Safety API](/docs/api-cpp#piano-roll-safety-api) helps external tools such as piano roll editors display pitch-placement warnings. `checkBgmCollisionDetailed` checks sounding notes in six BGM tracks (Chord, Bass, Arpeggio, Aux, Motif and Guitar) by pitch-class interval. It reports `Severe` for interval classes 1 or 11, `Mild` for class 6, and `None` otherwise. This display helper does not apply chord, duration, register or generator-specific exceptions; the generator's separate `HarmonyContext` filter is described in [Harmony](/docs/harmony#harmonycontext).

```cpp
enum class CollisionType : uint8_t {
    None,    // No display warning
    Mild,    // Pitch-class interval 6: display warning
    Severe   // Pitch-class intervals 1/11: display warning
};
```

**Collision Detection:**

| Pitch-class interval | Type | Display result |
|----------|------|------|
| 1 or 11 | Severe | Severe display warning |
| 6 | Mild | Mild display warning |
| Other classes | None | No display warning |

::: warning Modulation Awareness
The generated vocal range starts with the singer bounds, is capped by the Blueprint's `max_pitch`, and reserves upward modulation headroom by reducing `effective_vocal_high`. The read-only display helper is independent of that range calculation: it reports pitch-class collisions and does not create a separate foreground-motif range.
:::

---

## Aux Track

**Source:** `src/track/generators/aux.cpp`

The Aux (auxiliary) track provides **sub-melody support** when a main vocal exists. In `BackgroundMotif`, Vocal is always skipped; Traditional/MelodyDriven run Aux before Motif without a vocal reference, while RhythmSync keeps Motif before Aux. `SynthDriven` skips Aux. Aux is not a counter-melody, but a layer that shapes the arrangement around the lead when one is present.

### Purpose

| Role | Description |
|------|-------------|
| Addictiveness | Pulse loops create repetitive, catchy patterns |
| Physicality | Groove accents add body movement feel |
| Stability | Phrase tails provide resolution |
| Structure | Helps listeners perceive section boundaries |

### Aux Functions

9 auxiliary functions are available:

| ID | Function | Description |
|----|----------|-------------|
| 0 | PulseLoop | Repetitive same-pitch or fixed-interval patterns |
| 1 | TargetHint | Hints at vocal target with chord tones |
| 2 | GrooveAccent | Rhythmic accents with staccato |
| 3 | PhraseTail | End-of-phrase descending resolution |
| 4 | EmotionalPad | Long sustained chord tones |
| 5 | Unison | Vocal unison doubling |
| 6 | MelodicHook | Melodic hook riff |
| 7 | MotifCounter | Counter melody (contrary motion) |
| 8 | SustainPad | Whole-note chord tone pad |

### Aux Function Selection

For the main song sections the aux function comes from the Blueprint's aux profile, not from the melody template:

| Section | Source |
|---------|--------|
| Intro | An echo of the cached chorus motif, or `aux_profile.intro_function` when no motif is cached |
| A / B / Bridge | `aux_profile.verse_function` |
| Chorus | `aux_profile.chorus_function` |

So a Traditional blueprint runs MelodicHook in the intro, MotifCounter in the verses and MelodicHook again in the chorus, while RhythmLock holds a single PulseLoop cell throughout. The remaining section types — interlude, outro, chant, mix break — fall back to the first aux configuration the melody template defines:

| Template | Fallback function | Range offset | Width | Velocity ratio |
|----------|-------------------|--------------|-------|----------------|
| PlateauTalk | PulseLoop | -12 | 5 | 0.6 |
| RunUpTarget | TargetHint | 0 | 7 | 0.5 |
| DownResolve | PhraseTail | 0 | 5 | 0.5 |
| HookRepeat | PulseLoop | -12 | 4 | 0.7 |
| SparseAnchor | EmotionalPad | -5 | 8 | 0.4 |
| CallResponse | MotifCounter | 0 | 6 | 0.7 |
| JumpAccent | PhraseTail | 0 | 5 | 0.5 |

### Generation Constraints

- Generated after Vocal when Vocal is present, so its pitches can avoid the lead; with `BackgroundMotif`, Traditional/MelodyDriven run Aux before Motif because Vocal is absent, while RhythmSync keeps Motif before Aux. `SynthDriven` does not generate Aux
- When a vocal exists, the range is an absolute semitone width — 4 to 12 semitones wide — centred on its tessitura and offset by the section's `range_offset`; without a vocal it uses the configured/default tessitura. In both cases it is clamped to G3 (55) - C6 (84)
- Velocity ratios of 0.4-0.8 scale a fixed base velocity of 80, not the vocal note's own velocity; a blueprint's `velocity_scale` multiplies that ratio
- Uses HarmonyContext to avoid dissonance with vocal

### Chorus Behavior

A chorus runs the Blueprint's `chorus_function`, and the register, velocity and density follow the kind of function. Ratios are multiplied by the Blueprint's `velocity_scale` and `density_scale`:

| Chorus function | Range offset | Range width | Velocity ratio | Density ratio |
|-----------------|--------------|-------------|----------------|---------------|
| EmotionalPad, SustainPad | -12 | 12 | 0.60 | 0.80 |
| Rhythmic functions (PulseLoop, GrooveAccent, MelodicHook and the rest) | -6 | 12 | 0.75 | 0.95 |
| Unison | 0 | 12 | 0.75 | 1.00 |

Unison only runs when the lead's rhythm is stable enough to double (rhythm stability of 0.5 or more); otherwise the chorus falls back to MelodicHook with the rhythmic settings. An UltraVocaloid chorus at full vocal density always uses GrooveAccent (offset -6, velocity 0.75, density 0.80).

---

## Chord Track

**Source:** `src/track/generators/chord.cpp`

Generates harmonic voicings with voice leading optimization.

### Voicing Types

<DocFigure name="tracks-chord-voicings" />

Three voicing types are available. **Close** packs the chord tones into a single octave. **Open** is a Drop 2 voicing: the second voice from the top drops an octave, so a root-3rd-5th-7th stack becomes 5th-root-3rd-7th; Drop 3 and Spread are its other variants, selected per section and mood. **Rootless** is a voicing candidate that leaves out the root the bass is already holding. It is chosen with the probabilities and mood conditions given below.

The voicing type is chosen per bar from the section: intro, interlude, outro, chant and A are always Close, MixBreak is always Open, and B, chorus and bridge draw between Close and Open (B 40% Open, chorus 60% Open, bridge 50% Open). Ballad moods fix B and the bridge to Close and the chorus to Open. A section marked `PeakLevel::Medium` or `PeakLevel::Max` promotes a Close pick to Open with 70% or 90% probability.

### Voice Leading Algorithm

1. Generate candidates from the section's voicing type (close, open/Drop2, Drop3, spread, rootless)
2. Score each by weighted movement from the previous voicing — the outer voices (bass and soprano) count double, the inner voices once, over up to five pitches
3. Reward retained common tones
4. Penalise parallel 5ths and octaves, by an amount that depends on the mood: strict for classical and sophisticated moods, relaxed for pop and dance
5. Penalise a voicing identical to the previous one three times running

### Bass Coordination

The chord track is generated after the bass, so it can read what the bass is actually playing. Two mechanisms use that:

- `buildBassPitchMask` collects the pitch classes the bass sustains across beats 1 and 3 of the bar, and candidate voicings that would clash with them by a minor 2nd or a tritone are rejected.
- `BassAnalysis::analyzeBar` reports whether the bass states the root on beat 1. Only when it does, and only in CityPop, Nostalgic, Dramatic and ModernPop moods, may a rootless voicing replace the Open/Close draw: with probability 20% in a B section, 30% in a chorus and 25% in a bridge. Elsewhere the voicing keeps its root.

### Register Constraints

```cpp
constexpr uint8_t CHORD_LOW = 48;   // C3
constexpr uint8_t CHORD_HIGH = 84;  // C6
```

---

## Guitar Track

**Source:** `src/track/generators/guitar.cpp`

The Guitar track generates accompaniment guitar patterns on a dedicated MIDI channel (Ch 6). It provides rhythmic and harmonic support that complements the chord track.

### Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `guitarEnabled` | `true` | Enable/disable guitar track generation (default enabled in both JS and C++) |

### Blueprint Constraints

Guitar generation is influenced by Blueprint constraints:

| Constraint | Description |
|------------|-------------|
| `guitar_below_vocal` | When enabled, keeps guitar voicings at least two semitones below the lowest vocal note of each section to avoid masking the melody; a section with no vocal, or a vocal sitting below the guitar floor, is left unconstrained |
| `guitar_style_hint` | Per-section style hint (0-7) defined in the Blueprint's SectionSlot. 0 = auto-select based on mood and energy |

### Generation

- Guitar is generated **after** the chord track, allowing it to complement existing harmonic voicing
- Patterns adapt to section energy and mood
- Per-section `guitar_style_hint` (0-7) in the Blueprint's SectionSlot can influence the style of guitar accompaniment
- Guitar appears on MIDI channel 6 with Electric Guitar clean (program 27) as the fallback program; moods can assign a different guitar program

---

## Bass Track

**Source:** `src/track/generators/bass.cpp`

Generates the harmonic foundation with root-focused patterns.

### Pattern Types

`BassPattern` has 17 values. The active pattern is selected automatically based on mood and section, or pinned per section via `bass_style_hint` in the Blueprint's SectionSlot (0=auto, 1-17 maps to BassPattern+1). Common ones:

| Pattern | Description | Rhythm |
|---------|-------------|--------|
| WholeNote | Sustained roots for stability (ballad, intro) | Half notes, approach into the next bar |
| RootFifth | Classic pop root-fifth alternation | Quarter notes, fifth on beat 3 |
| Syncopated | Off-beat accents for groove (pre-chorus) | Root with an off-beat fifth |
| Driving | Energetic, forward (chorus) | Eighth notes throughout |
| Walking | Quarter-note scale walk (jazz, city pop) | Four quarter notes, chromatic approach |

The rest cover genre-specific cases: RhythmicDrive, PowerDrive, Aggressive, SidechainPulse, Groove, OctaveJump, PedalTone, Tresillo, SubBass808, RnBNeoSoul, SlapPop and FastRun.

### Generation Logic

<DocFigure name="tracks-bass-generation" />

The section type steers which pattern is used, but it never shifts the octave. The root only moves by an octave when that is what keeps it inside the bass range of E1 (28) to G3 (55).

Peak handling runs after pattern selection. `PeakLevel::Medium` promotes the selected pattern one density level and `PeakLevel::Max` promotes it twice. This applies to an explicit `bass_style_hint` as well as to an automatically selected pattern: the hint names the base pattern, while the peak still adds density.

### Approach Notes

The second half of beat 4 usually carries an approach note into the next bar's root. The choice is chord-function aware rather than always chromatic: a perfect 5th below the target for tonic and dominant chords, a step below for subdominants, with the leading tone, a step above and a perfect 4th below as fallbacks. Any candidate that would clash with a tone the target chord actually sounds is rejected, which matters for secondary dominants, whose third is raised and seventh lowered relative to the diatonic triad.

A chromatic half step below the target is reserved for walking lines, and only when the next root is a whole step or a minor 3rd away.

---

## Drums Track

**Source:** `src/track/drums.cpp`, `src/track/drums/`

Generates drum patterns with fills and dynamics.

### GM Drum Map

```cpp
constexpr uint8_t KICK = 36;
constexpr uint8_t SNARE = 38;
constexpr uint8_t SIDE_STICK = 37;
constexpr uint8_t CLOSED_HH = 42;
constexpr uint8_t OPEN_HH = 46;
constexpr uint8_t RIDE = 51;
constexpr uint8_t CRASH = 49;
constexpr uint8_t TOM_HIGH = 50;
constexpr uint8_t TOM_MID = 47;
constexpr uint8_t TOM_LOW = 45;
```

### Pattern Styles

<DocFigure name="tracks-drum-style-selection" />

### Fill Types

`FillType` has 13 members. The common ones are SnareRoll, TomDescend, TomAscend and SnareTomCombo; the rest cover sparser and more idiomatic cases — SimpleCrash, LinearFill, GhostToAccent, BDSnareAlternate, HiHatChoke, TomShuffle, BreakdownFill, FlamsAndDrags and HalfTimeFill. `selectFillType()` picks one from the section pair, the drum style and the next section's energy.

A fill does not have to cover every beat of its window; when a fill type has nothing to say on a beat, the section's ordinary pattern is kept there rather than leaving silence.

A fill is placed only in the last bar of a section, and only when the next section asks for one (`fill_before`) or is a full-weight chorus; a quiet chorus (ochisabi) is not led into by a fill. The fill starts on beat 4 in low-energy sections, beat 3 in medium ones and beat 1 (the whole bar) in high-energy ones. The final section never fills, and the bar that breaks into the last chorus keeps its groove and drops its final beat instead.

For a `Dramatic` or `DrumHit` chorus drop, the final drop zone also truncates the kit. If that cut removes an entry crash, post-processing restores the crash at the next section boundary so the chorus still has an arrival marker.

### Euclidean Drums

Blueprints provide `euclidean_drums_percent`, which the drum generator samples when choosing the Euclidean branch. The field is currently classified as **UnprovenLiveness** in Blueprint accounting, so its audible effect is not guaranteed; treat it as reserved rather than as a reliable tuning control.

### Drum Role

Per-section `drum_role` in the Blueprint's SectionSlot controls drum behavior:

| Role | Description |
|------|-------------|
| Full | Standard full drum kit |
| Ambient | Subdued, atmospheric |
| Minimal | Sparse, minimal patterns |
| FXOnly | Sound effects only, no standard kit |

### Ghost Notes

Velocity-reduced snare articulations for groove:

```cpp
// Ghost velocity is a multiplier on the beat velocity (0.25-0.65 by section and
// position, then a random 0.85-1.15), clamped to 20-100, not an absolute value.
```

Density is a table lookup by section and mood category, giving 0%, 15%, 30% or 45%, then adjusted for tempo and backing density:
- **Energetic moods** (EnergeticDance, IdolPop, Anthem, AnimeHighEnergy, LatinPop, Trap): up to 45% ghost probability in the chorus
- **Calm moods** (Ballad, Sentimental, Chill, Lofi): none in verses, light elsewhere

### Swing Timing

Swing only applies when the mood's groove feel is Swing or Shuffle — Sentimental, Chill, Ballad, Nostalgic and CityPop swing; RnBNeoSoul and Lofi shuffle. Every other mood is straight and the offset is zero.

| Section | Swing amount | Behaviour |
|---------|-------------|-----------|
| Intro | 0.25 | Lightest |
| A / Bridge / Interlude / MixBreak | 0.35 | Constant |
| B | 0.40 | Constant |
| Chorus | 0.50 | Deepest, constant |
| Outro | 0.40 → 0.20 | Quadratic decay to the end |

The amount is held constant within a section on purpose; bar-to-bar drift makes the groove feel unstable. A Blueprint SectionSlot can override it via `swing_amount` (0.0-0.7).

Swing is not a separate grid. Off-beat notes are pushed toward the triplet position by `swing_amount`: up to +80 ticks on the 8th-note grid and +40 on the 16th-note grid, so `swing_amount = 1.0` lands exactly on the triplet. Shuffle multiplies the amount by 1.5 before clamping.

### Humanization

Drum humanization is small and applies to the kick only:
- **Kick jitter**: up to ±2 ticks (2% of a sixteenth note), scaled by `humanize_timing`; the offset is truncated to whole ticks, so low settings give none
- **No velocity humanization pass**: drum dynamics come from the pattern, the section and the ghost-note and accent rules (see [Generation Pipeline](/docs/generation-pipeline#humanization))
- **Hi-hat accent patterns**: Natural emphasis on downbeats

Groove offsets are a separate mechanism: the section's time feel shifts drum onsets (laid back about +10 ms, pushed about −7 ms, scaled by tempo), and the drive-feel micro-timing pass places drums and bass in the pocket.

### Vocal Synchronization

When `drums_sync_vocal` is enabled, kick drums align with vocal onset positions:

```cpp
void generateDrumsTrackWithVocal(
    MidiTrack& track,
    const Song& song,
    const GeneratorParams& params,
    std::mt19937& rng,
    const VocalAnalysis& vocal_analysis  // Pre-analyzed vocal data
);
```

This "rhythm lock" effect makes the groove follow the melody, common in modern pop production.

---

## Motif Track

**Source:** `src/track/generators/motif.cpp`

For `BackgroundMotif` composition style (BGM-only mode). Vocal is always skipped; the motif is the primary melodic element. The generator also runs for `SynthDriven`, the RhythmSync paradigm, and Blueprint section flows that request it.

### Parameters

```cpp
struct MotifParams {
    MotifLength length;                 // Bars1, Bars2 (default), Bars4
    uint8_t note_count;                 // 3-8 notes per cycle, default 6
    bool register_high;                 // false = mid, true = high
    MotifRhythmDensity rhythm_density;  // Sparse, Medium (default), Driving
    MotifMotion motion;                 // Stepwise, GentleLeap, WideLeap,
                                        // NarrowStep, Disjunct, Ostinato
    MotifRepeatScope repeat_scope;      // FullSong (default), Section
};
```

`MotifLength` counts **bars**, not beats. The register is a boolean, not an enum — there is no `MotifRegister` type.

### Override Parameters

When motif overrides are specified in the config, the following parameters take precedence over style defaults:

| Parameter | Type | Description |
|-----------|------|-------------|
| `motifLength` | int (0=auto, 1/2/4) | Override motif length in bars (0 defaults to 2 bars) |
| `motifNoteCount` | int (0=auto, 3-8) | Override number of notes in the motif (0 defaults to 6) |
| `motifMotion` | int (0xFF=preset, 0-5) | Override motion type (0=Stepwise, 1=GentleLeap, 2=WideLeap, 3=NarrowStep, 4=Disjunct, 5=Ostinato) |
| `motifRegisterHigh` | int (0=auto, 1=low, 2=high) | Override the register the motif builds from |
| `motifRhythmDensity` | int (0xFF=preset, 0-2) | Override rhythm density (0=Sparse, 1=Medium, 2=Driving) |

### Pattern Generation

<DocFigure name="tracks-motif-pattern" />

**MotifMotion values** (API: 0-5):

| Value | Name | Description |
|-------|------|-------------|
| 0 | Stepwise | Scale steps only (2nds) |
| 1 | GentleLeap | Up to 3rds |
| 2 | WideLeap | Up to 5ths |
| 3 | NarrowStep | Narrow scale degrees (jazzy) |
| 4 | Disjunct | Irregular leaps (experimental) |
| 5 | Ostinato | Same pitch class repeated |

### Register

The motif track occupies C4 (60) - C8 (108). The register flag picks the base note it builds from, not a range of its own:

| Register | Base note |
|----------|-----------|
| Mid (default) | C4 (60) |
| High | G4 (67) |

When a vocal is present, the usable range is narrowed around the vocal median: the ceiling drops to three semitones above it and the floor rises to fifteen below, which keeps the motif from piling up at the top of its range.

### Repetition

For the `Free` policy, `repeat_scope` controls whether `FullSong` generates a fresh motif for each section or `Section` caches and reuses a pattern by section type. The locked policies (LockedContour, LockedPitch, LockedAll) replay the cached pattern on repeated section types. `Evolving` mutates its cached riff once per section while retaining its identity. When `phrase_tail_rest` applies, the motif stops starting notes halfway through the final bar of the tail; the coordinator asks the generator for that cutoff when it copies a frozen bar.

---

## Arpeggio Track

**Source:** `src/track/generators/arpeggio.cpp`

For `SynthDriven` composition style (BGM-only mode). Creates arpeggiated patterns that serve as the primary harmonic/melodic element in electronic-style tracks.

### Parameters

```cpp
struct ArpeggioParams {
    ArpeggioPattern pattern = Auto;  // Up, Down, UpDown, Random, Pinwheel,
                                     // PedalRoot, Alberti, BrokenChord, Auto
    ArpeggioSpeed speed = Auto;      // Eighth, Sixteenth, Triplet, Auto
    uint8_t octave_range = 2;        // 1-3 octaves
    float gate = -1.0f;              // Note length ratio (0.0-1.0); -1 = style default
    bool sync_chord = true;          // Follow chord changes
    uint8_t base_velocity = 90;      // Base velocity for arpeggio notes
};
```

### Pattern Types

<DocFigure name="tracks-arpeggio-patterns" />

| ID | Pattern | Description |
|----|---------|-------------|
| 0 | Up | Ascending through chord tones |
| 1 | Down | Descending through chord tones |
| 2 | UpDown | Ascending then descending (endpoints not repeated) |
| 3 | Random | Shuffled chord tone order |
| 4 | Pinwheel | Root - 5th - 3rd - 5th |
| 5 | PedalRoot | Root alternating with each upper chord tone |
| 6 | Alberti | Classical low-high-mid-high; same figure as Pinwheel |
| 7 | BrokenChord | Ascending then descending; same figure as UpDown |
| 255 | Auto | Use the mood or blueprint default pattern (the JS default) |

The chord tones are stacked across `octave_range` octaves before the pattern is applied, so with the default of 2 an Up arpeggio on a C major triad plays C E G C E G, not C E G C.

### Speed Conversion

```cpp
Tick getNoteDuration(ArpeggioSpeed speed) {
    switch (speed) {
        case Eighth:    return TICKS_PER_BEAT / 2;    // 240
        case Sixteenth: return TICKS_PER_BEAT / 4;    // 120
        case Triplet:   return TICKS_PER_BEAT / 3;    // 160
    }
}
```

---

## SE Track

**Source:** `src/track/generators/se.cpp`

The SE track carries a text marker at the start of every section, plus a marker at the modulation point when the song modulates. It takes no part in pitch collision detection.

When calls are enabled it also writes call-and-response chants: chant and mix-break sections get their preset pattern, choruses get scattered short calls at a probability set by the call density, a PPPH figure is placed in the last bar before a B → Chorus transition, and an intro mix pattern is placed at each intro. Call notes are optional; with them switched off only the text markers are written. Every call note sounds at a fixed C3 (48), so the track can be muted or re-pointed without affecting the rest of the arrangement.

---

## Velocity Calculation

Common velocity formula across tracks:

```cpp
uint8_t calculateVelocity(
    uint8_t baseVelocity,
    int beat,
    SectionType section,
    float trackBalance
) {
    float beatAdjust = getBeatAccent(beat);      // Strong beats: +10
    float sectionMult = getSectionEnergy(section); // Chorus: 1.2

    return clamp(
        baseVelocity * beatAdjust * sectionMult * trackBalance,
        1, 127
    );
}
```

### Track Balance

| Track | Balance | Notes |
|-------|---------|-------|
| Vocal | 1.00 | Lead instrument |
| Aux | 0.50-0.80 | Sub-melody support |
| Chord | 0.75 | Supporting |
| Bass | 0.85 | Foundation |
| Guitar | 0.70 | Accompaniment |
| Drums | 0.90 | Timing driver |
| Motif | 0.70 | Background |
| Arpeggio | 0.85 | Mid-level |
