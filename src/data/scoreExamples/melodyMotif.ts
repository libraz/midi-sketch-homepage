import type { ScoreExampleDef } from './types'
import { AMBER, GREEN } from './types'

/** Chapter 5: Melody, Motifs & Hooks. */
export const melodyMotifExamples: Record<string, ScoreExampleDef> = {
  chordTones: {
    tags: ['chord tone'],
    badge: { en: 'Chord tones', ja: 'コードトーン' },
    title: { en: 'A melody made of chord tones only', ja: 'コードトーンだけのメロディ' },
    diagnosis: {
      en: 'Every melody note belongs to the underlying C chord — guaranteed consonance.',
      ja: 'メロディの全音が下のCコードに属しています。協和が保証された状態です。',
    },
    caption: {
      en: 'When the harmony is a C chord, the notes C, E, and G are "safe" — they belong to the chord and can never clash with it. MidiSketch\'s piano-roll safety API colors exactly these notes green.',
      ja: 'ハーモニーがCコードのとき、C・E・Gは「安全」な音です。コードに属しているため衝突しようがありません。MidiSketchのピアノロール安全性APIは、まさにこれらの音を緑で表示します。',
    },
    time: '4/4',
    width: 560,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'melody', ja: 'メロディ' },
    lowerLabel: { en: 'harmony', ja: 'ハーモニー' },
    upper: [
      { key: 'c/5', annotation: 'C', color: GREEN },
      { key: 'e/5', annotation: 'E', color: GREEN },
      { key: 'g/5', annotation: 'G', color: GREEN },
      { key: 'e/5', annotation: 'E', color: GREEN },
    ],
    lower: [
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], duration: 'w', chordSymbol: 'C' },
    ],
  },

  passingTones: {
    tags: ['passing tone', 'NCT'],
    badge: { en: 'Passing tones', ja: '経過音' },
    title: { en: 'Non-chord tones as connecting tissue', ja: 'コード外の音は接続組織' },
    diagnosis: {
      en: 'D and F are not in the C chord, but passing between chord tones makes them musical.',
      ja: 'DとFはCコードに含まれませんが、コードトーンの間を通過することで音楽的になります。',
    },
    caption: {
      en: 'Melodies that use only chord tones sound stiff. Notes outside the chord (here D and F) add motion — as long as they pass between stable notes on weak beats. Tension on the way, arrival on chord tones.',
      ja: 'コードトーンだけのメロディは硬く聞こえます。コード外の音（ここではDとF）は、弱拍で安定音の間を通過する限り、動きを与えてくれます。途中で緊張し、コードトーンに到着する、という流れです。',
    },
    time: '4/4',
    width: 560,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'melody', ja: 'メロディ' },
    lowerLabel: { en: 'harmony', ja: 'ハーモニー' },
    upper: [
      { key: 'c/5', duration: '8', color: GREEN },
      { key: 'd/5', duration: '8', annotation: 'passing', color: AMBER },
      { key: 'e/5', duration: '8', color: GREEN },
      { key: 'f/5', duration: '8', annotation: 'passing', color: AMBER },
      { key: 'g/5', duration: 'h', color: GREEN },
    ],
    lower: [
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], duration: 'w', chordSymbol: 'C' },
    ],
  },

  motifRepeat: {
    tags: ['motif', 'keepMotif'],
    badge: { en: 'Motif', ja: 'モチーフ' },
    title: { en: 'A motif and its sequence', ja: 'モチーフとその反復（ゼクエンツ）' },
    diagnosis: {
      en: 'The same four-note shape repeats one scale step higher — instantly memorable.',
      ja: '同じ4音の形が1音上で繰り返されます。これだけで一気に覚えやすくなります。',
    },
    caption: {
      en: 'A motif is a short melodic cell (often 2-8 notes) that a song reuses and transforms. The simplest transformation is the sequence: repeat the shape starting on a different degree. MidiSketch generates motif tracks and can lock them across regenerations with keepMotif.',
      ja: 'モチーフとは曲が再利用・変形する短い旋律の細胞（多くは2〜8音）です。最も単純な変形がゼクエンツ：同じ形を別の度数から繰り返すことです。MidiSketchはモチーフトラックを生成し、keepMotif で再生成をまたいで固定できます。',
    },
    time: '4/4',
    width: 560,
    upperClef: 'treble',
    upper: [
      { key: 'c/5', duration: '8' },
      { key: 'd/5', duration: '8' },
      { key: 'e/5', duration: '8' },
      { key: 'g/5', duration: '8' },
      { key: 'd/5', duration: '8' },
      { key: 'e/5', duration: '8' },
      { key: 'f/5', duration: '8' },
      { key: 'a/5', duration: '8' },
    ],
    issues: [
      { kind: 'bracket', label: 'motif', fromUpper: 0, toUpper: 3, color: GREEN },
      { kind: 'bracket', label: '+1 step', fromUpper: 4, toUpper: 7, color: AMBER },
    ],
  },

  hookPhrase: {
    tags: ['hookIntensity'],
    badge: { en: 'Hook', ja: 'フック' },
    title: { en: 'A chorus hook over two chords', ja: '2コードに乗るサビのフック' },
    diagnosis: {
      en: 'Short, rhythmic, repeated notes around one peak — the anatomy of a hook.',
      ja: '短く、リズミカルで、1つの頂点の周りで音を反復する — フックの解剖図です。',
    },
    caption: {
      en: 'A hook is the phrase listeners hum after one listen: compact range, punchy rhythm, lots of repetition. MidiSketch\'s hookIntensity (0-4) controls how aggressively the chorus repeats its hook material.',
      ja: 'フックとは一度聴いただけで口ずさめるフレーズのことです：狭い音域、歯切れの良いリズム、多くの反復。MidiSketchの hookIntensity（0〜4）は、サビがフック素材をどれだけ強く反復するかを制御します。',
    },
    time: '4/4',
    width: 560,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'hook', ja: 'フック' },
    lowerLabel: { en: 'chords', ja: 'コード' },
    upper: [
      { key: 'g/4', duration: 'q' },
      { key: 'g/4', duration: '8' },
      { key: 'a/4', duration: '8' },
      { key: 'g/4', duration: 'q' },
      { key: 'e/4', duration: 'q' },
    ],
    lower: [
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], duration: 'h', chordSymbol: 'C' },
      { key: 'g/3', keys: ['g/3', 'b/3', 'd/4'], duration: 'h', chordSymbol: 'G' },
    ],
    issues: [
      { kind: 'bracket', label: 'hook', fromUpper: 0, toUpper: 4, color: GREEN },
    ],
  },

  callResponse: {
    tags: ['callSetting', 'CallResponse'],
    badge: { en: 'Call & response', ja: 'コール＆レスポンス' },
    title: { en: 'A call phrase and its answer', ja: '問いかけと応答のフレーズ' },
    diagnosis: {
      en: 'The rising "question" is answered by a falling phrase that lands at home.',
      ja: '上昇する「問い」に、下降して着地する「答え」が応じます。',
    },
    caption: {
      en: 'Phrases often pair up: a call (rising, open-ended) and a response (falling, conclusive). The same idea powers idol-music crowd calls — MidiSketch\'s call system (callSetting) inserts response shouts, and the CallResponse melody template builds duet-style phrasing.',
      ja: 'フレーズはしばしばペアになります：コール（上昇して問いかける）とレスポンス（下降して締めくくる）。アイドル曲の観客コールも同じ発想です。MidiSketchのコールシステム（callSetting）は合いの手を挿入し、CallResponseメロディテンプレートはデュエット風のフレージングを作ります。',
    },
    time: '4/4',
    width: 520,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'call', ja: 'コール' },
    lowerLabel: { en: 'response', ja: 'レスポンス' },
    upper: [
      { key: 'c/5', duration: 'q' },
      { key: 'e/5', duration: 'q' },
      { key: 'g/5', duration: 'h' },
    ],
    lower: [
      { key: 'e/5', duration: 'q' },
      { key: 'd/5', duration: 'q' },
      { key: 'c/5', duration: 'h' },
    ],
    playback: 'sequential',
  },

  hookIntensityCompare: {
    tags: ['hookIntensity'],
    badge: { en: 'Hook intensity', ja: 'フック強度' },
    title: { en: 'Sparse melody versus maximum repetition', ja: '疎なメロディと最大反復' },
    diagnosis: {
      en: 'hookIntensity 0 flows freely; 4 (Maximum) hammers one cell relentlessly.',
      ja: 'hookIntensity 0は自由に流れ、4（Maximum）は1つの細胞を執拗に叩き込みます。',
    },
    caption: {
      en: 'The same harmony can carry a long, lyrical line (hookIntensity 0) or a tight loop that repeats almost to the point of obsession (hookIntensity 4, used by the BehavioralLoop blueprint). Repetition is a dial, not a yes/no.',
      ja: '同じハーモニーの上でも、長く叙情的なライン（hookIntensity 0）にも、執着に近いほど反復するタイトなループ（hookIntensity 4、BehavioralLoopブループリントが使用）にもなります。反復はオン/オフではなく、つまみです。',
    },
    time: '4/4',
    width: 560,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'hookIntensity 0', ja: 'hookIntensity 0' },
    lowerLabel: { en: 'hookIntensity 4', ja: 'hookIntensity 4' },
    upper: [
      { key: 'e/5', duration: 'h' },
      { key: 'd/5', duration: 'q' },
      { key: 'c/5', duration: 'q' },
    ],
    lower: [
      { key: 'g/4', duration: '8' },
      { key: 'g/4', duration: '8' },
      { key: 'a/4', duration: '8' },
      { key: 'g/4', duration: '8' },
      { key: 'g/4', duration: '8' },
      { key: 'g/4', duration: '8' },
      { key: 'a/4', duration: '8' },
      { key: 'g/4', duration: '8' },
    ],
    playback: 'sequential',
  },
}
