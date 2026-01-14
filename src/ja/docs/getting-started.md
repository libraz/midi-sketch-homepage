# はじめに

MIDI Sketch は、ポップミュージックの MIDI スケッチを自動生成する軽量ライブラリです。WebAssembly を使用してブラウザ上で動作します。

## クイックスタート

```javascript
import { MidiSketch, init, createDefaultConfig, downloadMidi } from '@libraz/midi-sketch'

// WASM モジュールを初期化
await init()

// インスタンスを作成
const sketch = new MidiSketch()

// スタイルプリセット用の設定を作成 (0 = 最初のスタイル)
const config = createDefaultConfig(0)

// 必要に応じてカスタマイズ
config.key = 0           // キー (0 = C)
config.bpm = 120         // テンポ (0 = スタイルのデフォルト)
config.seed = 12345      // ランダムシード (0 = ランダム)

// MIDI を生成
sketch.generateFromConfig(config)

// MIDI データを取得
const midiData = sketch.getMidi()

// ファイルをダウンロード
downloadMidi(midiData, 'my-song.mid')
```

## 生成されるトラック

MIDI Sketch は以下のマルチトラック MIDI ファイルを生成します：

| トラック | チャンネル | 説明 |
|----------|-----------|------|
| **Vocal** | 0 | メインメロディ（ピアノロールセーフ） |
| **Aux** | 5 | 副旋律サポート（パルスループ、グルーブアクセント） |
| **Chord** | 2 | ボイスリーディング付きハーモニーバッキング |
| **Bass** | 3 | アプローチノート付きベースライン |
| **Drums** | 9 | フィル付きリズムパターン（GMドラム） |
| **Motif** | 4 | バックグラウンドパターン（BackgroundMotifスタイル） |
| **Arpeggio** | 5 | シンセアルペジオ（SynthDrivenスタイル） |
| **SE** | 15 | セクションマーカー |

::: info トラックの生成条件
すべてのトラックがすべてのスタイルで生成されるわけではありません：
- **Motif** トラック: `BackgroundMotif` コンポジションスタイルのみ
- **Arpeggio** トラック: `arpeggioEnabled: true` または `SynthDriven` スタイルのみ
- **Vocal/Aux**: `skipVocal: true` でBGMのみ生成可能
:::

## 次のステップ

- [インストール](./installation) - ライブラリのインストール
- [JavaScript API](./api-js) - JavaScript/WASM API ドキュメント
- [C++ API](./api-cpp) - C++/C API ドキュメント
