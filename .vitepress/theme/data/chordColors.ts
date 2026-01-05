export const chordDegreeColors: Record<string, string> = {
  // Major degrees
  'I': '#2196F3',    // Blue - Tonic (stable, home)
  'II': '#4CAF50',   // Green - Supertonic
  'III': '#9C27B0',  // Purple - Mediant
  'IV': '#FF9800',   // Orange - Subdominant (warm)
  'V': '#F44336',    // Red - Dominant (tension)
  'VI': '#3F51B5',   // Indigo - Submediant
  'VII': '#757575',  // Gray - Leading tone

  // Minor degrees
  'i': '#1976D2',    // Dark Blue
  'ii': '#388E3C',   // Dark Green
  'iii': '#7B1FA2',  // Dark Purple
  'iv': '#F57C00',   // Dark Orange
  'v': '#D32F2F',    // Dark Red
  'vi': '#303F9F',   // Dark Indigo
  'vii': '#616161',  // Dark Gray

  // Alterations
  'bII': '#00BCD4',  // Cyan - Neapolitan
  'bIII': '#8E24AA', // Purple variant
  'bVI': '#5C6BC0',  // Indigo variant
  'bVII': '#78909C', // Blue Gray
  '#IV': '#FFC107',  // Amber
  '#iv': '#FFB300',  // Dark Amber
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
