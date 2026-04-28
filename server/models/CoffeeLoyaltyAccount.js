const mongoose = require('mongoose');

const coffeeLoyaltyAccountSchema = new mongoose.Schema({
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
    punches: {
        type: Number,
        default: 0,
        min: 0
    },
    threshold: {
        type: Number,
        default: 10,
        min: 1
    },
    freeCoffeesAvailable: {
        type: Number,
        default: 0,
        min: 0
    },
    cafeSnapshot: {
        name: { type: String, default: '', trim: true },
        nameEs: { type: String, default: '', trim: true },
        address: { type: String, default: '', trim: true },
        addressEs: { type: String, default: '', trim: true },
        latitude: Number,
        longitude: Number
    },
    lastTransactionAt: Date
}, {
    timestamps: true,
    collection: 'coffee_loyalty_accounts'
});

coffeeLoyaltyAccountSchema.index(
    { deviceId: 1, cafeId: 1, programId: 1 },
    { unique: true }
);

module.exports = mongoose.models.CoffeeLoyaltyAccount ||
    mongoose.model('CoffeeLoyaltyAccount', coffeeLoyaltyAccountSchema);
