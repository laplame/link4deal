const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');

/** GET /api/bids/live — dashboard tiempo real (polling desde el cliente) */
router.get('/live', (req, res) => bidController.getLive(req, res));

module.exports = router;
