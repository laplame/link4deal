'use strict';

const express = require('express');
const mongoose = require('mongoose');
const LuxaeComplianceInstallation = require('../models/LuxaeComplianceInstallation');
const { validateServiceAreaPolygon, normalizeWalletList } = require('../utils/luxaeComplianceGeo');
const { fetchLuxaeBalancesForAddresses } = require('../utils/polygonLuxaeBalance');

const router = express.Router();

function requireLuxaeComplianceKey(req, res, next) {
    const secret = process.env.LUXAE_COMPLIANCE_API_KEY;
    if (!secret || String(secret).trim() === '') {
        return res.status(503).json({
            ok: false,
            message: 'LUXAE_COMPLIANCE_API_KEY no configurada en el servidor',
        });
    }
    const sent =
        req.get('x-luxae-compliance-key') ||
        req.get('X-Luxae-Compliance-Key') ||
        req.get('x-api-key') ||
        '';
    if (sent !== secret) {
        return res.status(401).json({ ok: false, message: 'No autorizado' });
    }
    next();
}

router.use(requireLuxaeComplianceKey);

function parsePagination(query) {
    const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10) || 20));
    return { page, limit, skip: (page - 1) * limit };
}

function serializeInstallation(doc) {
    if (!doc) return null;
    const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    return {
        id: String(o._id),
        externalInstallationId: o.externalInstallationId,
        platform: o.platform,
        appVersion: o.appVersion,
        serviceAreaPolygon: o.serviceAreaPolygon || null,
        walletAddresses: o.walletAddresses || [],
        luxaeBalanceSnapshots: o.luxaeBalanceSnapshots || [],
        lastBalanceSyncAt: o.lastBalanceSyncAt || null,
        status: o.status,
        metadata: o.metadata ?? null,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
    };
}

/** POST / — alta */
router.post('/', async (req, res) => {
    try {
        const body = req.body || {};
        const ext = body.externalInstallationId != null ? String(body.externalInstallationId).trim() : '';
        if (!ext || ext.length > 128) {
            return res.status(400).json({
                ok: false,
                message: 'externalInstallationId requerido (máx. 128 caracteres)',
            });
        }

        const poly = validateServiceAreaPolygon(body.serviceAreaPolygon);
        if (!poly.ok) {
            return res.status(400).json({ ok: false, message: poly.message });
        }

        const wallets = normalizeWalletList(body.walletAddresses);
        if (!wallets.ok) {
            return res.status(400).json({ ok: false, message: wallets.message });
        }

        const platform = ['ios', 'android', 'web', 'unknown'].includes(body.platform)
            ? body.platform
            : 'unknown';
        const appVersion = body.appVersion != null ? String(body.appVersion).trim().slice(0, 64) : '';
        const metadata =
            body.metadata != null && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
                ? body.metadata
                : null;

        const doc = await LuxaeComplianceInstallation.create({
            externalInstallationId: ext,
            platform,
            appVersion,
            serviceAreaPolygon: poly.polygon,
            walletAddresses: wallets.wallets,
            luxaeBalanceSnapshots: [],
            status: 'active',
            metadata,
        });

        return res.status(201).json({ ok: true, data: serializeInstallation(doc) });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                ok: false,
                message: 'Ya existe un registro con ese externalInstallationId',
            });
        }
        console.error('luxaeCompliance POST', err);
        return res.status(500).json({ ok: false, message: err.message || 'Error al crear' });
    }
});

/** GET / — listado */
router.get('/', async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const status = req.query.status === 'archived' ? 'archived' : req.query.status === 'all' ? null : 'active';
        const filter = {};
        if (status) filter.status = status;

        const [total, docs] = await Promise.all([
            LuxaeComplianceInstallation.countDocuments(filter),
            LuxaeComplianceInstallation.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
        ]);

        return res.json({
            ok: true,
            data: docs.map(serializeInstallation),
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        });
    } catch (err) {
        console.error('luxaeCompliance GET list', err);
        return res.status(500).json({ ok: false, message: err.message || 'Error al listar' });
    }
});

/** GET /:id — detalle */
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ ok: false, message: 'id inválido' });
        }
        const doc = await LuxaeComplianceInstallation.findById(id).lean();
        if (!doc) {
            return res.status(404).json({ ok: false, message: 'No encontrado' });
        }
        return res.json({ ok: true, data: serializeInstallation(doc) });
    } catch (err) {
        console.error('luxaeCompliance GET one', err);
        return res.status(500).json({ ok: false, message: err.message || 'Error' });
    }
});

