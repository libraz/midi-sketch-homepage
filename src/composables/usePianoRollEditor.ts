import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'

// ============================================================================
// Types
// ============================================================================

export const NoteSafety = {
  Safe: 0,       // Green: Chord tone
  Warning: 1,    // Yellow: Tension/scale tone
  Dissonant: 2,  // Red: Out of range or non-scale
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

export interface ChordInfo {
  name: string
  degree: string       // Roman numeral (I, IV, V, etc.)
  root: number         // MIDI note (0-11)
  type: 'major' | 'minor' | 'dim' | 'aug' | 'dom7' | 'maj7' | 'min7'
  tones: number[]      // Relative pitches (0, 4, 7 for major)
}

export interface SectionInfo {
  id: string
  name: string         // Display name (e.g., "Verse A", "Chorus")
  type: 'verse' | 'prechorus' | 'chorus' | 'bridge' | 'outro' | 'intro'
  startBar: number
  endBar: number       // Exclusive
  chords: ChordAtBar[]
}

export interface ChordAtBar {
  bar: number
  beat: number         // 1-4
  chord: ChordInfo
}

export interface PlacedNote {
  id: string
  pitch: number
  startTick: number
  duration: number
  sectionId: string
}

export interface PianoRollSafetyInfo {
  tick: number
  chord: ChordInfo
  safety: NoteSafetyLevel[]
  reason: NoteReasonFlags[]
  recommended: number[]
  currentKey: number
}

export interface SongStructure {
  bpm: number
  key: number          // 0-11 (C=0)
  ticksPerBeat: number // Usually 480
  sections: SectionInfo[]
  totalBars: number
}

// ============================================================================
// Chord Database
// ============================================================================

const CHORD_TYPES: Record<string, { tones: number[]; type: ChordInfo['type'] }> = {
  major: { tones: [0, 4, 7], type: 'major' },
  minor: { tones: [0, 3, 7], type: 'minor' },
  dim: { tones: [0, 3, 6], type: 'dim' },
  aug: { tones: [0, 4, 8], type: 'aug' },
  dom7: { tones: [0, 4, 7, 10], type: 'dom7' },
  maj7: { tones: [0, 4, 7, 11], type: 'maj7' },
  min7: { tones: [0, 3, 7, 10], type: 'min7' },
}

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const DEGREE_NAMES = ['I', 'bII', 'II', 'bIII', 'III', 'IV', 'bV', 'V', 'bVI', 'VI', 'bVII', 'VII']

function createChord(root: number, type: keyof typeof CHORD_TYPES, key: number): ChordInfo {
  const chordType = CHORD_TYPES[type]
  const rootNote = (root + key) % 12
  const degree = DEGREE_NAMES[root]
  const suffix = type === 'major' ? '' : type === 'minor' ? 'm' : type

  return {
    name: `${NOTE_NAMES[rootNote]}${suffix === 'major' ? '' : suffix}`,
    degree: type === 'minor' ? degree.toLowerCase() : degree,
    root: rootNote,
    type: chordType.type,
    tones: chordType.tones,
  }
}

// ============================================================================
// Demo Song Structure
// ============================================================================

function createDemoSongStructure(): SongStructure {
  const key = 0 // C major

  // Common pop chord progression
  const verseChords = [
    { bar: 1, beat: 1, chord: createChord(0, 'major', key) },  // I (C)
    { bar: 2, beat: 1, chord: createChord(7, 'major', key) },  // V (G)
    { bar: 3, beat: 1, chord: createChord(9, 'minor', key) },  // vi (Am)
    { bar: 4, beat: 1, chord: createChord(5, 'major', key) },  // IV (F)
  ]

  const chorusChords = [
    { bar: 1, beat: 1, chord: createChord(5, 'major', key) },  // IV (F)
    { bar: 2, beat: 1, chord: createChord(0, 'major', key) },  // I (C)
    { bar: 3, beat: 1, chord: createChord(7, 'dom7', key) },   // V7 (G7)
    { bar: 4, beat: 1, chord: createChord(0, 'major', key) },  // I (C)
  ]

  const bridgeChords = [
    { bar: 1, beat: 1, chord: createChord(9, 'minor', key) },  // vi (Am)
    { bar: 2, beat: 1, chord: createChord(4, 'minor', key) },  // iii (Em)
    { bar: 3, beat: 1, chord: createChord(5, 'major', key) },  // IV (F)
    { bar: 4, beat: 1, chord: createChord(7, 'dom7', key) },   // V7 (G7)
  ]

  return {
    bpm: 120,
    key,
    ticksPerBeat: 480,
    totalBars: 24,
    sections: [
      {
        id: 'verse-a',
        name: 'Verse A',
        type: 'verse',
        startBar: 1,
        endBar: 5,
        chords: verseChords,
      },
      {
        id: 'verse-b',
        name: 'Verse B',
        type: 'verse',
        startBar: 5,
        endBar: 9,
        chords: verseChords.map(c => ({ ...c, bar: c.bar + 4 })),
      },
      {
        id: 'prechorus',
        name: 'Pre-Chorus',
        type: 'prechorus',
        startBar: 9,
        endBar: 13,
        chords: bridgeChords.map(c => ({ ...c, bar: c.bar + 8 })),
      },
      {
        id: 'chorus',
        name: 'Chorus',
        type: 'chorus',
        startBar: 13,
        endBar: 21,
        chords: [
          ...chorusChords.map(c => ({ ...c, bar: c.bar + 12 })),
          ...chorusChords.map(c => ({ ...c, bar: c.bar + 16 })),
        ],
      },
      {
        id: 'outro',
        name: 'Outro',
        type: 'outro',
        startBar: 21,
        endBar: 25,
        chords: chorusChords.map(c => ({ ...c, bar: c.bar + 20 })),
      },
    ],
  }
}

// ============================================================================
// Scale Utils
// ============================================================================

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]

