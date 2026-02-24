# Discount QR API (Issuer + Scanner)

Implementación backend para:
- Generar token QR firmado + cifrado (`issuer`)
- Leer/validar token QR al escanear (`scanner`)

## Variables de entorno requeridas (modo referencia)

Agregar en `server/.env`:

```env
QR_PREFIX=LINK4DEAL-DISCOUNT
QR_VERSION=v1
QR_SIGN_KEY=<base64 de 32 bytes>
QR_TTL_SECONDS=300
```

Notas:
- En modo referencia, solo se requiere `QR_SIGN_KEY`.
- `QR_ENC_KEY` solo es necesaria para compatibilidad con tokens legacy cifrados.
- No exponer estas llaves en frontend.

## Formato del token QR (recomendado)

```text
LINK4DEAL-DISCOUNT.v1.<id>.<sig>
```

El payload completo se guarda en backend (colección `discountqrtokens`) y se recupera al verificar.

## Endpoints

### `POST /api/discount-qr/create`

Body:

```json
{
  "deviceId": "device-123",
  "influencerId": "65f...",
  "promotionId": "65f...",
  "referralCode": "SAUL20",
  "discountPercentage": 20,
  "walletAddress": "0xabc..."
}
```

Respuesta:

```json
{
  "ok": true,
  "qrValue": "LINK4DEAL-DISCOUNT.v1....",
  "prefix": "LINK4DEAL-DISCOUNT",
  "version": "v1",
  "ttlSeconds": 300
}
```

### `POST /api/discount-qr/verify`

Body:

```json
{
  "qrValue": "LINK4DEAL-DISCOUNT.v1...."
}
```

Respuesta:

```json
{
  "ok": true,
  "message": "QR válido",
  "payload": {
    "deviceId": "device-123",
    "influencerId": "65f...",
    "promotionId": "65f...",
    "referralCode": "SAUL20",
    "discountPercentage": 20,
    "walletAddress": "0xabc...",
    "iat": 1710000000,
    "exp": 1710000300,
    "jti": "..."
  }
}
```

### `POST /api/discount-qr/redeem` (one-time)

Body:

```json
{
  "qrValue": "LINK4DEAL-DISCOUNT.v1.<id>.<sig>",
  "readerId": "scanner-pos-01",
  "readerDeviceId": "android-123",
  "note": "Caja 3"
}
```

Respuesta éxito:

```json
{
  "ok": true,
  "message": "QR redimido exitosamente",
  "payload": {
    "deviceId": "device-123",
    "influencerId": "65f...",
    "promotionId": "65f...",
    "referralCode": "SAUL20",
    "discountPercentage": 20,
    "walletAddress": "0xabc..."
  },
  "usedAt": "2026-02-24T05:00:00.000Z"
}
```

Si se intenta usar de nuevo:
- HTTP `409`
- `{"ok":false,"message":"QR ya redimido","usedAt":"..."}`

## Validaciones de negocio incluidas

- Promoción debe existir.
- Promoción debe estar `active`.
- Ventana de vigencia (`validFrom` / `validUntil`).
- `discountPercentage` entre 0 y 100.
- Si `influencerId` es ObjectId, debe existir.

