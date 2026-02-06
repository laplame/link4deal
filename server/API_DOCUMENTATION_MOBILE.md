# 📱 Documentación Completa de la API de Promociones para App Móvil

## 📍 Información General

### URL Base

**Desarrollo:**
```
http://localhost:3000/api/promotions
```

**Producción:**
```
https://api.link4deal.com/api/promotions
```

### Versión de la API
`v1.0.0`

### Formato de Respuesta
Todas las respuestas siguen este formato:

**Éxito:**
```json
{
  "success": true,
  "data": {...},
  "message": "Mensaje descriptivo"
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

### Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| `200` | Éxito |
| `201` | Creado exitosamente |
| `400` | Error de validación o solicitud incorrecta |
| `404` | Recurso no encontrado |
| `413` | Archivo demasiado grande |
| `429` | Demasiadas solicitudes (Rate Limit) |
| `500` | Error interno del servidor |
| `503` | Servicio no disponible (MongoDB desconectado) |

---

## 🔐 Autenticación

**Nota:** Actualmente las rutas no requieren autenticación. Se recomienda implementar autenticación JWT en producción.

Para futuras implementaciones:
```
Authorization: Bearer {token}
```

---

## 📋 Endpoints Disponibles

### 1. GET - Listar Todas las Promociones

Obtiene una lista paginada de promociones con filtros opcionales.

**Endpoint:**
```
GET /api/promotions
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `page` | number | No | `1` | Número de página |
| `limit` | number | No | `10` | Resultados por página (máx: 100) |
| `category` | string | No | - | Filtrar por categoría |
| `status` | string | No | - | Filtrar por estado |
| `isHotOffer` | boolean | No | - | Filtrar ofertas calientes |
| `search` | string | No | - | Buscar en título, descripción, marca |

**Categorías disponibles:**
- `electronics` - Electrónicos
- `fashion` - Moda
- `sports` - Deportes
- `beauty` - Belleza
- `home` - Hogar
- `books` - Libros
- `food` - Comida
- `other` - Otros

**Estados disponibles:**
- `active` - Activa
- `draft` - Borrador
- `paused` - Pausada
- `expired` - Expirada
- `deleted` - Eliminada

**Ejemplo de Request:**
```javascript
// JavaScript/React Native
const response = await fetch(
  'http://localhost:3000/api/promotions?page=1&limit=20&category=electronics&status=active'
);
const data = await response.json();
```

