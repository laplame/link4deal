# Página de subida rápida de promociones y formato del POST

## Página

- **Componente:** `QuickPromotionPage` (`src/pages/QuickPromotionPage.tsx`)
- **Rutas:** `/quick-promotion` y `/add-promotion`
- **URL en producción:** `https://damecodigo.com/quick-promotion` o `https://damecodigo.com/add-promotion`

La página incluye plantillas rápidas (Electrónica, Moda, Deportes, Belleza, etc.), formulario con título, descripción, marca, categoría, precios, ciudad, fecha de vigencia y subida de imágenes (máx. 5).

---

## Ejemplo de JSON de una promoción (creada desde quick-promotion)

Es el documento que se guarda en MongoDB y el que devuelve la API (por ejemplo en `GET /api/promotions` o `GET /api/promotions/:id`):

```json
{
  "_id": "674a1b2c3d4e5f6789abcde",
  "title": "Oferta Especial de Electrónica",
  "description": "Promoción exclusiva con descuento especial. Productos de alta calidad garantizados.",
  "productName": "Oferta Especial de Electrónica",
  "brand": "Marca Premium",
  "category": "electronics",
  "originalPrice": 5000,
  "currentPrice": 3999,
  "currency": "MXN",
  "discountPercentage": 20,
  "storeName": "",
  "storeLocation": {
    "address": "",
    "city": "Ciudad de México",
    "state": "Ciudad de México",
    "country": "México",
    "coordinates": null
  },
  "isPhysicalStore": false,
  "images": [
    {
      "originalName": "oferta.jpg",
      "filename": "promotion-1739123456789-abc123.jpg",
      "path": "/home/cto/project/link4deal/server/public/uploads/promotion-1739123456789-abc123.jpg",
      "url": "/uploads/promotion-1739123456789-abc123.jpg",
      "cloudinaryUrl": null,
      "cloudinaryPublicId": null,
      "uploadedAt": "2025-02-10T15:30:00.000Z"
    }
  ],
  "ocrData": null,
  "tags": [],
  "features": [],
  "specifications": {},
  "status": "active",
  "isHotOffer": false,
  "hotness": "warm",
  "validFrom": "2025-02-10T06:00:00.000Z",
  "validUntil": "2025-03-12T06:00:00.000Z",
  "seller": {
    "name": "Usuario del sistema",
    "email": "system@link4deal.com",
    "verified": false
  },
  "views": 0,
  "clicks": 0,
  "conversions": 0,
  "createdAt": "2025-02-10T15:30:00.000Z",
  "updatedAt": "2025-02-10T15:30:00.000Z"
}
```

Categorías válidas: `electronics`, `fashion`, `home`, `beauty`, `sports`, `books`, `food`, `other`.

---

## Método y endpoint

- **Método:** `POST`
- **URL:** `/api/promotions`
- **Content-Type:** `multipart/form-data` (no se envía JSON; se usa `FormData` porque hay imágenes).

---

## Formato del cuerpo (FormData)

El frontend **no envía JSON**. Envía `FormData` con estos campos (strings o archivos):

| Campo             | Tipo   | Ejemplo / descripción                          |
|-------------------|--------|-------------------------------------------------|
| `title`           | string | "Oferta Especial de Electrónica"               |
| `description`     | string | "Promoción exclusiva con descuento..."         |
| `productName`     | string | (mismo que title en QuickPromotion)            |
| `brand`           | string | "Marca Premium"                                |
| `category`        | string | "electronics" \| "fashion" \| "sports" \| "beauty" \| "home" \| "books" \| "food" \| "other" |
| `originalPrice`   | string | "5000"                                         |
| `currentPrice`    | string | "3999"                                         |
| `currency`        | string | "MXN" \| "USD" \| "EUR"                        |
| `discountPercentage` | string | "20"                                        |
| `storeCity`       | string | "Ciudad de México"                             |
| `storeState`      | string | "Ciudad de México"                             |
| `validFrom`       | string | "2025-02-15" (YYYY-MM-DD)                      |
| `validUntil`      | string | "2025-03-15" (YYYY-MM-DD)                      |
| `stock`           | string | "100"                                          |
| `totalQuantity`   | string | "100"                                          |
| `images`          | File   | Uno o más archivos (máx. 5); nombre del campo repetido: `images` |

Las imágenes se envían como archivos con el mismo nombre de campo `images` (el servidor recibe `req.files`).

---

## Equivalente en el servidor (req.body + req.files)

El backend recibe:

- **req.body:** todos los campos anteriores como strings (porque es `multipart/form-data`).
- **req.files:** array de archivos con `fieldname: 'images'`, `originalname`, `buffer`, `mimetype`, etc. (Multer en memoria).

El controlador construye un documento de promoción con esta forma (lo que se guarda en MongoDB):

```json
{
  "title": "string",
  "description": "string",
  "productName": "string",
  "brand": "string",
  "category": "electronics | fashion | home | beauty | sports | books | food | other",
  "originalPrice": 5000,
  "currentPrice": 3999,
  "currency": "MXN",
  "discountPercentage": 20,
  "storeName": "",
  "storeLocation": {
    "address": "",
    "city": "Ciudad de México",
    "state": "Ciudad de México",
    "country": "México"
  },
  "isPhysicalStore": false,
  "images": [
    {
      "originalName": "foto.jpg",
      "filename": "promotion-1234567890-abc.jpg",
      "path": "/ruta/en/servidor/...",
      "url": "/uploads/promotion-1234567890-abc.jpg",
      "cloudinaryUrl": "https://... o null",
      "cloudinaryPublicId": "..." o null,
      "uploadedAt": "2025-02-15T..."
    }
  ],
  "tags": [],
  "features": [],
  "validFrom": "2025-02-15T00:00:00.000Z",
  "validUntil": "2025-03-15T00:00:00.000Z",
  "status": "active",
  "isHotOffer": false,
  "hotness": "warm",
  "seller": { "name": "Usuario del sistema", "email": "system@link4deal.com", "verified": false }
}
```

---

## Ejemplo de llamada desde código (FormData)

```javascript
const formData = new FormData();
formData.append('title', 'Oferta de prueba');
formData.append('description', 'Descripción de la promoción');
formData.append('productName', 'Oferta de prueba');
formData.append('brand', 'Marca Demo');
formData.append('category', 'other');
formData.append('originalPrice', '100');
formData.append('currentPrice', '50');
formData.append('currency', 'MXN');
formData.append('discountPercentage', '50');
formData.append('storeCity', 'Ciudad de México');
formData.append('storeState', 'Ciudad de México');
formData.append('validFrom', new Date().toISOString().split('T')[0]);
formData.append('validUntil', new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]);
formData.append('stock', '100');
formData.append('totalQuantity', '100');
formData.append('images', file); // File objeto; puede repetirse hasta 5

const response = await fetch('/api/promotions', {
  method: 'POST',
  body: formData
});
```

No se debe enviar `Content-Type` a mano; el navegador pone `multipart/form-data` con el boundary correcto.

---

## Respuesta exitosa (201)

```json
{
  "success": true,
  "message": "Promoción creada exitosamente",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Oferta de prueba",
    "productName": "Oferta de prueba",
    "images": 1,
    "ocrProcessed": false,
    "status": "active"
  },
  "mode": "database"
}
```

Si MongoDB no está conectado, `mode` puede ser `"simulated"` y la promoción solo existe en memoria.
