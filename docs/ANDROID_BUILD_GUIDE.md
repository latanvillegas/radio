# Configuración de GitHub Actions para Android

Este documento explica cómo configurar y usar el flujo de trabajo de GitHub Actions para compilar APKs de Android automáticamente.

## 📋 Requisitos previos

Antes de que el flujo de trabajo funcione correctamente, necesitas:

### 1. Inicializar el proyecto Android localmente (primera vez)

```bash
cd src-tauri
npm install -g @tauri-apps/cli@2.9.1
tauri android init
```

Esto creará la estructura de Android en `src-tauri/gen/android/`.

### 2. Configurar la firma de la aplicación (Opcional pero recomendado)

Para distribuir tu APK, necesitas firmarlo. Genera una keystore:

```bash
keytool -genkey -v -keystore radio-satelital.keystore -alias radio-satelital -keyalg RSA -keysize 2048 -validity 10000
```

Luego, convierte la keystore a base64:

```bash
cat radio-satelital.keystore | base64 > keystore.base64
```

### 3. Configurar secretos en GitHub

Ve a tu repositorio en GitHub → Settings → Secrets and variables → Actions, y agrega los siguientes secretos:

- `TAURI_SIGNING_PRIVATE_KEY`: Contenido del archivo `keystore.base64`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Contraseña que usaste al crear la keystore

Si no quieres firmar la app aún, puedes omitir estos secretos (se generará un APK debug).

### 4. Asegúrate de hacer commit de los archivos de Android

Después de ejecutar `tauri android init`, debes hacer commit de:

```bash
git add src-tauri/gen/android/
git add .github/workflows/build.yml
git commit -m "Add Android configuration and GitHub Actions workflow"
git push origin nativa
```

## 🚀 Uso

El flujo de trabajo se ejecuta automáticamente cada vez que hagas push a la rama `nativa`:

```bash
git add .
git commit -m "Tu mensaje de commit"
git push origin nativa
```

## 📦 Obtener los APKs generados

1. Ve a tu repositorio en GitHub
2. Click en la pestaña "Actions"
3. Selecciona la ejecución del workflow más reciente
4. Baja hasta "Artifacts" y descarga `android-apk`
5. Descomprime el archivo ZIP para obtener tus APKs

## 📱 Arquitecturas generadas

El workflow genera APKs para las siguientes arquitecturas:

- **universal**: APK que funciona en todos los dispositivos (más grande)
- **arm64-v8a**: Dispositivos ARM de 64 bits (mayoría de dispositivos modernos)
- **armeabi-v7a**: Dispositivos ARM de 32 bits (dispositivos más antiguos)
- **x86**: Emuladores x86 de 32 bits
- **x86_64**: Emuladores x86 de 64 bits

Para distribución general, usa el APK **universal** o **arm64-v8a**.

## 🏷️ Crear releases automáticos

Si quieres crear un release automático en GitHub:

```bash
git tag v9.5.0
git push origin v9.5.0
```

Esto creará un release en GitHub con el APK universal adjunto.

## 🔧 Solución de problemas

### Error: "Android NDK not found"
El workflow instala automáticamente el NDK, pero si tienes problemas localmente:
```bash
sdkmanager --install "ndk;26.1.10909125"
export ANDROID_NDK_HOME=$ANDROID_SDK_ROOT/ndk/26.1.10909125
```

### Error: "Rust target not found"
```bash
rustup target add aarch64-linux-android armv7-linux-androideabi
```

### El build falla en GitHub Actions
Revisa los logs en la pestaña "Actions" de GitHub para ver el error específico.

## 📝 Personalización

Para cambiar la versión o configuración del APK, edita:
- `src-tauri/tauri.conf.json`: Configuración general de Tauri
- `src-tauri/Cargo.toml`: Versión del proyecto Rust
- `package.json`: Versión del proyecto

## 🔗 Referencias útiles

- [Tauri Android Guide](https://v2.tauri.app/develop/android/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Android Signing Guide](https://developer.android.com/studio/publish/app-signing)
