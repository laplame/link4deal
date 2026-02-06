# Análisis de APIs de Promociones - Link4Deal

## 📊 Resumen Ejecutivo

Este documento analiza las APIs existentes para promociones, identifica qué métodos tenemos implementados y qué funcionalidades faltan según los features definidos en Gherkin.

---

## ✅ APIs EXISTENTES (Implementadas)

### 🔓 Rutas Públicas

| Método | Endpoint | Descripción | Estado |
|--------|----------|-------------|--------|
| `GET` | `/api/promotions` | Obtener todas las promociones (con paginación y filtros) | ✅ Implementado |
| `GET` | `/api/promotions/hot` | Obtener ofertas calientes | ✅ Implementado |
| `GET` | `/api/promotions/category/:category` | Obtener promociones por categoría | ✅ Implementado |
| `GET` | `/api/promotions/search` | Buscar promociones | ✅ Implementado |
| `GET` | `/api/promotions/stats/overview` | Obtener estadísticas generales | ✅ Implementado |
| `GET` | `/api/promotions/status` | Verificar salud del servicio | ✅ Implementado |
| `GET` | `/api/promotions/:id` | Obtener promoción por ID | ✅ Implementado |

### 🔒 Rutas Protegidas (Requieren Autenticación)

| Método | Endpoint | Descripción | Estado |
|--------|----------|-------------|--------|
| `POST` | `/api/promotions` | Crear nueva promoción | ✅ Implementado |
| `PUT` | `/api/promotions/:id` | Actualizar promoción | ✅ Implementado |
| `DELETE` | `/api/promotions/:id` | Eliminar promoción | ✅ Implementado |

### 👨‍💼 Rutas de Administración

| Método | Endpoint | Descripción | Estado |
|--------|----------|-------------|--------|
| `GET` | `/api/promotions/admin/all` | Obtener todas las promociones (admin) | ✅ Implementado |
| `GET` | `/api/promotions/admin/stats` | Obtener estadísticas detalladas (admin) | ✅ Implementado |

### 🔔 Webhooks

| Método | Endpoint | Descripción | Estado |
|--------|----------|-------------|--------|
| `POST` | `/api/promotions/webhook/cloudinary` | Webhook de Cloudinary | ✅ Implementado |

---

## ❌ APIs FALTANTES (Según Features Gherkin)

### 1. Sistema de Aplicaciones de Influencers

**Problema**: El frontend tiene el modal de aplicación (`PromotionApplicationModal`), pero no hay API para guardar las aplicaciones.

#### APIs Necesarias:

| Método | Endpoint | Descripción | Prioridad |
|--------|----------|-------------|-----------|
| `POST` | `/api/promotions/:id/applications` | Crear aplicación a promoción | 🔴 Alta |
| `GET` | `/api/promotions/:id/applications` | Obtener aplicaciones de una promoción | 🔴 Alta |
| `GET` | `/api/promotions/applications/my` | Obtener mis aplicaciones (influencer) | 🔴 Alta |
| `GET` | `/api/promotions/applications/received` | Obtener aplicaciones recibidas (marca) | 🔴 Alta |
| `GET` | `/api/promotions/applications/:applicationId` | Obtener detalle de aplicación | 🟡 Media |
| `PUT` | `/api/promotions/applications/:applicationId` | Actualizar aplicación | 🟡 Media |
| `DELETE` | `/api/promotions/applications/:applicationId` | Cancelar aplicación | 🟡 Media |
| `PUT` | `/api/promotions/applications/:applicationId/approve` | Aprobar aplicación (marca) | 🔴 Alta |
| `PUT` | `/api/promotions/applications/:applicationId/reject` | Rechazar aplicación (marca) | 🔴 Alta |
| `GET` | `/api/promotions/:id/applications/stats` | Estadísticas de aplicaciones | 🟢 Baja |

