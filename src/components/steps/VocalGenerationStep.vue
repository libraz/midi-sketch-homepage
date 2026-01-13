<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { useMidiPlayer, type PlayOptions } from '@/composables/useMidiPlayer'
import { useMidiRegeneration } from '@/composables/useMidiRegeneration'
import { useSeedHistory } from '@/composables/useSeedHistory'
import { useMidiGeneration } from '@/composables/useMidiGeneration'
import { songImages } from '@/data/songImages'
import { chordProgressions } from '@/data/chordColors'
import { KEY_NAMES, transposeProgressionToKey } from '@/utils/midiUtils'
import { devLog } from '@/utils/devLog'
import { parseChordProgression, generateChordTimings, type ChordTiming } from '@/utils/chordUtils'
import { eventDataToPlacedNotes } from '@/utils/noteConversion'
import type { PlacedNote, ChordAtBar, SectionAtBar, PianoRollSafetyInfo, ChordInfo } from '@/components/PianoRollEditor/types'
import { NoteSafety, NoteReason } from '@/components/PianoRollEditor/types'
import GenerationPreview from '@/components/wizard/GenerationPreview.vue'
import RegenerateCard from '@/components/wizard/RegenerateCard.vue'
import DownloadButton from '@/components/wizard/DownloadButton.vue'
import SettingsSummary from '@/components/wizard/SettingsSummary.vue'
import GenerationState from '@/components/wizard/GenerationState.vue'
import StepHeader from '@/components/wizard/StepHeader.vue'

// Lazy load PianoRollEditor to reduce initial bundle size
const PianoRollEditor = defineAsyncComponent(() =>
  import('@/components/PianoRollEditor/index.vue')
)
const PianoRollStaffView = defineAsyncComponent(() =>
  import('@/components/PianoRollEditor/PianoRollStaffView.vue')
)

const { t } = useI18n()
const store = useWizardStore()
const player = useMidiPlayer()
const midiGen = useMidiGeneration()

const {
  isPlaying,
  isPaused,
  isLoading: isSoundfontLoading,
  isReady: isSoundfontReady,
  currentTick,
  togglePlay: playerTogglePlay,
  rewind,
  preload,
  stop,
  play,
  setTrackInstrument,
  setTrackMuted
} = player

const {
  error,
  justRegenerated,
  showFeedback,
  withPlaybackPreservation
} = useMidiRegeneration(player)

const {
  canUndo: canUndoVocal,
  canRedo: canRedoVocal,
  pushSeed: pushVocalSeed,
  initWithSeed: initVocalSeed,
  undo: undoVocalSeed,
  redo: redoVocalSeed,
  generateSeed
} = useSeedHistory()

// Play options for root note playback
const playOptions = computed((): PlayOptions => ({
  chordTimings: chordTimings.value,
  musicKey: store.config.key,
  playRootNotes: true  // Always enabled for vocal preview
}))

function handleSeek(tick: number) {
  stop()
  if (eventData.value) {
    play(eventData.value, tick, playOptions.value)
  }
}

function handleInstrumentChange(payload: { track: string; instrument: 'piano' | 'guitar' }) {
  setTrackInstrument(payload.track, payload.instrument)
  if (isPlaying.value && eventData.value) {
    const currentPos = currentTick.value
    stop()
    play(eventData.value, currentPos, playOptions.value)
  }
}

function handleTrackMuteChange(payload: { track: string; muted: boolean }) {
  setTrackMuted(payload.track, payload.muted)
  if (isPlaying.value && eventData.value) {
    const currentPos = currentTick.value
    stop()
    play(eventData.value, currentPos, playOptions.value)
  }
}

const isLoading = ref(true)
const isGenerated = ref(false)
const eventData = ref<any>(null)
const isGenerating = midiGen.isGenerating

// ============================================
// Editing Mode
// ============================================
const isEditing = ref(false)
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

