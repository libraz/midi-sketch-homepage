<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { songImages, songImageCategories } from '@/data/songImages'
import { BLUEPRINT_OPTIONS, AUTO_BLUEPRINT_ID, getBlueprintById } from '@/data/blueprints'
import { getRecommendedBlueprintId } from '@/data/songImageBlueprint'
import { warmupChordPlayer } from '@/composables/useChordPlayer'
import StepHeader from '@/components/wizard/StepHeader.vue'
import CategoryChip from '@/components/wizard/CategoryChip.vue'
import type { CategoryItem } from '@/components/wizard/CategoryChip.vue'

const { t, locale } = useI18n()
const store = useWizardStore()

const filteredImages = computed(() => {
  const category = songImageCategories.find(c => c.id === store.config.activeCategory)
  if (!category) return songImages
  return songImages.filter(img => category.images.includes(img.id))
})

// Arrangement style (Blueprint) section state
const arrangementOpen = ref(false)

// Recommended blueprint based on current songImage
const recommendedBlueprintId = computed(() => {
  return getRecommendedBlueprintId(store.config.songImageId)
})

// Current blueprint label for the summary
const currentBlueprintLabel = computed(() => {
  const lang = locale.value as 'en' | 'ja'
  if (store.config.blueprintId === AUTO_BLUEPRINT_ID) {
    const rec = getBlueprintById(recommendedBlueprintId.value)
    return `${rec?.label[lang] ?? ''}${t('styleStep.arrangementStyle.recommended')}`
  }
  const bp = getBlueprintById(store.config.blueprintId)
  return bp?.label[lang] ?? t('styleStep.arrangementStyle.unknown')
})

// Blueprint options with recommended badge and override info
const blueprintOptions = computed(() => {
  const lang = locale.value as 'en' | 'ja'
  return BLUEPRINT_OPTIONS.map(bp => ({
    ...bp,
    label: bp.label[lang],
    description: bp.description[lang],
    isRecommended: bp.id === recommendedBlueprintId.value,
    overridesForm: bp.overridesForm,
    ignoresMotifScope: bp.riffPolicy !== 'free',
  }))
})

function selectStyle(id: string) {
  store.selectSongImage(id)
  // Pre-warmup audio for chord preview in next step
  warmupChordPlayer()
}

function selectBlueprint(id: number) {
  store.config.blueprintId = id
  store.onConfigChange('blueprintId')
}

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
    idol: '#F472B6',    // Pink
    pop: '#60A5FA',     // Blue
    dance: '#A78BFA',   // Purple
    ballad: '#FB923C'   // Orange
  }
  return colors[id] || '#8B5CF6'
}

// Category items for CategoryChip component
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
</script>

