<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { songImages, songImageCategories } from '@/data/songImages'
import { warmupChordPlayer } from '@/composables/useChordPlayer'
import CategoryChip from '@/components/wizard/CategoryChip.vue'
import type { CategoryItem } from '@/components/wizard/CategoryChip.vue'
import type { FlowType } from '@/composables/useWizardFlow'

const emit = defineEmits<{
  (e: 'generate'): void
}>()

const { t } = useI18n()
const store = useWizardStore()

// ============================================
// Flow type selection (compact segmented toggle)
// ============================================
const flowOptions = [
  { key: 'vocalFirst', value: 'vocal-first' as FlowType, icon: '🎤' },
  { key: 'bgmOnly', value: 'bgm-only' as FlowType, icon: '🎹' }
]

function selectFlowType(flowType: FlowType) {
  if (store.config.flowType === flowType) return
  store.setFlowType(flowType)
  // Vocal-first always uses MelodyLead composition
  if (flowType === 'vocal-first') {
    store.config.compositionStyle = 0
  }
}

// ============================================
// Song image selection
// ============================================
const filteredImages = computed(() => {
  const category = songImageCategories.find(c => c.id === store.config.activeCategory)
  if (!category) return songImages
  return songImages.filter(img => category.images.includes(img.id))
})

function getCategoryIcon(id: string): string {
  const icons: Record<string, string> = {
    idol: '★',
    pop: '♪',
    dance: '◈',
    ballad: '♥'
  }
  return icons[id] || '♪'
}

function getCategoryColor(id: string): string {
  const colors: Record<string, string> = {
    idol: '#F472B6',
    pop: '#60A5FA',
    dance: '#A78BFA',
    ballad: '#FB923C'
  }
  return colors[id] || '#8B5CF6'
}

const categoryItems = computed<CategoryItem[]>(() =>
  songImageCategories.map(cat => ({
    id: cat.id,
    label: t(`styleStep.categories.${cat.id}`),
    icon: getCategoryIcon(cat.id),
    color: getCategoryColor(cat.id)
  }))
)

function getStyleIcon(category: string): string {
  const icons: Record<string, string> = {
    idol: '★',
    pop: '♪',
    dance: '◈',
    electronic: '◈',
    ballad: '♥'
  }
  return icons[category] || '♪'
}

// Picking an image starts generation immediately (generate-first)
function selectStyle(id: string) {
  store.selectSongImage(id)
  // Pre-warmup audio for chord previews in the studio
  warmupChordPlayer()
  emit('generate')
}
</script>

<template>
  <div class="entry-screen">
    <!-- Flow type toggle -->
    <div class="entry-screen__flow" role="radiogroup" :aria-label="t('flowSelectionStep.title')">
      <button
        v-for="option in flowOptions"
        :key="option.key"
        class="entry-flow-option"
        :class="{
          'entry-flow-option--selected': store.config.flowType === option.value,
          'entry-flow-option--vocal': option.value === 'vocal-first',
          'entry-flow-option--bgm': option.value === 'bgm-only'
        }"
        role="radio"
        :aria-checked="store.config.flowType === option.value"
        @click="selectFlowType(option.value)"
      >
        <span class="entry-flow-option__icon">{{ option.icon }}</span>
        <span class="entry-flow-option__text">
          <span class="entry-flow-option__title">{{ t(`flowSelectionStep.options.${option.key}.title`) }}</span>
          <span class="entry-flow-option__desc">{{ t(`flowSelectionStep.options.${option.key}.description`) }}</span>
        </span>
        <span class="entry-flow-option__check" v-if="store.config.flowType === option.value">✓</span>
      </button>
    </div>

    <!-- Song image picker -->
    <div class="entry-screen__images">
      <div class="entry-screen__heading">
        <span class="entry-screen__rule" aria-hidden="true"></span>
        <h2 class="entry-screen__title">{{ t('studio.entry.imageTitle') }}</h2>
        <span class="entry-screen__rule" aria-hidden="true"></span>
      </div>
      <p class="entry-screen__hint">{{ t('studio.entry.imageHint') }}</p>

      <CategoryChip
        :items="categoryItems"
        :active-id="store.config.activeCategory"
        @select="store.setActiveCategory($event)"
      />

      <div class="entry-grid">
        <article
          v-for="image in filteredImages"
          :key="image.id"
          class="entry-card"
          :style="{ '--card-accent': image.color }"
          role="button"
          tabindex="0"
          @click="selectStyle(image.id)"
          @keydown.enter="selectStyle(image.id)"
        >
          <div class="entry-card__glow"></div>
          <div class="entry-card__content">
            <div class="entry-card__icon-wrap">
              <span class="entry-card__icon">{{ getStyleIcon(image.category) }}</span>
            </div>
            <h3 class="entry-card__name">{{ t(`songImages.${image.id}.name`) }}</h3>
            <p class="entry-card__tagline">{{ t(`songImages.${image.id}.tagline`) }}</p>
          </div>
          <span class="entry-card__bpm">BPM {{ image.tempoRange.min }}-{{ image.tempoRange.max }}</span>
          <span class="entry-card__go">▶ {{ t('studio.entry.generate') }}</span>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.entry-screen {
  --step-accent: #8B5CF6;
  --accent-rgb: 139, 92, 246;
}

