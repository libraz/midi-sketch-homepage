<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { parseChordProgression, generateChordTimings, chordEventsToTimings, type ChordTiming } from '@/utils/chordUtils'
import { eventDataToPlacedNotes } from '@/utils/noteConversion'
import type { PlacedNote, ChordAtBar, SectionAtBar, PianoRollSafetyInfo, ChordInfo } from '@/components/PianoRollEditor/types'
import { NoteSafety, NoteReason } from '@/components/PianoRollEditor/types'

// Lazy load PianoRollEditor to reduce initial bundle size
const PianoRollEditor = defineAsyncComponent(() =>
  import('@/components/PianoRollEditor/index.vue')
)
const PianoRollStaffView = defineAsyncComponent(() =>
  import('@/components/PianoRollEditor/PianoRollStaffView.vue')
)

const props = defineProps<{ eventData: any }>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const { t } = useI18n()
const store = useWizardStore()

// Local alias for the event data passed in from the host
const eventData = computed(() => props.eventData)

// ============================================
// Editing State
// ============================================
const editingNotes = ref<PlacedNote[]>([])
const pianoRollEditorRef = ref<InstanceType<typeof PianoRollEditor> | null>(null)
const staffViewRef = ref<InstanceType<typeof PianoRollStaffView> | null>(null)
const staffScrollLeft = ref(0)
const editorZoomLevel = ref(1)
const editorPlayheadTick = ref<number | null>(null)
const editorIsPlaying = ref(false)
const staffHoveredNote = ref<number | null>(null)

// Handle note hover from staff view
function handleStaffNoteHover(pitch: number | null) {
  staffHoveredNote.value = pitch
}

