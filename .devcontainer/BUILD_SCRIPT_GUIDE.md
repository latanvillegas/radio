# 📜 build.sh - Documentación Detallada del Script

## 🎯 Propósito

El script `build.sh` es el punto de entrada principal para compilar la aplicación Android. Proporciona:

1. **Verificación de requisitos** - garantiza que todas las herramientas necesarias estén disponibles
2. **Configuración de memoria** - optimiza Gradle para Codespaces
3. **Compilación** - invoca `./gradlew assembleDebug`
4. **Análisis estático** - ejecuta Detekt para calidad de código
5. **Manejo de errores** - captura y reporta problemas

## 📋 Estructura del Script

### Secciones Principales

```
build.sh
├── 🔧 Setup & Configuration
│   ├── Shebang & Error Handling
│   ├── Color definitions
│   ├── Variable declarations
│   └── Path configuration
│
├── 📝 Utility Functions
│   ├── log_info()
│   ├── log_success()
│   ├── log_warning()
│   ├── log_error()
│   └── print_usage()
│
├── ✅ Prerequisite Checks
│   └── check_requirements()
│       ├── Java version
│       ├── Android SDK
│       ├── sdkmanager
│       └── Detekt (optional)
│
├── ⚙️  Environment Setup
│   └── setup_gradle_daemon()
│       ├── Create gradle.properties
│       ├── Configure JVM args
│       ├── Set timeouts
│       └── Enable caching
│
├── 🏗️  Build Operations
│   ├── build_android()
│   ├── run_static_analysis()
│   ├── stop_gradle_daemon()
│   └── cleanup()
│
└── 🚀 Main Execution Loop
    └── main()
        └── Command dispatch (build/clean/analyze/etc)
```

## 🔍 Detalle de Funciones

### 1. Funciones de Logging

```bash
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') - $1"
}
```

**Propósito**: Información general  
**Ejemplo**:
```
[INFO] 14:32:15 - Verificando requisitos del sistema...
```

```bash
log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%H:%M:%S') - $1"
}
```

**Propósito**: Operación completada exitosamente  
**Ejemplo**:
```
[SUCCESS] 14:32:15 - Java encontrado: 17.0.10
```

```bash
log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%H:%M:%S') - $1"
}
```

**Propósito**: Advertencias no críticas  
**Ejemplo**:
```
[WARNING] 14:32:16 - Detekt no está disponible - análisis estático omitido
```

```bash
log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') - $1"
}
```

**Propósito**: Error crítico  
**Ejemplo**:
```
[ERROR] 14:32:16 - Java 17 no está instalado
exit 1
```

### 2. check_requirements()

Verifica que todas las herramientas necesarias estén disponibles e instaladas correctamente.

```bash
check_requirements() {
    log_info "Verificando requisitos del sistema..."
    
    # Verificar Java
    if ! command -v java &> /dev/null; then
        log_error "Java 17 no está instalado"
        exit 1
    fi
    JAVA_VERSION=$(java -version 2>&1 | grep -oP '(?<=").*(?=")' | head -1)
    log_success "Java encontrado: $JAVA_VERSION"
    
    # Verificar Android SDK
    if [ ! -d "$ANDROID_HOME" ]; then
        log_error "Android SDK no encontrado en $ANDROID_HOME"
        exit 1
    fi
    log_success "Android SDK encontrado en $ANDROID_HOME"
    
    # Verificar sdkmanager
    if [ ! -x "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]; then
        log_error "sdkmanager no encontrado o no ejecutable"
        exit 1
    fi
    log_success "sdkmanager verificado"
    
    # Verificar Detekt (opcional)
    if command -v detekt &> /dev/null; then
        log_success "Detekt encontrado: $(detekt --version)"
    else
        log_warning "Detekt no está disponible - análisis estático omitido"
    fi
}
```

**Verificaciones realizadas:**

| Herramienta | Tipo | Acción en Fallo |
|-------------|------|-----------------|
| Java | Requerido | Salir con código 1 |
| Android SDK | Requerido | Salir con código 1 |
| sdkmanager | Requerido | Salir con código 1 |
| Detekt | Opcional | Solo advertencia |

### 3. setup_gradle_daemon()

Configura el demonio de Gradle con límites de memoria optimizados para Codespaces.

