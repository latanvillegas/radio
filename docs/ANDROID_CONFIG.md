# ⚠️ Configuración de Android para Tauri v2.0 [DEPRECATED]

**⚠️ ATENCIÓN: Esta guía es OBSOLETA desde Marzo 22, 2026**

Radio Satelital ha migrado completamente a **Kotlin + Jetpack Compose** (100% Android nativo).
Tauri ya no se utiliza.

**Para información actualizada, consulta:** [`docs/ANDROID_NATIVE_BUILD.md`](./ANDROID_NATIVE_BUILD.md)

---

## Estado Anterior
✅ **tauri.conf.json** - Ahora obsoleto (removido)
✅ **package.json** - Mirado Tauri v2.0 dependencias
✅ **Cargo.toml** ya está configurado para Tauri v2

## Comandos de Inicialización

### 1. Instalar Dependencias de Node
```bash
npm install
```

### 2. Inicializar Entorno de Android
```bash
npm run tauri android init
```

Este comando:
- Crea la estructura de proyecto Android en `android/`
- Genera el `AndroidManifest.xml` base
- Configura Gradle con las versiones especificadas en `tauri.conf.json`

### 3. Agregar Permisos de Android

Después de ejecutar `tauri android init`, edita el archivo:
`android/app/src/main/AndroidManifest.xml`

Agrega estos permisos dentro de la etiqueta `<manifest>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

<!-- Para permitir tráfico HTTP (solo en desarrollo) -->
<application
    android:usesCleartextTraffic="true"
    ...>
```

### 4. Ejecutar en Modo Desarrollo
```bash
npm run tauri:android
```

### 5. Compilar APK para Producción
```bash
npm run tauri:android:build
```

## Configuración del tauri.conf.json (v2.0)

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Radio Satelital",
  "version": "9.5.0",
  "identifier": "online.latanvillegas.radiosatelital",
  "build": {
    "beforeDevCommand": "python3 -m http.server 1420 --directory ..",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "",
    "frontendDist": ".."
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [
      {
        "title": "Radio Satelital",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "../icon-192.png",
      "../icon-512.png"
    ],
    "android": {
      "minSdkVersion": 24,
      "targetSdkVersion": 34,
      "compileSdkVersion": 34
    }
  },
  "plugins": {}
}
```

## Cambios Principales v1.x → v2.0

### ❌ Estructura Obsoleta (v1.x)
```json
{
  "android": {
    "usesPermission": [...],
    "gradle": {...}
  }
}
```

### ✅ Estructura Correcta (v2.0)
```json
{
  "bundle": {
    "android": {
      "minSdkVersion": 24,
      "targetSdkVersion": 34,
      "compileSdkVersion": 34
    }
  }
}
```

**Nota**: Los permisos en v2.0 se configuran directamente en `AndroidManifest.xml` después de ejecutar `tauri android init`.

## Requisitos del Sistema

Para el desarrollo de Android en tu Codespace, verifica que tengas instalado:

```bash
# Verificar Java JDK
java -version  # Requiere JDK 17+

# Verificar Android SDK (se instala con android init)
echo $ANDROID_HOME

# Verificar NDK
echo $NDK_HOME
```

## Solución de Problemas

### Error: "Additional properties are not allowed"
**Causa**: Configuración de v1.x en esquema v2.0
**Solución**: ✅ Ya resuelto - `tauri.conf.json` actualizado

### Error: "Java not found"
```bash
sudo apt update
sudo apt install openjdk-17-jdk -y
```

### Error: "Android SDK not found"
El comando `tauri android init` descarga e instala automáticamente las herramientas necesarias.

## Integración con GitHub Actions

Para tus builds en GitHub Actions, asegúrate de que el workflow incluya:

```yaml
- name: Setup Android SDK
  uses: android-actions/setup-android@v2

- name: Install Tauri CLI
  run: npm install

- name: Build Android APK
  run: npm run tauri:android:build
```

## Próximos Pasos

1. ✅ Ejecutar `npm install` para instalar las dependencias actualizadas
2. ✅ Ejecutar `npm run tauri android init` para inicializar el proyecto Android
3. ⚙️ Configurar permisos en `AndroidManifest.xml`
4. 🧪 Probar con `npm run tauri:android`
5. 📦 Compilar APK con `npm run tauri:android:build`
