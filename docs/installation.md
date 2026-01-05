# Installation

::: warning Alpha Version
This package is currently in alpha and not yet published to npm. For now, please build from source or use the demo on this site.
:::

## Package Manager

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

## Browser Usage

```html
<script type="module">
import midisketch from 'midi-sketch'

await midisketch.init()
const sketch = new midisketch.MidiSketch()
// ...
</script>
```

## Bundler Configuration

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

WASM files need to be served correctly. Ensure your configuration handles `.wasm` files appropriately.