// Check if notes have been edited
const hasEdits = computed(() => store.hasEditedVocalNotes())

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

// Start editing mode (opens as fullscreen overlay)
function startEditing() {
  // Stop playback if playing
  if (isPlaying.value) {
    stop()
  }

  // Initialize editing notes from store or eventData
  if (store.editedVocalNotes.value) {
    editingNotes.value = [...store.editedVocalNotes.value]
    devLog('Edit mode: using stored notes', { count: editingNotes.value.length })
  } else {
    // Debug: log track names
    devLog('Edit mode: eventData tracks', eventData.value?.tracks?.map((t: any) => t.name))
    editingNotes.value = eventDataToPlacedNotes(eventData.value)
    devLog('Edit mode: converted notes', { count: editingNotes.value.length })
  }

  // Reset zoom level and scroll for fresh start
  editorZoomLevel.value = 1
  staffScrollLeft.value = 0
  editorPlayheadTick.value = null
  editorIsPlaying.value = false

  // Prevent body scroll
  document.body.style.overflow = 'hidden'
  isEditing.value = true
}

// Finish editing and save
function finishEditing() {
  // Stop piano roll playback if playing
  if (pianoRollEditorRef.value?.isPlaying?.value) {
    pianoRollEditorRef.value.stop()
  }

  // Save edited notes to store
  store.setEditedVocalNotes([...editingNotes.value])

  // Restore body scroll
  document.body.style.overflow = ''
  isEditing.value = false
}