```bash
setup_gradle_daemon() {
    log_info "Configurando demonio Gradle con límites de memoria..."
    
    mkdir -p "$GRADLE_USER_HOME"
    
    cat > "$GRADLE_PROPERTIES" << EOF
# Gradle Daemon Configuration for Low-Memory Environments
org.gradle.jvmargs=-Xms${GRADLE_HEAP_MIN} -Xmx${GRADLE_HEAP_MAX} -XX:MaxMetaspaceSize=${GRADLE_METASPACE} -XX:ReservedCodeCacheSize=${GRADLE_OFFHEAP} -XX:+UseG1GC -XX:MaxGCPauseMillis=200

# Daemon configuration
org.gradle.daemon=true
org.gradle.daemon.health.scratchdir=${GRADLE_USER_HOME}/daemon-scratchdir
org.gradle.workers.max=2
org.gradle.parallel=false

# Timeout del daemon
org.gradle.daemon.idletimeout=30000

# Build cache
org.gradle.caching=true

# Compiler
org.gradle.unsafe.isolated-projects=false
EOF
    
    log_success "Configuración de Gradle completada"
}
```

**Archivos creados:**
- `~/.gradle/gradle.properties` - Configuración persistente

**Parámetros de Gradle:**

| Parámetro | Valor | Propósito |
|-----------|-------|----------|
| `org.gradle.jvmargs` | Ver arriba | Argumentos JVM |
| `org.gradle.daemon` | `true` | Habilitar daemon |
| `org.gradle.workers.max` | 2 | Máximo workers paralelos |
| `org.gradle.parallel` | `false` | Deshabilitar paralelización |
| `org.gradle.daemon.idletimeout` | 30000 | Timeout de 30 segundos |
| `org.gradle.caching` | `true` | Build cache |

### 4. stop_gradle_daemon()

Detiene el demonio de Gradle para liberar recursos.

```bash
stop_gradle_daemon() {
    log_info "Deteniendo demonio Gradle..."
    if [ -x "$GRADLE_WRAPPER" ]; then
        "$GRADLE_WRAPPER" --stop 2>/dev/null || true
    fi
}
```

**Cuándo se ejecuta:**
- Explícitamente con el comando `daemon-stop`
- Automáticamente en la función `cleanup()` (trap)

### 5. run_static_analysis()

Ejecuta Detekt para análisis estático de código Kotlin.

```bash
run_static_analysis() {
    log_info "Ejecutando análisis estático con Detekt..."
    
    DETEKT_CONFIG="${PROJECT_ROOT}/detekt.yml"
    
    if command -v detekt &> /dev/null; then
        if [ -f "$DETEKT_CONFIG" ]; then
            detekt --config "$DETEKT_CONFIG" --input "${PROJECT_ROOT}/android/app/src/main" || {
                log_warning "Detekt encontró problemas de estilo"
            }
        else
            detekt --input "${PROJECT_ROOT}/android/app/src/main" || {
                log_warning "Detekt encontró problemas de estilo"
            }
        fi
        log_success "Análisis estático completado"
    else
        log_warning "Detekt no disponible - omitiendo análisis estático"
    fi
}
```

**Importante**: Los problemas detectados por Detekt solo generan advertencias, no detienen el build.

### 6. build_android()

Ejecuta la compilación del APK debug.

```bash
build_android() {
    log_info "Iniciando compilación de Android..."
    
    if [ ! -x "$GRADLE_WRAPPER" ]; then
        log_warning "gradlew no encontrado, usando gradle global"
        BUILD_CMD="gradle"
    else
        BUILD_CMD="$GRADLE_WRAPPER"
    fi
    
    log_info "Ejecutando: $BUILD_CMD assembleDebug"
    log_info "Configuración de memoria: Xmx=${GRADLE_HEAP_MAX}, Metaspace=${GRADLE_METASPACE}"
    
    if $BUILD_CMD assembleDebug \
        -x test \
        --no-daemon \
        --info \
        --build-cache \
        2>&1 | tee "${PROJECT_ROOT}/build.log"; then
        
        log_success "Compilación completada exitosamente"
        
        # Buscar APK generado
        APK_PATH=$(find "${PROJECT_ROOT}" -name "*debug.apk" -type f | head -1)
        if [ -n "$APK_PATH" ]; then
            APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
            log_success "APK generado: $APK_PATH ($APK_SIZE)"
        fi
    else
        log_error "Compilación fallida"
        log_error "Ver logs en: ${PROJECT_ROOT}/build.log"
        exit 1
    fi
}
```

**Flags de Gradle**:
- `-x test`: Excluir tests (más rápido)
- `--no-daemon`: Usa modo sin daemon (más controlable)
- `--info`: Logs detallados
- `--build-cache`: Habilita caché de build

### 7. cleanup()

Se ejecuta automáticamente al salir del script.

```bash
cleanup() {
    log_info "Limpiando recursos..."
    stop_gradle_daemon
    log_success "Limpieza completada"
}
```

**Activado por**: `trap cleanup EXIT INT TERM`

Esto asegura que el daemon se detenga incluso si el script se interrumpe.

## 📊 Diagrama de Flujo Completo

