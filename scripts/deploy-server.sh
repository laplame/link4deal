#!/bin/bash
#
# Script para ejecutar EN EL SERVIDOR (ej. cto@damecode).
# Actualiza el proyecto, aplica Nginx (puerto 3000), recarga y verifica con curl.
#
# Uso en el servidor:
#   cd ~/project/link4deal && bash scripts/deploy-server.sh
#
# Requiere: git, nginx, curl. Opcional: npm (si quieres build).

set -e
PROJECT_DIR="${PROJECT_DIR:-$HOME/project/link4deal}"
NGINX_SITE="link4deal"
BACKEND_PORT="${BACKEND_PORT:-3000}"

echo "=========================================="
echo "  Deploy en servidor - link4deal"
echo "  PROJECT_DIR: $PROJECT_DIR"
echo "  Backend port: $BACKEND_PORT"
echo "=========================================="
echo ""

# 1. Ir al proyecto y actualizar
echo "1. Git pull..."
cd "$PROJECT_DIR"
git pull
echo "   OK"
echo ""

# 2. Copiar nginx.conf y recargar Nginx
echo "2. Nginx: copiar config y recargar..."
sudo cp "$PROJECT_DIR/nginx.conf" "/etc/nginx/sites-available/$NGINX_SITE"
if sudo nginx -t 2>/dev/null; then
  sudo systemctl reload nginx
  echo "   Nginx recargado OK"
else
  echo "   ERROR: nginx -t falló. No se recargó."
  exit 1
fi
echo ""

# 3. Verificar que el backend responde en el puerto esperado
echo "3. Verificar backend en puerto $BACKEND_PORT..."
code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${BACKEND_PORT}/health" 2>/dev/null || echo "000")
if [ "$code" = "200" ]; then
  echo "   Backend responde OK (HTTP $code) en puerto $BACKEND_PORT"
else
  echo "   AVISO: Backend no responde en puerto $BACKEND_PORT (HTTP $code)"
  echo "   Asegúrate de tener PM2 o el proceso escuchando en $BACKEND_PORT."
  echo "   Ejemplo: pm2 start server/server.js --name server (usa PORT=3000 por defecto)"
fi
echo ""

# 4. Verificación con curl (localhost y dominio)
echo "4. Verificación con curl..."
echo "   - localhost:$BACKEND_PORT/health        : $(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${BACKEND_PORT}/health" 2>/dev/null || echo '---')"
echo "   - localhost:$BACKEND_PORT/api/promotions: $(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${BACKEND_PORT}/api/promotions?limit=1" 2>/dev/null || echo '---')"

# Si tenemos resolución del dominio en el servidor, probar HTTP
if curl -s -o /dev/null -w "%{http_code}" "http://damecodigo.com/health" 2>/dev/null | grep -q 200; then
  echo "   - http://damecodigo.com/health        : 200"
else
  h=$(curl -s -o /dev/null -w "%{http_code}" "http://damecodigo.com/health" 2>/dev/null || echo "---")
  echo "   - http://damecodigo.com/health        : $h"
fi
if curl -s -o /dev/null -w "%{http_code}" "http://damecodigo.com/api/promotions?limit=1" 2>/dev/null | grep -q 200; then
  echo "   - http://damecodigo.com/api/promotions: 200"
else
  h=$(curl -s -o /dev/null -w "%{http_code}" "http://damecodigo.com/api/promotions?limit=1" 2>/dev/null || echo "---")
  echo "   - http://damecodigo.com/api/promotions: $h"
fi
echo ""

# 5. Recordatorio HTTPS
echo "5. Si usas https://damecodigo.com y sigue 404:"
echo "   El server block de Nginx en puerto 443 debe tener los mismos"
echo "   location /api/ y /health con proxy_pass http://localhost:$BACKEND_PORT;"
echo "   Revisa: sudo ls /etc/nginx/sites-enabled/"
echo "   y el archivo que define listen 443 ssl (p. ej. link4deal o default)."
echo ""

echo "=========================================="
echo "  Deploy script terminado"
echo "=========================================="
