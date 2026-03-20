# Android Fase 2 - Checklist de Build y Verificacion

Esta guia deja un flujo estable para compilar y probar la reproduccion nativa en segundo plano (MediaSession + ExoPlayer).

## 1) Versiones recomendadas

- Java: 17 o 21 (LTS)
- Node.js: 20+
- Rust: estable (cargo disponible)
- Android SDK: platform-tools, platforms;android-34, build-tools;34.0.0
- Android NDK: 27.0.12077973

Nota: con Java 25 puede fallar Gradle/Groovy con "Unsupported class file major version 69".

## 2) Variables de entorno (Linux)

Agregar al shell (ejemplo en ~/.bashrc):

```bash
export ANDROID_HOME="$HOME/Android"
export ANDROID_SDK_ROOT="$HOME/Android"
export NDK_HOME="$HOME/Android/ndk/27.0.12077973"
export PATH="$HOME/.cargo/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
```

Aplicar en la sesion actual:

```bash
source ~/.bashrc
```

## 3) Validacion rapida de entorno

```bash
java -version
cargo --version
sdkmanager --version
adb version
```

## 4) Instalar SDK/NDK (si falta)

```bash
yes | sdkmanager --licenses
sdkmanager --install "platform-tools" "platforms;android-34" "build-tools;34.0.0" "ndk;27.0.12077973"
```

Si Tauri no detecta el NDK por `source.properties`, verificar:

```bash
test -f "$NDK_HOME/source.properties" && echo "NDK OK" || echo "NDK incompleto"
```

## 5) Inicializar Android (solo primera vez)

Desde la raiz del repo:

```bash
npm install
npm run tauri android init
```

Importante para este repositorio:

- Se versiona solo un subconjunto minimo de `src-tauri/gen/android` para mantener PR limpio.
- Si clonas desde cero, ejecuta `npm run tauri android init` antes de compilar para regenerar el arbol base.
- Luego aplica/usa los archivos versionados de Fase 2 (Activity, Service, Manifest y build.gradle.kts).

## 6) Compilar APK debug

```bash
npm run tauri android build -- --debug
```

## 7) Instalar en dispositivo

Con dispositivo/emulador conectado:

```bash
adb install -r src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk
```

## 8) Pruebas funcionales de Fase 2

1. Abrir app y reproducir una emisora.
2. Salir al home: el audio debe seguir.
3. Confirmar notificacion multimedia persistente.
4. Bloquear pantalla: deben aparecer controles en lockscreen.
5. Probar play/pause desde notificacion y lockscreen.
6. Reabrir app y verificar que el estado visual no quede desfasado.

## 9) Si el audio se corta aun

- Excluir la app de optimizacion de bateria en Android.
- Revisar permisos de notificaciones del sistema.
- Probar otra emisora (algunas URLs cierran stream por user-agent o concurrencia).
- Revisar logs:

```bash
adb logcat | grep -i "RadioForegroundService\|ExoPlayer\|MediaSession"
```

## 10) Archivos clave de esta fase

- src-tauri/gen/android/app/src/main/java/online/latanvillegas/radiosatelital/RadioForegroundService.kt
- src-tauri/gen/android/app/src/main/java/online/latanvillegas/radiosatelital/MainActivity.kt
- src-tauri/gen/android/app/src/main/AndroidManifest.xml
- src-tauri/gen/android/app/build.gradle.kts
- public/main.js
