# Endpoint: verificar cupón (QR) – contrato para la app

La app (p. ej. LUXAE) llama a **verify** para validar el código escaneado y obtener los datos necesarios para mostrar/verificar el cupón. Este documento define el contrato del endpoint y confirma que **la lógica está implementada** en este backend (link4deal); para bizneai.com hay que desplegar el mismo backend o exponer este endpoint.

---

## Flujo en el backend: id del token → BD → validar si aplica

1. El backend **obtiene el id del cupón** del token enviado por la app. El token tiene la forma `LINK4DEAL-DISCOUNT.v1.<id>.<sig>`: se extrae `<id>` (y se valida `<sig>` con la llave del servidor).
2. Con ese **id** se **busca el cupón en la base de datos** (colección de tokens de descuento).
3. Se **valida si aplica**: promoción existente y activa, vigencia, y, si aplica en tu negocio, tienda, productos, etc. Toda esta lógica es del backend (reglas de negocio).
4. **Si no aplica** (tienda incorrecta, producto no incluido, cupón expirado, ya usado, etc.), el backend responde con **error** y un **mensaje claro** (p. ej. `"Promoción no activa"`, `"Cupón no aplica a esta tienda"`, `"QR ya redimido"`).
5. **La app** recibe esa respuesta de error y **muestra el mensaje al usuario** (`message` y, si viene, `errors`).

En resumen: **token → id → BD → validación (tienda, productos, etc.) → si no aplica, error con mensaje → la app muestra ese mensaje al usuario.**

---

## 0. Simplificación: un solo id del cupón

**No hay campos** en el payload para “shop id” ni “producto seleccionado”. Se simplifica usando **el id del cupón** como única referencia:

- **couponId** (en la respuesta de verify) = identificador único del cupón (el mismo que va dentro del QR como referencia).
- Con ese **couponId** el backend (o la app) resuelve todo:
  - El payload del verify ya trae **promotionId**; con la promoción puedes obtener producto, tienda, etc. (p. ej. `GET /api/promotions/:id`).
  - No hace falta duplicar `shopId` ni `productId` en el cupón: la promoción es el vínculo a producto/tienda.

Flujo resumido: **QR → verify → couponId + payload (promotionId, discountPercentage, walletAddress, …) → con promotionId pides detalle de promoción (producto/tienda)**.

---

## 1. Request

**Método y URL**

```http
POST /api/discount-qr/verify
Content-Type: application/json
```

**Body (exactamente lo que debe enviar la app)**

```json
{
  "qrValue": "<código escaneado del QR o ingresado a mano>"
}
```

- También se acepta el campo `token` como alias de `qrValue`: `{ "token": "<código>" }`.
- Si falta `qrValue` y `token` → **400** con `message: "qrValue/token requerido"`.

---

## 2. Respuesta éxito (cupón válido)

**HTTP 200**

```json
{
  "ok": true,
  "message": "QR válido",
  "couponId": "abc123XYZ",
  "payload": {
    "deviceId": "string",
    "influencerId": "string",
    "promotionId": "string",
    "referralCode": "string",
    "discountPercentage": 20,
    "walletAddress": "0x..."
  },
  "redemption": {
    "redeemable": true,
    "usedAt": null
  }
}
```

**Campos que la app necesita para verificar el cupón**

| Campo                   | Dónde               | Descripción breve |
|-------------------------|---------------------|-------------------|
| **couponId**            | raíz de la respuesta | **Id único del cupón.** Usar este id para toda la lógica (redimir, asociar a shop/producto vía backend). |
| **walletAddress**       | `payload.walletAddress` | Dirección asociada al cupón. |
| **discountPercentage**  | `payload.discountPercentage` | Porcentaje de descuento (0–100). |
| **promotionId**         | `payload.promotionId` | ID de la promoción; con él el backend obtiene producto/tienda (no hay shopId ni productId en el cupón). |
| **referralCode**        | `payload.referralCode` | Código de referencia. |
| **influencerId**        | `payload.influencerId` | ID del influencer (opcional). |

- **redemption.redeemable**: `true` si el cupón aún se puede redimir (one-time), `false` si ya fue usado.
- **redemption.usedAt**: `null` si no se ha redimido, fecha ISO si ya se usó.

**Producto / tienda:** no vienen en el payload del cupón. Se resuelven con **promotionId** (p. ej. `GET /api/promotions/:id`); la promoción tiene el contexto de producto y tienda. Toda la lógica de “a qué shop o producto aplica” se simplifica usando **couponId** + **promotionId**.

---

## 3. Respuestas de error (códigos unificados)

Cuando el cupón **no aplica**, el backend responde con **`errorCode`** y **`message`**. La app debe mostrar **`message`** al usuario y puede usar **`errorCode`** para lógica o traducciones.

**Códigos y mensajes que envía el backend:**

