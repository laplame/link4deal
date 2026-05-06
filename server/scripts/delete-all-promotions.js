/**
 * Elimina TODAS las promociones y datos fuertemente ligados (pujas, conversiones,
 * referencias en carritos/productos, resumen embebido en influencers).
 *
 * NO borra: usuarios, historial (History), tokens QR (pueden quedar payloads viejos).
 *
 * Uso (obligatorio confirmar):
 *   CONFIRM_DELETE_ALL_PROMOTIONS=yes node server/scripts/delete-all-promotions.js
 *   node server/scripts/delete-all-promotions.js --yes
 */

const { envPath } = require('../config/envPath');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');

const CONFIRM =
    process.env.CONFIRM_DELETE_ALL_PROMOTIONS === 'yes' ||
    process.argv.includes('--yes') ||
    process.argv.includes('-y');

async function main() {
    if (!CONFIRM) {
        console.error(
            'Refusing to run: esto borra todas las promociones y datos ligados.\n' +
                'Ejecuta con: CONFIRM_DELETE_ALL_PROMOTIONS=yes node server/scripts/delete-all-promotions.js\n' +
                '   o: node server/scripts/delete-all-promotions.js --yes'
        );
        process.exit(1);
    }

    const database = require('../config/database');
    await database.connect();

    if (!database.isConnected || mongoose.connection.readyState !== 1) {
        console.error('No hay conexión a MongoDB (revisa MONGODB_URI_ATLAS).');
        process.exit(1);
    }

    const Promotion = require('../models/Promotion');
    const Bid = require('../models/Bid');
    const PromotionConversion = require('../models/PromotionConversion');
    const Cart = require('../models/Cart');
    const Product = require('../models/Product');
    const Influencer = require('../models/Influencer');

    const nPromoBefore = await Promotion.countDocuments();
    console.log(`Promociones en BD antes: ${nPromoBefore}`);

    if (nPromoBefore === 0) {
        console.log('No hay promociones; nada que borrar.');
        await mongoose.connection.close();
        process.exit(0);
    }

    const bids = await Bid.deleteMany({});
    console.log(`Bids eliminados: ${bids.deletedCount}`);

    const conv = await PromotionConversion.deleteMany({});
    console.log(`PromotionConversion eliminados: ${conv.deletedCount}`);

    const products = await Product.updateMany({}, { $set: { activePromotions: [] } });
    console.log(`Productos actualizados (activePromotions vacío): ${products.modifiedCount}`);

    const cartPipelineUpdate = [
        {
            $set: {
                items: {
                    $map: {
                        input: { $ifNull: ['$items', []] },
                        as: 'it',
                        in: { $mergeObjects: ['$$it', { promotion: null }] }
                    }
                }
            }
        }
    ];
    const cartsResult = await mongoose.connection.collection('carts').updateMany({}, cartPipelineUpdate);
    console.log(`Carritos tocados (promotion en ítems → null): ${cartsResult.modifiedCount}`);

    const influencers = await Influencer.updateMany(
        {},
        {
            $set: {
                recentPromotions: [],
                completedPromotions: 0,
                activePromotions: 0
            }
        }
    );
    console.log(`Influencers actualizados (recentPromotions / contadores): ${influencers.modifiedCount}`);

    const deleted = await Promotion.deleteMany({});
    console.log(`Promociones eliminadas: ${deleted.deletedCount}`);

    const nAfter = await Promotion.countDocuments();
    console.log(`Promociones restantes: ${nAfter}`);

    await mongoose.connection.close();
    console.log('Listo.');
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
