<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useWizardStore } from '../stores/useWizardStore'
import { useMidiPlayer } from '../composables/useMidiPlayer'
import StyleStep from './steps/StyleStep.vue'
import ChordStep from './steps/ChordStep.vue'
import SettingsStep from './steps/SettingsStep.vue'
import BgmStep from './steps/BgmStep.vue'
import MelodyStep from './steps/MelodyStep.vue'
import FinalStep from './steps/FinalStep.vue'

const { t } = useI18n()
const store = useWizardStore()
const { stop: stopPlayer } = useMidiPlayer()

const steps = computed(() => [
  { number: 1, label: t('wizard.steps.style'), icon: '✦' },
  { number: 2, label: t('wizard.steps.chords'), icon: '♫' },
  { number: 3, label: t('wizard.steps.keyTempo'), icon: '◈' },
  { number: 4, label: t('wizard.steps.bgm'), icon: '♩' },
  { number: 5, label: t('wizard.steps.melody'), icon: '♪' },
  { number: 6, label: t('wizard.steps.complete'), icon: '✓' }
])

const isAnimating = ref(false)

// Check if Next button should be enabled
const canProceed = computed(() => {
  if (store.currentStep.value === 4) {
    // On BGM step, check if generation is complete
    return store.bgmGenerated.value
  }
  return store.canGoNext.value
})

watch(() => store.currentStep.value, () => {
  // Stop playback when changing steps
  stopPlayer()
  isAnimating.value = true
  setTimeout(() => isAnimating.value = false, 400)
})

function handleNext() {
  if (canProceed.value) {
    store.nextStep()
  }
}

function handleBack() {
  if (store.canGoBack.value) {
    store.prevStep()
  }
}

onMounted(() => {
  isAnimating.value = true
  setTimeout(() => isAnimating.value = false, 600)
})
</script>

<template>
  <div class="noir-wizard">
    <!-- Atmospheric Background -->
    <div class="noir-wizard__atmosphere">
      <div class="noir-wizard__gradient-orb noir-wizard__gradient-orb--purple"></div>
      <div class="noir-wizard__gradient-orb noir-wizard__gradient-orb--pink"></div>
      <div class="noir-wizard__noise"></div>
      <div class="noir-wizard__scanlines"></div>
    </div>

    <!-- Header with Logo Mark -->
    <header class="noir-wizard__header">
      <div class="noir-wizard__logo">
        <span class="noir-wizard__logo-icon">◈</span>
        <span class="noir-wizard__logo-text">{{ t('wizard.logo') }}</span>
      </div>
      <div class="noir-wizard__subtitle">{{ t('wizard.subtitle') }}</div>
    </header>

    <!-- Stepper -->
    <nav class="noir-stepper" role="tablist">
      <template v-for="(step, index) in steps" :key="step.number">
        <button
          class="noir-stepper__step"
          :class="{
            'noir-stepper__step--active': store.currentStep.value === step.number,
            'noir-stepper__step--completed': store.currentStep.value > step.number,
            'noir-stepper__step--upcoming': store.currentStep.value < step.number,
            'noir-stepper__step--disabled': step.number > store.currentStep.value
          }"
          role="tab"
          :aria-selected="store.currentStep.value === step.number"
          :disabled="step.number > store.currentStep.value"
          @click="step.number <= store.currentStep.value && store.goToStep(step.number)"
        >
          <span class="noir-stepper__indicator">
            <span class="noir-stepper__number">{{ step.icon }}</span>
            <span class="noir-stepper__pulse" v-if="store.currentStep.value === step.number"></span>
          </span>
          <span class="noir-stepper__label">{{ step.label }}</span>
        </button>

        <div
          v-if="index < steps.length - 1"
          class="noir-stepper__connector"
          :class="{ 'noir-stepper__connector--active': store.currentStep.value > step.number }"
        >
          <div class="noir-stepper__connector-line"></div>
          <div class="noir-stepper__connector-glow"></div>
        </div>
      </template>
    </nav>

    <!-- Content Area -->
    <main class="noir-wizard__content" :class="{ 'noir-wizard__content--animating': isAnimating }">
      <div class="noir-wizard__panel">
        <Transition name="noir-fade" mode="out-in">
          <StyleStep v-if="store.currentStep.value === 1" :key="1" />
          <ChordStep v-else-if="store.currentStep.value === 2" :key="2" />
          <SettingsStep v-else-if="store.currentStep.value === 3" :key="3" />
          <BgmStep v-else-if="store.currentStep.value === 4" :key="`bgm-${store.bgmVersion.value}`" />
          <MelodyStep v-else-if="store.currentStep.value === 5" :key="5" />
          <FinalStep v-else-if="store.currentStep.value === 6" :key="`final-${store.melodyVersion.value}`" />
        </Transition>
      </div>
    </main>

    <!-- Navigation Footer -->
    <footer class="noir-wizard__nav">
      <button
        class="noir-btn noir-btn--ghost"
        :disabled="!store.canGoBack.value"
        @click="handleBack"
      >
        <span class="noir-btn__icon">←</span>
        <span>{{ t('wizard.nav.back') }}</span>
      </button>

      <div class="noir-wizard__step-indicator">
        <span class="noir-wizard__step-current">{{ store.currentStep.value }}</span>
        <span class="noir-wizard__step-divider">/</span>
        <span class="noir-wizard__step-total">{{ store.totalSteps }}</span>
      </div>

      <button
        v-if="store.currentStep.value < store.totalSteps"
        class="noir-btn noir-btn--primary"
        :disabled="!canProceed"
        @click="handleNext"
      >
        <span>{{ store.currentStep.value === 5 ? t('wizard.nav.generateMelody') : t('wizard.nav.next') }}</span>
        <span class="noir-btn__icon">→</span>
      </button>
      <div v-else class="noir-btn--placeholder"></div>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Sans:wght@400;500;600;700&display=swap');

