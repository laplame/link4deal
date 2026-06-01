# Usuarios demo — dashboards por rol

Script: `server/scripts/seed-demo-dashboard-users.js`

## Crear en MongoDB

```bash
node server/scripts/seed-demo-dashboard-users.js --apply
# o
npm run seed:demo-users -- --apply
```

Contraseña por defecto: **`DemoLink4Deal2026!`**  
Override: `DEMO_USERS_PASSWORD=tuClave node server/scripts/seed-demo-dashboard-users.js --apply`

## Cuentas

| Rol | Email | Tras login (hub compartido) |
|-----|--------|---------------------------|
| Usuario | `demo.usuario@damecodigo.mx` | `/marketplace` (Tienda) |
| Influencer | `demo.influencer@damecodigo.mx` | `/marketplace` + menú «Mi espacio» (perfil, subastas…) |
| Marca | `demo.marca@damecodigo.mx` | `/marketplace` + crear promoción, aplicaciones |
| Agencia | `demo.agencia@damecodigo.mx` | `/marketplace` + setup agencia |

Los paneles `/dashboard/influencer`, `/dashboard/brand`, `/dashboard/agency` y `/dashboard` están reservados al **superusuario** (`/dashboard/suite`).

Influencer público: `/influencer/demo-influencer` (código `DEMOINF`).

## Notas

- Emails con prefijo `demo.` para identificarlos fácilmente en la BD.
- Re-ejecutar `--apply` **resetea la contraseña** al valor configurado y actualiza vínculos Brand/Agency/Influencer.
- No son super admin (`isSuperAdmin: false`).
