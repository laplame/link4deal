'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { optionalAuth } = require('../middleware/jwtAuth');
const crmTrackController = require('../controllers/crmTrackController');

const router = express.Router();

const trackLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Demasiados eventos CRM; reintenta en un minuto.' },
});

router.post('/track', trackLimiter, optionalAuth, (req, res) => crmTrackController.track(req, res));

module.exports = router;
