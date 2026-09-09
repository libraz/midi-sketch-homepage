# Melody Evaluation System

This document explains the candidate selection and evaluation mechanism used in melody generation.

::: tip New to music theory?
This page assumes the melodic vocabulary — chord tones, passing tones, motifs, hooks. If those are unfamiliar, the course chapter [Melody, Motifs & Hooks](/docs/course/melody-motif) teaches them with playable examples first.
:::

## Overview

MIDI Sketch generates multiple melody candidates and selects one through an evaluation system.

<DocFigure name="melody-candidate-flow" />

## Candidate Generation

### Section-Specific Candidate Counts

Different sections use different candidate counts:

| Section | Candidates | Notes |
|---------|-----------|-------|
| **Chorus** | 100 | Hook section |
| **B (Pre-chorus)** | 50 | Transition section |
| **Bridge / Chant** | 30 | Contrast section |
| **A (Verse) / Intro / Outro** | 20 | Stable sections; also Interlude, MixBreak and Drop |

### Generation Process

For each candidate:

1. **Rhythm Pattern** - Generate note positions and durations
2. **Pitch Selection** - Apply melody template (PlateauTalk, RunUpTarget, etc.)
3. **Constraint Application** - Apply singability and range limits
4. **Embellishment** - Add passing tones, neighbor tones

::: info Articulation gate
Articulation gating applies only to interior notes shorter than a quarter note. Phrase starts and ends, and notes at least a quarter note long, keep their full duration; stepwise motion stays legato while skips and leaps receive only a small gap. The minimum duration is one sixteenth note, so the floor can lengthen an input shorter than a sixteenth.
:::

::: info Rhythm-locked sections
When a section reuses a locked rhythm pattern, a separate path takes over: it always generates 20 candidates regardless of section, totals the seven quality dimensions with equal weight instead of style weights, and blends 35 % style + 40 % penalty + 25 % global motif rather than the 40/40/20 mix described below. The rank cut and the weighted-random pick are the same.
:::

## Evaluation and Selection

Every candidate is scored once, on three axes computed together rather than in sequence:

- **Style score (40 %)** — the seven weighted quality dimensions below.
- **Penalty score (40 %)** — starts at 1.0 and subtracts singing-difficulty and musical-fault penalties.
- **Interval-bias score (20 %)** — how well the candidate's mix of steps, skips, leaps and repeated pitches matches the vocal style's preferences.

A global-motif bonus is added on top when a motif is in play, weighted by section (Chorus 0.35 down to Bridge 0.05) so important sections preserve motif identity.

The candidates are then sorted and the **bottom half is discarded** — a fixed rank cut, not an absolute threshold. The winner is drawn from the surviving half by **score-weighted random selection**, so a strong candidate is likely but not guaranteed to win. This keeps repeated sections from converging on the same melody.

### Penalty Score

The penalty score starts at 1.0, subtracts nine penalties, adds two bonuses, and is clamped to 0.0-1.0. Nothing is discarded at this point — the result is one of the three numbers a candidate carries into the ranking:

<DocFigure name="melody-culling-score" />

#### Penalties

| Penalty | Max | Detection Target |
|---------|-----|------------------|
| **High Register** | 0.5 | Consecutive or sustained notes at D5 (74) or above |
| **Leap After High** | 0.4 | Leap of a 5th or more landing at D5 or above |
| **Rapid Direction Change** | 0.3 | More than three direction reversals at eighth-note spacing or faster |
| **Isolated Note** | 0.3 | Notes with a 5th or wider on both sides |
| **Breathless** | 0.25 | More than five consecutive short notes with no breathing gap |
| **Strong-Beat Non-Chord Tone** | 0.2 | Fewer than half the strong-beat notes are chord tones |
| **Monotony** | 0.2 | Fewer than half the notes are distinct pitches |
| **Low Cohesion** | ~0.18 | Cohesion below the style threshold — scattered notes with no stepwise runs, rhythmic consistency or repeated cells |
| **Gap Ratio** | ~0.375 | Silence relative to the phrase, above the style threshold |

The Breathless penalty is skipped for the Vocaloid styles, and the cohesion and gap thresholds move with the vocal style.

::: details Phrase Cohesion Criteria
- Stepwise motion runs (connected notes)
- Consistent rhythm patterns
- 3-gram cell repetition (interval + duration motifs)
:::

#### Bonuses

| Bonus | Range | Detection Target |
|-------|-------|------------------|
| **Clear Peak** | 0.0-0.15 | A single highest note, landing between 25% and 85% of the way through the phrase |
| **Motif Repeat** | 0.0-0.2 | AAAB repetition pattern |

### Style Score

Every candidate is scored on 7 dimensions, each weighted by the vocal style:

<DocFigure name="melody-score-dimensions" />

#### Singability Score

Measures interval distribution:

| Interval Type | Target Range |
|---------------|-------------|
| Step (1-2 semitones) | 40-50% |
| Same pitch | 20-30% |
| Small leap (3-4 semitones) | 15-25% |
| Large leap (5+ semitones) | 5-10% |

#### Chord Tone Ratio

Measures chord tone frequency on strong beats:

