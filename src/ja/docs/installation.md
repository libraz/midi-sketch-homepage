# インストール

::: warning アルファ版
このパッケージは現在アルファ版であり、npmには未公開です。現時点ではソースからビルドするか、このサイトのデモをご利用ください。
:::

## パッケージマネージャー

::: code-group

```bash [npm]
npm install midi-sketch
```

```bash [yarn]
yarn add midi-sketch
```

```bash [pnpm]
pnpm add midi-sketch
```

:::

## ブラウザでの使用

```html
<script type="module">
import midisketch from 'midi-sketch'

await midisketch.init()
const sketch = new midisketch.MidiSketch()
// ...
</script>
```

## バンドラー設定

### Vite

```javascript
// vite.config.js
export default {
  optimizeDeps: {
    exclude: ['midi-sketch']
  }
}
```

### Webpack

WASM ファイルを正しく配信する必要があります。`.wasm` ファイルを適切に処理する設定を行ってください。
