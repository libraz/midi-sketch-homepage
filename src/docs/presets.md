# Presets Reference

This document lists all available presets in [MIDI Sketch](https://github.com/libraz/midi-sketch).

::: tip New to these settings?
Each preset is a bundle of the config fields taught in the course. The capstone chapter [Mapping Concepts to Config](/docs/course/config-mapping) shows how every preset value maps back to a musical idea.
:::

## Structure Patterns

18 song structure patterns are available:

| ID | Name | Bars | Duration @120 BPM | Sections |
|----|------|------|-------------------|----------|
| 0 | StandardPop | 24 | 0:48 | A(8)-B(8)-Chorus(8) |
| 1 | BuildUp | 28 | 0:56 | Intro(4)-A(8)-B(8)-Chorus(8) |
| 2 | DirectChorus | 16 | 0:32 | A(8)-Chorus(8) |
| 3 | RepeatChorus | 32 | 1:04 | A(8)-B(8)-Chorus(8)-Chorus(8) |
| 4 | ShortForm | 12 | 0:24 | Intro(4)-Chorus(8) |
| 5 | FullPop | 56 | 1:52 | Intro-A-B-Chorus-A-B-Chorus-Outro |
| 6 | FullWithBridge | 48 | 1:36 | Intro-A-B-Chorus-Bridge-Chorus-Outro |
| 7 | DriveUpbeat | 48 | 1:36 | Intro-Chorus-A-B-Chorus-Chorus-Outro |
| 8 | Ballad | 60 | 2:00 | Intro(8)-A-B-Chorus-Interlude-B-Chorus-Outro |
| 9 | AnthemStyle | 56 | 1:52 | Intro-A-Chorus-A-B-Chorus-Chorus-Outro |
| 10 | ExtendedFull | 88 | 2:56 | Full form with extended sections |
| 11 | ChorusFirst | 32 | 1:04 | Chorus(8)-A(8)-B(8)-Chorus(8) |
| 12 | ChorusFirstShort | 24 | 0:48 | Chorus(8)-A(8)-Chorus(8) |
| 13 | ChorusFirstFull | 56 | 1:52 | Chorus-A-B-Chorus-A-B-Chorus |
| 14 | ImmediateVocal | 24 | 0:48 | A(8)-B(8)-Chorus(8) (no intro) |
| 15 | ImmediateVocalFull | 48 | 1:36 | A-B-Chorus-A-B-Chorus (no intro) |
| 16 | AChorusB | 32 | 1:04 | A(8)-Chorus(8)-B(8)-Chorus(8) |
| 17 | DoubleVerse | 32 | 1:04 | A(8)-A(8)-B(8)-Chorus(8) |

### Section Types

<DocFigure name="presets-section-flow" />

| Type | Vocal Density | Energy | Purpose |
|------|---------------|--------|---------|
| Intro | None | Low | Establish mood |
| A | Sparse | Medium-Low | Verse, storytelling |
| B | Full | Medium | Pre-chorus, tension |
| Chorus | Full | High | Hook, payoff |
| Bridge | Sparse | Medium | Contrast |
| Interlude | None | Low | Instrumental break |
| Outro | None | Medium-Low | Resolution |
| Chant | None | Low | Call-and-response chant |
| MixBreak | None | High | MIX break before the last chorus |
| Drop | None | High | EDM drop: kick and sub-bass only, then re-entry |

::: tip Duration Calculation
At 120 BPM: 1 bar ≈ 2 seconds. Use `targetDurationSeconds=0` to use the exact pattern duration, or specify a target duration for auto-generated structures.
:::

## Mood Presets

24 mood presets define the overall feel:

| ID | Name | BPM | Drum Style | Character |
|----|------|-----|------------|-----------|
| 0 | StraightPop | 120 | Standard | Classic pop groove |
| 1 | BrightUpbeat | 130 | Upbeat | Syncopated, energetic |
| 2 | EnergeticDance | 140 | FourOnFloor | Dance-oriented |
| 3 | LightRock | 125 | Rock | Guitar-oriented feel |
| 4 | MidPop | 110 | Upbeat | Balanced mid-tempo |
| 5 | EmotionalPop | 105 | Sparse | Sentimental, softer |
| 6 | Sentimental | 100 | Standard | Ballad-like |
| 7 | Chill | 85 | Sparse | Relaxed, minimal |
| 8 | Ballad | 75 | Sparse | Slow, sparse drums |
| 9 | DarkPop | 115 | FourOnFloor | Darker, dramatic |
| 10 | Dramatic | 100 | Rock | High expression |
| 11 | Nostalgic | 105 | Standard | Retro feel |
| 12 | ModernPop | 125 | Upbeat | Contemporary |
| 13 | ElectroPop | 135 | FourOnFloor | Electronic, dance |
| 14 | IdolPop | 145 | Upbeat | J-pop idol style |
| 15 | Anthem | 130 | Upbeat | Triumphant, grand |
| 16 | AnimeHighEnergy | 130 | Synth | Anime-style high-energy pop |
| 17 | Synthwave | 118 | Synth | Retro synth, neon |
| 18 | FutureBass | 145 | Synth | Modern electronic |
| 19 | CityPop | 110 | Standard | 80s city pop vibe |
| 20 | RnBNeoSoul | 92 | Standard | R&B/Neo-Soul, strong swing, extended chords; practical band 85-100 |
| 21 | LatinPop | 95 | Latin | Latin Pop, dembow rhythm, tresillo bass |
| 22 | Trap | 70 | Trap | Trap, half-time feel, 808 sub-bass, hi-hat rolls |
| 23 | Lofi | 80 | Sparse | Lo-fi, strong swing, max velocity 90 |

### Mood Categories

<DocFigure name="presets-mood-tempo-bands" />

## Chord Progressions

22 chord progressions: twenty of four chords and two of five.

### Diatonic four-chord loops

| ID | Name | Degrees | In C |
|----|------|---------|------|
| 0 | FourChordPop | I - V - vi - IV | C - G - Am - F |
| 1 | Pop1 | I - vi - IV - V | C - Am - F - G |
| 2 | Axis | vi - IV - I - V | Am - F - C - G |
| 3 | Pop2 | IV - I - V - vi | F - C - G - Am |
| 4 | Classic | I - IV - V - I | C - F - G - C |
| 5 | Pop3 | I - IV - vi - V | C - F - Am - G |
| 6 | Oudou | IV - V - iii - vi | F - G - Em - Am |
| 9 | Pop4 | I - V - iii - IV | C - G - Em - F |
| 10 | Pop5 | I - iii - IV - V | C - Em - F - G |
| 13 | Extended4 | I - V - vi - iii | C - G - Am - Em |

### Minor-flavoured four-chord loops

| ID | Name | Degrees | In C |
|----|------|---------|------|
| 7 | Minor1 | vi - V - IV - V | Am - G - F - G |
| 8 | Minor2 | vi - IV - V - I | Am - F - G - C |
| 14 | Minor3 | vi - I - V - IV | Am - C - G - F |
| 16 | AnimeHighEnergy1 | vi - iii - IV - I | Am - Em - F - C |
| 18 | AnimeHighEnergy2 | vi - ii - V - I | Am - Dm - G - C |

### Borrowed and jazz-leaning

| ID | Name | Degrees | In C |
|----|------|---------|------|
| 11 | Rock1 | I - bVII - IV - I | C - Bb - F - C |
| 12 | Rock2 | I - IV - bVII - I | C - F - Bb - C |
| 15 | AeolianPop | vi - bVI - bVII - I | Am - Ab - Bb - C |
| 17 | JazzPop | ii - V - I - vi | Dm - G - C - Am |
| 19 | CityPop | I - vi - ii - V | C - Am - Dm - G |

### Five-chord

| ID | Name | Degrees | In C |
|----|------|---------|------|
| 20 | Extended5 | I - V - vi - iii - IV | C - G - Am - Em - F |
| 21 | NeapolitanPop | vi - iv - bII - V - I | Am - Fm - Db - G - C |

## Style Presets

17 style presets that combine mood, structure, and composition approach:

::: tip Choosing a Style Preset
Style presets provide sensible defaults for BPM, structure, vocal attitude, and recommended chord progressions. You can override any of these settings after calling `createDefaultConfig()`.
:::

| ID | Name | Description | Default BPM |
|----|------|-------------|-------------|
| 0 | Minimal Groove Pop | Repetitive 2-4 chord loops, simple melody | 122 |
| 1 | Dance Pop Emotion | Classic structure, emotional chorus release | 128 |
| 2 | Bright Pop | Upbeat, memorable melodies with simple structure | 135 |
| 3 | Idol Standard | Unison-friendly, memorable melodies | 140 |
| 4 | Idol Emotion | Emotional idol songs with building pre-chorus | 130 |
| 5 | Idol Energy | High-energy idol songs for live performances | 150 |
| 6 | Idol Minimal | Minimal idol songs for short-form content | 135 |
| 7 | Rock Shout | Aggressive vocals with raw expression | 125 |
| 8 | Pop Emotion | Word-driven emotional pop with lyrical focus | 108 |
| 9 | Raw Emotional | Intense emotional expression with boundary-breaking phrases | 102 |
| 10 | Acoustic Pop | Clear harmony, rhythm-light, vocal-centered | 95 |
| 11 | Live Call & Response | Concert-ready with call-response structure | 140 |
| 12 | Background Motif | Motif-driven defaults with subdued vocals; uses MelodyLead | 120 |
| 13 | City Pop | Groovy 80s Japanese city pop with jazzy chords | 105 |
| 14 | Anime Opening | Epic, dramatic anime OP style with building energy | 142 |
| 15 | EDM Synth Pop | Modern electronic dance music with synth leads | 138 |
| 16 | Emotional Ballad | Slow emotional ballad with expressive vocals | 72 |

### Style Categories

| Category | IDs | Description |
|----------|-----|-------------|
| Pop/Dance | 0-2 | General pop and dance styles |
| Idol | 3-6 | Japanese idol music styles |
| Rock/Emo | 7-9 | Rock and emotional styles with raw expression |
| Special/Derived | 10-12 | Acoustic, live, and ambient styles |
| Genre-Specific | 13-16 | City pop, anime, EDM, and ballad styles |

## Composition Styles

3 composition approaches:

| Style | Focus | Vocal | Aux | Key Features |
|-------|-------|-------|-----|--------------|
| MelodyLead (0) | Vocal melody | Yes | Yes | Full melodic expression; Motif follows paradigm, riff, addictive, and Blueprint gates |
| BackgroundMotif (1) | Repeating pattern | No | Yes | Motif generation enabled; section masks/layering apply; Aux stays active |
| SynthDriven (2) | Synth/Arpeggio | No | No | Motif generation enabled; section masks/layering apply; arpeggio requires manual `arpeggioEnabled=true` |

::: warning BGM-Only Modes
BackgroundMotif and SynthDriven do not generate vocal tracks. BackgroundMotif keeps Aux active and enables Motif generation; SynthDriven disables both Vocal and Aux and enables Motif generation. Section masks and layer schedules determine where Motif notes remain. Use MelodyLead for songs with vocals.
:::

## Production Blueprints

10 production blueprints control **how** the music is generated (arrangement style), independent of style/mood:

| ID | Name | Paradigm | RiffPolicy | Drums Required | Weight |
|----|------|----------|------------|:--------------:|:------:|
| 0 | Traditional (standard pop) | Traditional | Free | - | 42% |
| 1 | RhythmLock (rhythm-locked) | RhythmSync | Locked | **Yes** | 14% |
| 2 | StoryPop (unfolds like a story) | MelodyDriven | Evolving | - | 10% |
| 3 | Ballad (quiet opening) | MelodyDriven | Free | - | 4% |
| 4 | IdolStandard (idol mainstream) | MelodyDriven | Evolving | - | 10% |
| 5 | IdolHyper (chorus up front) | RhythmSync | Locked | **Yes** | 6% |
| 6 | IdolKawaii (cute and bouncy) | MelodyDriven | Locked | - | 5% |
| 7 | IdolCoolPop (danceable beat) | RhythmSync | Locked | **Yes** | 5% |
| 8 | IdolEmo (calm into explosion) | MelodyDriven | Locked | - | 4% |
| 9 | BehavioralLoop (addictive loop) | RhythmSync | LockedPitch | - | 0%* |
| 255 | (Random) | - | - | - | - |

\*BehavioralLoop: explicit selection only (weight 0%, not randomly selected). Forces `addictive_mode=true`, `HookIntensity=Maximum`, `RiffPolicy=LockedPitch`.

Use `blueprintId: 255` for auto-selection based on weights.

### Generation Paradigms

| Paradigm | Track Order | Description |
|----------|-------------|-------------|
| Traditional | Vocal → Aux → Motif → Bass → Chord → Guitar → Arpeggio → Drums → SE | Classic pop generation |
| RhythmSync | Motif → Vocal → Aux → Bass → Chord → Guitar → Arpeggio → Drums → SE | Motif-first, rhythm-locked groove |
| MelodyDriven | Vocal → Aux → Motif → Bass → Chord → Guitar → Arpeggio → Drums → SE | Melody-centered, accompaniment follows |

Traditional and MelodyDriven share the same track order; what separates them is collision priority. Under Traditional the Motif outranks Bass and Chord, so they move out of its way. Under MelodyDriven the Motif drops below both, and it is the Motif that yields.

### RiffPolicy

| Policy | Value | Description |
|--------|:-----:|-------------|
| Free | 0 | Each section varies independently |
| LockedContour | 1 | Contour locked, rhythm varies |
| LockedPitch | 2 | Pitch fully locked, velocity varies |
| LockedAll | 3 | All aspects locked |
| Evolving | 4 | The cached riff is mutated once per section, so it drifts while keeping its identity |

Note: `Locked` is an alias for `LockedContour` (1). `motifRepeatScope` is read only under `Free`; every other policy ignores it.

::: tip Blueprint Override
Blueprints 1-8 carry their own section flow, which replaces the `formId` setting. BehavioralLoop (9) defines no section flow, so it keeps whatever `formId` resolves to. The full order is `targetDurationSeconds` > `formExplicit=true` > blueprint section flow > the structure pattern from `formId`. Use ID 0 (Traditional) to keep full control of form structure.
:::

### MelodyLead

<DocFigure name="presets-melody-lead-roles" />

### BackgroundMotif

<DocFigure name="presets-background-motif-roles" />

::: info No Vocal in BackgroundMotif
BackgroundMotif disables the Vocal track. The Aux track remains active and provides sub-melody support alongside the motif.
:::

### SynthDriven

<DocFigure name="presets-synth-driven-roles" />

::: info No Vocal/Aux in SynthDriven
SynthDriven disables both the Vocal and Aux tracks. Arpeggio must be manually enabled (`arpeggioEnabled=true`) as it is not auto-enabled.
:::

## Arpeggio Patterns

8 concrete arpeggio patterns, available in any composition style when `arpeggioEnabled=true`:

| ID | Name | Description |
|----|------|-------------|
| 0 | Up | Ascending pattern |
| 1 | Down | Descending pattern |
| 2 | UpDown | Up then down pattern |
| 3 | Random | Random note order |
| 4 | Pinwheel | Rotating pattern |
| 5 | PedalRoot | Root pedal tone with moving upper voices |
| 6 | Alberti | Classical Alberti bass pattern |
| 7 | BrokenChord | Broken chord pattern |

For `SongConfig`, `arpeggioPattern: 255` and `arpeggioSpeed: 255` select Auto values from the mood. `arpeggioGate: -1` uses the style default; concrete values override these defaults.

## Vocal Attitudes

3 melodic expression levels:

| Attitude | Characteristics | Best For |
|----------|-----------------|----------|
| Clean | Chord tones only, on-beat | Pop, ballad |
| Expressive | Tensions, timing variation | Emotional, dynamic |
| Raw | Non-chord tones, boundary breaking | Edgy, modern |

## Melody Templates

`melodyTemplate` takes 8 values — Auto plus 7 concrete templates — and each defines the core melodic behavior using a **template-driven** approach:

| ID | Name | Plateau | Max Step | Use Case |
|----|------|---------|----------|----------|
| 0 | Auto | - | - | VocalStyle-based selection |
| 1 | PlateauTalk | 0.70 | 2 | Talk-like, narrow-range pop |
| 2 | RunUpTarget | 0.20 | 3 | Anime high-energy, dramatic pop |
| 3 | DownResolve | 0.40 | 2 | B-section, pre-chorus |
| 4 | HookRepeat | 0.55 | 2 | Short-form, K-POP hooks |
| 5 | SparseAnchor | 0.30 | 4 | Sparse, sustained ballad phrasing |
| 6 | CallResponse | 0.35 | 3 | Duet patterns |
| 7 | JumpAccent | 0.25 | 5 | Emotional peaks |

- **Plateau ratio**: Probability of staying on the same pitch (0.0-1.0)
- **Max step**: Maximum melodic interval in semitones

## Vocal Style Presets

14 vocal style presets. A style does not pick one melody template for the whole song: the template is resolved per section, from a style-and-section override table first and the section default second.

| ID | Name | Verse (A) | Chorus | Character |
|----|------|-----------|--------|-----------|
| 0 | Auto | PlateauTalk | HookRepeat | Section defaults |
| 1 | Standard | PlateauTalk | HookRepeat | Balanced pop vocal |
| 2 | Vocaloid | RunUpTarget | RunUpTarget | Fast, wide leaps |
| 3 | UltraVocaloid | RunUpTarget | RunUpTarget | Extreme speed (32nd notes) |
| 4 | Idol | CallResponse | HookRepeat | Catchy hooks, group calls |
| 5 | Ballad | SparseAnchor | SparseAnchor | Slow, sustained |
| 6 | Rock | PlateauTalk | JumpAccent | Powerful, register shift |
| 7 | CityPop | PlateauTalk | HookRepeat | Jazzy, groovy |
| 8 | Anime | PlateauTalk | HookRepeat | Dynamic hooks |
| 9 | BrightKira | CallResponse | HookRepeat | High register |
| 10 | CoolSynth | PlateauTalk | HookRepeat | Electronic, precise |
| 11 | CuteAffected | CallResponse | HookRepeat | Playful, cute |
| 12 | PowerfulShout | PlateauTalk | JumpAccent | Intense, shout-y |
| 13 | KPop | PlateauTalk | HookRepeat | Syncopation focus, hook-driven |

Rock, PowerfulShout and the three idol styles additionally use CallResponse in the Bridge.

### Vocal Style Categories

<DocFigure name="presets-vocal-style-bands" />

## Melodic Complexity

3 complexity levels affecting melody generation:

| Level | Effect | Use Case |
|-------|--------|----------|
| Simple (0) | Reduced density, smaller leaps, more hooks | Catchy, memorable |
| Standard (1) | Default behavior | General use |
| Complex (2) | Increased density, larger leaps, more variation | Sophisticated |

## Hook Intensity

5 hook repetition levels:

| Level | Effect | Use Case |
|-------|--------|----------|
| Off (0) | No hook repetition | Progressive, varied |
| Light (1) | Light hook presence | Subtle callbacks |
| Normal (2) | Standard repetition | Balanced pop (default) |
| Strong (3) | Strong hook emphasis | Catchy, commercial |
| Maximum (4) | Maximum repetition, simple patterns only | BehavioralLoop; set automatically by `blueprintId=9` |

## Vocal Groove Feel

6 rhythm feel options:

| Groove | Effect | Best For |
|--------|--------|----------|
| Straight (0) | On-beat, no swing | Pop, rock |
| OffBeat (1) | Off-beat emphasis | Reggae-influenced |
| Swing (2) | Swing timing | Jazz, R&B |
| Syncopated (3) | Syncopated rhythm | Latin, funk |
| Driving16th (4) | 16th note drive | Electronic, fast pop |
| Bouncy8th (5) | Bouncy 8th notes | Upbeat pop |

::: warning Syncopation Dependency
The syncopation effects of VocalGroove (OffBeat, Swing, Syncopated, Driving16th, Bouncy8th) only take effect when `enableSyncopation=true`. When `enableSyncopation=false`, syncopation weight is forced to 0.0, `syncopation_prob` is set to 0.0, and `allow_bar_crossing` is set to `false`. Timing offsets (e.g., +60 ticks for OffBeat) are applied regardless of the `enableSyncopation` setting.
:::

## Energy Curve

4 energy curve options control how energy progresses throughout the song:

| Value | Name | Description |
|-------|------|-------------|
| 0 | GradualBuild | Gradually building energy (default) |
| 1 | FrontLoaded | High energy from the start, settling later |
| 2 | WavePattern | Wave-like energy progression |
| 3 | SteadyState | Maintain consistent energy level |

## Mora Rhythm Mode

3 rhythm modes for syllable timing:

| Value | Name | Description |
|-------|------|-------------|
| 0 | Standard | English stress-timed rhythm |
| 1 | MoraTimed | Japanese mora-timed (equal syllable groups) |
| 2 | Auto | Auto-select from VocalStylePreset (default) |

`syllabicSubRate` adds a syllabic subdivision setting alongside `moraRhythmMode`: `0` keeps the style default and does not turn subdivision off; `1`-`100` overrides the style ratio as a percentage.

## Melody Overrides

Fine-grained melody parameters that override VocalStylePreset and MelodicComplexity defaults. Sentinel values (0, 0xFF, -128) preserve preset defaults.

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `melodyMaxLeap` | 0=preset, 1-12 | 0 | Maximum melodic leap in semitones |
| `melodySyncopationProb` | 0-100, 0xFF=preset | 0xFF | Syncopation probability (%) |
| `melodyPhraseLength` | 0=preset, 1-8 | 0 | Phrase length in bars |
| `melodyLongNoteRatio` | 0-100, 0xFF=preset | 0xFF | Long note ratio (%) |
| `melodyChorusRegisterShift` | -12 to +12, -128=preset | -128 | Chorus register shift in semitones |
| `melodyHookRepetition` | 0=preset, 1=off, 2=on | 0 | Hook repetition (tri-state) |
| `melodyUseLeadingTone` | 0=preset, 1=off, 2=on | 0 | Leading tone insertion at section boundaries (tri-state) |

::: tip Parameter Application Order
Melody overrides are applied after StylePreset, VocalStylePreset, and MelodicComplexity. User-specified values always take the highest priority.
:::

## Motif Overrides

Fine-grained motif parameters that override style defaults:

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `motifLength` | 0=auto, 1/2/4 | 0 | Motif length in bars |
| `motifNoteCount` | 0=auto, 3-8 | 0 | Number of notes in the motif |
| `motifMotion` | 0xFF=preset, 0-5 | 0xFF | Motion type (0=Stepwise, 1=GentleLeap, 2=WideLeap, 3=NarrowStep, 4=Disjunct, 5=Ostinato) |
| `motifRegisterHigh` | 0=auto, 1=low, 2=high | 0 | Register range |
| `motifRhythmDensity` | 0xFF=preset, 0-2 | 0xFF | Rhythm density (0=Sparse, 1=Medium, 2=Driving) |

## Drive Feel

Continuous value 0-100 controlling performance intensity:

- **0** = Laid-back (relaxed timing, lower velocity)
- **50** = Neutral (default)
- **100** = Aggressive (ahead timing, higher velocity, enhanced syncopation with `enableSyncopation=true`)

## Key Options

12 keys available (0-11):

| ID | Key | Notes |
|----|-----|-------|
| 0 | C | Natural, no sharps/flats |
| 1 | C# / Db | 7 sharps / 5 flats |
| 2 | D | 2 sharps |
| 3 | D# / Eb | 3 flats |
| 4 | E | 4 sharps |
| 5 | F | 1 flat |
| 6 | F# / Gb | 6 sharps / 6 flats |
| 7 | G | 1 sharp |
| 8 | G# / Ab | 4 flats |
| 9 | A | 3 sharps |
| 10 | A# / Bb | 2 flats |
| 11 | B | 5 sharps |

## BPM Range

Valid tempo range: **40-240 BPM**

::: info BPM Setting
- Set to `0` to use the style preset's default BPM
- Each style preset has an optimal default BPM setting
- BPM outside the 40-240 range will cause validation errors
:::

## Configuration Examples

### Simple Pop Song

```javascript
import { createDefaultConfig } from '@libraz/midi-sketch'

// Use MinimalGroovePop preset
const config = createDefaultConfig(0)
config.key = 0                  // C major
config.chordProgressionId = 0   // FourChordPop (I-V-vi-IV)
config.formId = 0               // StandardPop
config.bpm = 0                  // Use default (122)
config.drumsEnabled = true
```

### Emotional Ballad

```javascript
// Use Emotional Ballad preset
const config = createDefaultConfig(16) // Emotional Ballad
config.key = 7                         // G major
config.chordProgressionId = 4          // Classic (I-IV-V-I)
config.formId = 8                      // Ballad structure
config.bpm = 0                         // Use default (72)
config.drumsEnabled = true
```

::: warning Ballad Tempo
Ballad presets typically have slow default tempos (72-95 BPM). If you need a faster ballad, explicitly set `config.bpm`.
:::

### Anime Opening Style

```javascript
// Use Anime Opening preset
const config = createDefaultConfig(14) // Anime Opening
config.key = 2                         // D major
config.chordProgressionId = 2          // Axis (vi-IV-I-V)
config.bpm = 0                         // Use default (142)
config.drumsEnabled = true
config.vocalStyle = 2                  // Vocaloid style
config.melodicComplexity = 2           // Complex melodies
config.hookIntensity = 3               // Strong hooks
```

::: tip Vocaloid-style Melodies
For dramatic-pop-style dense melodies with wide intervals, use:
- `vocalStyle: 2` (Vocaloid) or `vocalStyle: 3` (UltraVocaloid)
- `melodicComplexity: 2` (Complex)
- `melodyTemplate: 2` (RunUpTarget)
:::

### Chill Background

```javascript
// Use Background Motif defaults with the BGM composition style
const config = createDefaultConfig(12)  // Background Motif defaults (MelodyLead mapping)
config.key = 5                          // F major
config.chordProgressionId = 5           // Pop3 (I-IV-vi-V)
config.formId = 4                       // ShortForm
config.bpm = 95
config.drumsEnabled = false             // No drums for ambient
config.compositionStyle = 1             // BackgroundMotif
config.compositionStyleExplicit = true
```

::: info Background Motif Style
The Background Motif preset (ID 12) uses `MelodyLead`, with motif-oriented defaults and subdued vocal settings. For vocal-free BGM, set `compositionStyle=1` and `compositionStyleExplicit=true`; this style disables Vocal while keeping Aux active.
:::

### Idol Pop with Calls

```javascript
// Use Idol Standard preset
const config = createDefaultConfig(3)  // Idol Standard
config.key = 0                         // C major
config.callSetting = 1                 // Enable call track (0=Auto, 1=Enabled, 2=Disabled)
config.introChant = 1                  // Gachikoi intro
config.mixPattern = 1                  // Standard mix
config.callDensity = 2                 // Standard density
config.modulationTiming = 1            // Modulate at last chorus
config.modulationSemitones = 2         // Up 2 semitones
```

### Syncopation & Groove

```javascript
const config = createDefaultConfig(0)
config.enableSyncopation = true        // Enable syncopation
config.vocalGroove = 3                 // Syncopated rhythm
```

### Energy Curve

```javascript
const config = createDefaultConfig(0)
config.energyCurve = 1                 // FrontLoaded energy
```

### Melody Fine-Grained Control

```javascript
const config = createDefaultConfig(0)
config.melodyMaxLeap = 5              // Max melodic leap in semitones
config.melodyPhraseLength = 4         // Phrase length in bars
config.melodyHookRepetition = 2       // Hook repetition ON (tri-state: 0=preset, 1=off, 2=on)
```

### Motif Fine-Grained Control

```javascript
const config = createDefaultConfig(12) // Background Motif defaults (MelodyLead mapping)
config.motifLength = 4                 // Motif length in bars
config.motifNoteCount = 5             // Number of notes in motif
config.motifMotion = 1                // Motif motion type
config.motifRhythmDensity = 2         // Rhythm density level
config.compositionStyle = 1            // BackgroundMotif
config.compositionStyleExplicit = true
```

### Guitar Track

```javascript
const config = createDefaultConfig(0)
config.guitarEnabled = true            // Enable guitar track
```

### R&B / Neo-Soul

```javascript
const config = createDefaultConfig(0)
config.mood = 20                      // RnBNeoSoul mood
config.moodExplicit = true            // Use the explicit mood instead of style default
config.chordExt7th = true             // Enable 7th extensions
config.chordExt9th = true             // Enable 9th extensions
```

### Lo-fi BGM

```javascript
const config = createDefaultConfig(12) // Background Motif defaults (MelodyLead mapping)
config.mood = 23                      // Lofi mood
config.moodExplicit = true            // Use the explicit mood instead of style default
config.compositionStyle = 1           // BackgroundMotif
config.compositionStyleExplicit = true
```

### Mora Timing

```javascript
const config = createDefaultConfig(0)
config.moraRhythmMode = 1             // MoraTimed (Japanese mora-timed)
```

### BehavioralLoop

```javascript
const config = createDefaultConfig(0)
config.blueprintId = 9                // BehavioralLoop (addictive loop)
```
