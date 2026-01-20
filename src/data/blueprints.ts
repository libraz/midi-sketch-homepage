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
}

export const BLUEPRINT_OPTIONS: BlueprintOption[] = [
  {
    id: 255,
    label: { en: 'Auto', ja: 'おまかせ' },
    description: {
      en: 'Automatically select based on style',
      ja: 'スタイルに合った構成を自動選択',
    },
    icon: '🔮',
    paradigm: 'traditional',
    riffPolicy: 'free',
    overridesForm: false,
    hasMotif: false,
  },
  {
    id: 0,
    label: { en: 'Standard Pop', ja: '王道ポップ' },
    description: {
      en: 'Classic A→B→Chorus structure',
      ja: 'A→B→サビの定番構成',
    },
    icon: '🎵',
    paradigm: 'traditional',
    riffPolicy: 'free',
    overridesForm: false,
    hasMotif: false,
  },
  {
    id: 1,
    label: { en: 'Rhythm First', ja: 'リズム先行' },
    description: {
      en: 'Drums lead, drop-in at chorus. Motif in A/B/Chorus',
      ja: 'ドラムから始まり、サビでドロップイン。A/B/サビにモチーフ',
    },
    icon: '🥁',
    paradigm: 'rhythm',
    riffPolicy: 'locked',
    overridesForm: true,
    hasMotif: true,
  },
  {
    id: 2,
    label: { en: 'Narrative Build', ja: '物語展開' },
    description: {
      en: 'Full arrangement, motif in chorus only',
      ja: 'フルアレンジ、サビのみモチーフ',
    },
    icon: '📖',
    paradigm: 'melody',
    riffPolicy: 'evolving',
    overridesForm: true,
    hasMotif: true,
  },
  {
    id: 3,
    label: { en: 'Ballad', ja: 'バラード' },
    description: {
      en: 'Quiet start, gradual build. No motif',
      ja: '静かに始まり、徐々に盛り上がる。モチーフなし',
    },
    icon: '🌙',
    paradigm: 'melody',
    riffPolicy: 'free',
    overridesForm: true,
    hasMotif: false,
  },
  {
    id: 4,
    label: { en: 'Classic Idol', ja: '王道アイドル' },
    description: {
      en: 'Gradual layers, extended last chorus',
      ja: '徐々にレイヤー追加、ラストサビ長め',
    },
    icon: '⭐',
    paradigm: 'melody',
    riffPolicy: 'evolving',
    overridesForm: true,
    hasMotif: true,
  },
  {
    id: 5,
    label: { en: 'High Energy', ja: 'ハイエナジー' },
    description: {
      en: 'Chorus-first, high density, short A/B',
      ja: 'サビ先行、高密度、短いAB',
    },
    icon: '⚡',
    paradigm: 'rhythm',
    riffPolicy: 'locked',
    overridesForm: true,
    hasMotif: true,
  },
  {
    id: 6,
    label: { en: 'Sweet Bounce', ja: 'スイート' },
    description: {
      en: 'Restrained dynamics, cute vibe',
      ja: '控えめダイナミクス、かわいい雰囲気',
    },
    icon: '🍬',
    paradigm: 'melody',
    riffPolicy: 'locked',
    overridesForm: true,
    hasMotif: true,
  },
  {
    id: 7,
    label: { en: 'Groove Drive', ja: 'グルーヴ' },
    description: {
      en: 'Four-on-floor, with dance break',
      ja: 'Four-on-floor、ダンスブレイクあり',
    },
    icon: '🎧',
    paradigm: 'rhythm',
    riffPolicy: 'locked',
    overridesForm: true,
    hasMotif: true,
  },
  {
    id: 8,
    label: { en: 'Emotional Arc', ja: 'エモーショナル' },
    description: {
      en: 'Quiet→Explosion, emotional climax',
      ja: '静→爆発、感情的クライマックス',
    },
    icon: '💫',
    paradigm: 'melody',
    riffPolicy: 'locked',
    overridesForm: true,
    hasMotif: true,
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
