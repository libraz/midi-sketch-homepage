<script setup lang="ts">
import { ref, onMounted } from 'vue'

/**
 * Bottom-docked copy of a primary action, shown while the inline original is
 * scrolled out of view. The caller owns the visibility rule; the dock only
 * renders the bar, its optional detail line, and the slide transition.
 */
defineProps<{
  show: boolean
  detail?: string
}>()

// Teleport needs a client-side body
const isClient = ref(false)
onMounted(() => { isClient.value = true })
</script>

<template>
  <Teleport v-if="isClient" to="body">
    <Transition name="studio-dock">
      <div v-if="show" class="studio-dock">
        <div class="studio-dock__inner">
          <span v-if="detail" class="studio-dock__detail">{{ detail }}</span>
          <div class="studio-dock__action">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.studio-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
  background: rgba(var(--studio-panel-deep-rgb), 0.92);
  border-top: 1px solid rgba(var(--studio-purple-rgb), 0.18);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 -12px 32px -20px var(--studio-shadow-strong);
  font-family: var(--font-body);
}

.studio-dock:lang(ja) {
  font-feature-settings: 'palt';
}

.studio-dock__inner {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 1056px;
  margin: 0 auto;
}

.studio-dock__detail {
  flex: 1;
  min-width: 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(var(--studio-ink-rgb), 0.65);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.studio-dock__action {
  flex: 0 0 auto;
  width: 15rem;
  margin-left: auto;
}

.studio-dock-enter-active,
.studio-dock-leave-active {
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease;
}

.studio-dock-enter-from,
.studio-dock-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (max-width: 640px) {
  .studio-dock__detail {
    display: none;
  }

  .studio-dock__action {
    flex: 1 1 auto;
    width: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .studio-dock-enter-active,
  .studio-dock-leave-active {
    transition: opacity 0.2s ease;
  }

  .studio-dock-enter-from,
  .studio-dock-leave-to {
    transform: none;
  }
}
</style>