// Cancel editing
function cancelEditing() {
  // Stop piano roll playback if playing
  if (pianoRollEditorRef.value?.isPlaying?.value) {
    pianoRollEditorRef.value.stop()
  }

  // Restore body scroll
  document.body.style.overflow = ''
  isEditing.value = false
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

// Expose instance for next steps
defineExpose({ getInstance: () => midiGen.getInstance() })

const currentSongImage = computed(() =>
  songImages.find(s => s.id === store.config.songImageId)
)

const currentChord = computed(() =>
  chordProgressions.find(c => c.id === store.config.chordProgressionId)
)

// Chord progression display string for PianoRoll
const chordProgressionDisplay = computed(() => currentChord.value?.display || '')

// Generate chord timings for root note playback
const chordTimings = computed((): ChordTiming[] => {
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

// Vocal style name for display
const vocalStyleName = computed(() => {
  const styles = [
    'auto', 'standard', 'vocaloid', 'ultraVocaloid', 'idol', 'ballad',
    'rock', 'cityPop', 'anime', 'brightKira', 'coolSynth', 'cuteAffected', 'powerfulShout'
  ]
  return styles[store.config.vocalStyle] || 'auto'
})

// Melody template name for display
const melodyTemplateName = computed(() => {
  const templates = [
    'auto', 'plateauTalk', 'runUpTarget', 'downResolve',
    'hookRepeat', 'sparseAnchor', 'callResponse', 'jumpAccent'
  ]
  return templates[store.config.melodyTemplate] || 'auto'
})

const summaryItems = computed(() => [
  {
    label: t('bgmStep.summary.style'),
    value: currentSongImage.value ? t(`songImages.${currentSongImage.value.id}.name`) : '-'
  },
  {
    label: t('bgmStep.summary.key'),
    value: `${KEY_NAMES[store.config.key]} ${t('settingsStep.key.major')}`
  },
  {
    label: t('bgmStep.summary.chordProgression'),
    value: currentChord.value?.name || '-'
  },
  {
    label: 'Chords',
    value: currentChord.value ? transposeProgressionToKey(currentChord.value.display, store.config.key) : '-'
  },
  {
    label: t('vocalGenerationStep.summary.vocalStyle'),
    value: t(`melodyStep.advanced.vocalStyle.options.${vocalStyleName.value}`)
  },
  {
    label: t('vocalGenerationStep.summary.melodyTemplate'),
    value: t(`melodyStep.advanced.melodyTemplate.options.${melodyTemplateName.value}`)
  }
])

onMounted(async () => {
  if (typeof window === 'undefined') return

  try {
    preload()
    await midiGen.initialize()
    isLoading.value = false

    const initialSeed = store.config.vocalSeed || generateSeed()
    initVocalSeed(initialSeed)
    store.config.vocalSeed = initialSeed
    generate()
  } catch (e: any) {
    error.value = e.message
    isLoading.value = false
  }
})

onUnmounted(() => {
  // Ensure body scroll is restored when component is unmounted
  if (isEditing.value) {
    document.body.style.overflow = ''
  }
})

async function generate(overrideSeed?: number) {
  const instance = midiGen.getInstance()
  if (!instance) return

  error.value = null

  try {
    const seed = overrideSeed || store.config.vocalSeed || Math.floor(Math.random() * 0xFFFFFFFF)
    store.config.vocalSeed = seed

    // Validate config first (fixes vocalAttitude if not allowed for style)
    midiGen.validateConfigForStyle(store.config)

    // Build config for vocal generation (after validation)
    const vocalConfig = midiGen.buildVocalConfig(store.config, seed)
    devLog('Vocal generateVocal', vocalConfig)

    // Use the new generateVocal API
    instance.generateVocal(vocalConfig)
    eventData.value = midiGen.safeGetEvents(instance)

    isGenerated.value = true
    store.setVocalGenerated(true)
  } catch (e: any) {
    error.value = e.message
    devLog('Vocal Generate Error', e.message)
  }
}

async function regenerate() {
  await withPlaybackPreservation(async () => {
    const newSeed = pushVocalSeed()
    store.config.vocalSeed = newSeed
    await generate(newSeed)
  }, () => eventData.value, () => playOptions.value)
  showFeedback()
}

async function undoGeneration() {
  const seed = undoVocalSeed()
  if (seed === null) return

  await withPlaybackPreservation(async () => {
    store.config.vocalSeed = seed
    await generate(seed)
  }, () => eventData.value, () => playOptions.value)
}

async function redoGeneration() {
  const seed = redoVocalSeed()
  if (seed === null) return

  await withPlaybackPreservation(async () => {
    store.config.vocalSeed = seed
    await generate(seed)
  }, () => eventData.value, () => playOptions.value)
}

async function togglePlay() {
  if (!eventData.value) return
  await playerTogglePlay(eventData.value, playOptions.value)
}

function handleRewind() {
  rewind()
}

function downloadMidi() {
  const now = new Date()
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') + '_' +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0')
  midiGen.downloadMidi(`midi-sketch-vocal-${timestamp}.mid`)
}
</script>

<template>
  <div class="vocal-generation-step">
    <!-- Header -->
    <StepHeader
      :title="t('vocalGenerationStep.title')"
      :subtitle="t('vocalGenerationStep.subtitle')"
    />

    <!-- Settings Summary -->
    <SettingsSummary :items="summaryItems" />

    <!-- Loading / Generating / Error State -->
    <GenerationState
      :is-loading="isLoading"
      :is-generating="isGenerating"
      :error="error"
      :loading-text="t('bgmStep.loading')"
      :generating-text="t('vocalGenerationStep.generating')"
    />

    <!-- Result Panel -->
    <div v-if="!isLoading && !isGenerating && !error && isGenerated" class="result-panel">
      <!-- Editing Mode (Fullscreen Overlay) -->
      <Teleport to="body">
        <div v-if="isEditing" class="editing-overlay">
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

      <!-- Preview Mode (default) -->
      <template v-if="!isEditing">
        <!-- Piano Roll with Player (shows vocal track only) -->
        <GenerationPreview
          v-if="eventData"
          :event-data="eventData"
          :current-tick="currentTick"
          :is-playing="isPlaying"
          :is-paused="isPaused"
          :is-soundfont-loading="isSoundfontLoading"
          :is-soundfont-ready="isSoundfontReady"
          :just-regenerated="justRegenerated"
          :title="t('vocalGenerationStep.preview')"
          :regenerated-text="t('vocalGenerationStep.regenerated')"
          :loading-audio-text="t('bgmStep.result.loadingAudio')"
          :rewind-title="t('bgmStep.result.rewind')"
          :chord-progression="chordProgressionDisplay"
          :music-key="store.config.key"
          :play-root-notes="true"
          @seek="handleSeek"
          @toggle-play="togglePlay"
          @rewind="handleRewind"
          @instrument-change="handleInstrumentChange"
          @track-mute-change="handleTrackMuteChange"
        />

        <!-- Edited indicator -->
        <div v-if="hasEdits" class="edited-indicator">
          <span class="edited-indicator__icon">✎</span>
          <span>{{ t('vocalGenerationStep.edited') }}</span>
        </div>

        <div class="result-actions">
          <!-- Regenerate Button with integrated history -->
          <RegenerateCard
            :can-undo="canUndoVocal"
            :can-redo="canRedoVocal"
            :is-generating="isGenerating"
            :label="t('vocalGenerationStep.regenerate')"
            :undo-title="t('bgmStep.result.undo')"
            :redo-title="t('bgmStep.result.redo')"
            color="pink"
            @regenerate="regenerate"
            @undo="undoGeneration"
            @redo="redoGeneration"
          />

          <!-- Download Button -->
          <DownloadButton
            :label="t('vocalGenerationStep.download')"
            color="green"
            @download="downloadMidi"
          />
        </div>

        <!-- Hint for next step -->
        <p class="next-hint">{{ t('vocalGenerationStep.nextHint') }}</p>

        <!-- Beta Features Section -->
        <details class="beta-section">
          <summary class="beta-section__header">
            <span class="beta-section__title">
              <span class="beta-badge">{{ t('beta.badge') }}</span>
              {{ t('beta.title') }}
            </span>
            <svg class="beta-section__chevron" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.47 5.47a.75.75 0 0 1 1.06 0L8 7.94l2.47-2.47a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 0-1.06z"/>
            </svg>
          </summary>
          <div class="beta-section__content">
            <p class="beta-section__description">{{ t('beta.description') }}</p>
            <button class="beta-button" @click="startEditing">
              <span class="beta-button__icon">✎</span>
              <span>{{ t('vocalGenerationStep.edit') }}</span>
              <span class="beta-badge beta-badge--small">{{ t('beta.badge') }}</span>
            </button>
          </div>
        </details>
      </template>
    </div>
  </div>
</template>

<style scoped>
.vocal-generation-step {
  --step-accent: #EC4899;
  --accent-rgb: 236, 72, 153;
  --accent-dark-rgb: 219, 39, 119;
  --accent-light-rgb: 244, 114, 182;
}

.result-panel {
  text-align: center;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-top: 1.25rem;
}

.next-hint {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: rgba(250, 250, 250, 0.5);
  text-align: center;
}

/* Editing Mode Styles - Fullscreen Overlay */
.editing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.95);
  /* backdrop-filter removed for performance */
}