**Modelo Necesario**: `Application` con campos:
- `promotionId` (ref a Promotion)
- `influencerId` (ref a User)
- `contentProposal` (String)
- `platforms` (Array)
- `estimatedReach` (Number)
- `portfolio` (Array de archivos)
- `pricing` (Object: type, amount, currency)
- `timeline` (Object: startDate, endDate, deliverables)
- `additionalNotes` (String)
- `status` (Enum: pending, approved, rejected, withdrawn)
- `createdAt`, `updatedAt`

---

### 2. Sistema de Subastas

**Problema**: El PRD menciona subastas holandesas e inglesas, pero no hay implementación en el backend.

#### APIs Necesarias:

| Método | Endpoint | Descripción | Prioridad |
|--------|----------|-------------|-----------|
| `POST` | `/api/promotions/:id/auction/bid` | Hacer puja en subasta | 🔴 Alta |
| `GET` | `/api/promotions/:id/auction` | Obtener estado de subasta | 🔴 Alta |
| `GET` | `/api/promotions/:id/auction/bids` | Obtener historial de pujas | 🟡 Media |
| `PUT` | `/api/promotions/:id/auction/start` | Iniciar subasta | 🟡 Media |
| `PUT` | `/api/promotions/:id/auction/end` | Finalizar subasta | 🟡 Media |
| `GET` | `/api/promotions/auction/active` | Obtener subastas activas | 🟡 Media |
| `GET` | `/api/promotions/auction/my-bids` | Obtener mis pujas | 🟡 Media |

**Campos Necesarios en Promotion Model**:
- `auctionType` (Enum: none, dutch, english)
- `auctionStatus` (Enum: not_started, active, ended)
- `currentPrice` (Number) - para subasta holandesa
- `startingPrice` (Number)
- `minimumPrice` (Number) - para holandesa
- `bidIncrement` (Number) - para inglesa
- `bids` (Array de objetos Bid)
- `auctionStartTime` (Date)
- `auctionEndTime` (Date)

**Modelo Necesario**: `Bid` con campos:
- `promotionId` (ref a Promotion)
- `influencerId` (ref a User)
- `amount` (Number)
- `bidType` (Enum: application, price_bid)
- `createdAt`

---

### 3. Gestión de Estado de Promociones

**Problema**: Faltan endpoints para pausar/activar y aprobar/rechazar promociones.

#### APIs Necesarias:

| Método | Endpoint | Descripción | Prioridad |
|--------|----------|-------------|-----------|
| `PUT` | `/api/promotions/:id/pause` | Pausar promoción | 🟡 Media |
| `PUT` | `/api/promotions/:id/activate` | Activar promoción | 🟡 Media |
| `PUT` | `/api/promotions/:id/approve` | Aprobar promoción (admin) | 🟡 Media |
| `PUT` | `/api/promotions/:id/reject` | Rechazar promoción (admin) | 🟡 Media |
| `PUT` | `/api/promotions/:id/expire` | Marcar como expirada | 🟢 Baja |
| `GET` | `/api/promotions/my` | Obtener mis promociones (marca) | 🔴 Alta |
| `GET` | `/api/promotions/my/drafts` | Obtener borradores | 🟡 Media |

---

### 4. Sistema de Favoritos

**Problema**: No hay funcionalidad para guardar promociones como favoritas.

#### APIs Necesarias:

| Método | Endpoint | Descripción | Prioridad |
|--------|----------|-------------|-----------|
| `POST` | `/api/promotions/:id/favorite` | Agregar a favoritos | 🟡 Media |
| `DELETE` | `/api/promotions/:id/favorite` | Quitar de favoritos | 🟡 Media |
| `GET` | `/api/promotions/favorites` | Obtener mis favoritos | 🟡 Media |
| `GET` | `/api/promotions/:id/is-favorite` | Verificar si es favorito | 🟢 Baja |

**Modelo Necesario**: `Favorite` con campos:
- `userId` (ref a User)
- `promotionId` (ref a Promotion)
- `createdAt`

---

### 5. Sistema de Reviews/Ratings

**Problema**: No hay sistema de calificaciones para promociones.

#### APIs Necesarias:

