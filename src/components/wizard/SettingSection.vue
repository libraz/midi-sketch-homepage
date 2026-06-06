<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  description?: string
  hint?: string
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
    <p v-if="hint" class="setting-hint">{{ hint }}</p>
    <slot />
  </section>
</template>

<style scoped>
.setting-section {
  background: rgba(var(--studio-panel-rgb), 0.4);
  border: 1px solid rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.1);
  border-radius: 16px;
  padding: 1.25rem;
}

.setting-section--featured {
  background: linear-gradient(
    135deg,
    rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.08) 0%,
    rgba(var(--studio-panel-rgb), 0.5) 100%
  );
  border-color: rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.2);
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--studio-text-primary);
  margin: 0 0 0.5rem;
}

.setting-label__icon {
  font-size: 1rem;
}

.setting-description {
  font-size: 0.8rem;
  color: rgba(var(--studio-ink-rgb), 0.45);
  margin: 0 0 0.5rem;
  line-height: 1.5;
}

.setting-hint {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.7);
  margin: 0 0 1rem;
  padding: 0.375rem 0.5rem;
  background: rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.08);
  border-radius: 6px;
  display: inline-block;
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
