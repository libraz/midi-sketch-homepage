# API リファレンス

## モジュール関数

### `init(options?)`

WASM モジュールを初期化します。他の関数を使用する前に呼び出す必要があります。WASM ファイルを別の URL から配信する場合は `wasmPath` を指定します。

```javascript
await midisketch.init()

// カスタム WASM URL
await midisketch.init({ wasmPath: '/assets/midisketch.wasm' })
```

::: warning 最初に呼び出し必須
他のAPI関数を使用する前に必ず`init()`を呼び出してください。初期化前に他の関数を呼び出すとエラーになります。
:::

### `getVersion()`

ライブラリのバージョン文字列を返します。

```javascript
const version = midisketch.getVersion()
```

### `getStructures()`

利用可能な曲構成プリセットを返します。

```javascript
const structures = midisketch.getStructures()
// [{ name: 'StandardPop' }, { name: 'FullPop' }, ...]
```

### `getMoods()`

利用可能なムードプリセットを返します。

```javascript
const moods = midisketch.getMoods()
// [{ name: 'Straight Pop', defaultBpm: 120 }, ...]
```

### `getChords()`

利用可能なコード進行を返します。

```javascript
const chords = midisketch.getChords()
// [{ name: 'Pop4', display: 'I-V-vi-IV' }, ...]
```

### `getStylePresets()`

利用可能なスタイルプリセットの詳細情報を返します。

```javascript
const presets = midisketch.getStylePresets()
// [{ id: 0, name: 'jpop', displayName: 'J-Pop', description: '...', tempoDefault: 120, allowedAttitudes: 7 }, ...]
```

### `getProgressionsByStyle(styleId)`

指定したスタイルと互換性のあるコード進行 ID を返します。

```javascript
const progressions = midisketch.getProgressionsByStyle(0)
// [0, 1, 2, ...]
```

### `getBlueprints()`

利用可能な全プロダクション Blueprint を返します。

```javascript
const blueprints = midisketch.getBlueprints()
// [{ id: 0, name: 'Traditional', paradigm: 0, riffPolicy: 0, weight: 42,
//    tempoMin: 96, tempoMax: 150 }, ...]
```

### `getBlueprintCount()`

利用可能な Blueprint の数を返します。

```javascript
const count = midisketch.getBlueprintCount()
// 10
```

### `getBlueprintName(id)`

ID で指定した Blueprint の名前を返します。

```javascript
const name = midisketch.getBlueprintName(1)
// 'RhythmLock'
```

### `getBlueprintParadigm(id)`

Blueprint の生成パラダイムを返します。

```javascript
const paradigm = midisketch.getBlueprintParadigm(1)
// 1 (GenerationParadigm.RhythmSync)
```

### `getBlueprintRiffPolicy(id)`

Blueprint の RiffPolicy を返します。

```javascript
const policy = midisketch.getBlueprintRiffPolicy(1)
// 1 (RiffPolicy.Locked)
```

### `getBlueprintWeight(id)`

Blueprint の選択重み（パーセンテージ）を返します。

```javascript
const weight = midisketch.getBlueprintWeight(0)
// 42
```

### `getBlueprintDrumsRequired(id)`

Blueprint がドラムトラックを必須とするかを返します。ドラム必須は Blueprint 1（RhythmLock）、5（IdolHyper）、7（IdolCoolPop）で、これらでは `drumsEnabledExplicit: true` を指定しない限り `drumsEnabled` が強制的に有効になります。

```javascript
const required = midisketch.getBlueprintDrumsRequired(1)
// true
```

### `getBlueprintTempoRange(id)`

Blueprint の推奨 BPM 範囲を返します。

```javascript
const range = midisketch.getBlueprintTempoRange(1)
// { min: 160, max: 175 }
```

### `getFormsByStyle(styleId)`

指定したスタイルと互換性のあるフォーム/構成 ID を返します。

```javascript
const forms = midisketch.getFormsByStyle(0)
// [0, 1, 2, ...]
```

### `createDefaultConfig(styleId)`

指定したスタイルプリセットのデフォルト SongConfig を作成します。

```javascript
const config = midisketch.createDefaultConfig(0)
// { stylePresetId: 0, key: 0, bpm: 0, chordProgressionId: 255, ... }
```

### `validateConfig(config)`

生成せずに `SongConfig` を検証します。`ConfigError` コードを返します（`0` = OK）。

```javascript
const code = midisketch.validateConfig(config)
if (code !== midisketch.ConfigError.OK) {
  console.error(midisketch.getConfigErrorMessage(code))
}
```

### `getConfigErrorMessage(code)`

`ConfigError` コードに対応する人間が読めるメッセージを返します。

```javascript
const message = midisketch.getConfigErrorMessage(6)
// 例: "Invalid BPM"
```

### `isCallOrientedVocalStyle(style)`

コアがコール向けとして扱うボーカルスタイルかどうかを返します。判定は実行時にコアから取得します。

```javascript
const usesCalls = midisketch.isCallOrientedVocalStyle(4)
```

### 設定のシリアライズヘルパー

公開 API の camelCase オブジェクトとコアが使用する snake_case JSON を相互変換します。`deserializeConfig()` は省略されたフィールドを既定値で補います。`callEnabled` は `callSetting` の後方互換ビューです。

```javascript
const config = midisketch.createDefaultConfig(0)
const json = midisketch.serializeConfig(config)
const restored = midisketch.deserializeConfig(json)
const vocalJson = midisketch.serializeVocalConfig({ vocalLow: 60 })
const accompanimentJson = midisketch.serializeAccompanimentConfig({ arpeggioGate: 80 })
```

### `downloadMidi(midiData, filename)`

MIDI データをファイルとしてダウンロードします。

```javascript
midisketch.downloadMidi(midiData, 'song.mid')
```

## MidiSketch クラス

### コンストラクタ

```javascript
const sketch = new midisketch.MidiSketch()
```

### `generateFromConfig(config)`

SongConfig オブジェクトから MIDI を生成します。

