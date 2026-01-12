# Installation

## Package Manager

::: warning BETA
The npm package is not yet published. During the beta period, please use the library via the [demo page](/) or build from source.
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

## Browser Usage

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

## Bundler Configuration

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

WASM files need to be served correctly. Ensure your configuration handles `.wasm` files appropriately.
