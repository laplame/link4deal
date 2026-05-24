# Códigos cortos influencer + promoción (buscador en la app)

Los códigos vinculan un **literal corto** (6–16 caracteres alfanuméricos en búsqueda; registro recomendado con el alfabeto sin ambigüedades descrito abajo) a un **influencer**, una **promoción** y un **prefijo de referral**. La app puede:

1. **Resolver** un código (sin crear cupón): una sola campaña — `GET /api/discount-qr/codes/:code`.
2. **Listar** todas las campañas con código corto de un influencer: `GET /api/discount-qr/codes/:code/promotions` (entrada = cualquier código promo **activo** de ese influencer **o** su `profileShortCode`).
3. **Emitir** el mismo cupón QR que obtendrías con `POST /api/discount-qr/create`, usando solo el código corto de **esa** campaña + `deviceId` — `POST /api/discount-qr/codes/:code/issue`.

**Después de emitir:** el `qrValue` devuelto es un cupón normal de la API discount-qr. Para validar en caja o antes de aplicar descuento usa **`POST /api/discount-qr/verify`** y para consumirlo **`POST /api/discount-qr/redeem`** (mismo identificador, `shopId`/`productId` coherentes, idempotencia). Contrato detallado: [DISCOUNT_QR_VERIFY_ENDPOINT.md](./DISCOUNT_QR_VERIFY_ENDPOINT.md).

Base URL típica: `{API_ORIGIN}/api/discount-qr`

**App influencer (login, wallet, campañas, story cards Nano Banana):** [APP_INFLUENCER_IDENTITY_AND_STORY_CARDS.md](./APP_INFLUENCER_IDENTITY_AND_STORY_CARDS.md).

**Abonos al influencer por canje (ledger Mongo, wallet destino):** [INFLUENCER_TOKEN_SETTLEMENT_MONGO.md](./INFLUENCER_TOKEN_SETTLEMENT_MONGO.md).

---

## Implementación en la app (checklist)

1. **Entrada del usuario:** `trim`, quitar separadores raros; el servidor normaliza a mayúsculas y longitud 6–16. No llames a `issue` en cada tecla: debounce o botón «Buscar» para `GET /codes/:code` o `GET /codes/:code/promotions`.
2. **Lookup una campaña:** `GET /api/discount-qr/codes/{code}`. Si **404** → código inexistente, inactivo o expirado (incluye perfil sin `INFLUENCER_PROFILE_SHORT_CODE_DEFAULT_PROMOTION_ID`). Si **429** → rate limit (ver tabla).
3. **Listado por influencer:** `GET /api/discount-qr/codes/{code}/promotions` con el mismo `{code}` que en (2): resuelve el influencer por **fila promo activa** o por **`profileShortCode`** y devuelve **`entries[]`** (todas las filas activas + opcional fila sintética «Código de perfil» si hay env por defecto y no estaba ya en la lista). Úsalo para pantalla «promos de este creador».
4. **Decisión UI:** si `issueMode === "blocked"` o `canIssueCoupon === false`, no ofrezcas emisión; muestra mensaje según flags (`promotionMissingInDb`, etc.).
5. **Emisión solo con confirmación:** `POST /api/discount-qr/codes/{code}/issue` donde `{code}` es el **`shortCode` de la fila elegida** (cada entrada del catálogo trae su `shortCode`). Body mínimo `{ "deviceId": "<id estable>" }`. Guarda el **`qrValue`** devuelto.
6. **Render QR:** usa `qrValue` como contenido del QR (misma cadena que espera verify con campo `qrValue`).
7. **Canje en tienda / POS:** flujo idéntico al de un cupón creado por `/create`: **verify** → si `redeemable` → **redeem** con el mismo string + `shopId`/`productId` + `idempotencyKey` si aplica. Ver [DISCOUNT_QR_VERIFY_ENDPOINT.md](./DISCOUNT_QR_VERIFY_ENDPOINT.md) secciones 1–3 y tipos TS en §5.1.
8. **Código de perfil:** con **`GET .../promotions`** el perfil **sí** localiza al influencer aunque no exista `INFLUENCER_PROFILE_SHORT_CODE_DEFAULT_PROMOTION_ID` (mientras el literal coincida con `profileShortCode` en BD). Para **`GET .../codes/:code`** (una sola promo) o **`POST .../issue`** sin fila promo, sigue haciendo falta esa env o una fila en `influencer_promo_short_codes`.
9. **Errores de red:** backoff en 429; no reintentar `issue` con el mismo `deviceId` en bucle si el servidor devuelve 400 por reglas de negocio (revisar `message` / cuerpo).

### Tabla de endpoints (app pública)

