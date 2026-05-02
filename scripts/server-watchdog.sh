#!/usr/bin/env bash
#
# Comprueba que la API responda en /health y, si falla, reinicia el proceso.
#
# Uso manual:
#   ./scripts/server-watchdog.sh
#   PORT=8080 ./scripts/server-watchdog.sh
#   HEALTH_URL=https://damecodigo.com/health ./scripts/server-watchdog.sh
#
# Cron (cada 2 minutos):
#   */2 * * * * cd /ruta/al/link4deal && HEALTH_URL=http://127.0.0.1:3000/health ./scripts/server-watchdog.sh >> logs/watchdog-cron.log 2>&1
#
# Variables:
#   HEALTH_URL     URL completa del health (por defecto http://127.0.0.1:$PORT/health)
#   PORT           Solo si no defines HEALTH_URL (default 3000)
#   PM2_APP_NAME   Nombre en PM2 (default link4deal-backend)
#   RESTART_CMD    Si está definido, se ejecuta en lugar de pm2 restart (ej: systemctl restart link4deal)
#   WATCHDOG_TIMEOUT  Segundos para curl (default 8)
#   LOG_FILE       Log del watchdog (default logs/watchdog.log)
#
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

PORT="${PORT:-3000}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${PORT}/health}"
PM2_APP="${PM2_APP_NAME:-link4deal-backend}"
TIMEOUT="${WATCHDOG_TIMEOUT:-8}"
LOG_DIR="${LOG_DIR:-$ROOT/logs}"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_FILE:-$LOG_DIR/watchdog.log}"

log() {
  echo "[$(date "+%Y-%m-%d %H:%M:%S")] $*" | tee -a "$LOG_FILE"
}

check_health() {
  local tmp code
  tmp="$(mktemp)"
  code="$(curl -sS --max-time "$TIMEOUT" -o "$tmp" -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")"
  if [[ "$code" != "200" ]]; then
    rm -f "$tmp"
    log "FAIL $HEALTH_URL → HTTP $code"
    return 1
  fi
  if ! node -e "
    const fs = require('fs');
    const p = process.argv[1];
    let d;
    try { d = JSON.parse(fs.readFileSync(p, 'utf8')); }
    catch (e) { process.exit(1); }
    process.exit(d.success === true && d.status === 'healthy' ? 0 : 1);
  " "$tmp" 2>/dev/null; then
    rm -f "$tmp"
    log "FAIL $HEALTH_URL → body no es healthy (success/status)"
    return 1
  fi
  rm -f "$tmp"
  return 0
}

if check_health; then
  log "OK $HEALTH_URL"
  exit 0
fi

log "Servidor no responde bien — intentando reinicio"

if [[ -n "${RESTART_CMD:-}" ]]; then
  log "Ejecutando RESTART_CMD"
  if ! eval "$RESTART_CMD"; then
    log "ERROR: RESTART_CMD falló"
    exit 1
  fi
elif command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
    log "pm2 restart $PM2_APP"
    if ! pm2 restart "$PM2_APP"; then
      log "ERROR: pm2 restart falló"
      exit 1
    fi
  else
    log "ERROR: PM2 no tiene la app '$PM2_APP'. Crea: pm2 start ecosystem.config.cjs — o define RESTART_CMD."
    exit 1
  fi
else
  log "ERROR: No hay PM2 ni RESTART_CMD. Instala PM2 o export RESTART_CMD='systemctl restart tu-servicio'"
  exit 1
fi

sleep "${WATCHDOG_POST_RESTART_SLEEP:-4}"

if check_health; then
  log "OK tras reinicio"
  exit 0
fi

log "CRITICAL: sigue fallando tras reinicio"
exit 1
