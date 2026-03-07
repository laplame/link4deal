# Crear promoción – Resumen para la app

Resumen de endpoint, cuerpo de la petición, respuesta esperada y formulario tipo quick-promotion para implementar en la app.

---

## 1. Endpoint

| Método | URL | Content-Type |
|--------|-----|--------------|
| **POST** | `/api/promotions` | `multipart/form-data` (si hay imágenes) o `application/json` (solo campos; el backend acepta ambos vía `req.body`). En la web se usa **FormData** con imágenes. |

**Base URL:** la misma del resto de la API (ej. `https://www.damecodigo.com/api/promotions` o `http://localhost:3000/api/promotions`).

---

## 2. Respuesta esperada

### Éxito (201 Created)

```json
{
  "success": true,
  "message": "Promoción creada exitosamente",
  "data": {
    "id": "69a8e15cf8e811c8129b494c",
    "title": "McFlurry Oreo",
    "productName": "McFlurry Oreo",
    "images": 1,
    "ocrProcessed": false,
    "status": "draft"
  },
  "mode": "database"
}
```

- **data.id**: ID de la promoción (ObjectId en MongoDB). Usar para redirigir a la página de detalle: `/promotion-details/{id}` o equivalente.
- **data.status**: suele ser `draft`; puede cambiarse después a `active`.
- **mode**: `"database"` si se guardó en MongoDB; `"simulated"` si solo se guardó en memoria (sin BD).

### Error (400 – validación)

```json
{
  "success": false,
  "message": "El título es requerido",
  "missingFields": ["title"]
}
```

Otros posibles mensajes: fechas inválidas, precio actual mayor que original, etc.

### Error (500)

```json
{
  "success": false,
  "message": "Error interno del servidor",
  "error": "..."
}
```

---

## 3. Cuerpo de la petición (formulario / campos)

El backend acepta **multipart/form-data** (FormData) con los campos abajo. En la app se puede enviar **JSON** para los campos y, si hay imágenes, **multipart** con los mismos nombres.

### 3.1 Campo obligatorio

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **title** | string | Título de la promoción (requerido). |

### 3.2 Campos opcionales (recomendados para quick-promotion)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| description | string | Descripción; en web se arma como título + descripción extra. |
| productName | string | Nombre del producto (en web se suele igualar al título). |
| brand | string | Marca. |
| category | string | `electronics`, `fashion`, `home`, `beauty`, `sports`, `books`, `food`, `other`. |
| originalPrice | number | Precio base (en la moneda indicada). |
| currentPrice | number | Precio con oferta. |
| currency | string | `USD` o `MXN`. Si es MXN, el backend convierte a USD para tokens. |
| discountPercentage | number | 0–100 (se puede calcular como (original - current) / original * 100). |
| offerType | string | `percentage` \| `bogo` \| `cashback_fixed` \| `cashback_percentage`. |
| cashbackValue | number | Requerido si offerType es cashback_fixed o cashback_percentage. |
| storeCity | string | Ciudad. |
| storeState | string | Estado. |
| validFrom | string (ISO date) | Inicio de vigencia. |
| validUntil | string (ISO date) | Fin de vigencia. |
| totalQuantity | number | Cupones máximos redimibles (ej. 100). |
| termsAndConditions | string | Texto de términos (opcional). |
| **images** | File[] | Hasta 5 imágenes (en FormData como `images`). |

**Nota:** Si no se envían imágenes, se puede usar solo JSON (`Content-Type: application/json`) con los campos anteriores (sin `images`).

### 3.3 Ejemplo mínimo (JSON, sin imágenes)

```json
{
  "title": "McFlurry Oreo",
  "description": "Promoción McFlurry de Oreo",
  "productName": "McFlurry Oreo",
  "brand": "McDonald's",
  "category": "food",
  "originalPrice": 60,
  "currentPrice": 29,
  "currency": "USD",
  "discountPercentage": 52,
  "offerType": "percentage",
  "storeCity": "Ciudad de México",
  "validFrom": "2026-03-06",
  "validUntil": "2026-04-06",
  "totalQuantity": 100
}
```

### 3.4 Ejemplo con FormData (web / app con fotos)

