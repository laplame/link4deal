#!/usr/bin/env bash
#
# Despliegue al VPS por rsync (muestra cada comando antes de ejecutarlo).
#
# Uso:
#   export DEPLOY_SSH="cto@damecodigo.com"
#   pnpm run deploy:vps              # rsync completo (sin build; haz pnpm run build antes)
#   pnpm run deploy:vps:dist         # solo dist/ + pm2 restart (front ya compilado)
#   pnpm run deploy:vps:build        # build:full + rsync
#   bash scripts/deploy-vps-rsync.sh --src-only --skip-build
#   bash scripts/deploy-vps-rsync.sh --print-only
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DEPLOY_SSH="${DEPLOY_SSH:-cto@damecodigo.com}"
DEPLOY_DIR="${DEPLOY_DIR:-~/project/link4deal}"
SSH_OPTS="${SSH_OPTS:-}"

DO_BUILD=true
DO_SRC=true
DO_SERVER=true
DO_ENV=true
DO_DIST=true
DO_NGINX=true
DO_RESTART=true
PRINT_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --src-only)
      DO_DIST=false
      DO_NGINX=false
      ;;
    --dist-only)
      DO_BUILD=false
      DO_SRC=false
      DO_SERVER=false
      DO_ENV=false
      DO_NGINX=false
      ;;
    --server-only)
      DO_SRC=false
      DO_DIST=false
      DO_NGINX=false
      ;;
    --skip-build) DO_BUILD=false ;;
    --no-restart) DO_RESTART=false ;;
    --print-only) PRINT_ONLY=true ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
  esac
done

run_cmd() {
  printf '\n>>> %s\n' "$*"
  if [[ "$PRINT_ONLY" == true ]]; then
    return 0
  fi
  eval "$@"
}

# Un solo argumento remoto (evita que eval rompa "find -type d" → "-typed")
ssh_remote() {
  local remote_cmd="$1"
  printf '\n>>> ssh %s %q\n' "${DEPLOY_SSH}" "$remote_cmd"
  if [[ "$PRINT_ONLY" == true ]]; then
    return 0
  fi
  # shellcheck disable=SC2086
  ssh ${SSH_OPTS} "${DEPLOY_SSH}" "$remote_cmd"
}

RSYNC_SSH="ssh ${SSH_OPTS}"

echo "=========================================="
echo "  Deploy → ${DEPLOY_SSH}:${DEPLOY_DIR}"
echo "=========================================="

if [[ "$DO_ENV" == true ]] && [[ ! -f .env ]]; then
  echo "❌ Falta .env en la raíz del repo" >&2
  exit 1
fi

if [[ "$DO_DIST" == true ]] && [[ ! -f dist/index.html ]]; then
  echo "❌ Falta dist/index.html — ejecuta antes: pnpm run build" >&2
  exit 1
fi

# Fase 1: build local (opcional; por defecto sí, usar --skip-build si ya compilaste)
if [[ "$DO_BUILD" == true ]]; then
  echo ""
  echo "── Fase 1: build ──"
  run_cmd "pnpm run build"
fi

# Fase 2: deploy al VPS
echo ""
echo "── Fase 2: deploy (rsync + restart) ──"

if [[ "$DO_SRC" == true ]]; then
  run_cmd "rsync -avz --delete -e \"${RSYNC_SSH}\" src/ \"${DEPLOY_SSH}:${DEPLOY_DIR}/src/\""
fi

if [[ "$DO_SERVER" == true ]]; then
  run_cmd "rsync -avz -e \"${RSYNC_SSH}\" --exclude node_modules --exclude uploads server/ \"${DEPLOY_SSH}:${DEPLOY_DIR}/server/\""
fi

if [[ "$DO_ENV" == true ]]; then
  run_cmd "rsync -avz -e \"${RSYNC_SSH}\" .env \"${DEPLOY_SSH}:${DEPLOY_DIR}/.env\""
  run_cmd "rsync -avz -e \"${RSYNC_SSH}\" .env \"${DEPLOY_SSH}:${DEPLOY_DIR}/server/.env\""
fi

if [[ "$DO_DIST" == true ]]; then
  run_cmd "rsync -avz --delete -e \"${RSYNC_SSH}\" dist/ \"${DEPLOY_SSH}:${DEPLOY_DIR}/dist/\""
  if [[ -f scripts/fix-dist-permissions.sh ]]; then
    ssh_remote "mkdir -p ${DEPLOY_DIR}/scripts"
    run_cmd "rsync -avz -e \"${RSYNC_SSH}\" scripts/fix-dist-permissions.sh \"${DEPLOY_SSH}:${DEPLOY_DIR}/scripts/fix-dist-permissions.sh\""
  fi
fi

if [[ "$DO_NGINX" == true ]]; then
  run_cmd "rsync -avz -e \"${RSYNC_SSH}\" nginx.conf \"${DEPLOY_SSH}:${DEPLOY_DIR}/\""
fi

if [[ "$DO_RESTART" == true ]]; then
  # Permisos dist (script subido con rsync; fallback chmod sin "find -type d")
  ssh_remote "cd ${DEPLOY_DIR} && if [ -f scripts/fix-dist-permissions.sh ]; then bash scripts/fix-dist-permissions.sh; elif [ -f dist/index.html ]; then chmod -R a+rX dist; else echo 'Falta dist/index.html' >&2; exit 1; fi"
  # Solo front (--dist-only): nginx sirve dist/; no hace falta reiniciar PM2
  if [[ "$DO_SERVER" == true ]] || [[ "$DO_SRC" == true ]]; then
    ssh_remote "pm2 restart link4deal-backend && pm2 save"
    ssh_remote "curl -s -o /dev/null -w 'health:%{http_code}\n' http://127.0.0.1:5001/health || true"
  else
    ssh_remote "curl -s -o /dev/null -w 'site:%{http_code}\n' http://127.0.0.1/ | head -1 || true"
  fi
fi

echo ""
if [[ "$PRINT_ONLY" == true ]]; then
  echo "Modo --print-only: no se ejecutó nada. Copia los comandos >>> de arriba."
else
  echo "✅ Deploy terminado."
fi
