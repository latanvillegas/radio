# 🚀 Quick Reference Guide - Android Development en Codespaces

## 📋 Comandos Básicos (Build System)

```bash
# Compilar
./build.sh build              # Debug APK (quick)
make build                    # Alternativa con Makefile
./gradlew assembleDebug       # Gradle directo

# Limpiar
./build.sh clean              # Limpiar directorios
make clean                    # Alternativa

# Análisis estático
./build.sh analyze            # Ejecutar Detekt
make analyze                  # Alternativa
detekt --input android/app/src/main      # Detekt directo
```

## 📱 Debugging & ADB

```bash
# Iniciar server ADB
adb start-server

# Listar dispositivos conectados
adb devices

# Instalar APK en dispositivo
adb install app/build/outputs/apk/debug/app-debug.apk

# Ver logs
adb logcat                    # Todos los logs
adb logcat | grep "TAG"       # Filtrar por TAG
adb logcat -c                 # Limpiar logs

# Conectar por network
adb connect <IP>:5555
```

## 🔍 Verificar Entorno

```bash
# Ver variables de entorno
echo $ANDROID_HOME
echo $JAVA_HOME
echo $GRADLE_OPTS

# Verificar herramientas instaladas
java -version
sdkmanager --version
detekt --version
gradle --version

# Verificar SDK instalado
sdkmanager --list_installed
```

## 🛠️ Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| Build falla por memoria | `GRADLE_HEAP_MAX="2048m"` en build.sh |
| Gradle daemon muere | `./gradlew --stop && ./build.sh build` |
| Sin espacio en disco | `rm -rf ~/.gradle/caches && ./build.sh clean` |
| Licencias no aceptadas | `yes \| sdkmanager --licenses` |
| APK no se genera | Verificar `build.log` |
| Detekt no funciona | `apt-get update && apt-get install -y default-jre` |

## 📊 Monitoreo de Procesos

```bash
# Ver procesos Java
ps aux | grep java

# Monitorizar CPU/RAM en tiempo real
top -p $(pgrep -f gradle)

# Ver archivo abiertos por Gradle
lsof -p $(pgrep -f gradle)

# Matar proceso si es necesario
pkill -f gradle
```

## 🔨 Make Targets Útiles

```bash
make help                # Ver todos los targets
make build              # Compilar
make analyze            # Análisis estático
make clean              # Limpiar
make verify-env         # Verificar entorno
make docker-build       # Construir imagen Docker
make daemon-stop        # Detener Gradle daemon
```

## 📦 Gradle Wrapper (gradlew)

```bash
# Ver versión
./gradlew --version

# Ejecutar tarea específica
./gradlew :app:compileDebugKotlin
./gradlew :app:assembleDebug

# Con flags útiles
./gradlew assembleDebug --no-daemon        # Sin daemon
./gradlew assembleDebug --info             # Logs detallados
./gradlew assembleDebug --build-cache      # Usar caché
./gradlew build --scan                     # Generar build scan

# Detener daemon
./gradlew --stop
```

## 🐳 Docker (si disponible)

```bash
# Construir imagen
make docker-build

# Ejecutar contenedor
make docker-run

# Ejecutar comando en contenedor existente
docker exec <CONTAINER_ID> bash
```

## 📄 Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `.devcontainer/Dockerfile` | Definición del contenedor |
| `.devcontainer/devcontainer.json` | Config de Codespaces |
| `build.sh` | Script principal de compilación |
| `Makefile` | Targets de build |
| `build.log` | Logs de compilación |
| `detekt.yml` | Config de linting |
| `.gradle/gradle.properties` | Config global de Gradle |

## 🔗 Rutas Importantes

```bash
# Android SDK
$ANDROID_HOME = /opt/android
  ├── cmdline-tools/latest/bin/    # Herramientas
  ├── platforms/                    # APIs Android
  ├── build-tools/                  # Compiladores
  ├── platform-tools/               # adb, fastboot
  └── licenses/                     # Licencias

# Java
$JAVA_HOME = /usr/lib/jvm/java-17-openjdk-amd64

# Gradle
~/.gradle/                           # Cache local
.gradle/                             # Cache del proyecto

# Proyecto
./android/app/src/main/              # Código fuente Kotlin/Android
./build/                             # Artefactos compilados
.devcontainer/                       # Config de contenedor
```

## 🎯 Workflow Recomendado

### Desarrollo rápido
```bash
# Terminal 1: Compilación rápida
./build.sh build

# Terminal 2: Monitorizar
tail -f build.log
```

### Antes de commit
```bash
# Limpiar y análisis
./build.sh clean
./build.sh analyze
./build.sh build
```

### Pre-PR (Production Ready)
```bash
# Full check
make check  # = clean + analyze + test + lint
```

## ⚡ Optimizaciones

### Para builds rápidos
```bash
# En build.sh
GRADLE_HEAP_MAX="2048m"    # Menos memoria = inicio más rápido
GRADLE_WORKERS.max=1        # Un worker = menos contención
```

### Para builds confiables
```bash
# Con daemon parado
./build.sh daemon-stop
./build.sh build --no-daemon
```

### Para máximo paralelismo (si hay RAM)
```bash
# Modificar gradle.properties
org.gradle.workers.max=4
org.gradle.parallel=true
```

## 🆘 Emergency Commands

```bash
# Reset completo (último recurso)
rm -rf .gradle build .idea
pkill -f gradle
./build.sh clean

# Rebuild desde cero
rm -rf build
./build.sh build

# Limpiar todo (PELIGRO - borra cache)
rm -rf ~/.gradle ~/.android .gradle build
./gradlew clean
./build.sh build
```

## 📞 Obtener Ayuda

```bash
# Ver ayuda del script
./build.sh help

# Ver ayuda de Gradle
./gradlew help

# Ver ayuda de Detekt
detekt --help

# Ver todo lo disponible
make help
```

---

**Última actualización**: 2026-03-21  
**Versión**: 1.0  
**Plataforma**: GitHub Codespaces + Ubuntu 24.04