**Ejemplo de Request (cURL):**
```bash
curl -X GET "http://localhost:3000/api/promotions?page=1&limit=20&category=electronics&status=active"
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "6972acc9ef28826a95b86c24",
        "title": "iPhone 15 Pro",
        "description": "El smartphone más avanzado",
        "productName": "iPhone 15 Pro",
        "brand": "Apple",
        "category": "electronics",
        "originalPrice": 24999,
        "currentPrice": 19999,
        "currency": "MXN",
        "discountPercentage": 20,
        "images": [
          {
            "originalName": "iphone.jpg",
            "filename": "promotion-1234567890-abc123.webp",
            "path": "/path/to/image.webp",
            "url": "/uploads/promotion-1234567890-abc123.webp",
            "cloudinaryUrl": "https://res.cloudinary.com/...",
            "uploadedAt": "2024-01-22T10:00:00.000Z",
            "optimized": true,
            "format": "webp",
            "dimensions": {
              "width": 1920,
              "height": 1440
            }
          }
        ],
        "status": "active",
        "isHotOffer": true,
        "hotness": "fire",
        "validFrom": "2024-01-01T00:00:00.000Z",
        "validUntil": "2024-01-31T23:59:59.000Z",
        "storeName": "Apple Store",
        "storeLocation": {
          "address": "Av. Insurgentes Sur 123",
          "city": "Ciudad de México",
          "state": "CDMX",
          "country": "México",
          "coordinates": {
            "latitude": 19.4326,
            "longitude": -99.1332
          }
        },
        "tags": ["smartphone", "5G", "Apple"],
        "features": ["Pantalla OLED", "Cámara Pro"],
        "views": 1250,
        "clicks": 450,
        "conversions": 45,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-22T10:00:00.000Z"
      }
    ],
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

### 2. GET - Obtener Promoción por ID

Obtiene los detalles completos de una promoción específica.

**Endpoint:**
```
GET /api/promotions/:id
```

**Path Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | string | Sí | ID de la promoción (MongoDB ObjectId) |

**Ejemplo de Request:**
```javascript
// JavaScript/React Native
const promotionId = "6972acc9ef28826a95b86c24";
const response = await fetch(
  `http://localhost:3000/api/promotions/${promotionId}`
);
const data = await response.json();
```

**Ejemplo de Request (cURL):**
```bash
curl -X GET "http://localhost:3000/api/promotions/6972acc9ef28826a95b86c24"
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "_id": "6972acc9ef28826a95b86c24",
    "title": "iPhone 15 Pro",
    "description": "El smartphone más avanzado de Apple...",
    "productName": "iPhone 15 Pro",
    "brand": "Apple",
    "category": "electronics",
    "originalPrice": 24999,
    "currentPrice": 19999,
    "currency": "MXN",
    "discountPercentage": 20,
    "images": [...],
    "status": "active",
    "isHotOffer": true,
    "hotness": "fire",
    "validFrom": "2024-01-01T00:00:00.000Z",
    "validUntil": "2024-01-31T23:59:59.000Z",
    "storeName": "Apple Store",
    "storeLocation": {...},
    "tags": ["smartphone", "5G"],
    "features": ["Pantalla OLED", "Cámara Pro"],
    "specifications": {
      "Pantalla": "6.7 pulgadas",
      "Procesador": "A17 Pro"
    },
    "views": 1250,
    "clicks": 450,
    "conversions": 45,
    "seller": {
      "name": "Apple Store",
      "email": "contacto@apple.com",
      "verified": true
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-22T10:00:00.000Z"
  },
  "message": "Promoción obtenida exitosamente"
}
```

**Errores Posibles:**
- `400` - ID inválido
- `404` - Promoción no encontrada

---

### 3. GET - Obtener Historial de Precios

Obtiene el historial de cambios de precio de una promoción.

**Endpoint:**
```
GET /api/promotions/:id/history
```

**Path Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | string | Sí | ID de la promoción |

**Ejemplo de Request:**
```javascript
const promotionId = "6972acc9ef28826a95b86c24";
const response = await fetch(
  `http://localhost:3000/api/promotions/${promotionId}/history`
);
const data = await response.json();
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "promotionId": "6972acc9ef28826a95b86c24",
    "brand": "Apple",
    "productName": "iPhone 15 Pro",
    "history": [
      {
        "date": "2024-01-22T10:00:00.000Z",
        "originalPrice": 24999,
        "currentPrice": 19999,
        "discountPercentage": 20,
        "currency": "MXN",
        "event": "promotion_created",
        "description": "Promoción creada para iPhone 15 Pro"
      },
      {
        "date": "2024-01-15T10:00:00.000Z",
        "originalPrice": 24999,
        "currentPrice": 21999,
        "discountPercentage": 12,
        "currency": "MXN",
        "event": "price_decrease",
        "description": "Precio reducido para mejorar la oferta"
      }
    ]
  },
  "message": "Historial de precios obtenido exitosamente"
}
```

---

### 4. GET - Ofertas Calientes

Obtiene todas las promociones marcadas como ofertas calientes.

**Endpoint:**
```
GET /api/promotions/hot
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `page` | number | No | `1` | Número de página |
| `limit` | number | No | `10` | Resultados por página |

**Ejemplo de Request:**
```javascript
const response = await fetch(
  'http://localhost:3000/api/promotions/hot?page=1&limit=20'
);
const data = await response.json();
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6972acc9ef28826a95b86c24",
      "title": "iPhone 15 Pro",
      "isHotOffer": true,
      "hotness": "fire",
      ...
    }
  ],
  "message": "Ofertas calientes obtenidas exitosamente"
}
```

---

### 5. GET - Promociones por Categoría

Obtiene promociones filtradas por categoría.

**Endpoint:**
```
GET /api/promotions/category/:category
```

**Path Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `category` | string | Sí | Categoría (electronics, fashion, sports, etc.) |

**Query Parameters:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `page` | number | No | `1` | Número de página |
| `limit` | number | No | `10` | Resultados por página |

**Ejemplo de Request:**
```javascript
const response = await fetch(
  'http://localhost:3000/api/promotions/category/electronics?page=1&limit=20'
);
const data = await response.json();
```

