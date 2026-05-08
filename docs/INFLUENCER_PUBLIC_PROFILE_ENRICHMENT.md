# Perfil público del influencer: enriquecimiento desde la BD

Este documento describe cómo el perfil en rutas como `/influencer/:id` obtiene **resumen**, **pujas/colaboraciones** y **métricas de cupones** a partir de datos reales en MongoDB, y qué mejoras pueden seguir después.

---

## 1. Problema anterior

1. **`GET /api/influencers/:id`** devolvía `completedPromotions`, `activePromotions`, `totalEarnings`, `couponStats`, etc. **solo desde el documento `Influencer`**. Si esos campos no se mantenían manualmente, el frontend mostraba ceros.

2. **`GET /api/influencers/:id/bids`** solo incluía pujas cuya **promoción seguía vigente por `validUntil`**. Ignoraba:
   - Influencers con **solicitudes aprobadas** (`PromotionApplication`) pero sin documento en la colección `bids`.
   - Actividad real de **`DiscountQrToken`** (cupones emitidos/canjeados).

3. **`payload.influencerId` equivocado** (p. ej. literal `"guest"`) impedía que el agregado por influencer reflejara ventas hasta corregir emisión del cupón o ejecutar scripts de reasignación (ver historia en repo: `CouponRequestForm`, `server/scripts/reassign-discount-qr-influencer.js`).

---

## 2. Solución actual (implementada)

### 2.1 Módulo de servidor

Archivo principal: **`server/utils/influencerProfileEnrichment.js`**

Exporta:

| Función | Uso |
|--------|-----|
| `buildPublicProfileFieldOverrides(influencerId, existingFrontend)` | Campos para **mezclar** sobre el objeto ya formateado con `toFrontendFormat`. |
| `buildPublicInfluencerBidCards(influencerId)` | Lista de tarjetas “puja” para el perfil público. |
| `pricingToUsdCommission(pricing, bidUsdFallback)` | Convierte comisión desde `pricing` de solicitudes (p. ej. MXN→USD). |

Este módulo reutiliza **`buildInfluencerQrPromotionSummary`** (`server/utils/influencerQrPromotionSummary.js`), que agrupa cupones QR por promoción y cruza con **Bid**.

### 2.2 Integración en el controlador

**`server/controllers/influencerController.js`**

- Tras obtener el influencer, las respuestas de **`getInfluencerById`**, **`getInfluencerBySlug`** y **`getMe`** hacen **merge**:

  ```text
  data = { ...toFrontendFormat(doc), ...await buildPublicProfileFieldOverrides(id, data) }
  ```

  Si el enriquecimiento falla, se registra un warning y se devuelve el perfil base.

- **`getBids`** deja de filtrar a mano y delega en **`buildPublicInfluencerBidCards`**.

### 2.3 Fuentes de datos

| Fuente | Qué aporta |
|--------|-------------|
| `DiscountQrToken` | Cupones agrupados por `payload.promotionId`; conteos abiertos / canjeados / caducados sin uso; última fecha de canje. |
| `Promotion` | Título, marca, vigencia, estado en catálogo (ventana activa). |
| `Bid` | Comisión en **USD por venta** (`amountUsd`); estado; historial opcional en `bidHistory`. |
| `PromotionApplication` (status `approved`) | Comisión o tarifa en **`pricing`** (p. ej. MXN); se usa cuando no hay puja suficiente en USD. |

### 2.4 Significado aproximado de las métricas del resumen

- **Promociones activas**: promociones con ventana vigente en catálogo (`catalogActiveWindow` del resumen QR) **y** actividad de cupones (`open + redeemed > 0`), más **aprobaciones vigentes sin fila QR** ya contadas en el mismo resumen para no duplicar.
- **Promociones completadas**: filas con al menos un canje **y** campaña ya fuera de ventana activa.
- **Ingresos totales (USD estimado)**:

  ```text
  suma sobre promociones: (nº de canjes) × (comisión USD por venta)
  ```

  La comisión sale de **`Bid.amountUsd`** cuando existe; si no, de **`pricing`** de la solicitud aprobada (conversión **MXN→USD** usando **`USD_MXN_RATE`** en entorno; por defecto interno **18** si la variable no está definida).

- **`couponStats`**: se fusiona el máximo entre lo guardado en el documento `Influencer` y los agregados sobre tokens (total, abiertos, ventas/canajes, comisión estimada, tasa de conversión aproximada).

- **`recentPromotions`**: si el documento **no trae** `recentPromotions`, se sintetiza un listado corto desde el resumen QR + comisiones resueltas.

### 2.5 Tarjetas en “Sistema de Pujas”

Prioridad efectiva:

1. **Puja real** (`Bid`): id del documento `bids`.
2. **Sin puja pero con solicitud aprobada vigente/actividad**: id sintético `app-<PromotionApplication._id>`; comisión desde `pricing` + conversión cuando aplica.
3. **Sin lo anterior pero con tokens QR** para esa promoción: id sintético `qr-<promotionId>`; comisión mínima plausible si falta mejor dato.

