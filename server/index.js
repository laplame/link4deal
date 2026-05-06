const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
// Cargar .env desde el directorio raíz del proyecto
const { envPath } = require('./config/envPath');
require('dotenv').config({ path: envPath });

// Import database connection
const database = require('./config/database');
const cloudinaryConfig = require('./config/cloudinary');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const agencyRoutes = require('./routes/agencies');
const promotionRoutes = require('./routes/promotions');
const influencerRoutes = require('./routes/influencers');
const discountQrRoutes = require('./routes/discountQr');
const analyzeProfileRoutes = require('./routes/analyzeProfile');
const brandRoutes = require('./routes/brands');
const kycWhatsappRoutes = require('./routes/kycWhatsapp');
const loyaltyRoutes = require('./routes/loyalty');
const geoToolsRoutes = require('./routes/geoTools');

// ===== CONFIGURACIÓN =====
const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Detrás de Nginx: confiar en X-Forwarded-For para que express-rate-limit no lance ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set('trust proxy', 1);

// ===== MIDDLEWARE DE SEGURIDAD =====

// Helmet para seguridad HTTP
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir imágenes desde cualquier origen
    contentSecurityPolicy: false // Deshabilitar CSP para desarrollo (ajustar en producción)
}));

// CORS configuration - Configurado para app móvil y frontend
const allowedOrigins = [
    FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'https://damecodigo.com',
    'https://www.damecodigo.com',
    'http://damecodigo.com',
    'http://www.damecodigo.com',
    'https://link4deal.com',
    'https://www.link4deal.com',
    'http://link4deal.com',
    'http://www.link4deal.com',
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin (app móvil, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Permitir si está en la lista de orígenes permitidos
        if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.warn(`⚠️ Origen no permitido: ${origin}`);
            callback(null, true); // En desarrollo permitir todos, en producción ser más estricto
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-API-Key',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

// Rate limiting - Diferentes límites para diferentes endpoints
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Límite más estricto para operaciones sensibles
    message: {
        success: false,
        message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.'
    }
});

// Aplicar rate limiting general a todas las rutas API
app.use('/api/', generalLimiter);

// ===== MIDDLEWARE DE COMPRESIÓN Y PARSING =====

// Compression middleware
app.use(compression());

// Body parsing middleware - Aumentado para soportar imágenes grandes desde móvil
app.use(express.json({ 
    limit: '50mb', // Aumentado para imágenes desde móvil
    extended: true 
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '50mb',
    parameterLimit: 10000
}));

// ===== LOGGING =====

// Morgan logging - Formato diferente para desarrollo y producción
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Logging personalizado para requests importantes
app.use((req, res, next) => {
    // Log solo para operaciones importantes
    if (req.method !== 'GET' || req.path.includes('/api/')) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    }
    next();
});

// ===== ARCHIVOS ESTÁTICOS =====

// Servir archivos de uploads (misma ruta que middleware/upload.js)
const { getUploadDir, getPromotionUploadDir } = require('./middleware/upload');
const uploadsPath = path.resolve(getUploadDir());
const fsSync = require('fs');
if (!fsSync.existsSync(uploadsPath)) {
    fsSync.mkdirSync(uploadsPath, { recursive: true });
}
const promotionsPath = path.resolve(getPromotionUploadDir());
if (!fsSync.existsSync(promotionsPath)) {
    fsSync.mkdirSync(promotionsPath, { recursive: true });
}
// Imágenes antiguas: antes podían vivir en server/public/uploads/promotions (no bajo getUploadDir).
// Registrar ANTES del static general para que express.static intente aquí y luego siga al siguiente.
const legacyPromotionsDir = path.join(__dirname, 'public/uploads/promotions');
if (fsSync.existsSync(legacyPromotionsDir)) {
    app.use('/uploads/promotions', express.static(legacyPromotionsDir));
}
app.use('/uploads', express.static(uploadsPath));

