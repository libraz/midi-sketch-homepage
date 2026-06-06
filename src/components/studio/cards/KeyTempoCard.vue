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
  --step-accent: #8B5CF6;
  --accent-rgb: 139, 92, 246;
}
</style>
