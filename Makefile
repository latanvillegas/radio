.PHONY: help build clean analyze format test docker-build docker-run shell release-java21

# Variables
SHELL := /bin/bash
BUILD_SCRIPT := ./build.sh
ANDROID_PROJECT_DIR := android
GRADLE_CMD := ./android/gradlew
JAVA21_WRAPPER := ./scripts/with-java21.sh
DETEKT := detekt
DOCKER_IMAGE := radio-satelital-android:latest
DOCKER_CONTAINER := radio-satelital-dev

help:
	@echo "╔══════════════════════════════════════════════════════════════╗"
	@echo "║  Radio Satelital - Android Development Makefile              ║"
	@echo "╚══════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "Targets disponibles:"
	@echo ""
	@echo "  Build:"
	@echo "    make build          - Compilar aplicación (debug)"
	@echo "    make release        - Compilar aplicación (release)"
	@echo "    make release-java21 - Compilar release forzando Java 21"
	@echo "    make clean          - Limpiar artefactos de build"
	@echo ""
	@echo "  Análisis y Testing:"
	@echo "    make analyze        - Ejecutar Detekt (análisis estático)"
	@echo "    make test           - Ejecutar pruebas unitarias"
	@echo ""
	@echo "  Calidad de código:"
	@echo "    make format         - Formatear código con Ktfmt"
	@echo "    make lint           - Ejecutar linting"
	@echo ""
	@echo "  Docker:"
	@echo "    make docker-build   - Construir imagen Docker"
	@echo "    make docker-run     - Ejecutar contenedor"
	@echo "    make docker-shell   - Shell interactivo en contenedor"
	@echo ""
	@echo "  Utilidades:"
	@echo "    make verify-env     - Verificar estado del entorno"
	@echo "    make daemon-stop    - Detener demonio Gradle"
	@echo "    make help           - Mostrar esta ayuda"
	@echo ""
	@echo "Ejemplos:"
	@echo "  make build"
	@echo "  make analyze && make build"
	@echo "  make docker-build && make docker-run"
	@echo ""

# Build targets
build:
	@echo "Building debug APK..."
	@bash ./scripts/verify-no-tauri.sh
	@if [ -x $(GRADLE_CMD) ]; then \
		$(JAVA21_WRAPPER) $(GRADLE_CMD) -p $(ANDROID_PROJECT_DIR) assembleDebug --no-daemon; \
	else \
		$(JAVA21_WRAPPER) gradle -p $(ANDROID_PROJECT_DIR) assembleDebug --no-daemon; \
	fi

release:
	@echo "Building release APK..."
	@bash ./scripts/verify-no-tauri.sh
	@if [ -x $(GRADLE_CMD) ]; then \
		$(JAVA21_WRAPPER) $(GRADLE_CMD) -p $(ANDROID_PROJECT_DIR) assembleRelease --no-daemon; \
	else \
		$(JAVA21_WRAPPER) gradle -p $(ANDROID_PROJECT_DIR) assembleRelease --no-daemon; \
	fi

release-java21: release
	@echo "Release build completada con Java 21"

clean:
	@echo "Cleaning build artifacts..."
	@$(BUILD_SCRIPT) clean

# Analysis and testing targets
analyze:
	@echo "Running static analysis with Detekt..."
	@bash ./scripts/verify-no-tauri.sh
	@if [ -x $(GRADLE_CMD) ]; then \
		$(JAVA21_WRAPPER) $(GRADLE_CMD) -p $(ANDROID_PROJECT_DIR) app:detekt --no-daemon; \
	else \
		$(JAVA21_WRAPPER) gradle -p $(ANDROID_PROJECT_DIR) app:detekt --no-daemon; \
	fi

