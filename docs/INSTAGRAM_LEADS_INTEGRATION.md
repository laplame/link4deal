# Integración Instagram / Meta — seguimiento de leads

## Resumen

Captura interacciones de Instagram (comentarios, DMs, menciones) vía **webhooks** y **sync Graph API**, las guarda en MongoDB (`instagram_leads`) y permite gestionarlas en el CRM admin.

Sin credenciales Meta el sistema funciona en **modo stub**: sync crea leads de demostración; OAuth y Graph API se activan al configurar variables de entorno.

## Variables de entorno

Ver `env.example` — sección `META / INSTAGRAM`.

| Variable | Uso |
|----------|-----|
| `META_APP_ID` | App ID de Meta |
| `META_APP_SECRET` | App secret |
| `META_WEBHOOK_VERIFY_TOKEN` | Token de verificación del webhook |
| `META_INSTAGRAM_REDIRECT_URI` | Callback OAuth (backend `/api/instagram/oauth/callback`) |
| `META_GRAPH_API_VERSION` | Opcional, default `v21.0` |

## Endpoints

### Públicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/instagram/status` | Estado de configuración (sin secretos) |
| GET | `/api/instagram/webhook` | Verificación Meta (`hub.challenge`) |
| POST | `/api/instagram/webhook` | Recibe eventos |
| GET | `/api/instagram/oauth/callback` | Intercambia código OAuth y redirige al CRM |

### Admin (super admin + JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/instagram/integration` | Estado + URL OAuth |
| GET | `/api/admin/instagram/leads` | Listar leads |
| GET | `/api/admin/instagram/leads/stats` | Métricas |
| POST | `/api/admin/instagram/leads` | Alta manual |
| PATCH | `/api/admin/instagram/leads/:id` | Actualizar etapa / notas |
| POST | `/api/admin/instagram/sync` | Pull comentarios o demo stub |

## UI

- **CRM → Leads Instagram**: `/admin/crm/instagram-leads`
- Enlace desde el header del CRM de influencers.

## Configuración en Meta Developers

1. Crear app tipo **Business**.
2. Añadir **Instagram Graph API** y **Webhooks**.
3. OAuth redirect URI = `META_INSTAGRAM_REDIRECT_URI`.
4. Webhook callback = `https://{dominio}/api/instagram/webhook`.
5. Suscribir objeto **instagram**: `comments`, `mentions`; objeto **page**: `messages` (DMs).
6. Vincular cuenta **Instagram Business** a una **Facebook Page**.
7. Conectar desde el CRM con «Conectar Meta» (OAuth).

## Atribución a influencers

Al crear o recibir un lead, se intenta vincular automáticamente si `@instagram` coincide con `socialMedia.instagram` o `username` del influencer en MongoDB.

## Pipeline de leads

Etapas: `new` → `contacted` → `qualified` → `converted` | `dismissed`.
