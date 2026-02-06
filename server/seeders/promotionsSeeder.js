const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Promotion = require('../models/Promotion');
const database = require('../config/database');

// Mapeo de categorías del frontend al modelo
const categoryMap = {
    'Moda': 'fashion',
    'Tecnología': 'electronics',
    'Deportes': 'sports',
    'Belleza': 'beauty',
    'Hogar': 'home',
    'Libros': 'books',
    'Comida': 'food',
    'Otros': 'other'
};

// Mapeo de estados
const statusMap = {
    'active': 'active',
    'ending': 'active', // ending se trata como active pero con fecha próxima
    'closed': 'expired'
};

const seedPromotions = async () => {
    try {
        console.log('🔄 Conectando a MongoDB...');
        await database.connect();
        
        // Verificar conexión
        if (!database.isConnected || mongoose.connection.readyState !== 1) {
            console.error('❌ No hay conexión a MongoDB. Verifica tu MONGODB_URI_ATLAS en .env');
            process.exit(1);
        }

        console.log('✅ Conectado a MongoDB');
        console.log('🌱 Iniciando seed de promociones...');

        // Limpiar promociones existentes (opcional - comentar si quieres mantener las existentes)
        const existingCount = await Promotion.countDocuments();
        if (existingCount > 0) {
            console.log(`📊 Encontradas ${existingCount} promociones existentes`);
            console.log('🗑️  Eliminando promociones existentes...');
            await Promotion.deleteMany({});
            console.log('✅ Promociones eliminadas');
        }

        // Datos de promociones - Agregar aquí las promociones reales que deseas seedear
        // Ejemplo de estructura de promoción:
        // {
        //     title: 'Título de la promoción',
        //     description: 'Descripción detallada',
        //     productName: 'Nombre del producto',
        //     brand: 'Marca',
        //     category: 'fashion|electronics|sports|beauty|home|books|food|other',
        //     originalPrice: 999.99,
        //     currentPrice: 799.99,
        //     currency: 'MXN',
        //     discountPercentage: 20,
        //     storeName: 'Nombre de la tienda',
        //     storeLocation: {
        //         address: 'Dirección',
        //         city: 'Ciudad',
        //         state: 'Estado',
        //         country: 'México',
        //         coordinates: { latitude: 0, longitude: 0 }
        //     },
        //     isPhysicalStore: true,
        //     images: [{
        //         originalName: 'imagen.jpg',
        //         cloudinaryUrl: 'https://url-de-imagen.com',
        //         uploadedAt: new Date()
        //     }],
        //     tags: ['tag1', 'tag2'],
        //     features: ['feature1', 'feature2'],
        //     status: 'active',
        //     isHotOffer: false,
        //     hotness: 'warm',
        //     validFrom: new Date(),
        //     validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        //     views: 0,
        //     clicks: 0,
        //     conversions: 0,
        //     seller: {
        //         name: 'Nombre del vendedor',
        //         email: 'email@ejemplo.com',
        //         verified: false
        //     }
        // }
        
        const promotionsData = [
            // Agregar promociones reales aquí
        ];

        if (promotionsData.length === 0) {
            console.log('ℹ️  No hay promociones para crear. El array está vacío.');
            console.log('💡 Agrega promociones al array promotionsData en el archivo para crear promociones.');
            await mongoose.connection.close();
            console.log('🔌 Conexión cerrada');
            process.exit(0);
        }
        
        console.log(`📝 Creando ${promotionsData.length} promociones...`);
        const createdPromotions = await Promotion.insertMany(promotionsData);

        console.log('✅ Promociones creadas exitosamente:');
        createdPromotions.forEach((promo, index) => {
            console.log(`   ${index + 1}. ${promo.title} (ID: ${promo._id})`);
        });

        console.log(`\n🎉 Seed completado: ${createdPromotions.length} promociones creadas`);
        
        // Cerrar conexión
        await mongoose.connection.close();
        console.log('🔌 Conexión cerrada');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error en seed de promociones:', error);
        process.exit(1);
    }
};

// Ejecutar si se llama directamente
if (require.main === module) {
    seedPromotions();
}

module.exports = seedPromotions;

