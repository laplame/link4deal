# JSON del cupón, renderizado y endpoints

## 1. Crear cupón (issuer)

El cupón **no se pide por GET con un id** después de crearlo. Se crea con POST (o GET) y la respuesta se usa directamente en el modal.

### Endpoint para crear

| Método | URL | Uso |
|--------|-----|-----|
| **POST** | `/api/discount-qr/create` | Body JSON con los campos requeridos (desde el formulario "Solicitar cupón") |
| **GET**  | `/api/discount-qr/create?deviceId=...&influencerId=...&promotionId=...&referralCode=...&discountPercentage=...&walletAddress=...` | Mismo flujo por query (p. ej. desde app o enlace) |

### Body (POST) / Query (GET)

```json
{
  "deviceId": "dev-1734567890-abc123",
  "influencerId": "userId-o-guest",
  "promotionId": "69a8e15cf8e811c8129b494c",
  "referralCode": "L4D-69ab902b0d4f6db400965dce-MMFQPJE7",
  "discountPercentage": 15,
  "walletAddress": "not-provided"
}
```

### Respuesta exitosa (create)

```json
{
  "ok": true,
  "qrValue": "LINK4DEAL-DISCOUNT.v1.FZa0VhYiiblu.52.T-3YQvMHnS7JoNB94QIMq2vdnH6MdMDjvqteXB409gE",
  "prefix": "LINK4DEAL-DISCOUNT",
  "version": "v1",
  "ttlSeconds": 120,
  "businessWarnings": []
}
```

- **qrValue**: string que se codifica en el QR y se muestra como "Token QR". Formato referencia: `PREFIX.v1.<tokenId>.<discountPct>.<sig>`.
- **prefix**, **version**, **ttlSeconds**: metadatos para el cliente.
- **businessWarnings**: si hay avisos de negocio (ej. promoción no activa) pero no se bloqueó la creación.

### Respuesta de redirección (sin QR)

Cuando la promoción tiene **redirectInsteadOfQr** activado (p. ej. productos que se compran en Amazon), el create **no genera token ni QR**. La respuesta es:

```json
{
  "ok": true,
  "noQr": true,
  "redirectToUrl": "https://amzn.to/3NfsW8K"
}
```

- **noQr**: indica que no hay QR; el cliente debe mostrar un botón de redirección en lugar del código QR.
- **redirectToUrl**: URL a la que enviar al usuario. Para **Amazon**: si la promoción no define `redirectToUrl` se usa `https://amzn.to/3NfsW8K`. Si el usuario guarda una URL de producto Amazon (ej. `https://www.amazon.com.mx/dp/B0DMV3BMGP?th=1`), el backend construye la URL de afiliado añadiendo o reemplazando el parámetro `tag` con el tag de afiliado configurado (por defecto `jalme-20`, configurable con `AMAZON_AFFILIATE_TAG`). Para otras tiendas (Adidas, etc.) se devuelve la URL tal cual.

---

## 2. JSON que usa el modal "¡Cupón Generado!"

El modal no recibe un único JSON de “cupón”; construye el estado a partir de:

1. **Respuesta del create** (`ok`, `qrValue`, o bien `ok`, `noQr`, `redirectToUrl`).
2. **Estado local del componente** (`couponCode`, `countdownSeconds`, etc.).

Estructura lógica que representa lo que se muestra:

```json
{
  "message": "Tu cupón ha sido creado exitosamente. Escanea el código QR o usa el código manual.",
  "couponCode": "L4D-69ab902b0d4f6db400965dce-MMFQPJE7",
  "qrValue": "LINK4DEAL-DISCOUNT.v1.FZa0VhYiiblu.52.T-3YQvMHnS7JoNB94QIMq2vdnH6MdMDjvqteXB409gE",
  "validForSeconds": 120,
  "qrImageDataUrl": "data:image/png;base64,...",
  "smartContract": {
    "address": "0x4c494e4b344445414c2d444953434f554e542e76",
    "networks": ["Solana", "XRP", "Ethereum", "Avalanche"],
    "viewUrl": "/promocion/{productId}/smart-contract"
  }
}
```

- **couponCode**: generado en cliente como `L4D-{productId}-{Date.now().toString(36).toUpperCase()}`.
- **qrValue**: viene del backend en la respuesta de create (o fallback local si falla).
- **qrImageDataUrl**: generado en cliente con `qrcode.toDataURL(qrValue)`.
- **smartContract.address**: derivado del `qrValue` en el cliente (mockup); el enlace "Ver smart contract" apunta a `/promocion/:productId/smart-contract`.

