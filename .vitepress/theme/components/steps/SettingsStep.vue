<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as Tone from 'tone'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import { songImages } from '../../data/songImages'
import { KEY_NAMES, NOTE_NAMES, midiToNoteName, midiToFreq } from '../../utils/midiUtils'

const { t } = useI18n()
const store = useWizardStore()

// DAW-style rack modules (collapsible sections - all collapsed by default)
type RackModule = 'track' | 'instruments' | 'harmony' | 'output'
const expandedModules = ref<Set<RackModule>>(new Set())

function toggleModule(module: RackModule) {
  if (expandedModules.value.has(module)) {
    expandedModules.value.delete(module)
  } else {
    expandedModules.value.add(module)
  }
  // Force reactivity
  expandedModules.value = new Set(expandedModules.value)
}

function isModuleExpanded(module: RackModule): boolean {
  return expandedModules.value.has(module)
}
const isPlayingScale = ref(false)
const playingNoteIndex = ref(-1)
const isAudioReady = ref(false)
const isAudioLoading = ref(true)

const currentSongImage = computed(() =>
  songImages.find(s => s.id === store.config.songImageId)
)

// Piano keyboard layout: white keys and their positions
const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11] // C, D, E, F, G, A, B
const BLACK_KEYS = [1, 3, 6, 8, 10] // C#, Eb, F#, Ab, Bb
const BLACK_KEY_POSITIONS = [0.5, 1.5, 3.5, 4.5, 5.5] // Position relative to white keys

// Major scale intervals (semitones from root)
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11, 12]

