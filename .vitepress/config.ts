import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { fileURLToPath, URL } from 'node:url'
import { generateLlmsTxt, llmsDevPlugin, type LlmsLocale } from './llms'

const siteUrl = 'https://midisketch.libraz.net'
const githubUrl = 'https://github.com/libraz/midi-sketch'

/** Prose for the per-locale llms.txt indexes; the page lists come from the nav/sidebar. */
const LLMS_LOCALES: LlmsLocale[] = [
  {
    key: 'root',
    prefix: '',
    title: 'MIDI Sketch',
    summary:
      'Music theory-based pop music MIDI generator. Generates reproducible, multi-track MIDI (drums, bass, chords, arpeggio, melody) you can import and edit in any DAW — not finished AI audio. Runs in the browser via WebAssembly, plus Node.js and C++. AGPL-3.0 / Commercial dual licensed.',
    intro:
      'Arrangements are derived from music theory rather than a trained model, so the same\nsettings always produce the same result. The output is editable multi-track MIDI, not\nrendered audio. The documentation also carries a music course explaining the theory\nbehind each setting. The links below point to the canonical HTML pages.',
    overviewHeading: 'Key pages',
    homeText: 'Studio (browser demo)',
    alternate: {
      heading: 'Japanese (日本語)',
      items: [
        {
          text: '日本語版インデックス',
          link: '/ja/llms.txt',
          description: 'The same index in Japanese, covering the /ja/ documentation.'
        }
      ]
    }
  },
  {
    key: 'ja',
    prefix: '/ja',
    title: 'MIDI Sketch',
    summary:
      '音楽理論にもとづくポップス MIDI ジェネレーター。ドラム・ベース・コード・アルペジオ・メロディのマルチトラック MIDI を再現性のある形で生成し、DAW にそのまま取り込んで編集できる。AI が書き出した音声ではない。ブラウザでは WebAssembly、ほかに Node.js と C++ で動作。AGPL-3.0 / 商用のデュアルライセンス。',
    intro:
      'アレンジは学習済みモデルではなく音楽理論から導かれるため、同じ設定なら常に同じ結果になる。\n出力は書き出し済みの音声ではなく、編集可能なマルチトラック MIDI。ドキュメントには各設定の\n背景にある理論を解説する音楽コースも含まれる。以下は日本語ドキュメントへのリンク一覧。',
    overviewHeading: '主要ページ',
    homeText: 'スタジオ（ブラウザデモ）',
    alternate: {
      heading: 'English',
      items: [
        {
          text: 'English index',
          link: '/llms.txt',
          description: '英語ドキュメントを対象とした同じ構成のインデックス。'
        }
      ]
    }
  }
]

