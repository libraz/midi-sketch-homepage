/**
 * Production Blueprint definitions
 * Maps to WASM-side Blueprint IDs (0-8, 255=auto)
 *
 * Blueprint override rules (from WASM):
 * - section_flow: Overrides formId (all except Traditional)
 * - riff_policy: Locked/Evolving ignores motifRepeatScope
 * - TrackMask::Motif: Controls motif generation per section
 */

export type RiffPolicy = 'free' | 'locked' | 'evolving'
export type Paradigm = 'traditional' | 'rhythm' | 'melody'

export interface BlueprintOption {
  id: number
  label: { en: string; ja: string }
  description: { en: string; ja: string }
  icon: string
  paradigm: Paradigm
  /** RiffPolicy determines motif behavior */
  riffPolicy: RiffPolicy
  /** True if this blueprint overrides formId with its own section_flow */
  overridesForm: boolean
  /** True if this blueprint generates motif tracks */
  hasMotif: boolean
  /** True if drums are required for this blueprint to work properly */
  requiresDrums: boolean
  /** True if arpeggio is recommended for this blueprint */
  recommendsArpeggio: boolean
}

export const BLUEPRINT_OPTIONS: BlueprintOption[] = [
  {
    id: 255,
    label: { en: 'Auto', ja: 'おまかせ' },
    description: {
      en: 'Automatically select based on style',
      ja: '曲イメージに合わせて自動選択',
    },
    icon: '🔮',
    paradigm: 'traditional',
    riffPolicy: 'free',
    overridesForm: false,
    hasMotif: false,
    requiresDrums: false,
    recommendsArpeggio: false,
  },
  {
    id: 0,
    label: { en: 'Standard Pop', ja: '定番ポップ' },
    description: {
      en: 'Classic A→B→Chorus structure',
      ja: 'イントロ→A→B→サビの王道展開',
    },
    icon: '🎵',
    paradigm: 'traditional',
    riffPolicy: 'free',
    overridesForm: false,
    hasMotif: false,
    requiresDrums: false,
    recommendsArpeggio: false,
  },
  {
    id: 1,
    label: { en: 'Rhythm Lock', ja: 'リズムで刻む' },
    description: {
      en: 'Drums & bass sync with melody',
      ja: 'ドラムとベースがメロディに同期',
    },
    icon: '🥁',
    paradigm: 'rhythm',
    riffPolicy: 'locked',
    overridesForm: true,
    hasMotif: true,
    requiresDrums: true, // drums_sync_vocal = true
    recommendsArpeggio: false,
  },
  {
    id: 2,
    label: { en: 'Story Build', ja: '物語のように展開' },
    description: {
      en: 'Full arrangement, gradual build',
      ja: 'フルアレンジで徐々に盛り上がる',
    },
    icon: '📖',
    paradigm: 'melody',
    riffPolicy: 'evolving',
    overridesForm: true,
    hasMotif: true,
    requiresDrums: false,
    recommendsArpeggio: false,
  },
  {
    id: 3,
    label: { en: 'Ballad', ja: '静かに始まる' },
    description: {
      en: 'Quiet start, gradual build',
      ja: '静かに始まり、徐々に楽器が増える',
    },
    icon: '🌙',
    paradigm: 'melody',
    riffPolicy: 'free',
    overridesForm: true,
    hasMotif: false,
    requiresDrums: false,
    recommendsArpeggio: false,
  },
  {
    id: 4,
    label: { en: 'Classic Idol', ja: 'アイドル王道' },
    description: {
      en: 'Layers build, big last chorus',
      ja: 'パートが徐々に増え、ラストサビで最高潮',
    },
    icon: '⭐',
    paradigm: 'melody',
    riffPolicy: 'evolving',
    overridesForm: true,
    hasMotif: true,
    requiresDrums: false,
    recommendsArpeggio: false,
  },
  {
    id: 5,
    label: { en: 'High Energy', ja: 'サビから攻める' },
    description: {
      en: 'Chorus-first, high intensity',
      ja: '最初からサビ感・高密度で攻める',
    },
    icon: '⚡',
    paradigm: 'rhythm',
    riffPolicy: 'locked',
    overridesForm: true,
    hasMotif: true,
    requiresDrums: true, // drums_sync_vocal = true
    recommendsArpeggio: false,
  },
  {
    id: 6,
    label: { en: 'Sweet Bounce', ja: 'かわいく弾む' },
    description: {
      en: 'Gentle dynamics, cute vibe',
      ja: '控えめで可愛らしい弾む感じ',
    },
    icon: '🍬',
    paradigm: 'melody',
    riffPolicy: 'locked',
    overridesForm: true,
    hasMotif: true,
    requiresDrums: false,
    recommendsArpeggio: false,
  },
  {
    id: 7,
    label: { en: 'Groove Drive', ja: '踊れるビート' },
    description: {
      en: 'Four-on-floor with dance break',
      ja: '四つ打ちでダンスブレイクあり',
    },
    icon: '🎧',
    paradigm: 'rhythm',
    riffPolicy: 'locked',
    overridesForm: true,
    hasMotif: true,
    requiresDrums: true, // four-on-floor needs drums
    recommendsArpeggio: true, // dance break uses arpeggio
  },
  {
    id: 8,
    label: { en: 'Emotional Arc', ja: '静→爆発' },
    description: {
      en: 'Quiet to explosive climax',
      ja: '静かな始まりから感情的に爆発',
    },
    icon: '💫',
    paradigm: 'melody',
    riffPolicy: 'locked',
    overridesForm: true,
    hasMotif: true,
    requiresDrums: false,
    recommendsArpeggio: false,
  },
]

/**
 * Auto blueprint ID (255) indicates the system should resolve based on songImage
 */
export const AUTO_BLUEPRINT_ID = 255

/**
 * Get blueprint option by ID
 */
export function getBlueprintById(id: number): BlueprintOption | undefined {
  return BLUEPRINT_OPTIONS.find((bp) => bp.id === id)
}

/**
 * Check if a blueprint overrides form structure
 */
export function blueprintOverridesForm(id: number): boolean {
  const bp = getBlueprintById(id)
  return bp?.overridesForm ?? false
}

/**
 * Check if motifRepeatScope setting is ignored for this blueprint
 * (Locked and Evolving riff policies ignore the user's motifRepeatScope setting)
 */
export function blueprintIgnoresMotifScope(id: number): boolean {
  const bp = getBlueprintById(id)
  return bp?.riffPolicy !== 'free'
}

/**
 * Check if drums are required for this blueprint
 */
export function blueprintRequiresDrums(id: number): boolean {
  const bp = getBlueprintById(id)
  return bp?.requiresDrums ?? false
}

/**
 * Check if arpeggio is recommended for this blueprint
 */
export function blueprintRecommendsArpeggio(id: number): boolean {
  const bp = getBlueprintById(id)
  return bp?.recommendsArpeggio ?? false
}

/**
 * Check if this blueprint uses the RhythmSync paradigm
 */
export function blueprintIsRhythmSync(id: number): boolean {
  const bp = getBlueprintById(id)
  return bp?.paradigm === 'rhythm'
}
