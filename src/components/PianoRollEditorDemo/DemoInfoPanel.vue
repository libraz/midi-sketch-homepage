<script setup lang="ts">
import type {
  PlacedNote,
  SectionInfo,
  SongStructure,
  PianoRollSafetyInfo,
} from '@/composables/usePianoRollEditor'
import { getKeyName, getNoteName } from './demoUtils'

defineProps<{
  currentSection: SectionInfo
  notesInCurrentSection: PlacedNote[]
  safetyInfo: PianoRollSafetyInfo
  structure: SongStructure
}>()
</script>

<template>
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
        <span>Key: {{ getKeyName(structure.key) }} Major</span>
        <span>Total: {{ structure.totalBars }} bars</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

@media (max-width: 640px) {
  .info-panel {
    flex-direction: column;
  }
}
</style>
