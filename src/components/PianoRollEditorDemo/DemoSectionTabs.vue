<script setup lang="ts">
import type { SectionInfo } from '@/composables/usePianoRollEditor'
import { getSectionColor, getSectionColorRgb } from './demoUtils'

defineProps<{
  sections: SectionInfo[]
  currentSectionIndex: number
}>()

defineEmits<{
  sectionSelect: [sectionIndex: number]
}>()
</script>

<template>
  <div class="section-nav">
    <div class="section-tabs">
      <button
        v-for="(section, idx) in sections"
        :key="section.id"
        class="section-tab"
        :class="{ 'section-tab--active': idx === currentSectionIndex }"
        :style="{
          '--section-color': getSectionColor(section.type),
          '--section-color-rgb': getSectionColorRgb(section.type),
        }"
        @click="$emit('sectionSelect', idx)"
      >
        <span class="section-tab__name">{{ section.name }}</span>
        <span class="section-tab__bars">{{ section.endBar - section.startBar }} bars</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
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
  min-width: 70px;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.section-tab:hover {
  background: rgba(255, 255, 255, 0.1);
}

.section-tab--active {
  background: rgba(var(--section-color-rgb), 0.2);
  border-color: var(--section-color);
  box-shadow: 0 0 12px rgba(var(--section-color-rgb), 0.3);
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
</style>
