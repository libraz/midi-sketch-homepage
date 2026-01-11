<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as Tone from 'tone'
import { useI18n } from '../../composables/useI18n'
import { KEY_NAMES, midiToFreq } from '../../utils/midiUtils'

const props = defineProps<{
  modelValue: number
  compact?: boolean
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

let scaleSynth: Tone.Synth | null = null
let scaleTimeouts: number[] = []
let audioCleanupTimeouts: number[] = []
let currentPlayingKey = ref(-1)
let firstInteractionHandler: (() => void) | null = null

async function initScaleSynth() {
  if (scaleSynth) return scaleSynth

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

    if (Tone.getContext().state === 'suspended') {
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
    if (Tone.getContext().state === 'suspended') {
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
    <div
      class="piano-keyboard"
      :class="{
        'piano-keyboard--compact': compact,
        'piano-keyboard--loading': isAudioLoading
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
            'piano-key--playing': isPlayingScale && modelValue === keyIndex
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
            'piano-key--playing': isPlayingScale && modelValue === keyIndex
          }"
          :disabled="isAudioLoading"
          :style="{ left: `calc(${BLACK_KEY_POSITIONS[i]} * (100% / 7) + (100% / 14) - 12px)` }"
          @click="selectKey(keyIndex)"
        >
          <span class="piano-key__label">{{ KEY_NAMES[keyIndex] }}</span>
        </button>
      </div>
    </div>

    <div class="key-info">
      <span class="key-info__value">{{ KEY_NAMES[modelValue] }} {{ t('settingsStep.key.major') }}</span>
      <Transition name="playing-indicator">
        <span v-if="isPlayingScale" class="key-info__wave">&#9835;</span>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.key-selector {
  --accent-color: var(--step-accent, #8B5CF6);
  --accent-rgb: var(--accent-rgb-value, 139, 92, 246);
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
}

/* Piano Keyboard */
.piano-keyboard {
  position: relative;
  height: 140px;
  margin-bottom: 1.25rem;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6) 0%, rgba(15, 15, 22, 0.8) 100%);
  border: 1px solid rgba(var(--accent-rgb), 0.15);
  padding: 12px 8px 8px;
  transition: opacity 0.3s ease;
  flex-shrink: 0;
}

.piano-keyboard--compact {
  height: 120px;
  margin-bottom: 0.75rem;
  padding: 8px 6px 6px;
  border-radius: 10px;
}

.piano-keyboard--compact .piano-key--white {
  border-radius: 0 0 5px 5px;
  padding-bottom: 4px;
}

.piano-keyboard--compact .piano-key__label {
  font-size: 0.55rem;
  bottom: 3px;
}

.piano-keyboard--compact .piano-key--black {
  width: 22px;
  height: calc(60% + 6px);
  border-radius: 0 0 3px 3px;
}

.piano-keyboard--compact .piano-key--black .piano-key__label {
  font-size: 0.45rem;
  bottom: 2px;
}

.piano-keyboard--compact .piano-black-keys {
  top: 6px;
  left: 6px;
  right: 6px;
}

.piano-keyboard--loading .piano-white-keys,
.piano-keyboard--loading .piano-black-keys {
  opacity: 0.4;
  pointer-events: none;
}

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
  background: rgba(15, 15, 22, 0.7);
  backdrop-filter: blur(4px);
  border-radius: 12px;
}

.piano-loading__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(var(--accent-rgb), 0.2);
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
  gap: 4px;
  height: 100%;
  position: relative;
  z-index: 1;
}

.piano-black-keys {
  position: absolute;
  top: 12px;
  left: 8px;
  right: 8px;
  height: 48%;
  z-index: 2;
  pointer-events: none;
}

.piano-key {
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  overflow: hidden;
}

