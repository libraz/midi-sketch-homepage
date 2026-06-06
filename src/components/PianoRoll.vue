<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useData } from 'vitepress'
import { useI18n } from '@/composables/useI18n'
import { parseChordProgression, generateChordTimings, getChordName, type ChordInfo, type ChordTiming } from '@/utils/chordUtils'

const { t } = useI18n()
const { isDark } = useData()

/**
 * Theme-aware colors for the canvas piano roll. The canvas cannot read CSS
 * custom properties, so the demo theme tokens are mirrored here as flat values.
 * The dark branch reproduces the legacy hardcoded colors verbatim so dark
 * rendering stays pixel-identical; the light branch is the light-theme
 * equivalent tuned for contrast on a light background.
 */
const canvasColors = computed(() => {
  const dark = isDark.value
  // Neutral ink: white on dark, dark ink on light.
  const inkChannels = dark ? '255, 255, 255' : '24, 20, 35'
  // Purple accent for bar/beat lines.
  const purpleChannels = dark ? '139, 92, 246' : '124, 58, 237'
  return {
    /** Full-canvas background fill. */
    background: dark ? 'rgba(12, 12, 18, 0.95)' : 'rgba(252, 252, 255, 0.95)',
    /** Base shading for black-key rows. */
    blackKeyRow: dark ? 'rgba(0, 0, 0, 0.15)' : 'rgba(24, 20, 35, 0.05)',
    /** Base shading for white-key rows. */
    whiteKeyRow: dark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(24, 20, 35, 0.01)',
    /** Horizontal per-semitone grid lines. */
    horizontalGridLine: `rgba(${inkChannels}, 0.03)`,
    /** Emphasized vertical line at each bar group (every 4 bars). */
    barGroupLine: `rgba(${purpleChannels}, 0.25)`,
    /** Faint vertical bar lines. */
    barLine: `rgba(${purpleChannels}, 0.1)`,
    /** Bar-number labels. */
    barNumber: `rgba(${inkChannels}, ${dark ? 0.3 : 0.5})`,
    /** Stroke outlining notes on the top (Vocal/Aux) tracks. */
    noteHighlight: `rgba(${inkChannels}, ${dark ? 0.2 : 0.35})`,
    /** Pink playhead line and glow. */
    playhead: dark ? '#EC4899' : '#DB2777',
    /** Pink channels for the playhead gradient glow. */
    playheadGlowChannels: dark ? '236, 72, 153' : '219, 39, 119',
  }
})

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
  trackMuteChange: [payload: { track: string; muted: boolean }]
}>()

// Track colors
const TRACK_COLOR_MAP: Record<string, string> = {
  'Vocal': '#8B5CF6',
  'Aux': '#FBBF24',
  'Chord': '#EC4899',
  'Bass': '#10B981',
  'Motif': '#F97316',
  'Arpeggio': '#3B82F6',
  'SE': '#F472B6',
}

interface SectionColorSet {
  bg: string
  glow: string
  text: string
}

// Section bg tints and glow accents read on both themes; only the label text
// flips, since the dark-tuned pastels are unreadable on a light background.
const SECTION_COLORS_DARK: Record<string, SectionColorSet> = {
  Intro: { bg: 'rgba(59, 130, 246, 0.15)', glow: '#3B82F6', text: '#93C5FD' },
  A: { bg: 'rgba(139, 92, 246, 0.15)', glow: '#8B5CF6', text: '#C4B5FD' },
  B: { bg: 'rgba(236, 72, 153, 0.15)', glow: '#EC4899', text: '#F9A8D4' },
  Chorus: { bg: 'rgba(245, 158, 11, 0.15)', glow: '#F59E0B', text: '#FCD34D' },
  Bridge: { bg: 'rgba(16, 185, 129, 0.15)', glow: '#10B981', text: '#6EE7B7' },
  Outro: { bg: 'rgba(99, 102, 241, 0.15)', glow: '#6366F1', text: '#A5B4FC' },
  Break: { bg: 'rgba(168, 85, 247, 0.15)', glow: '#A855F7', text: '#D8B4FE' },
}

