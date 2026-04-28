const mongoose = require('mongoose');

const coffeeLoyaltyTransactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    deviceId: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    cafeId: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    programId: {
        type: String,
        enum: ['coffee'],
        default: 'coffee',
        index: true
    },
    transactionType: {
        type: String,
        enum: ['qr_presented', 'purchase_confirmed', 'free_coffee_redeemed'],
        required: true,
        index: true
    },
    punchesBefore: {
        type: Number,
        default: 0,
        min: 0
    },
    punchesAfter: {
        type: Number,
        default: 0,
        min: 0
    },
    threshold: {
        type: Number,
        default: 10,
        min: 1
    },
    freeCoffeesBefore: {
        type: Number,
        default: 0,
        min: 0
    },
    freeCoffeesAfter: {
        type: Number,
        default: 0,
        min: 0
    },
    qrValue: {
        type: String,
        default: '',
        trim: true
    },
    occurredAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    location: {
        id: { type: String, default: '', trim: true },
        name: { type: String, default: '', trim: true },
        nameEs: { type: String, default: '', trim: true },
        address: { type: String, default: '', trim: true },
        addressEs: { type: String, default: '', trim: true },
        latitude: Number,
        longitude: Number,
        type: { type: String, default: '', trim: true }
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    collection: 'coffee_loyalty_transactions'
});

coffeeLoyaltyTransactionSchema.index({ deviceId: 1, cafeId: 1, occurredAt: -1 });
coffeeLoyaltyTransactionSchema.index({ cafeId: 1, transactionType: 1, occurredAt: -1 });

module.exports = mongoose.models.CoffeeLoyaltyTransaction ||
    mongoose.model('CoffeeLoyaltyTransaction', coffeeLoyaltyTransactionSchema);