// English docs sidebar, mirrored by the Japanese tree under `/ja/docs/`.
const enDocsSidebar = [
  {
    text: 'Guide',
    items: [
      { text: 'Features', link: '/docs/features' },
      { text: 'Getting Started', link: '/docs/getting-started' },
      { text: 'Installation', link: '/docs/installation' },
    ]
  },
  {
    text: 'Course',
    items: [
      { text: '0 · Music Primer for Engineers', link: '/docs/course/primer' },
      { text: '1 · Scales & Keys', link: '/docs/course/scales-keys' },
      { text: '2 · Chords & Triads', link: '/docs/course/chords' },
      { text: '3 · Chord Progressions', link: '/docs/course/progressions' },
      { text: '4 · Harmony & Color', link: '/docs/course/harmony-color' },
      { text: '5 · Melody, Motifs & Hooks', link: '/docs/course/melody-motif' },
      { text: '6 · Song Structure', link: '/docs/course/song-structure' },
      { text: '7 · Mapping to MidiSketch', link: '/docs/course/config-mapping' },
      { text: 'Music Term Reference', link: '/docs/course/glossary' },
    ]
  },
  {
    text: 'Technical',
    items: [
      { text: 'Architecture', link: '/docs/architecture' },
      { text: 'Generation Pipeline', link: '/docs/generation-pipeline' },
      { text: 'Track Generators', link: '/docs/track-generators' },
      { text: 'Melody Evaluation', link: '/docs/melody-evaluation' },
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

/** Per-locale structured data and social-card copy. */
type Locale = 'en' | 'ja'

const softwareApplicationJsonLd = (lang: Locale) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'MIDI Sketch',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any (Browser, Node.js)',
  inLanguage: lang,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  description: lang === 'ja'
    ? '音楽理論に基づいた再現性のあるポップスMIDIを生成します。AI音声生成と違い、DAWにインポートして自分の音色で仕上げられる編集可能なMIDIデータを出力します。'
    : 'Generate reproducible pop music MIDI based on music theory. Unlike AI audio generators, MIDI Sketch outputs editable MIDI data you can import into any DAW and customize with your own sounds.',
  url: lang === 'ja' ? `${siteUrl}/ja/` : siteUrl,
  downloadUrl: githubUrl,
  softwareVersion: '0.2.1',
  author: {
    '@type': 'Person',
    name: 'libraz'
  },
  license: 'https://www.gnu.org/licenses/agpl-3.0.html',
  keywords: lang === 'ja'
    ? 'MIDI生成, ポップス MIDI, DAWテンプレート, 音楽理論, コード進行, メロディ生成, 編集可能MIDI, 再現性, 作曲ツール'
    : 'MIDI generator, pop music MIDI, DAW template, music theory, chord progression, melody generator, editable MIDI, reproducible music'
})

const FAQ: Record<Locale, { q: string; a: string }[]> = {
  en: [
    {
      q: 'What is MIDI Sketch?',
      a: 'MIDI Sketch is a music theory-based MIDI generator that creates complete pop music arrangements. Unlike AI audio generators, it outputs editable MIDI data - drums, bass, chords, arpeggios, and melodies - that you can import into your DAW and customize with your own sounds and mixing.'
    },
    {
      q: 'How is MIDI Sketch different from an AI music generator?',
      a: 'AI audio generators produce finished audio that you cannot edit. MIDI Sketch generates MIDI data based on music theory, giving you full control. You can change instruments, edit notes, adjust timing, and mix however you want in your DAW. Same seed always produces the same output - fully reproducible.'
    },
    {
      q: 'How do I use MIDI Sketch with my DAW?',
      a: 'Generate your song in the browser, then download the MIDI file. Import it directly into any DAW like Ableton Live, FL Studio, Logic Pro, or Cubase. All tracks are separated and ready for your own sounds and mixing.'
    },
    {
      q: 'What music styles does MIDI Sketch support?',
      a: 'MIDI Sketch includes presets for J-Pop, K-Pop, City Pop, EDM, Ballad, Rock, R&B, and more. Each preset configures appropriate rhythms, chord voicings, and arrangement patterns based on music theory for that style.'
    },
    {
      q: 'How are chord progressions generated?',
      a: 'MIDI Sketch auto-generates chord progressions based on popular patterns in each genre. Select a style preset and the system creates appropriate progressions with jazz voicings, tensions, and extensions - all grounded in music theory.'
    },
    {
      q: 'Is MIDI Sketch output reproducible?',
      a: 'Yes, MIDI Sketch is fully deterministic. The same seed and settings always produce exactly the same MIDI output. This makes it perfect for iterative production workflows where you need consistent, predictable results.'
    },
    {
      q: 'How is the melody generated?',
      a: 'MIDI Sketch generates melodies based on music theory - following chord tones, using appropriate scales, and creating natural phrase structures. You can configure vocal ranges and regenerate with different seeds until you find a melody you like.'
    },
    {
      q: 'What tracks are included in the MIDI output?',
      a: 'A complete MIDI Sketch export includes: drums (kick, snare, hi-hat, fills), bass line, chord pads, optional arpeggio, and vocal melody. Each track is on a separate MIDI channel for easy DAW editing.'
    },
    {
      q: 'Can I use MIDI Sketch for commercial music production?',
      a: 'Yes. The MIDI files you generate are yours to use commercially — as starting points for your productions, demos, or final releases. The engine itself is dual licensed: AGPL-3.0 for open use, or a commercial license for embedding it in closed-source products or proprietary SaaS.'
    },
    {
      q: 'Why use MIDI instead of AI-generated audio?',
      a: 'MIDI gives you complete creative control. You can change every note, swap instruments, adjust velocities, quantize timing, and mix with your own effects. AI audio is a black box - MIDI is transparent and editable. For serious music production, MIDI is the professional choice.'
    }
  ],
  ja: [
    {
      q: 'MIDI Sketch とは何ですか？',
      a: 'MIDI Sketch は、音楽理論にもとづいてポップスのアレンジ一式を生成するMIDIジェネレータです。AI音声生成と違い、ドラム・ベース・コード・アルペジオ・メロディを編集可能なMIDIデータとして出力するので、DAWにインポートして自分の音色とミックスで仕上げられます。'
    },
    {
      q: 'AI音楽生成サービスと何が違いますか？',
      a: 'AI音声生成は編集できない完成音源を出力します。MIDI Sketch は音楽理論にもとづいてMIDIデータを生成するので、DAW上で楽器の差し替え、音符の編集、タイミングの調整、ミックスまで自由にできます。同じシードなら常に同じ出力になり、完全に再現可能です。'
    },
    {
      q: 'DAWではどう使いますか？',
      a: 'ブラウザで曲を生成し、MIDIファイルをダウンロードします。Ableton Live、FL Studio、Logic Pro、Cubase などのDAWにそのままインポートできます。トラックは分離済みで、すぐに自分の音色とミックスに載せられます。'
    },
    {
      q: 'どのスタイルに対応していますか？',
      a: 'J-Pop、K-Pop、シティポップ、EDM、バラード、ロック、R&B などのプリセットを用意しています。各プリセットは、そのスタイルの音楽理論に沿ってリズム・コードのボイシング・アレンジのパターンを設定します。'
    },
    {
      q: 'コード進行はどう生成されますか？',
      a: 'ジャンルごとによく使われるパターンをもとに自動生成します。スタイルのプリセットを選ぶと、ジャズ的なボイシングやテンション、拡張を含む進行が音楽理論にもとづいて組み立てられます。'
    },
    {
      q: '出力は再現できますか？',
      a: 'はい。MIDI Sketch は完全に決定的です。同じシードと設定なら、常にまったく同じMIDIが出力されます。結果を安定させたい反復的な制作フローに向いています。'
    },
    {
      q: 'メロディはどう生成されますか？',
      a: 'コードトーンをたどり、適切なスケールを使い、自然なフレーズ構造を作るという音楽理論にもとづいて生成します。声域を設定でき、気に入るメロディが出るまでシードを変えて生成し直せます。'
    },
    {
      q: '出力されるMIDIにはどのトラックが含まれますか？',
      a: 'ドラム（キック、スネア、ハイハット、フィル）、ベースライン、コードパッド、任意のアルペジオ、ボーカルメロディが含まれます。各トラックは別々のMIDIチャンネルに配置されるので、DAWでの編集が容易です。'
    },
    {
      q: '生成したMIDIを商用制作に使えますか？',
      a: 'できます。生成したMIDIファイルは、制作の出発点としても、デモや完成音源としても商用利用できます。エンジン本体はデュアルライセンスで、オープンな利用には AGPL-3.0、クローズドソース製品やプロプライエタリな SaaS への組み込みには商用ライセンスを用意しています。'
    },
    {
      q: 'AI生成音源ではなくMIDIを使う理由は？',
      a: 'MIDIなら制作の主導権を完全に握れます。音符を1つずつ変え、楽器を差し替え、ベロシティを調整し、タイミングをクオンタイズし、自分のエフェクトでミックスできます。AI音源はブラックボックスですが、MIDIは中身が見えて編集できます。'
    }
  ]
}

const faqJsonLd = (lang: Locale) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: lang,
  mainEntity: FAQ[lang].map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a }
  }))
})

