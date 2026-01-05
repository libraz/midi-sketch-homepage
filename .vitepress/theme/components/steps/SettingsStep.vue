<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as Tone from 'tone'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import { songImages } from '../../data/songImages'

const { t } = useI18n()
const store = useWizardStore()

// Advanced settings tab system
type SettingsTab = 'style' | 'feel' | 'rhythm' | 'arpeggio' | 'harmony' | 'duration'
const activeTab = ref<SettingsTab>('style') // Default to first tab

const settingsTabs: { id: SettingsTab; icon: string; labelKey: string }[] = [
  { id: 'style', icon: '🎛️', labelKey: 'settingsStep.tabs.style' },
  { id: 'feel', icon: '🎚️', labelKey: 'settingsStep.tabs.feel' },
  { id: 'rhythm', icon: '🥁', labelKey: 'settingsStep.tabs.rhythm' },
  { id: 'arpeggio', icon: '🎹', labelKey: 'settingsStep.tabs.arpeggio' },
  { id: 'harmony', icon: '♯', labelKey: 'settingsStep.tabs.harmony' },
  { id: 'duration', icon: '⏱', labelKey: 'settingsStep.tabs.duration' }
]

function selectTab(tab: SettingsTab) {
  activeTab.value = tab
}
const isPlayingScale = ref(false)
const playingNoteIndex = ref(-1)
const isAudioReady = ref(false)
const isAudioLoading = ref(true)

const currentSongImage = computed(() =>
  songImages.find(s => s.id === store.config.songImageId)
)

const KEY_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Piano keyboard layout: white keys and their positions
const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11] // C, D, E, F, G, A, B
const BLACK_KEYS = [1, 3, 6, 8, 10] // C#, Eb, F#, Ab, Bb
const BLACK_KEY_POSITIONS = [0.5, 1.5, 3.5, 4.5, 5.5] // Position relative to white keys

// Major scale intervals (semitones from root)
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11, 12]

// Synth for scale playback
let scaleSynth: Tone.Synth | null = null

