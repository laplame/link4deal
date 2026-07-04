const express = require('express');
const { getProductCategories } = require('../utils/productCategories');

const router = express.Router();

/** GET /api/categories — catálogo completo para UI y formularios */
router.get('/', (_req, res) => {
    try {
        res.json({ success: true, data: getProductCategories() });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al cargar categorías' });
    }
});

module.exports = router;
