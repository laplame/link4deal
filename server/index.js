const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
// Cargar .env desde server/ para que funcione con PM2 (cwd = raíz del proyecto)
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import database connection
const database = require('./config/database');
const cloudinaryConfig = require('./config/cloudinary');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const agencyRoutes = require('./routes/agencies');
const promotionRoutes = require('./routes/promotions');

// ===== CONFIGURACIÓN =====
const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

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
    // Agregar aquí los dominios de tu app móvil cuando los tengas
    // 'capacitor://localhost',
    // 'ionic://localhost',
    // 'http://localhost',
    // 'https://tu-dominio.com'
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
app.use('/uploads', express.static(uploadsPath));

// Servir archivos públicos
app.use('/public', express.static(path.join(__dirname, '../public')));

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
            version: '1.0.0',
            services: {
                database: {
                    connected: dbStatus.isConnected,
                    state: dbStatus.connectionState,
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
            agencies: '/api/agencies'
        },
        documentation: 'https://github.com/link4deal/api-docs', // Actualizar con tu doc
        support: 'support@link4deal.com'
    });
});

// ===== RUTAS DE LA API =====

// Auth routes
app.use('/api/auth', strictLimiter, authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Agency routes
app.use('/api/agencies', agencyRoutes);

// Promotion routes - La ruta principal para la app móvil
app.use('/api/promotions', promotionRoutes);

// Placeholder routes para futuras implementaciones
app.use('/api/influencers', (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Influencer routes coming soon',
        endpoint: '/api/influencers'
    });
});

app.use('/api/brands', (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Brand routes coming soon',
        endpoint: '/api/brands'
    });
});

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
            'POST /api/promotions'
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
        
        // Verificar Cloudinary
        if (cloudinaryConfig.isReady && typeof cloudinaryConfig.isReady === 'function' && cloudinaryConfig.isReady()) {
            console.log('☁️ Cloudinary configurado');
        } else if (cloudinaryConfig.isConfigured) {
            console.log('☁️ Cloudinary configurado');
        } else {
            console.log('⚠️ Cloudinary no configurado - algunas funcionalidades pueden no estar disponibles');
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
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection:', reason);
            console.error('Promise:', promise);
            gracefulShutdown('unhandledRejection');
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
