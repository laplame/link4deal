const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');

router.get('/', (req, res) => brandController.list(req, res));
router.post('/', (req, res) => brandController.create(req, res));
router.get('/:id', (req, res) => brandController.getById(req, res));

module.exports = router;
