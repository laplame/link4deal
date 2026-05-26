'use strict';

const IDENTITY_VERIFICATION_STATUSES = ['pending', 'approved', 'rejected'];

function normalizeIdentityVerificationStatus(raw) {
    const s = String(raw || '').trim().toLowerCase();
    if (IDENTITY_VERIFICATION_STATUSES.includes(s)) return s;
    return 'pending';
}

function isIdentityApproved(influencer) {
    if (!influencer) return false;
    return normalizeIdentityVerificationStatus(influencer.identityVerificationStatus) === 'approved';
}

function isDashboardAccessAllowed(influencer) {
    return isIdentityApproved(influencer);
}

const IDENTITY_LABELS_ES = {
    pending: 'Pendiente verificación',
    approved: 'Identidad confirmada',
    rejected: 'Identidad rechazada',
};

module.exports = {
    IDENTITY_VERIFICATION_STATUSES,
    IDENTITY_LABELS_ES,
    normalizeIdentityVerificationStatus,
    isIdentityApproved,
    isDashboardAccessAllowed,
};
