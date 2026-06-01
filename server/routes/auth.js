const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Role = require('../models/Role');
const { authUserDashboardFields } = require('../utils/platformSuperuser');
const { buildEmailCandidates } = require('../utils/emailCandidates');
const crypto = require('crypto');
const PasswordResetOtp = require('../models/PasswordResetOtp');
const { sendSms, twilioConfigured } = require('../utils/twilioSms');
const {
    allowDuplicatePhonesForTesting,
    normalizePhone,
    publicPhone,
    phoneLookupFilter,
    resolveStoragePhone,
} = require('../utils/phoneTesting');
const router = express.Router();
const SESSION_EXPIRES_IN = '24h';

function otpPepper() {
    return String(process.env.PASSWORD_RESET_OTP_PEPPER || process.env.JWT_SECRET || 'otp').trim() || 'otp';
}

function hashOtp(phone, otp) {
    return crypto
        .createHash('sha256')
        .update(`${phone}:${otp}:${otpPepper()}`)
        .digest('hex');
}

function generateOtp6() {
    const n = Math.floor(Math.random() * 1000000);
    return String(n).padStart(6, '0');
}

function phoneResetLookup(phoneNorm) {
    return phoneLookupFilter(phoneNorm);
}

/** Asegura que exista el rol 'user' en la BD (para registro sin ejecutar seeder). */
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
        limits: { maxPromotionsPerMonth: 0, maxFileUploadSize: 5 * 1024 * 1024, maxStorageQuota: 100 * 1024 * 1024 }
    });
    console.log('✅ Rol "user" creado automáticamente (no existía en la BD)');
    return role;
}

