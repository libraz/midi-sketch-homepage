import type { ScoreExampleDef } from './types'
import { AMBER, GREEN } from './types'

/** Chapter 4: Harmony & Color (extensions). */
export const harmonyColorExamples: Record<string, ScoreExampleDef> = {
  sus4Resolve: {
    tags: ['chordExtSus', 'chordExtSusProb'],
    badge: { en: 'Sus chord', ja: 'susコード' },
    title: { en: 'Csus4 resolving to C', ja: 'Csus4からCへの解決' },
    diagnosis: {
      en: 'The suspended 4th (F) hangs unresolved, then steps down to the 3rd (E).',
      ja: '吊り上げられた4度（F）が宙づりのまま響き、3度（E）へ下がって解決します。',
    },
    caption: {
      en: 'A sus4 chord replaces the third with the fourth: C-F-G instead of C-E-G. The missing third makes it feel "held in the air"; resolving F down to E releases it. MidiSketch sprinkles these via chordExtSus with probability chordExtSusProb (default 0.2).',
      ja: 'sus4コードは3度を4度に置き換えます：C-E-Gの代わりにC-F-G。3度が無いため「宙に浮いた」感じになり、FがEへ下がると解放されます。MidiSketchは chordExtSus を有効にすると確率 chordExtSusProb（デフォルト0.2）でこれを散りばめます。',
    },
    time: '4/4',
    width: 460,
    upperClef: 'treble',
    upper: [
      { key: 'c/4', keys: ['c/4', 'f/4', 'g/4'], duration: 'h', chordSymbol: 'Csus4', annotation: 'sus4', color: AMBER },
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], duration: 'h', chordSymbol: 'C', annotation: 'resolved', color: GREEN },
    ],
    issues: [
      { kind: 'motion', label: '4th → 3rd', fromUpper: 0, toUpper: 1, color: GREEN },
    ],
  },

  seventhChords: {
    tags: ['chordExt7th', 'chordExt7thProb'],
    badge: { en: '7th chords', ja: '7thコード' },
    title: { en: 'Adding the seventh: maj7, dom7, m7', ja: '7度を足す：maj7・ドミナント7th・m7' },
    diagnosis: {
      en: 'A fourth note one third higher adds sophistication: dreamy, bluesy, or mellow.',
      ja: 'さらに3度上の4音目を足すと洗練が加わります：夢見がち、ブルージー、まろやか。',
    },
    caption: {
      en: 'Stack one more third on a triad and you get a seventh chord. Cmaj7 (C-E-G-B) sounds dreamy and urban; C7 (C-E-G-B♭) sounds bluesy and wants to move; Am7 (A-C-E-G) sounds soft and mellow. chordExt7th enables these (probability 0.15 by default).',
      ja: 'トライアドにもう1つ3度を積むと7thコードになります。Cmaj7（C-E-G-B）は夢見がちで都会的、C7（C-E-G-B♭）はブルージーで先へ進みたがり、Am7（A-C-E-G）は柔らかくまろやかです。chordExt7th で有効化できます（確率はデフォルト0.15）。',
    },
    time: '4/4',
    width: 560,
    upperClef: 'treble',
    upper: [
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4', 'b/4'], duration: 'h', chordSymbol: 'Cmaj7' },
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4', 'bb/4'], accidentals: [null, null, null, 'b'], duration: 'q', chordSymbol: 'C7' },
      { key: 'a/3', keys: ['a/3', 'c/4', 'e/4', 'g/4'], duration: 'q', chordSymbol: 'Am7' },
    ],
  },

  ninthChord: {
    tags: ['chordExt9th', 'chordExt9thProb'],
    badge: { en: '9th chords', ja: '9thコード' },
    title: { en: 'Plain C versus Cadd9', ja: '素のCとCadd9' },
    diagnosis: {
      en: 'The added 9th (D) thickens the chord with a bright shimmer.',
      ja: '加えられた9度（D）がコードを厚くし、明るいきらめきを足します。',
    },
    caption: {
      en: 'Add the second-octave degree 2 (the "9th") to a triad and the chord gets denser and more modern-sounding. Compare plain C with Cadd9 (C-E-G-D). chordExt9th controls this color (default probability 0.25).',
      ja: 'トライアドに1オクターブ上の第2音（9th）を加えると、コードはより厚く、現代的な響きになります。素のCとCadd9（C-E-G-D）を聴き比べてください。chordExt9th がこの色付けを制御します（デフォルト確率0.25）。',
    },
    time: '4/4',
    width: 460,
    upperClef: 'treble',
    upper: [
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], duration: 'h', chordSymbol: 'C', annotation: 'triad' },
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4', 'd/5'], duration: 'h', chordSymbol: 'Cadd9', annotation: '+9th' },
    ],
  },

  secondaryDominant: {
    tags: ['secondary dominant'],
    badge: { en: 'Secondary dominant', ja: 'セカンダリードミナント' },
    title: { en: 'IV → V → I versus IV → V/V → V → I', ja: 'IV→V→I と IV→V/V→V→I' },
    diagnosis: {
      en: 'Inserting D7 before G aims a dominant pull at G itself — the F♯ makes G a temporary target.',
      ja: 'Gの前にD7を挿入すると、ドミナントの引力がGそのものに向きます。F♯がGを一時的なターゲットにします。',
    },
    caption: {
      en: 'D7 is the dominant 7th of G, so D7 "wants" to land on G exactly the way G7 wants to land on C. The borrowed F♯ — a note from outside C major — is what creates that temporary pull. MidiSketch inserts secondary dominants automatically based on section type and style; there is no config flag.',
      ja: 'D7はGのドミナント7thなので、G7がCに着地したがるのとまったく同じように、D7はGに着地したがります。借りてきたF♯ — Cメジャーの外の音 — がその一時的な引力を生み出します。MidiSketchはセクションタイプとスタイルに基づいてセカンダリードミナントを自動挿入します。設定フラグはありません。',
    },
    time: '4/4',
    bars: 2,
    width: 640,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'IV → V → I', ja: 'IV → V → I' },
    lowerLabel: { en: 'IV → V/V → V → I', ja: 'IV → V/V → V → I' },
    upper: [
      { key: 'f/4', keys: ['f/4', 'a/4', 'c/5'], duration: 'h', chordSymbol: 'F', annotation: 'IV' },
      { key: 'g/4', keys: ['g/4', 'b/4', 'd/5'], duration: 'h', chordSymbol: 'G', annotation: 'V' },
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], duration: 'w', chordSymbol: 'C', annotation: 'I', color: GREEN },
    ],
    lower: [
      { key: 'f/4', keys: ['f/4', 'a/4', 'c/5'], duration: 'h', chordSymbol: 'F', annotation: 'IV' },
      { key: 'd/4', keys: ['d/4', 'f#/4', 'a/4', 'c/5'], accidentals: [null, '#', null, null], duration: 'h', chordSymbol: 'D7', annotation: 'V/V', color: AMBER },
      { key: 'g/4', keys: ['g/4', 'b/4', 'd/5'], duration: 'h', chordSymbol: 'G', annotation: 'V' },
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], duration: 'h', chordSymbol: 'C', annotation: 'I', color: GREEN },
    ],
    issues: [
      { kind: 'motion', label: 'D7 → G', fromLower: 1, toLower: 2, color: GREEN },
    ],
    playback: 'sequential',
  },

  secondaryDominantVi: {
    tags: ['secondary dominant', 'V/vi'],
    badge: { en: 'V/vi (E7→Am)', ja: 'V/vi（E7→Am）' },
    title: { en: 'IV → V → vi versus IV → V/vi → vi', ja: 'IV→V→vi と IV→V/vi→vi' },
    diagnosis: {
      en: 'Swapping the diatonic V for E7 aims a dominant pull straight at Am — the borrowed G♯ makes Am a temporary tonic.',
      ja: 'ダイアトニックのVをE7に差し替えると、ドミナントの引力がAmそのものに向きます。借りてきたG♯がAmを一時的なトニックにします。',
    },
    caption: {
      en: 'E7 is the dominant 7th of Am, so it "wants" to land on Am exactly the way G7 wants C. The borrowed G♯ — a note from outside C major — creates that pull. V/vi (E7 → Am) is the most common secondary dominant in J-pop, recoloring the move into the relative-minor chord. MidiSketch inserts it automatically based on section tension; there is no config flag.',
      ja: 'E7はAmのドミナント7thなので、G7がCに着地したがるのとまったく同じように、Amに着地したがります。借りてきたG♯ — Cメジャーの外の音 — がその引力を生み出します。V/vi（E7→Am）はJ-POPで最もよく使われるセカンダリードミナントで、平行短調のコードへの動きを彩り直します。MidiSketchはセクションtensionに基づいて自動挿入します。設定フラグはありません。',
    },
    time: '4/4',
    bars: 2,
    width: 640,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'IV → V → vi', ja: 'IV → V → vi' },
    lowerLabel: { en: 'IV → V/vi → vi', ja: 'IV → V/vi → vi' },
    upper: [
      { key: 'f/4', keys: ['f/4', 'a/4', 'c/5'], duration: 'h', chordSymbol: 'F', annotation: 'IV' },
      { key: 'g/4', keys: ['g/4', 'b/4', 'd/5'], duration: 'h', chordSymbol: 'G', annotation: 'V' },
      { key: 'a/4', keys: ['a/4', 'c/5', 'e/5'], duration: 'w', chordSymbol: 'Am', annotation: 'vi', color: GREEN },
    ],
    lower: [
      { key: 'f/4', keys: ['f/4', 'a/4', 'c/5'], duration: 'h', chordSymbol: 'F', annotation: 'IV' },
      { key: 'e/4', keys: ['e/4', 'g#/4', 'b/4', 'd/5'], accidentals: [null, '#', null, null], duration: 'h', chordSymbol: 'E7', annotation: 'V/vi', color: AMBER },
      { key: 'a/4', keys: ['a/4', 'c/5', 'e/5'], duration: 'w', chordSymbol: 'Am', annotation: 'vi', color: GREEN },
    ],
    issues: [
      { kind: 'motion', label: 'E7 → Am', fromLower: 1, toLower: 2, color: GREEN },
    ],
    playback: 'sequential',
  },

  tritoneInterval: {
    tags: ['tritone'],
    badge: { en: 'Tritone', ja: 'トライトーン' },
    title: { en: 'The tritone: six semitones of unrest', ja: 'トライトーン：6半音の不安定さ' },
    diagnosis: {
      en: 'F-B splits the octave exactly in half — maximally ambiguous, maximally tense.',
      ja: 'F-Bはオクターブをちょうど半分に割ります。最大に曖昧で、最大に緊張します。',
    },
    caption: {
      en: 'The interval of six semitones (here F against B) divides the 12-step octave exactly in half. It sounds restless and wants to resolve inward or outward. This interval powers the pull of every dominant 7th chord — and the substitution trick on the next example.',
      ja: '6半音の音程（ここではFとB）は12ステップのオクターブをちょうど半分に分割します。落ち着かず、内側か外側へ解決したがります。この音程こそ、すべてのドミナント7thコードの引力の源であり、次の譜例の代理テクニックの鍵です。',
    },
    time: '4/4',
    width: 420,
    upperClef: 'treble',
    upper: [
      { key: 'f/4', keys: ['f/4', 'b/4'], duration: 'w', annotation: 'tritone (6 semitones)', color: AMBER },
    ],
  },

  tritoneSub: {
    tags: ['chordExtTritoneSub', 'chordExtTritoneSubProb'],
    badge: { en: 'Tritone substitution', ja: 'トライトーン代理' },
    title: { en: 'V7 → I versus ♭II7 → I', ja: 'V7→I と ♭II7→I' },
    diagnosis: {
      en: 'D♭7 shares the same tritone as G7, so it can resolve to C the same way — with a chromatic bass slide.',
      ja: 'D♭7はG7と同じトライトーンを含むため、同じようにCへ解決できます。ベースは半音で滑り込みます。',
    },
    caption: {
      en: 'G7 and D♭7 both contain the F-B tritone (spelled F-C♭ in D♭7). Swap one for the other and the resolution still works, but the bass now slides D♭ → C by a half step. This jazz-flavored move is the tritone substitution: chordExtTritoneSub (probability 0.5 when enabled).',
      ja: 'G7とD♭7はどちらもF-Bのトライトーンを含みます（D♭7ではF-C♭と綴ります）。入れ替えても解決は機能し、ベースはD♭→Cへ半音で滑ります。このジャズ風の動きがトライトーン代理です：chordExtTritoneSub（有効時の確率0.5）。',
    },
    time: '4/4',
    width: 560,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'V7 → I', ja: 'V7 → I' },
    lowerLabel: { en: '♭II7 → I (sub)', ja: '♭II7 → I（代理）' },
    upper: [
      { key: 'g/4', keys: ['g/4', 'b/4', 'd/5', 'f/5'], duration: 'h', chordSymbol: 'G7' },
      { key: 'e/4', keys: ['e/4', 'g/4', 'c/5'], duration: 'h', chordSymbol: 'C', color: GREEN },
    ],
    lower: [
      { key: 'db/4', keys: ['db/4', 'f/4', 'ab/4', 'b/4'], accidentals: ['b', null, 'b', null], duration: 'h', chordSymbol: 'D♭7', color: AMBER },
      { key: 'e/4', keys: ['e/4', 'g/4', 'c/5'], duration: 'h', chordSymbol: 'C', color: GREEN },
    ],
    playback: 'sequential',
  },

  extensionProb: {
    tags: ['chordExtProbExplicit'],
    badge: { en: 'Color amount', ja: '色付けの量' },
    title: { en: 'The same progression, plain and extended', ja: '同じ進行を素のまま・拡張して' },
    diagnosis: {
      en: 'Extensions are a probability dial: 0.0 keeps triads, higher values add color notes.',
      ja: 'エクステンションは確率のつまみです。0.0ならトライアドのまま、上げるほど色音が加わります。',
    },
    caption: {
      en: 'Hear I-IV-V-I twice: first as bare triads, then with sevenths and ninths sprinkled in. In MidiSketch each extension type has its own probability (sus 0.2, 7th 0.15, 9th 0.25 by default); moods auto-adjust them unless chordExtProbExplicit is set.',
      ja: 'I-IV-V-Iを2回聴いてください。最初は素のトライアド、次は7thや9thを散りばめた版です。MidiSketchではエクステンションごとに確率があり（デフォルト：sus 0.2、7th 0.15、9th 0.25）、chordExtProbExplicit を立てない限りムードが自動調整します。',
    },
    time: '4/4',
    bars: 2,
    width: 640,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'plain triads', ja: '素のトライアド' },
    lowerLabel: { en: 'with extensions', ja: 'エクステンション入り' },
    upper: [
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], duration: 'h', chordSymbol: 'C' },
      { key: 'f/4', keys: ['f/4', 'a/4', 'c/5'], duration: 'h', chordSymbol: 'F' },
      { key: 'g/4', keys: ['g/4', 'b/4', 'd/5'], duration: 'h', chordSymbol: 'G' },
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4'], duration: 'h', chordSymbol: 'C' },
    ],
    lower: [
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4', 'b/4'], duration: 'h', chordSymbol: 'Cmaj7' },
      { key: 'f/4', keys: ['f/4', 'a/4', 'c/5', 'e/5'], duration: 'h', chordSymbol: 'Fmaj7' },
      { key: 'g/4', keys: ['g/4', 'b/4', 'd/5', 'f/5'], duration: 'h', chordSymbol: 'G7' },
      { key: 'c/4', keys: ['c/4', 'e/4', 'g/4', 'd/5'], duration: 'h', chordSymbol: 'Cadd9' },
    ],
    playback: 'sequential',
  },
}
