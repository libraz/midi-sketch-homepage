# Installation

## Supported Environments

| Target | Requirement | Verified in CI |
|---|---|---|
| Node.js | 16.0.0 or later (`engines` in `package.json`) | Node 22 on Ubuntu |
| Browser | WebAssembly and ES modules | No |
| C++ | C++17 compiler, CMake 3.15 or later | GCC on Ubuntu |
| WASM build | Emscripten (`emcmake`), version not pinned | No |

The WebAssembly module is linked with `MODULARIZE`, `EXPORT_ES6` and `ALLOW_MEMORY_GROWTH`. It does not use WASM threads or SIMD, so any browser that can load an ES module and instantiate WebAssembly can run it — no cross-origin isolation headers are required.

Building from source is currently the only route (see the beta note below). CI builds and tests the native C++ target on `ubuntu-latest`; it does not build the WASM target, so the Emscripten version that produces the published artifacts is not fixed by the pipeline. If `yarn build:wasm` fails, check the Emscripten version first.

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
