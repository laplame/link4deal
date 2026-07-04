/**
 * Seed: 5 productos demo vinculados en 3 niveles con promociones, influencer, brand,
 * conversiones (redenciones), pedidos (deals) e historial.
 *
 * Niveles:
 *  L1 — Producto + promoción activa + marca  (2 productos)
 *  L2 — Producto + promoción + influencer atribuido (2 productos)
 *  L3 — Producto + promoción + pedidos completados + redenciones + historial (1 producto)
 *
 * Uso:
 *   node server/scripts/seed-demo-products-promotions.js           # dry-run
 *   node server/scripts/seed-demo-products-promotions.js --apply
 *   node server/scripts/seed-demo-products-promotions.js --clean   # borra los registros demo y sale
 */

require('../config/envPath');
require('dotenv').config();
const mongoose = require('mongoose');
const database = require('../config/database');

const User              = require('../models/User');
const Brand             = require('../models/Brand');
const Influencer        = require('../models/Influencer');
const Product           = require('../models/Product');
const Promotion         = require('../models/Promotion');
const PromotionConversion = require('../models/PromotionConversion');
const Order             = require('../models/Order');
const History           = require('../models/History');

const APPLY = process.argv.includes('--apply');
const CLEAN = process.argv.includes('--clean');
const DEMO_TAG = 'demo-seed-l4d';

// ─── helpers ──────────────────────────────────────────────────────────────────
function daysAgo(n) { return new Date(Date.now() - n * 86400000); }
function daysFromNow(n) { return new Date(Date.now() + n * 86400000); }

function log(msg) { console.log(msg); }

async function maybeCreate(Model, doc) {
    if (!APPLY) { log(`  [dry] ${Model.modelName}: ${JSON.stringify(doc).slice(0, 80)}…`); return null; }
    return Model.create(doc);
}

