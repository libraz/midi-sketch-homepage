<script setup lang="ts">
// Props
defineProps<{
  isLoading?: boolean
  isGenerating?: boolean
  error?: string | null
  loadingText?: string
  generatingText?: string
  /** Label for the retry action; omit to hide it. */
  retryText?: string
}>()

defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <!-- Loading / Generating State -->
  <div v-if="isLoading || isGenerating" class="loading-state" role="status">
    <div class="loading-spinner"></div>
    <p>{{ isLoading ? loadingText : generatingText }}</p>
  </div>

  <!-- Error State. A failed run leaves nothing else on screen, so it has to
       carry its own way out. -->
  <div v-else-if="error" class="error-state" role="alert">
    <span class="error-state__icon" aria-hidden="true">⚠</span>
    <p>{{ error }}</p>
    <button v-if="retryText" class="error-state__retry" @click="$emit('retry')">
      {{ retryText }}
    </button>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: rgba(var(--studio-ink-rgb), 0.5);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.2);
  border-top-color: rgb(var(--accent-rgb, var(--studio-purple-rgb)));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  background: rgba(var(--studio-red-rgb), 0.1);
  border: 1px solid rgba(var(--studio-red-rgb), 0.2);
  border-radius: 12px;
  color: var(--studio-red);
}

.error-state__icon {
  font-size: 1.5rem;
}

.error-state p {
  margin: 0;
  text-align: center;
}

.error-state__retry {
  margin-top: 0.25rem;
  padding: 0.5rem 1.25rem;
  background: transparent;
  border: 1px solid rgba(var(--studio-red-rgb), 0.45);
  border-radius: 100px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--studio-red);
  cursor: pointer;
  transition: background 0.2s ease;
}

.error-state__retry:hover {
  background: rgba(var(--studio-red-rgb), 0.12);
}

.error-state__retry:focus-visible {
  outline: 2px solid var(--studio-red);
  outline-offset: 2px;
}
</style>
