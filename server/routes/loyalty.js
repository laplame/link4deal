const express = require('express');
const CoffeeLoyaltyAccount = require('../models/CoffeeLoyaltyAccount');
const CoffeeLoyaltyTransaction = require('../models/CoffeeLoyaltyTransaction');
const database = require('../config/database');

const router = express.Router();
const PROGRAM_ID = 'coffee';
const COFFEE_THRESHOLD = 10;

function isMongoConnected() {
    return database.isConnected;
}

function sanitizeString(value, max = 500) {
    return String(value || '').trim().slice(0, max);
}

function parseDate(value) {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? new Date() : date;
}

function parseCoordinate(value) {
    if (value === undefined || value === null || value === '') return undefined;
    const number = typeof value === 'number' ? value : Number.parseFloat(String(value));
    return Number.isFinite(number) ? number : undefined;
}

function shouldCountQrPresented() {
    return process.env.LOYALTY_COFFEE_QR_PRESENTED_COUNTS !== 'false';
}

function shouldIncrementPunch(transactionType) {
    return transactionType === 'purchase_confirmed' ||
        (transactionType === 'qr_presented' && shouldCountQrPresented());
}

function buildCafeSnapshot(body) {
    const location = body.location && typeof body.location === 'object' ? body.location : {};
    return {
        name: sanitizeString(body.cafeName || location.name, 160),
        nameEs: sanitizeString(body.cafeNameEs || location.nameEs, 160),
        address: sanitizeString(location.address, 500),
        addressEs: sanitizeString(location.addressEs, 500),
        latitude: parseCoordinate(location.latitude),
        longitude: parseCoordinate(location.longitude)
    };
}

function buildLocation(body) {
    const location = body.location && typeof body.location === 'object' ? body.location : {};
    return {
        id: sanitizeString(location.id || body.cafeId, 160),
        name: sanitizeString(location.name || body.cafeName, 160),
        nameEs: sanitizeString(location.nameEs || body.cafeNameEs, 160),
        address: sanitizeString(location.address, 500),
        addressEs: sanitizeString(location.addressEs, 500),
        latitude: parseCoordinate(location.latitude),
        longitude: parseCoordinate(location.longitude),
        type: sanitizeString(location.type || 'coffee', 80)
    };
}

function serializeTransaction(tx) {
    return {
        transactionId: tx.transactionId,
        deviceId: tx.deviceId,
        cafeId: tx.cafeId,
        programId: tx.programId,
        transactionType: tx.transactionType,
        punchesBefore: tx.punchesBefore,
        punchesAfter: tx.punchesAfter,
        threshold: tx.threshold,
        freeCoffeesBefore: tx.freeCoffeesBefore,
        freeCoffeesAfter: tx.freeCoffeesAfter,
        qrValue: tx.qrValue || '',
        occurredAt: tx.occurredAt,
        location: tx.location || {},
        metadata: tx.metadata || {},
        createdAt: tx.createdAt
    };
}

function serializeAccount(account, transactions = []) {
    return {
        programId: PROGRAM_ID,
        deviceId: account.deviceId,
        cafeId: account.cafeId,
        punches: account.punches || 0,
        threshold: account.threshold || COFFEE_THRESHOLD,
        freeCoffeesAvailable: account.freeCoffeesAvailable || 0,
        cafeSnapshot: account.cafeSnapshot || {},
        lastTransactionAt: account.lastTransactionAt || null,
        transactions: transactions.map(serializeTransaction)
    };
}

async function getOrCreateAccount(deviceId, cafeId, cafeSnapshot = {}) {
    const update = {
        $setOnInsert: {
            deviceId,
            cafeId,
            programId: PROGRAM_ID,
            punches: 0,
            threshold: COFFEE_THRESHOLD,
            freeCoffeesAvailable: 0
        }
    };

    const snapshotHasData = Object.values(cafeSnapshot).some((value) => value !== undefined && value !== '');
    if (snapshotHasData) {
        update.$set = { cafeSnapshot };
    }

    return CoffeeLoyaltyAccount.findOneAndUpdate(
        { deviceId, cafeId, programId: PROGRAM_ID },
        update,
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
}

function applyCoffeeBusinessRules(account, transactionType) {
    let punchesAfter = account.punches || 0;
    let freeAfter = account.freeCoffeesAvailable || 0;

    if (shouldIncrementPunch(transactionType)) {
        punchesAfter += 1;
        while (punchesAfter >= COFFEE_THRESHOLD) {
            punchesAfter -= COFFEE_THRESHOLD;
            freeAfter += 1;
        }
    } else if (transactionType === 'free_coffee_redeemed') {
        if (freeAfter <= 0) {
            const err = new Error('No hay cafes gratis disponibles para redimir');
            err.status = 400;
            throw err;
        }
        freeAfter -= 1;
    }

    return { punchesAfter, freeAfter };
}

router.get('/coffee', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            return res.status(503).json({ success: false, message: 'Base de datos no disponible' });
        }

        const deviceId = sanitizeString(req.query.deviceId, 160);
        const cafeId = sanitizeString(req.query.cafeId, 160);
        if (!deviceId || !cafeId) {
            return res.status(400).json({ success: false, message: 'deviceId y cafeId son requeridos' });
        }

        const account = await getOrCreateAccount(deviceId, cafeId);
        const includeTransactions = req.query.includeTransactions === '1' || req.query.includeTransactions === 'true';
        const transactions = includeTransactions
            ? await CoffeeLoyaltyTransaction.find({ deviceId, cafeId, programId: PROGRAM_ID })
                .sort({ occurredAt: -1, createdAt: -1 })
                .limit(Math.min(Number(req.query.limit) || 20, 100))
                .lean()
            : [];

        return res.json({
            success: true,
            data: serializeAccount(account, transactions)
        });
    } catch (err) {
        console.error('Error obteniendo contador de cafe:', err.message);
        return res.status(err.status || 500).json({
            success: false,
            message: err.message || 'Error al obtener contador de cafe'
        });
    }
});

