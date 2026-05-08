/**
 * Verifica cupón DiscountQrToken por string QR Link4Deal (referencia) o por tokenId.
 * Uso: node server/scripts/verify-redemption-by-qr-string.js "<qr string>"
 */
'use strict';

require('../config/envPath');
const mongoose = require('mongoose');
const { normalizeAtlasUri } = require('../utils/normalizeAtlasUri');
const DiscountQrToken = require('../models/DiscountQrToken');
const { verifyReferenceQrToken } = require('../utils/qrCrypto');

const DEFAULT_QR =
    'LINK4DEAL-DISCOUNT-11.v1.pZkom6CQ3erO.11.sH5o3ma_iqYAW0pzOGqQttbbcUGL-jb4Iq3pNoB9uCM';
const TXN_FROM_SCREENSHOT = 'TXN-1778267410395-345';

async function main() {
    const arg = (process.argv[2] || DEFAULT_QR).trim();

    let tokenId = arg;
    try {
        const ref = verifyReferenceQrToken(arg);
        tokenId = ref.tokenId;
        console.log('\nQR referencia OK → tokenId:', tokenId);
        if (ref.discountPercentage != null) console.log('  descuento en QR:', ref.discountPercentage + '%');
    } catch (e) {
        console.log('\nNo es QR referencia válido (firma/clave .env distinta o formato distinto).');
        console.log('  Error:', e.message);
        console.log('  Buscando tokenId literal:', tokenId);
    }

    const uri = normalizeAtlasUri(process.env.MONGODB_URI_ATLAS);
    if (!uri) {
        console.error('MONGODB_URI_ATLAS no configurado.');
        process.exit(1);
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, bufferCommands: false });

    const doc = await DiscountQrToken.findOne({ tokenId }).lean();
    if (!doc) {
        console.log('\n❌ No existe DiscountQrToken con tokenId:', tokenId);
        const alt = await DiscountQrToken.findOne({
            $or: [
                { 'redeemedBy.idempotencyKey': TXN_FROM_SCREENSHOT },
                { 'redeemedBy.metadata': { $regex: TXN_FROM_SCREENSHOT } },
            ],
        }).lean();
        if (alt) {
            console.log('\nEncontrado otro doc por idempotencyKey/metadata TXN (tokenId distinto):', alt.tokenId);
        }
        await mongoose.disconnect();
        process.exit(2);
    }

    console.log('\n=== Registro en servidor (discountqrtokens) ===');
    console.log('tokenId:', doc.tokenId);
    console.log('usedAt:', doc.usedAt ? new Date(doc.usedAt).toISOString() : '(null — no canjeado en Link4Deal)');
    console.log('expiresAt:', doc.expiresAt ? new Date(doc.expiresAt).toISOString() : null);
    console.log('createdAt:', doc.createdAt ? new Date(doc.createdAt).toISOString() : null);
    if (doc.payload && typeof doc.payload === 'object') {
        const p = doc.payload;
        console.log('payload:', {
            promotionId: p.promotionId ?? null,
            influencerId: p.influencerId ?? null,
            referralCode: p.referralCode ?? null,
            shopId: p.shopId ?? null,
            discountPercentage: p.discountPercentage ?? null,
        });
    }
    if (doc.redeemedBy && typeof doc.redeemedBy === 'object') {
        console.log('\nredeemedBy:', JSON.stringify(doc.redeemedBy, null, 2));
        const blob = JSON.stringify(doc.redeemedBy);
        if (blob.includes(TXN_FROM_SCREENSHOT)) {
            console.log('\n✓ Aparece', TXN_FROM_SCREENSHOT, 'en redeemedBy');
        } else {
            console.log(
                '\n(i) No aparece el TXN del recibo Bizne dentro de redeemedBy — el POS puede no haber enviado idempotencyKey/metadata con ese texto, o la redención aún no pasó por POST /api/discount-qr/redeem)'
            );
        }
    }

    await mongoose.disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
