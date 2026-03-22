# 📋 Configuración Técnica del DevContainer - Documentación Detallada

## 📑 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Componentes del Dockerfile](#componentes-del-dockerfile)
3. [Configuración de devcontainer.json](#configuración-de-devcontainerjson)
4. [Optimizaciones de Memoria](#optimizaciones-de-memoria)
5. [Flujo de Compilación](#flujo-de-compilación)
6. [Linting y Análisis Estático](#linting-y-análisis-estático)
7. [Troubleshooting Avanzado](#troubleshooting-avanzado)

---

## Arquitectura General

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Codespaces                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Container (Ubuntu 24.04)                    │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ ┌──────────────────────────────────────────────────┐ │   │
│  │ │  OpenJDK 17 (JVM Runtime)                        │ │   │
│  │ └──────────────────────────────────────────────────┘ │   │
│  │ ┌──────────────────────────────────────────────────┐ │   │
│  │ │  Android SDK Command-line Tools                 │ │   │
│  │ │  ├─ sdkmanager                                  │ │   │
│  │ │  ├─ Platform Tools (adb, fastboot)             │ │   │
│  │ │  ├─ Build Tools (34.0.0, 33.0.2)               │ │   │
│  │ │  └─ Android Platforms (33, 34)                 │ │   │
│  │ └──────────────────────────────────────────────────┘ │   │
│  │ ┌──────────────────────────────────────────────────┐ │   │
│  │ │  Gradle Build System                            │ │   │
│  │ └──────────────────────────────────────────────────┘ │   │
│  │ ┌──────────────────────────────────────────────────┐ │   │
│  │ │  Detekt (Kotlin Static Analysis)                │ │   │
│  │ └──────────────────────────────────────────────────┘ │   │
│  │ ┌──────────────────────────────────────────────────┐ │   │
│  │ │  VS Code Extensions (Kotlin, Android, etc)      │ │   │
│  │ └──────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Componentes del Dockerfile

### 1. Imagen Base
```dockerfile
FROM ubuntu:24.04
```

**Justificación:**
- LTS (soporte prolongado, mínimo 5 años)
- Compatible con herramientas de desarrollo estándar
- Tamaño optimizado para Codespaces

### 2. Variables de Entorno Iniciales

```dockerfile
ENV DEBIAN_FRONTEND=noninteractive \
    ANDROID_HOME=/opt/android \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
    PATH=$PATH:/opt/android/cmdline-tools/latest/bin:/opt/android/platforms:/opt/android/build-tools:/opt/android/emulator:$JAVA_HOME/bin
```

| Variable | Propósito | Ubicación |
|----------|-----------|-----------|
| `DEBIAN_FRONTEND` | Evita prompts interactivos | Sistema base |
| `ANDROID_HOME` | Ubicación raíz del SDK | `/opt/android` |
| `JAVA_HOME` | Ubicación de Java 17 | Paquete `openjdk-17` |
| `PATH` | Ejecutables disponibles | Entorno global |

### 3. Dependencias del Sistema

```bash
apt-get install -y \
    build-essential          # Compiladores C/C++
    curl wget              # Descarga de archivos
    git                    # Control de versiones
    unzip zip              # Compresión/descompresión
    openjdk-17-jdk-headless # Java 17 (sin GUI)
    openjdk-17-jre-headless # Java Runtime
    gradle                 # Build system (opcional con wrapper)
    nodejs npm             # JavaScript runtime
    python3-pip            # Package manager Python
```

**Notas:**
- Instaladas con `apt-get` para máximo rendimiento
- Headless = sin dependencias gráficas (esencial para Codespaces)
- Lista optimizada (solo herramientas esenciales)

### 4. Instalación de Android SDK

```bash
# Crear directorio
mkdir -p ${ANDROID_HOME}/cmdline-tools

# Descargar SDK
cd /tmp && \
wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip && \
unzip -q commandlinetools-linux-9477386_latest.zip && \
mv cmdline-tools ${ANDROID_HOME}/cmdline-tools/latest

# Aceptar licencias
mkdir -p ${ANDROID_HOME}/licenses && \
yes | ${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager --licenses
```

**Detalles:**
- Versión: `9477386_latest` (última estable a fecha de creación)
- Ubicación: `/opt/android/cmdline-tools/latest`
- Licencias: aceptadas automáticamente sin interacción

### 5. Instalación de Componentes SDK

```bash
sdkmanager \
    "platforms;android-34"              # API 34
    "platforms;android-33"              # API 33
    "build-tools;34.0.0"                # Build Tools
    "build-tools;33.0.2"                # Legacy
    "platform-tools"                    # adb, fastboot
    "extras;google;google_play_services"
    "extras;android;m2repository"
    "extras;google;m2repository"
```

**Ubicaciones después de instalación:**
```
/opt/android/
├── cmdline-tools/
│   └── latest/
│       ├── bin/
│       │   ├── sdkmanager
│       │   ├── emulator
│       │   └── ...
│       └── lib/
├── platforms/
│   ├── android-34/
│   └── android-33/
├── build-tools/
│   ├── 34.0.0/
│   ├── 33.0.2/
└── platform-tools/
    ├── adb
    └── fastboot
```

### 6. Instalación de Detekt

```bash
curl -sSL https://github.com/detekt/detekt/releases/download/v1.23.1/detekt-cli-1.23.1-all.jar \
    -o /usr/local/bin/detekt.jar
echo '#!/bin/bash' > /usr/local/bin/detekt
echo 'java -jar /usr/local/bin/detekt.jar "$@"' >> /usr/local/bin/detekt
chmod +x /usr/local/bin/detekt
```

**Justificación:**
- Ejecutable único JAR
- Wrapper shell para facilitar uso desde terminal
- Incluido globalmente en `PATH`

### 7. Health Check

```dockerfile
RUN java -version && \
    ${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager --version && \
    detekt --version
```

Verifica que todas las herramientas críticas estén funcionando correctamente al construir la imagen.

---

## Configuración de devcontainer.json

### Estructura Básica

```json
{
  "name": "Android Native Development (Kotlin + Jetpack Compose)",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu-24.04",
  "build": { ... },
  "forwardPorts": [ ... ],
  "remoteEnv": { ... },
  "customizations": { ... }
}
```

### Mapeo de Puertos

```json
"forwardPorts": [
  8080,    // Aplicación (emulador, servidor dev)
  8888,    // Servicios adicionales
  5037,    // ADB Server (Android Debug Bridge)
  5555     // ADB Daemon TCP
]
```

### Variables de Entorno Remotas

```json
"remoteEnv": {
  "ANDROID_HOME": "/opt/android",
  "ANDROID_SDK_ROOT": "/opt/android",
  "JAVA_HOME": "/usr/lib/jvm/java-17-openjdk-amd64",
  "GRADLE_OPTS": "-Xmx4096m -XX:+UseG1GC -XX:MaxGCPauseMillis=200",
  "GRADLE_USER_HOME": "/workspace/.gradle"
}
```

**Optimizaciones:**
- `UseG1GC`: Garbage Collector optimizado para aplicaciones grandes
- `MaxGCPauseMillis=200`: Pausa máxima de GC de 200ms
- `GRADLE_USER_HOME`: Cache local para el proyecto

### Hooks del Ciclo de Vida

#### `updateContentCommand`
```bash
git --version && gradle --version && java -version && \
  echo "Environment ready for Android development"
```
Se ejecuta cuando se actualiza el contenedor (pull cambios).

#### `postCreateCommand`
```bash
mkdir -p ~/.gradle && \
echo "org.gradle.jvmargs=-Xmx4096m" > ~/.gradle/gradle.properties && \
echo "Android SDK Home: $ANDROID_HOME" && \
echo "Java Home: $JAVA_HOME"
```
Se ejecuta una sola vez después de crear el contenedor.

#### `postStartCommand`
```bash
adb start-server 2>/dev/null || true
```
Se ejecuta cada vez que se inicia el contenedor.

### Extensiones VS Code

```json
"extensions": [
  "ms-vscode.vscode-android",      // Android development
  "fwcd.kotlin",                   // Kotlin language support
  "charliermarsh.ruff",            // Python linter
  "ms-azuretools.vscode-docker",   // Docker support
  "eamodio.gitlens",               // Git enhanced features
  "ms-vscode.makefile-tools",      // Makefile support
  "ms-vscode-remote.remote-containers", // Remote containers
  "ms-vscode.cmake-tools"          // CMake support
]
```

### Requerimientos de Hardware

```json
"hostRequirements": {
  "cpus": 4,           // Mínimo: 4 núcleos (8 recomendado)
  "memory": "8gb",     // Mínimo: 8 GB (16 GB recomendado)
  "storage": "50gb"    // Almacenamiento requerido
}
```

---

## Optimizaciones de Memoria

### Problema
Los demonios de Gradle pueden consumir más de los 16 GB disponibles en Codespaces, causando crashes.

### Solución Implementada

#### En `build.sh`

```bash
GRADLE_HEAP_MIN="512m"      # Memoria inicial
GRADLE_HEAP_MAX="3072m"     # Máximo 3 GB (deja 5 GB para sistema)
GRADLE_METASPACE="512m"     # Espacio de metadatos
GRADLE_OFFHEAP="1024m"      # Asignación fuera del heap

export GRADLE_OPTS="-Xms${GRADLE_HEAP_MIN} \
                    -Xmx${GRADLE_HEAP_MAX} \
                    -XX:MaxMetaspaceSize=${GRADLE_METASPACE} \
                    -XX:ReservedCodeCacheSize=${GRADLE_OFFHEAP} \
                    -XX:+UseG1GC \
                    -XX:MaxGCPauseMillis=200 \
                    -XX:InitiatingHeapOccupancyPercent=35 \
                    -XX:+ParallelRefProcEnabled"
```

#### En `gradle.properties`

```properties
org.gradle.jvmargs=-Xms512m -Xmx3072m
org.gradle.workers.max=2        # Máximo 2 workers paralelos
org.gradle.parallel=false       # Desactivar paralelización
org.gradle.daemon.idletimeout=30000  # Timeout de 30s
org.gradle.caching=true         # Usar build cache
```

### Parámetros Explicados

| Parámetro | Valor | Explicación |
|-----------|-------|-------------|
| `-Xms` | 512m | Heap inicial (reservado al inicio) |
| `-Xmx` | 3072m | Heap máximo (nunca exceder) |
| `-XX:MaxMetaspaceSize` | 512m | Metadatos de clases |
| `-XX:ReservedCodeCacheSize` | 1024m | Caché de código compilado JIT |
| `-XX:+UseG1GC` | true | Garbage Collector G1 (eficiente) |
| `-XX:MaxGCPauseMillis` | 200ms | Pausa máxima aceptable de GC |
| `org.gradle.workers.max` | 2 | Procesos paralelos |

---

## Flujo de Compilación

### Secuencia de build.sh

```
┌─────────────────────────────┐
│  build.sh iniciado          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  check_requirements()       │  Verificar Java, SDK, Detekt
│  - Java 17                  │
│  - Android SDK              │
│  - Detekt (opcional)        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  setup_gradle_daemon()      │  Crear ~/.gradle/gradle.properties
│  - Establecer GRADLE_OPTS   │
│  - Configurar memoria       │
│  - Habilitar caching        │
└──────────┬──────────────────┘
           │
           ▼
        ┌──┴──┐
        │     │
        ▼     ▼
   Comando: ?
   
   build  ──────────> run_static_analysis()  ──> build_android()
           (opcional)     │
                          └──> detekt analysis
   
   clean  ──────────> gradle clean
   
   analyze ─────────> run_static_analysis()
   
   daemon-stop ──────> stop_gradle_daemon()
           │
           ▼
    cleanup() ──────> stop_gradle_daemon()
$
```

### Ejemplo: `./build.sh build`

```
[INFO] 14:32:15 - Verificando requisitos del sistema...
[SUCCESS] 14:32:15 - Java encontrado: 17.0.x
[SUCCESS] 14:32:15 - Android SDK encontrado en /opt/android
[SUCCESS] 14:32:15 - sdkmanager verificado
[SUCCESS] 14:32:15 - Detekt encontrado: 1.23.1

[INFO] 14:32:15 - Configurando demonio Gradle con límites de memoria...
[SUCCESS] 14:32:15 - Configuración de Gradle completada

[INFO] 14:32:16 - Iniciando compilación de Android...
[INFO] 14:32:16 - Ejecutando: ./gradlew assembleDebug
[INFO] 14:32:16 - Configuración de memoria: Xmx=3072m, Metaspace=512m

> Configure project :app
> Task :app:compileDebugResources
> Task :app:compileDebugKotlin
> Task :app:dexDebug
> Task :app:packageDebug
> Task :app:bundleDebugAab
> Task :app:assembleDebug

[SUCCESS] 14:34:22 - Compilación completada exitosamente
[SUCCESS] 14:34:22 - APK generado: app/build/outputs/apk/debug/app-debug.apk (8.5M)

[INFO] 14:34:22 - Limpiando recursos...
╔══════════════════════════════════════════════════════════════╗
║   Compilación completada en 2 minutos 26 segundos            ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Linting y Análisis Estático

### Detekt Configuration (detekt.yml)

#### Complejidad

```yaml
complexity:
  CyclomaticComplexMethod:
    threshold: 15          # Máximo ciclomatic complexity
  LongMethod:
    threshold: 60          # Máximo líneas por método
  TooManyFunctions:
    thresholdInClasses: 11 # Máximo funciones por clase
```

#### Nomenclatura

```yaml
naming:
  ClassNaming:
    classPattern: '[A-Z](?:[a-zA-Z0-9]*[a-z0-9])?'
  FunctionNaming:
    functionPattern: '([a-z][a-zA-Z0-9]*)|(`.*`)'
    ignoreAnnotated: ['Composable']  # Ignorar funciones @Composable
  PropertyNaming:
    propertyPattern: '[a-z][A-Za-z0-9]*'
```

#### Formateo

```yaml
formatting:
  MaximumLineLength:
    maxLineLength: 120     # Máximo caracteres por línea
  Indentation:
    indentSize: 4          # 4 espacios
```

### Ejecución

```bash
# Análisis completo del proyecto
./build.sh analyze

# O manualmente con Detekt
detekt --input android/app/src/main --config detekt.yml

# Con generación de reportes
detekt --input android/app/src/main --report html:build/reports/detekt.html
```

### Reportes Generados

```
build/
├── reports/
│   ├── detekt.html         # Reporte HTML interactivo
│   ├── detekt.xml          # Formato XML (máquinas)
│   ├── detekt.json         # Formato JSON
│   └── detekt.sarif        # SARIF para GitHub Security
├── detekt-baseline.xml     # Baseline para exclusiones
└── logs/
    └── detekt.log          # Logs de ejecución
```

---

## Troubleshooting Avanzado

### Problema 1: "No espacio en disco"

**Síntoma:**
```
Error: no space left on device
Building with gradle: failed
```

**Diagnosis:**
```bash
df -h /workspace
du -sh /workspace/.gradle/
du -sh /workspace/android/app/build/
```

**Solución:**
```bash
# 1. Limpiar caches de Gradle
rm -rf ~/.gradle/caches/
./build.sh clean

# 2. Limpiar artefactos de compilación
find . -name "build" -type d -exec rm -rf {} \; 2>/dev/null || true

# 3. Limpiar APKs antiguos
find . -name "*.apk" -delete

# 4. Verificar espacio disponible
df -h /
```

### Problema 2: "Demonio de Gradle necesita ser terminado"

**Síntoma:**
```
The Gradle daemon was terminated unexpectedly (exit code: 137)
```

**Causa:** OOM (Out of Memory) - Gradle necesita más RAM que la disponible.

**Solución:**
```bash
# 1. Aumentar timeout de Gradle
# En build.sh, modificar:
GRADLE_HEAP_MAX="2048m"  # Reducir de 3072m

# 2. Usar --no-daemon
./gradlew assembleDebug --no-daemon

# 3. Detener demonios existentes
./build.sh daemon-stop
./gradlew --stop

# 4. Limpiar y reintentar
pkill -f "gradle"
./build.sh build
```

### Problema 3: "Licencias no aceptadas"

**Síntoma:**
```
You have not accepted the license agreements of the following SDK components
```

**Solución:**
```bash
# Re-aceptar licencias
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

# O ejecutar script de configuración
./.devcontainer/setup-android-licenses.sh

# Verificar licencias aceptadas
ls -la $ANDROID_HOME/licenses/
```

### Problema 4: "sdkmanager no encontrado"

**Síntoma:**
```
Command not found: sdkmanager
```

**Diagnosis:**
```bash
echo $ANDROID_HOME
ls -la $ANDROID_HOME/
find /opt -name "sdkmanager" 2>/dev/null
```

**Solución:**
```bash
# 1. Verificar estructura del SDK
ls -la /opt/android/cmdline-tools/latest/bin/

# 2. Si está en el directorio raíz (común en upgrading)
mv /opt/android/cmdline-tools/* /opt/android/cmdline-tools/latest/ 2>/dev/null || true

# 3. Reinstalar Android SDK
rm -rf /opt/android
mkdir -p /opt/android/cmdline-tools
# [repetir download steps del Dockerfile]
```

### Problema 5: "Compilación lenta"

**Síntoma:**
```
Build takes 5+ minutes even for small changes
```

**Optimizaciones:**
```bash
# 1. Habilitar build cache (ya en detekt.yml)
echo "org.gradle.caching=true" >> ~/.gradle/gradle.properties

# 2. Usar daemon (por defecto)
echo "org.gradle.daemon=true" >> ~/.gradle/gradle.properties

# 3. Reducir logging
./gradlew assembleDebug --info  # Cambiar a --info si  necesita debug
```

---

## Recursos Técnicos

- [Android SDK Documentation](https://developer.android.com/studio/command-line)
- [Gradle Performance Tuning](https://docs.gradle.org/current/userguide/performance_tuning.html)
- [Detekt Rule Documentation](https://detekt.dev/rules.html)
- [OpenJDK GC Tuning](https://docs.oracle.com/en/java/javase/17/gctuning/)
- [GitHub Codespaces Specifications](https://docs.github.com/en/codespaces/developing-in-codespaces/defaults-for-codespaces)

---

**Última actualización**: 2026-03-21  
**Mantenedor**: DevOps Engineering Team
