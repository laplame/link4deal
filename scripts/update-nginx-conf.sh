#!/usr/bin/env bash
#
# Genera y/o instala el .conf de Nginx para damecodigo.com/link4deal.
# Ejecutar EN EL SERVIDOR desde la raíz del repo: ./scripts/update-nginx-conf.sh --install
#
# Uso:
#   ./scripts/update-nginx-conf.sh                    # Imprime la config generada
#   ./scripts/update-nginx-conf.sh --output archivo    # Escribe en archivo
#   ./scripts/update-nginx-conf.sh --install           # Genera, copia a Nginx, nginx -t y reload (pide sudo)
#   ./scripts/update-nginx-conf.sh --check-backend     # Comprueba si el backend responde en BACKEND_PORT
#
# Variables de entorno (opcionales):
#   BACKEND_PORT      Puerto del backend (PM2). Por defecto: 5001
#   PROJECT_ROOT      Ruta del proyecto. Por defecto: /home/cto/project/link4deal
#   SERVER_NAME       server_name. Por defecto: damecodigo.com www.damecodigo.com
#   NGINX_CONF_SOURCE Ruta del nginx.conf. Por defecto: repo/nginx.conf
#   NGINX_SITES_AVAILABLE Ruta destino. Por defecto: /etc/nginx/sites-available/damecodigo.com
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_CONF="${NGINX_CONF_SOURCE:-$REPO_ROOT/nginx.conf}"
BACKEND_PORT="${BACKEND_PORT:-5001}"
PROJECT_ROOT="${PROJECT_ROOT:-/home/cto/project/link4deal}"
SERVER_NAME="${SERVER_NAME:-damecodigo.com www.damecodigo.com}"
TARGET_CONF="${NGINX_SITES_AVAILABLE:-/etc/nginx/sites-available/damecodigo.com}"
TMP_CONF="/tmp/damecodigo.com.conf.$$"

if [ ! -f "$SOURCE_CONF" ]; then
  echo "Error: no se encuentra $SOURCE_CONF" >&2
  exit 1
fi

generate_conf() {
  sed -e "s|http://127.0.0.1:5001|http://127.0.0.1:${BACKEND_PORT}|g" \
      -e "s|/home/cto/project/link4deal|${PROJECT_ROOT}|g" \
      -e "s|server_name damecodigo.com www.damecodigo.com|server_name ${SERVER_NAME}|g" \
      "$SOURCE_CONF"
}

check_backend() {
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${BACKEND_PORT}/health" 2>/dev/null || echo "000")
  if [ "$code" = "000" ]; then
    echo "⚠️  El backend NO responde en el puerto ${BACKEND_PORT}." >&2
    echo "   Comprueba: pm2 list && pm2 logs" >&2
    echo "   Si el backend usa otro puerto (ej. 3000), ejecuta:" >&2
    echo "   BACKEND_PORT=3000 $0 --install" >&2
    return 1
  fi
  echo "✅ Backend responde en ${BACKEND_PORT}: HTTP ${code}"
  return 0
}

do_install() {
  echo "Generando config (BACKEND_PORT=${BACKEND_PORT}, PROJECT_ROOT=${PROJECT_ROOT})..."
  generate_conf > "$TMP_CONF"
  echo "Copiando a ${TARGET_CONF}..."
  sudo cp "$TMP_CONF" "$TARGET_CONF"
  rm -f "$TMP_CONF"
  echo "Comprobando sintaxis Nginx..."
  sudo nginx -t
  echo "Recargando Nginx..."
  sudo systemctl reload nginx
  echo "✅ Nginx actualizado y recargado."
  echo ""
  if ! check_backend; then
    echo "   Las peticiones a /api/ y /uploads/ fallarán hasta que el backend esté en marcha en el puerto ${BACKEND_PORT}." >&2
    exit 1
  fi
}

case "${1:-}" in
  --output)
    OUT="${2:-}"
    if [ -z "$OUT" ]; then
      echo "Uso: $0 --output <archivo>" >&2
      exit 1
    fi
    generate_conf > "$OUT"
    echo "Config escrita en: $OUT"
    ;;
  --install)
    do_install
    ;;
  --check-backend)
    check_backend || exit 1
    ;;
  --print-instructions)
    echo "=== En el servidor (cto@damecode) ==="
    echo ""
    echo "  cd /home/cto/project/link4deal"
    echo "  git pull"
    echo "  ./scripts/update-nginx-conf.sh --install"
    echo ""
    echo "Si el backend va en otro puerto (ej. 3000):"
    echo "  BACKEND_PORT=3000 ./scripts/update-nginx-conf.sh --install"
    echo ""
    echo "Solo comprobar que el backend responde:"
    echo "  ./scripts/update-nginx-conf.sh --check-backend"
    ;;
  *)
    generate_conf
    ;;
esac
