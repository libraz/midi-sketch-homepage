<script setup lang="ts">
export interface CategoryItem {
  id: string
  label: string
  icon: string
  color: string
}

defineProps<{
  items: CategoryItem[]
  activeId: string
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()
</script>

<template>
  <div class="category-chips">
    <button
      v-for="item in items"
      :key="item.id"
      class="category-chip"
      :class="{ 'category-chip--active': activeId === item.id }"
      :style="{ '--chip-color': item.color }"
      @click="emit('select', item.id)"
    >
      <span class="category-chip__icon">{{ item.icon }}</span>
      <span class="category-chip__label">{{ item.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.category-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.category-chip {
  --chip-color: #8B5CF6;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 7rem;
  padding: 0.625rem 1rem;
  background: color-mix(in srgb, var(--chip-color) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--chip-color) 25%, transparent);
  border-radius: 100px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: color-mix(in srgb, var(--chip-color) 80%, #FAFAFA);
  cursor: pointer;
  transition: all 0.25s ease;
}

.category-chip:hover {
  background: color-mix(in srgb, var(--chip-color) 15%, transparent);
  border-color: color-mix(in srgb, var(--chip-color) 40%, transparent);
  transform: translateY(-2px);
}

.category-chip--active {
  background: color-mix(in srgb, var(--chip-color) 25%, transparent);
  border-color: var(--chip-color);
  color: #FAFAFA;
  box-shadow: 0 0 24px -4px color-mix(in srgb, var(--chip-color) 50%, transparent);
}

.category-chip__icon {
  font-size: 1.1rem;
  filter: drop-shadow(0 2px 4px color-mix(in srgb, var(--chip-color) 40%, transparent));
}

.category-chip--active .category-chip__icon {
  filter: drop-shadow(0 2px 8px color-mix(in srgb, var(--chip-color) 60%, transparent));
}

.category-chip__label {
  white-space: nowrap;
}

@media (max-width: 640px) {
  .category-chips {
    gap: 0.375rem;
  }

  .category-chip {
    min-width: auto;
    padding: 0.5rem 0.875rem;
    font-size: 0.8rem;
  }

  .category-chip__icon {
    font-size: 1rem;
  }
}
</style>