```javascript
sketch.generateFromConfig({
  // 基本設定
  stylePresetId: 0,           // スタイルプリセット ID (0-16)
  key: 0,                     // キー (0-11: C から B)
  bpm: 0,                     // テンポ (0=スタイルのデフォルト)
  seed: 12345,                // ランダムシード (0=ランダム)
  chordProgressionId: 255,    // コード進行 ID (255=スタイルのデフォルト)
  formId: 0,                  // フォーム/構成 ID (0-17)
  vocalAttitude: 0,           // 0=Clean, 1=Expressive, 2=Raw
  drumsEnabled: true,         // ドラムトラック有効化

  // アルペジオ設定
  arpeggioEnabled: false,     // アルペジオトラック有効化
  arpeggioPattern: 255,       // 0=Up, 1=Down, 2=UpDown, 3=Random, 4=Pinwheel, 5=PedalRoot, 6=Alberti, 7=BrokenChord, 255=Auto
  arpeggioSpeed: 255,         // 0=8分音符, 1=16分音符, 2=3連符, 255=Auto
  arpeggioOctaveRange: 2,     // 1-3 オクターブ
  arpeggioGate: -1,           // ゲート長 (0.0-1.0, -1=スタイルのデフォルト)
  arpeggioSyncChord: true,    // コードチェンジに同期
  arpeggioBaseVelocity: 90,   // アルペジオノートの基準ベロシティ (0-127)

  // ボーカル設定
  vocalLow: 60,               // ボーカル音域下限 (MIDIノート、デフォルトC4)
  vocalHigh: 79,              // ボーカル音域上限 (MIDIノート、デフォルトG5)
  skipVocal: false,           // ボーカル生成をスキップ (BGM先行ワークフロー用)

  // ボーカルスタイル設定
  vocalStyle: 0,              // ボーカルスタイルプリセット (0=自動, 1-13=特定プリセット)
  melodyTemplate: 0,          // メロディテンプレート (0=自動, 1-7=特定テンプレート)
  melodicComplexity: 1,       // メロディ複雑さ (0=シンプル, 1=標準, 2=複雑)
  hookIntensity: 2,           // フック強度 (0=オフ, 1=ライト, 2=ノーマル, 3=ストロング, 4=Maximum - 通常はBehavioral Loopが設定)
  vocalGroove: 0,             // グルーブ感 (0=ストレート, 1=オフビート, 2=スウィング, 3=シンコペ, 4=16分ドライブ, 5=バウンス8分)

  // ヒューマナイズ
  humanize: false,            // ヒューマナイズ有効化
  humanizeTiming: 0.4,        // タイミング変動 (0.0-1.0)
  humanizeVelocity: 0.3,      // ベロシティ変動 (0.0-1.0)

  // コード拡張
  chordExtSus: false,         // sus2/sus4 コード有効化
  chordExt7th: false,         // 7th コード有効化
  chordExt9th: false,         // 9th コード有効化
  chordExtTritoneSub: false,  // トライトーン代理有効化 (V7 -> bII7)
  chordExtSusProb: 0.2,       // sus コード確率 (0.0-1.0)
  chordExt7thProb: 0.15,      // 7th コード確率 (0.0-1.0)
  chordExt9thProb: 0.25,      // 9th コード確率 (0.0-1.0)
  chordExtTritoneSubProb: 0.5, // トライトーン代理確率 (0.0-1.0)

  // 作曲スタイル
  compositionStyle: 0,        // 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven
  compositionStyleExplicit: false, // スタイルより MelodyLead (0) を優先するとき true。1/2 はこのフラグ不要

  // 尺
  targetDurationSeconds: 0,   // 目標尺 (0=formIdに従う)

  // 転調設定
  modulationTiming: 0,        // 0=なし, 1=ラスサビ, 2=ブリッジ後, 3=各サビ, 4=ランダム
  modulationSemitones: 2,     // 転調量 (+1〜+4半音)

  // コール/SE設定 (アイドル系楽曲用)
  seEnabled: true,            // SEトラック有効化
  callSetting: 0,             // コール機能: 0=Auto (スタイルが決定), 1=Enabled, 2=Disabled
  callNotesEnabled: true,     // コールをノートとして出力
  introChant: 0,              // 0=なし, 1=ガチ恋, 2=シャウト
  mixPattern: 0,              // 0=なし, 1=スタンダード, 2=虎火
  callDensity: 2,             // 0=なし, 1=控えめ, 2=標準, 3=高密度

  // アレンジメント設定
  arrangementGrowth: 0,       // 0=LayerAdd (楽器追加), 1=RegisterAdd (音域拡大)

  // モチーフ設定
  motifRepeatScope: 0,        // 0=FullSong (同一モチーフ), 1=Section (セクション別)
  motifMaxChordCount: 4,      // 最大コード数 (デフォルト 4)

  // Blueprint 設定
  blueprintId: 0,             // Production Blueprint (0=Traditional, 1-9=特定, 255=ランダム)

  // ギター設定
  guitarEnabled: true,        // ギタートラック有効化 (デフォルト: true)

  // ドラム明示設定
  drumsEnabledExplicit: false, // drumsEnabled がユーザーにより明示的に設定されたか (Blueprint の drums_required をオーバーライド可能)

  // ムード設定
  mood: 0,                    // ムードプリセットオーバーライド (0-23, moodExplicit=true 時に使用)
  moodExplicit: false,        // 明示的ムード (true) またはスタイルから導出 (false)

  // フォーム設定
  formExplicit: false,        // formId を厳密に使用 (true) またはランダム化許可 (false)

  // ドライブ感
  driveFeel: 50,              // ドライブ感: 0=レイドバック, 50=ニュートラル, 100=アグレッシブ

  // Behavioral Loop
  addictiveMode: false,       // Behavioral Loop モード有効化 (固定リフ、最大フック)

  // モーラリズム
  moraRhythmMode: 2,          // モーラリズムモード: 0=Standard, 1=MoraTimed, 2=Auto
  syllabicSubRate: 0,          // 音節分割率: 0=スタイルのデフォルト, 1-100=%オーバーライド

  // シンコペーション
  enableSyncopation: false,   // VocalGroove のシンコペーション効果有効化

  // エナジーカーブ
  energyCurve: 0,             // エナジーカーブ: 0=GradualBuild, 1=FrontLoaded, 2=WavePattern, 3=SteadyState

  // コード拡張明示設定
  chordExtProbExplicit: false, // コード拡張確率が明示的に設定されたか (ムードによる自動調整を抑制)

  // メロディ詳細制御
  melodyMaxLeap: 0,           // 最大跳躍音程: 0=プリセット, 1-12=半音でオーバーライド
  melodySyncopationProb: 0xFF, // シンコペーション確率: 0xFF=プリセット, 0-100=%オーバーライド
  melodyPhraseLength: 0,      // フレーズ長: 0=プリセット, 1-8=小節
  melodyLongNoteRatio: 0xFF,  // ロングノート比率: 0xFF=プリセット, 0-100=%オーバーライド
  melodyChorusRegisterShift: -128, // サビ音域シフト: -128=プリセット, -12〜+12=半音
  melodyHookRepetition: 0,    // フック反復: 0=プリセット, 1=オフ, 2=オン (三状態)
  melodyUseLeadingTone: 0,    // 導音挿入: 0=プリセット, 1=オフ, 2=オン (三状態)

  // モチーフ詳細制御
  motifLength: 0,             // モチーフ長: 0=自動, 1/2/4小節
  motifNoteCount: 0,          // モチーフ音数: 0=自動, 3-8
  motifMotion: 0xFF,          // モチーフモーション: 0xFF=プリセット, 0=Stepwise, 1=GentleLeap, 2=WideLeap, 3=NarrowStep, 4=Disjunct, 5=Ostinato
  motifRegisterHigh: 0,       // モチーフ音域: 0=自動, 1=低, 2=高
  motifRhythmDensity: 0xFF,   // モチーフリズム密度: 0xFF=プリセット, 0=Sparse, 1=Medium, 2=Driving
})
```

::: info パラメータの依存関係
多くのパラメータは親オプションが有効な場合のみ効果があります。例えば、`arpeggioEnabled=false`の場合、`arpeggioPattern`を設定しても効果がありません。完全な依存関係ツリーは[オプション関係性](/ja/docs/option-relationships)を参照してください。
:::

::: warning callEnabled はレガシー
コール機能の正は `callSetting`（0=Auto, 1=Enabled, 2=Disabled）です。boolean の `callEnabled` は後方互換のためにのみ残されています: シリアライズ時は `callEnabled: true`→`callSetting: 1`、`false`→`callSetting: 2` に変換され、読み戻し時は `callSetting` から導出されます（Auto の場合は `undefined`）。新規コードでは `callSetting` を使用してください。
:::

`compositionStyleExplicit` のデフォルトは `false` です。`BackgroundMotif` (1) と `SynthDriven` (2) はこのフラグなしでもスタイルの設定を上書きします。スタイルプリセットに対して `MelodyLead` (0) を強制するときは `true` にします。`syllabicSubRate` は `0` がスタイルのデフォルト、`1-100` がパーセント指定です。`SongConfig` のヒューマナイズ量とコード拡張確率は正規化した `0.0-1.0` を使います。`arpeggioPattern` と `arpeggioSpeed` は `255` が Auto、`arpeggioGate` は `-1` がスタイルのデフォルトです。

`motifFixedProgression` は現在の `SongConfig` 型とシリアライザーに含まれません。モチーフモーションは `0xFF`（プリセット）または `0-5`（`Stepwise`、`GentleLeap`、`WideLeap`、`NarrowStep`、`Disjunct`、`Ostinato`）を受け取ります。

### `setMidiFormat(format)` / `getMidiFormat()`

後続の生成で使用する MIDI 出力形式を設定・取得します。`MidiFormat.SMF1` は `1`、`MidiFormat.SMF2` は `2` です。WebAssembly ビルドは現在 SMF1 のみをサポートするため、SMF2 を選ぶと `MidiSketchGenerationError` が発生します。

