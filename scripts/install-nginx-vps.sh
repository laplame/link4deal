#!/usr/bin/env bash
#
# Instala el nginx.conf del repositorio en el VPS:
# genera una copia con rutas/puerto ajustables, la coloca en sites-available,
# asegura el enlace en sites-enabled, ejecuta nginx -t y recarga nginx.
#
# Ejecutar EN EL SERVIDOR desde la raíz del repo (tras git pull):
#   chmod +x scripts/install-nginx-vps.sh
#   ./scripts/install-nginx-vps.sh
#
# El puerto del upstream se toma de ecosystem.config.cjs (salvo BACKEND_PORT=... explícito).
#   PROJECT_ROOT=/home/ubuntu/apps/link4deal NGINX_SITE=mi-dominio.com ./scripts/install-nginx-vps.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SOURCE_CONF="${SOURCE_CONF:-$REPO_ROOT/nginx.conf}"
PROJECT_ROOT="${PROJECT_ROOT:-/home/cto/project/link4deal}"
PM2_BACKEND_PORT="$(cd "$REPO_ROOT" && node scripts/read-pm2-backend-port.cjs)"
BACKEND_PORT="${BACKEND_PORT:-$PM2_BACKEND_PORT}"
NGINX_SITE="${NGINX_SITE:-damecodigo.com}"
TARGET_AVAILABLE="/etc/nginx/sites-available/$NGINX_SITE"
TARGET_ENABLED="/etc/nginx/sites-enabled/$NGINX_SITE"
TMP_CONF="/tmp/link4deal-nginx-${NGINX_SITE}.$$"

if [ ! -f "$SOURCE_CONF" ]; then
  echo "Error: no existe el fichero fuente: $SOURCE_CONF" >&2
  exit 1
fi

if [ "$EUID" -ne 0 ] && ! command -v sudo &>/dev/null; then
  echo "Error: hace falta sudo o ejecutar como root para instalar en /etc/nginx/" >&2
  exit 1
fi

SUDO=""
if [ "$EUID" -ne 0 ]; then
  SUDO="sudo "
  if ! sudo -n true 2>/dev/null; then
    echo "Se pedirá la contraseña sudo para escribir en /etc/nginx/ y recargar nginx."
  fi
fi

echo "=== Instalar Nginx (VPS) ==="
echo "  Origen:     $SOURCE_CONF"
echo "  Destino:    $TARGET_AVAILABLE"
echo "  Habilitar:  $TARGET_ENABLED -> $TARGET_AVAILABLE"
echo "  Ruta SPA:   $PROJECT_ROOT/dist"
echo "  Backend:    127.0.0.1:$BACKEND_PORT (upstream)"
echo ""

sed -e "s|server 127\\.0\\.0\\.1:[0-9][0-9]*|server 127.0.0.1:${BACKEND_PORT}|g" \
    -e "s|/home/cto/project/link4deal|${PROJECT_ROOT}|g" \
    "$SOURCE_CONF" >"$TMP_CONF"

echo "Copiando configuración..."
${SUDO:+sudo }cp "$TMP_CONF" "$TARGET_AVAILABLE"
rm -f "$TMP_CONF"

echo "Creando enlace en sites-enabled (si no existía)..."
${SUDO:+sudo }ln -sf "$TARGET_AVAILABLE" "$TARGET_ENABLED"

echo "Probando sintaxis (nginx -t)..."
${SUDO:+sudo }nginx -t

echo "Recargando nginx..."
${SUDO:+sudo }systemctl reload nginx

echo ""
echo "Listo. Comprueba: curl -sI https://damecodigo.com/ | head -5"
