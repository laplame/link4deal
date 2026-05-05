# Endpoint: verificar cupón (QR) – contrato para la app

La app (p. ej. LUXAE o POS) llama a **verify** para validar el código escaneado o el código de referencia y obtener el JSON del cupón. Este documento refleja lo que **pide y devuelve** el backend en este repo (`server/routes/discountQr.js`).

---

## Flujo en el backend

1. Se recibe un identificador de cupón: valor del QR (`qrValue`), alias `token`, o el código alfanumérico (`referralCode` / `couponCode`, p. ej. `L4D-...`).
2. Se resuelve el documento en MongoDB (`DiscountQrToken`):
   - Si el string tiene formato de **token de referencia** firmado (`LINK4DEAL-DISCOUNT.v1.<id>.<sig>`), se valida la firma y se busca por `tokenId`.
   - Si no, se busca por `payload.referralCode` igual al string (último creado con ese código).
3. Se comprueba **expiración del documento** (`expiresAt` del cupón).
4. Se ejecutan **reglas de negocio** (`validateBusinessRules`) sobre el `payload` y, si la petición los envía, `shopId` / `productId` de **contexto** (no sustituyen al payload; sirven para comprobar `allowedShopIds` / `allowedProductIds` de la promoción).
5. Respuesta **200** con `payload`, `couponId`, `redemption`, o **400** con `errorCode`, `message` y a veces `errors` y `payload`.

---

## 1. Request

Hay **dos** variantes equivalentes en cuanto a datos del cupón; la diferencia es GET vs POST.

### 1.1 `POST /api/discount-qr/verify`

```http
POST /api/discount-qr/verify
Content-Type: application/json
```

**Body – identificador del cupón (uno obligatorio)**

| Campo (JSON)     | Orden de lectura en código | Descripción |
|------------------|----------------------------|-------------|
| `qrValue`        | 1.º                        | Código escaneado del QR (token de referencia firmado). |
| `token`          | 2.º                        | Alias de `qrValue`. |
| `referralCode`   | 3.º                        | Mismo valor que `payload.referralCode` (p. ej. `L4D-...`). |
| `couponCode`     | 4.º                        | Alias de búsqueda; mismo uso que `referralCode`. |

La función `getCouponLookupInput` toma **el primer valor no vacío** en el orden: **`qrValue` → `token` → `referralCode` → `couponCode`**. Si varios vienen informados, **`qrValue` gana** sobre `token`, etc.

Si **todos** faltan → **400**:

```json
{
  "ok": false,
  "errorCode": "QR_INVALID",
  "message": "qrValue, token, referralCode o couponCode requerido"
}
```

**Body – contexto opcional (validación tienda / producto)**

| Campo       | Obligatorio | Descripción |
|------------|-------------|-------------|
| `shopId`   | No          | Si la promoción define `allowedShopIds` y este campo viene, debe estar en la lista o falla `PROMO_NOT_FOR_SHOP`. |
| `productId`| No          | Análogo con `allowedProductIds` → `PROMO_NOT_FOR_PRODUCT`. |

**Ejemplo mínimo**

```json
{
  "qrValue": "LINK4DEAL-DISCOUNT.v1.<base64url>.<sig>"
}
```

**Ejemplo con contexto de tienda**

```json
{
  "qrValue": "…",
  "shopId": "bizne-shop-123",
  "productId": "optional-product-id"
}
```

---

### 1.2 `GET /api/discount-qr/verify`

Misma semántica; los campos van en **query string**.

**Query – identificador (uno obligatorio)**

- `qrValue`, `token`, `referralCode` o `couponCode` (mismo orden de precedencia que en POST).

**Query – opcional**

- `shopId`, `productId` (misma validación que en POST).

**Ejemplo**

```http
GET /api/discount-qr/verify?referralCode=L4D-XXXX&shopId=my-shop
```

---

## 2. Respuesta éxito – HTTP 200

### 2.1 Cupón encontrado en BD (flujo normal)

```json
{
  "ok": true,
  "message": "QR válido",
  "couponId": "<tokenId del documento>",
  "payload": {
    "deviceId": "…",
    "influencerId": "…",
    "promotionId": "…",
    "referralCode": "…",
    "discountPercentage": 20,
    "luxaesRedeemed": 20,
    "walletAddress": "0x…"
  },
  "redemption": {
    "redeemable": true,
    "usedAt": null
  }
}
```

- **`couponId`**: es el `tokenId` almacenado en `DiscountQrToken` (no confundir solo con el código `referralCode` visible al usuario).
- **`payload`**: copia del objeto guardado al **crear** el cupón (`POST`/`GET /api/discount-qr/create`). Incluye como mínimo lo anterior; puede incluir también campos opcionales fusionados en la creación, por ejemplo: `shopId`, `productId`, `brandId`, `gtmTag`, `campaignId`, `source`, `medium`, `metadata`, etc. (ver `mergeOptionalCouponFields` / `OPTIONAL_COUPON_PAYLOAD_KEYS` en `discountQr.js`).
- **`redemption.redeemable`**: `true` si `usedAt` del token es nulo; `false` si el cupón **ya fue canjeado** (sigue siendo verify válido: la app debe mirar `redeemable` antes de llamar a redeem).
- **`redemption.usedAt`**: fecha ISO si ya fue usado; si no, `null`.

**Importante:** En **verify** un cupón ya canjeado **no** devuelve el código `QR_ALREADY_REDEEMED`; devuelve **200** con `redemption.redeemable: false` y `usedAt` informado. El código `QR_ALREADY_REDEEMED` aplica sobre todo al flujo **`POST /api/discount-qr/redeem`**.