Mismos campos que arriba, pero enviados como **FormData**:

- Campos de texto/número: `formData.append('title', '...')`, `formData.append('originalPrice', '60')`, etc.
- Imágenes: `formData.append('images', file)` hasta 5 archivos (nombre del campo: `images`).

No hace falta `Content-Type` en el header; el cliente suele poner `multipart/form-data` con boundary automáticamente.

---

## 4. Formulario tipo quick-promotion para la app

Flujo sugerido (similar a `/quick-promotion`):

1. **Foto primero (opcional pero recomendado)**  
   - Subir 1–5 imágenes.  
   - Opcional: llamar a `POST /api/promotions/analyze-image` (multipart con `images`) para rellenar título, descripción, precios, términos con Gemini.

2. **Bloque de datos mínimos**  
   - **Título** * (obligatorio).  
   - Descripción extra (opcional; se puede concatenar con el título para `description`).  
   - **Moneda**: USD o MXN (producto en español).  
   - **Precio original** y **Precio con oferta** (en la moneda elegida).  
   - **Tipo de promoción**: Descuento %, 2x1, Cashback %, Cashback fijo.  
   - Si aplica: porcentaje o monto de cashback.  
   - **Vigencia**: fecha inicio y fin (o por defecto: hoy + 30 días).  
   - **Cantidad de cupones**: totalQuantity (ej. 100).  
   - Términos y condiciones (opcional).

3. **Vista previa de valor en tokens**  
   - Mostrar: “Valor en tokens (USD): X USD = X tokens”.  
   - Si la moneda es MXN, calcular en cliente con tipo de cambio aproximado (ej. 0.058) y aclarar que al guardar el servidor usa el tipo de cambio real.

4. **Envío**  
   - Construir FormData (o JSON si no hay imágenes) con los campos de la tabla anterior.  
   - `POST /api/promotions`.  
   - Si `response.ok && data.success`, leer `data.data.id` y redirigir a la pantalla de detalle de la promoción (ej. `/promotion-details/{id}`).

### Campos del form en la app (checklist)

| Campo en pantalla | Nombre en API | Obligatorio | Notas |
|-------------------|---------------|-------------|--------|
| Título | title | Sí | |
| Descripción (opcional) | description | No | Puede ser título + texto extra. |
| Moneda del producto | currency | No | USD \| MXN (default USD). |
| Precio original | originalPrice | No | Número. |
| Precio con oferta | currentPrice | No | Número. |
| Tipo de promoción | offerType | No | percentage \| bogo \| cashback_fixed \| cashback_percentage. |
| Cashback (valor o %) | cashbackValue | Si offerType es cashback_* | |
| Descuento % | discountPercentage | No | Se puede calcular de precios. |
| Fecha inicio | validFrom | No | ISO date. |
| Fecha fin | validUntil | No | ISO date. |
| Cupones máximos | totalQuantity | No | Ej. 100. |
| Marca | brand | No | |
| Categoría | category | No | Enum del schema. |
| Ciudad | storeCity | No | |
| Términos y condiciones | termsAndConditions | No | |
| Imágenes | images | No | Hasta 5 en FormData. |

---

## 5. Analizar imagen con Gemini (opcional)

Para rellenar el form a partir de una foto (como en quick-promotion):

| Método | URL | Body |
|--------|-----|------|
| POST | `/api/promotions/analyze-image` | `multipart/form-data` con campo **images** (1–5 archivos). |

Respuesta esperada (éxito): JSON con campos extraídos (título, descripción, precios, términos, etc.) para rellenar el formulario. La app puede mapear esos campos a los nombres de la tabla anterior y luego enviar `POST /api/promotions` con FormData (incluyendo las mismas imágenes si se desea).

---

## 6. Resumen rápido

- **Crear promoción:** `POST /api/promotions` con FormData (o JSON sin imágenes).  
- **Obligatorio:** `title`.  
- **Respuesta éxito:** 201 con `data.id`; redirigir a detalle con ese `id`.  
- **Form en la app:** título, moneda (USD/MXN), precios, tipo de oferta, vigencia, totalQuantity, imágenes opcionales; opcionalmente usar `POST /api/promotions/analyze-image` para rellenar desde una foto.
