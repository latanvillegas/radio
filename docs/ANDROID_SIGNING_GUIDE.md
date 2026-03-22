# Guía de Configuración de Firma Digital para APK Android

> **Esquema de firma:** APK Signature Scheme V2 + V3 (RSA-2048, 10000 días de validez)  
> **Secrets necesarios:** `KEYSTORE_BASE64` · `KEY_ALIAS` · `KEY_PASSWORD`

Esta guía explica cómo generar el keystore de producción, codificarlo para GitHub Actions y verificar la firma V2/V3 antes de publicar en Google Play Console.

## 📋 Requisitos previos

- Java Development Kit (JDK) 17+
- Android SDK Tools
- `keytool` (incluido en JDK)
- Acceso a tu repositorio de GitHub

## 🔐 Paso 1: Generar el Keystore

El keystore es un archivo que contiene tu clave privada para firmar APKs.

### Opción A: Crear un nuevo keystore (Primera vez)

```bash
keytool -genkey -v -keystore android-keystore.jks \
  -alias radio_satelital \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass tu_contraseña_store \
  -keypass tu_contraseña_clave
```

**Parámetros:**
- `-alias radio_satelital`: Alias único para tu clave (usa un nombre significativo)
- `-validity 10000`: Válido por ~27 años
- `-storepass`: Contraseña para acceder al keystore
- `-keypass`: Contraseña para la clave dentro del keystore

**Ejemplo interactivo:**

```bash
keytool -genkey -v -keystore android-keystore.jks -alias radio_satelital -keyalg RSA -keysize 2048 -validity 10000
```

Esto te pedirá información como:
- Nombre y apellido: Nombre del desarrollador
- Unidad organizativa: Departamento (ej: Development)
- Organización: Nombre de tu empresa/proyecto
- Ciudad: Ciudad
- Estado: Estado/Provincia
- Código de país: Código ISO (ej: MX para México)

**⚠️ IMPORTANTE:** Guarda bien esta contraseña. Sin ella no podrás firmar nuevas versiones.

### Verificar el keystore creado

```bash
keytool -list -v -keystore android-keystore.jks
```

Esto mostrará los detalles de tu keystore incluyendo el fingerprint SHA256.

## 🔄 Paso 2: Codificar el Keystore a Base64

GitHub Actions necesita el keystore en formato base64 para utilizarlo.

### En Linux/macOS:

```bash
cat android-keystore.jks | base64 > keystore.txt
```

O para copiar directamente:

```bash
base64 -i android-keystore.jks | tr -d '\n' | xclip -selection clipboard
```

### En Windows (PowerShell):

```powershell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("C:\ruta\android-keystore.jks")) | Set-Clipboard
```

## 🔑 Paso 3: Configurar Secretos en GitHub

1. Ve a tu repositorio: **https://github.com/latanvillegas/Radio_Satelital**
2. Click en **Settings** (Configuración)
3. En el menú izquierdo: **Secrets and variables** → **Actions**
4. Click en **New repository secret**

### Secretos requeridos (3 en total):

| Secret | Descripción | Valor |
|--------|-------------|-------|
| `KEYSTORE_BASE64` | Keystore en Base64 (una línea, sin saltos) | Contenido de `keystore.txt` |
| `KEY_ALIAS` | Alias de la clave dentro del keystore | Ej: `radio_satelital` |
| `KEY_PASSWORD` | Contraseña del keystore y de la clave | La contraseña que usaste con `-storepass` |

> **Nota de seguridad:** Usa la **misma contraseña** para `storepass` y `keypass` para simplificar  
> la configuración en GitHub Actions (un solo secret `KEY_PASSWORD` cubre ambos).

#### 1. KEYSTORE_BASE64 (REQUERIDO)
- Valor: contenido completo del archivo `keystore.txt` generado en el paso 2
- El workflow lo decodifica a un archivo temporal y lo elimina de forma segura con `shred`

#### 2. KEY_ALIAS (REQUERIDO)
- El alias usado al generar el keystore (`-alias` en el comando keytool)
- Ejemplo: `radio_satelital`

#### 3. KEY_PASSWORD (REQUERIDO)
- Contraseña para acceder al keystore y a la clave
- Ejemplo: `Mi_Contraseña_Segura_2024!`

## 📝 Paso 4: Verificar la Configuración en GitHub Actions

Una vez configurados los secretos, el workflow automáticamente:

1. Decodificará el keystore desde `ANDROID_KEYSTORE_BASE64`
2. Compilará el APK
3. Firmará el APK con `jarsigner`
4. Verificará la firma del APK
5. Subirá el APK firmado como artifact

### Monitorear el proceso:

