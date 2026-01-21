<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'
import { useI18n } from '@/composables/useI18n'
import { useMidiPlayer } from '@/composables/useMidiPlayer'
import { decodeShareUrl, type DecodedShare } from '@/utils/shareEncoder'
import { KEY_NAMES } from '@/utils/midiUtils'
import { songImages } from '@/data/songImages'
import { getBlueprintById, AUTO_BLUEPRINT_ID } from '@/data/blueprints'
import { getRecommendedBlueprintId } from '@/data/songImageBlueprint'
import NoteFlowVisualizer from '@/components/NoteFlowVisualizer.vue'

// Chord progression type from WASM
interface ChordProgression {
  id: number
  name: string
  display: string
}

const { t } = useI18n()
const { lang } = useData()

// Locale configuration
const locales = {
  en: { label: 'English', shortLabel: 'EN', path: '', demoLabel: 'Try it yourself' },
  ja: { label: '日本語', shortLabel: '日本語', path: '/ja', demoLabel: '自分も作ってみる' },
} as const

type LocaleKey = keyof typeof locales
const defaultLocale: LocaleKey = 'en'
const currentLocale = computed(() => locales[lang.value as LocaleKey] || locales[defaultLocale])
const localePath = (path: string) => `${currentLocale.value.path}${path}`

// State
const isLoading = ref(true)
const isGenerating = ref(false)
const error = ref<string | null>(null)
const decoded = ref<DecodedShare | null>(null)
const eventData = ref<any>(null)
const midiData = ref<Uint8Array | null>(null)
const chordProgressions = ref<ChordProgression[]>([])

let midisketch: any = null
let instance: any = null

// Mobile detection
const isMobile = ref(false)

// Player
const player = useMidiPlayer()
const {
  isPlaying,
  isPaused,
  isLoading: isSoundfontLoading,
  isReady: isSoundfontReady,
  currentTick,
  togglePlay: playerTogglePlay,
  rewind,
  preload,
  stop,
  play
} = player

// Blueprint label for summary
const blueprintLabel = computed(() => {
  if (!decoded.value) return '-'
  const config = decoded.value.config
  const blueprintId = config.blueprintId ?? AUTO_BLUEPRINT_ID
  const langKey = lang.value as 'en' | 'ja'

  if (blueprintId === AUTO_BLUEPRINT_ID) {
    // Find songImage by stylePresetId to get recommended blueprint
    const style = songImages.find(s => s.stylePresetIds.includes(config.stylePresetId ?? 0))
    const recId = getRecommendedBlueprintId(style?.id)
    const rec = getBlueprintById(recId)
    return `${rec?.label[langKey] ?? ''}${t('styleStep.arrangementStyle.recommended')}`
  }
  const bp = getBlueprintById(blueprintId)
  return bp?.label[langKey] ?? '-'
})

