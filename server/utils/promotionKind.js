/**
 * Promociones sin deal (verification_only) vs con deal (with_deal).
 * Alineado con spec promociones sin deal / con deal (app móvil + web).
 */

const PROMOTION_KINDS = Object.freeze(['verification_only', 'with_deal']);

const SOURCE_CHANNELS = Object.freeze([
    'mobile_app',
    'web_wizard',
    'web_quick',
    'admin',
    'import',
]);

const VERIFICATION_STATUSES = Object.freeze([
    'pending_submission',
    'pending_review',
    'approved',
    'rejected',
    'not_applicable',
]);

function parseBooleanField(value) {
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return undefined;
}

function normalizeSourceChannel(raw) {
    if (raw == null || String(raw).trim() === '') return null;
    const s = String(raw).trim().toLowerCase();
    if (SOURCE_CHANNELS.includes(s)) return s;
    if (s === 'mobile' || s === 'app') return 'mobile_app';
    if (s === 'web') return 'web_wizard';
    return null;
}

function inferSourceChannel(body) {
    const ua = body && body.userAgent ? String(body.userAgent) : '';
    if (/okhttp|dart|flutter|react-native/i.test(ua)) return 'mobile_app';
    return null;
}

function hasExplicitDealSignals(body) {
    if (!body || typeof body !== 'object') return false;
    if (parseBooleanField(body.redirectInsteadOfQr) === true) return true;
    if (body.redirectToUrl && String(body.redirectToUrl).trim()) return true;
    if (body.campaignId && String(body.campaignId).trim()) return true;
    if (body.shopId && String(body.shopId).trim()) return true;
    if (body.shortCode && String(body.shortCode).trim()) return true;
    return false;
}

function wasPromotionKindExplicit(body) {
    if (!body || typeof body !== 'object') return false;
    if (body.promotionKind && PROMOTION_KINDS.includes(String(body.promotionKind))) return true;
    if (body.promotionMode === 'sin_deal' || body.promotionMode === 'con_deal') return true;
    return parseBooleanField(body.hasDeal) !== undefined;
}

/**
 * Resuelve promotionKind, sourceChannel y flags derivados desde el body del POST.
 * @param {object} body
 * @param {{ imageCount?: number, videoCount?: number, proofEvidenceCount?: number, promoImageCount?: number }} [context]
 */
function resolvePromotionKindFromRequest(body, context = {}) {
    const errors = [];
    let explicit = false;
    let promotionKind = null;

    const rawKind = body.promotionKind != null ? String(body.promotionKind).trim() : '';
    if (rawKind) {
        explicit = true;
        if (!PROMOTION_KINDS.includes(rawKind)) {
            errors.push({
                code: 'INVALID_PROMOTION_KIND',
                message: `promotionKind debe ser uno de: ${PROMOTION_KINDS.join(', ')}`,
            });
        } else {
            promotionKind = rawKind;
        }
    } else if (body.promotionMode === 'sin_deal') {
        explicit = true;
        promotionKind = 'verification_only';
    } else if (body.promotionMode === 'con_deal') {
        explicit = true;
        promotionKind = 'with_deal';
    }

    const hasDealRaw = parseBooleanField(body.hasDeal);
    if (hasDealRaw !== undefined) {
        explicit = true;
        promotionKind = hasDealRaw ? 'with_deal' : 'verification_only';
    }

    let sourceChannel =
        normalizeSourceChannel(body.sourceChannel) ||
        inferSourceChannel(body) ||
        null;

    if (!promotionKind && !errors.length) {
        const redirectInsteadOfQr = parseBooleanField(body.redirectInsteadOfQr) === true;
        if (
            sourceChannel === 'mobile_app' &&
            !redirectInsteadOfQr &&
            !hasExplicitDealSignals(body)
        ) {
            promotionKind = 'verification_only';
        } else {
            promotionKind = 'with_deal';
        }
    }

    if (!sourceChannel) {
        sourceChannel = promotionKind === 'verification_only' ? 'mobile_app' : 'web_wizard';
    }

    const imageCount = Number(context.imageCount) || 0;
    const videoCount = Number(context.videoCount) || 0;
    const promoImageCount = Number(context.promoImageCount) || imageCount;
    let proofEvidenceCount = Number(context.proofEvidenceCount);
    if (!Number.isFinite(proofEvidenceCount)) {
        proofEvidenceCount = 0;
    }
    // Transición: app antigua solo envía `images` sin verificationImages ni link de video.
    const effectiveProofCount =
        proofEvidenceCount > 0
            ? proofEvidenceCount
            : promotionKind === 'verification_only' && !explicit
              ? promoImageCount + videoCount
              : proofEvidenceCount;

    if (
        explicit &&
        promotionKind === 'verification_only' &&
        effectiveProofCount < 1 &&
        !errors.length
    ) {
        errors.push({
            code: 'VERIFICATION_REQUIRES_MEDIA',
            message:
                'Las promociones sin deal requieren evidencia de compra: sube verificationImages (foto de ticket/recibo) y/o purchaseProofVideoUrl (link al video).',
        });
    }

    if (
        !explicit &&
        promotionKind === 'verification_only' &&
        effectiveProofCount < 1 &&
        !errors.length
    ) {
        // Heurística móvil sin flags explícitos: permitir pending_submission (sin bloquear create).
    }

    if (
        sourceChannel === 'mobile_app' &&
        promotionKind === 'with_deal' &&
        explicit &&
        hasDealRaw === true
    ) {
        errors.push({
            code: 'DEAL_CREATION_WEB_ONLY',
            message:
                'Las promociones con deal deben crearse en la web (damecodigo.com/create-promotion).',
        });
    }

    return {
        promotionKind: promotionKind || 'with_deal',
        sourceChannel,
        hasDeal: promotionKind !== 'verification_only',
        explicit,
        mediaCount: effectiveProofCount,
        proofEvidenceCount: effectiveProofCount,
        promoImageCount,
        errors,
    };
}