<template>
  <div class="style-step">
    <!-- Step Header -->
    <StepHeader :title="t('styleStep.title')" :subtitle="t('styleStep.subtitle')" />

    <!-- Category Filter -->
    <CategoryChip
      :items="categoryItems"
      :active-id="store.config.activeCategory"
      @select="store.setActiveCategory($event)"
    />

    <!-- Style Cards Grid -->
    <div class="style-grid">
      <article
        v-for="image in filteredImages"
        :key="image.id"
        class="style-card"
        :class="{ 'style-card--selected': store.config.songImageId === image.id }"
        :style="{ '--card-accent': image.color }"
        @click="selectStyle(image.id)"
        role="button"
        :aria-pressed="store.config.songImageId === image.id"
      >
        <!-- Glow Effect -->
        <div class="style-card__glow"></div>

        <!-- Card Content -->
        <div class="style-card__content">
          <!-- Icon -->
          <div class="style-card__icon-wrap">
            <span class="style-card__icon">{{ getStyleIcon(image.category) }}</span>
          </div>

          <!-- Text -->
          <h3 class="style-card__name">{{ t(`songImages.${image.id}.name`) }}</h3>
          <p class="style-card__tagline">{{ t(`songImages.${image.id}.tagline`) }}</p>
        </div>

        <!-- BPM Badge (fixed position) -->
        <span class="style-card__bpm">BPM {{ image.tempoRange.min }}-{{ image.tempoRange.max }}</span>

        <!-- Selection Indicator -->
        <div class="style-card__check" v-if="store.config.songImageId === image.id">
          <span>✓</span>
        </div>
      </article>
    </div>

    <!-- Arrangement Style Section (Collapsible) -->
    <details class="arrangement-section" :open="arrangementOpen" @toggle="arrangementOpen = ($event.target as HTMLDetailsElement).open">
      <summary class="arrangement-summary">
        <span class="arrangement-icon">🎛️</span>
        <span class="arrangement-title">{{ t('styleStep.arrangementStyle.title') }}</span>
        <span class="arrangement-value">{{ currentBlueprintLabel }}</span>
        <span class="arrangement-chevron">{{ arrangementOpen ? '▼' : '▶' }}</span>
      </summary>

      <div class="arrangement-body">
        <p class="arrangement-description">{{ t('styleStep.arrangementStyle.description') }}</p>
        <span class="arrangement-hint">{{ t('styleStep.arrangementStyle.affectsHint') }}</span>
      </div>

      <div class="blueprint-grid">
        <article
          v-for="bp in blueprintOptions"
          :key="bp.id"
          class="blueprint-card"
          :class="{
            'blueprint-card--selected': store.config.blueprintId === bp.id
          }"
          @click="selectBlueprint(bp.id)"
          role="button"
          :aria-pressed="store.config.blueprintId === bp.id"
        >
          <!-- Glow Effect -->
          <div class="blueprint-card__glow"></div>

          <!-- Card Content -->
          <div class="blueprint-card__content">
            <!-- Icon -->
            <div class="blueprint-card__icon-wrap">
              <span class="blueprint-card__icon">{{ bp.icon }}</span>
            </div>

            <!-- Text -->
            <h3 class="blueprint-card__name">{{ bp.label }}</h3>
            <p class="blueprint-card__desc">{{ bp.description }}</p>
          </div>

          <!-- Recommended Badge -->
          <span v-if="bp.isRecommended" class="blueprint-card__badge">{{ t('styleStep.arrangementStyle.recommendedBadge') }}</span>

          <!-- Selection Indicator -->
          <div class="blueprint-card__check" v-if="store.config.blueprintId === bp.id">
            <span>✓</span>
          </div>
        </article>
      </div>

    </details>
  </div>
</template>