const SECTION_COLORS_LIGHT: Record<string, SectionColorSet> = {
  Intro: { bg: 'rgba(59, 130, 246, 0.15)', glow: '#3B82F6', text: '#1D4ED8' },
  A: { bg: 'rgba(139, 92, 246, 0.15)', glow: '#8B5CF6', text: '#6D28D9' },
  B: { bg: 'rgba(236, 72, 153, 0.15)', glow: '#EC4899', text: '#BE185D' },
  Chorus: { bg: 'rgba(245, 158, 11, 0.15)', glow: '#F59E0B', text: '#B45309' },
  Bridge: { bg: 'rgba(16, 185, 129, 0.15)', glow: '#10B981', text: '#047857' },
  Outro: { bg: 'rgba(99, 102, 241, 0.15)', glow: '#6366F1', text: '#4338CA' },
  Break: { bg: 'rgba(168, 85, 247, 0.15)', glow: '#A855F7', text: '#7E22CE' },
}

const sectionColors = computed(() => (isDark.value ? SECTION_COLORS_DARK : SECTION_COLORS_LIGHT))

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

// Track mute state (SE is muted by default)
const mutedTracks = ref<Record<string, boolean>>({
  SE: true
})

function isTrackMuted(trackName: string): boolean {
  return mutedTracks.value[trackName] ?? false
}

function toggleTrackMute(trackName: string) {
  const newMuted = !isTrackMuted(trackName)
  mutedTracks.value[trackName] = newMuted
  emit('trackMuteChange', { track: trackName, muted: newMuted })
}

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

/**
 * Piano key rows for the left gutter, top (max pitch) to bottom (min pitch).
 * Key rows shrink to fit the fixed-height container, so when they get shorter
 * than the label text, per-semitone labels overlap into an unreadable smear.
 * Below that threshold only octave labels (C3, C4, ...) are shown, as in DAWs.
 */
const pianoKeyRows = computed(() => {
  const { min, max } = noteRange.value
  const rowHeight = canvasHeight.value / (max - min + 1)
  const showAllLabels = rowHeight >= 10
  const rows = []
  for (let pitch = max; pitch >= min; pitch--) {
    const name = NOTE_NAMES[pitch % 12]
    const octave = Math.floor(pitch / 12) - 1
    rows.push({
      pitch,
      isBlack: name.includes('#') || name.includes('b'),
      isOctaveStart: pitch % 12 === 0,
      label: showAllLabels ? `${name}${octave}` : (pitch % 12 === 0 ? `C${octave}` : null),
    })
  }
  return rows
})


function getTrackColor(trackName: string): string {
  return TRACK_COLOR_MAP[trackName] || '#8B5CF6'
}

