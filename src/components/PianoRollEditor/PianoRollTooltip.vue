<script setup lang="ts">
import { NoteSafety, type NoteSafetyLevel, midiToNote, getDetailedReasonText } from './types'

defineProps<{
  position: { x: number; y: number } | null
  pitch: number | null
  safety: NoteSafetyLevel
  reason: number
}>()
</script>

<template>
  <div
    v-if="position && pitch !== null"
    class="note-tooltip"
    :style="{
      left: `${position.x}px`,
      top: `${position.y - 8}px`
    }"
  >
    <div class="note-tooltip__header">
      <span class="note-tooltip__name">{{ midiToNote(pitch).name }}{{ midiToNote(pitch).octave }}</span>
      <span class="note-tooltip__midi">MIDI {{ pitch }}</span>
      <span class="note-tooltip__safety" :class="{
        'note-tooltip__safety--safe': safety === NoteSafety.Safe,
        'note-tooltip__safety--warning': safety === NoteSafety.Warning,
        'note-tooltip__safety--danger': safety === NoteSafety.Dissonant,
      }">
        {{ safety === NoteSafety.Safe ? 'Safe' :
           safety === NoteSafety.Warning ? 'Caution' : 'Avoid' }}
      </span>
    </div>
    <div v-if="reason" class="note-tooltip__details">
      <span
        v-for="(detail, idx) in getDetailedReasonText(reason)"
        :key="idx"
        class="note-tooltip__detail"
      >{{ detail }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Note Tooltip */
.note-tooltip {
  position: absolute;
  transform: translateY(-100%);
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(var(--studio-panel-deep-rgb), 0.95);
  border: 1px solid rgba(var(--studio-purple-rgb), 0.4);
  border-radius: 6px;
  font-size: 11px;
  color: var(--studio-text-primary);
  white-space: nowrap;
  pointer-events: none;
  z-index: 100;
  box-shadow: 0 2px 12px var(--studio-shadow-strong);
}

.note-tooltip__header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.note-tooltip__name {
  font-weight: 700;
  font-size: 13px;
  color: var(--studio-purple-soft);
}

.note-tooltip__midi {
  color: rgba(var(--studio-ink-rgb), 0.5);
  font-size: 10px;
}

.note-tooltip__safety {
  font-weight: 600;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
}

.note-tooltip__safety--safe {
  color: var(--studio-green);
  background: rgba(var(--studio-green-rgb), 0.15);
}

.note-tooltip__safety--warning {
  color: var(--studio-amber);
  background: rgba(var(--studio-amber-rgb), 0.15);
}

.note-tooltip__safety--danger {
  color: var(--studio-red);
  background: rgba(var(--studio-red-rgb), 0.15);
}

.note-tooltip__details {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 2px;
  border-top: 1px solid rgba(var(--studio-ink-rgb), 0.1);
}

.note-tooltip__detail {
  color: rgba(var(--studio-ink-rgb), 0.7);
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(var(--studio-ink-rgb), 0.08);
  border-radius: 3px;
}
</style>