---

### 6. GET - Buscar Promociones

Busca promociones por término de búsqueda.

**Endpoint:**
```
GET /api/promotions/search
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `q` | string | Sí | Término de búsqueda |
| `page` | number | No | `1` | Número de página |
| `limit` | number | No | `10` | Resultados por página |

**Ejemplo de Request:**
```javascript
const searchTerm = encodeURIComponent("iPhone");
const response = await fetch(
  `http://localhost:3000/api/promotions/search?q=${searchTerm}&page=1&limit=20`
);
const data = await response.json();
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "docs": [...],
    "totalDocs": 15,
    "limit": 20,
    "page": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "message": "Búsqueda realizada exitosamente"
}
```

---

### 7. GET - Estadísticas Generales

Obtiene estadísticas generales de las promociones.

**Endpoint:**
```
GET /api/promotions/stats/overview
```

**Ejemplo de Request:**
```javascript
const response = await fetch(
  'http://localhost:3000/api/promotions/stats/overview'
);
const data = await response.json();
```

**Respuesta Exitosa (200):**
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
    "categories": {
      "electronics": 45,
      "fashion": 30,
      "sports": 25,
      "beauty": 20,
      "home": 15,
      "books": 10,
      "food": 5
    }
  },
  "message": "Estadísticas obtenidas exitosamente"
}
```

---

### 8. GET - Estado del Servicio

Verifica el estado de salud del servicio de promociones.

**Endpoint:**
```
GET /api/promotions/status
```

**Ejemplo de Request:**
```javascript
const response = await fetch(
  'http://localhost:3000/api/promotions/status'
);
const data = await response.json();
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-22T10:00:00.000Z",
    "service": "promotions-api",
    "version": "1.0.0",
    "uptime": 3600,
    "memory": {...},
    "database": "connected",
    "cloudinary": "configured",
    "ocr": "available"
  },
  "message": "Servicio de promociones funcionando correctamente"
}
```

---

### 9. POST - Crear Promoción

Crea una nueva promoción con imágenes.

**Endpoint:**
```
POST /api/promotions
```

**Content-Type:** `multipart/form-data`

**Rate Limit:** Máximo 10 promociones por IP cada 15 minutos

**Campos Requeridos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `title` | string | Título de la promoción (máx: 200 caracteres) |
| `productName` | string | Nombre del producto |
| `category` | string | Categoría (electronics, fashion, sports, etc.) |
| `originalPrice` | number | Precio original (debe ser > 0) |
| `currentPrice` | number | Precio con descuento (debe ser > 0 y ≤ originalPrice) |
| `images` | file[] | Al menos 1 imagen, máximo 5 (máx: 10MB cada una) |

**Campos Opcionales:**

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `description` | string | - | Descripción detallada (máx: 1000 caracteres) |
| `brand` | string | - | Marca del producto |
| `currency` | string | `MXN` | Moneda (MXN, USD, EUR) |
| `storeName` | string | - | Nombre de la tienda |
| `storeCity` | string | - | Ciudad |
| `storeState` | string | - | Estado |
| `storeAddress` | string | - | Dirección completa |
| `validFrom` | date | `now` | Fecha de inicio (ISO 8601) |
| `validUntil` | date | - | Fecha de expiración (ISO 8601, debe ser > validFrom) |
| `tags` | string | - | Tags separados por comas o JSON array |
| `features` | string | - | Features separados por comas o JSON array |
| `isHotOffer` | boolean | `false` | Marcar como oferta caliente |
| `hotness` | string | `warm` | Nivel de calidez (fire, hot, warm) |

**Formatos de Imagen Soportados:**
- JPEG/JPG
- PNG
- WebP
- GIF

**Optimización Automática:**
- Las imágenes se optimizan automáticamente
- Redimensionamiento máximo: 1920x1920px
- Conversión a WebP cuando es posible
- Compresión con calidad 85%
- Reducción típica: 40-70% del tamaño original

