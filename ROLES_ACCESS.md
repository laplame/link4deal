# Link4Deal — Roles, Accesos y Verificación

> Generado: 2026-06-26  
> Entorno: MongoDB Atlas · link4deal DB

---

## 1. Credenciales de Prueba

| Rol | Email | Contraseña | Perfil vinculado |
|-----|-------|-----------|-----------------|
| **Usuario básico** | demo.usuario@damecodigo.mx | `DemoLink4Deal2026!` | — |
| **Influencer** | demo.influencer@damecodigo.mx | `DemoLink4Deal2026!` | `username: demo-influencer` |
| **Marca** | demo.marca@damecodigo.mx | `DemoLink4Deal2026!` | `Demo Marca Link4Deal` |
| **Agencia** | demo.agencia@damecodigo.mx | `DemoLink4Deal2026!` | `Demo Agencia Link4Deal` |
| **Superusuario** | saul.laplame@gmail.com | *(contraseña propia)* | Email en PLATFORM_SUPERUSER_EMAILS |

> Contraseña regenerada con: `node server/scripts/seed-demo-dashboard-users.js --apply`
> Override con `DEMO_USERS_PASSWORD` en `.env`

---

## 2. Matriz de Accesos por Rol

### Rutas Frontend

| Ruta | usuario | influencer | brand | agency | admin/moderator | superuser |
|------|:-------:|:----------:|:-----:|:------:|:---------------:|:---------:|
| `/` (landing) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/marketplace` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/signin` / `/signup` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/influencer` (directorio) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/brands` (directorio) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/influencer/panel` | ❌→/marketplace | ✅ | ❌→/marketplace | ❌→/marketplace | ❌→/marketplace | ✅ |
| `/influencer/setup` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/brands/panel` | ❌→/marketplace | ❌→/marketplace | ✅ | ❌→/marketplace | ❌→/marketplace | ✅ |
| `/brands/aplicaciones` | ✅ (vacío) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/agency` | ❌→/signin | ❌→/marketplace | ❌→/marketplace | ✅ | ❌→/marketplace | ✅ |
| `/agency/setup` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/create-promotion` | ✅ | ❌ (nav) | ✅ | ✅ (nav) | ✅ | ✅ |
| `/quick-promotion` | ✅ | ❌ (nav) | ✅ | ✅ | ✅ | ✅ |
| `/admin` | ❌ (no guard) | ❌ (no guard) | ❌ (no guard) | ❌ (no guard) | ✅ | ✅ |
| `/admin/dashboard` | ❌→/signin o /dashboard | ❌ | ❌ | ❌ | ❌→/dashboard | ✅+PIN |
| `/admin/crm` | sin guard | sin guard | sin guard | sin guard | ✅ | ✅ |
| `/dashboard` | ❌→/marketplace | ❌→/marketplace | ❌→/marketplace | ❌→/marketplace | ❌→/marketplace | ✅ |
| `/dashboard/suite` | ❌→/marketplace | ❌→/marketplace | ❌→/marketplace | ❌→/marketplace | ❌→/marketplace | ✅ |
| `/dashboard/panel` | redirige por rol | ✅→/influencer/panel | ✅→/brands/panel | ✅→/agency | ✅→/admin | ✅ |

### APIs Backend