// Servir archivos públicos (/public/...) y alias /assets (APK y estáticos en public/assets/)
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// ===== HEALTH CHECK Y INFO =====

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbStatus = database.getConnectionStatus();
        const cloudinaryStatus = (cloudinaryConfig.isReady && typeof cloudinaryConfig.isReady === 'function' && cloudinaryConfig.isReady()) || cloudinaryConfig.isConfigured || false;
        
        res.status(200).json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: NODE_ENV,
            mongodbUriConfigured: Boolean(process.env.MONGODB_URI_ATLAS && String(process.env.MONGODB_URI_ATLAS).trim()),
            version: '1.0.0',
            services: {
                database: {
                    connected: dbStatus.isConnected,
                    state: dbStatus.connectionState,
                    mongooseReadyState: dbStatus.connectionState,
                    host: dbStatus.host || 'N/A'
                },
                cloudinary: cloudinaryStatus,
                server: {
                    uptime: process.uptime(),
                    memory: {
                        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
                    }
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            error: error.message
        });
    }
});

// API info endpoint
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Link4Deal API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            promotions: '/api/promotions',
            agencies: '/api/agencies',
            discountQr: '/api/discount-qr',
            kycWhatsapp: '/api/kyc/whatsapp',
            loyalty: '/api/loyalty'
        },
        documentation: 'https://github.com/link4deal/api-docs', // Actualizar con tu doc
        support: 'support@link4deal.com'
    });
});

// ===== RUTAS DE LA API =====

// OpenAPI spec (para documentación Redoc; acceso público al spec)
const openapiSpec = require('./spec/openapi.json');
app.get('/api/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(openapiSpec);
});

// Auth routes
app.use('/api/auth', strictLimiter, authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Agency routes
app.use('/api/agencies', agencyRoutes);

// Promotion routes - La ruta principal para la app móvil
app.use('/api/promotions', promotionRoutes);

// Influencer routes (listado y detalle; datos compatibles con OCR de perfil)
app.use('/api/influencers', influencerRoutes);

const bidRoutes = require('./routes/bids');
app.use('/api/bids', bidRoutes);

// Discount QR routes (issuer + scanner verifier)
app.use('/api/discount-qr', strictLimiter, discountQrRoutes);
app.use('/api/analyze-profile-image', analyzeProfileRoutes);
app.use('/api/kyc/whatsapp', strictLimiter, kycWhatsappRoutes);
app.use('/api/loyalty', loyaltyRoutes);

app.use('/api/brands', brandRoutes);

const appDownloadsRoutes = require('./routes/appDownloads');
app.use('/api/app-downloads', appDownloadsRoutes);

const bizneShopsRoutes = require('./routes/bizneShops');
app.use('/api/bizne-shops', bizneShopsRoutes);

// Geocodificación masiva (parse de pegado + Nominatim): límite estricto por IP
app.use('/api/geo', strictLimiter, geoToolsRoutes);

// ===== MANEJO DE ERRORES =====

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `The route ${req.method} ${req.originalUrl} does not exist`,
        availableEndpoints: [
            'GET /health',
            'GET /api',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET /api/promotions',
            'POST /api/promotions',
            'GET /api/influencers',
            'GET /api/influencers/:id',
            'POST /api/discount-qr/create',
            'GET /api/discount-qr/create',
            'POST /api/discount-qr/verify',
            'POST /api/discount-qr/redeem',
            'GET /api/discount-qr/redemptions/recent',
            'POST /api/kyc/whatsapp/request-code',
            'POST /api/kyc/whatsapp/verify-code',
            'GET /api/loyalty/coffee',
            'POST /api/loyalty/coffee/transactions',
            'GET /api/bizne-shops',
            'GET /api/bizne-shops/:id'
        ],
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Error global:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
    
    // Determinar código de estado
    let statusCode = err.status || err.statusCode || 500;
    let message = err.message || 'Internal server error';
    
    // Manejar errores específicos de Mongoose
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    } else if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate entry';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    
    // Respuesta de error
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(NODE_ENV === 'development' && {
            stack: err.stack,
            details: err
        }),
        timestamp: new Date().toISOString(),
        path: req.path
    });
});

