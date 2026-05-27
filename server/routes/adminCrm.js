'use strict';

const express = require('express');
const { requireSuperAdmin } = require('../middleware/requireSuperAdmin');
const adminCrmController = require('../controllers/adminCrmController');

const router = express.Router();

router.use(requireSuperAdmin);

router.get('/stats', (req, res) => adminCrmController.getStats(req, res));
router.get('/pipeline/board', (req, res) => adminCrmController.getPipelineBoard(req, res));
router.get('/monetization/board', (req, res) => adminCrmController.getMonetizationBoard(req, res));
router.get('/influencers', (req, res) => adminCrmController.listInfluencers(req, res));
router.get('/influencers/:id', (req, res) => adminCrmController.getInfluencerDetail(req, res));
router.patch('/influencers/:id', (req, res) => adminCrmController.patchInfluencerCrm(req, res));
router.post('/influencers/:id/identity-verification', (req, res) =>
    adminCrmController.reviewIdentityVerification(req, res),
);
router.get('/influencers/:id/outreach', (req, res) => adminCrmController.getOutreach(req, res));
router.patch('/influencers/:id/outreach', (req, res) => adminCrmController.patchOutreach(req, res));
router.get('/influencers/:id/live-activity', (req, res) =>
    adminCrmController.getInfluencerLiveActivity(req, res),
);
router.get('/influencers/:id/monetization', (req, res) => adminCrmController.getMonetization(req, res));
router.patch('/influencers/:id/monetization', (req, res) =>
    adminCrmController.patchMonetization(req, res),
);

module.exports = router;