```javascript
sketch.setMidiFormat(midisketch.MidiFormat.SMF1)
const format = sketch.getMidiFormat()
```

### `regenerateVocal(configOrSeed)`

ボーカルトラック（およびAuxトラック）のみを再生成します。同じコード進行と構成を維持します。
`generateVocal()` 後のボーカル優先の試行錯誤や、`generateFromConfig()` の `skipVocal: true` と組み合わせたBGM先行ワークフローで使用します。
`VocalConfig` オブジェクトまたはシード番号（デフォルト: 0 = 新規ランダム）を受け付けます。

```javascript
// VocalConfig オブジェクトで指定
sketch.regenerateVocal({
  seed: 0,                     // ランダムシード (0=新しいランダム)
  vocalLow: 60,                // ボーカル音域下限 (MIDIノート, 36-96)
  vocalHigh: 79,               // ボーカル音域上限 (MIDIノート, 36-96)
  vocalAttitude: 1,            // 0=Clean, 1=Expressive, 2=Raw

  // オプション: ボーカル生成の微調整
  vocalStyle: 0,               // ボーカルスタイルプリセット (0=自動, 1-13=特定プリセット)
  melodyTemplate: 0,           // メロディテンプレート (0=自動, 1-7=特定テンプレート)
  melodicComplexity: 1,        // メロディ複雑さ (0=シンプル, 1=標準, 2=複雑)
  hookIntensity: 2,            // フック強度 (0=オフ, 1=ライト, 2=ノーマル, 3=ストロング, 4=Maximum)
  vocalGroove: 0,              // グルーブ感 (0=ストレート, 1=オフビート, 2=スウィング等)
  compositionStyle: 0,         // 作曲スタイル (0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven)
  keepMotif: false,            // RhythmSync限定: 既存のMotifをリズムの軸として保持 (false=両方再生成)
})

// またはシードのみで指定
sketch.regenerateVocal(12345)
```

### `getMidi()`

生成された MIDI データを `Uint8Array` として返します。

```javascript
const midiData = sketch.getMidi()
```

### `getVocalPreviewMidi()`

生成済みのボーカルメロディとコードルートのベースを含む、ボーカル練習用のコンパクトな `Uint8Array` を返します。先にボーカルまたは曲全体を生成してください。

```javascript
const preview = sketch.getVocalPreviewMidi()
```

### `getMelody()` / `setMelody(melody)`

現在のボーカルメロディを `MelodyData` として保存し、後で復元します。復元したメロディに伴奏を合わせる場合は、その後に `generateAccompaniment()` を呼び出します。

```javascript
const melody = sketch.getMelody()
sketch.setMelody(melody)
```

### `getEvents()`

可視化/再生用のイベントデータを返します。

```javascript
const events = sketch.getEvents()
// { bpm, division, duration_ticks, duration_seconds, vocal_style,
//   metadata, tracks, sections, chords, tempo_map }
```

### `getDissonanceReport()`

生成済みの曲を調べ、和声上の不協和音分析結果を `DissonanceReport` として返します。

```javascript
const report = sketch.getDissonanceReport()
console.log(report.summary.total_issues)
```

### `generateVocal(config)`

伴奏なしでボーカルトラックのみを生成します。試行錯誤ワークフロー用：ボーカル生成→プレビュー→必要に応じて再生成。ボーカルに満足したら `generateAccompaniment()` を呼び出します。

```javascript
const vocalConfig = {
  ...midisketch.createDefaultConfig(0),
  vocalLow: 60,
  vocalHigh: 79,
  vocalAttitude: 1,
}
sketch.generateVocal(vocalConfig)
```

### `generateAccompaniment(config?)`

既存のボーカルに対して伴奏トラックを生成します。`generateVocal()`、`generateWithVocal()`、または `setVocalNotes()` の後に呼び出す必要があります。生成順序：Aux → Bass → Chord → Guitar → Arpeggio → Drums → SE（ボーカルに適応）

```javascript
// シンプル：デフォルト設定を使用
sketch.generateAccompaniment()

// 設定付き
sketch.generateAccompaniment({
  seed: 12345,                // ランダムシード (0 = 自動)
  drumsEnabled: true,
  guitarEnabled: false,       // ギタートラックを無効化 (デフォルト: true)
  arpeggioEnabled: false,
  arpeggioPattern: 0,         // 0=Up, 1=Down, 2=UpDown, 3=Random, 4=Pinwheel, 5=PedalRoot, 6=Alberti, 7=BrokenChord
  arpeggioSpeed: 1,           // 0=8分, 1=16分, 2=3連符
  arpeggioOctaveRange: 2,
  arpeggioGate: 80,           // 0-100（255=スタイルのデフォルト）
  arpeggioSyncChord: true,
  chordExtSus: false,
  chordExt7th: false,
  chordExt9th: false,
  chordExtTritoneSub: false,  // トライトーン代理 (V7 -> bII7)
  chordExtSusProb: 0.2,       // 0.0-1.0
  chordExt7thProb: 0.15,      // 0.0-1.0
  chordExt9thProb: 0.25,      // 0.0-1.0
  chordExtTritoneSubProb: 0.5, // 0.0-1.0
  humanize: false,
  humanizeTiming: 0.4,        // 0.0-1.0
  humanizeVelocity: 0.3,      // 0.0-1.0
  seEnabled: true,
  callEnabled: false,
  callDensity: 2,             // 0=なし, 1=控えめ, 2=標準, 3=高密度
  introChant: 0,              // 0=なし, 1=ガチ恋, 2=シャウト
  mixPattern: 0,              // 0=なし, 1=スタンダード, 2=虎火
  callNotesEnabled: true,
})
```

### `regenerateAccompaniment(seedOrConfig)`

新しいシードまたは設定で伴奏トラックを再生成します。現在のボーカルを保持し、全ての伴奏トラック（Aux、Bass、Chord、Drums等）を再生成します。

```javascript
// シードのみ
sketch.regenerateAccompaniment(12345)

// 完全な設定
sketch.regenerateAccompaniment({
  seed: 12345,
  drumsEnabled: true,
  arpeggioEnabled: true,
  // ... その他のAccompanimentConfigオプション
})
```

### `generateWithVocal(config)`

ボーカル優先で全トラックを生成します。生成順序：Vocal → Aux → Bass → Chord → Guitar → Arpeggio → Drums → SE。伴奏がボーカルメロディに適応します。

```javascript
const config = midisketch.createDefaultConfig(0)
sketch.generateWithVocal(config)
```

### `setVocalNotes(config, notes)`

伴奏生成用にカスタムボーカルノートを設定します。configから曲構成とコード進行を初期化し、提供されたノートでボーカルトラックを置き換えます。この後に `generateAccompaniment()` を呼び出します。

```javascript
const config = midisketch.createDefaultConfig(0)

// カスタムボーカルノートを設定
sketch.setVocalNotes(config, [
  { startTick: 0, duration: 480, pitch: 60, velocity: 100 },
  { startTick: 480, duration: 480, pitch: 62, velocity: 100 },
  { startTick: 960, duration: 960, pitch: 64, velocity: 100 },
])

// カスタムボーカル用の伴奏を生成
sketch.generateAccompaniment()

// MIDIデータを取得
const midi = sketch.getMidi()
```

### `getPianoRollSafetyAt(tick, prevPitch?)`

単一ティックのピアノロール安全性情報を取得します。各MIDIノート（0-127）の安全性レベル、理由フラグ、衝突情報を返します。カスタムボーカルノートを配置する前に、どのノートが安全かを確認するために使用します。

```javascript
const info = sketch.getPianoRollSafetyAt(0)

// C4（ピッチ60）が安全かチェック
if (info.safety[60] === 0) { // NoteSafety.Safe
  console.log('C4はコードトーン、使用可能')
}

// 推奨ノートを取得
console.log('推奨:', info.recommended)
```