1. Ve a tu repositorio
2. Click en **Actions**
3. Selecciona el último workflow
4. Observa los pasos en "Build Android APK"

## ✅ Paso 5: Verificar la Firma V2/V3 Localmente

El APK generado por el workflow usa **APK Signature Scheme V2 + V3** (V1 desactivado).  
Usa `apksigner` (parte de Android SDK Build-Tools) para verificar correctamente:

### Verificar esquema V2/V3 con apksigner:

```bash
# Ruta típica en Linux/macOS
APKSIGNER=$ANDROID_SDK_ROOT/build-tools/34.0.0/apksigner

$APKSIGNER verify --verbose --print-certs RadioSatelital-v9.5-release-signed.apk
```

Salida esperada:
```
Verifies
Verified using v1 scheme (JAR signing): false
Verified using v2 scheme (APK Signature Scheme v2): true
Verified using v3 scheme (APK Signature Scheme v3): true
Number of signers: 1
Signer #1 certificate DN: CN=..., OU=..., O=Radio Satelital, ...
Signer #1 certificate SHA-256 digest: <fingerprint-sha256>
```

### Ver fingerprint SHA-256 del certificado:

```bash
keytool -printcert -jarfile RadioSatelital-v9.5-release-signed.apk
```

> **Nota:** `jarsigner -verify` solo valida V1 (JAR signing). Para V2/V3 usa **siempre** `apksigner verify`.

## 🚀 Compilar y Firmar Localmente

Si quieres compilar localmente sin usar GitHub Actions:

```bash
# En la raíz del proyecto
bash scripts/with-java21.sh ./android/gradlew -p android :app:assembleRelease --no-daemon
```

Para firmar el APK generado:

```bash
# Encontrar el APK generado
APK=$(find android/app/build/outputs/apk -name "*.apk" | head -1)

# Firmar con jarsigner
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore android-keystore.jks \
  -storepass $KEYSTORE_PASSWORD \
  -keypass $KEY_PASSWORD \
  "$APK" radio_satelital

# Verificar la firma
jarsigner -verify -verbose -certs "$APK"
```

## 🏪 Subir a Google Play Store

Una vez que tu APK esté firmado:

1. Ve a **Google Play Console** (https://play.google.com/console)
2. Selecciona tu aplicación
3. Ve a **Release** → **Production** → **New release**
4. Sube el APK firmado
5. Completa los detalles de la versión y publica

## 🔍 Troubleshooting

### Error: "Certificate already used for signing"
Si recibiste: `keytool error: java.lang.Exception: Alias already exists`

ya existe un alias en tu keystore. Usa otro nombre o lista los alias:
```bash
keytool -list -keystore android-keystore.jks
```

### Error: "Signature does not verify"
- Verifica que usaste la contraseña correcta
- Asegúrate de que el keystore no fue modificado
- Regenera el keystore si es necesario

### Error: "keystore.jks not found"
- El archivo debe estar en el directorio del workflow
- Verifica que `ANDROID_KEYSTORE_BASE64` esté configurado correctamente

### El APK se genera sin firmar
- Verifica que los secretos `KEYSTORE_PASSWORD` y `KEY_PASSWORD` estén configurados
- Revisa los logs del workflow en GitHub Actions

## 📚 Referencias

- [Android App Signing Documentation](https://developer.android.com/studio/publish/app-signing)
- [keytool Reference](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/keytool.html)
- [jarsigner Tool](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/jarsigner.html)

## ⚠️ Notas de Seguridad

1. **Nunca** hagas commit del archivo `android-keystore.jks` en git
   ```
   echo "android-keystore.jks" >> .gitignore
   ```

2. **Nunca** publiques tu keystore.txt o contraseñas en código

3. **Guarda copias de seguridad** del keystore en un lugar seguro:
   ```bash
   cp android-keystore.jks ~/backups/android-keystore-backup.jks
   ```

4. Los secretos de GitHub están encriptados y solo accesibles por los workflows

5. Si tu keystore se comprometió, deberás crear uno nuevo y cambiar la versión de tu app en Google Play Store

## ✨ Checklist Final

- [ ] Keystore generado con `keytool`
- [ ] Keystore convertido a base64
- [ ] Secretos configurados en GitHub
- [ ] Archivo `android-keystore.jks` agregado a `.gitignore`
- [ ] Workflow `.github/workflows/android-build.yml` presente
- [ ] Primera compilación ejecutada en rama `version-nativa`
- [ ] APK descargado desde GitHub Actions
- [ ] Firma verificada localmente con `jarsigner -verify`
- [ ] APK listo para Google Play Store

---

**Última actualización:** Febrero 2026
**Stack actual:** Android nativo Kotlin
**Versión de Android SDK:** 34
**Java Version:** 17+
