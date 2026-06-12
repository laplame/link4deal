# Postman — Auth y rutas protegidas Link4Deal

## Importar

1. Postman → **Import** → arrastra estos archivos:
   - `Link4Deal-Auth.postman_collection.json`
   - `Link4Deal-Local.postman_environment.json`
2. Selecciona el entorno **Link4Deal — Local** (esquina superior derecha).

## Preparar la base de datos

```bash
# Usuarios demo (usuario, influencer, marca, agencia)
node server/scripts/seed-demo-dashboard-users.js --apply

# Super admin (opcional; ajusta email/contraseña en el entorno Postman)
node server/scripts/promote-user-to-super-admin.js
```

Contraseña demo por defecto: `DemoLink4Deal2026!`

## Uso rápido

1. Arranca el backend: `npm run dev` o el proceso PM2 en el puerto de `baseUrl` (por defecto `3000`).
2. Ejecuta **01 — Login (todos los roles)** (Run folder).
3. Cada login guarda su token en variables:
   - `token_usuario`, `token_influencer`, `token_brand`, `token_agency`, `token_superadmin`
4. Las carpetas **03–11** usan el Bearer correspondiente automáticamente.

## Variables del entorno

| Variable | Descripción |
|----------|-------------|
| `baseUrl` | API backend (`http://localhost:3000`) |
| `frontendUrl` | SPA Vite (`http://localhost:5173`) |
| `demoPassword` | Contraseña cuentas demo |
| `email_*` | Emails por rol |
| `superAdminPassword` | Contraseña super admin |
| `brandDashboardPin` | PIN panel marcas (`ADMIN_ACCESS_PIN`, default `6192`) |
| `token_*` | JWT por rol (se llenan al hacer login) |
| `influencerId`, `brandId`, `agencyId` | IDs (se llenan con GET `/me` o `/mine`) |

## Rutas protegidas incluidas

- **Auth:** `/api/auth/login`, `/me`, `/refresh`, `/logout`
- **Influencer:** `/api/influencers/me`, app (`/app/campaigns`, `/app/verify-session`, settlements)
- **Marca:** `/api/brands/me`, `/api/brands/me/promotions`
- **Agencia:** `/api/agencies/mine`, `/api/agencies/:id/analytics`
- **Panel marcas:** `/api/promotion-applications/brand` (JWT super admin o header `X-Brand-Dashboard-Password`)
- **Super admin:** `/api/admin/crm/*`, `/api/admin/instagram/*`, `/api/admin/outbound/*`, `/api/app-downloads`, `/api/users/*`

La carpeta **12 — Referencia rutas SPA** lista páginas del frontend (`/admin`, `/dashboard/suite`, etc.) que requieren sesión en el navegador.

## Producción

Duplica el entorno y cambia:

- `baseUrl` → `https://www.damecodigo.com` (o tu dominio API)
- Credenciales reales (no uses las demo en producción)
