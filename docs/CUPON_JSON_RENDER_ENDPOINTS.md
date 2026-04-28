# JSON del cupón, renderizado y endpoints (web y app)

Este documento describe cómo **crear**, **mostrar** y **validar** el mismo cupón en la **web** (`CouponRequestForm`) y en una **app móvil**, con las reglas actuales: prefijo con **porcentaje** (`-N`), **`luxaesRedeemed`**, campos opcionales de atribución y QR de respaldo sin servidor.

---

## 1. Crear cupón (issuer)

El cupón **no** se obtiene con GET por id después de crearlo. Se crea con **POST** o **GET** y la respuesta se usa de inmediato en la UI.

### Endpoint para crear

| Método | URL | Uso |
|--------|-----|-----|
| **POST** | `/api/discount-qr/create` | Body JSON (formulario o app) |
| **GET**  | `/api/discount-qr/create?deviceId=...&influencerId=...&promotionId=...&referralCode=...&discountPercentage=...&walletAddress=...` | Mismo flujo por query (deep links, app) |

### Body (POST) / Query (GET)

```json
{
  "deviceId": "dev-1734567890-abc123",
  "influencerId": "userId-o-guest",
  "promotionId": "69a8e15cf8e811c8129b494c",
  "referralCode": "L4D-69ab902b0d4f6db400965dce-MMFQPJE7",
  "discountPercentage": 20,
  "walletAddress": "not-provided",
  "brandId": "opcional-marca-o-sku",
  "shopId": "opcional-tienda",
  "productId": "opcional-id-catalogo-externo",
  "gtmTag": "GTM-XXXX",
  "campaignId": "spring-2026",
  "source": "app",
  "medium": "qr",
  "metadata": { "slot": "hero", "variant": "A" }
}
```

**Obligatorios:** `deviceId`, `influencerId`, `promotionId`, `referralCode`, `walletAddress` (POST; en GET `walletAddress` puede omitirse y usa `"not-provided"`).

**Opcionales:** `brandId`, `shopId`, `productId`, `gtmTag`, `campaignId`, `source`, `medium`, `metadata` (objeto JSON; en GET, `metadata` como string JSON codificado en URL).

### Respuesta exitosa (create) — QR emitido por servidor

```json
{
  "ok": true,
  "qrValue": "LINK4DEAL-DISCOUNT-20.v1.FZa0VhYiiblu.20.T-3YQvMHnS7JoNB94QIMq2vdnH6MdMDjvqteXB409gE",
  "prefix": "LINK4DEAL-DISCOUNT-20",
  "basePrefix": "LINK4DEAL-DISCOUNT",
  "version": "v1",
  "ttlSeconds": 120,
  "luxaesRedeemed": 20,
  "businessWarnings": []
}
```

| Campo | Descripción |
|-------|-------------|
| **qrValue** | String completo a codificar en el QR (formato referencia, 5 partes). |
| **prefix** | Primer segmento del token. Si el descuento es &gt; 0, es `basePrefix-N` donde **N = porcentaje** (5, 10, 20, …). |
| **basePrefix** | Valor de entorno `QR_PREFIX` (sin `-N`). |
| **luxaesRedeemed** | Entero 0–100; **igual** que `discountPercentage` enviado y que **N** en el prefijo (nombre histórico del campo). |
| **version** | Versión del formato (p. ej. `v1`). |
| **ttlSeconds** | Validez del token en segundos (p. ej. 120); usar para **countdown** en UI. |
| **businessWarnings** | Avisos de negocio si la creación no fue bloqueada. |

**Formato del `qrValue` (referencia, 5 partes):**

```text
<PREFIX>.<version>.<tokenId>.<discountPct>.<firma_base64url>
```

Ejemplo: `LINK4DEAL-DISCOUNT-20.v1.<id>.20.<sig>`. El **primer segmento** (`PREFIX`) coincide con **`prefix`** de la respuesta; el cuarto segmento repite el **%** de descuento.

**Variable de entorno:** `QR_PREFIX` define el texto base (p. ej. `LINK4DEAL-DISCOUNT` o `link4deal-discount` en minúsculas). El servidor añade `-N` cuando N &gt; 0.

### Respuesta de redirección (sin QR)

Si la promoción tiene **redirectInsteadOfQr** (p. ej. Amazon), no hay token ni QR:

