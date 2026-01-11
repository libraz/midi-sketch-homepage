<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from '../composables/useI18n'
import { parseChordProgression, generateChordTimings, getChordName, type ChordInfo, type ChordTiming } from '../utils/chordUtils'

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

interface EventData {
  bpm: number
  ppq: number
  tracks: {
    name: string
    notes: Note[]
  }[]
  sections?: Section[]
}

function getNoteValue(note: Note, key: 'pitch' | 'start' | 'duration'): number {
  if (key === 'pitch') return note.pitch ?? note.note ?? 60
  if (key === 'start') return note.start_ticks ?? note.start ?? 0
  if (key === 'duration') return note.duration_ticks ?? note.duration ?? 480
  return 0
}

const props = defineProps<{
  events: EventData | null
  currentTick?: number
  isPlaying?: boolean
  chordProgression?: string  // e.g., "I - V - vi - IV"
  musicKey?: number          // 0-11 (0=C)
}>()

const emit = defineEmits<{
  seek: [tick: number]
  instrumentChange: [payload: { track: string; instrument: 'piano' | 'guitar' }]
}>()

// Track colors
const TRACK_COLOR_MAP: Record<string, string> = {
  'Vocal': '#8B5CF6',
  'Aux': '#FBBF24',
  'Chord': '#EC4899',
  'Bass': '#10B981',
  'Motif': '#F97316',
  'Arpeggio': '#3B82F6',
}

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

// Canvas refs
const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const sectionTimelineRef = ref<HTMLElement | null>(null)
const chordTimelineRef = ref<HTMLElement | null>(null)

// State
const scrollLeft = ref(0)
const canvasWidth = ref(800)
const canvasHeight = ref(180)
const dpr = ref(1)

// Instrument selection
const chordsInstrument = ref<'piano' | 'guitar'>('piano')

// Computed values
const noteRange = computed(() => {
  if (!props.events?.tracks) return { min: 48, max: 84 }
  let min = 127, max = 0
  for (const track of props.events.tracks) {
    if (track.name === 'Drums') continue
    const notes = track.notes || []
    for (const note of notes) {
      const pitch = getNoteValue(note, 'pitch')
      if (pitch < min) min = pitch
      if (pitch > max) max = pitch
    }
  }
  if (min > max) return { min: 48, max: 84 }
  return { min: Math.max(0, min - 2), max: Math.min(127, max + 2) }
})

const timeRange = computed(() => {
  if (!props.events?.tracks) return { max: 1920 }
  let max = 0
  for (const track of props.events.tracks) {
    const notes = track.notes || []
    for (const note of notes) {
      const end = getNoteValue(note, 'start') + getNoteValue(note, 'duration')
      if (end > max) max = end
    }
  }
  return { max: Math.min(max + 480, 1000000) }
})

const ppq = computed(() => props.events?.ppq || 480)

const totalWidth = computed(() => {
  return (timeRange.value.max / (4 * ppq.value)) * 200
})

const sections = computed(() => props.events?.sections || [])

// Parse chord progression and generate timings
const parsedChords = computed(() => {
  if (!props.chordProgression) return []
  return parseChordProgression(props.chordProgression)
})

const chordTimings = computed((): ChordTiming[] => {
  if (parsedChords.value.length === 0 || sections.value.length === 0) return []

  const sectionsWithTicks = sections.value.map(s => ({
    startTick: s.start_ticks ?? s.startTick,
    endTick: s.end_ticks ?? s.endTick,
    bars: s.bars,
    type: s.type
  }))

  return generateChordTimings({
    chords: parsedChords.value,
    sections: sectionsWithTicks,
    ppq: ppq.value,
    barsPerChord: 1
  })
})

// Get current chord at playhead position
const activeChord = computed(() => {
  if (!props.currentTick || chordTimings.value.length === 0) return null
  for (const timing of chordTimings.value) {
    if (props.currentTick >= timing.startTick && props.currentTick < timing.endTick) {
      return timing
    }
  }
  return null
})

// Conversion functions
function tickToX(tick: number): number {
  return (tick / (4 * ppq.value)) * 200
}

function xToTick(x: number): number {
  return (x / 200) * 4 * ppq.value
}

function noteToY(note: number, height: number): number {
  const range = noteRange.value.max - noteRange.value.min
  return ((noteRange.value.max - note) / range) * height
}

