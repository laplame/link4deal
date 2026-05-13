'use strict';

const MAX_RING_POINTS = 200;

/**
 * Valida GeoJSON Polygon (un anillo exterior, cerrado, WGS84).
 * @param {unknown} geo
 * @returns {{ ok: true, polygon: object } | { ok: false, message: string }}
 */
function validateServiceAreaPolygon(geo) {
    if (geo == null) return { ok: true, polygon: null };
    if (typeof geo !== 'object' || Array.isArray(geo)) {
        return { ok: false, message: 'serviceAreaPolygon debe ser un objeto GeoJSON' };
    }
    if (geo.type !== 'Polygon') {
        return { ok: false, message: 'serviceAreaPolygon.type debe ser "Polygon"' };
    }
    if (!Array.isArray(geo.coordinates) || geo.coordinates.length < 1) {
        return { ok: false, message: 'serviceAreaPolygon.coordinates debe ser un array de anillos' };
    }
    const ring = geo.coordinates[0];
    if (!Array.isArray(ring) || ring.length < 4) {
        return { ok: false, message: 'El anillo exterior necesita al menos 4 posiciones [lng, lat] (cerrado)' };
    }
    if (ring.length > MAX_RING_POINTS) {
        return { ok: false, message: `Máximo ${MAX_RING_POINTS} vértices por anillo` };
    }
    for (const pt of ring) {
        if (!Array.isArray(pt) || pt.length < 2) {
            return { ok: false, message: 'Cada posición debe ser [lng, lat]' };
        }
        const lng = Number(pt[0]);
        const lat = Number(pt[1]);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            return { ok: false, message: 'lng/lat deben ser números finitos' };
        }
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
            return { ok: false, message: 'Coordenadas fuera de rango WGS84' };
        }
    }
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
        return { ok: false, message: 'El polígono debe cerrarse (primer punto = último punto)' };
    }
    return { ok: true, polygon: { type: 'Polygon', coordinates: geo.coordinates } };
}

/**
 * @param {string} raw
 * @returns {string|null} 0x + 40 hex lowercase o null
 */
function normalizeEvmAddress(raw) {
    if (raw == null || typeof raw !== 'string') return null;
    const s = raw.trim().toLowerCase();
    if (!/^0x[a-f0-9]{40}$/.test(s)) return null;
    return s;
}

/**
 * @param {unknown} arr
 * @param {number} maxWallets
 * @returns {{ ok: true, wallets: { address: string, label: string }[] } | { ok: false, message: string }}
 */
function normalizeWalletList(arr, maxWallets = 50) {
    if (arr == null) return { ok: true, wallets: [] };
    if (!Array.isArray(arr)) return { ok: false, message: 'walletAddresses debe ser un array' };
    if (arr.length > maxWallets) {
        return { ok: false, message: `Máximo ${maxWallets} direcciones por instalación` };
    }
    const seen = new Set();
    const wallets = [];
    for (const item of arr) {
        let addr;
        let label = '';
        if (typeof item === 'string') {
            addr = normalizeEvmAddress(item);
        } else if (item && typeof item === 'object') {
            addr = normalizeEvmAddress(item.address);
            if (item.label != null) label = String(item.label).trim().slice(0, 120);
        }
        if (!addr) return { ok: false, message: 'Dirección EVM inválida (se espera 0x + 40 hex en Polygon)' };
        if (seen.has(addr)) continue;
        seen.add(addr);
        wallets.push({ address: addr, label });
    }
    return { ok: true, wallets };
}

module.exports = {
    validateServiceAreaPolygon,
    normalizeEvmAddress,
    normalizeWalletList,
    MAX_RING_POINTS,
};
