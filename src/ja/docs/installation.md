# インストール

## 動作環境

| 対象 | 要件 | CI での検証 |
|---|---|---|
| Node.js | 16.0.0 以降（`package.json` の `engines`） | Ubuntu 上の Node 22 |
| ブラウザ | WebAssembly と ES モジュール | なし |
| C++ | C++17 対応コンパイラ、CMake 3.15 以降 | Ubuntu 上の GCC |
| WASM ビルド | Emscripten（`emcmake`）、バージョンの固定なし | なし |

WebAssembly モジュールは `MODULARIZE`・`EXPORT_ES6`・`ALLOW_MEMORY_GROWTH` でリンクしています。WASM スレッドと SIMD は使っていないため、ES モジュールを読み込めて WebAssembly をインスタンス化できるブラウザであれば動作します。クロスオリジン分離のヘッダーは不要です。

現状はソースからのビルドが唯一の導入方法です（下のベータ注記を参照）。CI は `ubuntu-latest` でネイティブの C++ ターゲットをビルドしてテストしますが、WASM ターゲットはビルドしません。配布物を生成する Emscripten のバージョンはパイプラインで固定されていないので、`yarn build:wasm` が失敗したらまず Emscripten のバージョンを確認してください。

## パッケージマネージャー

::: warning ベータ版
npm パッケージはまだ公開されていません。ベータ期間中は[デモページ](/ja/)からライブラリをご利用いただくか、ソースからビルドしてください。
:::

::: code-group

```bash [npm]
npm install @libraz/midi-sketch
```

```bash [yarn]
yarn add @libraz/midi-sketch
```

```bash [pnpm]
pnpm add @libraz/midi-sketch
```

:::

## ブラウザでの使用

```html
<script type="module">
import { init, MidiSketch, createDefaultConfig } from '@libraz/midi-sketch'

await init()
const sketch = new MidiSketch()
const config = createDefaultConfig(0)
sketch.generateFromConfig(config)
const midi = sketch.getMidi()
// ...
</script>
```

## バンドラー設定

### Vite

```javascript
// vite.config.js
export default {
  optimizeDeps: {
    exclude: ['@libraz/midi-sketch']
  }
}
```

### Webpack

WASM ファイルを正しく配信する必要があります。`.wasm` ファイルを適切に処理する設定を行ってください。
