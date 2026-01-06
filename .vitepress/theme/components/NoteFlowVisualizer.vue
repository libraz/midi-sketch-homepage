<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

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
  id: string
  pitch: number
  velocity: number
  startTick: number
  duration: number
  trackIndex: number
  trackName: string
}

const props = defineProps<{
  events: EventData | null
  currentTick: number
  isPlaying: boolean
  bpm: number
}>()

// Transition state for smooth idle -> playing
const isTransitioning = ref(false)
const showNotes = ref(false)

// Watch for play state changes
watch(() => props.isPlaying, (playing) => {
  if (playing) {
    // Start transition animation
    isTransitioning.value = true
    // Delay showing notes for buildup effect
    setTimeout(() => {
      showNotes.value = true
    }, 400)
    // End transition
    setTimeout(() => {
      isTransitioning.value = false
    }, 600)
  } else {
    showNotes.value = false
    isTransitioning.value = false
  }
})

// Purple-themed track colors
const TRACK_COLORS: Record<string, { main: string; glow: string }> = {
  Melody: { main: '#E879F9', glow: 'rgba(232, 121, 249, 0.8)' },  // Fuchsia
  Vocal: { main: '#E879F9', glow: 'rgba(232, 121, 249, 0.8)' },   // Fuchsia
  Chords: { main: '#A855F7', glow: 'rgba(168, 85, 247, 0.8)' },   // Purple
  Chord: { main: '#A855F7', glow: 'rgba(168, 85, 247, 0.8)' },    // Purple
  Bass: { main: '#7C3AED', glow: 'rgba(124, 58, 237, 0.8)' },     // Violet
  Drums: { main: '#C084FC', glow: 'rgba(192, 132, 252, 0.8)' },   // Light Purple
  Arpeggio: { main: '#818CF8', glow: 'rgba(129, 140, 248, 0.8)' }, // Indigo
}

const DEFAULT_COLOR = { main: '#A855F7', glow: 'rgba(168, 85, 247, 0.8)' }

// Timing constants
const LOOK_BEHIND = 240    // Show recently passed notes briefly
const LOOK_AHEAD = 2880    // 6 beats ahead for dramatic runway

// Process all notes
const allNotes = computed<ProcessedNote[]>(() => {
  if (!props.events?.tracks) return []

  const notes: ProcessedNote[] = []
  props.events.tracks.forEach((track, trackIndex) => {
    if (!track.notes) return
    track.notes.forEach((note, noteIndex) => {
      notes.push({
        id: `${track.name}-${noteIndex}`,
        pitch: note.pitch,
        velocity: note.velocity,
        startTick: note.start_ticks,
        duration: note.duration_ticks,
        trackIndex,
        trackName: track.name
      })
    })
  })
  return notes.sort((a, b) => a.startTick - b.startTick)
})

// Dynamic pitch range from actual data
const pitchRange = computed(() => {
  if (!allNotes.value.length) return { min: 48, max: 84 }

  let min = 127, max = 0
  for (const note of allNotes.value) {
    if (note.pitch < min) min = note.pitch
    if (note.pitch > max) max = note.pitch
  }

  // Add padding
  return {
    min: Math.max(0, min - 4),
    max: Math.min(127, max + 4)
  }
})

// Visible notes
const visibleNotes = computed(() => {
  const tick = props.currentTick || 0
  return allNotes.value.filter(note => {
    const noteEnd = note.startTick + note.duration
    return note.startTick <= tick + LOOK_AHEAD && noteEnd >= tick - LOOK_BEHIND
  }).slice(0, 150) // Limit for performance
})

// Calculate note style - true 3D positioning
function getNoteStyle(note: ProcessedNote) {
  const tick = props.currentTick || 0
  const tickDiff = note.startTick - tick

  // Z depth: 0 = at playhead, 1 = far horizon
  const zDepth = Math.max(-0.15, Math.min(1, tickDiff / LOOK_AHEAD))

  // X position: spread across lanes based on pitch
  const range = pitchRange.value
  const pitchNorm = (note.pitch - range.min) / (range.max - range.min)
  // Create 5 virtual lanes for cleaner spread
  const lane = Math.floor(pitchNorm * 5)
  const laneOffset = (pitchNorm * 5) % 1
  const xPercent = 10 + (lane * 18) + (laneOffset * 12) // 10-90% range

  // Y position: follows the runway perspective (higher = further away)
  // Maps zDepth 0->1 to bottom 5%->85% of the runway
  const yPercent = 5 + zDepth * 80

  // Get color
  const colorSet = TRACK_COLORS[note.trackName] || DEFAULT_COLOR

  // Scale by depth - more dramatic
  const scale = Math.max(0.15, 1 - zDepth * 0.85)

  // Opacity fades with distance
  const opacity = zDepth < 0 ? 0.4 : Math.max(0.25, 1 - zDepth * 0.75)

  // Height: taller bars for longer notes and higher velocity
  const baseHeight = 24 + (note.velocity / 127) * 30
  const durationBonus = Math.min(20, (note.duration / 480) * 10)
  const height = baseHeight + durationBonus

  return {
    '--x': `${xPercent}%`,
    '--y': `${yPercent}%`,
    '--scale': scale,
    '--opacity': opacity,
    '--height': `${height}px`,
    '--color': colorSet.main,
    '--glow': colorSet.glow,
    '--blur': `${Math.max(0, zDepth * 1.5)}px`,
    '--past': zDepth < 0 ? 1 : 0
  }
}