// Synth for scale playback
let scaleSynth: Tone.Synth | null = null

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

    // Clean up after a short delay (tracked for cleanup)
    const cleanupId = setTimeout(() => {
      silentOsc.dispose()
      silentGain.dispose()
    }, 100) as unknown as number
    audioCleanupTimeouts.push(cleanupId)

    isAudioReady.value = true
    isAudioLoading.value = false
  } catch {
    // Audio preload failed, will retry on interaction
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

// Pre-load audio on mount
onMounted(() => {
  if (typeof window === 'undefined') return

  // Start preloading immediately
  preloadAudio()

  // Also set up interaction handler in case browser blocked autoplay
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

// Track current scale playback to allow cancellation
let scaleTimeouts: number[] = []
let audioCleanupTimeouts: number[] = []
let currentPlayingKey = ref(-1)

// Track event listener for cleanup
let firstInteractionHandler: (() => void) | null = null

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

  // Clean up audio cleanup timeouts
  audioCleanupTimeouts.forEach(id => clearTimeout(id))
  audioCleanupTimeouts = []

  // Clean up event listeners
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

function updateBpm(event: Event) {
  const target = event.target as HTMLInputElement
  store.setBpm(parseInt(target.value))
}

// Calculate beat duration in seconds for CSS animation
const beatDuration = computed(() => {
  return 60 / store.config.bpm
})

// Recommended BPM range from current song image
const recommendedMin = computed(() => currentSongImage.value?.tempoRange.min || 60)
const recommendedMax = computed(() => currentSongImage.value?.tempoRange.max || 180)
const isInRecommendedRange = computed(() => {
  const bpm = store.config.bpm
  return bpm >= recommendedMin.value && bpm <= recommendedMax.value
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


// SynthDriven forces arpeggio on (WASM constraint)
const isSynthDriven = computed(() => store.config.compositionStyle === 2)

// Sync implicit settings when compositionStyle changes
// Based on wasm-js-option-relationships.md Section 8.3
watch(() => store.config.compositionStyle, (newStyle, oldStyle) => {
  // SynthDriven (2): force arpeggio on
  if (newStyle === 2) {
    store.config.arpeggioEnabled = true
  } else if (oldStyle === 2) {
    // Switching away from SynthDriven: turn off arpeggio
    store.config.arpeggioEnabled = false
  }

  // BackgroundMotif (1) or SynthDriven (2): auto-disable modulation
  if (newStyle === 1 || newStyle === 2) {
    store.config.modulationTiming = 0
  }
})

// Modulation timing options
const modulationTimingOptions = [
  { key: 'none', value: 0 },
  { key: 'lastChorus', value: 1 },
  { key: 'afterBridge', value: 2 },
  { key: 'eachChorus', value: 3 },
  { key: 'random', value: 4 }
]

// Intro chant options
const introChantOptions = [
  { key: 'none', value: 0 },
  { key: 'gachikoi', value: 1 },
  { key: 'shouting', value: 2 }
]

// Mix pattern options
const mixPatternOptions = [
  { key: 'none', value: 0 },
  { key: 'standard', value: 1 },
  { key: 'tiger', value: 2 }
]

// Call density options
const callDensityOptions = [
  { key: 'none', value: 0 },
  { key: 'minimal', value: 1 },
  { key: 'standard', value: 2 },
  { key: 'intense', value: 3 }
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
      <!-- Key & Tempo Combined Section -->
      <section class="setting-section setting-section--combined">
        <div class="key-tempo-grid">
          <!-- Key Selector (Left) -->
          <div class="key-panel">
            <h3 class="setting-label setting-label--compact">
              <span class="setting-label__icon">♯</span>
              <span>{{ t('settingsStep.key.label') }}</span>
            </h3>

            <div class="piano-keyboard piano-keyboard--compact" :class="{ 'piano-keyboard--loading': isAudioLoading }">
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
                    'piano-key--selected': store.config.key === keyIndex,
                    'piano-key--playing': isPlayingScale && store.config.key === keyIndex
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
                    'piano-key--selected': store.config.key === keyIndex,
                    'piano-key--playing': isPlayingScale && store.config.key === keyIndex
                  }"
                  :disabled="isAudioLoading"
                  :style="{ left: `calc(${BLACK_KEY_POSITIONS[i]} * (100% / 7) + (100% / 14) - 12px)` }"
                  @click="selectKey(keyIndex)"
                >
                  <span class="piano-key__label">{{ KEY_NAMES[keyIndex] }}</span>
                </button>
              </div>
            </div>

            <div class="key-info key-info--compact">
              <span class="key-info__value">{{ KEY_NAMES[store.config.key] }} {{ t('settingsStep.key.major') }}</span>
              <Transition name="playing-indicator">
                <span v-if="isPlayingScale" class="key-info__wave">♪</span>
              </Transition>
            </div>
          </div>

          <!-- Divider -->
          <div class="key-tempo-divider"></div>

          <!-- Tempo Panel (Right) -->
          <div class="tempo-panel">
            <h3 class="setting-label setting-label--compact">
              <span class="setting-label__icon">♩</span>
              <span>{{ t('settingsStep.tempo.label') }}</span>
            </h3>

            <div class="bpm-control bpm-control--compact">
              <div class="bpm-display bpm-display--compact">
                <!-- Metronome Visualizer -->
                <div class="metronome metronome--compact" :style="{ '--beat-duration': `${beatDuration}s` }">
                  <div class="metronome__ring"></div>
                  <div class="metronome__dot"></div>
                </div>

                <div class="bpm-display__text">
                  <span class="bpm-display__value" :class="{ 'bpm-display__value--outside': !isInRecommendedRange }" :style="{ '--beat-duration': `${beatDuration}s` }">{{ store.config.bpm }}</span>
                  <span class="bpm-display__unit">BPM</span>
                </div>

                <!-- BPM Range Warning - absolute positioned -->
                <Transition name="bpm-warning">
                  <div v-if="!isInRecommendedRange" class="bpm-range-warning">
                    <div class="bpm-range-warning__indicator"></div>
                    <span class="bpm-range-warning__text">
                      {{ store.config.bpm < recommendedMin ? t('settingsStep.tempo.belowRange') : t('settingsStep.tempo.aboveRange') }}
                    </span>
                    <span class="bpm-range-warning__hint">{{ recommendedMin }}–{{ recommendedMax }}</span>
                  </div>
                </Transition>
              </div>

              <div class="bpm-slider-wrap bpm-slider-wrap--extended">
                <!-- Multi-zone track -->
                <div class="bpm-track-zones">
                  <!-- Left extended zone (60 to recommendedMin) -->
                  <div
                    class="bpm-zone bpm-zone--extended-left"
                    :style="{ width: `${((recommendedMin - 60) / 120) * 100}%` }"
                  ></div>
                  <!-- Recommended zone -->
                  <div
                    class="bpm-zone bpm-zone--recommended"
                    :style="{
                      left: `${((recommendedMin - 60) / 120) * 100}%`,
                      width: `${((recommendedMax - recommendedMin) / 120) * 100}%`
                    }"
                  >
                    <div class="bpm-zone__glow"></div>
                  </div>
                  <!-- Right extended zone (recommendedMax to 180) -->
                  <div
                    class="bpm-zone bpm-zone--extended-right"
                    :style="{
                      left: `${((recommendedMax - 60) / 120) * 100}%`,
                      width: `${((180 - recommendedMax) / 120) * 100}%`
                    }"
                  ></div>

                  <!-- Boundary markers -->
                  <div class="bpm-boundary bpm-boundary--left" :style="{ left: `${((recommendedMin - 60) / 120) * 100}%` }">
                    <span class="bpm-boundary__label">{{ recommendedMin }}</span>
                  </div>
                  <div class="bpm-boundary bpm-boundary--right" :style="{ left: `${((recommendedMax - 60) / 120) * 100}%` }">
                    <span class="bpm-boundary__label">{{ recommendedMax }}</span>
                  </div>
                </div>

                <!-- Edge labels -->
                <div class="bpm-edge-labels">
                  <span class="bpm-edge-label">60</span>
                  <span class="bpm-edge-label">180</span>
                </div>

                <!-- Slider thumb position indicator -->
                <div
                  class="bpm-thumb-indicator"
                  :class="{ 'bpm-thumb-indicator--outside': !isInRecommendedRange }"
                  :style="{ left: `${((store.config.bpm - 60) / 120) * 100}%` }"
                >
                  <div class="bpm-thumb-indicator__pulse"></div>
                </div>

                <!-- Invisible range input -->
                <input
                  type="range"
                  class="bpm-slider bpm-slider--extended"
                  :value="store.config.bpm"
                  min="60"
                  max="180"
                  @input="updateBpm"
                />
              </div>

              <div class="tempo-presets tempo-presets--compact">
                <button
                  v-for="(preset, index) in dynamicTempoPresets"
                  :key="index"
                  class="tempo-preset tempo-preset--compact"
                  :class="{
                    'tempo-preset--active': isPresetActive(preset.bpm, index),
                    'tempo-preset--default': preset.isDefault
                  }"
                  @click="store.setBpm(preset.bpm)"
                >
                  <span class="tempo-preset__bpm">{{ preset.bpm }}</span>
                  <span v-if="preset.isDefault" class="tempo-preset__star">★</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Advanced Settings -->
      <section class="setting-section advanced-section">
        <div class="advanced-header" @click="expandedModules.size === 0 ? Object.keys({'track':1,'instruments':1,'melody':1,'harmony':1,'output':1}).forEach(m => expandedModules.add(m as RackModule)) : expandedModules.clear(); expandedModules = new Set(expandedModules)">
          <h3 class="setting-label">
            <span class="setting-label__icon">⚙</span>
            <span>{{ t('settingsStep.advanced.toggle') }}</span>
          </h3>
          <span class="advanced-expand-hint">{{ expandedModules.size > 0 ? '▲' : '▼' }}</span>
        </div>

        <!-- TRACK Panel -->
        <div class="settings-panel" :class="{ 'settings-panel--open': isModuleExpanded('track') }">
          <button class="settings-panel__header" @click="toggleModule('track')">
            <span class="settings-panel__title">{{ t('settingsStep.advanced.compositionStyle.label') }}</span>
            <span class="settings-panel__value">{{ [t('settingsStep.rack.values.lead'), t('settingsStep.rack.values.motif'), t('settingsStep.rack.values.synth')][store.config.compositionStyle] }}</span>
            <span class="settings-panel__chevron">›</span>
          </button>
          <div v-show="isModuleExpanded('track')" class="settings-panel__body">
            <!-- Composition Mode -->
            <div class="param-group">
              <label class="param-label">{{ t('settingsStep.rack.params.mode') }}</label>
              <p class="param-desc">{{ t('settingsStep.advanced.compositionStyle.description') }}</p>
              <div class="option-cards">
                <button
                  v-for="option in compositionStyleOptions"
                  :key="option.key"
                  class="option-card"
                  :class="{ 'option-card--active': store.config.compositionStyle === option.value }"
                  @click="store.config.compositionStyle = option.value"
                >
                  <span class="option-card__icon">{{ option.icon }}</span>
                  <span class="option-card__label">{{ t(`settingsStep.advanced.compositionStyle.options.${option.key}`) }}</span>
                  <span class="option-card__desc">{{ t(`settingsStep.advanced.compositionStyle.options.${option.key}Desc`) }}</span>
                </button>
              </div>
            </div>

            <!-- Motif Settings (when BackgroundMotif) -->
            <template v-if="store.config.compositionStyle === 1">
              <div class="param-row">
                <div class="param-group param-group--half">
                  <label class="param-label">{{ t('settingsStep.rack.params.scope') }}</label>
                  <p class="param-desc">{{ t('settingsStep.advanced.compositionStyle.motifSettings.repeatScope') }}</p>
                  <div class="toggle-group">
                    <button class="toggle-btn" :class="{ 'toggle-btn--active': store.config.motifRepeatScope === 0 }" @click="store.config.motifRepeatScope = 0">{{ t('settingsStep.advanced.compositionStyle.motifSettings.repeatScopeOptions.fullSong') }}</button>
                    <button class="toggle-btn" :class="{ 'toggle-btn--active': store.config.motifRepeatScope === 1 }" @click="store.config.motifRepeatScope = 1">{{ t('settingsStep.advanced.compositionStyle.motifSettings.repeatScopeOptions.section') }}</button>
                  </div>
                </div>
                <div class="param-group param-group--half">
                  <label class="param-label">{{ t('settingsStep.advanced.compositionStyle.motifSettings.maxChordCount') }}</label>
                  <p class="param-desc">{{ t('settingsStep.advanced.compositionStyle.motifSettings.maxChordCountHint') }}</p>
                  <div class="slider-row">
                    <input type="range" v-model.number="store.config.motifMaxChordCount" min="0" max="8" class="param-slider" />
                    <span class="param-value">{{ store.config.motifMaxChordCount === 0 ? '∞' : store.config.motifMaxChordCount }}</span>
                  </div>
                </div>
              </div>
              <label class="switch-row">
                <input type="checkbox" v-model="store.config.motifFixedProgression" />
                <span class="switch-track"></span>
                <div class="switch-content">
                  <span class="switch-label">{{ t('settingsStep.advanced.compositionStyle.motifSettings.fixedProgression') }}</span>
                  <span class="switch-desc">{{ t('settingsStep.advanced.compositionStyle.motifSettings.fixedProgressionDesc') }}</span>
                </div>
              </label>
            </template>

            <!-- Arrangement -->
            <div class="param-group">
              <label class="param-label">{{ t('settingsStep.advanced.arrangement.label') }}</label>
              <p class="param-desc">{{ t('settingsStep.advanced.arrangement.growth') }}</p>
              <div class="toggle-group">
                <button class="toggle-btn" :class="{ 'toggle-btn--active': store.config.arrangementGrowth === 0 }" @click="store.config.arrangementGrowth = 0">
                  <span>{{ t('settingsStep.advanced.arrangement.growthOptions.layerAdd') }}</span>
                </button>
                <button class="toggle-btn" :class="{ 'toggle-btn--active': store.config.arrangementGrowth === 1 }" @click="store.config.arrangementGrowth = 1">
                  <span>{{ t('settingsStep.advanced.arrangement.growthOptions.registerAdd') }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- INSTRUMENTS Panel -->
        <div class="settings-panel" :class="{ 'settings-panel--open': isModuleExpanded('instruments') }">
          <button class="settings-panel__header" @click="toggleModule('instruments')">
            <span class="settings-panel__title">{{ t('settingsStep.rack.modules.inst') }}</span>
            <span class="settings-panel__value">
              {{ store.config.drumsEnabled ? 'Drums' : '' }}{{ store.config.drumsEnabled && store.config.arpeggioEnabled ? ' + ' : '' }}{{ store.config.arpeggioEnabled ? 'Arp' : '' }}{{ !store.config.drumsEnabled && !store.config.arpeggioEnabled ? t('settingsStep.rack.values.off') : '' }}
            </span>
            <span class="settings-panel__chevron">›</span>
          </button>
          <div v-show="isModuleExpanded('instruments')" class="settings-panel__body">
            <!-- Drums -->
            <label class="switch-row switch-row--main">
              <input type="checkbox" v-model="store.config.drumsEnabled" />
              <span class="switch-track"></span>
              <div class="switch-content">
                <span class="switch-label">{{ t('settingsStep.advanced.drums.label') }}</span>
                <span class="switch-desc">{{ t('settingsStep.advanced.drums.description') }}</span>
              </div>
            </label>

            <!-- Arpeggio -->
            <div class="param-section">
              <label class="switch-row switch-row--main" :class="{ 'switch-row--forced': isSynthDriven }">
                <input type="checkbox" v-model="store.config.arpeggioEnabled" :disabled="isSynthDriven" />
                <span class="switch-track"></span>
                <div class="switch-content">
                  <span class="switch-label">{{ t('settingsStep.advanced.arpeggio.label') }}</span>
                  <span class="switch-desc">{{ t('settingsStep.advanced.arpeggio.description') }}</span>
                </div>
                <span v-if="isSynthDriven" class="auto-badge">{{ t('settingsStep.rack.values.auto') }}</span>
              </label>

              <template v-if="store.config.arpeggioEnabled">
                <div class="param-row">
                  <div class="param-group param-group--half">
                    <label class="param-label">{{ t('settingsStep.advanced.arpeggio.pattern') }}</label>
                    <p class="param-desc">{{ t('settingsStep.advanced.arpeggio.patternHint') }}</p>
                    <div class="btn-group">
                      <button v-for="(p, i) in ['up', 'down', 'updown', 'random']" :key="i" class="btn-option" :class="{ 'btn-option--active': store.config.arpeggioPattern === i }" @click="store.config.arpeggioPattern = i">{{ t(`settingsStep.advanced.arpeggio.patterns.${p}`) }}</button>
                    </div>
                  </div>
                  <div class="param-group param-group--half">
                    <label class="param-label">{{ t('settingsStep.advanced.arpeggio.speed') }}</label>
                    <p class="param-desc">{{ t('settingsStep.advanced.arpeggio.speedHint') }}</p>
                    <div class="btn-group">
                      <button v-for="(s, i) in ['eighth', 'sixteenth', 'triplet']" :key="i" class="btn-option" :class="{ 'btn-option--active': store.config.arpeggioSpeed === i }" @click="store.config.arpeggioSpeed = i">{{ t(`settingsStep.advanced.arpeggio.speeds.${s}`) }}</button>
                    </div>
                  </div>
                </div>
                <div class="param-row">
                  <div class="param-group param-group--half">
                    <label class="param-label">{{ t('settingsStep.advanced.arpeggio.octaveRange') }}</label>
                    <p class="param-desc">{{ t('settingsStep.advanced.arpeggio.octaveRangeHint') }}</p>
                    <div class="slider-row">
                      <input type="range" v-model.number="store.config.arpeggioOctaveRange" min="1" max="3" class="param-slider" />
                      <span class="param-value">{{ store.config.arpeggioOctaveRange }}</span>
                    </div>
                  </div>
                  <div class="param-group param-group--half">
                    <label class="param-label">{{ t('settingsStep.advanced.arpeggio.gate') }}</label>
                    <p class="param-desc">{{ t('settingsStep.advanced.arpeggio.gateHint') }}</p>
                    <div class="slider-row">
                      <input type="range" v-model.number="store.config.arpeggioGate" min="10" max="100" class="param-slider" />
                      <span class="param-value">{{ store.config.arpeggioGate }}%</span>
                    </div>
                  </div>
                </div>
                <label class="switch-row">
                  <input type="checkbox" v-model="store.config.arpeggioSyncChord" />
                  <span class="switch-track"></span>
                  <div class="switch-content">
                    <span class="switch-label">{{ t('settingsStep.advanced.arpeggio.syncChord') }}</span>
                    <span class="switch-desc">{{ t('settingsStep.advanced.arpeggio.syncChordDesc') }}</span>
                  </div>
                </label>
              </template>
            </div>

            <!-- Humanize -->
            <div class="param-section">
              <label class="switch-row switch-row--main">
                <input type="checkbox" v-model="store.config.humanize" />
                <span class="switch-track"></span>
                <div class="switch-content">
                  <span class="switch-label">{{ t('settingsStep.advanced.humanize.label') }}</span>
                  <span class="switch-desc">{{ t('settingsStep.advanced.humanize.description') }}</span>
                </div>
              </label>
              <template v-if="store.config.humanize">
                <div class="param-row">
                  <div class="param-group param-group--half">
                    <label class="param-label">{{ t('settingsStep.advanced.humanize.timing') }}</label>
                    <p class="param-desc">{{ t('settingsStep.advanced.humanize.timingHint') }}</p>
                    <div class="slider-row">
                      <input type="range" v-model.number="store.config.humanizeTiming" min="0" max="100" class="param-slider" />
                      <span class="param-value">{{ store.config.humanizeTiming }}%</span>
                    </div>
                  </div>
                  <div class="param-group param-group--half">
                    <label class="param-label">{{ t('settingsStep.advanced.humanize.velocity') }}</label>
                    <p class="param-desc">{{ t('settingsStep.advanced.humanize.velocityHint') }}</p>
                    <div class="slider-row">
                      <input type="range" v-model.number="store.config.humanizeVelocity" min="0" max="100" class="param-slider" />
                      <span class="param-value">{{ store.config.humanizeVelocity }}%</span>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- HARMONY Panel -->
        <div class="settings-panel" :class="{ 'settings-panel--open': isModuleExpanded('harmony') }">
          <button class="settings-panel__header" @click="toggleModule('harmony')">
            <span class="settings-panel__title">{{ t('settingsStep.advanced.chordExt.label') }}</span>
            <span class="settings-panel__value">
              {{ store.config.chordExtSus ? 'Sus' : '' }}{{ store.config.chordExt7th ? ' 7th' : '' }}{{ store.config.chordExt9th ? ' 9th' : '' }}{{ store.config.modulationTiming !== 0 ? ' +Mod' : '' }}{{ !store.config.chordExtSus && !store.config.chordExt7th && !store.config.chordExt9th && store.config.modulationTiming === 0 ? t('settingsStep.rack.values.basic') : '' }}
            </span>
            <span class="settings-panel__chevron">›</span>
          </button>
          <div v-show="isModuleExpanded('harmony')" class="settings-panel__body">
            <!-- Chord Extensions -->
            <p class="section-desc">{{ t('settingsStep.advanced.chordExt.desc1') }}</p>
            <div class="chord-ext-grid">
              <div class="chord-ext-card">
                <label class="chord-ext-toggle">
                  <input type="checkbox" v-model="store.config.chordExtSus" />
                  <span class="chord-ext-check"></span>
                  <div class="chord-ext-content">
                    <span class="chord-ext-name">{{ t('settingsStep.advanced.chordExt.sus') }}</span>
                    <span class="chord-ext-desc">{{ t('settingsStep.advanced.chordExt.susDesc') }}</span>
                  </div>
                </label>
                <div v-if="store.config.chordExtSus" class="chord-ext-slider">
                  <span class="chord-ext-hint">{{ t('settingsStep.advanced.chordExt.susHint') }}</span>
                  <div class="slider-row">
                    <input type="range" v-model.number="store.config.chordExtSusProb" min="0" max="100" class="param-slider" />
                    <span class="param-value">{{ store.config.chordExtSusProb }}%</span>
                  </div>
                </div>
              </div>
              <div class="chord-ext-card">
                <label class="chord-ext-toggle">
                  <input type="checkbox" v-model="store.config.chordExt7th" />
                  <span class="chord-ext-check"></span>
                  <div class="chord-ext-content">
                    <span class="chord-ext-name">{{ t('settingsStep.advanced.chordExt.seventh') }}</span>
                    <span class="chord-ext-desc">{{ t('settingsStep.advanced.chordExt.seventhDesc') }}</span>
                  </div>
                </label>
                <div v-if="store.config.chordExt7th" class="chord-ext-slider">
                  <span class="chord-ext-hint">{{ t('settingsStep.advanced.chordExt.seventhHint') }}</span>
                  <div class="slider-row">
                    <input type="range" v-model.number="store.config.chordExt7thProb" min="0" max="100" class="param-slider" />
                    <span class="param-value">{{ store.config.chordExt7thProb }}%</span>
                  </div>
                </div>
              </div>
              <div class="chord-ext-card">
                <label class="chord-ext-toggle">
                  <input type="checkbox" v-model="store.config.chordExt9th" />
                  <span class="chord-ext-check"></span>
                  <div class="chord-ext-content">
                    <span class="chord-ext-name">{{ t('settingsStep.advanced.chordExt.ninth') }}</span>
                    <span class="chord-ext-desc">{{ t('settingsStep.advanced.chordExt.ninthDesc') }}</span>
                  </div>
                </label>
                <div v-if="store.config.chordExt9th" class="chord-ext-slider">
                  <span class="chord-ext-hint">{{ t('settingsStep.advanced.chordExt.ninthHint') }}</span>
                  <div class="slider-row">
                    <input type="range" v-model.number="store.config.chordExt9thProb" min="0" max="100" class="param-slider" />
                    <span class="param-value">{{ store.config.chordExt9thProb }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modulation -->
            <div class="param-group">
              <label class="param-label">{{ t('settingsStep.advanced.modulation.timing') }}</label>
              <p class="param-desc">{{ t('settingsStep.advanced.modulation.description') }}</p>
              <div class="btn-group btn-group--wrap">
                <button v-for="option in modulationTimingOptions" :key="option.key" class="btn-option" :class="{ 'btn-option--active': store.config.modulationTiming === option.value }" @click="store.config.modulationTiming = option.value">{{ t(`settingsStep.advanced.modulation.timingOptions.${option.key}`) }}</button>
              </div>
            </div>
            <div v-if="store.config.modulationTiming !== 0" class="param-group">
              <label class="param-label">{{ t('settingsStep.advanced.modulation.semitones') }}</label>
              <p class="param-desc">{{ t('settingsStep.advanced.modulation.semitonesHint') }}</p>
              <div class="slider-row">
                <input type="range" v-model.number="store.config.modulationSemitones" min="1" max="4" class="param-slider" />
                <span class="param-value">+{{ store.config.modulationSemitones }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- OUTPUT Panel -->
        <div class="settings-panel" :class="{ 'settings-panel--open': isModuleExpanded('output') }">
          <button class="settings-panel__header" @click="toggleModule('output')">
            <span class="settings-panel__title">{{ t('settingsStep.rack.modules.output') }}</span>
            <span class="settings-panel__value">{{ formattedDuration }}{{ store.config.callEnabled ? ' + Call' : '' }}</span>
            <span class="settings-panel__chevron">›</span>
          </button>
          <div v-show="isModuleExpanded('output')" class="settings-panel__body">
            <!-- Duration -->
            <div class="param-group">
              <div class="duration-header">
                <label class="param-label">{{ t('settingsStep.duration.label') }}</label>
                <span class="duration-display">{{ formattedDuration }}</span>
              </div>
              <p class="param-desc">{{ t('settingsStep.duration.description') }}</p>
              <div class="duration-presets">
                <button v-for="preset in durationPresets" :key="preset.seconds" class="duration-btn" :class="{ 'duration-btn--active': store.config.targetDurationSeconds === preset.seconds }" @click="store.config.targetDurationSeconds = preset.seconds">{{ preset.label }}</button>
              </div>
              <div class="slider-row">
                <input type="range" v-model.number="store.config.targetDurationSeconds" min="60" max="300" step="15" class="param-slider" />
              </div>
            </div>

            <!-- Call/Response -->
            <div class="param-section">
              <p class="section-desc">{{ t('settingsStep.advanced.se.description') }}</p>
              <label class="switch-row switch-row--main">
                <input type="checkbox" v-model="store.config.callEnabled" />
                <span class="switch-track"></span>
                <div class="switch-content">
                  <span class="switch-label">{{ t('settingsStep.advanced.se.callEnabled') }}</span>
                  <span class="switch-desc">{{ t('settingsStep.advanced.se.callEnabledDesc') }}</span>
                </div>
              </label>
              <template v-if="store.config.callEnabled">
                <label class="switch-row">
                  <input type="checkbox" v-model="store.config.callNotesEnabled" />
                  <span class="switch-track"></span>
                  <span class="switch-label">{{ t('settingsStep.advanced.se.callNotesEnabled') }}</span>
                </label>
                <div class="param-group">
                  <label class="param-label">{{ t('settingsStep.advanced.se.introChant') }}</label>
                  <p class="param-desc">{{ t('settingsStep.advanced.se.introChantDesc') }}</p>
                  <div class="btn-group">
                    <button v-for="option in introChantOptions" :key="option.key" class="btn-option" :class="{ 'btn-option--active': store.config.introChant === option.value }" @click="store.config.introChant = option.value">{{ t(`settingsStep.advanced.se.introChantOptions.${option.key}`) }}</button>
                  </div>
                </div>
                <div class="param-group">
                  <label class="param-label">{{ t('settingsStep.advanced.se.mixPattern') }}</label>
                  <p class="param-desc">{{ t('settingsStep.advanced.se.mixPatternDesc') }}</p>
                  <div class="btn-group">
                    <button v-for="option in mixPatternOptions" :key="option.key" class="btn-option" :class="{ 'btn-option--active': store.config.mixPattern === option.value }" @click="store.config.mixPattern = option.value">{{ t(`settingsStep.advanced.se.mixPatternOptions.${option.key}`) }}</button>
                  </div>
                </div>
                <div class="param-group">
                  <label class="param-label">{{ t('settingsStep.advanced.se.callDensity') }}</label>
                  <p class="param-desc">{{ t('settingsStep.advanced.se.callDensityDesc') }}</p>
                  <div class="btn-group">
                    <button v-for="option in callDensityOptions" :key="option.key" class="btn-option" :class="{ 'btn-option--active': store.config.callDensity === option.value }" @click="store.config.callDensity = option.value">{{ t(`settingsStep.advanced.se.callDensityOptions.${option.key}`) }}</button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </section>
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

/* Combined Key & Tempo Section */
.setting-section--combined {
  padding: 1rem 1.25rem;
}

.key-tempo-grid {
  display: grid;
  grid-template-columns: minmax(200px, 280px) 1px 1fr;
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 640px) {
  .key-tempo-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .key-tempo-divider {
    display: none;
  }
}

.key-panel,
.tempo-panel {
  display: flex;
  flex-direction: column;
}

.key-tempo-divider {
  width: 1px;
  height: 100%;
  min-height: 120px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(139, 92, 246, 0.2) 20%,
    rgba(139, 92, 246, 0.3) 50%,
    rgba(139, 92, 246, 0.2) 80%,
    transparent 100%
  );
}

.setting-label--compact {
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
}

/* Compact Key Info */
.key-info--compact {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.key-info--compact .key-info__value {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--step-accent);
}

.key-info--compact .key-info__wave {
  color: var(--step-accent);
  animation: waveAnimation 0.5s ease-in-out infinite;
}

/* Compact BPM Control */
.bpm-control--compact {
  gap: 0.75rem;
}

.bpm-display--compact {
  gap: 0.75rem;
  justify-content: center;
}

.bpm-display--compact .bpm-display__value {
  font-size: 2.5rem;
}

/* Compact Metronome */
.metronome--compact {
  width: 36px;
  height: 36px;
}

.metronome--compact .metronome__dot {
  width: 12px;
  height: 12px;
}

/* BPM Range Warning - Industrial/DAW aesthetic */
.bpm-range-warning {
  position: absolute;
  bottom: -5.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 100px;
  white-space: nowrap;
}

.bpm-range-warning__indicator {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #F59E0B;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.5);
  animation: warningPulse 1.2s ease-in-out infinite;
}

@keyframes warningPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.bpm-range-warning__text {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  color: #FBBF24;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.bpm-range-warning__hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(251, 191, 36, 0.5);
  padding-left: 0.375rem;
  border-left: 1px solid rgba(245, 158, 11, 0.15);
}

/* Warning transition */
.bpm-warning-enter-active {
  animation: warningSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bpm-warning-leave-active {
  animation: warningSlideOut 0.2s ease-in forwards;
}

@keyframes warningSlideIn {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(-4px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@keyframes warningSlideOut {
  0% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-4px) scale(0.95);
  }
}

/* Compact Tempo Presets */
.tempo-presets--compact {
  gap: 0.375rem;
  flex-wrap: wrap;
}

.tempo-preset--compact {
  width: auto;
  min-width: 50px;
  padding: 0.4rem 0.6rem;
  flex-direction: row;
  gap: 0.25rem;
}

.tempo-preset--compact .tempo-preset__bpm {
  font-size: 0.85rem;
}

.tempo-preset--compact .tempo-preset__star {
  position: static;
  font-size: 0.6rem;
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

/* Compact Piano Keyboard */
.piano-keyboard--compact {
  height: 160px;
  margin-bottom: 0;
  padding: 8px 6px 6px;
  border-radius: 10px;
}

.piano-keyboard--compact .piano-key--white {
  border-radius: 0 0 5px 5px;
}

.piano-keyboard--compact .piano-key__label {
  font-size: 0.6rem;
  bottom: 4px;
}

.piano-keyboard--compact .piano-key--black {
  width: 28px;
  height: calc(70% + 10px);
  border-radius: 0 0 4px 4px;
}

.piano-keyboard--compact .piano-key--black .piano-key__label {
  font-size: 0.5rem;
  bottom: 3px;
}

.piano-keyboard--compact .piano-black-keys {
  top: 6px;
  left: 6px;
  right: 6px;
}

.piano-keyboard--compact {
  padding-top: 6px;
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
  position: relative;
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

.bpm-slider-wrap--extended {
  height: auto;
  padding-top: 8px;
  padding-bottom: 24px;
}

/* Edge labels (60 and 180) */
.bpm-edge-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.bpm-edge-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.3);
}

/* Boundary markers */
.bpm-boundary {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  transform: translateX(-50%);
  z-index: 2;
}

.bpm-boundary::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: linear-gradient(180deg,
    rgba(139, 92, 246, 0.9) 0%,
    rgba(139, 92, 246, 0.6) 100%
  );
  border-radius: 1px;
  box-shadow: 0 0 6px rgba(139, 92, 246, 0.5);
}

.bpm-boundary__label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--step-accent);
  white-space: nowrap;
  text-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
}

/* Multi-zone track */
.bpm-track-zones {
  position: relative;
  height: 10px;
  border-radius: 5px;
  overflow: visible;
  background: rgba(30, 30, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.bpm-zone {
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.3s ease;
}

.bpm-zone--extended-left {
  left: 0;
  background: linear-gradient(90deg,
    rgba(100, 100, 120, 0.2) 0%,
    rgba(100, 100, 120, 0.15) 100%
  );
  border-radius: 5px 0 0 5px;
}

.bpm-zone--extended-right {
  background: linear-gradient(90deg,
    rgba(100, 100, 120, 0.15) 0%,
    rgba(100, 100, 120, 0.2) 100%
  );
  border-radius: 0 5px 5px 0;
}

.bpm-zone--recommended {
  background: linear-gradient(90deg,
    rgba(139, 92, 246, 0.3) 0%,
    rgba(139, 92, 246, 0.45) 50%,
    rgba(236, 72, 153, 0.3) 100%
  );
  border-top: 1px solid rgba(139, 92, 246, 0.5);
  border-bottom: 1px solid rgba(139, 92, 246, 0.5);
  box-shadow:
    inset 0 0 8px rgba(139, 92, 246, 0.3),
    0 0 12px rgba(139, 92, 246, 0.2);
  overflow: hidden;
}

.bpm-zone__glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(139, 92, 246, 0.15) 50%,
    transparent 100%
  );
  animation: zoneGlow 3s ease-in-out infinite;
}

@keyframes zoneGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* Thumb indicator */
.bpm-thumb-indicator {
  position: absolute;
  top: 8px;
  width: 18px;
  height: 18px;
  margin-left: -9px;
  margin-top: -4px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A78BFA 0%, #8B5CF6 50%, #7C3AED 100%);
  box-shadow:
    0 0 12px rgba(139, 92, 246, 0.6),
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
  transition: transform 0.1s ease, box-shadow 0.2s ease;
  z-index: 3;
  pointer-events: none;
}

.bpm-thumb-indicator::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
  opacity: 0.9;
}

.bpm-thumb-indicator__pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid rgba(139, 92, 246, 0.5);
  animation: thumbPulse 1.5s ease-out infinite;
  opacity: 0;
}

