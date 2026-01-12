<script setup lang="ts">
import { computed } from 'vue'
import { useRackStatus, type RackModuleId } from '@/composables/useRackStatus'

const props = defineProps<{
  module: RackModuleId
}>()

const { message, activeModule } = useRackStatus()

const isActive = computed(() => activeModule.value === props.module)
</script>

<template>
  <Transition name="hint-fade" mode="out-in">
    <span v-if="isActive && message" :key="message" class="hint-message">
      {{ message }}
    </span>
  </Transition>
</template>

<style scoped>
.hint-message {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8rem;
  font-weight: 400;
  color: rgba(167, 139, 250, 0.9);
  font-style: italic;
}

/* Transition */
.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.15s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
}
</style>
