<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

interface Note {
  track?: number
  note?: number
  pitch?: number
  start?: number
  start_ticks?: number
  duration?: number
  duration_ticks?: number
  velocity: number
}

interface Section {
  name: string
  type: string
  startTick: number
  endTick: number
  start_bar: number
  bars: number
  start_ticks: number
  end_ticks: number
  start_seconds: number
  end_seconds: number
}

function getNoteValue(note: Note, key: 'pitch' | 'start' | 'duration'): number {
  if (key === 'pitch') return note.pitch ?? note.note ?? 60
  if (key === 'start') return note.start_ticks ?? note.start ?? 0
  if (key === 'duration') return note.duration_ticks ?? note.duration ?? 480
  return 0
}

interface EventData {
  bpm: number
  ppq: number
  tracks: {
    name: string
    notes: Note[]
  }[]
  sections?: Section[]
}

const props = defineProps<{
  events: EventData | null
  currentTick?: number
  isPlaying?: boolean
}>()

const emit = defineEmits<{
  seek: [tick: number]
  instrumentChange: [payload: { track: string; instrument: 'piano' | 'guitar' }]
}>()

// Instrument selection for Chords track
const chordsInstrument = ref<'piano' | 'guitar'>('piano')

function toggleChordsInstrument() {
  chordsInstrument.value = chordsInstrument.value === 'piano' ? 'guitar' : 'piano'
  emit('instrumentChange', { track: 'Chords', instrument: chordsInstrument.value })
}

function handleSectionClick(section: Section) {
  const tick = section.start_ticks ?? section.startTick
  emit('seek', tick)
}

const TRACK_COLORS = [
  '#8B5CF6', // Purple - Melody
  '#EC4899', // Pink - Chords
  '#10B981', // Green - Bass
  '#F59E0B', // Orange - Arpeggio
  '#3B82F6', // Blue - Drums
]

const SECTION_COLORS: Record<string, { bg: string; glow: string; text: string }> = {
  Intro: { bg: 'rgba(59, 130, 246, 0.15)', glow: '#3B82F6', text: '#93C5FD' },
  A: { bg: 'rgba(139, 92, 246, 0.15)', glow: '#8B5CF6', text: '#C4B5FD' },
  B: { bg: 'rgba(236, 72, 153, 0.15)', glow: '#EC4899', text: '#F9A8D4' },
  Chorus: { bg: 'rgba(245, 158, 11, 0.15)', glow: '#F59E0B', text: '#FCD34D' },
  Bridge: { bg: 'rgba(16, 185, 129, 0.15)', glow: '#10B981', text: '#6EE7B7' },
  Outro: { bg: 'rgba(99, 102, 241, 0.15)', glow: '#6366F1', text: '#A5B4FC' },
  Break: { bg: 'rgba(168, 85, 247, 0.15)', glow: '#A855F7', text: '#D8B4FE' },
}

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

const notesAreaRef = ref<HTMLElement | null>(null)
const scrollLeft = ref(0)

function getTrackNotes(track: any): Note[] {
  return track.notes || track.events || []
}

const noteRange = computed(() => {
  if (!props.events?.tracks) return { min: 48, max: 84 }

  let min = 127
  let max = 0

  for (const track of props.events.tracks) {
    if (track.name === 'Drums') continue
    const notes = getTrackNotes(track)
    for (const note of notes) {
      const pitch = getNoteValue(note, 'pitch')
      if (pitch < min) min = pitch
      if (pitch > max) max = pitch
    }
  }

  if (min > max) {
    return { min: 48, max: 84 }
  }

  return {
    min: Math.max(0, min - 2),
    max: Math.min(127, max + 2)
  }
})

const timeRange = computed(() => {
  if (!props.events?.tracks) return { max: 1920 }

  let max = 0
  for (const track of props.events.tracks) {
    const notes = getTrackNotes(track)
    for (const note of notes) {
      const start = getNoteValue(note, 'start')
      const duration = getNoteValue(note, 'duration')
      const end = start + duration
      if (end > max) max = end
    }
  }

  return { max: max + 480 }
})