// Idle animation
const idlePhase = ref(0)
let animationFrame: number | null = null

function updateIdleAnimation() {
  idlePhase.value = (Date.now() / 800) % (Math.PI * 4)
  animationFrame = requestAnimationFrame(updateIdleAnimation)
}

onMounted(() => {
  animationFrame = requestAnimationFrame(updateIdleAnimation)
})

onUnmounted(() => {
  if (animationFrame) cancelAnimationFrame(animationFrame)
})

// Generate idle bars with wave pattern
const idleBars = computed(() => {
  const bars = []
  const count = 7
  for (let i = 0; i < count; i++) {
    const phase = idlePhase.value + (i * 0.6)
    const height = 25 + Math.sin(phase) * 20 + Math.sin(phase * 1.5) * 15
    // Purple spectrum: 270 (violet) to 290 (fuchsia)
    const hue = 270 + (i / count) * 20
    const lightness = 60 + (i / count) * 15
    bars.push({
      id: i,
      height: `${height}%`,
      color: `hsl(${hue}, 75%, ${lightness}%)`,
      glow: `hsla(${hue}, 75%, ${lightness}%, 0.6)`,
      delay: i * 0.08
    })
  }
  return bars
})
</script>

<template>
  <div class="visualizer" :class="{
    'visualizer--playing': isPlaying,
    'visualizer--transitioning': isTransitioning
  }">
    <!-- Ambient background effects -->
    <div class="visualizer__ambient">
      <div class="ambient__gradient"></div>
      <div class="ambient__stars"></div>
      <div class="ambient__scanlines"></div>
    </div>

    <!-- 3D Stage -->
    <div class="visualizer__stage">
      <!-- Runway floor with notes inside (same perspective) -->
      <div class="stage__runway">
        <div class="runway__grid"></div>
        <div class="runway__horizon"></div>

        <!-- Notes inside runway for correct perspective -->
        <template v-if="showNotes && currentTick > 0">
          <div
            v-for="note in visibleNotes"
            :key="note.id"
            class="note"
            :style="getNoteStyle(note)"
          >
            <div class="note__bar"></div>
          </div>
        </template>

        <!-- Hit zone inside runway -->
        <div class="runway__hitzone"></div>
      </div>

      <!-- Idle state with morph animation -->
      <div class="stage__idle" :class="{ 'stage__idle--morphing': isTransitioning || isPlaying }">
        <div class="idle__bars">
          <div
            v-for="bar in idleBars"
            :key="bar.id"
            class="idle__bar"
            :style="{
              '--height': bar.height,
              '--color': bar.color,
              '--glow': bar.glow,
              '--delay': `${bar.delay}s`,
              '--index': bar.id
            }"
          ></div>
        </div>
        <div class="idle__label">READY</div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&display=swap');

.visualizer {
  --primary: #A855F7;
  --secondary: #E879F9;
  --accent: #C084FC;
  --surface: #0a0a12;

  position: relative;
  width: 100%;
  height: 240px;
  background: var(--surface);
  border-radius: 16px;
  overflow: hidden;
  font-family: 'Orbitron', sans-serif;
}

/* Ambient background */
.visualizer__ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ambient__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(168, 85, 247, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 50% 100%, rgba(124, 58, 237, 0.12) 0%, transparent 50%),
    linear-gradient(180deg, #0a0a12 0%, #110a1a 100%);
}

.ambient__stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 60% 20%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 80% 60%, rgba(255,255,255,0.3) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 70% 40%, rgba(168, 85, 247, 0.6) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 30% 80%, rgba(232, 121, 249, 0.5) 0%, transparent 100%);
}

.ambient__scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
  opacity: 0.5;
}

/* 3D Stage */
.visualizer__stage {
  position: absolute;
  inset: 0;
  perspective: 500px;
  perspective-origin: 50% 65%;
}

/* Runway floor */
.stage__runway {
  position: absolute;
  left: 5%;
  right: 5%;
  bottom: 0;
  height: 75%;
  transform: rotateX(75deg);
  transform-origin: bottom center;
  transform-style: preserve-3d;
}

.runway__grid {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      90deg,
      transparent 0%,
      transparent calc(20% - 1px),
      rgba(168, 85, 247, 0.3) calc(20% - 1px),
      rgba(168, 85, 247, 0.3) 20%
    ),
    repeating-linear-gradient(
      0deg,
      rgba(168, 85, 247, 0.15) 0px,
      rgba(168, 85, 247, 0.15) 1px,
      transparent 1px,
      transparent 40px
    );
  mask-image: linear-gradient(to top, black 0%, black 40%, transparent 100%);
  animation: gridScroll 2s linear infinite;
}

.visualizer--playing .runway__grid {
  animation-duration: 0.8s;
}

