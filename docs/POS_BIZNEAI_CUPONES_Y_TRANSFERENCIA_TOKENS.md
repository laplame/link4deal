# Punto de venta (POS) + BizneAI: verificar cupón, enviar datos al servidor y settlement de tokens

Este documento es la guía de integración para un **lector POS**, una **app de mostrador** o **BizneAI** (tienda con `shopId` en el catálogo) para:

1. Comprobar si un cupón sigue **vigente y aplicable** a la tienda.
2. **Canjearlo una sola vez** y registrar **quién**, **qué dispositivo** y **bajo qué términos** se redimió.
3. Entender cómo encaja el paso siguiente: **abono de tokens (LUXAE / PSCS-1) a la wallet del negocio** tras un canje válido.

**Base URL de producción (ejemplo):** `https://www.damecodigo.com`  
**Prefijo API:** `/api`

> **Importante:** En el código actual del backend, **`POST /api/discount-qr/redeem` marca el cupón como usado y guarda auditoría en MongoDB**, pero **no ejecuta por sí solo una transferencia on-chain** a la wallet del negocio. La transferencia de tokens debe hacerse con un **servicio de settlement** (worker, cola, o extensión del handler de redeem) que consuma el evento de canje. Más abajo se describe el patrón recomendado.

---

## 1. Identificadores que debe conocer el POS / BizneAI

| Concepto | Origen típico | Uso en API |
|--------|----------------|------------|
| **`shopId` tienda BizneAI** | `GET /api/bizne-shops` o `GET /api/bizne-shops/:id` → campo `id` o `_id` | En **verify** y **redeem** como `shopId` para validar `allowedShopIds` de la promoción |
| **`productId` catálogo** (opcional) | SKU / id externo si la promo restringe productos | `productId` en verify/redeem si `allowedProductIds` está definido |
| **Código del cupón** | Texto mostrado al cliente (`L4D-...`) o string del QR | `referralCode` o `couponCode` (mismo valor que `payload.referralCode`) |
| **String del QR** | Escaneo | `qrValue` o `token` |

---

## 2. Flujo recomendado en el POS

```text
[Cliente muestra QR o dicta código]
        │
        ▼
POST /api/discount-qr/verify   (solo lectura; no consume el cupón)
        │
        ├─ ok: false → mostrar message / errors al cajero
        │
        └─ ok: true y redemption.redeemable === true
                │
                ▼
         [UI: confirmar monto, términos, usuario…]
                │
                ▼
POST /api/discount-qr/redeem  (canje atómico; una sola vez)
        │
        ├─ ok: true → registrar venta local + disparar settlement de tokens (ver §6)
        │
        └─ errorCode: QR_ALREADY_REDEEMED, PROMO_EXPIRED, etc.
```

---

## 3. Verificar cupón (sin canjear)

Comprueba validez, reglas de negocio (promoción activa, fechas, tienda/producto) y si **aún se puede canjear**.

### 3.1 Por código alfanumérico (recomendado en POS con teclado)

```http
POST /api/discount-qr/verify
Content-Type: application/json
```

```json
{
  "referralCode": "L4D-69da58ff77e1634e88c6fcfd-MOHTG2AC",
  "shopId": "tu-shop-id-bizne",
  "productId": "sku-opcional"
}
```

También puedes usar el alias **`couponCode`** en lugar de `referralCode`.

### 3.2 Por string escaneado del QR

```json
{
  "qrValue": "<string completo del QR>",
  "shopId": "tu-shop-id-bizne",
  "productId": "sku-opcional"
}
```

### 3.3 GET (útil para pruebas o integraciones simples)

```http
GET /api/discount-qr/verify?referralCode=L4D-...&shopId=tu-shop-id-bizne
```

### 3.4 Respuesta útil (éxito)

- **`ok`**: `true`
- **`couponId`**: id interno del token (cuando el cupón está en BD)
- **`payload`**: incluye al menos `promotionId`, `referralCode`, `discountPercentage`, `deviceId`, `influencerId`, `walletAddress`, y opcionales `shopId`, `brandId`, etc. según se hayan guardado al crear el cupón
- **`redemption`**
  - **`redeemable`**: si es `true`, se puede llamar a `redeem`
  - **`usedAt`**: si no es null, el cupón ya fue canjeado