function resolveVerificationStatus(promotionKind, mediaCount) {
    if (promotionKind !== 'verification_only') return 'not_applicable';
    // Sin deal + evidencia: auto-aprobación (terceros, sin cola CRM obligatoria).
    return mediaCount >= 1 ? 'approved' : 'pending_submission';
}

const COMMUNITY_BADGE_TIERS = Object.freeze(['none', 'target_10', 'target_100', 'target_custom']);

/**
 * Badge comunitario: verificada por 10, 100 o N (dinámico).
 * Body: verificationBadgeTier, verificationBadgeTarget (solo target_custom).
 */
function parseCommunityVerification(body) {
    const rawTier = body?.verificationBadgeTier != null ? String(body.verificationBadgeTier).trim() : '';
    let badgeTier = 'target_10';
    let targetCount = 10;

    if (rawTier === 'target_100' || rawTier === 'community_100') {
        badgeTier = 'target_100';
        targetCount = 100;
    } else if (rawTier === 'target_custom' || rawTier === 'community_custom') {
        badgeTier = 'target_custom';
        const n = parseInt(String(body?.verificationBadgeTarget ?? body?.communityVerificationTarget ?? ''), 10);
        targetCount = Number.isFinite(n) && n >= 1 ? Math.min(n, 1_000_000) : 10;
    } else if (rawTier === 'target_10' || rawTier === 'community_10' || rawTier === '' || rawTier === 'none') {
        badgeTier = rawTier === 'none' ? 'none' : 'target_10';
        targetCount = badgeTier === 'none' ? 0 : 10;
    } else if (COMMUNITY_BADGE_TIERS.includes(rawTier)) {
        badgeTier = rawTier;
        if (badgeTier === 'target_100') targetCount = 100;
        else if (badgeTier === 'target_custom') {
            const n = parseInt(String(body?.verificationBadgeTarget ?? ''), 10);
            targetCount = Number.isFinite(n) && n >= 1 ? n : 10;
        } else if (badgeTier === 'target_10') targetCount = 10;
        else targetCount = 0;
    }

    return { badgeTier, targetCount, currentCount: 0 };
}

function applyThirdPartyPromotionFlags(promotionData, body) {
    promotionData.isEcosystemNative = false;
    promotionData.hasBrandContract = false;
    promotionData.offerMayChange = true;
    promotionData.communityVerification = parseCommunityVerification(body);
}

