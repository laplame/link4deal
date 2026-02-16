#!/bin/bash
# Verifica si las fotos de las promociones son accesibles en el servidor (damecodigo.com).
# Uso: BASE_URL=https://damecodigo.com bash scripts/verify-images-accessible.sh

BASE_URL="${BASE_URL:-https://damecodigo.com}"
echo "=========================================="
echo "  Verificar acceso a imágenes de promociones"
echo "  BASE_URL: $BASE_URL"
echo "=========================================="
echo ""

# 1. Obtener lista de promociones
echo "1. Obteniendo promociones desde ${BASE_URL}/api/promotions..."
RESPONSE=$(curl -s "${BASE_URL}/api/promotions?limit=10&page=1&status=active")
if ! echo "$RESPONSE" | grep -q '"success":true'; then
  echo "   Error: la API no devolvió success. Comprueba que el backend responda."
  echo "$RESPONSE" | head -c 300
  exit 1
fi

# 2. Extraer URLs de imágenes (url, cloudinaryUrl o /uploads/promotions/filename)
echo ""
echo "2. Comprobando acceso a cada imagen..."
COUNT=0
OK=0
FAIL=0

# Usar grep/sed para extraer urls (compatible con entorno sin jq)
# Buscamos "url":"/uploads/ o "cloudinaryUrl":"http o "filename":"xxx"
while IFS= read -r line; do
  # Extraer url relativa tipo "/uploads/promotions/xxx"
  if echo "$line" | grep -q '"url"'; then
    URL=$(echo "$line" | sed -n 's/.*"url"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
  fi
  if echo "$line" | grep -q '"filename"'; then
    FILENAME=$(echo "$line" | sed -n 's/.*"filename"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
    [ -n "$FILENAME" ] && URL="/uploads/promotions/${FILENAME}"
  fi
  if echo "$line" | grep -q '"cloudinaryUrl"'; then
    URL=$(echo "$line" | sed -n 's/.*"cloudinaryUrl"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
  fi
done <<< "$RESPONSE"

# Encontrar todas las URLs de imagen en la respuesta (patrón simple)
# Forma más fiable: extraer con grep todas las apariciones de "url":" o "cloudinaryUrl":
for IMG_URL in $(echo "$RESPONSE" | grep -oE '"(url|cloudinaryUrl)"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:"\([^"]*\)".*/\1/'); do
  [ -z "$IMG_URL" ] && continue
  COUNT=$((COUNT + 1))
  # Si es relativa, prefijar BASE_URL
  if echo "$IMG_URL" | grep -q '^/'; then
    FULL_URL="${BASE_URL}${IMG_URL}"
  else
    FULL_URL="$IMG_URL"
  fi
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FULL_URL")
  if [ "$CODE" = "200" ]; then
    echo "   OK  $CODE  $IMG_URL"
    OK=$((OK + 1))
  else
    echo "   FALLO  $CODE  $IMG_URL"
    FAIL=$((FAIL + 1))
  fi
done

# Si no encontramos por el patrón anterior, buscar /uploads/promotions/ o filename
if [ "$COUNT" -eq 0 ]; then
  for PART in $(echo "$RESPONSE" | grep -oE '"/uploads/[^"]*"|"filename"[[:space:]]*:[[:space:]]*"[^"]+"' | tr -d '"' | sed 's/^filename[[:space:]]*:[[:space:]]*/\/uploads\/promotions\//'); do
    [ -z "$PART" ] && continue
    if echo "$PART" | grep -q '^/uploads/'; then
      IMG_URL="$PART"
    else
      IMG_URL="/uploads/promotions/$PART"
    fi
    COUNT=$((COUNT + 1))
    FULL_URL="${BASE_URL}${IMG_URL}"
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FULL_URL")
    if [ "$CODE" = "200" ]; then
      echo "   OK  $CODE  $IMG_URL"
      OK=$((OK + 1))
    else
      echo "   FALLO  $CODE  $IMG_URL"
      FAIL=$((FAIL + 1))
    fi
  done
fi

echo ""
echo "=========================================="
echo "  Resumen: $OK accesibles, $FAIL fallos (total: $COUNT imágenes)"
echo "=========================================="

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "Si las imágenes fallan: en el servidor comprueba que Nginx haga proxy de /uploads/ a localhost:3000"
  echo "y que la carpeta server/uploads/promotions/ exista y contenga los archivos."
  exit 1
fi