@keyframes thumbPulse {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

.bpm-thumb-indicator--outside {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%);
  box-shadow:
    0 0 16px rgba(245, 158, 11, 0.6),
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.bpm-thumb-indicator--outside .bpm-thumb-indicator__pulse {
  border-color: rgba(245, 158, 11, 0.5);
}

/* Extended slider input */
.bpm-slider--extended {
  position: absolute;
  top: 8px;
  width: 100%;
  height: 18px;
  margin-top: -4px;
  opacity: 0;
  cursor: pointer;
  z-index: 4;
}

/* BPM value outside indicator */
.bpm-display__value--outside {
  color: #F59E0B !important;
  text-shadow: 0 0 40px rgba(245, 158, 11, 0.4) !important;
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

/* Advanced Settings Section */
.advanced-section {
  margin-top: 1.5rem;
}

.advanced-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-radius: 12px;
  transition: background 0.2s ease;
}

.advanced-header:hover {
  background: rgba(139, 92, 246, 0.05);
}

.advanced-expand-hint {
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.4);
  transition: transform 0.2s ease;
}

/* Hint Bar */
.hint-bar {
  min-height: 1.5rem;
  padding: 0 1rem;
  margin-bottom: 0.5rem;
}

/* Settings Panel (Accordion) */
.settings-panel {
  border-radius: 12px;
  margin-bottom: 0.5rem;
  background: rgba(20, 20, 28, 0.4);
  border: 1px solid rgba(139, 92, 246, 0.1);
  overflow: hidden;
  transition: all 0.2s ease;
}