| Método | Endpoint | Descripción | Prioridad |
|--------|----------|-------------|-----------|
| `POST` | `/api/promotions/:id/reviews` | Crear review | 🟢 Baja |
| `GET` | `/api/promotions/:id/reviews` | Obtener reviews | 🟢 Baja |
| `PUT` | `/api/promotions/reviews/:reviewId` | Actualizar review | 🟢 Baja |
| `DELETE` | `/api/promotions/reviews/:reviewId` | Eliminar review | 🟢 Baja |
| `GET` | `/api/promotions/:id/rating` | Obtener rating promedio | 🟢 Baja |

**Modelo Necesario**: `Review` con campos:
- `promotionId` (ref a Promotion)
- `userId` (ref a User)
- `rating` (Number, 1-5)
- `comment` (String)
- `createdAt`, `updatedAt`

---

### 6. Tracking y Analytics Avanzados

**Problema**: Hay contadores básicos (views, clicks, conversions) pero faltan endpoints para tracking detallado.

#### APIs Necesarias:

| Método | Endpoint | Descripción | Prioridad |
|--------|----------|-------------|-----------|
| `POST` | `/api/promotions/:id/track/click` | Registrar click | 🟡 Media |
| `POST` | `/api/promotions/:id/track/view` | Registrar vista | 🟡 Media |
| `POST` | `/api/promotions/:id/track/conversion` | Registrar conversión | 🟡 Media |
| `GET` | `/api/promotions/:id/analytics` | Analytics detallados | 🟡 Media |
| `GET` | `/api/promotions/:id/analytics/timeline` | Analytics por fecha | 🟢 Baja |
| `GET` | `/api/promotions/:id/analytics/sources` | Analytics por fuente | 🟢 Baja |

---

### 7. Filtros y Búsqueda Avanzada

**Problema**: La búsqueda actual es básica. Faltan filtros avanzados.

#### Mejoras Necesarias:

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| Filtro por rango de precios | `?minPrice=100&maxPrice=1000` | 🟡 Media |
| Filtro por ubicación (geolocalización) | `?lat=19.4326&lng=-99.1332&radius=10` | 🟡 Media |
| Filtro por fecha de expiración | `?expiresIn=7` (días) | 🟢 Baja |
| Ordenamiento avanzado | `?sort=price_asc,created_desc` | 🟡 Media |
| Filtro por tipo de subasta | `?auctionType=dutch` | 🔴 Alta |
| Filtro por estado de aplicación | `?applicationStatus=pending` | 🔴 Alta |

---

### 8. Relación con Usuarios

**Problema**: El campo `createdBy` existe en el modelo pero no se está usando correctamente.

#### Mejoras Necesarias:

- Asociar promoción con usuario creador al crear
- Validar permisos al actualizar/eliminar (solo el creador o admin)
- Filtrar promociones por creador
- Endpoint: `GET /api/promotions/user/:userId` - Promociones de un usuario

---

### 9. Sistema de Notificaciones

**Problema**: No hay endpoints para gestionar notificaciones relacionadas con promociones.

#### APIs Necesarias:

| Método | Endpoint | Descripción | Prioridad |
|--------|----------|-------------|-----------|
| `GET` | `/api/promotions/notifications` | Obtener notificaciones | 🟡 Media |
| `PUT` | `/api/promotions/notifications/:id/read` | Marcar como leída | 🟢 Baja |
| `POST` | `/api/promotions/:id/notify` | Enviar notificación (admin) | 🟢 Baja |

**Eventos que deberían generar notificaciones**:
- Nueva aplicación recibida (marca)
- Aplicación aprobada/rechazada (influencer)
- Nueva puja en subasta
- Promoción cerca de expirar
- Promoción pausada/activada

---

## 📋 Resumen de Prioridades

### 🔴 Alta Prioridad (Crítico para MVP)
1. Sistema de aplicaciones de influencers
2. Sistema de subastas básico
3. Endpoint para obtener mis promociones
4. Aprobar/rechazar aplicaciones

