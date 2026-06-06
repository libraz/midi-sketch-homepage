/**
 * Mapping from songImage ID to recommended Blueprint ID
 * Used when blueprintId is set to 255 (auto)
 */

/**
 * Blueprint IDs:
 * 0 = Traditional (standard pop)
 * 1 = RhythmLock (rhythm-driven)
 * 2 = StoryPop (narrative progression)
 * 3 = Ballad (ballad style)
 * 4 = IdolStandard (classic idol)
 * 5 = IdolHyper (high energy)
 * 6 = IdolKawaii (sweet/cute)
 * 7 = IdolCoolPop (groove)
 * 8 = IdolEmo (emotional)
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
  'vocaloid-anime': 2, // StoryPop (gradual build, evolving)
  // RhythmLock + anime_opening style preset triggers the WASM RhythmSync lead
  // setting (Vocaloid vocal style, max hook, driving 16th groove, locked riff)
  'vocaloid-drive': 1, // RhythmLock
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
