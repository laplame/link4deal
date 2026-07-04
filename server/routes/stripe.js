const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/jwtAuth');
const Order = require('../models/Order');

// Lazy-init Stripe only when key is present
let stripe = null;
function getStripe() {
    if (!stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) throw new Error('STRIPE_SECRET_KEY no configurada');
        stripe = require('stripe')(key);
    }
    return stripe;
}

// ─── POST /api/stripe/create-payment-intent ────────────────────────────────
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
    try {
        const { amount, currency = 'mxn', metadata = {} } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Monto inválido' });
        }

        const s = getStripe();
        const paymentIntent = await s.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe uses cents
            currency: currency.toLowerCase(),
            automatic_payment_methods: { enabled: true },
            metadata: {
                userId: req.user._id.toString(),
                ...metadata,
            },
        });

        res.json({
            success: true,
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            },
        });
    } catch (err) {
        console.error('Stripe create-payment-intent error:', err);
        res.status(500).json({ success: false, message: err.message || 'Error al crear intento de pago' });
    }
});

// ─── POST /api/stripe/webhook ──────────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
        console.warn('STRIPE_WEBHOOK_SECRET not set – skipping signature verification');
        return res.json({ received: true });
    }

    let event;
    try {
        event = getStripe().webhooks.constructEvent(req.body, sig, secret);
    } catch (err) {
        console.error('Stripe webhook signature failed:', err.message);
        return res.status(400).json({ message: `Webhook error: ${err.message}` });
    }

    if (event.type === 'payment_intent.succeeded') {
        const pi = event.data.object;
        try {
            await Order.findOneAndUpdate(
                { 'payment.stripePaymentIntentId': pi.id },
                {
                    status: 'paid',
                    'payment.status': 'succeeded',
                    'payment.paidAt': new Date(),
                }
            );
        } catch (err) {
            console.error('Order update after payment_intent.succeeded failed:', err);
        }
    }

    if (event.type === 'payment_intent.payment_failed') {
        const pi = event.data.object;
        await Order.findOneAndUpdate(
            { 'payment.stripePaymentIntentId': pi.id },
            { 'payment.status': 'failed' }
        ).catch(() => {});
    }

    res.json({ received: true });
});

// ─── GET /api/stripe/status ────────────────────────────────────────────────
router.get('/status', (req, res) => {
    const configured = Boolean(process.env.STRIPE_SECRET_KEY);
    const publicKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || null;
    res.json({ configured, hasPublicKey: Boolean(publicKey) });
});

module.exports = router;
