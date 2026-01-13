/**
 * Note Conversion Utilities
 *
 * Converts between eventData notes, PlacedNote (editor format), and NoteInput (WASM format).
 */

import type { PlacedNote } from '@/components/PianoRollEditor/types'
import type { NoteInput } from '@/wasm'

/**
 * EventData note structure from WASM getEvents()
 */
export interface EventDataNote {
  pitch: number
  velocity: number
  start_ticks: number
  duration_ticks: number
  start_seconds?: number
  duration_seconds?: number
}

/**
 * EventData track structure
 */
export interface EventDataTrack {
  name: string
  channel: number
  program: number
  notes: EventDataNote[]
}

/**
 * EventData structure from WASM getEvents()
 */
export interface EventData {
  bpm: number
  division: number
  duration_ticks: number
  duration_seconds: number
  ppq?: number
  tracks: EventDataTrack[]
  sections?: Array<{
    name: string
    type: string
    startTick?: number
    start_ticks?: number
    endTick?: number
    end_ticks?: number
    start_bar?: number
    bars?: number
  }>
}

/**
 * Generate a unique ID for a note
 */
function generateNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Find the vocal track in eventData
 * Looks for track with 'vocal' in the name (case-insensitive)
 */
export function findVocalTrack(eventData: EventData): EventDataTrack | null {
  if (!eventData?.tracks) return null

  // First try exact match
  let track = eventData.tracks.find(
    t => t.name.toLowerCase() === 'vocal'
  )

  // Then try contains match
  if (!track) {
    track = eventData.tracks.find(
      t => t.name.toLowerCase().includes('vocal')
    )
  }

  // Fallback: find first track with notes that's not drums/percussion
  if (!track) {
    track = eventData.tracks.find(
      t => t.notes?.length > 0 &&
           !t.name.toLowerCase().includes('drum') &&
           !t.name.toLowerCase().includes('perc') &&
           t.channel !== 9 // MIDI channel 10 (0-indexed as 9) is drums
    )
  }

  return track || null
}

/**
 * Convert eventData vocal track notes to PlacedNote format
 *
 * @param eventData - Event data from WASM getEvents()
 * @returns PlacedNote array for PianoRollEditor
 */
export function eventDataToPlacedNotes(eventData: EventData): PlacedNote[] {
  const vocalTrack = findVocalTrack(eventData)
  if (!vocalTrack?.notes) return []

  return vocalTrack.notes.map((note): PlacedNote => ({
    id: generateNoteId(),
    pitch: note.pitch,
    startTick: note.start_ticks,
    duration: note.duration_ticks,
  }))
}

/**
 * Convert PlacedNote array to NoteInput format for WASM setVocalNotes()
 *
 * @param placedNotes - Notes from PianoRollEditor
 * @param velocity - Default velocity for all notes (0-127)
 * @returns NoteInput array for WASM
 */
export function placedNotesToNoteInput(
  placedNotes: PlacedNote[],
  velocity: number = 100
): NoteInput[] {
  // Sort by startTick to ensure proper ordering
  const sorted = [...placedNotes].sort((a, b) => a.startTick - b.startTick)

  return sorted.map((note): NoteInput => ({
    startTick: note.startTick,
    duration: note.duration,
    pitch: note.pitch,
    velocity: Math.max(0, Math.min(127, velocity)),
  }))
}

/**
 * Check if notes have been modified compared to original eventData
 *
 * @param eventData - Original event data
 * @param placedNotes - Current notes in editor
 * @returns true if notes have been modified
 */
export function hasNotesChanged(
  eventData: EventData,
  placedNotes: PlacedNote[]
): boolean {
  const originalNotes = eventDataToPlacedNotes(eventData)

  if (originalNotes.length !== placedNotes.length) return true

  // Sort both arrays by startTick for comparison
  const sortedOriginal = [...originalNotes].sort((a, b) => a.startTick - b.startTick)
  const sortedCurrent = [...placedNotes].sort((a, b) => a.startTick - b.startTick)

  for (let i = 0; i < sortedOriginal.length; i++) {
    const orig = sortedOriginal[i]
    const curr = sortedCurrent[i]
    if (
      orig.pitch !== curr.pitch ||
      orig.startTick !== curr.startTick ||
      orig.duration !== curr.duration
    ) {
      return true
    }
  }

  return false
}

/**
 * Get total duration of notes in ticks
 */
export function getNotesEndTick(placedNotes: PlacedNote[]): number {
  if (placedNotes.length === 0) return 0
  return Math.max(...placedNotes.map(n => n.startTick + n.duration))
}
