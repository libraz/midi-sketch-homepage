// Modern, cohesive color palette with depth
// Colors are designed to work harmoniously together while maintaining distinction
export const chordDegreeColors: Record<string, string> = {
  // Major degrees - Refined, modern palette
  'I': '#6366F1',    // Indigo - Tonic (stable, home) - primary
  'II': '#10B981',   // Emerald - Supertonic - fresh
  'III': '#A855F7',  // Purple - Mediant - mystical
  'IV': '#F59E0B',   // Amber - Subdominant (warm)
  'V': '#EF4444',    // Red - Dominant (tension)
  'VI': '#3B82F6',   // Blue - Submediant
  'VII': '#64748B',  // Slate - Leading tone

  // Minor degrees - Deeper, richer variants
  'i': '#4F46E5',    // Deep Indigo
  'ii': '#059669',   // Deep Emerald
  'iii': '#9333EA',  // Deep Purple
  'iv': '#D97706',   // Deep Amber
  'v': '#DC2626',    // Deep Red
  'vi': '#2563EB',   // Deep Blue
  'vii': '#475569',  // Deep Slate

  // Alterations - Distinctive accent colors
  'bII': '#06B6D4',  // Cyan - Neapolitan
  'bIII': '#C026D3', // Fuchsia variant
  'bVI': '#7C3AED',  // Violet variant
  'bVII': '#8B5CF6', // Light Violet
  '#IV': '#FBBF24',  // Yellow
  '#iv': '#F59E0B',  // Amber
}

export function getChordGradient(degrees: string[]): string {
  const colors = degrees.map(d => chordDegreeColors[d] || '#757575')

  if (colors.length === 1) {
    return colors[0]
  }

  const stops = colors.map((c, i) =>
    `${c} ${(i / (colors.length - 1)) * 100}%`
  )

  return `linear-gradient(90deg, ${stops.join(', ')})`
}

export interface ChordProgression {
  id: number
  name: string
  display: string
  description: {
    en: string
    ja: string
  }
  tags: string[]
}

export const chordProgressions: ChordProgression[] = [
  {
    id: 0,
    name: 'Pop Canon',
    display: 'I - V - vi - IV',
    description: {
      en: 'The most popular progression in pop music',
      ja: 'ポップミュージックで最も人気のある進行'
    },
    tags: ['pop', 'upbeat', 'catchy']
  },
  {
    id: 1,
    name: 'Emotional',
    display: 'vi - IV - I - V',
    description: {
      en: 'Emotional progression starting from minor',
      ja: 'マイナーから始まる感動的な進行'
    },
    tags: ['emotional', 'ballad']
  },
  {
    id: 2,
    name: 'Pachelbel',
    display: 'I - V - vi - iii - IV - I - IV - V',
    description: {
      en: 'Classic Pachelbel Canon progression',
      ja: 'パッヘルベルのカノン進行'
    },
    tags: ['classical', 'elegant']
  },
  {
    id: 3,
    name: 'Minor Drama',
    display: 'i - VI - III - VII',
    description: {
      en: 'Dramatic minor progression',
      ja: 'ドラマチックなマイナー進行'
    },
    tags: ['dramatic', 'minor', 'epic']
  },
  {
    id: 4,
    name: 'Dance',
    display: 'I - vi - IV - V',
    description: {
      en: 'Classic dance pop progression',
      ja: 'クラシックなダンスポップ進行'
    },
    tags: ['dance', 'upbeat']
  },
  {
    id: 5,
    name: 'Royal Road',
    display: 'IV - V - iii - vi',
    description: {
      en: 'Royal road J-POP progression',
      ja: 'J-POPの王道進行'
    },
    tags: ['jpop', 'idol', 'classic']
  },
  {
    id: 6,
    name: 'Anime',
    display: 'vi - V - IV - V',
    description: {
      en: 'Common anime opening progression',
      ja: 'アニメOPによく使われる進行'
    },
    tags: ['anime', 'dramatic']
  },
  {
    id: 7,
    name: 'City Pop',
    display: 'IVmaj7 - III7 - vi7 - I',
    description: {
      en: 'Sophisticated city pop harmony',
      ja: 'シティポップの洗練されたハーモニー'
    },
    tags: ['citypop', 'jazzy', 'sophisticated']
  },
  {
    id: 8,
    name: 'Ballad',
    display: 'I - iii - vi - IV',
    description: {
      en: 'Gentle ballad progression',
      ja: '優しいバラード進行'
    },
    tags: ['ballad', 'gentle', 'emotional']
  },
  {
    id: 9,
    name: 'EDM Drop',
    display: 'vi - IV - I - V',
    description: {
      en: 'Common EDM drop progression',
      ja: 'EDMのドロップによく使われる進行'
    },
    tags: ['edm', 'electronic', 'drop']
  },
  {
    id: 10,
    name: 'Jazz Touch',
    display: 'IImaj7 - V7 - Imaj7 - VI7',
    description: {
      en: 'Jazz-influenced progression',
      ja: 'ジャズの影響を受けた進行'
    },
    tags: ['jazz', 'sophisticated']
  },
  {
    id: 11,
    name: 'Sad',
    display: 'i - iv - v - i',
    description: {
      en: 'Classic sad minor progression',
      ja: 'クラシックな悲しいマイナー進行'
    },
    tags: ['sad', 'minor', 'emotional']
  }
]
