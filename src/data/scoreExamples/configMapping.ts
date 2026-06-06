import type { ScoreExampleDef } from './types'

/** Chapter 7: Mapping concepts to MidiSketch config. */
export const configMappingExamples: Record<string, ScoreExampleDef> = {
  configKeyTranspose: {
    tags: ['key', 'seed', 'chordProgressionId'],
    badge: { en: 'Putting it together', ja: '総仕上げ' },
    title: { en: 'One idea, two keys: everything is config', ja: '1つのアイデアを2つのキーで：すべては設定' },
    diagnosis: {
      en: 'Melody shape, chords, and key are independent dials — the song idea survives all of them.',
      ja: 'メロディの形・コード・キーは独立したつまみです。曲のアイデアはどれを変えても生き残ります。',
    },
    caption: {
      en: 'The same hook over I-V, rendered in C and then in D (key: 0 vs key: 2). Every concept in this course maps to a SongConfig field: pick the key, the progression, the structure, the extension probabilities — and the same seed reproduces the same song.',
      ja: '同じI-V上のフックを、Cと（key: 0）とD（key: 2）でレンダリングしたものです。このコースの全概念はSongConfigのフィールドに対応します。キー、進行、構成、エクステンション確率を選び、同じseedを使えば同じ曲が再現されます。',
    },
    time: '4/4',
    width: 560,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'key: 0 (C)', ja: 'key: 0（C）' },
    lowerLabel: { en: 'key: 2 (D)', ja: 'key: 2（D）' },
    upper: [
      { key: 'e/5', duration: 'q' },
      { key: 'd/5', duration: '8' },
      { key: 'c/5', duration: '8' },
      { key: 'g/4', keys: ['g/4', 'b/4', 'd/5'], duration: 'h', chordSymbol: 'G' },
    ],
    lower: [
      { key: 'f#/5', duration: 'q', accidental: '#' },
      { key: 'e/5', duration: '8' },
      { key: 'd/5', duration: '8' },
      { key: 'a/4', keys: ['a/4', 'c#/5', 'e/5'], accidentals: [null, '#', null], duration: 'h', chordSymbol: 'A' },
    ],
    playback: 'sequential',
  },
}
