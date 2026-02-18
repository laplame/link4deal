#!/usr/bin/env bash
#
# Genera o actualiza el archivo .conf de Nginx para damecodigo.com/link4deal.
# Usa nginx.conf del repo y opcionalmente sustituye variables.
#
# Uso:
#   ./scripts/update-nginx-conf.sh                    # Imprime la config a stdout
#   ./scripts/update-nginx-conf.sh --output archivo    # Escribe en archivo
#   ./scripts/update-nginx-conf.sh --print-instructions # Imprime cómo aplicar en el servidor
#
# Variables de entorno (opcionales):
#   BACKEND_PORT     Puerto del backend (PM2). Por defecto: 5001
#   PROJECT_ROOT     Ruta del proyecto en el servidor. Por defecto: /home/cto/project/link4deal
#   SERVER_NAME      server_name. Por defecto: damecodigo.com www.damecodigo.com
#   NGINX_CONF_SOURCE  Ruta del nginx.conf a usar. Por defecto: repo/nginx.conf
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_CONF="${NGINX_CONF_SOURCE:-$REPO_ROOT/nginx.conf}"
BACKEND_PORT="${BACKEND_PORT:-5001}"
PROJECT_ROOT="${PROJECT_ROOT:-/home/cto/project/link4deal}"
SERVER_NAME="${SERVER_NAME:-damecodigo.com www.damecodigo.com}"
TARGET_CONF="/etc/nginx/sites-available/damecodigo.com"

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

print_instructions() {
  echo "=== Cómo actualizar Nginx en el servidor ==="
  echo ""
  echo "1. En el servidor, desde el repo (o copiando el .conf):"
  echo "   cd /home/cto/project/link4deal"
  echo "   git pull"
  echo ""
  echo "2. Generar/actualizar el .conf (opcional, si usas variables):"
  echo "   BACKEND_PORT=5001 PROJECT_ROOT=/home/cto/project/link4deal \\"
  echo "   ./scripts/update-nginx-conf.sh --output /tmp/damecodigo.com.conf"
  echo ""
  echo "3. Copiar a Nginx y recargar:"
  echo "   sudo cp nginx.conf /etc/nginx/sites-available/damecodigo.com"
  echo "   # O si generaste en /tmp:"
  echo "   # sudo cp /tmp/damecodigo.com.conf /etc/nginx/sites-available/damecodigo.com"
  echo "   sudo nginx -t && sudo systemctl reload nginx"
  echo ""
  echo "4. Comprobar que el backend escucha en el puerto correcto:"
  echo "   curl -s -o /dev/null -w \"%{http_code}\" http://127.0.0.1:${BACKEND_PORT}/health"
  echo ""
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
  --print-instructions)
    print_instructions
    ;;
  *)
    generate_conf
    ;;
esac
