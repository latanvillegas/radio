# Android Fase 2 - Checklist (Kotlin Nativo)

Checklist operativo para build y verificacion en Android nativo.

## 1) Entorno

- Java 21 (recomendado)
- Android SDK instalado
- Gradle Wrapper funcional

## 2) Verificacion

```bash
java -version
bash scripts/with-java21.sh ./android/gradlew -p android --version
```

## 3) Build debug

```bash
bash scripts/with-java21.sh ./android/gradlew -p android :app:assembleDebug --no-daemon
```

## 4) Build release

```bash
bash scripts/with-java21.sh ./android/gradlew -p android :app:assembleRelease --no-daemon
```

## 5) Pruebas basicas

1. Reproduccion en foreground.
2. Reproduccion en background.
3. Controles de notificacion.
4. Recuperacion al volver a abrir la app.

## 6) Logs utiles

```bash
adb logcat | grep -i "RadioForegroundService\|ExoPlayer\|MediaSession"
```
