# Códigos cortos influencer + promoción (buscador en la app)

Los códigos vinculan un **literal corto** (6–16 caracteres alfanuméricos en búsqueda; registro recomendado con el alfabeto sin ambigüedades descrito abajo) a un **influencer**, una **promoción** y un **prefijo de referral**. La app puede:

1. **Resolver** el código (sin crear cupón): muestra influencer, promo y modo de emisión.
2. **Emitir** el mismo cupón QR que obtendrías con `POST /api/discount-qr/create`, usando solo el código corto + `deviceId`.

Base URL típica: `{API_ORIGIN}/api/discount-qr`

## Variables de entorno (servidor)

| Variable | Uso |
|----------|-----|
| `SHORT_PROMO_CODES_REGISTRY_KEY` | Secret compartido para **registrar** códigos vía POST `/codes/registry`. Header: `X-Short-Codes-Registry-Key`. Si no está definido, ese endpoint responde 503. |
| `SHORT_CODES_LOOKUP_RATE_MAX` | Opcional. Tope por IP cada 15 min para **GET** `/codes/:code` (buscador). Por defecto 900; máximo 2500. |
| `AUTO_NEW_INFLUENCER_PROMO_SHORT_CODE_PROMOTION_IDS` | Opcional. Lista separada por **comas** de `promotionId` (`ObjectId`). Al **registrarse un influencer nuevo** (`POST /api/influencers`), el servidor intenta crear un código corto por cada ID listado que exista en `promotions`. Así pueden tener código desde el día uno aunque aún no tengan puja ni aplicación aprobada. Sin esta variable (o sin lista), solo se crearán códigos cuando ya existan datos enlazados o al **aprobar** una solicitud (`promotion_applications` → `approved`). |

### Creación automática en servidor

Tras **`POST /api/influencers`** exitoso se encola (`setImmediate`) `ensurePromoShortCodesForInfluencer` con **`includeEnvDefaults: true`** (usa la env anterior si está definida) además de cualquier vínculo ya persistido.

Cuando una marca pasa una solicitud a **`approved`** (`PATCH` aplicación), se encola el mismo proceso con **`extraPromotionIds`** = esa promoción, sin volver a aplicar por defecto la lista de env (solo el par influencer + esa promo).

Errores al crear código (promo borrada, etc.) solo se registran en log; **no rompen** el HTTP 201 ni el PATCH de estado.

## Alfabeto recomendado (registro manual)

Los códigos generados aleatoriamente en servidor usan: `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (sin `0`, `O`, `I`, `1`). En **lookup**, la API acepta cualquier entrada alfanumérica normalizada 6–16 tras quitar espacios y caracteres especiales.

## Listado para la web pública (perfil influencer)

Para mostrar todos los **códigos cortos activos** de un influencer en `damecodigo.com/influencer/…`:

```http
GET /api/influencers/{influencerId}/promo-short-codes
```

Respuesta `{ success: true, data: [{ code, label, referralPrefix, expiresAt, promotion: { id, title, brand, status } | null }] }`. Solo incluye registros **`active`** y no expirados; el influencer **sistema** responde 404 como el resto de rutas públicas.

### Rellenar códigos en masa (script)

Para generar automáticamente códigos por cada par (influencer, promoción) conocido por la BD (pujas aprobadas, solicitudes `approved`, `recentPromotions`, cupones QR):

```bash
node server/scripts/backfill-influencer-promo-short-codes.js --dry-run
node server/scripts/backfill-influencer-promo-short-codes.js
node server/scripts/backfill-influencer-promo-short-codes.js --influencer=69abc...
```

Si un influencer no tiene ninguna promoción enlazada por esos orígenes, el script lo omite (no inventa campañas).

## Flujo recomendado en la app

```mermaid
sequenceDiagram
    participant User
    participant App
    participant API as API GET /codes/:code
    participant Issue as API POST .../issue

    User->>App: Escribe código en buscador
    App->>API: GET /codes/:code
    API-->>App: influencer, promotion, issueMode, canIssueCoupon
    alt issueMode qr y canIssueCoupon
        User->>App: Confirmar / generar QR
        App->>Issue: POST body deviceId (+ opcional)
        Issue-->>App: qrValue, prefix, ttlSeconds, ...
        App->>User: Renderiza QR
    else issueMode redirect
        App->>Issue: POST (o solo GET lookup si basta redirectToUrl en promo)
        Issue-->>App: noQr, redirectToUrl
        App->>User: Abre navegador / deep link
    else issueMode blocked
        API-->>App: sin emisión permitida (influencer sistema)
        App->>User: Mensaje de error legible
