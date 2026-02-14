#!/bin/bash
# Verificación de la API con curl (ejecutar en el servidor o desde tu máquina).
# Uso: bash scripts/verify-curl.sh
#      BASE_URL=https://damecodigo.com bash scripts/verify-curl.sh
#
# En el servidor (tras git pull y reload nginx):
#   bash scripts/verify-curl.sh
#   BASE_URL=http://localhost:3000 bash scripts/verify-curl.sh
#   BASE_URL=http://damecodigo.com bash scripts/verify-curl.sh
#   BASE_URL=https://damecodigo.com bash scripts/verify-curl.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"
echo "=========================================="
echo "  Verificación API con curl"
echo "  BASE_URL: $BASE_URL"
echo "=========================================="
echo ""

# 1. Health
echo "1. GET /health"
code=$(curl -s -o /tmp/curl-health.json -w "%{http_code}" "$BASE_URL/health")
echo "   HTTP $code"
if [ "$code" = "200" ]; then
  echo "   OK"
  grep -q '"status"' /tmp/curl-health.json 2>/dev/null && echo "   Body: $(head -c 120 /tmp/curl-health.json)..."
else
  echo "   FALLO (esperado 200)"
fi
echo ""

# 2. GET promociones
echo "2. GET /api/promotions?limit=2&page=1&status=active"
code=$(curl -s -o /tmp/curl-promos.json -w "%{http_code}" "$BASE_URL/api/promotions?limit=2&page=1&status=active")
echo "   HTTP $code"
if [ "$code" = "200" ]; then
  echo "   OK"
  if [ -s /tmp/curl-promos.json ]; then
    echo "   Body (primeros 200 chars): $(head -c 200 /tmp/curl-promos.json)..."
  fi
else
  echo "   FALLO (esperado 200). Posible: backend en otro puerto o Nginx no proxy /api/"
  echo "   Si es HTTPS: el server block de 443 debe incluir los mismos location /api/ y /health."
fi
echo ""

# 3. Resumen
echo "=========================================="
if [ "$code" = "200" ]; then
  echo "  Verificación OK - La API responde en $BASE_URL"
else
  echo "  Verificación FALLO - Revisa backend y Nginx (y HTTPS en 443 si usas https://)"
  exit 1
fi
echo "=========================================="
