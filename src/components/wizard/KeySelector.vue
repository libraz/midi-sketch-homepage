<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as Tone from 'tone'
import { useI18n } from '@/composables/useI18n'
import { KEY_NAMES, midiToFreq } from '@/utils/midiUtils'
import { configureAudioSession } from '@/utils/webAudio'

const props = defineProps<{
  modelValue: number
  compact?: boolean
  chordProgressionName?: string
  chordProgressionChords?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const { t } = useI18n()

// Piano keyboard layout
const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11] // C, D, E, F, G, A, B
const BLACK_KEYS = [1, 3, 6, 8, 10] // C#, Eb, F#, Ab, Bb
const BLACK_KEY_POSITIONS = [0.5, 1.5, 3.5, 4.5, 5.5]

// Major scale intervals (semitones from root)
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11, 12]

// Audio state
const isPlayingScale = ref(false)
const isAudioReady = ref(false)
const isAudioLoading = ref(true)
const currentScaleNote = ref(-1) // Current note index being played (0-7)

let scaleSynth: Tone.Synth | null = null
let scaleTimeouts: number[] = []
let audioCleanupTimeouts: number[] = []
let currentPlayingKey = ref(-1)
let firstInteractionHandler: (() => void) | null = null

// Get key index for current scale note being played
const playingNoteKeyIndex = computed(() => {
  if (!isPlayingScale.value || currentScaleNote.value < 0) return -1
  const interval = MAJOR_SCALE[currentScaleNote.value]
  if (interval === 12) return props.modelValue // Octave returns to root
  return (props.modelValue + interval) % 12
})

async function initScaleSynth() {
  if (scaleSynth) return scaleSynth

  configureAudioSession()
  await Tone.start()

  scaleSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.2,
      release: 0.3
    }
  }).toDestination()

  scaleSynth.volume.value = -8
  return scaleSynth
}

async function preloadAudio() {
  if (isAudioReady.value) return

  try {
    if (!scaleSynth) {
      scaleSynth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.2,
          release: 0.3
        }
      }).toDestination()
      scaleSynth.volume.value = -8
    }

    configureAudioSession()
    // iOS Safari reports a non-standard 'interrupted' state after phone
    // calls or app switches, so resume on anything that is not running.
    if (Tone.getContext().state !== 'running') {
      await Tone.start()
    }

    // Prime the audio pipeline
    const silentGain = new Tone.Gain(0).toDestination()
    const silentOsc = new Tone.Oscillator(440).connect(silentGain)
    silentOsc.start()
    silentOsc.stop('+0.01')

    const cleanupId = setTimeout(() => {
      silentOsc.dispose()
      silentGain.dispose()
    }, 100) as unknown as number
    audioCleanupTimeouts.push(cleanupId)

    isAudioReady.value = true
    isAudioLoading.value = false
  } catch {
    isAudioLoading.value = false
  }
}

async function resumeAudioIfNeeded() {
  if (isAudioReady.value) return

  try {
    configureAudioSession()
    // iOS Safari reports a non-standard 'interrupted' state after phone
    // calls or app switches, so resume on anything that is not running.
    if (Tone.getContext().state !== 'running') {
      await Tone.start()
    }

    const silentGain = new Tone.Gain(0).toDestination()
    const silentOsc = new Tone.Oscillator(440).connect(silentGain)
    silentOsc.start()
    silentOsc.stop('+0.01')

    const cleanupId = setTimeout(() => {
      silentOsc.dispose()
      silentGain.dispose()
    }, 100) as unknown as number
    audioCleanupTimeouts.push(cleanupId)

    isAudioReady.value = true
  } catch {
    // Audio resume failed silently
  }
}

function stopCurrentScale() {
  scaleTimeouts.forEach(id => clearTimeout(id))
  scaleTimeouts = []
  isPlayingScale.value = false
  currentPlayingKey.value = -1
  currentScaleNote.value = -1
}