const visibleTracks = computed(() => {
  if (!props.events?.tracks) return []

  return props.events.tracks
    .filter(t => t.name !== 'Drums')
    .map(t => {
      const rawNotes = t.notes || t.events || []
      const normalizedNotes = rawNotes.map((n: Note) => ({
        note: getNoteValue(n, 'pitch'),
        start: getNoteValue(n, 'start'),
        duration: getNoteValue(n, 'duration'),
        velocity: n.velocity
      }))
      return {
        ...t,
        notes: normalizedNotes
      }
    })
})

const sections = computed(() => {
  return props.events?.sections || []
})

function noteToY(note: number): number {
  const range = noteRange.value.max - noteRange.value.min
  const normalized = (noteRange.value.max - note) / range
  return normalized * 100
}

function tickToX(tick: number): number {
  const ppq = props.events?.ppq || 480
  return (tick / (4 * ppq)) * 200
}

function durationToWidth(duration: number): number {
  const ppq = props.events?.ppq || 480
  return (duration / (4 * ppq)) * 200
}

const noteHeight = computed(() => {
  const range = noteRange.value.max - noteRange.value.min
  return 100 / (range + 1)
})

const totalWidth = computed(() => {
  return tickToX(timeRange.value.max)
})

const pianoKeys = computed(() => {
  const keys = []
  for (let note = noteRange.value.max; note >= noteRange.value.min; note--) {
    const octave = Math.floor(note / 12) - 1
    const noteName = NOTE_NAMES[note % 12]
    const isBlack = noteName.includes('#') || noteName.includes('b')
    keys.push({
      note,
      name: `${noteName}${octave}`,
      isBlack
    })
  }
  return keys
})

const gridLines = computed(() => {
  const lines = []
  const ppq = props.events?.ppq || 480
  const barTicks = 4 * ppq
  const bars = Math.ceil(timeRange.value.max / barTicks)

  for (let i = 0; i <= bars; i++) {
    lines.push({
      x: tickToX(i * barTicks),
      bar: i + 1
    })
  }
  return lines
})

function getTrackColor(trackIndex: number): string {
  return TRACK_COLORS[trackIndex % TRACK_COLORS.length]
}

function getSectionColor(type: string) {
  return SECTION_COLORS[type] || SECTION_COLORS['A']
}

function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  scrollLeft.value = target.scrollLeft
}

const playheadX = computed(() => {
  if (!props.currentTick) return 0
  return tickToX(props.currentTick)
})

// Current bar calculation
const currentBar = computed(() => {
  if (!props.currentTick || !props.events) return 1
  const ppq = props.events.ppq || 480
  const barTicks = 4 * ppq
  return Math.floor(props.currentTick / barTicks) + 1
})

// Current beat within bar
const currentBeat = computed(() => {
  if (!props.currentTick || !props.events) return 1
  const ppq = props.events.ppq || 480
  const barTicks = 4 * ppq
  const ticksInBar = props.currentTick % barTicks
  return Math.floor(ticksInBar / ppq) + 1
})

// Active section
const activeSection = computed(() => {
  if (!props.currentTick || !sections.value.length) return null

  for (const section of sections.value) {
    const startTick = section.start_ticks ?? section.startTick
    const endTick = section.end_ticks ?? section.endTick
    if (props.currentTick >= startTick && props.currentTick < endTick) {
      return section
    }
  }
  return null
})

// Also sync section timeline scroll with notes area
const sectionTimelineRef = ref<HTMLElement | null>(null)

// Auto-scroll to keep playhead centered during playback
watch(() => props.currentTick, (tick) => {
  // If tick is 0 or undefined, scroll to beginning
  if (!tick || tick === 0) {
    if (notesAreaRef.value) notesAreaRef.value.scrollLeft = 0
    if (sectionTimelineRef.value) sectionTimelineRef.value.scrollLeft = 0
    return
  }

  // Only auto-scroll during playback
  if (!props.isPlaying) return

  const playheadPos = tickToX(tick)

  // Scroll notes area
  if (notesAreaRef.value) {
    const containerWidth = notesAreaRef.value.clientWidth
    const targetScrollPos = playheadPos - containerWidth * 0.3
    notesAreaRef.value.scrollLeft = Math.max(0, targetScrollPos)
  }

  // Scroll section timeline
  if (sectionTimelineRef.value) {
    const containerWidth = sectionTimelineRef.value.clientWidth
    const targetScrollPos = playheadPos - containerWidth * 0.3
    sectionTimelineRef.value.scrollLeft = Math.max(0, targetScrollPos)
  }
})