router.post('/coffee/transactions', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            return res.status(503).json({ success: false, message: 'Base de datos no disponible' });
        }

        const body = req.body || {};
        const deviceId = sanitizeString(body.deviceId, 160);
        const cafeId = sanitizeString(body.cafeId, 160);
        const transactionId = sanitizeString(body.transactionId, 220);
        const transactionType = sanitizeString(body.transactionType, 80);
        const validTypes = ['qr_presented', 'purchase_confirmed', 'free_coffee_redeemed'];

        if (!deviceId || !cafeId || !transactionId || !validTypes.includes(transactionType)) {
            return res.status(400).json({
                success: false,
                message: 'deviceId, cafeId, transactionId y transactionType valido son requeridos'
            });
        }

        const existing = await CoffeeLoyaltyTransaction.findOne({ transactionId }).lean();
        if (existing) {
            const existingAccount = await getOrCreateAccount(deviceId, cafeId);
            return res.json({
                success: true,
                data: {
                    ...serializeAccount(existingAccount, []),
                    transactionId: existing.transactionId,
                    createdAt: existing.createdAt,
                    idempotent: true
                }
            });
        }

        const cafeSnapshot = buildCafeSnapshot(body);
        const account = await getOrCreateAccount(deviceId, cafeId, cafeSnapshot);
        const punchesBefore = account.punches || 0;
        const freeBefore = account.freeCoffeesAvailable || 0;
        const { punchesAfter, freeAfter } = applyCoffeeBusinessRules(account, transactionType);
        const occurredAt = parseDate(body.occurredAt);
        const location = buildLocation(body);
        const metadata = body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
            ? body.metadata
            : {};

        const transaction = await CoffeeLoyaltyTransaction.create({
            transactionId,
            deviceId,
            cafeId,
            programId: PROGRAM_ID,
            transactionType,
            punchesBefore,
            punchesAfter,
            threshold: COFFEE_THRESHOLD,
            freeCoffeesBefore: freeBefore,
            freeCoffeesAfter: freeAfter,
            qrValue: sanitizeString(body.qrValue, 1000),
            occurredAt,
            location,
            metadata
        });

        account.punches = punchesAfter;
        account.freeCoffeesAvailable = freeAfter;
        account.threshold = COFFEE_THRESHOLD;
        account.lastTransactionAt = occurredAt;
        account.cafeSnapshot = cafeSnapshot;
        await account.save();

        return res.status(201).json({
            success: true,
            data: {
                programId: PROGRAM_ID,
                deviceId,
                cafeId,
                transactionId,
                transactionType,
                punches: account.punches,
                threshold: account.threshold,
                freeCoffeesAvailable: account.freeCoffeesAvailable,
                createdAt: transaction.createdAt
            }
        });
    } catch (err) {
        if (err.code === 11000 && err.keyPattern?.transactionId) {
            const tx = await CoffeeLoyaltyTransaction.findOne({ transactionId: req.body?.transactionId }).lean();
            const account = await getOrCreateAccount(sanitizeString(req.body?.deviceId, 160), sanitizeString(req.body?.cafeId, 160));
            return res.json({
                success: true,
                data: {
                    ...serializeAccount(account, []),
                    transactionId: tx?.transactionId || req.body?.transactionId,
                    createdAt: tx?.createdAt || null,
                    idempotent: true
                }
            });
        }

        console.error('Error registrando transaccion de cafe:', err.message);
        return res.status(err.status || 500).json({
            success: false,
            message: err.message || 'Error al registrar transaccion de cafe'
        });
    }
});

module.exports = router;
