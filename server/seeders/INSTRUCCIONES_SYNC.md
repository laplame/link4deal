# Instrucciones para Sincronizar Promociones con MongoDB Atlas

## ⚠️ Error de Autenticación

Si estás viendo el error `bad auth : authentication failed`, verifica lo siguiente:

### 1. Verificar Credenciales en MongoDB Atlas

1. Ve a [MongoDB Atlas](https://cloud.mongodb.com/)
2. Selecciona tu cluster
3. Ve a **Database Access** → Verifica que tu usuario tenga permisos
4. Ve a **Network Access** → Asegúrate de que tu IP esté en la whitelist (o usa `0.0.0.0/0` para desarrollo)

### 2. Formato Correcto de la URI

La URI debe tener este formato:

```
mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/link4deal?retryWrites=true&w=majority
```

**Importante:**
- Reemplaza `usuario` y `password` con tus credenciales reales
- Reemplaza `cluster0.xxxxx.mongodb.net` con tu cluster real
- El nombre de la base de datos es `link4deal` (después del último `/`)

### 3. Verificar el archivo .env

Asegúrate de que en `server/.env` tengas:

```env
MONGODB_URI_ATLAS=mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/link4deal?retryWrites=true&w=majority
```

**Sin espacios** antes o después del `=`

### 4. Caracteres Especiales en la Contraseña

Si tu contraseña tiene caracteres especiales, debes codificarlos en URL:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`

Ejemplo:
```
Password: P@ssw0rd#123
URI: mongodb+srv://user:P%40ssw0rd%23123@cluster...
```

### 5. Ejecutar el Seeder

Una vez que la URI esté correcta:

```bash
cd server
node seeders/promotionsSeeder.js
```

O usando npm:

```bash
cd server
npm run seed:promotions
```

## ✅ Resultado Esperado

Si todo está correcto, deberías ver:

```
🔄 Conectando a MongoDB...
✅ Conectado a MongoDB
🌱 Iniciando seed de promociones...
📝 Creando 4 promociones...
✅ Promociones creadas exitosamente:
   1. Lanzamiento Nueva Colección Primavera 2024 (ID: ...)
   2. Review Producto Tecnológico Galaxy S24 (ID: ...)
   3. Campaña Fitness & Wellness (ID: ...)
   4. Beauty Box Premium (ID: ...)

🎉 Seed completado: 4 promociones creadas
🔌 Conexión cerrada
```

## 🔍 Verificar Promociones en Atlas

Después de ejecutar el seeder, puedes verificar en MongoDB Atlas:
1. Ve a tu cluster
2. Click en **Browse Collections**
3. Selecciona la base de datos `link4deal`
4. Deberías ver la colección `promotions` con 4 documentos

## 🚀 Siguiente Paso

Una vez que las promociones estén en Atlas, el endpoint `/api/promotions` las devolverá automáticamente cuando el servidor esté conectado a MongoDB.

