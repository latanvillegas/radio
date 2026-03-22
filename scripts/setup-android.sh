#!/bin/bash

# Script de configuración completa para Android nativo (Kotlin + Jetpack Compose)
# Este script prepara el proyecto para compilación Android con Gradle.

set -e  # Salir si hay error

ANDROID_PROJECT_DIR="android"

echo "🚀 Iniciando configuración Android nativa..."

# 1. Verificar dependencias
echo "📋 Verificando dependencias..."

if ! command -v java &> /dev/null; then
    echo "❌ Java no está instalado"
    exit 1
fi

if ! command -v gradle &> /dev/null && [ ! -x "${ANDROID_PROJECT_DIR}/gradlew" ]; then
    echo "❌ Gradle no está disponible (ni wrapper ni gradle global)"
    exit 1
fi

# 2. Verificar Android SDK
if [ -z "${ANDROID_HOME}" ] && [ -z "${ANDROID_SDK_ROOT}" ]; then
    echo "⚠️  ANDROID_HOME/ANDROID_SDK_ROOT no está configurado."
    echo "    Se recomienda exportar ANDROID_HOME=/opt/android"
fi

# 3. Verificar módulo Android
if [ ! -d "${ANDROID_PROJECT_DIR}" ]; then
    echo "❌ No se encontró el proyecto Android en ${ANDROID_PROJECT_DIR}"
    exit 1
fi

# 4. Mostrar estado de la configuración
echo "✅ Verificación de configuración:"
echo ""
echo "📋 Archivos verificados:"
[ -f "${ANDROID_PROJECT_DIR}/settings.gradle" ] && echo "  ✅ settings.gradle" || echo "  ❌ settings.gradle (falta)"
[ -f "${ANDROID_PROJECT_DIR}/app/build.gradle.kts" ] && echo "  ✅ app/build.gradle.kts" || echo "  ❌ app/build.gradle.kts (falta)"
[ -f "${ANDROID_PROJECT_DIR}/gradlew" ] && echo "  ✅ gradlew" || echo "  ⚠️ gradlew (falta, se usará gradle global)"
[ -f "${ANDROID_PROJECT_DIR}/app/src/main/AndroidManifest.xml" ] && echo "  ✅ AndroidManifest.xml" || echo "  ❌ AndroidManifest.xml (falta)"

echo ""
echo "📦 Java/Gradle:"
java -version 2>&1 | head -1
if [ -x "${ANDROID_PROJECT_DIR}/gradlew" ]; then
    "${ANDROID_PROJECT_DIR}/gradlew" -p "${ANDROID_PROJECT_DIR}" --version | head -3
else
    gradle --version | head -3
fi

echo ""
echo "🎯 Próximos pasos:"
echo "1. Verifica Android SDK en ANDROID_HOME/ANDROID_SDK_ROOT"
echo "2. Compila debug con: ./build.sh build"
echo "3. O compila release con: make release"
echo "4. Ejecuta tests con: make test"
echo ""
echo "✨ Configuración completada!"