function getNoteHeight(height: number): number {
  const range = noteRange.value.max - noteRange.value.min
  return height / (range + 1)
}

// Current position info
const currentBar = computed(() => {
  if (!props.currentTick || !props.events) return 1
  return Math.floor(props.currentTick / (4 * ppq.value)) + 1
})

const currentBeat = computed(() => {
  if (!props.currentTick || !props.events) return 1
  const barTicks = 4 * ppq.value
  return Math.floor((props.currentTick % barTicks) / ppq.value) + 1
})

const activeSection = computed(() => {
  if (!props.currentTick || !sections.value.length) return null
  for (const section of sections.value) {
    const start = section.start_ticks ?? section.startTick
    const end = section.end_ticks ?? section.endTick
    if (props.currentTick >= start && props.currentTick < end) return section
  }
  return null
})

// Time formatting
function ticksToSeconds(ticks: number): number {
  if (!props.events) return 0
  const bpm = props.events.bpm || 120
  return ticks * (60 / bpm / ppq.value)
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const cs = Math.floor((seconds % 1) * 100)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${cs.toString().padStart(2, '0')}`
}

const currentTimeFormatted = computed(() => formatTime(ticksToSeconds(props.currentTick || 0)))
const totalTimeFormatted = computed(() => formatTime(ticksToSeconds(timeRange.value.max)))
const totalBars = computed(() => sections.value.reduce((sum, s) => sum + s.bars, 0))
const progressPercent = computed(() => {
  if (!props.currentTick || !timeRange.value.max) return 0
  return Math.min(100, (props.currentTick / timeRange.value.max) * 100)
})

// Visible tracks for legend
const visibleTracks = computed(() => {
  if (!props.events?.tracks) return []
  return props.events.tracks.filter(t => t.name !== 'Drums' && t.notes?.length > 0)
})

function getTrackColor(trackName: string): string {
  return TRACK_COLOR_MAP[trackName] || '#8B5CF6'
}

function getSectionColor(type: string) {
  return SECTION_COLORS[type] || SECTION_COLORS['A']
}

function getSectionDisplayName(section: Section): string {
  const key = `pianoRoll.sections.${section.type}`
  const translated = t(key)
  return translated === key ? section.name : translated
}

// Canvas drawing
let animationFrameId: number | null = null

// Rounded rectangle helper (polyfill for older browsers)
function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2 * r) r = w / 2
  if (h < 2 * r) r = h / 2
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function draw() {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx || !props.events) return

  const width = canvasWidth.value
  const height = canvasHeight.value

  // Clear
  ctx.clearRect(0, 0, width * dpr.value, height * dpr.value)
  ctx.save()
  ctx.scale(dpr.value, dpr.value)

  // Background
  ctx.fillStyle = 'rgba(12, 12, 18, 0.95)'
  ctx.fillRect(0, 0, width, height)

  // Draw horizontal grid lines (pitch lanes)
  const noteH = getNoteHeight(height)
  for (let note = noteRange.value.min; note <= noteRange.value.max; note++) {
    const y = noteToY(note, height)
    const noteName = NOTE_NAMES[note % 12]
    const isBlack = noteName.includes('#') || noteName.includes('b')

    ctx.fillStyle = isBlack ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.02)'
    ctx.fillRect(0, y, width, noteH)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.beginPath()
    ctx.moveTo(0, y + noteH)
    ctx.lineTo(width, y + noteH)
    ctx.stroke()
  }

  // Draw vertical grid lines (bars)
  const barTicks = 4 * ppq.value
  const startBar = Math.floor(xToTick(scrollLeft.value) / barTicks)
  const endBar = Math.ceil(xToTick(scrollLeft.value + width) / barTicks)

  for (let bar = startBar; bar <= endBar; bar++) {
    const x = tickToX(bar * barTicks) - scrollLeft.value
    if (x < 0 || x > width) continue

    ctx.strokeStyle = bar % 4 === 0 ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.1)'
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()

    // Bar numbers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.font = '10px JetBrains Mono, monospace'
    ctx.fillText(String(bar + 1), x + 4, 12)
  }

  // Draw notes
  const tracks = props.events.tracks.filter(t => t.name !== 'Drums')

  // Sort tracks so Vocal is on top
  const sortedTracks = [...tracks].sort((a, b) => {
    if (a.name === 'Vocal') return 1
    if (b.name === 'Vocal') return -1
    if (a.name === 'Aux') return 1
    if (b.name === 'Aux') return -1
    return 0
  })

  for (const track of sortedTracks) {
    const color = getTrackColor(track.name)
    const notes = track.notes || []

    for (const note of notes) {
      const pitch = getNoteValue(note, 'pitch')
      const start = getNoteValue(note, 'start')
      const duration = getNoteValue(note, 'duration')

      const x = tickToX(start) - scrollLeft.value
      const noteWidth = tickToX(duration)

      // Skip if not visible
      if (x + noteWidth < 0 || x > width) continue

      const y = noteToY(pitch, height)
      const opacity = 0.6 + (note.velocity / 127) * 0.4

      // Draw note with rounded corners
      ctx.fillStyle = color
      ctx.globalAlpha = opacity
      drawRoundRect(ctx, x, y + 1, Math.max(2, noteWidth - 1), noteH - 2, 2)
      ctx.fill()

      // Highlight for top tracks
      if (track.name === 'Vocal' || track.name === 'Aux') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }
  }
  ctx.globalAlpha = 1

  // Draw playhead
  if (props.currentTick && props.currentTick > 0) {
    const playheadX = tickToX(props.currentTick) - scrollLeft.value

    if (playheadX >= 0 && playheadX <= width) {
      // Glow
      const gradient = ctx.createLinearGradient(playheadX - 10, 0, playheadX + 10, 0)
      gradient.addColorStop(0, 'transparent')
      gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.3)')
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.fillRect(playheadX - 10, 0, 20, height)

      // Line
      ctx.strokeStyle = '#EC4899'
      ctx.lineWidth = 2
      ctx.shadowColor = '#EC4899'
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, height)
      ctx.stroke()
      ctx.shadowBlur = 0
    }
  }

  ctx.restore()
}

function startAnimation() {
  draw()
  if (props.isPlaying) {
    animationFrameId = requestAnimationFrame(startAnimation)
  }
}

function stopAnimation() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// Handle scroll
function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  scrollLeft.value = target.scrollLeft
  if (!props.isPlaying) draw()
}

// Handle canvas click for seeking
function handleCanvasClick(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left + scrollLeft.value
  const tick = xToTick(x)
  emit('seek', Math.max(0, tick))
}

// Section click
function handleSectionClick(section: Section) {
  const tick = section.start_ticks ?? section.startTick
  emit('seek', tick)
}

// Setup canvas size
function setupCanvas() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  dpr.value = window.devicePixelRatio || 1
  const rect = container.getBoundingClientRect()

  // Use container dimensions with fallback
  const width = rect.width || 800
  const height = rect.height || 180

  canvasWidth.value = width
  canvasHeight.value = height

  canvas.width = width * dpr.value
  canvas.height = height * dpr.value
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  draw()
}

// Auto-scroll during playback
watch(() => props.currentTick, (tick) => {
  if (!tick || tick === 0) {
    scrollLeft.value = 0
    if (containerRef.value) containerRef.value.scrollLeft = 0
    if (sectionTimelineRef.value) sectionTimelineRef.value.scrollLeft = 0
    if (chordTimelineRef.value) chordTimelineRef.value.scrollLeft = 0
    draw()
    return
  }

  if (!props.isPlaying) return

  const playheadPos = tickToX(tick)
  const containerWidth = canvasWidth.value

  // Scroll to keep playhead at 30% from left
  const targetScroll = playheadPos - containerWidth * 0.3
  const newScrollLeft = Math.max(0, targetScroll)

  scrollLeft.value = newScrollLeft
  if (containerRef.value) containerRef.value.scrollLeft = newScrollLeft
  if (sectionTimelineRef.value) sectionTimelineRef.value.scrollLeft = newScrollLeft
  if (chordTimelineRef.value) chordTimelineRef.value.scrollLeft = newScrollLeft
})

// Watch isPlaying for animation
watch(() => props.isPlaying, (playing) => {
  if (playing) {
    startAnimation()
  } else {
    stopAnimation()
    draw()
  }
})

// Watch events for redraw
watch(() => props.events, () => {
  nextTick(() => {
    setupCanvas()
  })
}, { deep: true })

// Watch currentTick for redraw when not playing
watch(() => props.currentTick, () => {
  if (!props.isPlaying) draw()
})

// Lifecycle
onMounted(() => {
  setupCanvas()
  window.addEventListener('resize', setupCanvas)
})

onUnmounted(() => {
  stopAnimation()
  window.removeEventListener('resize', setupCanvas)
})
</script>

<template>
  <div class="piano-roll">
    <!-- Transport Bar -->
    <div class="transport-bar">
      <div class="transport-module transport-module--position">
        <div class="module-cell">
          <span class="cell-label">BAR</span>
          <span class="cell-value cell-value--primary">{{ String(currentBar).padStart(3, '0') }}</span>
          <span class="cell-dot">.</span>
          <span class="cell-value cell-value--secondary">{{ currentBeat }}</span>
        </div>
      </div>

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

    <!-- Structure Overview -->
    <div v-if="sections.length" class="structure-overview">
      <div class="structure-label">
        <span class="structure-label__text">Structure</span>
        <span class="structure-label__bars">{{ totalBars }} bars</span>
      </div>
      <div class="structure-bar">
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
        <div class="structure-progress" :style="{ left: `${progressPercent}%` }">
          <div class="structure-progress__line"></div>
        </div>
      </div>
    </div>

    <!-- Chord Timeline -->
    <div v-if="chordTimings.length > 0" class="chord-timeline" ref="chordTimelineRef" @scroll="handleScroll">
      <div class="chord-track" :style="{ width: `${totalWidth}px` }">
        <div
          v-for="(timing, index) in chordTimings"
          :key="`chord-${index}`"
          class="chord-block"
          :class="{ 'chord-block--active': activeChord === timing }"
          :style="{
            left: `${tickToX(timing.startTick)}px`,
            width: `${Math.max(20, tickToX(timing.endTick - timing.startTick) - 2)}px`
          }"
        >
          <span class="chord-block__name">{{ getChordName(musicKey ?? 0, timing.chord) }}</span>
          <span class="chord-block__degree">{{ timing.chord.displayName }}</span>
        </div>
        <div
          v-if="currentTick && currentTick > 0"
          class="chord-playhead"
          :style="{ left: `${tickToX(currentTick)}px` }"
        />
      </div>
    </div>

    <!-- Section Timeline -->
    <div class="section-timeline" ref="sectionTimelineRef" @scroll="handleScroll">
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
        <div
          v-if="currentTick && currentTick > 0"
          class="section-playhead"
          :style="{ left: `${tickToX(currentTick)}px` }"
        />
      </div>
    </div>

    <!-- Canvas Piano Roll -->
    <div class="roll-container">
      <!-- Piano Keys -->
      <div class="piano-keys">
        <div
          v-for="note in (noteRange.max - noteRange.min + 1)"
          :key="noteRange.max - note + 1"
          class="piano-key"
          :class="{ 'piano-key--black': NOTE_NAMES[(noteRange.max - note + 1) % 12].includes('#') || NOTE_NAMES[(noteRange.max - note + 1) % 12].includes('b') }"
          :style="{ height: `${100 / (noteRange.max - noteRange.min + 1)}%` }"
        >
          <span class="piano-key__label">{{ NOTE_NAMES[(noteRange.max - note + 1) % 12] }}{{ Math.floor((noteRange.max - note + 1) / 12) - 1 }}</span>
        </div>
      </div>

      <!-- Canvas Container -->
      <div class="canvas-container" ref="containerRef" @scroll="handleScroll">
        <div class="canvas-scroll-area" :style="{ width: `${totalWidth}px` }">
          <canvas
            ref="canvasRef"
            class="notes-canvas"
            @click="handleCanvasClick"
          />
        </div>
      </div>
    </div>

    <!-- Track Legend -->
    <div class="track-legend">
      <div class="legend-tracks">
        <div v-for="track in visibleTracks" :key="track.name" class="legend-item">
          <span class="legend-color" :style="{ backgroundColor: getTrackColor(track.name) }" />
          <span class="legend-name">{{ track.name }}</span>
        </div>
      </div>

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

  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  font-family: 'Outfit', sans-serif;
}

/* Transport Bar */
.transport-bar {
  display: flex;
  align-items: stretch;
  gap: 1px;
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

.transport-module:last-child::after { display: none; }

.module-cell {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 6px;
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
}

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
  text-shadow: 0 0 10px rgba(74, 222, 128, 0.4);
}

.time-divider {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.25);
}

.time-total {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
}

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
}

@keyframes section-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.section-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--section-text, var(--text-primary));
}

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
}

.structure-label__bars {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
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
  cursor: pointer;
  transition: filter 0.2s;
}

.structure-section:hover { filter: brightness(1.2); }
.structure-section:last-child { border-right: none; }

.structure-section--active {
  background: linear-gradient(135deg, var(--section-bg), rgba(255, 255, 255, 0.08));
}

.structure-section__name {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--section-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.structure-section__bars {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  color: rgba(255, 255, 255, 0.3);
}

.structure-progress {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: none;
}

.structure-progress__line {
  position: absolute;
  inset: 0;
  background: #EC4899;
  border-radius: 1px;
  box-shadow: 0 0 8px rgba(236, 72, 153, 0.6);
}

/* Chord Timeline */
.chord-timeline {
  height: 32px;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.95) 0%, rgba(15, 15, 22, 0.9) 100%);
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  margin-left: 48px;
}

.chord-timeline::-webkit-scrollbar { display: none; }

.chord-track {
  position: relative;
  height: 100%;
  padding: 4px 0;
}

.chord-block {
  position: absolute;
  top: 4px;
  bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 4px;
  cursor: default;
  transition: all 0.15s ease;
  overflow: hidden;
}

.chord-block--active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.35) 0%, rgba(139, 92, 246, 0.2) 100%);
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 12px -2px rgba(139, 92, 246, 0.4);
}

.chord-block__name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #C4B5FD;
  text-shadow: 0 0 8px rgba(196, 181, 253, 0.3);
}

.chord-block--active .chord-block__name {
  color: #E9D5FF;
  text-shadow: 0 0 10px rgba(233, 213, 255, 0.5);
}

.chord-block__degree {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.35);
}

.chord-playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #EC4899;
  z-index: 20;
  pointer-events: none;
  box-shadow: 0 0 6px rgba(236, 72, 153, 0.6);
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

.section-timeline::-webkit-scrollbar { display: none; }

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
  cursor: pointer;
  transition: all 0.2s;
}

.section-block:hover {
  filter: brightness(1.2);
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
  box-shadow: 0 0 20px -4px var(--section-glow);
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
  height: 180px;
  display: flex;
}

.piano-keys {
  width: 48px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(90deg, rgba(25, 25, 35, 0.98) 0%, rgba(20, 20, 28, 0.95) 100%);
  border-right: 1px solid var(--border);
  flex-shrink: 0;
}

.piano-key {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  background: linear-gradient(90deg, #e8e8e8, #d4d4d4);
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
}

.piano-key--black {
  background: linear-gradient(90deg, #2a2a2a, #1f1f1f);
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

.canvas-container {
  flex: 1;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.canvas-container::-webkit-scrollbar {
  height: 6px;
}

.canvas-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.canvas-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.canvas-scroll-area {
  height: 100%;
  position: relative;
}

.notes-canvas {
  position: sticky;
  left: 0;
  top: 0;
  height: 100%;
  cursor: pointer;
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
}

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
}

.instrument-toggle__buttons {
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
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
  cursor: pointer;
  transition: all 0.2s;
}

.instrument-btn + .instrument-btn {
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}

.instrument-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.instrument-btn--active {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%);
}

.instrument-icon {
  font-size: 0.85rem;
  filter: grayscale(0.3);
}

.instrument-btn--active .instrument-icon {
  filter: grayscale(0);
}

.instrument-btn:not(.instrument-btn--active) .instrument-icon {
  opacity: 0.5;
}

/* Responsive */
@media (max-width: 640px) {
  .transport-bar { flex-wrap: wrap; }
  .transport-module { padding: 0.5rem 0.625rem; }
  .transport-module--position { flex: 0 0 auto; }
  .transport-module--time { flex: 1 1 60%; }
  .transport-module--info { order: 3; flex: 0 0 auto; gap: 0.5rem; }
  .transport-module--section { order: 4; flex: 1 1 50%; }
  .cell-value--primary { font-size: 0.95rem; }
  .time-current { font-size: 0.85rem; }
  .chord-timeline { height: 28px; margin-left: 36px; }
  .chord-block__name { font-size: 0.65rem; }
  .chord-block__degree { display: none; }
  .section-timeline { height: 36px; margin-left: 36px; }
  .roll-container { height: 140px; }
  .piano-keys { width: 36px; }
  .piano-key__label { font-size: 0.45rem; }
  .structure-overview { padding-left: 0; padding-right: 0; }
  .structure-label { display: none; }
}
</style>
