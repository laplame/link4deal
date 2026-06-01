'use strict';

const express = require('express');
const instagramController = require('../controllers/instagramController');

const router = express.Router();

router.get('/status', (req, res) => instagramController.status(req, res));
router.get('/webhook', (req, res) => instagramController.verifyWebhook(req, res));
router.post('/webhook', (req, res) => instagramController.receiveWebhook(req, res));
router.get('/oauth/callback', (req, res) => instagramController.oauthCallback(req, res));

module.exports = router;
