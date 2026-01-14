import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { fileURLToPath, URL } from 'node:url'

const siteUrl = 'https://midi-sketch.libraz.net'
const githubUrl = 'https://github.com/libraz/midi-sketch'

// JSON-LD: SoftwareApplication schema
const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'MIDI Sketch',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any (Browser, Node.js)',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  description: 'Generate reproducible pop music MIDI based on music theory. Unlike AI audio generators, MIDI Sketch outputs editable MIDI data you can import into any DAW and customize with your own sounds.',
  url: siteUrl,
  downloadUrl: githubUrl,
  softwareVersion: '1.0.0',
  author: {
    '@type': 'Person',
    name: 'libraz'
  },
  license: 'https://opensource.org/licenses/MIT',
  keywords: 'MIDI generator, pop music MIDI, DAW template, music theory, chord progression, melody generator, editable MIDI, reproducible music, ポップス MIDI生成, 作曲ツール, 音楽理論'
}

// JSON-LD: FAQ schema (for AI search)
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is MIDI Sketch?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'MIDI Sketch is a music theory-based MIDI generator that creates complete pop music arrangements. Unlike AI audio generators like Suno, it outputs editable MIDI data - drums, bass, chords, arpeggios, and melodies - that you can import into your DAW and customize with your own sounds and mixing.'
      }
    },
    {
      '@type': 'Question',
      name: 'How is MIDI Sketch different from Suno or other AI music generators?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AI audio generators like Suno produce finished audio that you cannot edit. MIDI Sketch generates MIDI data based on music theory, giving you full control. You can change instruments, edit notes, adjust timing, and mix however you want in your DAW. Same seed always produces the same output - fully reproducible.'
      }
    },
    {
      '@type': 'Question',
      name: 'How do I use MIDI Sketch with my DAW?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Generate your song in the browser, then download the MIDI file. Import it directly into any DAW like Ableton Live, FL Studio, Logic Pro, or Cubase. All tracks are separated and ready for your own sounds and mixing.'
      }
    },
    {
      '@type': 'Question',
      name: 'What music styles does MIDI Sketch support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'MIDI Sketch includes presets for J-Pop, K-Pop, City Pop, EDM, Ballad, Rock, R&B, and more. Each preset configures appropriate rhythms, chord voicings, and arrangement patterns based on music theory for that style.'
      }
    },
    {
      '@type': 'Question',
      name: 'How are chord progressions generated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'MIDI Sketch auto-generates chord progressions based on popular patterns in each genre. Select a style preset and the system creates appropriate progressions with jazz voicings, tensions, and extensions - all grounded in music theory.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is MIDI Sketch output reproducible?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, MIDI Sketch is fully deterministic. The same seed and settings always produce exactly the same MIDI output. This makes it perfect for iterative production workflows where you need consistent, predictable results.'
      }
    },
    {
      '@type': 'Question',
      name: 'How is the melody generated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'MIDI Sketch generates melodies based on music theory - following chord tones, using appropriate scales, and creating natural phrase structures. You can configure vocal ranges and regenerate with different seeds until you find a melody you like.'
      }
    },
    {
      '@type': 'Question',
      name: 'What tracks are included in the MIDI output?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A complete MIDI Sketch export includes: drums (kick, snare, hi-hat, fills), bass line, chord pads, optional arpeggio, and vocal melody. Each track is on a separate MIDI channel for easy DAW editing.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I use MIDI Sketch for commercial music production?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, MIDI Sketch is MIT licensed. All generated MIDI files are yours to use commercially. Use them as starting points for your productions, demos, or final releases.'
      }
    },
    {
      '@type': 'Question',
      name: 'Why use MIDI instead of AI-generated audio?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'MIDI gives you complete creative control. You can change every note, swap instruments, adjust velocities, quantize timing, and mix with your own effects. AI audio is a black box - MIDI is transparent and editable. For serious music production, MIDI is the professional choice.'
      }
    }
  ]
}

export default withMermaid(defineConfig({
  srcDir: 'src',

  title: 'MIDI Sketch - Music Theory-Based Pop MIDI Generator',
  description: 'Auto-generate reproducible pop music MIDI based on music theory. Unlike AI audio generators, get editable MIDI data for your DAW. Drums, bass, chords, and melody ready to import.',

  // Sitemap
  sitemap: {
    hostname: siteUrl
  },

  head: [
    ['meta', { name: 'theme-color', content: '#8B5CF6' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Outfit:wght@600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap', rel: 'stylesheet' }],

    // JSON-LD structured data
    ['script', { type: 'application/ld+json' }, JSON.stringify(softwareApplicationJsonLd)],
    ['script', { type: 'application/ld+json' }, JSON.stringify(faqJsonLd)],

    // SEO - Keywords
    ['meta', { name: 'keywords', content: 'MIDI generator, pop music MIDI, DAW template, music theory, chord progression generator, melody generator, editable MIDI, reproducible music, Suno alternative, AI music MIDI, J-Pop MIDI, K-Pop MIDI, music production, MIDI作成, ポップス MIDI生成, DAWテンプレート, 作曲ツール, 音楽理論, コード進行, メロディ生成, 編集可能MIDI, 再現性, DTM, アレンジ自動生成' }],
    ['link', { rel: 'canonical', href: siteUrl }],

    // OGP
    ['meta', { property: 'og:site_name', content: 'MIDI Sketch' }],
    ['meta', { property: 'og:title', content: 'MIDI Sketch - Music Theory-Based Pop MIDI Generator' }],
    ['meta', { property: 'og:description', content: 'Generate reproducible pop music MIDI based on music theory. Unlike AI audio generators, get editable MIDI for Ableton, FL Studio, Logic Pro. Full creative control.' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: siteUrl }],
    ['meta', { property: 'og:image', content: `${siteUrl}/og-image.png` }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:locale:alternate', content: 'ja' }],

    // Twitter
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'MIDI Sketch - Music Theory-Based Pop MIDI Generator' }],
    ['meta', { name: 'twitter:description', content: 'Generate reproducible pop music MIDI based on music theory. Editable MIDI data for your DAW, not finished audio.' }],
    ['meta', { name: 'twitter:image', content: `${siteUrl}/og-image.png` }],
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
                { text: 'JavaScript API', link: '/docs/api-js' },
                { text: 'C++ API', link: '/docs/api-cpp' },
                { text: 'CLI Reference', link: '/docs/cli' },
                { text: 'Option Relationships', link: '/docs/option-relationships' },
              ]
            }
          ]
        }
      }
    },
    ja: {
      label: '日本語',
      lang: 'ja',
      title: 'MIDI Sketch - 音楽理論ベースのポップスMIDI生成',
      description: '音楽理論に基づいた再現性のあるポップスMIDIを自動生成。AI音声生成と違い、DAWで自由に編集できるMIDIデータを出力。ドラム、ベース、コード、メロディをすぐにインポート。',
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
                { text: 'JavaScript API', link: '/ja/docs/api-js' },
                { text: 'C++ API', link: '/ja/docs/api-cpp' },
                { text: 'CLI リファレンス', link: '/ja/docs/cli' },
                { text: 'オプション関係性', link: '/ja/docs/option-relationships' },
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
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../src', import.meta.url)),
        '@theme': fileURLToPath(new URL('./theme', import.meta.url))
      }
    },
    optimizeDeps: {
      exclude: ['midi-sketch']
    },
    ssr: {
      noExternal: ['midi-sketch']
    }
  }
}))
