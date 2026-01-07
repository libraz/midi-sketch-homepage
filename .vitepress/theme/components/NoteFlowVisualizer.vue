<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'

interface Note {
  pitch: number
  velocity: number
  start_ticks: number
  duration_ticks: number
}

interface Track {
  name: string
  channel: number
  notes: Note[]
}

interface EventData {
  bpm: number
  division: number
  duration_ticks: number
  tracks: Track[]
}

interface ProcessedNote {
  pitch: number
  velocity: number
  startTick: number
  duration: number
  trackName: string
}

const props = defineProps<{
  events: EventData | null
  currentTick: number
  isPlaying: boolean
  bpm: number
}>()

// Canvas refs
const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let animationFrame: number | null = null
let dpr = 1

// State
const showNotes = ref(false)
let cachedNotes: ProcessedNote[] = []
let pitchMin = 48
let pitchMax = 84
let playheadOpacity = 0
let idleOpacity = 1

// Track colors - cyberpunk neon palette
const TRACK_COLORS: Record<string, { main: string; glow: string }> = {
  Vocal: { main: '#E879F9', glow: 'rgba(232, 121, 249, 0.6)' },
  Melody: { main: '#E879F9', glow: 'rgba(232, 121, 249, 0.6)' },
  Chord: { main: '#A855F7', glow: 'rgba(168, 85, 247, 0.6)' },
  Chords: { main: '#A855F7', glow: 'rgba(168, 85, 247, 0.6)' },
  Bass: { main: '#7C3AED', glow: 'rgba(124, 58, 237, 0.6)' },
  Drums: { main: '#C084FC', glow: 'rgba(192, 132, 252, 0.6)' },
  Arpeggio: { main: '#818CF8', glow: 'rgba(129, 140, 248, 0.6)' },
  Aux: { main: '#F472B6', glow: 'rgba(244, 114, 182, 0.6)' },
}
const DEFAULT_COLOR = { main: '#A855F7', glow: 'rgba(168, 85, 247, 0.6)' }

// Layout constants
const PIANO_WIDTH = 45
const HEADER_HEIGHT = 0
const PIXELS_PER_TICK = 0.08
const VISIBLE_WINDOW = 4800 // ticks visible ahead of playhead

// Watch play state
watch(() => props.isPlaying, (playing) => {
  if (playing) {
    setTimeout(() => { showNotes.value = true }, 200)
  } else {
    showNotes.value = false
  }
})

// Process notes when events change
watch(() => props.events, (events) => {
  if (!events?.tracks) {
    cachedNotes = []
    return
  }

  const notes: ProcessedNote[] = []
  let min = 127, max = 0

  for (const track of events.tracks) {
    if (!track.notes || track.name === 'Drums') continue
    for (const note of track.notes) {
      notes.push({
        pitch: note.pitch,
        velocity: note.velocity,
        startTick: note.start_ticks,
        duration: note.duration_ticks,
        trackName: track.name
      })
      if (note.pitch < min) min = note.pitch
      if (note.pitch > max) max = note.pitch
    }
  }

  cachedNotes = notes
  pitchMin = Math.max(0, min - 2)
  pitchMax = Math.min(127, max + 2)
}, { immediate: true })

// Setup canvas
function setupCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
  }
}

