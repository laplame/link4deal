# Contextos de dashboards

Dos familias distintas: **administración Link4Deal** (staff) y **panel del rol** (usuario final).

## Panel por rol (usuario)

| Rol | Ruta | Componente | Descripción |
|-----|------|------------|-------------|
| `user` | `/dashboard` | `UserDashboard` | Cuenta estándar |
| `influencer` | `/dashboard/influencer` | `InfluencerDashboard` | Hub creador (UGC, mensajes, cupones) |
| `brand` | `/dashboard/brand` | `BrandOwnerDashboard` | Mi marca + vínculo BizneAI + promos por `shopId` |
| `agency` | `/dashboard/agency` | `AgencyDashboard` | Panel agencia (demo; datos reales vía API agencias pendiente) |

## Administración Link4Deal (staff)

Requiere `primaryRole` `admin` / `moderator`, o `isSuperAdmin` / `isPlatformSuperuser`.

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/admin` | `AdminPage` | Índice admin (superadmin) |
| `/admin/dashboard` | `SuperAdminDashboardPage` | Promociones globales + PIN |
| `/admin/crm` | `InfluencerCrmPage` | CRM influencers |
| `/admin/influencers` | `AdminInfluencersPage` | Puerta de entrada admin (enlaces a CRM, no el hub creador) |
| `/admin/brands` | `AdminBrandsPage` → `BrandDashboard` | Listado de **todas** las marcas |
| `/admin/agencies` | `AdminAgenciesPage` → `AgencyDashboard` | Directorio agencias (demo) |
| `/admin/promotions` | `PromotionsManagePage` | Gestión promociones |
| `/admin/api-docs` | `ApiDocsPage` | Documentación API |

## Multi-panel (Saul / superusuario)

| Ruta | Uso |
|------|-----|
| `/dashboard/suite` | Pestañas: vista **rol** creador / marca / agencia (no listados admin) |
| `?panel=agency` | Pestaña agencia en suite |

La suite usa `BrandOwnerDashboard` para marca, no el listado admin de `/admin/brands`.

## Reglas de acceso (código)

- `src/config/dashboardContexts.ts` — rutas y helpers `canAccessAdminRoute`, `canAccessRolePanel`, `defaultRouteAfterLogin`.
- Tras login: `defaultRouteAfterLogin(user)`.

## Errores frecuentes

| Confusión | Correcto |
|-----------|----------|
| Influencer entra en `/admin/influencers` | `/dashboard/influencer` |
| Marca entra en `/admin/brands` | `/dashboard/brand` |
| Admin gestiona influencers en el hub UGC | `/admin/crm` |
| Suite pestaña «Marca» muestra listado Zara/Samsung | Debe ser panel dueño (`BrandOwnerDashboard`) |