.settings-panel:hover {
  border-color: rgba(139, 92, 246, 0.2);
}

.settings-panel--open {
  border-color: rgba(139, 92, 246, 0.25);
  background: rgba(20, 20, 28, 0.6);
}

.settings-panel__header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  gap: 0.75rem;
}

.settings-panel__header:hover {
  background: rgba(139, 92, 246, 0.05);
}

.settings-panel__title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #FAFAFA;
}

.settings-panel__value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8rem;
  color: rgba(167, 139, 250, 0.8);
  margin-left: auto;
}

.settings-panel__chevron {
  font-size: 1rem;
  color: rgba(250, 250, 250, 0.3);
  transition: transform 0.2s ease;
}

.settings-panel--open .settings-panel__chevron {
  transform: rotate(90deg);
}

.settings-panel__body {
  padding: 1rem 1.25rem 1.25rem;
  border-top: 1px solid rgba(139, 92, 246, 0.1);
}

/* Param Group */
.param-group {
  margin-bottom: 1rem;
}

.param-group:last-child {
  margin-bottom: 0;
}

.param-group--half {
  flex: 1;
  min-width: 0;
}

.param-group--third {
  flex: 1;
  min-width: 0;
}

.param-label {
  display: block;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.9);
  margin-bottom: 0.25rem;
}

