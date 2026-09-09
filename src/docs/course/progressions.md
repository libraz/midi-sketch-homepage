# Chord Progressions

If a single chord is a data structure, a chord progression is an algorithm: an ordered sequence of chords that moves a listener somewhere over time. This chapter is about that ordering — why some sequences feel like "going home" and others feel like an endless forward loop — and how MidiSketch picks from 22 ready-made progressions.

::: info Chord progression
A **chord progression** is an ordered sequence of chords played one after another, usually looping over a section of a song. Order matters: the same set of chords arranged differently produces a different emotional path. Progressions are written in degree (Roman numeral) notation so they transpose to any key — `I-V-vi-IV` means the same relationship whether you are in C, G, or any other key.
:::

## Harmonic function: home, away, and the pull back

Before looking at specific progressions, it helps to know that each chord in a key plays one of three structural roles. These roles are why progressions feel directional rather than random.

::: info Tonic / subdominant / dominant function
Every chord in a key has a **function** — a structural job — and there are three of them. The **tonic** function (degree 1, `I`, and its stand-ins `vi` and `iii`) is home: stable, resolved, at rest. The **dominant** function (degree 5, `V`, and `vii°`) is maximum tension; it strongly pulls back toward the tonic. The **subdominant** function (degree 4, `IV`, and `ii`) is the in-between "away" zone that sets up the dominant. Most progressions are just a walk between these three poles.
:::

::: info Tension and resolution
**Tension** is the feeling that the music is unstable and wants to move; **resolution** is the release when it lands on a stable chord. Composers create tension (usually with a dominant chord) precisely so they can resolve it. The interplay of the two over time is the single most important engine of Western harmony — a progression is essentially a tension curve.
:::

<ScoreExample example="tensionRelease" locale="en" />

The four-chord sentence above is the cleanest illustration of the cycle: it leaves home, builds, peaks, and returns. Almost every progression you analyze decomposes into some walk along this same stable-tense-resolved path.

## Cadences: how a phrase signals "we arrived"

A progression needs punctuation. The musical equivalent of a period at the end of a sentence is the cadence.

::: info Cadence
A **cadence** is a short chord motion that ends a phrase, most often the dominant resolving to the tonic (`V`→`I`). It is the harmonic punctuation mark that tells the ear a phrase has finished. The strength of the "arrival" depends on the chords involved — a `V`→`I` cadence is the strongest and most conclusive.
:::

<ScoreExample example="cadenceVI" locale="en" />

Notice that the resolution is driven by a single unstable interval inside the dominant chord that "wants" to collapse onto the tonic. That mechanism — and how to exploit it — is the subject of the next chapter on harmonic color.

## The Royal Road: J-pop's signature loop

Not every progression resolves cleanly. Some are designed to keep floating forward, never quite settling, which is exactly what makes a chorus feel like it could loop forever.

::: info Royal Road progression (王道進行)
The **Royal Road progression** (王道進行, *ōdō shinkō*) is `IV-V-iii-vi`, an extremely common loop in Japanese pop. Its defining trait is that it never lands on the tonic — it lifts on the subdominant, drives on the dominant, then sidesteps into minor chords instead of resolving home. The result is a bittersweet, perpetually forward-leaning feel.
:::

<ScoreExample example="royalRoad" locale="en" />

Because it sidesteps the tonic, the Royal Road creates motion without closure — the harmonic equivalent of a loop that never returns to its initial state. MidiSketch ships this as one of its preset progressions, selectable by id.

## The four-chord loop and the canon progression

The most recycled loop in Western pop is a close cousin: four diatonic chords that complete a full emotional arc and then repeat.

::: info Four-chord loop / canon progression
A **four-chord loop** is any short four-chord cycle repeated throughout a song; `I-V-vi-IV` is by far the most recycled one. It is often confused with the **canon progression** (`I-V-vi-iii-IV-I-IV-V`), named after Pachelbel's Canon, whose first four chords walk the bass steadily downward. These loops are popular because four chords are enough to trace a complete home → away → sad → hopeful arc while staying simple enough to memorize instantly.
:::

<ScoreExample example="canonPop" locale="en" />

The `I-V-vi-IV` loop opens on `I` and, because it loops, lands back on it every four bars — unlike the Royal Road, which never touches the tonic at all. The arrival is the loop restarting rather than a cadence, which is why the progression feels resolved and still danceable on repeat. Both are just different orderings of mostly the same diatonic chords — the ordering is the whole design.

## Borrowed chords: stepping briefly outside the key

Every progression so far stays inside the seven diatonic chords. A progression can also pull a single chord in from outside the key for a splash of color — without changing where the song calls home.

::: info Borrowed chord (♭VII)
A **borrowed chord** is a chord taken from the parallel key (here, the parallel minor) and dropped into an otherwise diatonic progression. The most common one in pop and rock is **♭VII** — in C major, a B♭ major chord. Its root sits a whole step below the tonic instead of the diatonic `vii°`, giving a bright, anthemic lift that falls back to `I`. It is the signature sound of the `I-♭VII-IV-I` rock cadence.
:::

<ScoreExample example="borrowedFlatVII" locale="en" />

`I-♭VII-IV-I` (C - B♭ - F - C) trades the leading-tone pull of a diatonic cadence for a plagal, mixolydian brightness — the move behind countless rock and anime choruses. MidiSketch ships two ♭VII progressions (the Rock presets), selectable like any other via `chordProgressionId`. They are not the only presets that step outside the key: AeolianPop is `vi-♭VI-♭VII-I` and NeapolitanPop is `vi-iv-♭II-V-I`, so ♭VI, ♭II and the minor `iv` appear too. The engine voices and analyzes all of them correctly.

## Vamps: a progression can be tiny

Loop length is itself a stylistic choice. A progression does not need three or four chords; two are often enough to establish a mood.

::: info Vamp
A **vamp** is a very short repeated progression — often just one or two chords — used as a hypnotic, atmospheric backdrop. Modern pop, lo-fi, and electronic styles lean on vamps because the relentless repetition is the point: it frees the melody and rhythm to carry the song. Short loops trade harmonic variety for groove and immediacy.
:::

<ScoreExample example="loopVamp" locale="en" />

A two-chord vamp like `Am`↔`F` already carries a complete mood. MidiSketch treats loop length as a deliberate parameter: blueprints such as BehavioralLoop intentionally exploit very short, repetitive loops to maximize stickiness — a design we revisit in Chapter 7.

## MidiSketch mapping

| Concept | MidiSketch control | Notes |
| --- | --- | --- |
| Choosing a progression | `chordProgressionId` (0-21) | 22 preset progressions; `getChords()` lists them all |
| Borrowed chords | `chordProgressionId` | Rock presets `I-♭VII-IV-I` / `I-IV-♭VII-I`; also AeolianPop `vi-♭VI-♭VII-I` and NeapolitanPop `vi-iv-♭II-V-I` |
| How progressions are written | degree (Roman numeral) notation | e.g. `IV-V-iii-vi`, key-independent so it transposes to any key |
| Loop length as a style choice | short vamps vs. long cycles | BehavioralLoop blueprint exploits very short loops (forward reference, Chapter 7) |

Engine reference: [Harmony](/docs/harmony)

Next chapter: [Harmony & Color](/docs/course/harmony-color)
