const express = require('express');
const router = express.Router();
const influencerController = require('../controllers/influencerController');

// GET /api/influencers - Listar influencers (paginado)
router.get('/', (req, res) => influencerController.getAllInfluencers(req, res));

// POST /api/influencers - Crear influencer (desde InfluencerSetup)
router.post('/', (req, res) => influencerController.create(req, res));

// GET /api/influencers/:id - Obtener un influencer por ID
router.get('/:id', (req, res) => influencerController.getInfluencerById(req, res));

module.exports = router;
