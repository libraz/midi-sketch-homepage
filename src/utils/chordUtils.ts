/**
 * Chord progression parsing utilities
 * Parses chord degree notation (I, IV, V, vi, etc.) to semitone offsets
 */
import type { ChordEvent } from '@/wasm'

// Degree to semitone mapping (relative to key)
const DEGREE_TO_SEMITONE: Record<string, number> = {
  'I': 0,
  'II': 2,
  'III': 4,
  'IV': 5,
  'V': 7,
  'VI': 9,
  'VII': 11,
  // Minor (lowercase)
  'i': 0,
  'ii': 2,
  'iii': 4,
  'iv': 5,
  'v': 7,
  'vi': 9,
  'vii': 11,
  // Alterations
  'bII': 1,
  'bIII': 3,
  'bVI': 8,
  'bVII': 10,
  '#IV': 6,
  '#iv': 6,
}

export interface ChordInfo {
  degree: string       // Original degree notation (e.g., "I", "vi", "IVmaj7")
  displayName: string  // Display name (e.g., "I", "vi", "IV")
  semitone: number     // Semitone offset from key (0-11)
  isMinor: boolean     // Whether it's a minor chord
}

/**
 * Parse a single chord degree notation to ChordInfo
 */
export function parseChordDegree(degree: string): ChordInfo | null {
  // Remove extensions (maj7, 7, 9, etc.)
  const cleanDegree = degree.replace(/maj7|7|9|dim|aug|sus[24]?/gi, '').trim()

  if (!cleanDegree) return null

  // Check for alterations first (bII, bVII, #IV, etc.)
  let baseDegree = cleanDegree
  let semitone: number | undefined

  // Try with alteration prefix
  if (cleanDegree.startsWith('b') || cleanDegree.startsWith('#')) {
    semitone = DEGREE_TO_SEMITONE[cleanDegree]
    if (semitone === undefined) {
      // Try just the alteration + uppercase
      const alteredKey = cleanDegree[0] + cleanDegree.slice(1).toUpperCase()
      semitone = DEGREE_TO_SEMITONE[alteredKey]
    }
  }

  // Try without alteration
  if (semitone === undefined) {
    semitone = DEGREE_TO_SEMITONE[cleanDegree.toUpperCase()]
    if (semitone === undefined) {
      semitone = DEGREE_TO_SEMITONE[cleanDegree.toLowerCase()]
    }
  }

  if (semitone === undefined) return null

  // Check if minor (lowercase Roman numeral)
  const isMinor = /^[ivx]+$/.test(cleanDegree) ||
                  (cleanDegree.startsWith('b') && /^b[ivx]+$/.test(cleanDegree))

  return {
    degree,
    displayName: cleanDegree,
    semitone,
    isMinor
  }
}

/**
 * Parse a chord progression string into an array of ChordInfo
 * @param display - Chord progression string like "I - V - vi - IV"
 */
export function parseChordProgression(display: string): ChordInfo[] {
  // Split by common separators
  const parts = display.split(/\s*[-–—|]\s*/)

  const chords: ChordInfo[] = []
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    const chord = parseChordDegree(trimmed)
    if (chord) {
      chords.push(chord)
    }
  }

  return chords
}

/**
 * Calculate the actual MIDI note for a root note given key and semitone offset
 * @param key - Key (0-11, where 0=C)
 * @param semitone - Semitone offset from key
 * @param octave - Base octave (default 2 for bass range)
 */
export function getRootMidiNote(key: number, semitone: number, octave: number = 2): number {
  return (octave + 1) * 12 + ((key + semitone) % 12)
}

/**
 * Generate chord timing information based on sections and chord progression
 * Assumes each chord lasts for a fixed number of bars within each section
 */
export interface ChordTiming {
  chord: ChordInfo
  startTick: number
  endTick: number
  bar: number
}

export interface GenerateChordTimingsOptions {
  chords: ChordInfo[]
  sections: Array<{
    startTick: number
    endTick: number
    bars: number
    type: string
  }>
  ppq: number
  barsPerChord?: number  // How many bars each chord lasts (default: 1)
}

/**
 * Generate chord timings by distributing chords across sections
 */
export function generateChordTimings(options: GenerateChordTimingsOptions): ChordTiming[] {
  const { chords, sections, ppq, barsPerChord = 1 } = options

  if (chords.length === 0 || sections.length === 0) return []

  const ticksPerBar = ppq * 4  // 4 beats per bar
  const timings: ChordTiming[] = []
  let globalBar = 0

  for (const section of sections) {
    const sectionBars = section.bars
    const ticksPerSectionBar = (section.endTick - section.startTick) / sectionBars

    for (let barInSection = 0; barInSection < sectionBars; barInSection += barsPerChord) {
      // Cycle through chord progression
      const chordIndex = Math.floor(barInSection / barsPerChord) % chords.length
      const chord = chords[chordIndex]

      const startTick = section.startTick + barInSection * ticksPerSectionBar
      const endTick = Math.min(
        section.startTick + (barInSection + barsPerChord) * ticksPerSectionBar,
        section.endTick
      )

      timings.push({
        chord,
        startTick: Math.round(startTick),
        endTick: Math.round(endTick),
        bar: globalBar + barInSection
      })
    }

    globalBar += sectionBars
  }

  return timings
}

// Major scale degree → semitone offsets and display names for WASM chord events
const SCALE = [0, 2, 4, 5, 7, 9, 11]
const DEGREE_NAMES_MAJOR = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
const DEGREE_NAMES_DIATONIC = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii']

/**
 * Convert a WASM ChordEvent to a ChordInfo
 * Secondary dominants (V/x) are rendered as major with a "7" suffix
 */
export function chordEventToChordInfo(event: ChordEvent): ChordInfo {
  const normalized = ((event.degree % 7) + 7) % 7
  const semitone = SCALE[normalized]

  if (event.isSecondaryDominant) {
    // Secondary dominants are always major quality
    const displayName = DEGREE_NAMES_MAJOR[normalized] + '7'
    return {
      degree: displayName,
      displayName,
      semitone,
      isMinor: false
    }
  }

  // Diatonic: ii, iii, vi are minor
  const isMinor = [1, 2, 5].includes(normalized)
  const displayName = DEGREE_NAMES_DIATONIC[normalized]
  return {
    degree: displayName,
    displayName,
    semitone,
    isMinor
  }
}

/**
 * Build chord timings directly from the WASM chord timeline
 * More accurate than parsing the static display string (includes secondary dominants)
 */
export function chordEventsToTimings(chords: ChordEvent[], ppq: number): ChordTiming[] {
  return chords.map((c) => ({
    chord: chordEventToChordInfo(c),
    startTick: c.tick,
    endTick: c.endTick,
    bar: Math.floor(c.tick / (ppq * 4))
  }))
}

// Note names for display
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

/**
 * Get the actual chord name with key context
 * @param key - Key (0-11, where 0=C)
 * @param chord - ChordInfo object
 */
export function getChordName(key: number, chord: ChordInfo): string {
  const rootNote = (key + chord.semitone) % 12
  const rootName = NOTE_NAMES[rootNote]
  const suffix = chord.isMinor ? 'm' : ''
  return rootName + suffix
}