### `getPianoRollSafety(startTick, endTick, step)`

ティック範囲のピアノロール安全性情報を取得します。ピアノロールエディタで時間経過に伴う安全なノートを可視化するのに便利です。`step` は正の整数、`endTick` は `startTick` 以上でなければなりません。1 回の要求は `MAX_PIANO_ROLL_SAMPLES`（`100000`）サンプル以下に制限され、条件を満たさない場合は `RangeError` が発生します。

```javascript
// 最初の4小節、16分音符解像度でサンプリング
const infos = sketch.getPianoRollSafety(0, 1920 * 4, 120)

for (const info of infos) {
  console.log(`Tick ${info.tick}: コード度数 ${info.chordDegree}`)
  console.log('推奨ノート:', info.recommended)
}
```

### `reasonToString(reason)`

理由フラグを人間が読める文字列に変換します。

```javascript
const info = sketch.getPianoRollSafetyAt(0)
const reasonText = sketch.reasonToString(info.reason[60])
// "ChordTone" または "LowRegister, Tritone"
```

### `collisionToString(collision)`

`CollisionInfo` を人間が読める文字列に変換します。衝突がないエントリでは空文字列を返します。

```javascript
const info = sketch.getPianoRollSafetyAt(0)
const collisionText = sketch.collisionToString(info.collision[60])
```

### `generateFromBuilder(builder)`

SongConfigBuilder インスタンスから MIDI を生成します。ビルダーはパラメータ変更のカスケード検出機能付きの fluent API を提供します。

```javascript
const builder = new midisketch.SongConfigBuilder(0)
  .setBpm(165)
  .setBlueprint(1)
  .setSeed(12345)

sketch.generateFromBuilder(builder)
```

### `getResolvedBlueprintId()`

生成後に解決された Blueprint ID（`0-9`）を返します。`blueprintId=255`（自動）の場合、ランダムに選択された Blueprint が返されます。

```javascript
const config = midisketch.createDefaultConfig(0)
config.blueprintId = 255 // 自動選択
sketch.generateFromConfig(config)
const actualId = sketch.getResolvedBlueprintId()
console.log(`使用された Blueprint: ${midisketch.getBlueprintName(actualId)}`)
```

### `getWarnings()`

直近の生成処理で発生した非致命的な警告を返します。

```javascript
for (const warning of sketch.getWarnings()) {
  console.warn(warning)
}
```

### `destroy()`

リソースをクリーンアップします。

```javascript
sketch.destroy()
```

## 生成ワークフロー

MIDI Sketchは、用途に応じて3つの生成ワークフローをサポートしています：

::: tip ワークフローの選び方
| ワークフロー | 用途 |
|-------------|------|
| **BGM先行** | ボーカル追加前に伴奏をプレビュー |
| **ボーカル先行** | バッキングトラック生成前にメロディを反復調整 |
| **カスタムボーカル** | 独自のメロディをインポートして伴奏を生成 |
:::

## BGM先行ワークフロー

バッキングトラックを先に生成し、後からボーカルを追加：

```javascript
const sketch = new midisketch.MidiSketch()

// ステップ1: BGMのみ生成
const config = midisketch.createDefaultConfig(0)
config.skipVocal = true
sketch.generateFromConfig(config)

// BGMをプレビュー...

// ステップ2: ボーカルを追加
sketch.regenerateVocal({
  seed: 0,
  vocalLow: 60,
  vocalHigh: 79,
  vocalAttitude: 1,
})

const midiData = sketch.getMidi()
```

## ボーカル先行ワークフロー

ボーカルを先に生成し、プレビュー、反復、その後伴奏を生成：

```javascript
const sketch = new midisketch.MidiSketch()
const config = midisketch.createDefaultConfig(0)

// ステップ1: ボーカルのみ生成
sketch.generateVocal(config)

// プレビューして満足するまで反復...
sketch.regenerateVocal({ seed: 12345, vocalAttitude: 1 })

// ステップ2: ボーカル用の伴奏を生成
sketch.generateAccompaniment()

const midiData = sketch.getMidi()
```

## カスタムボーカルインポートワークフロー

独自のメロディをインポートし、フィットする伴奏を生成：

```javascript
const sketch = new midisketch.MidiSketch()
const config = midisketch.createDefaultConfig(0)

// ステップ1: カスタムボーカルノートを設定
sketch.setVocalNotes(config, [
  { startTick: 0, duration: 480, pitch: 60, velocity: 100 },
  { startTick: 480, duration: 480, pitch: 62, velocity: 100 },
  { startTick: 960, duration: 960, pitch: 64, velocity: 100 },
])

// ステップ2: Piano Roll Safety APIでノートを検証（オプション）
const safety = sketch.getPianoRollSafetyAt(0)
console.log('tick 0での推奨ノート:', safety.recommended)

// ステップ3: 伴奏を生成
sketch.generateAccompaniment()

const midiData = sketch.getMidi()
```

## 応用例

### エナジーカーブ制御

```javascript
// FrontLoaded - 最初から高エネルギー
sketch.generateFromConfig({
  ...midisketch.createDefaultConfig(0),
  energyCurve: 1
})
```

### メロディ詳細制御

```javascript
// カスタムメロディ設定: 最大5半音跳躍、4小節フレーズ、フック有効
sketch.generateFromConfig({
  ...midisketch.createDefaultConfig(0),
  melodyMaxLeap: 5,
  melodyPhraseLength: 4,
  melodyHookRepetition: 2  // オン
})
```

### モチーフ詳細制御

```javascript
// 4拍モチーフ、5音、ジェントルリープモーション
sketch.generateFromConfig({
  ...midisketch.createDefaultConfig(0),
  motifLength: 4,
  motifNoteCount: 5,
  motifMotion: 1  // GentleLeap
})
```

### ギタートラック

```javascript
sketch.generateFromConfig({
  ...midisketch.createDefaultConfig(0),
  guitarEnabled: true
})
```

### シンコペーション + グルーブ

```javascript
sketch.generateFromConfig({
  ...midisketch.createDefaultConfig(0),
  enableSyncopation: true,
  vocalGroove: 3  // Syncopated
})
```

### SongConfigBuilder の使用

```javascript
const builder = new midisketch.SongConfigBuilder(0)
  .setBpm(165)
  .setBlueprint(1)
  .setSeed(12345)

// カスケード変更を確認
const changes = builder.getLastChangeResult()
if (changes) {
  for (const change of changes.changes) {
    console.log(`${change.field}: ${change.oldValue} → ${change.newValue}`)
  }
}

// ビルダーを使用して生成
sketch.generateFromBuilder(builder)
```

## SongConfigBuilder

`SongConfigBuilder` は、自動カスケード検出機能付きの `SongConfig` 構築用 fluent API を提供します。あるパラメータを変更すると、関連パラメータが自動調整される場合があります。

### コンストラクタ

```javascript
const builder = new midisketch.SongConfigBuilder(styleId)
```

| パラメータ | 型 | デフォルト | 説明 |
|-----------|------|---------|-------------|
| `styleId` | number | 0 | デフォルト値の元となるスタイルプリセット ID |

### セッターメソッド

全てのセッターメソッドはチェーン用に `this` を返します：