function isInScale(pitch: number, key: number): boolean {
  const relativePitch = (pitch - key + 120) % 12
  return MAJOR_SCALE.includes(relativePitch)
}

// ============================================================================
// SafePAI Calculation
// ============================================================================

function calculateSafetyInfo(
  tick: number,
  chord: ChordInfo,
  key: number,
  vocalLow: number,
  vocalHigh: number,
  prevPitch: number | null = null
): PianoRollSafetyInfo {
  const safety: NoteSafetyLevel[] = new Array(128).fill(NoteSafety.Dissonant)
  const reason: NoteReasonFlags[] = new Array(128).fill(NoteReason.None)
  const recommended: number[] = []

  // Chord tone positions in semitones from root
  const chordTonePositions: Record<number, number> = {}
  chord.tones.forEach((tone, idx) => {
    // idx 0=root, 1=3rd, 2=5th, 3=7th
    chordTonePositions[tone] = idx
  })

  // Tension positions: 9th=2, 11th=5, 13th=9 semitones from root
  const tensionMap: Record<number, number> = {
    2: NoteReason.Ninth,
    5: NoteReason.Eleventh,
    9: NoteReason.Thirteenth,
  }

  // Avoid note detection (4th for major chords, major 7th for dom7)
  const avoidNotes: number[] = []
  if (chord.type === 'major' || chord.type === 'dom7') {
    avoidNotes.push(5) // Perfect 4th (11th) can clash with major 3rd
  }
  if (chord.type === 'dom7') {
    avoidNotes.push(11) // Major 7th clashes with dominant 7th
  }

  for (let pitch = 0; pitch < 128; pitch++) {
    const inRange = pitch >= vocalLow && pitch <= vocalHigh
    const relativeToChord = (pitch - chord.root + 120) % 12
    const inScale = isInScale(pitch, key)

    // Out of range
    if (!inRange) {
      safety[pitch] = NoteSafety.Dissonant
      reason[pitch] = NoteReason.OutOfRange
      if (pitch < vocalLow) reason[pitch] |= NoteReason.TooLow
      if (pitch > vocalHigh) reason[pitch] |= NoteReason.TooHigh
      continue
    }

    // Chord tones (root, 3rd, 5th, 7th) with detailed position
    if (relativeToChord in chordTonePositions) {
      const position = chordTonePositions[relativeToChord]
      safety[pitch] = NoteSafety.Safe
      reason[pitch] = NoteReason.ChordTone

      // Add specific position
      if (position === 0) reason[pitch] |= NoteReason.Root
      else if (position === 1) reason[pitch] |= NoteReason.Third
      else if (position === 2) reason[pitch] |= NoteReason.Fifth
      else if (position === 3) reason[pitch] |= NoteReason.Seventh

      // Add to recommended (prioritize middle register)
      if (pitch >= vocalLow + 5 && pitch <= vocalHigh - 5) {
        recommended.push(pitch)
      }
    }
    // Tensions (9th, 11th, 13th) with detailed type
    else if (relativeToChord in tensionMap && inScale) {
      // Check if this is an avoid note
      if (avoidNotes.includes(relativeToChord)) {
        safety[pitch] = NoteSafety.Dissonant
        reason[pitch] = NoteReason.Tension | tensionMap[relativeToChord] | NoteReason.AvoidNote
      } else {
        safety[pitch] = NoteSafety.Warning
        reason[pitch] = NoteReason.Tension | tensionMap[relativeToChord]
      }
    }
    // Scale tones (not chord, but in scale)
    else if (inScale) {
      safety[pitch] = NoteSafety.Warning
      reason[pitch] = NoteReason.ScaleTone
    }
    // Non-scale (chromatic)
    else {
      safety[pitch] = NoteSafety.Dissonant
      reason[pitch] = NoteReason.NonScale
    }

    // Register warnings
    if (safety[pitch] !== NoteSafety.Dissonant) {
      // Low register warning (below C4 = 60)
      if (pitch < 60) {
        reason[pitch] |= NoteReason.LowRegister
        if (safety[pitch] === NoteSafety.Safe && pitch < 48) {
          safety[pitch] = NoteSafety.Warning
        }
      }
      // High register warning (above C6 = 84)
      if (pitch > 84) {
        reason[pitch] |= NoteReason.HighRegister
      }
    }

    // Tritone check (6 semitones from any chord tone)
    const hasTritone = chord.tones.some(t => {
      const interval = Math.abs(relativeToChord - t)
      return interval === 6
    })
    if (hasTritone && chord.type !== 'dom7') {
      reason[pitch] |= NoteReason.Tritone
    }

    // Interval checks from previous pitch
    if (prevPitch !== null) {
      const interval = Math.abs(pitch - prevPitch)
      // Large leap (6+ semitones)
      if (interval >= 6) {
        reason[pitch] |= NoteReason.LargeLeap
      }
      // Minor 2nd (1 semitone) - can be dissonant
      if (interval === 1) {
        reason[pitch] |= NoteReason.Minor2nd
      }
      // Major 7th (11 semitones)
      if (interval === 11) {
        reason[pitch] |= NoteReason.Major7th
      }
    }
  }

  // Sort recommended by proximity to middle of range
  const middlePitch = Math.floor((vocalLow + vocalHigh) / 2)
  recommended.sort((a, b) => Math.abs(a - middlePitch) - Math.abs(b - middlePitch))

  return {
    tick,
    chord,
    safety,
    reason,
    recommended: recommended.slice(0, 8),
    currentKey: key,
  }
}