const SEO: Record<Locale, { title: string; description: string; keywords: string }> = {
  en: {
    title: 'MIDI Sketch - Music Theory-Based Pop MIDI Generator',
    description: 'Generate reproducible pop music MIDI based on music theory. Unlike AI audio generators, get editable MIDI for Ableton, FL Studio, Logic Pro. Full creative control.',
    keywords: 'MIDI generator, pop music MIDI, DAW template, music theory, chord progression generator, melody generator, editable MIDI, reproducible music, AI music MIDI, J-Pop MIDI, K-Pop MIDI, music production'
  },
  ja: {
    title: 'MIDI Sketch - 音楽理論ベースのポップスMIDI生成',
    description: '音楽理論に基づいた再現性のあるポップスMIDIを自動生成。AI音声生成と違い、DAWで自由に編集できるMIDIデータを出力。ドラム、ベース、コード、メロディをすぐにインポート。',
    keywords: 'MIDI作成, ポップス MIDI生成, DAWテンプレート, 作曲ツール, 音楽理論, コード進行, メロディ生成, 編集可能MIDI, 再現性, DTM, アレンジ自動生成, J-Pop MIDI, K-Pop MIDI'
  }
}

/** `ja/docs/foo.md` -> `/ja/docs/foo`, `index.md` -> `/` */
function routeOf(relativePath: string): string {
  const clean = relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
  return `/${clean}`.replace(/\/{2,}/g, '/')
}

const localeOf = (relativePath: string): Locale =>
  relativePath.startsWith('ja/') ? 'ja' : 'en'

/** The same page in the other language. */
function alternateRoute(relativePath: string): string {
  return relativePath.startsWith('ja/')
    ? routeOf(relativePath.slice(3))
    : routeOf(`ja/${relativePath}`)
}

