const mongoose = require('mongoose');

/**
 * Contador global de descargas de la app móvil (APK).
 * Un único documento (key: 'global') almacena el total.
 */
const appDownloadStatsSchema = new mongoose.Schema({
    key: {
        type: String,
        default: 'global',
        unique: true
    },
    count: {
        type: Number,
        default: 0,
        min: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'appdownloadstats'
});

module.exports = mongoose.models.AppDownloadStats || mongoose.model('AppDownloadStats', appDownloadStatsSchema);
