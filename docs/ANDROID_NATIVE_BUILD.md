# Compilación de Android Nativo - Radio Satelital (Kotlin + Jetpack Compose)

## ℹ️ Descripción

Este documento describe cómo compilar **Radio Satelital** como una aplicación Android nativa 100% Kotlin + Jetpack Compose, **sin dependencias del stack legado de escritorio**.

El proyecto ahora prioriza desarrollo nativo con:
- **Lenguaje:** Kotlin 
- **UI Framework:** Jetpack Compose Material3
- **Base de Datos Local:** Room / SQLite
- **Build System:** Gradle
- **Rama de desarrollo:** `Radio-nativa-klotin`

---

## 📋 Requisitos

### Mínimos
- **JDK 21** (OpenJDK o Temurin)
- **Android SDK** con:
  - Platform API 36 (Android 14+)
  - Build Tools 34+
  - NDK 27+ (opcional, solo si usas librerías nativas)
- **Gradle** 8.14+ (incluido en el wrapper)

### Opcionales
- **Android Studio** para desarrollo interactivo
- **Detekt** para análisis estático de Kotlin
- **Docker** para compilación aislada

---

## 🚀 Compilación Rápida

### 1. Verificar Entorno

```bash
java -version                 # Debe ser JDK 21
echo $ANDROID_HOME            # Debe apuntar a Android SDK
./android/gradlew --version   # Verifica Gradle
```

### 2. Compilar APK Debug

```bash
./build.sh build
```

O usando Gradle directo:

```bash
cd android
./gradlew :app:assembleDebug --no-daemon
```

El APK se genera en: `android/app/build/outputs/apk/debug/app-debug.apk`

### 3. Compilar APK Release

```bash
make release
```

O con Gradle:

```bash
cd android
./gradlew :app:assembleRelease --no-daemon
```

---

## 🔧 Compilación Detallada

### 1. Clonar Repositorio

```bash
git clone https://github.com/latanvillegas/Radio-Satelital.git
cd Radio-Satelital
git checkout Radio-nativa-klotin
```

### 2. Configurar Variables de Entorno

```bash
export ANDROID_HOME=/path/to/android-sdk    # Tu ruta del SDK
export JAVA_HOME=/path/to/jdk-21            # Tu ruta JDK 21
export PATH="$JAVA_HOME/bin:$PATH"
```

Verificar:

```bash
java -version
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --version
```

### 3. Instalar Dependencias del SDK (si faltan)

```bash
sdkmanager "platforms;android-36" "platforms;android-34" \
           "build-tools;34.0.0" "platform-tools"
```

### 4. Compilar con Contraseña Segura (Release)

Para firmar el APK release:

```bash
# 1. Crear keystore (si no lo tienes)
keytool -genkey -v -keystore release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias "radio-satelital"

# 2. Copiar keystore a directorio seguro
mv release.keystore ~/.android/

# 3. Configurar build.gradle.kts (ver sección abajo)

# 4. Compilar
cd android
./gradlew :app:assembleRelease --no-daemon
```

---

## 🔐 Firma de APK Release

### Opción 1: Via build.gradle.kts (Recomendado)

En `android/app/build.gradle.kts`:

```kotlin
android {
  signingConfigs {
    create("release") {
      storeFile = file(System.getenv("KEYSTORE_FILE") ?: "~/.android/release.keystore")
      storePassword = System.getenv("KEYSTORE_PASS")
      keyAlias = System.getenv("KEY_ALIAS")
      keyPassword = System.getenv("KEY_PASSWORD")
    }
  }

  buildTypes {
    release {
      signingConfig = signingConfigs.getByName("release")
    }
  }
}
```

Compilar con variables:

```bash
export KEYSTORE_FILE="$HOME/.android/release.keystore"
export KEYSTORE_PASS="tu-contraseña"
export KEY_ALIAS="radio-satelital"
export KEY_PASSWORD="tu-contraseña-key"

cd android
./gradlew :app:assembleRelease --no-daemon
```

### Opción 2: Línea de Comandos (Manual)

```bash
APK="android/app/build/outputs/apk/release/app-release-unsigned.apk"

$ANDROID_SDK_ROOT/build-tools/34.0.0/apksigner sign \
  --ks ~/.android/release.keystore \
  --ks-pass pass:tu-contraseña \
  --key-pass pass:tu-contraseña-key \
  --v2-signing-enabled true \
  --v3-signing-enabled true \
  --out app-release-signed.apk \
  "$APK"
```

Verificar firma:

```bash
$ANDROID_SDK_ROOT/build-tools/34.0.0/apksigner verify \
  --verbose --print-certs app-release-signed.apk
```

---

## 🏗️ Estructura del Proyecto

```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/online/latanvillegas/radiosatelital/
│   │   │   │   ├── MainActivity.kt           # Activity principal (Compose)
│   │   │   │   ├── RadioForegroundService.kt # Servicio nativo de audio
│   │   │   │   ├── presentation/
│   │   │   │   │   ├── screens/RadioScreen.kt  # UI principal
│   │   │   │   │   └── viewmodels/
│   │   │   │   ├── domain/
│   │   │   │   │   ├── models/
│   │   │   │   │   ├── repositories/
│   │   │   │   │   └── usecases/
│   │   │   │   ├── data/
│   │   │   │   │   ├── local/          # Room Database
│   │   │   │   │   └── remote/         # Supabase (opcional)
│   │   │   │   └── ...
│   │   │   ├── AndroidManifest.xml
│   │   │   └── res/
│   │   │       ├── layout/
│   │   │       ├── values/
│   │   │       └── ...
│   │   └── test/
│   ├── build.gradle.kts
│   └── ...
├── build.gradle.kts
├── settings.gradle
├── gradlew
└── gradle/
```