.editing-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #0c0c12;
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
  background: rgba(250, 250, 250, 0.05);
  border: 1px solid rgba(250, 250, 250, 0.15);
  border-radius: 8px;
  color: rgba(250, 250, 250, 0.7);
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-left: 1rem;
}

.close-button:hover {
  background: rgba(248, 113, 113, 0.15);
  border-color: rgba(248, 113, 113, 0.4);
  color: #F87171;
}

.editing-title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #FAFAFA;
  margin: 0 0 0.25rem 0;
}

.editing-hint {
  font-size: 0.85rem;
  color: rgba(250, 250, 250, 0.5);
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
  background: rgba(12, 12, 18, 0.9);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 4px;
  font-size: 12px;
  color: #FAFAFA;
  z-index: 10;
}

.staff-note-info__name {
  font-weight: 600;
  color: #A78BFA;
}

.staff-note-info__midi {
  color: rgba(250, 250, 250, 0.6);
}

.editing-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(250, 250, 250, 0.1);
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
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button__icon {
  font-size: 1rem;
}

.action-button--edit {
  background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.15), rgba(var(--accent-rgb), 0.1));
  border: 1px solid rgba(var(--accent-rgb), 0.3);
  color: rgb(var(--accent-light-rgb));
}

.action-button--edit:hover {
  background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.25), rgba(var(--accent-rgb), 0.15));
  border-color: rgba(var(--accent-rgb), 0.5);
}

