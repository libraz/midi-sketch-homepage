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

  // ボーカル設定
  vocalLow: 55,               // ボーカル音域下限 (MIDI ノート番号)
  vocalHigh: 74,              // ボーカル音域上限 (MIDI ノート番号)
  skipVocal: false,           // ボーカル生成をスキップ (BGM先行ワークフロー用)

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
})
```

### `regenerateVocal(params)`

ボーカルトラックのみを再生成します。BGM トラック（コード、ベース、ドラム、アルペジオ）は変更されません。
BGM先行ワークフローでは `generateFromConfig()` の `skipVocal: true` と組み合わせて使用します。

```javascript
sketch.regenerateVocal({
  seed: 0,               // ランダムシード (0=新しいランダム)
  vocalLow: 55,          // ボーカル音域下限 (MIDI ノート番号)
  vocalHigh: 74,         // ボーカル音域上限 (MIDI ノート番号)
  vocalAttitude: 1,      // 0=Clean, 1=Expressive, 2=Raw
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
