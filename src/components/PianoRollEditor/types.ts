// ============================================================================
// Piano Roll Editor - Shared Types
// ============================================================================

// SafePAI Safety Levels
export const NoteSafety = {
  Safe: 0,
  Warning: 1,
  Dissonant: 2,
} as const

export type NoteSafetyLevel = typeof NoteSafety[keyof typeof NoteSafety]

export const NoteReason = {
  None: 0,
  // Chord tone details (bits 0-3)
  ChordTone: 1,
  Root: 2,
  Third: 4,
  Fifth: 8,
  Seventh: 16,
  // Tension details (bits 4-6)
  Tension: 32,
  Ninth: 64,
  Eleventh: 128,
  Thirteenth: 256,
  // Scale/chromatic (bits 7-8)
  ScaleTone: 512,
  NonScale: 1024,
  // Register warnings (bits 9-11)
  LowRegister: 2048,
  HighRegister: 4096,
  OutOfRange: 8192,
  TooLow: 16384,
  TooHigh: 32768,
  // Interval warnings (bits 12-15)
  Tritone: 65536,
  LargeLeap: 131072,
  Minor2nd: 262144,
  Major7th: 524288,
  // Special
  PassingTone: 1048576,
  AvoidNote: 2097152,
} as const

export type NoteReasonFlags = number

// ============================================================================
// Core Data Types
// ============================================================================

export interface ChordInfo {
  name: string
  degree: string
  root: number
  type: 'major' | 'minor' | 'dim' | 'aug' | 'dom7' | 'maj7' | 'min7'
  tones: number[]
}

export interface PlacedNote {
  id: string
  pitch: number
  startTick: number
  duration: number
}

export interface PianoRollSafetyInfo {
  tick: number
  chord: ChordInfo
  safety: NoteSafetyLevel[]
  reason: number[]
  recommended: number[]
}

export interface ChordAtBar {
  bar: number  // 1-indexed bar number within view
  name: string
  degree: string
  root?: number  // MIDI pitch of root note (e.g., 48 = C3 for bass)
}

export interface SectionAtBar {
  name: string
  type: string
  startBar: number
  endBar: number
}

// ============================================================================
// Constants
// ============================================================================

export const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

// Full display range (wider than vocal range for context)
export const OCTAVE_RANGE = { min: 3, max: 6 }  // C3 to B6 - 4 octaves
export const TOTAL_NOTES = (OCTAVE_RANGE.max - OCTAVE_RANGE.min + 1) * 12  // 48 notes
export const MIN_NOTE = OCTAVE_RANGE.min * 12  // 36 = C3
export const MAX_NOTE = (OCTAVE_RANGE.max + 1) * 12 - 1  // 83 = B6
export const NOTE_HEIGHT_PX = 16  // Fixed height per note
export const PPQ = 480  // Pulses per quarter note
export const RESIZE_HANDLE_WIDTH = 8
export const PIXELS_PER_BAR_BASE = 400

// Duration presets
export const DURATION_OPTIONS = [
  { label: '1/16', value: 120 },
  { label: '1/8', value: 240 },
  { label: '1/4', value: 480 },
  { label: '1/2', value: 960 },
  { label: '1', value: 1920 },
] as const

// Safety colors are theme-aware and live in the canvas palette
// (see ./palette.ts → PianoRollPalette.safety).

// ============================================================================
// Utility Functions
// ============================================================================

export function midiToNote(midi: number): { name: string; octave: number } {
  return {
    name: NOTE_NAMES[midi % 12],
    octave: Math.floor(midi / 12) - 1,
  }
}

export function isBlackKey(pitch: number): boolean {
  const name = NOTE_NAMES[pitch % 12]
  return name.includes('#') || name.includes('b')
}

