# Configuracion Android (Kotlin Nativo)

Este proyecto usa configuracion Android nativa.

## Archivos clave

- android/app/build.gradle.kts
- android/app/src/main/AndroidManifest.xml
- android/gradle.properties
- android/settings.gradle
- gradle/libs.versions.toml

## Validacion rapida

```bash
bash scripts/with-java21.sh ./android/gradlew -p android tasks --no-daemon
bash scripts/with-java21.sh ./android/gradlew -p android :app:lintDebug --no-daemon
```

## Notas

- La configuracion historica previa fue removida de esta guia para mantenerla alineada al stack actual.