.noir-wizard {
  --noir-bg-deep: #07070A;
  --noir-bg-panel: rgba(14, 14, 20, 0.85);
  --noir-bg-surface: rgba(22, 22, 32, 0.7);
  --noir-purple: #8B5CF6;
  --noir-purple-dim: rgba(139, 92, 246, 0.15);
  --noir-purple-glow: rgba(139, 92, 246, 0.4);
  --noir-pink: #EC4899;
  --noir-pink-dim: rgba(236, 72, 153, 0.15);
  --noir-text-primary: #FAFAFA;
  --noir-text-secondary: rgba(250, 250, 250, 0.6);
  --noir-text-muted: rgba(250, 250, 250, 0.35);
  --noir-border: rgba(139, 92, 246, 0.12);
  --noir-border-active: rgba(139, 92, 246, 0.35);

  position: relative;
  background: var(--noir-bg-deep);
  border-radius: 24px;
  overflow: hidden;
  font-family: 'Instrument Sans', -apple-system, sans-serif;
  isolation: isolate;
}

.noir-wizard__atmosphere {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.noir-wizard__gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.5;
  animation: orb-drift 20s ease-in-out infinite;
}

.noir-wizard__gradient-orb--purple {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, var(--noir-purple) 0%, transparent 70%);
  top: -200px;
  left: -100px;
  animation-delay: 0s;
}

.noir-wizard__gradient-orb--pink {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--noir-pink) 0%, transparent 70%);
  bottom: -100px;
  right: -50px;
  animation-delay: -10s;
}

@keyframes orb-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 15px) scale(0.95); }
}

.noir-wizard__noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.03;
  mix-blend-mode: overlay;
}

.noir-wizard__scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
  pointer-events: none;
}

.noir-wizard__header {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2.5rem 2rem 1.5rem;
}

.noir-wizard__logo {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.noir-wizard__logo-icon {
  font-size: 1.5rem;
  color: var(--noir-purple);
  text-shadow: 0 0 20px var(--noir-purple-glow);
  animation: icon-pulse 3s ease-in-out infinite;
}

@keyframes icon-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.noir-wizard__logo-text {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.75rem;
  letter-spacing: 0.2em;
  color: var(--noir-text-primary);
  text-shadow: 0 0 40px rgba(255, 255, 255, 0.1);
}

.noir-wizard__subtitle {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--noir-text-muted);
}

.noir-stepper {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0;
  padding: 1rem 2rem 2rem;
}

.noir-stepper__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.noir-stepper__indicator {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--noir-bg-surface);
  border: 1px solid var(--noir-border);
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.noir-stepper__number {
  font-size: 1.25rem;
  color: var(--noir-text-muted);
  transition: all 0.3s ease;
}

.noir-stepper__pulse {
  position: absolute;
  inset: -4px;
  border-radius: 14px;
  border: 2px solid var(--noir-purple);
  opacity: 0;
  animation: step-pulse 2s ease-out infinite;
}

@keyframes step-pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  100% { transform: scale(1.15); opacity: 0; }
}

.noir-stepper__label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--noir-text-muted);
  transition: color 0.3s ease;
  white-space: nowrap;
  text-align: center;
}

