#!/usr/bin/env bash
# Auditoría de disco en el VPS (o local) + limpieza opcional de temporales.
#
# Uso en el servidor:
#   cd ~/project/link4deal && bash scripts/vps-disk-audit.sh
#   cd ~/project/link4deal && bash scripts/vps-disk-audit.sh --clean
#   cd ~/project/link4deal && bash scripts/vps-disk-audit.sh --clean --yes
#
# --clean   Ejecuta limpieza segura (logs, cachés npm, tmp viejos)
# --emergency  Solo rm/truncate (sin npm). Usar cuando df muestra 100% / ENOSPC
# --yes     Sin confirmación interactiva
# --dry-run Solo muestra qué borraría (con --clean)

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

CLEAN=false
EMERGENCY=false
YES=false
DRY=false
for arg in "$@"; do
  case "$arg" in
    --clean) CLEAN=true ;;
    --emergency) EMERGENCY=true; CLEAN=true; YES=true ;;
    --yes) YES=true ;;
    --dry-run) DRY=true; CLEAN=true ;;
    -h|--help)
      echo "Uso: $0 [--clean] [--emergency] [--yes] [--dry-run]"
      echo "  --emergency  Disco lleno (ENOSPC): borra caché npm con rm, trunca logs, sin npm cache clean"
      exit 0
      ;;
  esac
done

# Detectar raíz del proyecto
if [[ -f "$(pwd)/ecosystem.config.cjs" ]]; then
  PROJECT="$(pwd)"
elif [[ -f "$HOME/project/link4deal/ecosystem.config.cjs" ]]; then
  PROJECT="$HOME/project/link4deal"
else
  PROJECT="$(pwd)"
fi

section() { echo -e "\n${CYAN}=== $1 ===${NC}"; }
hr() { echo "----------------------------------------"; }

section "Disco (df)"
df -h / /home 2>/dev/null || df -h
echo ""
df -i / 2>/dev/null | head -2 || true

