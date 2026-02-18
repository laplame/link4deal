# Formato esperado: POST /api/promotions (Quick Promotions)

Endpoint para crear una promoción desde la web (Quick Promotion) o desde una app.

---

## Método y URL

- **Método:** `POST`
- **URL:** `https://damecodigo.com/api/promotions` (o `http://localhost:3000/api/promotions` en local)
- **Content-Type:** `multipart/form-data` (obligatorio si envías imágenes; si no envías imágenes, puede usarse también `application/json` en teoría, pero el servidor está preparado para leer desde `req.body` que en multipart son todos strings).

En la práctica **usa siempre `multipart/form-data`** cuando haya imágenes; si tu app solo envía datos sin imagen, envía igualmente FormData con los campos como string.

---

## Campo obligatorio (mínimo)

| Campo   | Tipo   | Descripción |
|---------|--------|-------------|
| `title` | string | Título de la promoción. Es el **único campo obligatorio**. |

El resto de campos son opcionales. Si no los envías, el servidor usa valores por defecto (categoría `other`, precios 0, fechas vigencia 30 días, etc.).

---

## Campos opcionales (nombre exacto en el body / FormData)

Todos se envían como **string** en FormData (números y fechas en formato string).

| Campo              | Tipo   | Ejemplo / valores |
|--------------------|--------|-------------------|
| `description`      | string | "Promoción exclusiva..." |
| `productName`      | string | Si no se envía, el servidor usa el `title`. |
| `brand`            | string | "Marca Premium" |
| `category`         | string | `electronics` \| `fashion` \| `home` \| `beauty` \| `sports` \| `books` \| `food` \| `other` |
| `originalPrice`     | string | "5000" |
| `currentPrice`     | string | "3999" |
| `currency`         | string | "MXN" \| "USD" \| "EUR" (por defecto MXN) |
| `discountPercentage` | string | "20" (opcional; se puede calcular desde precios) |
| `storeName`        | string | "Tienda Centro" |
| `storeAddress`     | string | "Av. Principal 123" |
| `storeCity`        | string | "Ciudad de México" |
| `storeState`       | string | "CDMX" |
| `validFrom`        | string | "2025-02-15" (YYYY-MM-DD). Por defecto: hoy. |
| `validUntil`       | string | "2025-03-15" (YYYY-MM-DD). Por defecto: hoy + 30 días. |
| `isPhysicalStore`  | string | "true" \| "false" |
| `isHotOffer`       | string | "true" \| "false" |
| `hotness`          | string | "fire" \| "hot" \| "warm" |
| `tags`             | string | "tag1,tag2" o JSON array en string |
| `features`        | string | "feature1,feature2" o JSON array |
| `images`           | File   | Uno o más archivos (máx. 5). **Nombre del campo:** `images` (repetido para cada archivo). |

---

## Ejemplo mínimo (solo título, sin imagen)

```javascript
const formData = new FormData();
formData.append('title', 'Oferta de prueba');

const response = await fetch('https://damecodigo.com/api/promotions', {
  method: 'POST',
  body: formData
});
const data = await response.json();
```

---

## Ejemplo completo (FormData, como en Quick Promotions)

```javascript
const formData = new FormData();

// Obligatorio
formData.append('title', 'Oferta Especial de Electrónica');

// Opcionales
formData.append('description', 'Promoción exclusiva con descuento especial.');
formData.append('productName', 'Oferta Especial de Electrónica');
formData.append('brand', 'Marca Premium');
formData.append('category', 'electronics');
formData.append('originalPrice', '5000');
formData.append('currentPrice', '3999');
formData.append('currency', 'MXN');
formData.append('storeCity', 'Ciudad de México');
formData.append('storeState', 'Ciudad de México');
formData.append('validFrom', new Date().toISOString().split('T')[0]);
formData.append('validUntil', new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]);

// Imágenes (opcional; nombre del campo: "images", hasta 5 archivos)
formData.append('images', file1);
formData.append('images', file2);

const response = await fetch('https://damecodigo.com/api/promotions', {
  method: 'POST',
  body: formData
});
```

**No** pongas a mano el header `Content-Type`: el navegador (o el cliente) debe fijar `multipart/form-data` con el boundary.

---

## Respuesta 201 (éxito)

```json
{
  "success": true,
  "message": "Promoción creada exitosamente",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Oferta de prueba",
    "productName": "Oferta de prueba",
    "images": 0,
    "ocrProcessed": false,
    "status": "active"
  },
  "mode": "database"
}
```

---

## Respuesta 400 (error)

- **Falta el título:** `"message": "El título es requerido"`, `"missingFields": ["title"]`.
- **Precios inválidos:** "Los precios no pueden ser negativos" o "El precio actual no puede ser mayor al precio original".

---

## Resumen para la app

1. **Mínimo:** enviar solo `title` (FormData o body según tu cliente).
2. **Nombres exactos:** los de la tabla (por ejemplo `storeCity`, no `store_city`).
3. **Imágenes:** campo `images`, hasta 5 archivos; es opcional.
4. **Content-Type:** `multipart/form-data` cuando haya archivos; no fijar boundary a mano.
