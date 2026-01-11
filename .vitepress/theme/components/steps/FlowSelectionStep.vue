<script setup lang="ts">
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import StepHeader from '../wizard/StepHeader.vue'

const { t } = useI18n()
const store = useWizardStore()

// Flow type options
const flowOptions = [
  {
    key: 'vocalFirst',
    value: 'vocal-first' as const,
    icon: '🎤'
  },
  {
    key: 'bgmOnly',
    value: 'bgm-only' as const,
    icon: '🎹'
  }
]

function selectFlowType(flowType: 'vocal-first' | 'bgm-only') {
  store.config.flowType = flowType

  // Reset composition style to MelodyLead when switching to vocal-first
  if (flowType === 'vocal-first') {
    store.config.compositionStyle = 0
  }
}
</script>

<template>
  <div class="flow-selection-step">
    <!-- Header -->
    <StepHeader
      :title="t('flowSelectionStep.title')"
      :subtitle="t('flowSelectionStep.subtitle')"
    />

    <!-- Flow Type Selection -->
    <div class="flow-options">
      <article
        v-for="option in flowOptions"
        :key="option.key"
        class="flow-card"
        :class="{
          'flow-card--selected': store.config.flowType === option.value,
          'flow-card--vocal': option.value === 'vocal-first',
          'flow-card--bgm': option.value === 'bgm-only'
        }"
        @click="selectFlowType(option.value)"
        role="button"
        :aria-pressed="store.config.flowType === option.value"
      >
        <!-- Glow Effect -->
        <div class="flow-card__glow"></div>

        <!-- Card Content -->
        <div class="flow-card__content">
          <!-- Icon -->
          <div class="flow-card__icon-wrap">
            <span class="flow-card__icon">{{ option.icon }}</span>
          </div>

          <!-- Text -->
          <h3 class="flow-card__name">{{ t(`flowSelectionStep.options.${option.key}.title`) }}</h3>
          <p class="flow-card__desc">{{ t(`flowSelectionStep.options.${option.key}.description`) }}</p>

          <!-- Feature list -->
          <ul class="flow-card__features">
            <li v-for="(_, idx) in 3" :key="idx">
              {{ t(`flowSelectionStep.options.${option.key}.feature${idx + 1}`) }}
            </li>
          </ul>
        </div>

        <!-- Selection Indicator -->
        <div class="flow-card__check" v-if="store.config.flowType === option.value">
          <span>✓</span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.flow-selection-step {
  --step-accent: #8B5CF6;
  --accent-rgb: 139, 92, 246;
  --vocal-accent: #EC4899;
  --bgm-accent: #60A5FA;
}

/* Flow Options Grid */
.flow-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 640px) {
  .flow-options {
    grid-template-columns: 1fr;
  }
}

/* Flow Card */
.flow-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 280px;
  background: rgba(20, 20, 28, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.flow-card__glow {
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

.flow-card--vocal {
  --card-accent: var(--vocal-accent);
}

.flow-card--bgm {
  --card-accent: var(--bgm-accent);
}

.flow-card:hover {
  border-color: rgba(139, 92, 246, 0.25);
  transform: translateY(-4px);
  box-shadow: 0 16px 48px -16px rgba(0, 0, 0, 0.4);
}

.flow-card:hover .flow-card__glow {
  opacity: 0.15;
}

.flow-card--selected,
.flow-card--selected:hover {
  border-color: var(--card-accent);
  background: rgba(139, 92, 246, 0.08);
  box-shadow:
    0 0 0 2px var(--card-accent),
    0 0 40px -8px color-mix(in srgb, var(--card-accent) 40%, transparent);
}

.flow-card--selected .flow-card__glow,
.flow-card--selected:hover .flow-card__glow {
  opacity: 0.25;
}

.flow-card__content {
  position: relative;
  z-index: 1;
}

.flow-card__icon-wrap {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1));
  border-radius: 14px;
  margin-bottom: 1rem;
}

.flow-card--vocal .flow-card__icon-wrap {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(236, 72, 153, 0.1));
}

.flow-card--bgm .flow-card__icon-wrap {
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(96, 165, 250, 0.1));
}

.flow-card__icon {
  font-size: 1.75rem;
  filter: drop-shadow(0 0 8px var(--card-accent, rgba(139, 92, 246, 0.4)));
}

.flow-card__name {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #FAFAFA;
  margin: 0 0 0.5rem;
  letter-spacing: -0.01em;
}

.flow-card__desc {
  font-size: 0.875rem;
  color: rgba(250, 250, 250, 0.6);
  margin: 0 0 1rem;
  line-height: 1.5;
}

.flow-card__features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.flow-card__features li {
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.5);
  padding-left: 1.25rem;
  position: relative;
}

.flow-card__features li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: var(--card-accent, rgba(139, 92, 246, 0.7));
}

.flow-card__check {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-accent);
  border-radius: 50%;
  color: white;
  font-size: 0.875rem;
  font-weight: 700;
  box-shadow: 0 4px 12px -2px color-mix(in srgb, var(--card-accent) 50%, transparent);
  animation: check-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes check-pop {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}
</style>
