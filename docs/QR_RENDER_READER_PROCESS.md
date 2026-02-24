# Proceso de Renderizado y Lectura QR (One-Time Redemption)

Este documento describe qué debe hacer la app que **renderiza** el QR (cliente) y qué debe hacer el **lector/scanner** para validar y redimir una sola vez.

## 1) Formato esperado del QR

Token por referencia (corto):

```text
LINK4DEAL-DISCOUNT.v1.<id>.<sig>
```

- `<id>`: identificador corto del token guardado en backend.
- `<sig>`: firma HMAC para evitar manipulación.
- El payload completo **no viaja** en el QR; se almacena en servidor.

## 2) Flujo de renderizado en app (cliente)

### Paso A: solicitar token QR al backend

`POST /api/discount-qr/create`

Body mínimo:

```json
{
  "deviceId": "dev-abc",
  "influencerId": "user-or-guest",
  "promotionId": "mongoObjectId",
  "referralCode": "L4D-....",
  "discountPercentage": 10,
  "walletAddress": "optional-or-placeholder"
}
```

Respuesta esperada:

```json
{
  "ok": true,
  "qrValue": "LINK4DEAL-DISCOUNT.v1.<id>.<sig>",
  "prefix": "LINK4DEAL-DISCOUNT",
  "version": "v1",
  "ttlSeconds": 300
}
```

### Paso B: renderizar imagen QR en cliente

- Usar `qrValue` completo como texto del QR.
- Recomendado para legibilidad:
  - `width >= 300`
  - `errorCorrectionLevel: "L"` o `"M"`
  - `margin: 1` o `2`

### Paso C: UX recomendada

- Mostrar estado de emisión (`generando` -> `listo`).
- Mostrar tiempo de expiración (`ttlSeconds`).
- Mensaje claro: “Este cupón se puede redimir una sola vez”.

## 3) Flujo de lectura en lector/scanner

### Paso 1: lectura previa (opcional)

`POST /api/discount-qr/verify`

Útil para:
- validar firma
- recuperar payload
- saber si aún está redimible (`redemption.redeemable`)

### Paso 2: redención final (obligatorio para consumo)

`POST /api/discount-qr/redeem`

Body:

```json
{
  "qrValue": "LINK4DEAL-DISCOUNT.v1.<id>.<sig>",
  "readerId": "scanner-pos-01",
  "readerDeviceId": "android-123",
  "note": "Caja 3"
}
```

Comportamiento esperado:
- Primer uso válido: `200` y `ok: true`.
- Reuso del mismo QR: `409` y mensaje `QR ya redimido`.
- Expirado: `400` con `QR expired`.
- Token inexistente/alterado: `404` o `400` según caso.

## 4) Reglas de negocio y validación

Durante verify/redeem se valida:
- Promoción existe.
- Promoción activa y vigente (validFrom/validUntil).
- discountPercentage en rango (0-100).
- Influencer válido (si viene como ObjectId).

## 5) Qué debe hacer cada lado

- **App render**:
  - solo crear y mostrar QR
  - no decide redención final
- **Lector/scanner**:
  - siempre llamar `redeem` para aplicar descuento
  - manejar `409` como “cupón ya usado”

## 6) Checklist de integración

- [ ] `QR_SIGN_KEY` configurado en backend.
- [ ] Endpoint `create` integrado en botón “Pedir/Solicitar cupón”.
- [ ] Imagen QR renderizada con tamaño suficiente.
- [ ] Lector integrado con endpoint `redeem`.
- [ ] Manejo de errores UX (`expirado`, `ya usado`, `inválido`).

