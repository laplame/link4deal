# Onboarding de marca + cruce BizneAI ↔ DameCodigo

## Identificador canónico: `shopId`

- **Formato:** ObjectId Mongo de 24 caracteres hex (ej. `691a59f9529b1c88366b342c`).
- **Origen:** tienda creada en la app **BizneAI** ([www.bizneai.com](https://www.bizneai.com/)).
- **Uso en DameCodigo:**
  - Campo `brands.bizneShopId` (vínculo perfil marca).
  - Campo `promotions.shopId` al publicar (`POST /api/promotions`, multipart, `PromotionPayload.shopId`).
  - Filtro listado: `GET /api/promotions?shopId={id}`.
  - Verify/redeem: `POST /api/discount-qr/verify` y `/redeem` con el mismo `shopId` del POS.

No confundir:

| ID | Qué es |
|----|--------|
| **shopId** (24 hex) | Tienda BizneAI; cruce entre APIs |
| **promotion `_id`** | Cupón/oferta en DameCodigo |
| **allowedProductIds[]** | SKU/producto del catálogo Bizne (no es el shopId) |

## Flujos de pantalla

| Rol | Ruta | Contenido |
|-----|------|-----------|
| Admin | `/admin/brands` | Todas las marcas |
| Marca dueña | `/dashboard/brand` | Bizne shop + cupones filtrados por `shopId` |
| Registro | `/brand-setup` | Login + `bizneShopId` obligatorio |

## APIs marca (DameCodigo)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/bizne-shops/:id` | Proxy → ficha tienda BizneAI |
| `GET` | `/api/brands/me` | Marca del usuario + snapshot `bizneShop` |
| `GET` | `/api/brands/me/promotions?status=all` | `docs[]` promociones con `shopId` o `allowedShopIds` = `bizneShopId` |
| `PATCH` | `/api/brands/me/bizne-shop` | Body: `{ bizneShopId }`, `{ shopId }` o `{ bizneShopUrl }` (URL bizneai.com / DameCodigo `/shop/bizne/:id`) |
| `POST` | `/api/brands` | Crea marca; acepta `bizneShopId` o `bizneShopUrl` |

## APIs promociones (alineado app BizneAI)

Publicar (app merchant):

```
POST /api/promotions
multipart/form-data + PromotionPayload
shopId = BizneAI real (24 hex)
allowedProductIds = JSON string en FormData
```

Listar cupones de la tienda:

```
GET /api/promotions?shopId=691a59f9529b1c88366b342c&status=all
```

Respuesta: `{ success, data: { docs: [...], totalDocs, page, ... } }` — cada doc es un cupón DameCodigo, no un registro del API de shops.

Verify / canjear (mismo `shopId`):

```
POST /api/discount-qr/verify
POST /api/discount-qr/redeem
Body: shopId, qrValue | referralCode | couponCode, opcional productId
```

## Extraer shopId desde URL

En el panel de marca y en `/brand-setup`, el usuario puede pegar la URL del negocio en **bizneai.com** (o un enlace `https://www.damecodigo.com/shop/bizne/{shopId}`). El parser (`parseBizneShopUrl`) obtiene el ObjectId de 24 hex del path o query (`shopId`, `id`, …).

## Orden de datos (como en app shop)

1. URL o ID de tienda BizneAI → guardar en `brands.bizneShopId`.
2. `GET /api/bizne-shops/:id` → tarjeta tienda.
3. `GET /api/promotions?shopId=` o `GET /api/brands/me/promotions` → lista cupones.
4. Crear promo con `shopId` + `allowedProductIds`.
5. Verify/redeem con el mismo `shopId`.

## URLs web

- Detalle promo: `https://www.damecodigo.com/promotion-details/{promotionId}`
- Quick promotion: `https://www.damecodigo.com/quick-promotion?shopId={shopId}`