.param-desc {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.5);
  margin: 0 0 0.75rem;
  line-height: 1.5;
}

.section-desc {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.5);
  margin: 0 0 1rem;
  line-height: 1.5;
}

.param-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.param-row:last-child {
  margin-bottom: 0;
}

.param-section {
  padding-top: 0.75rem;
  margin-top: 0.75rem;
  border-top: 1px solid rgba(139, 92, 246, 0.08);
}

/* Option Cards (for composition mode) */
.option-cards {
  display: flex;
  gap: 0.5rem;
}

.option-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem 0.5rem;
  background: rgba(30, 30, 42, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-card:hover:not(.option-card--active) {
  background: rgba(40, 40, 55, 0.6);
  border-color: rgba(139, 92, 246, 0.25);
}

.option-card--active {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 16px -4px rgba(139, 92, 246, 0.3);
}

.option-card__icon {
  font-size: 1.25rem;
}

.option-card__label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.8);
}

.option-card__desc {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.7rem;
  color: rgba(250, 250, 250, 0.45);
  text-align: center;
  line-height: 1.3;
}

.option-card--active .option-card__label {
  color: #FAFAFA;
}

.option-card--active .option-card__desc {
  color: rgba(250, 250, 250, 0.7);
}

/* Toggle Group */
.toggle-group {
  display: flex;
  gap: 0.25rem;
  background: rgba(20, 20, 28, 0.6);
  border-radius: 8px;
  padding: 0.25rem;
}

