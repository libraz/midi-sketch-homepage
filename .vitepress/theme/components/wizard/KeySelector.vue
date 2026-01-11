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
  --accent-color: var(--section-accent, var(--step-accent, #8B5CF6));
  --accent-rgb: var(--section-accent-rgb, 139, 92, 246);
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
}

/* Piano Keyboard - Realistic design */
.piano-keyboard {
  position: relative;
  height: 120px;
  margin-bottom: 0.75rem;
  overflow: hidden;
  background: #1a1a1a;
  border: 2px solid #0a0a0a;
  padding: 0;
  transition: opacity 0.3s ease;
  flex-shrink: 0;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.8),
    0 4px 12px rgba(0, 0, 0, 0.5);
}

.piano-keyboard--compact {
  height: 100px;
  margin-bottom: 0.5rem;
}

.piano-keyboard--compact .piano-key--white {
  padding-bottom: 4px;
}

.piano-keyboard--compact .piano-key__label {
  font-size: 0.55rem;
}

.piano-keyboard--compact .piano-key--black {
  width: 18px;
  height: 58%;
}

.piano-keyboard--compact .piano-key--black .piano-key__label {
  font-size: 0.45rem;
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
  background: rgba(15, 15, 22, 0.85);
  backdrop-filter: blur(4px);
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

/* White Keys - Realistic */
.piano-key--white {
  flex: 1;
  height: 100%;
  background: linear-gradient(
    180deg,
    #fcfcfc 0%,
    #f8f8f8 2%,
    #f5f5f5 10%,
    #f0f0f0 50%,
    #e8e8e8 90%,
    #e0e0e0 100%
  );
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
  padding-bottom: 6px;
}

.piano-key--white:first-child {
  border-left: none;
}

.piano-key--white:last-child {
  border-right: none;
}

.piano-key--white:hover {
  background: linear-gradient(
    180deg,
    #ffffff 0%,
    #fafafa 2%,
    #f8f8f8 10%,
    #f5f5f5 50%,
    #f0f0f0 90%,
    #e8e8e8 100%
  );
  box-shadow:
    inset 0 -2px 0 #e0e0e0,
    inset 0 -4px 3px rgba(0, 0, 0, 0.03),
    0 2px 8px rgba(var(--accent-rgb), 0.2),
    0 2px 3px rgba(0, 0, 0, 0.15);
}

.piano-key--white:active {
  background: linear-gradient(
    180deg,
    #f0f0f0 0%,
    #e8e8e8 10%,
    #e5e5e5 50%,
    #e0e0e0 90%,
    #d8d8d8 100%
  );
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 -1px 0 #d0d0d0;
  transform: translateY(1px);
}

.piano-key--white.piano-key--selected {
  background: linear-gradient(
    180deg,
    #d8b4fe 0%,
    #c084fc 10%,
    #a855f7 50%,
    #9333ea 90%,
    #7e22ce 100%
  );
  border-color: #7e22ce;
  box-shadow:
    inset 0 -2px 0 #a855f7,
    inset 0 -4px 3px rgba(0, 0, 0, 0.1),
    0 0 20px rgba(var(--accent-rgb), 0.5),
    0 2px 3px rgba(0, 0, 0, 0.2);
}

.piano-key--white.piano-key--selected .piano-key__label {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.piano-key--white.piano-key--playing {
  animation: keyPulse 0.6s ease-in-out infinite;
}

@keyframes keyPulse {
  0%, 100% {
    box-shadow:
      inset 0 -2px 0 #a855f7,
      0 0 20px rgba(var(--accent-rgb), 0.5),
      0 2px 3px rgba(0, 0, 0, 0.2);
  }
  50% {
    box-shadow:
      inset 0 -2px 0 #a855f7,
      0 0 35px rgba(var(--accent-rgb), 0.7),
      0 2px 3px rgba(0, 0, 0, 0.2);
  }
}

/* Black Keys - Realistic */
.piano-key--black {
  position: absolute;
  width: 22px;
  height: 100%;
  background: linear-gradient(
    180deg,
    #3a3a3a 0%,
    #2a2a2a 5%,
    #1a1a1a 40%,
    #151515 80%,
    #0a0a0a 100%
  );
  border: none;
  border-left: 1px solid #2a2a2a;
  border-right: 1px solid #1a1a1a;
  box-shadow:
    inset 0 -1px 0 #2a2a2a,
    inset 1px 0 0 rgba(255, 255, 255, 0.05),
    0 3px 5px rgba(0, 0, 0, 0.6),
    0 5px 10px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 4px;
}

.piano-key--black:hover {
  background: linear-gradient(
    180deg,
    #454545 0%,
    #353535 5%,
    #252525 40%,
    #1a1a1a 80%,
    #0f0f0f 100%
  );
  box-shadow:
    inset 0 -1px 0 #353535,
    inset 1px 0 0 rgba(255, 255, 255, 0.08),
    0 3px 5px rgba(0, 0, 0, 0.6),
    0 5px 12px rgba(var(--accent-rgb), 0.15),
    0 5px 10px rgba(0, 0, 0, 0.4);
}

.piano-key--black:active {
  background: linear-gradient(
    180deg,
    #2a2a2a 0%,
    #1a1a1a 20%,
    #0f0f0f 60%,
    #0a0a0a 100%
  );
  box-shadow:
    inset 0 3px 6px rgba(0, 0, 0, 0.6),
    0 1px 2px rgba(0, 0, 0, 0.4);
}

.piano-key--black.piano-key--selected {
  background: linear-gradient(
    180deg,
    #9333ea 0%,
    #7e22ce 10%,
    #6b21a8 40%,
    #581c87 80%,
    #4c1d95 100%
  );
  box-shadow:
    inset 0 -1px 0 #7e22ce,
    inset 1px 0 0 rgba(255, 255, 255, 0.1),
    0 0 15px rgba(var(--accent-rgb), 0.6),
    0 3px 5px rgba(0, 0, 0, 0.5);
}

.piano-key--black.piano-key--selected .piano-key__label {
  color: white;
}

.piano-key--black.piano-key--playing {
  animation: keyPulseBlack 0.6s ease-in-out infinite;
}

@keyframes keyPulseBlack {
  0%, 100% {
    box-shadow:
      inset 0 -1px 0 #7e22ce,
      0 0 15px rgba(var(--accent-rgb), 0.6),
      0 3px 5px rgba(0, 0, 0, 0.5);
  }
  50% {
    box-shadow:
      inset 0 -1px 0 #7e22ce,
      0 0 28px rgba(var(--accent-rgb), 0.8),
      0 3px 5px rgba(0, 0, 0, 0.5);
  }
}

.piano-key__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  color: #555;
  transition: color 0.1s ease;
  letter-spacing: -0.02em;
}

.piano-key--black .piano-key__label {
  font-size: 0.55rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Key Info */
.key-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.key-info__value {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.85rem;
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
