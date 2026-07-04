const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/jwtAuth');

// ─── POST /api/orders ──────────────────────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { items, shippingAddress, notes, stripePaymentIntentId } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'El pedido debe tener al menos un producto' });
        }
        if (!shippingAddress) {
            return res.status(400).json({ success: false, message: 'Dirección de envío requerida' });
        }

        // Validate & enrich items from DB
        const enrichedItems = [];
        let subtotal = 0;

        for (const item of items) {
            const product = await Product.findById(item.productId).lean();
            if (!product) {
                return res.status(400).json({ success: false, message: `Producto no encontrado: ${item.productId}` });
            }
            if (product.status !== 'active' && product.status !== 'out-of-stock') {
                return res.status(400).json({ success: false, message: `Producto no disponible: ${product.name}` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Stock insuficiente para "${product.name}" (disponible: ${product.stock})`,
                });
            }

            const price = product.price;
            const qty = Number(item.quantity) || 1;
            enrichedItems.push({
                product: product._id,
                name: product.name,
                image: product.images?.[0]?.path || '',
                price,
                originalPrice: product.originalPrice,
                currency: product.currency || 'MXN',
                quantity: qty,
                brand: product.brand?.name || '',
                variant: item.variant || undefined,
            });
            subtotal += price * qty;
        }

        const shipping = 0; // free shipping MVP
        const tax = 0;
        const discount = 0;
        const total = subtotal + shipping + tax - discount;
        const currency = enrichedItems[0]?.currency || 'MXN';

        const order = new Order({
            user: req.user._id,
            items: enrichedItems,
            shippingAddress,
            notes: notes || '',
            status: stripePaymentIntentId ? 'pending_payment' : 'pending_payment',
            payment: {
                method: 'stripe',
                stripePaymentIntentId: stripePaymentIntentId || undefined,
                status: 'pending',
                currency,
            },
            pricing: { subtotal, shipping, tax, discount, total, currency },
        });

        await order.save();

        // Reserve stock
        for (const item of enrichedItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity },
            });
        }

        res.status(201).json({ success: true, data: order });
    } catch (err) {
        console.error('POST /api/orders error:', err);
        res.status(500).json({ success: false, message: err.message || 'Error al crear el pedido' });
    }
});

// ─── GET /api/orders ───────────────────────────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al listar pedidos' });
    }
});

// ─── GET /api/orders/:id ───────────────────────────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id,
        }).lean();
        if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al obtener pedido' });
    }
});

// ─── PATCH /api/orders/:id/cancel ─────────────────────────────────────────
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
        if (!['pending_payment', 'paid'].includes(order.status)) {
            return res.status(400).json({ success: false, message: 'No se puede cancelar este pedido' });
        }
        order.status = 'cancelled';
        order.cancelReason = req.body.reason || 'Cancelado por el usuario';
        await order.save();

        // Restore stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al cancelar pedido' });
    }
});

module.exports = router;
