#!/bin/bash
# Liberar espacio en disco en el servidor (ej: cto@damecode)
# Uso: bash scripts/free-disk-space.sh
# Ejecutar en el servidor donde falla "No space left on device"

set -e

echo "=========================================="
echo "1. ESTADO DEL DISCO"
echo "=========================================="
df -h
echo ""

echo "=========================================="
echo "2. QUÉ OCUPA MÁS EN TU HOME/PROYECTO"
echo "=========================================="
du -h --max-depth=1 ~ 2>/dev/null | sort -hr | head -15
if [ -d ~/project/link4deal ]; then
  echo ""
  echo "--- Dentro de link4deal ---"
  du -h --max-depth=1 ~/project/link4deal 2>/dev/null | sort -hr | head -15
fi
echo ""

echo "=========================================="
echo "3. LIMPIEZAS SEGURAS (liberar espacio)"
echo "=========================================="

# Git: eliminar objetos sueltos y basura del repo actual (tras un pull fallido)
if [ -d .git ]; then
  echo "--- Limpiando caché de Git en este repo ---"
  git gc --prune=now 2>/dev/null || true
  git repack -a -d 2>/dev/null || true
  echo "Hecho."
fi

# npm cache
if command -v npm &>/dev/null; then
  echo "--- Limpiando caché npm ---"
  npm cache clean --force 2>/dev/null || true
  echo "Hecho."
fi

# APT (Debian/Ubuntu)
if command -v apt-get &>/dev/null; then
  echo "--- Limpiando APT ---"
  sudo apt-get clean 2>/dev/null || true
  sudo apt-get autoremove -y 2>/dev/null || true
  echo "Hecho."
fi

# Logs del sistema (mantener solo 3 días)
if command -v journalctl &>/dev/null; then
  echo "--- Reduciendo logs del sistema (journalctl) ---"
  sudo journalctl --vacuum-time=3d 2>/dev/null || true
  echo "Hecho."
fi

# Docker (suele ocupar mucho)
if command -v docker &>/dev/null; then
  echo "--- Limpiando Docker (imágenes/containers no usados) ---"
  docker system prune -af 2>/dev/null || true
  docker volume prune -f 2>/dev/null || true
  echo "Hecho."
fi

# Pip cache
if command -v pip &>/dev/null; then
  echo "--- Limpiando caché pip ---"
  pip cache purge 2>/dev/null || true
  echo "Hecho."
fi

# /tmp
echo "--- Limpiando /tmp (solo root puede) ---"
sudo rm -rf /tmp/* 2>/dev/null || true
echo "Hecho."

echo ""
echo "=========================================="
echo "4. DISCO DESPUÉS DE LIMPIEZA"
echo "=========================================="
df -h
echo ""

echo "=========================================="
echo "5. SI AÚN FALLA git pull"
echo "=========================================="
echo "En el repo link4deal puedes intentar:"
echo "  cd ~/project/link4deal"
echo "  git status"
echo "  git fetch origin"
echo "  git reset --hard origin/main   # solo si no te importa perder cambios locales"
echo "  # o: git pull"
echo ""
echo "Para ver qué carpetas ocupan más en todo el sistema (requiere sudo):"
echo "  sudo du -h --max-depth=1 / 2>/dev/null | sort -hr | head -20"
echo ""