Errores frecuentes: `QR_INVALID`, `PROMO_EXPIRED`, `PROMO_NOT_FOR_SHOP`, `PROMO_NOT_FOR_PRODUCT`, etc.

---

## 4. Detalle de promoción y contexto del “smart contract” (metadatos)

Tras el verify, el POS puede mostrar título, fechas y la sección comercial del contrato usando el **`promotionId`** del `payload`:

```http
GET /api/promotions/:id
```

En la respuesta, `data` incluye campos de la promoción y, si existen en documento, **`smartContract`** (`address`, `network`, `tokenStandard`, `blockchainExplorer`) y valores enriquecidos (p. ej. valor promocional en USD según lógica PSCS-1 / `promotionalValueUsd` cuando aplica).

Esto sirve para **pantalla de cajero** y trazabilidad; la **transferencia real de tokens** sigue siendo responsabilidad del servicio de settlement (§6).

---

## 5. Canjear cupón y enviar auditoría al servidor

Solo cuando el cajero confirme. El canje es **idempotente a nivel de cupón**: un segundo `redeem` con el mismo cupón ya usado devuelve error **`QR_ALREADY_REDEEMED`**.

```http
POST /api/discount-qr/redeem
Content-Type: application/json
```

### 5.1 Cuerpo mínimo

Uno de: `referralCode` | `couponCode` | `qrValue` | `token`.

Opcional: `shopId`, `productId` (misma validación que en verify).

### 5.2 Auditoría recomendada para BizneAI / POS

El backend persiste un objeto **`redeemedBy`** en el documento del token. Campos soportados (todos opcionales salvo que quieras trazabilidad fuerte):

| Campo | Descripción |
|-------|-------------|
| `readerId` | Id del lector / terminal / caja |
| `readerDeviceId` | Id del dispositivo del POS (alias: `posDeviceId`) |
| `note` | Nota libre |
| `redeemedByUserId` | Usuario que autorizó el canje en tienda (alias: `cashierUserId`, o `userId` si solo mandas uno) |
| `redeemedByUserName` | Nombre (alias: `cashierUserName`, `userName`) |
| `customerUserId` / `customerUserName` | Cliente titular si el POS lo conoce |
| `customerDeviceId` | Dispositivo del cliente; si no envías `readerDeviceId`, puedes usar `deviceId` para el cliente |
| `termsAccepted` | `true` si el cliente aceptó términos en pantalla |
| `termsAcceptedAt` | ISO 8601; si omites y `termsAccepted` es true, se usa la hora del servidor |
| `termsSummary` o `termsText` | Texto corto o resumen aceptado (auditoría) |
| `redemptionMetadata` o `metadata` | Objeto JSON con datos extra (ticket fiscal, sucursal, versión app Bizne, etc.) |
| `latitude` / `longitude` (o `lat` / `lng`) | Opcional en el body del `redeem`. También se aceptan dentro de `redemptionMetadata` o anidados en `location` / `gps`. Se guardan en `redeemedBy` para consultas. |
| `accuracy` / `locationAccuracyM` | Precisión GPS en metros (opcional). |
| `userId` | Id BizneAI del usuario que confirma el canje; se guarda en `redeemedBy.userId` (y alimenta `redeemedByUserId` si este viene vacío). |
| `redeemedAtUnix` | Epoch Unix **en segundos** al confirmar en el dispositivo. Si está dentro de la ventana tolerada respecto al servidor, `usedAt` en BD se deriva de este valor. Si el reloj está muy descalibrado, el canje **no se rechaza**: se marca `redeemedAtUnixClockSkew` y `usedAt` es hora del servidor. |
| `redeemGpsFixUnix` | Epoch Unix **en segundos** del instante del fix GPS (p. ej. `timestamp` del proveedor). |
| `redeemLatitude` / `redeemLongitude` | Lat/lng WGS84; validan rango. Generan `redeemedBy.redeemLocation` tipo `Point` para consultas geoespaciales, además de campos duplicados legados (`latitude` / `longitude`). |
| `redeemGpsAccuracyMeters` | Precisión horizontal en metros (OS / expo-location). |
| `idempotencyKey` | Clave **estable por intento de canje** (recomendado: UUID v4). Reintentos tras error de red deben reutilizar la misma clave. Ver **5.4 Idempotencia**. |