// Reset scroll only when currentTick goes to 0 (rewind)
// Don't reset on pause - keep the current scroll position

// Get section display name with i18n
function getSectionDisplayName(section: Section): string {
  const key = `pianoRoll.sections.${section.type}`
  const translated = t(key)
  // If translation not found (returns the key), use the original name
  return translated === key ? section.name : translated
}

// Total bars in song
const totalBars = computed(() => {
  if (!sections.value.length) return 0
  return sections.value.reduce((sum, s) => sum + s.bars, 0)
})

// Time calculation helpers
function ticksToSeconds(ticks: number): number {
  if (!props.events) return 0
  const bpm = props.events.bpm || 120
  const ppq = props.events.ppq || 480
  // seconds = ticks * (60 / bpm / ppq)
  return ticks * (60 / bpm / ppq)
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const centisecs = Math.floor((seconds % 1) * 100)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${centisecs.toString().padStart(2, '0')}`
}

// Current time in seconds
const currentTimeSeconds = computed(() => {
  if (!props.currentTick) return 0
  return ticksToSeconds(props.currentTick)
})

// Total duration in seconds
const totalTimeSeconds = computed(() => {
  return ticksToSeconds(timeRange.value.max)
})

// Formatted time strings
const currentTimeFormatted = computed(() => formatTime(currentTimeSeconds.value))
const totalTimeFormatted = computed(() => formatTime(totalTimeSeconds.value))

// Progress percentage for overview
const progressPercent = computed(() => {
  if (!props.currentTick || !timeRange.value.max) return 0
  return Math.min(100, (props.currentTick / timeRange.value.max) * 100)
})
</script>

<template>
  <div class="piano-roll">
    <!-- Transport Bar -->
    <div class="transport-bar">
      <!-- Position Module -->
      <div class="transport-module transport-module--position">
        <div class="module-cell">
          <span class="cell-label">BAR</span>
          <span class="cell-value cell-value--primary">{{ String(currentBar).padStart(3, '0') }}</span>
          <span class="cell-dot">.</span>
          <span class="cell-value cell-value--secondary">{{ currentBeat }}</span>
        </div>
      </div>

      <!-- Time Module -->
      <div class="transport-module transport-module--time">
        <div class="module-cell">
          <span class="cell-label">TIME</span>
          <div class="time-display">
            <span class="time-current">{{ currentTimeFormatted }}</span>
            <span class="time-divider">/</span>
            <span class="time-total">{{ totalTimeFormatted }}</span>
          </div>
        </div>
      </div>

      <!-- Section Module -->
      <div class="transport-module transport-module--section">
        <div
          v-if="activeSection"
          class="section-indicator"
          :style="{
            '--section-color': getSectionColor(activeSection.type).glow,
            '--section-text': getSectionColor(activeSection.type).text
          }"
        >
          <span class="section-dot"></span>
          <span class="section-label">{{ getSectionDisplayName(activeSection) }}</span>
        </div>
        <div v-else class="section-indicator section-indicator--idle">
          <span class="section-label">Ready</span>
        </div>
      </div>

      <!-- Info Module -->
      <div class="transport-module transport-module--info">
        <div class="info-item">
          <span class="info-label">SIG</span>
          <span class="info-value">4/4</span>
        </div>
        <div class="info-item">
          <span class="info-label">BPM</span>
          <span class="info-value info-value--tempo">{{ events?.bpm || 120 }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">TRK</span>
          <span class="info-value">{{ visibleTracks.length }}</span>
        </div>
      </div>
    </div>

    <!-- Song Structure Overview -->
    <div v-if="sections.length" class="structure-overview">
      <div class="structure-label">
        <span class="structure-label__text">Structure</span>
        <span class="structure-label__bars">{{ totalBars }} bars</span>
      </div>
      <div class="structure-bar">
        <!-- Section blocks -->
        <div
          v-for="(section, index) in sections"
          :key="`overview-${index}`"
          class="structure-section"
          :class="{ 'structure-section--active': activeSection === section }"
          :style="{
            flex: section.bars,
            '--section-color': getSectionColor(section.type).glow,
            '--section-bg': getSectionColor(section.type).bg,
            '--section-text': getSectionColor(section.type).text
          }"
          @click="handleSectionClick(section)"
        >
          <span class="structure-section__name">{{ getSectionDisplayName(section) }}</span>
          <span class="structure-section__bars">{{ section.bars }}</span>
        </div>

        <!-- Progress indicator -->
        <div
          class="structure-progress"
          :style="{ left: `${progressPercent}%` }"
        >
          <div class="structure-progress__line"></div>
          <div class="structure-progress__glow"></div>
        </div>
      </div>
    </div>

    <!-- Section Timeline -->
    <div class="section-timeline" ref="sectionTimelineRef">
      <div class="section-track" :style="{ width: `${totalWidth}px` }">
        <div
          v-for="(section, index) in sections"
          :key="index"
          class="section-block"
          :class="{ 'section-block--active': activeSection === section }"
          :style="{
            left: `${tickToX(section.start_ticks ?? section.startTick) + 2}px`,
            width: `${Math.max(0, tickToX((section.end_ticks ?? section.endTick) - (section.start_ticks ?? section.startTick)) - 4)}px`,
            '--section-bg': getSectionColor(section.type).bg,
            '--section-glow': getSectionColor(section.type).glow,
            '--section-text': getSectionColor(section.type).text
          }"
          @click="handleSectionClick(section)"
        >
          <span class="section-block__name">{{ getSectionDisplayName(section) }}</span>
          <span class="section-block__bars">{{ section.bars }}bars</span>
        </div>

        <!-- Section Playhead -->
        <div
          v-if="currentTick && currentTick > 0"
          class="section-playhead"
          :style="{ left: `${playheadX}px` }"
        />
      </div>
    </div>

    <!-- Main Content -->
    <div class="roll-container">
      <!-- Piano Keys -->
      <div class="piano-keys">
        <div
          v-for="key in pianoKeys"
          :key="key.note"
          class="piano-key"
          :class="{ 'piano-key--black': key.isBlack }"
          :style="{ height: `${noteHeight}%` }"
        >
          <span class="piano-key__label">{{ key.name }}</span>
        </div>
      </div>

      <!-- Notes Area -->
      <div class="notes-area" ref="notesAreaRef" @scroll="handleScroll">
        <div class="notes-canvas" :style="{ width: `${totalWidth}px` }">
          <!-- Grid Lines -->
          <div
            v-for="line in gridLines"
            :key="line.bar"
            class="grid-line"
            :style="{ left: `${line.x}px` }"
          >
            <span class="grid-line__label">{{ line.bar }}</span>
          </div>

          <!-- Horizontal Grid Lines -->
          <div
            v-for="key in pianoKeys"
            :key="`h-${key.note}`"
            class="h-grid-line"
            :class="{ 'h-grid-line--black': key.isBlack }"
            :style="{
              top: `${noteToY(key.note)}%`,
              height: `${noteHeight}%`
            }"
          />

          <!-- Notes -->
          <template v-for="(track, trackIndex) in visibleTracks" :key="track.name">
            <div
              v-for="(note, noteIndex) in track.notes"
              :key="`${track.name}-${noteIndex}`"
              class="note-bar"
              :style="{
                left: `${tickToX(note.start)}px`,
                top: `${noteToY(note.note)}%`,
                width: `${Math.max(2, durationToWidth(note.duration))}px`,
                height: `${noteHeight}%`,
                '--note-color': getTrackColor(trackIndex),
                opacity: 0.6 + (note.velocity / 127) * 0.4
              }"
            />
          </template>

          <!-- Playhead -->
          <div
            v-if="currentTick && currentTick > 0"
            class="playhead"
            :style="{ left: `${playheadX}px` }"
          >
            <div class="playhead-glow"></div>
            <div class="playhead-line"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Track Legend -->
    <div class="track-legend">
      <div class="legend-tracks">
        <div
          v-for="(track, index) in visibleTracks"
          :key="track.name"
          class="legend-item"
        >
          <span
            class="legend-color"
            :style="{ backgroundColor: getTrackColor(index) }"
          />
          <span class="legend-name">{{ track.name }}</span>
        </div>
      </div>

      <!-- Instrument Toggle for Chord Track (right side) -->
      <div class="instrument-toggle">
        <span class="instrument-toggle__label">Chord</span>
        <div class="instrument-toggle__buttons">
          <button
            class="instrument-btn"
            :class="{ 'instrument-btn--active': chordsInstrument === 'piano' }"
            @click="chordsInstrument = 'piano'; emit('instrumentChange', { track: 'Chord', instrument: 'piano' })"
            title="Piano"
          >
            <span class="instrument-icon">🎹</span>
          </button>
          <button
            class="instrument-btn"
            :class="{ 'instrument-btn--active': chordsInstrument === 'guitar' }"
            @click="chordsInstrument = 'guitar'; emit('instrumentChange', { track: 'Chord', instrument: 'guitar' })"
            title="Electric Guitar"
          >
            <span class="instrument-icon">🎸</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap');

.piano-roll {
  --accent: #8B5CF6;
  --accent-glow: rgba(139, 92, 246, 0.4);
  --surface: rgba(12, 12, 18, 0.95);
  --surface-elevated: rgba(22, 22, 32, 0.9);
  --border: rgba(139, 92, 246, 0.12);
  --text-primary: #FAFAFA;
  --text-secondary: rgba(250, 250, 250, 0.5);

  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  font-family: 'Outfit', sans-serif;

  /* Subtle noise texture */
  background-image:
    url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-blend-mode: overlay;
}

/* Transport Bar - Unified Module Design */
.transport-bar {
  display: flex;
  align-items: stretch;
  gap: 1px;
  padding: 0;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid var(--border);
}

.transport-module {
  display: flex;
  align-items: center;
  padding: 0.625rem 0.875rem;
  background: linear-gradient(180deg, rgba(28, 28, 38, 0.95) 0%, rgba(22, 22, 30, 0.98) 100%);
  position: relative;
}

.transport-module::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  bottom: 20%;
  width: 1px;
  background: rgba(255, 255, 255, 0.06);
}

.transport-module:last-child::after {
  display: none;
}

/* Module Cell - Unified display container */
.module-cell {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.4),
    0 1px 0 rgba(255, 255, 255, 0.03);
}

.cell-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-right: 0.25rem;
}

.cell-value {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.cell-value--primary {
  font-size: 1.125rem;
  color: #7DD3FC;
  text-shadow: 0 0 12px rgba(125, 211, 252, 0.5);
}

.cell-value--secondary {
  font-size: 0.875rem;
  color: rgba(125, 211, 252, 0.6);
}

.cell-dot {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--accent);
  margin: 0 1px;
}

/* Time Display */
.time-display {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.time-current {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
  font-weight: 600;
  color: #4ADE80;
  letter-spacing: 0.02em;
  text-shadow: 0 0 10px rgba(74, 222, 128, 0.4);
}

.time-divider {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.25);
  margin: 0 2px;
}

.time-total {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.02em;
}

/* Section Indicator */
.transport-module--section {
  flex: 1;
  justify-content: center;
  min-width: 100px;
}

.section-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.875rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.section-indicator::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--section-color, var(--accent));
  box-shadow: 0 0 8px var(--section-color, var(--accent));
}

.section-indicator--idle {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.06);
}

.section-indicator--idle::before {
  background: rgba(255, 255, 255, 0.2);
  box-shadow: none;
}

.section-dot {
  width: 6px;
  height: 6px;
  background: var(--section-color, var(--accent));
  border-radius: 50%;
  animation: section-pulse 1.2s ease-in-out infinite;
  box-shadow: 0 0 6px var(--section-color, var(--accent));
}

@keyframes section-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.section-label {
  font-family: 'Outfit', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--section-text, var(--text-primary));
  letter-spacing: 0.01em;
}

/* Info Module */
.transport-module--info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 36px;
}

.info-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.info-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.info-value--tempo {
  color: #FBBF24;
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
}

/* Structure Overview */
.structure-overview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(180deg, rgba(18, 18, 26, 0.95) 0%, rgba(15, 15, 22, 0.9) 100%);
  border-bottom: 1px solid var(--border);
}

.structure-label {
  display: flex;
  flex-direction: column;
  min-width: 60px;
  flex-shrink: 0;
}

.structure-label__text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.structure-label__bars {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.3);
}

.structure-bar {
  flex: 1;
  display: flex;
  height: 32px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.structure-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  background: var(--section-bg);
  border-right: 1px solid rgba(0, 0, 0, 0.3);
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  min-width: 0;
  cursor: pointer;
}

.structure-section:hover {
  filter: brightness(1.2);
}

.structure-section:last-child {
  border-right: none;
}

.structure-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
  pointer-events: none;
}

.structure-section::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--section-color);
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.structure-section--active {
  background: linear-gradient(135deg, var(--section-bg), rgba(255, 255, 255, 0.08));
  box-shadow: inset 0 0 20px -8px var(--section-color);
}

.structure-section--active::after {
  opacity: 1;
  box-shadow: 0 0 8px var(--section-color);
}

.structure-section__name {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--section-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1.2;
}

.structure-section__bars {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  color: rgba(255, 255, 255, 0.3);
  line-height: 1;
}

.structure-progress {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: none;
  transition: left 0.05s linear;
}

.structure-progress__line {
  position: absolute;
  inset: 0;
  background: #EC4899;
  border-radius: 1px;
}

.structure-progress__glow {
  position: absolute;
  top: -2px;
  bottom: -2px;
  left: -6px;
  right: -6px;
  background: radial-gradient(ellipse at center, rgba(236, 72, 153, 0.6) 0%, transparent 70%);
  animation: progress-glow 1s ease-in-out infinite;
}

@keyframes progress-glow {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

/* Section Timeline */
.section-timeline {
  height: 44px;
  background: rgba(15, 15, 22, 0.8);
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  margin-left: 48px;
}

.section-timeline::-webkit-scrollbar {
  display: none;
}

.section-track {
  position: relative;
  height: 100%;
  padding: 6px 0;
}


.section-block {
  position: absolute;
  top: 6px;
  bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: var(--section-bg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  cursor: pointer;
}

.section-block:hover {
  filter: brightness(1.2);
  border-color: rgba(255, 255, 255, 0.15);
}

.section-block::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--section-glow);
  opacity: 0.6;
}

.section-block--active {
  background: linear-gradient(135deg, var(--section-bg), rgba(255, 255, 255, 0.05));
  border-color: var(--section-glow);
  box-shadow:
    0 0 20px -4px var(--section-glow),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transform: scale(1.02);
  z-index: 10;
}

.section-block--active::before {
  opacity: 1;
  box-shadow: 0 0 12px var(--section-glow);
}

.section-block__name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--section-text);
  white-space: nowrap;
}

.section-block__bars {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
}

.section-playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #EC4899;
  z-index: 20;
  pointer-events: none;
}

.section-playhead::before {
  content: '';
  position: absolute;
  top: 0;
  left: -4px;
  width: 10px;
  height: 10px;
  background: #EC4899;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(236, 72, 153, 0.8);
}

/* Roll Container */
.roll-container {
  position: relative;
  flex: 1;
  min-height: 180px;
}

.piano-keys {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 48px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(90deg, rgba(25, 25, 35, 0.98) 0%, rgba(20, 20, 28, 0.95) 100%);
  border-right: 1px solid var(--border);
  z-index: 10;
}

.piano-key {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  background: linear-gradient(90deg, #e8e8e8, #d4d4d4);
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
  transition: background 0.1s ease;
}

.piano-key--black {
  background: linear-gradient(90deg, #2a2a2a, #1f1f1f);
  border-bottom-color: rgba(0, 0, 0, 0.3);
}

.piano-key--black .piano-key__label {
  color: rgba(255, 255, 255, 0.6);
}

.piano-key__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.45);
}

.notes-area {
  position: absolute;
  top: 0;
  left: 48px;
  right: 0;
  bottom: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.notes-area::-webkit-scrollbar {
  height: 6px;
}

.notes-area::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.notes-area::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.notes-area::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.notes-canvas {
  position: relative;
  height: 100%;
  min-width: 400px;
}

.grid-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(139, 92, 246, 0.1);
  pointer-events: none;
}

.grid-line:nth-child(4n+1) {
  background: rgba(139, 92, 246, 0.2);
}

.grid-line__label {
  position: absolute;
  top: 4px;
  left: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.3);
}

.h-grid-line {
  position: absolute;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.015);
  border-bottom: 1px solid rgba(255, 255, 255, 0.025);
  pointer-events: none;
}

.h-grid-line--black {
  background: rgba(0, 0, 0, 0.08);
}

.note-bar {
  position: absolute;
  background: var(--note-color);
  border-radius: 3px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.note-bar:hover {
  transform: scaleY(1.1);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 0 12px var(--note-color);
  z-index: 5;
}

.playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  z-index: 20;
  pointer-events: none;
}

.playhead-glow {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -8px;
  width: 18px;
  background: linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.3), transparent);
  animation: playhead-pulse 0.5s ease-in-out infinite;
}

@keyframes playhead-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.playhead-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: linear-gradient(180deg, #EC4899 0%, #F472B6 50%, #EC4899 100%);
  box-shadow:
    0 0 8px rgba(236, 72, 153, 0.8),
    0 0 16px rgba(236, 72, 153, 0.4);
}

/* Track Legend */
.track-legend {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.9) 0%, rgba(25, 25, 35, 0.95) 100%);
  border-top: 1px solid var(--border);
}

.legend-tracks {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.legend-color {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  box-shadow: 0 0 6px currentColor;
}

.legend-name {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
}

/* Instrument Toggle - Hardware-inspired switch */
.instrument-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.instrument-toggle__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.instrument-toggle__buttons {
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.4),
    0 1px 0 rgba(255, 255, 255, 0.03);
  overflow: hidden;
}

.instrument-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 26px;
  background: transparent;
  border: none;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.instrument-btn + .instrument-btn {
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}

.instrument-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.instrument-btn--active {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%);
  box-shadow:
    0 0 8px rgba(236, 72, 153, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.instrument-btn--active::before {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 2px;
  background: #EC4899;
  border-radius: 1px;
  box-shadow: 0 0 6px rgba(236, 72, 153, 0.8);
}

.instrument-icon {
  font-size: 0.85rem;
  line-height: 1;
  filter: grayscale(0.3);
  transition: filter 0.2s ease;
}

.instrument-btn--active .instrument-icon {
  filter: grayscale(0) drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
}

.instrument-btn:not(.instrument-btn--active) .instrument-icon {
  opacity: 0.5;
}

/* Responsive */
@media (max-width: 640px) {
  .transport-bar {
    flex-wrap: wrap;
  }

  .transport-module {
    padding: 0.5rem 0.625rem;
  }

  .transport-module--position,
  .transport-module--time {
    flex: 1;
    min-width: 0;
  }

  .transport-module--section {
    order: 4;
    flex-basis: 100%;
    justify-content: center;
  }

  .transport-module--info {
    order: 3;
    gap: 0.5rem;
  }

  .module-cell {
    padding: 0.25rem 0.5rem;
    gap: 0.25rem;
  }

  .cell-label {
    font-size: 0.45rem;
  }

  .cell-value--primary {
    font-size: 0.95rem;
  }

  .cell-value--secondary {
    font-size: 0.75rem;
  }

  .time-current {
    font-size: 0.85rem;
  }

  .time-total {
    font-size: 0.7rem;
  }

  .section-indicator {
    padding: 0.25rem 0.625rem;
  }

  .section-label {
    font-size: 0.7rem;
  }

  .info-item {
    min-width: 28px;
  }

  .info-label {
    font-size: 0.4rem;
  }

  .info-value {
    font-size: 0.7rem;
  }

  .structure-overview {
    padding: 0.5rem 0.75rem;
    gap: 0.5rem;
  }

  .structure-label {
    min-width: 50px;
  }

  .structure-label__text {
    font-size: 0.5rem;
  }

  .structure-label__bars {
    font-size: 0.6rem;
  }

  .structure-bar {
    height: 28px;
  }

  .structure-section__name {
    font-size: 0.55rem;
  }

  .structure-section__bars {
    display: none;
  }

  .section-timeline {
    height: 36px;
    margin-left: 36px;
  }

  .section-block {
    padding: 0 8px;
  }

  .section-block__name {
    font-size: 0.65rem;
  }

  .section-block__bars {
    display: none;
  }

  .roll-container {
    min-height: 140px;
  }

  .piano-keys {
    width: 36px;
  }

  .notes-area {
    left: 36px;
  }

  .piano-key__label {
    font-size: 0.45rem;
  }

  .track-legend {
    gap: 0.625rem;
    padding: 0.5rem 0.75rem;
  }

  .legend-name {
    font-size: 0.6rem;
  }
}
</style>
