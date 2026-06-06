<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { useMidiGeneration } from '@/composables/useMidiGeneration'
import { useMidiPlayer } from '@/composables/useMidiPlayer'
import { useAudioExport } from '@/composables/useAudioExport'
import { useStudioGeneration } from '@/composables/useStudioGeneration'
import { devLog } from '@/utils/devLog'
import DownloadButton from '@/components/wizard/DownloadButton.vue'
import ShareButtons from '@/components/ShareButtons.vue'

const emit = defineEmits<{
  (e: 'edit'): void
}>()

const { t } = useI18n()
const store = useWizardStore()
const midiGen = useMidiGeneration()
const audioExport = useAudioExport()
const studio = useStudioGeneration()
const { isPlaying, stop } = useMidiPlayer()

const isVocalFirst = computed(() => store.config.flowType === 'vocal-first')
const shareType = computed(() => (isVocalFirst.value ? 'vocal' : 'bgm') as 'vocal' | 'bgm')

function downloadMidi() {
  try {
    midiGen.downloadMidi()
  } catch {
    // Download failed silently
  }
}

async function downloadMp3() {
  if (!studio.eventData.value) return

  // Stop playback during export
  if (isPlaying.value) {
    stop()
  }

  try {
    await audioExport.exportToMp3(
      studio.eventData.value,
      `midi-sketch-${Date.now()}.mp3`,
      { mutedTracks: { SE: true }, drumKit: store.currentSongImage.value?.drumKit }
    )
  } catch (e: any) {
    devLog('MP3 Export Error', e.message)
  }
}
</script>

<template>
  <div class="studio-output">
    <div class="studio-output__header">
      <span class="studio-output__rule" aria-hidden="true"></span>
      <span class="studio-output__label">{{ t('studio.output.title') }}</span>
      <span class="studio-output__rule" aria-hidden="true"></span>
    </div>
    <div class="studio-output__actions">
      <DownloadButton
        :label="t('finalStep.download')"
        color="green"
        @download="downloadMidi"
      />
      <ShareButtons :share-type="shareType" />
    </div>

    <!-- Beta Features Section -->
    <details class="beta-section">
      <summary class="beta-section__header">
        <span class="beta-section__title">
          <span class="beta-badge">{{ t('beta.badge') }}</span>
          {{ t('beta.title') }}
        </span>
        <svg class="beta-section__chevron" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.47 5.47a.75.75 0 0 1 1.06 0L8 7.94l2.47-2.47a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 0-1.06z"/>
        </svg>
      </summary>
      <div class="beta-section__content">
        <p class="beta-section__description">{{ t('beta.description') }}</p>
        <div class="beta-section__buttons">
          <!-- Vocal melody editor (vocal-first only) -->
          <button v-if="isVocalFirst" class="beta-button" @click="emit('edit')">
            <span class="beta-button__icon">✎</span>
            <span>{{ t('vocalGenerationStep.edit') }}</span>
            <span class="beta-badge beta-badge--small">{{ t('beta.badge') }}</span>
          </button>

          <!-- MP3 export -->
          <button
            class="beta-button"
            :class="{ 'beta-button--loading': audioExport.isExporting.value }"
            :disabled="audioExport.isExporting.value"
            @click="downloadMp3"
          >
            <svg
              v-if="audioExport.isExporting.value"
              class="beta-button__spinner"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
            >
              <circle
                cx="12" cy="12" r="10"
                stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-dasharray="50 20"
              />
            </svg>
            <svg
              v-else
              class="beta-button__icon"
              width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
            >
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            <span>
              {{ audioExport.isExporting.value
                ? t(`finalStep.exportStatus.${audioExport.exportStatus.value}`)
                : t('finalStep.downloadMp3')
              }}
            </span>
            <span class="beta-badge beta-badge--small">{{ t('beta.badge') }}</span>
          </button>
        </div>
      </div>
    </details>
  </div>
</template>

<style scoped>
.studio-output__header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 0.875rem;
}

.studio-output__rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--studio-purple-rgb), 0.3));
}

.studio-output__rule:last-of-type {
  background: linear-gradient(90deg, rgba(var(--studio-purple-rgb), 0.3), transparent);
}

.studio-output__label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(var(--studio-purple-soft-rgb), 0.85);
  flex-shrink: 0;
}

.studio-output__actions {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

/* Beta Section */
.beta-section {
  margin-top: 1rem;
  border: 1px dashed rgba(var(--studio-ink-rgb), 0.15);
  border-radius: 8px;
  overflow: hidden;
}

.beta-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  background: rgba(var(--studio-ink-rgb), 0.02);
  transition: background 0.2s ease;
  list-style: none;
}

.beta-section__header::-webkit-details-marker {
  display: none;
}

.beta-section__header:hover {
  background: rgba(var(--studio-ink-rgb), 0.04);
}

.beta-section__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(var(--studio-ink-rgb), 0.5);
}

.beta-section__chevron {
  color: rgba(var(--studio-ink-rgb), 0.3);
  transition: transform 0.2s ease;
}

.beta-section[open] .beta-section__chevron {
  transform: rotate(180deg);
}

.beta-section__content {
  padding: 0.75rem 1rem 1rem;
  border-top: 1px dashed rgba(var(--studio-ink-rgb), 0.1);
}

.beta-section__description {
  font-size: 0.75rem;
  color: rgba(var(--studio-ink-rgb), 0.4);
  margin: 0 0 0.75rem 0;
}

.beta-section__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.beta-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.4rem;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--studio-orange);
  background: rgba(var(--studio-orange-rgb), 0.15);
  border: 1px solid rgba(var(--studio-orange-rgb), 0.3);
  border-radius: 4px;
}

.beta-badge--small {
  padding: 0.1rem 0.3rem;
  font-size: 0.55rem;
}

.beta-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: transparent;
  border: 1px solid rgba(var(--studio-ink-rgb), 0.15);
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(var(--studio-ink-rgb), 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.beta-button:hover:not(:disabled) {
  background: rgba(var(--studio-ink-rgb), 0.05);
  border-color: rgba(var(--studio-ink-rgb), 0.25);
  color: rgba(var(--studio-ink-rgb), 0.8);
}

.beta-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.beta-button--loading {
  color: rgba(var(--studio-blue-rgb), 0.8);
  border-color: rgba(var(--studio-blue-rgb), 0.3);
}

.beta-button__icon {
  opacity: 0.7;
}

.beta-button__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
