# はじめに

::: warning アルファ版
このパッケージは現在アルファ版であり、npmには未公開です。現時点ではソースからビルドするか、このサイトのデモをご利用ください。
:::

MIDI Sketch は、ポップミュージックの MIDI スケッチを自動生成する軽量ライブラリです。WebAssembly を使用してブラウザ上で動作します。

## クイックスタート

```javascript
import midisketch from 'midi-sketch'

// WASM モジュールを初期化
await midisketch.init()

// インスタンスを作成
const sketch = new midisketch.MidiSketch()

// MIDI を生成
sketch.generate({
  structureId: 0,  // 曲構成
  moodId: 0,       // ムードプリセット
  chordId: 0,      // コード進行
  key: 0,          // キー (0 = C)
  bpm: 120         // テンポ
})

// MIDI データを取得
const midiData = sketch.getMidi()

// ファイルをダウンロード
midisketch.downloadMidi(midiData, 'my-song.mid')
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