@keyframes gridScroll {
  from { background-position-y: 0; }
  to { background-position-y: 40px; }
}

.runway__horizon {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 20%,
    rgba(255, 255, 255, 0.8) 50%,
    rgba(255, 255, 255, 0.3) 80%,
    transparent 100%
  );
  filter: blur(0.5px);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

/* Hit zone inside runway */
.runway__hitzone {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 5%;
  height: 3px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(232, 121, 249, 0.5) 10%,
    rgba(232, 121, 249, 1) 50%,
    rgba(232, 121, 249, 0.5) 90%,
    transparent 100%
  );
  box-shadow:
    0 0 15px rgba(232, 121, 249, 0.8),
    0 0 40px rgba(168, 85, 247, 0.4);
  z-index: 5;
}

/* Individual note - inside runway, follows perspective */
.note {
  position: absolute;
  left: var(--x);
  bottom: var(--y);
  transform: translateX(-50%) scale(var(--scale));
  opacity: var(--opacity);
  filter: blur(var(--blur));
  transition: none;
  will-change: transform, opacity, bottom;
  z-index: 10;
}

.note__bar {
  width: 10px;
  height: var(--height);
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--color), white 30%) 0%,
    var(--color) 40%,
    color-mix(in srgb, var(--color), black 20%) 100%
  );
  border-radius: 5px;
  box-shadow:
    0 0 12px var(--glow),
    0 0 25px var(--glow),
    inset 0 2px 4px rgba(255, 255, 255, 0.3);
  position: relative;
}

.note__bar::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 2px;
  right: 2px;
  height: 25%;
  background: linear-gradient(180deg,
    rgba(255, 255, 255, 0.5) 0%,
    transparent 100%
  );
  border-radius: 3px;
}

/* Idle state - positioned above runway */
.stage__idle {
  position: absolute;
  left: 0;
  right: 0;
  top: 15%;
  bottom: 35%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  z-index: 20;
  transition: opacity 0.5s ease;
}

.idle__bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 10px;
  height: 80px;
  position: relative;
}

.idle__bar {
  width: 14px;
  height: var(--height);
  background: linear-gradient(180deg, var(--color) 0%, transparent 100%);
  border-radius: 7px 7px 2px 2px;
  box-shadow: 0 0 18px var(--glow);
  animation: barPulse 1.5s ease-in-out infinite;
  animation-delay: var(--delay);
  transition:
    transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
    width 0.5s ease,
    height 0.5s ease,
    opacity 0.4s ease,
    border-radius 0.4s ease;
  transition-delay: calc(var(--index) * 0.03s);
}

@keyframes barPulse {
  0%, 100% { transform: scaleY(1); filter: brightness(1); }
  50% { transform: scaleY(0.75); filter: brightness(0.85); }
}

.idle__label {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.4em;
  color: rgba(255, 255, 255, 0.5);
  text-shadow: 0 0 15px rgba(168, 85, 247, 0.6);
  margin-top: 0.5rem;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

/* Morphing state - bars transform to runway */
.stage__idle--morphing {
  pointer-events: none;
}

.stage__idle--morphing .idle__bars {
  gap: 0;
}

.stage__idle--morphing .idle__bar {
  animation: none;
  width: 60px;
  height: 4px !important;
  border-radius: 2px;
  opacity: 0;
  transform:
    translateY(120px)
    translateX(calc((var(--index) - 3) * 40px))
    scaleX(2);
  box-shadow: 0 0 25px var(--glow);
}

.stage__idle--morphing .idle__label {
  opacity: 0;
  transform: translateY(-20px) scale(0.8);
}

/* Transitioning state - speed up grid */
.visualizer--transitioning .runway__grid {
  animation-duration: 0.4s;
}

.visualizer--transitioning .runway__hitzone {
  animation: hitzoneFlash 0.5s ease-out;
}

@keyframes hitzoneFlash {
  0% {
    box-shadow:
      0 0 15px rgba(232, 121, 249, 0.8),
      0 0 40px rgba(168, 85, 247, 0.4);
  }
  50% {
    box-shadow:
      0 0 40px rgba(232, 121, 249, 1),
      0 0 80px rgba(232, 121, 249, 0.8),
      0 0 120px rgba(168, 85, 247, 0.5);
  }
  100% {
    box-shadow:
      0 0 15px rgba(232, 121, 249, 0.8),
      0 0 40px rgba(168, 85, 247, 0.4);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .visualizer {
    height: 200px;
  }

  .visualizer__stage {
    perspective: 400px;
  }

  .stage__idle {
    top: 12%;
    bottom: 40%;
  }

  .idle__bars {
    gap: 6px;
    height: 60px;
  }

  .idle__bar {
    width: 10px;
  }

  .idle__label {
    font-size: 0.75rem;
  }

  .stage__idle--morphing .idle__bar {
    width: 40px;
    transform:
      translateY(100px)
      translateX(calc((var(--index) - 3) * 30px))
      scaleX(1.5);
  }

  .note__bar {
    width: 8px;
  }

  .hud__bpm {
    padding: 6px 10px;
  }

  .bpm__value {
    font-size: 1rem;
  }
}
</style>
