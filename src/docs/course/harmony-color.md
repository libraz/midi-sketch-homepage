# Harmony & Color

A plain triad is a chord at its lowest resolution. Adding extra notes is like turning up the bit depth: the chord gains nuance, mood, and "color" without changing its underlying function. This chapter covers the extension notes MidiSketch can sprinkle on top of any progression — and the probability dials that control how often it does so.

::: info Chord extension (tension)
A **chord extension** (often called a *tension* in jazz and pop theory) is a note added on top of a basic triad to enrich its color. Common extensions are the 7th, the 9th, and suspended tones. They rarely change the chord's harmonic function — a `V` chord with a 7th is still a dominant — but they add sophistication, density, or emotional shading. Think of them as optional decorators on a core chord type.
:::

## Suspended chords: the note that hangs

The first kind of color comes not from adding a note but from swapping one out, leaving the chord deliberately unresolved.

::: info Suspended chord (sus2 / sus4)
A **suspended chord** replaces the third of a triad with a neighbor: **sus4** uses the fourth (C-F-G instead of C-E-G), **sus2** uses the second (C-D-G). Removing the third strips the chord of its major/minor identity, so it sounds open and "held in the air". A sus chord usually resolves by stepping that suspended note back to the third, releasing the tension.
:::

<ScoreExample example="sus4Resolve" locale="en" />

The held fourth is suspense; the step down to the third is the payoff. MidiSketch introduces these via `chordExtSus`, firing at probability `chordExtSusProb` (default 0.2).

## Seventh chords: a fourth note of nuance

Stacking one more third on a triad produces a four-note chord whose flavor depends on exactly which seventh you add.

::: info Seventh chord (maj7 / dom7 / m7)
A **seventh chord** adds a fourth note a third above the triad's top note. The three pop-relevant flavors are: **maj7** (major triad + major 7th, e.g. Cmaj7 = C-E-G-B) — dreamy and urban; **dominant 7th** (major triad + minor 7th, e.g. C7 = C-E-G-B♭) — bluesy and restless, wanting to move; **m7** (minor triad + minor 7th, e.g. Am7 = A-C-E-G) — soft and mellow. The dominant 7th in particular drives most cadences.
:::

<ScoreExample example="seventhChords" locale="en" />

Each seventh carries a distinct emotional fingerprint, so swapping a triad for its seventh-chord version recolors a passage without rewriting the progression. `chordExt7th` enables them at probability `chordExt7thProb` (default 0.15).

## Ninths: shimmer on top

Go one third higher again and you reach the ninth — the most common "modern pop" color note.

::: info Ninth (add9)
A **ninth** is the second scale degree raised an octave (the "9th"). An **add9** chord simply adds this note to a triad without the seventh — Cadd9 is C-E-G-D. The ninth thickens the chord and adds a bright, glassy shimmer that sounds contemporary and lush. It is one of the most reliable ways to make a plain major chord sound polished.
:::

<ScoreExample example="ninthChord" locale="en" />

The added ninth is purely a coloring; the chord's function and root are unchanged. `chordExt9th` governs it at probability `chordExt9thProb` (default 0.25), the highest default of the four extension types.

## Secondary dominants: aiming the pull elsewhere

The seventh-chord section noted that the dominant 7th "wants to move". That pull is usually aimed at the tonic — but nothing stops you from aiming it at any other chord in the key.

::: info Secondary dominant
A **secondary dominant** is a dominant 7th chord that resolves to a diatonic chord *other than* the tonic. It is written `V/x` ("five of x"): `V/V` resolves to the dominant, `V/vi` to the relative minor, and so on. In C major the most common are D7→G (`V/V`), E7→Am (`V/vi`), A7→Dm (`V/ii`), and C7→F (`V/IV`). Inserting one creates a stronger, more directed pull toward its target chord.
:::

<ScoreExample example="secondaryDominant" locale="en" />

D7 contains an F♯ — a note from outside C major. That borrowed accidental momentarily treats G as a "temporary tonic", which is why `F → D7 → G` feels more persuasive than plain `F → G`.

