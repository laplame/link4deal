#!/bin/bash
# Ejecutar en el servidor (ej. cto@damecode) desde la raíz del proyecto:
#   cd ~/project/link4deal && bash scripts/pull-and-verify-deploy.sh
#
# Hace: git pull, npm install, build, pm2 reload, nginx reload, y verificación.

set -e
cd "$(dirname "$0")/.."
PROJECT_DIR="$(pwd)"
BACKEND_PORT="${BACKEND_PORT:-5001}"

echo "=========================================="
echo "1. GIT PULL"
echo "=========================================="
git pull
echo ""

echo "=========================================="
echo "2. NPM INSTALL"
echo "=========================================="
npm install
echo ""

echo "=========================================="
echo "3. BUILD (frontend)"
echo "=========================================="
npm run build
echo ""

echo "=========================================="
echo "4. PM2 RELOAD"
echo "=========================================="
if command -v pm2 &>/dev/null; then
  pm2 reload ecosystem.config.cjs --env production 2>/dev/null || pm2 start ecosystem.config.cjs --env production
  pm2 save
  echo "PM2 OK."
else
  echo "PM2 no instalado; saltando."
fi
echo ""

echo "=========================================="
echo "5. NGINX RELOAD"
echo "=========================================="
if command -v nginx &>/dev/null && sudo -n true 2>/dev/null; then
  sudo nginx -t 2>/dev/null && sudo systemctl reload nginx 2>/dev/null && echo "Nginx OK." || echo "Nginx: no se pudo recargar (revisar sudo nginx -t)."
else
  echo "Nginx: no recargado (requiere sudo o nginx no instalado)."
fi
echo ""

echo "=========================================="
echo "6. VERIFICACIÓN"
echo "=========================================="
# Health del backend
if curl -sf "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; then
  echo "  Backend (health): OK - http://127.0.0.1:${BACKEND_PORT}/health"
else
  echo "  Backend (health): FALLO - no responde en puerto ${BACKEND_PORT}"
fi

# PM2
if command -v pm2 &>/dev/null; then
  echo ""
  pm2 list
fi

echo ""
echo "=========================================="
echo "Deploy actualizado. Revisa arriba si algo falló."
echo "=========================================="
