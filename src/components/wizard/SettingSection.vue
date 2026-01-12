<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  description?: string
  featured?: boolean
}>()
</script>

<template>
  <section class="setting-section" :class="{ 'setting-section--featured': featured }">
    <h3 class="setting-label">
      <span v-if="icon" class="setting-label__icon">{{ icon }}</span>
      <span>{{ title }}</span>
    </h3>
    <p v-if="description" class="setting-description">{{ description }}</p>
    <slot />
  </section>
</template>

<style scoped>
.setting-section {
  background: rgba(20, 20, 28, 0.4);
  border: 1px solid rgba(var(--accent-rgb, 139, 92, 246), 0.1);
  border-radius: 16px;
  padding: 1.25rem;
}

.setting-section--featured {
  background: linear-gradient(
    135deg,
    rgba(var(--accent-rgb, 139, 92, 246), 0.08) 0%,
    rgba(20, 20, 28, 0.5) 100%
  );
  border-color: rgba(var(--accent-rgb, 139, 92, 246), 0.2);
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
  margin: 0 0 1rem;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .setting-section {
    padding: 1rem;
  }

  .setting-label {
    font-size: 0.9rem;
  }

  .setting-description {
    font-size: 0.75rem;
  }
}
</style>