| Paso | Método y ruta | Body / notas | Rate limit (aprox.) |
|------|----------------|--------------|---------------------|
| Buscar código (una promo) | `GET /api/discount-qr/codes/:code` | — | Mismo límite que la fila siguiente (`SHORT_CODES_LOOKUP_RATE_MAX` / 15 min / IP). |
| Listar promos del influencer | `GET /api/discount-qr/codes/:code/promotions` | Acepta código de **cualquier** fila promo activa del influencer **o** su `profileShortCode`. Respuesta: `influencer`, `entries[]` (cada una con `shortCode`, `promotion`, `issueMode`, `canIssueCoupon`, …), `resolvedVia` (`promo_short_code` \| `profile_short_code`), `total`. | Por IP: ventana 15 min; tope `SHORT_CODES_LOOKUP_RATE_MAX` (defecto 900, máx. 2500). **429** si se excede. |
| Activas por creador (portada) | `GET /api/promotions/active?shortCode=:code` | Misma resolución de código; devuelve solo promos **activas y vigentes** cuyo `_id` está en el catálogo. Incluye `data.shortCodeMeta`. | Límite `searchLimiter` de rutas `/api/promotions` (p. ej. 30/min/IP). |
| Emitir cupón | `POST /api/discount-qr/codes/:code/issue` | JSON: `deviceId` obligatorio; `{code}` = `shortCode` de la fila elegida | Mismo bucket que verify/redeem: **20 / 15 min / IP** (`discountQrWriteLimiter`). |
| Validar cupón | `GET` o `POST /api/discount-qr/verify` | `qrValue` o `referralCode`; opc. `shopId`, `productId` | **20 / 15 min / IP**. |
| Canjear | `POST /api/discount-qr/redeem` | Mismo identificador que verify + auditoría opcional | **20 / 15 min / IP**. |

El registro `POST /codes/registry` es solo backoffice (header `X-Short-Codes-Registry-Key`), no va en la app de consumidor.

### Ejemplo mínimo (fetch) encadenado

```ts
const base = '/api/discount-qr'; // o `${API_ORIGIN}/api/discount-qr`

async function lookupCode(raw: string) {
  const code = encodeURIComponent(raw.trim().toUpperCase());
  const r = await fetch(`${base}/codes/${code}`);
  if (r.status === 429) throw new Error('rate_limited');
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function issueFromCode(code: string, deviceId: string) {
  const r = await fetch(`${base}/codes/${encodeURIComponent(code)}/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId }),
  });
  if (r.status === 429) throw new Error('rate_limited');
  const data = await r.json();
  if (!data.ok) throw new Error(data.message || 'issue_failed');
  return data; // usar data.qrValue en modo "qr"
}

