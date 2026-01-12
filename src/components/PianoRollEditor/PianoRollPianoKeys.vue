<script setup lang="ts">
import { TOTAL_NOTES, MAX_NOTE, midiToNote, isBlackKey } from './types'

defineProps<{
  hoveredNote: number | null
  vocalRange: { low: number; high: number }
}>()

function isInVocalRange(pitch: number, range: { low: number; high: number }): boolean {
  return pitch >= range.low && pitch <= range.high
}
</script>

<template>
  <div class="piano-keys">
    <div
      v-for="i in TOTAL_NOTES"
      :key="i"
      class="piano-key"
      :class="{
        'piano-key--black': isBlackKey(MAX_NOTE - i + 1),
        'piano-key--hovered': hoveredNote === MAX_NOTE - i + 1,
        'piano-key--in-range': isInVocalRange(MAX_NOTE - i + 1, vocalRange),
        'piano-key--out-of-range': !isInVocalRange(MAX_NOTE - i + 1, vocalRange),
      }"
    >
      <span class="piano-key__label">
        {{ midiToNote(MAX_NOTE - i + 1).name }}{{ midiToNote(MAX_NOTE - i + 1).octave }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.piano-keys {
  width: 40px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(90deg, rgba(25, 25, 35, 0.98) 0%, rgba(20, 20, 28, 0.95) 100%);
  border-right: 1px solid rgba(139, 92, 246, 0.15);
  flex-shrink: 0;
  position: sticky;
  left: 0;
  z-index: 10;
}

.piano-key {
  height: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 4px;
  background: linear-gradient(90deg, #e8e8e8, #d4d4d4);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  transition: background 0.1s;
}

.piano-key--black {
  background: linear-gradient(90deg, #2a2a2a, #1f1f1f);
}

.piano-key--black .piano-key__label {
  color: rgba(255, 255, 255, 0.5);
}

.piano-key--in-range {
  position: relative;
}

.piano-key--in-range::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #8B5CF6;
  opacity: 0.4;
}

.piano-key--out-of-range {
  background: linear-gradient(90deg, #4a4a4a, #3a3a3a);
  opacity: 0.6;
}

.piano-key--out-of-range.piano-key--black {
  background: linear-gradient(90deg, #1a1a1a, #151515);
}

.piano-key--out-of-range .piano-key__label {
  color: rgba(100, 100, 100, 0.5);
}

.piano-key--hovered {
  filter: brightness(1.1);
}

.piano-key__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.45rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.5);
}

@media (max-width: 640px) {
  .piano-keys {
    width: 32px;
  }

  .piano-key__label {
    font-size: 0.4rem;
  }
}
</style>
