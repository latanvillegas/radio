# Guia de Compilacion Android (Kotlin Nativo)

Esta guia aplica al flujo actual de Radio Satelital: Android nativo con Kotlin + Jetpack Compose.

## Fuente de verdad

Usa esta documentacion operativa:

- docs/ANDROID_NATIVE_BUILD.md
- docs/ANDROID_SIGNING_GUIDE.md

## Comandos base

```bash
bash scripts/with-java21.sh ./android/gradlew -p android :app:assembleDebug --no-daemon
bash scripts/with-java21.sh ./android/gradlew -p android :app:assembleRelease --no-daemon
```

## Notas

- El flujo historico previo fue retirado de esta guia para evitar confusiones.
- Si necesitas contexto de migracion, consulta CHANGELOG.md e IMPLEMENTATION_SUMMARY.md.
