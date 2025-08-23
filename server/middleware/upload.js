const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuración de almacenamiento en memoria para procesamiento OCR
const memoryStorage = multer.memoryStorage();

// Configuración de almacenamiento en disco para respaldo local
const diskStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const uploadDir = process.env.UPLOAD_PATH || './public/uploads';
            
            // Crear directorio si no existe
            await fs.mkdir(uploadDir, { recursive: true });
            
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        // Generar nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const filename = `promotion-${uniqueSuffix}${extension}`;
        
        cb(null, filename);
    }
});

// Función para validar tipos de archivo
const fileFilter = (req, file, cb) => {
    // Tipos de imagen permitidos
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp',
        'image/gif'
    ];

    // Verificar tipo MIME
    if (!allowedMimeTypes.includes(file.mimetype)) {
        const error = new Error('Tipo de archivo no permitido');
        error.code = 'INVALID_FILE_TYPE';
        return cb(error, false);
    }

    // Verificar extensión del archivo
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
        const error = new Error('Extensión de archivo no permitida');
        error.code = 'INVALID_FILE_EXTENSION';
        return cb(error, false);
    }

    // Verificar tamaño del archivo
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB por defecto
    
    if (file.size > maxSize) {
        const error = new Error(`El archivo excede el tamaño máximo de ${maxSize / (1024 * 1024)}MB`);
        error.code = 'FILE_TOO_LARGE';
        return cb(error, false);
    }

    // Archivo válido
    cb(null, true);
};

// Configuración de Multer para almacenamiento en memoria (para OCR)
const memoryUpload = multer({
    storage: memoryStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        files: 5 // máximo 5 archivos
    }
});

// Configuración de Multer para almacenamiento en disco (para respaldo local)
const diskUpload = multer({
    storage: diskStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        files: 5 // máximo 5 archivos
    }
});

// Middleware principal que combina ambos almacenamientos
const upload = (req, res, next) => {
    // Usar almacenamiento en memoria para procesamiento OCR
    memoryUpload.array('images', 5)(req, res, async (err) => {
        if (err) {
            return handleUploadError(err, res);
        }

        try {
            // Si hay archivos, también guardarlos en disco como respaldo
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    // Crear una copia del archivo para almacenamiento en disco
                    const diskFile = {
                        ...file,
                        path: path.join(
                            process.env.UPLOAD_PATH || './public/uploads',
                            `backup-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`
                        )
                    };

                    // Guardar en disco
                    await fs.writeFile(diskFile.path, file.buffer);
                    
                    // Agregar información del archivo en disco
                    file.localBackupPath = diskFile.path;
                }
            }

            next();
        } catch (error) {
            console.error('❌ Error guardando respaldo en disco:', error);
            // Continuar aunque falle el respaldo en disco
            next();
        }
    });
};

// Función para manejar errores de upload
const handleUploadError = (error, res) => {
    console.error('❌ Error en upload:', error);

    let statusCode = 400;
    let message = 'Error en la subida del archivo';

    switch (error.code) {
        case 'LIMIT_FILE_SIZE':
            statusCode = 413;
            message = 'El archivo es demasiado grande';
            break;
        case 'LIMIT_FILE_COUNT':
            statusCode = 413;
            message = 'Demasiados archivos';
            break;
        case 'LIMIT_UNEXPECTED_FILE':
            statusCode = 400;
            message = 'Campo de archivo inesperado';
            break;
        case 'INVALID_FILE_TYPE':
            statusCode = 400;
            message = 'Tipo de archivo no permitido';
            break;
        case 'INVALID_FILE_EXTENSION':
            statusCode = 400;
            message = 'Extensión de archivo no permitida';
            break;
        case 'FILE_TOO_LARGE':
            statusCode = 413;
            message = error.message;
            break;
        default:
            statusCode = 500;
            message = 'Error interno del servidor';
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        error: error.message
    });
};

// Middleware para validar archivos antes del upload
const validateFiles = (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Se requiere al menos una imagen'
        });
    }

    // Validar que todos los archivos sean imágenes
    const invalidFiles = req.files.filter(file => 
        !file.mimetype.startsWith('image/')
    );

    if (invalidFiles.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Todos los archivos deben ser imágenes',
            invalidFiles: invalidFiles.map(f => f.originalname)
        });
    }

    // Validar número máximo de archivos
    const maxFiles = 5;
    if (req.files.length > maxFiles) {
        return res.status(400).json({
            success: false,
            message: `Máximo ${maxFiles} archivos permitidos`
        });
    }

    next();
};

// Middleware para limpiar archivos temporales
const cleanupTempFiles = async (req, res, next) => {
    try {
        // Limpiar archivos de respaldo local después de procesar
        if (req.files) {
            for (const file of req.files) {
                if (file.localBackupPath) {
                    try {
                        await fs.unlink(file.localBackupPath);
                        delete file.localBackupPath;
                    } catch (error) {
                        console.warn(`⚠️ Error eliminando archivo temporal: ${error.message}`);
                    }
                }
            }
        }
        next();
    } catch (error) {
        console.error('❌ Error limpiando archivos temporales:', error);
        next();
    }
};

// Middleware para optimizar imágenes antes del OCR
const optimizeImages = async (req, res, next) => {
    try {
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                // Aquí se podría implementar optimización de imagen
                // Por ejemplo, redimensionar, comprimir, etc.
                
                // Por ahora, solo agregar metadatos de optimización
                file.optimized = true;
                file.optimizationDate = new Date();
            }
        }
        next();
    } catch (error) {
        console.error('❌ Error optimizando imágenes:', error);
        next();
    }
};

// Exportar middlewares
module.exports = {
    upload,
    memoryUpload,
    diskUpload,
    validateFiles,
    cleanupTempFiles,
    optimizeImages,
    fileFilter
};