**Ejemplo de Request (JavaScript/React Native):**
```javascript
const formData = new FormData();

// Campos requeridos
formData.append('title', 'iPhone 15 Pro');
formData.append('productName', 'iPhone 15 Pro');
formData.append('category', 'electronics');
formData.append('originalPrice', '24999');
formData.append('currentPrice', '19999');

// Campos opcionales
formData.append('description', 'El smartphone más avanzado de Apple');
formData.append('brand', 'Apple');
formData.append('currency', 'MXN');
formData.append('storeName', 'Apple Store');
formData.append('storeCity', 'Ciudad de México');
formData.append('storeState', 'CDMX');
formData.append('storeAddress', 'Av. Insurgentes Sur 123');
formData.append('validFrom', '2024-01-01T00:00:00.000Z');
formData.append('validUntil', '2024-01-31T23:59:59.000Z');
formData.append('tags', 'smartphone,5G,Apple');
formData.append('features', 'Pantalla OLED,Cámara Pro');
formData.append('isHotOffer', 'true');
formData.append('hotness', 'fire');

// Agregar imágenes (File objects)
formData.append('images', imageFile1, 'iphone1.jpg');
formData.append('images', imageFile2, 'iphone2.jpg');

const response = await fetch('http://localhost:3000/api/promotions', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Ejemplo de Request (Flutter/Dart):**
```dart
import 'package:http/http.dart' as http;
import 'dart:io';

Future<Map<String, dynamic>> createPromotion({
  required String title,
  required String productName,
  required String category,
  required double originalPrice,
  required double currentPrice,
  required List<File> images,
  Map<String, dynamic>? optionalFields,
}) async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('http://localhost:3000/api/promotions'),
  );

  // Campos requeridos
  request.fields['title'] = title;
  request.fields['productName'] = productName;
  request.fields['category'] = category;
  request.fields['originalPrice'] = originalPrice.toString();
  request.fields['currentPrice'] = currentPrice.toString();

  // Campos opcionales
  if (optionalFields != null) {
    optionalFields.forEach((key, value) {
      request.fields[key] = value.toString();
    });
  }

  // Agregar imágenes
  for (var image in images) {
    request.files.add(
      await http.MultipartFile.fromPath('images', image.path),
    );
  }

  var response = await request.send();
  var responseData = await response.stream.bytesToString();
  return jsonDecode(responseData);
}
```

**Ejemplo de Request (cURL):**
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
  -F "validFrom=2024-01-01T00:00:00.000Z" \
  -F "validUntil=2024-01-31T23:59:59.000Z" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "message": "Promoción creada exitosamente",
  "data": {
    "id": "6972acc9ef28826a95b86c24",
    "title": "iPhone 15 Pro",
    "productName": "iPhone 15 Pro",
    "images": 2,
    "ocrProcessed": true,
    "status": "active",
    "optimizationStats": {
      "originalSize": 2450500,
      "optimizedSize": 450250,
      "compressionRatio": 81.6
    }
  }
}
```

**Errores Posibles:**
- `400` - Campos requeridos faltantes o inválidos
- `413` - Archivo demasiado grande (>10MB)
- `429` - Rate limit excedido
- `500` - Error del servidor

---

### 10. PUT - Actualizar Promoción

Actualiza una promoción existente.

**Endpoint:**
```
PUT /api/promotions/:id
```

**Content-Type:** `multipart/form-data` o `application/json`

**Path Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | string | Sí | ID de la promoción |

**Campos Actualizables:**

Todos los campos opcionales de creación, más:
- `status` - Cambiar estado (draft, active, paused, expired, deleted)
- `discountPercentage` - Porcentaje de descuento (calculado automáticamente si no se proporciona)

**Ejemplo de Request (JSON):**
```javascript
const promotionId = "6972acc9ef28826a95b86c24";
const response = await fetch(
  `http://localhost:3000/api/promotions/${promotionId}`,
  {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      currentPrice: 18999,
      description: 'Descripción actualizada',
      isHotOffer: true,
      hotness: 'fire'
    })
  }
);
const data = await response.json();
```

**Ejemplo de Request (FormData con imágenes):**
```javascript
const formData = new FormData();
formData.append('currentPrice', '18999');
formData.append('description', 'Descripción actualizada');
formData.append('images', newImageFile, 'new-image.jpg');

