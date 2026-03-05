# Referencia: campos del modelo Promoción para la app

Este documento integra **todos los campos del schema de Promoción** (y lo necesario para cupón QR) para que la app (web o móvil) pueda crear, editar y mostrar promociones alineadas con BizneAI/DameCodigo (definición legal, tokenización, vigencia, límite de redenciones).

---

## 1. Resumen por uso en la app

| Uso | Campos mínimos |
|-----|----------------|
| **Crear promoción (mínimo)** | `title` (obligatorio). Recomendado: `productName`, `brand`, `category`, `originalPrice`, `currentPrice`, `currency`, `validFrom`, `validUntil`, `totalQuantity`, `offerType`. |
| **Tokenización (unidad calculable)** | `offerType`, `originalPrice`, `discountPercentage` o `currentPrice`; opcional `cashbackValue`. El backend calcula `promotionalValueUsd`. |
| **Definición legal (Gherkin)** | Precio base (USD), producto, características, cantidad máxima (`totalQuantity`), vigencia (`validFrom`, `validUntil`). |
| **Cupón QR (crear)** | Ver sección 6; no es parte del schema Promotion sino del flujo `POST /api/discount-qr/create`. |

---

## 2. Schema completo: Promotion

### 2.1 Información básica

| Campo | Tipo | Obligatorio | Default / enum | Descripción |
|-------|------|-------------|----------------|-------------|
| **title** | string | **Sí** | — | Título de la promoción (máx. 200 caracteres). |
| **description** | string | No | `''` | Descripción (máx. 1000). |
| **productName** | string | No | `''` | Nombre del producto o servicio. |
| **brand** | string | No | — | Marca. |
| **category** | string | No | `'other'` | Enum: `electronics`, `fashion`, `home`, `beauty`, `sports`, `books`, `food`, `other`. |

### 2.2 Precios, descuentos y tokenización (unidad calculable)

| Campo | Tipo | Obligatorio | Default / enum | Descripción |
|-------|------|-------------|----------------|-------------|
| **originalPrice** | number | No | `0` | Precio base del producto (≥ 0). En USD para tokenización. |
| **currentPrice** | number | No | `0` | Precio con oferta (≥ 0). |
| **currency** | string | No | `'USD'` | Solo `USD`. Los cálculos y tokens son en dólares. |
| **discountPercentage** | number | No | — | Porcentaje de descuento (0–100). Se puede calcular desde original/current. |
| **offerType** | string | No | `'percentage'` | Tipo para conversión a USD. Enum: `percentage`, `bogo`, `cashback_fixed`, `cashback_percentage`. |
| **cashbackValue** | number | No | `null` | Para `cashback_fixed`: monto en USD. Para `cashback_percentage`: % (0–100). |
| **promotionalValueUsd** | number | No | `null` | Valor promocional en USD (X tokens = X USD). Lo calcula el backend; la app puede mostrarlo. |

**Regla tokenización:** X tokens = X USD. Ver `server/utils/promotionValueUsd.js` y doc `PROMOCIONES_BIZNEAI_GHERKIN.md`.

### 2.3 Ubicación y tienda

| Campo | Tipo | Obligatorio | Default / enum | Descripción |
|-------|------|-------------|----------------|-------------|
| **storeName** | string | No | — | Nombre de la tienda. |
| **storeLocation** | object | No | — | `address`, `city`, `state`, `country` (default `'México'`), `coordinates`: `{ latitude, longitude }`. |
| **isPhysicalStore** | boolean | No | `false` | Si aplica a tienda física. |
| **allowedShopIds** | string[] | No | — | IDs de tiendas donde aplica (vacío = todas). |
| **allowedProductIds** | string[] | No | — | IDs de productos a los que aplica (vacío = todos). |

### 2.4 Imágenes y medios

| Campo | Tipo | Obligatorio | Default / enum | Descripción |
|-------|------|-------------|----------------|-------------|
| **images** | array | No | `[]` | Items: `originalName`, `filename`, `path`, `url` (p. ej. `/uploads/promotions/...`), `cloudinaryUrl`, `cloudinaryPublicId`, `uploadedAt`. En creación se envían archivos en `FormData` como `images`. |

### 2.5 Metadatos de la promoción

| Campo | Tipo | Obligatorio | Default / enum | Descripción |
|-------|------|-------------|----------------|-------------|
| **tags** | string[] | No | — | Etiquetas. |
| **features** | string[] | No | — | Características. |
| **specifications** | object | No | — | Especificaciones (clave-valor). |
| **ocrData** | object | No | — | Datos de OCR si se usó extracción: `extractedText`, `confidence`, `ocrProvider`, `processedAt`. |

### 2.6 Estado, vigencia e inventario

| Campo | Tipo | Obligatorio | Default / enum | Descripción |
|-------|------|-------------|----------------|-------------|
| **status** | string | No | `'draft'` | Enum: `draft`, `active`, `paused`, `expired`, `deleted`. |
| **isHotOffer** | boolean | No | `false` | Si es oferta destacada. |
| **hotness** | string | No | `'warm'` | Enum: `fire`, `hot`, `warm`. |
| **validFrom** | Date | No | `Date.now` | Fecha de inicio de vigencia. |
| **validUntil** | Date | No | ahora + 30 días | Fecha de fin de vigencia. |
| **totalQuantity** | number | No | `null` | Límite de promociones redimibles (inventario promocional). Al llegar al límite, la promoción se considera agotada. |

### 2.7 Vendedor, smart contract y estadísticas

