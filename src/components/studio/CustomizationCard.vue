<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  summary: string
  modified?: boolean
  accent?: string
}>()

const emit = defineEmits<{
  (e: 'open'): void
}>()
</script>

<template>
  <button
    class="customization-card"
    :class="{ 'customization-card--modified': modified }"
    :style="{ '--card-accent': accent || '#8B5CF6' }"
    @click="emit('open')"
  >
    <!-- Rack module accent edge -->
    <span class="customization-card__edge" aria-hidden="true"></span>

    <!-- Status LED: lit when modified from the preset baseline -->
    <span class="customization-card__led" aria-hidden="true"></span>

    <span class="customization-card__icon">{{ icon }}</span>
    <span class="customization-card__body">
      <span class="customization-card__title">{{ title }}</span>
      <span class="customization-card__summary">{{ summary }}</span>
    </span>
    <span class="customization-card__chevron">›</span>
  </button>
</template>

<style scoped>
.customization-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 1.125rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent 40%),
    rgba(18, 18, 26, 0.75);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  overflow: hidden;
}

/* Accent edge: rack-module color strip on the left */
.customization-card__edge {
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: linear-gradient(180deg, var(--card-accent), transparent 130%);
  opacity: 0.45;
  transition: opacity 0.25s ease, top 0.25s ease, bottom 0.25s ease;
}

.customization-card:hover {
  border-color: color-mix(in srgb, var(--card-accent) 55%, transparent);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 40%),
    rgba(22, 22, 32, 0.85);
  transform: translateY(-2px);
  box-shadow:
    0 12px 28px -14px rgba(0, 0, 0, 0.7),
    0 0 24px -12px var(--card-accent);
}

.customization-card:hover .customization-card__edge {
  opacity: 1;
  top: 6px;
  bottom: 6px;
}

/* Status LED: dark socket by default, glows when modified */
.customization-card__led {
  position: absolute;
  top: 0.7rem;
  right: 0.7rem;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(250, 250, 250, 0.08);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.6);
  transition: all 0.3s ease;
}

.customization-card--modified .customization-card__led {
  background: var(--card-accent);
  box-shadow:
    0 0 6px var(--card-accent),
    0 0 14px color-mix(in srgb, var(--card-accent) 60%, transparent);
}

.customization-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  font-size: 1.15rem;
  color: var(--card-accent);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.14), rgba(236, 72, 153, 0.07));
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--card-accent) 35%, transparent));
}

.customization-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  flex: 1;
}

.customization-card__title {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #FAFAFA;
}

.customization-card__summary {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  color: rgba(250, 250, 250, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.customization-card__chevron {
  flex-shrink: 0;
  font-size: 1.2rem;
  color: rgba(250, 250, 250, 0.3);
  transition: transform 0.2s ease, color 0.2s ease;
}

.customization-card:hover .customization-card__chevron {
  color: var(--card-accent);
  transform: translateX(2px);
}
</style>
