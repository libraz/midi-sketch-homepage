# Chapter 2 — Chords & Triads

A chord is a *set* of pitch classes sounded together — and like any set, its identity is the membership, not the ordering. This chapter builds chords by stacking thirds (the interval from Chapter 1), classifies them by their internal semitone spacing, and shows how a key's scale degrees generate a fixed palette of chords. These are exactly the objects MidiSketch's progression engine arranges.

## Stacking thirds into a triad

Take a root, add the note a third above, add another third above that. Three notes, sounded together, become harmony.

::: info Chord
A **chord** is two or more notes sounded simultaneously and heard as a single harmonic unit. Where a melody is a sequence of pitches over time, a chord is a *set* of pitches at one instant — the vertical dimension of music.
:::

::: info Triad
A **triad** is the basic three-note chord: a root with a third and a fifth stacked above it. It is the smallest "complete" chord and the default unit of pop harmony — almost everything else is a triad with notes added or rearranged.
:::

::: info Root / third / fifth
The **root** is the note a chord is named after and built from (degree `1` of the chord). The **third** sits two scale steps up and the **fifth** four steps up — the third and fifth above the root. Stacking root + third + fifth is the recipe for every triad.
:::

<ScoreExample example="triadStack" locale="en" />

In set terms, the C major triad is `{0, 4, 7}` as pitch classes (C, E, G measured in semitones from the root). Build the same `{0, 4, 7}` shape on any root and you get that root's major triad — another relative-coordinate pattern, just like scale degrees.

## Quality: the color of a chord

Two chords can share a root yet feel opposite. The difference is the exact semitone spacing inside the stack.

::: info Chord quality
**Chord quality** is the flavor of a triad — **major**, **minor**, or **diminished** — determined solely by the semitone gaps between root, third, and fifth. Major (`4`+`3`) is bright, minor (`3`+`4`) is sad, diminished (`3`+`3`) is tense. Same root, different gap pattern, different emotion.
:::

::: info Chord symbol
A **chord symbol** is the compact text name for a chord: `C` (C major), `Cm` (C minor), `Cdim` (C diminished). The letter is the root; the suffix encodes the quality. It is the human-readable serialization of the pitch-class set.
:::

<ScoreExample example="majMinDim" locale="en" />

The whole emotional palette of pop turns on moving one or two inner notes by a single semitone. As integers: major `{0,4,7}`, minor `{0,3,7}`, diminished `{0,3,6}`. Flipping bit positions, flipping the mood.

## Diatonic chords: the key's palette

Apply the triad recipe to *every* degree of a scale and the key hands you a ready-made set of seven chords that all belong together.

::: info Roman numeral (degree) notation
**Roman numeral notation** names a chord by the scale degree of its root: `I` is the triad on degree `1`, `V` on degree `5`. Uppercase means a major-quality chord, lowercase minor, and `°` diminished. Like scale degrees, it is key-independent — `I` in C is the C chord, `I` in G is the G chord.
:::

<ScoreExample example="diatonicTriads" locale="en" />

These seven — `I ii iii IV V vi vii°` — are the **diatonic** chords of the key, the entire vocabulary most pop draws on. A chord progression is just an ordered choice from this palette (for example `I–V–vi–IV`), and MidiSketch's `chordProgressionId` selects from 22 such patterns. Because the notation is degree-based, one progression transposes to any `key`.

## Inversion and voicing

Since a chord is a set, you can reorder its notes freely without changing *which* chord it is — only how it sits.

::: info Inversion / voicing
An **inversion** reorders a chord's notes so a different member is the lowest (bass) note: `C–E–G` (root position), `E–G–C` (first inversion), `G–C–E` (second inversion) are all C major. The **voicing** is the specific vertical arrangement chosen. The set identity is invariant; the bass note and spacing change the feel and how smoothly chords connect.
:::

<ScoreExample example="inversions" locale="en" />

This invariance is what lets a generator connect chords smoothly: by picking inversions whose notes are closest to the previous chord (voice leading), motion stays minimal. MidiSketch chooses voicings automatically, so you specify *what* chord, not *how* it is stacked.

## Block chords vs. arpeggios

The same pitch-class set can be delivered all at once or spread across time, giving two different textures from one harmony.

::: info Arpeggio
An **arpeggio** is a chord played one note at a time in sequence rather than struck together — the chord "rolled out" along the time axis. The harmony is unchanged; only the rhythmic texture differs. It is the same set, iterated instead of summed.
:::

<ScoreExample example="chordVsArpeggio" locale="en" />

A block chord is a parallel read of the set; an arpeggio is a serial one. MidiSketch's arpeggio track turns block chords into broken patterns automatically — `arpeggioEnabled` toggles it and `arpeggioPattern` (`0`–`7`: Up, Down, UpDown, Random, Pinwheel, PedalRoot, Alberti, BrokenChord) chooses the iteration order.

## MidiSketch mapping

| Concept | Config field | Range / notes |
| --- | --- | --- |
| Diatonic chord palette → progression | `chordProgressionId` | `0`–`21`; picks an ordered sequence of degrees from the key's diatonic chords |
| Chord-quality extensions (7th, 9th, sus, tritone sub) | `chordExtSus`, `chordExt7th`, `chordExt9th`, `chordExtTritoneSub` + probabilities | flags + `0.0`–`1.0` (defaults `0.2 / 0.15 / 0.25 / 0.5`) — see [Harmony](/docs/harmony) |
| Broken-chord texture | `arpeggioEnabled`, `arpeggioPattern` | bool; pattern `0`–`7` |

For the engine-side details behind these fields, see [Harmony & Chord Progressions](/docs/harmony), the [Preset catalog](/docs/presets), and the [JavaScript API](/docs/api-js).

Continue with [Chapter 3 — Chord Progressions](/docs/course/progressions).
