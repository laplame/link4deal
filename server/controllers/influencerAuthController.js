'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const Influencer = require('../models/Influencer');
const { buildInfluencerAppSession } = require('../utils/influencerAppSession');
const { ensureInfluencerHasProfileShortCode } = require('../utils/influencerPromoShortCodes');
const { collectHandlesFromBody, findUnclaimedInfluencer, linkInfluencerToUser } = require('../utils/influencerUserLink');
const { authUserDashboardFields } = require('../utils/platformSuperuser');
const { buildEmailCandidates } = require('../utils/emailCandidates');
const {
    allowDuplicatePhonesForTesting,
    normalizePhone,
    publicPhone,
    phoneLookupFilter,
    resolveStoragePhone,
} = require('../utils/phoneTesting');

const SESSION_EXPIRES_IN = '24h';
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/** Crea (si no existe) el rol base 'user'. */
async function ensureUserRole() {
    let role = await Role.findOne({ name: 'user' });
    if (role) return role;
    role = await Role.create({
        name: 'user',
        displayName: 'Usuario',
        description: 'Usuario básico de la plataforma',
        type: 'user',
        level: 1,
        isDefault: true,
        isSystem: true,
        permissions: [],
        capabilities: { canCreateContent: true, canViewAnalytics: false },
        limits: { maxPromotionsPerMonth: 0, maxFileUploadSize: 5 * 1024 * 1024, maxStorageQuota: 100 * 1024 * 1024 },
    });
    return role;
}

function signTokens(user) {
    const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: SESSION_EXPIRES_IN },
    );
    const refreshToken = jwt.sign(
        { userId: user._id, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: SESSION_EXPIRES_IN },
    );
    return { token, refreshToken };
}

function publicUser(user) {
    return {
        id: user._id,
        email: user.email || undefined,
        phone: publicPhone(user.phone),
        firstName: user.firstName,
        lastName: user.lastName,
        primaryRole: user.primaryRole,
        isSuperAdmin: user.isSuperAdmin,
        profileTypes: user.profileTypes,
        isVerified: user.isVerified,
        ...authUserDashboardFields(user),
    };
}

function deriveUsername(input, name) {
    let username = input ? String(input).trim().replace(/^@/, '') : '';
    if (!username && name) {
        username = String(name)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '')
            .slice(0, 30);
    }
    return username;
}

/** Crea el perfil de influencer vinculado al usuario (idempotente por userId). */
async function ensureInfluencerProfile(user, body = {}) {
    let influencer = await Influencer.findOne({ userId: user._id });
    if (influencer) return influencer;

    const socialMedia = body.socialMedia && typeof body.socialMedia === 'object' ? body.socialMedia : {};
    const unclaimed = await findUnclaimedInfluencer({
        handles: collectHandlesFromBody(body),
        slug: body.username || socialMedia.tiktok || socialMedia.instagram,
    });
    if (unclaimed) {
        const linked = await linkInfluencerToUser(unclaimed, user._id);
        if (linked) {
            await ensureInfluencerHasProfileShortCode(String(linked._id)).catch(() => {});
            return linked;
        }
    }

    const name =
        (body.name || body.displayName || '').trim() ||
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        (user.email ? user.email.split('@')[0] : 'Influencer');

    const username =
        deriveUsername(body.username, '') ||
        deriveUsername(socialMedia.instagram, '') ||
        deriveUsername(socialMedia.tiktok, '') ||
        deriveUsername('', name);

    influencer = new Influencer({
        name,
        username,
        avatar: body.avatar || '',
        languages: Array.isArray(body.languages) ? body.languages : [],
        categories: Array.isArray(body.categories) ? body.categories : [],
        status: 'pending',
        identityVerificationStatus: 'pending',
        location: (body.location || '').trim(),
        bio: (body.bio || '').trim(),
        socialMedia,
        userId: user._id,
        crm: { activationStatus: 'onboarding', dataSubmissionStatus: 'incomplete' },
    });
    await influencer.save();
    await ensureInfluencerHasProfileShortCode(String(influencer._id)).catch(() => {});
    return influencer;
}

async function buildSessionSafe(user) {
    try {
        return await buildInfluencerAppSession(user, { syncWalletFromApp: false });
    } catch (_) {
        return null;
    }
}

