/**
 * Shared types for the music course score example library.
 *
 * Each example is a small one- or two-stave score with localized teaching
 * text, the related MidiSketch config fields it illustrates, and optional
 * overlay marks that highlight a musical pattern on the staff.
 */

export type ScoreLocale = 'en' | 'ja'

/** Text provided in both site languages. */
export type LocalizedText = Record<ScoreLocale, string>

/** A single note, chord, or rest on one staff. */
export interface StaffNote {
  /** VexFlow key, e.g. "c/5". Ignored for rests except for vertical placement. */
  key: string
  /**
   * Chord pitches, e.g. ["c/4", "e/4", "g/4"]. When set, takes precedence
   * over `key` and the note renders as a stacked chord. Spell accidentals
   * directly in the key (e.g. "eb/4") whenever possible.
   */
  keys?: string[]
  /** VexFlow duration: "w", "h", "q", "8", "16" (default "q"). */
  duration?: string
  /** Render as a rest instead of a note. */
  rest?: boolean
  /** Accidental glyph for a single note, e.g. "#", "b", "n". */
  accidental?: string
  /**
   * Per-chord-tone accidental glyphs, index-aligned with `keys`.
   * Use null for chord tones without an explicit glyph.
   */
  accidentals?: (string | null)[]
  /** Chord symbol drawn above the staff (e.g. "Cmaj7", "G7"). */
  chordSymbol?: string
  /** Notehead color override. */
  color?: string
  /** Short label drawn below the note (degree, interval, function, etc.). */
  annotation?: string
  /** Draw the dashed highlight ring around the notehead. */
  issue?: boolean
  /** Tie this note to the next note in the same voice (same pitch). */
  tie?: boolean
}

/** Overlay mark connecting or framing notes to explain the teaching point. */
export interface IssueMark {
  kind: 'vertical' | 'motion' | 'note' | 'bracket'
  label: string
  upperIndex?: number
  middleIndex?: number
  lowerIndex?: number
  fromUpper?: number
  toUpper?: number
  fromMiddle?: number
  toMiddle?: number
  fromLower?: number
  toLower?: number
  /** Optional color override (defaults to RED). */
  color?: string
}

/** Complete definition of one score example. */
export interface ScoreExampleDef {
  /** Related MidiSketch config fields / concepts (shown as chips). */
  tags: string[]
  badge: LocalizedText
  title: LocalizedText
  /** One-line reading of what the example shows. */
  diagnosis: LocalizedText
  /** Longer caption under the score. */
  caption: LocalizedText
  /** Time signature: "2/4", "3/4", or "4/4". */
  time: string
  /** Number of bars (default 1). Bars are separated by barlines. */
  bars?: number
  /**
   * Key signature (VexFlow spec such as "Cm" or "F"). When set, note keys
   * must be spelled with their sounding accidental (e.g. "bb/2") and the
   * accidental fields are reserved for explicit glyphs such as naturals.
   */
  keySignature?: string
  /** Rendered width in CSS pixels. */
  width: number
  upperClef: 'treble' | 'bass'
  /** Clef for the optional middle stave (three-voice examples). */
  middleClef?: 'treble' | 'bass'
  /** Clef for the optional lower stave. Omit `lower` for single-stave examples. */
  lowerClef?: 'treble' | 'bass'
  /** Optional stave label override (defaults to "melody"/"chords"). */
  upperLabel?: LocalizedText
  /** Optional stave label for the middle stave. */
  middleLabel?: LocalizedText
  /** Optional stave label override. */
  lowerLabel?: LocalizedText
  upper: StaffNote[]
  /** Optional middle voice rendered on its own stave between upper and lower. */
  middle?: StaffNote[]
  /** Optional lower voice. Omit for single-stave examples. */
  lower?: StaffNote[]
  issues?: IssueMark[]
  /**
   * How the play button renders the example: all staves together (default)
   * or one after the other (side-by-side comparisons such as
   * "plain triad vs extended chord").
   */
  playback?: 'together' | 'sequential'
}

/** Issue highlight (avoid / dissonant). */
export const RED = '#b91c1c'
/** Attention highlight (conditionally used / tension). */
export const AMBER = '#b45309'
/** Positive highlight (stable / resolved pattern). */
export const GREEN = '#047857'

/** Beats per bar from the example's time signature. */
export function beatsPerBar(time: string): number {
  const beats = Number(time.split('/')[0])
  return Number.isFinite(beats) && beats > 0 ? beats : 4
}

/** Duration of one note in beats (quarter = 1). */
export function durationBeats(duration?: string): number {
  switch (duration ?? 'q') {
    case 'w': return 4
    case 'h': return 2
    case '8': return 0.5
    case '16': return 0.25
    default: return 1
  }
}

/** Total beats covered by a sequence of notes. */
export function totalBeats(notes: StaffNote[]): number {
  return notes.reduce((sum, note) => sum + durationBeats(note.duration), 0)
}

/** All sounding pitches of a note (chord-aware). */
export function notePitches(note: StaffNote): string[] {
  return note.keys ?? [note.key]
}
