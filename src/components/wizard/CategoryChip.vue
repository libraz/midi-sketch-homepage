<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

export interface CategoryItem {
  id: string
  label: string
  icon: string
  color: string
}

const props = defineProps<{
  items: CategoryItem[]
  activeId: string
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const containerRef = ref<HTMLElement | null>(null)

// Scroll chip to center without affecting parent scroll
function scrollToCenter(chip: Element) {
  const container = containerRef.value
  if (!container) return

  const chipEl = chip as HTMLElement
  const containerRect = container.getBoundingClientRect()
  const chipRect = chipEl.getBoundingClientRect()

  // Calculate scroll position to center the chip
  const chipCenter = chipRect.left + chipRect.width / 2
  const containerCenter = containerRect.left + containerRect.width / 2
  const scrollOffset = chipCenter - containerCenter

  container.scrollTo({
    left: container.scrollLeft + scrollOffset,
    behavior: 'smooth'
  })
}

function handleSelect(id: string, event: Event) {
  emit('select', id)
  // Scroll the clicked chip to center
  const target = event.currentTarget as HTMLElement
  if (target) {
    scrollToCenter(target)
  }
}

// Also scroll to active chip when activeId changes externally
watch(() => props.activeId, () => {
  nextTick(() => {
    if (containerRef.value) {
      const activeChip = containerRef.value.querySelector('.category-chip--active')
      if (activeChip) {
        scrollToCenter(activeChip)
      }
    }
  })
})
</script>

<template>
  <div ref="containerRef" class="category-chips">
    <button
      v-for="item in items"
      :key="item.id"
      class="category-chip"
      :class="{ 'category-chip--active': activeId === item.id }"
      :style="{ '--chip-color': item.color }"
      @click="handleSelect(item.id, $event)"
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
    flex-wrap: nowrap;
    justify-content: flex-start;
    gap: 0.5rem;
    margin-left: -1rem;
    margin-right: -1rem;
    padding: 0.5rem 1rem;
    overflow-x: auto;
    overflow-y: visible;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    /* Hide scrollbar */
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .category-chips::-webkit-scrollbar {
    display: none;
  }

  .category-chip {
    min-width: auto;
    padding: 0.5rem 0.875rem;
    font-size: 0.8rem;
    flex-shrink: 0;
    scroll-snap-align: center;
  }

  .category-chip__icon {
    font-size: 1rem;
  }
}
</style>