```

### 1) Lookup (solo lectura)

```http
GET /api/discount-qr/codes/{code}
```

**Respuesta 200** (resumen):

- `ok`, `code` (normalizado)
- `influencerId`, `promotionId`, `label`, `referralPrefix`
- `issueMode`: `"qr"` | `"redirect"` | `"blocked"`
- `canIssueCoupon`: boolean (false si influencer bloqueado o falta promo en BD)
- `influencer`: `{ id, name, username, avatar }`
- `promotion`: `{ id, title, brand, description, precios, fechas, image, redirectInsteadOfQr, discountPercentageSuggested, ... }`
- `flags`: `influencerMissingInDb`, `promotionMissingInDb`, `blockedSystemInfluencer`

Si `issueMode === "blocked"` o `canIssueCoupon === false`, no llames a `issue` desde la UI de usuario final (o muestra mensaje).

**Errores**: `400` código inválido; `404` no existe / inactivo / expirado.

Normalización cliente: opcionalmente quitar espacios, pasar a mayúsculas; el servidor ya normaliza.

### 2) Emitir QR (o redirect)

```http
POST /api/discount-qr/codes/{code}/issue
Content-Type: application/json
```

Body mínimo:

```json
{
  "deviceId": "<id estable del dispositivo o instalación>"
}
```

**Opcional** (misma semántica que `POST /api/discount-qr/create`; se fusionan al payload persistido):

- `referralCode` — si no viene, el servidor usa `{referralPrefix}-{codeNormalizado}` (ej. `L4D-K7HN4P2`).
- `walletAddress` — por defecto `"not-provided"`.
- `brandId`, `shopId`, `productId`, `gtmTag`, `campaignId`, `source`, `medium`, etc.

**Respuesta 200 (modo QR)**

- `ok: true`
- `shortCode`, `issueMode: "qr"`
- `qrValue` — cadena para generar imagen QR (igual que `/create`)
- `prefix`, `basePrefix`, `version`, `ttlSeconds`, `luxaesRedeemed`
- `businessWarnings` — array de advertencias de negocio (si aplican reglas laxas cuando `QR_STRICT_CREATE_VALIDATION=false`)

**Respuesta 200 (modo redirect)** — cuando la promoción tiene redirect en lugar de QR:

- `ok: true`, `issueMode: "redirect"`
- `noQr: true`, `redirectToUrl`

**Errores frecuentes**: `400` falta `deviceId` / validación Mongoose / reglas de negocio estrictas; `403` influencer bloqueado; `404` código inválido o inactivo; `409` influencer o promoción eliminados en BD.

## Registrar un código nuevo (backend / dashboard, no para la app pública)

Solo quién tiene el secret debe llamar este endpoint:

```http
POST /api/discount-qr/codes/registry
Content-Type: application/json
X-Short-Codes-Registry-Key: <SHORT_PROMO_CODES_REGISTRY_KEY>
```

Body ejemplo:

```json
{
  "influencerId": "64abc...",
  "promotionId": "64def...",
  "code": null,
  "label": "Campaña TikTok marzo",
  "referralPrefix": "L4D",
  "expiresAt": null,
  "active": true
}
```

- Si `code` se omite o es vacío, se genera uno aleatorio (≈ 8 caracteres del alfabeto recomendado).
- Custom `code`: 6–12 caracteres solo del alfabeto `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`.

**Respuesta 201**: `data` con `code`, `influencerId`, `promotionId`, `label`, `referralPrefix`, `expiresAt`.

## Notas UX en el buscador

- Aceptar pegado desde SMS o redes; aplicar trim y mayúsculas opcional antes de llamar GET.
- Tras lookup exitoso, mostrar resumen influencer + marca/título promo + descuento sugerido.
- Solo tras acción explícita del usuario (botón «Generar cupón») llamar POST `issue` para no crear tokens innecesarios.
- Límite de frecuencia: el servidor aplica rate limit en GET `/codes/:code`; si la app tiene muchos usuarios tras la misma IP corporativa, ajustar `SHORT_CODES_LOOKUP_RATE_MAX` en despliegue.

## Comparación rápida con `POST /create`

| Aspecto | `POST /create` | `POST /codes/:code/issue` |
|---------|----------------|---------------------------|
| Identifica campaña por | IDs en body | Código corto en URL |
| `referralCode` | Obligatorio en body | Por defecto `{referralPrefix}-{code}` |

El token QR emitido sigue siendo válido ante `POST /api/discount-qr/verify` y `POST /api/discount-qr/redeem` como cualquier otro cupón generado por `/create`.
