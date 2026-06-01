#!/usr/bin/env bash
# Tras rsync del front: nginx (www-data) debe poder leer dist/ e index.html.
# Uso en el VPS:
#   cd ~/project/link4deal && bash scripts/fix-dist-permissions.sh
#   sudo bash scripts/fix-dist-permissions.sh --chown-www-data

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST="${DIST_DIR:-$REPO_ROOT/dist}"

if [ ! -f "$DIST/index.html" ]; then
  echo "❌ No existe $DIST/index.html — haz npm run build y rsync dist/ primero." >&2
  exit 1
fi

echo "==> Permisos en $DIST"
find "$DIST" -type d -exec chmod 755 {} \;
find "$DIST" -type f -exec chmod 644 {} \;
chmod -R a+rX "$DIST"

if [ "${1:-}" = "--chown-www-data" ]; then
  if id www-data &>/dev/null; then
    echo "==> chown www-data:www-data"
    sudo chown -R www-data:www-data "$DIST"
  else
    echo "⚠️ Usuario www-data no existe; omite --chown-www-data" >&2
  fi
fi

echo "✅ Listo. Verifica:"
echo "   ls -la $DIST/index.html"
echo "   curl -sI https://www.damecodigo.com/ | head -3"