| errorCode | message |
|-----------|--------|
| **PROMO_NOT_FOR_SHOP** | La promoción existe pero no está habilitada para esta tienda. |
| **PROMO_NOT_FOR_PRODUCT** | La promoción existe pero no aplica para este producto. |
| **PROMO_NOT_UNDER_TERMS** | La promoción existe pero no aplica bajo estos términos. |
| **PROMO_ONE_PER_PERSON** | La promoción solo permite un producto por persona. |
| **PROMO_INACTIVE** | La promoción no está activa. |
| **PROMO_EXPIRED** | La promoción ha expirado. |
| **PROMO_NOT_FOUND** | Promoción no encontrada. |
| **QR_INVALID** | Código QR inválido o expirado. |
| **QR_ALREADY_REDEEMED** | Este cupón ya fue redimido. |

**Formato de respuesta de error (siempre incluye `errorCode` y `message`):**

```json
{
  "ok": false,
  "errorCode": "PROMO_INACTIVE",
  "message": "La promoción no está activa.",
  "errors": [{ "code": "PROMO_INACTIVE", "message": "La promoción no está activa." }],
  "payload": { ... }
}
```

**Validación por tienda/producto:** si la app envía `shopId` o `productId` en el body de verify (o query en GET), el backend comprueba si la promoción tiene `allowedShopIds` / `allowedProductIds` y responde **PROMO_NOT_FOR_SHOP** o **PROMO_NOT_FOR_PRODUCT** cuando no aplica.

---

## 4. Lógica que debe tener el backend (ya implementada aquí)

1. Recibir `{ "qrValue": "<código>" }` (o `token`).
2. Validar el token:
   - **Formato referencia** `LINK4DEAL-DISCOUNT.v1.<id>.<sig>`: verificar firma con `QR_SIGN_KEY`, buscar token por `id` en BD, comprobar que no esté expirado.
   - **Formato legacy** (7 partes): verificar firma y descifrar con `QR_ENC_KEY`/`QR_SIGN_KEY` si aplica.
3. Reglas de negocio: promoción existente y activa, vigencia, `discountPercentage` 0–100, etc.
4. Responder con `ok: true`, `payload` (con `walletAddress`, `discountPercentage`, `promotionId`, etc.) y `redemption` (redeemable, usedAt).

**Implementación en este repo**

- Ruta: `server/routes/discountQr.js` → `POST /verify`
- Validación: `server/utils/qrCrypto.js` (`verifyReferenceQrToken`, `verifyAndDecodeQrToken`)
- Modelo: `server/models/DiscountQrToken.js`
- Montaje en app: `server/index.js` → `app.use('/api/discount-qr', ...)`

Variables de entorno necesarias en el servidor (p. ej. bizneai.com):

```env
QR_PREFIX=LINK4DEAL-DISCOUNT
QR_VERSION=v1
QR_SIGN_KEY=<base64 de 32 bytes>
QR_TTL_SECONDS=300
```

Y MongoDB con la colección de tokens (creada por `create`).

---

## 5. Para bizneai.com

Si el backend de **bizneai.com** aún no tiene este endpoint:

- **Opción A:** Desplegar en bizneai el mismo backend de este repo (Node + `server/routes/discountQr.js`, modelo `DiscountQrToken`, `qrCrypto`, env de QR) y exponer `POST https://www.bizneai.com/api/discount-qr/verify` con el contrato anterior.
- **Opción B:** Implementar en bizneai un único endpoint que cumpla este contrato (mismo request/response y mismas validaciones), reutilizando la lógica de `server/utils/qrCrypto.js` y `server/routes/discountQr.js` (verify) si comparten código.

La app solo necesita que **POST /api/discount-qr/verify** exista y responda como en las secciones 1–3 (en especial `payload.walletAddress`, `payload.discountPercentage`, `payload.promotionId` y `redemption.redeemable`).

---

## 6. Puertos en este proyecto

- **Backend (API):** por defecto usa el puerto **3000** (`server/.env` → `PORT=3000`). Al ejecutar `npm run server` o `node server/index.js`, la API queda en `http://localhost:3000`.
- **Frontend (Vite):** en desarrollo corre en el puerto **5173** y hace proxy de `/api` y `/uploads` a `http://localhost:3000`.
- En producción el puerto puede ser otro (p. ej. PM2 con `PORT=5001`) o no verse si Nginx hace proxy; la URL será la del dominio (ej. `https://www.damecodigo.com/api/...`).

**Ejemplos de verify con puerto 3000 (local):**

```bash
# GET (ver JSON del cupón)
curl -s "http://localhost:3000/api/discount-qr/verify?qrValue=LINK4DEAL-DISCOUNT.v1.XXX.sig"

# POST (lo que usa la app)
curl -s -X POST "http://localhost:3000/api/discount-qr/verify" \
  -H "Content-Type: application/json" \
  -d '{"qrValue":"LINK4DEAL-DISCOUNT.v1.XXX.sig"}'
```
