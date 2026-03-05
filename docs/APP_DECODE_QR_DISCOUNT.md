# QR de descuento Link4Deal – Lógica completa

Este documento describe **qué información lleva el QR**, **cómo se genera**, **cómo se debe leer** y la **lógica en la app** (decodificación y uso del backend). Incluye el **porcentaje de descuento dentro del string** del QR.

---

## 1. Qué información lleva el QR (contenido del string)

El texto que contiene el código QR (o el código que el usuario pega a mano) es un **único string** con una de las formas siguientes.

### Formato recomendado (5 partes) – con porcentaje de descuento en el string

```text
LINK4DEAL-DISCOUNT.v1.<id>.<pct>.<sig>
```

| Parte  | Nombre   | Descripción |
|--------|----------|-------------|
| 0      | `prefix` | Siempre `LINK4DEAL-DISCOUNT` |
| 1      | `version` | Siempre `v1` |
| 2      | **`id`** | Identificador único del token en el backend (referencia). La app lo extrae para enviar a verify/redeem. |
| 3      | **`pct`** | **Porcentaje de descuento** (0–100). Número entero en texto. Ej: `20` = 20% de descuento. La app puede mostrarlo sin llamar al backend. |
| 4      | `sig` | Firma HMAC (opaca). **No se valida en la app**; la valida el backend. |

**Ejemplo:** `LINK4DEAL-DISCOUNT.v1.abc123XYZ.25.xYz_Sig...` → token `abc123XYZ`, **25%** de descuento.

### Formato legacy (4 partes) – sin porcentaje en el string

```text
LINK4DEAL-DISCOUNT.v1.<id>.<sig>
```

- Mismo esquema que antes pero **sin** la parte `pct`. El porcentaje solo se obtiene del backend en verify/redeem.
- Sigue siendo válido para compatibilidad con QRs ya emitidos.

### Formato legacy (7 partes) – cifrado

Si el QR viene del formato antiguo cifrado, el string tiene 7 partes. La app **no puede** decodificar payload ni address sin las llaves del servidor. Debe enviar el **string completo** al backend; el backend devuelve id, address, discountPercentage, etc.

---

## 2. Cómo se hace el QR (generación)

### Quién genera el string: el backend

1. La app (o el sitio) que quiere **mostrar** un cupón llama a:
   ```http
   POST /api/discount-qr/create
   Content-Type: application/json
   ```
   Con body mínimo:
   ```json
   {
     "deviceId": "dev-abc",
     "influencerId": "user-or-guest",
     "promotionId": "mongoObjectId",
     "referralCode": "L4D-...",
     "discountPercentage": 20,
     "walletAddress": "0x... o placeholder"
   }
   ```

2. El backend:
   - Crea un registro en BD (token con `tokenId`, payload, `expiresAt`, etc.).
   - Genera el string del QR con **porcentaje incluido**: `createReferenceQrToken(tokenId, discountPercentage)` → formato de **5 partes** `LINK4DEAL-DISCOUNT.v1.<id>.<pct>.<sig>`.

3. La respuesta incluye el valor exacto a meter en el QR:
   ```json
   {
     "ok": true,
     "qrValue": "LINK4DEAL-DISCOUNT.v1.abc123.20.xYz...",
     "prefix": "LINK4DEAL-DISCOUNT",
     "version": "v1",
     "ttlSeconds": 300
   }
   ```

### Cómo renderizar la imagen QR en la app

- **Contenido:** usar el string **completo** `qrValue` como texto del QR (no solo el id).
- **Recomendaciones:**
  - Tamaño: ancho/alto ≥ 300 px.
  - Nivel de corrección de errores: `L` o `M`.
  - Margen: 1–2 módulos.
- Cualquier librería estándar de generación de QR (p. ej. `qrcode` en Node, o el equivalente en la app móvil) que reciba un string y genere la imagen es válida.

Resumen: **el backend devuelve `qrValue` (string con id + porcentaje + firma); la app solo tiene que generar la imagen QR a partir de ese string.**

---

## 3. Cómo se debe leer el QR (lectura y decodificación en la app)

### Paso 1: Leer el código

