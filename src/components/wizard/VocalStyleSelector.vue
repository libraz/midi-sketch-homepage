<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

// Props
const props = defineProps<{
  melodyTemplate: number
  vocalAttitude: number
  vocalStyle: number
  vocalGroove: number
  melodicComplexity: number
  hookIntensity: number
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:melodyTemplate', value: number): void
  (e: 'update:vocalAttitude', value: number): void
  (e: 'update:vocalStyle', value: number): void
  (e: 'update:vocalGroove', value: number): void
  (e: 'update:melodicComplexity', value: number): void
  (e: 'update:hookIntensity', value: number): void
}>()

// Melody template options
const melodyTemplateOptions = [
  { key: 'auto', value: 0, icon: '🔮' },
  { key: 'plateauTalk', value: 1, icon: '💭' },
  { key: 'runUpTarget', value: 2, icon: '🎯' },
  { key: 'downResolve', value: 3, icon: '📉' },
  { key: 'hookRepeat', value: 4, icon: '🔁' },
  { key: 'sparseAnchor', value: 5, icon: '🎵' },
  { key: 'callResponse', value: 6, icon: '🎤' },
  { key: 'jumpAccent', value: 7, icon: '⚡' }
]

const vocalAttitudeOptions = [
  { key: 'clean', value: 0 },
  { key: 'expressive', value: 1 },
  { key: 'raw', value: 2 }
]

// Vocal style presets with icons
const vocalStyleOptions = [
  { key: 'auto', value: 0, icon: '🔮' },
  { key: 'standard', value: 1, icon: '🎵' },
  { key: 'vocaloid', value: 2, icon: '💫' },
  { key: 'ultraVocaloid', value: 3, icon: '⚡' },
  { key: 'idol', value: 4, icon: '🎀' },
  { key: 'ballad', value: 5, icon: '🌙' },
  { key: 'rock', value: 6, icon: '🎸' },
  { key: 'cityPop', value: 7, icon: '🌃' },
  { key: 'anime', value: 8, icon: '✨' },
  { key: 'brightKira', value: 9, icon: '☀' },
  { key: 'coolSynth', value: 10, icon: '🔷' },
  { key: 'cuteAffected', value: 11, icon: '🍬' },
  { key: 'powerfulShout', value: 12, icon: '🔥' }
]

// Vocal groove options
const vocalGrooveOptions = [
  { key: 'straight', value: 0, icon: '▬' },
  { key: 'offBeat', value: 1, icon: '⌐' },
  { key: 'swing', value: 2, icon: '♪' },
  { key: 'syncopated', value: 3, icon: '⚡' },
  { key: 'driving16th', value: 4, icon: '»' },
  { key: 'bouncy8th', value: 5, icon: '∿' }
]

// Melodic complexity options
const melodicComplexityOptions = [
  { key: 'simple', value: 0 },
  { key: 'standard', value: 1 },
  { key: 'complex', value: 2 }
]

// Hook intensity options
const hookIntensityOptions = [
  { key: 'off', value: 0 },
  { key: 'light', value: 1 },
  { key: 'normal', value: 2 },
  { key: 'strong', value: 3 }
]

// Get selected template key for description
const selectedTemplateKey = computed(() =>
  melodyTemplateOptions.find(o => o.value === props.melodyTemplate)?.key || 'auto'
)

const selectedStyleKey = computed(() =>
  vocalStyleOptions.find(o => o.value === props.vocalStyle)?.key || 'auto'
)

const selectedGrooveKey = computed(() =>
  vocalGrooveOptions.find(o => o.value === props.vocalGroove)?.key || 'straight'
)
</script>

