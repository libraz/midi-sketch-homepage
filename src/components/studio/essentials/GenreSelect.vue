<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { songImages, songImageCategories } from '@/data/songImages'
import CategoryChip from '@/components/wizard/CategoryChip.vue'
import type { CategoryItem } from '@/components/wizard/CategoryChip.vue'
import EssentialPill from './EssentialPill.vue'
import StudioSheet from '../StudioSheet.vue'

const { t } = useI18n()
const store = useWizardStore()

const open = ref(false)

const ACCENT = 'var(--studio-purple)'

const currentName = computed(() => {
  const id = store.config.songImageId
  return id ? t(`songImages.${id}.name`) : '—'
})

const CATEGORY_ICONS: Record<string, string> = {
  idol: '★', pop: '♪', dance: '◈', ballad: '♥'
}
const CATEGORY_COLORS: Record<string, string> = {
  idol: '#F472B6', pop: '#60A5FA', dance: '#A78BFA', ballad: '#FB923C'
}

const categoryItems = computed<CategoryItem[]>(() =>
  songImageCategories.map(cat => ({
    id: cat.id,
    label: t(`styleStep.categories.${cat.id}`),
    icon: CATEGORY_ICONS[cat.id] || '♪',
    color: CATEGORY_COLORS[cat.id] || ACCENT
  }))
)

const filteredImages = computed(() => {
  const category = songImageCategories.find(c => c.id === store.config.activeCategory)
  if (!category) return songImages
  return songImages.filter(img => category.images.includes(img.id))
})

function selectGenre(id: string) {
  store.changeGenre(id)
  open.value = false
}
</script>

<template>
  <div class="genre-select">
    <EssentialPill
      :label="t('studio.essentials.genre')"
      :value="currentName"
      :accent="ACCENT"
      icon="◎"
      @open="open = true"
    />

    <StudioSheet
      :open="open"
      :title="t('studio.essentials.genreTitle')"
      icon="◎"
      :accent="ACCENT"
      @close="open = false"
    >
      <CategoryChip
        :items="categoryItems"
        :active-id="store.config.activeCategory"
        @select="store.setActiveCategory($event)"
      />

      <div class="genre-grid">
        <button
          v-for="image in filteredImages"
          :key="image.id"
          class="genre-card"
          :class="{ 'genre-card--active': store.config.songImageId === image.id }"
          :style="{ '--card-accent': image.color }"
          @click="selectGenre(image.id)"
        >
          <span class="genre-card__name">{{ t(`songImages.${image.id}.name`) }}</span>
          <span class="genre-card__tagline">{{ t(`songImages.${image.id}.tagline`) }}</span>
          <span class="genre-card__bpm">BPM {{ image.tempoRange.min }}–{{ image.tempoRange.max }}</span>
          <span
            v-if="store.config.songImageId === image.id"
            class="genre-card__check"
            aria-hidden="true"
          >✓</span>
        </button>
      </div>
    </StudioSheet>
  </div>
</template>

<style scoped>
/* Stretch the pill to the full grid-cell height so all essentials align */
.genre-select {
  display: flex;
}

.genre-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.625rem;
  margin-top: 1rem;
}

.genre-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.875rem;
  padding-bottom: 1.5rem;
  background: rgba(var(--studio-panel-rgb), 0.6);
  border: 1px solid rgba(var(--studio-ink-rgb), 0.1);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.genre-card:hover {
  border-color: var(--card-accent);
  transform: translateY(-2px);
}

.genre-card--active {
  border-color: var(--card-accent);
  background: color-mix(in srgb, var(--card-accent) 10%, transparent);
  box-shadow: 0 0 0 1px var(--card-accent);
}

.genre-card__name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--studio-text-primary);
}

.genre-card__tagline {
  font-size: 0.72rem;
  line-height: 1.35;
  color: rgba(var(--studio-ink-rgb), 0.55);
}

.genre-card__bpm {
  position: absolute;
  bottom: 0.5rem;
  left: 0.875rem;
  font-family: var(--font-mono);
  font-size: 0.58rem;
  color: rgba(var(--studio-ink-rgb), 0.4);
}

.genre-card__check {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-accent);
  border-radius: 50%;
  color: var(--studio-on-accent);
  font-size: 0.6rem;
  font-weight: 700;
}

@media (max-width: 640px) {
  .genre-grid {
    grid-template-columns: 1fr;
  }
}
</style>
