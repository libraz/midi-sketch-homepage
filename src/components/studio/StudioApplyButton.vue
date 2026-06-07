<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useStudioGeneration } from '@/composables/useStudioGeneration'

const { t } = useI18n()
const studio = useStudioGeneration()

/**
 * Tri-state of the single regenerate CTA, derived from the generation
 * composable's dirty/running flags:
 *  - generating: a run is in progress
 *  - stale: config changed since the last generation
 *  - clean: preview is up to date
 */
const state = computed<'generating' | 'stale' | 'clean'>(() => {
  if (studio.isGenerating.value) return 'generating'
  if (studio.isStale.value) return 'stale'
  return 'clean'
})

const label = computed(() => {
  switch (state.value) {
    case 'generating':
      return t('studio.apply.regenerating')
    case 'stale':
      return t('studio.apply.regenerate')
    default:
      return t('studio.apply.upToDate')
  }
})

function onClick() {
  if (state.value === 'stale') studio.applyChanges()
}
</script>

<template>
  <button
    class="studio-apply"
    :class="`studio-apply--${state}`"
    :disabled="state !== 'stale'"
    @click="onClick"
  >
    <span v-if="state === 'generating'" class="studio-apply__spinner" aria-hidden="true"></span>
    <span v-else-if="state === 'stale'" class="studio-apply__dot" aria-hidden="true"></span>
    <span v-else class="studio-apply__check" aria-hidden="true">✓</span>
    <span class="studio-apply__label">{{ label }}</span>
  </button>
</template>

<style scoped>
.studio-apply {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s ease;
}

/* Stale: lit accent gradient, the only actionable state */
.studio-apply--stale {
  color: var(--studio-on-accent);
  background: linear-gradient(135deg, var(--studio-purple) 0%, color-mix(in srgb, var(--studio-purple) 60%, var(--studio-pink)) 100%);
  box-shadow: 0 10px 28px -10px rgba(var(--studio-purple-rgb), 0.6);
}

.studio-apply--stale:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 34px -10px rgba(var(--studio-purple-rgb), 0.7);
}

.studio-apply--stale:active {
  transform: translateY(0);
}

/* Generating: muted, disabled with spinner */
.studio-apply--generating {
  color: var(--studio-on-accent);
  background: linear-gradient(135deg, color-mix(in srgb, var(--studio-purple) 70%, #888) 0%, color-mix(in srgb, var(--studio-pink) 60%, #888) 100%);
  cursor: progress;
  opacity: 0.85;
}

/* Clean: ghost, disabled */
.studio-apply--clean {
  color: rgba(var(--studio-ink-rgb), 0.45);
  background: rgba(var(--studio-ink-rgb), 0.05);
  border: 1px solid rgba(var(--studio-ink-rgb), 0.1);
  cursor: default;
}

.studio-apply__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--studio-on-accent);
  animation: apply-pulse 1.5s ease-in-out infinite;
}

@keyframes apply-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.studio-apply__check {
  font-size: 0.8rem;
  color: var(--studio-green, var(--studio-cyan));
}

.studio-apply__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: var(--studio-on-accent);
  border-radius: 50%;
  animation: apply-spin 0.8s linear infinite;
}

@keyframes apply-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .studio-apply__dot,
  .studio-apply__spinner {
    animation: none;
  }
}
</style>
