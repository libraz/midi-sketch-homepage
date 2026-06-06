import type { ScoreExampleDef } from './types'

/** Chapter 2: Chords & Triads. */
export const chordsExamples: Record<string, ScoreExampleDef> = {
  triadStack: {
    tags: ['chord', 'triad'],
    badge: { en: 'Triad', ja: 'トライアド' },
    title: { en: 'Building a C major triad', ja: 'Cメジャートライアドを組み立てる' },
    diagnosis: {
      en: 'Root + third + fifth, then all three together: that is a chord.',
      ja: 'ルート＋3度＋5度、そして3音同時 — それがコードです。',
    },
    caption: {
      en: 'Take degree 1 (the root), skip to degree 3, skip to degree 5, then sound them together. C + E + G = the C major triad. Almost every chord you will meet is built by stacking thirds like this.',
      ja: '第1音（ルート）を取り、3度上、さらに3度上（第5音）を重ね、同時に鳴らします。C + E + G = Cメジャートライアド。これから出会うほぼすべてのコードは、このように3度を積んで作られます。',
    },
    time: '4/4',
    width: 520,
    upperClef: 'treble',
    upper: [
      { key: 'c/4', annotation: 'root' },
      { key: 'e/4', annotation: '3rd' },
      { key: 'g/4', annotation: '5th' },
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], chordSymbol: 'C' },
    ],
  },

  majMinDim: {
    tags: ['major', 'minor', 'diminished'],
    badge: { en: 'Chord quality', ja: 'コードの性格' },
    title: { en: 'Major, minor, diminished: same root, different color', ja: 'メジャー・マイナー・ディミニッシュ：同じルート、違う色' },
    diagnosis: {
      en: 'Moving the middle/top notes by one semitone flips the emotional color.',
      ja: '真ん中や上の音を半音動かすだけで、感情の色がひっくり返ります。',
    },
    caption: {
      en: 'C major (C-E-G) sounds bright. Lower the third by a semitone and C minor (C-E♭-G) sounds sad. Lower the fifth too and C diminished (C-E♭-G♭) sounds tense and unstable. Quality = the exact semitone spacing inside the stack.',
      ja: 'Cメジャー（C-E-G）は明るく響きます。3度を半音下げたCマイナー（C-E♭-G）は悲しく、さらに5度も下げたCディミニッシュ（C-E♭-G♭）は緊張して不安定に響きます。コードの性格＝積み重ねの中の正確な半音間隔です。',
    },
    time: '3/4',
    width: 520,
    upperClef: 'treble',
    upper: [
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], chordSymbol: 'C', annotation: 'major' },
      { key: 'c/4', keys: ['c/4', 'eb/4', 'g/4'], accidentals: [null, 'b', null], chordSymbol: 'Cm', annotation: 'minor' },
      { key: 'c/4', keys: ['c/4', 'eb/4', 'gb/4'], accidentals: [null, 'b', 'b'], chordSymbol: 'Cdim', annotation: 'dim' },
    ],
  },

  diatonicTriads: {
    tags: ['degree', 'diatonic'],
    badge: { en: 'Diatonic chords', ja: 'ダイアトニックコード' },
    title: { en: 'The seven chords of C major', ja: 'Cメジャーの7つのコード' },
    diagnosis: {
      en: 'Stacking thirds on each scale degree yields the chord palette of the key.',
      ja: '各スケール音の上に3度を積むと、そのキーのコードパレットができます。',
    },
    caption: {
      en: 'Build a triad on every degree of C major and you get the seven diatonic chords: C, Dm, Em, F, G, Am, Bdim. Uppercase Roman numerals mark major chords (I, IV, V), lowercase minor (ii, iii, vi), and ° marks diminished (vii°). Pop progressions pick from this palette.',
      ja: 'Cメジャーの各度数の上にトライアドを作ると、7つのダイアトニックコードが得られます：C、Dm、Em、F、G、Am、Bdim。ローマ数字の大文字はメジャー（I、IV、V）、小文字はマイナー（ii、iii、vi）、°はディミニッシュ（vii°）を表します。ポップスの進行はこのパレットから選ばれます。',
    },
    time: '4/4',
    bars: 2,
    width: 760,
    upperClef: 'treble',
    upper: [
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], chordSymbol: 'C', annotation: 'I' },
      { key: 'd/4', keys: ['d/4', 'f/4', 'a/4'], chordSymbol: 'Dm', annotation: 'ii' },
      { key: 'e/4', keys: ['e/4', 'g/4', 'b/4'], chordSymbol: 'Em', annotation: 'iii' },
      { key: 'f/4', keys: ['f/4', 'a/4', 'c/5'], chordSymbol: 'F', annotation: 'IV' },
      { key: 'g/4', keys: ['g/4', 'b/4', 'd/5'], chordSymbol: 'G', annotation: 'V' },
      { key: 'a/4', keys: ['a/4', 'c/5', 'e/5'], chordSymbol: 'Am', annotation: 'vi' },
      { key: 'b/4', keys: ['b/4', 'd/5', 'f/5'], chordSymbol: 'Bdim', annotation: 'vii°' },
      { key: 'c/5', keys: ['c/5', 'e/5', 'g/5'], chordSymbol: 'C', annotation: 'I' },
    ],
  },

  inversions: {
    tags: ['inversion', 'voicing'],
    badge: { en: 'Inversions', ja: '転回形' },
    title: { en: 'One chord, three voicings', ja: '1つのコード、3つの積み方' },
    diagnosis: {
      en: 'Reordering the same three notes keeps the chord identity but changes its bass.',
      ja: '同じ3音を並べ替えてもコードの正体は同じ。ただし最低音が変わります。',
    },
    caption: {
      en: 'C-E-G, E-G-C, and G-C-E are all "C major" — the chord is a set, not a sequence. Which note sits at the bottom (the voicing) changes the feel and how smoothly chords connect. MidiSketch picks voicings automatically via voice leading.',
      ja: 'C-E-G、E-G-C、G-C-Eはすべて「Cメジャー」です。コードは順序ではなく集合だからです。どの音が一番下に来るか（ボイシング）で、響きの印象とコード同士の繋がりの滑らかさが変わります。MidiSketchはボイスリーディングによって自動的にボイシングを選びます。',
    },
    time: '4/4',
    width: 560,
    upperClef: 'treble',
    upper: [
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], chordSymbol: 'C', annotation: 'root' },
      { key: 'e/4', keys: ['e/4', 'g/4', 'c/5'], chordSymbol: 'C/E', annotation: '1st inv' },
      { key: 'g/4', keys: ['g/4', 'c/5', 'e/5'], chordSymbol: 'C/G', annotation: '2nd inv' },
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], chordSymbol: 'C', annotation: 'root' },
    ],
  },

  chordVsArpeggio: {
    tags: ['arpeggioEnabled'],
    badge: { en: 'Block vs broken', ja: '同時と分散' },
    title: { en: 'The same chord, blocked and broken', ja: '同じコードを同時に・ばらして' },
    diagnosis: {
      en: 'An arpeggio is just a chord played one note at a time.',
      ja: 'アルペジオとは、コードを1音ずつ順に弾いたものです。',
    },
    caption: {
      en: 'Play C-E-G together and you get a block chord; play the notes one after another and you get an arpeggio. Same harmony, different texture. MidiSketch\'s arpeggio track (arpeggioEnabled, arpeggioPattern) automates exactly this.',
      ja: 'C-E-Gを同時に鳴らせばブロックコード、順番に鳴らせばアルペジオです。同じハーモニーでも質感が変わります。MidiSketchのアルペジオトラック（arpeggioEnabled、arpeggioPattern）はまさにこれを自動化します。',
    },
    time: '4/4',
    width: 560,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'arpeggio', ja: 'アルペジオ' },
    lowerLabel: { en: 'block chord', ja: 'ブロックコード' },
    upper: [
      { key: 'c/4' },
      { key: 'e/4' },
      { key: 'g/4' },
      { key: 'c/5' },
    ],
    lower: [
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], duration: 'w', chordSymbol: 'C' },
    ],
  },
}
