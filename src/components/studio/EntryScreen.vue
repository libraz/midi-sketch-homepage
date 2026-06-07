<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { songImages, songImageCategories } from '@/data/songImages'
import { warmupChordPlayer } from '@/composables/useChordPlayer'
import CategoryChip from '@/components/wizard/CategoryChip.vue'
import type { CategoryItem } from '@/components/wizard/CategoryChip.vue'
import type { FlowType } from '@/composables/useWizardFlow'
import EntrySetupPanel from './EntrySetupPanel.vue'

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

// Picking a genre selects it (resets the essentials to that genre's
// recommendations + re-baselines) but does NOT generate. The user tunes
// Key/BPM/Chord in the setup panel below, then commits via "Generate".
function selectGenre(id: string) {
  // Re-tapping the active genre would wipe in-panel tweaks — keep them.
  if (store.config.songImageId === id) return
  store.selectSongImage(id)
}

// Commit the current (genre + tuned essentials) config to generation.
function startGeneration() {
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
          :class="{ 'entry-card--active': store.config.songImageId === image.id }"
          :style="{ '--card-accent': image.color }"
          role="button"
          :aria-pressed="store.config.songImageId === image.id"
          tabindex="0"
          @click="selectGenre(image.id)"
          @keydown.enter="selectGenre(image.id)"
        >
          <div class="entry-card__glow"></div>
          <span class="entry-card__watermark" aria-hidden="true">{{ getStyleIcon(image.category) }}</span>
          <span
            v-if="store.config.songImageId === image.id"
            class="entry-card__check"
            aria-hidden="true"
          >✓</span>
          <div class="entry-card__content">
            <div class="entry-card__icon-wrap">
              <span class="entry-card__icon">{{ getStyleIcon(image.category) }}</span>
            </div>
            <h3 class="entry-card__name">{{ t(`songImages.${image.id}.name`) }}</h3>
            <p class="entry-card__tagline">{{ t(`songImages.${image.id}.tagline`) }}</p>
          </div>
          <span class="entry-card__bpm">BPM {{ image.tempoRange.min }}-{{ image.tempoRange.max }}</span>
          <span class="entry-card__go">
            {{ store.config.songImageId === image.id ? t('studio.entry.generate') : t('studio.entry.select') }}
          </span>
        </article>
      </div>

      <!-- Pre-generation essentials: tune Key/BPM/Chord, then generate -->
      <EntrySetupPanel @generate="startGeneration" />
    </div>
  </div>
</template>

<style scoped>
.entry-screen {
  --step-accent: var(--studio-purple);
  --accent-rgb: var(--studio-purple-rgb);
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

/* Cards ripple in after the grid container */
.entry-grid .entry-card {
  animation: entry-reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.entry-grid .entry-card:nth-child(1) { animation-delay: 0.26s; }
.entry-grid .entry-card:nth-child(2) { animation-delay: 0.32s; }
.entry-grid .entry-card:nth-child(3) { animation-delay: 0.38s; }
.entry-grid .entry-card:nth-child(4) { animation-delay: 0.44s; }
.entry-grid .entry-card:nth-child(5) { animation-delay: 0.5s; }
.entry-grid .entry-card:nth-child(n + 6) { animation-delay: 0.56s; }

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
  .entry-grid,
  .entry-grid .entry-card {
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
  background: rgba(var(--studio-panel-rgb), 0.6);
  border: 1px solid rgba(var(--studio-purple-rgb), 0.1);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.entry-flow-option--vocal {
  --card-accent: var(--studio-pink);
}

.entry-flow-option--bgm {
  --card-accent: var(--studio-blue);
}

.entry-flow-option:hover {
  border-color: rgba(var(--studio-purple-rgb), 0.3);
}

.entry-flow-option--selected,
.entry-flow-option--selected:hover {
  border-color: var(--card-accent);
  /* Tint follows the option's own accent (pink for vocal, blue for BGM) */
  background: color-mix(in srgb, var(--card-accent) 8%, transparent);
  box-shadow:
    0 0 0 1px var(--card-accent),
    0 0 24px -8px color-mix(in srgb, var(--card-accent) 50%, transparent);
}

.entry-flow-option:focus-visible {
  outline: 2px solid var(--card-accent, var(--studio-purple));
  outline-offset: 2px;
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
  color: var(--studio-text-primary);
}

.entry-flow-option__desc {
  font-size: 0.72rem;
  color: rgba(var(--studio-ink-rgb), 0.5);
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
  color: var(--studio-on-accent);
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
  background: linear-gradient(90deg, transparent, rgba(var(--studio-purple-rgb), 0.35));
}

.entry-screen__rule:last-of-type {
  background: linear-gradient(90deg, rgba(var(--studio-purple-rgb), 0.35), transparent);
}

.entry-screen__title {
  font-family: var(--font-display);
  font-size: 1.65rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--studio-text-primary);
  margin: 0;
  text-align: center;
  flex-shrink: 0;
  text-shadow: 0 0 30px rgba(var(--studio-purple-rgb), 0.35);
}

.entry-screen__hint {
  font-size: 0.82rem;
  color: rgba(var(--studio-ink-rgb), 0.5);
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
  background: rgba(var(--studio-panel-rgb), 0.6);
  border: 1px solid rgba(var(--studio-purple-rgb), 0.1);
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
    var(--card-accent, var(--studio-purple)),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.entry-card:hover,
.entry-card:focus-visible {
  border-color: var(--card-accent, rgba(var(--studio-purple-rgb), 0.25));
  transform: translateY(-4px);
  box-shadow: 0 16px 48px -16px var(--studio-shadow-strong);
  outline: none;
}

.entry-card:hover .entry-card__glow,
.entry-card:focus-visible .entry-card__glow {
  opacity: 0.2;
}

/* Selected genre: persistent accent ring + tint */
.entry-card--active {
  border-color: var(--card-accent, var(--studio-purple));
  background: color-mix(in srgb, var(--card-accent, var(--studio-purple)) 8%, rgba(var(--studio-panel-rgb), 0.6));
  box-shadow: 0 0 0 1px var(--card-accent, var(--studio-purple));
}

.entry-card--active .entry-card__glow {
  opacity: 0.15;
}

.entry-card__check {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 2;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-accent, var(--studio-purple));
  border-radius: 50%;
  color: var(--studio-on-accent);
  font-size: 0.7rem;
  font-weight: 700;
}

/* Oversized ghost glyph bleeding off the top-right corner */
.entry-card__watermark {
  position: absolute;
  top: -1.25rem;
  right: -0.75rem;
  font-size: 6.5rem;
  line-height: 1;
  color: var(--card-accent, var(--studio-purple));
  opacity: 0.06;
  transform: rotate(12deg);
  transition: opacity 0.4s ease, transform 0.4s ease;
  pointer-events: none;
  user-select: none;
}

.entry-card:hover .entry-card__watermark,
.entry-card:focus-visible .entry-card__watermark {
  opacity: 0.12;
  transform: rotate(8deg) scale(1.08);
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
  background: linear-gradient(135deg, rgba(var(--studio-purple-rgb), 0.15), rgba(var(--studio-pink-rgb), 0.1));
  border-radius: 12px;
  margin-bottom: 1rem;
}

.entry-card__icon {
  font-size: 1.5rem;
  color: var(--card-accent, var(--studio-purple));
  filter: drop-shadow(0 0 8px var(--card-accent, rgba(var(--studio-purple-rgb), 0.4)));
}

.entry-card__name {
  font-family: var(--font-body);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--studio-text-primary);
  margin: 0 0 0.375rem;
  letter-spacing: -0.01em;
}

.entry-card__tagline {
  font-size: 0.85rem;
  color: rgba(var(--studio-ink-rgb), 0.55);
  margin: 0;
  line-height: 1.4;
  padding-bottom: 1.75rem;
}

.entry-card__bpm {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(var(--studio-ink-rgb), 0.45);
  padding: 0.25rem 0.5rem;
  background: rgba(var(--studio-ink-rgb), 0.06);
  border: 1px solid rgba(var(--studio-ink-rgb), 0.08);
  border-radius: 4px;
  z-index: 1;
}

/* Dark keeps the original darkening overlay behind the badge */
.dark .entry-card__bpm {
  background: rgba(0, 0, 0, 0.2);
}

.entry-card__go {
  position: absolute;
  bottom: 0.75rem;
  left: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--card-accent, var(--studio-purple));
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.25s ease;
  z-index: 1;
}

.entry-card:hover .entry-card__go,
.entry-card:focus-visible .entry-card__go,
.entry-card--active .entry-card__go {
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
