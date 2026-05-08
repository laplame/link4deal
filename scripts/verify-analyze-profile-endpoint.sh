#!/usr/bin/env bash
#
# Comprueba que POST /api/analyze-profile-image existe en Express (respuesta JSON, no HTML).
# En el VPS, sin multipart válido debe devolver 400 JSON (falta type o archivo).
#
# Uso:
#   bash scripts/verify-analyze-profile-endpoint.sh                    # mismo puerto que ecosystem (PM2)
#   BACKEND_PORT=XXXX bash scripts/verify-analyze-profile-endpoint.sh  # sólo si hace falta
#   bash scripts/verify-analyze-profile-endpoint.sh --public https://www.damecodigo.com
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PM2_PORT="$(cd "$ROOT" && node scripts/read-pm2-backend-port.cjs)"
BACKEND_PORT="${BACKEND_PORT:-$PM2_PORT}"
LOCAL_URL="${LOCAL_URL:-http://127.0.0.1:${BACKEND_PORT}/api/analyze-profile-image}"

check_url() {
  local url="$1"
  local label="$2"
  echo "=== ${label} ==="
  echo "POST $url"
  code="$(curl -sS -o /tmp/analyze-prof-body.txt -w '%{http_code}' -X POST "$url" 2>/dev/null)" || true
  [[ "$code" =~ ^[0-9]{3}$ ]] || code='000'
  head="$(head -c 120 /tmp/analyze-prof-body.txt | tr -d '\r')"
  echo "HTTP ${code}"
  echo "Cuerpo (primeros bytes): ${head}…"
  if [[ "$head" == *"<html"* ]] || [[ "$head" == *"<!DOCTYPE"* ]]; then
    echo "ERROR: respuesta HTML: Nginx no enruta /api al backend, o la URL es incorrecta (ej. doble /api)."
    return 1
  fi
  if ! node -e "JSON.parse(require('fs').readFileSync('/tmp/analyze-prof-body.txt','utf8'))" 2>/dev/null; then
    echo "ERROR: no es JSON válido."
    return 1
  fi
  echo "OK: JSON válido (esperable 400 sin image/type en form-data)."
}

if [[ "${1:-}" == "--public" ]] && [[ -n "${2:-}" ]]; then
  check_url "${2%/}/api/analyze-profile-image" "Dominio público (HTTPS)"
else
  check_url "$LOCAL_URL" "Backend local (directo)"
fi
