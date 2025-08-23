const express = require('express');
const { body, validationResult, param } = require('express-validator');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
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
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        
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

// Middleware para verificar permisos de administrador
const requireAdmin = async (req, res, next) => {
    try {
        const hasAdminRole = req.user.roles.some(role => 
            role.name === 'admin' || role.level >= 8
        );
        
        if (!hasAdminRole) {
            return res.status(403).json({
                message: 'Acceso denegado. Se requieren permisos de administrador'
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({
            message: 'Error al verificar permisos'
        });
    }
};

// Middleware para verificar permisos de moderador o superior
const requireModerator = async (req, res, next) => {
    try {
        const hasModeratorRole = req.user.roles.some(role => 
            role.name === 'admin' || role.name === 'moderator' || role.level >= 6
        );
        
        if (!hasModeratorRole) {
            return res.status(403).json({
                message: 'Acceso denegado. Se requieren permisos de moderador'
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({
            message: 'Error al verificar permisos'
        });
    }
};

// GET /api/users - Listar usuarios (solo admin/moderador)
router.get('/', authenticateToken, requireModerator, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            role, 
            profileType, 
            isVerified, 
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Construir filtros
        const filters = {};
        
        if (role) {
            filters.primaryRole = role;
        }
        
        if (profileType) {
            filters.profileTypes = profileType;
        }
        
        if (isVerified !== undefined) {
            filters.isVerified = isVerified === 'true';
        }
        
        if (search) {
            filters.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Construir ordenamiento
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Ejecutar consulta con paginación
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const users = await User.find(filters)
            .populate('roles', 'name displayName level')
            .select('-password -refreshToken -emailVerificationToken -passwordResetToken')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(filters);

        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error al listar usuarios:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// GET /api/users/:id - Obtener usuario específico
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si el usuario puede acceder a este perfil
        const canAccess = req.user._id.toString() === id || 
                         req.user.roles.some(role => role.name === 'admin' || role.name === 'moderator');

        if (!canAccess) {
            return res.status(403).json({
                message: 'Acceso denegado'
            });
        }

        const user = await User.findById(id)
            .populate('roles', 'name displayName level')
            .populate('userProfile')
            .select('-password -refreshToken -emailVerificationToken -passwordResetToken');

        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        res.json({ user });

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', authenticateToken, [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Número de teléfono inválido'),
    body('settings')
        .optional()
        .isObject()
        .withMessage('Configuración debe ser un objeto válido')
], async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si el usuario puede actualizar este perfil
        const canUpdate = req.user._id.toString() === id || 
                         req.user.roles.some(role => role.name === 'admin');

        if (!canUpdate) {
            return res.status(403).json({
                message: 'Acceso denegado'
            });
        }

        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const { firstName, lastName, phone, settings } = req.body;

        // Construir objeto de actualización
        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (phone) updateData.phone = phone;
        if (settings) updateData.settings = { ...req.user.settings, ...settings };

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('roles', 'name displayName level')
        .populate('userProfile')
        .select('-password -refreshToken -emailVerificationToken -passwordResetToken');

        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            message: 'Usuario actualizado exitosamente',
            user
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// POST /api/users/:id/change-role - Cambiar rol de usuario (solo admin)
router.post('/:id/change-role', authenticateToken, requireAdmin, [
    body('newRole')
        .isIn(['influencer', 'brand', 'agency'])
        .withMessage('Rol inválido'),
    body('action')
        .isIn(['add', 'remove'])
        .withMessage('Acción inválida')
], async (req, res) => {
    try {
        const { id } = req.params;
        const { newRole, action } = req.body;

        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        if (action === 'add') {
            // Agregar nuevo tipo de perfil
            if (!user.profileTypes.includes(newRole)) {
                user.profileTypes.push(newRole);
                
                // Obtener el rol correspondiente
                const role = await Role.findOne({ name: newRole });
                if (role) {
                    user.roles.push(role._id);
                }
            }
        } else {
            // Remover tipo de perfil
            user.profileTypes = user.profileTypes.filter(type => type !== newRole);
            
            // Remover rol correspondiente (excepto si es el rol primario)
            if (user.primaryRole !== newRole) {
                const role = await Role.findOne({ name: newRole });
                if (role) {
                    user.roles = user.roles.filter(roleId => roleId.toString() !== role._id.toString());
                }
            }
        }

        await user.save();

        res.json({
            message: `Rol ${action === 'add' ? 'agregado' : 'removido'} exitosamente`,
            user: {
                id: user._id,
                profileTypes: user.profileTypes,
                primaryRole: user.primaryRole
            }
        });

    } catch (error) {
        console.error('Error al cambiar rol:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// POST /api/users/:id/verify - Verificar usuario (solo admin/moderador)
router.post('/:id/verify', authenticateToken, requireModerator, async (req, res) => {
    try {
        const { id } = req.params;
        const { isVerified, verificationNotes } = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            { 
                isVerified: isVerified,
                'verification.verifiedAt': isVerified ? new Date() : undefined,
                'verification.verifiedBy': isVerified ? req.user._id : undefined,
                'verification.notes': verificationNotes
            },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            message: `Usuario ${isVerified ? 'verificado' : 'desverificado'} exitosamente`,
            user: {
                id: user._id,
                isVerified: user.isVerified,
                verification: user.verification
            }
        });

    } catch (error) {
        console.error('Error al verificar usuario:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// POST /api/users/:id/block - Bloquear/desbloquear usuario (solo admin)
router.post('/:id/block', authenticateToken, requireAdmin, [
    body('isBlocked')
        .isBoolean()
        .withMessage('Estado de bloqueo inválido'),
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La razón debe tener máximo 500 caracteres')
], async (req, res) => {
    try {
        const { id } = req.params;
        const { isBlocked, reason } = req.body;

        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { 
                isBlocked: isBlocked,
                'blocking.reason': reason,
                'blocking.blockedAt': isBlocked ? new Date() : undefined,
                'blocking.blockedBy': isBlocked ? req.user._id : undefined
            },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            message: `Usuario ${isBlocked ? 'bloqueado' : 'desbloqueado'} exitosamente`,
            user: {
                id: user._id,
                isBlocked: user.isBlocked,
                blocking: user.blocking
            }
        });

    } catch (error) {
        console.error('Error al bloquear usuario:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// DELETE /api/users/:id - Eliminar usuario (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que no se elimine a sí mismo
        if (req.user._id.toString() === id) {
            return res.status(400).json({
                message: 'No puedes eliminar tu propia cuenta'
            });
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        // Eliminar perfil asociado si existe
        if (user.userProfile) {
            await UserProfile.findByIdAndDelete(user.userProfile);
        }

        res.json({
            message: 'Usuario eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// GET /api/users/:id/profile - Obtener perfil completo del usuario
router.get('/:id/profile', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si el usuario puede acceder a este perfil
        const canAccess = req.user._id.toString() === id || 
                         req.user.roles.some(role => role.name === 'admin' || role.name === 'moderator');

        if (!canAccess) {
            return res.status(403).json({
                message: 'Acceso denegado'
            });
        }

        const user = await User.findById(id)
            .populate('roles', 'name displayName level')
            .populate('userProfile')
            .select('-password -refreshToken -emailVerificationToken -passwordResetToken');

        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                primaryRole: user.primaryRole,
                profileTypes: user.profileTypes,
                roles: user.roles,
                isVerified: user.isVerified,
                userProfile: user.userProfile,
                settings: user.settings,
                stats: user.stats,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// GET /api/users/stats/overview - Estadísticas generales (solo admin)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    verifiedUsers: { $sum: { $cond: ['$isVerified', 1, 0] } },
                    blockedUsers: { $sum: { $cond: ['$isBlocked', 1, 0] } },
                    totalInfluencers: { $sum: { $cond: [{ $in: ['influencer', '$profileTypes'] }, 1, 0] } },
                    totalBrands: { $sum: { $cond: [{ $in: ['brand', '$profileTypes'] }, 1, 0] } },
                    totalAgencies: { $sum: { $cond: [{ $in: ['agency', '$profileTypes'] }, 1, 0] } }
                }
            }
        ]);

        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('firstName lastName email primaryRole createdAt isVerified');

        const roleDistribution = await User.aggregate([
            {
                $group: {
                    _id: '$primaryRole',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.json({
            overview: stats[0] || {},
            recentUsers,
            roleDistribution
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;
