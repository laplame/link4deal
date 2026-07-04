const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/jwtAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for product images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/products');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `product-${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) return cb(new Error('Solo imágenes'));
        cb(null, true);
    },
});

// Serialize images from uploaded files + existing paths
function buildImages(files = [], existingImages = []) {
    const uploaded = files.map((f, i) => ({
        filename: f.filename,
        originalName: f.originalname,
        path: `/uploads/products/${f.filename}`,
        alt: '',
        isPrimary: existingImages.length === 0 && i === 0,
    }));
    return [...existingImages, ...uploaded];
}

// ─── GET /api/products ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            search,
            minPrice,
            maxPrice,
            sort = 'newest',
            featured,
            seller,
        } = req.query;

        const filter = { status: 'active', isAvailable: true };
        if (category) filter.category = category;
        if (featured === 'true') filter.isFeatured = true;
        if (seller) filter.seller = seller;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        let query;
        if (search && search.trim()) {
            query = Product.find({ ...filter, $text: { $search: search.trim() } }, {
                score: { $meta: 'textScore' },
            });
        } else {
            query = Product.find(filter);
        }

        const sortMap = {
            newest: { createdAt: -1 },
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            rating: { 'metrics.rating': -1 },
            popular: { 'metrics.purchases': -1 },
        };
        if (search && search.trim()) {
            query = query.sort({ score: { $meta: 'textScore' } });
        } else {
            query = query.sort(sortMap[sort] || { createdAt: -1 });
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [docs, total] = await Promise.all([
            query.skip(skip).limit(Number(limit)).select('-reviews -metadata').lean(),
            Product.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: {
                docs,
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (err) {
        console.error('GET /api/products error:', err);
        res.status(500).json({ success: false, message: 'Error al listar productos' });
    }
});

// ─── GET /api/products/by-promotion/:promotionId ───────────────────────────
// Devuelve el/los productos de nuestra tienda vinculados a una promoción.
router.get('/by-promotion/:promotionId', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const { promotionId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(promotionId)) {
            return res.status(400).json({ success: false, message: 'promotionId inválido' });
        }
        const docs = await Product.find({
            activePromotions: mongoose.Types.ObjectId(promotionId),
            isAvailable: true,
        })
            .select('-reviews -metadata')
            .limit(1)
            .lean();
        res.json({ success: true, data: docs });
    } catch (err) {
        console.error('GET /api/products/by-promotion error:', err);
        res.status(500).json({ success: false, message: 'Error' });
    }
});

// ─── GET /api/products/featured ────────────────────────────────────────────
router.get('/featured', async (req, res) => {
    try {
        const docs = await Product.find({ isFeatured: true, status: 'active', isAvailable: true })
            .sort({ createdAt: -1 })
            .limit(12)
            .select('-reviews -metadata')
            .lean();
        res.json({ success: true, data: docs });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error' });
    }
});

// ─── GET /api/products/categories ──────────────────────────────────────────
router.get('/categories', async (req, res) => {
    try {
        const { getProductCategories } = require('../utils/productCategories');
        const fromDb = await Product.distinct('category', { status: 'active', isAvailable: true });
        res.json({
            success: true,
            data: {
                catalog: getProductCategories(),
                fromProducts: fromDb,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error' });
    }
});

// ─── GET /api/products/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({
            $or: [{ _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : null }, { 'seo.slug': req.params.id }],
        })
            .populate('seller', 'firstName lastName email')
            .populate('activePromotions', 'title description discountPercentage offerType cashbackValue originalPrice currentPrice currency validFrom validUntil isHotOffer hotness publicSlug')
            .lean();

        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

        // Increment views async (don't block response)
        Product.findByIdAndUpdate(product._id, { $inc: { 'metrics.views': 1 } }).exec().catch(() => {});

        res.json({ success: true, data: product });
    } catch (err) {
        console.error('GET /api/products/:id error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener producto' });
    }
});

// ─── POST /api/products ────────────────────────────────────────────────────
router.post('/', authenticateToken, upload.array('images', 10), async (req, res) => {
    try {
        const { name, description, shortDescription, category, subcategory, tags, price, originalPrice, currency,
            stock, brand, status, isFeatured, shipping } = req.body;

        const images = buildImages(req.files || []);
        const tagList = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : (tags || []);
        const brandData = typeof brand === 'string' ? { name: brand } : (brand || {});

        const product = new Product({
            name, description, shortDescription, category, subcategory,
            tags: tagList,
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            currency: currency || 'MXN',
            stock: Number(stock) || 0,
            brand: brandData,
            images,
            seller: req.user._id,
            status: status || 'active',
            isFeatured: isFeatured === 'true' || isFeatured === true,
            shipping: shipping ? (typeof shipping === 'string' ? JSON.parse(shipping) : shipping) : undefined,
        });

        await product.save();
        res.status(201).json({ success: true, data: product });
    } catch (err) {
        console.error('POST /api/products error:', err);
        res.status(400).json({ success: false, message: err.message || 'Error al crear producto' });
    }
});

// ─── PUT /api/products/:id ─────────────────────────────────────────────────
router.put('/:id', authenticateToken, upload.array('images', 10), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

        const isOwner = product.seller.toString() === req.user._id.toString();
        const isAdmin = req.user.primaryRole === 'admin' || req.user.isSuperAdmin;
        if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Sin permiso' });

        const allowed = ['name', 'description', 'shortDescription', 'category', 'subcategory', 'tags',
            'price', 'originalPrice', 'currency', 'stock', 'status', 'isFeatured', 'shipping'];
        for (const key of allowed) {
            if (req.body[key] !== undefined) product[key] = req.body[key];
        }
        if (req.body.brand) {
            product.brand = typeof req.body.brand === 'string' ? { name: req.body.brand } : req.body.brand;
        }
        if (req.files && req.files.length > 0) {
            const newImgs = buildImages(req.files, product.images || []);
            product.images = newImgs;
        }

        await product.save();
        res.json({ success: true, data: product });
    } catch (err) {
        console.error('PUT /api/products/:id error:', err);
        res.status(400).json({ success: false, message: err.message || 'Error al actualizar' });
    }
});

// ─── DELETE /api/products/:id ──────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

        const isOwner = product.seller.toString() === req.user._id.toString();
        const isAdmin = req.user.primaryRole === 'admin' || req.user.isSuperAdmin;
        if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Sin permiso' });

        product.status = 'discontinued';
        product.isAvailable = false;
        await product.save();

        res.json({ success: true, message: 'Producto eliminado' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al eliminar' });
    }
});

module.exports = router;