```json
{
  "ok": true,
  "noQr": true,
  "redirectToUrl": "https://amzn.to/3NfsW8K"
}
```

La app debe mostrar un CTA que abra `redirectToUrl` (navegador in-app o externo), no una pantalla de QR.

---

## 2. Recuperar datos del cupón generado (`brandId`, `shopId`, atribución)

### Qué **no** está en el texto del QR

El string **`qrValue`** que se codifica en el bitmap sigue el formato de **cinco partes** (prefijo con **-N** = % de descuento, versión, `tokenId`, porcentaje repetido, firma). Ahí **no** viajan en claro `brandId`, `shopId`, `gtmTag`, UTMs ni `metadata`: solo sirve para localizar el token y validar la firma.

Los campos opcionales enviados al **create** (`brandId`, `shopId`, `productId`, `gtmTag`, `campaignId`, `source`, `medium`, `metadata`) se **persisten en el payload del token** en base de datos (colección de tokens de cupón QR), igual que el resto del cupón.

### Cómo recuperarlos (lector, otra app, backend)

Tras escanear o pegar el string completo:

1. Llamar **GET** o **POST** **`/api/discount-qr/verify`** con el **`qrValue`** (o `token`) escaneado.
2. En la respuesta exitosa, usar el objeto **`payload`**: ahí están todos los datos guardados al emitir el cupón, incluidos **`brandId`** y **`shopId`** si se mandaron en el create.

Ejemplo mínimo de **POST** `/api/discount-qr/verify`:

```http
POST /api/discount-qr/verify
Content-Type: application/json

{
  "qrValue": "LINK4DEAL-DISCOUNT-20.v1.<tokenId>.20.<sig>"
}
```

La respuesta incluye `couponId` (mismo `tokenId` que en el string) y `payload` con al menos: `deviceId`, `influencerId`, `promotionId`, `referralCode`, `discountPercentage`, `luxaesRedeemed`, `walletAddress`, y **si aplicó al crear** `brandId`, `shopId`, `productId`, `gtmTag`, `campaignId`, `source`, `medium`, `metadata`.

**POST** `/api/discount-qr/redeem` devuelve también **`payload`** completo tras marcar el cupón como usado (one-time), útil si el flujo del POS valida y redime en un solo paso.

### Relación con el catálogo “Marcas y negocios” (`/brands`)

Los ids que enlazan con la UI pública suelen ser:

| Campo en `payload` | Origen habitual | Nota |
|--------------------|-----------------|------|
| **`brandId`** | Marca registrada en **`GET /api/brands`** | Valor típico: **`_id`** Mongo de la marca (misma ficha que `/brand/:brandId`). |
| **`shopId`** | Tienda Bizne en **`GET /api/bizne-shops`** | Valor típico: **`id`** o **`_id`** de la tienda (perfil `/shop/bizne/:shopId`). |

La promoción puede tener además `brandId` / `shopId` en el documento de **Promotion**; el **`payload` del token** refleja lo enviado en el **create** del cupón (puede coincidir con la promoción si el cliente los reutiliza).

### No confundir dos usos de `shopId` en verify / redeem

| Dónde | Rol |
|-------|-----|
| **`payload.shopId`** | Tienda/atribución **grabada en el cupón** al crearlo (si se envió en el body del create). |
| **`shopId` en query (GET) o body (POST)** junto a `qrValue` | Tienda del **lector o POS** para validar si la promoción aplica ahí: si la promoción tiene `allowedShopIds` no vacío, el id del lector debe estar en esa lista. Es **validación de contexto**, no sustituye al `payload`. |

Igual idea para **`productId`** frente a **`allowedProductIds`** en la promoción.

### Emisor vs lector

- **App que emitió el cupón**: puede mostrar `brandId` / `shopId` desde su estado local (los mismos que envió al create) **sin** llamar a verify.
- **App que solo escanea**: debe usar **verify** (o **redeem**) para obtener el **`payload`** completo; el create **no** devuelve el payload en la respuesta, solo `qrValue`, prefijos, TTL, etc.

---

## 3. Paridad web ↔ app: qué guardar y cómo pintar

Tras un **create** exitoso con QR, la app debe persistir al menos:

