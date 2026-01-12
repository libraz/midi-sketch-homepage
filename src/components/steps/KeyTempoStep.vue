<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'
import StepHeader from '@/components/wizard/StepHeader.vue'
import KeyTempoSection from '@/components/wizard/KeyTempoSection.vue'

const { t } = useI18n()
</script>

<template>
  <div class="key-tempo-step">
    <!-- Header -->
    <StepHeader
      :title="t('keyTempoStep.title')"
      :subtitle="t('keyTempoStep.subtitle')"
    />

    <!-- Key & Tempo Selection -->
    <KeyTempoSection accent-color="purple" />
  </div>
</template>

<style scoped>
.key-tempo-step {
  --step-accent: #8B5CF6;
  --accent-rgb: 139, 92, 246;
}
</style>
