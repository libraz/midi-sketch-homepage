<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import BpmControl from '@/components/wizard/BpmControl.vue'
import StudioSheet from '../StudioSheet.vue'

const { t } = useI18n()
const store = useWizardStore()

const open = ref(false)
const ACCENT = 'var(--studio-cyan)'

const recommendedMin = computed(() => store.currentSongImage.value?.tempoRange.min ?? 90)
const recommendedMax = computed(() => store.currentSongImage.value?.tempoRange.max ?? 160)

const modified = computed(
  () => store.config.bpm !== store.baselineConfig.value.bpm
)

function nudge(delta: number) {
  store.setBpm(store.config.bpm + delta)
}
</script>

<template>
  <div class="bpm-compact">
    <div
      class="bpm-compact__pill"
      :style="{ '--pill-accent': ACCENT }"
    >
      <button
        class="bpm-compact__step"
        :aria-label="t('studio.essentials.bpmDown')"
        @click="nudge(-1)"
      >−</button>

      <button
        class="bpm-compact__body"
        @click="open = true"
      >
        <span class="bpm-compact__label">
          {{ t('studio.essentials.bpm') }}
          <span v-if="modified" class="bpm-compact__dot" aria-hidden="true"></span>
        </span>
        <span class="bpm-compact__value">{{ store.config.bpm }}</span>
      </button>

      <button
        class="bpm-compact__step"
        :aria-label="t('studio.essentials.bpmUp')"
        @click="nudge(1)"
      >+</button>
    </div>

    <StudioSheet
      :open="open"
      :title="t('studio.essentials.bpmTitle')"
      icon="♩"
      :accent="ACCENT"
      @close="open = false"
    >
      <div class="bpm-compact__inner">
        <BpmControl
          :model-value="store.config.bpm"
          :recommended-min="recommendedMin"
          :recommended-max="recommendedMax"
          @update:model-value="store.setBpm($event)"
        />
      </div>
    </StudioSheet>
  </div>
</template>

<style scoped>
/* Stretch the pill to the full grid-cell height so all essentials align */
.bpm-compact {
  display: flex;
}

.bpm-compact__pill {
  display: flex;
  align-items: stretch;
  width: 100%;
  background: rgba(var(--studio-panel-rgb), 0.6);
  border: 1px solid rgba(var(--studio-ink-rgb), 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.bpm-compact__pill:hover {
  border-color: color-mix(in srgb, var(--pill-accent) 45%, transparent);
}

.bpm-compact__step {
  flex-shrink: 0;
  width: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--pill-accent);
  font-size: 1.15rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.bpm-compact__step:hover {
  background: color-mix(in srgb, var(--pill-accent) 12%, transparent);
}

.bpm-compact__step:active {
  background: color-mix(in srgb, var(--pill-accent) 22%, transparent);
}

.bpm-compact__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.05rem;
  padding: 0.5rem 0.25rem;
  background: transparent;
  border: none;
  border-left: 1px solid rgba(var(--studio-ink-rgb), 0.08);
  border-right: 1px solid rgba(var(--studio-ink-rgb), 0.08);
  cursor: pointer;
  font-family: inherit;
}

.bpm-compact__label {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(var(--studio-ink-rgb), 0.45);
}

.bpm-compact__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--pill-accent);
  box-shadow: 0 0 6px var(--pill-accent);
}

.bpm-compact__value {
  font-family: var(--font-mono);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--studio-text-primary);
  line-height: 1.1;
}

.bpm-compact__inner {
  --step-accent: var(--studio-cyan);
  --accent-rgb-value: var(--studio-cyan-rgb);
  display: flex;
  justify-content: center;
  padding: 0.75rem 0 0.25rem;
}
</style>