.toggle-btn {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.5);
  cursor: pointer;
  transition: all 0.15s ease;
}

.toggle-btn:hover:not(.toggle-btn--active) {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(250, 250, 250, 0.7);
}

.toggle-btn--active {
  background: rgba(139, 92, 246, 0.2);
  color: #FAFAFA;
}

/* Button Group */
.btn-group {
  display: flex;
  gap: 0.375rem;
}

.btn-group--wrap {
  flex-wrap: wrap;
}

.btn-group--col {
  flex-direction: column;
}

.btn-option {
  flex: 1;
  padding: 0.5rem 0.625rem;
  background: rgba(30, 30, 42, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 8px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.6);
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 0;
}

.btn-option:hover:not(.btn-option--active) {
  background: rgba(40, 40, 55, 0.6);
  border-color: rgba(139, 92, 246, 0.2);
  color: rgba(250, 250, 250, 0.8);
}

.btn-option--active {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  color: #FAFAFA;
}

/* Slider Row */
.slider-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.param-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--step-accent);
  min-width: 2.5rem;
  text-align: right;
}

.param-value--mini {
  font-size: 0.75rem;
  min-width: 2rem;
}

/* Param Slider */
.param-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 3px;
  cursor: pointer;
}

.param-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: linear-gradient(180deg, #a78bfa 0%, #8b5cf6 100%);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}

.param-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: linear-gradient(180deg, #a78bfa 0%, #8b5cf6 100%);
  border-radius: 50%;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}

.param-slider--mini {
  height: 4px;
}

.param-slider--mini::-webkit-slider-thumb {
  width: 12px;
  height: 12px;
}

/* Switch Row */
.switch-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.375rem 0;
}

