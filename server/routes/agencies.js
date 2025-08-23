const express = require('express');
const { body, validationResult, param } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Agency = require('../models/Agency');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
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

// Middleware para verificar permisos de agencia
const requireAgencyAccess = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Verificar si el usuario es admin/moderador
        const isAdmin = req.user.roles.some(role => 
            role.name === 'admin' || role.name === 'moderator'
        );
        
        if (isAdmin) {
            return next();
        }
        
        // Verificar si el usuario es dueño de la agencia
        const agency = await Agency.findById(id);
        if (!agency) {
            return res.status(404).json({
                message: 'Agencia no encontrada'
            });
        }
        
        if (agency.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'Acceso denegado. Solo el dueño puede modificar esta agencia'
            });
        }
        
        req.agency = agency;
        next();
    } catch (error) {
        res.status(500).json({
            message: 'Error al verificar permisos'
        });
    }
};

// Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/agencies');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|svg|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'));
        }
    }
});

// Validaciones para crear/actualizar agencia
const agencyValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('type')
        .isIn(['influencer-marketing', 'social-media-management', 'content-creation', 'brand-strategy', 'creative-design', 'media-buying', 'public-relations', 'event-marketing', 'performance-marketing', 'analytics', 'full-service', 'specialized'])
        .withMessage('Tipo de agencia inválido'),
    body('category')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('La categoría debe tener entre 2 y 50 caracteres'),
    body('description')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('La descripción debe tener entre 10 y 1000 caracteres'),
    body('website')
        .optional()
        .isURL()
        .withMessage('URL del sitio web inválida'),
    body('contact.email')
        .optional()
        .isEmail()
        .withMessage('Email de contacto inválido'),
    body('contact.phone')
        .optional()
        .isMobilePhone()
        .withMessage('Teléfono de contacto inválido'),
    body('size')
        .optional()
        .isIn(['1-5', '6-10', '11-25', '26-50', '51-100', '100+'])
        .withMessage('Tamaño de agencia inválido'),
    body('founded')
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() })
        .withMessage('Año de fundación inválido')
];