// ─── producto base ─────────────────────────────────────────────────────────────
const CATALOG = [
    // Level 1 — producto simple con promo y marca
    {
        level: 1,
        name: 'Crema Facial Anti-Edad Luxe',
        shortDescription: 'Crema regeneradora con retinol y colágeno marino para piel radiante.',
        description: 'Formulada con retinol puro al 0.3%, colágeno marino hidrolizado y vitamina E. Reduce visiblemente arrugas y líneas finas en 4 semanas. Apta para todo tipo de piel. Sin parabenos, sin sulfatos.',
        category: 'beauty',
        subcategory: 'Cuidado facial',
        tags: ['antiedad', 'retinol', 'skincare', 'colágeno'],
        price: 649,
        originalPrice: 899,
        currency: 'MXN',
        stock: 48,
        isFeatured: true,
        images: [
            { path: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600', alt: 'Crema facial anti-edad', isPrimary: true },
        ],
        brand: { name: 'Demo Marca Link4Deal', logo: '', website: 'https://damecodigo.com' },
        shipping: { freeShipping: true, processingTime: 2, origin: { city: 'CDMX', country: 'México' } },
        specifications: new Map([['Ingrediente clave', 'Retinol 0.3%'], ['Tamaño', '50 ml'], ['Aplicación', 'Noche']]),
        metrics: { views: 312, purchases: 14, rating: 4.6, reviewCount: 11, cartAdds: 38, wishlistAdds: 22 },
        promo: {
            title: '15% OFF — Crema Luxe Anti-Edad',
            description: 'Descuento exclusivo en crema facial. Válido en tienda online y física.',
            category: 'beauty',
            discountPercentage: 15,
            offerType: 'percentage',
            originalPrice: 899,
            currentPrice: 649,
            currency: 'MXN',
            openToAllInfluencers: true,
        },
        conversions: 9,
        orders: 0,
    },
    {
        level: 1,
        name: 'Serum Vitamina C Glow',
        shortDescription: 'Sérum con vitamina C estabilizada al 20% para iluminación y uniformidad.',
        description: 'Vitamina C estabilizada (ascorbato de magnesio) al 20%, niacinamida y ácido hialurónico de triple peso molecular. Ilumina, unifica el tono y protege frente a radicales libres. Fórmula sin alcohol.',
        category: 'beauty',
        subcategory: 'Cuidado facial',
        tags: ['vitamina-c', 'iluminador', 'glow', 'sérum'],
        price: 489,
        originalPrice: 690,
        currency: 'MXN',
        stock: 62,
        isFeatured: false,
        images: [
            { path: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=600', alt: 'Serum vitamina C', isPrimary: true },
        ],
        brand: { name: 'Demo Marca Link4Deal', logo: '', website: 'https://damecodigo.com' },
        shipping: { freeShipping: true, processingTime: 2, origin: { city: 'CDMX', country: 'México' } },
        specifications: new Map([['Vitamina C', '20%'], ['Tamaño', '30 ml'], ['Aplicación', 'Mañana']]),
        metrics: { views: 198, purchases: 8, rating: 4.4, reviewCount: 7, cartAdds: 27, wishlistAdds: 15 },
        promo: {
            title: '29% OFF — Sérum Vitamina C Glow',
            description: 'Aprovecha el descuento de lanzamiento en nuestro sérum estrella.',
            category: 'beauty',
            discountPercentage: 29,
            offerType: 'percentage',
            originalPrice: 690,
            currentPrice: 489,
            currency: 'MXN',
            openToAllInfluencers: true,
        },
        conversions: 5,
        orders: 0,
    },

    // Level 2 — + influencer atribuido
    {
        level: 2,
        name: 'Perfume Colección Noir Édition',
        shortDescription: 'Fragancia amaderada oriental para mujer. Notas de oud, rosa y vainilla.',
        description: 'Perfume EDP de larga duración (10–12 h). Notas de salida: bergamota, pera. Corazón: rosa damascena, jazmín. Fondo: oud, sándalo, vainilla. 100 ml. Frasco de vidrio artesanal con tapa dorada.',
        category: 'beauty',
        subcategory: 'Perfumes',
        tags: ['perfume', 'oud', 'noir', 'lujo', 'fragancia'],
        price: 1290,
        originalPrice: 1890,
        currency: 'MXN',
        stock: 24,
        isFeatured: true,
        images: [
            { path: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=600', alt: 'Perfume Noir', isPrimary: true },
        ],
        brand: { name: 'Demo Marca Link4Deal', logo: '', website: 'https://damecodigo.com' },
        shipping: { freeShipping: false, shippingCost: 89, processingTime: 3, origin: { city: 'CDMX', country: 'México' } },
        specifications: new Map([['Concentración', 'EDP'], ['Tamaño', '100 ml'], ['Notas', 'Oud, Rosa, Vainilla']]),
        metrics: { views: 467, purchases: 21, rating: 4.8, reviewCount: 18, cartAdds: 53, wishlistAdds: 34 },
        promo: {
            title: '2×1 — Perfume Noir: lleva dos, paga uno',
            description: 'Compra un Noir Édition y llévate el segundo gratis. Oferta por tiempo limitado.',
            category: 'beauty',
            discountPercentage: 50,
            offerType: 'bogo',
            originalPrice: 1890,
            currentPrice: 1290,
            currency: 'MXN',
            isHotOffer: true,
            hotness: 'fire',
            openToAllInfluencers: false,
        },
        conversions: 14,
        orders: 0,
    },
    {
        level: 2,
        name: 'Sneakers Urbanos Air X1',
        shortDescription: 'Tenis urbanos unisex con suela de goma reforzada y tejido transpirable.',
        description: 'Diseño casual-deportivo con entresuela EVA de doble densidad para máxima amortiguación. Upper de malla técnica 3D transpirable. Disponible en tallas 23–29 MX. Compatible con plantillas ortopédicas. Peso: 280 g (por zapato, talla 26).',
        category: 'fashion',
        subcategory: 'Calzado',
        tags: ['sneakers', 'tenis', 'urbano', 'moda', 'unisex'],
        price: 895,
        originalPrice: 1299,
        currency: 'MXN',
        stock: 36,
        isFeatured: true,
        images: [
            { path: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', alt: 'Sneakers Air X1', isPrimary: true },
        ],
        brand: { name: 'Demo Marca Link4Deal', logo: '', website: 'https://damecodigo.com' },
        shipping: { freeShipping: true, processingTime: 3, origin: { city: 'Guadalajara', country: 'México' } },
        specifications: new Map([['Material', 'Malla técnica 3D'], ['Suela', 'EVA doble densidad'], ['Tallas', '23–29 MX']]),
        metrics: { views: 581, purchases: 29, rating: 4.5, reviewCount: 23, cartAdds: 67, wishlistAdds: 41 },
        variants: [
            { name: 'Talla', value: '25', price: 895, stock: 8 },
            { name: 'Talla', value: '26', price: 895, stock: 12 },
            { name: 'Talla', value: '27', price: 895, stock: 10 },
            { name: 'Talla', value: '28', price: 895, stock: 6 },
        ],
        promo: {
            title: '31% OFF — Sneakers Urbanos Air X1',
            description: 'Descuento de temporada en nuestra colección de tenis más popular.',
            category: 'fashion',
            discountPercentage: 31,
            offerType: 'percentage',
            originalPrice: 1299,
            currentPrice: 895,
            currency: 'MXN',
            openToAllInfluencers: false,
        },
        conversions: 19,
        orders: 0,
    },

    // Level 3 — + pedidos completados + redenciones + historial completo
    {
        level: 3,
        name: 'Smart Watch X1 Pro',
        shortDescription: 'Reloj inteligente con GPS, monitor cardíaco y 7 días de batería.',
        description: 'Pantalla AMOLED 1.9" de 450 nits. GPS integrado, altímetro barométrico, SpO2. Compatible con iOS y Android. Resistencia al agua 5 ATM. Modos: running, ciclismo, natación, yoga (+12). Batería: 7 días en uso normal, 20 horas GPS continuo. Incluye correa de silicona y cargador magnético.',
        category: 'electronics',
        subcategory: 'Wearables',
        tags: ['smartwatch', 'gps', 'fitness', 'wearable', 'salud'],
        price: 2199,
        originalPrice: 2999,
        currency: 'MXN',
        stock: 18,
        isFeatured: true,
        images: [
            { path: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600', alt: 'Smart Watch X1 Pro', isPrimary: true },
            { path: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600', alt: 'Smart Watch detalle', isPrimary: false },
        ],
        brand: { name: 'Demo Marca Link4Deal', logo: '', website: 'https://damecodigo.com' },
        shipping: { freeShipping: true, processingTime: 2, origin: { city: 'CDMX', country: 'México' } },
        specifications: new Map([['Pantalla', 'AMOLED 1.9"'], ['Batería', '7 días'], ['Resistencia', '5 ATM'], ['GPS', 'Integrado']]),
        metrics: { views: 843, purchases: 37, rating: 4.7, reviewCount: 31, cartAdds: 95, wishlistAdds: 58 },
        promo: {
            title: '27% OFF + $150 de cashback — Smart Watch X1 Pro',
            description: 'Descuento directo más cashback en cuenta. Ideal para regalar.',
            category: 'electronics',
            discountPercentage: 27,
            offerType: 'cashback_fixed',
            cashbackValue: 150,
            originalPrice: 2999,
            currentPrice: 2199,
            currency: 'MXN',
            isHotOffer: true,
            hotness: 'hot',
            openToAllInfluencers: false,
        },
        conversions: 23,
        orders: 3,  // se crearán 3 órdenes con distintos estados
    },
];

// ─── CLEAN ─────────────────────────────────────────────────────────────────────
async function clean() {
    log('Eliminando registros con tag demo-seed-l4d…');
    const [prods, promos, convs, orders, hists] = await Promise.all([
        Product.deleteMany({ tags: DEMO_TAG }),
        Promotion.deleteMany({ tags: DEMO_TAG }),
        PromotionConversion.deleteMany({ note: { $regex: DEMO_TAG } }),
        Order.deleteMany({ notes: { $regex: DEMO_TAG } }),
        History.deleteMany({ tags: DEMO_TAG }),
    ]);
    log(`Productos:   ${prods.deletedCount}`);
    log(`Promociones: ${promos.deletedCount}`);
    log(`Conversiones:${convs.deletedCount}`);
    log(`Pedidos:     ${orders.deletedCount}`);
    log(`Historial:   ${hists.deletedCount}`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('==============================================');
    console.log('  Seed: Productos + Promociones Demo Link4Deal');
    console.log('==============================================');
    console.log(`Modo: ${CLEAN ? 'CLEAN' : APPLY ? 'APPLY' : 'DRY-RUN'}\n`);

    await database.connect();

    if (CLEAN) {
        await clean();
        await mongoose.connection.close();
        process.exit(0);
    }

    // Cargar usuarios demo
    const [brandUser, infUser, buyerUser] = await Promise.all([
        User.findOne({ email: 'demo.marca@damecodigo.mx' }),
        User.findOne({ email: 'demo.influencer@damecodigo.mx' }),
        User.findOne({ email: 'demo.usuario@damecodigo.mx' }),
    ]);

    if (!brandUser) {
        console.error('❌ No se encontró demo.marca@damecodigo.mx — ejecuta seed-demo-dashboard-users.js --apply primero.');
        await mongoose.connection.close();
        process.exit(1);
    }
    if (!infUser) {
        console.error('❌ No se encontró demo.influencer@damecodigo.mx');
        await mongoose.connection.close();
        process.exit(1);
    }
    if (!buyerUser) {
        console.warn('⚠️  demo.usuario@damecodigo.mx no encontrado — pedidos se asignarán a la marca demo');
    }

    const infDoc = await Influencer.findOne({ userId: infUser._id });
    const brandDoc = await Brand.findOne({ userId: brandUser._id });

    if (!APPLY) {
        log(`  brandUser  → ${brandUser.email} (${brandUser._id})`);
        log(`  infUser    → ${infUser.email} (${infUser._id})`);
        log(`  infDoc     → ${infDoc ? infDoc.username : 'no encontrado'}`);
        log(`  brandDoc   → ${brandDoc ? brandDoc.companyName : 'no encontrado'}`);
        log('');
    }

    const orderBuyer = buyerUser || brandUser;
    const results = [];

    for (const item of CATALOG) {
        log(`── Nivel ${item.level}: ${item.name}`);

        // 1. Producto
        const productData = {
            name: item.name,
            description: item.description,
            shortDescription: item.shortDescription,
            category: item.category,
            subcategory: item.subcategory,
            tags: [...(item.tags || []), DEMO_TAG],
            price: item.price,
            originalPrice: item.originalPrice,
            currency: item.currency,
            stock: item.stock,
            isFeatured: item.isFeatured,
            isAvailable: true,
            status: 'active',
            images: item.images,
            brand: item.brand,
            shipping: item.shipping,
            specifications: item.specifications,
            metrics: item.metrics,
            variants: item.variants || [],
            seller: brandUser._id,
            seo: {},
        };

        let product = null;
        if (APPLY) {
            // idempotente: si ya existe con mismo nombre + tag, reusar
            product = await Product.findOne({ name: item.name, tags: DEMO_TAG });
            if (!product) {
                product = await Product.create(productData);
                log(`  ✅ Producto creado: ${product._id}`);
            } else {
                log(`  ♻️  Producto existente: ${product._id}`);
            }
        } else {
            log(`  [dry] Producto: ${item.name}`);
        }

        // 2. Promoción
        const promoData = {
            ...item.promo,
            productName: item.name,
            storeName: item.brand.name,
            status: 'active',
            validFrom: daysAgo(10),
            validUntil: daysFromNow(60),
            createdBy: brandUser._id,
            brandId: brandDoc?._id?.toString(),
            tags: [DEMO_TAG, item.category],
            sourceChannel: 'web_wizard',
            hasDeal: true,
            promotionKind: 'with_deal',
            verificationStatus: 'approved',
            totalQuantity: 200,
        };

        let promo = null;
        if (APPLY) {
            promo = await Promotion.findOne({ title: item.promo.title, tags: DEMO_TAG });
            if (!promo) {
                promo = await Promotion.create(promoData);
                log(`  ✅ Promoción creada: ${promo._id}`);
            } else {
                log(`  ♻️  Promoción existente: ${promo._id}`);
            }
            // Vincular producto ↔ promoción
            if (product && !product.activePromotions.includes(promo._id)) {
                product.activePromotions.push(promo._id);
                await product.save();
            }
        } else {
            log(`  [dry] Promoción: ${item.promo.title}`);
        }

        // 3. Conversiones (redenciones)
        const convCount = item.conversions || 0;
        if (convCount > 0) {
            log(`  → ${convCount} conversiones/redenciones`);
            for (let i = 0; i < convCount; i++) {
                const convData = {
                    promotion: promo?._id || new mongoose.Types.ObjectId(),
                    influencer: (item.level >= 2 && infDoc) ? infDoc._id : null,
                    quantity: 1,
                    amountUsd: parseFloat((item.promo.currentPrice * 0.05 / 20).toFixed(2)),
                    source: item.level >= 2 ? 'redemption' : 'general',
                    note: `${DEMO_TAG} — demo conv #${i + 1}`,
                    createdAt: daysAgo(Math.floor(Math.random() * 25)),
                };
                await maybeCreate(PromotionConversion, convData);
            }
        }

        // 4. Pedidos (solo Level 3)
        const ORDER_STATUSES = ['delivered', 'shipped', 'paid'];
        const orderIds = [];
        if (item.orders > 0) {
            log(`  → ${item.orders} pedidos`);
            for (let i = 0; i < item.orders; i++) {
                const qty = i === 0 ? 2 : 1;
                const total = item.price * qty;
                const orderData = {
                    user: orderBuyer._id,
                    items: [{
                        product: product?._id || new mongoose.Types.ObjectId(),
                        name: item.name,
                        image: item.images[0]?.path || '',
                        price: item.price,
                        originalPrice: item.originalPrice,
                        currency: item.currency,
                        quantity: qty,
                        brand: item.brand.name,
                    }],
                    shippingAddress: {
                        fullName: `${orderBuyer.firstName} ${orderBuyer.lastName}`,
                        email: orderBuyer.email,
                        phone: '+525512345678',
                        street: 'Av. Insurgentes Sur 1234',
                        colonia: 'Del Valle',
                        city: 'Ciudad de México',
                        state: 'CDMX',
                        postalCode: '03100',
                        country: 'México',
                    },
                    status: ORDER_STATUSES[i] || 'delivered',
                    payment: {
                        method: 'stripe',
                        status: 'succeeded',
                        paidAt: daysAgo(15 - i * 3),
                        currency: item.currency,
                    },
                    pricing: {
                        subtotal: total,
                        shipping: 0,
                        discount: i === 0 ? 150 : 0,
                        tax: 0,
                        total: total - (i === 0 ? 150 : 0),
                        currency: item.currency,
                    },
                    notes: `${DEMO_TAG} — pedido demo #${i + 1}`,
                };

                let order = null;
                if (APPLY) {
                    order = await Order.findOne({ notes: orderData.notes });
                    if (!order) {
                        order = await Order.create(orderData);
                        log(`  ✅ Pedido ${order.orderNumber} (${order.status})`);
                    } else {
                        log(`  ♻️  Pedido existente: ${order.orderNumber}`);
                    }
                    orderIds.push(order._id);
                } else {
                    log(`  [dry] Pedido demo #${i + 1}: ${total} ${item.currency} (${ORDER_STATUSES[i]})`);
                }
            }
        }

        // 5. Historial — solo Level 3
        if (item.level === 3 && APPLY && product && orderIds.length > 0) {
            const historyEntries = [
                // compras
                ...orderIds.map((oid, i) => ({
                    user: orderBuyer._id,
                    action: 'order_create',
                    category: 'order',
                    description: `Pedido ${item.name} creado — demo nivel 3`,
                    resource: { type: 'Order', id: oid },
                    newData: { productName: item.name, amount: item.price },
                    result: 'success',
                    severity: 'low',
                    tags: [DEMO_TAG, 'pedido'],
                    createdAt: daysAgo(15 - i * 3),
                })),
                // pago
                ...orderIds.map((oid, i) => ({
                    user: orderBuyer._id,
                    action: 'payment_success',
                    category: 'payment',
                    description: `Pago confirmado — ${item.name}`,
                    resource: { type: 'Order', id: oid },
                    result: 'success',
                    severity: 'low',
                    tags: [DEMO_TAG, 'pago'],
                    createdAt: daysAgo(15 - i * 3 - 0.1),
                })),
                // vistas de producto
                {
                    user: infUser._id,
                    action: 'product_view',
                    category: 'product',
                    description: `Influencer vio el producto ${item.name}`,
                    resource: { type: 'Product', id: product._id },
                    result: 'success',
                    severity: 'low',
                    tags: [DEMO_TAG, 'influencer'],
                    createdAt: daysAgo(20),
                },
                // promoción usada
                ...(promo ? [{
                    user: orderBuyer._id,
                    action: 'promotion_use',
                    category: 'promotion',
                    description: `Promoción utilizada: ${promo.title}`,
                    resource: { type: 'Promotion', id: promo._id },
                    result: 'success',
                    severity: 'low',
                    tags: [DEMO_TAG, 'promo'],
                    createdAt: daysAgo(14),
                }] : []),
                // cart add
                {
                    user: orderBuyer._id,
                    action: 'cart_add_item',
                    category: 'cart',
                    description: `${item.name} agregado al carrito`,
                    resource: { type: 'Product', id: product._id },
                    result: 'success',
                    severity: 'low',
                    tags: [DEMO_TAG, 'carrito'],
                    createdAt: daysAgo(15.1),
                },
            ];

            for (const entry of historyEntries) {
                const exists = await History.findOne({ user: entry.user, action: entry.action, tags: DEMO_TAG, 'resource.id': entry.resource.id });
                if (!exists) {
                    await History.create(entry);
                }
            }
            log(`  ✅ ${historyEntries.length} entradas de historial creadas`);
        }

        results.push({
            nivel: `L${item.level}`,
            producto: item.name,
            precio: `$${item.price} MXN`,
            descuento: `${item.promo.discountPercentage}%`,
            promo_tipo: item.promo.offerType,
            redenciones: item.conversions,
            pedidos: item.orders,
        });

        log('');
    }

    console.log('══════════════════════════════════════════════');
    console.log('  RESUMEN');
    console.log('══════════════════════════════════════════════');
    console.table(results);

    if (!APPLY) {
        console.log('\n⚠️  DRY-RUN — ningún documento fue creado.');
        console.log('   Ejecuta con --apply para aplicar los cambios.\n');
    } else {
        console.log('\n✅ Seed aplicado. Revisa /tienda para ver los productos.\n');
        console.log('   Para limpiar: node server/scripts/seed-demo-products-promotions.js --clean\n');
    }

    await mongoose.connection.close();
    process.exit(0);
}

main().catch(async (e) => {
    console.error('❌', e);
    try { await mongoose.connection.close(); } catch { /* ignore */ }
    process.exit(1);
});