| メソッド | パラメータ | 説明 |
|--------|------------|-------------|
| `setSeed(seed)` | number | ランダムシード設定 (0=ランダム) |
| `setKey(key)` | number | キー設定 (0-11, 0=C) |
| `setChordProgression(id)` | number | コード進行 ID 設定 |
| `setForm(id)` | number | フォーム ID を設定し `formExplicit=true` にする |
| `setVocalRange(low, high)` | number, number | MIDI ボーカル音域を設定し、上下を正規化する |
| `setBpm(bpm)` | number | BPM 設定 (0=スタイルデフォルト)。選択した Blueprint の宣言済み範囲外で警告 |
| `setBlueprint(id)` | number | Blueprint 設定 (0-9, 255=ランダム)。カスケード: drums, hookIntensity |
| `setStylePreset(id)` | number | スタイルプリセット設定。未明示の chord, form, BPM, vocal attitude をスタイルデフォルトにリセット |
| `setVocalStyle(style)` | number | ボーカルスタイル設定 (0=自動, 1-13)。アイドル系スタイルは call を自動有効化 |
| `setVocalAttitude(attitude)` | number | ボーカルアティチュード設定 (0=Clean, 1=Expressive, 2=Raw) |
| `setCompositionStyle(style)` | number | 作曲スタイル設定 (0-2)。カスケード: skipVocal, arpeggioEnabled |
| `setModulation(timing, semitones?)` | number, number | 転調設定 (timing 0-4, semitones 1-4) |
| `setChordExtensions(opts)` | object | 拡張と正規化確率を設定 (`sus`, `seventh`, `ninth`, `tritone`, `susProb`, `seventhProb`, `ninthProb`, `tritoneProb`; 確率は 0.0-1.0) |
| `setArpeggio(enabled, opts?)` | boolean, object | アルペジオ設定 (`pattern`, `speed`, `octaveRange`, `gate`, `syncChord`, `baseVelocity`)。SongConfig の `gate` は 0.0-1.0 または -1 |
| `setMotif(opts)` | object | モチーフ設定 (`repeatScope`, `maxChordCount`, `length`, `noteCount`, `motion`, `registerHigh`, `rhythmDensity`) |
| `setCall(opts)` | object | コール/SE 設定 ({setting (0=Auto/1=Enabled/2=Disabled), enabled (レガシーboolean), notesEnabled, density, introChant, mixPattern, seEnabled}) |
| `setMelodicComplexity(complexity)` | number | メロディ複雑さ設定 (0-2) |
| `setHookIntensity(intensity)` | number | フック強度設定 (0-4) |
| `setVocalGroove(groove)` | number | ボーカルグルーブ感設定 (0-5) |
| `setMelodyTemplate(template)` | number | メロディテンプレート設定 (0-7) |
| `setArrangementGrowth(growth)` | number | アレンジメント成長設定 (0-1) |
| `setTargetDuration(seconds)` | number | 目標尺設定 (0=formId に従う) |
| `setSkipVocal(skip)` | boolean | ボーカル生成スキップ |
| `setDriveFeel(feel)` | number | ドライブ感設定 (0=レイドバック, 50=ニュートラル, 100=アグレッシブ) |
| `setAddictiveMode(enabled)` | boolean | Behavioral Loop モード有効化 |
| `setMoraRhythmMode(mode)` | number | モーラリズムモード設定 (0=Standard, 1=MoraTimed, 2=Auto) |
| `setSyllabicSubdivisionRate(rate)` | number | 音節分割率設定 (0=スタイルデフォルト, 1-100=%オーバーライド) |
| `setSyncopation(enabled)` | boolean | メロディのシンコペーション有効化 |
| `setEnergyCurve(curve)` | number | エナジーカーブ設定 (0-3) |
| `setMelodyOverrides(opts)` | object | メロディ詳細設定 (`maxLeap`, `syncopationProb`, `phraseLength`, `longNoteRatio`, `chorusRegisterShift`, `hookRepetition`, `useLeadingTone`) |
| `setGuitar(enabled)` | boolean | ギタートラックを有効または無効化 |
| `setMood(mood)` | number | ムードプリセットオーバーライド設定 (0-23, moodExplicit=true に設定) |
| `setFormExplicit(explicit)` | boolean | formId を厳密に使用 (ランダム化なし) |
| `setHumanize(enabled, timing?, velocity?)` | boolean, number, number | ヒューマナイズ設定。timing と velocity は 0.0-1.0 にクランプ |
| `setDrums(enabled)` | boolean | ドラム有効化設定。ドラム必須 Blueprint で無効化すると警告 |

### クエリメソッド

```javascript
// 最終的な SongConfig をビルド
const config = builder.build()

// 最後のセッター呼び出しの結果を取得（カスケード情報）
const changes = builder.getLastChangeResult()
// 戻り値: ParameterChangeResult | null

// 明示的に設定されたフィールド名のリストを取得
const explicit = builder.getExplicitFields()
// ['bpm', 'blueprintId', 'seed']

// 自動導出されたフィールド名のリストを取得
const derived = builder.getDerivedFields()
// ['drumsEnabled', 'hookIntensity']
```

### リセットメソッド

```javascript
// 全設定をデフォルトにリセット
builder.reset()       // style ID を渡す場合は builder.reset(1)

// デフォルトにリセットするが、明示的に設定した値は保持
builder.resetKeepExplicit() // style ID を渡す場合は builder.resetKeepExplicit(1)
```

### カスケード検出

特定のパラメータ変更は、関連パラメータへのカスケード更新をトリガーします：

- **Blueprint 変更**: `drumsEnabled` を自動調整する場合あり (Blueprint 1, 5, 7 はドラム必須)、`hookIntensity` (BehavioralLoop は Maximum を強制)
- **作曲スタイル変更**: `skipVocal`, `arpeggioEnabled` を自動調整する場合あり (SynthDriven はアルペジオ有効化)
- **ボーカルスタイル変更**: アイドル系プリセット (4=Idol, 9=BrightKira, 11=CuteAffected) は明示的に設定されていなければ call を自動有効化
- **BPM 変更**: 選択した Blueprint の宣言済みテンポ範囲外の場合に警告
- **ドラム変更**: ドラム必須 Blueprint でドラムを無効化する場合に警告

```javascript
const builder = new midisketch.SongConfigBuilder(0)
  .setBlueprint(1)  // RhythmLock - ドラム必須

const changes = builder.getLastChangeResult()
if (changes) {
  for (const change of changes.changes) {
    console.log(`${change.field}: ${change.oldValue} → ${change.newValue} (${change.reason})`)
  }
  // 例: "drumsEnabled: false → true (Blueprint RhythmLock requires drums)"
}
```

### ParameterChangeResult

```typescript
interface ParameterChangeResult {
  changedCount: number                // 変更されたフィールド数
  changedCategories: ParameterCategory[] // 変更のカテゴリ
  changes: ParameterChange[]          // 変更の詳細リスト
  warnings: string[]                  // 警告メッセージ
}

interface ParameterChange {
  category: ParameterCategory         // カテゴリ (例: 'drums', 'hook', 'vocal')
  field: string                       // 変更されたフィールド名
  oldValue: unknown                   // 変更前の値
  newValue: unknown                   // 変更後の値
  reason: string                      // 変更理由
}
```

## 定数

### `MidiFormat`

```javascript
MidiFormat.SMF1 // 1 - Standard MIDI File format 1
MidiFormat.SMF2 // 2 - MIDI 2.0 Container File（WebAssembly では未サポート）
```

`MidiFormatType` はこの定数が表す数値ユニオン（`1 | 2`）です。

### アティチュードのビットフラグ

`getStylePresets()` の `allowedAttitudes` は次のビットフラグを使います。

```javascript
ATTITUDE_CLEAN      // 1
ATTITUDE_EXPRESSIVE // 2
ATTITUDE_RAW        // 4
```

### `VocalAttitude`

```javascript
VocalAttitude.Clean      // 0 - クリーンで制御されたボーカル
VocalAttitude.Expressive // 1 - 表現豊かでダイナミックなボーカル
VocalAttitude.Raw        // 2 - 生々しく感情的なボーカル
```

### `CompositionStyle`

```javascript
CompositionStyle.MelodyLead     // 0 - 従来のメロディ主導型
CompositionStyle.BackgroundMotif // 1 - モチーフ主導でボーカル控えめ
CompositionStyle.SynthDriven    // 2 - アルペジオ重視のエレクトロニック
```

### `ModulationTiming`

```javascript
ModulationTiming.None        // 0 - 転調なし
ModulationTiming.LastChorus  // 1 - ラスサビで転調
ModulationTiming.AfterBridge // 2 - ブリッジ後に転調
ModulationTiming.EachChorus  // 3 - 各サビで転調
ModulationTiming.Random      // 4 - ランダムなタイミング
```

