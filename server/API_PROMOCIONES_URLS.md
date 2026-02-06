# 🔗 URLs de la API de Promociones para App Móvil

## 📍 URL Base

### Desarrollo Local
```
http://localhost:3000/api/promotions
```

### Producción
```
https://tu-dominio.com/api/promotions
```

**Nota:** Reemplaza `tu-dominio.com` con tu dominio real en producción.

---

## 📋 Endpoints Disponibles

### 1. **GET** - Obtener todas las promociones
```
GET /api/promotions
```

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Resultados por página (default: 10)
- `category` (opcional): Filtrar por categoría (electronics, fashion, sports, beauty, home, food, books, other)
- `status` (opcional): Filtrar por estado (active, draft, paused, expired, deleted)
- `isHotOffer` (opcional): Filtrar ofertas calientes (true/false)
- `search` (opcional): Buscar en título, descripción, marca

**Ejemplo:**
```
GET http://localhost:3000/api/promotions?page=1&limit=20&category=electronics&status=active
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "docs": [...],
    "totalDocs": 50,
    "limit": 20,
    "page": 1,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "message": "Promociones obtenidas exitosamente"
}
```

---

### 2. **GET** - Obtener promoción por ID
```
GET /api/promotions/:id
```

**Ejemplo:**
```
GET http://localhost:3000/api/promotions/507f1f77bcf86cd799439011
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "iPhone 15 Pro",
    "description": "...",
    "brand": "Apple",
    "category": "electronics",
    "originalPrice": 24999,
    "currentPrice": 19999,
    "currency": "MXN",
    "discountPercentage": 20,
    "images": [...],
    "status": "active",
    ...
  }
}
```

---

### 3. **GET** - Ofertas calientes
```
GET /api/promotions/hot
```

**Ejemplo:**
```
GET http://localhost:3000/api/promotions/hot
```

**Respuesta:**
```json
{
  "success": true,
  "data": [...],
  "message": "Ofertas calientes obtenidas exitosamente"
}
```

---

### 4. **GET** - Promociones por categoría
```
GET /api/promotions/category/:category
```

**Query Parameters:**
- `page` (opcional): Número de página
- `limit` (opcional): Resultados por página

**Ejemplo:**
```
GET http://localhost:3000/api/promotions/category/electronics?page=1&limit=10
```

---

### 5. **GET** - Buscar promociones
```
GET /api/promotions/search
```

**Query Parameters:**
- `q` (requerido): Término de búsqueda
- `page` (opcional): Número de página
- `limit` (opcional): Resultados por página

**Ejemplo:**
```
GET http://localhost:3000/api/promotions/search?q=iPhone&page=1&limit=10
```

---

### 6. **GET** - Estadísticas
```
GET /api/promotions/stats/overview
```

**Ejemplo:**
```
GET http://localhost:3000/api/promotions/stats/overview
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total": 150,
      "active": 120,
      "hotOffers": 25,
      "totalViews": 50000,
      "totalClicks": 5000,
      "totalConversions": 500
    },
    "categories": [...]
  }
}
```

---

### 7. **GET** - Estado del servicio
```
GET /api/promotions/status
```

**Ejemplo:**
```
GET http://localhost:3000/api/promotions/status
```

---

### 8. **POST** - Crear promoción
```
POST /api/promotions
```

**Content-Type:** `multipart/form-data`

**Campos requeridos:**
- `title` (string): Título de la promoción
- `productName` (string): Nombre del producto
- `category` (string): Categoría (electronics, fashion, sports, beauty, home, food, books, other)
- `originalPrice` (number): Precio original
- `currentPrice` (number): Precio con oferta
- `images` (file[]): Al menos 1 imagen (máximo 5)

**Campos opcionales:**
- `description` (string): Descripción
- `brand` (string): Marca
- `currency` (string): Moneda (MXN, USD, EUR) - default: MXN
- `storeName` (string): Nombre de la tienda
- `storeCity` (string): Ciudad
- `storeState` (string): Estado
- `storeAddress` (string): Dirección
- `validFrom` (date): Fecha de inicio (ISO format)
- `validUntil` (date): Fecha de expiración (ISO format)
- `tags` (string): Tags separados por comas o JSON array
- `features` (string): Features separados por comas o JSON array
- `isHotOffer` (boolean): Es oferta caliente
- `hotness` (string): Nivel de calidez (fire, hot, warm)