test:
	@echo "Running unit tests..."
	@bash ./scripts/verify-no-tauri.sh
	@if [ -x $(GRADLE_CMD) ]; then \
		$(JAVA21_WRAPPER) $(GRADLE_CMD) -p $(ANDROID_PROJECT_DIR) app:testDebugUnitTest --no-daemon; \
	else \
		$(JAVA21_WRAPPER) gradle -p $(ANDROID_PROJECT_DIR) app:testDebugUnitTest --no-daemon; \
	fi

android-test:
	@echo "Running Android instrumented tests..."
	@if [ -x $(GRADLE_CMD) ]; then \
		$(JAVA21_WRAPPER) $(GRADLE_CMD) -p $(ANDROID_PROJECT_DIR) connectedAndroidTest --no-daemon; \
	else \
		$(JAVA21_WRAPPER) gradle -p $(ANDROID_PROJECT_DIR) connectedAndroidTest --no-daemon; \
	fi

# Code quality targets
format:
	@echo "Formatting Kotlin code..."
	@if command -v ktfmt &> /dev/null; then \
		ktfmt --mode file android/app/src/main/java; \
	else \
		echo "ktfmt not installed. Skipping formatting."; \
	fi

lint:
	@echo "Running linting checks..."
	@if [ -x $(GRADLE_CMD) ]; then \
		$(JAVA21_WRAPPER) $(GRADLE_CMD) -p $(ANDROID_PROJECT_DIR) lint --no-daemon; \
	else \
		$(JAVA21_WRAPPER) gradle -p $(ANDROID_PROJECT_DIR) lint --no-daemon; \
	fi

# Docker targets
docker-build:
	@echo "Building Docker image: $(DOCKER_IMAGE)"
	@docker build -f .devcontainer/Dockerfile -t $(DOCKER_IMAGE) .

docker-run:
	@echo "Running Docker container..."
	@docker run --rm -it \
		-v $(PWD):/workspace \
		-v $(HOME)/.gradle:/root/.gradle \
		-v $(HOME)/.android:/root/.android \
		--name $(DOCKER_CONTAINER) \
		$(DOCKER_IMAGE) \
		/bin/bash

docker-shell:
	@echo "Opening shell in Docker container..."
	@docker exec -it $(DOCKER_CONTAINER) /bin/bash

# Utility targets
verify-env:
	@echo "Verifying development environment..."
	@echo ""
	@echo "Java:"
	@java -version 2>&1 | head -1
	@which java
	@echo ""
	@echo "Android SDK:"
	@ls -la $(ANDROID_HOME) 2>/dev/null || echo "ANDROID_HOME not found"
	@echo ""
	@echo "Gradle:"
	@if [ -x $(GRADLE_CMD) ]; then \
		echo "Using local Gradle wrapper"; \
		$(JAVA21_WRAPPER) $(GRADLE_CMD) -p $(ANDROID_PROJECT_DIR) --version | head -1; \
	else \
		$(JAVA21_WRAPPER) gradle -p $(ANDROID_PROJECT_DIR) --version | head -1; \
	fi
	@echo ""
	@echo "Detekt:"
	@if command -v $(DETEKT) &> /dev/null; then \
		$(DETEKT) --version; \
	else \
		echo "Detekt not found"; \
	fi
	@echo ""
	@echo "Git:"
	@git --version
	@echo ""

daemon-stop:
	@echo "Stopping Gradle daemon..."
	@if [ -x $(GRADLE_CMD) ]; then \
		$(JAVA21_WRAPPER) $(GRADLE_CMD) -p $(ANDROID_PROJECT_DIR) --stop; \
	else \
		$(JAVA21_WRAPPER) gradle -p $(ANDROID_PROJECT_DIR) --stop; \
	fi
	@echo "Done"

# Convenience targets
all: clean analyze build
	@echo "Build completed successfully!"

quick-build: build
	@echo "Quick build completed!"

quick-test: test analyze
	@echo "Quick test completed!"

check: analyze test lint
	@bash ./scripts/verify-no-tauri.sh
	@echo "All checks completed!"

.DEFAULT_GOAL := help