<template>
  <div class="vocal-style-selector">
    <!-- Melody Template -->
    <section class="setting-section setting-section--featured">
      <h3 class="setting-label">
        <span class="setting-label__icon">🎹</span>
        <span>{{ t('melodyStep.advanced.melodyTemplate.label') }}</span>
      </h3>
      <p class="setting-description">{{ t('melodyStep.advanced.melodyTemplate.description') }}</p>

      <div class="compact-btns compact-btns--grid compact-btns--melody-template">
        <button
          v-for="opt in melodyTemplateOptions"
          :key="opt.key"
          class="compact-btn"
          :class="{ 'compact-btn--active': melodyTemplate === opt.value }"
          @click="emit('update:melodyTemplate', opt.value)"
        >
          <span class="compact-btn__icon">{{ opt.icon }}</span>
          <span>{{ t(`melodyStep.advanced.melodyTemplate.options.${opt.key}`) }}</span>
        </button>
      </div>
      <div v-if="melodyTemplate !== 0" class="selected-desc">
        <span class="selected-desc__text">{{ t(`melodyStep.advanced.melodyTemplate.options.${selectedTemplateKey}Desc`) }}</span>
      </div>
    </section>

    <!-- Vocal Attitude -->
    <section class="setting-section">
      <h3 class="setting-label">
        <span class="setting-label__icon">🎤</span>
        <span>{{ t('melodyStep.advanced.vocalAttitude.label') }}</span>
      </h3>
      <p class="setting-description">{{ t('melodyStep.advanced.vocalAttitude.description') }}</p>

      <div class="option-cards">
        <button
          v-for="option in vocalAttitudeOptions"
          :key="option.key"
          class="option-card"
          :class="{ 'option-card--active': vocalAttitude === option.value }"
          @click="emit('update:vocalAttitude', option.value)"
        >
          <span class="option-card__title">{{ t(`melodyStep.advanced.vocalAttitude.options.${option.key}`) }}</span>
          <span class="option-card__desc">{{ t(`melodyStep.advanced.vocalAttitude.options.${option.key}Desc`) }}</span>
        </button>
      </div>
    </section>

    <!-- Vocal Style -->
    <section class="setting-section">
      <h3 class="setting-label">
        <span class="setting-label__icon">🎼</span>
        <span>{{ t('melodyStep.advanced.vocalStyle.label') }}</span>
      </h3>
      <p class="setting-description">{{ t('melodyStep.advanced.vocalStyle.description') }}</p>

      <div class="compact-btns compact-btns--grid">
        <button
          v-for="opt in vocalStyleOptions"
          :key="opt.key"
          class="compact-btn"
          :class="{ 'compact-btn--active': vocalStyle === opt.value }"
          @click="emit('update:vocalStyle', opt.value)"
        >
          <span class="compact-btn__icon">{{ opt.icon }}</span>
          <span>{{ t(`melodyStep.advanced.vocalStyle.options.${opt.key}`) }}</span>
        </button>
      </div>
      <div v-if="vocalStyle !== 0" class="selected-desc">
        <span class="selected-desc__text">{{ t(`melodyStep.advanced.vocalStyle.options.${selectedStyleKey}Desc`) }}</span>
      </div>
    </section>

    <!-- Vocal Groove -->
    <section class="setting-section">
      <h3 class="setting-label">
        <span class="setting-label__icon">🎸</span>
        <span>{{ t('melodyStep.advanced.vocalGroove.label') }}</span>
      </h3>
      <p class="setting-description">{{ t('melodyStep.advanced.vocalGroove.description') }}</p>

      <div class="compact-btns compact-btns--grid">
        <button
          v-for="opt in vocalGrooveOptions"
          :key="opt.key"
          class="compact-btn"
          :class="{ 'compact-btn--active': vocalGroove === opt.value }"
          @click="emit('update:vocalGroove', opt.value)"
        >
          <span class="compact-btn__icon">{{ opt.icon }}</span>
          <span>{{ t(`melodyStep.advanced.vocalGroove.options.${opt.key}`) }}</span>
        </button>
      </div>
      <div v-if="vocalGroove !== 0" class="selected-desc">
        <span class="selected-desc__text">{{ t(`melodyStep.advanced.vocalGroove.options.${selectedGrooveKey}Desc`) }}</span>
      </div>
    </section>

    <!-- Melodic Complexity -->
    <section class="setting-section">
      <h3 class="setting-label">
        <span class="setting-label__icon">🎼</span>
        <span>{{ t('melodyStep.advanced.melodicComplexity.label') }}</span>
      </h3>
      <p class="setting-description">{{ t('melodyStep.advanced.melodicComplexity.description') }}</p>

      <div class="option-cards option-cards--row">
        <button
          v-for="opt in melodicComplexityOptions"
          :key="opt.key"
          class="option-card option-card--compact"
          :class="{ 'option-card--active': melodicComplexity === opt.value }"
          @click="emit('update:melodicComplexity', opt.value)"
        >
          <span class="option-card__title">{{ t(`melodyStep.advanced.melodicComplexity.options.${opt.key}`) }}</span>
        </button>
      </div>
    </section>

    <!-- Hook Intensity -->
    <section class="setting-section">
      <h3 class="setting-label">
        <span class="setting-label__icon">🔁</span>
        <span>{{ t('melodyStep.advanced.hookIntensity.label') }}</span>
      </h3>
      <p class="setting-description">{{ t('melodyStep.advanced.hookIntensity.description') }}</p>
      <p class="setting-hint">{{ t('melodyStep.advanced.hookIntensity.affectsHint') }}</p>

      <div class="option-cards option-cards--row">
        <button
          v-for="opt in hookIntensityOptions"
          :key="opt.key"
          class="option-card option-card--compact"
          :class="{ 'option-card--active': hookIntensity === opt.value }"
          @click="emit('update:hookIntensity', opt.value)"
        >
          <span class="option-card__title">{{ t(`melodyStep.advanced.hookIntensity.options.${opt.key}`) }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.vocal-style-selector {
  --accent-color: var(--step-accent, #EC4899);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-section {
  background: rgba(20, 20, 28, 0.4);
  border: 1px solid rgba(236, 72, 153, 0.1);
  border-radius: 16px;
  padding: 1.25rem;
}

.setting-section--featured {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(20, 20, 28, 0.5) 100%);
  border-color: rgba(236, 72, 153, 0.2);
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: #FAFAFA;
  margin: 0 0 0.5rem;
}

.setting-label__icon {
  font-size: 1rem;
}

.setting-description {
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.45);
  margin: 0 0 0.5rem;
}

