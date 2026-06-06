import type { ScoreExampleDef } from './types'

/** Chapter 1: Scales & Keys. */
export const scalesKeysExamples: Record<string, ScoreExampleDef> = {
  majorScaleC: {
    tags: ['scale', 'major'],
    badge: { en: 'Major scale', ja: 'メジャースケール' },
    title: { en: 'C major scale: the do-re-mi pattern', ja: 'Cメジャースケール：ドレミの型' },
    diagnosis: {
      en: 'Whole-whole-half-whole-whole-whole-half: the interval pattern that defines "major".',
      ja: '全・全・半・全・全・全・半 — この間隔パターンが「メジャー」を定義します。',
    },
    caption: {
      en: 'A scale is a subset of the 12 semitones, chosen by a fixed interval pattern. The major scale takes steps of 2-2-1-2-2-2-1 semitones. Starting on C uses only white keys: C D E F G A B C.',
      ja: 'スケールは12半音から一定の間隔パターンで選んだ部分集合です。メジャースケールは2-2-1-2-2-2-1半音のステップを取ります。Cから始めると白鍵だけになります：C D E F G A B C。',
    },
    time: '4/4',
    width: 520,
    upperClef: 'treble',
    upper: [
      { key: 'c/4', duration: '8', annotation: 'do' },
      { key: 'd/4', duration: '8', annotation: 're' },
      { key: 'e/4', duration: '8', annotation: 'mi' },
      { key: 'f/4', duration: '8', annotation: 'fa' },
      { key: 'g/4', duration: '8', annotation: 'so' },
      { key: 'a/4', duration: '8', annotation: 'la' },
      { key: 'b/4', duration: '8', annotation: 'ti' },
      { key: 'c/5', duration: '8', annotation: 'do' },
    ],
  },

  minorScaleA: {
    tags: ['scale', 'minor'],
    badge: { en: 'Minor scale', ja: 'マイナースケール' },
    title: { en: 'A natural minor: same notes, darker home', ja: 'Aナチュラルマイナー：同じ音で、暗い響きの中心' },
    diagnosis: {
      en: 'A minor uses the same white keys as C major, but the home note is A.',
      ja: 'AマイナーはCメジャーと同じ白鍵を使いますが、中心音はAです。',
    },
    caption: {
      en: 'Start the same white keys on A and the mood turns melancholic: A B C D E F G A. This is the natural minor scale, the "relative minor" of C major. Which note feels like home changes everything.',
      ja: '同じ白鍵をAから始めると、雰囲気が物悲しくなります：A B C D E F G A。これがナチュラルマイナースケールで、Cメジャーの「平行調（レラティブマイナー）」です。どの音が「帰る場所」かで全てが変わります。',
    },
    time: '4/4',
    width: 520,
    upperClef: 'treble',
    upper: [
      { key: 'a/3', duration: '8', annotation: '1' },
      { key: 'b/3', duration: '8' },
      { key: 'c/4', duration: '8' },
      { key: 'd/4', duration: '8' },
      { key: 'e/4', duration: '8' },
      { key: 'f/4', duration: '8' },
      { key: 'g/4', duration: '8' },
      { key: 'a/4', duration: '8', annotation: '8' },
    ],
  },

  scaleDegrees: {
    tags: ['degree'],
    badge: { en: 'Degrees', ja: '度数' },
    title: { en: 'Scale degrees: relative coordinates', ja: 'スケールディグリー：相対座標' },
    diagnosis: {
      en: 'Numbering scale notes 1-7 gives a key-independent coordinate system.',
      ja: 'スケール音を1〜7で番号付けすると、キーに依存しない座標系になります。',
    },
    caption: {
      en: 'Instead of absolute note names, music theory numbers the scale notes 1 through 7 (degrees). "Degree 5 of C major" is G; "degree 5 of D major" is A. All chord progression notation (I, IV, V...) builds on this relative system.',
      ja: '絶対的な音名の代わりに、音楽理論ではスケール音に1〜7の番号（度数）を振ります。「Cメジャーの第5音」はG、「Dメジャーの第5音」はA。コード進行の表記（I、IV、V…）はすべてこの相対システムの上に成り立っています。',
    },
    time: '4/4',
    bars: 2,
    width: 640,
    upperClef: 'treble',
    upper: [
      { key: 'c/4', annotation: '1' },
      { key: 'd/4', annotation: '2' },
      { key: 'e/4', annotation: '3' },
      { key: 'f/4', annotation: '4' },
      { key: 'g/4', annotation: '5' },
      { key: 'a/4', annotation: '6' },
      { key: 'b/4', annotation: '7' },
      { key: 'c/5', annotation: '1' },
    ],
  },

  keyTransposeC_G: {
    tags: ['key'],
    badge: { en: 'Key', ja: 'キー' },
    title: { en: 'The same phrase in C and in G', ja: '同じフレーズをCとGで' },
    diagnosis: {
      en: 'Changing the key shifts every note by the same offset — the shape is identical.',
      ja: 'キーを変えると全音符が同じだけ平行移動します。形は完全に同一です。',
    },
    caption: {
      en: 'The key names which note is "home" (degree 1). The same melodic shape starting from C and from G sounds like the same tune at a different height. In MidiSketch, `key: 0` is C and `key: 7` is G — just a transposition offset.',
      ja: 'キーは「帰る場所」（第1音）がどの音かを決めます。同じメロディの形をCから始めてもGから始めても、高さが違うだけの同じ曲に聞こえます。MidiSketchでは `key: 0` がC、`key: 7` がGで、単なる移調オフセットです。',
    },
    time: '4/4',
    width: 520,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'key: 0 (C)', ja: 'key: 0（C）' },
    lowerLabel: { en: 'key: 7 (G)', ja: 'key: 7（G）' },
    upper: [
      { key: 'c/4', annotation: '1' },
      { key: 'd/4', annotation: '2' },
      { key: 'e/4', annotation: '3' },
      { key: 'g/4', annotation: '5' },
    ],
    lower: [
      { key: 'g/4', annotation: '1' },
      { key: 'a/4', annotation: '2' },
      { key: 'b/4', annotation: '3' },
      { key: 'd/5', annotation: '5' },
    ],
    playback: 'sequential',
  },

  intervalThirds: {
    tags: ['interval', '3rd'],
    badge: { en: 'Intervals', ja: '音程' },
    title: { en: 'Stacked thirds: the seed of chords', ja: '3度の積み重ね：コードの種' },
    diagnosis: {
      en: 'Two scale notes a third apart already sound harmonic — chords stack more of these.',
      ja: 'スケール上で3度離れた2音はすでに和声的に響きます。コードはこれをさらに積みます。',
    },
    caption: {
      en: 'An interval is the distance between two notes. The third (skip one scale note) is the friendliest interval in pop harmony. Play these pairs and notice they already sound "musical" — triads in the next chapter are just two thirds stacked.',
      ja: '音程とは2音間の距離です。3度（スケール音を1つ飛ばす）はポップスの和声で最も使いやすい音程です。これらのペアを再生すると、すでに「音楽的」に響くことがわかります。次章のトライアドは3度を2つ重ねただけです。',
    },
    time: '4/4',
    width: 520,
    upperClef: 'treble',
    upper: [
      { key: 'c/4', keys: ['c/4', 'e/4'], annotation: 'C-E' },
      { key: 'd/4', keys: ['d/4', 'f/4'], annotation: 'D-F' },
      { key: 'e/4', keys: ['e/4', 'g/4'], annotation: 'E-G' },
      { key: 'f/4', keys: ['f/4', 'a/4'], annotation: 'F-A' },
    ],
  },
}
