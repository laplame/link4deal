# Promociones sin deal — evidencia de compra (referencia app móvil)

Documento para implementar en la **app móvil** el flujo **Sin deal**: subir promociones de **terceros** (comercios que no son campañas DameCódigo) con **evidencia de que la oferta es real** — foto de ticket/recibo y/o link a un video de la compra.

**Relacionado:**

| Documento | Contenido |
|-----------|-----------|
| [CREAR_PROMOCION_APP_REFERENCIA.md](./CREAR_PROMOCION_APP_REFERENCIA.md) | Flujo general foto → IA → `POST /api/promotions` |
| [PROMOTION_SCHEMA_APP_REFERENCE.md](./PROMOTION_SCHEMA_APP_REFERENCE.md) | Schema completo de promoción |
| [PROMOTIONS_ACTIVE_ENDPOINT.md](./PROMOTIONS_ACTIVE_ENDPOINT.md) | Listado público (excluye sin deal no aprobadas) |
| [ADMIN_INFLUENCER_CRM.md](./ADMIN_INFLUENCER_CRM.md) | CRM admin (cola de verificación) |

**Backend:** `server/utils/promotionKind.js`, `server/utils/promotionPurchaseProof.js`, `server/controllers/promotionController.js`

**Estado:** mayo 2026 — backend Fase 1 + evidencia de compra implementados.

---

## Tabla de contenidos

