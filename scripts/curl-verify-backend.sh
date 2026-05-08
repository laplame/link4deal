#!/usr/bin/env bash
#
# Muestra el puerto definido para PM2 (ecosystem.config.cjs) y lanza curls de comprobación
# contra 127.0.0.1 en ese puerto. Nginx en producción debe hacer proxy al MISMO puerto.
#
# Uso (repo raíz): ./scripts/curl-verify-backend.sh
# Sobrescribe solo si sabes que PM2 usa otro puerto: BACKEND_PORT=XXXX ./scripts/curl-verify-backend.sh
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_PORT="$(cd "$ROOT" && node scripts/read-pm2-backend-port.cjs)"
PORT="${BACKEND_PORT:-$DEFAULT_PORT}"

echo "=== Backend (referencia única para Nginx/VPS): ecosystem.config.cjs → PORT=${DEFAULT_PORT}"
echo "=== Probando curl a http://127.0.0.1:${PORT} (BACKEND_PORT explícito: ${BACKEND_PORT:-'(ninguno)'})"
echo ""

code_health="$(curl -sS -o /tmp/curl-health-body.txt -w '%{http_code}' --connect-timeout 3 "http://127.0.0.1:${PORT}/health" 2>/dev/null)" || true
[[ "$code_health" =~ ^[0-9]{3}$ ]] || code_health='000'
echo "/health → HTTP ${code_health}"
head -c 180 /tmp/curl-health-body.txt 2>/dev/null | tr -d '\r' || true
echo ""
echo ""

code_prom="$(curl -sS -o /tmp/curl-prom-body.txt -w '%{http_code}' --connect-timeout 3 "http://127.0.0.1:${PORT}/api/promotions?limit=1" 2>/dev/null)" || true
[[ "$code_prom" =~ ^[0-9]{3}$ ]] || code_prom='000'
echo "/api/promotions?limit=1 → HTTP ${code_prom}"
head -c 120 /tmp/curl-prom-body.txt 2>/dev/null | tr -d '\r' || true
echo ""

echo ""
echo "=== Desarrollo local (Vite)"
echo "Para npm run dev, el proxy usa PORT del .env (típicamente 3000). Suele diferir del puerto PM2 (${DEFAULT_PORT})."
LOCAL_DEV="3000"
if [ -f "$ROOT/.env" ] && grep -qE '^[[:space:]]*PORT=[0-9]+' "$ROOT/.env"; then
  LOCAL_DEV="$(grep -E '^[[:space:]]*PORT=[0-9]+' "$ROOT/.env" | head -1 | cut -d= -f2 | tr -d ' \r')"
fi
echo "Según .env (PORT): ${LOCAL_DEV} — curl opcional:"
code_local="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 2 "http://127.0.0.1:${LOCAL_DEV}/health" 2>/dev/null)" || true
[[ "$code_local" =~ ^[0-9]{3}$ ]] || code_local='000'
echo "  http://127.0.0.1:${LOCAL_DEV}/health → HTTP ${code_local}"

if [ "${code_health}" = "000" ]; then
  echo ""
  echo "El backend no respondió en 127.0.0.1:${PORT}. ¿PM2 arrancado? pm2 list"
  exit 1
fi
