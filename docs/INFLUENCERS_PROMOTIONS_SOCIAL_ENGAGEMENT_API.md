# API de engagement social: influencers y promociones

Este documento define cómo **recuperar y registrar** votos (corazón / like), **recuentos** de personas que dieron like, **compartidos** y **comentarios** para:

1. **Tarjeta principal de influencer** en el marketplace (`/influencers`, componente `InfluencersMarketplace.tsx`): botones Guardar (corazón), Compartir, Contactar; y métricas numéricas junto a esos iconos.
2. **Sub-tarjetas de “Promociones recientes”** dentro de la misma card (lista `recentPromotions`): mismas interacciones por **promoción** (`targetType: promotion`).

La API usa un **recurso objetivo unificado** para no duplicar lógica entre influencers y promociones.

---

## 1. Modelo de recurso objetivo

| Campo | Tipo | Descripción |
|--------|------|-------------|
| **targetType** | `influencer` \| `promotion` | Tipo de entidad. |
| **targetId** | string (ObjectId) | `_id` del influencer o de la promoción en MongoDB. |

- **Influencer**: `GET /api/influencers` ya devuelve `id` por documento; ese valor es `targetId`.
- **Promoción**: usar el id de la promoción (p. ej. fila en `recentPromotions.id` o `_id` de `Promotion`).

---

## 2. Agregados a mostrar en UI

Por cada tarjeta (influencer o mini-promo) conviene mostrar:

| Métrica | Uso en UI |
|---------|-----------|
| **likeCount** | Número total de likes (votos con corazón). |
| **likeUserCount** | Igual que `likeCount` si un usuario solo puede dar un like; si en el futuro hay “reacciones” múltiples, distinguir. *Versión inicial: un like por usuario autenticado → recuento = personas.* |
| **shareCount** | Veces que se registró compartir (ver §4). |
| **commentCount** | Total de comentarios (para badge o “12 comentarios”). |
| **likedByMe** | `true` si el usuario actual ya dio like (requiere sesión o `visitorId` estable). |

Comentarios completos no van en el listado denso; se cargan con paginación (§5).

---

## 3. Endpoints propuestos (REST)

Base sugerida: **`/api/social`** (prefijo dedicado; no mezclar con `GET /api/influencers` hasta tener agregación en BD).

### 3.1 Resumen para una tarjeta

```http
GET /api/social/summary?targetType=influencer&targetId=<id>
GET /api/social/summary?targetType=promotion&targetId=<id>
```

**Headers opcionales:** `Authorization: Bearer <jwt>` para rellenar `likedByMe`.

**Respuesta 200 (ejemplo):**

```json
{
  "ok": true,
  "targetType": "influencer",
  "targetId": "507f1f77bcf86cd799439011",
  "likeCount": 42,
  "shareCount": 18,
  "commentCount": 7,
  "likedByMe": false
}
```

### 3.2 Resumen en lote (marketplace con muchas cards)

Evita N+1 peticiones al cargar la grilla.

```http
POST /api/social/summary/batch
Content-Type: application/json
```

**Body:**

```json
{
  "targets": [
    { "targetType": "influencer", "targetId": "507f1f77bcf86cd799439011" },
    { "targetType": "promotion", "targetId": "65a1b2c3d4e5f6789abcdef0" }
  ]
}
```

**Respuesta 200:**

```json
{
  "ok": true,
  "summaries": [
    {
      "targetType": "influencer",
      "targetId": "507f1f77bcf86cd799439011",
      "likeCount": 42,
      "shareCount": 18,
      "commentCount": 7,
      "likedByMe": false
    },
    {
      "targetType": "promotion",
      "targetId": "65a1b2c3d4e5f6789abcdef0",
      "likeCount": 5,
      "shareCount": 2,
      "commentCount": 1,
      "likedByMe": true
    }
  ]
}
```

Reglas: ignorar `targets` inválidos o inexistentes; devolver entrada con conteos en 0 si no hay datos.

---

## 4. Like (corazón) y share

### 4.1 Toggle like

```http
POST /api/social/like
Content-Type: application/json
Authorization: Bearer <jwt>   (recomendado)
```

**Body:**

```json
{
  "targetType": "influencer",
  "targetId": "507f1f77bcf86cd799439011"
}
```

**Comportamiento sugerido:**

- Si el usuario **no** había dado like → crear like, incrementar `likeCount`, `likedByMe: true`.
- Si **ya** había dado like → quitar like (toggle), decrementar, `likedByMe: false`.

**Respuesta 200:**

```json
{
  "ok": true,
  "likeCount": 43,
  "likedByMe": true
}
```

**Sin sesión:** opción A) 401 y forzar login; opción B) usar cookie/`visitorId` anónimo con límite anti-abuso (documentar en implementación).

### 4.2 Registrar share

