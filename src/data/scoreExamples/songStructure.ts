import type { ScoreExampleDef } from './types'
import { AMBER, GREEN } from './types'

/** Chapter 6: Song Structure. */
export const songStructureExamples: Record<string, ScoreExampleDef> = {
  aMeloVerse: {
    tags: ['formId', 'Verse (A)'],
    badge: { en: 'A-melo / Verse', ja: 'Aメロ' },
    title: { en: 'A calm verse phrase', ja: '落ち着いたAメロのフレーズ' },
    diagnosis: {
      en: 'Narrow range, gentle rhythm, low register: the verse sets the scene.',
      ja: '狭い音域、穏やかなリズム、低めの音域。Aメロは物語の場面を整えます。',
    },
    caption: {
      en: 'The verse (Japanese: A-melo) introduces the story. Melodies here stay low and conversational, leaving headroom so the chorus can soar later. Notice the small steps and relaxed rhythm.',
      ja: 'Aメロ（英語では verse）は物語の導入部です。ここでのメロディは低めで語りかけるように進み、後でサビが舞い上がるための余白を残します。小さな音程の動きとゆったりしたリズムに注目してください。',
    },
    time: '4/4',
    bars: 2,
    width: 640,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'melody', ja: 'メロディ' },
    lowerLabel: { en: 'chords', ja: 'コード' },
    upper: [
      { key: 'e/4', duration: 'q' },
      { key: 'g/4', duration: 'q' },
      { key: 'a/4', duration: 'h' },
      { key: 'g/4', duration: 'q' },
      { key: 'e/4', duration: 'q' },
      { key: 'd/4', duration: 'h' },
    ],
    lower: [
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], duration: 'w', chordSymbol: 'C' },
      { key: 'g/3', keys: ['g/3', 'b/3', 'd/4'], duration: 'w', chordSymbol: 'G' },
    ],
  },

  bMeloBuild: {
    tags: ['Bridge (B)', 'pre-chorus'],
    badge: { en: 'B-melo / Pre-chorus', ja: 'Bメロ' },
    title: { en: 'The rising pre-chorus build', ja: '上昇していくBメロのビルド' },
    diagnosis: {
      en: 'A stepwise climb plus the V chord stacks tension right before the chorus.',
      ja: '段階的な上昇とVコードが、サビ直前に緊張を積み上げます。',
    },
    caption: {
      en: 'The pre-chorus (Japanese: B-melo) is a ramp: the melody climbs, harmony leans on the dominant, and everything says "the chorus is coming". The unresolved ending on V is intentional — the chorus itself provides the release.',
      ja: 'Bメロ（pre-chorus）は助走路です。メロディは上昇し、ハーモニーはドミナントに寄りかかり、すべてが「サビが来るぞ」と告げます。Vで解決せずに終わるのは意図的で、解放はサビ自体が担います。',
    },
    time: '4/4',
    bars: 2,
    width: 640,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'melody', ja: 'メロディ' },
    lowerLabel: { en: 'chords', ja: 'コード' },
    upper: [
      { key: 'g/4', duration: 'q' },
      { key: 'a/4', duration: 'q' },
      { key: 'b/4', duration: 'q' },
      { key: 'c/5', duration: 'q' },
      { key: 'd/5', duration: 'h' },
      { key: 'b/4', duration: 'h', color: AMBER },
    ],
    lower: [
      { key: 'f/3', keys: ['f/3', 'a/3', 'c/4'], duration: 'w', chordSymbol: 'F' },
      { key: 'g/3', keys: ['g/3', 'b/3', 'd/4'], duration: 'w', chordSymbol: 'G' },
    ],
    issues: [
      { kind: 'bracket', label: 'build', fromUpper: 0, toUpper: 4, color: AMBER },
    ],
  },

  sabiChorus: {
    tags: ['Chorus (Sabi)', 'hookIntensity'],
    badge: { en: 'Sabi / Chorus', ja: 'サビ' },
    title: { en: 'The chorus: high, loud, and hooky', ja: 'サビ：高く、大きく、フックで' },
    diagnosis: {
      en: 'The melody peaks at the top of the vocal range and repeats its hook.',
      ja: 'メロディはボーカル音域の頂点に達し、フックを反復します。',
    },
    caption: {
      en: 'The chorus (Japanese: sabi) is the emotional payoff: highest register, biggest energy, most repetition. Compare this phrase\'s register with the verse example — that contrast is what makes a chorus feel like a chorus.',
      ja: 'サビ（chorus）は感情の報酬です：最も高い音域、最大のエネルギー、最多の反復。このフレーズの音域をAメロの譜例と比べてください。そのコントラストこそが、サビをサビたらしめるものです。',
    },
    time: '4/4',
    bars: 2,
    width: 640,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'melody', ja: 'メロディ' },
    lowerLabel: { en: 'chords', ja: 'コード' },
    upper: [
      { key: 'c/5', duration: 'q' },
      { key: 'c/5', duration: '8' },
      { key: 'b/4', duration: '8' },
      { key: 'g/4', duration: 'q' },
      { key: 'a/4', duration: 'q' },
      { key: 'c/5', duration: 'q' },
      { key: 'd/5', duration: 'q' },
      { key: 'e/5', duration: 'h', color: GREEN },
    ],
    lower: [
      { key: 'f/4', keys: ['f/4', 'a/4', 'c/5'], duration: 'h', chordSymbol: 'F' },
      { key: 'g/4', keys: ['g/4', 'b/4', 'd/5'], duration: 'h', chordSymbol: 'G' },
      { key: 'e/4', keys: ['e/4', 'g/4', 'b/4'], duration: 'h', chordSymbol: 'Em' },
      { key: 'a/4', keys: ['a/4', 'c/5', 'e/5'], duration: 'h', chordSymbol: 'Am' },
    ],
  },

  introOutro: {
    tags: ['Intro', 'Outro'],
    badge: { en: 'Intro / Outro', ja: 'イントロ / アウトロ' },
    title: { en: 'An intro motif and its outro echo', ja: 'イントロのモチーフとアウトロの残響' },
    diagnosis: {
      en: 'The same material opens the song and, slowed to a close, ends it.',
      ja: '同じ素材が曲を開き、終止形へ落ち着いてアウトロで曲を閉じます。',
    },
    caption: {
      en: 'Intros establish key, tempo, and motif before the vocal enters; outros often quote the same material and let it settle. Reusing material at both ends frames the song like bookends.',
      ja: 'イントロはボーカルが入る前にキー・テンポ・モチーフを提示し、アウトロはしばしば同じ素材を引用して落ち着かせます。両端で素材を再利用することで、曲がブックエンドのように額装されます。',
    },
    time: '4/4',
    width: 520,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'intro', ja: 'イントロ' },
    lowerLabel: { en: 'outro', ja: 'アウトロ' },
    upper: [
      { key: 'e/5', duration: 'q' },
      { key: 'd/5', duration: 'q' },
      { key: 'c/5', duration: 'q' },
      { key: 'g/4', duration: 'q' },
    ],
    lower: [
      { key: 'e/5', duration: 'q' },
      { key: 'd/5', duration: 'q' },
      { key: 'c/5', duration: 'h' },
    ],
    playback: 'sequential',
  },

  fullFormMap: {
    tags: ['formId', 'StructurePattern'],
    badge: { en: 'Song form', ja: '楽曲フォーム' },
    title: { en: 'A schematic walk through one song form', ja: '楽曲フォームの模式図' },
    diagnosis: {
      en: 'Intro → A → B → Sabi → Outro: sections are reusable building blocks.',
      ja: 'イントロ→A→B→サビ→アウトロ。セクションは再利用可能な部品です。',
    },
    caption: {
      en: 'This is a schematic, not a melody: each long note stands for one section, placed at the register that section typically occupies. MidiSketch ships 18 structure presets (formId 0-17) that assemble sections like these into full songs.',
      ja: 'これはメロディではなく模式図です。長い音符1つが1セクションを表し、そのセクションが典型的に使う音域の高さに置いています。MidiSketchには18種類の構成プリセット（formId 0〜17）があり、こうしたセクションを組み上げて完全な楽曲にします。',
    },
    time: '4/4',
    bars: 5,
    width: 760,
    upperClef: 'treble',
    upperLabel: { en: 'sections', ja: 'セクション' },
    upper: [
      { key: 'g/4', duration: 'w', annotation: 'Intro' },
      { key: 'e/4', duration: 'w', annotation: 'A (verse)' },
      { key: 'b/4', duration: 'w', annotation: 'B (build)', color: AMBER },
      { key: 'e/5', duration: 'w', annotation: 'Sabi (chorus)', color: GREEN },
      { key: 'c/5', duration: 'w', annotation: 'Outro' },
    ],
  },

  modulationLift: {
    tags: ['modulationTiming', 'modulationSemitones'],
    badge: { en: 'Key change', ja: '転調' },
    title: { en: 'The final-chorus lift: same loop, up +2', ja: '最後のサビの転調：同じループを+2' },
    diagnosis: {
      en: 'The last chorus repeats a whole step higher (+2 semitones) — identical shapes, fresh lift.',
      ja: '最後のサビが全音上（+2半音）で繰り返されます。形は同じ、高揚感だけ新しい。',
    },
    caption: {
      en: 'A late, upward key change reinjects energy without new material: the F-G-Em-Am chorus loop (in C) simply repeats up a whole step in D as G-A-F♯m-Bm. The function is unchanged — only the absolute pitch rises, which the ear hears as a surge. MidiSketch automates this via modulationTiming (LastChorus is the classic choice) and modulationSemitones (+1 to +4).',
      ja: '終盤の上方転調は、新しい素材なしにエネルギーを注ぎ直します。F-G-Em-Am のサビループ（C）が、全音上のDで G-A-F♯m-Bm として繰り返されるだけです。機能は変わらず絶対音高だけが上がり、耳には高揚として届きます。MidiSketchは modulationTiming（定番は LastChorus）と modulationSemitones（+1〜+4）で自動化します。',
    },
    time: '4/4',
    bars: 2,
    width: 640,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'last chorus (C)', ja: '最後のサビ（C）' },
    lowerLabel: { en: 'repeat, up +2 (D)', ja: '繰り返し、+2（D）' },
    upper: [
      { key: 'f/4', keys: ['f/4', 'a/4', 'c/5'], duration: 'h', chordSymbol: 'F' },
      { key: 'g/4', keys: ['g/4', 'b/4', 'd/5'], duration: 'h', chordSymbol: 'G' },
      { key: 'e/4', keys: ['e/4', 'g/4', 'b/4'], duration: 'h', chordSymbol: 'Em' },
      { key: 'a/4', keys: ['a/4', 'c/5', 'e/5'], duration: 'h', chordSymbol: 'Am' },
    ],
    lower: [
      { key: 'g/4', keys: ['g/4', 'b/4', 'd/5'], duration: 'h', chordSymbol: 'G', color: AMBER },
      { key: 'a/4', keys: ['a/4', 'c#/5', 'e/5'], accidentals: [null, '#', null], duration: 'h', chordSymbol: 'A', color: AMBER },
      { key: 'f#/4', keys: ['f#/4', 'a/4', 'c#/5'], accidentals: ['#', null, '#'], duration: 'h', chordSymbol: 'F♯m', color: AMBER },
      { key: 'b/4', keys: ['b/4', 'd/5', 'f#/5'], accidentals: [null, null, '#'], duration: 'h', chordSymbol: 'Bm', color: AMBER },
    ],
    playback: 'sequential',
  },
}
