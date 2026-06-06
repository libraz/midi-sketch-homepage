<script setup lang="ts">
import { NoteSafety, midiToNote, getReasonText, type NoteSafetyLevel } from './types'

defineProps<{
  hoveredNote: number | null
  selectedCount: number
  zoomLevel: number
  totalBars: number
  noteCount: number
  getNoteSafety: (pitch: number) => NoteSafetyLevel
  getNoteReason: (pitch: number) => number
}>()
</script>

<template>
  <div class="editor-footer">
    <div class="footer-left">
      <div v-if="hoveredNote !== null" class="note-info">
        <span class="note-info__name">
          {{ midiToNote(hoveredNote).name }}{{ midiToNote(hoveredNote).octave }}
        </span>
        <span class="note-info__midi">MIDI {{ hoveredNote }}</span>
        <span
          class="note-info__safety"
          :class="{
            'note-info__safety--safe': getNoteSafety(hoveredNote) === NoteSafety.Safe,
            'note-info__safety--warning': getNoteSafety(hoveredNote) === NoteSafety.Warning,
            'note-info__safety--dissonant': getNoteSafety(hoveredNote) === NoteSafety.Dissonant,
          }"
        >
          {{ getNoteSafety(hoveredNote) === NoteSafety.Safe ? 'Safe' :
             getNoteSafety(hoveredNote) === NoteSafety.Warning ? 'Caution' : 'Avoid' }}
        </span>
        <span v-if="getNoteReason(hoveredNote)" class="note-info__reason">
          {{ getReasonText(getNoteReason(hoveredNote)) }}
        </span>
      </div>
      <div v-else class="note-info note-info--placeholder">
        <span v-if="selectedCount > 0">{{ selectedCount }} note{{ selectedCount > 1 ? 's' : '' }} selected</span>
        <span v-else>Hover over a note to see safety info</span>
      </div>
    </div>
    <div class="footer-right">
      <span class="status-item">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        {{ Math.round(zoomLevel * 100) }}%
      </span>
      <span class="status-item">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>
        </svg>
        {{ totalBars }} bars
      </span>
      <span class="status-item">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
        {{ noteCount }} notes
      </span>
    </div>
  </div>
</template>

<style scoped>
.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background: rgba(var(--studio-panel-rgb), 0.95);
  border-top: 1px solid rgba(var(--studio-purple-rgb), 0.15);
  min-height: 28px;
}

.footer-left {
  flex: 1;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: rgba(var(--studio-ink-rgb), 0.6);
}

.status-item svg {
  opacity: 0.6;
}

.note-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.note-info--placeholder {
  color: rgba(var(--studio-ink-rgb), 0.6);
  font-size: 0.7rem;
}

.note-info__name {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--studio-text-primary);
}

.note-info__midi {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: rgba(var(--studio-ink-rgb), 0.6);
}

.note-info__safety {
  font-size: 0.55rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.35rem;
  border-radius: 3px;
}

.note-info__safety--safe {
  background: rgba(var(--studio-green-rgb), 0.15);
  color: var(--studio-green);
}

.note-info__safety--warning {
  background: rgba(var(--studio-amber-rgb), 0.15);
  color: var(--studio-amber);
}

.note-info__safety--dissonant {
  background: rgba(var(--studio-red-rgb), 0.15);
  color: var(--studio-red);
}

.note-info__reason {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: rgba(var(--studio-ink-rgb), 0.6);
}

@media (max-width: 640px) {
  .note-info {
    flex-wrap: wrap;
    gap: 0.3rem;
  }
}
</style>
