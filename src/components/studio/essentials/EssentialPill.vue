<script setup lang="ts">
defineProps<{
  /** Small uppercase caption above the value (e.g. "Genre") */
  label: string
  /** Current value shown prominently */
  value: string
  /** Accent color (CSS value) for the icon + focus ring */
  accent?: string
  icon?: string
  /** Show the modified dot (differs from genre baseline) */
  modified?: boolean
}>()

defineEmits<{
  (e: 'open'): void
}>()
</script>

<template>
  <button
    class="essential-pill"
    :style="{ '--pill-accent': accent || 'var(--studio-purple)' }"
    @click="$emit('open')"
  >
    <span v-if="icon" class="essential-pill__icon">{{ icon }}</span>
    <span class="essential-pill__body">
      <span class="essential-pill__label">
        {{ label }}
        <span v-if="modified" class="essential-pill__dot" aria-hidden="true"></span>
      </span>
      <span class="essential-pill__value">{{ value }}</span>
    </span>
    <span class="essential-pill__chevron" aria-hidden="true">⌄</span>
  </button>
</template>

<style scoped>
.essential-pill {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  background: rgba(var(--studio-panel-rgb), 0.6);
  border: 1px solid rgba(var(--studio-ink-rgb), 0.1);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.essential-pill:hover {
  border-color: color-mix(in srgb, var(--pill-accent) 45%, transparent);
  background: color-mix(in srgb, var(--pill-accent) 6%, rgba(var(--studio-panel-rgb), 0.6));
  transform: translateY(-1px);
}

.essential-pill:focus-visible {
  outline: 2px solid var(--pill-accent);
  outline-offset: 2px;
}

.essential-pill__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  font-size: 0.95rem;
  color: var(--pill-accent);
  background: color-mix(in srgb, var(--pill-accent) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--pill-accent) 22%, transparent);
}

.essential-pill__body {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  flex: 1;
}

.essential-pill__label {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(var(--studio-ink-rgb), 0.45);
}

.essential-pill__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--pill-accent);
  box-shadow: 0 0 6px var(--pill-accent);
}

.essential-pill__value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--studio-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.essential-pill__chevron {
  flex-shrink: 0;
  font-size: 0.85rem;
  color: rgba(var(--studio-ink-rgb), 0.35);
  transition: transform 0.2s ease;
}

.essential-pill:hover .essential-pill__chevron {
  color: var(--pill-accent);
  transform: translateY(1px);
}
</style>
