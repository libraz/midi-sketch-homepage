# Chapter 6 — Song Structure

A melody and a chord progression are components; a song is the assembly. This chapter treats a song as an ordered list of named sections, each with its own register, energy, and role — like routes in an application, composed into a predictable flow. By the end you will read a full song form as a data structure and map it onto MidiSketch's structure presets.

## Sections: the building blocks

Up to now every score has been a phrase in isolation. Real songs concatenate phrases into labelled blocks, and those blocks repeat. The labels matter because each one carries a convention: a listener expects a verse to be calm and a chorus to be loud, the same way a reader expects a function body to follow its signature.

::: info Section
A **section** is a contiguous span of a song with a single structural role — a verse, a chorus, an intro, and so on. It is the unit of arrangement: melodies, dynamics, and instrumentation are decided per section. Think of a song as `Section[]`, where each element names its role and the engine fills in the notes.
:::

MidiSketch generates one melody and accompaniment per section, then stitches them together. Because sections are typed, the engine can apply different rules to each: a verse generator favours small steps and a low register, a chorus generator pushes to the top of the vocal range. The rest of this chapter walks through each section type.

<ScoreExample example="aMeloVerse" locale="en" />

## A-melo: the verse

The first sung section is the verse. Its job is exposition: establish the key, the groove, and the lyrical setup without spending the song's emotional budget too early. Melodies here stay low and stepwise, leaving headroom so a later chorus can feel like a climb. In the score above, notice the narrow range and the relaxed quarter-note rhythm — deliberately understated.

::: info A-melo (verse)
The **verse** — Japanese **A-melo** (Aメロ) — is the song's opening sung section, typically calm and conversational. It carries the narrative and sits in a low register. MidiSketch and J-pop convention use both names interchangeably; this course writes "A-melo (verse)" so you recognise either.
:::

The naming split is worth flagging once: the Japanese pop tradition labels sections by letter (A, B, then the hook), while the Western tradition labels them by function (verse, pre-chorus, chorus). The engine speaks both dialects. Wherever you see `A` it means the verse.

## B-melo: the pre-chorus

Between verse and chorus most pop songs insert a ramp — a section whose only purpose is to raise tension so the chorus lands harder. The melody climbs, the harmony leans on the dominant, and the section deliberately refuses to resolve. The unresolved ending is a feature: it hands the release to the chorus that follows.

::: info B-melo (pre-chorus / bridge)
The **pre-chorus** — Japanese **B-melo** (Bメロ) — is the transitional section between verse and chorus that builds tension toward the hook. It often ends on the dominant (V) without resolving. In some forms the same slot hosts a contrasting **bridge** later in the song; the engine treats both as the `B` role.
:::

<ScoreExample example="bMeloBuild" locale="en" />

In the score, the bracketed stepwise climb and the closing chord on V do exactly this. Read the `V` ending as a `pending` promise: the chorus is the `resolve`.

## Sabi: the chorus

The chorus is the payoff. It occupies the highest register, the biggest dynamics, and the most repetition in the song — and crucially, it contrasts with everything around it. A chorus feels like a chorus mostly *because* the verse stayed low; the contrast is the effect. Compare the chorus score below with the verse example: same key, same tempo, but a full register higher and far more insistent.

::: info Sabi (chorus)
The **chorus** — Japanese **sabi** (サビ) — is the song's high point and most memorable section, carrying the main hook. It sits in the highest register with the greatest energy and the most repetition. In MidiSketch, hook intensity and the loudest arrangement concentrate here.
:::

<ScoreExample example="sabiChorus" locale="en" />

The chorus here runs over an `F–G–Em–Am` loop and peaks at the top of the vocal range. That peak is not accidental — it is the structural reason every preceding section held back.

## Intro, interlude, and outro

Three non-sung (or lightly sung) sections frame and pace the song. The **intro** opens it, the **interlude** breaks it up, and the **outro** closes it. They carry no new lyrics but do real structural work: setting expectations, giving the listener a rest, and landing the ending.

::: info Intro
The **intro** is the opening instrumental section, before the first verse. It establishes key, tempo, and often the main motif so the listener is oriented before the vocal enters. Keep it short; its job is setup, not payoff.
:::

::: info Interlude (間奏)
An **interlude** — Japanese **kansō** (間奏) — is an instrumental section *between* sung sections, often after a chorus. It gives the arrangement room to breathe and can reprise the intro motif or feature a solo. Functionally it is a controlled pause in the vocal line.
:::

::: info Outro
The **outro** is the closing section that ends the song. It frequently quotes earlier material — often the intro motif, slowed or thinned — so the song feels framed. Think of it as the `finally` block: the place the energy settles and stops.
:::

<ScoreExample example="introOutro" locale="en" />

The score plays the intro motif, then the same material as an outro echo. Reusing one idea at both ends frames the song like bookends — a cheap, reliable way to make a sketch feel intentional.

## Song form: the full assembly

Stack these sections in order and you have a song form. A form is just a sequence — `Intro → A → B → Sabi → ...` — and pop relies on a small catalogue of well-worn sequences rather than inventing one per song.

::: info Song form
A **song form** is the ordered sequence of sections that makes up a complete song, e.g. `Intro–A–B–Sabi–A–B–Sabi–Outro`. It is the top-level structure: a template that says which section types appear, in what order, and how often. MidiSketch exposes forms as numbered presets.
:::

<ScoreExample example="fullFormMap" locale="en" />

The schematic above is not a melody — each whole note stands for one section, drawn at the register that section typically occupies, so you can see the shape of a song at a glance: a low verse, a rising pre-chorus, a high chorus, a settling outro. MidiSketch ships 18 such structure presets (`formId` 0–17) that assemble sections into complete songs.

## MidiSketch mapping

| Concept | Config field | Range / notes |
| --- | --- | --- |
| Song form preset | `formId` | `0`–`17` (18 structure presets) |
| Use the form exactly as given | `formExplicit` | `true` = honour `formId`; `false` = engine may adapt |
| Build a form to a target length | `targetDurationSeconds` | seconds; `0` = use `formId`'s structure |
| Section roles | (internal) | Intro / Verse (A) / Bridge (B) / Chorus / Interlude / Outro |

When `targetDurationSeconds` is `0`, the engine uses the structure from `formId`; set a positive value to auto-build a structure of roughly that length instead.

See the [Presets reference](/docs/presets) and [Option relationships](/docs/option-relationships) for the full structure catalogue and how `formId`, `formExplicit`, and `targetDurationSeconds` interact.

Continue with [Chapter 7 — Mapping Concepts to Config](/docs/course/config-mapping).