// Summary info - main row (compact items)
const summaryInfo = computed(() => {
  if (!decoded.value) return []
  const config = decoded.value.config

  // Find songImage by stylePresetId
  const style = songImages.find(s => s.stylePresetIds.includes(config.stylePresetId ?? 0))
  const styleName = style ? t(`songImages.${style.id}.name`) : '-'

  // Format duration
  const duration = config.targetDurationSeconds
  const durationStr = duration ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}` : '-'

  // Options summary
  const options: string[] = []
  if (config.drumsEnabled) options.push(t('preview.summary.drums'))
  if (config.arpeggioEnabled) options.push(t('preview.summary.arpeggio'))
  const optionsStr = options.length > 0 ? options.join(', ') : '-'

  return [
    { label: t('preview.summary.style'), value: styleName },
    { label: t('preview.summary.key'), value: KEY_NAMES[config.key || 0] || '-' },
    { label: t('preview.summary.bpm'), value: config.bpm || '-' },
    { label: t('preview.summary.length'), value: durationStr },
    { label: t('preview.summary.options'), value: optionsStr }
  ]
})

// Chord progression (separate row - can be long)
const chordDisplay = computed(() => {
  if (!decoded.value) return '-'
  const chord = chordProgressions.value.find(c => c.id === decoded.value!.config.chordProgressionId)
  return chord ? chord.display : '-'
})

function handleSeek(tick: number) {
  stop()
  if (eventData.value) {
    play(eventData.value, tick)
  }
}

async function togglePlay() {
  if (!eventData.value) return

  if (isPlaying.value || isPaused.value) {
    playerTogglePlay(eventData.value)
  } else {
    play(eventData.value)
  }
}

function download() {
  if (!midiData.value || !midisketch) return
  midisketch.downloadMidi(midiData.value, `midi-sketch-shared-${Date.now()}.mid`)
}

onMounted(async () => {
  if (typeof window === 'undefined') return

  // Parse URL hash
  const hash = window.location.hash
  if (!hash) {
    error.value = t('preview.errors.noHash')
    isLoading.value = false
    return
  }

  decoded.value = decodeShareUrl(hash)
  if (!decoded.value) {
    error.value = t('preview.errors.parseFailed')
    isLoading.value = false
    return
  }

  // Validate seed (0 is invalid)
  // For vocal share, vocalSeed is required; for bgm share, seed is required
  const requiredSeed = decoded.value.shareType === 'vocal'
    ? decoded.value.config.vocalSeed
    : decoded.value.config.seed
  if (!requiredSeed) {
    error.value = t('preview.errors.invalidSeed')
    isLoading.value = false
    return
  }

  try {
    // Start soundfont preload
    preload()

    // Init WASM
    const mod = await import('@/wasm/index.js')
    midisketch = mod
    const wasmPath = new URL('@/wasm/midisketch.wasm', import.meta.url).href
    await mod.init({ wasmPath })
    instance = new mod.MidiSketch()

    // Load chord progressions from WASM
    const chords = midisketch.getChords()
    chordProgressions.value = chords.map((c: { name: string; display: string }, index: number) => ({
      id: index,
      name: c.name,
      display: c.display
    }))

    isLoading.value = false
    isGenerating.value = true

    const config = decoded.value.config

    // Validate vocalAttitude for the style
    const stylePresets = midisketch.getStylePresets()
    const stylePreset = stylePresets.find((p: any) => p.id === config.stylePresetId)
    let validatedVocalAttitude = config.vocalAttitude ?? 0
    if (stylePreset) {
      const allowedAttitudes = stylePreset.allowedAttitudes
      const attitudeFlag = 1 << validatedVocalAttitude
      if ((allowedAttitudes & attitudeFlag) === 0) {
        // Find first allowed attitude for this style
        for (let i = 0; i < 3; i++) {
          if ((allowedAttitudes & (1 << i)) !== 0) {
            validatedVocalAttitude = i
            break
          }
        }
      }
    }

    // Generate BGM first
    instance.generateFromConfig({
      stylePresetId: config.stylePresetId ?? 3,
      key: config.key ?? 0,
      bpm: config.bpm ?? 132,
      seed: config.seed ?? 0,
      chordProgressionId: config.chordProgressionId ?? 0,
      formId: config.formId ?? 5,
      vocalAttitude: validatedVocalAttitude,
      drumsEnabled: config.drumsEnabled ?? true,
      arpeggioEnabled: config.arpeggioEnabled ?? false,
      arpeggioPattern: config.arpeggioPattern ?? 0,
      arpeggioSpeed: config.arpeggioSpeed ?? 1,
      arpeggioOctaveRange: config.arpeggioOctaveRange ?? 2,
      arpeggioGate: config.arpeggioGate ?? 80,
      vocalLow: config.vocalLow ?? 57,
      vocalHigh: config.vocalHigh ?? 79,
      skipVocal: decoded.value.shareType === 'bgm',
      humanize: config.humanize ?? false,
      humanizeTiming: config.humanizeTiming ?? 50,
      humanizeVelocity: config.humanizeVelocity ?? 50,
      chordExtSus: config.chordExtSus ?? false,
      chordExt7th: config.chordExt7th ?? false,
      chordExt9th: config.chordExt9th ?? false,
      chordExtSusProb: config.chordExtSusProb ?? 20,
      chordExt7thProb: config.chordExt7thProb ?? 30,
      chordExt9thProb: config.chordExt9thProb ?? 25,
      seEnabled: config.seEnabled ?? true,
      compositionStyle: config.compositionStyle ?? 0,
      targetDurationSeconds: config.targetDurationSeconds ?? 150,
      modulationTiming: config.modulationTiming ?? 0,
      modulationSemitones: config.modulationSemitones ?? 2,
      callEnabled: config.callEnabled ?? false,
      callNotesEnabled: config.callNotesEnabled ?? true,
      introChant: config.introChant ?? 0,
      mixPattern: config.mixPattern ?? 0,
      callDensity: config.callDensity ?? 2,
      melodyTemplate: config.melodyTemplate ?? 0,
      arrangementGrowth: config.arrangementGrowth ?? 0,
      blueprintId: config.blueprintId ?? 255,
      arpeggioSyncChord: config.arpeggioSyncChord ?? true,
      motifRepeatScope: config.motifRepeatScope ?? 0,
      motifFixedProgression: config.motifFixedProgression ?? true,
      motifMaxChordCount: config.motifMaxChordCount ?? 4,
      melodicComplexity: config.melodicComplexity ?? 1,
      hookIntensity: config.hookIntensity ?? 2,
      vocalStyle: config.vocalStyle ?? 0,
      vocalGroove: config.vocalGroove ?? 0
    })

    // If vocal share, regenerate vocal with vocalSeed
    if (decoded.value.shareType === 'vocal') {
      instance.regenerateVocal({
        seed: config.vocalSeed ?? 0,
        vocalLow: config.vocalLow ?? 57,
        vocalHigh: config.vocalHigh ?? 79,
        vocalAttitude: validatedVocalAttitude,
        vocalStyle: config.vocalStyle ?? 0,
        melodyTemplate: config.melodyTemplate ?? 0,
        melodicComplexity: config.melodicComplexity ?? 1,
        hookIntensity: config.hookIntensity ?? 2,
        vocalGroove: config.vocalGroove ?? 0
      })
    }

    midiData.value = instance.getMidi()
    eventData.value = instance.getEvents()
    isGenerating.value = false
    // No auto-play - user must tap to start
  } catch (e: any) {
    error.value = e.message
    isLoading.value = false
    isGenerating.value = false
  }
})

// Handle hash change (for same-tab navigation)
function handleHashChange() {
  window.location.reload()
}

// Mobile detection using User-Agent
function checkMobile() {
  const ua = navigator.userAgent
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
}

onMounted(() => {
  window.addEventListener('hashchange', handleHashChange)
  checkMobile()
})

onUnmounted(() => {
  stop()
  window.removeEventListener('hashchange', handleHashChange)
})
</script>

<template>
  <div class="preview-page" :class="`preview-page--${lang}`">
    <!-- Ambient Background -->
    <div class="preview-page__backdrop">
      <div class="preview-page__grid"></div>
      <div class="preview-page__orb preview-page__orb--1"></div>
      <div class="preview-page__orb preview-page__orb--2"></div>
      <div class="preview-page__noise"></div>
    </div>

    <!-- Main Content -->
    <main class="preview-page__main">
      <div class="preview-card">
        <!-- Header -->
        <div class="preview-card__header">
          <div class="preview-card__logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            <span>MIDI Sketch</span>
          </div>
          <span class="preview-card__badge" v-if="decoded">
            {{ decoded.shareType === 'vocal' ? t('preview.typeVocal') : t('preview.typeBgm') }}
          </span>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading || isGenerating" class="preview-card__loading">
          <div class="preview-card__spinner"></div>
          <p>{{ isGenerating ? t('preview.generatingMusic') : t('preview.loading') }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="preview-card__error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <p>{{ error }}</p>
          <a :href="localePath('/')" class="preview-card__try-btn">
            {{ currentLocale.demoLabel }}
          </a>
        </div>

        <!-- Player -->
        <template v-else>
          <!-- 3D Note Flow Visualizer -->
          <div class="preview-card__player">
            <NoteFlowVisualizer
              v-if="eventData"
              :events="eventData"
              :current-tick="currentTick"
              :is-playing="isPlaying"
              :bpm="decoded?.config?.bpm ?? 120"
            />
          </div>

          <!-- Summary - Synthwave Style -->
          <div class="preview-card__summary">
            <div class="summary-row summary-row--main">
              <div v-for="item in summaryInfo" :key="item.label" class="summary-item">
                <span class="summary-item__label">{{ item.label }}</span>
                <span class="summary-item__value">{{ item.value }}</span>
              </div>
            </div>
            <div class="summary-row summary-row--secondary">
              <div class="summary-chip">
                <span class="summary-chip__label">{{ t('styleStep.arrangementStyle.title') }}</span>
                <span class="summary-chip__value">{{ blueprintLabel }}</span>
              </div>
              <div class="summary-chip summary-chip--chord">
                <span class="summary-chip__label">{{ t('preview.summary.chord') }}</span>
                <span class="summary-chip__value">{{ chordDisplay }}</span>
              </div>
            </div>
          </div>

          <!-- Controls -->
          <div class="preview-card__controls">
            <!-- Rewind Button -->
            <button
              class="control-btn control-btn--rewind"
              @click="rewind"
              :disabled="!isSoundfontReady"
              :title="t('preview.rewind')"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
              </svg>
            </button>

            <!-- Play/Pause Button -->
            <button
              class="control-btn control-btn--play"
              @click="togglePlay"
              :disabled="!isSoundfontReady"
            >
              <svg v-if="isPlaying" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
              <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span>{{ isPlaying ? t('preview.pause') : t('preview.play') }}</span>
            </button>

            <!-- Download Button (Desktop only) -->
            <button
              v-if="!isMobile"
              class="control-btn control-btn--download"
              @click="download"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              <span>{{ t('preview.download') }}</span>
            </button>
          </div>

          <!-- Info Section -->
          <div class="preview-card__info">
            <p class="info-text">{{ t('preview.infoText') }}</p>
            <a :href="localePath('/')" class="try-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
              <span>{{ currentLocale.demoLabel }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
              </svg>
            </a>
          </div>
        </template>
      </div>
    </main>

    <!-- Footer -->
    <footer class="preview-page__footer">
      <div class="preview-page__footer-inner">
        <a
          href="https://github.com/libraz/midi-sketch"
          target="_blank"
          rel="noopener noreferrer"
          class="preview-page__link"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

.preview-page {
  --preview-bg: #050508;
  --preview-purple: #8B5CF6;
  --preview-pink: #EC4899;
  --preview-green: #10B981;
  --preview-text: rgba(255, 255, 255, 0.9);
  --preview-text-muted: rgba(255, 255, 255, 0.5);

  min-height: 100vh;
  background: var(--preview-bg);
  display: flex;
  flex-direction: column;
  font-family: 'Instrument Sans', -apple-system, sans-serif;
}

/* Backdrop */
.preview-page__backdrop {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.preview-page__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 70%);
}

.preview-page__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
  animation: orb-float 25s ease-in-out infinite;
}

.preview-page__orb--1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--preview-purple) 0%, transparent 60%);
  top: -10%;
  left: 20%;
}

.preview-page__orb--2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--preview-green) 0%, transparent 60%);
  bottom: -5%;
  right: 10%;
  animation-delay: -10s;
}

@keyframes orb-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-20px, 20px) scale(1.05); }
}

.preview-page__noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.02;
}

/* Main */
.preview-page__main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  position: relative;
  z-index: 1;
}

/* Card */
.preview-card {
  width: 100%;
  max-width: 600px;
  background: rgba(20, 20, 28, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.preview-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.preview-card__logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--preview-purple);
  font-weight: 600;
  font-size: 1rem;
}

.preview-card__badge {
  padding: 0.25rem 0.75rem;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--preview-green);
}

/* Loading */
.preview-card__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
  color: var(--preview-text-muted);
}

.preview-card__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(139, 92, 246, 0.2);
  border-top-color: var(--preview-purple);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error */
.preview-card__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  gap: 1rem;
  text-align: center;
  color: var(--preview-text-muted);
}

.preview-card__error svg {
  color: rgba(239, 68, 68, 0.6);
}

.preview-card__try-btn {
  margin-top: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--preview-purple), var(--preview-pink));
  border-radius: 10px;
  color: white;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.preview-card__try-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
}

/* Player */
.preview-card__player {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
}

.preview-card__player :deep(.note-flow-visualizer) {
  border-radius: 12px;
  overflow: hidden;
}

/* Summary */
.preview-card__summary {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  background: rgba(0, 0, 0, 0.3);
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.summary-row--main {
  border-bottom: 1px solid rgba(139, 92, 246, 0.08);
}

.summary-row--secondary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
}

.summary-chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 100px;
}

.summary-chip__label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.55rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-chip__value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(168, 85, 247, 0.9);
}

.summary-chip--chord .summary-chip__value {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.5rem 0.875rem;
  position: relative;
}

.summary-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  bottom: 20%;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(168, 85, 247, 0.3),
    transparent
  );
}

.summary-item__label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-item__value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--preview-text);
}


/* Controls */
.preview-card__controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.2);
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 12px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Rewind Button */
.control-btn--rewind {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  padding: 0;
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: #A855F7;
}

.control-btn--rewind:hover:not(:disabled) {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.5);
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
}

.control-btn--rewind:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Play Button */
.control-btn--play {
  flex: 1;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #A855F7 0%, #7C3AED 100%);
  color: white;
  box-shadow:
    0 4px 15px rgba(168, 85, 247, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.control-btn--play:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 25px rgba(168, 85, 247, 0.5),
    0 0 40px rgba(168, 85, 247, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.control-btn--play:active:not(:disabled) {
  transform: translateY(0);
}

.control-btn--play:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Download Button */
.control-btn--download {
  flex: 1;
  padding: 0.875rem 1.5rem;
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.3);
  color: #A855F7;
}

.control-btn--download:hover {
  background: rgba(124, 58, 237, 0.2);
  border-color: rgba(124, 58, 237, 0.5);
  box-shadow: 0 0 20px rgba(124, 58, 237, 0.2);
}

/* Info */
.preview-card__info {
  padding: 1.25rem;
  background: rgba(139, 92, 246, 0.05);
  border-top: 1px solid rgba(139, 92, 246, 0.1);
}

.info-text {
  font-size: 0.8rem;
  color: var(--preview-text-muted);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.try-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(135deg, var(--preview-green), #059669);
  border-radius: 10px;
  color: white;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.try-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

/* Footer */
.preview-page__footer {
  position: relative;
  z-index: 2;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(to top, rgba(5, 5, 8, 0.9), transparent);
}

.preview-page__footer-inner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-page__link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.6rem;
  color: var(--preview-text-muted);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s;
}

.preview-page__link:hover {
  color: var(--preview-text);
  background: rgba(139, 92, 246, 0.1);
}

/* Hide VitePress chrome */
.preview-page :deep(.VPNav),
.preview-page :deep(.VPNavBar),
.preview-page :deep(.VPSidebar),
.preview-page :deep(.VPFooter),
.preview-page :deep(.VPLocalNav) {
  display: none !important;
}

/* Responsive */
@media (max-width: 640px) {
  .preview-page__main {
    padding: 1rem;
    align-items: flex-start;
  }

  .preview-card {
    border-radius: 16px;
  }

  .summary-row--main {
    flex-wrap: wrap;
  }

  .summary-item {
    padding: 0.5rem 0.75rem;
  }

  .summary-item__value {
    font-size: 0.75rem;
  }

  .summary-chip {
    padding: 0.2rem 0.5rem;
  }

  .summary-chip__value {
    font-size: 0.65rem;
  }

  .summary-chip--chord .summary-chip__value {
    max-width: 140px;
  }

  .preview-card__controls {
    flex-wrap: nowrap;
  }

  .control-btn--rewind {
    width: 44px;
    height: 44px;
  }

  .control-btn--play {
    flex: 1;
    min-width: 0;
  }
}
</style>