function midiToNoteName(midi: number): string {
  const note = NOTE_NAMES[midi % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${note}${octave}`
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

function isSharpKey(index: number) {
  return BLACK_KEYS.includes(index)
}

async function initScaleSynth() {
  if (scaleSynth) return scaleSynth

  await Tone.start()

  scaleSynth = new Tone.Synth({
    oscillator: {
      type: 'sine'
    },
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

// Pre-initialize audio on page load
async function preloadAudio() {
  if (isAudioReady.value) return

  try {
    // Create the synth first (doesn't require user interaction)
    if (!scaleSynth) {
      scaleSynth = new Tone.Synth({
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.2,
          release: 0.3
        }
      }).toDestination()
      scaleSynth.volume.value = -8
    }

    // Try to start audio context (may be blocked until user interaction)
    if (Tone.getContext().state === 'suspended') {
      await Tone.start()
    }

    // Prime the audio pipeline by scheduling a silent oscillator
    // This avoids the first-note latency without playing audible sound
    const silentGain = new Tone.Gain(0).toDestination()
    const silentOsc = new Tone.Oscillator(440).connect(silentGain)
    silentOsc.start()
    silentOsc.stop('+0.01')

    // Clean up after a short delay
    setTimeout(() => {
      silentOsc.dispose()
      silentGain.dispose()
    }, 100)

    isAudioReady.value = true
    isAudioLoading.value = false
  } catch (e) {
    console.warn('Audio preload failed, will retry on interaction:', e)
    isAudioLoading.value = false
  }
}

// Resume audio context on user interaction (if it was suspended)
async function resumeAudioIfNeeded() {
  if (isAudioReady.value) return

  try {
    if (Tone.getContext().state === 'suspended') {
      await Tone.start()
    }

    // Prime with silent oscillator
    const silentGain = new Tone.Gain(0).toDestination()
    const silentOsc = new Tone.Oscillator(440).connect(silentGain)
    silentOsc.start()
    silentOsc.stop('+0.01')

    setTimeout(() => {
      silentOsc.dispose()
      silentGain.dispose()
    }, 100)

    isAudioReady.value = true
  } catch (e) {
    console.warn('Audio resume failed:', e)
  }
}

// Pre-load audio on mount
onMounted(() => {
  if (typeof window === 'undefined') return

  // Start preloading immediately
  preloadAudio()

  // Also set up interaction handler in case browser blocked autoplay
  const handleFirstInteraction = () => {
    resumeAudioIfNeeded()
    window.removeEventListener('click', handleFirstInteraction)
    window.removeEventListener('touchstart', handleFirstInteraction)
    window.removeEventListener('keydown', handleFirstInteraction)
  }

  window.addEventListener('click', handleFirstInteraction, { once: true })
  window.addEventListener('touchstart', handleFirstInteraction, { once: true })
  window.addEventListener('keydown', handleFirstInteraction, { once: true })
})

// Track current scale playback to allow cancellation
let scaleTimeouts: number[] = []
let currentPlayingKey = ref(-1)

function stopCurrentScale() {
  scaleTimeouts.forEach(id => clearTimeout(id))
  scaleTimeouts = []
  isPlayingScale.value = false
  playingNoteIndex.value = -1
  currentPlayingKey.value = -1
}

async function playScale(keyIndex: number) {
  // Stop any currently playing scale
  stopCurrentScale()

  const synth = await initScaleSynth()
  isPlayingScale.value = true
  currentPlayingKey.value = keyIndex

  const baseNote = 60 + keyIndex // C4 + key offset

  for (let i = 0; i < MAJOR_SCALE.length; i++) {
    const timeoutId = setTimeout(() => {
      // Check if this scale is still the active one
      if (currentPlayingKey.value !== keyIndex) return
      playingNoteIndex.value = i
      const freq = midiToFreq(baseNote + MAJOR_SCALE[i])
      synth.triggerAttackRelease(freq, '16n')
    }, i * 100)
    scaleTimeouts.push(timeoutId as unknown as number)
  }

  // Reset after scale completes
  const resetTimeout = setTimeout(() => {
    if (currentPlayingKey.value === keyIndex) {
      stopCurrentScale()
    }
  }, MAJOR_SCALE.length * 100 + 200)
  scaleTimeouts.push(resetTimeout as unknown as number)
}

async function selectKey(key: number) {
  store.setKey(key)
  await playScale(key)
}

onUnmounted(() => {
  stopCurrentScale()
  if (scaleSynth) {
    scaleSynth.dispose()
    scaleSynth = null
  }
})

function updateBpm(event: Event) {
  const target = event.target as HTMLInputElement
  store.setBpm(parseInt(target.value))
}

// Calculate beat duration in seconds for CSS animation
const beatDuration = computed(() => {
  return 60 / store.config.bpm
})

// Dynamic tempo presets based on song image's tempo range
const dynamicTempoPresets = computed(() => {
  const image = currentSongImage.value
  if (!image) {
    return [
      { icon: '🌙', labelKey: 'ballad', bpm: 75 },
      { icon: '🎵', labelKey: 'medium', bpm: 100 },
      { icon: '✨', labelKey: 'pop', bpm: 128 },
      { icon: '⚡', labelKey: 'upbeat', bpm: 150 }
    ]
  }

  const { min, max, default: defaultBpm } = image.tempoRange
  const range = max - min

  // Create 4 presets evenly distributed across the range
  // Labels are based on position in range
  const presets = [
    { icon: '🌙', labelKey: 'slow', bpm: min },
    { icon: '🎵', labelKey: 'medium', bpm: Math.round(min + range * 0.33) },
    { icon: '✨', labelKey: 'standard', bpm: Math.round(min + range * 0.66) },
    { icon: '⚡', labelKey: 'fast', bpm: max }
  ]

  // Find closest to default and mark it
  let closestIndex = 0
  let closestDiff = Math.abs(presets[0].bpm - defaultBpm)
  presets.forEach((p, i) => {
    const diff = Math.abs(p.bpm - defaultBpm)
    if (diff < closestDiff) {
      closestDiff = diff
      closestIndex = i
    }
  })

  return presets.map((p, i) => ({
    ...p,
    isDefault: i === closestIndex
  }))
})

function isPresetActive(presetBpm: number, index: number): boolean {
  const presets = dynamicTempoPresets.value
  const bpm = store.config.bpm

  // Find which preset range the current BPM falls into
  for (let i = 0; i < presets.length; i++) {
    const current = presets[i].bpm
    const next = presets[i + 1]?.bpm ?? current + 1

    if (i === presets.length - 1) {
      // Last preset: active if bpm >= this preset
      if (bpm >= current - 2) return index === i
    } else {
      // Middle presets: active if bpm is closer to this than next
      const midpoint = (current + next) / 2
      if (bpm < midpoint) return index === i
    }
  }
  return index === 0
}

// Duration presets and formatting
const durationPresets = [
  { label: '1:30', seconds: 90 },
  { label: '2:00', seconds: 120 },
  { label: '2:30', seconds: 150 },
  { label: '3:00', seconds: 180 },
  { label: '4:00', seconds: 240 }
]

const formattedDuration = computed(() => {
  const seconds = store.config.targetDurationSeconds
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

// Composition style options
const compositionStyleOptions = [
  { key: 'melodyLead', value: 0, icon: '🎤' },
  { key: 'backgroundMotif', value: 1, icon: '🎹' },
  { key: 'synthDriven', value: 2, icon: '🎛️' }
]
</script>

<template>
  <div class="settings-step">
    <!-- Header -->
    <header class="step-header">
      <h2 class="step-header__title">{{ t('settingsStep.title') }}</h2>
      <p class="step-header__subtitle">{{ t('settingsStep.subtitle') }}</p>
    </header>

    <div class="settings-layout">
      <!-- Key Selector -->
      <section class="setting-section">
        <h3 class="setting-label">
          <span class="setting-label__icon">♯</span>
          <span>{{ t('settingsStep.key.label') }}</span>
        </h3>
        <p class="setting-description">{{ t('settingsStep.key.description') }}</p>

        <div class="piano-keyboard" :class="{ 'piano-keyboard--loading': isAudioLoading }">
          <!-- Loading Overlay -->
          <Transition name="fade">
            <div v-if="isAudioLoading" class="piano-loading">
              <div class="piano-loading__spinner"></div>
              <span class="piano-loading__text">{{ t('settingsStep.key.loadingAudio') }}</span>
            </div>
          </Transition>

          <!-- White Keys -->
          <div class="piano-white-keys">
            <button
              v-for="keyIndex in WHITE_KEYS"
              :key="keyIndex"
              class="piano-key piano-key--white"
              :class="{
                'piano-key--selected': store.config.key === keyIndex,
                'piano-key--playing': isPlayingScale && store.config.key === keyIndex
              }"
              :disabled="isAudioLoading"
              @click="selectKey(keyIndex)"
            >
              <span class="piano-key__label">{{ KEY_NAMES[keyIndex] }}</span>
              <span class="piano-key__hint">{{ KEY_NAMES[keyIndex] }}{{ t('settingsStep.key.major') }}</span>
            </button>
          </div>

          <!-- Black Keys -->
          <div class="piano-black-keys">
            <button
              v-for="(keyIndex, i) in BLACK_KEYS"
              :key="keyIndex"
              class="piano-key piano-key--black"
              :class="{
                'piano-key--selected': store.config.key === keyIndex,
                'piano-key--playing': isPlayingScale && store.config.key === keyIndex
              }"
              :disabled="isAudioLoading"
              :style="{ left: `calc(${BLACK_KEY_POSITIONS[i]} * (100% / 7) + (100% / 14) - 18px)` }"
              @click="selectKey(keyIndex)"
            >
              <span class="piano-key__label">{{ KEY_NAMES[keyIndex] }}</span>
            </button>
          </div>
        </div>

        <div class="key-info">
          <div class="key-info__current">
            <span class="key-info__label">{{ t('settingsStep.key.selected') }}</span>
            <span class="key-info__value">{{ KEY_NAMES[store.config.key] }} {{ t('settingsStep.key.major') }}</span>
          </div>
          <!-- Playing indicator - absolutely positioned to avoid layout shift -->
          <Transition name="playing-indicator">
            <div v-if="isPlayingScale" class="key-info__playing">
              <span class="key-info__wave">♪</span>
              <span class="key-info__playing-text">{{ t('settingsStep.key.playing') }}</span>
            </div>
          </Transition>
        </div>
      </section>

      <!-- BPM Slider -->
      <section class="setting-section">
        <h3 class="setting-label">
          <span class="setting-label__icon">♩</span>
          <span>{{ t('settingsStep.tempo.label') }}</span>
        </h3>
        <p class="setting-description">{{ t('settingsStep.tempo.description') }}</p>

        <div class="bpm-control">
          <div class="bpm-display">
            <!-- Metronome Visualizer -->
            <div class="metronome" :style="{ '--beat-duration': `${beatDuration}s` }">
              <div class="metronome__ring"></div>
              <div class="metronome__ring metronome__ring--delayed"></div>
              <div class="metronome__dot"></div>
            </div>

            <div class="bpm-display__text">
              <span class="bpm-display__value" :style="{ '--beat-duration': `${beatDuration}s` }">{{ store.config.bpm }}</span>
              <span class="bpm-display__unit">BPM</span>
            </div>
          </div>

          <div class="bpm-slider-wrap">
            <input
              type="range"
              class="bpm-slider"
              :value="store.config.bpm"
              :min="currentSongImage?.tempoRange.min || 60"
              :max="currentSongImage?.tempoRange.max || 180"
              @input="updateBpm"
            />
            <div class="bpm-slider-track">
              <div
                class="bpm-slider-fill"
                :style="{
                  width: `${((store.config.bpm - (currentSongImage?.tempoRange.min || 60)) / ((currentSongImage?.tempoRange.max || 180) - (currentSongImage?.tempoRange.min || 60))) * 100}%`
                }"
              ></div>
            </div>
          </div>

          <div class="tempo-presets">
            <button
              v-for="(preset, index) in dynamicTempoPresets"
              :key="index"
              class="tempo-preset"
              :class="{
                'tempo-preset--active': isPresetActive(preset.bpm, index),
                'tempo-preset--default': preset.isDefault
              }"
              @click="store.setBpm(preset.bpm)"
            >
              <span class="tempo-preset__bpm">{{ preset.bpm }}</span>
              <span class="tempo-preset__label">{{ t(`settingsStep.presets.${preset.labelKey}`) }}</span>
              <span v-if="preset.isDefault" class="tempo-preset__star">★</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Studio Console: Advanced Settings Tabs -->
      <div class="studio-console">
        <div class="console-header">
          <span class="console-title">{{ t('settingsStep.advanced.toggle') }}</span>
        </div>

        <!-- Tab Bar -->
        <div class="console-tabs" role="tablist">
          <button
            v-for="tab in settingsTabs"
            :key="tab.id"
            class="console-tab"
            :class="{ 'console-tab--active': activeTab === tab.id }"
            role="tab"
            :aria-selected="activeTab === tab.id"
            @click="selectTab(tab.id)"
          >
            <span class="console-tab__icon">{{ tab.icon }}</span>
            <span class="console-tab__label">{{ t(tab.labelKey) }}</span>
          </button>
        </div>

        <!-- Tab Content Panels -->
        <Transition name="panel-slide" mode="out-in">
          <div :key="activeTab" class="console-panel" role="tabpanel">

            <!-- Style Panel -->
            <template v-if="activeTab === 'style'">
              <p class="panel-description">{{ t('settingsStep.advanced.compositionStyle.description') }}</p>
              <div class="composition-cards">
                <button
                  v-for="option in compositionStyleOptions"
                  :key="option.key"
                  class="composition-card"
                  :class="{ 'composition-card--active': store.config.compositionStyle === option.value }"
                  @click="store.config.compositionStyle = option.value"
                >
                  <span class="composition-card__icon">{{ option.icon }}</span>
                  <div class="composition-card__content">
                    <span class="composition-card__title">{{ t(`settingsStep.advanced.compositionStyle.options.${option.key}`) }}</span>
                    <span class="composition-card__desc">{{ t(`settingsStep.advanced.compositionStyle.options.${option.key}Desc`) }}</span>
                  </div>
                </button>
              </div>
            </template>

            <!-- Feel Panel (Humanize) -->
            <template v-if="activeTab === 'feel'">
              <p class="panel-description">{{ t('settingsStep.advanced.humanize.description') }}</p>

              <div class="setting-row">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="store.config.humanize"
                    class="toggle-input"
                  />
                  <span class="toggle-switch"></span>
                  <span>{{ t('settingsStep.advanced.humanize.label') }}</span>
                </label>
              </div>

              <div v-if="store.config.humanize" class="slider-group">
                <div class="slider-item">
                  <label class="slider-label">
                    {{ t('settingsStep.advanced.humanize.timing') }}
                    <span class="slider-value">{{ store.config.humanizeTiming }}%</span>
                  </label>
                  <p class="slider-hint">{{ t('settingsStep.advanced.humanize.timingHint') }}</p>
                  <input
                    type="range"
                    v-model.number="store.config.humanizeTiming"
                    min="0"
                    max="100"
                    class="slider"
                  />
                </div>
                <div class="slider-item">
                  <label class="slider-label">
                    {{ t('settingsStep.advanced.humanize.velocity') }}
                    <span class="slider-value">{{ store.config.humanizeVelocity }}%</span>
                  </label>
                  <p class="slider-hint">{{ t('settingsStep.advanced.humanize.velocityHint') }}</p>
                  <input
                    type="range"
                    v-model.number="store.config.humanizeVelocity"
                    min="0"
                    max="100"
                    class="slider"
                  />
                </div>
              </div>
            </template>

            <!-- Rhythm Panel (Drums) -->
            <template v-if="activeTab === 'rhythm'">
              <div class="setting-row">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="store.config.drumsEnabled"
                    class="toggle-input"
                  />
                  <span class="toggle-switch"></span>
                  <span>{{ t('settingsStep.advanced.drums.label') }}</span>
                </label>
              </div>
              <p class="panel-hint">{{ t('settingsStep.advanced.drums.description') }}</p>
            </template>

            <!-- Arpeggio Panel -->
            <template v-if="activeTab === 'arpeggio'">
              <div class="setting-row">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="store.config.arpeggioEnabled"
                    class="toggle-input"
                  />
                  <span class="toggle-switch"></span>
                  <span>{{ t('settingsStep.advanced.arpeggio.label') }}</span>
                </label>
              </div>
              <p class="panel-hint">{{ t('settingsStep.advanced.arpeggio.description') }}</p>

              <div v-if="store.config.arpeggioEnabled" class="arpeggio-settings">
                <!-- Pattern -->
                <div class="option-group">
                  <label class="option-label">{{ t('settingsStep.advanced.arpeggio.pattern') }}</label>
                  <div class="option-buttons">
                    <button
                      v-for="(pattern, index) in ['up', 'down', 'updown', 'random']"
                      :key="pattern"
                      class="option-btn"
                      :class="{ 'option-btn--active': store.config.arpeggioPattern === index }"
                      @click="store.config.arpeggioPattern = index"
                    >
                      {{ t(`settingsStep.advanced.arpeggio.patterns.${pattern}`) }}
                    </button>
                  </div>
                </div>

                <!-- Speed -->
                <div class="option-group">
                  <label class="option-label">{{ t('settingsStep.advanced.arpeggio.speed') }}</label>
                  <div class="option-buttons">
                    <button
                      v-for="(speed, index) in ['eighth', 'sixteenth', 'triplet']"
                      :key="speed"
                      class="option-btn"
                      :class="{ 'option-btn--active': store.config.arpeggioSpeed === index }"
                      @click="store.config.arpeggioSpeed = index"
                    >
                      {{ t(`settingsStep.advanced.arpeggio.speeds.${speed}`) }}
                    </button>
                  </div>
                </div>

                <!-- Octave Range -->
                <div class="slider-item">
                  <label class="slider-label">
                    {{ t('settingsStep.advanced.arpeggio.octaveRange') }}
                    <span class="slider-value">{{ store.config.arpeggioOctaveRange }}</span>
                  </label>
                  <p class="slider-hint">{{ t('settingsStep.advanced.arpeggio.octaveRangeHint') }}</p>
                  <input
                    type="range"
                    v-model.number="store.config.arpeggioOctaveRange"
                    min="1"
                    max="3"
                    class="slider"
                  />
                </div>

                <!-- Gate -->
                <div class="slider-item">
                  <label class="slider-label">
                    {{ t('settingsStep.advanced.arpeggio.gate') }}
                    <span class="slider-value">{{ store.config.arpeggioGate }}%</span>
                  </label>
                  <p class="slider-hint">{{ t('settingsStep.advanced.arpeggio.gateHint') }}</p>
                  <input
                    type="range"
                    v-model.number="store.config.arpeggioGate"
                    min="10"
                    max="100"
                    class="slider"
                  />
                </div>
              </div>
            </template>

            <!-- Harmony Panel (Chord Extensions) -->
            <template v-if="activeTab === 'harmony'">
              <ul class="panel-description-list">
                <li>{{ t('settingsStep.advanced.chordExt.desc1') }}</li>
                <li>{{ t('settingsStep.advanced.chordExt.desc2') }}</li>
              </ul>

              <!-- Sus -->
              <div class="chord-ext-item">
                <div class="setting-row">
                  <label class="toggle-label">
                    <input
                      type="checkbox"
                      v-model="store.config.chordExtSus"
                      class="toggle-input"
                    />
                    <span class="toggle-switch"></span>
                    <span class="toggle-text">
                      <span class="toggle-title">{{ t('settingsStep.advanced.chordExt.sus') }}</span>
                      <span class="toggle-desc">{{ t('settingsStep.advanced.chordExt.susDesc') }}</span>
                    </span>
                  </label>
                </div>
                <div v-if="store.config.chordExtSus" class="slider-item slider-item--nested">
                  <label class="slider-label">
                    {{ t('settingsStep.advanced.chordExt.probability') }}
                    <span class="slider-value">{{ store.config.chordExtSusProb }}%</span>
                  </label>
                  <input
                    type="range"
                    v-model.number="store.config.chordExtSusProb"
                    min="0"
                    max="100"
                    class="slider"
                  />
                  <span class="slider-hint">{{ t('settingsStep.advanced.chordExt.susHint') }}</span>
                </div>
              </div>

              <!-- 7th -->
              <div class="chord-ext-item">
                <div class="setting-row">
                  <label class="toggle-label">
                    <input
                      type="checkbox"
                      v-model="store.config.chordExt7th"
                      class="toggle-input"
                    />
                    <span class="toggle-switch"></span>
                    <span class="toggle-text">
                      <span class="toggle-title">{{ t('settingsStep.advanced.chordExt.seventh') }}</span>
                      <span class="toggle-desc">{{ t('settingsStep.advanced.chordExt.seventhDesc') }}</span>
                    </span>
                  </label>
                </div>
                <div v-if="store.config.chordExt7th" class="slider-item slider-item--nested">
                  <label class="slider-label">
                    {{ t('settingsStep.advanced.chordExt.probability') }}
                    <span class="slider-value">{{ store.config.chordExt7thProb }}%</span>
                  </label>
                  <input
                    type="range"
                    v-model.number="store.config.chordExt7thProb"
                    min="0"
                    max="100"
                    class="slider"
                  />
                  <span class="slider-hint">{{ t('settingsStep.advanced.chordExt.seventhHint') }}</span>
                </div>
              </div>

              <!-- 9th -->
              <div class="chord-ext-item">
                <div class="setting-row">
                  <label class="toggle-label">
                    <input
                      type="checkbox"
                      v-model="store.config.chordExt9th"
                      class="toggle-input"
                    />
                    <span class="toggle-switch"></span>
                    <span class="toggle-text">
                      <span class="toggle-title">{{ t('settingsStep.advanced.chordExt.ninth') }}</span>
                      <span class="toggle-desc">{{ t('settingsStep.advanced.chordExt.ninthDesc') }}</span>
                    </span>
                  </label>
                </div>
                <div v-if="store.config.chordExt9th" class="slider-item slider-item--nested">
                  <label class="slider-label">
                    {{ t('settingsStep.advanced.chordExt.probability') }}
                    <span class="slider-value">{{ store.config.chordExt9thProb }}%</span>
                  </label>
                  <input
                    type="range"
                    v-model.number="store.config.chordExt9thProb"
                    min="0"
                    max="100"
                    class="slider"
                  />
                  <span class="slider-hint">{{ t('settingsStep.advanced.chordExt.ninthHint') }}</span>
                </div>
              </div>
            </template>

            <!-- Duration Panel -->
            <template v-if="activeTab === 'duration'">
              <p class="panel-description">{{ t('settingsStep.duration.description') }}</p>

              <div class="duration-control">
                <div class="duration-display">
                  <span class="duration-value">{{ formattedDuration }}</span>
                </div>

                <div class="duration-presets">
                  <button
                    v-for="preset in durationPresets"
                    :key="preset.seconds"
                    class="duration-preset"
                    :class="{ 'duration-preset--active': store.config.targetDurationSeconds === preset.seconds }"
                    @click="store.config.targetDurationSeconds = preset.seconds"
                  >
                    {{ preset.label }}
                  </button>
                </div>

                <div class="duration-slider-wrap">
                  <input
                    type="range"
                    class="duration-slider"
                    v-model.number="store.config.targetDurationSeconds"
                    min="60"
                    max="300"
                    step="15"
                  />
                  <div class="duration-slider-track">
                    <div
                      class="duration-slider-fill"
                      :style="{ width: `${((store.config.targetDurationSeconds - 60) / 240) * 100}%` }"
                    ></div>
                  </div>
                </div>

                <div class="duration-range">
                  <span>1:00</span>
                  <span>5:00</span>
                </div>
              </div>
            </template>

          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-step {
  --step-accent: #8B5CF6;
}

.step-header {
  text-align: center;
  margin-bottom: 2rem;
}

.step-header__title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #FAFAFA;
  margin: 0 0 0.5rem;
}

.step-header__subtitle {
  font-size: 0.9rem;
  color: rgba(250, 250, 250, 0.5);
  margin: 0;
}

.settings-layout {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.setting-section {
  background: rgba(20, 20, 28, 0.4);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #FAFAFA;
  margin: 0 0 0.5rem;
}

.setting-label__icon {
  color: var(--step-accent);
}

.setting-description {
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.45);
  margin: 0 0 1.25rem;
}

/* Piano Keyboard */
.piano-keyboard {
  position: relative;
  height: 140px;
  margin-bottom: 1.25rem;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6) 0%, rgba(15, 15, 22, 0.8) 100%);
  border: 1px solid rgba(139, 92, 246, 0.15);
  padding: 12px 8px 8px;
  transition: opacity 0.3s ease;
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
  border: 3px solid rgba(139, 92, 246, 0.2);
  border-top-color: var(--step-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.piano-loading__text {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.7);
}

/* Fade transition */
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
  height: 55%;
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
  background: linear-gradient(180deg,
    #FAFAFA 0%,
    #F0F0F0 60%,
    #E8E8E8 100%
  );
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
  background: linear-gradient(180deg,
    #FFFFFF 0%,
    #F8F8F8 60%,
    #F0F0F0 100%
  );
  box-shadow:
    inset 0 -4px 8px rgba(0, 0, 0, 0.08),
    0 6px 16px rgba(0, 0, 0, 0.35),
    0 0 20px rgba(139, 92, 246, 0.15),
    0 1px 0 rgba(255, 255, 255, 0.9) inset;
}

.piano-key--white:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.piano-key--white.piano-key--selected {
  background: linear-gradient(180deg,
    #C4B5FD 0%,
    #A78BFA 40%,
    #8B5CF6 100%
  );
  box-shadow:
    inset 0 -4px 8px rgba(0, 0, 0, 0.1),
    0 4px 24px rgba(139, 92, 246, 0.5),
    0 0 40px rgba(139, 92, 246, 0.3),
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
      0 4px 24px rgba(139, 92, 246, 0.5),
      0 0 40px rgba(139, 92, 246, 0.3);
  }
  50% {
    box-shadow:
      inset 0 -4px 8px rgba(0, 0, 0, 0.1),
      0 4px 32px rgba(139, 92, 246, 0.7),
      0 0 60px rgba(139, 92, 246, 0.5);
  }
}

.piano-key--black {
  position: absolute;
  width: 36px;
  height: 100%;
  background: linear-gradient(180deg,
    #2A2A35 0%,
    #1A1A22 50%,
    #0F0F15 100%
  );
  border-radius: 0 0 6px 6px;
  box-shadow:
    inset 0 -3px 6px rgba(0, 0, 0, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  pointer-events: auto;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
}

.piano-key--black:hover {
  background: linear-gradient(180deg,
    #3A3A45 0%,
    #2A2A32 50%,
    #1A1A22 100%
  );
  box-shadow:
    inset 0 -3px 6px rgba(0, 0, 0, 0.3),
    0 6px 14px rgba(0, 0, 0, 0.6),
    0 0 16px rgba(139, 92, 246, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.piano-key--black:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.5),
    0 2px 6px rgba(0, 0, 0, 0.3);
}

.piano-key--black.piano-key--selected {
  background: linear-gradient(180deg,
    #7C3AED 0%,
    #6D28D9 50%,
    #5B21B6 100%
  );
  box-shadow:
    inset 0 -3px 6px rgba(0, 0, 0, 0.2),
    0 4px 20px rgba(139, 92, 246, 0.6),
    0 0 30px rgba(139, 92, 246, 0.4),
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
      0 4px 20px rgba(139, 92, 246, 0.6),
      0 0 30px rgba(139, 92, 246, 0.4);
  }
  50% {
    box-shadow:
      inset 0 -3px 6px rgba(0, 0, 0, 0.2),
      0 4px 28px rgba(139, 92, 246, 0.8),
      0 0 50px rgba(139, 92, 246, 0.6);
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

.piano-key__hint {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(8px);
  padding: 4px 8px;
  background: rgba(20, 20, 28, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 6px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  color: #FAFAFA;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease;
  z-index: 10;
}

.piano-key--white:hover .piano-key__hint {
  opacity: 1;
  transform: translateX(-50%) translateY(-4px);
}

/* Key Info */
.key-info {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

.key-info__current {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.key-info__label {
  font-size: 0.85rem;
  color: rgba(250, 250, 250, 0.5);
}

.key-info__value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
  font-weight: 700;
  color: var(--step-accent);
  padding: 0.25rem 0.75rem;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 6px;
  border: 1px solid rgba(139, 92, 246, 0.25);
  min-width: 80px;
  text-align: center;
}

.key-info__playing {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: rgba(139, 92, 246, 0.12);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 20px;
  font-size: 0.75rem;
  color: var(--step-accent);
}

.key-info__playing-text {
  font-weight: 500;
  white-space: nowrap;
}

.key-info__wave {
  display: inline-block;
  animation: waveAnimation 0.5s ease-in-out infinite;
  font-size: 0.9rem;
}

/* Playing indicator transition */
.playing-indicator-enter-active {
  animation: slideInRight 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.playing-indicator-leave-active {
  animation: slideOutRight 0.2s ease-out forwards;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

@keyframes slideOutRight {
  from {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
  to {
    opacity: 0;
    transform: translateY(-50%) translateX(10px);
  }
}

@keyframes waveAnimation {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.bpm-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.bpm-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

/* Metronome Visualizer */
.metronome {
  --beat-duration: 0.5s;
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metronome__dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A78BFA 0%, #8B5CF6 50%, #7C3AED 100%);
  box-shadow:
    0 0 20px rgba(139, 92, 246, 0.6),
    0 0 40px rgba(139, 92, 246, 0.3),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.3);
  animation: metronomePulse var(--beat-duration) ease-in-out infinite;
  z-index: 2;
}

.metronome__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(139, 92, 246, 0.4);
  animation: metronomeRing var(--beat-duration) ease-out infinite;
}

.metronome__ring--delayed {
  animation-delay: calc(var(--beat-duration) * 0.5);
  opacity: 0.5;
}

@keyframes metronomePulse {
  0%, 100% {
    transform: scale(1);
    box-shadow:
      0 0 20px rgba(139, 92, 246, 0.6),
      0 0 40px rgba(139, 92, 246, 0.3),
      inset 0 -2px 4px rgba(0, 0, 0, 0.2),
      inset 0 2px 4px rgba(255, 255, 255, 0.3);
  }
  15% {
    transform: scale(1.3);
    box-shadow:
      0 0 30px rgba(139, 92, 246, 0.8),
      0 0 60px rgba(139, 92, 246, 0.5),
      0 0 80px rgba(236, 72, 153, 0.2),
      inset 0 -2px 4px rgba(0, 0, 0, 0.2),
      inset 0 2px 4px rgba(255, 255, 255, 0.4);
  }
  30% {
    transform: scale(1);
  }
}

@keyframes metronomeRing {
  0% {
    transform: scale(0.4);
    opacity: 0.8;
    border-color: rgba(139, 92, 246, 0.6);
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
    border-color: rgba(139, 92, 246, 0);
  }
}

.bpm-display__text {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
}

.bpm-display__value {
  --beat-duration: 0.5s;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 3.5rem;
  color: #FAFAFA;
  line-height: 1;
  text-shadow: 0 0 40px rgba(139, 92, 246, 0.3);
  animation: bpmPulse var(--beat-duration) ease-in-out infinite;
}

@keyframes bpmPulse {
  0%, 100% {
    text-shadow: 0 0 40px rgba(139, 92, 246, 0.3);
    opacity: 1;
  }
  15% {
    text-shadow:
      0 0 50px rgba(139, 92, 246, 0.5),
      0 0 80px rgba(236, 72, 153, 0.3);
    opacity: 1;
  }
}

.bpm-display__unit {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.4);
  letter-spacing: 0.1em;
}

.bpm-slider-wrap {
  position: relative;
  width: 100%;
  max-width: 400px;
  height: 8px;
}

.bpm-slider {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.bpm-slider-track {
  position: absolute;
  inset: 0;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 4px;
  overflow: hidden;
}

.bpm-slider-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--step-accent), #EC4899);
  border-radius: 4px;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
  transition: width 0.1s ease;
}

.bpm-control .tempo-presets {
  width: 100%;
  max-width: 400px;
  margin-top: 0.75rem;
}

/* Duration Control */
.duration-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.duration-display {
  display: flex;
  align-items: center;
  justify-content: center;
}

.duration-value {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 3rem;
  color: #FAFAFA;
  letter-spacing: 0.05em;
  text-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
}

.duration-presets {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.duration-preset {
  padding: 0.5rem 0;
  width: 70px;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.duration-preset:hover {
  border-color: rgba(139, 92, 246, 0.3);
  color: #FAFAFA;
}

.duration-preset--active {
  background: rgba(139, 92, 246, 0.15);
  border-color: var(--step-accent);
  color: var(--step-accent);
  box-shadow: 0 0 16px -4px rgba(139, 92, 246, 0.4);
}

.duration-slider-wrap {
  position: relative;
  width: 100%;
  max-width: 400px;
  height: 8px;
}

.duration-slider {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.duration-slider-track {
  position: absolute;
  inset: 0;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 4px;
  overflow: hidden;
}

.duration-slider-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--step-accent), #EC4899);
  border-radius: 4px;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
  transition: width 0.1s ease;
}

.duration-range {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 400px;
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.35);
}

.tempo-presets {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.tempo-preset {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0.5rem 0;
  width: 70px;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tempo-preset:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(40, 40, 55, 0.7);
}

.tempo-preset--active {
  background: rgba(139, 92, 246, 0.15);
  border-color: var(--step-accent);
  box-shadow: 0 0 16px -4px rgba(139, 92, 246, 0.4);
}

.tempo-preset--default {
  border-color: rgba(251, 191, 36, 0.25);
}

.tempo-preset--default:not(.tempo-preset--active) {
  background: rgba(251, 191, 36, 0.05);
}

.tempo-preset__bpm {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
  font-weight: 700;
  color: #FAFAFA;
  line-height: 1;
}

.tempo-preset--active .tempo-preset__bpm {
  color: var(--step-accent);
}

.tempo-preset__label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.tempo-preset--active .tempo-preset__label {
  color: rgba(139, 92, 246, 0.7);
}

.tempo-preset__star {
  position: absolute;
  top: 3px;
  right: 3px;
  font-size: 0.5rem;
  color: #FBBF24;
  text-shadow: 0 0 4px rgba(251, 191, 36, 0.5);
}

/* Studio Console */
.studio-console {
  background: rgba(15, 15, 22, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 20px;
  padding: 1.25rem;
  margin-top: 0.5rem;
}

.console-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.console-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

@keyframes indicatorPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.console-tabs {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 3px;
}

.console-tabs::-webkit-scrollbar {
  display: none;
}

.console-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.625rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.console-tab:hover:not(.console-tab--active) {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(250, 250, 250, 0.75);
}

.console-tab--active {
  background: rgba(139, 92, 246, 0.2);
  color: #FAFAFA;
  box-shadow: 0 0 12px -2px rgba(139, 92, 246, 0.3);
}

.console-tab__icon {
  font-size: 0.875rem;
}

.console-tab__label {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 640px) {
  .console-tab__label {
    display: none;
  }

  .console-tab {
    padding: 0.625rem;
  }

  .console-tab__icon {
    font-size: 1.125rem;
  }
}

.console-panel {
  margin-top: 1rem;
  padding: 1.25rem;
  background: rgba(20, 20, 28, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.08);
  border-radius: 14px;
}

.panel-description {
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.5);
  margin: 0 0 1rem;
  line-height: 1.5;
}

.panel-description-list {
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.5);
  margin: 0 0 1rem;
  padding-left: 1.25rem;
  line-height: 1.6;
}

.panel-description-list li {
  margin-bottom: 0.25rem;
}

.panel-description-list li:last-child {
  margin-bottom: 0;
}

.panel-hint {
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.4);
  margin: 0.75rem 0 0;
}

/* Panel slide transition */
.panel-slide-enter-active {
  animation: panelSlideIn 0.25s ease-out;
}

.panel-slide-leave-active {
  animation: panelSlideOut 0.15s ease-in;
}

@keyframes panelSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes panelSlideOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(8px);
  }
}

/* Arpeggio Settings */
.arpeggio-settings {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-label {
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.5);
}

.option-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.option-btn {
  padding: 0.5rem 0.875rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 8px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-btn:hover {
  border-color: rgba(139, 92, 246, 0.3);
  color: #FAFAFA;
}

.option-btn--active {
  background: rgba(139, 92, 246, 0.2);
  border-color: var(--step-accent);
  color: #FAFAFA;
}

/* Chord Extension Items */
.chord-ext-item {
  padding: 0.875rem 0;
  border-bottom: 1px solid rgba(139, 92, 246, 0.08);
}

.chord-ext-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.chord-ext-item:first-child {
  padding-top: 0;
}


.slider-item--nested {
  margin-top: 0.75rem;
  padding-left: 3.25rem;
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.toggle-title {
  font-weight: 600;
  color: rgba(250, 250, 250, 0.9);
}

.toggle-desc {
  font-size: 0.75rem;
  font-weight: 400;
  color: rgba(250, 250, 250, 0.45);
  line-height: 1.3;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: rgba(250, 250, 250, 0.8);
}

.toggle-input {
  display: none;
}

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.toggle-input:checked + .toggle-switch {
  background: var(--step-accent);
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(20px);
}

.slider-group {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.slider-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slider-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.6);
}

.slider-value {
  color: var(--step-accent);
  font-weight: 600;
}

.slider-hint {
  font-size: 0.7rem;
  color: rgba(250, 250, 250, 0.4);
  margin: 0 0 0.375rem;
  line-height: 1.3;
}

.slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 3px;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: var(--step-accent);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}

.range-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.range-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Composition Style Cards */
.composition-cards {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.composition-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.composition-card:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.05);
  transform: translateX(4px);
}

.composition-card--active {
  background: rgba(139, 92, 246, 0.15);
  border-color: var(--step-accent);
  box-shadow: 0 0 20px -4px rgba(139, 92, 246, 0.3);
}

.composition-card__icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 10px;
  flex-shrink: 0;
}

.composition-card--active .composition-card__icon {
  background: rgba(139, 92, 246, 0.25);
}

.composition-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.composition-card__title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: #FAFAFA;
}

.composition-card--active .composition-card__title {
  color: var(--step-accent);
}

.composition-card__desc {
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.5);
  line-height: 1.4;
}

.composition-card--active .composition-card__desc {
  color: rgba(250, 250, 250, 0.7);
}

@media (max-width: 640px) {
  .piano-keyboard {
    height: 110px;
    padding: 8px 4px 4px;
  }

  .piano-white-keys {
    gap: 2px;
  }

  .piano-key--white {
    border-radius: 0 0 6px 6px;
    padding-bottom: 6px;
  }

  .piano-key__label {
    font-size: 0.75rem;
  }

  .piano-key--black {
    width: 28px;
    border-radius: 0 0 4px 4px;
    padding-bottom: 4px;
  }

  .piano-key--black .piano-key__label {
    font-size: 0.6rem;
  }

  .piano-black-keys {
    top: 8px;
    left: 4px;
    right: 4px;
  }

  .key-info {
    flex-direction: column;
    min-height: 60px;
  }

  .key-info__value {
    font-size: 0.9rem;
    padding: 0.2rem 0.5rem;
    min-width: 70px;
  }

  .key-info__playing {
    position: static;
    transform: none;
    margin-top: 0.5rem;
  }

  /* Override transition animations for mobile stacked layout */
  .playing-indicator-enter-active {
    animation: fadeInUp 0.25s ease-out;
  }

  .playing-indicator-leave-active {
    animation: fadeOutDown 0.2s ease-out forwards;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeOutDown {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(8px);
    }
  }

  .piano-key__hint {
    display: none;
  }

  .bpm-display__value {
    font-size: 2.5rem;
  }

  .tempo-presets {
    grid-template-columns: repeat(2, 1fr);
  }

  .range-inputs {
    grid-template-columns: 1fr;
  }

  .vocal-presets {
    grid-template-columns: repeat(3, 1fr);
  }

  .vocal-preset {
    padding: 0.6rem 0.4rem;
  }

  .vocal-preset__icon {
    font-size: 1rem;
  }

  .vocal-preset__label {
    font-size: 0.7rem;
  }

  .vocal-preset__range {
    font-size: 0.6rem;
  }

  .range-bar {
    height: 20px;
  }

  .range-bar__note {
    font-size: 0.6rem;
    padding: 1px 4px;
  }
}
</style>