class InfluencerAuthController {
    /**
     * POST /api/influencers/app/auth/register
     * Crea la cuenta (rol influencer) + el perfil de influencer y devuelve token + sesión.
     */
    async register(req, res) {
        try {
            const b = req.body || {};
            const email = b.email ? String(b.email).trim().toLowerCase() : null;
            const phone = b.phone ? normalizePhone(String(b.phone)) : null;
            const password = b.password != null ? String(b.password) : '';
            const firstName = (b.firstName || '').trim();
            const lastName = (b.lastName || '').trim();

            if (!email && !phone) {
                return res.status(400).json({ success: false, message: 'Indica tu correo o teléfono/WhatsApp' });
            }
            if (!PASSWORD_RULE.test(password)) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
                });
            }
            if (!firstName && !b.name) {
                return res.status(400).json({ success: false, message: 'Indica tu nombre' });
            }

            if (email) {
                const exists = await User.findOne({ email });
                if (exists) {
                    return res.status(409).json({ success: false, message: 'Ya existe una cuenta con este email', code: 'EMAIL_TAKEN' });
                }
            }
            let phoneStored = null;
            if (phone) {
                if (!allowDuplicatePhonesForTesting()) {
                    const exists = await User.findOne({ phone });
                    if (exists) {
                        return res.status(409).json({ success: false, message: 'Ya existe una cuenta con este teléfono/WhatsApp', code: 'PHONE_TAKEN' });
                    }
                    phoneStored = phone;
                } else {
                    phoneStored = await resolveStoragePhone(phone);
                }
            }

            const defaultRole = await ensureUserRole();
            const user = new User({
                email: email || undefined,
                phone: phoneStored || undefined,
                password,
                firstName: firstName || (b.name ? String(b.name).trim().split(' ')[0] : 'Influencer'),
                lastName: lastName || '',
                primaryRole: 'influencer',
                profileTypes: ['influencer'],
                roles: [defaultRole._id],
                settings: {
                    language: 'es',
                    timezone: 'America/Mexico_City',
                    notifications: { email: true, push: true, sms: false },
                    privacy: { profileVisibility: 'public', showEmail: false, showPhone: false },
                },
            });
            await user.save();

            await ensureInfluencerProfile(user, b);

            const { token, refreshToken } = signTokens(user);
            user.refreshToken = refreshToken;
            await user.save();

            const session = await buildSessionSafe(user);
            return res.status(201).json({
                success: true,
                message: 'Cuenta de influencer creada',
                token,
                refreshToken,
                user: publicUser(user),
                influencer: session,
            });
        } catch (error) {
            console.error('❌ influencer register:', error);
            if (error.code === 11000) {
                return res.status(409).json({ success: false, message: 'Ya existe una cuenta con esos datos' });
            }
            return res.status(500).json({ success: false, message: 'No se pudo crear la cuenta' });
        }
    }

    /**
     * POST /api/influencers/app/auth/enter
     * Acceso directo para la app: si la cuenta existe inicia sesión; si no, la crea y la da de alta
     * como influencer. En ambos casos garantiza el perfil de influencer y devuelve token + sesión.
     */
    async enter(req, res) {
        try {
            const b = req.body || {};
            const loginRaw =
                b.login != null && String(b.login).trim() !== ''
                    ? String(b.login).trim()
                    : '';
            const email = (b.email ? String(b.email).trim().toLowerCase() : '') ||
                (loginRaw.includes('@') ? loginRaw.toLowerCase() : '');
            const phoneInput = (b.phone ? String(b.phone) : '') ||
                (loginRaw && !loginRaw.includes('@') ? loginRaw : '');
            const phone = phoneInput ? normalizePhone(phoneInput) : null;
            const password = b.password != null ? String(b.password) : '';

            if (!email && !phone) {
                return res.status(400).json({ success: false, message: 'Indica tu correo o teléfono/WhatsApp' });
            }
            if (!password) {
                return res.status(400).json({ success: false, message: 'Contraseña requerida' });
            }

            // Buscar cuenta existente por email o teléfono.
            let user = null;
            if (email) {
                user = await User.findOne({ email: { $in: buildEmailCandidates(email) } })
                    .select('+password')
                    .populate('roles');
            }
            if (!user && phone) {
                if (phone.length < 10) {
                    return res.status(400).json({ success: false, message: 'Teléfono/WhatsApp inválido' });
                }
                const candidates = await User.find(phoneLookupFilter(phone)).select('+password').populate('roles');
                if (candidates.length === 1) {
                    user = candidates[0];
                } else if (candidates.length > 1) {
                    for (const c of candidates) {
                        if (await bcrypt.compare(password, c.password)) {
                            user = c;
                            break;
                        }
                    }
                    if (!user) {
                        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
                    }
                }
            }

            let created = false;

            if (user) {
                // Cuenta existente → validar contraseña.
                if (user.isLocked && user.isLocked()) {
                    return res.status(423).json({ success: false, message: 'Cuenta bloqueada temporalmente' });
                }
                const validPassword = await bcrypt.compare(password, user.password);
                if (!validPassword) {
                    if (typeof user.incLoginAttempts === 'function') await user.incLoginAttempts().catch(() => {});
                    return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
                }
                user.loginAttempts = 0;
                user.lockUntil = undefined;
            } else {
                // No existe → alta directa como influencer.
                if (!PASSWORD_RULE.test(password)) {
                    return res.status(400).json({
                        success: false,
                        message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
                    });
                }
                let phoneStored = null;
                if (phone) {
                    phoneStored = allowDuplicatePhonesForTesting() ? await resolveStoragePhone(phone) : phone;
                }
                const defaultRole = await ensureUserRole();
                const firstName = (b.firstName || '').trim() ||
                    (b.name ? String(b.name).trim().split(' ')[0] : '') ||
                    (email ? email.split('@')[0] : 'Influencer');
                user = new User({
                    email: email || undefined,
                    phone: phoneStored || undefined,
                    password,
                    firstName,
                    lastName: (b.lastName || '').trim(),
                    primaryRole: 'influencer',
                    profileTypes: ['influencer'],
                    roles: [defaultRole._id],
                    settings: {
                        language: 'es',
                        timezone: 'America/Mexico_City',
                        notifications: { email: true, push: true, sms: false },
                        privacy: { profileVisibility: 'public', showEmail: false, showPhone: false },
                    },
                });
                await user.save();
                created = true;
            }

            // Garantizar rol/perfil de influencer (alta).
            if (!Array.isArray(user.profileTypes) || !user.profileTypes.includes('influencer')) {
                user.profileTypes = [...new Set([...(user.profileTypes || []), 'influencer'])];
            }
            user.stats = user.stats || {};
            user.stats.lastLogin = new Date();
            user.stats.loginCount = (user.stats.loginCount || 0) + 1;

            await ensureInfluencerProfile(user, b);

            const { token, refreshToken } = signTokens(user);
            user.refreshToken = refreshToken;
            await user.save();

            const session = await buildSessionSafe(user);
            return res.status(created ? 201 : 200).json({
                success: true,
                created,
                message: created ? 'Cuenta de influencer creada' : 'Inicio de sesión exitoso',
                token,
                refreshToken,
                user: publicUser(user),
                influencer: session,
            });
        } catch (error) {
            console.error('❌ influencer enter:', error);
            if (error.code === 11000) {
                return res.status(409).json({ success: false, message: 'Conflicto al crear la cuenta; reintenta' });
            }
            return res.status(500).json({ success: false, message: 'No se pudo acceder' });
        }
    }

    /**
     * POST /api/influencers/app/auth/login
     * Email o teléfono + contraseña. Garantiza perfil de influencer y devuelve token + sesión.
     */
    async login(req, res) {
        try {
            const b = req.body || {};
            const loginRaw =
                b.login != null && String(b.login).trim() !== ''
                    ? String(b.login).trim()
                    : b.email != null
                      ? String(b.email).trim()
                      : '';
            const password = b.password != null ? String(b.password) : '';
            if (!loginRaw) {
                return res.status(400).json({ success: false, message: 'Email o teléfono/WhatsApp requerido' });
            }
            if (!password) {
                return res.status(400).json({ success: false, message: 'Contraseña requerida' });
            }

            const isEmail = loginRaw.includes('@');
            let user = null;
            if (isEmail) {
                user = await User.findOne({ email: { $in: buildEmailCandidates(loginRaw) } })
                    .select('+password')
                    .populate('roles');
            } else {
                const phoneNorm = normalizePhone(loginRaw);
                if (!phoneNorm || phoneNorm.length < 10) {
                    return res.status(400).json({ success: false, message: 'Teléfono/WhatsApp inválido' });
                }
                const candidates = await User.find(phoneLookupFilter(phoneNorm)).select('+password').populate('roles');
                if (candidates.length === 1) {
                    user = candidates[0];
                } else if (candidates.length > 1) {
                    for (const c of candidates) {
                        if (await bcrypt.compare(password, c.password)) {
                            user = c;
                            break;
                        }
                    }
                }
            }

            if (!user) {
                return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            }
            if (user.isLocked && user.isLocked()) {
                return res.status(423).json({ success: false, message: 'Cuenta bloqueada temporalmente' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                if (typeof user.incLoginAttempts === 'function') await user.incLoginAttempts().catch(() => {});
                return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            }

            user.loginAttempts = 0;
            user.lockUntil = undefined;
            user.stats = user.stats || {};
            user.stats.lastLogin = new Date();
            user.stats.loginCount = (user.stats.loginCount || 0) + 1;

            if (!Array.isArray(user.profileTypes) || !user.profileTypes.includes('influencer')) {
                user.profileTypes = [...new Set([...(user.profileTypes || []), 'influencer'])];
            }

            await ensureInfluencerProfile(user, {});

            const { token, refreshToken } = signTokens(user);
            user.refreshToken = refreshToken;
            await user.save();

            const session = await buildSessionSafe(user);
            return res.json({
                success: true,
                message: 'Inicio de sesión exitoso',
                token,
                refreshToken,
                user: publicUser(user),
                influencer: session,
            });
        } catch (error) {
            console.error('❌ influencer login:', error);
            return res.status(500).json({ success: false, message: 'No se pudo iniciar sesión' });
        }
    }
}

module.exports = new InfluencerAuthController();