### `IntroChant`

```javascript
IntroChant.None     // 0 - イントロチャントなし
IntroChant.Gachikoi // 1 - ガチ恋スタイル
IntroChant.Shouting // 2 - シャウトスタイル
```

### `MixPattern`

```javascript
MixPattern.None     // 0 - ミックスパターンなし
MixPattern.Standard // 1 - 標準的なコール&レスポンス
MixPattern.Tiger    // 2 - 虎火パターン
```

### `CallDensity`

```javascript
CallDensity.None     // 0 - コールなし
CallDensity.Minimal  // 1 - 控えめなコール挿入
CallDensity.Standard // 2 - 標準的なコール頻度
CallDensity.Intense  // 3 - 高密度コール
```

### `ArrangementGrowth`

```javascript
ArrangementGrowth.LayerAdd    // 0 - 時間経過で楽器/レイヤーを追加
ArrangementGrowth.RegisterAdd // 1 - 時間経過で音域を拡大
```

### `MotifRepeatScope`

```javascript
MotifRepeatScope.FullSong // 0 - 曲全体で同一モチーフ
MotifRepeatScope.Section  // 1 - セクションごとに異なるモチーフ
```

### `VocalStylePreset`

```javascript
VocalStylePreset.Auto          // 0 - スタイルに基づいて自動選択
VocalStylePreset.Standard      // 1 - 標準ポップボーカル
VocalStylePreset.Vocaloid      // 2 - ボカロスタイル (高速、広い跳躍)
VocalStylePreset.UltraVocaloid // 3 - 超高速ボカロ (32分音符)
VocalStylePreset.Idol          // 4 - アイドルスタイル (キャッチー、フック重視)
VocalStylePreset.Ballad        // 5 - バラード (スロー、ロングノート)
VocalStylePreset.Rock          // 6 - ロック (パワフル、サビで音域シフト)
VocalStylePreset.CityPop       // 7 - シティポップ (ジャジー、シンコペ)
VocalStylePreset.Anime         // 8 - アニメスタイル (ダイナミック、表現豊か)
VocalStylePreset.BrightKira    // 9 - ブライト/キラキラ (高音域、煌びやか)
VocalStylePreset.CoolSynth     // 10 - クールシンセ (エレクトロニック、正確)
VocalStylePreset.CuteAffected  // 11 - キュート/あざとい (プレイフル)
VocalStylePreset.PowerfulShout // 12 - パワフルシャウト (激しい)
VocalStylePreset.KPop          // 13 - K-Popスタイル
```

### メロディテンプレートの値（`SongConfig.melodyTemplate`）

| 値 | 意味 |
|-------|---------|
| 0 | スタイルとセクションから自動選択 |
| 1 | PlateauTalk |
| 2 | RunUpTarget |
| 3 | DownResolve |
| 4 | HookRepeat |
| 5 | SparseAnchor |
| 6 | CallResponse |
| 7 | JumpAccent |

### `MelodicComplexity`

```javascript
MelodicComplexity.Simple   // 0 - 音程変化の少ないシンプルなメロディ
MelodicComplexity.Standard // 1 - 標準的な複雑さ
MelodicComplexity.Complex  // 2 - より大きな音程差とバリエーション
```

### `HookIntensity`

```javascript
HookIntensity.Off     // 0 - フック反復なし
HookIntensity.Light   // 1 - 控えめなフック
HookIntensity.Normal  // 2 - 標準的なフック反復（デフォルト）
HookIntensity.Strong  // 3 - 強いフック、キャッチー重視
HookIntensity.Maximum // 4 - 最大反復（Behavioral Loop / addictiveMode が使用）
```

### `VocalGrooveFeel`

```javascript
VocalGrooveFeel.Straight   // 0 - ストレートリズム（デフォルト）
VocalGrooveFeel.OffBeat    // 1 - オフビート強調
VocalGrooveFeel.Swing      // 2 - スウィング感
VocalGrooveFeel.Syncopated // 3 - シンコペーションリズム
VocalGrooveFeel.Driving16th // 4 - ドライブ感のある16分音符
VocalGrooveFeel.Bouncy8th  // 5 - バウンス感のある8分音符
```

### `ArpeggioPattern`

```javascript
ArpeggioPattern.Up          // 0 - 上昇アルペジオ
ArpeggioPattern.Down        // 1 - 下降アルペジオ
ArpeggioPattern.UpDown      // 2 - 上昇後下降
ArpeggioPattern.Random      // 3 - ランダム順序
ArpeggioPattern.Pinwheel    // 4 - ピンホイールパターン
ArpeggioPattern.PedalRoot   // 5 - ペダルルートパターン
ArpeggioPattern.Alberti     // 6 - アルベルティバスパターン
ArpeggioPattern.BrokenChord // 7 - 分散和音パターン
ArpeggioPattern.Auto         // 255 - スタイルに任せる（SongConfig のデフォルト）
```

### `ArpeggioSpeed`

```javascript
ArpeggioSpeed.Eighth    // 0
ArpeggioSpeed.Sixteenth // 1
ArpeggioSpeed.Triplet   // 2
ArpeggioSpeed.Auto      // 255 - スタイルに任せる（SongConfig のデフォルト）
```

`ARPEGGIO_GATE_AUTO` は `-1` です。`SongConfig.arpeggioGate` に指定するとスタイルのデフォルトを使います。

### モチーフモーションの値（`SongConfig.motifMotion`）

| 値 | 意味 |
|-------|---------|
| `0xFF` | プリセットを使う |
| 0 | Stepwise |
| 1 | GentleLeap |
| 2 | WideLeap |
| 3 | NarrowStep |
| 4 | Disjunct |
| 5 | Ostinato |

### モチーフリズム密度の値（`SongConfig.motifRhythmDensity`）

| 値 | 意味 |
|-------|---------|
| `0xFF` | プリセットを使う |
| 0 | Sparse |
| 1 | Medium |
| 2 | Driving |

### エナジーカーブの値（`SongConfig.energyCurve`）

| 値 | 意味 |
|-------|---------|
| 0 | GradualBuild |
| 1 | FrontLoaded |
| 2 | WavePattern |
| 3 | SteadyState |

### モーラリズムの値（`SongConfig.moraRhythmMode`）

| 値 | 意味 |
|-------|---------|
| 0 | Standard |
| 1 | MoraTimed |
| 2 | Auto |
### `driveFeel` の値（`SongConfig.driveFeel`）

0〜100の連続値でリズムの激しさを制御：

| 値 | フィール |
|-----|------|
| 0 | レイドバック |
| 50 | ニュートラル（デフォルト） |
| 100 | アグレッシブ |

### `GenerationParadigm`

```javascript
GenerationParadigm.Traditional  // 0 - クラシック生成 (Vocal→Aux→Motif→Bass→Chord→Guitar→Arpeggio→Drums→SE)
GenerationParadigm.RhythmSync   // 1 - リズム同期 (Motif→Vocal→Aux→Bass→Chord→Guitar→Arpeggio→Drums→SE)
GenerationParadigm.MelodyDriven // 2 - メロディ中心 (Vocal→Aux→Motif→Bass→Chord→Guitar→Arpeggio→Drums→SE)
```

### `RiffPolicy`

```javascript
RiffPolicy.Free          // 0 - セクションごとに独立して変化
RiffPolicy.LockedContour // 1 - ピッチ輪郭固定、表現は変化
RiffPolicy.LockedPitch   // 2 - ピッチ完全固定、ベロシティは変化
RiffPolicy.LockedAll     // 3 - 完全固定（単調、非推奨）
RiffPolicy.Evolving      // 4 - セクションをまたいで徐々に変化
RiffPolicy.Locked        // LockedContour (1) のエイリアス
```

### `ConfigError`

`validateConfig()` が返す（および `MidiSketchConfigError` が保持する）検証エラーコード：

