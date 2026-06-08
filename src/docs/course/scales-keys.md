# Chapter 1 — Scales & Keys

Chapter 0 modeled pitch as integers mod 12. A scale is simply a *subset* of those 12 classes, selected by a fixed interval pattern — like a bitmask over the chromatic alphabet. A key then pins that subset to an absolute starting offset. Get these two ideas and chord progressions in Chapter 2 become trivial coordinate transforms.

## A scale is a chosen subset

Of the 12 available pitch classes, most music uses only 7 at a time. Which 7, and the *order of gaps* between them, is the scale.

::: info Scale
A **scale** is an ordered subset of the 12 pitch classes, defined by an interval pattern that repeats every octave. Picking a scale is like choosing the legal symbols for a melody: notes inside it sound "in", notes outside sound "out". The most common pop scale is the major scale.
:::

::: info Major / minor
**Major** and **minor** are the two dominant scale flavors (modes) in pop. Major uses the step pattern 2-2-1-2-2-2-1 semitones and reads as bright/happy; minor rearranges the gaps and reads as dark/sad. They are not different note sets so much as different *gap orderings* from a chosen home.
:::

<ScoreExample example="majorScaleC" locale="en" />

The do-re-mi syllables are positional labels, not pitches. "Do" is wherever the scale starts; the pattern of whole and half steps is what your ear recognizes as "major", regardless of starting note.

## Minor: same notes, different home

A striking consequence of the subset model: two scales can contain the identical 7 pitch classes yet feel completely different, purely because a different note is treated as home.

::: info Relative minor
The **relative minor** of a major scale is the minor scale built from the same 7 notes, starting on the 6th degree. C major and A minor share all white keys; only the *tonal center* differs. They are the same set with a different distinguished element.
:::

<ScoreExample example="minorScaleA" locale="en" />

Computationally, switching C major to A minor changes no pitch classes at all — it only relabels which class is "degree 1". The emotional shift comes entirely from where the music resolves.

## Scale degrees: relative coordinates

Naming notes absolutely (C, D, E…) couples a melody to one key. Music theory avoids that coupling by numbering the scale notes.

::: info Scale degree
A **scale degree** is the index of a note within its scale, written `1` through `7` (degree `1` is the home note). Degrees are *relative coordinates*: "degree 5" means the fifth scale note whatever the key. This is the key-independent address space all chord and progression notation is built on.
:::

<ScoreExample example="scaleDegrees" locale="en" />

Think of degrees as logical addresses and actual MIDI numbers as physical addresses. The Roman numerals (I, IV, V) you will meet in Chapter 2 are degree-based, which is exactly why a progression can be transposed to any key by changing one offset.

## Key: the starting offset

The scale gives you a shape; the key chooses where on the 12-step number line that shape begins.

::: info Key (tonic)
A **key** names the scale plus its home pitch, called the **tonic** — the note that feels like rest, degree `1`. Choosing a key is choosing an additive offset: the same degree pattern starting on C versus G yields the same tune transposed up. In MidiSketch the `key` field is that offset, `0`–`11`.
:::

<ScoreExample example="keyTransposeC_G" locale="en" />

This is pure transposition: every pitch shifts by the same number of semitones (`C → G` is `+7`), so the melodic shape is byte-for-byte identical in degree space. Change `key` and nothing about the structure of your song changes — only its absolute height.

## Intervals: distance between notes

The last primitive before chords is the gap between two notes, measured in scale steps.

::: info Interval
An **interval** is the distance between two pitches. Counted in scale steps it gives names like *second*, *third*, *fifth*; counted in semitones it gives an exact integer. The **third** (skip one scale note) is the building block of pop harmony.
:::

<ScoreExample example="intervalThirds" locale="en" />

Notice each pair already sounds consonant on its own. Stacking thirds is the recipe for chords: in Chapter 2 a triad is nothing more than two thirds piled on a root — the harmonic primitive falls straight out of this interval.

::: warning Common pitfall — `mood` needs `moodExplicit`
Setting `mood` alone often appears to do nothing: by default the engine treats it as a hint and may override it. To make a `mood` value apply exactly, also set `moodExplicit: true`. (`key`, by contrast, always applies.)
:::

## MidiSketch mapping

| Concept | Config field | Range / notes |
| --- | --- | --- |
| Scale and tonic | `key` | `0`–`11`; selects which pitch class is degree `1` (`0` = C major home, `7` = G) |
| Scale degree numbering | (notation) | Basis of Roman-numeral progressions — see [Chapter 2](/docs/course/chords#midisketch-mapping) and [Harmony](/docs/harmony) |

Continue with [Chapter 2 — Chords & Triads](/docs/course/chords).
