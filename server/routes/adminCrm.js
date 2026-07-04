'use strict';

const express = require('express');
const { requireSuperAdmin } = require('../middleware/requireSuperAdmin');
const adminCrmController = require('../controllers/adminCrmController');
const { memoryUpload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

router.use(requireSuperAdmin);

router.get('/stats', (req, res) => adminCrmController.getStats(req, res));
router.get('/pipeline/board', (req, res) => adminCrmController.getPipelineBoard(req, res));
router.get('/monetization/board', (req, res) => adminCrmController.getMonetizationBoard(req, res));
router.get('/influencers', (req, res) => adminCrmController.listInfluencers(req, res));
router.get('/influencers/:id', (req, res) => adminCrmController.getInfluencerDetail(req, res));
router.get('/influencers/:id/redirect-applications', (req, res) =>
    adminCrmController.getRedirectApplications(req, res),
);
router.post('/influencers/:id/redirect-promotions/assign', (req, res) =>
    adminCrmController.assignRedirectPromotion(req, res),
);
router.get('/promotion-applications', (req, res) =>
    adminCrmController.listPromotionApplications(req, res),
);
router.get('/promotion-applications/categories', (req, res) =>
    adminCrmController.listInfluencerCategories(req, res),
);
router.post('/promotion-applications/bulk-apply', (req, res) =>
    adminCrmController.bulkApplyPromotion(req, res),
);
router.post('/promotion-applications/:id/approve', (req, res) =>
    adminCrmController.approvePromotionApplication(req, res),
);
router.post('/promotion-applications/:id/reject', (req, res) =>
    adminCrmController.rejectPromotionApplication(req, res),
);
router.get('/promotions/verification-queue', (req, res) =>
    adminCrmController.listPromotionVerificationQueue(req, res),
);
router.patch('/promotions/:id/verification', (req, res) =>
    adminCrmController.patchPromotionVerification(req, res),
);
router.patch('/promotions/:id/accessibility', (req, res) =>
    adminCrmController.patchPromotionAccessibility(req, res),
);
router.patch('/influencers/:id', (req, res) => adminCrmController.patchInfluencerCrm(req, res));
router.post('/influencers/:id/avatar', (req, res, next) => {
    memoryUpload.single('avatar')(req, res, (err) => {
        if (err) return handleUploadError(err, res);
        next();
    });
}, (req, res) => adminCrmController.uploadInfluencerAvatar(req, res));
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