const response = await fetch(
  `http://localhost:3000/api/promotions/${promotionId}`,
  {
    method: 'PUT',
    body: formData
  }
);
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Promoción actualizada exitosamente",
  "data": {
    "id": "6972acc9ef28826a95b86c24",
    "title": "iPhone 15 Pro",
    "currentPrice": 18999,
    "updatedAt": "2024-01-22T10:00:00.000Z"
  }
}
```

**Errores Posibles:**
- `400` - ID inválido o datos inválidos
- `404` - Promoción no encontrada
- `500` - Error del servidor

---

### 11. DELETE - Eliminar Promoción

Elimina una promoción (soft delete - cambia status a 'deleted').

**Endpoint:**
```
DELETE /api/promotions/:id
```

**Path Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | string | Sí | ID de la promoción |

**Ejemplo de Request:**
```javascript
const promotionId = "6972acc9ef28826a95b86c24";
const response = await fetch(
  `http://localhost:3000/api/promotions/${promotionId}`,
  {
    method: 'DELETE'
  }
);
const data = await response.json();
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Promoción eliminada exitosamente"
}
```

**Errores Posibles:**
- `400` - ID inválido
- `404` - Promoción no encontrada
- `500` - Error del servidor

---

## 📦 Modelo de Datos Completo

### Promoción (Promotion)

```typescript
interface Promotion {
  _id: string;                    // MongoDB ObjectId
  title: string;                   // Título (máx: 200 caracteres)
  description: string;             // Descripción (máx: 1000 caracteres)
  productName: string;            // Nombre del producto
  brand?: string;                 // Marca
  category: string;               // Categoría
  originalPrice: number;          // Precio original
  currentPrice: number;           // Precio actual
  currency: string;               // MXN, USD, EUR
  discountPercentage?: number;    // Porcentaje de descuento (0-100)
  
  // Ubicación
  storeName?: string;
  storeLocation?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  isPhysicalStore?: boolean;
  
  // Imágenes
  images: Array<{
    originalName: string;
    filename: string;
    path: string;
    url: string;                  // URL pública
    cloudinaryUrl?: string;       // URL de Cloudinary (si está configurado)
    cloudinaryPublicId?: string;
    uploadedAt: Date;
    optimized?: boolean;           // Si fue optimizada
    format?: string;               // webp, jpeg, png
    dimensions?: {
      width: number;
      height: number;
    };
    optimizationStats?: {
      originalSize: number;
      optimizedSize: number;
      compressionRatio: number;
    };
  }>;
  
  // Metadatos
  tags?: string[];
  features?: string[];
  specifications?: Record<string, any>;
  
  // Estado
  status: 'draft' | 'active' | 'paused' | 'expired' | 'deleted';
  isHotOffer?: boolean;
  hotness?: 'fire' | 'hot' | 'warm';
  
  // Fechas
  validFrom: Date;
  validUntil: Date;
  
  // Vendedor
  seller?: {
    name: string;
    email?: string;
    phone?: string;
    verified?: boolean;
  };
  
  // Smart Contract (opcional)
  smartContract?: {
    address: string;
    network: string;
    tokenStandard: string;
    blockchainExplorer: string;
  };
  
