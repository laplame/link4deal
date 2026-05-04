/** URL pública en Polygonscan para una dirección de contrato. */
export function getPolygonscanAddressUrl(address: string): string {
  const trimmed = (address || '').trim();
  const hex = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
  return `https://polygonscan.com/address/${hex}`;
}
