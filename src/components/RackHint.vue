<script setup lang="ts">
import { useRackStatus, type RackModuleId } from '@/composables/useRackStatus'

const props = defineProps<{
  text: string
  module: RackModuleId
}>()

const { setStatus, clearStatus } = useRackStatus()

function onEnter() {
  setStatus(props.module, props.text)
}

function onLeave() {
  clearStatus()
}
</script>

<template>
  <span
    class="rack-hint"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focus="onEnter"
    @blur="onLeave"
  >
    <slot />
  </span>
</template>

<style scoped>
.rack-hint {
  cursor: help;
}

.rack-hint:hover {
  color: rgba(250, 250, 250, 0.7);
}
</style>
