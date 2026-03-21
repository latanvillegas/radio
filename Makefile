.PHONY: help build clean analyze format test docker-build docker-run shell

# Variables
SHELL := /bin/bash
BUILD_SCRIPT := ./build.sh
GRADLE_CMD := ./gradlew
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
	@$(BUILD_SCRIPT) build

release:
	@echo "Building release APK..."
	@if [ -x $(GRADLE_CMD) ]; then \
		$(GRADLE_CMD) assembleRelease --no-daemon; \
	else \
		gradle assembleRelease --no-daemon; \
	fi

clean:
	@echo "Cleaning build artifacts..."
	@$(BUILD_SCRIPT) clean

# Analysis and testing targets
analyze:
	@echo "Running static analysis with Detekt..."
	@$(BUILD_SCRIPT) analyze

test:
	@echo "Running unit tests..."
	@if [ -x $(GRADLE_CMD) ]; then \
		$(GRADLE_CMD) test --no-daemon; \
	else \
		gradle test --no-daemon; \
	fi

android-test:
	@echo "Running Android instrumented tests..."
	@if [ -x $(GRADLE_CMD) ]; then \
		$(GRADLE_CMD) connectedAndroidTest --no-daemon; \
	else \
		gradle connectedAndroidTest --no-daemon; \
	fi

# Code quality targets
format:
	@echo "Formatting Kotlin code..."
	@if command -v ktfmt &> /dev/null; then \
		ktfmt --mode file src-tauri; \
	else \
		echo "ktfmt not installed. Skipping formatting."; \
	fi

lint:
	@echo "Running linting checks..."
	@if [ -x $(GRADLE_CMD) ]; then \
		$(GRADLE_CMD) lint --no-daemon; \
	else \
		gradle lint --no-daemon; \
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
		$(GRADLE_CMD) --version | head -1; \
	else \
		gradle --version | head -1; \
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
		$(GRADLE_CMD) --stop; \
	else \
		gradle --stop; \
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
	@echo "All checks completed!"

.DEFAULT_GOAL := help
