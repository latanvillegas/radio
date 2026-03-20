#!/usr/bin/env bash

set -euo pipefail

ACTION="${1:-build}"
shift || true

if [[ "${ACTION}" != "build" && "${ACTION}" != "dev" ]]; then
  echo "Uso: scripts/tauri-android.sh [build|dev] [args...]"
  exit 1
fi

find_sdk_root() {
  local candidates=()

  if [[ -n "${ANDROID_HOME:-}" ]]; then candidates+=("${ANDROID_HOME}"); fi
  if [[ -n "${ANDROID_SDK_ROOT:-}" ]]; then candidates+=("${ANDROID_SDK_ROOT}"); fi
  candidates+=("${HOME}/Android/Sdk" "${HOME}/Android")

  local c
  for c in "${candidates[@]}"; do
    [[ -n "${c}" ]] || continue
    if [[ -d "${c}" && ( -d "${c}/platforms" || -d "${c}/cmdline-tools" || -d "${c}/build-tools" ) ]]; then
      echo "${c}"
      return 0
    fi
  done

  return 1
}

find_ndk_root() {
  local sdk_root="$1"

  if [[ -n "${NDK_HOME:-}" && -d "${NDK_HOME}" ]]; then
    echo "${NDK_HOME}"
    return 0
  fi

  if [[ -n "${ANDROID_NDK_HOME:-}" && -d "${ANDROID_NDK_HOME}" ]]; then
    echo "${ANDROID_NDK_HOME}"
    return 0
  fi

  local latest

  # NDK moderno dentro del SDK
  if [[ -d "${sdk_root}/ndk" ]]; then
    latest="$(find "${sdk_root}/ndk" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -n 1 || true)"
    if [[ -n "${latest}" && -d "${latest}" ]]; then
      echo "${latest}"
      return 0
    fi
  fi

  # Layout alterno visto en este entorno: ~/Android/ndk/<ver>/android-ndk-rXX
  if [[ -d "${HOME}/Android/ndk" ]]; then
    latest="$(find "${HOME}/Android/ndk" -type d -name "android-ndk-r*" | sort -V | tail -n 1 || true)"
    if [[ -n "${latest}" && -d "${latest}" ]]; then
      echo "${latest}"
      return 0
    fi

    latest="$(find "${HOME}/Android/ndk" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -n 1 || true)"
    if [[ -n "${latest}" && -d "${latest}" ]]; then
      echo "${latest}"
      return 0
    fi
  fi

  return 1
}

ensure_compat_ndk_path() {
  local sdk_root="$1"
  local detected_ndk="$2"
  local preferred_version="${TAURI_NDK_VERSION:-29.0.13846066}"
  local compat_base="${sdk_root}/ndk"
  local compat_path="${compat_base}/${preferred_version}"

  mkdir -p "${compat_base}"

  if [[ ! -d "${compat_path}" ]]; then
    ln -sfn "${detected_ndk}" "${compat_path}"
  fi

  echo "${compat_path}"
}

SDK_ROOT="$(find_sdk_root || true)"
if [[ -z "${SDK_ROOT}" ]]; then
  echo "Error: no se encontró Android SDK."
  echo "Instala Android SDK/Command-line tools y reintenta."
  exit 1
fi

NDK_ROOT="$(find_ndk_root "${SDK_ROOT}" || true)"
if [[ -z "${NDK_ROOT}" ]]; then
  echo "Error: no se encontró Android NDK válido."
  echo "SDK detectado: ${SDK_ROOT}"
  echo "Instala NDK con sdkmanager y reintenta."
  exit 1
fi

NDK_COMPAT_PATH="$(ensure_compat_ndk_path "${SDK_ROOT}" "${NDK_ROOT}")"

export ANDROID_HOME="${SDK_ROOT}"
export ANDROID_SDK_ROOT="${SDK_ROOT}"
export NDK_HOME="${NDK_COMPAT_PATH}"
export ANDROID_NDK_HOME="${NDK_COMPAT_PATH}"
export NDK_ROOT="${NDK_COMPAT_PATH}"

# Gradle/Android actualmente no es compatible con Java 25 en este proyecto.
# Forzamos JDK 21 si está disponible para evitar: "Unsupported class file major version 69".
if [[ -d "/usr/local/sdkman/candidates/java/21.0.9-ms" ]]; then
  export JAVA_HOME="/usr/local/sdkman/candidates/java/21.0.9-ms"
  export PATH="${JAVA_HOME}/bin:${PATH}"
  export ORG_GRADLE_JAVA_HOME="${JAVA_HOME}"
fi

echo "Android SDK: ${ANDROID_SDK_ROOT}"
echo "Android NDK detectado: ${NDK_ROOT}"
echo "Android NDK compat: ${NDK_HOME}"
echo "Java Home: ${JAVA_HOME:-$(command -v java)}"

echo "Ejecutando: tauri android ${ACTION} $*"
npx tauri android "${ACTION}" "$@"
