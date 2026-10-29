<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'

/** Primary "generate" CTA of the entry screen, shared by the setup panel and its docked copy. */
const emit = defineEmits<{
  (e: 'generate'): void
}>()

const { t } = useI18n()
</script>

<template>
  <button class="entry-generate" @click="emit('generate')">
    <span class="entry-generate__icon" aria-hidden="true">▶</span>
    <span>{{ t('studio.entry.generateCta') }}</span>
  </button>
</template>

<style scoped>
.entry-generate {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.9rem 1rem;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--studio-on-accent);
  /* Single-hue fill: the CTA already carries enough weight from size and contrast. */
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--studio-purple) 92%, white) 0%,
    var(--studio-purple) 100%
  );
  box-shadow: 0 12px 32px -14px color-mix(in srgb, var(--studio-purple) 75%, transparent);
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease, filter 0.2s ease;
}

.entry-generate:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
  box-shadow: 0 16px 40px -12px color-mix(in srgb, var(--studio-purple) 80%, transparent);
}

.entry-generate:active {
  transform: translateY(0) scale(0.99);
  transition-duration: 0.06s;
}

.entry-generate:focus-visible {
  outline: 2px solid var(--studio-purple);
  outline-offset: 3px;
}

.entry-generate__icon {
  font-size: 0.8rem;
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.entry-generate:hover .entry-generate__icon {
  transform: translateX(2px);
}

@media (prefers-reduced-motion: reduce) {
  .entry-generate,
  .entry-generate__icon {
    transition: none;
  }

  .entry-generate:hover,
  .entry-generate:hover .entry-generate__icon {
    transform: none;
  }
}
</style>
