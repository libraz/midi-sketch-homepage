import type { ScoreExampleDef } from './types'
import { GREEN, AMBER } from './types'

/** Chapter 3: Chord Progressions. */
export const progressionsExamples: Record<string, ScoreExampleDef> = {
  royalRoad: {
    tags: ['chordProgressionId', 'IV-V-iii-vi'],
    badge: { en: 'Royal Road', ja: '王道進行' },
    title: { en: 'The "Royal Road" progression: IV-V-iii-vi', ja: '王道進行：IV-V-iii-vi' },
    diagnosis: {
      en: 'The signature J-pop loop: lift (IV), drive (V), shade (iii), land (vi).',
      ja: 'J-POPを象徴するループ：浮上（IV）→推進（V）→陰り（iii）→着地（vi）。',
    },
    caption: {
      en: 'In C major this reads F → G → Em → Am. It never sits on the home chord, so it keeps floating forward — the reason countless J-pop choruses use it. MidiSketch ships it as one of the 22 preset progressions.',
      ja: 'Cメジャーでは F → G → Em → Am になります。主和音に腰を下ろさないため前へ浮遊し続ける感覚があり、無数のJ-POPサビで使われる理由です。MidiSketchでは22種のプリセット進行の1つとして収録されています。',
    },
    time: '4/4',
    bars: 2,
    width: 640,
    upperClef: 'treble',
    upperLabel: { en: 'chords', ja: 'コード' },
    upper: [
      { key: 'f/4', keys: ['f/4', 'a/4', 'c/5'], duration: 'h', chordSymbol: 'F', annotation: 'IV' },
      { key: 'g/4', keys: ['g/4', 'b/4', 'd/5'], duration: 'h', chordSymbol: 'G', annotation: 'V' },
      { key: 'e/4', keys: ['e/4', 'g/4', 'b/4'], duration: 'h', chordSymbol: 'Em', annotation: 'iii' },
      { key: 'a/4', keys: ['a/4', 'c/5', 'e/5'], duration: 'h', chordSymbol: 'Am', annotation: 'vi' },
    ],
  },

  canonPop: {
    tags: ['chordProgressionId', 'I-V-vi-IV'],
    badge: { en: 'Four-chord pop', ja: '4コードポップ' },
    title: { en: 'The four-chord loop: I-V-vi-IV', ja: '4コードループ：I-V-vi-IV' },
    diagnosis: {
      en: 'Home, away, sad, hopeful — the most recycled loop in Western pop.',
      ja: '家→外→哀しみ→希望。洋楽ポップで最も再利用されているループです。',
    },
    caption: {
      en: 'C → G → Am → F. Hundreds of hit songs share this exact loop. It starts at home (I), wanders (V), darkens (vi), and brightens back (IV) — a complete emotional arc in four chords.',
      ja: 'C → G → Am → F。数百のヒット曲がこのループを共有しています。家（I）から出発し、さまよい（V）、暗くなり（vi）、再び明るくなる（IV）— 4つのコードで完結する感情のアークです。',
    },
    time: '4/4',
    bars: 2,
    width: 640,
    upperClef: 'treble',
    upperLabel: { en: 'chords', ja: 'コード' },
    upper: [
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], duration: 'h', chordSymbol: 'C', annotation: 'I' },
      { key: 'g/4', keys: ['g/4', 'b/4', 'd/5'], duration: 'h', chordSymbol: 'G', annotation: 'V' },
      { key: 'a/4', keys: ['a/4', 'c/5', 'e/5'], duration: 'h', chordSymbol: 'Am', annotation: 'vi' },
      { key: 'f/4', keys: ['f/4', 'a/4', 'c/5'], duration: 'h', chordSymbol: 'F', annotation: 'IV' },
    ],
  },

  cadenceVI: {
    tags: ['cadence', 'V-I'],
    badge: { en: 'Cadence', ja: 'カデンツ' },
    title: { en: 'V to I: the strongest resolution', ja: 'V→I：最も強い解決' },
    diagnosis: {
      en: 'The dominant (V) pulls toward home (I) — release the tension and the phrase ends.',
      ja: 'ドミナント（V）は主和音（I）へ引っ張ります。緊張を解放するとフレーズが終わります。',
    },
    caption: {
      en: 'G7 contains the unstable pair B-F (a tritone), which "wants" to collapse onto C-E. That pull-and-release, called a cadence, is how phrases signal "we have arrived". Listen for the relief on the final C chord.',
      ja: 'G7はB-Fという不安定なペア（トライトーン）を含み、C-Eへ「倒れ込みたがり」ます。この引っ張りと解放をカデンツと呼び、フレーズが「到着した」ことを示す合図になります。最後のCコードでの安堵感を聴いてみてください。',
    },
    time: '4/4',
    width: 460,
    upperClef: 'treble',
    upperLabel: { en: 'chords', ja: 'コード' },
    upper: [
      { key: 'g/4', keys: ['g/4', 'b/4', 'd/5', 'f/5'], duration: 'h', chordSymbol: 'G7', annotation: 'V7', color: AMBER },
      { key: 'e/4', keys: ['e/4', 'g/4', 'c/5'], duration: 'h', chordSymbol: 'C', annotation: 'I', color: GREEN },
    ],
    issues: [
      { kind: 'motion', label: 'tension → release', fromUpper: 0, toUpper: 1, color: GREEN },
    ],
  },

  tensionRelease: {
    tags: ['tension', 'resolution'],
    badge: { en: 'Tension curve', ja: '緊張カーブ' },
    title: { en: 'A full phrase: I-IV-V7-I', ja: '完全なフレーズ：I-IV-V7-I' },
    diagnosis: {
      en: 'Stable, lifting, tense, resolved: progressions are tension curves over time.',
      ja: '安定→浮上→緊張→解決。コード進行とは時間軸上の緊張カーブです。',
    },
    caption: {
      en: 'The classic full sentence of tonal harmony: start at home (I), move away (IV), peak the tension (V7), and resolve (I). Almost any progression you analyze decomposes into some walk along this stable-tense-resolved cycle.',
      ja: '調性和声の古典的な「完全文」：家から出発し（I）、離れ（IV）、緊張を頂点まで高め（V7）、解決する（I）。分析するとほぼすべての進行が、この安定—緊張—解決サイクルの上の歩みに分解できます。',
    },
    time: '4/4',
    bars: 2,
    width: 640,
    upperClef: 'treble',
    upperLabel: { en: 'chords', ja: 'コード' },
    upper: [
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], duration: 'h', chordSymbol: 'C', annotation: 'I' },
      { key: 'f/4', keys: ['f/4', 'a/4', 'c/5'], duration: 'h', chordSymbol: 'F', annotation: 'IV' },
      { key: 'g/4', keys: ['g/4', 'b/4', 'd/5', 'f/5'], duration: 'h', chordSymbol: 'G7', annotation: 'V7', color: AMBER },
      { key: 'e/4', keys: ['e/4', 'g/4', 'c/5'], duration: 'h', chordSymbol: 'C', annotation: 'I', color: GREEN },
    ],
  },

  loopVamp: {
    tags: ['loop', 'vamp'],
    badge: { en: 'Two-chord vamp', ja: '2コードバンプ' },
    title: { en: 'Progressions can be tiny: Am-F loop', ja: '進行は短くてもいい：Am-Fループ' },
    diagnosis: {
      en: 'Two alternating chords already make a mood — modern pop loves short loops.',
      ja: '2つのコードの往復だけでムードが生まれます。現代ポップは短いループを好みます。',
    },
    caption: {
      en: 'Not every song needs a long chord journey. A two-chord vamp (here Am ↔ F) creates a hypnotic, lo-fi atmosphere. Loop length is a stylistic choice: blueprints like BehavioralLoop intentionally exploit very short, repetitive loops.',
      ja: 'すべての曲に長いコードの旅が必要なわけではありません。2コードのバンプ（ここではAm↔F）は催眠的でローファイな空気を作ります。ループの長さはスタイルの選択であり、BehavioralLoopのようなブループリントは意図的に非常に短い反復ループを活用します。',
    },
    time: '4/4',
    bars: 2,
    width: 640,
    upperClef: 'treble',
    upperLabel: { en: 'chords', ja: 'コード' },
    upper: [
      { key: 'a/3', keys: ['a/3', 'c/4', 'e/4'], duration: 'h', chordSymbol: 'Am', annotation: 'vi' },
      { key: 'f/3', keys: ['f/3', 'a/3', 'c/4'], duration: 'h', chordSymbol: 'F', annotation: 'IV' },
      { key: 'a/3', keys: ['a/3', 'c/4', 'e/4'], duration: 'h', chordSymbol: 'Am', annotation: 'vi' },
      { key: 'f/3', keys: ['f/3', 'a/3', 'c/4'], duration: 'h', chordSymbol: 'F', annotation: 'IV' },
    ],
  },
}