function getSectionColor(type: string): SectionColorSet {
  return sectionColors.value[type] || sectionColors.value['A']
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
  const colors = canvasColors.value

  // Clear
  ctx.clearRect(0, 0, width * dpr.value, height * dpr.value)
  ctx.save()
  ctx.scale(dpr.value, dpr.value)

  // Background
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, width, height)

  // Draw horizontal grid lines (pitch lanes)
  const noteH = getNoteHeight(height)
  for (let note = noteRange.value.min; note <= noteRange.value.max; note++) {
    const y = noteToY(note, height)
    const noteName = NOTE_NAMES[note % 12]
    const isBlack = noteName.includes('#') || noteName.includes('b')

    ctx.fillStyle = isBlack ? colors.blackKeyRow : colors.whiteKeyRow
    ctx.fillRect(0, y, width, noteH)

    ctx.strokeStyle = colors.horizontalGridLine
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

    ctx.strokeStyle = bar % 4 === 0 ? colors.barGroupLine : colors.barLine
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()

    // Bar numbers
    ctx.fillStyle = colors.barNumber
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
        ctx.strokeStyle = colors.noteHighlight
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }
  }
  ctx.globalAlpha = 1

  // Draw playhead
  if (props.currentTick && props.currentTick > 0) {
    const playheadX = Math.round(tickToX(props.currentTick) - scrollLeft.value)

    if (playheadX >= 0 && playheadX <= width) {
      // Glow
      const gradient = ctx.createLinearGradient(playheadX - 10, 0, playheadX + 10, 0)
      gradient.addColorStop(0, 'transparent')
      gradient.addColorStop(0.5, `rgba(${colors.playheadGlowChannels}, 0.3)`)
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.fillRect(playheadX - 10, 0, 20, height)

      // Line
      ctx.strokeStyle = colors.playhead
      ctx.lineWidth = 2
      ctx.shadowColor = colors.playhead
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

// Redraw canvas when the appearance (light/dark) toggles
watch(canvasColors, () => {
  if (!props.isPlaying) draw()
})

// Lifecycle
onMounted(() => {
  setupCanvas()
  window.addEventListener('resize', setupCanvas)
  // If mounted mid-playback (e.g. remounted while audio is running), the
  // isPlaying watcher never fires — start the animation loop explicitly.
  if (props.isPlaying) startAnimation()
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
          v-for="row in pianoKeyRows"
          :key="row.pitch"
          class="piano-key"
          :class="{
            'piano-key--black': row.isBlack,
            'piano-key--octave': row.isOctaveStart,
          }"
          :style="{ height: `${100 / pianoKeyRows.length}%` }"
        >
          <span v-if="row.label" class="piano-key__label">{{ row.label }}</span>
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

    <!-- Track Mixer -->
    <div class="track-mixer">
      <div class="mixer-tracks">
        <button
          v-for="track in visibleTracks"
          :key="track.name"
          class="mixer-track"
          :class="{ 'mixer-track--muted': isTrackMuted(track.name) }"
          :style="{ '--track-color': getTrackColor(track.name) }"
          @click="toggleTrackMute(track.name)"
        >
          <span class="mixer-track__indicator"></span>
          <span class="mixer-track__name">{{ track.name }}</span>
          <span class="mixer-track__status">{{ isTrackMuted(track.name) ? 'M' : '' }}</span>
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>

.piano-roll {
  --accent: var(--studio-purple);
  --accent-glow: rgba(var(--studio-purple-rgb), 0.4);
  --surface: rgba(var(--studio-panel-deep-rgb), 0.95);
  --surface-elevated: rgba(var(--studio-panel-rgb), 0.9);
  --border: rgba(var(--studio-purple-rgb), 0.12);
  --text-primary: var(--studio-text-primary);
  --text-secondary: rgba(var(--studio-ink-rgb), 0.5);

  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  font-family: var(--font-body);
}

/* Transport Bar */
.transport-bar {
  display: flex;
  align-items: stretch;
  gap: 1px;
  background: var(--studio-shadow-strong);
  border-bottom: 1px solid var(--border);
}

.transport-module {
  display: flex;
  align-items: center;
  padding: 0.625rem 0.875rem;
  background: linear-gradient(180deg, rgba(var(--studio-panel-raised-rgb), 0.95) 0%, rgba(var(--studio-panel-rgb), 0.98) 100%);
  position: relative;
}

.transport-module::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  bottom: 20%;
  width: 1px;
  background: rgba(var(--studio-ink-rgb), 0.06);
}

.transport-module:last-child::after { display: none; }

.module-cell {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background: var(--studio-shadow-mid);
  border: 1px solid rgba(var(--studio-ink-rgb), 0.04);
  border-radius: 6px;
}

.cell-label {
  font-family: var(--font-mono);
  font-size: 0.55rem;
  font-weight: 600;
  color: rgba(var(--studio-ink-rgb), 0.3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-right: 0.25rem;
}

.cell-value {
  font-family: var(--font-mono);
  font-weight: 700;
}

.cell-value--primary {
  font-size: 1.125rem;
  color: var(--studio-blue);
  text-shadow: 0 0 12px rgba(var(--studio-blue-rgb), 0.5);
}

.cell-value--secondary {
  font-size: 0.875rem;
  color: rgba(var(--studio-blue-rgb), 0.6);
}

.cell-dot {
  font-family: var(--font-mono);
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
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 600;
  color: var(--studio-green);
  text-shadow: 0 0 10px rgba(var(--studio-green-rgb), 0.4);
}

.time-divider {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: rgba(var(--studio-ink-rgb), 0.25);
}

.time-total {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: rgba(var(--studio-ink-rgb), 0.4);
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
  background: linear-gradient(135deg, rgba(var(--studio-purple-rgb), 0.15) 0%, rgba(var(--studio-purple-rgb), 0.08) 100%);
  border: 1px solid rgba(var(--studio-purple-rgb), 0.2);
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
  background: rgba(var(--studio-ink-rgb), 0.03);
  border-color: rgba(var(--studio-ink-rgb), 0.06);
}

.section-indicator--idle::before {
  background: rgba(var(--studio-ink-rgb), 0.2);
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
  font-family: var(--font-mono);
  font-size: 0.5rem;
  font-weight: 600;
  color: rgba(var(--studio-ink-rgb), 0.3);
  text-transform: uppercase;
}

.info-value {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(var(--studio-ink-rgb), 0.7);
}

.info-value--tempo {
  color: var(--studio-amber);
  text-shadow: 0 0 8px rgba(var(--studio-amber-rgb), 0.3);
}

/* Structure Overview */
.structure-overview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(180deg, rgba(var(--studio-panel-rgb), 0.95) 0%, rgba(var(--studio-panel-deep-rgb), 0.9) 100%);
  border-bottom: 1px solid var(--border);
}

.structure-label {
  display: flex;
  flex-direction: column;
  min-width: 60px;
  flex-shrink: 0;
}

.structure-label__text {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.structure-label__bars {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: rgba(var(--studio-ink-rgb), 0.3);
}

.structure-bar {
  flex: 1;
  display: flex;
  height: 32px;
  background: var(--studio-shadow-mid);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(var(--studio-ink-rgb), 0.05);
}

.structure-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  background: var(--section-bg);
  border-right: 1px solid var(--studio-shadow-mid);
  cursor: pointer;
  transition: filter 0.2s;
}

.structure-section:hover { filter: brightness(1.2); }
.structure-section:last-child { border-right: none; }

.structure-section--active {
  background: linear-gradient(135deg, var(--section-bg), rgba(var(--studio-ink-rgb), 0.08));
}

.dark .structure-section--active {
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
  font-family: var(--font-mono);
  font-size: 0.55rem;
  color: rgba(var(--studio-ink-rgb), 0.3);
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
  background: var(--studio-pink);
  border-radius: 1px;
  box-shadow: 0 0 8px rgba(var(--studio-pink-rgb), 0.6);
}

/* Chord Timeline */
.chord-timeline {
  height: 32px;
  background: linear-gradient(180deg, rgba(var(--studio-panel-rgb), 0.95) 0%, rgba(var(--studio-panel-deep-rgb), 0.9) 100%);
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
  background: linear-gradient(135deg, rgba(var(--studio-purple-rgb), 0.2) 0%, rgba(var(--studio-purple-rgb), 0.1) 100%);
  border: 1px solid rgba(var(--studio-purple-rgb), 0.25);
  border-radius: 4px;
  cursor: default;
  transition: all 0.15s ease;
  overflow: hidden;
}

.chord-block--active {
  background: linear-gradient(135deg, rgba(var(--studio-purple-rgb), 0.35) 0%, rgba(var(--studio-purple-rgb), 0.2) 100%);
  border-color: rgba(var(--studio-purple-rgb), 0.5);
  box-shadow: 0 0 12px -2px rgba(var(--studio-purple-rgb), 0.4);
}

.chord-block__name {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--studio-purple-soft);
  text-shadow: 0 0 8px rgba(var(--studio-purple-soft-rgb), 0.3);
}

/* Keep the legacy light-purple chord label in dark mode. */
.dark .chord-block__name {
  color: #C4B5FD;
  text-shadow: 0 0 8px rgba(196, 181, 253, 0.3);
}

.chord-block--active .chord-block__name {
  color: var(--studio-purple);
  text-shadow: 0 0 10px rgba(var(--studio-purple-rgb), 0.5);
}

.dark .chord-block--active .chord-block__name {
  color: #E9D5FF;
  text-shadow: 0 0 10px rgba(233, 213, 255, 0.5);
}

.chord-block__degree {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(var(--studio-ink-rgb), 0.35);
}

.chord-playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--studio-pink);
  z-index: 20;
  pointer-events: none;
  box-shadow: 0 0 6px rgba(var(--studio-pink-rgb), 0.6);
  transform: translateX(-50%);
}