// Draw background with subtle grid
function drawBackground(w: number, h: number) {
  if (!ctx) return

  // Deep dark background
  ctx.fillStyle = '#08080c'
  ctx.fillRect(0, 0, w, h)

  // Subtle gradient overlay
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, 'rgba(139, 92, 246, 0.03)')
  grad.addColorStop(0.5, 'transparent')
  grad.addColorStop(1, 'rgba(124, 58, 237, 0.02)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

// Draw piano keys on left side
function drawPianoKeys(w: number, h: number) {
  if (!ctx) return

  const pitchRange = pitchMax - pitchMin + 1
  const noteHeight = h / pitchRange

  // Piano background
  ctx.fillStyle = '#0c0c14'
  ctx.fillRect(0, 0, PIANO_WIDTH, h)

  // Draw each key
  for (let i = 0; i <= pitchRange; i++) {
    const pitch = pitchMax - i
    const y = i * noteHeight
    const noteName = pitch % 12
    const isBlack = [1, 3, 6, 8, 10].includes(noteName)

    if (isBlack) {
      ctx.fillStyle = '#1a1a24'
      ctx.fillRect(0, y, PIANO_WIDTH - 8, noteHeight)
    } else {
      ctx.fillStyle = '#252532'
      ctx.fillRect(0, y, PIANO_WIDTH, noteHeight)
    }

    // Key border
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(0, y + noteHeight)
    ctx.lineTo(PIANO_WIDTH, y + noteHeight)
    ctx.stroke()

    // Note label for C notes
    if (noteName === 0) {
      const octave = Math.floor(pitch / 12) - 1
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.font = '9px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`C${octave}`, PIANO_WIDTH / 2, y + noteHeight / 2 + 3)
    }
  }

  // Right edge glow
  const edgeGrad = ctx.createLinearGradient(PIANO_WIDTH - 2, 0, PIANO_WIDTH + 4, 0)
  edgeGrad.addColorStop(0, 'rgba(139, 92, 246, 0.3)')
  edgeGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = edgeGrad
  ctx.fillRect(PIANO_WIDTH - 2, 0, 6, h)
}

// Draw horizontal grid lines
function drawGrid(w: number, h: number, scrollX: number) {
  if (!ctx) return

  const pitchRange = pitchMax - pitchMin + 1
  const noteHeight = h / pitchRange
  const rollX = PIANO_WIDTH

  // Horizontal pitch lines
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)'
  ctx.lineWidth = 0.5

  for (let i = 0; i <= pitchRange; i++) {
    const y = i * noteHeight
    ctx.beginPath()
    ctx.moveTo(rollX, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  // Vertical beat lines
  const ppq = props.events?.division || 480
  const ticksPerBeat = ppq
  const ticksPerBar = ppq * 4
  const startTick = Math.floor(scrollX / PIXELS_PER_TICK / ticksPerBeat) * ticksPerBeat

  for (let tick = startTick; tick < startTick + VISIBLE_WINDOW * 2; tick += ticksPerBeat) {
    const x = rollX + (tick * PIXELS_PER_TICK) - scrollX
    if (x < rollX || x > w) continue

    const isBar = tick % ticksPerBar === 0
    ctx.strokeStyle = isBar ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.06)'
    ctx.lineWidth = isBar ? 1 : 0.5
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
}

// Draw notes
function drawNotes(w: number, h: number, scrollX: number, currentTick: number) {
  if (!ctx || !showNotes.value) return

  const pitchRange = pitchMax - pitchMin + 1
  const noteHeight = h / pitchRange
  const rollX = PIANO_WIDTH

  // Calculate visible tick range
  const visibleStartTick = scrollX / PIXELS_PER_TICK
  const visibleEndTick = visibleStartTick + (w - rollX) / PIXELS_PER_TICK

  for (const note of cachedNotes) {
    const noteEnd = note.startTick + note.duration

    // Skip if not visible
    if (noteEnd < visibleStartTick || note.startTick > visibleEndTick) continue

    const x = rollX + (note.startTick * PIXELS_PER_TICK) - scrollX
    const noteWidth = Math.max(2, note.duration * PIXELS_PER_TICK)
    const y = (pitchMax - note.pitch) * noteHeight
    const barHeight = noteHeight - 1

    // Skip if off screen
    if (x + noteWidth < rollX || x > w) continue

    const colors = TRACK_COLORS[note.trackName] || DEFAULT_COLOR
    const isActive = currentTick >= note.startTick && currentTick < noteEnd
    const isPast = currentTick > noteEnd

    ctx.save()

    // Clip to roll area
    ctx.beginPath()
    ctx.rect(rollX, 0, w - rollX, h)
    ctx.clip()

    // Glow effect for active notes
    if (isActive) {
      ctx.shadowColor = colors.glow
      ctx.shadowBlur = 15
    }

    // Note body
    const alpha = isPast ? 0.4 : (isActive ? 1 : 0.75)
    ctx.globalAlpha = alpha

    // Gradient fill
    const noteGrad = ctx.createLinearGradient(x, y, x, y + barHeight)
    noteGrad.addColorStop(0, lightenColor(colors.main, isActive ? 30 : 15))
    noteGrad.addColorStop(0.5, colors.main)
    noteGrad.addColorStop(1, darkenColor(colors.main, 20))
    ctx.fillStyle = noteGrad

    // Rounded rectangle
    const radius = Math.min(3, barHeight / 2)
    ctx.beginPath()
    ctx.roundRect(x, y, noteWidth, barHeight, radius)
    ctx.fill()

    // Top highlight
    if (!isPast) {
      ctx.globalAlpha = 0.4
      const highlightGrad = ctx.createLinearGradient(x, y, x, y + barHeight * 0.4)
      highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)')
      highlightGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = highlightGrad
      ctx.beginPath()
      ctx.roundRect(x, y, noteWidth, barHeight * 0.4, [radius, radius, 0, 0])
      ctx.fill()
    }

    ctx.restore()
  }
}

// Draw playhead with fade support
function drawPlayhead(w: number, h: number, scrollX: number, currentTick: number) {
  if (!ctx || currentTick <= 0 || playheadOpacity <= 0) return

  const rollX = PIANO_WIDTH
  const x = rollX + (currentTick * PIXELS_PER_TICK) - scrollX

  if (x < rollX || x > w) return

  ctx.save()
  ctx.globalAlpha = playheadOpacity
  ctx.beginPath()
  ctx.rect(rollX, 0, w - rollX, h)
  ctx.clip()

  // Playhead glow
  const glowGrad = ctx.createLinearGradient(x - 20, 0, x + 20, 0)
  glowGrad.addColorStop(0, 'transparent')
  glowGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.15)')
  glowGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = glowGrad
  ctx.fillRect(x - 20, 0, 40, h)

  // Playhead line
  ctx.strokeStyle = '#EC4899'
  ctx.lineWidth = 2
  ctx.shadowColor = 'rgba(236, 72, 153, 0.8)'
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.moveTo(x, 0)
  ctx.lineTo(x, h)
  ctx.stroke()

  // Top marker
  ctx.fillStyle = '#EC4899'
  ctx.beginPath()
  ctx.moveTo(x - 6, 0)
  ctx.lineTo(x + 6, 0)
  ctx.lineTo(x, 8)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

// Draw idle state - original style with animated bars
function drawIdle(w: number, h: number, time: number) {
  if (!ctx || idleOpacity <= 0) return

  ctx.save()
  ctx.globalAlpha = idleOpacity

  const centerX = w / 2
  const centerY = h * 0.45

  // Ambient glow
  const glowGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150)
  glowGrad.addColorStop(0, 'rgba(168, 85, 247, 0.12)')
  glowGrad.addColorStop(0.5, 'rgba(124, 58, 237, 0.06)')
  glowGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = glowGrad
  ctx.fillRect(0, 0, w, h)

  // Animated equalizer bars
  const barCount = 7
  const barWidth = 14
  const barGap = 10
  const totalWidth = barCount * barWidth + (barCount - 1) * barGap
  const startX = centerX - totalWidth / 2
  const baseY = centerY + 40

  for (let i = 0; i < barCount; i++) {
    const phase = (time / 800) + (i * 0.6)
    const heightPercent = 25 + Math.sin(phase) * 20 + Math.sin(phase * 1.5) * 15
    const height = heightPercent * 0.9

    const x = startX + i * (barWidth + barGap)
    const y = baseY - height

    // Purple spectrum gradient
    const hue = 270 + (i / barCount) * 20
    const lightness = 60 + (i / barCount) * 15
    const color = `hsl(${hue}, 75%, ${lightness}%)`

    // Bar glow
    ctx.shadowColor = `hsla(${hue}, 75%, ${lightness}%, 0.6)`
    ctx.shadowBlur = 18

    // Bar gradient (top bright, bottom transparent)
    const barGrad = ctx.createLinearGradient(0, y, 0, baseY)
    barGrad.addColorStop(0, color)
    barGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = barGrad

    // Draw rounded bar
    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, height, [7, 7, 2, 2])
    ctx.fill()
  }

  // READY label
  ctx.shadowBlur = 15
  ctx.shadowColor = 'rgba(168, 85, 247, 0.6)'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '700 14px "JetBrains Mono", monospace'
  ctx.textAlign = 'center'
  ctx.fillText('R E A D Y', centerX, baseY + 35)

  ctx.shadowBlur = 0
  ctx.restore()
}

