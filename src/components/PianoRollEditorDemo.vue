<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePianoRollEditor } from '@/composables/usePianoRollEditor'
import PianoRollEditor from './PianoRollEditor/index.vue'
import DemoHeader from './PianoRollEditorDemo/DemoHeader.vue'
import DemoInfoPanel from './PianoRollEditorDemo/DemoInfoPanel.vue'
import DemoSectionTabs from './PianoRollEditorDemo/DemoSectionTabs.vue'
import DemoSettingsBar from './PianoRollEditorDemo/DemoSettingsBar.vue'
import { getChordsInView, getSectionsInView } from './PianoRollEditorDemo/demoUtils'

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

const pianoRollRef = ref<InstanceType<typeof PianoRollEditor> | null>(null)
const currentDuration = ref(480)
const previewPitch = ref<number | null>(null)
const showSafetyAlways = ref(false)

const chordsInView = computed(() => getChordsInView(structure.value))
const sectionsInView = computed(() => getSectionsInView(structure.value))

function handleNoteClick(pitch: number, tick: number) {
  addNote(pitch, tick, currentDuration.value)
}

function handleNoteHover(pitch: number | null) {
  previewPitch.value = pitch
}

function handleNoteAdd(note: { pitch: number; startTick: number; duration: number }) {
  addNote(note.pitch, note.startTick, note.duration)
}

function handleNoteMove(noteId: string, pitch: number, tick: number) {
  updateNote(noteId, { pitch, startTick: tick })
}

function scrollToSection(sectionIndex: number) {
  const section = structure.value.sections[sectionIndex]
  if (section) {
    pianoRollRef.value?.scrollToBar(section.startBar)
  }
}
</script>

<template>
  <div class="demo-container">
    <DemoHeader />

    <DemoSectionTabs
      :sections="structure.sections"
      :currentSectionIndex="currentSectionIndex"
      @sectionSelect="scrollToSection"
    />

    <DemoSettingsBar
      v-model:allowHarmony="allowHarmony"
      v-model:showSafetyAlways="showSafetyAlways"
      v-model:currentDuration="currentDuration"
      @clearSection="clearSectionNotes"
      @clearAll="clearAllNotes"
    />

    <div class="editor-wrapper">
      <PianoRollEditor
        ref="pianoRollRef"
        :currentTick="currentTick"
        :vocalLow="vocalLow"
        :vocalHigh="vocalHigh"
        :currentKey="structure.key"
        :safetyInfo="safetyInfo"
        :placedNotes="placedNotes"
        :previewPitch="previewPitch"
        :gridSnap="120"
        :totalBars="structure.totalBars"
        :showSafetyAlways="showSafetyAlways"
        :chordsInView="chordsInView"
        :sectionsInView="sectionsInView"
        :getSafetyAtTick="getSafetyAtTick"
        :allowHarmony="allowHarmony"
        :bpm="structure.bpm"
        :soundEnabled="true"
        @noteClick="handleNoteClick"
        @noteHover="handleNoteHover"
        @noteAdd="handleNoteAdd"
        @noteDelete="deleteNote"
        @noteDurationChange="(noteId, duration) => updateNote(noteId, { duration })"
        @noteMove="handleNoteMove"
        @noteSplit="splitNote"
        @noteMerge="mergeNotes"
      />
    </div>

    <DemoInfoPanel
      :currentSection="currentSection"
      :notesInCurrentSection="notesInCurrentSection"
      :safetyInfo="safetyInfo"
      :structure="structure"
    />
  </div>
</template>

<style scoped>
.demo-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(10, 10, 15, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  font-family: var(--font-body);
}

.editor-wrapper {
  height: 300px;
}
</style>
