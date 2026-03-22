#!/bin/bash

################################################################################
# Script de compilación para Android - Build.sh
# Descripción: Compila la aplicación Android (Kotlin + Jetpack Compose)
#              limitando el consumo de memoria del demonio Gradle
# Autor: DevOps Engineer
# Requerimientos: OpenJDK 17, Android SDK, Gradle
################################################################################

set -e  # Salir ante cualquier error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_PROJECT_DIR="${PROJECT_ROOT}/android"
GRADLE_HOME="${GRADLE_HOME:-$PROJECT_ROOT/gradle}"
GRADLE_WRAPPER="${ANDROID_PROJECT_DIR}/gradlew"
JAVA21_WRAPPER="${PROJECT_ROOT}/scripts/with-java21.sh"
ANDROID_GRADLE_PLUGIN_VERSION="${ANDROID_GRADLE_PLUGIN_VERSION:-8.0.0}"

# Limites de memoria (optimizados para Codespaces)
GRADLE_HEAP_MIN="512m"
GRADLE_HEAP_MAX="3072m"
GRADLE_METASPACE="512m"
GRADLE_OFFHEAP="1024m"

# Variables de entorno
export ANDROID_HOME="${ANDROID_HOME:-/opt/android}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}"
export GRADLE_OPTS="-Xms${GRADLE_HEAP_MIN} -Xmx${GRADLE_HEAP_MAX} -XX:MaxMetaspaceSize=${GRADLE_METASPACE} -XX:ReservedCodeCacheSize=${GRADLE_OFFHEAP} -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:InitiatingHeapOccupancyPercent=35 -XX:+ParallelRefProcEnabled"
export PATH="${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${JAVA_HOME}/bin:$PATH"
export GRADLE_USER_HOME="${PROJECT_ROOT}/.gradle"
export GRADLE_DAEMON_OPTS="${GRADLE_OPTS}"

# Configuración del demonio Gradle
GRADLE_PROPERTIES="${GRADLE_USER_HOME}/gradle.properties"

################################################################################
# Funciones de utilidad
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') - $1"
}

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

stop_gradle_daemon() {
    log_info "Deteniendo demonio Gradle..."
    if [ -x "$GRADLE_WRAPPER" ]; then
        "$GRADLE_WRAPPER" --stop 2>/dev/null || true
    fi
}

run_static_analysis() {
    log_info "Ejecutando análisis estático con Detekt..."
    
    DETEKT_CONFIG="${PROJECT_ROOT}/detekt.yml"
    
    if command -v detekt &> /dev/null; then
        if [ -f "$DETEKT_CONFIG" ]; then
            detekt --config "$DETEKT_CONFIG" --input "${ANDROID_PROJECT_DIR}/app/src/main/java" || {
                log_warning "Detekt encontró problemas de estilo"
            }
        else
            detekt --input "${ANDROID_PROJECT_DIR}/app/src/main/java" || {
                log_warning "Detekt encontró problemas de estilo"
            }
        fi
        log_success "Análisis estático completado"
    else
        log_warning "Detekt no disponible - omitiendo análisis estático"
    fi
}

build_android() {
    log_info "Iniciando compilación de Android..."

    if [ ! -d "$ANDROID_PROJECT_DIR" ]; then
        log_error "Proyecto Android no encontrado en: $ANDROID_PROJECT_DIR"
        exit 1
    fi
    
    if [ ! -x "$GRADLE_WRAPPER" ]; then
        log_warning "gradlew no encontrado, usando gradle global"
        BUILD_CMD="gradle"
    else
        BUILD_CMD="$GRADLE_WRAPPER"
    fi
    
    log_info "Ejecutando: $BUILD_CMD -p $ANDROID_PROJECT_DIR assembleDebug"
    log_info "Configuración de memor ia: Xmx=${GRADLE_HEAP_MAX}, Metaspace=${GRADLE_METASPACE}"
    
    if "$JAVA21_WRAPPER" $BUILD_CMD -p "$ANDROID_PROJECT_DIR" assembleDebug \
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

cleanup() {
    log_info "Limpiando recursos..."
    stop_gradle_daemon
    log_success "Limpieza completada"
}

print_usage() {
    cat << EOF
Uso: $0 [OPCIONES]

Opciones:
    build           Compilar aplicación (por defecto)
    clean           Limpiar build system
    analyze         Ejecutar análisis estático con Detekt
    run             Compilar y ejecutar
    daemon-stop     Detener demonio Gradle
    help            Mostrar esta ayuda

Ejemplos:
    $0 build
    $0 clean
    $0 analyze
    $0 run

Variables de entorno personalizadas:
    GRADLE_HEAP_MAX     Memoria máxima del Gradle (default: ${GRADLE_HEAP_MAX})
    ANDROID_HOME        Ruta al Android SDK (default: ${ANDROID_HOME})
    JAVA_HOME           Ruta a Java 17 (default: ${JAVA_HOME})

EOF
}

################################################################################
# Ejecución principal
################################################################################

trap cleanup EXIT INT TERM

main() {
    local command="${1:-build}"
    
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║   Android Native Build System - Radio Satelital Project      ║"
    echo "║   DevOps Optimized for GitHub Codespaces                     ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log_info "Directorio del proyecto: $PROJECT_ROOT"
    log_info "Comando: $command"
    
    check_requirements
    setup_gradle_daemon
    
    case $command in
        build)
            build_android
            ;;
        clean)
            log_info "Limpiando directorios de build..."
            if [ -x "$GRADLE_WRAPPER" ]; then
                "$JAVA21_WRAPPER" "$GRADLE_WRAPPER" -p "$ANDROID_PROJECT_DIR" clean --no-daemon
            else
                "$JAVA21_WRAPPER" gradle -p "$ANDROID_PROJECT_DIR" clean --no-daemon
            fi
            log_success "Build limpiado"
            ;;
        analyze|detekt)
            run_static_analysis
            ;;
        run)
            build_android
            ;;
        daemon-stop)
            stop_gradle_daemon
            log_success "Demonio detenido"
            ;;
        help|--help|-h)
            print_usage
            ;;
        *)
            log_error "Comando desconocido: $command"
            print_usage
            exit 1
            ;;
    esac
}

main "$@"