The same device aimed at the relative-minor chord — `V/vi`, or E7 resolving to Am — is the single most common secondary dominant in J-pop, recoloring the move into vi.

<ScoreExample example="secondaryDominantVi" locale="en" />

MidiSketch inserts secondary dominants automatically — there is no flag to set. It builds the dominant of an upcoming diatonic chord (commonly `ii`, `IV`, or `vi`), favors high-tension sections such as the pre-chorus and especially the approach into the chorus, and caps roughly one per eight bars with a cooldown so each one stays an event rather than a habit.

## The tritone: the engine of tension

To understand the next trick, we need the single most unstable interval in tonal music — the one already lurking inside every dominant 7th chord.

::: info Tritone
A **tritone** is the interval of six semitones (for example F to B), exactly half of the twelve-semitone octave. Because it splits the octave evenly, it is maximally ambiguous and restless — it strongly "wants" to resolve by collapsing inward or expanding outward. The tritone inside a dominant 7th chord is precisely what generates the pull of a `V`→`I` cadence.
:::

<ScoreExample example="tritoneInterval" locale="en" />

That symmetry — the octave split cleanly in half — is the key. Because two different dominant chords can share the very same tritone, they can stand in for each other.

## Tritone substitution: same tension, new bass

Here is where the tritone's symmetry pays off as a concrete reharmonization move.

::: info Tritone substitution
A **tritone substitution** replaces a dominant 7th chord (`V7`) with the dominant 7th a tritone away (`♭II7`). The two chords share the same tritone, so the substitute resolves to the tonic just as convincingly — but its root sits a half step above the target, so the bass slides down chromatically (e.g. D♭ → C). This jazz-flavored swap adds chromatic sophistication while keeping the cadence's pull intact.
:::

<ScoreExample example="tritoneSub" locale="en" />

In MidiSketch, `chordExtTritoneSub` performs exactly this `V7` → `♭II7` swap, firing at probability `chordExtTritoneSubProb` (0.5 when enabled).

## Putting it together: color is a probability dial

None of these extensions are all-or-nothing. MidiSketch applies each one stochastically, so the same progression can be rendered bare or richly colored.

<ScoreExample example="extensionProb" locale="en" />

Each extension type has its own independent probability (sus 0.2, 7th 0.15, 9th 0.25, tritone sub 0.5 when enabled). By default, the selected mood auto-adjusts these probabilities; set `chordExtProbExplicit: true` to lock your own values and override mood-based tuning. If you want the engine to flag which added notes are safe color versus genuine dissonance, the piano-roll safety API marks chord tones green, tensions yellow, and dissonances red (see [/docs/api-js](/docs/api-js)).

::: warning Common pitfall — your probabilities are overridden unless you lock them
By default the selected `mood` auto-tunes every `chordExt*Prob`, so a value you set by hand can be silently replaced. Set `chordExtProbExplicit: true` to lock your own probabilities and stop mood from overriding them. The enable flags (`chordExt7th` etc.) are always honoured; only the probabilities are auto-tuned.
:::

## MidiSketch mapping

| Extension | Enable flag | Probability | Default |
| --- | --- | --- | --- |
| Suspended (sus2/sus4) | `chordExtSus` | `chordExtSusProb` | 0.2 |
| Seventh (maj7/dom7/m7) | `chordExt7th` | `chordExt7thProb` | 0.15 |
| Ninth (add9) | `chordExt9th` | `chordExt9thProb` | 0.25 |
| Tritone substitution | `chordExtTritoneSub` | `chordExtTritoneSubProb` | 0.5 (when enabled) |
| Secondary dominant (`V/x`) | — (automatic) | — | inserted by section type & style; no flag |
| Lock probabilities | `chordExtProbExplicit` | — | `false` (moods auto-adjust unless set `true`) |

Engine reference: [Harmony](/docs/harmony)

Next chapter: [Melody, Motifs & Hooks](/docs/course/melody-motif)
