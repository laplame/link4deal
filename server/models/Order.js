const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    currency: { type: String, default: 'MXN' },
    quantity: { type: Number, required: true, min: 1 },
    variant: { name: String, value: String, sku: String },
    brand: { type: String, default: '' },
}, { _id: false });

const addressSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    street: { type: String, required: true },
    colonia: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'México' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        index: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: addressSchema, required: true },
    status: {
        type: String,
        enum: ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending_payment',
        index: true,
    },
    payment: {
        method: { type: String, enum: ['stripe', 'transfer', 'cash'], default: 'stripe' },
        stripePaymentIntentId: { type: String, sparse: true, index: true },
        stripeClientSecret: { type: String, select: false },
        status: { type: String, enum: ['pending', 'succeeded', 'failed', 'cancelled'], default: 'pending' },
        paidAt: { type: Date },
        currency: { type: String, default: 'MXN' },
    },
    pricing: {
        subtotal: { type: Number, required: true, min: 0 },
        shipping: { type: Number, default: 0, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        tax: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'MXN' },
    },
    notes: { type: String, maxlength: 1000, default: '' },
    cancelReason: { type: String, default: '' },
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

orderSchema.pre('save', function (next) {
    if (!this.orderNumber) {
        const ts = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).substr(2, 4).toUpperCase();
        this.orderNumber = `L4D-${ts}-${rand}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
