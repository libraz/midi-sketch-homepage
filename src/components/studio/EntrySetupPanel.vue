<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import KeyControl from './essentials/KeyControl.vue'
import BpmControlCompact from './essentials/BpmControlCompact.vue'
import ChordControl from './essentials/ChordControl.vue'

/**
 * Pre-generation essentials panel shown on the entry screen.
 *
 * Reuses the in-studio Essentials pills (Key / BPM / Chord) so the
 * songwriter can tune the high-value knobs BEFORE the first generation,
 * removing the generate → tweak → regenerate rework loop. The pills read
 * and write store.config directly and work without a generated result.
 */
const emit = defineEmits<{
  (e: 'generate'): void
}>()

const { t } = useI18n()
const store = useWizardStore()

// Name of the currently selected genre — surfaced in the header so the
// panel stays legible even when the selected card is filtered out of view.
const genreName = computed(() => {
  const id = store.config.songImageId
  return id ? t(`songImages.${id}.name`) : '—'
})
</script>

<template>
  <section class="entry-setup" :aria-label="t('studio.entry.setupTitle')">
    <div class="entry-setup__head">
      <div class="entry-setup__titles">
        <h3 class="entry-setup__title">{{ t('studio.entry.setupTitle') }}</h3>
        <p class="entry-setup__hint">{{ t('studio.entry.setupHint') }}</p>
      </div>
      <span class="entry-setup__genre">{{ genreName }}</span>
    </div>

    <div class="entry-setup__pills">
      <KeyControl class="entry-setup__cell" />
      <BpmControlCompact class="entry-setup__cell" />
      <ChordControl class="entry-setup__cell" />
    </div>

    <button class="entry-setup__cta" @click="emit('generate')">
      <span class="entry-setup__cta-icon" aria-hidden="true">▶</span>
      <span>{{ t('studio.entry.generateCta') }}</span>
    </button>
  </section>
</template>

<style scoped>
.entry-setup {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: rgba(var(--studio-panel-rgb), 0.4);
  border: 1px solid rgba(var(--studio-purple-rgb), 0.14);
  border-radius: 18px;
  box-shadow: 0 12px 36px -20px var(--studio-shadow-strong);
}

.entry-setup__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.entry-setup__titles {
  min-width: 0;
}

.entry-setup__title {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 700;
  color: var(--studio-text-primary);
}

.entry-setup__hint {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: rgba(var(--studio-ink-rgb), 0.5);
}

.entry-setup__genre {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--studio-purple);
  background: color-mix(in srgb, var(--studio-purple) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--studio-purple) 25%, transparent);
  border-radius: 100px;
  max-width: 45%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-setup__pills {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.625rem;
  align-items: stretch;
}

.entry-setup__cell {
  display: flex;
}

.entry-setup__cell > :deep(*) {
  width: 100%;
}

.entry-setup__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.9rem 1rem;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--studio-on-accent);
  background: linear-gradient(
    100deg,
    var(--studio-purple) 0%,
    var(--studio-pink) 100%
  );
  box-shadow: 0 12px 32px -12px color-mix(in srgb, var(--studio-purple) 70%, transparent);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, filter 0.2s ease;
}

.entry-setup__cta:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
  box-shadow: 0 16px 40px -12px color-mix(in srgb, var(--studio-purple) 80%, transparent);
}

.entry-setup__cta:active {
  transform: translateY(0);
}

.entry-setup__cta:focus-visible {
  outline: 2px solid var(--studio-purple);
  outline-offset: 3px;
}

.entry-setup__cta-icon {
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .entry-setup__pills {
    grid-template-columns: 1fr;
  }

  .entry-setup__head {
    flex-direction: column;
    gap: 0.5rem;
  }

  .entry-setup__genre {
    max-width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .entry-setup__cta {
    transition: none;
  }

  .entry-setup__cta:hover {
    transform: none;
  }
}
</style>
