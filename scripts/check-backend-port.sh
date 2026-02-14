#!/bin/bash
# En el servidor: ver en qué puerto escucha el backend y si responde /api/promotions
# Uso: bash scripts/check-backend-port.sh

echo "=== Puertos 3000 y 5001 ==="
ss -tlnp 2>/dev/null | grep -E ':3000|:5001' || netstat -tlnp 2>/dev/null | grep -E ':3000|:5001' || echo "No se encontró proceso en 3000/5001"
echo ""
echo "=== PM2 procesos (script y env) ==="
pm2 list
echo ""
for name in server index link4deal-backend; do
  if pm2 describe "$name" &>/dev/null; then
    echo "--- $name ---"
    pm2 show "$name" 2>/dev/null | grep -E "script path|exec cwd|PORT"
  fi
done
echo ""
echo "=== Prueba API en 3000 ==="
curl -s -o /dev/null -w "localhost:3000/api/promotions → HTTP %{http_code}\n" "http://localhost:3000/api/promotions?limit=1"
echo ""
echo "=== Prueba API en 5001 ==="
curl -s -o /dev/null -w "localhost:5001/api/promotions → HTTP %{http_code}\n" "http://localhost:5001/api/promotions?limit=1"