**Ejemplo (cURL):**
```bash
curl -X POST http://localhost:3000/api/promotions \
  -F "title=iPhone 15 Pro" \
  -F "productName=iPhone 15 Pro" \
  -F "brand=Apple" \
  -F "category=electronics" \
  -F "originalPrice=24999" \
  -F "currentPrice=19999" \
  -F "currency=MXN" \
  -F "storeCity=Ciudad de México" \
  -F "validFrom=2024-01-01" \
  -F "validUntil=2024-01-31" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

**Ejemplo (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('title', 'iPhone 15 Pro');
formData.append('productName', 'iPhone 15 Pro');
formData.append('brand', 'Apple');
formData.append('category', 'electronics');
formData.append('originalPrice', '24999');
formData.append('currentPrice', '19999');
formData.append('currency', 'MXN');
formData.append('storeCity', 'Ciudad de México');
formData.append('validFrom', '2024-01-01');
formData.append('validUntil', '2024-01-31');

// Agregar imágenes
formData.append('images', imageFile1);
formData.append('images', imageFile2);

fetch('http://localhost:3000/api/promotions', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Promoción creada exitosamente",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "title": "iPhone 15 Pro",
    "productName": "iPhone 15 Pro",
    "images": 2,
    "ocrProcessed": true,
    "status": "active"
  }
}
```

---

### 9. **PUT** - Actualizar promoción
```
PUT /api/promotions/:id
```

**Content-Type:** `multipart/form-data` o `application/json`

**Campos permitidos:**
- `title`, `description`, `productName`, `brand`, `category`
- `originalPrice`, `currentPrice`, `currency`, `discountPercentage`
- `storeName`, `storeLocation`, `isPhysicalStore`
- `tags`, `features`, `specifications`
- `isHotOffer`, `hotness`
- `validFrom`, `validUntil`, `status`

**Ejemplo:**
```
PUT http://localhost:3000/api/promotions/507f1f77bcf86cd799439011
```

---

### 10. **DELETE** - Eliminar promoción
```
DELETE /api/promotions/:id
```

**Ejemplo:**
```
DELETE http://localhost:3000/api/promotions/507f1f77bcf86cd799439011
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Promoción eliminada exitosamente"
}
```

---

## 🔐 Autenticación

**Nota:** Actualmente las rutas POST, PUT, DELETE no requieren autenticación. Se recomienda agregar autenticación en producción.

---

## 📱 Configuración para App Móvil

### Variables de Entorno

```javascript
// Desarrollo
const API_BASE_URL = 'http://localhost:3000/api';

// Producción
const API_BASE_URL = 'https://tu-dominio.com/api';
```

### Ejemplo de Cliente API (React Native / Flutter)

```javascript
// PromocionesService.js
const API_BASE_URL = 'http://localhost:3000/api/promotions';

export const getPromotions = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}?${queryString}`);
  return response.json();
};

export const getPromotionById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/${id}`);
  return response.json();
};

export const createPromotion = async (formData) => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    body: formData
  });
  return response.json();
};

export const updatePromotion = async (id, formData) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: formData
  });
  return response.json();
};

export const deletePromotion = async (id) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE'
  });
  return response.json();
};
```

---

## ⚠️ Rate Limiting

- **Crear promociones:** Máximo 10 por IP cada 15 minutos
- **Búsquedas:** Máximo 30 por IP cada 1 minuto

---

## 🐛 Manejo de Errores

Todas las respuestas siguen este formato:

**Éxito:**
```json
{
  "success": true,
  "data": {...},
  "message": "Operación exitosa"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Mensaje de error",
  "error": "Detalles del error (solo en desarrollo)"
}
```

**Códigos HTTP:**
- `200` - Éxito
- `201` - Creado exitosamente
- `400` - Error de validación
- `404` - No encontrado
- `413` - Archivo demasiado grande
- `500` - Error del servidor
- `503` - Servicio no disponible (MongoDB no conectado)

---

## 📝 Notas Importantes

1. **Imágenes:** Máximo 5 imágenes por promoción, máximo 10MB por imagen
2. **Formatos soportados:** JPEG, PNG, WebP, GIF
3. **OCR:** Se procesa automáticamente la primera imagen para extraer datos
4. **Modo Simulado:** Si MongoDB no está conectado, algunas operaciones funcionan en modo simulado
5. **CORS:** Configurado para permitir requests desde apps móviles

---

## 🔗 URLs Completas de Ejemplo

```
# Desarrollo Local
http://localhost:3000/api/promotions
http://localhost:3000/api/promotions/hot
http://localhost:3000/api/promotions/category/electronics
http://localhost:3000/api/promotions/search?q=iPhone
http://localhost:3000/api/promotions/507f1f77bcf86cd799439011
http://localhost:3000/api/promotions/stats/overview
http://localhost:3000/api/promotions/status

# Producción (reemplazar con tu dominio)
https://api.tu-dominio.com/api/promotions
https://api.tu-dominio.com/api/promotions/hot
https://api.tu-dominio.com/api/promotions/category/electronics
```
