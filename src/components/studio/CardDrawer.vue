<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import { useI18n } from '@/composables/useI18n'

const props = defineProps<{
  open: boolean
  title: string
  icon?: string
  /** Accent color of the card that opened the drawer (CSS color value) */
  accent?: string
  /** Whether settings changed since last generation (shows Apply button) */
  stale?: boolean
  /** Whether a generation run is in progress */
  generating?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'apply'): void
}>()

const { t } = useI18n()

// Prevent body scroll while the drawer is open
watch(() => props.open, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
})

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
    <Transition name="drawer">
      <div
        v-if="open"
        class="card-drawer"
        @keydown="handleKeydown"
      >
        <!-- Backdrop -->
        <div class="card-drawer__backdrop" @click="emit('close')"></div>

        <!-- Panel -->
        <div
          class="card-drawer__panel"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          :style="{ '--drawer-accent': accent || 'var(--studio-purple)' }"
        >
          <span class="card-drawer__handle" aria-hidden="true"></span>
          <header class="card-drawer__header">
            <div class="card-drawer__title-group">
              <span v-if="icon" class="card-drawer__icon">{{ icon }}</span>
              <h3 class="card-drawer__title">{{ title }}</h3>
            </div>
            <button class="card-drawer__close" :aria-label="t('studio.drawer.close')" @click="emit('close')">
              ✕
            </button>
          </header>

          <div class="card-drawer__content">
            <slot />
          </div>

          <footer class="card-drawer__footer">
            <button class="card-drawer__done" @click="emit('close')">
              {{ t('studio.drawer.done') }}
            </button>
            <button
              v-if="stale"
              class="card-drawer__apply"
              :disabled="generating"
              @click="emit('apply')"
            >
              <span v-if="generating" class="card-drawer__spinner"></span>
              <span>{{ generating ? t('studio.drawer.applying') : t('studio.drawer.apply') }}</span>
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.card-drawer {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  justify-content: flex-end;
  font-family: var(--font-body);
}

.card-drawer__backdrop {
  position: absolute;
  inset: 0;
  background: var(--studio-scrim);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.card-drawer__panel {
  position: relative;
  width: min(520px, 100%);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgb(var(--studio-panel-deep-rgb));
  border-left: 1px solid rgba(var(--studio-purple-rgb), 0.2);
  box-shadow: -24px 0 64px -16px var(--studio-shadow-strong);
}

/* Bottom-sheet grab handle (visible on mobile only) */
.card-drawer__handle {
  display: none;
  width: 36px;
  height: 4px;
  margin: 0.5rem auto 0;
  background: rgba(var(--studio-ink-rgb), 0.18);
  border-radius: 2px;
  flex-shrink: 0;
}

.card-drawer__header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(var(--studio-purple-rgb), 0.12);
  flex-shrink: 0;
}

/* Accent underline carried over from the card that opened the drawer */
.card-drawer__header::after {
  content: '';
  position: absolute;
  left: 1.25rem;
  bottom: -1px;
  width: 48px;
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(90deg, var(--drawer-accent), transparent);
}

.card-drawer__title-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.card-drawer__icon {
  font-size: 1.1rem;
  color: var(--drawer-accent, var(--studio-purple-soft));
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--drawer-accent, var(--studio-purple)) 40%, transparent));
}

.card-drawer__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--studio-text-primary);
  margin: 0;
}

.card-drawer__close {
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

.card-drawer__close:hover {
  background: rgba(var(--studio-ink-rgb), 0.1);
  color: var(--studio-text-primary);
}

.card-drawer__content {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  overscroll-behavior: contain;
}

.card-drawer__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  border-top: 1px solid rgba(var(--studio-purple-rgb), 0.12);
  flex-shrink: 0;
  background: rgba(var(--studio-panel-deep-rgb), 0.95);
}

.card-drawer__done {
  padding: 0.625rem 1.25rem;
  background: transparent;
  border: 1px solid rgba(var(--studio-ink-rgb), 0.15);
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(var(--studio-ink-rgb), 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-drawer__done:hover {
  background: rgba(var(--studio-ink-rgb), 0.06);
  color: var(--studio-text-primary);
}

.card-drawer__apply {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  background: linear-gradient(135deg, var(--studio-purple) 0%, color-mix(in srgb, var(--studio-purple) 65%, var(--studio-pink)) 100%);
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--studio-on-accent);
  cursor: pointer;
  box-shadow: 0 8px 24px -8px rgba(var(--studio-purple-rgb), 0.5);
  transition: all 0.2s ease;
}

.card-drawer__apply:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 32px -8px rgba(var(--studio-purple-rgb), 0.6);
}

.card-drawer__apply:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-drawer__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--studio-on-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transition: slide from right (desktop) */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-enter-active .card-drawer__panel,
.drawer-leave-active .card-drawer__panel {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .card-drawer__panel,
.drawer-leave-to .card-drawer__panel {
  transform: translateX(40px);
}

/* Mobile: bottom sheet */
@media (max-width: 640px) {
  .card-drawer {
    justify-content: stretch;
    align-items: flex-end;
  }

  .card-drawer__panel {
    width: 100%;
    height: 88dvh;
    border-left: none;
    border-top: 1px solid rgba(var(--studio-purple-rgb), 0.25);
    border-radius: 20px 20px 0 0;
  }

  .card-drawer__handle {
    display: block;
  }

  .card-drawer__header {
    padding-top: 0.625rem;
  }

  .card-drawer__content {
    padding: 1rem;
  }

  .drawer-enter-from .card-drawer__panel,
  .drawer-leave-to .card-drawer__panel {
    transform: translateY(60px);
  }
}
</style>