// Middleware para validar JWT
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token de acceso requerido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).populate('roles');
        
        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        if (user.isLocked()) {
            return res.status(423).json({ message: 'Cuenta bloqueada temporalmente' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        return res.status(403).json({ message: 'Token inválido' });
    }
};

// Validaciones para registro (email opcional si hay phone; phone opcional si hay email)
const registerValidation = [
    body('email')
        .optional({ values: 'null', checkFalsy: true })
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('phone')
        .optional({ values: 'null', checkFalsy: true })
        .trim()
        .isLength({ min: 10, max: 20 })
        .withMessage('Teléfono/WhatsApp debe tener entre 10 y 20 caracteres'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
    body('primaryRole')
        .optional({ values: 'falsy' })
        .isIn(['user', 'influencer', 'brand', 'agency'])
        .withMessage('Rol primario inválido (user, influencer, brand, agency)')
];

// Validaciones para login: acepta "login" (nuevo) o "email" (compatibilidad)
const loginValidation = [
    body('login')
        .optional({ values: 'null', checkFalsy: true })
        .trim(),
    body('email')
        .optional({ values: 'null', checkFalsy: true })
        .isEmail()
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Contraseña requerida')
];

// POST /api/auth/register - Registro de usuario (email o teléfono/WhatsApp)
router.post('/register', registerValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const { email: emailRaw, phone: phoneRaw, password, firstName, lastName, primaryRole: primaryRoleBody } = req.body;
        const email = emailRaw ? String(emailRaw).trim().toLowerCase() : null;
        const phone = phoneRaw ? normalizePhone(String(phoneRaw)) : null;
        if (!email && !phone) {
            return res.status(400).json({
                message: 'Indica tu correo electrónico o tu teléfono/WhatsApp'
            });
        }

        const primaryRole = primaryRoleBody || 'user';

        if (email) {
            const existingByEmail = await User.findOne({ email });
            if (existingByEmail) {
                return res.status(409).json({ message: 'Ya existe un usuario con este email' });
            }
        }
        let phoneStored = null;
        if (phone) {
            if (!allowDuplicatePhonesForTesting()) {
                const existingByPhone = await User.findOne({ phone });
                if (existingByPhone) {
                    return res.status(409).json({
                        message: 'Ya existe un usuario con este teléfono/WhatsApp',
                    });
                }
                phoneStored = phone;
            } else {
                phoneStored = await resolveStoragePhone(phone);
            }
        }

        const defaultRole = await ensureUserRole();
        const profileTypes = primaryRole && primaryRole !== 'user' ? [primaryRole] : [];

        const user = new User({
            email: email || undefined,
            phone: phoneStored || undefined,
            password,
            firstName,
            lastName,
            primaryRole,
            profileTypes,
            roles: [defaultRole._id],
            settings: {
                language: 'es',
                timezone: 'America/Mexico_City',
                notifications: { email: true, push: true, sms: false },
                privacy: { profileVisibility: 'public', showEmail: false, showPhone: false }
            }
        });

        await user.save();

        // Generar token JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: SESSION_EXPIRES_IN }
        );

        // Generar refresh token
        const refreshToken = jwt.sign(
            { userId: user._id, type: 'refresh' },
            process.env.JWT_SECRET,
            { expiresIn: SESSION_EXPIRES_IN }
        );

        // Guardar refresh token
        user.refreshToken = refreshToken;
        await user.save();

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: {
                id: user._id,
                email: user.email || undefined,
                phone: publicPhone(user.phone),
                firstName: user.firstName,
                lastName: user.lastName,
                primaryRole: user.primaryRole,
                isSuperAdmin: user.isSuperAdmin,
                profileTypes: user.profileTypes,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
                ...authUserDashboardFields(user),
            },
            token,
            refreshToken
        });

    } catch (error) {
        console.error('Error en registro:', error);
        if (error.code === 11000 && String(error.message || '').includes('phone')) {
            return res.status(409).json({
                message: allowDuplicatePhonesForTesting()
                    ? 'Conflicto al guardar teléfono; reintenta el registro'
                    : 'Ya existe un usuario con este teléfono/WhatsApp',
            });
        }
        const message = process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor';
        res.status(500).json({
            message,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /api/auth/login - Inicio de sesión (email o teléfono/WhatsApp + contraseña)
router.post('/login', loginValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const { login: loginRaw, email: emailRaw, password } = req.body;
        // Aceptar "login" (nuevo) o "email" (compatibilidad con frontend antiguo/proxy)
        const loginTrim = (loginRaw != null && String(loginRaw).trim() !== ''
            ? String(loginRaw).trim()
            : (emailRaw != null ? String(emailRaw).trim() : '')
        );
        if (!loginTrim) {
            return res.status(400).json({ message: 'Email o teléfono/WhatsApp requerido' });
        }
        const isEmail = loginTrim.includes('@');

        let user;
        let passwordAlreadyVerified = false;
        if (isEmail) {
            const emailCandidates = buildEmailCandidates(loginTrim);
            user = await User.findOne({ email: { $in: emailCandidates } })
                .select('+password')
                .populate('roles');
        } else {
            const phoneNorm = normalizePhone(loginTrim);
            if (!phoneNorm || phoneNorm.length < 10) {
                return res.status(400).json({ message: 'Teléfono/WhatsApp inválido' });
            }
            const phoneCandidates = await User.find(phoneLookupFilter(phoneNorm))
                .select('+password')
                .populate('roles');

            if (phoneCandidates.length === 0) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            if (phoneCandidates.length === 1) {
                user = phoneCandidates[0];
            } else if (allowDuplicatePhonesForTesting()) {
                for (const candidate of phoneCandidates) {
                    const match = await bcrypt.compare(password, candidate.password);
                    if (match) {
                        user = candidate;
                        passwordAlreadyVerified = true;
                        break;
                    }
                }
                if (!user) {
                    return res.status(401).json({ message: 'Credenciales inválidas' });
                }
            } else {
                return res.status(409).json({
                    message:
                        'Varias cuentas comparten este teléfono. Usa email para iniciar sesión o contacta soporte.',
                });
            }
        }

        if (!user) {
            return res.status(401).json({
                message: 'Credenciales inválidas'
            });
        }

        // Verificar si la cuenta está bloqueada
        if (user.isLocked()) {
            const lockTime = user.lockUntil;
            if (lockTime && lockTime > Date.now()) {
                const remainingTime = Math.ceil((lockTime - Date.now()) / 1000);
                return res.status(423).json({
                    message: `Cuenta bloqueada temporalmente. Intenta de nuevo en ${remainingTime} segundos`
                });
            } else {
                // Desbloquear cuenta si ya pasó el tiempo
                user.isLocked = false;
                user.loginAttempts = 0;
                user.lockUntil = undefined;
            }
        }

        if (!passwordAlreadyVerified) {
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            // Incrementar intentos fallidos
            await user.incLoginAttempts();

            if (user.isLocked()) {
                return res.status(423).json({
                    message: 'Demasiados intentos fallidos. Cuenta bloqueada temporalmente'
                });
            }

            return res.status(401).json({
                message: 'Credenciales inválidas'
            });
        }
        }

        // Resetear intentos fallidos y actualizar último acceso
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        user.stats = user.stats || {};
        user.stats.lastLogin = new Date();
        user.stats.loginCount = (user.stats.loginCount || 0) + 1;
        await user.save();

        // Generar token JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: SESSION_EXPIRES_IN }
        );

        // Generar refresh token
        const refreshToken = jwt.sign(
            { userId: user._id, type: 'refresh' },
            process.env.JWT_SECRET,
            { expiresIn: SESSION_EXPIRES_IN }
        );

        // Guardar refresh token
        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            message: 'Inicio de sesión exitoso',
            user: {
                id: user._id,
                email: user.email || undefined,
                phone: publicPhone(user.phone),
                firstName: user.firstName,
                lastName: user.lastName,
                primaryRole: user.primaryRole,
                isSuperAdmin: user.isSuperAdmin,
                profileTypes: user.profileTypes,
                roles: user.roles.map(role => ({
                    id: role._id,
                    name: role.name,
                    displayName: role.displayName,
                    level: role.level
                })),
                isVerified: user.isVerified,
                lastLogin: user.lastLogin,
                ...authUserDashboardFields(user),
            },
            token,
            refreshToken
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /api/auth/refresh - Renovar token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                message: 'Refresh token requerido'
            });
        }

        // Verificar refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        if (decoded.type !== 'refresh') {
            return res.status(403).json({
                message: 'Tipo de token inválido'
            });
        }

        // Buscar usuario
        const user = await User.findById(decoded.userId);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({
                message: 'Refresh token inválido'
            });
        }

        // Generar nuevo token
        const newToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: SESSION_EXPIRES_IN }
        );

        // Generar nuevo refresh token
        const newRefreshToken = jwt.sign(
            { userId: user._id, type: 'refresh' },
            process.env.JWT_SECRET,
            { expiresIn: SESSION_EXPIRES_IN }
        );

        // Actualizar refresh token
        user.refreshToken = newRefreshToken;
        await user.save();

        res.json({
            message: 'Token renovado exitosamente',
            token: newToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Refresh token expirado'
            });
        }
        
        console.error('Error al renovar token:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // Invalidar refresh token
        req.user.refreshToken = undefined;
        await req.user.save();

        res.json({
            message: 'Sesión cerrada exitosamente'
        });

    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// GET /api/auth/me - Obtener información del usuario autenticado
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('roles')
            .populate('userProfile')
            .select('-password -refreshToken -emailVerificationToken -passwordResetToken');

        res.json({
            user: {
                id: user._id,
                email: user.email || undefined,
                phone: publicPhone(user.phone),
                firstName: user.firstName,
                lastName: user.lastName,
                primaryRole: user.primaryRole,
                isSuperAdmin: user.isSuperAdmin,
                profileTypes: user.profileTypes,
                roles: user.roles.map(role => ({
                    id: role._id,
                    name: role.name,
                    displayName: role.displayName,
                    level: role.level
                })),
                isVerified: user.isVerified,
                userProfile: user.userProfile,
                settings: user.settings,
                stats: user.stats,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                ...authUserDashboardFields(user),
            }
        });

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// POST /api/auth/change-password - Cambiar contraseña
router.post('/change-password', authenticateToken, [
    body('currentPassword')
        .notEmpty()
        .withMessage('Contraseña actual requerida'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;

        // Cargar contraseña explícitamente (password tiene select: false en el modelo)
        const userWithPassword = await User.findById(req.user._id).select('+password');
        if (!userWithPassword) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const isValidPassword = await bcrypt.compare(currentPassword, userWithPassword.password);
        if (!isValidPassword) {
            return res.status(400).json({
                message: 'Contraseña actual incorrecta'
            });
        }

        // Actualizar contraseña (el hash lo hace pre-save middleware del modelo)
        userWithPassword.password = newPassword;
        await userWithPassword.save();

        res.json({
            message: 'Contraseña cambiada exitosamente'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/auth/password-reset/request
 * Body: { phone }
 * Env: TWILIO_* optional (stub mode without keys).
 */
router.post('/password-reset/request', async (req, res) => {
    try {
        const phoneRaw = req.body?.phone != null ? String(req.body.phone) : '';
        const phoneNorm = normalizePhone(phoneRaw);
        if (!phoneNorm || phoneNorm.length < 10) {
            return res.status(400).json({ success: false, message: 'Teléfono/WhatsApp inválido' });
        }

        const user = await User.findOne(phoneResetLookup(phoneNorm)).select('_id phone').lean();
        // Do not reveal whether user exists
        if (!user) {
            return res.json({ success: true, message: 'Si el número existe, enviaremos un código por SMS.' });
        }

        const now = new Date();
        const existing = await PasswordResetOtp.findOne({
            user: user._id,
            phone: user.phone,
            expiresAt: { $gt: now },
            consumedAt: null,
        })
            .sort({ createdAt: -1 })
            .lean();

        if (existing?.lastSentAt) {
            const diffMs = now.getTime() - new Date(existing.lastSentAt).getTime();
            if (diffMs < 60_000) {
                return res.json({ success: true, message: 'Si el número existe, enviaremos un código por SMS.' });
            }
        }

        const otp = generateOtp6();
        const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
        const otpHash = hashOtp(user.phone, otp);

        const doc = await PasswordResetOtp.create({
            phone: user.phone,
            user: user._id,
            otpHash,
            expiresAt,
            attempts: 0,
            verifiedAt: null,
            consumedAt: null,
            lastSentAt: now,
            sendCount: 1,
        });

        const smsBody = `Tu código de recuperación de DameCódigo es: ${otp}. Vence en 10 minutos.`;
        await sendSms(user.phone, smsBody).catch(() => {});

        // In dev/stub mode, return code to unblock QA
        const includeOtp = process.env.NODE_ENV === 'development' || !twilioConfigured();
        return res.json({
            success: true,
            message: 'Si el número existe, enviaremos un código por SMS.',
            ...(includeOtp ? { debugOtp: otp, debugOtpId: String(doc._id) } : {}),
        });
    } catch (error) {
        console.error('password-reset/request:', error);
        return res.status(500).json({ success: false, message: 'No se pudo enviar el código' });
    }
});

/**
 * POST /api/auth/password-reset/verify
 * Body: { phone, otp }
 * Returns: { resetToken }
 */
router.post('/password-reset/verify', async (req, res) => {
    try {
        const phoneRaw = req.body?.phone != null ? String(req.body.phone) : '';
        const otpRaw = req.body?.otp != null ? String(req.body.otp) : '';
        const phoneNorm = normalizePhone(phoneRaw);
        const otp = otpRaw.trim();
        if (!phoneNorm || phoneNorm.length < 10) {
            return res.status(400).json({ success: false, message: 'Teléfono/WhatsApp inválido' });
        }
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ success: false, message: 'Código inválido' });
        }

        const user = await User.findOne(phoneResetLookup(phoneNorm)).select('_id phone').lean();
        if (!user) {
            return res.status(400).json({ success: false, message: 'Código inválido' });
        }

        const now = new Date();
        const doc = await PasswordResetOtp.findOne({
            user: user._id,
            phone: user.phone,
            expiresAt: { $gt: now },
            consumedAt: null,
        })
            .sort({ createdAt: -1 })
            .lean();

        if (!doc) {
            return res.status(400).json({ success: false, message: 'Código expirado o inválido' });
        }
        if ((doc.attempts || 0) >= 8) {
            return res.status(429).json({ success: false, message: 'Demasiados intentos. Solicita un nuevo código.' });
        }

        const expected = hashOtp(user.phone, otp);
        const match = expected === doc.otpHash;
        await PasswordResetOtp.updateOne(
            { _id: doc._id },
            match
                ? { $set: { verifiedAt: now }, $inc: { attempts: 1 } }
                : { $inc: { attempts: 1 } },
        );

        if (!match) {
            return res.status(400).json({ success: false, message: 'Código inválido' });
        }

        const resetToken = jwt.sign(
            { userId: String(user._id), phone: user.phone, type: 'pwd_reset', otpId: String(doc._id) },
            process.env.JWT_SECRET,
            { expiresIn: '15m' },
        );

        return res.json({ success: true, resetToken });
    } catch (error) {
        console.error('password-reset/verify:', error);
        return res.status(500).json({ success: false, message: 'No se pudo verificar el código' });
    }
});

/**
 * POST /api/auth/password-reset/confirm
 * Body: { resetToken, newPassword }
 */
router.post('/password-reset/confirm', async (req, res) => {
    try {
        const token = req.body?.resetToken != null ? String(req.body.resetToken) : '';
        const newPassword = req.body?.newPassword != null ? String(req.body.newPassword) : '';
        if (!token) return res.status(400).json({ success: false, message: 'resetToken requerido' });
        if (
            newPassword.length < 8 ||
            !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)
        ) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || decoded.type !== 'pwd_reset' || !decoded.userId || !decoded.otpId) {
            return res.status(403).json({ success: false, message: 'Token inválido' });
        }

        const otpDoc = await PasswordResetOtp.findById(decoded.otpId).lean();
        if (!otpDoc || !otpDoc.verifiedAt || otpDoc.consumedAt) {
            return res.status(403).json({ success: false, message: 'Código no verificado o ya usado' });
        }

        await PasswordResetOtp.updateOne({ _id: otpDoc._id }, { $set: { consumedAt: new Date() } });

        const user = await User.findById(decoded.userId).select('+password').populate('roles');
        if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        user.password = newPassword;
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        return res.json({ success: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error('password-reset/confirm:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expirado. Repite el proceso.' });
        }
        return res.status(500).json({ success: false, message: 'No se pudo actualizar la contraseña' });
    }
});

module.exports = router;
