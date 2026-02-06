# 🔍 Debug de Conexión MongoDB Atlas

## Problema Detectado

El servidor está intentando conectar a MongoDB Atlas pero falla con:
```
bad auth : authentication failed
```

## Estado Actual

- ✅ Variable `MONGODB_URI_ATLAS` está configurada en `server/.env`
- ✅ La URI se está corrigiendo automáticamente (de `?link4deal=Cluster0` a `/link4deal?retryWrites=true&w=majority`)
- ❌ La autenticación está fallando

## Posibles Causas

### 1. Contraseña con Caracteres Especiales

Tu contraseña tiene `<rhino123>` que incluye los caracteres `<` y `>`. Estos necesitan ser codificados en la URI:

- `<` debe ser `%3C`
- `>` debe ser `%3E`

**Solución:**
```env
# En lugar de:
MONGODB_URI_ATLAS=mongodb+srv://shate:<rhino123>@cluster0.rhg07.mongodb.net/?link4deal=Cluster0

# Usa:
MONGODB_URI_ATLAS=mongodb+srv://shate:%3Crhino123%3E@cluster0.rhg07.mongodb.net/?link4deal=Cluster0
```

O mejor aún, si puedes cambiar la contraseña en MongoDB Atlas a una sin caracteres especiales.

### 2. Usuario o Contraseña Incorrectos

Verifica en MongoDB Atlas:
1. Ve a "Database Access" en el panel de MongoDB Atlas
2. Confirma que el usuario `shate` existe
3. Verifica que la contraseña sea correcta

### 3. Network Access (Whitelist)

Tu IP puede no estar en la lista blanca:
1. Ve a "Network Access" en MongoDB Atlas
2. Agrega tu IP actual o usa "Allow Access from Anywhere" (0.0.0.0/0) para desarrollo

### 4. Permisos del Usuario

El usuario debe tener permisos de lectura/escritura:
1. En "Database Access", verifica que el usuario tenga rol "Atlas admin" o al menos "readWrite"

## Cómo Probar la Conexión

### Opción 1: Usando MongoDB Compass

1. Descarga MongoDB Compass
2. Usa la URI corregida:
   ```
   mongodb+srv://shate:<rhino123>@cluster0.rhg07.mongodb.net/link4deal?retryWrites=true&w=majority
   ```
3. Si funciona en Compass pero no en el servidor, el problema es de codificación de caracteres

### Opción 2: Probar con Node.js

```bash
cd server
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

let uri = process.env.MONGODB_URI_ATLAS;
uri = uri.replace('?link4deal=', '/link4deal?');
uri = uri.replace(/\/\/[^:]+:[^@]+@/, '//shate:TU_PASSWORD_AQUI@');

mongoose.connect(uri, {serverSelectionTimeoutMS: 5000})
  .then(() => console.log('✅ Conectado!'))
  .catch(err => console.error('❌ Error:', err.message));
"
```

## Solución Recomendada

1. **Cambiar la contraseña en MongoDB Atlas** a una sin caracteres especiales (ej: `rhino123` sin los `< >`)

2. **O codificar la contraseña en el .env:**
   ```env
   MONGODB_URI_ATLAS=mongodb+srv://shate:%3Crhino123%3E@cluster0.rhg07.mongodb.net/?link4deal=Cluster0
   ```

3. **Verificar Network Access** en MongoDB Atlas

4. **Reiniciar el servidor** después de cambiar el .env

## Verificar que Funciona

Después de corregir, verifica:

```bash
# 1. Verificar health check
curl http://localhost:3000/health | grep -A 5 database

# 2. Debería mostrar:
# "connected": true,
# "state": 1,  # <- Esto debe ser 1 (connected), no 0

# 3. Probar obtener promociones
curl http://localhost:3000/api/promotions
```

## Nota sobre Modo Simulado

Actualmente el servidor está en "modo simulado" porque la conexión falla. Esto significa:
- ✅ El servidor funciona
- ✅ Las promociones se guardan en memoria (se pierden al reiniciar)
- ❌ No hay persistencia real en MongoDB

Para tener persistencia real, necesitas corregir la conexión a MongoDB Atlas.

