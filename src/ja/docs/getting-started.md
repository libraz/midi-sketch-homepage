# はじめに

::: warning アルファ版
このパッケージは現在アルファ版であり、npmには未公開です。現時点ではソースからビルドするか、このサイトのデモをご利用ください。
:::

MIDI Sketch は、ポップミュージックの MIDI スケッチを自動生成する軽量ライブラリです。WebAssembly を使用してブラウザ上で動作します。

## クイックスタート

```javascript
import { MidiSketch, init, createDefaultConfig, downloadMidi } from 'midi-sketch'

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

- **Vocal** - メインメロディ
- **Chord** - ハーモニーバッキング
- **Bass** - ベースライン
- **Drums** - リズムパターン
- **Motif** - バックグラウンドの反復パターン
- **Arpeggio** - シンセアルペジオパターン

## 次のステップ

- [インストール](./installation) - ライブラリのインストール
- [API リファレンス](./api) - 完全な API ドキュメント
