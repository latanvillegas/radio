#!/bin/bash

################################################################################
# Script de configuración inicial para Android SDK
# Descripción: Acepta licencias y configura variables de entorno
################################################################################

set -e

ANDROID_HOME="${ANDROID_HOME:-/opt/android}"
SDKMANAGER="${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager"

echo "==========================================="
echo "Android SDK - Aceptación de Licencias"
echo "==========================================="
echo ""

if [ ! -x "$SDKMANAGER" ]; then
    echo "Error: sdkmanager no encontrado en $SDKMANAGER"
    exit 1
fi

echo "Aceptando licencias del Android SDK..."
yes | "$SDKMANAGER" --licenses > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Licencias aceptadas exitosamente"
else
    echo "✓ Licencias procesadas (algunos avisos pueden ser ignorados)"
fi

echo ""
echo "Configuración de ANDROID_HOME:"
echo "ANDROID_HOME=$ANDROID_HOME"
echo ""

echo "Componentes instalados:"
"$SDKMANAGER" --list_installed 2>/dev/null | head -20

echo ""
echo "==========================================="
echo "Configuración completada"
echo "==========================================="