/** PATCH /:id — actualización parcial */
router.patch('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ ok: false, message: 'id inválido' });
        }

        const body = req.body || {};
        const $set = {};

        if (body.serviceAreaPolygon !== undefined) {
            const poly = validateServiceAreaPolygon(body.serviceAreaPolygon);
            if (!poly.ok) {
                return res.status(400).json({ ok: false, message: poly.message });
            }
            $set.serviceAreaPolygon = poly.polygon;
        }

        if (body.walletAddresses !== undefined) {
            const wallets = normalizeWalletList(body.walletAddresses);
            if (!wallets.ok) {
                return res.status(400).json({ ok: false, message: wallets.message });
            }
            $set.walletAddresses = wallets.wallets;
        }

        if (body.platform !== undefined) {
            if (!['ios', 'android', 'web', 'unknown'].includes(body.platform)) {
                return res.status(400).json({ ok: false, message: 'platform inválido' });
            }
            $set.platform = body.platform;
        }

        if (body.appVersion !== undefined) {
            $set.appVersion = String(body.appVersion).trim().slice(0, 64);
        }

        if (body.status !== undefined) {
            if (!['active', 'archived'].includes(body.status)) {
                return res.status(400).json({ ok: false, message: 'status debe ser active o archived' });
            }
            $set.status = body.status;
        }

        if (body.metadata !== undefined) {
            if (body.metadata !== null && (typeof body.metadata !== 'object' || Array.isArray(body.metadata))) {
                return res.status(400).json({ ok: false, message: 'metadata debe ser objeto o null' });
            }
            $set.metadata = body.metadata;
        }

        if (Object.keys($set).length === 0) {
            return res.status(400).json({ ok: false, message: 'Nada que actualizar' });
        }

        const doc = await LuxaeComplianceInstallation.findByIdAndUpdate(id, { $set }, { new: true, runValidators: true });
        if (!doc) {
            return res.status(404).json({ ok: false, message: 'No encontrado' });
        }
        return res.json({ ok: true, data: serializeInstallation(doc) });
    } catch (err) {
        console.error('luxaeCompliance PATCH', err);
        return res.status(500).json({ ok: false, message: err.message || 'Error al actualizar' });
    }
});

/** DELETE /:id — baja lógica (archived) */
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ ok: false, message: 'id inválido' });
        }
        const doc = await LuxaeComplianceInstallation.findByIdAndUpdate(
            id,
            { $set: { status: 'archived' } },
            { new: true },
        );
        if (!doc) {
            return res.status(404).json({ ok: false, message: 'No encontrado' });
        }
        return res.json({
            ok: true,
            message: 'Registro archivado (compliance: conserva historial en BD)',
            data: serializeInstallation(doc),
        });
    } catch (err) {
        console.error('luxaeCompliance DELETE', err);
        return res.status(500).json({ ok: false, message: err.message || 'Error' });
    }
});

/** POST /:id/balances/refresh — sincroniza saldos LUXAE on-chain (Polygon) */
router.post('/:id/balances/refresh', async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ ok: false, message: 'id inválido' });
        }
        const doc = await LuxaeComplianceInstallation.findById(id);
        if (!doc) {
            return res.status(404).json({ ok: false, message: 'No encontrado' });
        }
        const holders = (doc.walletAddresses || []).map((w) => w.address);
        const snapshots = await fetchLuxaeBalancesForAddresses(holders);
        const now = new Date();
        doc.luxaeBalanceSnapshots = snapshots.map((s) => ({
            address: s.address,
            balanceRaw: s.balanceRaw,
            balanceDecimal: s.balanceDecimal,
            decimals: s.decimals,
            fetchedAt: now,
            onChain: s.onChain,
            error: s.error || '',
        }));
        doc.lastBalanceSyncAt = now;
        await doc.save();

        return res.json({
            ok: true,
            data: {
                installation: serializeInstallation(doc),
                balances: doc.luxaeBalanceSnapshots,
            },
        });
    } catch (err) {
        console.error('luxaeCompliance balances refresh', err);
        return res.status(500).json({ ok: false, message: err.message || 'Error al refrescar saldos' });
    }
});

module.exports = router;
