/**
 * Elimina el índice geoespacial incorrecto sobre storeLocation.coordinates en `promotions`
 * (coordenadas como { latitude, longitude } no son válidas para 2dsphere; el insert fallaba en Atlas).
 *
 *   node server/scripts/drop-promotion-2dsphere-index.js
 */
require('../config/envPath');
const mongoose = require('mongoose');

async function main() {
    const uri = process.env.MONGODB_URI_ATLAS;
    if (!uri || !String(uri).trim()) {
        console.error('❌ MONGODB_URI_ATLAS no definido.');
        process.exit(1);
    }

    await mongoose.connect(uri.trim(), { serverSelectionTimeoutMS: 15000 });
    const col = mongoose.connection.collection('promotions');
    const indexes = await col.indexes();
    const toDrop = indexes
        .map((ix) => ix.name)
        .filter((name) => name && name.includes('2dsphere') && name.includes('storeLocation'));

    if (toDrop.length === 0) {
        console.log('✅ No hay índice 2dsphere conflictivo en promotions (o ya fue eliminado).');
        await mongoose.disconnect();
        return;
    }

    for (const name of toDrop) {
        try {
            await col.dropIndex(name);
            console.log(`✅ Índice eliminado: ${name}`);
        } catch (e) {
            console.error(`❌ No se pudo eliminar ${name}:`, e.message);
        }
    }

    await mongoose.disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
