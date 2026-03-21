# Configuración de GitHub Codespaces para Android Native Development

## 📋 Descripción General

Este repositorio incluye una configuración completa para desarrollar aplicaciones Android nativas (Kotlin + Jetpack Compose) en GitHub Codespaces sin necesidad de interfaz gráfica.

## 🏗️ Requisitos del Sistema

- **CPU**: Mínimo 4 núcleos (8 recomendado)
- **RAM**: Mínimo 8 GB (16 GB recomendado)
- **Almacenamiento**: Mínimo 50 GB libres
- **SO Contenedor**: Ubuntu 24.04 LTS

## 📦 Stack Tecnológico

- **JDK**: OpenJDK 17 (headless)
- **Android SDK**: Command-line Tools (última versión)
- **Gradle**: Compatible con Gradle 8.x
- **Linter**: Detekt 1.23.1
- **Runtime**: Linux x86_64

### Componentes Android SDK Incluidos

```
- platforms;android-34
- platforms;android-33
- build-tools;34.0.0
- build-tools;33.0.2
- platform-tools
- extras;google;google_play_services
- extras;android;m2repository
- extras;google;m2repository
```

## 🚀 Uso Rápido

### 1. Abrir en Codespaces

```bash
# En GitHub, presionar el botón "Code" → "Codespaces" → "Create codespace on main"
```

### 2. Compilar Aplicación

```bash
# Compilación básica
./build.sh build

# Compilación con análisis estático
./build.sh analyze

# Limpiar build
./build.sh clean

# Ver ayuda
./build.sh help
```

## 📋 Estructura de Archivos

```
.devcontainer/
├── Dockerfile                 # Definición del contenedor
└── devcontainer.json         # Configuración de Codespaces

build.sh                        # Script de compilación
detekt.yml                      # Configuración de linting
```

## 🔧 Variables de Entorno

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `ANDROID_HOME` | `/opt/android` | Directorio raíz del SDK |
| `ANDROID_SDK_ROOT` | `/opt/android` | Alias para `ANDROID_HOME` |
| `JAVA_HOME` | `/usr/lib/jvm/java-17-openjdk-amd64` | Ubicación de Java 17 |
| `GRADLE_OPTS` | Ver build.sh | Opciones de JVM para Gradle |

### Opciones de Memoria

Por defecto, Gradle está configurado con:

```
-Xms512m        # Memoria inicial
-Xmx3072m       # Memoria máxima (3 GB)
-XX:MaxMetaspaceSize=512m
-XX:ReservedCodeCacheSize=1024m
```

Para ajustar estos valores, editar el archivo `build.sh`:

```bash
GRADLE_HEAP_MIN="512m"
GRADLE_HEAP_MAX="3072m"        # Modificar este valor
GRADLE_METASPACE="512m"
GRADLE_OFFHEAP="1024m"
```

## 📊 Análisis Estático con Detekt

Detekt se ejecuta automáticamente como parte del build (si es requerido).

### Ejecutar manualmente

```bash
# Análisis completo
detekt

# Análisis con configuración personalizada
detekt --config detekt.yml --input src-tauri
```

### Configuración

La configuración de Detekt está en `detekt.yml`. Las principales reglas incluyen:

- **Límite de complejidad**: Máximo 15 para métodos
- **Longitud máxima de línea**: 120 caracteres
- **Longitud máxima de método**: 60 líneas
- **Profundidad de anidamiento**: Máximo 4 niveles
- **Funciones por clase**: Máximo 11 funciones

## 🐛 Solución de Problemas

### Error: "No espacio suficiente en disco"

```bash
# Limpiar caché de Gradle
./build.sh clean
rm -rf ~/.gradle/caches
```

### Error: "Demonio de Gradle se bloqueó/mató"

Esto generalmente indica falta de memoria. Soluciones:

```bash
# 1. Reducir memoria de Gradle en build.sh
GRADLE_HEAP_MAX="2048m"

# 2. Detener demonios existentes
./build.sh daemon-stop

# 3. Ejecutar con --no-daemon
./build.sh build
```

### Error: "Aceptación de licencias falló"

```bash
# Re-aceptar licencias manualmente
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses
```

## 🔐 Seguridad

- No incluye credenciales en la imagen
- Soporta montaje de archivos SSH
- Compatible con Git y GitHub CLI
- Variables de entorno sensibles via secretos de Codespaces

## 🧪 Verificación de Instalación

```bash
# Verificar Java
java -version

# Verificar Android SDK
sdkmanager --version

# Verificar Detekt
detekt --version

# Verificar Gradle
gradle --version

# Verificar directorio Android
ls -la $ANDROID_HOME
```

## 📝 Logs de Build

Los logs de compilación se guardan en:

```
./build.log
```

Para monitoreo en tiempo real:

```bash
tail -f build.log
```

## 🚀 Extensiones VS Code Incluidas

- **vscode-android**: Soporte de Android
- **fwcd.kotlin**: Soporte de Kotlin
- **gitlens**: Integración Git mejorada
- **vscode-docker**: Soporte Docker
- **cmake-tools**: Herramientas CMake

## 📚 Recursos Adicionales

- [Android SDK Command-line Tools](https://developer.android.com/studio/command-line)
- [Gradle Documentation](https://docs.gradle.org/)
- [Detekt on GitHub](https://github.com/detekt/detekt)
- [Kotlin Documentation](https://kotlinlang.org/docs/)
- [Jetpack Compose](https://developer.android.com/jetpack/compose)

## ⚙️ Customización

### Agregar nuevas herramientas

Editar `Dockerfile` e instalar paquetes:

```dockerfile
RUN apt-get update && apt-get install -y \
    new-tool-name \
    && rm -rf /var/lib/apt/lists/*
```

### Modificar configuración Gradle

Editar `.gradle/gradle.properties` después de crear el contenedor o modificar `build.sh`.

### Agregar nuevas extensiones VS Code

En `devcontainer.json`, agregar a la sección `customizations.devcontainers.extensions`:

```json
"ms-vscode.extension-id"
```

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver LICENSE para más detalles.

## 🤝 Contribución

Para contribuir, crear un PR con los cambios deseados.

---

**Última actualización**: 2026-03-21  
**Versión de imagen**: Ubuntu 24.04 LTS + Android SDK 34 + OpenJDK 17
