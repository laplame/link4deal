#!/usr/bin/env bash
#
# Arranca y mantiene el backend Link4Deal con PM2 (server/index.js, NO server/server.js).
#
# Uso en el VPS:
#   cd ~/project/link4deal && bash scripts/ensure-backend-running.sh
#   bash scripts/ensure-backend-running.sh --with-cron   # + watchdog cada 2 min
#   bash scripts/ensure-backend-running.sh --setup-boot  # pm2 startup (reinicio del VPS)
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WITH_CRON=false
SETUP_BOOT=false
for arg in "$@"; do
  case "$arg" in
    --with-cron) WITH_CRON=true ;;
    --setup-boot) SETUP_BOOT=true ;;
    -h|--help)
      echo "Uso: $0 [--with-cron] [--setup-boot]"
      exit 0
      ;;
  esac
done

APP_NAME="link4deal-backend"
ECOSYSTEM="$ROOT/ecosystem.config.cjs"
LOG_DIR="$ROOT/logs"
PORT="$(node "$ROOT/scripts/read-pm2-backend-port.cjs" 2>/dev/null || echo 5001)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}!${NC} $*"; }
err() { echo -e "${RED}✗${NC} $*"; }

echo "=========================================="
echo "  Link4Deal — asegurar backend (PM2)"
echo "  Proyecto: $ROOT"
echo "  Puerto:   $PORT"
echo "=========================================="
echo ""

mkdir -p "$LOG_DIR"

# PM2 global
if ! command -v pm2 >/dev/null 2>&1; then
  warn "PM2 no instalado. Instalando globalmente..."
  npm install -g pm2 || {
    err "No se pudo instalar PM2. Ejecuta: sudo npm install -g pm2"
    exit 1
  }
fi
ok "PM2 disponible: $(pm2 -v 2>/dev/null | head -1)"

# Detener procesos incorrectos (mini-servidor sin /api/auth)
if pm2 list 2>/dev/null | grep -qE 'server\.js|server/server'; then
  warn "Deteniendo procesos PM2 que usan server.js (sin rutas de auth)..."
  pm2 list | awk '/server\.js/ {print $4}' | while read -r name; do
    [[ -n "$name" && "$name" != "name" ]] && pm2 delete "$name" 2>/dev/null || true
  done
fi

# Estado actual
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  script_path="$(pm2 show "$APP_NAME" 2>/dev/null | grep 'script path' | sed 's/.*│//;s/│//g' | xargs || true)"
  if [[ "$script_path" == *"server/server.js"* ]]; then
    warn "PM2 apunta a server/server.js — recreando con index.js..."
    pm2 delete "$APP_NAME" 2>/dev/null || true
  else
    ok "App PM2 '$APP_NAME' ya existe ($script_path)"
    pm2 restart "$APP_NAME" --update-env || true
  fi
fi

if ! pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  echo "Iniciando backend con ecosystem.config.cjs..."
  pm2 start "$ECOSYSTEM" --env production
  ok "PM2 start $APP_NAME"
fi

pm2 save
ok "Procesos guardados (pm2 save)"

if [[ "$SETUP_BOOT" == true ]]; then
  echo ""
  warn "Ejecuta el comando que PM2 imprima a continuación (sudo ...) para arranque al reiniciar el VPS:"
  pm2 startup || true
  pm2 save
fi

if [[ "$WITH_CRON" == true ]]; then
  WATCHDOG="$ROOT/scripts/server-watchdog.sh"
  chmod +x "$WATCHDOG" 2>/dev/null || true
  CRON_MARK="# link4deal-backend-watchdog"
  CRON_LINE="*/2 * * * * cd $ROOT && $WATCHDOG >> $LOG_DIR/watchdog-cron.log 2>&1"
  if crontab -l 2>/dev/null | grep -qF "$CRON_MARK"; then
    ok "Cron watchdog ya configurado"
  else
    (crontab -l 2>/dev/null; echo "$CRON_MARK"; echo "$CRON_LINE") | crontab -
    ok "Cron cada 2 min → $LOG_DIR/watchdog-cron.log"
  fi
fi

echo ""
echo "Esperando health check..."
sleep 3
code="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/health" 2>/dev/null || echo "000")"
if [[ "$code" == "200" ]]; then
  ok "Backend OK → http://127.0.0.1:${PORT}/health (HTTP 200)"
else
  err "Backend no responde en puerto $PORT (HTTP $code)"
  echo "  Revisa: pm2 logs $APP_NAME --lines 50"
  echo "  MongoDB en .env, espacio en disco, etc."
  exit 1
fi

echo ""
pm2 list
echo ""
echo -e "${GREEN}Listo.${NC} Comandos útiles:"
echo "  pm2 logs $APP_NAME"
echo "  pm2 restart $APP_NAME"
echo "  bash scripts/server-watchdog.sh"
echo "  bash scripts/ensure-backend-running.sh --with-cron --setup-boot  (primera vez en VPS)"