// Helper to convert MIDI pitch to note name
function midiToNoteName(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const name = noteNames[midi % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${name}${octave}`
}

// Sync staff view with piano roll scroll
function handleEditorScroll(scrollLeft: number) {
  staffScrollLeft.value = scrollLeft
}

// Sync staff view with piano roll zoom
function handleZoomChange(zoomLevel: number) {
  editorZoomLevel.value = zoomLevel
}

// Handle playback updates from piano roll editor
function handlePlaybackUpdate(tick: number | null, isPlaying: boolean) {
  editorPlayheadTick.value = tick
  editorIsPlaying.value = isPlaying
}

// Total bars for piano roll
const totalBars = computed(() => {
  if (!eventData.value?.sections) return 8
  const lastSection = eventData.value.sections[eventData.value.sections.length - 1]
  const endBar = lastSection?.start_bar + lastSection?.bars || 8
  return endBar
})

// Chords for piano roll display
const chordsInView = computed((): ChordAtBar[] => {
  if (!chordTimings.value.length) return []
  const ppq = eventData.value?.ppq || 480
  const ticksPerBar = ppq * 4
  const key = store.config.key
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

  return chordTimings.value.map((ct) => {
    // Calculate actual chord name from key and semitone
    const rootNote = (key + ct.chord.semitone) % 12
    const rootName = noteNames[rootNote]
    const chordName = rootName + (ct.chord.isMinor ? 'm' : '')
    // Bass root note in octave 3 (MIDI 48-59 = C3-B3) - fits well in bass clef staff
    const bassRoot = 48 + rootNote

    return {
      bar: Math.floor(ct.startTick / ticksPerBar) + 1,
      name: chordName,
      degree: ct.chord.degree || '',
      root: bassRoot,
    }
  })
})

// Sections for piano roll display
const sectionsInView = computed((): SectionAtBar[] => {
  if (!eventData.value?.sections) return []
  return eventData.value.sections.map((s: any) => ({
    name: s.name,
    type: s.type,
    startBar: s.start_bar || 1,
    endBar: (s.start_bar || 1) + (s.bars || 4),
  }))
})

// Convert chordUtils ChordInfo to PianoRollEditor ChordInfo format
function convertToEditorChordInfo(chord: ChordTiming['chord'], key: number): ChordInfo {
  const root = (key + chord.semitone) % 12
  const isMinor = chord.isMinor

  // Calculate chord tones based on chord type
  // major: [0, 4, 7] (root, major 3rd, perfect 5th)
  // minor: [0, 3, 7] (root, minor 3rd, perfect 5th)
  const tones = isMinor ? [0, 3, 7] : [0, 4, 7]

  return {
    name: chord.displayName,
    degree: chord.degree,
    root,
    type: isMinor ? 'minor' : 'major',
    tones,
  }
}

// Get chord at specific tick from chordTimings
function getChordAtTick(tick: number): ChordInfo {
  const timings = chordTimings.value
  const key = store.config.key

  if (!timings.length) {
    // Default chord
    return {
      name: 'C',
      degree: 'I',
      root: key,
      type: 'major',
      tones: [0, 4, 7],
    }
  }

  // Find the chord that contains this tick
  for (let i = timings.length - 1; i >= 0; i--) {
    if (timings[i].startTick <= tick) {
      return convertToEditorChordInfo(timings[i].chord, key)
    }
  }

  return convertToEditorChordInfo(timings[0].chord, key)
}

// Calculate safety info for a specific tick
function getSafetyAtTick(tick: number): PianoRollSafetyInfo {
  const chord = getChordAtTick(tick)
  const vocalLow = store.config.vocalLow
  const vocalHigh = store.config.vocalHigh
  const key = store.config.key

  const safety: number[] = new Array(128).fill(NoteSafety.Dissonant)
  const reason: number[] = new Array(128).fill(NoteReason.None)
  const recommended: number[] = []

  // Major scale intervals from root
  const majorScale = [0, 2, 4, 5, 7, 9, 11]

  // Check if pitch is in the major scale of the current key
  function isInScale(pitch: number): boolean {
    const relativeToKey = (pitch - key + 120) % 12
    return majorScale.includes(relativeToKey)
  }

  // Tension positions: 9th=2, 11th=5, 13th=9 semitones from root
  const tensionMap: Record<number, number> = {
    2: NoteReason.Ninth,
    5: NoteReason.Eleventh,
    9: NoteReason.Thirteenth,
  }

  // Avoid notes for major/dom7 chords
  const avoidNotes: number[] = []
  if (chord.type === 'major' || chord.type === 'dom7') {
    avoidNotes.push(5) // Perfect 4th can clash with major 3rd
  }

  for (let pitch = 0; pitch < 128; pitch++) {
    const inRange = pitch >= vocalLow && pitch <= vocalHigh
    const relativeToChord = (pitch - chord.root + 120) % 12
    const inScale = isInScale(pitch)

    // Out of range
    if (!inRange) {
      safety[pitch] = NoteSafety.Dissonant
      reason[pitch] = NoteReason.OutOfRange
      if (pitch < vocalLow) reason[pitch] |= NoteReason.TooLow
      if (pitch > vocalHigh) reason[pitch] |= NoteReason.TooHigh
      continue
    }

    // Chord tones (root, 3rd, 5th, 7th)
    if (chord.tones.includes(relativeToChord)) {
      safety[pitch] = NoteSafety.Safe
      reason[pitch] = NoteReason.ChordTone
      if (relativeToChord === 0) reason[pitch] |= NoteReason.Root
      else if (chord.tones.indexOf(relativeToChord) === 1) reason[pitch] |= NoteReason.Third
      else if (chord.tones.indexOf(relativeToChord) === 2) reason[pitch] |= NoteReason.Fifth
      else if (chord.tones.indexOf(relativeToChord) === 3) reason[pitch] |= NoteReason.Seventh

      // Add root notes as recommended
      if (relativeToChord === 0) {
        recommended.push(pitch)
      }
      continue
    }

    // Avoid notes
    if (avoidNotes.includes(relativeToChord)) {
      safety[pitch] = NoteSafety.Dissonant
      reason[pitch] = NoteReason.AvoidNote
      continue
    }

    // Tensions (in scale)
    if (relativeToChord in tensionMap && inScale) {
      safety[pitch] = NoteSafety.Warning
      reason[pitch] = NoteReason.Tension | tensionMap[relativeToChord]
      continue
    }

    // Other scale tones
    if (inScale) {
      safety[pitch] = NoteSafety.Warning
      reason[pitch] = NoteReason.ScaleTone
      continue
    }

    // Non-scale (chromatic)
    safety[pitch] = NoteSafety.Dissonant
    reason[pitch] = NoteReason.NonScale
  }

  return {
    tick,
    chord,
    safety: safety as any,
    reason,
    recommended,
  }
}

// Initialize editing notes from store or eventData
function initEditingNotes() {
  if (store.editedVocalNotes.value) {
    editingNotes.value = [...store.editedVocalNotes.value]
  } else {
    editingNotes.value = eventDataToPlacedNotes(eventData.value)
  }

  // Reset zoom level and scroll for fresh start
  editorZoomLevel.value = 1
  staffScrollLeft.value = 0
  editorPlayheadTick.value = null
  editorIsPlaying.value = false
}

// Finish editing and save
function finishEditing() {
  // Stop piano roll playback if playing
  if (pianoRollEditorRef.value?.isPlaying) {
    pianoRollEditorRef.value.stop()
  }

  // Save edited notes to store
  store.setEditedVocalNotes([...editingNotes.value])
  emit('saved')
}

// Cancel editing without saving
function cancelEditing() {
  // Stop piano roll playback if playing
  if (pianoRollEditorRef.value?.isPlaying) {
    pianoRollEditorRef.value.stop()
  }
  emit('close')
}

// Reset to original generated notes
function resetToGenerated() {
  store.clearEditedVocalNotes()
  editingNotes.value = eventDataToPlacedNotes(eventData.value)
}

// ============================================
// Note Event Handlers
// ============================================

// Default duration for new notes (quarter note = 480 ticks)
const defaultNoteDuration = 480

function generateNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Handle click on empty grid to add a new note
function handleNoteClick(pitch: number, tick: number) {
  const newNote: PlacedNote = {
    id: generateNoteId(),
    pitch,
    startTick: tick,
    duration: defaultNoteDuration,
  }
  editingNotes.value = [...editingNotes.value, newNote]
}

function handleNoteAdd(note: { pitch: number; startTick: number; duration: number }) {
  const newNote: PlacedNote = {
    id: generateNoteId(),
    pitch: note.pitch,
    startTick: note.startTick,
    duration: note.duration,
  }
  editingNotes.value = [...editingNotes.value, newNote]
}

function handleNoteDelete(noteId: string) {
  editingNotes.value = editingNotes.value.filter(n => n.id !== noteId)
}

function handleNoteMove(noteId: string, pitch: number, startTick: number) {
  editingNotes.value = editingNotes.value.map(n =>
    n.id === noteId ? { ...n, pitch, startTick } : n
  )
}

function handleNoteDurationChange(noteId: string, duration: number) {
  editingNotes.value = editingNotes.value.map(n =>
    n.id === noteId ? { ...n, duration } : n
  )
}

function handleNoteSplit(noteId: string, splitTick: number) {
  const note = editingNotes.value.find(n => n.id === noteId)
  if (!note) return

  const firstDuration = splitTick - note.startTick
  const secondDuration = note.duration - firstDuration

  if (firstDuration <= 0 || secondDuration <= 0) return

  editingNotes.value = editingNotes.value.flatMap(n => {
    if (n.id !== noteId) return [n]
    return [
      { ...n, duration: firstDuration },
      {
        id: generateNoteId(),
        pitch: n.pitch,
        startTick: splitTick,
        duration: secondDuration,
      },
    ]
  })
}

function handleNoteMerge(noteIds: string[]) {
  const notesToMerge = editingNotes.value
    .filter(n => noteIds.includes(n.id))
    .sort((a, b) => a.startTick - b.startTick)

  if (notesToMerge.length < 2) return

  const first = notesToMerge[0]
  const last = notesToMerge[notesToMerge.length - 1]
  const mergedDuration = (last.startTick + last.duration) - first.startTick

  editingNotes.value = [
    ...editingNotes.value.filter(n => !noteIds.includes(n.id)),
    { ...first, duration: mergedDuration },
  ]
}

// ============================================
// Chord Timeline
// ============================================

// Chord progression display string (from store) used for fallback parsing
const currentChord = computed(() =>
  store.getChordProgressionById(store.config.chordProgressionId)
)
const chordProgressionDisplay = computed(() => currentChord.value?.display || '')

// Generate chord timings for chord display and safety map
const chordTimings = computed((): ChordTiming[] => {
  // Prefer WASM chord timeline (includes secondary dominants)
  if (eventData.value?.chords?.length) {
    const ppq = eventData.value.ppq || eventData.value.division || 480
    return chordEventsToTimings(eventData.value.chords, ppq)
  }

  // Fallback: parse static display string
  if (!chordProgressionDisplay.value || !eventData.value?.sections) return []

  const parsedChords = parseChordProgression(chordProgressionDisplay.value)
  if (parsedChords.length === 0) return []

  const sections = eventData.value.sections.map((s: any) => ({
    startTick: s.start_ticks ?? s.startTick,
    endTick: s.end_ticks ?? s.endTick,
    bars: s.bars,
    type: s.type
  }))

  return generateChordTimings({
    chords: parsedChords,
    sections,
    ppq: eventData.value.ppq || 480,
    barsPerChord: 1
  })
})

// ============================================
// Lifecycle
// ============================================

onMounted(() => {
  initEditingNotes()
  // Prevent body scroll while the fullscreen editor is open
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  // Restore body scroll when the editor closes
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div class="editing-overlay">
      <div class="editing-container">
        <div class="editing-header">
          <div class="editing-header-left">
            <h3 class="editing-title">{{ t('vocalGenerationStep.editingTitle') }}</h3>
            <p class="editing-hint">{{ t('vocalGenerationStep.editingHint') }}</p>
          </div>
          <button class="close-button" @click="cancelEditing" title="Close">
            &#x2715;
          </button>
        </div>

        <!-- Piano Roll Editor -->
        <div class="piano-roll-wrapper">
          <PianoRollEditor
            ref="pianoRollEditorRef"
            :placed-notes="editingNotes"
            :vocal-low="store.config.vocalLow"
            :vocal-high="store.config.vocalHigh"
            :total-bars="totalBars"
            :bpm="store.config.bpm"
            :sound-enabled="true"
            :allow-harmony="false"
            :show-safety-always="true"
            :current-key="store.config.key"
            :chords-in-view="chordsInView"
            :sections-in-view="sectionsInView"
            :get-safety-at-tick="getSafetyAtTick"
            @note-click="handleNoteClick"
            @note-add="handleNoteAdd"
            @note-delete="handleNoteDelete"
            @note-move="handleNoteMove"
            @note-duration-change="handleNoteDurationChange"
            @note-split="handleNoteSplit"
            @note-merge="handleNoteMerge"
            @scroll="handleEditorScroll"
            @zoom-change="handleZoomChange"
            @playback-update="handlePlaybackUpdate"
          />
        </div>

        <!-- Staff View (Sheet Music) -->
        <div class="staff-view-wrapper">
          <PianoRollStaffView
            ref="staffViewRef"
            :placed-notes="editingNotes"
            :chords-in-view="chordsInView"
            :total-bars="totalBars"
            :zoom-level="editorZoomLevel"
            :scroll-left="staffScrollLeft"
            :playhead-tick="editorPlayheadTick"
            :is-playing="editorIsPlaying"
            @note-hover="handleStaffNoteHover"
          />
          <!-- Note info display -->
          <div v-if="staffHoveredNote !== null" class="staff-note-info">
            <span class="staff-note-info__name">{{ midiToNoteName(staffHoveredNote) }}</span>
            <span class="staff-note-info__midi">MIDI {{ staffHoveredNote }}</span>
          </div>
        </div>

        <!-- Editing Actions -->
        <div class="editing-actions">
          <button class="action-button action-button--secondary" @click="resetToGenerated">
            {{ t('vocalGenerationStep.resetToGenerated') }}
          </button>
          <div class="editing-actions-right">
            <button class="action-button action-button--cancel" @click="cancelEditing">
              {{ t('vocalGenerationStep.cancelEdit') }}
            </button>
            <button class="action-button action-button--primary" @click="finishEditing">
              {{ t('vocalGenerationStep.finishEdit') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Editing Mode Styles - Fullscreen Overlay */
.editing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: var(--studio-scrim);
  /* backdrop-filter removed for performance */
}

.editing-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgb(var(--studio-panel-deep-rgb));
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editing-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.editing-header-left {
  flex: 1;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(var(--studio-ink-rgb), 0.05);
  border: 1px solid rgba(var(--studio-ink-rgb), 0.15);
  border-radius: 8px;
  color: rgba(var(--studio-ink-rgb), 0.7);
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-left: 1rem;
}

.close-button:hover {
  background: rgba(var(--studio-red-rgb), 0.15);
  border-color: rgba(var(--studio-red-rgb), 0.4);
  color: var(--studio-red);
}

.editing-title {
  font-family: var(--font-body);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--studio-text-primary);
  margin: 0 0 0.25rem 0;
}

.editing-hint {
  font-size: 0.85rem;
  color: rgba(var(--studio-ink-rgb), 0.5);
  margin: 0;
}

.piano-roll-wrapper {
  flex: 1;
  min-height: 0;
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
}

/* Override PianoRollEditor height to fill available space */
.piano-roll-wrapper :deep(.piano-roll-editor) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.piano-roll-wrapper :deep(.editor-body) {
  flex: 1;
  height: auto;
  min-height: 250px;
}

.staff-view-wrapper {
  height: 140px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0.5rem;
  position: relative;
}

.staff-note-info {
  position: absolute;
  bottom: 4px;
  right: 8px;
  display: flex;
  gap: 8px;
  padding: 4px 10px;
  background: rgba(var(--studio-panel-deep-rgb), 0.9);
  border: 1px solid rgba(var(--studio-purple-rgb), 0.3);
  border-radius: 4px;
  font-size: 12px;
  color: var(--studio-text-primary);
  z-index: 10;
}

.staff-note-info__name {
  font-weight: 600;
  color: var(--studio-purple-soft);
}

.staff-note-info__midi {
  color: rgba(var(--studio-ink-rgb), 0.6);
}

.editing-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(var(--studio-ink-rgb), 0.1);
}

.editing-actions-right {
  display: flex;
  gap: 0.5rem;
}

/* Action Buttons */
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button--primary {
  background: linear-gradient(135deg, var(--studio-pink), var(--studio-pink-soft));
  color: var(--studio-on-accent);
  box-shadow: 0 4px 12px -2px rgba(var(--studio-pink-rgb), 0.4);
}

.action-button--primary:hover {
  box-shadow: 0 6px 16px -2px rgba(var(--studio-pink-rgb), 0.5);
  transform: translateY(-1px);
}

.action-button--secondary {
  background: rgba(var(--studio-ink-rgb), 0.05);
  border: 1px solid rgba(var(--studio-ink-rgb), 0.15);
  color: rgba(var(--studio-ink-rgb), 0.7);
}

.action-button--secondary:hover {
  background: rgba(var(--studio-ink-rgb), 0.1);
  border-color: rgba(var(--studio-ink-rgb), 0.25);
  color: rgba(var(--studio-ink-rgb), 0.9);
}

.action-button--cancel {
  background: transparent;
  border: 1px solid rgba(var(--studio-ink-rgb), 0.2);
  color: rgba(var(--studio-ink-rgb), 0.6);
}

.action-button--cancel:hover {
  background: rgba(var(--studio-ink-rgb), 0.05);
  border-color: rgba(var(--studio-ink-rgb), 0.3);
  color: rgba(var(--studio-ink-rgb), 0.8);
}

@media (max-width: 640px) {
  .editing-actions {
    flex-direction: column;
  }

  .editing-actions-right {
    width: 100%;
    justify-content: flex-end;
  }

  .action-button {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
}
</style>
