#!/bin/bash
WASM_FILE=".vitepress/theme/wasm/midisketch.wasm"
META_FILE=".vitepress/theme/wasm/meta.json"

if [ -f "$WASM_FILE" ]; then
  SIZE=$(stat -c%s "$WASM_FILE")
  SIZE_KB=$((SIZE / 1024))
  GZIP_SIZE=$(gzip -c "$WASM_FILE" | wc -c)
  GZIP_KB=$((GZIP_SIZE / 1024))

  cat > "$META_FILE" << EOF
{
  "size": $SIZE,
  "sizeKB": $SIZE_KB,
  "gzipSize": $GZIP_SIZE,
  "gzipKB": $GZIP_KB
}
EOF
  echo "Updated $META_FILE: ${SIZE_KB}KB (${GZIP_KB}KB gzipped)"
else
  echo "WASM file not found: $WASM_FILE"
  exit 1
fi
