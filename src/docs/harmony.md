# Harmony & Chord Progressions

This document explains the harmonic system in [MIDI Sketch](https://github.com/libraz/midi-sketch).

::: info Note
This page uses music theory terminology. These concepts are handled automatically by the system, but understanding them allows for more precise parameter selection.
:::

::: tip New to these terms?
Degree, cadence, secondary dominant, tritone substitution and the rest are taught from scratch — with playable examples — in the course chapters [Chord Progressions](/docs/course/progressions) and [Harmony & Color](/docs/course/harmony-color).
:::

::: tip New to music theory?
If chords and progressions are new to you, the [Course](/docs/course/chords) builds them up from scratch with playable notation examples — start there, then come back to this reference.
:::

## Chord Progressions

MIDI Sketch includes 22 built-in chord progressions, covering common pop music patterns.

::: tip What is a Chord Progression?
A chord progression is the sequence of chords that forms the harmonic backbone of a song. It's what gives music its sense of movement and emotion. The same melody can feel completely different over different chord progressions.
:::

### Four-Chord Progressions (IDs 0-19)

<DocFigure name="harmony-four-chord-progressions" />

Pass the ID as `chordProgressionId`.

| ID | Name | Degrees | Character |
|----|------|---------|-----------|
| 0 | FourChordPop | I-V-vi-IV | The plain four-chord loop, and the default |
| 1 | Pop1 | I-vi-IV-V | Fifties turnaround; V hands back to the top |
| 2 | Axis | vi-IV-I-V | Opens on the relative minor, so it reads dark |
| 3 | Pop2 | IV-I-V-vi | Starts on the subdominant, ends on a deceptive V-vi |
| 4 | Classic | I-IV-V-I | Textbook I-IV-V closed by an authentic cadence |
| 5 | Pop3 | I-IV-vi-V | Bright opening, dips to vi, leaves V hanging |
| 6 | Oudou | IV-V-iii-vi | The Royal Road, a J-pop staple |
| 7 | Minor1 | vi-V-IV-V | Rocks between IV and V around a minor tonic; never settles |
| 8 | Minor2 | vi-IV-V-I | The same four chords as Axis, rotated to end V-I |
| 9 | Pop4 | I-V-iii-IV | FourChordPop with iii in place of vi - lighter, less settled |
| 10 | Pop5 | I-iii-IV-V | Steps up the scale to a V that pushes back to I |
| 11 | Rock1 | I-bVII-IV-I | Mixolydian bVII; rock and blues |
| 12 | Rock2 | I-IV-bVII-I | The same bVII colour, approached through IV |
| 13 | Extended4 | I-V-vi-iii | The Pachelbel opening, stopped at iii |
| 14 | Minor3 | vi-I-V-IV | Minor opening, then three major chords descending |
| 15 | AeolianPop | vi-bVI-bVII-I | Borrowed bVI and bVII rising into the tonic |
| 16 | AnimeHighEnergy1 | vi-iii-IV-I | Minor opening driving to a bright I |
| 17 | JazzPop | ii-V-I-vi | The ii-V-I turnaround, reopened on vi |
| 18 | AnimeHighEnergy2 | vi-ii-V-I | A full circle-of-fifths descent onto the tonic |
| 19 | CityPop | I-vi-ii-V | A ii-V folded into a pop loop; city-pop groove |

::: details Understanding These Progressions
- **FourChordPop (I-V-vi-IV)**: The most common loop in modern pop. Familiar enough that almost any melody sits on it comfortably.
- **Axis (vi-IV-I-V)**: The same chord set starting on the minor, which colours the whole loop melancholic. Common in emotional ballads.
- **Minor2 (vi-IV-V-I)**: The V→I at the end is an authentic cadence, so a loop that begins in minor territory arrives somewhere bright.
- **Oudou (IV-V-iii-vi)**: The Royal Road progression. Starting away from the tonic and ending on vi keeps it perpetually unresolved.
- **Rock1 (I-bVII-IV-I)**: bVII is borrowed from the parallel minor and gives the Mixolydian, rock-and-blues flavour.
- **AeolianPop (vi-bVI-bVII-I)**: Two borrowed chords step upward into the tonic - the loudest modal-interchange move in the set.
:::

### Five-Chord Progressions (IDs 20-21)

| ID | Name | Degrees | Character |
|----|------|---------|-----------|
| 20 | Extended5 | I-V-vi-iii-IV | Pachelbel-derived, extended |
| 21 | NeapolitanPop | vi-iv-bII-V-I | Borrowed iv and Neapolitan bII into an authentic cadence |

### Full Progression List

All 22 progressions are listed above: twenty four-chord patterns and two five-chord patterns. Between them they cover:

- Diatonic pop loops, bright and dark
- Modal-interchange colour (bVI, bVII, iv, bII)
- Rock patterns built on bVII
- Jazz-leaning ii-V turnarounds

## Degree System

::: info What are Chord Degrees?
Chord degrees (I, ii, iii, IV, V, vi, vii) indicate the position of a chord within a key. Uppercase = major chord, lowercase = minor chord. For example, in C major: I = C major, ii = D minor, V = G major.
:::

Chord degrees are plain integers rather than a named enum type, so a progression is simply an array of degree numbers:

| Value | Degree | Role | Example in C major |
|-------|--------|------|--------------------|
| 0 | I | Tonic | C |
| 1 | ii | Supertonic | Dm |
| 2 | iii | Mediant | Em |
| 3 | IV | Subdominant | F |
| 4 | V | Dominant | G |
| 5 | vi | Submediant | Am |
| 6 | vii° | Leading tone | Bdim |
| 8 | bVI | Borrowed from the parallel minor | Ab |
| 10 | bVII | Borrowed from the parallel minor | Bb |
| 11 | bIII | Borrowed from the parallel minor | Eb |
| 12 | iv | Borrowed minor subdominant | Fm |
| 13 | bII | Neapolitan | Db |
| 14 | #IVdim | Chromatic passing chord | F#dim |

Values 7 and 9 are unused. `bII` is the Neapolitan; `iv` gives the minor plagal cadence iv-I. These degrees are not decorative: AeolianPop (15) emits bVI and bVII, and NeapolitanPop (21) emits iv and bII, so anything parsing degree output has to handle values above 6.

## Chord Quality

::: info Major vs Minor
- **Major chords** sound bright, happy, and stable (C, F, G)
- **Minor chords** sound darker, sadder, and more emotional (Dm, Em, Am)
- **Diminished chords** sound tense and unstable (rarely used in pop)
:::

Quality follows from the degree alone - the key and the mode are never consulted, and there is no augmented quality:

<DocFigure name="harmony-degree-quality" />

```cpp
ChordQuality getChordQuality(int8_t degree) {
    // 6 = vii, 14 = #IVdim
    if (degree == 6 || degree == 14) return ChordQuality::Diminished;
    // 1 = ii, 2 = iii, 5 = vi, 12 = borrowed iv
    if (degree == 1 || degree == 2 || degree == 5 || degree == 12) return ChordQuality::Minor;
    // I, IV, V and the borrowed bVI, bVII, bIII, bII
    return ChordQuality::Major;
}
```

The borrowed `iv` is minor - that minor third is the whole reason it is borrowed - while bVI, bVII, bIII and bII are all major triads.

## Chord Extensions

Extensions add color to basic triads:

::: tip When to Use Extensions
- **Sus chords**: Create tension before resolution. Great for anticipation moments.
- **7th chords**: Add sophistication and jazz flavor. Common in city pop and R&B.
- **9th chords**: Rich, complex sound. Use sparingly for maximum impact.

Higher extension probabilities work well for city pop, jazz, and R&B styles. Keep them low for simple pop and rock.
:::

### Extension Types

| Type | Notes Added | Example (C) |
|------|-------------|-------------|
| Triad | Root, 3rd, 5th | C-E-G |
| Sus2 | Root, 2nd, 5th | C-D-G |
| Sus4 | Root, 4th, 5th | C-F-G |
| 7th | + 7th | C-E-G-B/Bb |
| add9 | + 9th (no 7th) | C-E-G-D |
| 9th | + 7th + 9th | C-E-G-B-D (maj9) / C-E-G-Bb-D (dom9) / C-Eb-G-Bb-D (min9) |

### Extension Application Rules

<DocFigure name="harmony-extension-rules" />

The three families are tested in order - sus, then 7th, then 9th - and the first test that passes returns, so a chord never carries two extensions. Each family rolls its own die, so raising one probability does not starve the others.

- **Sus** is a bar-position rule: the first or the next-to-last bar of a section, and never on a minor chord. Sus4 is chosen 70 % of the time, Sus2 the rest.
- **7th** applies in B and Chorus sections, or on V anywhere; on V the probability is doubled.
- **9th** applies to any chord in a Chorus, or to V inside a B section. iii falls back to Min7, because its diatonic 9th would be a flat 9th above the root.

::: info Chorus chords are decided beforehand
Whenever 7ths are enabled, a chorus is reharmonised before these tests run: V becomes Dom7, minor chords Min7, I becomes Maj7 and everything else gets add9. The rules above then only govern what happens outside a chorus, or inside one with 7ths disabled. The same pass may substitute ii for IV in an A section, unless that IV resolves to V or I or ii is already an adjacent chord.
:::

### Configuration

```cpp
struct ChordExtensionParams {
    bool enable_sus = false;
    bool enable_7th = false;
    bool enable_9th = false;
    bool tritone_sub = false;              // Tritone substitution (V7 -> bII7)
    float sus_probability = 0.2f;          // 0.0-1.0 (20% chance)
    float seventh_probability = 0.15f;     // 0.0-1.0 (15% chance)
    float ninth_probability = 0.25f;       // 0.0-1.0 (25% chance)
    float tritone_sub_probability = 0.5f;  // 0.0-1.0 (50% chance when enabled)
};
```

In the JS `SongConfig`, these map to `chordExtSus` / `chordExt7th` / `chordExt9th` / `chordExtTritoneSub` and `chordExtSusProb` / `chordExt7thProb` / `chordExt9thProb` / `chordExtTritoneSubProb` (all probabilities 0.0-1.0).

::: info Mood-Dependent Probability Auto-Adjustment
When `chordExtProbExplicit=false` (default), the mood automatically adjusts chord extension probabilities to match the style. Set `chordExtProbExplicit=true` to manually control all extension probabilities.
:::

## Voice Leading

::: info What is Voice Leading?
Voice leading is how individual notes move from one chord to the next. Good voice leading creates smooth, connected chord transitions. Poor voice leading sounds choppy and disconnected. MIDI Sketch automatically applies optimized voice leading to all generated chord progressions.
:::

### Principles

1. **Minimize movement**: Each voice moves by smallest interval
2. **Common tones**: Retain shared notes between chords
3. **Parallel fifths/octaves**: penalised, not forbidden. The penalty is mood-scaled - heavy for ballad and dramatic moods, light for dance and idol moods where parallel motion is idiomatic.
4. **Smooth bass**: Stepwise or small leaps preferred

### Algorithm

```cpp
VoicedChord selectVoicing(const VoicedChord& prev, const Chord& next, Mood mood) {
    auto candidates = generateVoicings(next);

    // Higher is better. Common tones dominate; distance is weighted so the
    // bass and soprano count double. Parallel 5ths/octaves cost a mood-
    // dependent penalty rather than being forbidden outright.
    int score = typeBonus(candidate)
              + countCommonTones(prev, candidate) * 100
              + (hasParallelFifthsOrOctaves(prev, candidate) ? parallelPenalty(mood) : 0)
              - weightedVoicingDistance(prev, candidate)
              + repetitionPenalty(candidate, prev);

    // Ties are broken randomly, so repeated bars do not lock into one voicing.
    return pickRandomlyAmongBest(candidates, score);
}
```

There is no per-voice leap term. `weightedVoicingDistance` is a per-voice sum in which the bass and the soprano count double and the inner voices count once. A common tone is worth 100, which outweighs several semitones of movement, so retaining shared notes is the strongest single force. A voicing repeated three or more times in a row costs 50 per extra repeat.

### Voicing Types

<DocFigure name="harmony-voicing-types" />

::: details Voicing Explained
- **Close Position**: All notes within one octave. Sounds compact and direct. Common in pop.
- **Open Position**: Notes spread across multiple octaves. Sounds spacious and full. Great for ballads.
- **Rootless**: Omits the root note (bass plays it). Creates clarity and avoids muddiness. Common arranging technique.
:::

## Bass-Chord Coordination

The chord track uses bass analysis to avoid doubling:

```cpp
struct BassAnalysis {
    bool hasRootOnBeat1;   // Root on downbeat
    bool hasRootOnBeat3;   // Root on beat 3
    bool hasFifth;         // Fifth present
    Tick accentTicks[];    // Strong beat positions
};

// A bass root makes rootless voicing *eligible*; it is then gated by mood
// and section, and chosen probabilistically (20-30% in B/Chorus/Bridge).
if (bassAnalysis.hasRootOnBeat1 && moodSupportsRootless(mood) && rollProbability(sectionRate)) {
    voicing = generateRootlessVoicing(chord);
}
```

Rootless voicing is reserved for the jazz-leaning moods (CityPop, Nostalgic, Dramatic, ModernPop) and only in B, Chorus and Bridge. Verses, intros, outros and ballads always keep the root.

## Secondary Dominants

Secondary dominants are dominant chords (V7) that resolve to diatonic chords other than the tonic. They create stronger harmonic pull and add harmonic variety.

::: tip What are Secondary Dominants?
Instead of going directly from IV to V, inserting V/V (a dominant chord that resolves to V) creates a stronger sense of motion. For example, in C major: F → D7 → G is more compelling than F → G because D7 (V/V) "wants to" resolve to G.
:::

### Common Secondary Dominants

| Symbol | Resolves To | Example in C |
|--------|-------------|--------------|
| V/V | V (dominant) | D7 → G |
| V/vi | vi (relative minor) | E7 → Am |
| V/ii | ii (supertonic) | A7 → Dm |
| V/IV | IV (subdominant) | C7 → F |

### Automatic Insertion

MIDI Sketch inserts secondary dominants under two rules:

- **Entering a chorus (deterministic)**: when the first chord of a Chorus is ii, IV, V or vi, its dominant is placed in the last half-bar of the preceding section.
- **Within a section (probabilistic)**: the per-bar chance is the section's tension times 0.25. Only Chorus (0.75), Pre-chorus B (0.65), Bridge (0.60) and MixBreak (0.55) clear the 0.5 tension threshold; verses, intros and outros never receive one.

Two limits keep the density pop-appropriate: at least two bars between insertions, and at most `bars / 8` per section (one per eight bars). Only ii, IV, V and vi are valid targets; the inserted chord is always a dominant 7th.

```cpp
// Example: V/V insertion before V
// Original: IV → V → I
// Enhanced: IV → V/V → V → I
```

### Tritone Substitution

Tritone substitution replaces a V7 chord with a bII7 chord (a dominant 7th built a tritone away). This creates chromatic bass motion and adds harmonic sophistication.

::: details Configuration
Tritone substitution is available via:
- **SongConfig (JS)**: `chordExtTritoneSub` (enable, default `false`) and `chordExtTritoneSubProb` (probability 0.0-1.0, default `0.5`)
- **AccompanimentConfig (JS)**: `chordExtTritoneSub` (enable) and `chordExtTritoneSubProb` (probability **0.0-1.0**, default `0.5`)
- **C++ SongConfig**: `chord_extension.tritone_sub` and `chord_extension.tritone_sub_probability` (0.0-1.0)
:::

### Mood-Dependent Chord Extension Probabilities

When `chordExtProbExplicit=false`, the mood automatically adjusts chord extension probabilities to match the style:

| Mood | 7th Prob | 9th Prob | Sus Prob | Notes |
|------|---------|---------|---------|-------|
| CityPop | 40% | 25% | - | Jazz-influenced voicings |
| RnBNeoSoul | 50% | 35% | - | Rich extended harmonies |
| Ballad/Sentimental | 30% | - | 25% | Expressive sus resolutions |
| Nostalgic/Chill | 25% | - | - | Gentle extensions |
| Lofi | 40% | 30% | - | Warm, lo-fi character |

::: tip Explicit vs Automatic
Set `chordExtProbExplicit=true` to manually control all extension probabilities, or leave it `false` to let the mood system choose appropriate values automatically.
:::

### ChordEvent in EventData

The `EventData` JSON output includes a `chords` array with per-section chord information, including secondary-dominant annotations, so external tools can visualise and analyse the harmonic structure.

## Key Modulation

::: tip Why Modulate?
Key modulation (changing the key mid-song) is a powerful technique to add excitement and emotional lift. A modulation up by 1-2 semitones in the final chorus creates a feeling of "taking it to the next level" - a classic technique used in countless hit songs.
:::

### Modulation Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| `modulationTiming` | 0-4 | When to modulate (0=disabled) |
| `modulationSemitones` | 1-4 | Amount to modulate (required when timing is not 0) |

::: warning
When `modulationTiming` is non-zero, `modulationSemitones` must be set to 1-4. The vocal high range is automatically adjusted to prevent the final sections from exceeding the vocal range after transposition.
:::

### Modulation Points

The amount always comes from `modulationSemitones` (1-4; the C++ default when unset is 2) and never varies by song structure. The position is chosen by `modulationTiming`:

| `modulationTiming` | Position |
|---|---|
| 1 LastChorus | Start of the final chorus (most common) |
| 2 AfterBridge | First chorus that follows a bridge; falls back to the final chorus |
| 3 EachChorus | Falls back to a single final-chorus lift and emits a warning |
| 4 Random | A randomly selected chorus (seed-determined) |

The `DirectChorus` and `ShortForm` structures never modulate - they have no meaningful modulation point.

### Implementation

```cpp
struct Modulation {
    Tick tick;           // When to modulate
    int8_t semitones;    // How much (1-4 semitones)
};

// Applied during MIDI output
void MidiWriter::writeTrack(MidiTrack& track, Modulation mod) {
    for (auto& note : track.notes) {
        if (note.tick >= mod.tick) {
            note.pitch += mod.semitones;
        }
    }
}
```

## Chord Tone Analysis

Used for melody generation to determine note consonance:

```cpp
bool isChordTone(uint8_t pitch, Chord chord) {
    uint8_t pitchClass = pitch % 12;

    // Check against chord pitch classes
    for (auto& chordPitch : chord.pitchClasses()) {
        if (pitchClass == chordPitch) return true;
    }
    return false;
}

uint8_t nearestChordTone(uint8_t pitch, Chord chord) {
    // Find closest chord tone by semitone distance
    int minDist = 12;
    uint8_t nearest = pitch;

    for (auto& target : chord.pitches()) {
        int dist = abs(pitch - target);
        if (dist < minDist) {
            minDist = dist;
            nearest = target;
        }
    }
    return nearest;
}
```

## Tension Notes

::: info What are Tension Notes?
Tension notes are notes that don't belong to the current chord but are used intentionally to create musical interest. They create a sense of "wanting to resolve" - like a musical question waiting for an answer. Used skillfully, they make melodies more expressive and emotionally compelling.
:::

Tension availability is decided per chord degree, not globally - a tension that would clash with the chord's third or produce a b9 is excluded:

| Degree | Available tensions |
|---|---|
| I | 9th, 13th (11th excluded: #4 against the major 3rd) |
| ii | 9th, 11th, 13th |
| iii | 11th, b13th (9th excluded: it would be a b9) |
| IV | 9th, #11th, 13th |
| V | 9th, 13th (11th only over sus4) |
| vi | 9th, 11th (13th excluded: it would be a b13) |
| vii° | 11th only |

| Tension | Interval above the root | Typical resolution |
|---|---|---|
| 9th | Major 2nd | Down to the root |
| 11th | Perfect 4th | Down to the 3rd |
| #11 | Aug 4th | Up to the 5th |
| 13th | Major 6th | Down to the 5th |
| b13 | Minor 6th | Down to the 5th |

### Usage by Vocal Attitude

| Attitude | Pitch pool | Musical effect |
|----------|------------|----------------|
| Clean | Chord tones only | Safe, consonant, easy to sing |
| Expressive | Chord tones plus the 7th, 9th and 11th above the root, kept inside the key. Added only on longer notes - notes shorter than an eighth fall back to chord tones, and `tensionUsage` sets how long a note must be | Colourful, emotional, expressive |
| Raw | All seven diatonic scale tones, chord tone or not | Edgy, unpredictable, intense |

::: info Note duration, not beat position
Tension is gated by how long a note is, not by where it falls in the bar. A short note is always pushed back onto a chord tone regardless of attitude, because a passing dissonance that is over quickly is safe while a sustained one is not.
:::

::: info Where beat position matters
Beat position governs a different pass. `MelodicEmbellisher` classifies beats 1 and 3 as Strong, beats 2 and 4 as Medium, off-beat eighths as Weak, and sixteenth subdivisions as VeryWeak. Passing and neighbour tones require a non-Strong position; appoggiaturas and suspensions are accented Strong-beat figures that resolve by step.
:::

::: tip Choosing Vocal Attitude
- **Clean**: Best for simple pop, children's songs, and when singability is important
- **Expressive**: Best for ballads, R&B, city pop - adds emotional depth
- **Raw**: Best for rock, alternative, experimental - creates tension and edge
:::

---

## Harmony-Melody Integration

The vocal generation system uses harmony information to shape melody candidates.

### HarmonyContext

The `HarmonyContext` system tracks generated tracks and filters many unsafe pitch candidates:

<DocFigure name="harmony-context-collision" />

::: info Why HarmonyContext Matters
Without HarmonyContext, melodies might clash with accompaniment. For example, if the bass plays E and the melody plays F simultaneously, the result is a harsh minor 2nd dissonance. HarmonyContext checks active notes before suggesting melody pitches and filters many such clashes; later passes and intentional figures still depend on musical context.
:::

### What Counts as a Collision

`HarmonyContext` answers a single yes-or-no question. It asks `TrackCollisionDetector` whether a proposed pitch clashes with anything already sounding and gets back one boolean, with no ranking. The seven registered pitched roles are vocal, bass, chord, motif, aux, arpeggio and guitar; a candidate's own role is excluded, and drums and SE do not participate in pitch collision detection. Generation compares actual semitone distances, so the same pitch-class interval can have different results at different spacings.

| Interval | Generator rule |
|----------|---------|
| Minor 2nd | 1 or 13 semitones: dissonant; brief melodic 1-semitone overlaps may pass |
| Major 2nd | 2 semitones: dissonant; 14 (major 9th) is not, and two tones of the sounding chord are accepted |
| Major 7th | 11, 23 or 35 semitones: dissonant; a registered root–M7 pair on normalized I/IV (degree 0/3) in a Maj7/Maj9 chord is an exception |
| Tritone | 6, 18 or 30 semitones: dissonant unless the chord is V, vii° or an active secondary dominant |
| Other intervals | Minor 7ths, major 9ths and distances of 36 semitones or more pass the base rule |

Brief melodic 1- and 2-semitone overlaps are tolerated only outside sustained chord/guitar roles, when at least one pitch is at or above C4: the overlap limits are 120 ticks for 1 semitone and 240 ticks for 2 semitones, halved on beats 1 and 3. A major 7th involving a bass below C3 remains blocked at 11 semitones; a registered root–M7 pair on normalized I/IV (degree 0/3) in Maj7/Maj9 is exempt only at a spacing of at least 23 semitones. The post-generation analyzer uses a base cutoff above 24 semitones, then applies its own low-bass and registered-extension handling, so it can omit a collision that generation still rejects, such as a 35-semitone major 7th or a 30-semitone tritone. The boolean is a candidate filter and does not guarantee a dissonance-free final mix.

The graded **Mild** and **Severe** levels belong to a different module: the read-only `PianoRollSafety` API described below, which reports severity for display rather than gating generation.

### Chord-Aware Melody Generation

Melody writing is a single pass, not a generate-evaluate-refine cycle. `generateSection` lays out a phrase plan, chooses each pitch note by note against the chord sounding at that tick, adds embellishments, and finally snaps an illegal note in the downbeat window onto a chord tone. A licensed accented dissonance that resolves down by step can remain. `generateSectionWithEvaluation` wraps that pass, running it up to a hundred times per section and choosing between the results.

<DocFigure name="harmony-chord-aware-melody" />

**Note scoring**: while a candidate is being written, a chord tone is worth 16 points, a root or fifth 4 more on top of that, and a scale tone 12. A non-scale tone earns nothing from harmony and survives only if the melodic and rhythmic terms carry it.

**Downbeat rule**: beats 1 and 3 are the only positions measured for chord-tone fit. In the downbeat window, `classifyVocalTone` leaves chord tones and licensed accented dissonances such as descending appoggiaturas or suspensions in place; only illegal pitches are snapped to a chord tone. This grounds the harmony while leaving room for directed melodic tension.

### VocalStyleProfile and Harmony

Each `VocalStyleProfile` configures how the melody interacts with harmony:

| Profile | Chord Tone Preference | Tension Usage | Approach |
|---------|----------------------|---------------|----------|
| **Standard** | High on strong beats | Occasional 9th | Safe, singable |
| **Idol** | Very high | Minimal | Catchy, simple |
| **CityPop** | Medium | Frequent 9th, 13th | Sophisticated |
| **Vocaloid** | Low | Aggressive | Surprising |
| **Ballad** | High | Expressive appoggiaturas | Emotional |

::: tip Style-Harmony Matching
For best results, match your chord extensions to your vocal style:
- **Idol/Standard**: Keep extensions low (sus, occasional 7th)
- **CityPop/Jazz**: Use high extension probabilities (7th, 9th)
- **Vocaloid**: Extensions don't matter much (melody is freer)
:::

### Melody Evaluation: Harmony Component

Harmony enters the melody score as a single ratio. `calcChordToneRatio` looks only at notes starting on beat 1 or beat 3, checks each against the chord sounding at that tick, and returns the share that are chord tones. There is no graded reward or penalty per note, and weak-beat notes are not counted at all - a phrase with no strong-beat notes scores a neutral 0.5.

The finer weighting happens earlier, while the notes are being written rather than when the finished candidate is judged: that is the 16 / 4 / 12 point scale described above. Harmony therefore shapes the melody twice, once as a bias during writing and once as a blunt ratio during selection.

### Hook System and Harmony

The hook system (used in Chorus sections) respects harmony while creating memorable patterns:

| Hook Skeleton | Melodic shape |
|---------------|---------------|
| **Repeat** | Holds one pitch |
| **Ascending** | Three consecutive scale steps upward |
| **AscendDrop** | Arpeggiates up through the triad, then steps back down one degree |
| **LeapReturn** | Leaps up a fifth to a chord tone, then falls to the second degree above the anchor |

Skeleton offsets are scale degrees relative to the phrase anchor, so the same shape adapts to whatever chord is sounding. The engine ships twenty-five skeletons; these four are the most common.

::: info Hook + Chord Sync
Hooks are most effective when they align with chord changes. The `hookIntensity` parameter controls how strongly hooks emphasize chord tones vs. create melodic interest through tensions.
:::

### Piano Roll Safety API

For external tools such as piano roll editors, the [JavaScript `PianoRollSafety` API](/docs/api-js#getpianorollsafetyat-tick-prevpitch) exposes display-only safety, reason flags, and collision details for each MIDI pitch. After a sketch has been generated:

```javascript
const info = sketch.getPianoRollSafetyAt(0)
const safety = info.safety[60]
const reasons = info.reason[60]
```

The colors describe this display API's own safety levels: green is safe, yellow is a warning, and red is dissonant or out of range. Its severity policy is separate from the HarmonyContext generator filter and does not inherit that filter's chord exceptions.

---

## Practical Guide

### Recommended Combinations

| Style | Progression | Extensions | Attitude |
|-------|-------------|------------|----------|
| Simple Pop | FourChordPop (0) | Low (10-20%) | Clean |
| Emotional Ballad | Axis (2) | Medium (30%) | Expressive |
| J-Pop | Oudou (6) | Medium (30%) | Expressive |
| City Pop | CityPop (19) | High (50%+) | Expressive |
| Rock | Rock1 (11) | Low (10%) | Raw |

### Quick Start Recommendations

::: tip For Beginners
Start with these safe defaults:
- **Progression**: FourChordPop (ID 0) - works with almost anything
- **Extensions**: Keep all probabilities under 30%
- **Attitude**: Clean - easiest melodies to work with
- **Modulation**: None or LastChorus +1 semitone

Once you're comfortable, experiment with more complex progressions and higher extension probabilities.
:::