// ============================================================================
// Composable
// ============================================================================

export interface UsePianoRollEditorOptions {
  structure?: SongStructure
  vocalLow?: number
  vocalHigh?: number
  allowHarmony?: boolean
  initialNotes?: PlacedNote[]
}

export function usePianoRollEditor(options: UsePianoRollEditorOptions = {}) {
  // State
  const structure = ref<SongStructure>(options.structure ?? createDemoSongStructure())
  const vocalLow = ref(options.vocalLow ?? 48)  // C3
  const vocalHigh = ref(options.vocalHigh ?? 72) // C5
  const allowHarmony = ref(options.allowHarmony ?? false)
  const placedNotes = ref<PlacedNote[]>(options.initialNotes ?? [])

  // Navigation
  const currentSectionIndex = ref(0)
  const currentBarInSection = ref(0)

  // Computed
  const currentSection = computed(() => structure.value.sections[currentSectionIndex.value])

  const currentBar = computed(() => {
    const section = currentSection.value
    return section.startBar + currentBarInSection.value
  })

  const currentChord = computed(() => {
    const section = currentSection.value
    const bar = currentBar.value

    // Find the chord active at this bar
    const chord = [...section.chords]
      .reverse()
      .find(c => c.bar <= bar)

    return chord?.chord ?? section.chords[0]?.chord
  })

  const currentTick = computed(() => {
    const bar = currentBar.value - 1 // 0-indexed
    return bar * 4 * structure.value.ticksPerBeat
  })

  const safetyInfo = computed(() => {
    const prevNote = notesInCurrentBar.value[notesInCurrentBar.value.length - 1]
    return calculateSafetyInfo(
      currentTick.value,
      currentChord.value,
      structure.value.key,
      vocalLow.value,
      vocalHigh.value,
      prevNote?.pitch ?? null
    )
  })

  const notesInCurrentSection = computed(() => {
    const section = currentSection.value
    return placedNotes.value.filter(n => n.sectionId === section.id)
  })

  const notesInCurrentBar = computed(() => {
    const ticksPerBar = 4 * structure.value.ticksPerBeat
    const barStartTick = (currentBar.value - 1) * ticksPerBar
    const barEndTick = barStartTick + ticksPerBar

    return notesInCurrentSection.value.filter(
      n => n.startTick >= barStartTick && n.startTick < barEndTick
    )
  })

  const sectionBars = computed(() => {
    const section = currentSection.value
    return section.endBar - section.startBar
  })

  // Navigation methods
  function nextSection() {
    if (currentSectionIndex.value < structure.value.sections.length - 1) {
      currentSectionIndex.value++
      currentBarInSection.value = 0
    }
  }

  function prevSection() {
    if (currentSectionIndex.value > 0) {
      currentSectionIndex.value--
      currentBarInSection.value = 0
    }
  }

  function goToSection(index: number) {
    if (index >= 0 && index < structure.value.sections.length) {
      currentSectionIndex.value = index
      currentBarInSection.value = 0
    }
  }

  function nextBar() {
    if (currentBarInSection.value < sectionBars.value - 1) {
      currentBarInSection.value++
    } else {
      nextSection()
    }
  }

  function prevBar() {
    if (currentBarInSection.value > 0) {
      currentBarInSection.value--
    } else if (currentSectionIndex.value > 0) {
      currentSectionIndex.value--
      currentBarInSection.value = sectionBars.value - 1
    }
  }

  function goToBar(globalBar: number) {
    for (let i = 0; i < structure.value.sections.length; i++) {
      const section = structure.value.sections[i]
      if (globalBar >= section.startBar && globalBar < section.endBar) {
        currentSectionIndex.value = i
        currentBarInSection.value = globalBar - section.startBar
        return
      }
    }
  }

  // Note management
  function generateNoteId(): string {
    return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  function addNote(pitch: number, tick: number, duration: number): PlacedNote | null {
    // Find section from absolute tick
    const ticksPerBar = 4 * structure.value.ticksPerBeat
    const bar = Math.floor(tick / ticksPerBar) + 1
    const section = structure.value.sections.find(
      s => bar >= s.startBar && bar < s.endBar
    ) ?? currentSection.value

    // Monophonic check
    if (!allowHarmony.value) {
      // Remove any overlapping notes at this tick
      const existingIndex = placedNotes.value.findIndex(n =>
        n.startTick < tick + duration &&
        n.startTick + n.duration > tick
      )
      if (existingIndex >= 0) {
        placedNotes.value.splice(existingIndex, 1)
      }
    }

    const note: PlacedNote = {
      id: generateNoteId(),
      pitch,
      startTick: tick,
      duration,
      sectionId: section.id,
    }

    placedNotes.value.push(note)
    return note
  }

  function deleteNote(noteId: string): boolean {
    const index = placedNotes.value.findIndex(n => n.id === noteId)
    if (index >= 0) {
      placedNotes.value.splice(index, 1)
      return true
    }
    return false
  }

  function updateNote(noteId: string, updates: Partial<Omit<PlacedNote, 'id' | 'sectionId'>>): boolean {
    const note = placedNotes.value.find(n => n.id === noteId)
    if (!note) return false

    // Store original values for potential rollback
    const originalPitch = note.pitch
    const originalStartTick = note.startTick
    const originalDuration = note.duration

    // Apply updates
    if (updates.pitch !== undefined) note.pitch = updates.pitch
    if (updates.startTick !== undefined) note.startTick = updates.startTick
    if (updates.duration !== undefined) note.duration = updates.duration

    // Update sectionId if startTick changed (for seamless editing across sections)
    if (updates.startTick !== undefined) {
      const ticksPerBar = 4 * structure.value.ticksPerBeat
      const bar = Math.floor(note.startTick / ticksPerBar) + 1
      const newSection = structure.value.sections.find(
        s => bar >= s.startBar && bar < s.endBar
      )
      if (newSection) {
        note.sectionId = newSection.id
      }
    }

    // Monophonic enforcement - reject move if it would overlap with other notes
    if (!allowHarmony.value && (updates.startTick !== undefined || updates.duration !== undefined)) {
      const hasOverlap = placedNotes.value.some(n =>
        n.id !== noteId &&
        n.startTick < note.startTick + note.duration &&
        n.startTick + n.duration > note.startTick
      )

      if (hasOverlap) {
        // Rollback to original position
        note.pitch = originalPitch
        note.startTick = originalStartTick
        note.duration = originalDuration
        return false
      }
    }

    return true
  }

  function clearSectionNotes() {
    const sectionId = currentSection.value.id
    placedNotes.value = placedNotes.value.filter(n => n.sectionId !== sectionId)
  }

  function clearAllNotes() {
    placedNotes.value = []
  }

  // Split a note at a specific tick position
  function splitNote(noteId: string, splitTick: number): { first: PlacedNote; second: PlacedNote } | null {
    const note = placedNotes.value.find(n => n.id === noteId)
    if (!note) return null

    const noteEnd = note.startTick + note.duration

    // Validate split position is within the note
    if (splitTick <= note.startTick || splitTick >= noteEnd) return null

    // Calculate durations
    const firstDuration = splitTick - note.startTick
    const secondDuration = noteEnd - splitTick

    // Minimum duration check (at least 1 grid unit)
    const minDuration = 120 // 1/16 note
    if (firstDuration < minDuration || secondDuration < minDuration) return null

    // Update original note to be the first part
    note.duration = firstDuration

    // Create new note for the second part
    const secondNote: PlacedNote = {
      id: generateNoteId(),
      pitch: note.pitch,
      startTick: splitTick,
      duration: secondDuration,
      sectionId: note.sectionId,
    }

    placedNotes.value.push(secondNote)

    return { first: note, second: secondNote }
  }

  // Merge consecutive notes with the same pitch
  function mergeNotes(noteIds: string[]): PlacedNote | null {
    if (noteIds.length < 2) return null

    // Get all notes to merge
    const notesToMerge = noteIds
      .map(id => placedNotes.value.find(n => n.id === id))
      .filter((n): n is PlacedNote => n !== undefined)

    if (notesToMerge.length < 2) return null

    // Check all notes have the same pitch and section
    const firstNote = notesToMerge[0]
    const allSamePitch = notesToMerge.every(n => n.pitch === firstNote.pitch)
    const allSameSection = notesToMerge.every(n => n.sectionId === firstNote.sectionId)

    if (!allSamePitch || !allSameSection) return null

    // Sort by start tick
    notesToMerge.sort((a, b) => a.startTick - b.startTick)

    // Check notes are consecutive (no gaps, or touching)
    for (let i = 0; i < notesToMerge.length - 1; i++) {
      const current = notesToMerge[i]
      const next = notesToMerge[i + 1]
      const currentEnd = current.startTick + current.duration

      // Allow small gap (up to 1 grid unit) for "consecutive" merge
      if (next.startTick > currentEnd + 120) {
        return null // Gap too large
      }
    }

    // Calculate merged note span
    const mergedStart = notesToMerge[0].startTick
    const lastNote = notesToMerge[notesToMerge.length - 1]
    const mergedEnd = lastNote.startTick + lastNote.duration
    const mergedDuration = mergedEnd - mergedStart

    // Update first note to span the entire range
    firstNote.startTick = mergedStart
    firstNote.duration = mergedDuration

    // Remove other notes
    const idsToRemove = noteIds.filter(id => id !== firstNote.id)
    placedNotes.value = placedNotes.value.filter(n => !idsToRemove.includes(n.id))

    return firstNote
  }

  // Utility
  function getChordAtTick(tick: number): ChordInfo {
    const ticksPerBar = 4 * structure.value.ticksPerBeat
    const bar = Math.floor(tick / ticksPerBar) + 1

    // Find section
    for (const section of structure.value.sections) {
      if (bar >= section.startBar && bar < section.endBar) {
        const chord = [...section.chords]
          .reverse()
          .find(c => c.bar <= bar)
        return chord?.chord ?? section.chords[0]?.chord
      }
    }

    return currentChord.value
  }

  function getSafetyAtTick(tick: number, prevPitch: number | null = null): PianoRollSafetyInfo {
    const chord = getChordAtTick(tick)
    return calculateSafetyInfo(
      tick,
      chord,
      structure.value.key,
      vocalLow.value,
      vocalHigh.value,
      prevPitch
    )
  }

  return {
    // State
    structure,
    vocalLow,
    vocalHigh,
    allowHarmony,
    placedNotes,

    // Navigation state
    currentSectionIndex,
    currentBarInSection,

    // Computed
    currentSection,
    currentBar,
    currentChord,
    currentTick,
    safetyInfo,
    notesInCurrentSection,
    notesInCurrentBar,
    sectionBars,

    // Navigation methods
    nextSection,
    prevSection,
    goToSection,
    nextBar,
    prevBar,
    goToBar,

    // Note management
    addNote,
    deleteNote,
    updateNote,
    clearSectionNotes,
    clearAllNotes,
    splitNote,
    mergeNotes,

    // Utility
    getChordAtTick,
    getSafetyAtTick,
  }
}

export type PianoRollEditorComposable = ReturnType<typeof usePianoRollEditor>