Variables opcionales (`.env`): **`REDEEM_UNIX_MAX_DRIFT_PAST_SEC`** (default 300), **`REDEEM_UNIX_MAX_DRIFT_FUTURE_SEC`** (default 120) — ventana al validar `redeemedAtUnix` vs hora del servidor.

Ejemplo (auditoría clásica):

```json
{
  "referralCode": "L4D-69da58ff77e1634e88c6fcfd-MOHTG2AC",
  "shopId": "chalino-cafeteria-pugibet-82",
  "readerId": "caja-3",
  "readerDeviceId": "bizne-pos-tablet-7f3a",
  "redeemedByUserId": "staff_8842",
  "redeemedByUserName": "María López",
  "customerDeviceId": "dev-cliente-abc",
  "termsAccepted": true,
  "termsSummary": "Acepto descuento 12% según términos mostrados en POS v2.1",
  "redemptionMetadata": {
    "source": "bizneai_pos",
    "bizneVersion": "1.4.0",
    "ticketFolio": "A-10294",
    "latitude": 19.432608,
    "longitude": -99.133209,
    "accuracy": 12.5
  }
}
```

Ejemplo **BizneAI** (GPS + Unix + idempotencia):

```json
{
  "referralCode": "L4D-xxxxxxxx",
  "shopId": "507f1f77bcf86cd799439011",
  "productId": "sku-opcional-crypto-marketing",
  "readerId": "bizne-pos-checkout",
  "readerDeviceId": "uuid-dispositivo",
  "redeemedByUserId": "42",
  "userId": "42",
  "redeemedByUserName": "María Pérez",
  "termsAccepted": true,
  "termsSummary": "Cliente aceptó términos mostrados en mostrador",
  "redeemedAtUnix": 1738250000,
  "redeemLatitude": 19.432608,
  "redeemLongitude": -99.133209,
  "redeemGpsAccuracyMeters": 12.5,
  "redeemGpsFixUnix": 1738249992,
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
  "redemptionMetadata": {
    "source": "bizneai_crypto_marketing",
    "bizneVersion": "1.24.0",
    "storeNameSnapshot": "Mi tienda"
  }
}
```

### 5.3 Consultar redenciones recientes (auditoría)

`GET /api/discount-qr/redemptions/recent?limit=50&promotionId=&shopId=`

Respuesta: lista con `couponId`, `usedAt`, datos del `payload` relevantes, `devices`, `location`, `redemptionMetadata`, `cashier` (incl. `userId`), `redeemedAtUnix`, `redeemedAtUnixClockSkew`, `redeemGpsFixUnix`, `redeemGpsAccuracyMeters`, `idempotencyKey` / huella asociada.

- Los documentos de cupón tienen **TTL** en `expiresAt`; si no configuras retención, pueden borrarse poco después de crearse. Tras un **canje exitoso**, el servidor puede alargar `expiresAt` si defines **`QR_REDEEM_RETENTION_DAYS`** (entero, días desde el canje), para conservar historial.
- Opcional: **`REDEMPTIONS_LIST_API_KEY`**. Si está definida, el cliente debe enviar header **`x-redemptions-api-key`** con el mismo valor; si no, en desarrollo el listado queda abierto (ajusta en producción).

### 5.4 Idempotencia (`idempotencyKey`)