// Draw CRT scanline effect
function drawScanlines(w: number, h: number) {
  if (!ctx) return

  ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1)
  }
}

// Color utilities
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.slice(1), 16)
  const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent))
  const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(2.55 * percent))
  const b = Math.min(255, (num & 0x0000FF) + Math.round(2.55 * percent))
  return `rgb(${r}, ${g}, ${b})`
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.slice(1), 16)
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent))
  const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(2.55 * percent))
  const b = Math.max(0, (num & 0x0000FF) - Math.round(2.55 * percent))
  return `rgb(${r}, ${g}, ${b})`
}

// Main render loop
function render() {
  if (!ctx || !canvasRef.value) {
    animationFrame = requestAnimationFrame(render)
    return
  }

  const canvas = canvasRef.value
  const w = canvas.width / dpr
  const h = canvas.height / dpr
  const time = Date.now()
  const currentTick = props.currentTick || 0

  // Animate opacity transitions (different speeds)
  const playheadFadeSpeed = 0.05  // Slower for playhead/notes
  const idleFadeSpeed = 0.12      // Faster for READY bars
  const targetPlayheadOpacity = showNotes.value ? 1 : 0
  const targetIdleOpacity = showNotes.value ? 0 : 1
  playheadOpacity += (targetPlayheadOpacity - playheadOpacity) * playheadFadeSpeed
  idleOpacity += (targetIdleOpacity - idleOpacity) * idleFadeSpeed

  // Clamp small values to 0 for performance
  if (playheadOpacity < 0.01) playheadOpacity = 0
  if (idleOpacity < 0.01) idleOpacity = 0
  if (playheadOpacity > 0.99) playheadOpacity = 1
  if (idleOpacity > 0.99) idleOpacity = 1

  // Calculate scroll position (keep playhead at 30% from left)
  const rollWidth = w - PIANO_WIDTH
  const scrollX = Math.max(0, (currentTick * PIXELS_PER_TICK) - rollWidth * 0.3)

  // Clear and draw layers
  drawBackground(w, h)
  drawGrid(w, h, scrollX)
  drawNotes(w, h, scrollX, currentTick)
  drawPlayhead(w, h, scrollX, currentTick)
  drawPianoKeys(w, h)
  drawIdle(w, h, time)
  drawScanlines(w, h)

  animationFrame = requestAnimationFrame(render)
}

onMounted(() => {
  setupCanvas()
  window.addEventListener('resize', setupCanvas)
  animationFrame = requestAnimationFrame(render)
})

onUnmounted(() => {
  if (animationFrame) cancelAnimationFrame(animationFrame)
  window.removeEventListener('resize', setupCanvas)
})
</script>

<template>
  <div class="piano-roll-viz">
    <canvas ref="canvasRef" class="piano-roll-viz__canvas"></canvas>
    <div class="piano-roll-viz__vignette"></div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

.piano-roll-viz {
  position: relative;
  width: 100%;
  height: 240px;
  border-radius: 12px;
  overflow: hidden;
  background: #08080c;
  box-shadow:
    0 0 0 1px rgba(139, 92, 246, 0.2),
    0 4px 20px rgba(0, 0, 0, 0.5),
    inset 0 0 60px rgba(139, 92, 246, 0.03);
}

.piano-roll-viz__canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.piano-roll-viz__vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse 80% 80% at 50% 50%,
    transparent 0%,
    rgba(8, 8, 12, 0.4) 100%
  );
}

@media (max-width: 640px) {
  .piano-roll-viz {
    height: 180px;
  }
}
</style>