| Endpoint | Sin auth | usuario | influencer | brand | agency | admin | superuser |
|---------|:--------:|:-------:|:----------:|:-----:|:------:|:-----:|:---------:|
| `GET /api/promotions` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/promotions` | ✅ (no guard) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/auth/me` | ❌ 401 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/influencers/me` | ❌ 401 | ❌ 403 | ✅ | ❌ 403 | ❌ 403 | ✅ | ✅ |
| `GET /api/influencers/messages/inbox` | ❌ 401 | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| `GET /api/brands/me` | ❌ 401 | ❌ 404 | ❌ 404 | ✅ | ❌ 404 | ✅ | ✅ |
| `GET /api/brands/me/promotions` | ❌ 401 | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| `GET /api/agencies/mine` | ❌ 401 | ❌ (null) | ❌ (null) | ❌ (null) | ✅ | ✅ | ✅ |
| `GET /api/agencies/:id` | ✅ público | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `PUT /api/agencies/:id` | ❌ 401 | ❌ 403 | ❌ 403 | ❌ 403 | ✅ (owner) | ✅ | ✅ |
| `DELETE /api/promotions/:id` | ❌ 401 | ❌ 403 | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 3. Ruta Post-Login por Rol

| Rol | `defaultRouteAfterLogin()` retorna | Dashboard principal |
|-----|------------------------------------|---------------------|
| `user` | `/marketplace` | Marketplace público |
| `influencer` | `/influencer` (hub) | `/influencer/panel` (panel completo) |
| `brand` | `/brands` (hub) | `/brands/panel` |
| `agency` | `/agency` | `/agency` (panel + API real) |
| `admin` / `moderator` | `/admin` | `/admin/crm`, `/admin/dashboard` |
| `superuser` | `/dashboard/suite` | Suite multi-panel |

---

## 4. Escenarios de Verificación

### Escenario 1 — Login como Influencer
1. Ir a `/signin`
2. Email: `demo.influencer@damecodigo.mx` · Pass: `DemoLink4Deal2026!`
3. **Esperado**: redirige a `/influencer` (hub del directorio)
4. Navegar a `/influencer/panel` → panel con secciones: Eventos, Pagos, UGC, Mensajes
5. Intentar `/brands/panel` → **debe redirigir a `/marketplace`** (no bucle)
6. Intentar `/dashboard/suite` → **debe redirigir a `/marketplace`** (SuperuserOnlyRoute)
7. Menú "Mi espacio" muestra: Tienda, Influencers, Mi panel, Mi perfil creador, Subastas, Redenciones

### Escenario 2 — Login como Marca
1. Email: `demo.marca@damecodigo.mx` · Pass: `DemoLink4Deal2026!`
2. **Esperado**: redirige a `/brands`
3. Navegar a `/brands/panel` → panel con datos de marca Demo Marca Link4Deal
4. Panel carga `/api/brands/me` → muestra estado de BizneAI linking
5. Intentar `/influencer/panel` → **debe redirigir a `/marketplace`**
6. Menú muestra: Tienda, Mis marcas, Panel marca, Crear promoción, Oferta rápida, Mis aplicaciones

### Escenario 3 — Login como Agencia
1. Email: `demo.agencia@damecodigo.mx` · Pass: `DemoLink4Deal2026!`
2. **Esperado**: redirige a `/agency`
3. Panel carga `/api/agencies/mine` → detalle real de "Demo Agencia Link4Deal"
4. Métricas desde API: miembros, vistas, tipo de agencia
5. Intentar `/brands/panel` → **debe redirigir a `/marketplace`**
6. Menú muestra: Tienda, Mi agencia, Configurar agencia, Marcas, Influencers

### Escenario 4 — Login como Superusuario
1. Email: `saul.laplame@gmail.com` · Pass: *(propia)*
2. **Esperado**: redirige a `/dashboard/suite`
3. Suite multi-panel: puede ver paneles de influencer, brand y agency simultáneamente
4. Acceso a `/admin/dashboard` (requiere PIN adicional)
5. Menú muestra: Suite multi-panel, CRM, Administración, Promociones admin
6. `isPlatformSuperuser: true` en JWT → todas las rutas de rol accesibles

### Escenario 5 — Usuario sin rol específico
1. Email: `demo.usuario@damecodigo.mx` · Pass: `DemoLink4Deal2026!`
2. **Esperado**: redirige a `/marketplace`
3. Intentar `/influencer/panel` → redirige a `/marketplace`
4. Intentar `/brands/panel` → redirige a `/marketplace`
5. Intentar `/agency` → redirige a `/signin` (no autenticado checa primero) o `/marketplace`
6. Menú "Mi espacio" muestra: Tienda, Categorías, Carrito

### Escenario 6 — Acceso no autenticado
1. Sin sesión, intentar `/influencer/panel` → redirige a `/signin?from=/influencer/panel`
2. Sin sesión, intentar `/brands/panel` → redirige a `/signin?from=/brands/panel`
3. Sin sesión, intentar `/dashboard/suite` → redirige a `/signin`
4. Sin sesión, intentar `/admin/dashboard` → redirige a `/signin`
5. Sin sesión, `/marketplace` → accesible (hub público)

### Escenario 7 — Token expirado / inválido
1. Modificar `auth_token` en localStorage con valor inválido
2. Recargar página → `loadUserFromStorage` llama `/api/auth/me` → 401
3. Intenta refresh token → si falla, `clearAuth()` → usuario deslogueado
4. Redirige a `/signin` con estado `from` para volver después del login

---

## 5. Información Requerida por Rol

### Influencer (`/influencer/panel`)
- Perfil propio: `GET /api/influencers/me`
  - `name`, `username`, `avatar`, `totalFollowers`, `engagement`
  - `totalEarnings`, `monthlyEarnings`, `completedPromotions`, `activePromotions`
  - `profileShortCode`, `categories`, `socialMedia`
  - `recentPromotions[]`, `recentPayments[]`, `ugcProfile`
- Bandeja entrada: `GET /api/influencers/messages/inbox`
- Perfil UGC: editar desde panel `/influencer/panel?hub=ugc`

### Marca (`/brands/panel`)
- Perfil marca: `GET /api/brands/me`
  - `companyName`, `industry`, `headquarters`, `status`
  - `bizneShopId` (vinculación con BizneAI)
- Tienda BizneAI: `GET /api/bizne-shops/:shopId` (si existe)
- Promociones propias: `GET /api/brands/me/promotions`
- Postulaciones: `GET /api/applications?brandId=...`

### Agencia (`/agency`)
- Agencia propia: `GET /api/agencies/mine` → id → `GET /api/agencies/:id`
  - `name`, `type`, `status`, `isVerified`, `headquarters`
  - `contact.email`, `contact.phone`, `contact.address`
  - `metrics.views`, `metrics.clients`, `metrics.totalRevenue`
  - `members[]` con `user.firstName`, `user.lastName`, `user.email`, `role`
  - `description`, `website`, `createdAt`

### Superusuario (`/dashboard/suite`)
- Vista multi-panel: consume APIs de influencer + brand + agency simultáneamente
- `GET /api/promotions?status=all` (todas las promociones)
- `GET /api/influencers?limit=50` (directorio completo)
- `GET /api/brands` / `GET /api/agencies` (listados globales)
- Acceso a `/admin/crm/pipeline`, `/admin/crm/applications`, `/admin/crm/open-promotions`
- Acceso a `/admin/dashboard` con PIN adicional (ADMIN_ACCESS_PIN en .env)

---

## 6. Guards de Rutas — Estado Actual

| Ruta | Guard Frontend | Guard Backend | Estado |
|------|---------------|---------------|--------|
| `/influencer/panel` | `canAccessRolePanel(user,'influencer')` + auth | `authenticateToken` en `/api/influencers/me` | ✅ OK |
| `/brands/panel` | `primaryRole==='brand'` o superuser + auth | `authenticateToken` en `/api/brands/me` | ✅ OK |
| `/agency` | `canAccessRolePanel(user,'agency')` + auth | `authenticateToken` en `/api/agencies/mine` | ✅ OK |
| `/dashboard` | `SuperuserOnlyRoute` | — | ✅ OK |
| `/dashboard/suite` | `SuperuserOnlyRoute` | — | ✅ OK (corregido) |
| `/admin` | *(sin guard frontend)* | — | ⚠️ Sin protección frontend |
| `/admin/crm` | *(sin guard frontend)* | `requireSuperAdmin` en algunas rutas | ⚠️ Inconsistente |
| `/admin/dashboard` | `isSuperAdmin` check + PIN | — | ✅ OK |

> **Nota:** `/admin` y `/admin/crm` no tienen `SuperuserOnlyRoute` en el frontend.
> Un usuario normal puede ver la página pero las APIs fallarán con 403.
> Recomendado: agregar `canAccessAdminRoute` como guard en esas rutas.

---

## 7. Comandos Útiles

```bash
# Regenerar usuarios demo
node server/scripts/seed-demo-dashboard-users.js --apply

# Ver usuarios en DB
node server/scripts/check-auth-credentials.js

# Elevar usuario a super admin
node server/scripts/promote-user-to-super-admin.js <email>

# Eliminar usuario por email
node server/scripts/delete-user-by-email.js <email>

# Crear/actualizar roles del sistema
node server/scripts/seed-roles.js
```

---

## 8. Variables de Entorno Relevantes

| Variable | Descripción | Impacto en roles |
|----------|-------------|-----------------|
| `JWT_SECRET` | Firma del JWT | Todas las rutas autenticadas |
| `PLATFORM_SUPERUSER_EMAILS` | Emails con acceso superusuario | Whitelist de superadmins |
| `ADMIN_ACCESS_PIN` | PIN para `/admin/dashboard` | Protección extra admin |
| `DEMO_USERS_PASSWORD` | Contraseña seed demo | Usuarios de prueba |
| `SESSION_EXPIRES_IN` | TTL del JWT (default: 24h) | Duración de sesión |
