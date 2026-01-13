<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { PlacedNote, ChordAtBar } from './types'
import { PPQ } from './types'

const props = defineProps<{
  placedNotes?: PlacedNote[]
  chordsInView?: ChordAtBar[]
  totalBars: number
  zoomLevel: number
  scrollLeft?: number
  playheadTick?: number | null
  isPlaying?: boolean
}>()

const emit = defineEmits<{
  noteHover: [pitch: number | null]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const fontLoaded = ref(false)

// Staff constants - Grand staff (treble + bass)
const LINE_SPACING = 8
const STAFF_GAP = 24  // Gap between treble and bass staves
const TREBLE_TOP = 20
const BASS_TOP = TREBLE_TOP + 4 * LINE_SPACING + STAFF_GAP  // Bass staff starts below treble
const TOTAL_STAFF_HEIGHT = BASS_TOP + 4 * LINE_SPACING + 25  // Total height for both staves
const NOTE_HEAD_WIDTH = 10
const NOTE_HEAD_HEIGHT = 7
const CLEF_AREA_WIDTH = 60  // Wider for time signature
const PIANO_ROLL_OFFSET = 8  // Piano roll's tickToX offset

// SMuFL codepoints (Bravura font)
const SMUFL = {
  gClef: '\uE050',           // Treble clef
  fClef: '\uE062',           // Bass clef
  timeSig4: '\uE084',        // Time signature 4
  noteheadBlack: '\uE0A4',
  noteheadHalf: '\uE0A3',
  noteheadWhole: '\uE0A2',
  accidentalSharp: '\uE262',
  accidentalFlat: '\uE260',
  flag8thUp: '\uE240',
  flag8thDown: '\uE241',
  flag16thUp: '\uE242',
  flag16thDown: '\uE243',
}

// Note duration thresholds
const WHOLE_NOTE = PPQ * 4      // 1920 ticks
const HALF_NOTE = PPQ * 2       // 960 ticks
const QUARTER_NOTE = PPQ        // 480 ticks
const EIGHTH_NOTE = PPQ / 2     // 240 ticks
const SIXTEENTH_NOTE = PPQ / 4  // 120 ticks

// Match piano roll's pixel calculation: PIXELS_PER_BAR_BASE = 400
const PIXELS_PER_BAR_BASE = 400
const pixelsPerTick = computed(() => (PIXELS_PER_BAR_BASE * props.zoomLevel) / (4 * PPQ))
const canvasWidth = computed(() => props.totalBars * PIXELS_PER_BAR_BASE * props.zoomLevel + CLEF_AREA_WIDTH + 50)

// MIDI pitch to treble staff Y position (for vocal melody)
// Reference: E4 is on bottom line of treble staff
function pitchToTrebleY(pitch: number): number {
  const staffPositions: Record<string, number> = {
    'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6
  }
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const noteName = noteNames[pitch % 12]
  const octave = Math.floor(pitch / 12) - 1
  const baseNote = noteName.replace('#', '')
  const staffPos = staffPositions[baseNote] ?? 0
  const octaveDiff = octave - 4
  const positionFromC4 = staffPos + octaveDiff * 7
  const e4PositionFromC4 = 2
  const stepsFromE4 = positionFromC4 - e4PositionFromC4
  const bottomLineY = TREBLE_TOP + 4 * LINE_SPACING
  return bottomLineY - stepsFromE4 * (LINE_SPACING / 2)
}

// MIDI pitch to bass staff Y position (for bass root notes)
// Reference: G2 is on bottom line of bass staff
function pitchToBassY(pitch: number): number {
  const staffPositions: Record<string, number> = {
    'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6
  }
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const noteName = noteNames[pitch % 12]
  const octave = Math.floor(pitch / 12) - 1
  const baseNote = noteName.replace('#', '')
  const staffPos = staffPositions[baseNote] ?? 0
  // G2 is the reference (bottom line of bass staff)
  const octaveDiff = octave - 2
  const positionFromC2 = staffPos + octaveDiff * 7
  const g2PositionFromC2 = 4  // G is 4 steps from C
  const stepsFromG2 = positionFromC2 - g2PositionFromC2
  const bottomLineY = BASS_TOP + 4 * LINE_SPACING
  return bottomLineY - stepsFromG2 * (LINE_SPACING / 2)
}

function tickToX(tick: number): number {
  // Match piano roll: 8 + tick * pixelsPerTick, plus offset for clef area
  return CLEF_AREA_WIDTH + PIANO_ROLL_OFFSET + tick * pixelsPerTick.value
}

// Determine note type based on duration
function getNoteType(duration: number): 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' {
  if (duration >= WHOLE_NOTE * 0.9) return 'whole'
  if (duration >= HALF_NOTE * 0.9) return 'half'
  if (duration >= QUARTER_NOTE * 0.9) return 'quarter'
  if (duration >= EIGHTH_NOTE * 0.9) return 'eighth'
  return 'sixteenth'
}