- El usuario escanea el QR o pega el código a mano.
- La app obtiene un único string: `qrValue` (ej. `LINK4DEAL-DISCOUNT.v1.abc123.20.xYz...`).

### Paso 2: Decodificar en la app (extraer id, porcentaje y validar formato)

La app **no tiene** las llaves del servidor, por tanto:

- **Sí hace:** parsear el string y extraer **id**, **porcentaje de descuento** (si está en el string) y comprobar que el formato sea reconocido.
- **No hace:** verificar firma ni descifrar payload; eso lo hace el backend.

Algoritmo (TypeScript / pseudocódigo):

```ts
const QR_PREFIX = 'LINK4DEAL-DISCOUNT';
const QR_VERSION = 'v1';

interface DecodedDiscountQr {
  valid: boolean;
  id: string | null;           // tokenId – enviar al backend
  discountPercentage: number | null;  // 0–100 si viene en el string (formato 5 partes)
  fullValue: string;            // string completo – enviar a verify/redeem
  prefix?: string;
  version?: string;
  error?: string;
}

function decodeDiscountCode(qrValue: string): DecodedDiscountQr {
  const fullValue = String(qrValue ?? '').trim();
  if (!fullValue) {
    return { valid: false, id: null, discountPercentage: null, fullValue: '', error: 'Código vacío' };
  }

  const parts = fullValue.split('.');
  const prefix = parts[0];
  const version = parts[1];

  // Formato con porcentaje: LINK4DEAL-DISCOUNT.v1.<id>.<pct>.<sig> (5 partes)
  if (parts.length === 5 && prefix === QR_PREFIX && version === QR_VERSION) {
    const id = parts[2];
    const pctStr = parts[3];
    const pct = parseInt(pctStr, 10);
    const discountPercentage = Number.isFinite(pct) && pct >= 0 && pct <= 100 ? pct : null;
    if (!id) {
      return { valid: false, id: null, discountPercentage: null, fullValue, error: 'ID de token vacío' };
    }
    return {
      valid: true,
      id,
      discountPercentage,
      fullValue,
      prefix,
      version
    };
  }

  // Formato legacy 4 partes: LINK4DEAL-DISCOUNT.v1.<id>.<sig>
  if (parts.length === 4 && prefix === QR_PREFIX && version === QR_VERSION) {
    const id = parts[2];
    if (!id) {
      return { valid: false, id: null, discountPercentage: null, fullValue, error: 'ID de token vacío' };
    }
    return {
      valid: true,
      id,
      discountPercentage: null,  // no viene en el string
      fullValue,
      prefix,
      version
    };
  }

  // Formato legacy 7 partes u otro: enviar fullValue al backend
  if (parts.length >= 4 && prefix === QR_PREFIX) {
    return {
      valid: true,
      id: null,
      discountPercentage: null,
      fullValue,
      prefix,
      version,
      error: 'Formato legacy o extenso; usar fullValue en backend'
    };
  }

  return {
    valid: false,
    id: null,
    discountPercentage: null,
    fullValue,
    error: 'Formato de código de descuento no reconocido'
  };
}
```

### Uso de la decodificación

| Salida               | Uso en la app |
|----------------------|----------------|
| `id`                 | Identificador del token. Se puede usar en endpoints que acepten solo id; en verify/redeem se suele enviar `fullValue`. |
| `discountPercentage` | Si el formato es de 5 partes, la app puede **mostrar el % de descuento** antes de llamar al backend (ej. "20% de descuento"). Si es null, mostrar el % cuando llegue en la respuesta de verify/redeem. |
| `fullValue`          | **Siempre** enviar esto en `POST /api/discount-qr/verify` o `POST /api/discount-qr/redeem` como `qrValue` (o `token`). |
| `valid`              | Si `false`, mostrar "Código inválido" y no llamar al backend. |

---

## 4. Flujo completo recomendado en la app

1. **Leer** el QR (o código manual) → string `qrValue`.
2. **Decodificar** en cliente con `decodeDiscountCode(qrValue)`:
   - Si `valid === false` → mostrar "Código inválido" y no llamar al backend.
   - Si `valid === true`:
     - Opcional: si `discountPercentage !== null`, mostrar de inmediato "X% de descuento".
     - Usar `fullValue` para el siguiente paso.
