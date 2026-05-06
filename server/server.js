const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { envPath } = require('./config/envPath');
require('dotenv').config({ path: envPath });

// Importar configuraciones
const database = require('./config/database');
const cloudinaryConfig = require('./config/cloudinary');

// Importar rutas
const promotionsRoutes = require('./routes/promotions');

// Crear aplicación Express
const app = express();

// Configuración del puerto
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ===== MIDDLEWARE BÁSICO =====

// CORS
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requests
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// ===== SERVIR ARCHIVOS ESTÁTICOS =====

// Servir uploads desde la misma carpeta donde se guardan (getUploadDir del middleware)
const { getUploadDir, getPromotionUploadDir } = require('./middleware/upload');
const uploadsPath = path.resolve(getUploadDir());
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
// Carpeta única para imágenes de promociones
const promotionsUploadPath = path.resolve(getPromotionUploadDir());
if (!fs.existsSync(promotionsUploadPath)) {
    fs.mkdirSync(promotionsUploadPath, { recursive: true });
}
const legacyPromotionsDir = path.join(__dirname, 'public/uploads/promotions');
if (fs.existsSync(legacyPromotionsDir)) {
    app.use('/uploads/promotions', express.static(legacyPromotionsDir));
}
app.use('/uploads', express.static(uploadsPath));
console.log('📁 Serviendo uploads desde:', uploadsPath);

// Servir archivos del frontend (para desarrollo)
if (process.env.NODE_ENV === 'development') {
    app.use(express.static(path.join(__dirname, '../dist')));
}

// ===== RUTAS DE LA API =====

// Health check general
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// API de promociones
app.use('/api/promotions', promotionsRoutes);

// ===== MANEJO DE ERRORES =====

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Middleware global para manejar errores
app.use((error, req, res, next) => {
    console.error('❌ Error global del servidor:', error);

    // Determinar código de estado
    let statusCode = error.status || 500;
    let message = error.message || 'Error interno del servidor';

    // Manejar errores específicos
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Error de validación';
    } else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'ID inválido';
    } else if (error.code === 11000) {
        statusCode = 409;
        message = 'Conflicto de datos duplicados';
    }

    // Respuesta de error
    res.status(statusCode).json({
        success: false,
        message: message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString()
    });
});

// ===== FUNCIÓN DE INICIALIZACIÓN =====

async function startServer() {
    try {
        console.log('🚀 Iniciando servidor...');
        
        // Conectar a MongoDB
        console.log('🗄️ Conectando a MongoDB...');
        await database.connect();
        
        // Configurar Cloudinary
        console.log('☁️ Configurando Cloudinary...');
        const cloudinaryReady = cloudinaryConfig.configure();
        
        if (!cloudinaryReady) {
            console.warn('⚠️ Cloudinary no está configurado. Algunas funcionalidades pueden no estar disponibles.');
        }
        
        // Iniciar servidor
        const server = app.listen(PORT, () => {
            console.log('✅ Servidor iniciado exitosamente');
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`🔗 Frontend: ${FRONTEND_URL}`);
            console.log(`🗄️ MongoDB: ${database.isConnected ? 'Conectado' : 'Desconectado'}`);
            console.log(`☁️ Cloudinary: ${cloudinaryConfig.isReady() ? 'Configurado' : 'No configurado'}`);
            console.log(`📅 ${new Date().toLocaleString()}`);
        });
        
        // Manejo de señales de terminación
        process.on('SIGINT', async () => {
            console.log('\n🔄 Cerrando servidor...');
            await database.closeConnection();
            server.close(() => {
                console.log('✅ Servidor cerrado exitosamente');
                process.exit(0);
            });
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n🔄 Cerrando servidor...');
            await database.closeConnection();
            server.close(() => {
                console.log('✅ Servidor cerrado exitosamente');
                process.exit(0);
            });
        });
        
        // Manejo de errores no capturados
        process.on('uncaughtException', (error) => {
            console.error('❌ Error no capturado:', error);
            process.exit(1);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Promesa rechazada no manejada:', reason);
            process.exit(1);
        });
        
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

// ===== INICIAR SERVIDOR =====

if (require.main === module) {
    startServer();
}

module.exports = app;
