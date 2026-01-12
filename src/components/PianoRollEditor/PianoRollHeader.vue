<script setup lang="ts">
import { ref, type Ref } from 'vue'
import type { SectionAtBar, ChordAtBar, ChordInfo } from './types'
import { DURATION_OPTIONS, NoteSafety } from './types'

defineProps<{
  sectionsInView?: SectionAtBar[]
  chordsInView?: ChordAtBar[]
  currentChord: ChordInfo
  barWidth: number
  currentDuration: number
  zoomLevel: number
  isPlaying?: boolean
  isPaused?: boolean
  isLoading?: boolean
  soundEnabled?: boolean
}>()

const emit = defineEmits<{
  'update:currentDuration': [value: number]
  zoomIn: []
  zoomOut: []
  resetZoom: []
  play: []
  stop: []
  togglePlay: []
  rewind: []
}>()

// Refs for scroll sync
const sectionBarRef = ref<HTMLElement | null>(null)
const chordBarRef = ref<HTMLElement | null>(null)

// Expose refs for scroll sync
defineExpose({
  sectionBarRef,
  chordBarRef,
})
</script>

<template>
  <!-- Header with legend -->
  <div class="editor-header">
    <div class="header-title">Piano Roll Editor</div>
    <div class="safety-legend">
      <div class="legend-item legend-item--safe">
        <span class="legend-dot"></span>
        <span class="legend-label">Safe</span>
      </div>
      <div class="legend-item legend-item--warning">
        <span class="legend-dot"></span>
        <span class="legend-label">Caution</span>
      </div>
      <div class="legend-item legend-item--dissonant">
        <span class="legend-dot"></span>
        <span class="legend-label">Avoid</span>
      </div>
    </div>
  </div>

  <!-- Duration selector, transport, and zoom controls -->
  <div class="duration-selector">
    <!-- Transport controls (Cubase style: Rewind, Stop, Play) -->
    <div v-if="soundEnabled" class="transport-controls">
      <!-- Rewind button -->
      <button
        class="transport-btn"
        @click="emit('rewind')"
        title="Rewind to start"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="5" width="3" height="14"/>
          <polygon points="9,12 20,4 20,20"/>
        </svg>
      </button>
      <!-- Stop button -->
      <button
        class="transport-btn"
        :class="{ 'transport-btn--stop-active': !isPlaying && !isPaused }"
        @click="emit('stop')"
        title="Stop"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="5" y="5" width="14" height="14"/>
        </svg>
      </button>
      <!-- Play/Pause button -->
      <button
        class="transport-btn transport-btn--play"
        :class="{ 'transport-btn--active': isPlaying }"
        :disabled="isLoading"
        @click="emit('togglePlay')"
        :title="isPlaying ? 'Pause (Space)' : isPaused ? 'Resume (Space)' : 'Play (Space)'"
      >
        <svg v-if="isLoading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        <svg v-else-if="isPlaying" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5,3 19,12 5,21"/>
        </svg>
      </button>
    </div>

    <span class="duration-label">New Note:</span>
    <div class="duration-buttons">
      <button
        v-for="opt in DURATION_OPTIONS"
        :key="opt.value"
        class="duration-btn"
        :class="{ 'duration-btn--active': currentDuration === opt.value }"
        @click="emit('update:currentDuration', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
    <div class="zoom-controls">
      <button class="zoom-btn" @click="emit('zoomOut')" title="Zoom Out (Ctrl+Scroll)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/>
        </svg>
      </button>
      <button class="zoom-level" @click="emit('resetZoom')" :title="`${Math.round(zoomLevel * 100)}% (Click to reset)`">
        {{ Math.round(zoomLevel * 100) }}%
      </button>
      <button class="zoom-btn" @click="emit('zoomIn')" title="Zoom In (Ctrl+Scroll)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/>
        </svg>
      </button>
    </div>
    <span class="hint-text">Space to play | Ctrl+Scroll to zoom</span>
  </div>

  <!-- Section header bar -->
  <div class="section-bar">
    <div class="section-bar__keys-spacer"></div>
    <div class="section-bar__progression" ref="sectionBarRef">
      <div
        v-for="(section, idx) in (sectionsInView || [])"
        :key="idx"
        class="section-chip"
        :class="`section-chip--${section.type}`"
        :style="{ width: `${(section.endBar - section.startBar) * barWidth}px`, minWidth: `${(section.endBar - section.startBar) * barWidth}px`, flexShrink: 0 }"
      >
        <span class="section-chip__name">{{ section.name }}</span>
        <span class="section-chip__bars">{{ section.endBar - section.startBar }} bars</span>
      </div>
    </div>
  </div>

  <!-- Chord progression bar -->
  <div class="chord-bar">
    <div class="chord-bar__keys-spacer"></div>
    <div class="chord-bar__progression" ref="chordBarRef">
      <div
        v-for="(chord, idx) in (chordsInView || [])"
        :key="idx"
        class="chord-chip"
        :class="{
          'chord-chip--tonic': chord.degree === 'I' || chord.degree === 'i',
          'chord-chip--subdominant': chord.degree === 'IV' || chord.degree === 'iv' || chord.degree === 'II' || chord.degree === 'ii',
          'chord-chip--dominant': chord.degree === 'V' || chord.degree === 'v' || chord.degree === 'VII' || chord.degree === 'vii',
        }"
        :style="{ width: `${barWidth}px`, minWidth: `${barWidth}px`, flexShrink: 0 }"
      >
        <span class="chord-chip__degree">{{ chord.degree }}</span>
        <span class="chord-chip__name">{{ chord.name }}</span>
      </div>
      <div v-if="!chordsInView || chordsInView.length === 0" class="chord-chip chord-chip--empty" :style="{ width: `${barWidth}px`, minWidth: `${barWidth}px` }">
        <span class="chord-chip__degree">{{ currentChord.degree }}</span>
        <span class="chord-chip__name">{{ currentChord.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Header */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: rgba(22, 22, 32, 0.95);
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  gap: 0.75rem;
}

.header-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.safety-legend {
  display: flex;
  gap: 0.625rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.legend-item--safe .legend-dot {
  background: #4ADE80;
  box-shadow: 0 0 6px rgba(74, 222, 128, 0.5);
}

.legend-item--warning .legend-dot {
  background: #FBBF24;
  box-shadow: 0 0 6px rgba(251, 191, 36, 0.5);
}

.legend-item--dissonant .legend-dot {
  background: #F87171;
  box-shadow: 0 0 6px rgba(248, 113, 113, 0.5);
}

.legend-label {
  font-size: 0.55rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Duration Selector */
.duration-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
}

.duration-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.6);
  text-transform: uppercase;
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
  color: rgba(250, 250, 250, 0.6);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  cursor: pointer;
  transition: all 0.15s;
}

