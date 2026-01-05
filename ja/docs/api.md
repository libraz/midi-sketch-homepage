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

### `generate(params)`

指定されたパラメータで MIDI を生成します。

```javascript
sketch.generate({
  structureId: 0,              // 曲構成パターン (0-10)
  moodId: 0,                   // ムードプリセット (0-19)
  chordId: 0,                  // コード進行 (0-21)
  key: 0,                      // キー (0-11: C から B)
  bpm: 120,                    // テンポ (60-180, 0=デフォルト)
  seed: 12345,                 // ランダムシード (0=自動)
  drumsEnabled: true,          // ドラムトラックを有効化
  targetDurationSeconds: 0,    // 目標尺 (0=構成に従う, 60-300秒)
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
// { sections: [...], tracks: [...], bpm: 120, totalTicks: ... }
```

### `regenerateMelody(seed?)`

メロディトラックのみを再生成します。

```javascript
sketch.regenerateMelody() // 新しいランダムシード
sketch.regenerateMelody(42) // 特定のシード
```

### `regenerateMelodyEx(params)`

メロディトラックのみを完全なパラメータ制御で再生成します。BGM トラックは変更されません。

```javascript
sketch.regenerateMelodyEx({
  seed: 0,               // ランダムシード (0=新しいランダム)
  vocalLow: 55,          // ボーカル音域下限 (MIDI ノート番号)
  vocalHigh: 74,         // ボーカル音域上限 (MIDI ノート番号)
  vocalAttitude: 1,      // 0=Clean, 1=Expressive, 2=Raw
  compositionStyle: 0,   // 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven
})
```

### `generateFromConfig(config)`

SongConfig オブジェクトから MIDI を生成します。

```javascript
sketch.generateFromConfig({
  stylePresetId: 0,
  key: 0,
  bpm: 120,
  seed: 12345,
  chordProgressionId: 0,
  formId: 0,
  vocalAttitude: 0,
  drumsEnabled: true,
  arpeggioEnabled: false,
  vocalLow: 55,
  vocalHigh: 74,
  humanize: true,
  humanizeTiming: 50,
  humanizeVelocity: 50,
  targetDurationSeconds: 0,
})
```

### `destroy()`

リソースをクリーンアップします。

```javascript
sketch.destroy()
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
