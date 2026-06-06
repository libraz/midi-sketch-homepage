<script setup lang="ts">
import { DURATION_OPTIONS } from './types'

defineProps<{
  show: boolean
  position: { x: number; y: number }
  selectedCount: number
  canSplit: boolean
  canMerge: boolean
}>()

const emit = defineEmits<{
  close: []
  delete: []
  setDuration: [duration: number]
  split: []
  merge: []
}>()
</script>

<template>
  <div
    v-if="show"
    class="context-menu"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
  >
    <div class="context-menu__section">
      <div class="context-menu__label">Duration</div>
      <button
        v-for="opt in DURATION_OPTIONS"
        :key="opt.value"
        class="context-menu__item"
        @click="emit('setDuration', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
    <div class="context-menu__divider"></div>
    <button
      v-if="canSplit"
      class="context-menu__item context-menu__item--split"
      @click="emit('split')"
    >
      Split {{ selectedCount > 1 ? 'Notes' : 'Note' }} Here
    </button>
    <button
      v-if="canMerge"
      class="context-menu__item context-menu__item--merge"
      @click="emit('merge')"
    >
      Merge {{ selectedCount }} Notes
    </button>
    <button class="context-menu__item context-menu__item--danger" @click="emit('delete')">
      Delete {{ selectedCount > 1 ? `${selectedCount} Notes` : 'Note' }}
    </button>
  </div>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 120px;
  background: rgba(var(--studio-panel-rgb), 0.98);
  border: 1px solid rgba(var(--studio-purple-rgb), 0.3);
  border-radius: 6px;
  padding: 0.3rem;
  box-shadow: 0 8px 32px var(--studio-shadow-strong);
  backdrop-filter: blur(12px);
}

.context-menu__section {
  display: flex;
  flex-direction: column;
}

.context-menu__label {
  font-size: 0.55rem;
  font-weight: 600;
  color: rgba(var(--studio-ink-rgb), 0.6);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.4rem;
}

.context-menu__item {
  display: block;
  width: 100%;
  padding: 0.3rem 0.4rem;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: var(--studio-text-primary);
  font-size: 0.7rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.1s;
}

.context-menu__item:hover {
  background: rgba(var(--studio-purple-rgb), 0.2);
}

.context-menu__item--danger {
  color: var(--studio-red);
}

.context-menu__item--danger:hover {
  background: rgba(var(--studio-red-rgb), 0.15);
}

.context-menu__item--split {
  color: var(--studio-amber);
}

.context-menu__item--split:hover {
  background: rgba(var(--studio-amber-rgb), 0.15);
}

.context-menu__item--merge {
  color: var(--studio-green);
}

.context-menu__item--merge:hover {
  background: rgba(var(--studio-green-rgb), 0.15);
}

.context-menu__divider {
  height: 1px;
  background: rgba(var(--studio-purple-rgb), 0.15);
  margin: 0.25rem 0;
}
</style>