async function verifyThenRedeem(qrValue: string, shopId?: string) {
  const v = await fetch(`${base}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrValue, shopId }),
  });
  const verified = await v.json();
  if (!v.ok || !verified.ok || !verified.redemption?.redeemable) return { verified, redeemed: null };
  const red = await fetch(`${base}/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrValue, shopId }),
  });
  return { verified, redeemed: await red.json() };
}
```

Tras un redeem 200, si te interesa saber si se encoló notificación externa de tokens/ledger, lee **`luxaeSettlementWebhookQueued`** en la respuesta (solo informativo; el webhook es asíncrono en servidor). Detalle: [DISCOUNT_QR_VERIFY_ENDPOINT.md](./DISCOUNT_QR_VERIFY_ENDPOINT.md) §3.5 y §6.

## Variables de entorno (servidor)

| Variable | Uso |
|----------|-----|
| `SHORT_PROMO_CODES_REGISTRY_KEY` | Secret compartido para **registrar** códigos vía POST `/codes/registry`. Header: `X-Short-Codes-Registry-Key`. Si no está definido, ese endpoint responde 503. |
| `SHORT_CODES_LOOKUP_RATE_MAX` | Opcional. Tope por IP cada 15 min para **GET** `/codes/:code` y **GET** `/codes/:code/promotions` (mismo limiter). Por defecto 900; máximo 2500. |
| `AUTO_NEW_INFLUENCER_PROMO_SHORT_CODE_PROMOTION_IDS` | Opcional. Lista separada por **comas** de `promotionId` (`ObjectId`). Al **registrarse un influencer nuevo** (`POST /api/influencers`), el servidor intenta crear un código corto por cada ID listado que exista en `promotions`. Así pueden tener código desde el día uno aunque aún no tengan puja ni aplicación aprobada. Sin esta variable (o sin lista), solo se crearán códigos cuando ya existan datos enlazados o al **aprobar** una solicitud (`promotion_applications` → `approved`). |
| `INFLUENCER_PROFILE_SHORT_CODE_DEFAULT_PROMOTION_ID` | Opcional. Un `ObjectId` de promoción. Si está definido, el **código corto de perfil** del influencer (`profileShortCode` en documento `influencers`) se resuelve en **GET** `/api/discount-qr/codes/:code` y **POST** `/issue` igual que un código promo, emitiendo cupón para esa promoción por defecto. Sin esta variable, el código de perfil sigue existiendo y aparece en el perfil web, pero el buscador de la app no lo resolverá hasta que exista un código promo fila o configures esta env. |

**Orden de resolución en servidor** (`resolveActiveNormalizedCode`): primero se busca una fila **activa y no expirada** en `influencer_promo_short_codes` con ese `code`. Si no hay fila, solo entonces se intenta **código de perfil** + `INFLUENCER_PROFILE_SHORT_CODE_DEFAULT_PROMOTION_ID` (influencer distinto del usuario sistema y promoción existente). Si un literal coincidiera con ambos mundos, **gana siempre la fila de la tabla promo**.

### Código corto de perfil (alta influencer)

Además de los códigos **influencer + promoción** en `influencer_promo_short_codes`, cada influencer (salvo el usuario sistema) recibe un **`profileShortCode`** único en la colección **`influencers`**: se asigna en **`POST /api/influencers`** y, si faltaba, al cargar **`GET /api/influencers/:id`**, **`GET /by-slug/...`** o **`GET /api/influencers/me`**.

- El perfil público lo expone el JSON del influencer (`profileShortCode`) y **`GET /api/influencers/:id/promo-short-codes`** devuelve también `influencerProfileShortCode` por comodidad.
- Resolución en app: misma ruta **`GET /api/discount-qr/codes/:code`** si `INFLUENCER_PROFILE_SHORT_CODE_DEFAULT_PROMOTION_ID` apunta a una promoción válida.

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

Respuesta `{ success: true, data: [{ code, label, referralPrefix, expiresAt, promotion: { id, title, brand, status } | null }], influencerProfileShortCode?: string | null }`. Solo incluye registros **`active`** y no expirados; el influencer **sistema** responde 404 como el resto de rutas públicas. `influencerProfileShortCode` es el código fijo del perfil (colección `influencers`), el mismo que en `GET /api/influencers/:id` como `profileShortCode`.

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

### 1b) Catálogo — promociones disponibles por influencer (solo lectura)

```http
GET /api/discount-qr/codes/{code}/promotions
```

- **`{code}`**: cualquier **código corto de campaña activo** de ese influencer **o** su **`profileShortCode`** (6–16 caracteres, misma normalización que el lookup).
- **200** — cuerpo JSON:
  - `ok: true`
  - `lookupCode`, `resolvedVia`: `"promo_short_code"` si el literal era una fila promo; `"profile_short_code"` si coincidió con el perfil.
  - `influencer`: `{ id, name, username, avatar }`
  - `influencerProfileShortCode`: código de perfil en BD (mayúsculas) o `null`
  - `entries`: array ordenado por `shortCode`; cada elemento incluye `shortCode`, `label`, `referralPrefix`, `expiresAt`, `issueMode`, `canIssueCoupon`, `promotion` (mismo shape resumido que en lookup simple), `flags`.
  - `total`: número de entradas.
- Si existe **`INFLUENCER_PROFILE_SHORT_CODE_DEFAULT_PROMOTION_ID`** y esa promoción no está ya representada en las filas, puede añadirse una entrada sintética al inicio (`label`: «Código de perfil») para poder usar **`POST .../issue`** con el `shortCode` del perfil.
- **404** — literal no corresponde a ninguna fila activa ni a un `profileShortCode` conocido.
- **429** — mismo rate limit que `GET /codes/:code`.

### 1c) Promociones activas filtradas por código (portada / listados)

Para pantallas que solo cargan **`GET /api/promotions/active`** (p. ej. landing con límite 50) y necesitan **las mismas promociones activas y vigentes** que el catálogo de un creador, sin cruzar a mano IDs:

```http
GET /api/promotions/active?shortCode={code}&limit=50&page=1
```

- Alias de query: **`creatorShortCode`** (mismo efecto que `shortCode`).
- **`{code}`**: 6–16 caracteres alfanuméricos; misma resolución que **`GET /api/discount-qr/codes/:code/promotions`** (fila promo o `profileShortCode`).
- **200** — mismo envelope que `GET /active` sin filtro: `data.docs`, paginación, y opcionalmente **`data.shortCodeMeta`**: `lookupCode`, `resolvedVia`, `influencer`, `catalogPromotionCount` (IDs en catálogo), `activeMatchingCount` (documentos que cumplen `status: active` y `validUntil >= ahora`).
- **400** — literal no normalizable.
- **404** — código sin influencer / sin resolución.
- Rate limit: mismo **`searchLimiter`** que `GET /api/promotions` (30 req/min/IP en la config actual).

Verificación rápida (con servidor en marcha):

```bash
curl -sS "http://localhost:3000/api/promotions/active?limit=2"
curl -sS -w "\n%{http_code}\n" "http://localhost:3000/api/promotions/active?shortCode=HESMRAUW&limit=10"
```

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
