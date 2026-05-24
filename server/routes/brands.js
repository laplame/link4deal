const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticateToken, optionalAuth } = require('../middleware/jwtAuth');

router.get('/me', authenticateToken, (req, res) => brandController.getMe(req, res));
router.get('/me/promotions', authenticateToken, (req, res) => brandController.getMyPromotions(req, res));
router.patch('/me/bizne-shop', authenticateToken, (req, res) => brandController.linkBizneShop(req, res));
router.get('/', (req, res) => brandController.list(req, res));
router.post('/', optionalAuth, (req, res) => brandController.create(req, res));
router.get('/:id', (req, res) => brandController.getById(req, res));

module.exports = router;
