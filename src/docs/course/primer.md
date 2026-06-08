# Chapter 0 — Music Primer for Engineers

If you can read a coordinate system and reason about modular arithmetic, you already have the mental tools to read music. This chapter treats pitch as integers, time as a grid, and tempo as a playback clock — no prior music background required. By the end you will be able to read every score in this course and map it onto MidiSketch config fields.

## Pitch is just an integer

Music has a finite alphabet. Western pop divides the octave into 12 equally spaced steps, and every melody, bassline, and chord is drawn from that grid. MidiSketch never sees "the note C" — it sees the integer `60`.

::: info Note / pitch
**Pitch** is how high or low a sound is, perceived by your ear. A **note** is a single pitch with a duration — the atomic event in a melody. Think of a note as a `(pitch, start, length)` tuple; this chapter focuses on the pitch field.
:::

::: info Semitone
A **semitone** is the smallest pitch step in this system — one cell on the 12-step grid, equivalent to `+1` in MIDI. Adjacent piano keys (white-to-black or the two white pairs E–F and B–C) are one semitone apart. Twelve semitones make a full octave.
:::

::: info MIDI note number
A **MIDI note number** is the integer encoding of a pitch: an enum from `0` to `127`. By convention `C4 = 60`, and each semitone adds `1`. So `C#4 = 61`, `D4 = 62`, up to `B4 = 71`. It is the canonical identifier MidiSketch and every synth speak in.
:::

<ScoreExample example="chromatic12" locale="en" />

The number-line view above is the whole point: pitch arithmetic is integer arithmetic. Want the note a tritone above `G4`? `67 + 6 = 73`.

## The octave and pitch class (mod 12)

Notes exactly 12 semitones apart share a name and sound like "the same note, higher". That equivalence is what lets us treat pitch with modular arithmetic.

::: info Octave
An **octave** is the interval between a pitch and the one with twice its frequency — exactly 12 semitones, or `+12` in MIDI. Notes one octave apart (`C4 = 60`, `C5 = 72`) are perceived as the same note class. The *pitch class* of any MIDI number is `n mod 12`, so all the C's collapse to `0`.
:::

<ScoreExample example="octaveDouble" locale="en" />

This is why MidiSketch can fold an out-of-range note back into range by adding or subtracting `12`: the pitch class (`n mod 12`) is preserved, only the octave register changes. Keep this `mod 12` model in mind — Chapter 1 builds scales as subsets of the 12 classes.

## Time is a grid

Pitch answers *what*; the next axis answers *when*. Time in pop music is quantized onto a regular pulse.

::: info Beat
A **beat** is the steady pulse you would tap your foot to — the fundamental time unit. Tempo and rhythm are both measured in beats. In notation the default beat is the quarter note.
:::

::: info Bar (measure)
A **bar** (or **measure**) groups a fixed number of beats into a repeating cell, marked by vertical barlines in the score. It is the loop unit of musical time: most pop is built from bars of four beats.
:::

::: info Time signature
A **time signature** like `4/4` declares the grid: the top number is beats per bar, the bottom names the beat unit (4 = quarter note). `4/4` ("four-four") means four quarter-note beats per bar and is the default for almost all pop music.
:::

<ScoreExample example="beatGrid" locale="en" />

Internally MidiSketch measures time in **ticks**: there are `480` ticks per quarter note. A beat is therefore `480` ticks, and a `4/4` bar is `1920` ticks — a fixed-point time base, much like a sample-accurate clock.

## Tempo: the playback clock

The grid is dimensionless until you assign it a speed. That speed is the tempo.

::: info BPM
**BPM** (beats per minute) is the playback rate of the beat grid — literally how many beats elapse per minute. Doubling BPM does not change which notes play or their relative spacing; it only scrolls the grid faster. MidiSketch accepts BPM `40`–`240`, and `bpm: 0` selects the style preset's default.
:::

<ScoreExample example="bpmCompare" locale="en" />

Note the separation of concerns: pitch (integers), rhythm (tick offsets), and tempo (a scalar multiplier on the clock) are independent. You can transpose without touching rhythm, or change BPM without touching a single note.

## Range: bounding the integers

A real instrument or voice can only produce a band of the `0`–`127` range comfortably. MidiSketch expresses that constraint as two bounds.

<ScoreExample example="midiRange" locale="en" />

The defaults `vocalLow: 60` (C4) and `vocalHigh: 79` (G5) define a closed interval. Any generated note that would land outside is folded back by octaves (`±12`) until it fits — same pitch class, legal register. Valid bounds run `36`–`96`.

## Reading the scores

Every interactive example here is drawn on a **staff** with a **clef**.

::: info Staff & clef
A **staff** is the five horizontal lines notes are placed on; higher on the staff means higher pitch. A **clef** at the left fixes the reference: the **treble clef** used throughout this course pins the second line to `G4`. You do not need to sight-read — treat the staff as a vertical pitch axis and the clef as its origin marker.
:::

::: warning Common pitfall — `bpm: 0` is not silence
`bpm: 0` does not mean "no tempo" — it tells the engine to use the style preset's default tempo. To pin a tempo, set a real value in `40`–`240`. Anything outside that range (or a `vocalLow`/`vocalHigh` outside `36`–`96`) is rejected by `validateConfig`, not clamped.
:::

## MidiSketch mapping

| Concept | Config field | Range / notes |
| --- | --- | --- |
| Tonic pitch class | `key` | `0`–`11` (`0` = C, `7` = G) |
| Playback tempo | `bpm` | `40`–`240`; `0` = style default |
| Lowest allowed melody note | `vocalLow` | MIDI number, `36`–`96` (default `60` = C4) |
| Highest allowed melody note | `vocalHigh` | MIDI number, `36`–`96` (default `79` = G5) |
| Time base | (internal) | `480` ticks per quarter note |

Continue with [Chapter 1 — Scales & Keys](/docs/course/scales-keys).