/* Staggered page-load reveal */
.entry-screen__flow,
.entry-screen__heading,
.entry-screen__hint,
.entry-grid {
  animation: entry-reveal 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.entry-screen__heading { animation-delay: 0.08s; }
.entry-screen__hint { animation-delay: 0.14s; }
.entry-grid { animation-delay: 0.2s; }

@keyframes entry-reveal {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .entry-screen__flow,
  .entry-screen__heading,
  .entry-screen__hint,
  .entry-grid {
    animation: none;
  }
}

/* Flow toggle */
.entry-screen__flow {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.entry-flow-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: rgba(20, 20, 28, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.entry-flow-option--vocal {
  --card-accent: #EC4899;
}

.entry-flow-option--bgm {
  --card-accent: #60A5FA;
}

.entry-flow-option:hover {
  border-color: rgba(139, 92, 246, 0.3);
}

.entry-flow-option--selected,
.entry-flow-option--selected:hover {
  border-color: var(--card-accent);
  background: rgba(139, 92, 246, 0.08);
  box-shadow: 0 0 0 1px var(--card-accent);
}

.entry-flow-option__icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.entry-flow-option__text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.entry-flow-option__title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #FAFAFA;
}

.entry-flow-option__desc {
  font-size: 0.72rem;
  color: rgba(250, 250, 250, 0.5);
  line-height: 1.35;
}

.entry-flow-option__check {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-accent);
  border-radius: 50%;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
}

/* Image picker */
.entry-screen__heading {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.entry-screen__rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.35));
}

.entry-screen__rule:last-of-type {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.35), transparent);
}

.entry-screen__title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.65rem;
  font-weight: 400;
  letter-spacing: 0.12em;
  color: #FAFAFA;
  margin: 0;
  text-align: center;
  flex-shrink: 0;
  text-shadow: 0 0 30px rgba(139, 92, 246, 0.35);
}

.entry-screen__hint {
  font-size: 0.82rem;
  color: rgba(250, 250, 250, 0.5);
  text-align: center;
  margin: 0 0 1.25rem;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.entry-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 180px;
  background: rgba(20, 20, 28, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.entry-card__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 60% at 50% 120%,
    var(--card-accent, #8B5CF6),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.entry-card:hover,
.entry-card:focus-visible {
  border-color: var(--card-accent, rgba(139, 92, 246, 0.25));
  transform: translateY(-4px);
  box-shadow: 0 16px 48px -16px rgba(0, 0, 0, 0.4);
  outline: none;
}

.entry-card:hover .entry-card__glow,
.entry-card:focus-visible .entry-card__glow {
  opacity: 0.2;
}

.entry-card__content {
  position: relative;
  z-index: 1;
}

.entry-card__icon-wrap {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1));
  border-radius: 12px;
  margin-bottom: 1rem;
}

.entry-card__icon {
  font-size: 1.5rem;
  color: var(--card-accent, #8B5CF6);
  filter: drop-shadow(0 0 8px var(--card-accent, rgba(139, 92, 246, 0.4)));
}

.entry-card__name {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #FAFAFA;
  margin: 0 0 0.375rem;
  letter-spacing: -0.01em;
}

.entry-card__tagline {
  font-size: 0.85rem;
  color: rgba(250, 250, 250, 0.55);
  margin: 0;
  line-height: 1.4;
  padding-bottom: 1.75rem;
}

.entry-card__bpm {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.45);
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  z-index: 1;
}

.entry-card__go {
  position: absolute;
  bottom: 0.75rem;
  left: 0.75rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--card-accent, #8B5CF6);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.25s ease;
  z-index: 1;
}

.entry-card:hover .entry-card__go,
.entry-card:focus-visible .entry-card__go {
  opacity: 1;
  transform: translateX(0);
}

@media (max-width: 640px) {
  .entry-screen__flow {
    grid-template-columns: 1fr;
  }

  .entry-grid {
    grid-template-columns: 1fr;
  }

  .entry-card {
    padding: 1.25rem;
    min-height: 140px;
  }

  /* Always show the generate hint on touch devices */
  .entry-card__go {
    opacity: 1;
    transform: none;
  }
}
</style>
