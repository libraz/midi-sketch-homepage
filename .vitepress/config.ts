import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

const siteUrl = 'https://midi-sketch.libraz.net'
const githubUrl = 'https://github.com/libraz/midi-sketch'

export default withMermaid(defineConfig({
  title: 'MIDI Sketch',
  description: 'Auto-generate pop music MIDI sketches in the browser. Lightweight WebAssembly library for instant music composition.',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#8B5CF6' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'MIDI Sketch - Auto-generate Pop Music MIDI' }],
    ['meta', { property: 'og:site_name', content: 'MIDI Sketch' }],
    ['meta', { property: 'og:url', content: siteUrl }],
    // Google Fonts
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Outfit:wght@600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap', rel: 'stylesheet' }],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Docs', link: '/docs/getting-started' },
          { text: 'GitHub', link: githubUrl }
        ],
        sidebar: {
          '/docs/': [
            {
              text: 'Guide',
              items: [
                { text: 'Getting Started', link: '/docs/getting-started' },
                { text: 'Installation', link: '/docs/installation' },
              ]
            },
            {
              text: 'Technical',
              items: [
                { text: 'Architecture', link: '/docs/architecture' },
                { text: 'Generation Pipeline', link: '/docs/generation-pipeline' },
                { text: 'Track Generators', link: '/docs/track-generators' },
                { text: 'Harmony', link: '/docs/harmony' },
                { text: 'Presets', link: '/docs/presets' },
              ]
            },
            {
              text: 'Reference',
              items: [
                { text: 'API Reference', link: '/docs/api' },
              ]
            }
          ]
        }
      }
    },
    ja: {
      label: '日本語',
      lang: 'ja',
      title: 'MIDI Sketch - ブラウザで動くMIDI自動生成',
      description: 'ブラウザでポップミュージックのMIDIスケッチを自動生成。軽量WebAssemblyライブラリ。',
      themeConfig: {
        nav: [
          { text: 'ドキュメント', link: '/ja/docs/getting-started' },
          { text: 'GitHub', link: githubUrl }
        ],
        sidebar: {
          '/ja/docs/': [
            {
              text: 'ガイド',
              items: [
                { text: 'はじめに', link: '/ja/docs/getting-started' },
                { text: 'インストール', link: '/ja/docs/installation' },
              ]
            },
            {
              text: '技術解説',
              items: [
                { text: 'アーキテクチャ', link: '/ja/docs/architecture' },
                { text: '生成パイプライン', link: '/ja/docs/generation-pipeline' },
                { text: 'トラック生成', link: '/ja/docs/track-generators' },
                { text: 'ハーモニー', link: '/ja/docs/harmony' },
                { text: 'プリセット', link: '/ja/docs/presets' },
              ]
            },
            {
              text: 'リファレンス',
              items: [
                { text: 'API リファレンス', link: '/ja/docs/api' },
              ]
            }
          ]
        }
      }
    }
  },

  themeConfig: {
    siteTitle: 'MIDI Sketch',
    socialLinks: [
      { icon: 'github', link: githubUrl }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present libraz'
    }
  },

  vite: {
    optimizeDeps: {
      exclude: ['midi-sketch']
    },
    ssr: {
      noExternal: ['midi-sketch']
    }
  }
}))
