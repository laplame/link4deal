const mongoose = require('mongoose');
require('dotenv').config();

class Database {
    constructor() {
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxRetries = 3;
    }

    async connect() {
        try {
            console.log('🔄 Configurando conexión a MongoDB...');
            
                    // Por ahora, solo configurar para Atlas
        if (process.env.URI_mongo) {
            console.log('🔄 Intentando conectar a MongoDB Atlas...');
            await this.connectToAtlas();
        } else {
            console.log('⚠️ URI_mongo no configurado - usando modo simulado');
            this.isConnected = true; // Simular conexión exitosa
            console.log('✅ Modo simulado activado - MongoDB Atlas configurado posteriormente');
        }
            
        } catch (error) {
            console.error('❌ Error conectando a MongoDB Atlas:', error.message);
            console.log('⚠️ Usando modo simulado por defecto');
            this.isConnected = true; // Simular conexión exitosa
        }
    }

    // TODO: Implementar conexión local cuando MongoDB esté disponible
    async connectToLocal() {
        console.log('⚠️ Conexión local deshabilitada temporalmente');
        console.log('📝 Para habilitar: instalar MongoDB localmente o usar Docker');
        throw new Error('Conexión local no disponible - usar MongoDB Atlas');
    }

    async connectToAtlas() {
        const atlasUri = process.env.URI_mongo;
        
        if (!atlasUri) {
            throw new Error('URI_mongo no está configurado en las variables de entorno');
        }

        const options = {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
            maxPoolSize: 10,
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
            retryWrites: true,
            w: 'majority'
        };

        await mongoose.connect(atlasUri, options);
        
        this.isConnected = true;
        console.log('✅ Conectado a MongoDB Atlas');
        
        // Configurar eventos de conexión
        this.setupConnectionEvents();
    }

    setupConnectionEvents() {
        mongoose.connection.on('connected', () => {
            console.log('🔗 Mongoose conectado a MongoDB');
            this.isConnected = true;
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ Error de conexión Mongoose:', err);
            this.isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('🔌 Mongoose desconectado de MongoDB');
            this.isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 Mongoose reconectado a MongoDB');
            this.isConnected = true;
        });

        // Manejar señales de terminación
        process.on('SIGINT', async () => {
            await this.closeConnection();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            await this.closeConnection();
            process.exit(0);
        });
    }

    async closeConnection() {
        if (this.isConnected) {
            try {
                await mongoose.connection.close();
                console.log('🔌 Conexión a MongoDB cerrada');
                this.isConnected = false;
            } catch (error) {
                console.error('❌ Error cerrando conexión:', error);
            }
        }
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            connectionState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name
        };
    }

    async healthCheck() {
        try {
            if (!this.isConnected) {
                return { status: 'disconnected', message: 'No hay conexión activa' };
            }

            // Ejecutar ping simple
            await mongoose.connection.db.admin().ping();
            
            return { 
                status: 'healthy', 
                message: 'Conexión activa y funcionando',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return { 
                status: 'unhealthy', 
                message: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Crear instancia singleton
const database = new Database();

module.exports = database;
