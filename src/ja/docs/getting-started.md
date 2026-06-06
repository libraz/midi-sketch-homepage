# はじめに

MIDI Sketch は、ポップミュージックの MIDI スケッチを自動生成する軽量ライブラリです。WebAssembly を使用してブラウザ上で動作します。

::: tip 音楽理論が初めての方へ
コード進行・キー・モチーフといった用語に馴染みがなければ、まず[コース](/ja/docs/course/primer)から始めてください。MidiSketchの各設定の背景にある音楽の基礎を、再生できる譜例つきで解説しています。
:::

## クイックスタート

::: warning ベータ版
npm パッケージはまだ公開されていません。ベータ期間中は[デモページ](/ja/)からライブラリをご利用いただくか、ソースからビルドしてください。詳細は[インストール](./installation)を参照してください。
:::

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
| **Chord** | 1 | ボイスリーディング付きハーモニーバッキング |
| **Bass** | 2 | アプローチノート付きベースライン |
| **Motif** | 3 | バックグラウンドパターン（BackgroundMotifスタイル） |
| **Arpeggio** | 4 | シンセアルペジオ（SynthDrivenスタイル） |
| **Aux** | 5 | 副旋律サポート（パルスループ、グルーブアクセント） |
| **Guitar** | 6 | 伴奏ギター（デフォルトで有効） |
| **Drums** | 9 | フィル付きリズムパターン（GMドラム） |
| **SE** | 15 | セクションマーカー |

::: info トラックの生成条件
すべてのトラックがすべてのスタイルで生成されるわけではありません：
- **Motif** トラック: `BackgroundMotif` コンポジションスタイルのみ
- **Arpeggio** トラック: `arpeggioEnabled: true` の場合のみ（`SynthDriven` スタイルでも手動で有効化が必要）
- **Guitar** トラック: デフォルトで有効（`guitarEnabled: true`）。無効にするには `guitarEnabled: false`
- **Vocal/Aux**: `skipVocal: true` でBGMのみ生成可能
:::

## 次のステップ

- [インストール](./installation) - ライブラリのインストール
- [JavaScript API](./api-js) - JavaScript/WASM API ドキュメント
- [C++ API](./api-cpp) - C++/C API ドキュメント
