#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

EXCLUDE_DIRS=(
  ".git"
  ".gradle"
  "android/build"
  "android/app/build"
  ".android-sdk"
  "node_modules"
)

EXCLUDE_ARGS=()
for dir in "${EXCLUDE_DIRS[@]}"; do
  EXCLUDE_ARGS+=("--glob" "!${dir}/**")
done

PATTERN='tauri|@tauri-apps|src-tauri|cargo build|cargo run|tauri\.conf\.json'

if command -v rg >/dev/null 2>&1; then
  if rg -n -i "$PATTERN" . "${EXCLUDE_ARGS[@]}"; then
    echo "ERROR: Se detectaron referencias legacy de Tauri/Rust en archivos activos."
    exit 1
  fi
else
  if grep -R -n -i -E "$PATTERN" . >/dev/null 2>&1; then
    echo "ERROR: Se detectaron referencias legacy de Tauri/Rust en archivos activos."
    exit 1
  fi
fi

echo "OK: No se detectaron referencias legacy de Tauri/Rust."
