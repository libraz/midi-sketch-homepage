<script setup lang="ts">
export interface SummaryItem {
  label: string
  value: string
}

// Props
defineProps<{
  items: SummaryItem[]
}>()
</script>

<template>
  <div class="settings-summary">
    <div v-for="item in items" :key="item.label" class="summary-row">
      <span class="summary-label">{{ item.label }}</span>
      <span class="summary-value">{{ item.value }}</span>
    </div>
  </div>
</template>

<style scoped>
.settings-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  padding: 0.75rem 1rem;
  background: rgba(20, 20, 28, 0.5);
  border: 1px solid rgba(var(--accent-rgb, 139, 92, 246), 0.15);
  border-radius: 12px;
  margin-bottom: 1.25rem;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.5);
}

.summary-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgb(var(--accent-rgb, 139, 92, 246));
  padding: 0.125rem 0.5rem;
  background: rgba(var(--accent-rgb, 139, 92, 246), 0.15);
  border-radius: 4px;
}
</style>
