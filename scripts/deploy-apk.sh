#!/usr/bin/env bash
#
# Sube el APK Android al servidor (public/assets) por SSH.
# El binario no va en git; hay que copiarlo tras cada build.
#
# Uso:
#   cd /ruta/al/link4deal
#   export DEPLOY_SSH="cto@damecodigo.com"   # o tu user@host
#   npm run deploy:apk
#
# O en una línea:
#   DEPLOY_SSH="usuario@servidor" bash scripts/deploy-apk.sh
#
#   DEPLOY_SSH="usuario@servidor" DEPLOY_REMOTE_DIR="~/project/link4deal/public/assets" bash scripts/deploy-apk.sh
#
# Variables opcionales:
#   DEPLOY_SSH          usuario@host (obligatorio si no pasas $1)
#   DEPLOY_REMOTE_DIR   directorio remoto (default: ~/project/link4deal/public/assets)
#   APK_LOCAL           ruta local al .apk (default: public/assets/build-1777749250753.apk)
#   SSH_OPTS            opciones extra para ssh/scp (ej. "-i ~/.ssh/id_ed25519")
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

APK_LOCAL="${APK_LOCAL:-$ROOT/public/assets/build-1777749250753.apk}"
DEPLOY_SSH="${DEPLOY_SSH:-${1:-}}"
DEPLOY_REMOTE_DIR="${DEPLOY_REMOTE_DIR:-~/project/link4deal/public/assets}"
SSH_OPTS="${SSH_OPTS:-}"

if [[ -z "$DEPLOY_SSH" ]]; then
  echo "Error: indica destino SSH."
  echo "  DEPLOY_SSH=usuario@host npm run deploy:apk"
  echo "  o: bash scripts/deploy-apk.sh usuario@host"
  exit 1
fi

if [[ ! -f "$APK_LOCAL" ]]; then
  echo "Error: no existe el APK local:"
  echo "  $APK_LOCAL"
  echo "Copia aquí el build o define APK_LOCAL=/ruta/al/archivo.apk"
  exit 1
fi

NAME="$(basename "$APK_LOCAL")"
echo "==> Destino: $DEPLOY_SSH:$DEPLOY_REMOTE_DIR/$NAME"
echo "==> Origen:  $APK_LOCAL ($(du -h "$APK_LOCAL" | cut -f1))"

# Crear carpeta remota (~ se expande en el servidor si no va entre comillas en el comando remoto)
ssh $SSH_OPTS "$DEPLOY_SSH" "mkdir -p $DEPLOY_REMOTE_DIR"

# Subir
scp $SSH_OPTS "$APK_LOCAL" "${DEPLOY_SSH}:${DEPLOY_REMOTE_DIR}/"

echo "==> Listo. Verifica en el servidor:"
echo "    ls -la $DEPLOY_REMOTE_DIR/$NAME"
echo "    curl -sI \"https://TU_DOMINIO/public/assets/$NAME\" | head -3"
echo "    (o /public/assets/ según cómo proxees Nginx al backend)"