```http
POST /api/social/share
Content-Type: application/json
```

**Body:**

```json
{
  "targetType": "promotion",
  "targetId": "65a1b2c3d4e5f6789abcdef0",
  "channel": "native"
}
```

`channel` opcional: `copy` | `native` | `whatsapp` | `other` (analytics).

**Respuesta 200:**

```json
{
  "ok": true,
  "shareCount": 19
}
```

---

## 5. Comentarios

### 5.1 Listar comentarios (paginado)

```http
GET /api/social/comments?targetType=influencer&targetId=<id>&page=1&limit=20&sort=createdAt
```

**Respuesta 200:**

```json
{
  "ok": true,
  "docs": [
    {
      "_id": "…",
      "targetType": "influencer",
      "targetId": "507f1f77bcf86cd799439011",
      "userId": "…",
      "authorName": "María",
      "text": "¡Gran perfil!",
      "createdAt": "2026-04-09T12:00:00.000Z"
    }
  ],
  "totalDocs": 7,
  "page": 1,
  "limit": 20
}
```

Moderación: campos opcionales `status: pending|approved|rejected` si se usa revisión previa.

### 5.2 Crear comentario

```http
POST /api/social/comments
Content-Type: application/json
Authorization: Bearer <jwt>
```

**Body:**

```json
{
  "targetType": "influencer",
  "targetId": "507f1f77bcf86cd799439011",
  "text": "Máximo 2000 caracteres…"
}
```

**Respuesta 201:** documento del comentario + `commentCount` actualizado en agregado (o el cliente refresca summary).

---

## 6. Integración con listados existentes (opcional)

Para reducir llamadas desde el frontend:

- **`GET /api/influencers?includeSocial=true`**: cada documento en `docs` incluye `social: { likeCount, shareCount, commentCount, likedByMe }` cuando el backend pueda hacer `$lookup` o agregación.
- **`GET /api/promotions`** (o el endpoint de listado que use el marketplace de promociones): idem con `includeSocial=true`.

Hasta que exista la implementación, el cliente puede usar solo **`POST /api/social/summary/batch`** después de cargar influencers y recoger todos los `id` + ids de `recentPromotions`.

---

## 7. Persistencia sugerida (implementación servidor)

No implementado aún de forma unificada en este repo; referencia para el equipo backend:

| Colección / tabla | Uso |
|-------------------|-----|
| **Likes** | `{ userId, visitorId?, targetType, targetId, createdAt }` índice único `(userId, targetType, targetId)` para un like por usuario. |
| **Shares** | Append-only o contador incrementado por evento `{ targetType, targetId, channel, createdAt }`. |
| **Comments** | `{ targetType, targetId, userId, text, status, createdAt }`. |

Contadores desnormalizados en documento `SocialStats` por `(targetType, targetId)` para lecturas rápidas, actualizados con transacciones o jobs, o calcular con `$count` según volumen.

El modelo `History` ya incluye acciones `promotion_favorite`, `promotion_share` (y similares); se pueden **emitir eventos** allí para auditoría mientras la fuente de verdad de likes sea la colección dedicada.

---

## 8. Mapeo UI ↔ API (referencia rápida)

| UI `InfluencersMarketplace` | Acción API |
|----------------------------|------------|
| Corazón “Guardar” | `POST /api/social/like` con `targetType=influencer` y `targetId=influencer.id` |
| Número junto al corazón | `likeCount` de `summary` o batch |
| Compartir | `POST /api/social/share` |
| Número de shares | `shareCount` |
| Comentarios / listado | `GET /api/social/comments` en modal o drawer |
| Badge total comentarios | `commentCount` |
| Fila “Promociones recientes” | Mismos endpoints con `targetType=promotion` y `targetId=promo.id` |

---

## 9. Checklist de implementación frontend

- [ ] Tras cargar influencers, construir lista de `{ targetType: 'influencer', targetId }` y, por cada `recentPromotions`, `{ targetType: 'promotion', targetId }`.
- [ ] Llamar `POST /api/social/summary/batch` y guardar mapa `key = type:id` → summary.
- [ ] Renderizar corazón relleno si `likedByMe`; al click, `POST /api/social/like` y actualizar estado local.
- [ ] Compartir: Web Share API o copiar enlace + `POST /api/social/share`.
- [ ] Comentarios: panel con `GET` paginado + formulario `POST` (usuario logueado).

---

## 10. Versionado y errores

- Incluir `Accept-Version: 1` o ruta `/api/v1/social/...` si se esperan cambios.
- Errores típicos: `400` body inválido, `404` target inexistente, `401` like/comment sin auth si la política lo exige, `429` rate limit.

---

*Documento generado para alinear la sección influencers del marketplace y las mini-tarjetas de promociones con un único contrato de servicio.*
