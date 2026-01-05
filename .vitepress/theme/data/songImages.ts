export interface SongImage {
  id: string
  name: {
    en: string
    ja: string
  }
  tagline: {
    en: string
    ja: string
  }
  description: {
    en: string
    ja: string
  }
  icon: string
  color: string
  category: 'idol' | 'pop' | 'dance' | 'ballad' | 'electronic'
  stylePresetIds: number[]
  recommendedChords: number[]
  tempoRange: { min: number; max: number; default: number }
  defaultTimbre: string
}

export const songImages: SongImage[] = [
  // ===== IDOL =====
  {
    id: 'idol-classic',
    name: {
      en: 'Classic Idol Pop',
      ja: '王道アイドル曲'
    },
    tagline: {
      en: 'Bright, catchy, and full of energy',
      ja: 'キラキラ・キャッチー・元気いっぱい'
    },
    description: {
      en: 'The quintessential idol sound - upbeat, memorable hooks with a touch of sweetness',
      ja: '王道のアイドルサウンド。アップテンポでキャッチー、ちょっと甘さも'
    },
    icon: 'mdi-star-shooting',
    color: '#FF6B9D',
    category: 'idol',
    stylePresetIds: [3, 4],
    recommendedChords: [0, 1, 5],
    tempoRange: { min: 125, max: 145, default: 132 },
    defaultTimbre: 'idol_light'
  },
  {
    id: 'idol-energy',
    name: {
      en: 'High Energy Idol',
      ja: 'ハイエナジーアイドル'
    },
    tagline: {
      en: 'Maximum power, maximum fun',
      ja: '全力全開！盛り上がり最高潮'
    },
    description: {
      en: 'Fast, powerful, and designed to get the crowd jumping',
      ja: 'ライブで盛り上がる！速くてパワフルな曲'
    },
    icon: 'mdi-lightning-bolt',
    color: '#FFD93D',
    category: 'idol',
    stylePresetIds: [5],
    recommendedChords: [0, 2, 6],
    tempoRange: { min: 140, max: 160, default: 150 },
    defaultTimbre: 'pop_bright'
  },
  {
    id: 'idol-emotional',
    name: {
      en: 'Emotional Idol',
      ja: 'エモーショナルアイドル'
    },
    tagline: {
      en: 'Heartfelt ballad with idol charm',
      ja: '心に響くアイドルバラード'
    },
    description: {
      en: 'Slower idol songs that tell a story and touch the heart',
      ja: 'ストーリーを感じる、心に残るアイドル曲'
    },
    icon: 'mdi-heart',
    color: '#FF8FA3',
    category: 'idol',
    stylePresetIds: [4],
    recommendedChords: [1, 3, 5],
    tempoRange: { min: 90, max: 115, default: 100 },
    defaultTimbre: 'idol_light'
  },

  // ===== POP =====
  {
    id: 'jpop-standard',
    name: {
      en: 'J-POP Standard',
      ja: 'J-POP スタンダード'
    },
    tagline: {
      en: 'The sound of Japanese pop music',
      ja: '日本のポップスの王道'
    },
    description: {
      en: 'Classic J-POP sound with familiar chord progressions',
      ja: '聴き馴染みのあるコード進行で安定のJ-POPサウンド'
    },
    icon: 'mdi-music-note',
    color: '#4ECDC4',
    category: 'pop',
    stylePresetIds: [0, 2],
    recommendedChords: [5, 0, 1],
    tempoRange: { min: 110, max: 130, default: 120 },
    defaultTimbre: 'pop_clean'
  },
  {
    id: 'citypop',
    name: {
      en: 'City Pop',
      ja: 'シティポップ'
    },
    tagline: {
      en: 'Groovy, urban, nostalgic vibes',
      ja: 'グルーヴィーで都会的、ノスタルジック'
    },
    description: {
      en: 'Smooth, sophisticated sound inspired by 80s Japanese city pop',
      ja: '80年代の日本のシティポップにインスパイアされた洗練されたサウンド'
    },
    icon: 'mdi-city-variant',
    color: '#9B5DE5',
    category: 'pop',
    stylePresetIds: [9],
    recommendedChords: [7, 8, 10],
    tempoRange: { min: 95, max: 115, default: 105 },
    defaultTimbre: 'pop_clean'
  },
  {
    id: 'anime-op',
    name: {
      en: 'Anime Opening',
      ja: 'アニメOP風'
    },
    tagline: {
      en: 'Epic, dramatic, and memorable',
      ja: '壮大でドラマチック、印象的'
    },
    description: {
      en: 'Powerful songs that could open your favorite anime',
      ja: 'お気に入りのアニメのOPになりそうな力強い曲'
    },
    icon: 'mdi-television-play',
    color: '#FF6B6B',
    category: 'pop',
    stylePresetIds: [10, 2],
    recommendedChords: [5, 2, 6],
    tempoRange: { min: 130, max: 155, default: 142 },
    defaultTimbre: 'pop_bright'
  },

  // ===== DANCE =====
  {
    id: 'dance-pop',
    name: {
      en: 'Dance Pop',
      ja: 'ダンスポップ'
    },
    tagline: {
      en: 'Get up and dance!',
      ja: '踊りたくなるビート'
    },
    description: {
      en: 'Groovy beats and catchy hooks that make you move',
      ja: '体が自然と動き出すグルーヴィーなビートとキャッチーなフック'
    },
    icon: 'mdi-dance-ballroom',
    color: '#00D9FF',
    category: 'dance',
    stylePresetIds: [1],
    recommendedChords: [0, 1, 4],
    tempoRange: { min: 118, max: 135, default: 128 },
    defaultTimbre: 'dance_modern'
  },
  {
    id: 'edm-synth',
    name: {
      en: 'EDM / Synth Pop',
      ja: 'EDM / シンセポップ'
    },
    tagline: {
      en: 'Electronic beats, big drops',
      ja: 'エレクトロニックビート、ビッグドロップ'
    },
    description: {
      en: 'Modern electronic sound with powerful synths',
      ja: 'パワフルなシンセが映えるモダンなエレクトロニックサウンド'
    },
    icon: 'mdi-waveform',
    color: '#00FF88',
    category: 'electronic',
    stylePresetIds: [7],
    recommendedChords: [0, 4, 9],
    tempoRange: { min: 125, max: 145, default: 138 },
    defaultTimbre: 'dance_modern'
  },

  // ===== BALLAD =====
  {
    id: 'ballad-emotional',
    name: {
      en: 'Emotional Ballad',
      ja: 'エモーショナルバラード'
    },
    tagline: {
      en: 'Pour your heart out',
      ja: '心を込めて歌い上げる'
    },
    description: {
      en: 'Slow, emotional songs that tell a story',
      ja: 'ゆっくりと感情を込めて物語を紡ぐ曲'
    },
    icon: 'mdi-heart-outline',
    color: '#E8A2FF',
    category: 'ballad',
    stylePresetIds: [8],
    recommendedChords: [1, 3, 11],
    tempoRange: { min: 65, max: 85, default: 72 },
    defaultTimbre: 'ballad_warm'
  },
  {
    id: 'love-song',
    name: {
      en: 'Love Song',
      ja: '切ないラブソング'
    },
    tagline: {
      en: 'Bittersweet and beautiful',
      ja: '切なくて美しい'
    },
    description: {
      en: 'Mid-tempo songs about love and longing',
      ja: '恋と切なさを歌うミディアムテンポの曲'
    },
    icon: 'mdi-cards-heart',
    color: '#FF9ECD',
    category: 'ballad',
    stylePresetIds: [4, 8],
    recommendedChords: [1, 5, 3],
    tempoRange: { min: 85, max: 105, default: 95 },
    defaultTimbre: 'pop_clean'
  }
]

export interface SongImageCategory {
  id: string
  name: { en: string; ja: string }
  icon: string
  images: string[]
}

export const songImageCategories: SongImageCategory[] = [
  {
    id: 'idol',
    name: { en: 'Idol', ja: 'アイドル' },
    icon: 'mdi-star',
    images: ['idol-classic', 'idol-energy', 'idol-emotional']
  },
  {
    id: 'pop',
    name: { en: 'Pop', ja: 'ポップス' },
    icon: 'mdi-music',
    images: ['jpop-standard', 'citypop', 'anime-op']
  },
  {
    id: 'dance',
    name: { en: 'Dance / Electronic', ja: 'ダンス / エレクトロ' },
    icon: 'mdi-dance-ballroom',
    images: ['dance-pop', 'edm-synth']
  },
  {
    id: 'ballad',
    name: { en: 'Ballad', ja: 'バラード' },
    icon: 'mdi-heart',
    images: ['ballad-emotional', 'love-song']
  }
]