// ===== INICIALIZACIÓN DEL SERVIDOR =====

async function startServer() {
    try {
        console.log('🚀 Iniciando Link4Deal API Server...');
        console.log(`📊 Environment: ${NODE_ENV}`);
        console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
        
        // Conectar a MongoDB
        console.log('🗄️ Conectando a MongoDB...');
        await database.connect();
        
        const dbStatus = database.getConnectionStatus();
        if (dbStatus.isConnected) {
            console.log('✅ MongoDB conectado');
            // Limpiar promociones simuladas en memoria ahora que MongoDB está conectado
            if (global.simulatedPromotions) {
                console.log('🧹 Limpiando promociones simuladas de memoria...');
                global.simulatedPromotions = [];
            }
        } else {
            console.log('⚠️ MongoDB en modo simulado');
        }

        if (NODE_ENV === 'production') {
            const hasUri = Boolean(process.env.MONGODB_URI_ATLAS && String(process.env.MONGODB_URI_ATLAS).trim());
            if (!dbStatus.isConnected) {
                console.error(
                    '🚨 PRODUCCIÓN: MongoDB no conectado. Crear promociones devolverá 503 (simulado desactivado en prod). ' +
                        (hasUri
                            ? 'Revisa Network Access en Atlas, usuario/clave y logs arriba.'
                            : 'Falta MONGODB_URI_ATLAS en el entorno del proceso (confirma server/.env o .env en la raíz y cwd de PM2).')
                );
            }
        }
        
        // Cloudinary (necesario para isConfigured = true en uploadAvatar, promociones, etc.)
        console.log('☁️ Configurando Cloudinary...');
        const cloudinaryReady = cloudinaryConfig.configure();
        if (cloudinaryReady) {
            console.log('☁️ Cloudinary listo para uploads');
        } else {
            console.log('⚠️ Cloudinary no configurado — imágenes usarán almacenamiento local (/uploads/...) donde aplique');
        }
        
        // Iniciar servidor
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log('\n✅ Servidor iniciado exitosamente');
            console.log(`🌐 Server running on: http://localhost:${PORT}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
            console.log(`📱 API Base URL: http://localhost:${PORT}/api`);
            console.log(`📅 Started at: ${new Date().toLocaleString()}`);
            console.log('─'.repeat(50));
        });
        
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            console.log(`\n${signal} recibido. Cerrando servidor gracefully...`);
            
            server.close(async () => {
                console.log('✅ Servidor HTTP cerrado');
                
                // Cerrar conexión a MongoDB
                try {
                    await database.closeConnection();
                    console.log('✅ Conexión a MongoDB cerrada');
                } catch (error) {
                    console.error('❌ Error cerrando MongoDB:', error);
                }
                
                console.log('👋 Servidor cerrado exitosamente');
                process.exit(0);
            });
            
            // Forzar cierre después de 10 segundos
            setTimeout(() => {
                console.error('⚠️ Forzando cierre del servidor...');
                process.exit(1);
            }, 10000);
        };
        
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
        // Manejo de errores no capturados
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });
        
        // No apagar el proceso por promesas rechazadas sin catch: librerías / OCR / axios
        // a veces las dejan escapar y reiniciar Node desconecta a todos los clientes de Mongo.
        process.on('unhandledRejection', (reason) => {
            console.error('❌ Unhandled Rejection (servidor sigue en marcha):', reason);
            if (reason instanceof Error) {
                console.error(reason.stack);
            }
        });
        
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

// ===== INICIAR SERVIDOR =====

// Solo iniciar si se ejecuta directamente (no cuando se importa)
if (require.main === module) {
    startServer();
}

module.exports = app;
