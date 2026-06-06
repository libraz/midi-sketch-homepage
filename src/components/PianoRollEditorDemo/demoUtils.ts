import type { ChordAtBar, SectionAtBar } from '@/components/PianoRollEditor/types'
import type { SectionInfo, SongStructure } from '@/composables/usePianoRollEditor'

export const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const

export const DURATION_OPTIONS = [
  { label: '1/16', value: 120 },
  { label: '1/8', value: 240 },
  { label: '1/4', value: 480 },
  { label: '1/2', value: 960 },
] as const

const SECTION_COLORS: Record<SectionInfo['type'], { color: string; rgb: string }> = {
  verse: { color: '#4ADE80', rgb: '74, 222, 128' },
  prechorus: { color: '#FBBF24', rgb: '251, 191, 36' },
  chorus: { color: '#F87171', rgb: '248, 113, 113' },
  bridge: { color: '#60A5FA', rgb: '96, 165, 250' },
  outro: { color: '#A78BFA', rgb: '167, 139, 250' },
  intro: { color: '#34D399', rgb: '52, 211, 153' },
}

const FALLBACK_SECTION_COLOR = { color: '#8B5CF6', rgb: '139, 92, 246' }

export function getNoteName(pitch: number): string {
  return `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`
}

export function getKeyName(key: number): string {
  return NOTE_NAMES[key % 12]
}

export function getSectionColor(type: SectionInfo['type']): string {
  return SECTION_COLORS[type]?.color ?? FALLBACK_SECTION_COLOR.color
}

export function getSectionColorRgb(type: SectionInfo['type']): string {
  return SECTION_COLORS[type]?.rgb ?? FALLBACK_SECTION_COLOR.rgb
}

export function getChordsInView(structure: SongStructure): ChordAtBar[] {
  const result: ChordAtBar[] = []

  for (let globalBar = 1; globalBar <= structure.totalBars; globalBar++) {
    const section = structure.sections.find(
      item => globalBar >= item.startBar && globalBar < item.endBar
    )
    if (!section) continue

    const chordAtBar = [...section.chords].reverse().find(chord => chord.bar <= globalBar)
    if (!chordAtBar) continue

    result.push({
      bar: globalBar,
      name: chordAtBar.chord.name,
      degree: chordAtBar.chord.degree,
    })
  }

  return result
}

export function getSectionsInView(structure: SongStructure): SectionAtBar[] {
  return structure.sections.map(section => ({
    name: section.name,
    type: section.type,
    startBar: section.startBar,
    endBar: section.endBar,
  }))
}