// GET /api/agencies - Listar agencias
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            type, 
            category, 
            size, 
            isVerified, 
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Construir filtros
        const filters = { status: 'active' };
        
        if (type) {
            filters.type = type;
        }
        
        if (category) {
            filters.category = category;
        }
        
        if (size) {
            filters.size = size;
        }
        
        if (isVerified !== undefined) {
            filters.isVerified = isVerified === 'true';
        }
        
        if (search) {
            filters.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        // Construir ordenamiento
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Ejecutar consulta con paginación
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const agencies = await Agency.find(filters)
            .populate('owner', 'firstName lastName email')
            .populate('members.user', 'firstName lastName email')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Agency.countDocuments(filters);

        res.json({
            agencies,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error al listar agencias:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// GET /api/agencies/:id - Obtener agencia específica
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const agency = await Agency.findById(id)
            .populate('owner', 'firstName lastName email')
            .populate('members.user', 'firstName lastName email')
            .populate('members.permission', 'name description');

        if (!agency) {
            return res.status(404).json({
                message: 'Agencia no encontrada'
            });
        }

        // Incrementar vistas si la agencia está activa
        if (agency.status === 'active') {
            agency.metrics.views += 1;
            await agency.save();
        }

        res.json({ agency });

    } catch (error) {
        console.error('Error al obtener agencia:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// POST /api/agencies - Crear nueva agencia
router.post('/', authenticateToken, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
]), agencyValidation, async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        // Verificar que el usuario tenga rol de agencia
        if (!req.user.profileTypes.includes('agency')) {
            return res.status(403).json({
                message: 'Solo usuarios con perfil de agencia pueden crear agencias'
            });
        }

        // Verificar que no tenga ya una agencia
        const existingAgency = await Agency.findOne({ owner: req.user._id });
        if (existingAgency) {
            return res.status(409).json({
                message: 'Ya tienes una agencia registrada'
            });
        }

        const {
            name, type, category, description, website, contact,
            size, founded, headquarters, services, specializations,
            industries, team, financial, socialMedia
        } = req.body;

        // Procesar archivos subidos
        const logo = req.files.logo ? req.files.logo[0] : null;
        const documents = req.files.documents ? req.files.documents : [];

        // Crear la agencia
        const agency = new Agency({
            name,
            type,
            category,
            description,
            logo: logo ? `/uploads/agencies/${logo.filename}` : undefined,
            website,
            contact: {
                email: contact?.email,
                phone: contact?.phone,
                address: contact?.address
            },
            size,
            founded: founded ? parseInt(founded) : undefined,
            headquarters,
            services: services ? JSON.parse(services) : [],
            specializations: specializations ? JSON.parse(specializations) : [],
            industries: industries ? JSON.parse(industries) : [],
            team: team ? JSON.parse(team) : [],
            financial: financial ? JSON.parse(financial) : {},
            socialMedia: socialMedia ? JSON.parse(socialMedia) : {},
            owner: req.user._id,
            members: [{
                user: req.user._id,
                role: 'owner',
                permission: 'full-access',
                joinedAt: new Date()
            }],
            status: 'pending',
            isVerified: false
        });

        // Procesar documentos
        if (documents.length > 0) {
            agency.verification.documents = documents.map(doc => ({
                filename: doc.filename,
                originalName: doc.originalname,
                path: `/uploads/agencies/${doc.filename}`,
                uploadedAt: new Date()
            }));
        }

        await agency.save();

        // Actualizar el usuario con referencia a la agencia
        req.user.agencyMembership = {
            agency: agency._id,
            role: 'owner',
            joinedAt: new Date()
        };
        await req.user.save();

        res.status(201).json({
            message: 'Agencia creada exitosamente',
            agency: {
                id: agency._id,
                name: agency.name,
                type: agency.type,
                status: agency.status,
                isVerified: agency.isVerified
            }
        });

    } catch (error) {
        console.error('Error al crear agencia:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PUT /api/agencies/:id - Actualizar agencia
router.put('/:id', authenticateToken, requireAgencyAccess, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
]), agencyValidation, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const {
            name, type, category, description, website, contact,
            size, founded, headquarters, services, specializations,
            industries, team, financial, socialMedia
        } = req.body;

        // Procesar archivos subidos
        const logo = req.files.logo ? req.files.logo[0] : null;
        const documents = req.files.documents ? req.files.documents : [];

        // Construir objeto de actualización
        const updateData = {
            name, type, category, description, website,
            size, founded: founded ? parseInt(founded) : undefined,
            headquarters, contact
        };

        if (services) updateData.services = JSON.parse(services);
        if (specializations) updateData.specializations = JSON.parse(specializations);
        if (industries) updateData.industries = JSON.parse(industries);
        if (team) updateData.team = JSON.parse(team);
        if (financial) updateData.financial = JSON.parse(financial);
        if (socialMedia) updateData.socialMedia = JSON.parse(socialMedia);

        // Actualizar logo si se subió uno nuevo
        if (logo) {
            updateData.logo = `/uploads/agencies/${logo.filename}`;
            
            // Eliminar logo anterior si existe
            if (req.agency.logo) {
                const oldLogoPath = path.join(__dirname, '..', req.agency.logo);
                if (fs.existsSync(oldLogoPath)) {
                    fs.unlinkSync(oldLogoPath);
                }
            }
        }

        // Procesar documentos si se subieron nuevos
        if (documents.length > 0) {
            const newDocuments = documents.map(doc => ({
                filename: doc.filename,
                originalName: doc.originalname,
                path: `/uploads/agencies/${doc.filename}`,
                uploadedAt: new Date()
            }));
            
            updateData['verification.documents'] = [
                ...(req.agency.verification.documents || []),
                ...newDocuments
            ];
        }

        const agency = await Agency.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('owner', 'firstName lastName email')
        .populate('members.user', 'firstName lastName email');

        res.json({
            message: 'Agencia actualizada exitosamente',
            agency
        });

    } catch (error) {
        console.error('Error al actualizar agencia:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// POST /api/agencies/:id/members - Agregar miembro a la agencia
router.post('/:id/members', authenticateToken, requireAgencyAccess, [
    body('userId')
        .isMongoId()
        .withMessage('ID de usuario inválido'),
    body('role')
        .isIn(['member', 'manager', 'admin'])
        .withMessage('Rol inválido'),
    body('permission')
        .isIn(['read-only', 'limited', 'full-access'])
        .withMessage('Permiso inválido')
], async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role, permission } = req.body;

        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        // Verificar que el usuario existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        // Verificar que no sea ya miembro
        const existingMember = req.agency.members.find(
            member => member.user.toString() === userId
        );
        if (existingMember) {
            return res.status(409).json({
                message: 'El usuario ya es miembro de esta agencia'
            });
        }

        // Agregar miembro
        req.agency.members.push({
            user: userId,
            role,
            permission,
            joinedAt: new Date()
        });

        await req.agency.save();

        // Actualizar usuario con referencia a la agencia
        user.agencyMembership = {
            agency: req.agency._id,
            role,
            joinedAt: new Date()
        };
        await user.save();

        res.json({
            message: 'Miembro agregado exitosamente',
            member: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                },
                role,
                permission,
                joinedAt: new Date()
            }
        });

    } catch (error) {
        console.error('Error al agregar miembro:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// DELETE /api/agencies/:id/members/:memberId - Remover miembro de la agencia
router.delete('/:id/members/:memberId', authenticateToken, requireAgencyAccess, async (req, res) => {
    try {
        const { id, memberId } = req.params;

        // Verificar que el miembro existe
        const memberIndex = req.agency.members.findIndex(
            member => member._id.toString() === memberId
        );

        if (memberIndex === -1) {
            return res.status(404).json({
                message: 'Miembro no encontrado'
            });
        }

        const member = req.agency.members[memberIndex];

        // Verificar que no se elimine al dueño
        if (member.role === 'owner') {
            return res.status(400).json({
                message: 'No se puede eliminar al dueño de la agencia'
            });
        }

        // Remover miembro
        req.agency.members.splice(memberIndex, 1);
        await req.agency.save();

        // Actualizar usuario removiendo referencia a la agencia
        await User.findByIdAndUpdate(member.user, {
            $unset: { agencyMembership: 1 }
        });

        res.json({
            message: 'Miembro removido exitosamente'
        });

    } catch (error) {
        console.error('Error al remover miembro:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// POST /api/agencies/:id/verify - Verificar agencia (solo admin/moderador)
router.post('/:id/verify', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { isVerified, verificationNotes } = req.body;

        // Verificar permisos de admin/moderador
        const isAdmin = req.user.roles.some(role => 
            role.name === 'admin' || role.name === 'moderator'
        );

        if (!isAdmin) {
            return res.status(403).json({
                message: 'Acceso denegado. Se requieren permisos de administrador'
            });
        }

        const agency = await Agency.findByIdAndUpdate(
            id,
            { 
                isVerified: isVerified,
                'verification.verifiedAt': isVerified ? new Date() : undefined,
                'verification.verifiedBy': isVerified ? req.user._id : undefined,
                'verification.notes': verificationNotes,
                status: isVerified ? 'active' : 'pending'
            },
            { new: true, runValidators: true }
        );

        if (!agency) {
            return res.status(404).json({
                message: 'Agencia no encontrada'
            });
        }

        res.json({
            message: `Agencia ${isVerified ? 'verificada' : 'desverificada'} exitosamente`,
            agency: {
                id: agency._id,
                name: agency.name,
                isVerified: agency.isVerified,
                status: agency.status,
                verification: agency.verification
            }
        });

    } catch (error) {
        console.error('Error al verificar agencia:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// DELETE /api/agencies/:id - Eliminar agencia
router.delete('/:id', authenticateToken, requireAgencyAccess, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que sea el dueño
        if (req.agency.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'Solo el dueño puede eliminar la agencia'
            });
        }

        // Eliminar archivos asociados
        if (req.agency.logo) {
            const logoPath = path.join(__dirname, '..', req.agency.logo);
            if (fs.existsSync(logoPath)) {
                fs.unlinkSync(logoPath);
            }
        }

        // Eliminar documentos
        if (req.agency.verification.documents) {
            req.agency.verification.documents.forEach(doc => {
                const docPath = path.join(__dirname, '..', doc.path);
                if (fs.existsSync(docPath)) {
                    fs.unlinkSync(docPath);
                }
            });
        }

        // Eliminar la agencia
        await Agency.findByIdAndDelete(id);

        // Actualizar usuarios miembros removiendo referencia
        await User.updateMany(
            { 'agencyMembership.agency': id },
            { $unset: { agencyMembership: 1 } }
        );

        res.json({
            message: 'Agencia eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar agencia:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// GET /api/agencies/:id/analytics - Obtener analytics de la agencia
router.get('/:id/analytics', authenticateToken, requireAgencyAccess, async (req, res) => {
    try {
        const { id } = req.params;
        const { period = '30d' } = req.query;

        // Calcular fechas para el período
        const now = new Date();
        let startDate;
        
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Obtener métricas básicas
        const analytics = {
            period,
            startDate,
            endDate: now,
            overview: {
                totalViews: req.agency.metrics.views,
                totalLeads: req.agency.metrics.leads,
                totalProjects: req.agency.metrics.projects,
                totalRevenue: req.agency.metrics.revenue
            },
            trends: {
                views: req.agency.metrics.views,
                leads: req.agency.metrics.leads,
                projects: req.agency.metrics.projects,
                revenue: req.agency.metrics.revenue
            },
            team: {
                totalMembers: req.agency.members.length,
                roles: req.agency.members.reduce((acc, member) => {
                    acc[member.role] = (acc[member.role] || 0) + 1;
                    return acc;
                }, {})
            },
            portfolio: {
                totalProjects: req.agency.portfolio?.length || 0,
                categories: req.agency.portfolio?.reduce((acc, project) => {
                    acc[project.category] = (acc[project.category] || 0) + 1;
                    return acc;
                }, {}) || {}
            }
        };

        res.json({ analytics });

    } catch (error) {
        console.error('Error al obtener analytics:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;