Una puja puede mostrarse aunque la promoción haya cerrado **`validUntil`**, si hay **actividad de cupones** (canjes u cupones ligados); así el historial no desaparece del perfil.

### 2.6 Frontend

**`src/pages/InfluencerProfilePage.tsx`** consume los mismos endpoints; se añadieron textos aclaratorios (USD estimado, número de campañas junto al total de movimientos de puja).

---

## 3. Variables de entorno relacionadas

| Variable | Rol |
|---------|-----|
| `MONGODB_URI_ATLAS` / `MONGODB_URI` | Conexión a la BD donde viven influencers, bids, aplicaciones y `DiscountQrToken`. |
| **`USD_MXN_RATE`** | Tipo de cambio opcional para estimar USD desde montos MXN en `PromotionApplication.pricing`. |

---

## 4. Archivos relacionados (referencia rápida)

- `server/utils/influencerProfileEnrichment.js` — lógica de enriquecimiento y tarjetas.
- `server/utils/influencerQrPromotionSummary.js` — agregación QR por promoción + bids.
- `server/controllers/influencerController.js` — merge en GET perfil + `getBids`.
- `server/routes/influencers.js` — rutas `/:id`, `/by-slug/:slug`, `/me`, `/:id/bids`, `/:id/qr-promotions-summary`, etc.
- `server/models/Bid.js`, `PromotionApplication.js`, `DiscountQrToken.js`.
- Scripts de corrección/atribución (ej. **`server/scripts/reassign-discount-qr-influencer.js`**) y helpers shell en **`scripts/reassign-guest-coupons-to-*.sh`**.

---

## 5. Implementaciones posteriores posibles

### 5.1 Datos financieros y cumplimiento

- **Liquidaciones reales**: persistir pagos ejecutados (tabla/colección `payouts` o similar) y mostrar **“cobrado”** vs **“estimado”**.
- Moneda única configurable por marca/región (**MXN** en UI cuando la fuente es MXN) en lugar de asumir solo USD estimado.

### 5.2 Valoración (`rating`)

- Hoy **`rating`** sigue saliendo solo del campo en **`Influencer`**. Opciones futuras:
  - media de reseñas de marca,
  - score derivado de tasa de canje vs cupones emitidos,
  - o dejar editable solo desde admin/dashboard.

### 5.3 Rendimiento

- Cache en Redis/memoria TTL corto por `influencerId` para `buildPublicProfileFieldOverrides` / `buildInfluencerQrPromotionSummary` en perfiles muy visitados.
- Invalidación al crear canje o al cambiar estado de aplicación/puja.

### 5.4 Pujas en vivo y reglas de negocio

- Conectar botones **“Pujar”** del perfil a un **endpoint real de incremento de `Bid`** (hoy puede ser sólo UX).
- Validar **mínimo $1 USD** y **incrementos** contra reglas por promoción.
- Soporte para **varias marcas** pujando la misma promoción si el modelo de negocio lo permite (actualmente suele predominar puja única por par influencer×promoción).

### 5.5 Aplicaciones sin promoción en catálogo “active”

- Si **`Promotion.status`** o fechas divergen del negocio real, revisar **`catalogPromotionIsLive`** para alinear con el estado que usa el marketplace (`PROMOTION_SCHEMA_APP_REFERENCE.md`, etc.).

### 5.6 Métricas y auditoría

- Campo opcional **`payload.attributionConfirmedAt`** o similar en **`DiscountQrToken`** tras revisión manual.
- Panel admin: vista de discrepancias **guest vs influencer conocido**.
- Export CSV de **estimación de comisiones** por influencer y período para contabilidad.

### 5.7 Internacionalización (i18n)

- Mensajes del perfil (USD estimado, leyendas) movidos a un catálogo de strings si el site pasa a multi-idioma fijo.

### 5.8 Pruebas

- Tests de integración con Mongo en memoria o fixtures que cubran:
  - solo aplicación aprobada,
  - solo `Bid`,
  - solo QR sin bid,
  - mezclas y merges con campos legacy en `Influencer`.

---

## 6. Resumen ejecutivo

El perfil público deja depender sólo del documento **`Influencer`** para KPIs que ya están implícitos en **cupones atribuidos**, **pujas** y **solicitudes aprobadas**. Los importes monetarios que se muestran como ingresos son **estimaciones en USD** (canjes × comisión), no liquidaciones contables hasta que exista un modelo de payouts explícito.

Para mantener coherencia, conviene:**(1)** emitir QR con **`influencerId`** correcto desde web/app; **(2)** tener **`Bid`** y/o **`PromotionApplication`** coherentes por campaña; **(3)** revisar **`USD_MXN_RATE`** si la mayoría de precios llegan en MXN.
