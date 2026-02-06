require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    console.log('🔍 Probando conexión a MongoDB Atlas...\n');
    
    let atlasUri = process.env.MONGODB_URI_ATLAS;
    
    if (!atlasUri) {
        console.error('❌ MONGODB_URI_ATLAS no está configurado en .env');
        process.exit(1);
    }
    
    console.log('📋 URI original:', atlasUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    // Limpiar la URI
    atlasUri = atlasUri.trim();
    
    // Codificar la contraseña si tiene caracteres especiales
    const uriMatch = atlasUri.match(/^(mongodb\+srv:\/\/)([^:]+):([^@]+)@(.+)$/);
    if (uriMatch) {
        const protocol = uriMatch[1];
        const user = uriMatch[2];
        let password = uriMatch[3];
        let rest = uriMatch[4];
        
        console.log('👤 Usuario:', user);
        console.log('🔑 Contraseña:', password.length > 0 ? '***' : '(vacía)');
        
        // Si la contraseña tiene caracteres especiales, codificarla
        if (password && !password.startsWith('%')) {
            const originalPassword = password;
            password = encodeURIComponent(password);
            if (originalPassword !== password) {
                console.log('🔧 Contraseña codificada (tenía caracteres especiales)');
            }
        }
        
        // Reconstruir URI
        atlasUri = `${protocol}${user}:${password}@${rest}`;
    }
    
    // Corregir formato si tiene parámetros incorrectos como ?link4deal=Cluster0
    if (atlasUri.includes('?link4deal=') || atlasUri.match(/\?[^=]*=Cluster0/)) {
        const baseUri = atlasUri.split('?')[0];
        const cleanBase = baseUri.replace(/\/+$/, '');
        atlasUri = `${cleanBase}/link4deal?retryWrites=true&w=majority`;
        console.log('🔧 URI corregida automáticamente');
    } else {
        // Asegurar que tenga el nombre de la base de datos si no lo tiene
        if (!atlasUri.match(/\/[^\/\?]+(\?|$)/)) {
            const separator = atlasUri.includes('?') ? '' : '/';
            atlasUri = atlasUri.replace(/(\?|$)/, `${separator}link4deal$1`);
        }
    }
    
    // Remover dobles slashes
    atlasUri = atlasUri.replace(/([^:]\/)\/+/g, '$1');
    
    console.log('🔗 URI final:', atlasUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    console.log('');
    
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
    
    try {
        console.log('⏳ Intentando conectar...');
        await mongoose.connect(atlasUri, options);
        
        if (mongoose.connection.readyState === 1) {
            console.log('✅ ¡Conexión exitosa!');
            console.log(`📊 Base de datos: ${mongoose.connection.name}`);
            console.log(`🌐 Host: ${mongoose.connection.host}`);
            console.log(`🔌 Estado: ${mongoose.connection.readyState} (1 = connected)`);
            
            // Hacer un ping para verificar
            await mongoose.connection.db.admin().ping();
            console.log('🏓 Ping exitoso - la conexión está funcionando correctamente');
            
            // Listar colecciones
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log(`\n📚 Colecciones encontradas (${collections.length}):`);
            collections.forEach(col => {
                console.log(`   - ${col.name}`);
            });
            
            await mongoose.connection.close();
            console.log('\n✅ Prueba completada exitosamente');
            process.exit(0);
        } else {
            throw new Error('Conexión establecida pero estado no es "connected"');
        }
    } catch (error) {
        console.error('\n❌ Error de conexión:');
        console.error('   Tipo:', error.name);
        console.error('   Mensaje:', error.message);
        
        if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
            console.error('\n🔐 ERROR DE AUTENTICACIÓN:');
            console.error('   Posibles causas:');
            console.error('   1. Usuario o contraseña incorrectos');
            console.error('   2. Contraseña con caracteres especiales no codificados');
            console.error('   3. Usuario no tiene permisos en el cluster');
            console.error('   4. IP no está en la whitelist de MongoDB Atlas');
            console.error('\n💡 Soluciones:');
            console.error('   - Verifica las credenciales en MongoDB Atlas');
            console.error('   - Agrega tu IP a Network Access en MongoDB Atlas');
            console.error('   - O usa "Allow Access from Anywhere" temporalmente para pruebas');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.error('\n🌐 ERROR DE RED:');
            console.error('   No se pudo resolver el hostname del cluster');
            console.error('   Verifica tu conexión a internet');
        } else if (error.message.includes('timeout')) {
            console.error('\n⏱️ ERROR DE TIMEOUT:');
            console.error('   La conexión tardó demasiado');
            console.error('   Verifica tu conexión a internet y la configuración de red');
        }
        
        process.exit(1);
    }
}

testConnection();