export function getReasonText(reason: number): string {
  const reasons: string[] = []

  // Chord tone details
  if (reason & NoteReason.ChordTone) {
    if (reason & NoteReason.Root) reasons.push('Root')
    else if (reason & NoteReason.Third) reasons.push('3rd')
    else if (reason & NoteReason.Fifth) reasons.push('5th')
    else if (reason & NoteReason.Seventh) reasons.push('7th')
    else reasons.push('Chord')
  }

  // Tension details
  if (reason & NoteReason.Tension) {
    if (reason & NoteReason.Ninth) reasons.push('9th')
    else if (reason & NoteReason.Eleventh) reasons.push('11th')
    else if (reason & NoteReason.Thirteenth) reasons.push('13th')
    else reasons.push('Tension')
  }

  // Scale tone
  if (reason & NoteReason.ScaleTone) reasons.push('Scale')

  // Chromatic
  if (reason & NoteReason.NonScale) reasons.push('Chromatic')

  // Avoid note
  if (reason & NoteReason.AvoidNote) reasons.push('Avoid')

  // Register warnings
  if (reason & NoteReason.OutOfRange) {
    if (reason & NoteReason.TooHigh) reasons.push('Too High')
    else if (reason & NoteReason.TooLow) reasons.push('Too Low')
    else reasons.push('Out of Range')
  } else {
    if (reason & NoteReason.LowRegister) reasons.push('Low')
    if (reason & NoteReason.HighRegister) reasons.push('High')
  }

  // Interval warnings
  if (reason & NoteReason.Tritone) reasons.push('Tritone')
  if (reason & NoteReason.LargeLeap) reasons.push('Leap')
  if (reason & NoteReason.Minor2nd) reasons.push('m2')
  if (reason & NoteReason.Major7th) reasons.push('M7')
  if (reason & NoteReason.PassingTone) reasons.push('Passing')

  return reasons.join(', ')
}

// Detailed reason text for tooltip display
export function getDetailedReasonText(reason: number): string[] {
  const details: string[] = []

  // Chord tone details
  if (reason & NoteReason.ChordTone) {
    if (reason & NoteReason.Root) details.push('Chord Root (1st)')
    else if (reason & NoteReason.Third) details.push('Chord 3rd')
    else if (reason & NoteReason.Fifth) details.push('Chord 5th')
    else if (reason & NoteReason.Seventh) details.push('Chord 7th')
    else details.push('Chord Tone')
  }

  // Tension details
  if (reason & NoteReason.Tension) {
    if (reason & NoteReason.Ninth) details.push('Tension 9th')
    else if (reason & NoteReason.Eleventh) details.push('Tension 11th')
    else if (reason & NoteReason.Thirteenth) details.push('Tension 13th')
    else details.push('Tension Note')
  }

  // Scale tone
  if (reason & NoteReason.ScaleTone) details.push('Scale Tone')

  // Chromatic
  if (reason & NoteReason.NonScale) details.push('Non-scale (Chromatic)')

  // Avoid note
  if (reason & NoteReason.AvoidNote) details.push('Avoid Note')

  // Register warnings
  if (reason & NoteReason.OutOfRange) {
    if (reason & NoteReason.TooHigh) details.push('Too High for Vocal')
    else if (reason & NoteReason.TooLow) details.push('Too Low for Vocal')
    else details.push('Out of Vocal Range')
  } else {
    if (reason & NoteReason.LowRegister) details.push('Low Register')
    if (reason & NoteReason.HighRegister) details.push('High Register')
  }

  // Interval warnings
  if (reason & NoteReason.Tritone) details.push('Tritone Interval')
  if (reason & NoteReason.LargeLeap) details.push('Large Leap')
  if (reason & NoteReason.Minor2nd) details.push('Minor 2nd Interval')
  if (reason & NoteReason.Major7th) details.push('Major 7th Interval')
  if (reason & NoteReason.PassingTone) details.push('Passing Tone')

  return details
}

// ============================================================================
// Props Interface
// ============================================================================

export interface PianoRollEditorProps {
  currentTick?: number
  vocalLow?: number
  vocalHigh?: number
  currentKey?: number
  safetyInfo?: PianoRollSafetyInfo | null
  placedNotes?: PlacedNote[]
  previewPitch?: number | null
  gridSnap?: number  // Snap to grid in ticks (default 120 = 1/16)
  totalBars?: number  // Total bars in song (enables seamless horizontal scroll)
  showSafetyAlways?: boolean  // Always show safety colors (default false = hover only)
  chordsInView?: ChordAtBar[]  // Chord progression for all bars
  sectionsInView?: SectionAtBar[]  // Section info for all sections
  getSafetyAtTick?: (tick: number) => PianoRollSafetyInfo | null  // Dynamic safety calculation
  allowHarmony?: boolean  // Allow polyphonic notes (default false = monophonic)
}

// ============================================================================
// Emits Interface
// ============================================================================

export interface PianoRollEditorEmits {
  (e: 'noteClick', pitch: number, tick: number): void
  (e: 'noteHover', pitch: number | null): void
  (e: 'noteAdd', note: { pitch: number; startTick: number; duration: number }): void
  (e: 'noteDelete', noteId: string): void
  (e: 'noteUpdate', note: PlacedNote): void
  (e: 'noteDurationChange', noteId: string, duration: number): void
  (e: 'noteMove', noteId: string, pitch: number, startTick: number): void
  (e: 'noteSplit', noteId: string, splitTick: number): void
  (e: 'noteMerge', noteIds: string[]): void
}
