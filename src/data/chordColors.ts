// Midnight Gems - Jewel-tone palette for noir dark UI
// Rich, luminous colors that glow against #07070A background
export const chordDegreeColors: Record<string, string> = {
  // Major degrees - Jewel tones with subtle glow
  'I': '#9F7AEA',    // Amethyst - Tonic (home, stability)
  'II': '#C4856A',   // Copper Rose - Supertonic (earthy warmth)
  'III': '#A578B8',  // Mauve Crystal - Mediant (mysterious)
  'IV': '#D4915D',   // Amber Topaz - Subdominant (warm comfort)
  'V': '#5BA8BE',    // Sapphire Cyan - Dominant (tension, pull)
  'VI': '#6B8FC4',   // Moonstone Blue - Submediant (depth)
  'VII': '#8690A5',  // Twilight Steel - Leading tone (transitional)

  // Minor degrees - Deeper, richer variants
  'i': '#7C5CBF',    // Deep Amethyst
  'ii': '#9A7058',   // Dark Copper
  'iii': '#8B5DA3',  // Deep Orchid
  'iv': '#B87A4A',   // Burnt Amber
  'v': '#4A8FA3',    // Deep Teal
  'vi': '#5478A8',   // Ocean Depths
  'vii': '#6B7280',  // Charcoal

  // Alterations - Accent jewels
  'bII': '#5AAFB8',  // Aquamarine - Neapolitan
  'bIII': '#B86EA8', // Rhodolite
  'bVI': '#8B6BBF',  // Tanzanite
  'bVII': '#9A85C4', // Iolite
  '#IV': '#C9A45D',  // Citrine
  '#iv': '#B8944D',  // Dark Citrine
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
