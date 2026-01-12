/**
 * MIDI utility functions and constants
 */

// Key names for display (uses flats for better readability)
export const KEY_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

// Note names (uses sharps for MIDI standard)
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/**
 * Convert MIDI note number to note name (e.g., 60 -> "C4")
 */
export function midiToNoteName(midi: number): string {
  const note = NOTE_NAMES[midi % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${note}${octave}`
}

/**
 * Convert MIDI note number to frequency in Hz
 */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/**
 * Convert a chord degree (e.g., "I", "vi", "IV7") to actual chord name based on key
 */
export function transposeToKey(degree: string, key: number): string {
  const degreeMap: Record<string, number> = {
    'I': 0, 'II': 2, 'III': 4, 'IV': 5, 'V': 7, 'VI': 9, 'VII': 11,
    'i': 0, 'ii': 2, 'iii': 4, 'iv': 5, 'v': 7, 'vi': 9, 'vii': 11,
    'bII': 1, 'bIII': 3, 'bVI': 8, 'bVII': 10
  }

  const baseDegree = degree.replace(/maj7|7|dim|aug/g, '')
  const suffix = degree.replace(baseDegree, '')
  const interval = degreeMap[baseDegree]

  if (interval === undefined) return degree

  const noteIndex = (key + interval) % 12
  let noteName = KEY_NAMES[noteIndex]

  // Add 'm' for minor chords (lowercase degree)
  if (baseDegree === baseDegree.toLowerCase() && !baseDegree.startsWith('b')) {
    noteName += 'm'
  }

  return noteName + suffix
}

/**
 * Convert a chord progression string (e.g., "I - V - vi - IV") to key-based notation
 */
export function transposeProgressionToKey(progression: string, key: number): string {
  const parts = progression.split(/\s*-\s*/)
  return parts.map(part => transposeToKey(part, key)).join('-')
}