```
┌─────────────────────────────────────────┐
│  Inicio: ./build.sh [COMANDO]           │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  trap cleanup EXIT INT TERM              │
│  (Configura limpieza automática)        │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  print_usage() (Encabezado)             │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  check_requirements()                   │
│  ├─ Verificar Java ✓/✗                  │
│  ├─ Verificar Android SDK ✓/✗           │
│  ├─ Verificar sdkmanager ✓/✗            │
│  └─ Verificar Detekt (opt) ✓/⚠          │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  setup_gradle_daemon()                  │
│  └─ Crear gradle.properties             │
└──────────┬──────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │  COMANDO?    │
    └──┬─┬─┬─┬─┬───┘
       │ │ │ │ │
   ┌───┘ │ │ │ └────────┐
   │     │ │ │          │
   ▼     ▼ ▼ ▼          ▼
"build" "clean" "analyze" "daemon-stop" "help"
   │     │     │        │              │
   ▼     ▼     ▼        ▼              ▼
build_ gradle run_  stop_gradle print_
android clean static_analysis daemon  usage()
   │     │     │        │
   └──┬──┴──┬──┴────┬───┘
      │     │       │
      └─────┼───────┘
            │
            ▼
┌─────────────────────────────────────────┐
│  cleanup() (Automático via trap)        │
│  └─ stop_gradle_daemon()                │
└─────────────────────────────────────────┘
```

## 🎯 Casos de Uso

### Caso 1: Compilación Simple
```bash
./build.sh build

Flujo:
1. check_requirements() ✓
2. setup_gradle_daemon() ✓
3. build_android() ✓
4. cleanup() ✓
```

### Caso 2: Análisis + Build
```bash
./build.sh analyze
./build.sh build

Flujo primero:
1. check_requirements() ✓
2. setup_gradle_daemon() ✓
3. run_static_analysis() ✓
4. cleanup() ✓

Flujo segundo:
1. check_requirements() ✓
2. setup_gradle_daemon() ✓
3. build_android() ✓
4. cleanup() ✓
```

### Caso 3: Limpieza Completa
```bash
./build.sh clean

Flujo:
1. check_requirements() ✓
2. setup_gradle_daemon() ✓
3. gradle clean ✓
4. cleanup() ✓
```

## 🏃 Optimizaciones de Performance

### Memoria
```bash
# En variables (ajustable)
GRADLE_HEAP_MIN="512m"      # Inicial
GRADLE_HEAP_MAX="3072m"     # Máximo
```

### Paralelización
```bash
# En gradle.properties
org.gradle.workers.max=2    # Máximo workers
org.gradle.parallel=false   # Deshabilitar paralelización
```

### Caching
```bash
# En gradle.properties
org.gradle.caching=true     # Build cache
```

## 🔧 Customización

### Cambiar memoria Gradle
```bash
# En build.sh, línea ~20
GRADLE_HEAP_MAX="2048m"     # Reducir si hay OOM
```

### Cambiar entrada de Detekt
```bash
# En run_static_analysis(), línea ~150
detekt --input "android/app/src/main"  # Otra ruta
```

### Agregar pre-requisito adicional
```bash
# En check_requirements(), agregar
if ! command -v <HERRAMIENTA> &> /dev/null; then
    log_error "<HERRAMIENTA> no está instalado"
    exit 1
fi
```

## 📝 Archivos Relacionados

| Archivo | Relación |
|---------|----------|
| `~/.gradle/gradle.properties` | Configuración de Gradle (creada por script) |
| `./build.log` | Logs de compilación (creado por script) |
| `detekt.yml` | Configuración de Detekt (leída por script) |
| `.devcontainer/Dockerfile` | Define el entorno donde corre el script |
| `.devcontainer/devcontainer.json` | Configuración de Codespaces para el script |

## ⚙️ Variables del Sistema Utilizadas

```bash
# De Dockerfile/devcontainer.json (pre-configuradas)
ANDROID_HOME="/opt/android"
ANDROID_SDK_ROOT="/opt/android"
JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
PATH="${PATH}:/opt/android/cmdline-tools/latest/bin:..."

# Del script
PROJECT_ROOT="$(pwd)"
GRADLE_WRAPPER="${PROJECT_ROOT}/gradlew"
GRADLE_USER_HOME="${PROJECT_ROOT}/.gradle"
GRADLE_PROPERTIES="${GRADLE_USER_HOME}/gradle.properties"

# JVM Options (exportadas)
GRADLE_OPTS="-Xms${GRADLE_HEAP_MIN} -Xmx${GRADLE_HEAP_MAX} ..."
GRADLE_DAEMON_OPTS="${GRADLE_OPTS}"
```

---

**Última actualización**: 2026-03-21  
**Versión del script**: 1.0  
**Compatible con**: Ubuntu 24.04 LTS, Android SDK 33+, OpenJDK 17
