<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import { useI18n } from '@/composables/useI18n'

const props = defineProps<{
  open: boolean
  title: string
  icon?: string
  /** Accent color carried from the control that opened the sheet */
  accent?: string
  /** Use the wider layout (e.g. chord picker with rich cards) */
  wide?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()

// Lock body scroll while a sheet is open
watch(
  () => props.open,
  (open) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
  }
)

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="studio-sheet">
      <div v-if="open" class="studio-sheet" @keydown="handleKeydown">
        <div class="studio-sheet__backdrop" @click="emit('close')"></div>

        <div
          class="studio-sheet__panel"
          :class="{ 'studio-sheet__panel--wide': wide }"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          :style="{ '--sheet-accent': accent || 'var(--studio-purple)' }"
        >
          <span class="studio-sheet__handle" aria-hidden="true"></span>
          <header class="studio-sheet__header">
            <div class="studio-sheet__title-group">
              <span v-if="icon" class="studio-sheet__icon">{{ icon }}</span>
              <h3 class="studio-sheet__title">{{ title }}</h3>
            </div>
            <button
              class="studio-sheet__close"
              :aria-label="t('studio.sheet.close')"
              @click="emit('close')"
            >
              ✕
            </button>
          </header>

          <div class="studio-sheet__content">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="studio-sheet__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.studio-sheet {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  font-family: var(--font-body);
}

.studio-sheet__backdrop {
  position: absolute;
  inset: 0;
  background: var(--studio-scrim);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.studio-sheet__panel {
  position: relative;
  width: min(440px, 100%);
  max-height: min(80dvh, 640px);
  display: flex;
  flex-direction: column;
  background: rgb(var(--studio-panel-deep-rgb));
  border: 1px solid rgba(var(--studio-purple-rgb), 0.2);
  border-radius: 20px;
  box-shadow: 0 32px 80px -24px var(--studio-shadow-strong);
  overflow: hidden;
}

.studio-sheet__panel--wide {
  width: min(560px, 100%);
}

.studio-sheet__handle {
  display: none;
  width: 36px;
  height: 4px;
  margin: 0.5rem auto 0;
  background: rgba(var(--studio-ink-rgb), 0.18);
  border-radius: 2px;
  flex-shrink: 0;
}

.studio-sheet__header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(var(--studio-purple-rgb), 0.12);
  flex-shrink: 0;
}

.studio-sheet__header::after {
  content: '';
  position: absolute;
  left: 1.25rem;
  bottom: -1px;
  width: 48px;
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(90deg, var(--sheet-accent), transparent);
}

.studio-sheet__title-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.studio-sheet__icon {
  font-size: 1.1rem;
  color: var(--sheet-accent, var(--studio-purple-soft));
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--sheet-accent, var(--studio-purple)) 40%, transparent));
}

.studio-sheet__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--studio-text-primary);
  margin: 0;
}

.studio-sheet__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(var(--studio-ink-rgb), 0.05);
  border: 1px solid rgba(var(--studio-ink-rgb), 0.12);
  border-radius: 8px;
  color: rgba(var(--studio-ink-rgb), 0.6);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.studio-sheet__close:hover {
  background: rgba(var(--studio-ink-rgb), 0.1);
  color: var(--studio-text-primary);
}

.studio-sheet__content {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  overscroll-behavior: contain;
}

.studio-sheet__footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  border-top: 1px solid rgba(var(--studio-purple-rgb), 0.12);
  flex-shrink: 0;
  background: rgba(var(--studio-panel-deep-rgb), 0.95);
}

/* Transitions */
.studio-sheet-enter-active,
.studio-sheet-leave-active {
  transition: opacity 0.22s ease;
}

.studio-sheet-enter-active .studio-sheet__panel,
.studio-sheet-leave-active .studio-sheet__panel {
  transition: transform 0.28s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.studio-sheet-enter-from,
.studio-sheet-leave-to {
  opacity: 0;
}

.studio-sheet-enter-from .studio-sheet__panel,
.studio-sheet-leave-to .studio-sheet__panel {
  transform: translateY(12px) scale(0.97);
}

/* Mobile: bottom sheet */
@media (max-width: 640px) {
  .studio-sheet {
    align-items: flex-end;
    padding: 0;
  }

  .studio-sheet__panel {
    width: 100%;
    max-height: 88dvh;
    border-radius: 20px 20px 0 0;
    border-bottom: none;
  }

  .studio-sheet__panel--wide {
    width: 100%;
  }

  .studio-sheet__handle {
    display: block;
  }

  .studio-sheet__header {
    padding-top: 0.625rem;
  }

  .studio-sheet-enter-from .studio-sheet__panel,
  .studio-sheet-leave-to .studio-sheet__panel {
    transform: translateY(60px) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .studio-sheet-enter-active .studio-sheet__panel,
  .studio-sheet-leave-active .studio-sheet__panel {
    transition: none;
  }
}
</style>
