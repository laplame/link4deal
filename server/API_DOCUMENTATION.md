# Link4Deal API - Documentación

## 🚀 Servidor API Funcional

Este servidor está diseñado para ser una API RESTful completa y funcional, lista para:
- ✅ Frontend web (React)
- ✅ App móvil (iOS/Android)
- ✅ Integraciones externas
- ✅ Producción

## 📋 Características Principales

### 🔒 Seguridad
- **Helmet**: Protección HTTP headers
- **CORS**: Configurado para app móvil y múltiples orígenes
- **Rate Limiting**: Protección contra abuso
- **Validación de archivos**: Para uploads seguros

### 📱 Soporte para App Móvil
- **CORS flexible**: Permite requests desde apps móviles
- **Upload de imágenes**: Soporta hasta 50MB para imágenes desde móvil
- **Múltiples formatos**: JPEG, PNG, WebP, GIF
- **Procesamiento OCR**: Automático para promociones

### 🗄️ Base de Datos
- **MongoDB Atlas**: Conexión a base de datos en la nube
- **Modo simulado**: Funciona sin BD para desarrollo
- **Reconexión automática**: Manejo robusto de conexiones

### ☁️ Almacenamiento
- **Cloudinary**: Almacenamiento de imágenes en la nube
- **Respaldo local**: Copias de seguridad automáticas
- **Optimización**: Compresión y transformación de imágenes

## 🔌 Endpoints Principales

### Health Check
```
GET /health
```
Verifica el estado del servidor y servicios.

**Respuesta:**
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "database": { "connected": true },
    "cloudinary": true
  }
}
```

### Información de la API
```
GET /api
```
Información general sobre la API y endpoints disponibles.

### Promociones

#### Listar Promociones
```
GET /api/promotions
```

**Query Parameters:**
- `page`: Número de página (default: 1)
- `limit`: Resultados por página (default: 10)
- `category`: Filtrar por categoría
- `status`: Filtrar por estado (active, draft, expired)
- `isHotOffer`: Solo ofertas calientes (true/false)
- `search`: Búsqueda por texto

**Ejemplo:**
```
GET /api/promotions?page=1&limit=20&category=electronics&status=active
```

#### Obtener Promoción por ID
```
GET /api/promotions/:id
```

#### Crear Promoción (desde app móvil)
```
POST /api/promotions
Content-Type: multipart/form-data
```

**Body (form-data):**
- `title`: Título de la promoción
- `description`: Descripción
- `productName`: Nombre del producto
- `brand`: Marca
- `category`: Categoría (electronics, fashion, etc.)
- `originalPrice`: Precio original
- `currentPrice`: Precio con descuento
- `currency`: Moneda (MXN, USD, EUR)
- `storeName`: Nombre de la tienda
- `storeAddress`: Dirección
- `storeCity`: Ciudad
- `storeState`: Estado
- `images`: Archivos de imagen (máximo 5, hasta 50MB cada uno)
- `tags`: Tags separados por comas
- `isHotOffer`: true/false
- `validFrom`: Fecha de inicio (ISO format)
- `validUntil`: Fecha de expiración (ISO format)

**Ejemplo desde app móvil:**
```javascript
const formData = new FormData();
formData.append('title', 'Nueva Promoción');
formData.append('productName', 'Producto XYZ');
formData.append('originalPrice', '1000');
formData.append('currentPrice', '800');
formData.append('category', 'electronics');
formData.append('images', fileBlob, 'image.jpg');

fetch('https://api.link4deal.com/api/promotions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});
```

#### Actualizar Promoción
```
PUT /api/promotions/:id
Content-Type: multipart/form-data
```

#### Eliminar Promoción
```
DELETE /api/promotions/:id
```

#### Buscar Promociones
```
GET /api/promotions/search?q=term
```

#### Ofertas Calientes
```
GET /api/promotions/hot
```

#### Promociones por Categoría
```
GET /api/promotions/category/:category
```

#### Estadísticas
```
GET /api/promotions/stats/overview
```

## 📱 Uso desde App Móvil

### Configuración CORS
El servidor está configurado para aceptar requests desde apps móviles. Los orígenes permitidos incluyen:
- Capacitor apps
- Ionic apps
- React Native apps
- Requests sin origin (nativos)

### Subida de Imágenes
El servidor soporta:
- **Múltiples imágenes**: Hasta 5 imágenes por promoción
- **Tamaño máximo**: 50MB por archivo
- **Formatos**: JPEG, PNG, WebP, GIF
- **Procesamiento OCR**: Automático en la primera imagen

### Ejemplo Completo (React Native / Capacitor)

```javascript
import * as ImagePicker from 'expo-image-picker';

// 1. Seleccionar imagen
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  quality: 0.8,
});

// 2. Crear FormData
const formData = new FormData();
formData.append('title', 'Mi Promoción');
formData.append('productName', 'Producto');
formData.append('originalPrice', '1000');
formData.append('currentPrice', '800');
formData.append('category', 'electronics');
formData.append('currency', 'MXN');

// Agregar imagen
formData.append('images', {
  uri: result.uri,
  type: 'image/jpeg',
  name: 'promotion.jpg',
});

// 3. Enviar a la API
const response = await fetch('http://tu-servidor.com/api/promotions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data',
  },
  body: formData,
});

const data = await response.json();
console.log('Promoción creada:', data);
```

## 🔐 Autenticación

Actualmente el middleware de autenticación está en modo placeholder. Para producción, implementa:

1. Verificación de JWT tokens
2. Validación de roles y permisos
3. Rate limiting por usuario
4. Logging de actividades

## ⚙️ Variables de Entorno

```env
# Servidor
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://link4deal.com

# MongoDB
MONGODB_URI_ATLAS=mongodb+srv://user:pass@cluster.mongodb.net/link4deal

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=link4deal/promotions

# Uploads
MAX_FILE_SIZE=52428800  # 50MB
UPLOAD_PATH=./uploads
```

## 🚀 Despliegue

### Desarrollo
```bash
cd server
npm run dev
```

### Producción
```bash
cd server
npm start
```

O con PM2:
```bash
pm2 start ecosystem.config.js
```

## 📊 Monitoreo

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs
Los logs incluyen:
- Requests HTTP (método, ruta, IP)
- Errores detallados
- Estado de servicios
- Tiempo de respuesta

## 🔄 Flujo de Subida desde App Móvil

1. **Usuario selecciona imagen** en la app móvil
2. **App crea FormData** con datos de la promoción
3. **POST a /api/promotions** con imagen y datos
4. **Servidor recibe y valida** archivo
5. **Procesamiento OCR** (opcional, en primera imagen)
6. **Upload a Cloudinary** para almacenamiento
7. **Respaldo local** del archivo
8. **Guardar en MongoDB** con referencias a Cloudinary
9. **Respuesta con ID** de la promoción creada

## 🛠️ Mejoras Futuras

- [ ] WebSockets para notificaciones en tiempo real
- [ ] Cache con Redis
- [ ] CDN para assets estáticos
- [ ] Compresión de imágenes automática
- [ ] Thumbnails generados automáticamente
- [ ] API versioning (/api/v1/, /api/v2/)
- [ ] Documentación Swagger/OpenAPI
- [ ] Tests automatizados

---

**Versión:** 1.0.0  
**Última actualización:** 2024

