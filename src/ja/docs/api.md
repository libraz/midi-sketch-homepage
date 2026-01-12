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

  // ボーカルスタイル設定
  vocalStyle: 0,              // ボーカルスタイルプリセット (0=自動, 1-12=特定プリセット)
  melodyTemplate: 0,          // メロディテンプレート (0=自動, 1-7=特定テンプレート)
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

ボーカルトラック（およびAuxトラック）のみを再生成します。BGM トラック（コード、ベース、ドラム、アルペジオ）は変更されません。
BGM先行ワークフローでは `generateFromConfig()` の `skipVocal: true` と組み合わせて使用します。

```javascript
sketch.regenerateVocal({
  seed: 0,                     // ランダムシード (0=新しいランダム)
  vocalLow: 55,                // ボーカル音域下限 (MIDI ノート番号)
  vocalHigh: 74,               // ボーカル音域上限 (MIDI ノート番号)
  vocalAttitude: 1,            // 0=Clean, 1=Expressive, 2=Raw

  // オプション: ボーカル生成の微調整
  vocalStyle: 0,               // ボーカルスタイルプリセット (0=自動, 1-12=特定プリセット)
  melodyTemplate: 0,           // メロディテンプレート (0=自動, 1-7=特定テンプレート)
  melodicComplexity: 1,        // メロディ複雑さ (0=シンプル, 1=標準, 2=複雑)
  hookIntensity: 2,            // フック強度 (0=オフ, 1=ライト, 2=ノーマル, 3=ストロング)
  vocalGroove: 0,              // グルーブ感 (0=ストレート, 1=オフビート, 2=スウィング等)
  compositionStyle: 0,         // 作曲スタイル (0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven)
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

### `generateVocal(config)`

伴奏なしでボーカルトラックのみを生成します。試行錯誤ワークフロー用：ボーカル生成→プレビュー→必要に応じて再生成。ボーカルに満足したら `generateAccompaniment()` を呼び出します。

```javascript
sketch.generateVocal({
  stylePresetId: 0,
  key: 0,
  bpm: 120,
  seed: 0,
  chordProgressionId: 0,
  formId: 0,
  vocalLow: 55,
  vocalHigh: 74,
  vocalAttitude: 1,
  // ... その他のSongConfigオプション
})
```

### `generateAccompaniment(config?)`

既存のボーカルに対して伴奏トラックを生成します。`generateVocal()` または `setVocalNotes()` の後に呼び出す必要があります。生成順序：Aux → Bass → Chord → Drums（ボーカルに適応）

```javascript
// シンプル：デフォルト設定を使用
sketch.generateAccompaniment()

// 設定付き
sketch.generateAccompaniment({
  seed: 12345,                // ランダムシード (0 = 自動)
  drumsEnabled: true,
  arpeggioEnabled: false,
  arpeggioPattern: 0,         // 0=Up, 1=Down, 2=UpDown, 3=Random
  arpeggioSpeed: 1,           // 0=8分, 1=16分, 2=3連符
  arpeggioOctaveRange: 2,
  arpeggioGate: 80,
  arpeggioSyncChord: true,
  chordExtSus: false,
  chordExt7th: false,
  chordExt9th: false,
  humanize: true,
  humanizeTiming: 50,
  humanizeVelocity: 50,
  seEnabled: false,
  callEnabled: false,
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

ボーカル優先で全トラックを生成します。生成順序：Vocal → Aux → Bass → Chord → Drums。伴奏がボーカルメロディに適応します。

```javascript
sketch.generateWithVocal({
  stylePresetId: 0,
  key: 0,
  bpm: 120,
  seed: 0,
  // ... その他のSongConfigオプション
})
```

### `setVocalNotes(config, notes)`

伴奏生成用にカスタムボーカルノートを設定します。configから曲構成とコード進行を初期化し、提供されたノートでボーカルトラックを置き換えます。この後に `generateAccompaniment()` を呼び出します。

```javascript
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

ティック範囲のピアノロール安全性情報を取得します。ピアノロールエディタで時間経過に伴う安全なノートを可視化するのに便利です。

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

## ボーカル先行ワークフロー

ボーカルを先に生成し、プレビュー、反復、その後伴奏を生成：

```javascript
const sketch = new midisketch.MidiSketch()
const config = midisketch.createDefaultConfig(0)

// ステップ1: ボーカルのみ生成
sketch.generateVocal(config)

// プレビューして満足するまで反復...
sketch.regenerateVocal({ seed: 12345, vocalAttitude: 2 })

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

### `MelodyTemplate`

```javascript
MelodyTemplate.Auto         // 0 - VocalStylePresetに基づいて自動選択
MelodyTemplate.PlateauTalk  // 1 - 同音保持率が高い (NewJeans、Billie Eilish)
MelodyTemplate.RunUpTarget  // 2 - ターゲットに向かって上昇 (YOASOBI、Ado)
MelodyTemplate.DownResolve  // 3 - 下降解決 (Bセクション)
MelodyTemplate.HookRepeat   // 4 - 短いフック反復 (TikTok、K-POP)
MelodyTemplate.SparseAnchor // 5 - 疎なアンカー音 (バラード)
MelodyTemplate.CallResponse // 6 - デュエット風コールアンドレスポンス
MelodyTemplate.JumpAccent   // 7 - 感情的ピークの跳躍
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

### `NoteSafety`

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
  hookIntensity?: number     // 0=オフ, 1=ライト, 2=ノーマル, 3=ストロング
  vocalGroove?: number       // 0=ストレート, 1=オフビート等
  compositionStyle?: number  // 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven
}
```

### `AccompanimentConfig`

伴奏生成/再生成の設定：

```typescript
interface AccompanimentConfig {
  seed?: number               // ランダムシード (0 = 自動)
  // ドラム
  drumsEnabled?: boolean
  // アルペジオ
  arpeggioEnabled?: boolean
  arpeggioPattern?: number    // 0=Up, 1=Down, 2=UpDown, 3=Random
  arpeggioSpeed?: number      // 0=8分, 1=16分, 2=3連符
  arpeggioOctaveRange?: number // 1-3
  arpeggioGate?: number       // 0-100
  arpeggioSyncChord?: boolean
  // コード拡張
  chordExtSus?: boolean
  chordExt7th?: boolean
  chordExt9th?: boolean
  chordExtSusProb?: number    // 0-100
  chordExt7thProb?: number    // 0-100
  chordExt9thProb?: number    // 0-100
  // ヒューマナイズ
  humanize?: boolean
  humanizeTiming?: number     // 0-100
  humanizeVelocity?: number   // 0-100
  // SE/コール
  seEnabled?: boolean
  callEnabled?: boolean
  callDensity?: number        // 0=控えめ, 1=ライト, 2=標準, 3=高密度
  introChant?: number         // 0=なし, 1=ガチ恋, 2=ミックス
  mixPattern?: number         // 0=なし, 1=スタンダード, 2=虎火
  callNotesEnabled?: boolean
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
