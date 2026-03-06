const mongoose = require('mongoose');
const { envPath } = require('./envPath');
require('dotenv').config({ path: envPath });

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
            if (process.env.MONGODB_URI_ATLAS) {
            console.log('🔄 Intentando conectar a MongoDB Atlas...');
            await this.connectToAtlas();
        } else {
                console.log('⚠️ MONGODB_URI_ATLAS no configurado - usando modo simulado');
                this.isConnected = false; // No simular conexión exitosa
            console.log('✅ Modo simulado activado - MongoDB Atlas configurado posteriormente');
        }
            
        } catch (error) {
            console.error('❌ Error conectando a MongoDB Atlas:', error.message);
            console.error('📋 Detalles del error:', {
                name: error.name,
                code: error.code,
                message: error.message
            });
            
            // Si es error de autenticación, dar instrucciones específicas
            if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
                console.error('\n🔐 ERROR DE AUTENTICACIÓN:');
                console.error('   - Verifica que el usuario y contraseña sean correctos');
                console.error('   - Si la contraseña tiene caracteres especiales, asegúrate de codificarlos correctamente');
                console.error('   - Verifica que el usuario tenga permisos en MongoDB Atlas');
                console.error('   - Revisa la configuración de Network Access en MongoDB Atlas');
            }
            
            console.log('⚠️ Usando modo simulado por defecto');
            this.isConnected = false; // No marcar como conectado si falló
        }
    }

    // TODO: Implementar conexión local cuando MongoDB esté disponible
    async connectToLocal() {
        console.log('⚠️ Conexión local deshabilitada temporalmente');
        console.log('📝 Para habilitar: instalar MongoDB localmente o usar Docker');
        throw new Error('Conexión local no disponible - usar MongoDB Atlas');
    }

    async connectToAtlas() {
        let atlasUri = process.env.MONGODB_URI_ATLAS;
        
        if (!atlasUri) {
            throw new Error('MONGODB_URI_ATLAS no está configurado en las variables de entorno');
        }

        // Limpiar la URI
        atlasUri = atlasUri.trim();
        
        // Codificar la contraseña si tiene caracteres especiales (ej: < >)
        // Extraer usuario y contraseña para codificarlos correctamente
        const uriMatch = atlasUri.match(/^(mongodb\+srv:\/\/)([^:]+):([^@]+)@(.+)$/);
        if (uriMatch) {
            const protocol = uriMatch[1];
            const user = uriMatch[2];
            let password = uriMatch[3];
            let rest = uriMatch[4];
            
            // Si la contraseña tiene caracteres especiales, codificarla
            // Pero solo si no está ya codificada (no empieza con %)
            if (password && !password.startsWith('%')) {
                // Codificar caracteres especiales comunes
                password = encodeURIComponent(password);
            }
            
            // Reconstruir URI
            atlasUri = `${protocol}${user}:${password}@${rest}`;
        }
        
        // Corregir formato si tiene parámetros incorrectos como ?link4deal=Cluster0
        if (atlasUri.includes('?link4deal=') || atlasUri.match(/\?[^=]*=Cluster0/)) {
            // Extraer la parte base (antes del ?)
            const baseUri = atlasUri.split('?')[0];
            // Remover cualquier doble slash y agregar nombre de base de datos
            const cleanBase = baseUri.replace(/\/+$/, '');
            atlasUri = `${cleanBase}/link4deal?retryWrites=true&w=majority`;
            console.log('🔧 URI corregida automáticamente (formato y codificación)');
        } else {
            // Asegurar que tenga el nombre de la base de datos si no lo tiene
            if (!atlasUri.match(/\/[^\/\?]+(\?|$)/)) {
                const separator = atlasUri.includes('?') ? '' : '/';
                atlasUri = atlasUri.replace(/(\?|$)/, `${separator}link4deal$1`);
            }
        }
        
        // Remover dobles slashes (pero no el doble slash después de ://)
        atlasUri = atlasUri.replace(/([^:]\/)\/+/g, '$1');

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

        console.log('🔗 Conectando a:', atlasUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Ocultar credenciales en log
        
        try {
            await mongoose.connect(atlasUri, options);
            
            // Verificar que realmente esté conectado
            if (mongoose.connection.readyState === 1) {
        this.isConnected = true;
        console.log('✅ Conectado a MongoDB Atlas');
                console.log(`📊 Base de datos: ${mongoose.connection.name}`);
                console.log(`🌐 Host: ${mongoose.connection.host}`);
        
        // Configurar eventos de conexión
        this.setupConnectionEvents();
            } else {
                throw new Error('Conexión establecida pero estado no es "connected"');
            }
        } catch (error) {
            // Si es error de autenticación, dar más detalles
            if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
                console.error('\n🔐 ERROR DE AUTENTICACIÓN DETECTADO:');
                console.error('   La URI se corrigió correctamente, pero las credenciales fallaron.');
                console.error('   Posibles causas:');
                console.error('   1. Usuario o contraseña incorrectos');
                console.error('   2. Contraseña con caracteres especiales no codificados (ej: < > deben ser %3C %3E)');
                console.error('   3. Usuario no tiene permisos en el cluster');
                console.error('   4. IP no está en la whitelist de MongoDB Atlas');
                console.error('\n💡 Soluciones:');
                console.error('   - Verifica las credenciales en MongoDB Atlas');
                console.error('   - Si la contraseña tiene < o >, reemplázalos por %3C y %3E');
                console.error('   - Agrega tu IP a Network Access en MongoDB Atlas');
                console.error('   - O usa "Allow Access from Anywhere" temporalmente para pruebas');
            }
            throw error; // Re-lanzar el error para que se maneje en connect()
        }
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
