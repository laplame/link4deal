/**
 * Script para eliminar promociones de prueba de la base de datos
 * Elimina promociones que coinciden con los títulos de las promociones de ejemplo
 */

const { envPath } = require('../config/envPath');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');
const Promotion = require('../models/Promotion');

const TEST_PROMOTION_TITLES = [
    'Lanzamiento Nueva Colección Primavera 2024',
    'Review Producto Tecnológico Galaxy S24',
    'Campaña Fitness & Wellness'
];

async function deleteTestPromotions() {
    try {
        console.log('🔍 Conectando a MongoDB Atlas...');
        
        // Conectar a MongoDB
        const database = require('../config/database');
        await database.connect();
        
        if (!database.isConnected) {
            throw new Error('No se pudo conectar a MongoDB');
        }
        
        console.log('✅ Conectado a MongoDB Atlas\n');
        
        // Buscar promociones de prueba
        console.log('🔍 Buscando promociones de prueba...');
        const testPromotions = await Promotion.find({
            title: { $in: TEST_PROMOTION_TITLES }
        });
        
        if (testPromotions.length === 0) {
            console.log('✅ No se encontraron promociones de prueba para eliminar');
            await mongoose.connection.close();
            process.exit(0);
        }
        
        console.log(`📋 Encontradas ${testPromotions.length} promociones de prueba:`);
        testPromotions.forEach(promo => {
            console.log(`   - ${promo.title} (${promo.brand})`);
        });
        
        // Eliminar promociones de prueba
        console.log('\n🗑️ Eliminando promociones de prueba...');
        const result = await Promotion.deleteMany({
            title: { $in: TEST_PROMOTION_TITLES }
        });
        
        console.log(`✅ Eliminadas ${result.deletedCount} promociones de prueba`);
        
        // Verificar que se eliminaron
        const remaining = await Promotion.find({
            title: { $in: TEST_PROMOTION_TITLES }
        });
        
        if (remaining.length === 0) {
            console.log('✅ Verificación: Todas las promociones de prueba fueron eliminadas correctamente');
        } else {
            console.log(`⚠️ Advertencia: Aún quedan ${remaining.length} promociones de prueba`);
        }
        
        // Mostrar total de promociones restantes
        const totalPromotions = await Promotion.countDocuments();
        console.log(`\n📊 Total de promociones en la base de datos: ${totalPromotions}`);
        
        await mongoose.connection.close();
        console.log('\n✅ Proceso completado');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error eliminando promociones de prueba:', error);
        process.exit(1);
    }
}

deleteTestPromotions();
