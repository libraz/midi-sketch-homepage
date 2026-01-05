<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()
const isJa = computed(() => lang.value === 'ja')

const isLoading = ref(true)
const isGenerating = ref(false)
const error = ref<string | null>(null)
const midiData = ref<Uint8Array | null>(null)
const info = ref<string>('')

// Presets
const stylePresets = ref<any[]>([])
const structures = ref<any[]>([])
const selectedStyle = ref(0)
const selectedKey = ref(0)

const keys = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

// Module references
let midisketch: any = null
let instance: any = null

onMounted(async () => {
  if (typeof window === 'undefined') return

  try {
    // Dynamic import for client-side only
    const wasmUrl = new URL('./wasm/midisketch.wasm', import.meta.url).href
    const jsUrl = new URL('./wasm/midisketch.js', import.meta.url).href

    // Import the module
    midisketch = await import('./wasm/index.js')

    // Initialize
    const wasmPath = new URL('./wasm/midisketch.wasm', import.meta.url).href
    await midisketch.init({ wasmPath })

    // Load presets
    stylePresets.value = midisketch.getStylePresets()
    structures.value = midisketch.getStructures()

    // Create instance
    instance = new midisketch.MidiSketch()

    isLoading.value = false
  } catch (e: any) {
    error.value = e.message
    isLoading.value = false
  }
})

async function generate() {
  if (!instance) return

  isGenerating.value = true
  error.value = null
  midiData.value = null

  try {
    // Generate using simple params
    instance.generate({
      structureId: selectedStyle.value % structures.value.length,
      moodId: selectedStyle.value,
      key: selectedKey.value,
      seed: Math.floor(Math.random() * 0xFFFFFFFF)
    })

    midiData.value = instance.getMidi()
    const events = instance.getEvents()
    info.value = `${events.totalBars} bars, ${events.bpm} BPM, ${events.tracks?.length || 0} tracks`
  } catch (e: any) {
    error.value = e.message
  } finally {
    isGenerating.value = false
  }
}

function download() {
  if (!midiData.value || !midisketch) return
  midisketch.downloadMidi(midiData.value, 'midi-sketch.mid')
}
</script>

<template>
  <div class="midi-demo">
    <h3>{{ isJa ? 'MIDI 生成デモ' : 'MIDI Generation Demo' }}</h3>

    <div v-if="isLoading" class="loading">
      {{ isJa ? 'WASM モジュールを読み込み中...' : 'Loading WASM module...' }}
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <template v-else>
      <div class="controls">
        <select v-model="selectedStyle">
          <option v-for="(style, i) in stylePresets" :key="i" :value="i">
            {{ style.displayName }}
          </option>
        </select>

        <select v-model="selectedKey">
          <option v-for="(key, i) in keys" :key="i" :value="i">
            {{ key }}
          </option>
        </select>

        <button @click="generate" :disabled="isGenerating">
          {{ isGenerating
            ? (isJa ? '生成中...' : 'Generating...')
            : (isJa ? 'MIDI を生成' : 'Generate MIDI') }}
        </button>

        <button v-if="midiData" @click="download">
          {{ isJa ? 'ダウンロード' : 'Download' }}
        </button>
      </div>

      <div v-if="info" class="output">
        {{ info }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.loading {
  color: var(--vp-c-text-2);
  font-style: italic;
}

.error {
  color: var(--vp-c-danger-1);
  padding: 1rem;
  background: var(--vp-c-danger-soft);
  border-radius: 8px;
}
</style>