```javascript
ConfigError.OK                      // 0
ConfigError.InvalidStyle            // 1
ConfigError.InvalidChord            // 2
ConfigError.InvalidForm             // 3
ConfigError.InvalidAttitude         // 4
ConfigError.InvalidVocalRange       // 5
ConfigError.InvalidBpm              // 6
ConfigError.DurationTooShort        // 7
ConfigError.InvalidModulation       // 8
ConfigError.InvalidKey              // 9
ConfigError.InvalidCompositionStyle // 10
ConfigError.InvalidArpeggioPattern  // 11
ConfigError.InvalidArpeggioSpeed    // 12
ConfigError.InvalidVocalStyle       // 13
ConfigError.InvalidMelodyTemplate   // 14
ConfigError.InvalidMelodicComplexity // 15
ConfigError.InvalidHookIntensity    // 16
ConfigError.InvalidVocalGroove      // 17
ConfigError.InvalidCallDensity      // 18
ConfigError.InvalidIntroChant       // 19
ConfigError.InvalidMixPattern       // 20
ConfigError.InvalidMotifRepeatScope // 21
ConfigError.InvalidArrangementGrowth // 22
ConfigError.InvalidModulationTiming // 23
ConfigError.InvalidBlueprint        // 24
ConfigError.InvalidCallSetting      // 25
ConfigError.InvalidEnergyCurve      // 26
ConfigError.InvalidDriveFeel        // 27
ConfigError.InvalidMoraRhythmMode   // 28
ConfigError.InvalidProbability      // 29
ConfigError.InvalidArpeggioRange    // 30
ConfigError.InvalidMelodyOverride   // 31
ConfigError.InvalidMotifOverride    // 32
ConfigError.InvalidJson             // 33
ConfigError.InvalidMood             // 34
ConfigError.InvalidTargetDuration   // 35
```

`ConfigErrorCode` は `ConfigError` の値からなる数値ユニオンです。

### エラークラス

`MidiSketchConfigError` は `Error` を継承し、`code: ConfigErrorCode` と `nativeMessage` を持ちます。`MidiSketchGenerationError` は `Error` を継承し、コアが返した数値 `code` を持ちます。設定を使う生成メソッドは検証失敗時に設定エラー、それ以外の失敗時に生成エラーを送出します。

```javascript
try {
  sketch.generateFromConfig(config)
} catch (error) {
  if (error instanceof midisketch.MidiSketchConfigError) {
    console.error(error.code, error.nativeMessage)
  }
}
```

### `NoteSafety`

`MAX_PIANO_ROLL_SAMPLES` は `100000` です。`getPianoRollSafety()` 1 回あたりの最大サンプル数を示します。

```javascript
NoteSafety.Safe      // 0 - 緑：コードトーン、使用安全
NoteSafety.Warning   // 1 - 黄：テンション、低音域、またはパッシングトーン
NoteSafety.Dissonant // 2 - 赤：不協和音または音域外
```

### `NoteReason`

ノート安全性の理由フラグ（ビットフィールド、組み合わせ可能）：

```javascript
NoteReason.None         // 0
// ポジティブな理由（緑）
NoteReason.ChordTone    // 1 - コードトーン（ルート、3度、5度、7度）
NoteReason.Tension      // 2 - テンション（9度、11度、13度）
NoteReason.ScaleTone    // 4 - スケールトーン（コード外だがスケール内）
// 警告理由（黄）
NoteReason.LowRegister  // 8 - 低音域（C4以下）、濁りの可能性
NoteReason.Tritone      // 16 - トライトーン音程（V7以外では不安定）
NoteReason.LargeLeap    // 32 - 大きな跳躍（前のノートから6半音以上）
// 不協和理由（赤）
NoteReason.Minor2nd     // 64 - 短2度（1半音）の衝突
NoteReason.Major7th     // 128 - 長7度（11半音）の衝突
NoteReason.NonScale     // 256 - スケール外のトーン（クロマチック）
NoteReason.PassingTone  // 512 - パッシングトーンとして使用可能
// 音域外理由（赤）
NoteReason.OutOfRange   // 1024 - ボーカル音域外
NoteReason.TooHigh      // 2048 - 高すぎて歌えない
NoteReason.TooLow       // 4096 - 低すぎて歌えない
```

## 型定義

### `SongConfig`

`generateFromConfig()`、`generateVocal()`、`generateWithVocal()`、`setVocalNotes()` で使用する完全な設定オブジェクトです。

```typescript
interface SongConfig {
  stylePresetId: number
  key: number
  bpm: number
  seed: number
  chordProgressionId: number
  formId: number
  vocalAttitude: number
  drumsEnabled: boolean
  drumsEnabledExplicit: boolean
  blueprintId: number
  arpeggioEnabled: boolean
  guitarEnabled: boolean
  arpeggioPattern: number
  arpeggioSpeed: number
  arpeggioOctaveRange: number
  arpeggioGate: number
  vocalLow: number
  vocalHigh: number
  skipVocal: boolean
  humanize: boolean
  humanizeTiming: number
  humanizeVelocity: number
  chordExtSus: boolean
  chordExt7th: boolean
  chordExt9th: boolean
  chordExtTritoneSub: boolean
  chordExtSusProb: number
  chordExt7thProb: number
  chordExt9thProb: number
  chordExtTritoneSubProb: number
  compositionStyle: number
  compositionStyleExplicit: boolean
  targetDurationSeconds: number
  modulationTiming: number
  modulationSemitones: number
  seEnabled: boolean
  callSetting?: number
  callEnabled?: boolean
  callNotesEnabled: boolean
  introChant: number
  mixPattern: number
  callDensity: number
  vocalStyle: number
  melodyTemplate: number
  arrangementGrowth: number
  arpeggioSyncChord: boolean
  arpeggioBaseVelocity: number
  motifRepeatScope: number
  motifMaxChordCount: number
  melodicComplexity: number
  hookIntensity: number
  vocalGroove: number
  mood: number
  moodExplicit: boolean
  formExplicit: boolean
  driveFeel: number
  addictiveMode: boolean
  moraRhythmMode: number
  syllabicSubRate?: number
  enableSyncopation: boolean
  energyCurve: number
  melodyMaxLeap: number
  melodySyncopationProb: number
  melodyPhraseLength: number
  melodyLongNoteRatio: number
  melodyChorusRegisterShift: number
  melodyHookRepetition: number
  melodyUseLeadingTone: number
  motifLength: number
  motifNoteCount: number
  motifMotion: number
  motifRegisterHigh: number
  motifRhythmDensity: number
  chordExtProbExplicit: boolean
}
```

`createDefaultConfig(styleId)` は必須フィールドをすべて設定します。主なデフォルトは `bpm: 0`、`chordProgressionId: 255`、`arpeggioPattern: 255`、`arpeggioSpeed: 255`、`arpeggioGate: -1`、`humanize: false`、`compositionStyleExplicit: false`、`syllabicSubRate: 0` です。

### `MelodyData`

`getMelody()` が返し、`setMelody()` が受け取る保存可能な値です。

```typescript
interface MelodyData {
  seed: number
  notes: NoteInput[]
}
```

### `VocalConfig`

ボーカル再生成の設定：

```typescript
interface VocalConfig {
  seed?: number              // ランダムシード (0 = 新しいランダム)
  vocalLow?: number          // ボーカル音域下限 (MIDIノート, 36-96)
  vocalHigh?: number         // ボーカル音域上限 (MIDIノート, 36-96)
  vocalAttitude?: number     // 0=Clean, 1=Expressive, 2=Raw
  vocalStyle?: number        // ボーカルスタイルプリセット (0=自動)
  melodyTemplate?: number    // メロディテンプレート (0=自動)
  melodicComplexity?: number // 0=シンプル, 1=標準, 2=複雑
  hookIntensity?: number     // 0=オフ, 1=ライト, 2=ノーマル, 3=ストロング, 4=Maximum
  vocalGroove?: number       // 0=ストレート, 1=オフビート等
  compositionStyle?: number  // 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven
  keepMotif?: boolean        // RhythmSync限定: 既存のMotifをリズムの軸として保持 (デフォルト: false)
}
```