  // Estadísticas
  views: number;
  clicks: number;
  conversions: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🚦 Rate Limiting

La API implementa rate limiting para prevenir abuso:

| Endpoint | Límite | Ventana de Tiempo |
|----------|--------|-------------------|
| `POST /api/promotions` | 10 requests | 15 minutos |
| `GET /api/promotions/search` | 30 requests | 1 minuto |
| `GET /api/promotions` | 30 requests | 1 minuto |

**Respuesta cuando se excede el límite (429):**
```json
{
  "success": false,
  "message": "Demasiadas solicitudes. Intenta de nuevo en X minutos."
}
```

**Headers de Rate Limit:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 1640000000
```

---

## 🖼️ Optimización de Imágenes

### Proceso Automático

1. **Redimensionamiento**: Máximo 1920x1920px (mantiene aspect ratio)
2. **Compresión**: Calidad 85% (configurable)
3. **Conversión**: A WebP cuando es posible (mejor compresión)
4. **Progressive JPEG**: Para carga progresiva

### Configuración

Variables de entorno (`.env`):
```env
IMAGE_MAX_WIDTH=1920
IMAGE_MAX_HEIGHT=1920
IMAGE_QUALITY=85
IMAGE_FORMAT=auto
```

### Resultados Típicos

- **Reducción de tamaño**: 40-70%
- **Calidad visual**: Excelente (85%)
- **Formato de salida**: WebP (mejor compresión) o formato original

### Metadatos de Optimización

Cada imagen incluye información de optimización:
```json
{
  "optimized": true,
  "format": "webp",
  "dimensions": {
    "width": 1920,
    "height": 1440
  },
  "optimizationStats": {
    "originalSize": 2450500,
    "optimizedSize": 450250,
    "compressionRatio": 81.6
  }
}
```

---

## 🔍 OCR (Reconocimiento Óptico de Caracteres)

### Proceso Automático

- Se procesa automáticamente la **primera imagen** subida
- Extrae datos como: nombre del producto, marca, precio, categoría
- Los datos extraídos se usan para pre-llenar el formulario si no se proporcionan

### Datos Extraídos

- `productName` - Nombre del producto
- `brand` - Marca
- `category` - Categoría
- `originalPrice` - Precio original
- `currentPrice` - Precio actual
- `storeName` - Nombre de la tienda
- `tags` - Tags relevantes

---

## 📱 Ejemplos de Implementación

### React Native

```javascript
// services/PromotionsService.js
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api/promotions'
  : 'https://api.link4deal.com/api/promotions';

export const PromotionsService = {
  // Obtener todas las promociones
  async getAllPromotions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}?${queryString}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Obtener promoción por ID
  async getPromotionById(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Obtener historial de precios
  async getPriceHistory(id) {
    const response = await fetch(`${API_BASE_URL}/${id}/history`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Crear promoción
  async createPromotion(formData) {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      body: formData,
      headers: {
        // No incluir Content-Type, fetch lo hace automáticamente para FormData
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error creando promoción');
    }
    
    return await response.json();
  },

  // Actualizar promoción
  async updatePromotion(id, formData) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error actualizando promoción');
    }
    
    return await response.json();
  },

  // Eliminar promoción
  async deletePromotion(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error eliminando promoción');
    }
    
    return await response.json();
  },

