#!/bin/bash

# Script para verificar disponibilidad de streams de radio
# Prueba cada URL con diferentes headers y métodos

echo "🔍 Verificando disponibilidad de streams de radio..."
echo "=================================================="

# Leer el archivo JSON de estaciones
STATIONS_FILE="/workspaces/Radio_Satelital/satelital-radio/data/stations.json"

# Extraer URLs únicas
URLS=$(cat "$STATIONS_FILE" | grep -o '"url": "[^"]*"' | cut -d'"' -f4 | sort -u)

# Contadores
TOTAL=0
ACCESSIBLE=0
BLOCKED=0

while IFS= read -r url; do
    if [ -z "$url" ]; then
        continue
    fi
    
    TOTAL=$((TOTAL + 1))
    
    # Extraer el dominio
    DOMAIN=$(echo "$url" | sed -E 's|https?://([^/]+).*|\1|')
    
    echo ""
    echo "URL #$TOTAL: $DOMAIN"
    echo "   Full URL: $url"
    
    # Intento 1: Con User-Agent básico
    RESPONSE=$(curl -s -I -L --max-time 3 \
        -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
        -H "Range: bytes=0-1" \
        "$url" 2>&1 | head -1)
    
    HTTP_CODE=$(echo "$RESPONSE" | grep -oE "HTTP/[0-9.]+ [0-9]+" | tail -1 | awk '{print $2}')
    
    if [ -z "$HTTP_CODE" ]; then
        echo "   ❌ NO RESPONDE"
        BLOCKED=$((BLOCKED + 1))
    elif [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "206" ]; then
        echo "   ✅ ACCESIBLE (HTTP $HTTP_CODE)"
        ACCESSIBLE=$((ACCESSIBLE + 1))
    elif [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        echo "   ⚠️  REDIRIGE (HTTP $HTTP_CODE) - Podría funcionar"
        ACCESSIBLE=$((ACCESSIBLE + 1))
    else
        echo "   ❌ BLOQUEADO (HTTP $HTTP_CODE)"
        BLOCKED=$((BLOCKED + 1))
    fi
done <<< "$URLS"

echo ""
echo "=================================================="
echo "📊 RESUMEN"
echo "   Total URLs: $TOTAL"
echo "   ✅ Accesibles: $ACCESSIBLE"
echo "   ❌ Bloqueadas: $BLOCKED"
echo "   Tasa de éxito: $((ACCESSIBLE * 100 / TOTAL))%"
echo "=================================================="

if [ "$ACCESSIBLE" -lt $((TOTAL / 2)) ]; then
    echo ""
    echo "⚠️  ADVERTENCIA: Más del 50% de los streams están bloqueados"
    echo "   Se recomienda usar un proxy de streaming para mejorar compatibilidad"
fi