.noir-stepper__step--active .noir-stepper__indicator {
  background: linear-gradient(135deg, var(--noir-purple) 0%, #7C3AED 100%);
  border-color: transparent;
  box-shadow:
    0 0 0 1px rgba(139, 92, 246, 0.3),
    0 8px 32px -8px var(--noir-purple-glow),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.noir-stepper__step--active .noir-stepper__number {
  color: white;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.noir-stepper__step--active .noir-stepper__label {
  color: var(--noir-text-primary);
}

.noir-stepper__step--completed .noir-stepper__indicator {
  background: var(--noir-purple-dim);
  border-color: var(--noir-purple);
}

.noir-stepper__step--completed .noir-stepper__number {
  color: var(--noir-purple);
}

.noir-stepper__step--completed .noir-stepper__label {
  color: var(--noir-text-secondary);
}

.noir-stepper__step:hover:not(.noir-stepper__step--active):not(:disabled) .noir-stepper__indicator {
  background: var(--noir-bg-surface);
  border-color: var(--noir-border-active);
  transform: translateY(-2px);
}

.noir-stepper__step--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.noir-stepper__step--disabled .noir-stepper__indicator {
  background: rgba(30, 30, 40, 0.5);
  border-color: rgba(255, 255, 255, 0.03);
}

.noir-stepper__step--disabled .noir-stepper__number {
  color: rgba(255, 255, 255, 0.2);
}

.noir-stepper__connector {
  position: relative;
  width: 32px;
  height: 2px;
  margin: 0 0.25rem;
  margin-bottom: 1.5rem;
}

.noir-stepper__connector-line {
  position: absolute;
  inset: 0;
  background: var(--noir-border);
  border-radius: 1px;
}

.noir-stepper__connector-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--noir-purple), var(--noir-pink));
  border-radius: 1px;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.noir-stepper__connector--active .noir-stepper__connector-glow {
  transform: scaleX(1);
  box-shadow: 0 0 12px var(--noir-purple-glow);
}

.noir-wizard__content {
  position: relative;
  z-index: 1;
  padding: 0 2rem;
}

.noir-wizard__panel {
  background: var(--noir-bg-panel);
  border: 1px solid var(--noir-border);
  border-radius: 20px;
  padding: 2rem;
  min-height: 400px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 24px 48px -12px rgba(0, 0, 0, 0.5);
}

.noir-fade-enter-active,
.noir-fade-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.noir-fade-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.noir-fade-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}

.noir-wizard__nav {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem 2rem;
}

.noir-wizard__step-indicator {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  font-family: 'Bebas Neue', sans-serif;
}

.noir-wizard__step-current {
  font-size: 1.5rem;
  color: var(--noir-purple);
  text-shadow: 0 0 20px var(--noir-purple-glow);
}

.noir-wizard__step-divider {
  font-size: 1rem;
  color: var(--noir-text-muted);
  margin: 0 0.125rem;
}

.noir-wizard__step-total {
  font-size: 1rem;
  color: var(--noir-text-muted);
}

.noir-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.noir-btn__icon {
  font-size: 1.1rem;
  transition: transform 0.25s ease;
}

.noir-btn--ghost {
  background: transparent;
  border: 1px solid var(--noir-border);
  color: var(--noir-text-secondary);
}

.noir-btn--ghost:hover:not(:disabled) {
  background: var(--noir-bg-surface);
  border-color: var(--noir-border-active);
  color: var(--noir-text-primary);
}

.noir-btn--ghost:hover:not(:disabled) .noir-btn__icon {
  transform: translateX(-4px);
}

.noir-btn--ghost:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.noir-btn--primary {
  background: linear-gradient(135deg, var(--noir-purple) 0%, #7C3AED 100%);
  border: none;
  color: white;
  box-shadow:
    0 0 0 1px rgba(139, 92, 246, 0.3),
    0 8px 24px -8px var(--noir-purple-glow);
}

.noir-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow:
    0 0 0 1px rgba(139, 92, 246, 0.4),
    0 12px 32px -8px var(--noir-purple-glow),
    0 0 40px -8px var(--noir-purple-glow);
}

.noir-btn--primary:hover:not(:disabled) .noir-btn__icon {
  transform: translateX(4px);
}

.noir-btn--primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.noir-btn--placeholder {
  width: 120px;
}

@media (max-width: 640px) {
  .noir-wizard {
    min-height: auto;
    border-radius: 16px;
  }

  .noir-wizard__header {
    padding: 1.5rem 1rem 1rem;
  }

  .noir-wizard__logo-text {
    font-size: 1.25rem;
  }

  .noir-stepper {
    padding: 0.5rem 1rem 1.5rem;
    gap: 0;
  }

  .noir-stepper__step {
    padding: 0.5rem;
  }

  .noir-stepper__indicator {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }

  .noir-stepper__number {
    font-size: 1rem;
  }

  .noir-stepper__label {
    display: none;
  }

  .noir-stepper__connector {
    width: 16px;
    margin-bottom: 0;
  }

  .noir-wizard__content {
    padding: 0;
  }

  .noir-wizard__panel {
    padding: 1.25rem 0;
    border-radius: 16px;
  }

  .noir-wizard__nav {
    padding: 1rem;
  }

  .noir-btn {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
  }
}
</style>
