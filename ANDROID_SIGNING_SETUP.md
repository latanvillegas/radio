# 🔐 Configuración de Firma Digital - Quick Start

## 📦 Archivos creados/actualizados

1. **`.github/workflows/android-build.yml`** - Workflow de GitHub Actions con soporte para firmado
2. **`docs/ANDROID_SIGNING_GUIDE.md`** - Guía completa de configuración
3. **`scripts/generate-android-signing.sh`** - Script para generar el keystore automáticamente

## 🚀 Inicio rápido

### Paso 1: Generar el Keystore

Ejecuta el script (en Linux/macOS):

```bash
chmod +x scripts/generate-android-signing.sh
./scripts/generate-android-signing.sh
```

El script te pedirá:
- Información personal (nombre, empresa, país)
- Contraseñas del keystore

Esto generará:
- `android-keystore.jks` - Tu keystore privado
- `android-keystore.txt` - Versión base64 codificada

### Paso 2: Configurar Secretos en GitHub

Ve a: `https://github.com/latanvillegas/Radio_Satelital/settings/secrets/actions`

Crea 3 secretos:

| Nombre | Valor |
|--------|-------|
| `ANDROID_KEYSTORE_BASE64` | Contenido de `android-keystore.txt` |
| `KEYSTORE_PASSWORD` | La contraseña que usaste |
| `KEY_PASSWORD` | La contraseña de la clave |

### Paso 3: Activar el Workflow

```bash
# Commit de cambios
git add .gitignore SIGNING_README.txt
git commit -m "Add Android signing configuration"

# Push a la rama version-nativa
git push origin version-nativa
```

El workflow se ejecutará automáticamente al detectar el push.

## 📱 Verificar el APK Firmado

Después de que termine el workflow:

1. Ve a **Actions** en GitHub
2. Selecciona la última ejecución
3. Descarga el artifact `android-apk`
4. Verifica localmente:

```bash
jarsigner -verify -verbose -certs Radio_Satelital.apk
```

Salida esperada:
```
jar verified
```

## ⚠️ Seguridad Importante

```bash
# NO hagas commit de estos archivos:
echo "android-keystore.jks" >> .gitignore
echo "*.txt" >> .gitignore
echo "SIGNING_README.txt" >> .gitignore
```

## 📚 Documentación Completa

Para más detalles, consulta: **[docs/ANDROID_SIGNING_GUIDE.md](docs/ANDROID_SIGNING_GUIDE.md)**

## 🛠️ Troubleshooting

Si el APK se genera sin firmar:
1. Verifica que los 3 secretos estén configurados en GitHub
2. Revisa los logs del workflow en Actions
3. Asegúrate de usar las contraseñas correctas

---

**Configuración completada** ✅
