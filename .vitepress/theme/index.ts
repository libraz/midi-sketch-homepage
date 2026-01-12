import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import { useData } from 'vitepress'
import './custom.css'
import MidiDemo from './MidiDemo.vue'
import MidiWizard from '@/components/MidiWizard.vue'
import DemoLayout from './DemoLayout.vue'
import PreviewLayout from './PreviewLayout.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { frontmatter } = useData()
    if (frontmatter.value.layout === 'demo') {
      return h(DemoLayout)
    }
    if (frontmatter.value.layout === 'preview') {
      return h(PreviewLayout)
    }
    return h(DefaultTheme.Layout, null, {})
  },
  enhanceApp({ app }) {
    app.component('MidiDemo', MidiDemo)
    app.component('MidiWizard', MidiWizard)
  }
} satisfies Theme