export default withMermaid(defineConfig({
  srcDir: 'src',

  title: 'MIDI Sketch - Music Theory-Based Pop MIDI Generator',
  description: 'Auto-generate reproducible pop music MIDI based on music theory. Unlike AI audio generators, get editable MIDI data for your DAW. Drums, bass, chords, and melody ready to import.',

  // Sitemap
  sitemap: {
    hostname: siteUrl
  },

  // Emit an llms.txt index (https://llmstxt.org) into the build output.
  buildEnd(siteConfig) {
    generateLlmsTxt({
      siteUrl,
      srcDir: siteConfig.srcDir,
      outDir: siteConfig.outDir,
      cleanUrls: siteConfig.cleanUrls,
      site: siteConfig.site,
      locales: LLMS_LOCALES
    })
  },

  // Locale-independent only. Everything that differs per page or per language
  // (canonical, OGP, keywords, JSON-LD) is emitted from transformHead below.
  head: [
    ['meta', { name: 'theme-color', content: '#8B5CF6' }],
    ['link', { rel: 'icon', href: '/favicon.ico', sizes: '48x48' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    // Site-wide web fonts (single source of truth — do not @import fonts in components)
    // Display: Space Grotesk / Body: Plus Jakarta Sans + Zen Kaku Gothic New (ja) / Mono: JetBrains Mono
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=JetBrains+Mono:ital,wght@0,400..700;1,400..700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap', rel: 'stylesheet' }],

    // OGP — shared across pages and languages
    ['meta', { property: 'og:site_name', content: 'MIDI Sketch' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: `${siteUrl}/og-image.png` }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: `${siteUrl}/og-image.png` }],
  ],

  transformHead({ pageData, description }) {
    const lang = localeOf(pageData.relativePath)
    const seo = SEO[lang]
    const url = `${siteUrl}${routeOf(pageData.relativePath)}`
    const altLang: Locale = lang === 'ja' ? 'en' : 'ja'
    const altUrl = `${siteUrl}${alternateRoute(pageData.relativePath)}`
    const title = pageData.frontmatter.title || seo.title
    const desc = description || seo.description

    return [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { name: 'keywords', content: seo.keywords }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: desc }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:locale', content: lang }],
      ['meta', { property: 'og:locale:alternate', content: altLang }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: desc }],
      ['link', { rel: 'alternate', hreflang: lang, href: url }],
      ['link', { rel: 'alternate', hreflang: altLang, href: altUrl }],
      ['link', { rel: 'alternate', hreflang: 'x-default', href: `${siteUrl}${routeOf(pageData.relativePath.replace(/^ja\//, ''))}` }],
      ['script', { type: 'application/ld+json' }, JSON.stringify(softwareApplicationJsonLd(lang))],
      ['script', { type: 'application/ld+json' }, JSON.stringify(faqJsonLd(lang))],
    ]
  },

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Docs', link: '/docs/getting-started' },
          { text: 'Course', link: '/docs/course/primer' },
          { text: 'GitHub', link: githubUrl }
        ],
        sidebar: {
          '/docs/': enDocsSidebar
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
          { text: 'コース', link: '/ja/docs/course/primer' },
          { text: 'GitHub', link: githubUrl }
        ],
        sidebar: {
          '/ja/docs/': [
            {
              text: 'ガイド',
              items: [
                { text: '特徴', link: '/ja/docs/features' },
                { text: 'はじめに', link: '/ja/docs/getting-started' },
                { text: 'インストール', link: '/ja/docs/installation' },
              ]
            },
            {
              text: 'コース',
              items: [
                { text: '0・エンジニアのための音楽入門', link: '/ja/docs/course/primer' },
                { text: '1・スケールとキー', link: '/ja/docs/course/scales-keys' },
                { text: '2・コードとトライアド', link: '/ja/docs/course/chords' },
                { text: '3・コード進行', link: '/ja/docs/course/progressions' },
                { text: '4・ハーモニーと響きの色', link: '/ja/docs/course/harmony-color' },
                { text: '5・メロディ・モチーフ・フック', link: '/ja/docs/course/melody-motif' },
                { text: '6・楽曲構成', link: '/ja/docs/course/song-structure' },
                { text: '7・MidiSketch設定との対応', link: '/ja/docs/course/config-mapping' },
                { text: '音楽用語リファレンス', link: '/ja/docs/course/glossary' },
              ]
            },
            {
              text: '技術解説',
              items: [
                { text: 'アーキテクチャ', link: '/ja/docs/architecture' },
                { text: '生成パイプライン', link: '/ja/docs/generation-pipeline' },
                { text: 'トラック生成', link: '/ja/docs/track-generators' },
                { text: 'メロディ評価', link: '/ja/docs/melody-evaluation' },
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
      message:
        'a personal project by <a href="https://libraz.net" target="_blank" rel="noopener">libraz</a>'
    }
  },

  vite: {
    plugins: [llmsDevPlugin({ siteUrl, locales: LLMS_LOCALES })],
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
