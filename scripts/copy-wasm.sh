#!/bin/bash
set -e

MIDI_SKETCH_DIR="../midi-sketch"
DIST_DIR="$MIDI_SKETCH_DIR/dist"
DEST_DIR="src/wasm"

# Required files from dist/
WASM_FILES=("midisketch.wasm" "midisketch.js")
JS_FILES=("index.js" "index.d.ts")

echo "📦 Copying WASM files from midi-sketch..."

# Check if midi-sketch directory exists
if [ ! -d "$MIDI_SKETCH_DIR" ]; then
  echo "❌ Error: midi-sketch directory not found at $MIDI_SKETCH_DIR"
  echo "   Please clone midi-sketch in the parent directory."
  exit 1
fi

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
  echo "❌ Error: dist directory not found at $DIST_DIR"
  echo "   Run 'yarn build' in midi-sketch first."
  exit 1
fi

# Check WASM files
missing_wasm=()
for file in "${WASM_FILES[@]}"; do
  if [ ! -f "$DIST_DIR/$file" ]; then
    missing_wasm+=("$file")
  fi
done

if [ ${#missing_wasm[@]} -gt 0 ]; then
  echo "❌ Error: WASM files missing in $DIST_DIR:"
  for file in "${missing_wasm[@]}"; do
    echo "   - $file"
  done
  echo ""
  echo "   Run 'yarn build:wasm' in midi-sketch first."
  exit 1
fi

# Check JS API files
missing_js=()
for file in "${JS_FILES[@]}"; do
  if [ ! -f "$DIST_DIR/$file" ]; then
    missing_js+=("$file")
  fi
done

if [ ${#missing_js[@]} -gt 0 ]; then
  echo "❌ Error: JS API files missing in $DIST_DIR:"
  for file in "${missing_js[@]}"; do
    echo "   - $file"
  done
  echo ""
  echo "   Run 'yarn build:js' in midi-sketch first."
  echo "   (or 'yarn build' to build both WASM and JS)"
  exit 1
fi

# Copy files
echo "   Copying WASM files..."
for file in "${WASM_FILES[@]}"; do
  cp "$DIST_DIR/$file" "$DEST_DIR/"
  echo "   ✓ $file"
done

echo "   Copying JS API files..."
for file in "${JS_FILES[@]}"; do
  cp "$DIST_DIR/$file" "$DEST_DIR/"
  echo "   ✓ $file"
done

# Remove sourceMappingURL from index.js (not needed in homepage)
if [ -f "$DEST_DIR/index.js" ]; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS (BSD sed requires '' after -i)
    sed -i '' '/^\/\/# sourceMappingURL=/d' "$DEST_DIR/index.js"
  else
    # Linux (GNU sed)
    sed -i '/^\/\/# sourceMappingURL=/d' "$DEST_DIR/index.js"
  fi
fi

# Update meta.json
echo ""
./scripts/update-wasm-meta.sh

echo ""
echo "✅ WASM files copied successfully!"
