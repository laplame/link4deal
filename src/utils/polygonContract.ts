/** Misma lógica que el detalle de promoción: dirección en Polygon (guardada o derivada del id). */
export function getDisplayContractAddress(
  promotionId: string,
  smartContract?: { address?: string } | null
): string {
  const raw = smartContract?.address?.trim();
  if (raw) {
    return raw.startsWith('0x') ? raw : `0x${raw}`;
  }
  const hexId = String(promotionId || '').replace(/[^a-f0-9]/gi, '');
  const padded = (hexId + '0000000000000000000000000000000000000000').slice(0, 40);
  return `0x${padded}`;
}

export function getPolygonscanAddressUrl(address: string): string {
  const hex = (address || '').trim();
  return `https://polygonscan.com/address/${hex}`;
}

export function shortenAddress(addr: string, chars = 4): string {
  const a = (addr || '').trim();
  if (a.length <= 2 + chars * 2) return a;
  return `${a.slice(0, 2 + chars)}…${a.slice(-chars)}`;
}