| Campo | Tipo | Obligatorio | Default / enum | Descripción |
|-------|------|-------------|----------------|-------------|
| **seller** | object | No | — | `name`, `email`, `phone`, `verified`. |
| **smartContract** | object | No | — | `address`, `network`, `tokenStandard`, `blockchainExplorer`. |
| **views** | number | No | `0` | Visualizaciones. |
| **clicks** | number | No | `0` | Clics. |
| **conversions** | number | No | `0` | Redenciones/conversiones. |

### 2.8 Metadatos del sistema (solo lectura en app)

| Campo | Tipo | Obligatorio | Default / enum | Descripción |
|-------|------|-------------|----------------|-------------|
| **createdBy** | ObjectId | No | — | Ref a User. |
| **createdAt** | Date | No | `Date.now` | Fecha de creación. |
| **updatedAt** | Date | No | `Date.now` | Fecha de última actualización. |

---

## 3. Virtuales (solo lectura, calculados por el backend)

| Virtual | Tipo | Descripción |
|---------|------|-------------|
| **isActive** | boolean | `status === 'active'` y `validFrom ≤ now ≤ validUntil`. |
| **daysRemaining** | number \| null | Días hasta `validUntil` (0 si ya expiró). |
| **savings** | number | `originalPrice - currentPrice`. |

---

## 4. API: crear promoción (POST /api/promotions)

- **Content-Type:** `multipart/form-data` si hay imágenes; si no, `application/json` puede usarse en implementaciones que lo soporten.
- **Campos que la app puede enviar (FormData o JSON):**

Los mismos nombres que el schema. Para fechas se suele enviar string ISO o `YYYY-MM-DD`. Para **offerType** el backend acepta también `fixed` como alias de `cashback_fixed`.

**Mínimo para crear:** `title`.  
**Recomendado para promoción legal y tokenizable:**

- `title`, `description`, `productName`, `brand`, `category`
- `originalPrice`, `currentPrice`, `currency` (solo USD)
- `discountPercentage` (o se calcula de original/current)
- `offerType` (`percentage` | `bogo` | `cashback_fixed` | `cashback_percentage`), y si aplica `cashbackValue`
- `validFrom`, `validUntil`
- `totalQuantity` (máximo de cupones redimibles)
- `storeName`, `storeLocation.city`, `storeLocation.address` (opcional)
- `images` (archivos)

**Respuesta éxito (201):** `{ success: true, data: { id, ...promotion } }`.  
En `data` vendrá `promotionalValueUsd` si el backend pudo calcularlo.

---

## 5. API: actualizar promoción (PUT /api/promotions/:id)

Mismos campos que en creación (parcial). Campos permitidos incluyen: `title`, `description`, `productName`, `brand`, `category`, `originalPrice`, `currentPrice`, `currency`, `discountPercentage`, `offerType`, `cashbackValue`, `promotionalValueUsd`, `storeName`, `storeLocation`, `validFrom`, `validUntil`, `totalQuantity`, `status`, etc.

---

## 6. Cupón QR (no es parte del schema Promotion)

Para **pedir un cupón QR** asociado a una promoción, la app llama a:

- **POST** `/api/discount-qr/create` (body JSON), o  
- **GET** `/api/discount-qr/create?deviceId=...&influencerId=...&promotionId=...&referralCode=...&discountPercentage=...&walletAddress=...`

**Body (POST) / query (GET):**

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| **deviceId** | string | Sí | Id del dispositivo. |
| **influencerId** | string | Sí | Usuario o `guest`. |
| **promotionId** | string | Sí | ID de la promoción (Mongo ObjectId). |
| **referralCode** | string | Sí | Código de referencia (ej. L4D-...). |
| **discountPercentage** | number | No | 0–100 (default 0). Va en el string del QR. |
| **walletAddress** | string | No (POST) | Default `"not-provided"` en GET. |

**Respuesta:** `{ ok: true, qrValue, prefix, version, ttlSeconds }`. `qrValue` es el string para generar la imagen del QR. Ver `docs/APP_DECODE_QR_DISCOUNT.md`.

---

## 7. Checklist app: promoción legal y tokenizable

Para que la promoción sea válida, auditable y con valor calculable en USD (pasivo financiero medible), la app debería permitir capturar al menos:

- [ ] **title** (obligatorio)
- [ ] **productName** o título como producto
- [ ] **originalPrice** y **currentPrice** (o **discountPercentage**)
- [ ] **currency** (solo USD; cálculos en dólares)
- [ ] **offerType** (percentage, bogo, cashback_fixed, cashback_percentage) y **cashbackValue** si aplica
- [ ] **validFrom** y **validUntil**
- [ ] **totalQuantity** (máximo de redenciones)
- [ ] **category** y **brand** (recomendado)
- [ ] Al menos una **imagen** (recomendado para listados)

Con eso el backend puede calcular **promotionalValueUsd** (X tokens = X USD) y la promoción queda alineada con el Gherkin BizneAI/DameCodigo.

---

## 8. Documentos relacionados

- **PROMOCIONES_BIZNEAI_GHERKIN.md** – Mapeo Gherkin ↔ campos, tipos de promoción, pasivo financiero.
- **APP_DECODE_QR_DISCOUNT.md** – Formato del QR, cómo pedir y leer cupones.
- **DISCOUNT_QR_VERIFY_ENDPOINT.md** – Contrato de verify/redeem del cupón QR.
- **server/models/Promotion.js** – Schema fuente.
- **server/utils/promotionValueUsd.js** – Cálculo de valor en USD por tipo de oferta.