.duration-btn:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
}

.duration-btn--active {
  background: rgba(139, 92, 246, 0.3);
  border-color: #8B5CF6;
  color: #FAFAFA;
}

/* Transport Controls */
.transport-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-right: 0.5rem;
  padding-right: 0.5rem;
  border-right: 1px solid rgba(139, 92, 246, 0.15);
}

.transport-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 4px;
  color: rgba(250, 250, 250, 0.7);
  cursor: pointer;
  transition: all 0.15s;
}

.transport-btn:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.3);
  border-color: rgba(139, 92, 246, 0.5);
  color: #FAFAFA;
}

.transport-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.transport-btn--active {
  background: rgba(248, 113, 113, 0.2);
  border-color: rgba(248, 113, 113, 0.5);
  color: #F87171;
}

.transport-btn--active:hover:not(:disabled) {
  background: rgba(248, 113, 113, 0.3);
}

.transport-btn--play {
  background: rgba(74, 222, 128, 0.15);
  border-color: rgba(74, 222, 128, 0.3);
  color: rgba(74, 222, 128, 0.8);
}

.transport-btn--play:hover:not(:disabled) {
  background: rgba(74, 222, 128, 0.25);
  border-color: rgba(74, 222, 128, 0.5);
  color: #4ADE80;
}