function buildCommunityVerificationBadgeLabel(promo) {
    const cv = promo?.communityVerification;
    if (!cv || typeof cv !== 'object') return '';
    const tier = cv.badgeTier || 'target_10';
    const target = cv.targetCount ?? (tier === 'target_100' ? 100 : tier === 'target_custom' ? cv.targetCount : 10);
    const current = cv.currentCount ?? 0;
    if (tier === 'none') return '';
    if (tier === 'target_10') return `Verificada por ${current}/10`;
    if (tier === 'target_100') return `Verificada por ${current}/100`;
    if (tier === 'target_custom' && target > 0) return `Verificada por ${current}/${target}`;
    return `Verificada por ${current}/${target || 10}`;
}

/**
 * Aplica reglas de negocio §4.2 sobre el objeto promotionData (mutación in-place).
 */
function applyPromotionKindRules(promotionData, resolved, body) {
    const { promotionKind, sourceChannel } = resolved;
    const mediaCount = Number(resolved.proofEvidenceCount ?? resolved.mediaCount) || 0;

    promotionData.promotionKind = promotionKind;
    promotionData.sourceChannel = sourceChannel;
    promotionData.hasDeal = promotionKind === 'with_deal';

    if (promotionKind === 'verification_only') {
        promotionData.redirectInsteadOfQr = false;
        promotionData.redirectToUrl = '';
        applyThirdPartyPromotionFlags(promotionData, body);
        if (!promotionData.verification) promotionData.verification = {};

        const hasProof =
            mediaCount >= 1 ||
            (Array.isArray(promotionData.verification.purchaseProof) &&
                promotionData.verification.purchaseProof.length > 0);

        promotionData.verificationStatus = resolveVerificationStatus(promotionKind, hasProof ? Math.max(mediaCount, 1) : 0);
        promotionData.status = hasProof ? 'active' : 'draft';

        if (hasProof) {
            if (!promotionData.verification.submittedAt) {
                promotionData.verification.submittedAt = new Date();
            }
            promotionData.verification.autoApproved = true;
            promotionData.verification.approvalMode = 'auto_third_party';
        }
        return;
    }

    promotionData.isEcosystemNative = true;
    promotionData.hasBrandContract = true;
    promotionData.offerMayChange = false;

    promotionData.verificationStatus = 'not_applicable';
    const statusRaw = body.status != null ? String(body.status).trim() : '';
    const allowedStatuses = ['draft', 'active', 'paused', 'expired', 'deleted'];
    promotionData.status = allowedStatuses.includes(statusRaw) ? statusRaw : 'active';
}

function promotionHasDeal(promo) {
    if (!promo || typeof promo !== 'object') return true;
    if (typeof promo.hasDeal === 'boolean') return promo.hasDeal;
    if (promo.promotionKind === 'verification_only') return false;
    if (promo.promotionKind === 'with_deal') return true;
    return true;
}

function isVerificationOnly(promo) {
    if (!promo || typeof promo !== 'object') return false;
    if (promo.promotionKind === 'verification_only') return true;
    return promo.hasDeal === false;
}

/** Cupón QR / redirect comercial: solo promociones con deal (§9 spec). */
function isPromotionRedeemable(promo) {
    if (!promo || typeof promo !== 'object') return true;
    if (isVerificationOnly(promo)) return false;
    return promotionHasDeal(promo);
}

/**
 * Filtro Mongo: excluye verification_only no aprobadas del feed/listados públicos activos.
 */
function buildPublicVisibilityClause() {
    return {
        $or: [
            { promotionKind: { $exists: false } },
            { promotionKind: null },
            { promotionKind: { $ne: 'verification_only' } },
            { verificationStatus: 'approved' },
        ],
    };
}

function parseQueryBoolean(raw) {
    if (raw === undefined || raw === null || raw === '') return undefined;
    return parseBooleanField(raw);
}

/**
 * Aplica filtros de listado desde query string (GET /api/promotions).
 * @returns {{ clause: object|null, error?: { status: number, body: object } }}
 */
