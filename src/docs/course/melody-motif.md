# Melody, Motifs & Hooks

If the progression is the backend and harmony is the styling, the melody is the user-facing surface — the part people actually remember and sing back. This chapter covers how a single-note line stays consonant with the chords beneath it, how small reusable cells (motifs) build memorability, and how MidiSketch dials repetition up into an outright hook.

::: info Melody
A **melody** is a single sequence of notes heard as the "tune" of a song — the line you hum. Unlike a chord, only one melody note sounds at a time, and the listener follows its contour (the up-and-down shape) over time. A good melody balances stable notes that agree with the harmony against moving notes that create forward motion.
:::

## Chord tones: the safe notes

The relationship between a melody note and the chord under it determines whether it sounds resolved or tense. The safest notes are the ones already in the chord.

::: info Chord tone vs non-chord tone
A **chord tone** is a melody note that belongs to the chord sounding underneath it — over a C chord, the notes C, E, and G are chord tones and can never clash. A **non-chord tone** (NCT) is any melody note outside that chord; it introduces tension against the harmony. Landing on chord tones feels stable and arrived; the trick to good melody is how you use the notes in between.
:::

<ScoreExample example="chordTones" locale="en" />

Chord tones guarantee consonance, which is why MidiSketch's piano-roll safety API colors them green. A line built only from chord tones is safe but can sound stiff — which is where non-chord tones come in.

## Passing tones: connecting tissue

A melody made purely of chord tones leaps between safe notes. Filling the gaps with brief outside notes is what makes a line flow.

::: info Passing tone
A **passing tone** is a non-chord tone used to step smoothly between two chord tones — for example, sliding C → D → E, where D is the passing tone bridging the two chord tones. Passing tones work because they appear briefly, on weak beats, while the music is in motion. They add melodic motion and singability without destabilizing the harmony, since the ear hears them as "on the way" rather than "arrived".
:::

<ScoreExample example="passingTones" locale="en" />

The pattern is tension on the way, arrival on chord tones. This is also how the safety API distinguishes a tasteful passing note (a fleeting yellow tension) from a genuine clash (red dissonance) on a strong beat.

## Motifs and sequences: memorability through reuse

Melodies are not random note streams; they are built from small recognizable cells that the song restates and transforms.

::: info Motif
A **motif** is a short melodic cell — typically 2 to 8 notes — that a song reuses and varies throughout. It is the smallest memorable unit of melody, the "hook in miniature". Because the listener recognizes a motif on its return, restating it (in the same or altered form) is the primary tool for making a tune feel coherent and catchy rather than meandering.
:::

::: info Sequence (melodic)
A **sequence** is the simplest motif transformation: repeat the same melodic shape starting on a different scale degree. If a four-note motif is restated one step higher with its contour intact, that restatement is a sequence. Sequences let a song develop forward momentum while keeping the listener oriented, because the *shape* stays familiar even as the pitches climb or fall.
:::

<ScoreExample example="motifRepeat" locale="en" />

MidiSketch generates motif tracks and exposes several controls over their shape — `motifLength`, `motifNoteCount`, `motifMotion`, `motifRhythmDensity` — plus `motifRepeatScope` (0 = FullSong, 1 = Section) to decide how widely a motif recurs. In the RhythmSync paradigm, `keepMotif` locks the existing motif as the rhythmic axis so you can regenerate the vocal around a fixed groove.

## Phrases, hooks, and the chorus payoff

Zoom out from the motif and you get the phrase — the melodic "sentence" — and, in the chorus, its most concentrated form, the hook.

::: info Phrase
A **phrase** is a complete melodic thought, the musical equivalent of a sentence — usually a few bars long and ending with a sense of pause or breath. Phrases are built from motifs and typically span 2 to 8 bars. A song's verse and chorus are stitched together from these phrase-sized units.
:::

::: info Hook
A **hook** is the phrase listeners can hum after a single play: compact in range, punchy in rhythm, and heavy on repetition. It is engineered for stickiness, usually living in the chorus. The hook concentrates everything memorable about a melody into a few bars that the song hammers home.
:::

<ScoreExample example="hookPhrase" locale="en" />

MidiSketch's `hookIntensity` (0 = Off, 1 = Light, 2 = Normal, 3 = Strong, 4 = Maximum) controls how aggressively the chorus repeats its hook material; the default is 2 (Normal). The BehavioralLoop blueprint / `addictiveMode` pushes this toward Maximum automatically.

## Call and response: phrases in dialogue

Phrases often pair up into a question-and-answer structure, a device that powers everything from blues to idol-music crowd chants.

::: info Call and response
**Call and response** is a phrase structure where a first phrase (the **call**, often rising and open-ended) is answered by a second (the **response**, often falling and conclusive). The pair feels like a question and its reply. It creates a built-in sense of dialogue and resolution, and underpins audience participation in many pop and idol styles.
:::

<ScoreExample example="callResponse" locale="en" />

MidiSketch's call system is governed by `callSetting` (0 = Auto, 1 = Enabled, 2 = Disabled), which inserts response shouts; the `CallResponse` melody template (id 6, of `melodyTemplate` 0 = Auto, 1-7) builds duet-style call-and-answer phrasing directly.

## Repetition as a dial

Finally, remember that repetition itself is a continuous parameter, not a yes/no switch. The same harmony can carry a free-flowing line or an obsessively tight loop.

<ScoreExample example="hookIntensityCompare" locale="en" />

At `hookIntensity` 0 the line flows freely; at 4 (Maximum) it hammers a single cell relentlessly. Alongside this, finer melody controls let you shape the line directly: `melodyMaxLeap` (0 = preset, 1-12 semitones) caps how far the melody jumps, `melodyPhraseLength` (0 = preset, 1-8 bars) sets phrase length, and `melodyHookRepetition` (0 = preset, 1 = off, 2 = on) toggles hook repetition explicitly.

## MidiSketch mapping

| Concept | MidiSketch control | Values |
| --- | --- | --- |
| Hook repetition strength | `hookIntensity` | 0 = Off, 1 = Light, 2 = Normal (default), 3 = Strong, 4 = Maximum |
| Melodic shaping template | `melodyTemplate` | 0 = Auto, 1-7 (id 6 = `CallResponse`) |
| Lock motif as rhythmic axis | `keepMotif` | RhythmSync paradigm only |
| Motif shape | `motifLength` / `motifNoteCount` | length 0 = auto / 1/2/4 bars; count 0 = auto / 3-8 |
| Maximum melodic leap | `melodyMaxLeap` | 0 = preset, 1-12 semitones |
| Call & response | `callSetting` | 0 = Auto, 1 = Enabled, 2 = Disabled |

Engine reference: [Melody Evaluation](/docs/melody-evaluation) and [Track Generators](/docs/track-generators)