<style scoped>
.style-step {
  --step-accent: #8B5CF6;
  --accent-rgb: 139, 92, 246;
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.style-card {
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

.style-card__glow {
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

.style-card:hover {
  border-color: rgba(139, 92, 246, 0.25);
  transform: translateY(-4px);
  box-shadow: 0 16px 48px -16px rgba(0, 0, 0, 0.4);
}

.style-card:hover .style-card__glow {
  opacity: 0.15;
}

.style-card--selected,
.style-card--selected:hover {
  border-color: var(--card-accent, #8B5CF6);
  background: rgba(139, 92, 246, 0.08);
  box-shadow:
    0 0 0 2px var(--card-accent, #8B5CF6),
    0 0 40px -8px var(--card-accent, rgba(139, 92, 246, 0.4));
}

.style-card--selected .style-card__glow,
.style-card--selected:hover .style-card__glow {
  opacity: 0.25;
}

.style-card__content {
  position: relative;
  z-index: 1;
}

.style-card__icon-wrap {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1));
  border-radius: 12px;
  margin-bottom: 1rem;
}

.style-card__icon {
  font-size: 1.5rem;
  color: var(--card-accent, #8B5CF6);
  filter: drop-shadow(0 0 8px var(--card-accent, rgba(139, 92, 246, 0.4)));
}

.style-card__name {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #FAFAFA;
  margin: 0 0 0.375rem;
  letter-spacing: -0.01em;
}

.style-card__tagline {
  font-size: 0.85rem;
  color: rgba(250, 250, 250, 0.55);
  margin: 0;
  line-height: 1.4;
  padding-bottom: 1.75rem; /* Space for BPM badge */
}

.style-card__bpm {
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

.style-card__check {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-accent, #8B5CF6);
  border-radius: 50%;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 4px 12px -2px var(--card-accent, rgba(139, 92, 246, 0.5));
  animation: check-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes check-pop {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

@media (max-width: 640px) {
  .style-grid {
    grid-template-columns: 1fr;
  }

  .style-card {
    padding: 1.25rem;
  }
}

/* Arrangement Style Section */
.arrangement-section {
  margin-top: 2rem;
  background: rgba(20, 20, 28, 0.4);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 12px;
  overflow: hidden;
}

.arrangement-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}

.arrangement-summary:hover {
  background: rgba(139, 92, 246, 0.05);
}

.arrangement-icon {
  font-size: 1rem;
}

.arrangement-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.8);
}

.arrangement-value {
  flex: 1;
  font-size: 0.85rem;
  color: var(--step-accent);
  text-align: right;
}

.arrangement-chevron {
  font-size: 0.7rem;
  color: rgba(250, 250, 250, 0.4);
}

.arrangement-body {
  padding: 0 1.25rem 1rem;
}

.arrangement-description {
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.5);
  margin: 0 0 0.5rem;
  line-height: 1.5;
}

.arrangement-hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: rgba(139, 92, 246, 0.7);
  padding: 0.375rem 0.5rem;
  background: rgba(139, 92, 246, 0.08);
  border-radius: 6px;
  display: inline-block;
}

/* Blueprint Grid - 3 column card layout */
.blueprint-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding: 0 1rem 1rem;
}

.blueprint-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 120px;
  background: rgba(20, 20, 28, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.blueprint-card__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 60% at 50% 120%,
    var(--step-accent),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.blueprint-card:hover {
  border-color: rgba(139, 92, 246, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.3);
}

.blueprint-card:hover .blueprint-card__glow {
  opacity: 0.15;
}

.blueprint-card--selected,
.blueprint-card--selected:hover {
  border-color: var(--step-accent);
  background: rgba(139, 92, 246, 0.08);
  box-shadow:
    0 0 0 2px var(--step-accent),
    0 0 32px -8px rgba(139, 92, 246, 0.4);
}

.blueprint-card--selected .blueprint-card__glow,
.blueprint-card--selected:hover .blueprint-card__glow {
  opacity: 0.25;
}

.blueprint-card__content {
  position: relative;
  z-index: 1;
}

.blueprint-card__icon-wrap {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1));
  border-radius: 10px;
  margin-bottom: 0.75rem;
}

.blueprint-card__icon {
  font-size: 1.25rem;
  filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.4));
}

.blueprint-card__name {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: #FAFAFA;
  margin: 0 0 0.25rem;
  letter-spacing: -0.01em;
}

.blueprint-card__desc {
  font-size: 0.75rem;
  color: rgba(250, 250, 250, 0.5);
  margin: 0;
  line-height: 1.4;
}

.blueprint-card__badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--step-accent);
  background: rgba(139, 92, 246, 0.2);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  z-index: 2;
}

.blueprint-card__check {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--step-accent);
  border-radius: 50%;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  box-shadow: 0 2px 8px -2px rgba(139, 92, 246, 0.5);
  animation: check-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
}

@media (max-width: 900px) {
  .blueprint-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .arrangement-summary {
    padding: 0.875rem 1rem;
  }

  .blueprint-grid {
    grid-template-columns: 1fr;
    padding: 0 0.75rem 0.75rem;
  }

  .blueprint-card {
    min-height: 100px;
    padding: 0.875rem;
  }
}
</style>