async function playScale(keyIndex: number) {
  stopCurrentScale()

  const synth = await initScaleSynth()
  isPlayingScale.value = true
  currentPlayingKey.value = keyIndex

  const baseNote = 60 + keyIndex // C4 + key offset

  for (let i = 0; i < MAJOR_SCALE.length; i++) {
    const timeoutId = setTimeout(() => {
      if (currentPlayingKey.value !== keyIndex) return
      currentScaleNote.value = i
      const freq = midiToFreq(baseNote + MAJOR_SCALE[i])
      synth.triggerAttackRelease(freq, '16n')
    }, i * 100)
    scaleTimeouts.push(timeoutId as unknown as number)
  }

  const resetTimeout = setTimeout(() => {
    if (currentPlayingKey.value === keyIndex) {
      stopCurrentScale()
    }
  }, MAJOR_SCALE.length * 100 + 200)
  scaleTimeouts.push(resetTimeout as unknown as number)
}

async function selectKey(key: number) {
  emit('update:modelValue', key)
  await playScale(key)
}

onMounted(() => {
  if (typeof window === 'undefined') return

  preloadAudio()

  firstInteractionHandler = () => {
    resumeAudioIfNeeded()
    if (firstInteractionHandler) {
      window.removeEventListener('click', firstInteractionHandler)
      window.removeEventListener('touchstart', firstInteractionHandler)
      window.removeEventListener('keydown', firstInteractionHandler)
      firstInteractionHandler = null
    }
  }

  window.addEventListener('click', firstInteractionHandler, { once: true })
  window.addEventListener('touchstart', firstInteractionHandler, { once: true })
  window.addEventListener('keydown', firstInteractionHandler, { once: true })
})

onUnmounted(() => {
  stopCurrentScale()

  audioCleanupTimeouts.forEach(id => clearTimeout(id))
  audioCleanupTimeouts = []

  if (firstInteractionHandler) {
    window.removeEventListener('click', firstInteractionHandler)
    window.removeEventListener('touchstart', firstInteractionHandler)
    window.removeEventListener('keydown', firstInteractionHandler)
    firstInteractionHandler = null
  }

  if (scaleSynth) {
    scaleSynth.dispose()
    scaleSynth = null
  }
})
</script>

<template>
  <div class="key-selector">
    <!-- Header: Key + Chord Progression -->
    <div class="key-header">
      <div class="key-header__main">
        <span class="key-header__key">{{ KEY_NAMES[modelValue] }}</span>
        <span class="key-header__mode">{{ t('settingsStep.key.major') }}</span>
        <Transition name="note-pop">
          <span v-if="isPlayingScale" class="key-header__note">&#9835;</span>
        </Transition>
      </div>
      <div v-if="chordProgressionChords" class="key-header__chords">
        <span class="key-header__chords-label" v-if="chordProgressionName">{{ chordProgressionName }}</span>
        <span class="key-header__chords-value">{{ chordProgressionChords }}</span>
      </div>
    </div>

    <!-- Piano Keyboard -->
    <div
      class="piano-keyboard"
      :class="{
        'piano-keyboard--compact': compact,
        'piano-keyboard--loading': isAudioLoading,
        'piano-keyboard--playing': isPlayingScale
      }"
    >
      <!-- Loading Overlay -->
      <Transition name="fade">
        <div v-if="isAudioLoading" class="piano-loading">
          <div class="piano-loading__spinner"></div>
        </div>
      </Transition>

      <!-- White Keys -->
      <div class="piano-white-keys">
        <button
          v-for="keyIndex in WHITE_KEYS"
          :key="keyIndex"
          class="piano-key piano-key--white"
          :class="{
            'piano-key--selected': modelValue === keyIndex,
            'piano-key--playing': playingNoteKeyIndex === keyIndex
          }"
          :disabled="isAudioLoading"
          @click="selectKey(keyIndex)"
        >
          <span class="piano-key__label">{{ KEY_NAMES[keyIndex] }}</span>
        </button>
      </div>

      <!-- Black Keys -->
      <div class="piano-black-keys">
        <button
          v-for="(keyIndex, i) in BLACK_KEYS"
          :key="keyIndex"
          class="piano-key piano-key--black"
          :class="{
            'piano-key--selected': modelValue === keyIndex,
            'piano-key--playing': playingNoteKeyIndex === keyIndex
          }"
          :disabled="isAudioLoading"
          :style="{ left: `calc(${BLACK_KEY_POSITIONS[i]} * (100% / 7) + (100% / 14) - 12px)` }"
          @click="selectKey(keyIndex)"
        >
          <span class="piano-key__label">{{ KEY_NAMES[keyIndex] }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.key-selector {
  --accent-color: var(--section-accent, var(--step-accent, var(--studio-purple)));
  --accent-rgb: var(--section-accent-rgb, var(--studio-purple-rgb));
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
}

/* Header */
.key-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.625rem;
  background: rgba(var(--accent-rgb), 0.08);
  border: 1px solid rgba(var(--accent-rgb), 0.15);
  border-radius: 8px 8px 0 0;
  border-bottom: none;
}