### 2.2 POST verify: token decodificable pero **sin fila en BD** (“legacy”)

Si no hay documento en Mongo pero el body se puede decodificar como JWT legacy (`verifyAndDecodeQrToken`), la respuesta 200 incluye:

```json
{
  "ok": true,
  "message": "QR válido",
  "couponId": "<payload.jti o null>",
  "payload": { ... },
  "redemption": {
    "redeemable": false,
    "usedAt": null,
    "legacyToken": true
  }
}
```

(GET `/verify` no usa este camino: usa `runVerify`, que exige documento en BD.)

---

## 3. Respuestas de error – HTTP 400

La app debe mostrar **`message`** al usuario y puede usar **`errorCode`** para lógica o i18n.

### 3.1 Errores genéricos (sin `errors[]`)

Ejemplos: cupón no encontrado / expirado (a nivel documento), token ilegible.

```json
{
  "ok": false,
  "errorCode": "QR_INVALID",
  "message": "Código QR inválido o expirado."
}
```

```json
{
  "ok": false,
  "errorCode": "PROMO_EXPIRED",
  "message": "La promoción ha expirado."
}
```

(En verify, **PROMO_EXPIRED** puede aplicar por **expiración del documento del cupón** `expiresAt` o por **vigencia de la promoción** en reglas de negocio, según la rama que falle.)

### 3.2 Errores de reglas de negocio (con `errors` y a veces `payload`)

```json
{
  "ok": false,
  "errorCode": "PROMO_INACTIVE",
  "message": "La promoción no está activa.",
  "errors": [
    { "code": "PROMO_INACTIVE", "message": "La promoción no está activa." }
  ],
  "payload": { ... }
}
```

**Códigos que `validateBusinessRules` puede devolver en verify** (según implementación actual):

| errorCode | Mensaje (aprox.) |
|-----------|------------------|
| `QR_INVALID` | Código QR inválido o expirado. (También si `promotionId` no es ObjectId válido o `influencerId` no existe en BD.) |
| `PROMO_NOT_FOUND` | Promoción no encontrada. |
| `PROMO_INACTIVE` | La promoción no está activa. |
| `PROMO_EXPIRED` | La promoción ha expirado. (ventana `validUntil`) |
| `PROMO_NOT_UNDER_TERMS` | La promoción existe pero no aplica bajo estos términos. (Ej. aún no inicia `validFrom`, o `discountPercentage` fuera de 0–100.) |
| `PROMO_NOT_FOR_SHOP` | La promoción existe pero no está habilitada para esta tienda. |
| `PROMO_NOT_FOR_PRODUCT` | La promoción existe pero no aplica para este producto. |

**Nota:** En `ERROR_CODES` existe también `PROMO_ONE_PER_PERSON`; **no está enlazado hoy** a `validateBusinessRules` en este archivo, así que verify **no** devolverá ese código hasta que se implemente la regla.

**`QR_ALREADY_REDEEMED`:** pensado para **redeem**, no como respuesta típica de verify (verify indica estado con `redemption.redeemable`).

---

## 4. Resumen para integradores

| Necesidad | Uso |
|-----------|-----|
| Validar QR o código `L4D-…` | `POST` o `GET` verify con `qrValue` o `referralCode` / `couponCode`. |
| Saber si se puede canjear | `redemption.redeemable` + `usedAt`. |
| Atribución influencer | `payload.influencerId` (y datos de promoción vía `GET /api/promotions/:promotionId`). |
| Validar en una tienda POS concreta | Enviar `shopId` (y si aplica `productId`) en body o query. |
| Cupón ya usado | Verify sigue siendo 200; `redeemable: false`. |

---

## 5. Implementación y entorno

- **Rutas:** `server/routes/discountQr.js` → `GET /verify`, `POST /verify`.
- **Crypto / formato QR:** `server/utils/qrCrypto.js` (`verifyReferenceQrToken`, `verifyAndDecodeQrToken`).
- **Modelo:** `server/models/DiscountQrToken.js`.
- **Montaje:** `server/index.js` → `app.use('/api/discount-qr', …)`.

Variables de entorno típicas (QR de referencia):

```env
QR_PREFIX=LINK4DEAL-DISCOUNT
QR_VERSION=v1
QR_SIGN_KEY=<base64 de 32 bytes>
QR_TTL_SECONDS=300
```

---

## 6. Puertos y ejemplos curl

- **Backend:** según `PORT` (p. ej. 3000 local, 5001 en PM2).
- **Vite:** `5173` con proxy `/api` al backend.

```bash
# GET – ver JSON del cupón (mismo contrato de éxito que POST cuando hay documento en BD)
curl -s "http://localhost:3000/api/discount-qr/verify?qrValue=LINK4DEAL-DISCOUNT.v1.XXX.sig"

# GET – con tienda
curl -s "http://localhost:3000/api/discount-qr/verify?referralCode=L4D-ABC123&shopId=mi-tienda"

# POST – uso típico desde la app
curl -s -X POST "http://localhost:3000/api/discount-qr/verify" \
  -H "Content-Type: application/json" \
  -d '{"qrValue":"LINK4DEAL-DISCOUNT.v1.XXX.sig","shopId":"mi-tienda"}'
```

---

## 7. Despliegue compartido (p. ej. bizneai.com)

Para otro dominio, el contrato debe mantenerse: mismos campos de entrada (`qrValue` | `token` | `referralCode` | `couponCode`, opcionales `shopId`, `productId`) y misma forma de respuesta 200/400 descrita arriba.
