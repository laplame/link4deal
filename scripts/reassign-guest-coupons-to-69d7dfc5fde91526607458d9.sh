#!/usr/bin/env bash
#
# Reasigna DiscountQrToken con payload.influencerId tipo "guest" al influencer:
#   69d7dfc5fde91526607458d9
#
# Requisitos: MONGODB_URI_ATLAS o MONGODB_URI en .env (raíz o server/).
#
# Opcional (recomendado para no tocar otras campañas):
#   export PROMOTION_ID=69fb8c2100fd7f1ab7656671   # ObjectId de la promoción
#
# Solo canjes (--redeemed-only) viene activado por defecto.
# Para incluir también cupones sin usar aún:
#   export REDEEMED_ONLY=0
#
# Uso desde la raíz del repo:
#   ./scripts/reassign-guest-coupons-to-69d7dfc5fde91526607458d9.sh           # dry-run (no escribe)
#   ./scripts/reassign-guest-coupons-to-69d7dfc5fde91526607458d9.sh apply      # ejecuta updateMany en MongoDB
#

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

readonly INFLUENCER_ID="69d7dfc5fde91526607458d9"
readonly JS="$ROOT/server/scripts/reassign-discount-qr-influencer.js"

if [[ ! -f "$JS" ]]; then
  echo "No se encuentra $JS" >&2
  exit 1
fi

EXTRA_ARGS=()

if [[ -n "${PROMOTION_ID:-}" ]]; then
  EXTRA_ARGS+=(--promotion-id "$PROMOTION_ID")
else
  echo "Nota: PROMOTION_ID no está definido; el script aplicará sobre todos los cupones «guest» que coincidan (amplio)." >&2
  echo "  export PROMOTION_ID=<ObjectId de la campaña>  # recomendado" >&2
  echo >&2
fi

if [[ "${REDEEMED_ONLY:-1}" != "0" ]]; then
  EXTRA_ARGS+=(--redeemed-only)
fi

NODE_CMD=(
  node "$JS"
  --from guest
  --to "$INFLUENCER_ID"
  "${EXTRA_ARGS[@]}"
)

if [[ "${1:-}" == "apply" ]]; then
  echo "APLICANDO cambios en MongoDB (--apply)…"
  "${NODE_CMD[@]}" --apply
else
  echo "Dry-run (sin --apply). Para escribir: $0 apply"
  "${NODE_CMD[@]}"
fi
