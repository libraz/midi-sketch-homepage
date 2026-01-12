#!/bin/bash
WASM_FILE="src/wasm/midisketch.wasm"
META_FILE="src/wasm/meta.json"

if [ -f "$WASM_FILE" ]; then
  SIZE=$(stat -c%s "$WASM_FILE")
  SIZE_KB=$((SIZE / 1024))
  GZIP_SIZE=$(gzip -c "$WASM_FILE" | wc -c)
  GZIP_KB=$((GZIP_SIZE / 1024))
  MD5=$(md5sum "$WASM_FILE" | cut -d' ' -f1)

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
  "md5": "$MD5"
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
else
  echo "❌ WASM file not found: $WASM_FILE"
  exit 1
fi