| Estado / campo | Origen | Uso en UI |
|----------------|--------|-----------|
| **couponCode** | Mismo string que **referralCode** enviado al create (en web: `L4D-{promotionId}-{random}`). | Código alfanumérico para el usuario y canje manual. |
| **qrValue** | Respuesta `qrValue`. | Contenido exacto del QR (bitmap). |
| **luxaesRedeemed** | Respuesta `luxaesRedeemed` (= %). | Badge “X% de descuento”, textos “Luxae a redimir: X”. |
| **prefix** / **basePrefix** | Respuesta (opcional en UI). | Confirmar que el prefijo del string coincide; educación al usuario. |
| **ttlSeconds** | Respuesta. | Countdown “Válido por M:SS” (reiniciar al generar). |
| **promotionId** | Ya lo tienes; es el id de la promoción. | Deep links, `GET /api/promotions/:id` para detalle. |

**Generar la imagen del QR (igual que en web):**

- Librería recomendada: cualquier generador que acepte string UTF-8 (en web: `qrcode` / `QRCode.toDataURL`).
- Codificar exactamente **`qrValue`** sin trim ni cambios de mayúsculas.
- Resolución sugerida del canvas: **480px** (o mayor en pantallas densas); escalar en UI con `object-fit` / equivalente para que ocupe el ancho del modal (~`min(18rem, 85vw)` en web).

### Cómo saber si el QR es del servidor o respaldo local

| Condición | Tipo | Comportamiento UI |
|-----------|------|-------------------|
| `qrValue` contiene **`.v1.`** y **no** contiene **`.local.`** | **Issuer (servidor)** | QR firmado; mostrar bloque “Texto codificado en el QR” con el string completo (scroll si hace falta). Explicar que el **primer segmento** termina en `-N` = N%. |
| `qrValue` contiene **`.local.`** | **Respaldo offline** | No hay firma del servidor. En web el formato es `LINK4DEAL-DISCOUNT-{pct}.local.{mismo código L4D}` cuando pct &gt; 0, para que el % se **vea en el prefijo** aunque no sea verificable igual que el token `.v1.`. Mostrar aviso: usar **código alfanumérico** o volver a generar con red. |

### JSON lógico de pantalla “Cupón generado” (referencia de implementación)

```json
{
  "title": "¡Cupón generado!",
  "message": "Tu cupón ha sido creado correctamente. Escanea el QR o usa el código.",
  "couponCode": "L4D-69a8e15cf8e811c8129b494c-MMFQPJE7",
  "discountPercent": 20,
  "luxaesRedeemed": 20,
  "prefix": "LINK4DEAL-DISCOUNT-20",
  "basePrefix": "LINK4DEAL-DISCOUNT",
  "qrValue": "LINK4DEAL-DISCOUNT-20.v1....",
  "validForSeconds": 120,
  "isServerSignedQr": true,
  "redirectToUrl": null
}
```

- **`discountPercent`** y **`luxaesRedeemed`** deben ser **el mismo entero** tras el create.
- **`isServerSignedQr`**: derivar con la regla `.v1.` y sin `.local.` (ver tabla anterior).

### Smart contract (solo referencia UI web)

En la web la dirección hex es un **mock** derivado del `qrValue`; si la app no tiene el mismo producto, puedes omitir ese bloque o sustituirlo por enlaces reales de tu negocio.

---

## 4. Implementación web de referencia

Componente: `src/components/CouponRequestForm.tsx`.

1. Generar **referralCode** / **couponCode** antes del POST (único por solicitud).
2. **POST /api/discount-qr/create** con `discountPercentage` alineado a la promoción.
3. Si **`noQr`** + **`redirectToUrl`**: pantalla de compra externa, sin QR.
4. Si **`qrValue`**: guardar `luxaesRedeemed`, `prefix`, generar imagen QR, countdown `ttlSeconds` (p. ej. 120 s).
5. Pantalla con: badge de **X%**, texto Luxae/porcentaje, **solo un** bloque principal de “Código del cupón”; el string técnico largo **solo** si es QR del servidor; aviso ámbar si es `.local.`.
6. No hay GET posterior al create; todo viene de la respuesta + estado local.

---

## 5. Verificar y redimir (escáner / otra app)

### GET/POST `/api/discount-qr/verify`

