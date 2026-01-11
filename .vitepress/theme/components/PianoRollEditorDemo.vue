<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { usePianoRollEditor, NoteSafety, type PlacedNote } from '../composables/usePianoRollEditor'
import PianoRollEditor from './PianoRollEditor/index.vue'

// Use the composable
const editor = usePianoRollEditor({
  vocalLow: 48,
  vocalHigh: 72,
  allowHarmony: false,
})

const {
  structure,
  currentSection,
  currentTick,
  safetyInfo,
  notesInCurrentSection,
  currentSectionIndex,
  allowHarmony,
  vocalLow,
  vocalHigh,
  placedNotes,
  addNote,
  deleteNote,
  updateNote,
  clearSectionNotes,
  clearAllNotes,
  getSafetyAtTick,
  splitNote,
  mergeNotes,
} = editor

// Ref to piano roll editor for scroll control
const pianoRollRef = ref<InstanceType<typeof PianoRollEditor> | null>(null)

// Current duration for new notes
const currentDuration = ref(480)
const previewPitch = ref<number | null>(null)
const showSafetyAlways = ref(false)

// Use all notes with absolute ticks (no conversion needed for seamless editing)
const displayNotes = computed(() => placedNotes.value)

// Chords for ALL bars in the song (for seamless view)
const chordsInView = computed(() => {
  const result: { bar: number; name: string; degree: string }[] = []

  for (let globalBar = 1; globalBar <= structure.value.totalBars; globalBar++) {
    // Find which section this bar belongs to
    const section = structure.value.sections.find(
      s => globalBar >= s.startBar && globalBar < s.endBar
    )
    if (!section) continue

    // Find the chord active at this bar
    const chordAtBar = [...section.chords]
      .reverse()
      .find(c => c.bar <= globalBar)

    if (chordAtBar) {
      result.push({
        bar: globalBar,
        name: chordAtBar.chord.name,
        degree: chordAtBar.chord.degree,
      })
    }
  }

  return result
})

// Sections info for section header bar
const sectionsInView = computed(() => {
  return structure.value.sections.map(s => ({
    name: s.name,
    type: s.type,
    startBar: s.startBar,
    endBar: s.endBar,
  }))
})

// Handlers - now using absolute ticks directly
function handleNoteClick(pitch: number, tick: number) {
  addNote(pitch, tick, currentDuration.value)
}

function handleNoteHover(pitch: number | null) {
  previewPitch.value = pitch
}

function handleNoteDelete(noteId: string) {
  deleteNote(noteId)
}

function handleNoteDurationChange(noteId: string, duration: number) {
  updateNote(noteId, { duration })
}

function handleNoteMove(noteId: string, pitch: number, tick: number) {
  updateNote(noteId, { pitch, startTick: tick })
}

// getSafetyAtTick now receives absolute ticks directly
function handleGetSafetyAtTick(tick: number) {
  return getSafetyAtTick(tick)
}

function handleNoteSplit(noteId: string, tick: number) {
  splitNote(noteId, tick)
}

function handleNoteMerge(noteIds: string[]) {
  mergeNotes(noteIds)
}

function handleNoteAdd(note: { pitch: number; startTick: number; duration: number }) {
  addNote(note.pitch, note.startTick, note.duration)
}

// Scroll to a specific section
function scrollToSection(sectionIndex: number) {
  const section = structure.value.sections[sectionIndex]
  if (section && pianoRollRef.value) {
    pianoRollRef.value.scrollToBar(section.startBar)
  }
}

// Note name helper
function getNoteName(pitch: number): string {
  const names = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
  return `${names[pitch % 12]}${Math.floor(pitch / 12) - 1}`
}

// Section type colors
const sectionColors: Record<string, string> = {
  verse: '#4ADE80',
  prechorus: '#FBBF24',
  chorus: '#F87171',
  bridge: '#60A5FA',
  outro: '#A78BFA',
  intro: '#34D399',
}

function getSectionColor(type: string): string {
  return sectionColors[type] ?? '#8B5CF6'
}
</script>

