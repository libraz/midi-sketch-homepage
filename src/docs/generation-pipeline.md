# Generation Pipeline

This document explains the step-by-step music generation process in [MIDI Sketch](https://github.com/libraz/midi-sketch).

::: tip New to music theory?
The pipeline assembles sections — verse, pre-chorus, chorus — into a song form. If that vocabulary is unfamiliar, the course chapter [Song Structure](/docs/course/song-structure) explains it with playable examples first.
:::

## Pipeline Overview

MIDI Sketch supports multiple generation workflows depending on the composition style and use case.

### Vocal-First Workflow

For iterative vocal refinement:

::: tip When to Use Vocal-First
Use this workflow when melody quality is critical. You can iterate on the vocal endlessly with `regenerateVocal()` before committing to the full arrangement.
:::

<DocFigure name="pipeline-vocal-first-workflow" />

Committing to the arrangement clears and rebuilds every non-vocal track — Aux, Bass, Chord, Drums, Arpeggio, Motif, SE and Guitar — and regenerates them in the paradigm order with the vocal held fixed. Motif is kept rather than cleared under the RhythmSync paradigm, where it is the coordinate axis the vocal was written against. Afterwards the vocal gets up to two refinement passes that resolve clashes with the new accompaniment, stopping early once a pass finds nothing to fix.

### BGM-Only Modes

For `BackgroundMotif` and `SynthDriven` composition styles, vocal generation is always skipped. In `BackgroundMotif`, Traditional and MelodyDriven paradigms run Aux before Motif without a vocal reference; RhythmSync keeps Motif before Aux even when Vocal is absent. `SynthDriven` skips Aux as well:

<DocFigure name="pipeline-bgm-only" />

## CompositionStyle Branching

| Style | Primary Track | Vocal | Aux | Generation Order |
|-------|---------------|-------|-----|------------------|
| **MelodyLead** | Vocal | Yes | Yes | Vocal → Aux → Motif (conditional) → Bass → Chord → Guitar → Arpeggio → Drums → SE |
| **BackgroundMotif** | Motif | No | Yes | Aux → Motif* → Bass → Chord → Guitar → Arpeggio → Drums → SE |
| **SynthDriven** | Arpeggio | No | No | Motif → Bass → Chord → Guitar → Arpeggio (requires `arpeggioEnabled`) → Drums → SE |

\* `BackgroundMotif` uses Aux → Motif for Traditional/MelodyDriven and Motif → Aux for RhythmSync.

::: info Generation Paradigms
The generation order is decided by the Blueprint paradigm alone; the composition style only decides which tracks drop out of it.

- **Traditional / MelodyDriven**: Vocal → Aux → Motif → Bass → Chord → Guitar → Arpeggio → Drums → SE
- **RhythmSync**: Motif → Vocal → Aux → Bass → Chord → Guitar → Arpeggio → Drums → SE

So the table follows the Traditional/MelodyDriven sequence with skipped tracks removed. BackgroundMotif drops Vocal, which leaves Aux running first in those paradigms; RhythmSync keeps Motif before Aux. SynthDriven drops both Vocal and Aux. Motif is generated unconditionally under BackgroundMotif and SynthDriven — only MelodyLead can skip it. Arpeggio is never enabled automatically: it appears only when `arpeggioEnabled=true`, whatever the composition style.
:::

## Phase 1: Structure Building

The generator selects the song structure from the target duration, an explicit form, a Blueprint section flow, or `StructurePattern`. It can then insert call sections, overlay Blueprint slot properties, apply Behavioral Loop exit patterns, and apply an **Energy Curve** (GradualBuild, FrontLoaded, WavePattern, or SteadyState) to shape the overall dynamic arc.

### Structure Patterns

| Pattern | Bars | Sections |
|---------|------|----------|
| StandardPop | 24 | A(8)-B(8)-Chorus(8) |
| BuildUp | 28 | Intro(4)-A(8)-B(8)-Chorus(8) |
| DirectChorus | 16 | A(8)-Chorus(8) |
| RepeatChorus | 32 | A(8)-B(8)-Chorus(8)-Chorus(8) |
| FullPop | 56 | Intro-A-B-Chorus-A-B-Chorus-Outro |
| FullWithBridge | 48 | Intro-A-B-Chorus-Bridge-Chorus-Outro |
| Ballad | 60 | Intro(8)-A-B-Chorus-Interlude-B-Chorus-Outro |
| ExtendedFull | 88 | Full form with bridge and extended sections |

### Section Types

Each section has properties that affect generation:

```cpp
struct Section {
    SectionType type;         // Intro, A, B, Chorus, Bridge, Interlude, Outro, Chant, MixBreak, Drop
    uint8_t bars;             // Length in bars
    VocalDensity vocal_density;    // Full, Sparse, None
    BackingDensity backing_density; // Normal, Thin, Thick
};
```

## Phase 2: Track Generation

### Vocal Track (MelodyLead only)

The most complex generator with phrase caching and template-driven design. When **melody overrides** are specified, parameters such as max leap, syncopation probability, phrase length, long note ratio, chorus register shift, hook repetition, and leading tone behavior take precedence over template defaults:

<DocFigure name="pipeline-vocal-phrase-cache" />

**Melody Templates:**

| Template | Characteristics |
|----------|-----------------|
| Auto | Auto-select based on style and section |
| PlateauTalk | Talk-like, narrow-range pop |
| RunUpTarget | Anime high-energy, dramatic pop: run up to a target note |
| DownResolve | B-section, pre-chorus: descending resolution |
| HookRepeat | Short-form, K-POP: short repeating hook |
| SparseAnchor | Sparse, sustained ballad phrasing |
| CallResponse | Duet style: call and response |
| JumpAccent | Emotional peaks: jump accent |

::: info Auto Template Selection
When `melodyTemplate=Auto`, the template is resolved per section from a style × section override table, falling back to the section default. For example, Anime style has no chorus override, so it takes the section default and always uses HookRepeat there; Rock and PowerfulShout are overridden to JumpAccent in the chorus.
:::

**Vocal Attitudes:**

| Attitude | Characteristics |
|----------|-----------------|
| Clean | Chord tones only, on-beat rhythms |
| Expressive | Tensions with delayed resolution, slight timing deviation |
| Raw | Non-chord tones, phrase boundary breaking |

The attitude is not a pass applied to a finished melody. It is read while each pitch is chosen, where it decides which pitch classes are even candidates — Clean restricts the set to chord tones, Expressive adds 7ths, 9ths and 11ths on notes long enough to carry them, and Raw opens the whole scale. Notes shorter than an eighth are treated as Clean regardless. The only thing applied afterwards is expression depth: scoop, fall, vibrato and portamento amounts.

::: warning Attitude Restrictions
Not all attitudes are available for every style preset. Use `midisketch_style_preset_allowed_attitudes()` to check which attitudes are permitted. Specifying an unsupported attitude results in a validation error.
:::

### Aux Track

Generates sub-melody support. When a vocal exists, Aux adapts to it. In `BackgroundMotif`, Traditional/MelodyDriven run Aux before Motif without a vocal reference, while RhythmSync keeps Motif before Aux; `SynthDriven` skips Aux:

<DocFigure name="pipeline-aux-selection" />

**Aux Functions:**

| Function | Purpose |
|----------|---------|
| PulseLoop | Addictive repetition pattern |
| TargetHint | Hints at melody destination |
| GrooveAccent | Physical groove accent |
| PhraseTail | Phrase ending fill |
| EmotionalPad | Emotional pad/floor |
| Unison | Vocal unison doubling |
| MelodicHook | Melodic hook riff |
| MotifCounter | Counter melody (contrary motion) |
| SustainPad | Whole-note chord tone pad |

Which function runs in a section is named up front by the Blueprint's aux profile — `intro_function` for the intro, `verse_function` for A, B and Bridge, `chorus_function` for the chorus — rather than being picked from the melody at generation time. Three cases override that name: an intro places an echo of the cached chorus motif instead of running an aux function at all; an UltraVocaloid vocal at full density forces GrooveAccent in the chorus; and a chorus Unison is downgraded to MelodicHook when the vocal's rhythm is too unstable to double cleanly.

Register and density are set per section against the vocal's own tessitura, and the chorus is the tight one, not the loose one:

| Section | Offset from vocal centre | Density |
|---------|--------------------------|---------|
| Intro | 0 (6-semitone span) | 1.0x |
| A / B / Bridge | -12 (an octave below) | 0.8x |
| Chorus, pad functions | -12 | 0.8x |
| Chorus, rhythmic functions | -6 | 0.95x |

So the verses sit an octave under the vocal and thin out, while a rhythmic chorus aux climbs to within a tritone of the vocal centre and plays denser. The window is an absolute semitone width around that centre, clamped to the aux range G3-C6 and capped further by the profile's `range_ceiling` relative to the vocal's top note. Velocity ratios scale a fixed base of 80 — except Unison and the harmony line, which scale the vocal note's own velocity.

### Bass Generation

Bass provides the harmonic foundation, adapting to vocal when present:

<DocFigure name="pipeline-bass-decisions" />

**Bass Patterns:**

The bass system supports 17 pattern types (BassPattern). The active pattern is selected automatically based on mood and section, or can be influenced per-section via `bass_style_hint` in the Blueprint's SectionSlot configuration (0=auto, 1-17 maps to BassPattern+1). Section type selects the pattern and the velocity — it does not transpose the bass by octave; the register only moves to keep the root inside the bass range.

Peak handling is a second step after selection. `PeakLevel::Medium` promotes the chosen pattern one density level and `PeakLevel::Max` promotes it twice. This also applies when `bass_style_hint` explicitly names the base pattern; the hint chooses the starting pattern, not whether a peak is allowed to thicken it.

Common patterns:
- **WholeNote**: sustained root, half-note motion (ballad, intro)
- **RootFifth**: root-fifth alternation, the classic pop baseline
- **Syncopated**: off-beat accents for pre-chorus lift
- **Driving**: eighth-note pulse with an approach note into the next bar (chorus)
- **Walking**: quarter-note scale walk (jazz, city pop)
- **Tresillo / SubBass808 / SlapPop**: genre-specific (Latin, trap, funk)

### Chord Generation

Chord voicing coordinates with bass and vocal:

```cpp
// The bass's pitch classes on beats 1 and 3 become a mask the voicing generator
// avoids doubling or clashing with (src/track/chord/bass_coordination.h).
uint16_t bassMask = buildBassPitchMask(song_.bass(), barStart, barEnd);
VoicingType type = selectVoicingType(section, mood, bassHasRoot, rng);
VoicedChord v = selectVoicing(root, chord, prevVoicing, hasPrev, type, bassMask, rng);
```

**Voice Leading Algorithm:**
1. Generate candidates from the section's voicing type (close, open/Drop2, Drop3, spread, rootless)
2. Score movement from the previous voicing, weighting the bass and soprano twice as heavily as the inner voices
3. Reward common tone retention
4. Subtract a mood-dependent penalty for parallel fifths and octaves — strict for the sophisticated moods, lenient for the energetic ones

::: info Rootless Voicing
Rootless voicing is an occasional colour, not an automatic response to the bass. It needs three things at once: the bass carrying the root, a sophisticated mood (CityPop, Nostalgic, Dramatic or ModernPop), and a probability roll — 20% in B sections, 30% in Chorus, 25% in Bridge. A/Intro/Interlude/Outro always use close voicing. What the bass does always influence is doubling: the chord track avoids the pitch classes the bass sounds on beats 1 and 3.
:::

### Guitar Track

Generates accompaniment guitar patterns on a dedicated MIDI channel. Controlled by `guitarEnabled` (default `true` in both the JS and C++ APIs). The guitar track is influenced by the Blueprint's `guitar_below_vocal` constraint (keeps guitar voicings below the vocal register to avoid masking) and by the per-section `guitar_style_hint`. Guitar generation occurs after chord generation, allowing it to complement the existing harmonic voicing.

Per-section guitar style can be influenced via `guitar_style_hint` (0-7) in the Blueprint's SectionSlot configuration, where 0 selects automatically based on mood and energy.

Some moods deliberately have no guitar (EnergeticDance, Sentimental, Chill, DarkPop, Dramatic, ModernPop, ElectroPop, Synthwave, FutureBass, Trap). On those, the guitar track is skipped entirely even with `guitarEnabled: true`.

### Drums Generation

Drum patterns are selected based on mood:

| Style | Characteristics | Used By |
|-------|-----------------|---------|
| Sparse | Half-time feel, minimal | EmotionalPop, Chill, Ballad, Lofi |
| Standard | 8th hi-hat, 2&4 snare | StraightPop, Sentimental, Nostalgic, CityPop, RnBNeoSoul |
| FourOnFloor | 4-on-floor kick | EnergeticDance, DarkPop, ElectroPop |
| Upbeat | Syncopated, driving | BrightUpbeat, MidPop, ModernPop, IdolPop, Anthem |
| Rock | Ride cymbal, crash accents | LightRock, Dramatic |
| Synth | Tight 16th hi-hat | AnimeHighEnergy, Synthwave, FutureBass |
| Trap | Half-time snare on 3, hi-hat rolls | Trap |
| Latin | Dembow kick-snare figure | LatinPop |

Blueprints carry a `euclidean_drums_percent` field and the drum generator samples it when choosing the Euclidean branch. The field is currently classified as **UnprovenLiveness** in the Blueprint accounting, so its audible effect is not guaranteed; treat it as reserved rather than as a reliable tuning control. Per-section `drum_role` (Full, Ambient, Minimal, FXOnly) does shape drum behavior across the arrangement.

**Fill Generation:**
- Tom descend/ascend patterns
- Snare rolls
- Combination fills at section transitions

For a `Dramatic` or `DrumHit` chorus drop, the final drop zone also truncates the kit. If that cut removes an entry crash, the post-processor restores the crash at the next section boundary so the chorus still has an arrival marker.

### Motif Track

Primary melodic element in BackgroundMotif, and also generated under SynthDriven, under the RhythmSync paradigm, and whenever a Blueprint's section flow asks for it. Vocal is not a background layer in `BackgroundMotif`; it is skipped. When **motif overrides** are specified, parameters such as motif length (0=auto, 1/2/4 **bars**), note count (0=auto, 3-8), motion (0-5 via API, including Ostinato), register (0=auto, 1=low, 2=high), and rhythm density (0=Sparse, 1=Medium, 2=Driving) take precedence over style defaults:

```cpp
MotifParams params {
    .length = MotifLength::Bars2,              // Bars1, Bars2 or Bars4
    .rhythm_density = MotifRhythmDensity::Medium,
    .motion = MotifMotion::Stepwise,           // 0=Stepwise .. 5=Ostinato
    .repeat_scope = MotifRepeatScope::FullSong // FullSong or Section
};
```

### Arpeggio Track

Generated whenever `arpeggioEnabled=true`, in any composition style; it is the lead voice in SynthDriven.

```cpp
ArpeggioParams params {
    .pattern = ArpeggioPattern::Auto,   // 255 = use the mood's default pattern
    .speed = ArpeggioSpeed::Auto,       // 255 = use the style default speed
    .octave_range = 2,                  // 1-3
    .gate = -1.0f,                      // Note length ratio; -1 = style default
    .base_velocity = 90
};
```

### SE Track

Generates section markers and sound effect cues:
- Section boundary markers (text events)
- Call timing hints (when the call system is active via `callSetting`)
- Intro chant markers

## Phase 3: Polish

### Transition Dynamics

Automatically applies energy transitions:

<DocFigure name="pipeline-transition-dynamics" />

Transition dynamics work from an integer energy level per section — Intro 1, A 2, B 3, Chorus 4, Bridge 2, Interlude 1, Outro 2, Chant 1, MixBreak 4, Drop 4. Two adjacent sections at the same level get nothing: a chorus followed by another chorus is flat, not a step up. B into Chorus is the one special case, a full-section suppress-then-crescendo; every other pair gets a ramp across the last bar only.

**Section Energy Multipliers:**

Separately from the transition ramps, each section scales note velocity as it is generated:

| Section | Multiplier |
|---------|-----------|
| Chant | 0.55 |
| Intro / A / Bridge / Interlude | 0.70 |
| Outro | 0.75 |
| B | 0.85 |
| Chorus / MixBreak / Drop | 1.10 |

### Humanization

Adds natural variation to timing and velocity:

```cpp
void applyHumanization(Song& song, float intensity) {
    // Timing: micro-offsets on drums and bass
    // Velocity: random +/- value on pitched tracks (drums excluded)
}
```

::: tip What humanization actually touches
Velocity humanization is applied to the pitched tracks (vocal, chord, bass, motif, arpeggio, aux, guitar) and never to drums, which keeps the kit's dynamics deliberate. Micro-timing is the opposite: it is applied to **drums and bass** to create the groove pocket, while the vocal is deliberately left on the grid. Micro-timing is not gated on `humanize` either — any `driveFeel` other than 50 produces it on its own.
:::

### Cross-Track Voice Limiting and Final Repair

After track generation, sections with `max_moving_voices` cap how many pitched tracks may change between adjacent bars. The coordinator freezes lower-priority moving tracks in this order (highest to lowest): **Vocal → Guitar → Motif → Aux → Chord → Arpeggio → Bass**. Drums and SE are outside the cap. A frozen bar copies the previous bar, shifts it into place, and then re-quantizes pitches against the new chord and the other tracks. Chord-boundary policies may split or shorten notes; the generator's motif phrase-tail cutoff is applied during this copy/quantization pass, and guitar rake order is restored after pitch resolution so the result remains in string order with a playable fingering.

The final tail gate handles a short accidental overlap by trimming the earlier note at the later onset when the overlap is no longer than a quarter note and the remainder either is at least a 32nd note or retains at least seven eighths of an already-short note. Longer overlaps or a shorter remainder follow the ordinary clash rules. See the [Harmony](/docs/harmony) reference for the shared chord-aware collision policy.

In RhythmSync, the post-vocal rewrite re-registers the changed vocal and motif, then rechecks accompaniment and motif-vocal dissonance. That repair covers clashes; it is not a second pass that revalidates every bass doubling or register constraint.

## MIDI Output

Finally, the Song is converted to SMF Type 1:

<DocFigure name="pipeline-midi-output" />

**Track Mapping:**

| Track | Channel | Program |
|-------|---------|---------|
| Vocal | 0 | 0 (Piano) |
| Chord | 1 | 4 (E.Piano) |
| Bass | 2 | 33 (E.Bass) |
| Motif | 3 | 81 (Synth Lead) |
| Arpeggio | 4 | 81 (Saw Lead) |
| Aux | 5 | 89 (Warm Pad) |
| Guitar | 6 | 27 (E.Guitar clean) |
| Drums | 9 | GM Drums |
| SE | 15 | Text events |

The programs above are per-track fallbacks; the actual GM program is chosen per mood (`getMoodPrograms`), so the instruments you hear vary with the mood preset.

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
