const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Role = require('../models/Role');
const router = express.Router();

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

        if (user.isLocked) {
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

// Validaciones para registro
const registerValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
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
        .isIn(['influencer', 'brand', 'agency'])
        .withMessage('Rol primario inválido')
];

// Validaciones para login
const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('password')
        .notEmpty()
        .withMessage('Contraseña requerida')
];

// POST /api/auth/register - Registro de usuario
router.post('/register', registerValidation, async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const { email, password, firstName, lastName, primaryRole } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                message: 'Ya existe un usuario con este email'
            });
        }

        // Obtener el rol por defecto
        const defaultRole = await Role.findOne({ name: 'user' });
        if (!defaultRole) {
            return res.status(500).json({
                message: 'Error en la configuración del sistema'
            });
        }

        // Hashear la contraseña
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Crear el usuario
        const user = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            primaryRole,
            profileTypes: [primaryRole],
            roles: [defaultRole._id],
            settings: {
                language: 'es',
                timezone: 'America/Mexico_City',
                notifications: {
                    email: true,
                    push: true,
                    sms: false
                },
                privacy: {
                    profileVisibility: 'public',
                    showEmail: false,
                    showPhone: false
                }
            }
        });

        await user.save();

        // Generar token JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        // Generar refresh token
        const refreshToken = jwt.sign(
            { userId: user._id, type: 'refresh' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Guardar refresh token
        user.refreshToken = refreshToken;
        await user.save();

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                primaryRole: user.primaryRole,
                profileTypes: user.profileTypes,
                isVerified: user.isVerified,
                createdAt: user.createdAt
            },
            token,
            refreshToken
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /api/auth/login - Inicio de sesión
router.post('/login', loginValidation, async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Buscar usuario por email
        const user = await User.findOne({ email }).populate('roles');
        if (!user) {
            return res.status(401).json({
                message: 'Credenciales inválidas'
            });
        }

        // Verificar si la cuenta está bloqueada
        if (user.isLocked) {
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

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            // Incrementar intentos fallidos
            user.incLoginAttempts();
            await user.save();

            if (user.isLocked) {
                return res.status(423).json({
                    message: 'Demasiados intentos fallidos. Cuenta bloqueada temporalmente'
                });
            }

            return res.status(401).json({
                message: 'Credenciales inválidas'
            });
        }

        // Resetear intentos fallidos
        user.resetLoginAttempts();
        user.updateLastLogin();
        await user.save();

        // Generar token JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        // Generar refresh token
        const refreshToken = jwt.sign(
            { userId: user._id, type: 'refresh' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Guardar refresh token
        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            message: 'Inicio de sesión exitoso',
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                primaryRole: user.primaryRole,
                profileTypes: user.profileTypes,
                roles: user.roles.map(role => ({
                    id: role._id,
                    name: role.name,
                    displayName: role.displayName,
                    level: role.level
                })),
                isVerified: user.isVerified,
                lastLogin: user.lastLogin
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
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        // Generar nuevo refresh token
        const newRefreshToken = jwt.sign(
            { userId: user._id, type: 'refresh' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
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
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                primaryRole: user.primaryRole,
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
                lastLogin: user.lastLogin
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

        // Verificar contraseña actual
        const isValidPassword = await bcrypt.compare(currentPassword, req.user.password);
        if (!isValidPassword) {
            return res.status(400).json({
                message: 'Contraseña actual incorrecta'
            });
        }

        // Hashear nueva contraseña
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Actualizar contraseña
        req.user.password = hashedPassword;
        await req.user.save();

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

module.exports = router;
