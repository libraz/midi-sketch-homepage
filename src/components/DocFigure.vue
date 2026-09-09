<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

/**
 * Inlines a hand-authored diagram from `src/figures/`.
 *
 * The SVG is inlined rather than referenced through `<img>` so that the shared
 * palette in `src/styles/doc-figure.css` reaches it, which is what lets the
 * diagrams follow VitePress's light/dark toggle.
 *
 * Japanese pages pick up `<name>.ja.svg` when it exists and fall back to the
 * English file otherwise.
 */
const props = defineProps<{ name: string }>()

const { lang } = useData()

const figures = import.meta.glob('../figures/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>

const svg = computed(() => {
  const localized = `../figures/${props.name}.ja.svg`
  const base = `../figures/${props.name}.svg`
  if (lang.value.startsWith('ja') && figures[localized]) return figures[localized]
  return figures[base] ?? ''
})
</script>

<template>
  <figure class="doc-figure" v-html="svg"></figure>
</template>