---

## 3. Cómo se renderiza el modal

Componente: `src/components/CouponRequestForm.tsx`.

- **Paso 1** – Formulario: nombre, WhatsApp.
- **Paso 2** – Al enviar (o auto): se llama a **POST /api/discount-qr/create**. Si la respuesta tiene `noQr` y `redirectToUrl`, no se genera QR y se muestra la pantalla de redirección; si no, se guardan `qrValue`, `couponCode` y se genera la imagen QR con `qrcode.toDataURL(qrValue)`.
- **Paso 3** – Pantalla resultado (`step === 'qr'`):
  - **Con QR**: título "¡Cupón Generado!", QR, código, countdown, botones WhatsApp/Redimir.
  - **Con redirección** (`noQr` + `redirectToUrl`): título "¡Comprar en Amazon!", botón "Comprar en Amazon" que abre `redirectToUrl` en nueva pestaña, botón Cerrar.
  - Mensaje: "Tu cupón ha sido creado exitosamente. Escanea el código QR o usa el código manual."
  - Imagen: `<img src={qrImageDataUrl} />` (QR del `qrValue`).
  - Contador: "Válido por M:SS" con `countdownSeconds` (2 minutos).
  - Código del cupón: `couponCode`.
  - Token QR: texto `qrValue`.
  - Bloque Smart contract: dirección derivada del `qrValue`, chips Solana/XRP/Ethereum/Avalanche, enlace "Ver smart contract" → `/promocion/${productId}/smart-contract`.
  - Botones: "Contactar por WhatsApp", "Redimir cupón", "Cerrar".
  - Texto: "Envíame este cupón a mi app".

No hay una llamada GET adicional para “obtener el cupón” después de crearlo; todo se muestra con la respuesta de create + estado local.

---

## 4. Endpoint para “pedir” el JSON del cupón (verificar / leer)

Para **validar** un cupón ya generado (p. ej. cuando alguien escanea el QR), se usa **verify**. Con eso obtienes el payload del cupón (promotionId, descuento, etc.).

### GET (consultar/ver el cupón por token)

| Método | URL | Uso |
|--------|-----|-----|
| **GET**  | `/api/discount-qr/verify?qrValue=<token>` | Ver el JSON del cupón sin redimir. Opcional: `&shopId=...&productId=...` para validar tienda/producto. |
| **POST** | `/api/discount-qr/verify` | Mismo flujo; body: `{ "qrValue": "<token>", "shopId": "...", "productId": "..." }`. |

Ejemplo:

```http
GET /api/discount-qr/verify?qrValue=LINK4DEAL-DISCOUNT.v1.FZa0VhYiiblu.52.T-3YQvMHnS7JoNB94QIMq2vdnH6MdMDjvqteXB409gE
```

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
    "discountPercentage": 15,
    "walletAddress": "not-provided"
  },
  "redemption": {
    "redeemable": true,
    "usedAt": null
  }
}
```

- **couponId**: id del token (parte del `qrValue`).
- **payload**: datos del cupón (promoción, % descuento, etc.).
- **redemption.redeemable**: si aún se puede redimir; **usedAt**: fecha de redención si ya se usó.

Para más detalle de la promoción (producto, marca, etc.) se usa **GET /api/promotions/:id** con `payload.promotionId`.

---

## 5. Resumen

| Acción | Método | Endpoint | Respuesta relevante |
|--------|--------|----------|----------------------|
| Crear cupón (mostrar QR en modal) | POST | `/api/discount-qr/create` | `ok`, `qrValue`, `prefix`, `version`, `ttlSeconds` |
| Crear cupón por query | GET | `/api/discount-qr/create?deviceId=...&...` | Igual que POST |
| Ver/validar cupón (obtener JSON del cupón) | GET | `/api/discount-qr/verify?qrValue=<token>` | `ok`, `couponId`, `payload`, `redemption` |
| Ver/validar cupón (body) | POST | `/api/discount-qr/verify` | Igual que GET |
| Redimir cupón (one-time) | POST | `/api/discount-qr/redeem` | `ok`, estado de redención |

No existe un **GET /api/coupons/:id** para “traer un cupón por id”. El cupón se crea con create y se consulta/valida con verify usando el `qrValue` (token completo).
