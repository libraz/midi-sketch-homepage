# Glossary

Every term this course introduces, in one place. Use it as a lookup table: each row gives a one-line meaning and the `SongConfig` field it touches, if any. Terms are grouped by the chapter that introduces them.

## Basics

| Term | Meaning | Related config |
| --- | --- | --- |
| Pitch / note | How high or low a sound is; a note is one pitch with a duration | — |
| Semitone | The smallest pitch step; `+1` in MIDI | — |
| Octave | Interval of 12 semitones; `+12` in MIDI, same pitch class | — |
| MIDI note number | Integer encoding of a pitch, `0`–`127` (`C4` = 60) | `vocalLow`, `vocalHigh` |
| Beat | The steady pulse; the fundamental time unit | `bpm` |
| Bar (measure) | A fixed group of beats, the loop unit of time | — |
| Time signature | Beats per bar and the beat unit, e.g. `4/4` | — |
| BPM | Beats per minute; the playback clock rate | `bpm` (`40`–`240`, `0` = style default) |
| Tick | Internal time unit; `480` ticks per quarter note | (internal) |

## Scales & Keys

| Term | Meaning | Related config |
| --- | --- | --- |
| Scale | An ordered subset of the 12 pitch classes a song draws from | `mood` |
| Major | The bright scale colour | `mood`, `moodExplicit` |
| Minor | The dark scale colour | `mood`, `moodExplicit` |
| Key / tonic | The home pitch class a song resolves to | `key` (`0`–`11`) |
| Scale degree | A note's position within the scale (1st, 2nd, …) | — |
| Interval | The distance in semitones between two pitches | — |
| Relative minor | The minor key sharing a major key's notes | `key`, `mood` |

## Chords

| Term | Meaning | Related config |
| --- | --- | --- |
| Chord | Several pitches sounded together | `chordProgressionId` |
| Triad | A three-note chord (root, 3rd, 5th) | — |
| Root / 3rd / 5th | The three stacked notes of a triad | — |
| Chord quality | Major, minor, diminished, etc. — the chord's colour | — |
| Chord symbol | Text name of a chord, e.g. `Am`, `G7` | — |
| Roman numeral notation | Chords labelled by scale degree, e.g. `I`, `V`, `vi` | — |
| Inversion / voicing | Which chord tone is lowest and how the notes are spaced | (internal voice leading) |
| Arpeggio | A chord played one note at a time | `arpeggioEnabled` |

## Progressions

| Term | Meaning | Related config |
| --- | --- | --- |
| Chord progression | An ordered sequence of chords | `chordProgressionId` (`0`–`21`) |
| Cadence | A chord move that signals a phrase ending | — |
| Tension & resolution | The pull away from and back to the tonic | — |
| Harmonic function | A chord's role: tonic, subdominant, dominant | — |
| Royal Road progression | The common J-pop `IV–V–iii–vi` loop | `chordProgressionId` |
| Four-chord loop | A four-chord cycle repeated under a section | `chordProgressionId` |
| Vamp | A short progression looped as a backdrop | `chordProgressionId` |

## Harmony

| Term | Meaning | Related config |
| --- | --- | --- |
| Extension | A note added above the triad for colour | `chordExtSus`, `chordExt7th`, `chordExt9th` |
| Sus chord | The 3rd replaced by the 2nd or 4th | `chordExtSus` / `chordExtSusProb` (default `0.2`) |
| 7th chord | A triad plus the 7th | `chordExt7th` / `chordExt7thProb` (default `0.15`) |
| 9th | The extension a 9th above the root | `chordExt9th` / `chordExt9thProb` (default `0.25`) |
| Tritone | The interval of 6 semitones | — |
| Tritone substitution | Replacing a dominant with the chord a tritone away | `chordExtTritoneSub` / `chordExtTritoneSubProb` (default `0.5`) |
| Secondary dominant | A dominant 7th resolving to a chord other than the tonic (`V/V` etc.) | — (inserted automatically) |
| Chord tone | A note that belongs to the current chord | — |
| Passing tone | A non-chord note bridging two chord tones | — |

## Melody

| Term | Meaning | Related config |
| --- | --- | --- |
| Melody | The main single-note line; the tune | `vocalStyle`, `stylePresetId` |
| Motif | A short recurring melodic idea | `stylePresetId` (12 = Background Motif) |
| Sequence | A motif repeated at a different pitch | — |
| Phrase | A self-contained melodic sentence | — |
| Hook | The catchiest, most repeated fragment | `hookIntensity` (`0`–`4`) |
| Call & response | Two phrases that answer each other | `callSetting` (`0`/`1`/`2`) |

## Structure

| Term | Meaning | Related config |
| --- | --- | --- |
| Section | A contiguous span with one structural role | `formId` |
| Intro | The opening instrumental section | `formId` |
| Verse (A-melo) | The calm opening sung section | `formId` |
| Pre-chorus (B-melo) | The tension-building section before the chorus | `formId` |
| Chorus (sabi) | The high-energy hook section | `formId`, `hookIntensity` |
| Interlude | An instrumental section between sung sections | `formId` |
| Outro | The closing section | `formId` |
| Song form | The ordered sequence of sections | `formId` (`0`–`17`), `formExplicit`, `targetDurationSeconds` |

## Generation

| Term | Meaning | Related config |
| --- | --- | --- |
| Blueprint | A high-level recipe bundling paradigm and defaults | `blueprintId` (`0`–`9`, `255` = random) |
| Paradigm | The axis a song is built around (Traditional / RhythmSync / MelodyDriven) | `blueprintId` |
| Seed | Integer that makes generation reproducible | `seed` (`0` = random) |
| Humanize | Controlled timing and velocity deviation | `humanizeTiming` (`0.4`), `humanizeVelocity` (`0.3`) |

Return to [Chapter 0 — Music Primer](/docs/course/primer) to start over, or jump to the [JavaScript API](/docs/api-js) to build.
