# API compliance: instalaciones de app, polígono (WGS84) y saldos LUXAE (Polygon)

Registro **CRUD** para cumplimiento: la app instalada envía un identificador estable, un **polígono GeoJSON** (área de servicio declarada) y **direcciones EVM en la red Polygon** asociadas a la instalación. El backend persiste el registro y puede **refrescar saldos** del token LUXAE (ERC-20) vía RPC público o privado.

**Base path:** `/api/compliance/luxae-installations`  
**Autenticación:** header `X-Luxae-Compliance-Key` igual a la variable de entorno `LUXAE_COMPLIANCE_API_KEY` del servidor. Sin clave configurada el API responde **503**.

**Rate limit:** la ruta va montada con `strictLimiter` (ver `server/index.js`).

**Colección MongoDB:** `luxae_compliance_installations`  
**Modelo:** `server/models/LuxaeComplianceInstallation.js`

---

## Variables de entorno

| Variable | Obligatorio | Descripción |
|----------|-------------|-------------|
| `LUXAE_COMPLIANCE_API_KEY` | Sí (para usar el API) | Clave compartida; la app o el servicio de compliance la envía en cada request. |
| `POLYGON_RPC_URL` | No | URL JSON-RPC de Polygon (p. ej. Alchemy, Infura). Sin ella, `balances/refresh` guarda `onChain: false` y mensaje de error. |
| `LUXAE_TOKEN_CONTRACT_ADDRESS` | No | Contrato ERC-20 LUXAE en Polygon (`0x` + 40 hex). |
| `LUXAE_TOKEN_DECIMALS` | No | Por defecto `18`. |

---

## GeoJSON: `serviceAreaPolygon`

- Tipo permitido: **`Polygon`** (un anillo exterior).
- Coordenadas: `coordinates[0]` = anillo; cada punto **`[lng, lat]`** en WGS84.
- El anillo debe estar **cerrado** (primer punto = último punto).
- Máximo **200** vértices por anillo.
- Campo **opcional** en alta; se puede omitir o enviar `null` para borrar en PATCH (enviar `null` explícito).

Ejemplo mínimo (rectángulo):

```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [-99.2, 19.4],
      [-99.1, 19.4],
      [-99.1, 19.5],
      [-99.2, 19.5],
      [-99.2, 19.4]
    ]
  ]
}
```

---

## Direcciones Polygon (EVM)

- Formato: `0x` + 40 caracteres hexadecimales (checksum no requerido; se normaliza a minúsculas).
- Lista en `walletAddresses`: array de strings **o** de objetos `{ "address": "0x...", "label": "opcional" }`.
- Máximo **50** direcciones por instalación.
- Duplicados en la misma petición se deduplican.

---

## CRUD

### 1. Alta — `POST /api/compliance/luxae-installations`

**Headers:** `Content-Type: application/json`, `X-Luxae-Compliance-Key: <secret>`

**Body (JSON):**

| Campo | Obligatorio | Descripción |
|--------|---------------|-------------|
| `externalInstallationId` | Sí | UUID u otro id estable generado por la app (máx. 128 caracteres). **Único** en toda la base. |
| `serviceAreaPolygon` | No | GeoJSON `Polygon` o `null`. |
| `walletAddresses` | No | Array de direcciones Polygon (ver arriba). |
| `platform` | No | `ios` \| `android` \| `web` \| `unknown` (default `unknown`). |
| `appVersion` | No | Semver o string corto (máx. 64). |
| `metadata` | No | Objeto JSON libre (auditoría, build id, etc.). |

**201** — éxito:

```json
{
  "ok": true,
  "data": {
    "id": "...mongoObjectId...",
    "externalInstallationId": "...",
    "platform": "android",
    "appVersion": "1.4.2",
    "serviceAreaPolygon": { "type": "Polygon", "coordinates": [...] },
    "walletAddresses": [{ "address": "0xabc...", "label": "" }],
    "luxaeBalanceSnapshots": [],
    "lastBalanceSyncAt": null,
    "status": "active",
    "metadata": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**409** — ya existe `externalInstallationId`.

---

### 2. Listado — `GET /api/compliance/luxae-installations`

**Query:**

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `page` | `1` | Página (≥ 1). |
| `limit` | `20` | Tamaño de página (1–100). |
| `status` | `active` | `active` \| `archived` \| `all`. |

**200:**

```json
{
  "ok": true,
  "data": [ { "...": "mismo shape que POST" } ],
  "page": 1,
  "limit": 20,
  "total": 42,
  "totalPages": 3
}
```

---

### 3. Detalle — `GET /api/compliance/luxae-installations/:id`

`:id` = `_id` MongoDB (24 hex).

**404** si no existe.

---

### 4. Actualización — `PATCH /api/compliance/luxae-installations/:id`

Body **parcial**: solo los campos enviados se actualizan.

Campos permitidos: `serviceAreaPolygon`, `walletAddresses`, `platform`, `appVersion`, `status` (`active` \| `archived`), `metadata`.

Para **quitar** el polígono: `"serviceAreaPolygon": null`.

**400** si no se envía ningún campo reconocido.

---

### 5. Baja lógica — `DELETE /api/compliance/luxae-installations/:id`

No borra el documento: pone `status: "archived"` (trazabilidad compliance).

**200:** incluye `message` y `data` con el registro actualizado.

---

### 6. Refrescar saldos LUXAE — `POST /api/compliance/luxae-installations/:id/balances/refresh`

Para cada dirección en `walletAddresses` llama `balanceOf` en el contrato configurado (`eth_call` vía `POLYGON_RPC_URL`). Guarda el resultado en `luxaeBalanceSnapshots` y `lastBalanceSyncAt`.

Cada elemento de `luxaeBalanceSnapshots`:

| Campo | Descripción |
|--------|-------------|
| `address` | Dirección consultada. |
| `balanceRaw` | Entero en unidades mínimas del token (string). |
| `balanceDecimal` | Representación decimal (string). |
| `decimals` | Decimales usados (p. ej. 18). |
| `fetchedAt` | ISO fecha de la lectura. |
| `onChain` | `true` si la llamada RPC fue correcta. |
| `error` | Texto si `onChain` es `false` (p. ej. RPC no configurada). |

**200:**

```json
{
  "ok": true,
  "data": {
    "installation": { "...": "..." },
    "balances": [ { "address": "0x...", "balanceRaw": "0", ... } ]
  }
}
```

---

## Códigos HTTP resumidos

| Código | Caso |
|--------|------|
| 201 | Alta correcta. |
| 200 | Lectura, actualización, archivado o refresh OK. |
| 400 | Validación (polígono, direcciones, id inválido). |
| 401 | API key incorrecta o ausente. |
| 404 | `id` no encontrado. |
| 409 | `externalInstallationId` duplicado (solo POST). |
| 503 | `LUXAE_COMPLIANCE_API_KEY` no definida en servidor. |

---

## Ejemplos curl

```bash
export KEY="tu-clave-secreta"
export API="http://localhost:3000"

curl -s -X POST "$API/api/compliance/luxae-installations" \
  -H "Content-Type: application/json" \
  -H "X-Luxae-Compliance-Key: $KEY" \
  -d '{
    "externalInstallationId": "550e8400-e29b-41d4-a716-446655440000",
    "platform": "android",
    "appVersion": "1.0.0",
    "walletAddresses": ["0x0000000000000000000000000000000000000001"],
    "serviceAreaPolygon": {
      "type": "Polygon",
      "coordinates": [[[-99.2,19.4],[-99.1,19.4],[-99.1,19.5],[-99.2,19.5],[-99.2,19.4]]]
    }
  }'

# Listado
curl -s "$API/api/compliance/luxae-installations?status=all&limit=10" \
  -H "X-Luxae-Compliance-Key: $KEY"

# Refresh saldos (requiere POLYGON_RPC_URL + LUXAE_TOKEN_CONTRACT_ADDRESS en .env)
curl -s -X POST "$API/api/compliance/luxae-installations/<MONGO_ID>/balances/refresh" \
  -H "X-Luxae-Compliance-Key: $KEY"
```

---

## Notas de diseño

1. **1 LUXAE = 1 USD** es la convención de negocio en el resto del repo; el contrato on-chain debe coincidir con el despliegue real del token.
2. El API **no** sustituye un proveedor KYC/AML: es un **registro técnico** de instalación + geografía declarada + cartera(s) y lectura de saldo.
3. Para **reabrir** un registro archivado, `PATCH` con `"status": "active"`.

---

## Archivos relacionados

- Rutas: `server/routes/luxaeCompliance.js`
- Validación geo / wallets: `server/utils/luxaeComplianceGeo.js`
- RPC Polygon: `server/utils/polygonLuxaeBalance.js`
- Montaje: `server/index.js` → `app.use('/api/compliance/luxae-installations', ...)`