.action-button--primary {
  background: linear-gradient(135deg, rgb(var(--accent-rgb)), rgb(var(--accent-dark-rgb)));
  color: white;
  box-shadow: 0 4px 12px -2px rgba(var(--accent-rgb), 0.4);
}

.action-button--primary:hover {
  box-shadow: 0 6px 16px -2px rgba(var(--accent-rgb), 0.5);
  transform: translateY(-1px);
}

.action-button--secondary {
  background: rgba(250, 250, 250, 0.05);
  border: 1px solid rgba(250, 250, 250, 0.15);
  color: rgba(250, 250, 250, 0.7);
}

.action-button--secondary:hover {
  background: rgba(250, 250, 250, 0.1);
  border-color: rgba(250, 250, 250, 0.25);
  color: rgba(250, 250, 250, 0.9);
}

.action-button--cancel {
  background: transparent;
  border: 1px solid rgba(250, 250, 250, 0.2);
  color: rgba(250, 250, 250, 0.6);
}

.action-button--cancel:hover {
  background: rgba(250, 250, 250, 0.05);
  border-color: rgba(250, 250, 250, 0.3);
  color: rgba(250, 250, 250, 0.8);
}

/* Edited Indicator */
.edited-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.75rem;
  padding: 0.4rem 0.8rem;
  background: rgba(var(--accent-rgb), 0.1);
  border: 1px solid rgba(var(--accent-rgb), 0.2);
  border-radius: 100px;
  font-size: 0.8rem;
  color: rgb(var(--accent-light-rgb));
}

.edited-indicator__icon {
  font-size: 0.9rem;
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

/* Beta Section Styles */
.beta-section {
  margin-top: 1.5rem;
  border: 1px dashed rgba(250, 250, 250, 0.15);
  border-radius: 8px;
  overflow: hidden;
}

.beta-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  background: rgba(250, 250, 250, 0.02);
  transition: background 0.2s ease;
  list-style: none;
}

.beta-section__header::-webkit-details-marker {
  display: none;
}

.beta-section__header:hover {
  background: rgba(250, 250, 250, 0.04);
}

.beta-section__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.5);
}

.beta-section__chevron {
  color: rgba(250, 250, 250, 0.3);
  transition: transform 0.2s ease;
}

.beta-section[open] .beta-section__chevron {
  transform: rotate(180deg);
}

.beta-section__content {
  padding: 0.75rem 1rem 1rem;
  border-top: 1px dashed rgba(250, 250, 250, 0.1);
}

.beta-section__description {
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.4);
  margin: 0 0 0.75rem 0;
}

.beta-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.4rem;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #F59E0B;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 4px;
}

.beta-badge--small {
  padding: 0.1rem 0.3rem;
  font-size: 0.55rem;
}

.beta-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: transparent;
  border: 1px solid rgba(250, 250, 250, 0.15);
  border-radius: 6px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.beta-button:hover {
  background: rgba(250, 250, 250, 0.05);
  border-color: rgba(250, 250, 250, 0.25);
  color: rgba(250, 250, 250, 0.8);
}

.beta-button__icon {
  font-size: 0.9rem;
  opacity: 0.7;
}
</style>
