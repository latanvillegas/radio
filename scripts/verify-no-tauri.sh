#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

TARGETS=(
  "android/src"
  "public"
  "build.sh"
  "Makefile"
  "package.json"
)

EXCLUDE_GLOBS=(
  "!**/build/**"
  "!**/.gradle/**"
  "!node_modules/**"
)

# Detecta referencias ejecutables/configurables de Tauri/Rust en el flujo activo.
PATTERN='@tauri-apps|src-tauri|cargo tauri|npm run tauri|pnpm tauri|yarn tauri|tauri\.conf\.json|withGlobalTauri|window\.__TAURI__'

if command -v rg >/dev/null 2>&1; then
  if rg -n -i "$PATTERN" "${TARGETS[@]}" --glob "${EXCLUDE_GLOBS[0]}" --glob "${EXCLUDE_GLOBS[1]}" --glob "${EXCLUDE_GLOBS[2]}"; then
    echo "ERROR: Se detectaron referencias legacy de Tauri/Rust en archivos activos de build/runtime."
    exit 1
  fi
else
  FOUND=0
  while IFS= read -r -d '' file; do
    if grep -n -i -E "$PATTERN" "$file"; then
      FOUND=1
    fi
  done < <(find "${TARGETS[@]}" -type f \
    ! -path "*/build/*" \
    ! -path "*/.gradle/*" \
    ! -path "*/node_modules/*" -print0 2>/dev/null)

  if [[ "$FOUND" -eq 1 ]]; then
    echo "ERROR: Se detectaron referencias legacy de Tauri/Rust en archivos activos de build/runtime."
    exit 1
  fi
fi

echo "OK: No se detectaron referencias legacy de Tauri/Rust en el flujo Kotlin nativo."