3. **Enviar al backend** el string completo:
   - `POST /api/discount-qr/verify` con `{ "qrValue": fullValue }` para validar y obtener payload (walletAddress, promotionId, discountPercentage, etc.).
   - O `POST /api/discount-qr/redeem` con `{ "qrValue": fullValue, "readerId": "...", ... }` para redimir.
4. **En la app:** usar de la respuesta lo que necesites (`payload.walletAddress`, `payload.promotionId`, `payload.discountPercentage`). Si ya mostraste el % desde el string, puedes mantenerlo o reemplazarlo por el del backend (el backend es la fuente de verdad).

---

## 5. Dónde está cada dato

| Dato                 | Dónde se obtiene |
|----------------------|-------------------|
| **id (tokenId)**     | Del string: `parts[2]` en formato 4 o 5 partes. |
| **Porcentaje de descuento** | **En el string** (formato 5 partes): `parts[3]` (0–100). Si formato 4 partes, solo en respuesta del backend: `payload.discountPercentage`. |
| **Address (wallet)** | Siempre del backend: `payload.walletAddress` en verify/redeem. |
| **promotionId, referralCode, etc.** | Siempre del backend en `payload` de verify/redeem. |

La app implementa la **lectura del string**, **parseo y extracción de id y porcentaje** (y comprobación de formato) como en la sección 3. La **validación de firma**, expiración y la entrega de address y resto de datos es responsabilidad del backend.

---

## 6. Resumen del formato del string (qué lleva el QR)

| Formato   | Partes | Ejemplo | Porcentaje en el string |
|-----------|--------|---------|--------------------------|
| Recomendado | 5     | `LINK4DEAL-DISCOUNT.v1.abc123.20.sig` | Sí (`20` = 20%) |
| Legacy    | 4     | `LINK4DEAL-DISCOUNT.v1.abc123.sig`    | No (solo en backend) |
| Legacy cifrado | 7  | (string largo cifrado)                 | Dentro del payload en backend |

El backend, al crear el cupón con `POST /api/discount-qr/create`, genera desde **v1** el formato de **5 partes** incluyendo el porcentaje de descuento en el string del mensaje del QR.

---

## 7. Mismo endpoint para web y app (POST y GET)

Pedir el cupón se puede hacer por **POST** o por **GET**; la respuesta es la misma.

### POST (recomendado desde web o cuando se envían muchos datos)

- **URL:** `POST /api/discount-qr/create`
- **Body (JSON):** `deviceId`, `influencerId`, `promotionId`, `referralCode`, `discountPercentage`, `walletAddress`.
- **Respuesta:** `{ ok: true, qrValue, prefix, version, ttlSeconds, businessWarnings? }`.

### GET (útil para la app o un enlace directo)

- **URL:** `GET /api/discount-qr/create?deviceId=...&influencerId=...&promotionId=...&referralCode=...&discountPercentage=20&walletAddress=...`
- **Query params obligatorios:** `deviceId`, `influencerId`, `promotionId`, `referralCode`.
- **Query params opcionales:** `discountPercentage` (default `0`), `walletAddress` (default `"not-provided"`).
- **Respuesta:** la misma que POST: `{ ok: true, qrValue, prefix, version, ttlSeconds, businessWarnings? }`.

**Ejemplo GET:**

```text
GET /api/discount-qr/create?deviceId=dev-123&influencerId=guest&promotionId=699e4ec3d6c344a0274ad312&referralCode=L4D-XXX-ABC&discountPercentage=10
```

Así, tanto si el usuario pide el cupón desde la **web** (POST) como desde la **app** (GET con query), el backend devuelve el mismo tipo de QR (formato 5 partes con porcentaje en el string). El lector puede escanear el QR generado en web o en app y obtendrá el mismo formato; verify/redeem funcionan igual para ambos.

En la web (Link4Deal) el componente `CouponRequestForm` usa **POST** y envía el `discountPercentage` de la promoción cuando está disponible. La app puede usar **GET** con los mismos parámetros en la URL para obtener el mismo `qrValue`.
