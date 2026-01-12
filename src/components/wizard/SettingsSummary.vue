<script setup lang="ts">
export interface SummaryItem {
  label: string
  value: string
}

defineProps<{
  items: SummaryItem[]
}>()
</script>

<template>
  <div class="settings-summary">
    <div v-for="(item, index) in items" :key="item.label" class="summary-item" :style="{ '--delay': `${index * 0.05}s` }">
      <span class="summary-item__label">{{ item.label }}</span>
      <span class="summary-item__value">{{ item.value }}</span>
    </div>
  </div>
</template>

<style scoped>
.settings-summary {
  --accent: rgb(var(--accent-rgb, 139, 92, 246));

  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  padding: 0.625rem;
  background: rgba(15, 15, 22, 0.8);
  border: 1px solid rgba(var(--accent-rgb, 139, 92, 246), 0.15);
  border-radius: 10px;
  margin-bottom: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.375rem 0.5rem;
  background: rgba(var(--accent-rgb, 139, 92, 246), 0.08);
  border-radius: 6px;
  animation: fadeIn 0.3s ease backwards;
  animation-delay: var(--delay);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.summary-item__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.summary-item__value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent);
  word-break: break-word;
  line-height: 1.3;
}

/* Mobile: 2 columns */
@media (max-width: 480px) {
  .settings-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Larger screens: more columns */
@media (min-width: 640px) {
  .settings-summary {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }

  .summary-item {
    padding: 0.5rem 0.625rem;
  }

  .summary-item__label {
    font-size: 0.55rem;
  }

  .summary-item__value {
    font-size: 0.75rem;
  }
}
</style>