.setting-hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: rgba(236, 72, 153, 0.7);
  margin: 0 0 1rem;
  padding: 0.375rem 0.5rem;
  background: rgba(236, 72, 153, 0.08);
  border-radius: 6px;
  display: inline-block;
}

.option-cards {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.875rem 1rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(236, 72, 153, 0.12);
  border-radius: 12px;
  font-family: 'Instrument Sans', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.option-card:hover {
  border-color: rgba(236, 72, 153, 0.3);
  background: rgba(236, 72, 153, 0.05);
}

.option-card--active {
  background: rgba(236, 72, 153, 0.15);
  border-color: var(--accent-color);
}

.option-card__title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #FAFAFA;
}

.option-card--active .option-card__title {
  color: var(--accent-color);
}

.option-card__desc {
  font-size: 0.75rem;
  font-weight: 400;
  color: rgba(250, 250, 250, 0.5);
  line-height: 1.4;
}

.option-card--active .option-card__desc {
  color: rgba(250, 250, 250, 0.7);
}

.option-cards--row {
  flex-direction: row;
  flex-wrap: wrap;
}

.option-card--compact {
  flex: 1;
  min-width: 80px;
  align-items: center;
  padding: 0.625rem 0.75rem;
}

.option-card--compact .option-card__title {
  font-size: 0.8rem;
}

/* Compact Buttons Grid */
.compact-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.compact-btns--grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.compact-btns--melody-template {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 480px) {
  .compact-btns--melody-template {
    grid-template-columns: repeat(2, 1fr);
  }
}

.compact-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.5rem 0.5rem;
  background: rgba(30, 30, 42, 0.6);
  border: 1px solid rgba(236, 72, 153, 0.12);
  border-radius: 8px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.compact-btn:hover {
  border-color: rgba(236, 72, 153, 0.3);
  color: #FAFAFA;
  background: rgba(236, 72, 153, 0.08);
}

.compact-btn--active {
  background: rgba(236, 72, 153, 0.2);
  border-color: var(--accent-color);
  color: #FAFAFA;
  box-shadow: 0 0 12px -4px rgba(236, 72, 153, 0.4);
}

.compact-btn__icon {
  font-size: 0.9rem;
}

/* Selected Description */
.selected-desc {
  margin-top: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.08) 100%);
  border: 1px solid rgba(236, 72, 153, 0.2);
  border-radius: 10px;
  animation: descFadeIn 0.2s ease-out;
}

@keyframes descFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.selected-desc__text {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.75);
  line-height: 1.5;
}

@media (max-width: 640px) {
  .option-card {
    padding: 0.75rem 0.875rem;
  }

  .option-card__title {
    font-size: 0.85rem;
  }

  .option-card__desc {
    font-size: 0.7rem;
  }

  .compact-btns--grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
