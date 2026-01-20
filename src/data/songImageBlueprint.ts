/**
 * Mapping from songImage ID to recommended Blueprint ID
 * Used when blueprintId is set to 255 (auto)
 */

/**
 * Blueprint IDs:
 * 0 = Traditional (王道ポップ)
 * 1 = RhythmLock (リズム先行)
 * 2 = StoryPop (物語展開)
 * 3 = Ballad (バラード)
 * 4 = IdolStandard (王道アイドル)
 * 5 = IdolHyper (ハイエナジー)
 * 6 = IdolKawaii (スイート)
 * 7 = IdolCoolPop (グルーヴ)
 * 8 = IdolEmo (エモーショナル)
 */
export const SONG_IMAGE_BLUEPRINT_MAP: Record<string, number> = {
  // Idol category
  'idol-classic': 4, // IdolStandard
  'idol-energy': 5, // IdolHyper
  'idol-emotional': 8, // IdolEmo

  // Pop category
  'jpop-standard': 0, // Traditional
  citypop: 2, // StoryPop
  'anime-song': 0, // Traditional
  'rock-pop': 1, // RhythmLock

  // Dance / Electronic category
  'dance-pop': 1, // RhythmLock
  'edm-synth': 1, // RhythmLock
  synthwave: 7, // IdolCoolPop (four-on-floor)
  electronica: 7, // IdolCoolPop (four-on-floor)

  // Ballad category
  'ballad-emotional': 3, // Ballad
  'love-song': 3, // Ballad
  'chill-relax': 3, // Ballad
  instrumental: 2, // StoryPop
}

/**
 * Default blueprint ID when songImage is not in the map
 */
export const DEFAULT_BLUEPRINT_ID = 0 // Traditional

/**
 * Get the recommended blueprint ID for a given songImage
 */
export function getRecommendedBlueprintId(songImageId: string): number {
  return SONG_IMAGE_BLUEPRINT_MAP[songImageId] ?? DEFAULT_BLUEPRINT_ID
}