<template>
  <div class="demo-container">
    <!-- Header -->
    <div class="demo-header">
      <h3 class="demo-title">Vocal Piano Roll Editor</h3>
      <p class="demo-description">
        Edit vocal melody with SafePAI suggestions. Monophonic mode enforces single notes.
      </p>
    </div>

    <!-- Section Navigation -->
    <div class="section-nav">
      <div class="section-tabs">
        <button
          v-for="(section, idx) in structure.sections"
          :key="section.id"
          class="section-tab"
          :class="{ 'section-tab--active': idx === currentSectionIndex }"
          :style="{ '--section-color': getSectionColor(section.type) }"
          @click="scrollToSection(idx)"
        >
          <span class="section-tab__name">{{ section.name }}</span>
          <span class="section-tab__bars">{{ section.endBar - section.startBar }} bars</span>
        </button>
      </div>
    </div>

    <!-- Settings -->
    <div class="settings-bar">
      <div class="setting-group">
        <label class="setting-label">
          <input type="checkbox" v-model="allowHarmony" />
          <span>Polyphonic</span>
        </label>
      </div>

      <div class="setting-group">
        <label class="setting-label">
          <input type="checkbox" v-model="showSafetyAlways" />
          <span>Show Safety</span>
        </label>
      </div>

      <div class="setting-group">
        <span class="setting-label">New Note Duration:</span>
        <div class="duration-buttons">
          <button
            v-for="opt in [{ label: '1/16', value: 120 }, { label: '1/8', value: 240 }, { label: '1/4', value: 480 }, { label: '1/2', value: 960 }]"
            :key="opt.value"
            class="duration-btn"
            :class="{ 'duration-btn--active': currentDuration === opt.value }"
            @click="currentDuration = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div class="setting-group">
        <button class="action-btn action-btn--danger" @click="clearSectionNotes">
          Clear Section
        </button>
        <button class="action-btn" @click="clearAllNotes">
          Clear All
        </button>
      </div>
    </div>

    <!-- Piano Roll Editor -->
    <div class="editor-wrapper">
      <PianoRollEditor
        ref="pianoRollRef"
        :currentTick="currentTick"
        :vocalLow="vocalLow"
        :vocalHigh="vocalHigh"
        :currentKey="structure.key"
        :safetyInfo="safetyInfo"
        :placedNotes="displayNotes"
        :previewPitch="previewPitch"
        :gridSnap="120"
        :totalBars="structure.totalBars"
        :showSafetyAlways="showSafetyAlways"
        :chordsInView="chordsInView"
        :sectionsInView="sectionsInView"
        :getSafetyAtTick="handleGetSafetyAtTick"
        :allowHarmony="allowHarmony"
        :bpm="structure.bpm"
        :soundEnabled="true"
        @noteClick="handleNoteClick"
        @noteHover="handleNoteHover"
        @noteAdd="handleNoteAdd"
        @noteDelete="handleNoteDelete"
        @noteDurationChange="handleNoteDurationChange"
        @noteMove="handleNoteMove"
        @noteSplit="handleNoteSplit"
        @noteMerge="handleNoteMerge"
      />
    </div>

    <!-- Info Panel -->
    <div class="info-panel">
      <div class="info-section">
        <h4>Notes in {{ currentSection.name }} ({{ notesInCurrentSection.length }})</h4>
        <div v-if="notesInCurrentSection.length" class="note-list">
          <span v-for="note in notesInCurrentSection.slice(0, 12)" :key="note.id" class="note-chip">
            {{ getNoteName(note.pitch) }}
          </span>
          <span v-if="notesInCurrentSection.length > 12" class="note-chip note-chip--more">
            +{{ notesInCurrentSection.length - 12 }}
          </span>
        </div>
        <span v-else class="no-notes">Click on grid to add notes</span>
      </div>

      <div class="info-section">
        <h4>Recommended Notes</h4>
        <div class="note-list">
          <span
            v-for="pitch in safetyInfo.recommended.slice(0, 6)"
            :key="pitch"
            class="note-chip note-chip--recommended"
          >
            {{ getNoteName(pitch) }}
          </span>
        </div>
      </div>

      <div class="info-section">
        <h4>Song Info</h4>
        <div class="song-info">
          <span>BPM: {{ structure.bpm }}</span>
          <span>Key: {{ ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'][structure.key] }} Major</span>
          <span>Total: {{ structure.totalBars }} bars</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(10, 10, 15, 0.95);
  border-radius: 16px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  font-family: 'Outfit', sans-serif;
}

.demo-header {
  text-align: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.demo-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #FAFAFA;
  margin: 0 0 0.25rem;
}

.demo-description {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* Section Navigation */
.section-nav {
  overflow-x: auto;
  padding: 0.25rem 0;
}

.section-tabs {
  display: flex;
  gap: 0.375rem;
  min-width: fit-content;
}

.section-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 70px;
}

.section-tab:hover {
  background: rgba(255, 255, 255, 0.1);
}

.section-tab--active {
  background: rgba(var(--section-color-rgb, 139, 92, 246), 0.2);
  border-color: var(--section-color, #8B5CF6);
  box-shadow: 0 0 12px rgba(var(--section-color-rgb, 139, 92, 246), 0.3);
}

.section-tab__name {
  font-size: 0.7rem;
  font-weight: 600;
  color: #FAFAFA;
}

.section-tab__bars {
  font-size: 0.55rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Settings Bar */
.settings-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.setting-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
}

.setting-label input[type="checkbox"] {
  accent-color: #8B5CF6;
}

.duration-buttons {
  display: flex;
  gap: 0.2rem;
}

.duration-btn {
  padding: 0.2rem 0.4rem;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 3px;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  cursor: pointer;
  transition: all 0.15s;
}

.duration-btn:hover {
  background: rgba(139, 92, 246, 0.2);
}

.duration-btn--active {
  background: rgba(139, 92, 246, 0.3);
  border-color: #8B5CF6;
  color: #FAFAFA;
}

.action-btn {
  padding: 0.3rem 0.6rem;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 4px;
  color: #A78BFA;
  font-size: 0.65rem;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: rgba(139, 92, 246, 0.25);
}

.action-btn--danger {
  background: rgba(248, 113, 113, 0.15);
  border-color: rgba(248, 113, 113, 0.3);
  color: #F87171;
}

.action-btn--danger:hover {
  background: rgba(248, 113, 113, 0.25);
}

/* Editor */
.editor-wrapper {
  height: 300px;
}

/* Info Panel */
.info-panel {
  display: flex;
  gap: 1rem;
  padding: 0.625rem 0.75rem;
  background: rgba(22, 22, 32, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(139, 92, 246, 0.15);
}

.info-section {
  flex: 1;
}

.info-section h4 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0 0 0.375rem;
}

.note-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.note-chip {
  padding: 0.15rem 0.35rem;
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 3px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: #A78BFA;
}

.note-chip--recommended {
  background: rgba(74, 222, 128, 0.15);
  border-color: rgba(74, 222, 128, 0.3);
  color: #4ADE80;
}

.note-chip--more {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
}

.no-notes {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
}

.song-info {
  display: flex;
  gap: 1rem;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Responsive */
@media (max-width: 640px) {
  .bar-nav {
    flex-direction: column;
    gap: 0.5rem;
  }

  .info-panel {
    flex-direction: column;
  }

  .settings-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
