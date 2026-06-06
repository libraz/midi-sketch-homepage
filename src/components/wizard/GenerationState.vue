<script setup lang="ts">
// Props
defineProps<{
  isLoading?: boolean
  isGenerating?: boolean
  error?: string | null
  loadingText?: string
  generatingText?: string
}>()
</script>

<template>
  <!-- Loading / Generating State -->
  <div v-if="isLoading || isGenerating" class="loading-state">
    <div class="loading-spinner"></div>
    <p>{{ isLoading ? loadingText : generatingText }}</p>
  </div>

  <!-- Error State -->
  <div v-else-if="error" class="error-state">
    <span class="error-state__icon">⚠</span>
    <p>{{ error }}</p>
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
</style>
