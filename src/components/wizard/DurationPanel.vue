<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import SettingSection from './SettingSection.vue'

const { t } = useI18n()
const store = useWizardStore()

// Duration presets
const durationPresets = [
  { label: '1:30', seconds: 90 },
  { label: '2:00', seconds: 120 },
  { label: '2:30', seconds: 150 },
  { label: '3:00', seconds: 180 },
  { label: '4:00', seconds: 240 }
]

// Formatted duration display
const formattedDuration = computed(() => {
  const seconds = store.config.targetDurationSeconds
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})
</script>

<template>
  <SettingSection
    icon="⏱"
    :title="t('settingsStep.duration.label')"
    :description="t('settingsStep.duration.description')"
  >
    <div class="duration-content">
      <!-- Current Duration Display -->
      <div class="duration-display">{{ formattedDuration }}</div>

      <!-- Preset Buttons -->
      <div class="duration-presets">
        <button
          v-for="preset in durationPresets"
          :key="preset.seconds"
          class="duration-btn"
          :class="{ 'duration-btn--active': store.config.targetDurationSeconds === preset.seconds }"
          @click="store.config.targetDurationSeconds = preset.seconds"
        >{{ preset.label }}</button>
      </div>

      <!-- Slider -->
      <div class="slider-row">
        <span class="slider-label">1:00</span>
        <input
          type="range"
          v-model.number="store.config.targetDurationSeconds"
          min="60"
          max="300"
          step="15"
          class="duration-slider"
        />
        <span class="slider-label">5:00</span>
      </div>
    </div>
  </SettingSection>
</template>

<style scoped>
.duration-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.duration-display {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  color: var(--section-accent, var(--studio-purple));
  text-shadow: 0 0 16px rgba(var(--section-accent-rgb, 139, 92, 246), 0.4);
}

.duration-presets {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.duration-btn {
  padding: 0.4rem 0.75rem;
  background: rgba(var(--studio-panel-raised-rgb), 0.6);
  border: 1px solid rgba(var(--section-accent-rgb, 139, 92, 246), 0.12);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(var(--studio-ink-rgb), 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.duration-btn:hover {
  border-color: rgba(var(--section-accent-rgb, 139, 92, 246), 0.3);
  color: var(--studio-text-primary);
}

.duration-btn--active {
  background: rgba(var(--section-accent-rgb, 139, 92, 246), 0.2);
  border-color: var(--section-accent, var(--studio-purple));
  color: var(--studio-text-primary);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.slider-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: rgba(var(--studio-ink-rgb), 0.4);
  min-width: 2rem;
}

.slider-label:last-child {
  text-align: right;
}

.duration-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(var(--section-accent-rgb, 139, 92, 246), 0.15);
  border-radius: 3px;
  cursor: pointer;
}

.duration-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: var(--section-accent, var(--studio-purple));
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(var(--section-accent-rgb, 139, 92, 246), 0.4);
}

.duration-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--section-accent, var(--studio-purple));
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(var(--section-accent-rgb, 139, 92, 246), 0.4);
}
</style>
