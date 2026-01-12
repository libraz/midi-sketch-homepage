<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
  badge?: string
  badgeColor?: string
  isSelected: boolean
  isPrimary?: boolean
  isAnimating?: boolean
  accentColor?: string
}>()

const emit = defineEmits<{
  (e: 'select'): void
}>()
</script>

<template>
  <div
    class="selectable-card"
    :class="{
      'selectable-card--selected': isSelected,
      'selectable-card--primary': isPrimary,
      'selectable-card--animating': isAnimating
    }"
    :style="accentColor ? { '--card-accent': accentColor } : undefined"
    @click="emit('select')"
  >
    <!-- Glow layer -->
    <div class="selectable-card__glow"></div>

    <!-- Badge -->
    <div
      v-if="badge"
      class="selectable-card__badge"
      :style="badgeColor ? { '--badge-color': badgeColor } : undefined"
    >
      {{ badge }}
    </div>

    <!-- Content -->
    <div class="selectable-card__content">
      <div v-if="icon" class="selectable-card__icon">{{ icon }}</div>
      <h3 class="selectable-card__title">{{ title }}</h3>
      <p v-if="description" class="selectable-card__desc">{{ description }}</p>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.selectable-card {
  --card-accent: rgb(var(--accent-rgb, 139, 92, 246));
  --badge-color: var(--card-accent);

  position: relative;
  display: flex;
  flex-direction: column;
  background: rgba(20, 20, 28, 0.6);
  border: 1px solid rgba(var(--accent-rgb, 139, 92, 246), 0.1);
  border-radius: 16px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.selectable-card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--accent-rgb, 139, 92, 246), 0.3);
  background: rgba(var(--accent-rgb, 139, 92, 246), 0.05);
}

.selectable-card--selected {
  border-color: var(--card-accent);
  border-width: 2px;
  background: rgba(var(--accent-rgb, 139, 92, 246), 0.12);
  box-shadow:
    0 0 0 2px var(--card-accent),
    0 0 40px -8px var(--card-accent);
}

.selectable-card--primary {
  border-color: rgba(245, 158, 11, 0.3);
}

.selectable-card--primary.selectable-card--selected {
  border-color: #F59E0B;
  box-shadow:
    0 0 0 2px #F59E0B,
    0 0 40px -8px rgba(245, 158, 11, 0.4);
}

.selectable-card--animating {
  animation: selected-glow 2s ease-in-out infinite;
}

@keyframes selected-glow {
  0%, 100% {
    box-shadow:
      0 0 0 3px rgba(var(--accent-rgb, 139, 92, 246), 0.15),
      0 0 24px -4px rgba(var(--accent-rgb, 139, 92, 246), 0.3);
  }
  50% {
    box-shadow:
      0 0 0 4px rgba(var(--accent-rgb, 139, 92, 246), 0.2),
      0 0 36px -4px rgba(var(--accent-rgb, 139, 92, 246), 0.4);
  }
}

/* Glow layer */
.selectable-card__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 0%,
    rgba(var(--accent-rgb, 139, 92, 246), 0.1) 0%,
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.selectable-card:hover .selectable-card__glow,
.selectable-card--selected .selectable-card__glow {
  opacity: 1;
}

/* Badge */
.selectable-card__badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.25rem 0.625rem;
  background: rgba(var(--accent-rgb, 139, 92, 246), 0.15);
  border: 1px solid rgba(var(--accent-rgb, 139, 92, 246), 0.25);
  border-radius: 100px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--badge-color);
}

/* Content */
.selectable-card__content {
  position: relative;
  z-index: 1;
}

.selectable-card__icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  filter: drop-shadow(0 2px 8px rgba(var(--accent-rgb, 139, 92, 246), 0.3));
}

.selectable-card__title {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #FAFAFA;
  margin: 0 0 0.5rem;
}

.selectable-card--selected .selectable-card__title {
  color: var(--card-accent);
}

.selectable-card__desc {
  font-size: 0.8rem;
  color: rgba(250, 250, 250, 0.5);
  margin: 0;
  line-height: 1.4;
}

.selectable-card--selected .selectable-card__desc {
  color: rgba(250, 250, 250, 0.7);
}

@media (max-width: 640px) {
  .selectable-card {
    padding: 1rem;
  }

  .selectable-card__icon {
    font-size: 1.5rem;
  }

  .selectable-card__title {
    font-size: 0.9rem;
  }

  .selectable-card__desc {
    font-size: 0.75rem;
  }
}
</style>
