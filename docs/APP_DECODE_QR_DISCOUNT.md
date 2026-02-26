# Lógica en la app: decodificar código de descuento (QR)

Este documento describe **solo** la lógica que debe implementar la app (cliente/lector) para **extraer del QR** el **id** (y opcionalmente validar formato). El **address** (wallet), `promotionId` y el resto de datos se obtienen **desde el backend** al enviar el token o el id.

---

## 1. Formato del token en el QR

El texto que contiene el QR (o el código manual que el usuario pega) tiene una de estas formas:

### Formato referencia (recomendado, 4 partes)

```text
LINK4DEAL-DISCOUNT.v1.<id>.<sig>
```

- **Parte 0** – `prefix`: `LINK4DEAL-DISCOUNT`
- **Parte 1** – `version`: `v1`
- **Parte 2** – **`id`**: identificador único del token en backend (referencia). Es lo que la app debe extraer para enviar al backend.
- **Parte 3** – `sig`: firma HMAC (opaca). **No se valida en la app**; la validación la hace el backend.

### Formato legacy (7 partes, cifrado)

Si el QR viene del formato antiguo cifrado, el string tiene 7 partes. En ese caso la app **no puede** decodificar payload ni address sin las llaves del servidor. Lo correcto es enviar el **string completo** al backend y que el backend devuelva id, address y lo demás.

---

## 2. Decodificación en la app (solo id y formato)

La app **no tiene** las llaves (`QR_SIGN_KEY`, etc.), por tanto:

- **Sí hace:** parsear el string y extraer **id** (y comprobar que el formato sea el esperado).
- **No hace:** verificar firma ni descifrar payload. Eso lo hace el backend.

### Algoritmo (pseudocódigo / TypeScript)

```ts
const QR_PREFIX = 'LINK4DEAL-DISCOUNT';
const QR_VERSION = 'v1';

interface DecodedDiscountQr {
  valid: boolean;
  id: string | null;       // tokenId (formato referencia) – enviar al backend
  fullValue: string;       // string completo – enviar a verify/redeem
  prefix?: string;
  version?: string;
  error?: string;
}

function decodeDiscountCode(qrValue: string): DecodedDiscountQr {
  const fullValue = String(qrValue ?? '').trim();
  if (!fullValue) {
    return { valid: false, id: null, fullValue: '', error: 'Código vacío' };
  }

  const parts = fullValue.split('.');
  const prefix = parts[0];
  const version = parts[1];

  // Formato referencia: LINK4DEAL-DISCOUNT.v1.<id>.<sig>
  if (parts.length === 4 && prefix === QR_PREFIX && version === QR_VERSION) {
    const id = parts[2];
    // sig = parts[3] – no se usa en cliente, el backend valida
    if (!id) {
      return { valid: false, id: null, fullValue, error: 'ID de token vacío' };
    }
    return {
      valid: true,
      id,
      fullValue,
      prefix,
      version
    };
  }

  // Formato legacy (7 partes) u otro: no decodificar aquí, enviar fullValue al backend
  if (parts.length >= 4 && prefix === QR_PREFIX) {
    return {
      valid: true,
      id: null,
      fullValue,
      prefix,
      version,
      error: 'Formato legacy o extenso; usar fullValue en backend'
    };
  }

  return {
    valid: false,
    id: null,
    fullValue,
    error: 'Formato de código de descuento no reconocido'
  };
}
```

### Resumen de salida

| Salida   | Uso en la app |
|----------|----------------|
| `id`     | Identificador del token (formato 4 partes). Enviar al backend si se usa un endpoint que acepte solo id (o enviar `fullValue`). |
| `fullValue` | Siempre enviar esto en `POST /api/discount-qr/verify` o `POST /api/discount-qr/redeem` como `qrValue` o `token`. |
| `valid`  | Indica si el formato es reconocido (prefix/version correctos). Si `false`, mostrar “Código inválido” sin llamar al backend. |

---

## 3. Address e id: vienen del backend

- **Id (tokenId):** la app lo puede extraer del string en formato referencia (parte 2). Si no se parsea (formato legacy), el backend lo resuelve al hacer verify/redeem.
- **Address (wallet):** **no** está en el texto del QR en formato referencia. El backend lo devuelve dentro del **payload** al llamar a:
  - `POST /api/discount-qr/verify`, o
  - `POST /api/discount-qr/redeem`

Ejemplo de respuesta del backend (verify o redeem):

```json
{
  "ok": true,
  "payload": {
    "deviceId": "...",
    "influencerId": "...",
    "promotionId": "...",
    "referralCode": "...",
    "discountPercentage": 20,
    "walletAddress": "0x...",
    "iat": 1710000000,
    "exp": 1710000300,
    "jti": "..."
  }
}
```

En la app, usar:

- **id / tokenId:** bien el extraído por `decodeDiscountCode(qrValue).id`, bien el que el backend asocie al token.
- **address:** siempre desde `payload.walletAddress` de la respuesta del backend.

---

## 4. Flujo recomendado en la app

1. **Leer** el QR (o el código manual) → string `qrValue`.
2. **Decodificar** en cliente con `decodeDiscountCode(qrValue)`:
   - Si `valid === false` → mostrar “Código inválido” y no llamar al backend.
   - Si `valid === true` → usar `fullValue` (y opcionalmente `id`) para el siguiente paso.
3. **Enviar al backend** el string completo:
   - `POST /api/discount-qr/verify` con `{ "qrValue": fullValue }` para validar y obtener payload (incl. `walletAddress`, `promotionId`, etc.).
   - O `POST /api/discount-qr/redeem` con `{ "qrValue": fullValue, "readerId": "...", ... }` para redimir y obtener el mismo payload.
4. **En la app:** usar de la respuesta solo lo que necesites (p. ej. `payload.walletAddress`, `payload.promotionId`); el resto ya lo tendréis por medio del backend.

---

## 5. Resumen

| Qué necesita la app decodificar | Dónde |
|----------------------------------|--------|
| **Id (tokenId)**                 | Del string: `parts[2]` cuando `parts.length === 4` y prefix/version correctos. |
| **Address (wallet)**             | No se decodifica del QR; se usa **siempre** el que devuelve el backend en `payload.walletAddress`. |
| **Resto (promotionId, descuento, etc.)** | Todo por backend en `payload` de verify/redeem. |

La app solo implementa la lógica de **parseo y extracción de id** (y comprobación de formato) descrita en la sección 2; la validación de firma, expiración y la entrega de address y datos completos es responsabilidad del backend.
