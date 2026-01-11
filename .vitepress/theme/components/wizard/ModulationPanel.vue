<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useWizardStore } from '../../stores/useWizardStore'
import SettingSection from './SettingSection.vue'
import OptionCard from './OptionCard.vue'

const { t } = useI18n()
const store = useWizardStore()

// Modulation timing options
const modulationTimingOptions = [
  { key: 'none', value: 0 },
  { key: 'lastChorus', value: 1 },
  { key: 'afterBridge', value: 2 },
  { key: 'eachChorus', value: 3 },
  { key: 'random', value: 4 }
]

// Semitones options
const semitonesOptions = [
  { value: 1, label: '+1' },
  { value: 2, label: '+2' },
  { value: 3, label: '+3' },
  { value: 4, label: '+4' }
]

// Current timing option for description
const currentTimingOption = computed(() =>
  modulationTimingOptions.find(o => o.value === store.config.modulationTiming)
)
</script>

<template>
  <SettingSection
    icon="♯♭"
    :title="t('settingsStep.tabs.modulation')"
    :description="t('settingsStep.advanced.modulation.description')"
  >
    <!-- Timing Selection -->
    <div class="modulation-timing">
      <label class="sub-label">{{ t('settingsStep.advanced.modulation.timing') }}</label>
      <div class="option-cards option-cards--row">
        <OptionCard
          v-for="option in modulationTimingOptions"
          :key="option.key"
          :title="t(`settingsStep.advanced.modulation.timingOptions.${option.key}`)"
          :is-active="store.config.modulationTiming === option.value"
          compact
          @select="store.config.modulationTiming = option.value"
        />
      </div>
    </div>

    <!-- Semitones Selection (only when modulation is enabled) -->
    <div v-if="store.config.modulationTiming !== 0" class="modulation-semitones">
      <label class="sub-label">{{ t('settingsStep.advanced.modulation.semitones') }}</label>
      <p class="sub-hint">{{ t('settingsStep.advanced.modulation.semitonesHint') }}</p>
      <div class="option-cards option-cards--row">
        <OptionCard
          v-for="option in semitonesOptions"
          :key="option.value"
          :title="option.label"
          :is-active="store.config.modulationSemitones === option.value"
          compact
          @select="store.config.modulationSemitones = option.value"
        />
      </div>
    </div>
  </SettingSection>
</template>

<style scoped>
.modulation-timing {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modulation-semitones {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(var(--accent-rgb, 139, 92, 246), 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sub-label {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.8);
}

.sub-hint {
  font-size: 0.7rem;
  color: rgba(250, 250, 250, 0.45);
  margin: 0;
}

/* Option cards container */
.option-cards {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Horizontal option cards */
.option-cards--row {
  flex-direction: row;
  flex-wrap: wrap;
}
</style>