1. [Concepto de producto](#1-concepto-de-producto)
2. [Modal Sin deal / Con deal en la app](#2-modal-sin-deal--con-deal-en-la-app)
3. [Dos tipos de media (no mezclar)](#3-dos-tipos-de-media-no-mezclar)
4. [Campos API al crear](#4-campos-api-al-crear)
5. [Añadir evidencia después](#5-añadir-evidencia-después)
6. [Respuesta y estados](#6-respuesta-y-estados)
7. [Errores](#7-errores)
8. [Ejemplos curl](#8-ejemplos-curl)
9. [Checklist implementación app](#9-checklist-implementación-app)
10. [Moderación (CRM)](#10-moderación-crm)

---

## 1. Concepto de producto

| Tipo | `promotionKind` | Propósito | Cupón QR |
|------|-----------------|-----------|----------|
| **Sin deal** | `verification_only` | Verificar que una promo de un **comercio externo** es real (foto/video de compra). | **No** |
| **Con deal** | `with_deal` | Campaña comercial DameCódigo (cupón, comisión, influencers). | Sí (wizard web) |

Las promos **sin deal**:

- **No** se convierten en promos con deal (son registros distintos; crear campaña nueva en web si aplica).
- Validan ofertas de **negocios fuera del ecosistema** — demuestran que la plataforma funciona incluso sin la marca dentro del sistema.
- **No** generan cupón QR ni settlements por canje.
- Con evidencia de compra: **auto-aprobación** (`verificationStatus: approved`, `status: active`) — no pasan por cola CRM obligatoria.
- Se marcan como **no nativas de Cryptomarketing** (`isEcosystemNative: false`).
- **Sin contrato** con la marca (`hasBrandContract: false`); condiciones **pueden cambiar** (`offerMayChange: true`).

---

## 2. Modal Sin deal / Con deal en la app

| Elección en modal | Acción app | API |
|-------------------|------------|-----|
| **Sin deal** | Formulario + evidencia → `POST /api/promotions` | Ver §4 |
| **Con deal** | Redirigir a `https://www.damecodigo.com/create-promotion` | Sin cambios API en app |

---

## 3. Dos tipos de media (no mezclar)

| Campo multipart | Uso | Obligatorio |
|-----------------|-----|-------------|
| `images` | Cartel, menú, flyer de la **oferta** (material promocional) | Recomendado (título + flyer) |
| `verificationImages` | **Evidencia de compra**: ticket, recibo, captura de pago | Una de las opciones de §4 |
| `purchaseProofVideoUrl` | **Link HTTPS** a video que muestra la compra (YouTube, Drive, TikTok, etc.) | Alternativa a foto |
| `videos` | Archivo de video subido (MP4/MOV/WEBM, máx. 2, ~50 MB) | Opcional si ya hay link |

**Regla de negocio:** en promos sin deal hace falta **al menos una** evidencia de compra:

- `verificationImages` **o**
- `purchaseProofVideoUrl` (o alias) **o**
- `videos`

No confundir `images` (promo) con `verificationImages` (prueba de compra).

---

## 4. Campos API al crear

### `POST /api/promotions`

**Content-Type:** `multipart/form-data`

### Identidad del flujo

| Campo | Tipo | Valor app |
|-------|------|-----------|
| `hasDeal` | boolean / `"false"` | `false` |
| `promotionKind` | string | `verification_only` |
| `sourceChannel` | string | `mobile_app` |
| `promotionMode` | string | `sin_deal` (alias opcional) |
| `redirectInsteadOfQr` | boolean | `false` |
| `deviceId` | string | ID dispositivo (auditoría) |
| `submittedByUserId` | string | Opcional si hay JWT de usuario |
| `verificationBadgeTier` | string | `target_10` (default), `target_100`, `target_custom` |
| `verificationBadgeTarget` | number | Meta N si `target_custom` |

### Datos de la promo (como hoy)

| Campo | Notas |
|-------|--------|
| `title` | Obligatorio |
| `description`, `category`, `originalPrice`, `currentPrice`, `currency` | Según formulario |
| `storeName`, `storeLatitude`, `storeLongitude`, … | Ubicación del comercio |
| `images` | Fotos del cartel/oferta |

### Evidencia de compra

| Campo | Tipo | Máx. |
|-------|------|------|
| `verificationImages` | archivo(s) imagen | 3 |
| `purchaseProofVideoUrl` | texto URL | 1 |
| `verificationVideoUrl` | alias del anterior | 1 |
| `purchaseProofVideoUrls` | JSON array o CSV de URLs | — |
| `videos` | archivo(s) video | 2 |

### Heurística (transición)

Si la app **aún no** envía `hasDeal: false`, el servidor puede inferir `verification_only` cuando:

- `sourceChannel === 'mobile_app'`
- `redirectInsteadOfQr !== true`
- No hay señales de deal (`redirectToUrl`, `campaignId`, `shopId`, …)

Enviar flags explícitos evita ambigüedad.

### Respuesta `201` (campos nuevos relevantes)

```json
{
  "success": true,
  "message": "Promoción creada exitosamente",
  "data": {
    "id": "…",
    "title": "…",
    "status": "draft",
    "promotionKind": "verification_only",
    "hasDeal": false,
    "verificationStatus": "approved",
    "sourceChannel": "mobile_app",
    "status": "active",
    "isEcosystemNative": false,
    "hasBrandContract": false,
    "offerMayChange": true,
    "showRedeemButton": false,
    "communityVerificationBadgeLabel": "Verificada por 0/10",
    "purchaseProofCount": 2,
    "purchaseProofImageCount": 1,
    "purchaseProofVideoLinkCount": 1,
    "hasPurchaseProof": true,
    "images": 1
  },
  "mode": "database"
}
```

---

## 5. Añadir evidencia después

Si la promo se creó sin evidencia (`verificationStatus: pending_submission`) o el usuario sube más pruebas:

### `POST /api/promotions/:id/purchase-proof`

Mismo multipart que §3 (`verificationImages`, `videos`, `purchaseProofVideoUrl`).

**Respuesta 200:**

```json
{
  "success": true,
  "message": "Evidencia de compra recibida. Pendiente de revisión.",
  "data": { … documento enriquecido con purchaseProof … }
}
```

También se puede adjuntar evidencia en **`PUT /api/promotions/:id`** (mismos campos multipart); solo aplica si `promotionKind === 'verification_only'`.

---

## 6. Respuesta y estados

### `verificationStatus`

| Valor | Significado | UI sugerida |
|-------|-------------|-------------|
| `pending_submission` | Creada, falta evidencia | “Sube foto o link de video” |
| `approved` | Evidencia recibida — **auto-aprobada** (terceros, sin cola CRM) | Badge comunitario + disclaimers |
| `pending_review` | Solo casos excepcionales / apelaciones vía CRM | “En revisión” |
| `rejected` | Rechazada por super admin (moderación manual) | Mostrar motivo |
| `not_applicable` | Promos con deal | — |

### Objeto `purchaseProof[]` (en detalle / listado enriquecido)

```json
"purchaseProof": [
  {
    "mediaType": "image",
    "source": "upload",
    "url": "https://…/proof-image-….jpg",
    "originalName": "ticket.jpg",
    "uploadedAt": "2026-05-31T…"
  },
  {
    "mediaType": "video_link",
    "source": "external_link",
    "url": "https://www.youtube.com/watch?v=…",
    "uploadedAt": "2026-05-31T…"
  }
]
```

| `mediaType` | Descripción |
|-------------|-------------|
| `image` | Foto subida (`verificationImages`) |
| `video` | Video subido (`videos`) |
| `video_link` | URL externa (`purchaseProofVideoUrl`) |

### Campos resumen en cliente

Tras `enrichPromotionClientFields`:

- `purchaseProofCount`, `purchaseProofImageCount`, `purchaseProofVideoLinkCount`, `purchaseProofVideoUploadCount`
- `hasPurchaseProof`

### Consultar estado

`GET /api/promotions/:id` — incluye todos los campos anteriores.

Listado propio (futuro): filtrar con `GET /api/promotions?verificationStatus=pending_review&sourceChannel=mobile_app`.

---

## 7. Errores

| HTTP | `code` | Cuándo |
|------|--------|--------|
| 400 | `VERIFICATION_REQUIRES_MEDIA` | Sin deal explícito sin foto ni link ni video |
| 400 | `INVALID_PROMOTION_KIND` | `promotionKind` inválido |
| 403 | `DEAL_CREATION_WEB_ONLY` | App intenta `hasDeal: true` |
| 400 | `NOT_VERIFICATION_PROMOTION` | `purchase-proof` en promo con deal |
| 400 | `PROMOTION_KIND_IMMUTABLE` | Intento de convertir sin deal → con deal |
| 403 | `PROMOTION_NOT_REDEEMABLE` | Intento de cupón QR en promo sin deal |

---

## 8. Ejemplos curl

### Crear promo sin deal (flyer + ticket + link video)

```bash
curl -sS -X POST "https://www.damecodigo.com/api/promotions" \
  -H "Accept: application/json" \
  -F "title=2x1 hamburguesa Local X" \
  -F "hasDeal=false" \
  -F "promotionKind=verification_only" \
  -F "sourceChannel=mobile_app" \
  -F "category=food" \
  -F "originalPrice=120" \
  -F "currentPrice=60" \
  -F "currency=MXN" \
  -F "redirectInsteadOfQr=false" \
  -F "images=@flyer.jpg" \
  -F "verificationImages=@ticket.jpg" \
  -F "purchaseProofVideoUrl=https://www.youtube.com/watch?v=XXXXXXXX"
```

### Solo link de video (sin foto de ticket)

```bash
curl -sS -X POST "https://www.damecodigo.com/api/promotions" \
  -F "title=Promo verificada por video" \
  -F "hasDeal=false" \
  -F "promotionKind=verification_only" \
  -F "sourceChannel=mobile_app" \
  -F "images=@promo.jpg" \
  -F "purchaseProofVideoUrl=https://drive.google.com/file/d/XXXX/view"
```

### Añadir evidencia a promo existente

```bash
curl -sS -X POST "https://www.damecodigo.com/api/promotions/PROMO_ID/purchase-proof" \
  -F "verificationImages=@recibo.jpg"
```

---

## 9. Checklist implementación app

### Payload (`buildPayload` / `promotionsApi.ts`)

```ts
// Cuando uploadDealMode === 'sin_deal'
{
  hasDeal: false,
  promotionKind: 'verification_only',
  sourceChannel: 'mobile_app',
  redirectInsteadOfQr: false,
  // FormData:
  // - images[]           → flyer de la promo
  // - verificationImages[] → ticket / recibo
  // - purchaseProofVideoUrl → string (opcional si hay foto)
}
```

### UI

- [ ] Pantalla o paso **“Prueba de compra”** separado del cartel promocional.
- [ ] Selector: **foto de ticket** y/o **pegar link de video**.
- [ ] Validación local: al menos uno antes de submit (si `sin_deal`).
- [ ] Tras `201`, mostrar disclaimers (`thirdPartyDisclaimers`) — no nativa Cryptomarketing, sin contrato.
- [ ] Badge comunitario progresivo (ver §11): 10 → 100 → N dinámico.
- [ ] **No** botón “Obtener cupón” (`showRedeemButton: false`).

### Referencia componentes (nombres del spec original)

- `UploadPromotionsScreen`
- `UploadPromotionDealChoiceModal` (`uploadDealMode === 'sin_deal'`)
- `src/services/promotionsApi.ts`

---

## 10. Moderación (CRM)

**Regla de producto:** las promos sin deal **con evidencia** se publican **directo** (auto-aprobación). El super admin solo interviene en casos excepcionales (rechazo, apelación, fraude).

| Método | Ruta | Uso |
|--------|------|-----|
| `GET` | `/api/admin/crm/promotions/verification-queue` | Casos pendientes / excepcionales |
| `PATCH` | `/api/admin/crm/promotions/:id/verification` | Rechazar o revertir (solo super admin) |

---

## 11. Badge comunitario (mapa / home)

Flujo planificado en app: progreso **“Verificada por 10” → “por 100” → “por N”** (N dinámico).

### Campos API

| Campo | Valores | Default |
|-------|---------|---------|
| `verificationBadgeTier` | `target_10`, `target_100`, `target_custom`, `none` | `target_10` |
| `verificationBadgeTarget` | número (solo con `target_custom`) | — |

Respuesta enriquecida:

```json
"communityVerification": {
  "badgeTier": "target_10",
  "targetCount": 10,
  "currentCount": 0
},
"communityVerificationBadgeLabel": "Verificada por 0/10"
```

`currentCount` se incrementará cuando la app implemente el flujo comunitario (futuro).

### UI mapa / home

- Mostrar badge según `communityVerificationBadgeLabel`.
- **Sin** botón de canjear cupón.
- Mostrar siempre:
  - *“Oferta de tercero. No es campaña nativa de Cryptomarketing.”*
  - *“Sin contrato con la marca. Precios y condiciones pueden cambiar.”*

---

## 12. Decisiones de producto (cerradas)

### 1. ¿Convertir sin deal → con deal?

**No.** Son propósitos distintos:

- **Sin deal:** validar promos de **terceros** no registrados en el ecosistema; demostrar lealtad/fidelidad al ecosistema aunque la marca no esté dentro.
- **Con deal:** campaña comercial con contrato, cupón y comisiones.

El API bloquea `PROMOTION_KIND_IMMUTABLE` si se intenta cambiar `verification_only` a `with_deal`.

### 2. ¿Badge en mapa/home sin canjear?

**Sí.** Badge comunitario por hitos (10 / 100 / N). Sin botón de cupón.

### 3. ¿Quién aprueba?

**Super admin** puede rechazar vía CRM, pero **con evidencia la promo pasa directo** (auto-aprobada). Debe quedar claro en UI que **no es nativa de Cryptomarketing**.

### 4. ¿`status=active` y `verificationStatus=approved` obligatorios?

**No ambos como requisito rígido de negocio**, pero con evidencia el backend asigna:

- `verificationStatus: approved`
- `status: active`

Siempre mostrar en cliente:

- Sin contrato con la marca.
- Oferta puede cambiar (no hay deal específico de trabajo con la marca).

---

*Última actualización: decisiones de producto mayo 2026 + auto-aprobación terceros.*
