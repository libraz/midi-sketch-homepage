# インストール

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
