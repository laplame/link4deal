/**
 * Dirección de contrato para UI (Polygon): usa la guardada en la promo o un derivado determinista del id.
 */
function getDisplayContractAddress(promotionId, smartContract) {
    const raw = smartContract && typeof smartContract.address === 'string' ? smartContract.address.trim() : '';
    if (raw) {
        return raw.startsWith('0x') ? raw : `0x${raw}`;
    }
    const hexId = String(promotionId || '').replace(/[^a-f0-9]/gi, '');
    const padded = (hexId + '0000000000000000000000000000000000000000').slice(0, 40);
    return `0x${padded}`;
}

function getPolygonscanAddressUrl(address) {
    const hex = (address || '').trim();
    return `https://polygonscan.com/address/${hex}`;
}

module.exports = {
    getDisplayContractAddress,
    getPolygonscanAddressUrl
};