.switch-row input {
  display: none;
}

.switch-track {
  width: 36px;
  height: 20px;
  background: rgba(60, 60, 80, 0.5);
  border-radius: 10px;
  position: relative;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.switch-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  background: rgba(180, 180, 200, 0.6);
  border-radius: 50%;
  transition: all 0.2s ease;
}

.switch-row input:checked + .switch-track {
  background: rgba(139, 92, 246, 0.5);
}

.switch-row input:checked + .switch-track::after {
  left: 19px;
  background: #a78bfa;
  box-shadow: 0 0 8px rgba(167, 139, 250, 0.5);
}

.switch-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.switch-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.7);
}

.switch-desc {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.45);
  line-height: 1.4;
}

.switch-row input:checked ~ .switch-label,
.switch-row input:checked ~ * .switch-label,
.switch-row input:checked ~ .switch-content .switch-label {
  color: #FAFAFA;
}

.switch-row input:checked ~ .switch-content .switch-desc {
  color: rgba(250, 250, 250, 0.6);
}

.switch-row--main {
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
}

.switch-row--main .switch-label {
  font-size: 0.9rem;
  font-weight: 600;
}

.switch-row--forced {
  opacity: 0.7;
}

.auto-badge {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-left: auto;
}

/* Chord Extension Grid */
.chord-ext-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.chord-ext-card {
  background: rgba(30, 30, 42, 0.4);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.chord-ext-card:has(input:checked) {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
}

.chord-ext-toggle {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}

.chord-ext-toggle input {
  display: none;
}

.chord-ext-check {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.2s ease;
  position: relative;
}

.chord-ext-toggle input:checked + .chord-ext-check {
  background: var(--step-accent);
  border-color: var(--step-accent);
}

.chord-ext-toggle input:checked + .chord-ext-check::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
}

.chord-ext-content {
  flex: 1;
}

.chord-ext-name {
  display: block;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.9);
  margin-bottom: 0.25rem;
}

.chord-ext-toggle input:checked ~ .chord-ext-content .chord-ext-name {
  color: #FAFAFA;
}

.chord-ext-desc {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.5);
  line-height: 1.4;
}

