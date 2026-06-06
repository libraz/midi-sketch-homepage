<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  subtitle?: string
  count?: number
  isCollapsible?: boolean
  isExpanded?: boolean
  type?: 'info' | 'accent' | 'warning'
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()
</script>

<template>
  <component
    :is="isCollapsible ? 'button' : 'div'"
    class="section-header"
    :class="[
      `section-header--${type || 'accent'}`,
      { 'section-header--collapsible': isCollapsible }
    ]"
    @click="isCollapsible && emit('toggle')"
  >
    <span v-if="icon" class="section-header__icon">{{ icon }}</span>
    <span class="section-header__title">{{ title }}</span>
    <span v-if="subtitle" class="section-header__subtitle">{{ subtitle }}</span>
    <span class="section-header__spacer"></span>
    <span v-if="count !== undefined" class="section-header__count">{{ count }}</span>
    <span v-if="isCollapsible" class="section-header__toggle">
      {{ isExpanded ? '−' : '+' }}
    </span>
  </component>
</template>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-family: var(--font-body);
  transition: all 0.2s ease;
}

.section-header--collapsible {
  cursor: pointer;
  border: 1px solid rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.1);
  background: rgba(var(--studio-ink-rgb), 0.03);
}

.section-header--collapsible:hover {
  background: rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.08);
  border-color: rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.2);
}

/* Type variants */
.section-header--accent {
  background: rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.1);
  border: 1px solid rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.2);
}

.section-header--warning {
  background: rgba(var(--studio-amber-rgb), 0.1);
  border: 1px solid rgba(var(--studio-amber-rgb), 0.2);
}

.section-header--info {
  background: rgba(var(--studio-blue-rgb), 0.1);
  border: 1px solid rgba(var(--studio-blue-rgb), 0.2);
}

.section-header__icon {
  font-size: 1rem;
}

.section-header--warning .section-header__icon {
  color: var(--studio-amber);
}

.section-header__title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--studio-text-primary);
}

.section-header__subtitle {
  font-size: 0.8rem;
  color: rgba(var(--studio-ink-rgb), 0.6);
}

.section-header__spacer {
  flex: 1;
}

.section-header__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 8px;
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(var(--studio-ink-rgb), 0.9);
  background: rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.2);
  border: 1px solid rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.3);
  border-radius: 11px;
  letter-spacing: 0.02em;
}

.section-header__toggle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 0.5rem;
  background: rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.15);
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--accent-rgb, var(--studio-purple-rgb)));
  transition: transform 0.2s ease;
}

.section-header--collapsible:hover .section-header__toggle {
  background: rgba(var(--accent-rgb, var(--studio-purple-rgb)), 0.25);
}

@media (max-width: 640px) {
  .section-header {
    padding: 0.625rem 0.875rem;
  }

  .section-header__title {
    font-size: 0.8rem;
  }

  .section-header__subtitle {
    font-size: 0.75rem;
  }
}
</style>
