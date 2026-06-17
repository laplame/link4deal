'use strict';

const mongoose = require('mongoose');

/**
 * Registro de compliance: instalación de app + polígono(s) de servicio en WGS84
 * + direcciones EVM (red Polygon) para auditoría de saldos LUXAE (token PSCS-1 / ERC-20).
 */
const walletEntrySchema = new mongoose.Schema(
    {
        address: { type: String, required: true, trim: true, lowercase: true },
        label: { type: String, trim: true, default: '' },
    },
    { _id: false },
);

const balanceSnapshotSchema = new mongoose.Schema(
    {
        address: { type: String, required: true },
        balanceRaw: { type: String, default: '0' },
        balanceDecimal: { type: String, default: '0' },
        decimals: { type: Number, default: 18 },
        fetchedAt: { type: Date, default: Date.now },
        onChain: { type: Boolean, default: false },
        error: { type: String, default: '' },
    },
    { _id: false },
);

const luxaeComplianceInstallationSchema = new mongoose.Schema(
    {
        /** Id estable generado por la app (UUID recomendado). Único por cluster. */
        externalInstallationId: {
            type: String,
            required: true,
            trim: true,
            maxlength: 128,
        },
        platform: {
            type: String,
            enum: ['ios', 'android', 'web', 'unknown'],
            default: 'unknown',
        },
        appVersion: { type: String, trim: true, default: '' },
        /** GeoJSON Polygon en WGS84 (área declarada por la app). Opcional. */
        serviceAreaPolygon: { type: mongoose.Schema.Types.Mixed, default: null },
        /** Direcciones 0x en Polygon asociadas a la instalación (compliance / treasury). */
        walletAddresses: { type: [walletEntrySchema], default: [] },
        /** Última lectura on-chain (o error por dirección). */
        luxaeBalanceSnapshots: { type: [balanceSnapshotSchema], default: [] },
        lastBalanceSyncAt: { type: Date, default: null },
        status: {
            type: String,
            enum: ['active', 'archived'],
            default: 'active',
            index: true,
        },
        metadata: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    {
        timestamps: true,
        collection: 'luxae_compliance_installations',
    },
);

luxaeComplianceInstallationSchema.index({ externalInstallationId: 1 }, { unique: true });
luxaeComplianceInstallationSchema.index({ createdAt: -1 });
luxaeComplianceInstallationSchema.index({ status: 1, updatedAt: -1 });

module.exports =
    mongoose.models.LuxaeComplianceInstallation ||
    mongoose.model('LuxaeComplianceInstallation', luxaeComplianceInstallationSchema);
