<script setup lang="ts">
import KeyTempoSection from '@/components/wizard/KeyTempoSection.vue'
</script>

<template>
  <div class="key-tempo-card">
    <KeyTempoSection accent-color="purple" />
  </div>
</template>

<style scoped>
.key-tempo-card {
  --step-accent: var(--studio-purple);
  --accent-rgb: var(--studio-purple-rgb);
}
</style>