### `AccompanimentConfig`

伴奏生成/再生成の設定：

```typescript
interface AccompanimentConfig {
  seed?: number               // ランダムシード (0 = 自動)
  // ドラム
  drumsEnabled?: boolean
  // ギター
  guitarEnabled?: boolean     // ギタートラック有効化
  // アルペジオ
  arpeggioEnabled?: boolean
  arpeggioPattern?: number    // 0=Up, 1=Down, 2=UpDown, 3=Random, 4=Pinwheel, 5=PedalRoot, 6=Alberti, 7=BrokenChord
  arpeggioSpeed?: number      // 0=8分, 1=16分, 2=3連符
  arpeggioOctaveRange?: number // 1-3
  arpeggioGate?: number       // 0-100、または 255（スタイルのデフォルト）
  arpeggioSyncChord?: boolean
  // コード拡張
  chordExtSus?: boolean
  chordExt7th?: boolean
  chordExt9th?: boolean
  chordExtSusProb?: number    // 0.0-1.0
  chordExt7thProb?: number    // 0.0-1.0
  chordExt9thProb?: number    // 0.0-1.0
  chordExtTritoneSub?: boolean   // トライトーン代理有効化 (V7 → bII7)
  chordExtTritoneSubProb?: number // トライトーン代理確率 (0.0-1.0)
  // ヒューマナイズ
  humanize?: boolean
  humanizeTiming?: number     // 0.0-1.0
  humanizeVelocity?: number   // 0.0-1.0
  // SE/コール
  seEnabled?: boolean
  callEnabled?: boolean       // こちらは単純なboolean（callSetting は SongConfig のみ）
  callDensity?: number        // 0=なし, 1=控えめ, 2=標準, 3=高密度
  introChant?: number         // 0=なし, 1=ガチ恋, 2=シャウト
  mixPattern?: number         // 0=なし, 1=スタンダード, 2=虎火
  callNotesEnabled?: boolean
}
```

::: warning スケールが違うのは arpeggioGate だけ
`arpeggioGate` はここでは整数 `0-100`（デフォルト 80）で、`255` もスタイルのデフォルトとして受け付けます。`SongConfig` では同じ設定を `0.0-1.0` の float（`-1` はスタイル既定）で受け取ります。それ以外のパーセンテージ系フィールドは `SongConfig` と同じで、コード拡張の確率（`chordExtSusProb` 0.2、`chordExt7thProb` 0.15、`chordExt9thProb` 0.25、`chordExtTritoneSubProb` 0.5）とヒューマナイズ量（`humanizeTiming` 0.4、`humanizeVelocity` 0.3）は `0.0-1.0` の float です。範囲外の値を渡すと生成が `Invalid parameter` で失敗します。また、省略時の `guitarEnabled` は `true` です。
:::

### `PresetInfo`

`getStructures()`、`getMoods()`、`getChords()` が使うプリセット情報です。

```typescript
interface PresetInfo {
  name: string
  display?: string
  defaultBpm?: number
}
```

### `StylePresetInfo`

`getStylePresets()` が返すスタイルプリセット情報です。

```typescript
interface StylePresetInfo {
  id: number
  name: string
  displayName: string
  description: string
  tempoDefault: number
  allowedAttitudes: number
}
```

### `NoteInput`

カスタムボーカルトラック用のノート入力：

```typescript
interface NoteInput {
  startTick: number  // ノート開始時間（ティック）
  duration: number   // ノート長（ティック）
  pitch: number      // MIDIノート番号 (0-127)
  velocity: number   // ノートベロシティ (0-127)
}
```

::: details ティックについて
MIDI Sketchは時間単位として**ティック**を使用します（四分音符 = 480ティック）：
- **四分音符**: 480 ティック
- **八分音符**: 240 ティック
- **十六分音符**: 120 ティック
- **全音符**: 1920 ティック
- **1小節（4/4）**: 1920 ティック

例：2拍目（ティック480）から1拍分のノート：
```javascript
{ startTick: 480, duration: 480, pitch: 60, velocity: 100 }
```
:::

### `PianoRollInfo`

単一ティックのピアノロール安全性情報：

```typescript
interface PianoRollInfo {
  tick: number                // ティック位置
  chordDegree: number         // 現在のコード度数 (0=I, 1=ii等)
  currentKey: number          // 現在のキー (0-11、転調考慮)
  safety: NoteSafetyLevel[]   // 各MIDIノートの安全性レベル (0-127)
  reason: NoteReasonFlags[]   // 各ノートの理由フラグ (0-127)
  collision: CollisionInfo[]  // 各ノートの衝突詳細
  recommended: number[]       // 推奨ノート（優先順、最大8）
}
```

### `CollisionInfo`

BGMと衝突するノートの情報：

```typescript
interface CollisionInfo {
  trackRole: number         // 衝突トラックの役割
  collidingPitch: number    // 衝突ノートのMIDIピッチ
  intervalSemitones: number // 衝突音程（半音、1, 6, または 11）
}
```

`NoteSafetyLevel` は `NoteSafety.Safe`、`NoteSafety.Warning`、`NoteSafety.Dissonant` に対応する `0 | 1 | 2` のユニオンです。`NoteReasonFlags` は `NoteReason` の値を組み合わせられる数値ビットフィールドです。

### `ChordEvent`

生成タイムラインのコードイベント（セカンダリードミナント情報含む）：

```typescript
interface ChordEvent {
  tick: number              // 開始ティック
  endTick: number           // 終了ティック
  degree: number            // スケール度数 (0-6)
  isSecondaryDominant: boolean // セカンダリードミナント (V/x) かどうか
}
```

### `DissonanceReport`

`getDissonanceReport()` が返す和声分析結果です。

```typescript
interface DissonanceReport {
  summary: {
    total_issues: number
    simultaneous_clashes: number
    non_chord_tones: number
    sustained_over_chord_change: number
    non_diatonic_notes: number
    high_severity: number
    medium_severity: number
    low_severity: number
    key: number
    key_name: string
    modulation_tick: number
    modulation_amount: number
    pre_modulation_issues: number
    post_modulation_issues: number
  }
  issues: Array<{
    type: string
    severity: 'low' | 'medium' | 'high'
    tick: number
    bar: number
    beat: number
    [key: string]: unknown
  }>
}
```

### `EventData`

生成のイベントデータ：

```typescript
interface EventData {
  bpm: number
  division: number
  duration_ticks: number
  duration_seconds: number
  vocal_style: number
  metadata: {
    blueprint: number
    style: number
    mood: number
    seed: number
  }
  tracks: Array<{
    name: string
    channel: number
    program: number
    notes: Array<{
      pitch: number
      velocity: number
      start_ticks: number
      duration_ticks: number
      start_seconds: number
      duration_seconds: number
    }>
    textEvents?: Array<{
      tick: number
      time_seconds: number
      text: string
    }>
  }>
  sections: Array<{
    name: string
    type: string
    startTick: number
    endTick: number
    start_bar: number
    bars: number
    start_seconds: number
    end_seconds: number
  }>
  chords?: ChordEvent[]    // セカンダリードミナント情報付きコードタイムライン
  tempo_map: Array<{
    tick: number
    bpm: number
    seconds: number
  }>
}
```

### `BlueprintInfo`

Production Blueprint の情報：

```typescript
interface BlueprintInfo {
  id: number                // Blueprint ID (0-9)
  name: string              // Blueprint 名
  paradigm: GenerationParadigmType // 生成パラダイム (0-2)
  riffPolicy: RiffPolicyType        // RiffPolicy (0-4)
  weight: number            // 選択重みパーセンテージ
  tempoMin: number          // 推奨最小 BPM
  tempoMax: number          // 推奨最大 BPM
}
```

`GenerationParadigmType` は `GenerationParadigm` の値のユニオン、`RiffPolicyType` は `RiffPolicy` の値のユニオンです。