.transport-btn--play.transport-btn--active {
  background: rgba(248, 113, 113, 0.2);
  border-color: rgba(248, 113, 113, 0.5);
  color: #F87171;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  margin-left: 0.5rem;
  padding-left: 0.5rem;
  border-left: 1px solid rgba(139, 92, 246, 0.15);
}

.zoom-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 3px;
  color: rgba(250, 250, 250, 0.6);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.zoom-btn:hover {
  background: rgba(139, 92, 246, 0.25);
  border-color: rgba(139, 92, 246, 0.4);
  color: #FAFAFA;
}

.zoom-level {
  min-width: 42px;
  height: 22px;
  padding: 0 0.25rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 3px;
  color: #8B5CF6;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.zoom-level:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
}

.hint-text {
  margin-left: auto;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.35);
}

/* Section Bar */
.section-bar {
  display: flex;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
}

.section-bar__keys-spacer {
  width: 40px;
  flex-shrink: 0;
  background: rgba(25, 25, 35, 0.5);
  border-right: 1px solid rgba(139, 92, 246, 0.15);
}

.section-bar__progression {
  display: flex;
  gap: 0;
  overflow-x: hidden;
  padding-left: 8px;
}

.section-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: rgba(139, 92, 246, 0.15);
  border-right: 2px solid rgba(139, 92, 246, 0.15);
  box-sizing: border-box;
}

.section-chip--verse {
  background: rgba(74, 222, 128, 0.15);
  border-right-color: rgba(74, 222, 128, 0.4);
}

.section-chip--prechorus {
  background: rgba(251, 191, 36, 0.15);
  border-right-color: rgba(251, 191, 36, 0.4);
}

.section-chip--chorus {
  background: rgba(248, 113, 113, 0.15);
  border-right-color: rgba(248, 113, 113, 0.4);
}

.section-chip--bridge {
  background: rgba(96, 165, 250, 0.15);
  border-right-color: rgba(96, 165, 250, 0.4);
}

.section-chip--outro {
  background: rgba(167, 139, 250, 0.15);
  border-right-color: rgba(167, 139, 250, 0.4);
}

.section-chip--intro {
  background: rgba(52, 211, 153, 0.15);
  border-right-color: rgba(52, 211, 153, 0.4);
}

.section-chip__name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #FAFAFA;
}

.section-chip__bars {
  font-size: 0.6rem;
  color: rgba(250, 250, 250, 0.6);
}

/* Chord Bar */
.chord-bar {
  display: flex;
  background: rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
}

.chord-bar__keys-spacer {
  width: 40px;
  flex-shrink: 0;
  background: rgba(25, 25, 35, 0.5);
  border-right: 1px solid rgba(139, 92, 246, 0.15);
}

.chord-bar__progression {
  display: flex;
  gap: 0;
  overflow-x: hidden;
  padding-left: 8px;
}

.chord-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.35rem 0.5rem;
  background: rgba(139, 92, 246, 0.1);
  border-right: 1px solid rgba(139, 92, 246, 0.15);
  box-sizing: border-box;
}

.chord-chip:last-child {
  border-right: none;
}

.chord-chip--tonic {
  background: rgba(74, 222, 128, 0.12);
}

.chord-chip--subdominant {
  background: rgba(251, 191, 36, 0.12);
}

.chord-chip--dominant {
  background: rgba(96, 165, 250, 0.12);
}

.chord-chip__degree {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #8B5CF6;
}

.chord-chip--tonic .chord-chip__degree {
  color: #4ADE80;
}

.chord-chip--subdominant .chord-chip__degree {
  color: #FBBF24;
}

.chord-chip--dominant .chord-chip__degree {
  color: rgb(96, 165, 250);
}

.chord-chip__name {
  font-size: 0.7rem;
  font-weight: 600;
  color: #FAFAFA;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 640px) {
  .editor-header {
    flex-direction: column;
    gap: 0.3rem;
    align-items: flex-start;
  }

  .safety-legend {
    gap: 0.5rem;
  }

  .duration-selector {
    flex-wrap: wrap;
  }

  .hint-text {
    display: none;
  }

  .zoom-controls {
    margin-left: auto;
    padding-left: 0;
    border-left: none;
  }
}
</style>
