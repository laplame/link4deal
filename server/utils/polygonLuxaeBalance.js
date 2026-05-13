'use strict';

/**
 * eth_call balanceOf(address) — selector 0x70a08231
 * @param {string} holder 0x lowercase 42 chars
 */
function encodeBalanceOfData(holder) {
    const addr = holder.replace(/^0x/, '').toLowerCase();
    return `0x70a08231${addr.padStart(64, '0')}`;
}

function hexToBigInt(hex) {
    const h = hex.startsWith('0x') ? hex.slice(2) : hex;
    if (!h || /^0+$/.test(h)) return 0n;
    return BigInt('0x' + h);
}

function formatUnitsBigInt(raw, decimals) {
    const s = raw.toString();
    if (decimals <= 0) return s;
    if (s.length <= decimals) {
        const frac = s.padStart(decimals, '0').replace(/0+$/, '');
        return frac ? `0.${frac}` : '0';
    }
    const i = s.length - decimals;
    const whole = s.slice(0, i).replace(/^0+/, '') || '0';
    const frac = s.slice(i).replace(/0+$/, '');
    return frac ? `${whole}.${frac}` : whole;
}

/**
 * @param {string} rpcUrl
 * @param {string} tokenContract 0x...
 * @param {string} holder 0x...
 * @param {number} decimals
 * @returns {Promise<{ ok: true, balanceRaw: string, balanceDecimal: string } | { ok: false, error: string }>}
 */
async function fetchErc20Balance(rpcUrl, tokenContract, holder, decimals) {
    const data = encodeBalanceOfData(holder);
    const body = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to: tokenContract, data }, 'latest'],
    });
    const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
    });
    if (!res.ok) {
        return { ok: false, error: `RPC HTTP ${res.status}` };
    }
    const json = await res.json().catch(() => ({}));
    if (json.error) {
        return { ok: false, error: json.error.message || String(json.error) };
    }
    const result = json.result;
    if (typeof result !== 'string' || !result.startsWith('0x')) {
        return { ok: false, error: 'Respuesta RPC inválida' };
    }
    const raw = hexToBigInt(result);
    const balanceRaw = raw.toString();
    const balanceDecimal = formatUnitsBigInt(raw, decimals);
    return { ok: true, balanceRaw, balanceDecimal };
}

/**
 * @param {string[]} holders 0x lowercase
 * @returns {Promise<{ address: string, balanceRaw: string, balanceDecimal: string, onChain: boolean, error: string }[]>}
 */
async function fetchLuxaeBalancesForAddresses(holders) {
    const rpcUrl = process.env.POLYGON_RPC_URL || '';
    const token = (process.env.LUXAE_TOKEN_CONTRACT_ADDRESS || '').trim().toLowerCase();
    const dec = Math.min(36, Math.max(0, parseInt(String(process.env.LUXAE_TOKEN_DECIMALS || '18'), 10) || 18));

    if (!rpcUrl || !/^0x[a-f0-9]{40}$/.test(token)) {
        return holders.map((address) => ({
            address,
            balanceRaw: '0',
            balanceDecimal: '0',
            decimals: dec,
            onChain: false,
            error: !rpcUrl ? 'POLYGON_RPC_URL no configurada' : 'LUXAE_TOKEN_CONTRACT_ADDRESS inválida o vacía',
        }));
    }

    const out = [];
    for (const address of holders) {
        try {
            const r = await fetchErc20Balance(rpcUrl, token, address, dec);
            if (r.ok) {
                out.push({
                    address,
                    balanceRaw: r.balanceRaw,
                    balanceDecimal: r.balanceDecimal,
                    decimals: dec,
                    onChain: true,
                    error: '',
                });
            } else {
                out.push({
                    address,
                    balanceRaw: '0',
                    balanceDecimal: '0',
                    decimals: dec,
                    onChain: false,
                    error: r.error,
                });
            }
        } catch (e) {
            out.push({
                address,
                balanceRaw: '0',
                balanceDecimal: '0',
                decimals: dec,
                onChain: false,
                error: e.message || 'fetch error',
            });
        }
    }
    return out;
}

module.exports = {
    fetchLuxaeBalancesForAddresses,
    encodeBalanceOfData,
};
