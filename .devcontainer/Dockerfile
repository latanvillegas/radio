# Dockerfile para GitHub Codespaces - Android Native Development
FROM ubuntu:24.04

# Prevenir prompts interactivos durante la instalación
ENV DEBIAN_FRONTEND=noninteractive \
    ANDROID_HOME=/opt/android \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
    PATH=$PATH:/opt/android/cmdline-tools/latest/bin:/opt/android/platforms:/opt/android/build-tools:/opt/android/emulator:$JAVA_HOME/bin

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    wget \
    git \
    unzip \
    zip \
    openjdk-17-jdk-headless \
    openjdk-17-jre-headless \
    gradle \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de Android SDK
RUN mkdir -p ${ANDROID_HOME}/cmdline-tools

# Descargar e instalar Android SDK Command-line Tools
RUN cd /tmp && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip && \
    unzip -q commandlinetools-linux-9477386_latest.zip && \
    mv cmdline-tools ${ANDROID_HOME}/cmdline-tools/latest && \
    rm commandlinetools-linux-9477386_latest.zip

# Aceptar licencias del SDK automáticamente
RUN mkdir -p ${ANDROID_HOME}/licenses && \
    yes | ${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager --licenses > /dev/null 2>&1

# Instalar componentes necesarios del SDK
RUN ${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager \
    "platforms;android-34" \
    "platforms;android-33" \
    "build-tools;34.0.0" \
    "build-tools;33.0.2" \
    "platform-tools" \
    "extras;google;google_play_services" \
    "extras;android;m2repository" \
    "extras;google;m2repository"

# Instalar Detekt (linter estático para Kotlin)
RUN curl -sSL https://github.com/detekt/detekt/releases/download/v1.23.1/detekt-cli-1.23.1-all.jar -o /usr/local/bin/detekt.jar && \
    chmod +x /usr/local/bin/detekt.jar && \
    echo '#!/bin/bash' > /usr/local/bin/detekt && \
    echo 'java -jar /usr/local/bin/detekt.jar "$@"' >> /usr/local/bin/detekt && \
    chmod +x /usr/local/bin/detekt

# Establecer permisos correctos
RUN chmod -R 755 ${ANDROID_HOME}

# Health check
RUN java -version && \
    ${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager --version && \
    detekt --version

WORKDIR /workspace
