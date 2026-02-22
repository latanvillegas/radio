#!/bin/bash

# Script para generar y configurar el signing del APK Android para Radio Satelital
# Uso: ./generate-android-signing.sh

set -e

echo "🔐 Generador de Signing para Android - Radio Satelital"
echo "=================================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si keytool está disponible
if ! command -v keytool &> /dev/null; then
    echo -e "${RED}❌ Error: keytool no encontrado. Instala Java Development Kit (JDK).${NC}"
    exit 1
fi

# Valores por defecto
KEYSTORE_FILE="android-keystore.jks"
ALIAS="radio_satelital"
VALIDITY="10000"

echo "📋 Información del Keystore"
echo "---"

# Solicitar información del usuario
read -p "Nombre del archivo keystore [$KEYSTORE_FILE]: " input_file
KEYSTORE_FILE="${input_file:-$KEYSTORE_FILE}"

read -p "Alias para la clave [$ALIAS]: " input_alias
ALIAS="${input_alias:-$ALIAS}"

read -p "Validez en días [$VALIDITY]: " input_validity
VALIDITY="${input_validity:-$VALIDITY}"

echo ""
echo "👤 Información Personal"
echo "---"
read -p "Nombre completo (ej: Juan Pérez): " full_name
read -p "Unidad organizativa (ej: Development): " org_unit
read -p "Organización (ej: Radio Satelital): " org_name
read -p "Ciudad: " city
read -p "Estado/Provincia (ej: CDMX): " state
read -p "Código de país ISO (ej: MX): " country

echo ""
echo "🔑 Contraseñas"
echo "---"
read -sp "Contraseña del keystore: " storepass
echo ""
read -sp "Repetir contraseña del keystore: " storepass_confirm
echo ""

if [ "$storepass" != "$storepass_confirm" ]; then
    echo -e "${RED}❌ Las contraseñas no coinciden.${NC}"
    exit 1
fi

read -sp "Contraseña de la clave: " keypass
echo ""
read -sp "Repetir contraseña de la clave: " keypass_confirm
echo ""

if [ "$keypass" != "$keypass_confirm" ]; then
    echo -e "${RED}❌ Las contraseñas no coinciden.${NC}"
    exit 1
fi

# Verificar si el archivo ya existe
if [ -f "$KEYSTORE_FILE" ]; then
    echo -e "${YELLOW}⚠️  El archivo $KEYSTORE_FILE ya existe.${NC}"
    read -p "¿Deseas sobrescribirlo? (s/n): " overwrite
    if [ "$overwrite" != "s" ]; then
        echo "Operación cancelada."
        exit 0
    fi
fi

echo ""
echo "🔄 Generando keystore..."
echo "---"

# Generar el keystore
keytool -genkey -v -keystore "$KEYSTORE_FILE" \
    -alias "$ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity "$VALIDITY" \
    -storepass "$storepass" \
    -keypass "$keypass" \
    -dname "CN=$full_name,OU=$org_unit,O=$org_name,L=$city,ST=$state,C=$country"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al generar el keystore.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Keystore generado exitosamente${NC}"

# Verificar el keystore
echo ""
echo "📋 Verificando keystore..."
keytool -list -v -keystore "$KEYSTORE_FILE" -storepass "$storepass"

# Codificar a base64
echo ""
echo "🔄 Codificando keystore a base64..."
BASE64_FILE="${KEYSTORE_FILE%.jks}.txt"
base64 -i "$KEYSTORE_FILE" | tr -d '\n' > "$BASE64_FILE"

echo -e "${GREEN}✅ Keystore codificado a: $BASE64_FILE${NC}"

# Mostrar información de GitHub Secrets
echo ""
echo "🐙 GitHub Secrets a configurar"
echo "=================================="
echo ""
echo "1. Ve a: https://github.com/latanvillegas/Radio_Satelital/settings/secrets/actions"
echo ""
echo "2. Crea los siguientes secretos:"
echo ""
echo "   📌 Secret 1: ANDROID_KEYSTORE_BASE64"
echo "   Valor: (Contenido de $BASE64_FILE)"
echo ""
echo "   📌 Secret 2: KEYSTORE_PASSWORD"
echo "   Valor: $storepass"
echo ""
echo "   📌 Secret 3: KEY_PASSWORD"
echo "   Valor: $keypass"
echo ""

# Opción para copiar al portapapeles
if command -v xclip &> /dev/null; then
    echo ""
    read -p "¿Deseas copiar el contenido base64 al portapapeles? (s/n): " copy_clipboard
    if [ "$copy_clipboard" = "s" ]; then
        cat "$BASE64_FILE" | xclip -selection clipboard
        echo -e "${GREEN}✅ Contenido copiado al portapapeles${NC}"
    fi
fi

# Agregar a .gitignore
echo ""
echo "🔒 Configurando .gitignore..."
if ! grep -q "android-keystore.jks" .gitignore 2>/dev/null; then
    echo "android-keystore.jks" >> .gitignore
    echo -e "${GREEN}✅ Keystore agregado a .gitignore${NC}"
else
    echo "✓ Keystore ya en .gitignore"
fi

if ! grep -q "*.txt" .gitignore 2>/dev/null; then
    echo "*.txt" >> .gitignore
    echo "   (para proteger archivos base64)"
fi

# Crear archivo README con instrucciones
echo ""
echo "📝 Generando archivo de instrucciones..."

cat > SIGNING_README.txt << EOF
🔐 Radio Satelital - Signing Configuration
==========================================

Archivos generados:
- $KEYSTORE_FILE: Tu keystore privado (NO HAGAS COMMIT)
- $BASE64_FILE: Keystore codificado (PRIVADO, no compartir)

✅ Próximos pasos:

1. Configura los 3 secrets en GitHub:
   https://github.com/latanvillegas/Radio_Satelital/settings/secrets/actions

   ANDROID_KEYSTORE_BASE64 = (contenido de $BASE64_FILE)
   KEYSTORE_PASSWORD = "$storepass"
   KEY_PASSWORD = "$keypass"

2. Haz un commit de los cambios en .gitignore:
   git add .gitignore
   git commit -m "Add Android signing configuration"

3. Haz push a la rama version-nativa:
   git push origin version-nativa

4. El workflow compilará y firmará automáticamente tu APK.

⚠️  SEGURIDAD:
- NO hagas commit de $KEYSTORE_FILE
- NO publiques $BASE64_FILE
- Guarda una copia de seguridad de $KEYSTORE_FILE en un lugar seguro
- Si pierdes el keystore, no podrás firmar nuevas versiones de tu app

📚 Más información: docs/ANDROID_SIGNING_GUIDE.md

Generado: $(date)
EOF

echo -e "${GREEN}✅ Instrucciones guardadas en: SIGNING_README.txt${NC}"

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 ¡Configuración completada!${NC}"
echo "=================================================="
echo ""
echo "Pasos finales:"
echo "1. Revisa SIGNING_README.txt para confirmación"
echo "2. Configura los 3 secrets en GitHub"
echo "3. Haz una modificación y push a version-nativa"
echo "4. Tu APK será compilado y firmado automáticamente"
echo ""