.key-header__main {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  position: relative;
}

.key-header__key {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-color);
  line-height: 1;
}

.key-header__mode {
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(var(--studio-ink-rgb), 0.6);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.key-header__note {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  color: var(--accent-color);
  animation: noteBounce 0.4s ease-in-out infinite;
}

@keyframes noteBounce {
  0%, 100% { transform: translateY(-50%) scale(1); }
  50% { transform: translateY(calc(-50% - 2px)) scale(1.1); }
}

.key-header__chords {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.25rem;
  border-top: 1px solid rgba(var(--accent-rgb), 0.1);
}

.key-header__chords-label {
  font-family: var(--font-body);
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(var(--studio-ink-rgb), 0.4);
  white-space: nowrap;
}

.key-header__chords-value {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(var(--studio-ink-rgb), 0.8);
  letter-spacing: 0.01em;
}

/* Note pop animation */
.note-pop-enter-active {
  animation: notePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.note-pop-leave-active {
  animation: notePop 0.2s ease reverse;
}
@keyframes notePop {
  0% { opacity: 0; transform: scale(0.5); }
  100% { opacity: 1; transform: scale(1); }
}

/* Piano Keyboard */
.piano-keyboard {
  position: relative;
  height: 100px;
  overflow: hidden;
  background: #1a1a1a;
  border: 2px solid #0a0a0a;
  border-radius: 0 0 4px 4px;
  padding: 0;
  transition: opacity 0.3s ease;
  flex-shrink: 0;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.8),
    0 4px 12px rgba(0, 0, 0, 0.5);
}

.piano-keyboard--compact {
  height: 80px;
}

.piano-keyboard--loading .piano-white-keys,
.piano-keyboard--loading .piano-black-keys {
  opacity: 0.4;
  pointer-events: none;
}

/* Floating Note - removed to prevent layout shifts */

/* Loading Overlay */
.piano-loading {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: rgba(15, 15, 22, 0.85);
  backdrop-filter: blur(4px);
  border-radius: 0 0 4px 4px;
}

.piano-loading__spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(var(--accent-rgb), 0.2);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.piano-white-keys {
  display: flex;
  gap: 2px;
  height: 100%;
  position: relative;
  z-index: 1;
  padding: 0 1px;
  background: #1a1a1a;
}

.piano-black-keys {
  position: absolute;
  top: 0;
  left: 1px;
  right: 1px;
  height: 60%;
  z-index: 2;
  pointer-events: none;
}

.piano-key {
  border: none;
  cursor: pointer;
  transition: all 0.08s ease;
  position: relative;
  overflow: hidden;
}

/* White Keys */
.piano-key--white {
  flex: 1;
  height: 100%;
  background: linear-gradient(180deg, #fcfcfc 0%, #f0f0f0 50%, #e0e0e0 100%);
  border-left: 1px solid #d0d0d0;
  border-right: 1px solid #c8c8c8;
  border-bottom: 1px solid #b0b0b0;
  box-shadow:
    inset 0 -2px 0 #d8d8d8,
    inset 0 -4px 3px rgba(0, 0, 0, 0.05),
    0 2px 3px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 4px;
  border-radius: 0 0 3px 3px;
}

.piano-key--white:first-child { border-left: none; }
.piano-key--white:last-child { border-right: none; }

.piano-key--white:hover {
  background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 50%, #e8e8e8 100%);
  box-shadow:
    inset 0 -2px 0 #e0e0e0,
    0 0 12px rgba(var(--accent-rgb), 0.2),
    0 2px 3px rgba(0, 0, 0, 0.15);
}

.piano-key--white:active {
  background: linear-gradient(180deg, #f0f0f0 0%, #e5e5e5 50%, #d8d8d8 100%);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(1px);
}

.piano-key--white.piano-key--selected {
  background: linear-gradient(180deg, #d8b4fe 0%, #a855f7 50%, #7e22ce 100%);
  border-color: #7e22ce;
  box-shadow:
    inset 0 -2px 0 #a855f7,
    0 0 16px rgba(var(--accent-rgb), 0.5),
    0 2px 3px rgba(0, 0, 0, 0.2);
}

.piano-key--white.piano-key--selected .piano-key__label {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.piano-key--white.piano-key--playing {
  background: linear-gradient(180deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%);
  box-shadow:
    inset 0 -2px 0 #fcd34d,
    inset 0 0 8px rgba(251, 191, 36, 0.5),
    0 2px 3px rgba(0, 0, 0, 0.2);
}

.piano-key--white.piano-key--playing .piano-key__label {
  color: #78350f;
}

/* Black Keys */
.piano-key--black {
  position: absolute;
  width: 20px;
  height: 100%;
  background: linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 40%, #0a0a0a 100%);
  border: none;
  border-left: 1px solid #2a2a2a;
  border-right: 1px solid #1a1a1a;
  box-shadow:
    inset 0 -1px 0 #2a2a2a,
    inset 1px 0 0 rgba(255, 255, 255, 0.05),
    0 3px 5px rgba(0, 0, 0, 0.6);
  pointer-events: auto;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 3px;
  border-radius: 0 0 3px 3px;
}

.piano-key--black:hover {
  background: linear-gradient(180deg, #454545 0%, #252525 40%, #0f0f0f 100%);
  box-shadow:
    inset 0 -1px 0 #353535,
    0 0 10px rgba(var(--accent-rgb), 0.2),
    0 3px 5px rgba(0, 0, 0, 0.6);
}

.piano-key--black:active {
  background: linear-gradient(180deg, #2a2a2a 0%, #0f0f0f 60%, #0a0a0a 100%);
  box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.6);
}

.piano-key--black.piano-key--selected {
  background: linear-gradient(180deg, #9333ea 0%, #6b21a8 40%, #4c1d95 100%);
  box-shadow:
    inset 0 -1px 0 #7e22ce,
    0 0 12px rgba(var(--accent-rgb), 0.6),
    0 3px 5px rgba(0, 0, 0, 0.5);
}

.piano-key--black.piano-key--selected .piano-key__label {
  color: white;
}

.piano-key--black.piano-key--playing {
  background: linear-gradient(180deg, #fbbf24 0%, #d97706 40%, #92400e 100%);
  box-shadow:
    inset 0 -1px 0 #fbbf24,
    0 0 20px rgba(251, 191, 36, 0.6),
    0 3px 5px rgba(0, 0, 0, 0.5);
}

.piano-key--black.piano-key--playing .piano-key__label {
  color: #78350f;
}

.piano-key__label {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 600;
  color: #555;
  transition: color 0.08s ease;
  letter-spacing: -0.02em;
}

.piano-key--black .piano-key__label {
  font-size: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Mobile */
@media (max-width: 640px) {
  .key-selector {
    max-width: 260px;
  }

  .piano-keyboard {
    height: 90px;
  }

  .key-header__key {
    font-size: 1.1rem;
  }

  .key-header__chords-value {
    font-size: 0.7rem;
  }

  .piano-key--black {
    width: 18px;
    height: 100%;
  }
}
</style>