---

## ✅ Verificar Build

### Debug APK

```bash
file android/app/build/outputs/apk/debug/app-debug.apk
unzip -l android/app/build/outputs/apk/debug/app-debug.apk | head -20
```

### Release APK Firmado

```bash
file app-release-signed.apk
$ANDROID_SDK_ROOT/build-tools/34.0.0/apksigner verify --verbose app-release-signed.apk
```

---

## 🐛 Troubleshooting

### Error: "Unsupported JVM version"

**Solución:** Asegurar JDK 21

```bash
java -version
export JAVA_HOME=/path/to/jdk-21
```

### Error: "SDK location not found"

**Solución:** Crear `android/local.properties`

```bash
cat > android/local.properties << EOF
sdk.dir=${ANDROID_HOME}
ndk.dir=${ANDROID_HOME}/ndk/27.0.11718014
EOF
```

### Error: "Gradle daemon memory"

**Solución:** Aumentar límite en `~/.gradle/gradle.properties`

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

### Build timeout en CI/CD

**Solución:** Usar cache de Gradle en GitHub Actions

```yaml
- uses:  gradle/actions/setup-gradle@v3
  with:
    cache-read-only: false
```

---

## 📦 Distribución

### Flujo Oficial (Debug -> Release -> Publicación)

1. Build y validación local:
  ```bash
  ./scripts/with-java21.sh ./android/gradlew -p android :app:lintDebug :app:testDebugUnitTest :app:assembleDebug --no-daemon
  ```
2. Build de release y bundle:
  ```bash
  ./scripts/with-java21.sh ./android/gradlew -p android :app:assembleRelease :app:bundleRelease --no-daemon
  ```
3. Validación de firma y checksum:
  ```bash
  BT_VERSION="$(ls "$ANDROID_SDK_ROOT/build-tools" | sort -V | tail -1)"
  "$ANDROID_SDK_ROOT/build-tools/$BT_VERSION/apksigner" verify --verbose --print-certs android/app/build/outputs/apk/release/app-release.apk
  sha256sum android/app/build/outputs/apk/release/*.apk android/app/build/outputs/bundle/release/*.aab
  ```
4. Publicación de artefactos en CI:
  - APK release
  - AAB release
  - SHA256SUMS

### Checklist Prepublicación

- Lint en verde
- Tests unitarios en verde
- Build debug y release exitosos
- Firma verificada con apksigner
- Checksum generado y archivado
- Notas de versión actualizadas
- PR aprobado en rama Radio-nativa-klotin

### Rollback Operativo

1. Identifica el último artefacto estable (run anterior en GitHub Actions).
2. Reetiqueta release estable en GitHub Releases.
3. Revert de commit en rama de release si fue incidente de código:
  ```bash
  git revert <commit>
  git push origin Radio-nativa-klotin
  ```
4. Reejecuta workflow release para publicar binario corregido.

### Upload a Google Play Store

1. Crear cuenta de desarrollador en [Google Play Console](https://play.google.com/console)
2. Crear aplicación
3. Upload del APK firmado (release):
   ```bash
  ./scripts/with-java21.sh ./android/gradlew -p android :app:assembleRelease --no-daemon
   ```
4. Completar metadatos (descripciones, capturas)
5. Publicar

### Upload a GitHub Releases

```bash
gh release create v9.6 app-release-signed.apk \
  --title "Radio Satelital v9.6" \
  --notes "APK nativo Kotlin + Compose"
```

---

## 🔄 CI/CD - GitHub Actions

Ver `.github/workflows/android.yml` para builds automáticos en cada push a `Radio-nativa-klotin`.

Secretos necesarios para release firmado:
- `KEYSTORE_BASE64`: Contenido del keystore en base64
- `KEY_ALIAS`: Alias de la clave privada
- `KEY_PASSWORD`: Contraseña de la clave

---

## 📚 Referencias

- [Kotlin Documentation](https://kotlinlang.org/docs)
- [Jetpack Compose Guide](https://developer.android.com/jetpack/compose)
- [Room Database](https://developer.android.com/training/data-storage/room)
- [Gradle Android Plugin](https://developer.android.com/studio/releases/gradle-plugin)
- [Android NDK](https://developer.android.com/ndk) (si usas librerías C++)

---

## ⚠️ Notas Importantes

- **Stack legado retirado:** Cualquier instrucción antigua de desktop/híbrido es **obsoleta**.
- **Rama principal:** Desarrollo en `Radio-nativa-klotin`. La rama `main` puede tener código web (PWA).
- **Base de datos remota:** Supabase es opcional; usa Room para persistencia local pura.
- **Java 21:** Requerido por AGP 8.11+. No es retrocompatible con Java 17.

---

**Última actualización:** Marzo 22, 2026  
**Mantenedor:** Radio Satelital Team
