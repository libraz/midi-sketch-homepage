<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import { useI18n } from '@/composables/useI18n'

const props = defineProps<{
  open: boolean
  title: string
  icon?: string
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
        <div class="card-drawer__panel" role="dialog" aria-modal="true" :aria-label="title">
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
  font-family: 'Instrument Sans', -apple-system, sans-serif;
}

.card-drawer__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.card-drawer__panel {
  position: relative;
  width: min(520px, 100%);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0c0c12;
  border-left: 1px solid rgba(139, 92, 246, 0.2);
  box-shadow: -24px 0 64px -16px rgba(0, 0, 0, 0.6);
}

.card-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.12);
  flex-shrink: 0;
}

.card-drawer__title-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.card-drawer__icon {
  font-size: 1.1rem;
  color: #A78BFA;
}

.card-drawer__title {
  font-size: 1rem;
  font-weight: 700;
  color: #FAFAFA;
  margin: 0;
}

.card-drawer__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(250, 250, 250, 0.05);
  border: 1px solid rgba(250, 250, 250, 0.12);
  border-radius: 8px;
  color: rgba(250, 250, 250, 0.6);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-drawer__close:hover {
  background: rgba(250, 250, 250, 0.1);
  color: #FAFAFA;
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
  border-top: 1px solid rgba(139, 92, 246, 0.12);
  flex-shrink: 0;
  background: rgba(12, 12, 18, 0.95);
}

.card-drawer__done {
  padding: 0.625rem 1.25rem;
  background: transparent;
  border: 1px solid rgba(250, 250, 250, 0.15);
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-drawer__done:hover {
  background: rgba(250, 250, 250, 0.06);
  color: #FAFAFA;
}

.card-drawer__apply {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
  box-shadow: 0 8px 24px -8px rgba(139, 92, 246, 0.5);
  transition: all 0.2s ease;
}

.card-drawer__apply:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 32px -8px rgba(139, 92, 246, 0.6);
}

.card-drawer__apply:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-drawer__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
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
    border-top: 1px solid rgba(139, 92, 246, 0.25);
    border-radius: 20px 20px 0 0;
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