.piano-key--white {
  flex: 1;
  height: 100%;
  background: linear-gradient(180deg, #FAFAFA 0%, #F0F0F0 60%, #E8E8E8 100%);
  border-radius: 0 0 8px 8px;
  box-shadow:
    inset 0 -4px 8px rgba(0, 0, 0, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 1px 0 rgba(255, 255, 255, 0.8) inset;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 8px;
}

.piano-key--white:hover {
  background: linear-gradient(180deg, #FFFFFF 0%, #F8F8F8 60%, #F0F0F0 100%);
  box-shadow:
    inset 0 -4px 8px rgba(0, 0, 0, 0.08),
    0 6px 16px rgba(0, 0, 0, 0.35),
    0 0 20px rgba(var(--accent-rgb), 0.15),
    0 1px 0 rgba(255, 255, 255, 0.9) inset;
}

.piano-key--white:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.piano-key--white.piano-key--selected {
  background: linear-gradient(180deg, #C4B5FD 0%, #A78BFA 40%, #8B5CF6 100%);
  box-shadow:
    inset 0 -4px 8px rgba(0, 0, 0, 0.1),
    0 4px 24px rgba(var(--accent-rgb), 0.5),
    0 0 40px rgba(var(--accent-rgb), 0.3),
    0 1px 0 rgba(255, 255, 255, 0.4) inset;
}

.piano-key--white.piano-key--selected .piano-key__label {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.piano-key--white.piano-key--playing {
  animation: keyPulse 0.8s ease-in-out infinite;
}

@keyframes keyPulse {
  0%, 100% {
    box-shadow:
      inset 0 -4px 8px rgba(0, 0, 0, 0.1),
      0 4px 24px rgba(var(--accent-rgb), 0.5),
      0 0 40px rgba(var(--accent-rgb), 0.3);
  }
  50% {
    box-shadow:
      inset 0 -4px 8px rgba(0, 0, 0, 0.1),
      0 4px 32px rgba(var(--accent-rgb), 0.7),
      0 0 60px rgba(var(--accent-rgb), 0.5);
  }
}

.piano-key--black {
  position: absolute;
  width: 24px;
  height: 100%;
  background: linear-gradient(180deg, #2A2A35 0%, #1A1A22 50%, #0F0F15 100%);
  border-radius: 0 0 4px 4px;
  box-shadow:
    inset 0 -3px 6px rgba(0, 0, 0, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  pointer-events: auto;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 4px;
}

.piano-key--black:hover {
  background: linear-gradient(180deg, #3A3A45 0%, #2A2A32 50%, #1A1A22 100%);
  box-shadow:
    inset 0 -3px 6px rgba(0, 0, 0, 0.3),
    0 6px 14px rgba(0, 0, 0, 0.6),
    0 0 16px rgba(var(--accent-rgb), 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.piano-key--black:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.5),
    0 2px 6px rgba(0, 0, 0, 0.3);
}

.piano-key--black.piano-key--selected {
  background: linear-gradient(180deg, #7C3AED 0%, #6D28D9 50%, #5B21B6 100%);
  box-shadow:
    inset 0 -3px 6px rgba(0, 0, 0, 0.2),
    0 4px 20px rgba(var(--accent-rgb), 0.6),
    0 0 30px rgba(var(--accent-rgb), 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.piano-key--black.piano-key--selected .piano-key__label {
  color: white;
}

.piano-key--black.piano-key--playing {
  animation: keyPulseBlack 0.8s ease-in-out infinite;
}

@keyframes keyPulseBlack {
  0%, 100% {
    box-shadow:
      inset 0 -3px 6px rgba(0, 0, 0, 0.2),
      0 4px 20px rgba(var(--accent-rgb), 0.6),
      0 0 30px rgba(var(--accent-rgb), 0.4);
  }
  50% {
    box-shadow:
      inset 0 -3px 6px rgba(0, 0, 0, 0.2),
      0 4px 28px rgba(var(--accent-rgb), 0.8),
      0 0 50px rgba(var(--accent-rgb), 0.6);
  }
}

.piano-key__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: #1A1A22;
  transition: color 0.15s ease;
}

.piano-key--black .piano-key__label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
}

/* Key Info */
.key-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.key-info__value {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent-color);
}

.key-info__wave {
  color: var(--accent-color);
  animation: waveAnimation 0.5s ease-in-out infinite;
}

@keyframes waveAnimation {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* Playing indicator transition */
.playing-indicator-enter-active,
.playing-indicator-leave-active {
  transition: all 0.2s ease;
}

.playing-indicator-enter-from,
.playing-indicator-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