- El cliente envía **`idempotencyKey`** en el mismo JSON del `POST /api/discount-qr/redeem` (recomendado UUID v4; en servidor: hasta 256 caracteres, `[a-zA-Z0-9._-]`).
- Se persisten **`redeemedBy.idempotencyKey`**, **`idempotencyShopId`** y **`idempotencyProductId`** (huella de `shopId` / `productId` del body) para validar replays.
- **Misma clave + mismo `shopId` y `productId`** que el canje ya registrado → **HTTP 200** con el **mismo cuerpo** que el primer éxito (replay seguro, sin repetir efectos secundarios en el handler).
- **Otra `idempotencyKey`** para un cupón **ya canjeado** → **409** `QR_ALREADY_REDEEMED`.
- **Misma `idempotencyKey`** pero **`shopId` o `productId` distintos** al canje guardado → **409** `IDEMPOTENCY_KEY_MISMATCH`.
- **Cliente sin clave**: comportamiento anterior (atomicidad del cupón; sin dedupe ante timeout de red).
- Índice único parcial sugerido en BD: `{ tokenId: 1, 'redeemedBy.idempotencyKey': 1 }` (solo documentos con redención e idempotencia).

### 5.5 Respuesta éxito

Incluye `couponId`, `payload`, `usedAt` y **`redeemedBy`** reflejando lo guardado.

---

## 6. Transferencia de tokens a la wallet del negocio (settlement)

### 6.1 Estado actual del backend

Al completarse un `redeem` exitoso:

- El cupón queda **marcado como usado** en MongoDB.
- Queda **registro de auditoría** en `redeemedBy`.

**No hay en este repositorio una llamada automática** tipo “transferir X tokens desde tesorería a `wallet_del_negocio`” inmediatamente después del `200` del redeem. Eso evita bloquear el canje si la red o el firmante fallan, y permite reintentos controlados.

### 6.2 Patrón recomendado para producción

1. **Evento de canje:** Tras `POST /api/discount-qr/redeem` con `ok: true`, el POS **o** un **worker en servidor** debe encolar un job con:  
   `couponId`, `promotionId`, `shopId`, `usedAt`, `payload`, `redeemedBy`, y el **monto en tokens** derivado de la promoción (p. ej. desde `GET /api/promotions/:id` o reglas internas PSCS-1).
2. **Wallet del negocio:** Debe resolverse de forma confiable (config por `shopId`, campo en la promoción, o catálogo BizneAI extendido). No usar solo addresses “mock” del cliente.
3. **Ejecución on-chain / custodia:** Un servicio con llaves o contrato inteligente ejecuta la transferencia y guarda `txHash` en una colección de **settlement** o en el mismo job.
4. **Reintentos e idempotencia:** Usar `couponId` + `usedAt` (o un `settlementId`) como clave para no pagar dos veces el mismo canje.

### 6.3 Evolución del producto

Si se desea **síncrono** desde el punto de vista del POS, se puede:

- Añadir al handler de `redeem` una llamada a un microservicio de pagos **después** del `findOneAndUpdate` exitoso, o  
- Exponer un segundo endpoint `POST /api/settlement/confirm` que el POS llame solo cuando el job terminó (menos acumulación de latencia en caja).

Coordina con el equipo de blockchain / PSCS-1 para el monto exacto (**1 token = 1 USD** en la narrativa del producto) y la wallet destino del negocio.

---

## 7. Referencias en este repo

| Tema | Ubicación |
|------|-----------|
| Verify / redeem | `server/routes/discountQr.js` |
| Modelo cupón + `redeemedBy` | `server/models/DiscountQrToken.js` |
| Catálogo tiendas Bizne (proxy) | `GET /api/bizne-shops`, `GET /api/bizne-shops/:id` → `server/routes/bizneShops.js` |
| Detalle promoción | `GET /api/promotions/:id` → `server/controllers/promotionController.js` |
| Contrato verify (histórico) | `docs/DISCOUNT_QR_VERIFY_ENDPOINT.md` (actualizar body con `referralCode` / `couponCode` si se unifica doc) |
| PSCS-1 | `docs/PSCS-1.md` |

---

## 8. Checklist rápido para el integrador BizneAI / POS

- [ ] Obtener **`shopId`** estable para la sucursal.
- [ ] En **verify**, enviar `shopId` si las promos usan `allowedShopIds`.
- [ ] Mostrar al cliente términos y enviar `termsAccepted` + `termsSummary` en **redeem**.
- [ ] Tras **redeem** OK, disparar **settlement de tokens** (cola/worker) con idempotencia por `couponId`.
- [ ] Registrar `txHash` o estado de fallo para soporte y conciliación.
