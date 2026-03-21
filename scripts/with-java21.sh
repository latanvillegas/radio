#!/usr/bin/env bash
set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "Uso: $0 <comando...>"
  exit 1
fi

java_major() {
  local java_bin="$1/bin/java"
  if [[ ! -x "$java_bin" ]]; then
    return 1
  fi

  local version_line
  version_line="$($java_bin -version 2>&1 | head -n 1)"
  local version
  version="$(echo "$version_line" | sed -n 's/.*"\([0-9][0-9]*\)\..*/\1/p')"

  if [[ -z "$version" ]]; then
    return 1
  fi

  echo "$version"
}

pick_java21_home() {
  local candidates=()

  if [[ -n "${JAVA_HOME:-}" ]]; then
    candidates+=("$JAVA_HOME")
  fi

  if [[ -d "/usr/local/sdkman/candidates/java" ]]; then
    while IFS= read -r dir; do
      candidates+=("$dir")
    done < <(find /usr/local/sdkman/candidates/java -mindepth 1 -maxdepth 1 -type d | sort)
  fi

  if [[ -d "$HOME/java" ]]; then
    while IFS= read -r dir; do
      candidates+=("$dir")
    done < <(find "$HOME/java" -mindepth 1 -maxdepth 1 -type d | sort)
  fi

  for home in "${candidates[@]}"; do
    local major
    if major="$(java_major "$home" 2>/dev/null)"; then
      if [[ "$major" == "21" ]]; then
        echo "$home"
        return 0
      fi
    fi
  done

  return 1
}

if selected_home="$(pick_java21_home)"; then
  export JAVA_HOME="$selected_home"
  export PATH="$JAVA_HOME/bin:$PATH"
  echo "Usando JAVA_HOME=$JAVA_HOME"
else
  current_major=""
  if [[ -n "${JAVA_HOME:-}" ]]; then
    current_major="$(java_major "$JAVA_HOME" 2>/dev/null || true)"
  fi

  if [[ -z "$current_major" ]]; then
    current_major="$(java -version 2>&1 | head -n 1 | sed -n 's/.*"\([0-9][0-9]*\)\..*/\1/p' || true)"
  fi

  if [[ "$current_major" =~ ^[0-9]+$ ]] && (( current_major >= 25 )); then
    echo "Error: se requiere Java 21 para compilacion Android con esta configuracion."
    echo "Instala/activa JDK 21 y reintenta."
    exit 1
  fi
fi

exec "$@"