.chord-ext-slider {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(139, 92, 246, 0.1);
}

.chord-ext-hint {
  display: block;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.4);
  margin-bottom: 0.5rem;
}

/* Duration Controls */
.duration-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.duration-display {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--step-accent);
}

.duration-presets {
  display: flex;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
}

.duration-btn {
  flex: 1;
  padding: 0.5rem 0.375rem;
  background: rgba(30, 30, 42, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.5);
  cursor: pointer;
  transition: all 0.15s ease;
}

.duration-btn:hover:not(.duration-btn--active) {
  background: rgba(40, 40, 55, 0.6);
  border-color: rgba(139, 92, 246, 0.2);
}

.duration-btn--active {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  color: var(--step-accent);
}

@media (max-width: 480px) {
  .settings-panel__body {
    padding: 0.875rem 1rem 1rem;
  }

  .param-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .chord-ext-row {
    flex-direction: column;
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

.option-desc {
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.4);
  margin: 0.25rem 0 0.5rem;
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

.option-buttons--wrap {
  flex-wrap: wrap;
}

/* Call Settings */
.call-settings {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(139, 92, 246, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.toggle-label--disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.toggle-label--disabled .toggle-switch {
  background: var(--step-accent);
  opacity: 0.6;
}

.toggle-label--disabled .toggle-switch::after {
  transform: translateX(20px);
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

/* Motif Panel */
.motif-panel {
  margin-top: 1.25rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 1.25rem;
  position: relative;
  overflow: hidden;
}

.motif-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #8B5CF6, #6366F1, #8B5CF6);
  background-size: 200% 100%;
  animation: motifShimmer 3s ease-in-out infinite;
}

@keyframes motifShimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.motif-panel__header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 1rem;
}

.motif-panel__icon {
  font-size: 1.25rem;
}

.motif-panel__title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: #FAFAFA;
  margin: 0;
  letter-spacing: 0.02em;
}

.motif-panel__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

@media (max-width: 480px) {
  .motif-panel__grid {
    grid-template-columns: 1fr;
  }
}

/* Motif Card */
.motif-card {
  background: rgba(20, 20, 28, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  padding: 0.875rem;
}

.motif-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.motif-card__label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: block;
  margin-bottom: 0.625rem;
}

.motif-card__value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--step-accent);
  background: rgba(139, 92, 246, 0.15);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  min-width: 28px;
  text-align: center;
}

.motif-card__hint {
  font-size: 0.7rem;
  color: rgba(250, 250, 250, 0.4);
  margin: 0 0 0.625rem;
  line-height: 1.3;
}

/* Motif Toggle Group */
.motif-toggle-group {
  display: flex;
  gap: 0.375rem;
}

.motif-toggle {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.625rem 0.5rem;
  background: rgba(30, 30, 42, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 10px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.motif-toggle__icon {
  font-size: 1rem;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.motif-toggle:hover {
  border-color: rgba(139, 92, 246, 0.3);
  color: rgba(250, 250, 250, 0.9);
}

.motif-toggle:hover .motif-toggle__icon {
  opacity: 1;
}

.motif-toggle--active {
  background: rgba(139, 92, 246, 0.2);
  border-color: var(--step-accent);
  color: #FAFAFA;
  box-shadow: 0 0 16px -4px rgba(139, 92, 246, 0.4);
}

.motif-toggle--active .motif-toggle__icon {
  opacity: 1;
}

/* Motif Slider */
.motif-slider-wrap {
  position: relative;
  height: 6px;
}

.motif-slider {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.motif-slider__track {
  position: absolute;
  inset: 0;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 3px;
  overflow: hidden;
}

.motif-slider__fill {
  height: 100%;
  background: linear-gradient(90deg, #8B5CF6, #6366F1);
  border-radius: 3px;
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
  transition: width 0.1s ease;
}

/* Motif Switch */
.motif-switch {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem;
  background: rgba(20, 20, 28, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.motif-switch:hover {
  border-color: rgba(139, 92, 246, 0.25);
  background: rgba(139, 92, 246, 0.05);
}

.motif-switch__input {
  display: none;
}

.motif-switch__toggle {
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 22px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 11px;
  transition: all 0.25s ease;
  margin-top: 2px;
}

.motif-switch__toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.motif-switch__input:checked + .motif-switch__toggle {
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
  box-shadow: 0 0 12px -2px rgba(139, 92, 246, 0.5);
}

.motif-switch__input:checked + .motif-switch__toggle::after {
  transform: translateX(18px);
}

.motif-switch__content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.motif-switch__title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.9);
}

.motif-switch__desc {
  font-size: 0.7rem;
  color: rgba(250, 250, 250, 0.45);
  line-height: 1.4;
}

/* Motif Panel Transition */
.motif-panel-enter-active {
  animation: motifPanelIn 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.motif-panel-leave-active {
  animation: motifPanelOut 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes motifPanelIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes motifPanelOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
}

.subsection-title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.7);
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.subsection-title::before {
  content: '';
  width: 3px;
  height: 14px;
  background: var(--step-accent);
  border-radius: 2px;
}

.style-subsection {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(139, 92, 246, 0.1);
}

.subsection-desc {
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.45);
  margin: -0.5rem 0 1rem;
  line-height: 1.4;
}

/* Panel Section (for consolidated tabs) */
.panel-section {
  padding: 1rem 0;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.panel-section:first-child {
  padding-top: 0;
}

.panel-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.section-title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--step-accent);
  margin: 0 0 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title::before {
  content: '';
  width: 3px;
  height: 14px;
  background: var(--step-accent);
  border-radius: 2px;
}

/* Arrangement Cards */
.arrangement-cards {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.arrangement-card {
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

.arrangement-card:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.05);
  transform: translateX(4px);
}

.arrangement-card--active {
  background: rgba(139, 92, 246, 0.15);
  border-color: var(--step-accent);
  box-shadow: 0 0 20px -4px rgba(139, 92, 246, 0.3);
}

.arrangement-card__icon {
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

.arrangement-card--active .arrangement-card__icon {
  background: rgba(139, 92, 246, 0.25);
}

.arrangement-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.arrangement-card__title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: #FAFAFA;
}

.arrangement-card--active .arrangement-card__title {
  color: var(--step-accent);
}

.arrangement-card__desc {
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.5);
  line-height: 1.4;
}

.arrangement-card--active .arrangement-card__desc {
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

/* Rack labels with tooltips - use native title attribute */
.rack-param-label[title],
.rack-switch__label[title],
.rack-ext-toggle__box[title] {
  cursor: help;
}
</style>
