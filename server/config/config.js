require('dotenv').config();

module.exports = {
    // Server Configuration
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // MongoDB Configuration
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/link4deal',
    
    // JWT Configuration
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    jwtExpire: process.env.JWT_EXPIRE || '30d',
    
    // Cloudinary Configuration
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET
    },
    
    // Email Configuration
    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    
    // Blockchain Configuration
    blockchain: {
        ethereum: process.env.ETHEREUM_RPC_URL,
        polygon: process.env.POLYGON_RPC_URL,
        bsc: process.env.BSC_RPC_URL
    },
    
    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    },
    
    // File Upload
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
        allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp']
    },
    
    // Security
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'fallback-session-secret'
};
