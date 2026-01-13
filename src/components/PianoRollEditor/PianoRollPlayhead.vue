<script setup lang="ts">
defineProps<{
  x: number | null
  isDragging: boolean
}>()

const emit = defineEmits<{
  dragStart: [e: MouseEvent]
}>()

function handleMouseDown(e: MouseEvent) {
  emit('dragStart', e)
}
</script>

<template>
  <div
    v-if="x !== null"
    class="css-playhead"
    :class="{ dragging: isDragging }"
    :style="{ transform: `translateX(${x}px)` }"
    @mousedown="handleMouseDown"
  >
    <div class="playhead-marker" />
    <div class="playhead-line" />
    <div class="playhead-handle" />
  </div>
</template>

<style scoped>
/* CSS Playhead (GPU accelerated, draggable) */
.css-playhead {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 2;
  will-change: transform;
  cursor: ew-resize;
}

.css-playhead.dragging {
  cursor: grabbing;
}

.playhead-marker {
  position: absolute;
  top: 0;
  left: -6px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 10px solid #F87171;
  pointer-events: auto;
}

.playhead-line {
  position: absolute;
  top: 0;
  left: -1px;
  width: 2px;
  height: 100%;
  background: #F87171;
  box-shadow: 0 0 6px rgba(248, 113, 113, 0.5);
  pointer-events: none;
}

/* Invisible wider handle for easier grabbing */
.playhead-handle {
  position: absolute;
  top: 0;
  left: -8px;
  width: 16px;
  height: 100%;
  pointer-events: auto;
  cursor: ew-resize;
}

.css-playhead:hover .playhead-line {
  box-shadow: 0 0 10px rgba(248, 113, 113, 0.8);
}

.css-playhead:hover .playhead-marker {
  border-top-color: #FF6B6B;
}
</style>