/* Section Timeline */
.section-timeline {
  height: 44px;
  background: rgba(var(--studio-panel-deep-rgb), 0.8);
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
  border: 1px solid rgba(var(--studio-ink-rgb), 0.08);
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
  background: linear-gradient(135deg, var(--section-bg), rgba(var(--studio-ink-rgb), 0.05));
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
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: rgba(var(--studio-ink-rgb), 0.35);
}

.section-playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--studio-pink);
  z-index: 20;
  pointer-events: none;
  transform: translateX(-50%);
}

.section-playhead::before {
  content: '';
  position: absolute;
  top: 0;
  left: -4px;
  width: 10px;
  height: 10px;
  background: var(--studio-pink);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(var(--studio-pink-rgb), 0.8);
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
  background: linear-gradient(90deg, rgba(var(--studio-panel-raised-rgb), 0.98) 0%, rgba(var(--studio-panel-rgb), 0.95) 100%);
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

/* Octave boundary: emphasize the line below each C row */
.piano-key--octave {
  border-bottom-color: rgba(0, 0, 0, 0.35);
}

.piano-key__label {
  font-family: var(--font-mono);
  font-size: 0.55rem;
  font-weight: 500;
  line-height: 1;
  color: rgba(0, 0, 0, 0.45);
  /* Rows can be shorter than the label text; let sparse octave
     labels render at full size instead of being clipped. */
  white-space: nowrap;
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
  background: var(--studio-shadow-soft);
}

.canvas-container::-webkit-scrollbar-thumb {
  background: rgba(var(--studio-ink-rgb), 0.2);
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

/* Track Mixer */
.track-mixer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(180deg, rgba(var(--studio-panel-rgb), 0.95) 0%, rgba(var(--studio-panel-raised-rgb), 0.98) 100%);
  border-top: 1px solid var(--border);
}

.mixer-tracks {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  flex: 1;
}

.mixer-track {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.5rem;
  background: var(--studio-shadow-mid);
  border: 1px solid rgba(var(--studio-ink-rgb), 0.06);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.mixer-track:hover {
  background: var(--studio-shadow-strong);
  border-color: rgba(var(--studio-ink-rgb), 0.1);
}

.mixer-track__indicator {
  width: 8px;
  height: 8px;
  background: var(--track-color);
  border-radius: 2px;
  box-shadow: 0 0 6px var(--track-color);
  transition: all 0.15s ease;
}

.mixer-track--muted .mixer-track__indicator {
  background: rgba(var(--studio-ink-rgb), 0.15);
  box-shadow: none;
}

.mixer-track__name {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 600;
  color: rgba(var(--studio-ink-rgb), 0.8);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  transition: color 0.15s ease;
}

.mixer-track--muted .mixer-track__name {
  color: rgba(var(--studio-ink-rgb), 0.3);
}

.mixer-track__status {
  font-family: var(--font-mono);
  font-size: 0.55rem;
  font-weight: 700;
  color: var(--studio-red);
  min-width: 0.7rem;
  text-align: center;
}

.mixer-track--muted {
  background: rgba(var(--studio-red-rgb), 0.08);
  border-color: rgba(var(--studio-red-rgb), 0.2);
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

  /* Track Mixer Mobile */
  .track-mixer {
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.375rem 0.5rem;
  }

  .mixer-tracks {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    width: 100%;
  }

  .mixer-track {
    padding: 0.25rem 0.375rem;
  }

  .mixer-track__indicator {
    width: 6px;
    height: 6px;
  }

  .mixer-track__name {
    font-size: 0.55rem;
  }

  .mixer-track__status {
    font-size: 0.5rem;
    min-width: 0.6rem;
  }

}
</style>
