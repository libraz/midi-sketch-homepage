import type { ScoreExampleDef } from './types'

/** Chapter 0: Music Primer for Engineers. */
export const primerExamples: Record<string, ScoreExampleDef> = {
  chromatic12: {
    tags: ['MIDI note', 'mod 12'],
    badge: { en: 'Pitch system', ja: '音高の仕組み' },
    title: { en: 'The 12 semitones from C to B', ja: 'CからBまでの12半音' },
    diagnosis: {
      en: 'Twelve equal steps fill one octave; pitch class = MIDI note mod 12.',
      ja: '1オクターブは等間隔の12ステップ。ピッチクラス = MIDIノート番号 mod 12。',
    },
    caption: {
      en: 'Every pitch in pop music comes from this 12-step grid. MIDI numbers them: C4 is 60, C#4 is 61, and so on up to B4 = 71. After 12 steps the names repeat one octave higher.',
      ja: 'ポップスのあらゆる音はこの12ステップのグリッドから生まれます。MIDIでは番号で表し、C4=60、C#4=61、…、B4=71。12ステップ進むと同じ音名が1オクターブ上で繰り返されます。',
    },
    time: '3/4',
    bars: 2,
    width: 680,
    upperClef: 'treble',
    upperLabel: { en: 'chromatic', ja: '半音階' },
    upper: [
      { key: 'c/4', duration: '8', annotation: '60' },
      { key: 'c#/4', duration: '8', accidental: '#' },
      { key: 'd/4', duration: '8' },
      { key: 'd#/4', duration: '8', accidental: '#' },
      { key: 'e/4', duration: '8' },
      { key: 'f/4', duration: '8', annotation: '65' },
      { key: 'f#/4', duration: '8', accidental: '#' },
      { key: 'g/4', duration: '8' },
      { key: 'g#/4', duration: '8', accidental: '#' },
      { key: 'a/4', duration: '8' },
      { key: 'a#/4', duration: '8', accidental: '#' },
      { key: 'b/4', duration: '8', annotation: '71' },
    ],
  },

  octaveDouble: {
    tags: ['octave', '+12'],
    badge: { en: 'Octave', ja: 'オクターブ' },
    title: { en: 'Same name, one octave apart', ja: '同じ音名、1オクターブの差' },
    diagnosis: {
      en: 'C4 (60) and C5 (72): same pitch class, +12 in MIDI.',
      ja: 'C4（60）とC5（72）：同じピッチクラスで、MIDIでは+12。',
    },
    caption: {
      en: 'Notes 12 semitones apart sound "the same but higher". That is an octave. In MIDI it is simply +12: C4 = 60, C5 = 72. This is why pitch class works as mod 12.',
      ja: '12半音離れた音は「同じだけど高い」ように聞こえます。これがオクターブです。MIDIでは単に+12：C4=60、C5=72。ピッチクラスが mod 12 で扱える理由です。',
    },
    time: '4/4',
    width: 420,
    upperClef: 'treble',
    upper: [
      { key: 'c/4', duration: 'h', annotation: 'C4 = 60' },
      { key: 'c/5', duration: 'h', annotation: 'C5 = 72' },
    ],
  },

  beatGrid: {
    tags: ['beat', 'bar'],
    badge: { en: 'Beat', ja: '拍' },
    title: { en: 'Four beats in a 4/4 bar', ja: '4/4の1小節は4拍' },
    diagnosis: {
      en: 'Each quarter note is one beat; four beats fill one bar.',
      ja: '四分音符1つが1拍。4拍で1小節になります。',
    },
    caption: {
      en: 'The beat is the steady pulse you tap your foot to. A 4/4 time signature means each bar holds four quarter-note beats — the default grid for nearly all pop music. MIDI Sketch uses 480 ticks per quarter note.',
      ja: '拍は足でタップする一定のパルスです。拍子記号4/4は、1小節に四分音符4拍が入ることを意味し、ほぼすべてのポップスの基本グリッドです。MIDI Sketchでは四分音符=480ティックです。',
    },
    time: '4/4',
    width: 460,
    upperClef: 'treble',
    upperLabel: { en: 'pulse', ja: 'パルス' },
    upper: [
      { key: 'g/4', annotation: '1' },
      { key: 'g/4', annotation: '2' },
      { key: 'g/4', annotation: '3' },
      { key: 'g/4', annotation: '4' },
    ],
  },

  bpmCompare: {
    tags: ['bpm'],
    badge: { en: 'Tempo', ja: 'テンポ' },
    title: { en: 'Same notes, different speed', ja: '同じ音、違う速さ' },
    diagnosis: {
      en: 'BPM only changes how fast the grid scrolls — the notes stay the same.',
      ja: 'BPMはグリッドが流れる速さだけを変えます。音そのものは同じです。',
    },
    caption: {
      en: 'BPM (beats per minute) is the playback speed of the beat grid. Here the same four-note phrase is written in quarter notes, then in eighth notes — the second one sounds like the same melody at double BPM. MIDI Sketch accepts BPM 40-240.',
      ja: 'BPM（beats per minute）は拍グリッドの再生速度です。ここでは同じ4音フレーズを四分音符と八分音符で書いています。後者は同じメロディをBPM2倍で再生したように聞こえます。MIDI SketchのBPMは40〜240です。',
    },
    time: '4/4',
    width: 520,
    upperClef: 'treble',
    lowerClef: 'treble',
    upperLabel: { en: 'slow (quarters)', ja: '遅い（四分）' },
    lowerLabel: { en: 'fast (eighths)', ja: '速い（八分）' },
    upper: [
      { key: 'c/4' },
      { key: 'd/4' },
      { key: 'e/4' },
      { key: 'g/4' },
    ],
    lower: [
      { key: 'c/4', duration: '8' },
      { key: 'd/4', duration: '8' },
      { key: 'e/4', duration: '8' },
      { key: 'g/4', duration: '8' },
      { key: 'b/4', duration: 'h', rest: true },
    ],
    playback: 'sequential',
  },

  midiRange: {
    tags: ['vocalLow', 'vocalHigh'],
    badge: { en: 'Range', ja: '音域' },
    title: { en: 'The default vocal range: C4 to G5', ja: 'デフォルトのボーカル音域：C4〜G5' },
    diagnosis: {
      en: 'vocalLow = 60 (C4) and vocalHigh = 79 (G5) bound every generated melody.',
      ja: 'vocalLow=60（C4）とvocalHigh=79（G5）が生成メロディの上下限です。',
    },
    caption: {
      en: 'A singer (or any instrument) has a comfortable range. MIDI Sketch expresses it as two MIDI numbers: the default melody stays between C4 (60) and G5 (79). Notes that would fall outside are folded back in by octaves.',
      ja: '歌い手（や楽器）には無理なく出せる音域があります。MIDI Sketchはそれを2つのMIDI番号で表し、デフォルトのメロディはC4（60）〜G5（79）に収まります。範囲外になりそうな音はオクターブ単位で折り返されます。',
    },
    time: '4/4',
    width: 420,
    upperClef: 'treble',
    upper: [
      { key: 'c/4', duration: 'h', annotation: 'vocalLow 60' },
      { key: 'g/5', duration: 'h', annotation: 'vocalHigh 79' },
    ],
  },
}
