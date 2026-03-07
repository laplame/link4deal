# GET /api/promotions/active – Listado de promociones activas y vigentes

## Objetivo

Endpoint dedicado para **listar solo promociones activas y vigentes**. El criterio de vigencia se aplica **en el servidor** (fecha/hora del backend) para evitar que el cliente marque como "agotado" o "cerrada" por diferencia de zona horaria o por recalcular la fecha en el front.

## Request

| Método | URL | Query |
|--------|-----|--------|
| **GET** | `/api/promotions/active` | `page` (default 1), `limit` (default 50, max 100) |

Ejemplo: `GET /api/promotions/active?limit=50&page=1`

## Filtro en servidor

- `status === 'active'`
- `validUntil >= now` (fecha/hora del servidor)

Solo se devuelven promociones que cumplan ambos. Las expiradas no aparecen en este listado.

## Respuesta (modelo JSON)

```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "...",
        "id": "...",
        "title": "...",
        "brand": "...",
        "category": "...",
        "originalPrice": 100,
        "currentPrice": 85,
        "currency": "USD",
        "validUntil": "...",
        "validUntilISO": "2026-04-01T23:59:59.000Z",
        "isActive": true,
        "daysLeft": 25,
        "timeLeftLabel": "25d 4h 30m",
        "displayStatus": "active",
        "conversions": 0,
        "totalQuantity": 100,
        "images": [...],
        "storeLocation": { "city": "...", "address": "..." }
      }
    ],
    "totalDocs": 12,
    "limit": 50,
    "page": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "message": "Promociones activas y vigentes (cálculo de fecha en servidor)."
}
```

## Campos calculados en servidor (por doc)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `validUntilISO` | string | `validUntil` en ISO (para el cliente). |
| `isActive` | boolean | Siempre `true` en este endpoint. |
| `daysLeft` | number | Días restantes hasta `validUntil` (>= 0). |
| `timeLeftLabel` | string | Ej. `"25d 4h 30m"`. |
| `displayStatus` | string | `"active"` \| `"ending"` (≤3 días) \| `"closed"` (ya no vigente). |

El frontend debe usar **displayStatus** y **timeLeftLabel** para mostrar estado y tiempo restante, sin recalcular fechas en el cliente.

## Uso en la app

- **Index (landing):** `GET /api/promotions/active?limit=50&page=1` para la sección de ofertas.
- **Marketplace de promociones:** mismo endpoint para el grid y las estadísticas (Promociones Activas, etc.).

Así el listado de “promociones activas” es único y consistente con el criterio del servidor.