// Check if notes should be tied (same pitch, consecutive)
function findTiedNotes(notes: PlacedNote[]): Map<string, string[]> {
  const tieGroups = new Map<string, string[]>()
  const sortedNotes = [...notes].sort((a, b) => a.startTick - b.startTick)

  for (let i = 0; i < sortedNotes.length - 1; i++) {
    const current = sortedNotes[i]
    const next = sortedNotes[i + 1]

    // Check if notes are adjacent and same pitch
    const currentEnd = current.startTick + current.duration
    const gap = next.startTick - currentEnd

    if (current.pitch === next.pitch && gap >= -10 && gap <= SIXTEENTH_NOTE) {
      // These notes should be tied
      const existingGroup = tieGroups.get(current.id)
      if (existingGroup) {
        existingGroup.push(next.id)
      } else {
        tieGroups.set(current.id, [next.id])
      }
    }
  }

  return tieGroups
}

// Find beam groups for 8th and 16th notes within the same beat
interface BeamGroup {
  notes: PlacedNote[]
  beamCount: number  // 1 for 8th, 2 for 16th
}

function findBeamGroups(notes: PlacedNote[]): BeamGroup[] {
  const beamableNotes = notes
    .filter(n => {
      const type = getNoteType(n.duration)
      return type === 'eighth' || type === 'sixteenth'
    })
    .sort((a, b) => a.startTick - b.startTick)

  if (beamableNotes.length === 0) return []

  const groups: BeamGroup[] = []
  let currentGroup: PlacedNote[] = []
  let currentBeat = -1

  for (const note of beamableNotes) {
    // Beat boundary is at PPQ intervals (480 ticks = 1 beat)
    const beat = Math.floor(note.startTick / PPQ)

    if (currentGroup.length === 0) {
      currentGroup = [note]
      currentBeat = beat
    } else if (beat === currentBeat) {
      // Same beat, add to group
      currentGroup.push(note)
    } else {
      // New beat, finalize current group
      if (currentGroup.length >= 2) {
        const minBeams = Math.min(...currentGroup.map(n =>
          getNoteType(n.duration) === 'sixteenth' ? 2 : 1
        ))
        groups.push({ notes: currentGroup, beamCount: minBeams })
      }
      currentGroup = [note]
      currentBeat = beat
    }
  }

  // Finalize last group
  if (currentGroup.length >= 2) {
    const minBeams = Math.min(...currentGroup.map(n =>
      getNoteType(n.duration) === 'sixteenth' ? 2 : 1
    ))
    groups.push({ notes: currentGroup, beamCount: minBeams })
  }

  return groups
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const width = canvasWidth.value
  const height = TOTAL_STAFF_HEIGHT

  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, width, height)

  // Background
  ctx.fillStyle = 'rgba(12, 12, 18, 0.98)'
  ctx.fillRect(0, 0, width, height)

  // Draw treble staff lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.lineWidth = 1
  for (let i = 0; i < 5; i++) {
    const y = TREBLE_TOP + i * LINE_SPACING
    ctx.beginPath()
    ctx.moveTo(6, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // Draw bass staff lines
  for (let i = 0; i < 5; i++) {
    const y = BASS_TOP + i * LINE_SPACING
    ctx.beginPath()
    ctx.moveTo(6, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // Draw grand staff brace (simplified)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(6, TREBLE_TOP)
  ctx.lineTo(6, BASS_TOP + 4 * LINE_SPACING)
  ctx.stroke()

  // Draw treble clef
  const g4LineY = TREBLE_TOP + 3 * LINE_SPACING
  if (fontLoaded.value) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '32px Bravura'
    ctx.fillText(SMUFL.gClef, 13, g4LineY)
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '32px serif'
    ctx.fillText('\u{1D11E}', 11, g4LineY + 8)
  }

  // Draw bass clef
  // SMuFL F clef baseline is at F3 line (2nd line from top = 4th from bottom)
  const f3LineY = BASS_TOP + 1 * LINE_SPACING
  if (fontLoaded.value) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '32px Bravura'
    ctx.fillText(SMUFL.fClef, 13, f3LineY)
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '32px serif'
    ctx.fillText('\u{1D122}', 13, f3LineY + 15)
  }

  // Draw time signature (4/4) at beginning
  if (fontLoaded.value) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '24px Bravura'
    // Treble staff time signature
    ctx.fillText(SMUFL.timeSig4, 42, TREBLE_TOP + 1.5 * LINE_SPACING - 5)
    ctx.fillText(SMUFL.timeSig4, 42, TREBLE_TOP + 3.5 * LINE_SPACING - 5)
    // Bass staff time signature
    ctx.fillText(SMUFL.timeSig4, 42, BASS_TOP + 1.5 * LINE_SPACING - 5)
    ctx.fillText(SMUFL.timeSig4, 42, BASS_TOP + 3.5 * LINE_SPACING - 5)
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = 'bold 14px sans-serif'
    // Treble staff
    ctx.fillText('4', 44, TREBLE_TOP + 1.5 * LINE_SPACING + 2)
    ctx.fillText('4', 44, TREBLE_TOP + 3.5 * LINE_SPACING + 2)
    // Bass staff
    ctx.fillText('4', 44, BASS_TOP + 1.5 * LINE_SPACING + 2)
    ctx.fillText('4', 44, BASS_TOP + 3.5 * LINE_SPACING + 2)
  }

  // Draw bar lines (spanning both staves)
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)'
  ctx.lineWidth = 1
  for (let bar = 0; bar <= props.totalBars; bar++) {
    const x = tickToX(bar * 4 * PPQ)
    ctx.beginPath()
    ctx.moveTo(x, TREBLE_TOP)
    ctx.lineTo(x, BASS_TOP + 4 * LINE_SPACING)
    ctx.stroke()

    if (bar > 0 && bar <= props.totalBars) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.font = '9px JetBrains Mono, monospace'
      ctx.fillText(String(bar), x - tickToX(2 * PPQ) + 2, TREBLE_TOP - 4)
    }
  }

  // Draw notes
  if (props.placedNotes && props.placedNotes.length > 0) {
    const bottomLineY = TREBLE_TOP + 4 * LINE_SPACING
    const topLineY = TREBLE_TOP
    const tieGroups = findTiedNotes(props.placedNotes)
    const tiedToIds = new Set<string>()

    // Collect all "tied to" note IDs
    for (const group of tieGroups.values()) {
      for (const id of group) {
        tiedToIds.add(id)
      }
    }

    // Find beam groups and collect beamed note IDs
    const beamGroups = findBeamGroups(props.placedNotes)
    const beamedNoteIds = new Set<string>()
    for (const group of beamGroups) {
      for (const note of group.notes) {
        beamedNoteIds.add(note.id)
      }
    }

    for (const note of props.placedNotes) {
      const x = tickToX(note.startTick)
      const y = pitchToTrebleY(note.pitch)
      const noteType = getNoteType(note.duration)
      const stemUp = y > TREBLE_TOP + 2 * LINE_SPACING

      // Check if this note is currently playing
      const noteEndTick = note.startTick + note.duration
      const isNotePlaying = props.playheadTick !== null &&
                            props.playheadTick !== undefined &&
                            props.playheadTick >= note.startTick &&
                            props.playheadTick < noteEndTick

      const noteColor = isNotePlaying ? '#F87171' : '#FFFFFF'  // Red when playing, white otherwise

      // Draw ledger lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 1

      if (y >= bottomLineY + LINE_SPACING / 2) {
        for (let ly = bottomLineY + LINE_SPACING; ly <= y + 2; ly += LINE_SPACING) {
          ctx.beginPath()
          ctx.moveTo(x - 4, ly)
          ctx.lineTo(x + NOTE_HEAD_WIDTH + 4, ly)
          ctx.stroke()
        }
      }

      if (y <= topLineY - LINE_SPACING / 2) {
        for (let ly = topLineY - LINE_SPACING; ly >= y - 2; ly -= LINE_SPACING) {
          ctx.beginPath()
          ctx.moveTo(x - 4, ly)
          ctx.lineTo(x + NOTE_HEAD_WIDTH + 4, ly)
          ctx.stroke()
        }
      }

      // Draw accidental
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
      const noteName = noteNames[note.pitch % 12]
      const isSharp = noteName.includes('#')

      if (isSharp) {
        ctx.fillStyle = isNotePlaying ? '#F87171' : 'rgba(255, 255, 255, 0.9)'
        if (fontLoaded.value) {
          ctx.font = '16px Bravura'
          ctx.fillText(SMUFL.accidentalSharp, x - 12, y + 5)
        } else {
          ctx.font = '12px sans-serif'
          ctx.fillText('#', x - 10, y + 4)
        }
      }

      // Draw note head based on duration - highlight when playing
      ctx.fillStyle = noteColor

      if (fontLoaded.value) {
        ctx.font = '20px Bravura'
        if (noteType === 'whole') {
          ctx.fillText(SMUFL.noteheadWhole, x, y + 6)
        } else if (noteType === 'half') {
          ctx.fillText(SMUFL.noteheadHalf, x, y + 6)
        } else {
          ctx.fillText(SMUFL.noteheadBlack, x, y + 6)
        }
      } else {
        // Fallback
        if (noteType === 'whole' || noteType === 'half') {
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.ellipse(x + NOTE_HEAD_WIDTH / 2, y, NOTE_HEAD_WIDTH / 2, NOTE_HEAD_HEIGHT / 2, -0.3, 0, Math.PI * 2)
          ctx.stroke()
        } else {
          ctx.beginPath()
          ctx.ellipse(x + NOTE_HEAD_WIDTH / 2, y, NOTE_HEAD_WIDTH / 2, NOTE_HEAD_HEIGHT / 2, -0.3, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Draw stem (not for whole notes)
      if (noteType !== 'whole') {
        ctx.strokeStyle = noteColor
        ctx.lineWidth = 1.2
        const stemLength = 28
        const stemX = stemUp ? x + NOTE_HEAD_WIDTH - 1 : x + 1
        const stemStartY = stemUp ? y - 2 : y + 2
        const stemEndY = stemUp ? y - stemLength : y + stemLength

        ctx.beginPath()
        ctx.moveTo(stemX, stemStartY)
        ctx.lineTo(stemX, stemEndY)
        ctx.stroke()

        // Draw flags for 8th and 16th notes (skip if beamed)
        if ((noteType === 'eighth' || noteType === 'sixteenth') && !beamedNoteIds.has(note.id)) {
          if (fontLoaded.value) {
            ctx.fillStyle = noteColor
            ctx.font = '20px Bravura'
            const flag = stemUp
              ? (noteType === 'eighth' ? SMUFL.flag8thUp : SMUFL.flag16thUp)
              : (noteType === 'eighth' ? SMUFL.flag8thDown : SMUFL.flag16thDown)
            ctx.fillText(flag, stemX - 1, stemEndY + (stemUp ? 6 : -2))
          } else {
            // Fallback: draw simple flag
            ctx.strokeStyle = noteColor
            ctx.lineWidth = 2
            ctx.beginPath()
            if (stemUp) {
              ctx.moveTo(stemX, stemEndY)
              ctx.quadraticCurveTo(stemX + 8, stemEndY + 8, stemX + 4, stemEndY + 16)
            } else {
              ctx.moveTo(stemX, stemEndY)
              ctx.quadraticCurveTo(stemX + 8, stemEndY - 8, stemX + 4, stemEndY - 16)
            }
            ctx.stroke()

            // Second flag for 16th
            if (noteType === 'sixteenth') {
              ctx.beginPath()
              if (stemUp) {
                ctx.moveTo(stemX, stemEndY + 6)
                ctx.quadraticCurveTo(stemX + 8, stemEndY + 14, stemX + 4, stemEndY + 22)
              } else {
                ctx.moveTo(stemX, stemEndY - 6)
                ctx.quadraticCurveTo(stemX + 8, stemEndY - 14, stemX + 4, stemEndY - 22)
              }
              ctx.stroke()
            }
          }
        }
      }

      // Draw tie to next note if applicable
      const tiedTo = tieGroups.get(note.id)
      if (tiedTo && tiedTo.length > 0) {
        const nextNote = props.placedNotes.find(n => n.id === tiedTo[0])
        if (nextNote) {
          const nextX = tickToX(nextNote.startTick)
          const tieY = stemUp ? y + 8 : y - 8
          const midX = (x + NOTE_HEAD_WIDTH + nextX) / 2
          const tieControlY = stemUp ? tieY + 8 : tieY - 8

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(x + NOTE_HEAD_WIDTH, tieY)
          ctx.quadraticCurveTo(midX, tieControlY, nextX, tieY)
          ctx.stroke()
        }
      }

      // Draw duration extension line for long notes
      const noteEndX = tickToX(note.startTick + note.duration)
      if (note.duration > QUARTER_NOTE && noteEndX > x + NOTE_HEAD_WIDTH + 20) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 1
        ctx.setLineDash([2, 2])
        ctx.beginPath()
        ctx.moveTo(x + NOTE_HEAD_WIDTH + 4, y)
        ctx.lineTo(noteEndX - 4, y)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // Draw beams for grouped notes
    const STEM_LENGTH = 28
    const BEAM_THICKNESS = 3
    const BEAM_GAP = 5

    for (const group of beamGroups) {
      if (group.notes.length < 2) continue

      // Calculate stem direction based on average pitch
      const avgY = group.notes.reduce((sum, n) => sum + pitchToTrebleY(n.pitch), 0) / group.notes.length
      const stemUp = avgY > TREBLE_TOP + 2 * LINE_SPACING

      // Get stem end positions for all notes in the group
      const stemEnds: { x: number; y: number; noteY: number }[] = []
      for (const note of group.notes) {
        const noteX = tickToX(note.startTick)
        const noteY = pitchToTrebleY(note.pitch)
        const stemX = stemUp ? noteX + NOTE_HEAD_WIDTH - 1 : noteX + 1
        const stemEndY = stemUp ? noteY - STEM_LENGTH : noteY + STEM_LENGTH
        stemEnds.push({ x: stemX, y: stemEndY, noteY })
      }

      // Calculate beam line (connect first and last note stem ends)
      const firstStem = stemEnds[0]
      const lastStem = stemEnds[stemEnds.length - 1]

      // Adjust intermediate stems to reach the beam line
      const beamSlope = (lastStem.y - firstStem.y) / (lastStem.x - firstStem.x)
      const beamIntercept = firstStem.y - beamSlope * firstStem.x

      // Redraw stems to connect to beam
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 1.2
      for (let i = 0; i < stemEnds.length; i++) {
        const stem = stemEnds[i]
        const beamY = beamSlope * stem.x + beamIntercept
        const stemStartY = stemUp ? stem.noteY - 2 : stem.noteY + 2

        ctx.beginPath()
        ctx.moveTo(stem.x, stemStartY)
        ctx.lineTo(stem.x, beamY)
        ctx.stroke()

        // Update stem end for beam drawing
        stemEnds[i].y = beamY
      }

      // Draw primary beam (8th note level)
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      if (stemUp) {
        ctx.moveTo(firstStem.x, stemEnds[0].y)
        ctx.lineTo(lastStem.x, stemEnds[stemEnds.length - 1].y)
        ctx.lineTo(lastStem.x, stemEnds[stemEnds.length - 1].y + BEAM_THICKNESS)
        ctx.lineTo(firstStem.x, stemEnds[0].y + BEAM_THICKNESS)
      } else {
        ctx.moveTo(firstStem.x, stemEnds[0].y)
        ctx.lineTo(lastStem.x, stemEnds[stemEnds.length - 1].y)
        ctx.lineTo(lastStem.x, stemEnds[stemEnds.length - 1].y - BEAM_THICKNESS)
        ctx.lineTo(firstStem.x, stemEnds[0].y - BEAM_THICKNESS)
      }
      ctx.closePath()
      ctx.fill()

      // Draw secondary beam for 16th notes
      if (group.beamCount >= 2) {
        // Find consecutive 16th notes and draw partial beams
        for (let i = 0; i < group.notes.length; i++) {
          const noteType = getNoteType(group.notes[i].duration)
          if (noteType === 'sixteenth') {
            const stem = stemEnds[i]
            const secondBeamY = stemUp ? stem.y + BEAM_GAP : stem.y - BEAM_GAP

            // Determine beam extent (connect to neighbor or partial)
            let startX = stem.x
            let endX = stem.x

            // Check neighbors
            const prevIs16th = i > 0 && getNoteType(group.notes[i - 1].duration) === 'sixteenth'
            const nextIs16th = i < group.notes.length - 1 && getNoteType(group.notes[i + 1].duration) === 'sixteenth'

            if (prevIs16th && nextIs16th) {
              // Connect to both neighbors - handled by continuous beam
              continue
            } else if (nextIs16th) {
              startX = stem.x
              endX = stemEnds[i + 1].x
            } else if (prevIs16th) {
              // Already drawn
              continue
            } else {
              // Partial beam (flaglet)
              startX = stem.x - 8
              endX = stem.x
            }

            const startBeamY = beamSlope * startX + beamIntercept + (stemUp ? BEAM_GAP : -BEAM_GAP)
            const endBeamY = beamSlope * endX + beamIntercept + (stemUp ? BEAM_GAP : -BEAM_GAP)

            ctx.beginPath()
            if (stemUp) {
              ctx.moveTo(startX, startBeamY)
              ctx.lineTo(endX, endBeamY)
              ctx.lineTo(endX, endBeamY + BEAM_THICKNESS)
              ctx.lineTo(startX, startBeamY + BEAM_THICKNESS)
            } else {
              ctx.moveTo(startX, startBeamY)
              ctx.lineTo(endX, endBeamY)
              ctx.lineTo(endX, endBeamY - BEAM_THICKNESS)
              ctx.lineTo(startX, startBeamY - BEAM_THICKNESS)
            }
            ctx.closePath()
            ctx.fill()
          }
        }
      }
    }
  }

  // Draw bass root notes from chord progression with ties for consecutive same notes
  if (props.chordsInView && props.chordsInView.length > 0) {
    const ppq = PPQ
    const ticksPerBar = ppq * 4
    const bassBottomLineY = BASS_TOP + 4 * LINE_SPACING
    const bassTopLineY = BASS_TOP
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

    for (let i = 0; i < props.chordsInView.length; i++) {
      const chord = props.chordsInView[i]
      if (chord.root === undefined) continue

      // Check if previous chord has the same root (this note is tied from previous)
      const prevChord = i > 0 ? props.chordsInView[i - 1] : null
      const isTiedFromPrev = prevChord?.root === chord.root

      // Check if next chord has the same root (need to draw tie to next)
      const nextChord = i < props.chordsInView.length - 1 ? props.chordsInView[i + 1] : null
      const hasTieToNext = nextChord?.root === chord.root

      const barIndex = chord.bar - 1  // Convert to 0-indexed
      const startTick = barIndex * ticksPerBar
      const x = tickToX(startTick) + 10  // Offset slightly from bar line
      const y = pitchToBassY(chord.root)

      // Check if this bass note is currently playing (for highlight)
      const endTick = barIndex * ticksPerBar + ticksPerBar
      const isPlaying = props.playheadTick !== null &&
                        props.playheadTick !== undefined &&
                        props.playheadTick >= startTick &&
                        props.playheadTick < endTick

      const bassColor = isPlaying ? '#F87171' : 'rgba(255, 255, 255, 0.9)'

      // Only draw note head if not tied from previous
      if (!isTiedFromPrev) {
        // Draw ledger lines for bass notes if needed
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.lineWidth = 1

        if (y >= bassBottomLineY + LINE_SPACING / 2) {
          for (let ly = bassBottomLineY + LINE_SPACING; ly <= y + 2; ly += LINE_SPACING) {
            ctx.beginPath()
            ctx.moveTo(x - 4, ly)
            ctx.lineTo(x + NOTE_HEAD_WIDTH + 4, ly)
            ctx.stroke()
          }
        }

        if (y <= bassTopLineY - LINE_SPACING / 2) {
          for (let ly = bassTopLineY - LINE_SPACING; ly >= y - 2; ly -= LINE_SPACING) {
            ctx.beginPath()
            ctx.moveTo(x - 4, ly)
            ctx.lineTo(x + NOTE_HEAD_WIDTH + 4, ly)
            ctx.stroke()
          }
        }

        // Draw accidental for bass note if needed
        const noteName = noteNames[chord.root % 12]
        const isSharp = noteName.includes('#')

        if (isSharp) {
          ctx.fillStyle = bassColor
          if (fontLoaded.value) {
            ctx.font = '16px Bravura'
            ctx.fillText(SMUFL.accidentalSharp, x - 12, y + 5)
          } else {
            ctx.font = '12px sans-serif'
            ctx.fillText('#', x - 10, y + 4)
          }
        }

        // Draw bass note head (whole note for full bar)
        ctx.fillStyle = bassColor
        if (fontLoaded.value) {
          ctx.font = '20px Bravura'
          ctx.fillText(SMUFL.noteheadWhole, x, y + 6)
        } else {
          ctx.strokeStyle = bassColor
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.ellipse(x + NOTE_HEAD_WIDTH / 2, y, NOTE_HEAD_WIDTH / 2, NOTE_HEAD_HEIGHT / 2, -0.3, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // Draw tie to next bar if same root
      if (hasTieToNext) {
        const nextBarIndex = (nextChord!.bar - 1)
        const nextX = tickToX(nextBarIndex * ticksPerBar) + 10
        const tieY = y + 10  // Below the note
        const midX = (x + NOTE_HEAD_WIDTH + nextX) / 2
        const tieControlY = tieY + 10

        ctx.strokeStyle = bassColor
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(x + NOTE_HEAD_WIDTH, tieY)
        ctx.quadraticCurveTo(midX, tieControlY, nextX, tieY)
        ctx.stroke()
      }
    }
  }

  // Draw playhead (spanning both staves)
  if (props.playheadTick !== null && props.playheadTick !== undefined) {
    const playheadX = tickToX(props.playheadTick)

    ctx.strokeStyle = '#F87171'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(playheadX, TREBLE_TOP - 5)
    ctx.lineTo(playheadX, BASS_TOP + 4 * LINE_SPACING + 5)
    ctx.stroke()

    // Triangle marker
    ctx.fillStyle = '#F87171'
    ctx.beginPath()
    ctx.moveTo(playheadX - 5, TREBLE_TOP - 5)
    ctx.lineTo(playheadX + 5, TREBLE_TOP - 5)
    ctx.lineTo(playheadX, TREBLE_TOP + 2)
    ctx.closePath()
    ctx.fill()
  }
}

// Auto-scroll to follow playhead
function autoScroll() {
  if (!containerRef.value || props.playheadTick === null || props.playheadTick === undefined) return
  if (!props.isPlaying) return

  const playheadX = tickToX(props.playheadTick)
  const viewportWidth = containerRef.value.clientWidth
  const currentScroll = containerRef.value.scrollLeft

  // Keep playhead at ~30% from left edge during playback
  const targetScroll = Math.max(0, playheadX - viewportWidth * 0.3 + SCROLL_OFFSET)

  // Smooth scroll
  if (Math.abs(targetScroll - currentScroll) > 10) {
    containerRef.value.scrollLeft = targetScroll
  }
}

// Load Bravura font (local bundle)
async function loadFont() {
  try {
    const font = new FontFace('Bravura', 'url(/fonts/bravura-latin-400-normal.woff2)')
    await font.load()
    document.fonts.add(font)
    fontLoaded.value = true
    draw()
  } catch (e) {
    console.warn('Bravura font not loaded, using fallback', e)
    fontLoaded.value = false
  }
}

// Sync scroll with parent
// Adjust for the difference between staff clef area (60px) and piano roll piano keys (40px)
const SCROLL_OFFSET = CLEF_AREA_WIDTH - 40  // 60 - 40 = 20px
function syncScroll() {
  if (containerRef.value && props.scrollLeft !== undefined) {
    containerRef.value.scrollLeft = props.scrollLeft + SCROLL_OFFSET
  }
}

watch(() => props.scrollLeft, syncScroll)
watch(() => props.playheadTick, () => {
  draw()
  autoScroll()
})
watch(() => props.placedNotes, draw, { deep: true })
watch(() => props.chordsInView, draw, { deep: true })
watch(() => props.zoomLevel, () => {
  // Redraw with new zoom level after computed values update
  nextTick(() => {
    draw()
  })
})
watch(() => props.totalBars, draw)

// Mouse event handlers for note hover detection
const hoveredPitch = ref<number | null>(null)

function xToTick(x: number): number {
  return (x - CLEF_AREA_WIDTH - PIANO_ROLL_OFFSET) / pixelsPerTick.value
}

function findNoteAtPosition(x: number, y: number): PlacedNote | null {
  if (!props.placedNotes) return null

  const tick = xToTick(x)
  const HIT_TOLERANCE = 12  // pixels

  for (const note of props.placedNotes) {
    const noteX = tickToX(note.startTick)
    const noteY = pitchToTrebleY(note.pitch)
    const noteEndX = tickToX(note.startTick + note.duration)

    // Check if click is within note bounds
    if (x >= noteX - 5 && x <= noteEndX + 5 &&
        y >= noteY - HIT_TOLERANCE && y <= noteY + HIT_TOLERANCE) {
      return note
    }
  }
  return null
}

function handleMouseMove(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const note = findNoteAtPosition(x, y)
  const newPitch = note?.pitch ?? null

  if (newPitch !== hoveredPitch.value) {
    hoveredPitch.value = newPitch
    emit('noteHover', newPitch)
  }
}

function handleMouseLeave() {
  if (hoveredPitch.value !== null) {
    hoveredPitch.value = null
    emit('noteHover', null)
  }
}

onMounted(() => {
  loadFont()
  draw()
  window.addEventListener('resize', draw)
})

onUnmounted(() => {
  window.removeEventListener('resize', draw)
})

defineExpose({
  syncScroll,
  redraw: draw,
})
</script>

<template>
  <div class="staff-view" ref="containerRef">
    <canvas
      ref="canvasRef"
      class="staff-canvas"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    />
  </div>
</template>

<style scoped>
.staff-view {
  width: 100%;
  overflow-x: scroll;
  overflow-y: hidden;
  background: rgba(12, 12, 18, 0.98);
  border-top: 1px solid rgba(139, 92, 246, 0.15);
  /* Hide scrollbar but allow programmatic scroll */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.staff-view::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Opera */
}

.staff-canvas {
  display: block;
  cursor: default;
}
</style>
