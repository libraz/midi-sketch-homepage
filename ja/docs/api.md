# API リファレンス

## モジュール関数

### `init()`

WASM モジュールを初期化します。他の関数を使用する前に呼び出す必要があります。

```javascript
await midisketch.init()
```

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
// { stylePresetId: 0, key: 0, bpm: 120, ... }
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
  stylePresetId: 0,           // スタイルプリセット ID
  key: 0,                     // キー (0-11: C から B)
  bpm: 120,                   // テンポ (0=スタイルのデフォルト)
  seed: 12345,                // ランダムシード (0=ランダム)
  chordProgressionId: 0,      // コード進行 ID
  formId: 0,                  // フォーム/構成 ID
  vocalAttitude: 0,           // 0=Clean, 1=Expressive, 2=Raw
  drumsEnabled: true,         // ドラムトラック有効化

  // アルペジオ設定
  arpeggioEnabled: false,     // アルペジオトラック有効化
  arpeggioPattern: 0,         // 0=Up, 1=Down, 2=UpDown, 3=Random
  arpeggioSpeed: 1,           // 0=8分音符, 1=16分音符, 2=3連符
  arpeggioOctaveRange: 2,     // 1-3 オクターブ
  arpeggioGate: 80,           // ゲート長 (0-100)
  arpeggioSyncChord: true,    // コードチェンジに同期

  // ボーカル設定
  vocalLow: 55,               // ボーカル音域下限 (MIDI ノート番号)
  vocalHigh: 74,              // ボーカル音域上限 (MIDI ノート番号)
  skipVocal: false,           // ボーカル生成をスキップ (BGM先行ワークフロー用)

  // ボーカル詳細設定
  vocalNoteDensity: 0,        // 音符密度 (0=スタイルデフォルト, 70=標準, 100=アイドル, 150=ボカロ)
  vocalMinNoteDivision: 0,    // 最小音符分割 (0=デフォルト, 4=4分, 8=8分, 16=16分)
  vocalRestRatio: 0,          // 休符率 (0-50, フレーズ休止時間の割合)
  vocalAllowExtremLeap: false, // 広い跳躍を許可 (ボカロスタイル用)
  vocalStyle: 0,              // ボーカルスタイルプリセット (0=自動, 1-12=特定プリセット)
  melodicComplexity: 1,       // メロディ複雑さ (0=シンプル, 1=標準, 2=複雑)
  hookIntensity: 2,           // フック強度 (0=オフ, 1=ライト, 2=ノーマル, 3=ストロング)
  vocalGroove: 0,             // グルーブ感 (0=ストレート, 1=オフビート, 2=スウィング, 3=シンコペ, 4=16分ドライブ, 5=バウンス8分)

  // ヒューマナイズ
  humanize: true,             // ヒューマナイズ有効化
  humanizeTiming: 50,         // タイミング変動 (0-100)
  humanizeVelocity: 50,       // ベロシティ変動 (0-100)

  // コード拡張
  chordExtSus: false,         // sus2/sus4 コード有効化
  chordExt7th: false,         // 7th コード有効化
  chordExt9th: false,         // 9th コード有効化
  chordExtSusProb: 20,        // sus コード確率 (0-100)
  chordExt7thProb: 30,        // 7th コード確率 (0-100)
  chordExt9thProb: 25,        // 9th コード確率 (0-100)

  // 作曲スタイル
  compositionStyle: 0,        // 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven

  // 尺
  targetDurationSeconds: 0,   // 目標尺 (0=formIdに従う)

  // 転調設定
  modulationTiming: 0,        // 0=なし, 1=ラスサビ, 2=ブリッジ後, 3=各サビ, 4=ランダム
  modulationSemitones: 1,     // 転調量 (+1〜+4半音)

  // コール/SE設定 (アイドル系楽曲用)
  seEnabled: false,           // SEトラック有効化
  callEnabled: false,         // コール機能有効化
  callNotesEnabled: false,    // コールをノートとして出力
  introChant: 0,              // 0=なし, 1=ガチ恋, 2=シャウト
  mixPattern: 0,              // 0=なし, 1=スタンダード, 2=虎火
  callDensity: 0,             // 0=なし, 1=控えめ, 2=標準, 3=高密度

  // アレンジメント設定
  arrangementGrowth: 0,       // 0=LayerAdd (楽器追加), 1=RegisterAdd (音域拡大)

  // モチーフ設定
  motifRepeatScope: 0,        // 0=FullSong (同一モチーフ), 1=Section (セクション別)
  motifFixedProgression: true, // 全セクションで同じコード進行を使用
  motifMaxChordCount: 0,      // 最大コード数 (0=制限なし, 2-8)
})
```

### `regenerateVocal(params)`

ボーカルトラックのみを再生成します。BGM トラック（コード、ベース、ドラム、アルペジオ）は変更されません。
BGM先行ワークフローでは `generateFromConfig()` の `skipVocal: true` と組み合わせて使用します。

```javascript
sketch.regenerateVocal({
  seed: 0,                     // ランダムシード (0=新しいランダム)
  vocalLow: 55,                // ボーカル音域下限 (MIDI ノート番号)
  vocalHigh: 74,               // ボーカル音域上限 (MIDI ノート番号)
  vocalAttitude: 1,            // 0=Clean, 1=Expressive, 2=Raw

  // オプション: ボーカル生成の微調整
  vocalStyle: 0,               // ボーカルスタイルプリセット (0=自動, 1-12=特定プリセット)
  vocalNoteDensity: 100,       // 音符密度 (0=スタイルデフォルト, 70=標準, 100=アイドル, 150=ボカロ)
  vocalMinNoteDivision: 8,     // 最小音符分割 (0=デフォルト, 4=4分, 8=8分, 16=16分)
  vocalRestRatio: 20,          // 休符率 (0-50, フレーズ休止時間の割合)
  vocalAllowExtremLeap: false, // 広い跳躍を許可 (ボカロスタイル用)
})
```

### `getMidi()`

生成された MIDI データを `Uint8Array` として返します。

```javascript
const midiData = sketch.getMidi()
```

### `getEvents()`

可視化/再生用のイベントデータを返します。

```javascript
const events = sketch.getEvents()
// { sections: [...], tracks: [...], bpm: 120, duration_ticks: ... }
```

### `destroy()`

リソースをクリーンアップします。

```javascript
sketch.destroy()
```

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
  vocalLow: 55,
  vocalHigh: 74,
  vocalAttitude: 1,
})

const midiData = sketch.getMidi()
```

## 定数

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
```

### `MelodicComplexity`

```javascript
MelodicComplexity.Simple   // 0 - 音程変化の少ないシンプルなメロディ
MelodicComplexity.Standard // 1 - 標準的な複雑さ
MelodicComplexity.Complex  // 2 - より大きな音程差とバリエーション
```

### `HookIntensity`

```javascript
HookIntensity.Off    // 0 - フック反復なし
HookIntensity.Light  // 1 - 控えめなフック
HookIntensity.Normal // 2 - 標準的なフック反復（デフォルト）
HookIntensity.Strong // 3 - 強いフック、キャッチー重視
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