  // Buscar promociones
  async searchPromotions(query, params = {}) {
    const searchParams = new URLSearchParams({
      q: query,
      ...params
    });
    
    const response = await fetch(`${API_BASE_URL}/search?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Obtener ofertas calientes
  async getHotOffers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/hot?${queryString}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
};
```

### Flutter/Dart

```dart
// services/promotions_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';

class PromotionsService {
  static const String baseUrl = 'http://localhost:3000/api/promotions';
  
  // Obtener todas las promociones
  Future<Map<String, dynamic>> getAllPromotions({
    int? page,
    int? limit,
    String? category,
    String? status,
    bool? isHotOffer,
    String? search,
  }) async {
    final queryParams = <String, String>{};
    if (page != null) queryParams['page'] = page.toString();
    if (limit != null) queryParams['limit'] = limit.toString();
    if (category != null) queryParams['category'] = category;
    if (status != null) queryParams['status'] = status;
    if (isHotOffer != null) queryParams['isHotOffer'] = isHotOffer.toString();
    if (search != null) queryParams['search'] = search;
    
    final uri = Uri.parse(baseUrl).replace(queryParameters: queryParams);
    final response = await http.get(uri);
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Error: ${response.statusCode}');
    }
  }
  
  // Obtener promoción por ID
  Future<Map<String, dynamic>> getPromotionById(String id) async {
    final response = await http.get(Uri.parse('$baseUrl/$id'));
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Error: ${response.statusCode}');
    }
  }
  
  // Crear promoción
  Future<Map<String, dynamic>> createPromotion({
    required String title,
    required String productName,
    required String category,
    required double originalPrice,
    required double currentPrice,
    required List<File> images,
    Map<String, dynamic>? optionalFields,
  }) async {
    var request = http.MultipartRequest('POST', Uri.parse(baseUrl));
    
    // Campos requeridos
    request.fields['title'] = title;
    request.fields['productName'] = productName;
    request.fields['category'] = category;
    request.fields['originalPrice'] = originalPrice.toString();
    request.fields['currentPrice'] = currentPrice.toString();
    
    // Campos opcionales
    if (optionalFields != null) {
      optionalFields.forEach((key, value) {
        request.fields[key] = value.toString();
      });
    }
    
    // Agregar imágenes
    for (var image in images) {
      request.files.add(
        await http.MultipartFile.fromPath('images', image.path),
      );
    }
    
    var response = await request.send();
    var responseData = await response.stream.bytesToString();
    
    if (response.statusCode == 201) {
      return jsonDecode(responseData);
    } else {
      throw Exception('Error: ${response.statusCode}');
    }
  }
}
```

---

## ⚠️ Manejo de Errores

### Errores Comunes

**400 - Bad Request:**
```json
{
  "success": false,
  "message": "Campos requeridos faltantes: title, productName",
  "error": "ValidationError: title is required"
}
```

**404 - Not Found:**
```json
{
  "success": false,
  "message": "Promoción no encontrada"
}
```

**413 - Payload Too Large:**
```json
{
  "success": false,
  "message": "El archivo es demasiado grande",
  "error": "LIMIT_FILE_SIZE"
}
```

**429 - Too Many Requests:**
```json
{
  "success": false,
  "message": "Demasiadas promociones creadas. Intenta de nuevo en 15 minutos."
}
```

**500 - Internal Server Error:**
```json
{
  "success": false,
  "message": "Error interno del servidor",
  "error": "Error details (solo en desarrollo)"
}
```

**503 - Service Unavailable:**
```json
{
  "success": false,
  "message": "MongoDB no conectado - modo simulado activo"
}
```

---

## 📝 Notas Importantes

### Imágenes

1. **Máximo 5 imágenes** por promoción
2. **Máximo 10MB** por imagen
3. **Formatos soportados**: JPEG, PNG, WebP, GIF
4. **Optimización automática**: Reducción de 40-70% del tamaño
5. **URLs públicas**: `/uploads/{filename}` (servidas desde el servidor)

### OCR

- Se procesa automáticamente la **primera imagen**
- Usa la imagen **original** (no optimizada) para mejor precisión
- Los datos extraídos se usan para pre-llenar campos si no se proporcionan

### Modo Simulado

Si MongoDB no está conectado:
- Las operaciones de lectura funcionan con datos en memoria
- Las operaciones de escritura se guardan en memoria (no persistentes)
- Se muestra un mensaje indicando el modo simulado

### CORS

El servidor está configurado para aceptar requests desde:
- Apps móviles (React Native, Flutter, etc.)
- Capacitor/Ionic apps
- Requests sin origin (nativos)

---

## 🔗 URLs Completas de Ejemplo

### Desarrollo Local

```
GET    http://localhost:3000/api/promotions
GET    http://localhost:3000/api/promotions/6972acc9ef28826a95b86c24
GET    http://localhost:3000/api/promotions/6972acc9ef28826a95b86c24/history
GET    http://localhost:3000/api/promotions/hot
GET    http://localhost:3000/api/promotions/category/electronics
GET    http://localhost:3000/api/promotions/search?q=iPhone
GET    http://localhost:3000/api/promotions/stats/overview
GET    http://localhost:3000/api/promotions/status
POST   http://localhost:3000/api/promotions
PUT    http://localhost:3000/api/promotions/6972acc9ef28826a95b86c24
DELETE http://localhost:3000/api/promotions/6972acc9ef28826a95b86c24
```

### Producción

```
GET    https://api.link4deal.com/api/promotions
GET    https://api.link4deal.com/api/promotions/6972acc9ef28826a95b86c24
GET    https://api.link4deal.com/api/promotions/6972acc9ef28826a95b86c24/history
GET    https://api.link4deal.com/api/promotions/hot
GET    https://api.link4deal.com/api/promotions/category/electronics
GET    https://api.link4deal.com/api/promotions/search?q=iPhone
GET    https://api.link4deal.com/api/promotions/stats/overview
GET    https://api.link4deal.com/api/promotions/status
POST   https://api.link4deal.com/api/promotions
PUT    https://api.link4deal.com/api/promotions/6972acc9ef28826a95b86c24
DELETE https://api.link4deal.com/api/promotions/6972acc9ef28826a95b86c24
```

---

## 🧪 Testing

### Postman Collection

Puedes importar estos endpoints en Postman para probar la API.

### cURL Examples

Ver sección de cada endpoint para ejemplos de cURL.

---

## 📞 Soporte

Para más información o soporte, contacta al equipo de desarrollo.

**Última actualización:** 2024-01-22