- **Strong beat**: Beats 1 and 3 in 4/4 time (every 2 beats, tick % 960 == 0)
- Higher ratio indicates more harmonically grounded melodies

#### Contour Shape

Detects melodic shapes:
- **Arch**: Rise then fall
- **Wave**: Oscillating pattern
- **Descending**: Gradual descent

#### Surprise Element

Measures large leaps (5+ semitones) per phrase. Target: 1-2 leaps.

#### AAAB Pattern

Detects repetition with variation - same phrase repeats 3 times then varies.

#### Rhythm-Interval Correlation

Measures how well note durations match interval sizes:

| Combination | Score | Reason |
|-------------|-------|--------|
| Long note + large leap | High | Singers need time for large jumps |
| Short note + step | High | Quick passages work best stepwise |
| Short note + large leap | Low | Difficult to sing |

Based on pop vocal theory: singers need preparation time for large pitch changes. This scoring rewards melodies that are naturally singable.

#### Catchiness

Measures hook memorability from four factors: repetition of 2- and 3-note interval patterns (30 %), consistency of note durations (25 %), the proportion of intervals no larger than a major 3rd (25 %), and recognisable hook contours (20 %). Two to four consecutive same-pitch notes earn a bonus; five or more are penalised as monotonous. This is the heaviest single weight for the Idol and K-Pop profiles.

## Style-Specific Weights

Different vocal styles use different evaluation weights:

| Style | Singability | Surprise | Plateau Bias | High Register |
|-------|-------------|----------|--------------|---------------|
| **Standard** | 0.15 | 0.15 | 1.0 | 0.8 |
| **Idol** | 0.18 | 0.05 | 1.25 | 0.85 |
| **Rock** | 0.15 | 0.20 | 0.8 | 1.2 |
| **Ballad** | 0.30 | 0.05 | 1.0 | 0.5 |
| **Anime** | 0.10 | 0.15 | 1.3 | 1.3 |
| **Vocaloid** | 0.10 | 0.20 | 0.9 | 1.2 |
| **CityPop** | 0.15 | 0.15 | 0.9 | 0.9 |
| **KPop** | 0.12 | 0.18 | 1.4 | 1.1 |

Singability and Surprise are scoring weights that sum to 1.0 across all seven dimensions. Plateau Bias and High Register are generation biases applied while candidates are built, so they are multipliers around 1.0 rather than weights.

::: details Parameter Definitions
- **Singability**: Weight for interval-based scoring
- **Surprise**: Weight for large leap detection
- **Plateau Bias**: Preference for same-pitch continuation
- **High Register**: Preference for higher pitches
:::

### Style-Specific Cohesion Thresholds

Different styles require different levels of melodic cohesion:

| Style | Cohesion threshold |
|-------|-------------------|
| Ballad, CityPop | 0.50 |
| Standard and others | 0.45 |
| Vocaloid, UltraVocaloid, Rock, PowerfulShout | 0.35 |

Melodies below the cohesion threshold are penalised.

### Style-Specific Gap Thresholds

| Style | Gap threshold |
|-------|--------------|
| Ballad | 0.50 |
| CityPop | 0.45 |
| Standard and others | 0.40 |
| Anime | 0.35 |
| Idol, BrightKira, CuteAffected, Rock, PowerfulShout | 0.30 |
| Vocaloid, UltraVocaloid | 0.25 |

## Post-Generation Analysis

The Dissonance Analyzer checks harmonic issues after generation.

### Issue Types

| Type | Description | Example |
|------|-------------|---------|
| **Simultaneous Clash** | Two notes with dissonant interval | Bass E + Melody F = minor 2nd |
| **Non-Chord Tone** | Note not in current chord | D over C major chord |
| **Sustained Over Chord Change** | Note became non-chord after change | C sustained over F chord |
| **Non-Diatonic Note** | Note not in the key's scale | F# in C major |

### Severity Levels

| Severity | Intervals | Notes |
|----------|-----------|-------|
| **High** | Minor 2nd (1), Major 2nd (2) in close range, minor 9th (13), Major 7th (11) over any chord other than I or IV | Strong dissonance |
| **Medium** | Tritone (6) in close range, Major 7th over I or IV (may be an intended maj7), strong-beat non-chord tone | Context-dependent |
| **Low** | Weak-beat non-chord tone (passing tone), compound minor 2nd or Major 7th, compound tritone | Often acceptable |

Any issue landing on beat 1 of a section start is raised one level, because a clash at that position is the most exposed.

### CLI Usage

```bash
# Generate and analyze
./build/bin/midisketch_cli --seed 42 --analyze

# Analyze existing MIDI
./build/bin/midisketch_cli --input song.mid --analyze
```

See the [CLI dissonance analysis reference](/docs/cli#dissonance-analysis) for the current report fields and output example.

## Pipeline Summary

<DocFigure name="melody-evaluation-pipeline" />

## Summary

- Multiple candidates are generated per section (20-100)
- Each candidate carries one combined score: 40 % style, 40 % penalty, 20 % interval bias
- The bottom half is cut by rank, and the winner is a score-weighted random draw from the rest
- Style-specific weights and thresholds adjust evaluation criteria
- Post-generation dissonance analysis available