| Parámetro | Uso |
|-----------|-----|
| `qrValue` o `token` | String completo escaneado. |
| `shopId`, `productId` | Opcional: tienda/producto del **lector**; si la promoción define `allowedShopIds` / `allowedProductIds`, se comprueba que el id del lector esté permitido (ver sección 2). **No** es el mismo concepto que `payload.shopId` del token. |

### Respuesta exitosa (verify)

```json
{
  "ok": true,
  "message": "QR válido",
  "couponId": "FZa0VhYiiblu",
  "payload": {
    "deviceId": "dev-1734567890-abc123",
    "influencerId": "guest",
    "promotionId": "69a8e15cf8e811c8129b494c",
    "referralCode": "L4D-69ab902b0d4f6db400965dce-MMFQPJE7",
    "discountPercentage": 20,
    "walletAddress": "not-provided",
    "luxaesRedeemed": 20,
    "brandId": "507f1f77bcf86cd799439011",
    "shopId": "bizne-store-id-ejemplo",
    "productId": "sku-externo-opcional",
    "gtmTag": "GTM-XXXX",
    "campaignId": "spring-2026",
    "source": "app",
    "medium": "qr",
    "metadata": {}
  },
  "redemption": {
    "redeemable": true,
    "usedAt": null
  }
}
```

- **`luxaesRedeemed`** y **`discountPercentage`** coinciden (entero %).
- **`couponId`**: id interno del token (parte del `qrValue`).
- Los campos opcionales (`brandId`, `shopId`, `productId`, `gtmTag`, etc.) **solo aparecen** en `payload` si se enviaron al crear el cupón; si no se mandaron, no estarán (o irán vacíos según implementación).

### POST `/api/discount-qr/redeem`

Body típico: `{ "qrValue": "<token>", "readerId": "...", "shopId": "<id tienda lector>" }`. El `shopId` del body aquí es el del **POS** para cruzar con `allowedShopIds` de la promoción. Marca uso único; la respuesta incluye **`payload`** completo y `usedAt` cuando aplica.

Para detalle ampliado de la promoción (nombre, tienda, imágenes): **GET /api/promotions/:id** con `payload.promotionId`.

---

## 6. Resumen de endpoints

| Acción | Método | Endpoint | Respuesta relevante |
|--------|--------|----------|----------------------|
| Crear cupón | POST | `/api/discount-qr/create` | `ok`, `qrValue`, `prefix`, `basePrefix`, `luxaesRedeemed`, `version`, `ttlSeconds` |
| Crear cupón (query) | GET | `/api/discount-qr/create?...` | Igual que POST |
| Validar cupón | GET/POST | `/api/discount-qr/verify` | `couponId`, `payload`, `redemption` |
| Redimir (una vez) | POST | `/api/discount-qr/redeem` | Estado de redención |

No existe **GET /api/coupons/:id** por id público: el flujo es **create** → mostrar → **verify** / **redeem** con el `qrValue` completo.

---

## 7. Checklist rápido para la app móvil

- [ ] Tras create exitoso, almacenar `qrValue`, `luxaesRedeemed`, `couponCode` (= referral enviado), `ttlSeconds`.
- [ ] Pintar el QR con el **string exacto** `qrValue`.
- [ ] Mostrar **un solo** código destacado (L4D); el texto técnico largo solo si el QR es del **servidor** (`.v1.`, sin `.local.`).
- [ ] Si hay **`.local.`**, explicar que es respaldo y que el **%** sigue siendo `luxaesRedeemed` / badge.
- [ ] Countdown alineado a `ttlSeconds` (o 120 s si fijas igual que web).
- [ ] Si respuesta `noQr` + `redirectToUrl`, pantalla de enlace externo, no QR.
- [ ] Opcional: enviar mismos campos opcionales (`brandId`, `shopId`, `gtmTag`, …) que la web para analítica en el payload del token.
- [ ] **Lector / TPV:** tras escanear, llamar **`/api/discount-qr/verify`** (o **`redeem`**) y leer **`payload`** para obtener `brandId`, `shopId`, UTMs, etc.; esos datos **no** se obtienen solo parseando el string del QR.
- [ ] Si el verify envía `shopId`/`productId` del lector, comprobar errores de negocio cuando la promoción restringe tiendas o productos (`allowedShopIds` / `allowedProductIds`).
