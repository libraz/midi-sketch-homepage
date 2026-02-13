#!/bin/bash
WASM_FILE="src/wasm/midisketch.wasm"
META_FILE="src/wasm/meta.json"
MIDI_SKETCH_DIR="../midi-sketch"

if [ -f "$WASM_FILE" ]; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    SIZE=$(stat -f%z "$WASM_FILE")
    MD5=$(md5 -q "$WASM_FILE")
  else
    # Linux
    SIZE=$(stat -c%s "$WASM_FILE")
    MD5=$(md5sum "$WASM_FILE" | cut -d' ' -f1)
  fi
  SIZE_KB=$((SIZE / 1024))
  GZIP_SIZE=$(gzip -c "$WASM_FILE" | wc -c)
  GZIP_KB=$((GZIP_SIZE / 1024))

  # Get build date (ISO 8601)
  BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Get commit hash from midi-sketch repo
  COMMIT_HASH=""
  if [ -d "$MIDI_SKETCH_DIR/.git" ]; then
    COMMIT_HASH=$(git -C "$MIDI_SKETCH_DIR" rev-parse --short HEAD)
  fi

  # Get old MD5 if meta.json exists
  OLD_MD5=""
  if [ -f "$META_FILE" ]; then
    OLD_MD5=$(grep -o '"md5": *"[^"]*"' "$META_FILE" | cut -d'"' -f4)
  fi

  cat > "$META_FILE" << EOF
{
  "size": $SIZE,
  "sizeKB": $SIZE_KB,
  "gzipSize": $GZIP_SIZE,
  "gzipKB": $GZIP_KB,
  "md5": "$MD5",
  "buildDate": "$BUILD_DATE",
  "commitHash": "$COMMIT_HASH"
}
EOF

  # Compare MD5 and show result
  if [ -z "$OLD_MD5" ]; then
    echo "✨ Created $META_FILE: ${SIZE_KB}KB (${GZIP_KB}KB gzipped)"
    echo "   MD5: $MD5"
  elif [ "$OLD_MD5" = "$MD5" ]; then
    echo "📦 No change: WASM is identical (${SIZE_KB}KB)"
    echo "   MD5: $MD5"
  else
    echo "🔄 Updated: WASM has changed!"
    echo "   Old: $OLD_MD5"
    echo "   New: $MD5"
    echo "   Size: ${SIZE_KB}KB (${GZIP_KB}KB gzipped)"
  fi
  echo "   Build: $BUILD_DATE"
  [ -n "$COMMIT_HASH" ] && echo "   Commit: $COMMIT_HASH"
else
  echo "❌ WASM file not found: $WASM_FILE"
  exit 1
fi