### 🟡 Media Prioridad (Importante para funcionalidad completa)
1. Pausar/activar promociones
2. Sistema de favoritos
3. Tracking avanzado
4. Filtros avanzados
5. Notificaciones

### 🟢 Baja Prioridad (Nice to have)
1. Sistema de reviews/ratings
2. Analytics muy detallados
3. Funcionalidades adicionales

---

## 🗂️ Modelos de Datos Necesarios

### 1. Application Model
```javascript
{
  promotionId: ObjectId,
  influencerId: ObjectId,
  contentProposal: String,
  platforms: [String],
  estimatedReach: Number,
  portfolio: [File],
  pricing: {
    type: 'fixed' | 'commission' | 'hybrid',
    amount: Number,
    currency: String
  },
  timeline: {
    startDate: Date,
    endDate: Date,
    deliverables: [String]
  },
  additionalNotes: String,
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn',
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Bid Model
```javascript
{
  promotionId: ObjectId,
  influencerId: ObjectId,
  amount: Number,
  bidType: 'application' | 'price_bid',
  createdAt: Date
}
```

### 3. Favorite Model
```javascript
{
  userId: ObjectId,
  promotionId: ObjectId,
  createdAt: Date
}
```

### 4. Review Model
```javascript
{
  promotionId: ObjectId,
  userId: ObjectId,
  rating: Number, // 1-5
  comment: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔧 Mejoras al Modelo Promotion Actual

### Campos a Agregar:
```javascript
{
  // Subastas
  auctionType: {
    type: String,
    enum: ['none', 'dutch', 'english'],
    default: 'none'
  },
  auctionStatus: {
    type: String,
    enum: ['not_started', 'active', 'ended'],
    default: 'not_started'
  },
  startingPrice: Number,
  minimumPrice: Number, // Para holandesa
  bidIncrement: Number, // Para inglesa
  auctionStartTime: Date,
  auctionEndTime: Date,
  
  // Aplicaciones
  maxApplications: Number,
  currentApplications: { type: Number, default: 0 },
  requirements: {
    minFollowers: Number,
    minEngagement: Number,
    requiredPlatforms: [String],
    requiredCategories: [String]
  },
  
  // Configuración de campaña
  budget: Number,
  commissionPerLead: Number,
  commissionType: {
    type: String,
    enum: ['fixed', 'percentage', 'per_lead']
  }
}
```

---

## 📝 Notas de Implementación

1. **Autenticación**: Todas las rutas protegidas deben usar el middleware `auth`
2. **Validación**: Usar express-validator para validar inputs
3. **Rate Limiting**: Ya implementado para creación y búsqueda, considerar para otros endpoints
4. **Permisos**: Validar que solo el creador o admin puedan modificar/eliminar
5. **Paginación**: Usar mongoose-paginate para todos los listados
6. **Populate**: Usar populate para relaciones (User, Promotion, etc.)

---

## 🚀 Plan de Implementación Sugerido

### Fase 1 (Sprint 1-2)
- [ ] Modelo Application
- [ ] POST /api/promotions/:id/applications
- [ ] GET /api/promotions/:id/applications
- [ ] GET /api/promotions/applications/my
- [ ] PUT /api/promotions/applications/:id/approve
- [ ] PUT /api/promotions/applications/:id/reject

### Fase 2 (Sprint 3-4)
- [ ] Campos de subasta en Promotion model
- [ ] Modelo Bid
- [ ] POST /api/promotions/:id/auction/bid
- [ ] GET /api/promotions/:id/auction
- [ ] GET /api/promotions/auction/active

### Fase 3 (Sprint 5-6)
- [ ] PUT /api/promotions/:id/pause
- [ ] PUT /api/promotions/:id/activate
- [ ] GET /api/promotions/my
- [ ] Modelo Favorite
- [ ] Endpoints de favoritos

### Fase 4 (Sprint 7+)
- [ ] Tracking avanzado
- [ ] Filtros avanzados
- [ ] Sistema de notificaciones
- [ ] Reviews/ratings (opcional)

---

**Última actualización**: 2024  
**Versión del documento**: 1.0

