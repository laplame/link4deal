#!/usr/bin/env bash
#
# Emite (o amplía) el certificado para incluir el COMODÍN *.damecodigo.com,
# necesario para los subdominios por influencer (slug.damecodigo.com).
#
# DNS gestionado en Namecheap -> sin plugin oficial estable -> usamos DNS-01 MANUAL:
# certbot imprime uno o dos registros TXT (_acme-challenge.damecodigo.com); los añades
# en Namecheap (Advanced DNS) y pulsas Enter para continuar.
#
# Ejecutar EN EL SERVIDOR:  sudo bash scripts/setup-subdomain-wildcard.sh
#
# Tras emitirlo, recarga nginx (el bloque comodín ya está en nginx.conf):
#   ./scripts/update-nginx-conf.sh --install
#
set -euo pipefail

DOMAIN="${DOMAIN:-damecodigo.com}"
EMAIL="${CERTBOT_EMAIL:-}"

echo "=================================================="
echo "  Certificado comodín para *.${DOMAIN}"
echo "=================================================="
echo
echo "Cuando certbot te pida el/los TXT, en Namecheap:"
echo "  Domain List -> Manage ${DOMAIN} -> Advanced DNS -> Add New Record"
echo "  Type: TXT   |   Host: _acme-challenge   |   Value: (el que muestre certbot)"
echo "  (Pueden ser DOS valores distintos con el mismo Host: añade ambos)."
echo "  Espera ~1-2 min y verifica antes de continuar:"
echo "     dig +short TXT _acme-challenge.${DOMAIN}"
echo

EMAIL_ARG=()
if [[ -n "$EMAIL" ]]; then
  EMAIL_ARG=(--email "$EMAIL")
else
  EMAIL_ARG=(--register-unsafely-without-email)
fi

# Incluye apex + www + comodín en la MISMA cert (ruta live/${DOMAIN} ya usada por nginx.conf).
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  --cert-name "${DOMAIN}" \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  -d "*.${DOMAIN}" \
  --agree-tos \
  --no-eff-email \
  "${EMAIL_ARG[@]}"

echo
echo "✅ Certificado emitido/ampliado. Ahora recarga nginx:"
echo "   ./scripts/update-nginx-conf.sh --install   # o: sudo nginx -t && sudo systemctl reload nginx"
echo
echo "⚠️  Renovación: al ser DNS-01 manual NO se auto-renueva."
echo "    Repite este script (o 'sudo certbot renew --manual') antes de los 90 días."
