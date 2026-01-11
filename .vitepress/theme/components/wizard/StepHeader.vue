<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header class="step-header">
    <h2 class="step-header__title">{{ title }}</h2>
    <p v-if="subtitle" class="step-header__subtitle">{{ subtitle }}</p>
  </header>
</template>

<style scoped>
.step-header {
  text-align: center;
  margin-bottom: 2rem;
}

.step-header__title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #FAFAFA;
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
}

.step-header__subtitle {
  font-size: 0.9rem;
  color: rgba(250, 250, 250, 0.5);
  margin: 0;
}

@media (max-width: 640px) {
  .step-header {
    margin-bottom: 1.5rem;
  }

  .step-header__title {
    font-size: 1.25rem;
  }

  .step-header__subtitle {
    font-size: 0.85rem;
  }
}
</style>
