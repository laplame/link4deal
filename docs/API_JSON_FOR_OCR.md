# JSON que renderiza el frontend (para OCR)

Este documento describe el **contrato de datos** que usa el frontend para mostrar la sección de **Influencers** y la de **Marketplace de promociones**. Sirve para saber qué JSON pedir o generar cuando se rellenen datos por **OCR** (por ejemplo, perfil del influencer o imagen de promoción).

---

## 1. Influencer (perfil para OCR)

La página **Influencers Marketplace** (`/influencers-marketplace`) y el modal de perfil esperan un objeto por influencer con esta forma. Es el mismo JSON que devuelve `GET /api/influencers` en `data.docs[]` y `GET /api/influencers/:id` en `data`.

**Campos que suelen poder extraerse por OCR del perfil del influencer** (nombre, usuario, seguidores por red, bio, ubicación, categorías):

```json
{
  "id": "string (ObjectId o UUID)",
  "name": "Nombre completo o nombre de perfil",
  "username": "@handle o username",
  "avatar": "URL de la foto de perfil",
  "followers": {
    "instagram": 125000,
    "tiktok": 89000,
    "youtube": 45000,
    "twitter": 32000
  },
  "totalFollowers": 291000,
  "engagement": 4.8,
  "categories": ["Moda", "Belleza", "Lifestyle"],
  "status": "active | pending | verified | suspended",
  "joinDate": "2023-03-15",
  "totalEarnings": 0,
  "monthlyEarnings": 0,
  "completedPromotions": 0,
  "activePromotions": 0,
  "rating": 0,
  "location": "Madrid, España",
  "bio": "Texto de la bio del perfil.",
  "socialMedia": {
    "instagram": "@mariagarcia",
    "tiktok": "@mariagarcia",
    "youtube": "María García",
    "twitter": "@mariagarcia"
  },
  "recentPromotions": [],
  "recentPayments": [],
  "couponStats": {
    "totalCoupons": 0,
    "activeCoupons": 0,
    "totalSales": 0,
    "totalCommission": 0,
    "averageConversion": 0
  },
  "hot": false,
  "featured": false
}
```

- **Respuesta del API (lista):** `GET /api/influencers?limit=50&page=1` → `{ "success": true, "data": { "docs": [ ... ] } }`.
- **Respuesta del API (uno):** `GET /api/influencers/:id` → `{ "success": true, "data": { ...objeto anterior } }`.

Para **OCR del perfil del influencer**, lo mínimo que hay que rellenar para que se vea bien en la UI: `name`, `username`, `followers` (por red), `totalFollowers`, `categories`, `bio`, `location`, `socialMedia`, `avatar` (opcional). El resto puede ir a 0 o vacío y el frontend lo muestra igual.

---

## 2. Promoción (Marketplace de promociones – para OCR)

La página **Promotions Marketplace** (`/promotions-marketplace`) transforma la respuesta de `GET /api/promotions` y renderiza cada ítem con esta forma. Es el JSON **después** de la transformación en el frontend (no el documento crudo de MongoDB).

**Campos que suelen poder extraerse por OCR de una imagen/flyer de promoción** (título, marca, precios, fechas, categoría):

```json
{
  "id": "string",
  "title": "Título de la promoción",
  "brand": "Marca",
  "category": "Moda | Tecnología | Deportes | Belleza | Hogar | Libros | Comida | Otros",
  "subcategory": "Ropa Femenina | Smartphones | ...",
  "description": "Descripción opcional",
  "originalPrice": 1000,
  "currentPrice": 799,
  "currency": "MXN",
  "discountPercentage": 20,
  "image": "URL de la imagen (ej. /uploads/promotions/xxx.jpg)",
  "location": "Ciudad de México",
  "validUntil": "2025-03-01T00:00:00.000Z",
  "totalApplications": 0,
  "maxApplications": 100,
  "status": "active | ending | closed",
  "auctionType": "dutch | english",
  "timeLeft": "5d 12h 30m",
  "influencerRequirements": ["General"],
  "commission": 15,
  "engagement": 4.5,
  "views": 0,
  "hot": false,
  "featured": false
}
```

- **Respuesta del API:** `GET /api/promotions?limit=50&page=1` → `{ "success": true, "data": { "docs": [ ... ] } }`. Cada elemento de `docs` tiene el formato del modelo del backend (por ejemplo `_id`, `title`, `brand`, `category`, `originalPrice`, `currentPrice`, `validUntil`, `images`, etc.). El frontend en `PromotionsMarketplace.tsx` convierte cada `promo` a la forma de arriba (incluyendo `category` mapeado a etiquetas en español, `timeLeft` calculado, `image` desde `getPromotionImageUrl(promo.images)`).

Para **OCR de una promoción**, lo mínimo útil: `title`, `brand`, `originalPrice`, `currentPrice`, `validUntil`, `category` (o mapear a una de las anteriores). Opcional: `description`, `location`, `currency`.

---

## Resumen de endpoints

| Sección              | Endpoint                      | Uso en frontend                          |
|----------------------|-------------------------------|------------------------------------------|
| Influencers          | `GET /api/influencers`        | Lista en Influencers Marketplace         |
| Influencers          | `GET /api/influencers/:id`    | Detalle / modal de perfil                |
| Marketplace promos  | `GET /api/promotions`        | Lista en Promotions Marketplace (transformada en front) |

El JSON de las secciones 1 y 2 es el que **renderiza** la información en la UI; ese es el que conviene pedir o generar con OCR para mantener consistencia con el backend y el frontend.