function buildPromotionListFilters(query = {}) {
    const clause = {};

    const kind = query.promotionKind != null ? String(query.promotionKind).trim() : '';
    if (kind) {
        if (!PROMOTION_KINDS.includes(kind)) {
            return {
                clause: null,
                error: {
                    status: 400,
                    body: {
                        success: false,
                        code: 'INVALID_PROMOTION_KIND',
                        message: `promotionKind debe ser uno de: ${PROMOTION_KINDS.join(', ')}`,
                    },
                },
            };
        }
        clause.promotionKind = kind;
    }

    const hasDeal = parseQueryBoolean(query.hasDeal);
    if (hasDeal === true) {
        clause.hasDeal = true;
    } else if (hasDeal === false) {
        clause.$or = [{ hasDeal: false }, { promotionKind: 'verification_only' }];
    }

    const verificationStatus = query.verificationStatus != null ? String(query.verificationStatus).trim() : '';
    if (verificationStatus) {
        if (!VERIFICATION_STATUSES.includes(verificationStatus)) {
            return {
                clause: null,
                error: {
                    status: 400,
                    body: {
                        success: false,
                        message: `verificationStatus inválido. Valores: ${VERIFICATION_STATUSES.join(', ')}`,
                    },
                },
            };
        }
        clause.verificationStatus = verificationStatus;
    }

    const sourceChannel = query.sourceChannel != null ? String(query.sourceChannel).trim() : '';
    if (sourceChannel) {
        const normalized = normalizeSourceChannel(sourceChannel);
        if (!normalized) {
            return {
                clause: null,
                error: {
                    status: 400,
                    body: {
                        success: false,
                        message: `sourceChannel inválido. Valores: ${SOURCE_CHANNELS.join(', ')}`,
                    },
                },
            };
        }
        clause.sourceChannel = normalized;
    }

    const publicFeed = parseQueryBoolean(query.publicFeed);
    if (publicFeed === true) {
        clause.$and = clause.$and || [];
        clause.$and.push(buildPublicVisibilityClause());
    }

    return { clause };
}

function mergeMongoClauses(base, extra) {
    if (!extra || Object.keys(extra).length === 0) return base;
    if (!base || Object.keys(base).length === 0) return { ...extra };
    return { $and: [base, extra] };
}

function serializePromotionKindFields(promo) {
    if (!promo || typeof promo !== 'object') return {};
    const verificationOnly = isVerificationOnly(promo);
    const base = {
        promotionKind: promo.promotionKind || (promotionHasDeal(promo) ? 'with_deal' : 'verification_only'),
        hasDeal: promotionHasDeal(promo),
        verificationStatus:
            promo.verificationStatus ||
            (verificationOnly ? 'pending_submission' : 'not_applicable'),
        sourceChannel: promo.sourceChannel || undefined,
    };
    if (!verificationOnly) return base;

    return {
        ...base,
        isEcosystemNative: promo.isEcosystemNative === true,
        hasBrandContract: promo.hasBrandContract === true,
        offerMayChange: promo.offerMayChange !== false,
        showRedeemButton: false,
        communityVerification: promo.communityVerification || undefined,
        communityVerificationBadgeLabel: buildCommunityVerificationBadgeLabel(promo),
        thirdPartyDisclaimers: {
            es: {
                notNative:
                    'Oferta de tercero verificada por la comunidad. No es campaña nativa de Cryptomarketing.',
                noContract:
                    'Sin contrato con la marca. Precios y condiciones pueden cambiar sin aviso.',
            },
            en: {
                notNative:
                    'Third-party offer verified by the community. Not a native Cryptomarketing campaign.',
                noContract:
                    'No brand contract. Prices and terms may change without notice.',
            },
        },
    };
}

function assertPromotionKindNotConverted(existing, updateData) {
    if (!existing || existing.promotionKind !== 'verification_only') return null;
    const wantsDeal =
        updateData.promotionKind === 'with_deal' ||
        updateData.hasDeal === true ||
        updateData.hasDeal === 'true';
    if (wantsDeal) {
        return {
            code: 'PROMOTION_KIND_IMMUTABLE',
            message:
                'Las promociones sin deal (terceros) no pueden convertirse en promoción con deal. Cree una campaña nueva en la web.',
        };
    }
    return null;
}

module.exports = {
    PROMOTION_KINDS,
    SOURCE_CHANNELS,
    VERIFICATION_STATUSES,
    parseBooleanField,
    normalizeSourceChannel,
    resolvePromotionKindFromRequest,
    resolveVerificationStatus,
    applyPromotionKindRules,
    promotionHasDeal,
    isVerificationOnly,
    isPromotionRedeemable,
    buildPublicVisibilityClause,
    buildPromotionListFilters,
    mergeMongoClauses,
    serializePromotionKindFields,
    wasPromotionKindExplicit,
    parseCommunityVerification,
    applyThirdPartyPromotionFlags,
    buildCommunityVerificationBadgeLabel,
    assertPromotionKindNotConverted,
    COMMUNITY_BADGE_TIERS,
};
