#!/bin/bash

echo "🔍 Verificando sintaxis Kotlin..."
echo ""

FILES=(
    "android/app/src/main/java/online/latanvillegas/radiosatelital/domain/models/Station.kt"
    "android/app/src/main/java/online/latanvillegas/radiosatelital/domain/repositories/StationRepository.kt"
    "android/app/src/main/java/online/latanvillegas/radiosatelital/domain/usecases/RadioUseCases.kt"
    "android/app/src/main/java/online/latanvillegas/radiosatelital/presentation/viewmodels/RadioViewModel.kt"
    "android/app/src/main/java/online/latanvillegas/radiosatelital/presentation/screens/RadioScreen.kt"
    "android/app/src/main/java/online/latanvillegas/radiosatelital/data/repositories/StationRepositoryImpl.kt"
    "android/app/src/main/java/online/latanvillegas/radiosatelital/presentation/viewmodels/RadioViewModelTest.kt"
)

ERRORS=0

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        # Check for package declaration
        if ! grep -q "^package " "$file"; then
            echo "❌ $file: Falta package declaration"
            ((ERRORS++))
        fi
        
        # Check for balanced brackets
        open_brackets=$(grep -o "{" "$file" | wc -l)
        close_brackets=$(grep -o "}" "$file" | wc -l)
        
        if [ "$open_brackets" -ne "$close_brackets" ]; then
            echo "❌ $file: Brackets desbalanceados ($open_brackets opening, $close_brackets closing)"
            ((ERRORS++))
        else
            echo "✅ $file: Sintaxis OK"
        fi
    else
        echo "⚠️  $file: Archivo no encontrado"
    fi
done

echo ""
echo "═════════════════════════════════════════"
if [ "$ERRORS" -eq "0" ]; then
    echo "✅ VALIDACIÓN COMPLETADA: Sin errores"
else
    echo "❌ VALIDACIÓN FALLIDA: $ERRORS errores encontrados"
fi
echo "═════════════════════════════════════════"