section "Top 15 en $PROJECT"
if [[ -d "$PROJECT" ]]; then
  du -sh "$PROJECT"/* "$PROJECT"/.[^.]* 2>/dev/null | sort -hr | head -15 || true
else
  echo "No existe $PROJECT"
fi

section "Detalle típico Link4Deal"
for p in \
  "$PROJECT/node_modules" \
  "$PROJECT/server/node_modules" \
  "$PROJECT/dist" \
  "$PROJECT/.git" \
  "$PROJECT/public" \
  "$PROJECT/public/assets" \
  "$PROJECT/server/uploads" \
  "$PROJECT/logs" \
  "$PROJECT/server/server" \
  "$PROJECT/server/server/server"
do
  [[ -e "$p" ]] && du -sh "$p" 2>/dev/null || true
done

section "Logs PM2 (proyecto)"
if [[ -d "$PROJECT/logs" ]]; then
  ls -lah "$PROJECT/logs" 2>/dev/null || true
  du -sh "$PROJECT/logs"/* 2>/dev/null | sort -hr || true
fi

section "Caché npm (usuario actual)"
if [[ -d "$HOME/.npm" ]]; then
  du -sh "$HOME/.npm" "$HOME/.npm/_cacache" 2>/dev/null || du -sh "$HOME/.npm"
fi

section "Logs sistema (si hay permiso)"
for p in /var/log/nginx /var/log/journal; do
  if [[ -d "$p" ]] && [[ -r "$p" ]]; then
    echo -n "$p: "
    du -sh "$p" 2>/dev/null || echo "?"
  fi
done
if command -v journalctl >/dev/null 2>&1; then
  journalctl --disk-usage 2>/dev/null || true
fi

section "Archivos grandes (>50M) en el proyecto"
find "$PROJECT" -xdev -type f -size +50M 2>/dev/null | head -20 || true

if [[ "$CLEAN" != true ]]; then
  echo ""
  echo -e "${YELLOW}Para limpiar temporales seguros: bash $0 --clean${NC}"
  echo -e "${YELLOW}Disco lleno / ENOSPC:           bash $0 --emergency${NC}"
  echo -e "${YELLOW}Simular sin borrar:              bash $0 --dry-run${NC}"
  exit 0
fi

[[ "$EMERGENCY" == true ]] && echo -e "${RED}Modo emergencia: sin npm (solo rm/truncate)${NC}"

section "Limpieza segura"
[[ "$DRY" == true ]] && echo -e "${YELLOW}Modo dry-run: no se borrará nada${NC}"

run_clean() {
  local desc="$1"
  shift
  echo -e "${YELLOW}→ $desc${NC}"
  if [[ "$DRY" == true ]]; then
    echo "  (dry-run) $*"
    return 0
  fi
  if [[ "$YES" != true ]]; then
    read -r -p "  ¿Ejecutar? [y/N] " ans
    [[ "$ans" =~ ^[yY] ]] || { echo "  omitido"; return 0; }
  fi
  eval "$@" && echo -e "  ${GREEN}ok${NC}" || echo -e "  ${RED}falló${NC}"
}

# 1b. Truncar TODOS los logs del proyecto en emergencia
if [[ "$EMERGENCY" == true ]] && [[ -d "$PROJECT/logs" ]]; then
  run_clean "Truncar todos los logs en $PROJECT/logs" \
    "find '$PROJECT/logs' -type f -exec sh -c ': > \"\$1\"' _ {} \\; 2>/dev/null || true"
fi

# 1. Truncar logs PM2 del proyecto (>10MB)
if [[ -d "$PROJECT/logs" ]]; then
  while IFS= read -r -d '' f; do
  size=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f" 2>/dev/null || echo 0)
  if [[ "$size" -gt 10485760 ]]; then
    run_clean "Truncar log grande: $f" ": > '\"$f\"'"
  fi
  done < <(find "$PROJECT/logs" -type f -name '*.log' -print0 2>/dev/null)
fi

# 2. Caché npm — con rm directo (npm cache clean falla si ENOSPC)
if [[ -d "$HOME/.npm/_cacache" ]]; then
  run_clean "Eliminar ~/.npm/_cacache (rm -rf)" "rm -rf '$HOME/.npm/_cacache'"
fi
if [[ "$EMERGENCY" != true ]]; then
  run_clean "npm cache clean --force" "npm cache clean --force 2>/dev/null || true"
fi

# 3. Temporales del proyecto
run_clean "Borrar *.tmp / *.temp en proyecto" \
  "find '$PROJECT' -type f \\( -name '*.tmp' -o -name '*.temp' -o -name '.DS_Store' \\) -delete 2>/dev/null || true"

# 4. node_modules/.cache (vite, etc.)
if [[ -d "$PROJECT/node_modules/.cache" ]]; then
  run_clean "Borrar node_modules/.cache (raíz)" "rm -rf '$PROJECT/node_modules/.cache'"
fi
if [[ -d "$PROJECT/server/node_modules/.cache" ]]; then
  run_clean "Borrar server/node_modules/.cache" "rm -rf '$PROJECT/server/node_modules/.cache'"
fi

# 5. Carpeta anidada accidental server/server (duplicado, no es el entrypoint)
if [[ -d "$PROJECT/server/server/node_modules" ]]; then
  run_clean "Eliminar server/server/ (copia anidada accidental con node_modules)" \
    "rm -rf '$PROJECT/server/server'"
fi

# 6. /tmp del usuario (archivos >7 días)
run_clean "Borrar en /tmp archivos del usuario >7 días" \
  "find /tmp -maxdepth 1 -user \"\$(whoami)\" -type f -mtime +7 -delete 2>/dev/null || true"

# 7. PM2 flush logs
if command -v pm2 >/dev/null 2>&1; then
  if [[ "$EMERGENCY" == true ]]; then
    run_clean "Vaciar ~/.pm2/logs (rm contenido)" \
      "find \"\$HOME/.pm2/logs\" -type f -exec sh -c ': > \"\$1\"' _ {} \\; 2>/dev/null || true"
  else
    run_clean "pm2 flush (vaciar logs PM2 en ~/.pm2/logs)" "pm2 flush 2>/dev/null || true"
  fi
fi

# 8. Sistema (requiere sudo) — opcional
if [[ "$EMERGENCY" == true ]]; then
  echo ""
  echo -e "${YELLOW}Limpieza sistema (ejecutar manualmente si hace falta más espacio):${NC}"
  echo "  sudo rm -rf /var/cache/apt/archives/*.deb"
  echo "  sudo journalctl --vacuum-size=50M"
  echo "  sudo find /var/log -name '*.gz' -delete"
elif [[ "$YES" == true ]] || [[ "$DRY" == true ]]; then
  echo ""
  echo -e "${YELLOW}Limpieza sistema (sudo, opcional):${NC}"
  echo "  sudo journalctl --vacuum-time=7d"
  echo "  sudo apt-get clean && sudo apt-get autoclean"
  echo "  sudo find /var/log/nginx -name '*.gz' -mtime +30 -delete"
else
  read -r -p "¿Limpiar journal (7d) y apt cache con sudo? [y/N] " sys
  if [[ "$sys" =~ ^[yY] ]] && [[ "$DRY" != true ]]; then
    sudo journalctl --vacuum-time=7d 2>/dev/null || true
    sudo apt-get clean 2>/dev/null || true
    sudo apt-get autoclean 2>/dev/null || true
    sudo find /var/log/nginx -name '*.gz' -mtime +30 -delete 2>/dev/null || true
    echo -e "${GREEN}Limpieza sistema hecha${NC}"
  fi
fi

section "Disco después"
df -h / 2>/dev/null | head -2
echo -e "\n${GREEN}Listo.${NC}"
echo -e "${YELLOW}NO se borró server/uploads (imágenes de usuarios). Revisar manualmente si sigue lleno.${NC}"
