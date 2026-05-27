# CRM Influencers (super_admin)

Panel en **`/admin/crm`** (PIN igual que `/admin/dashboard`). Solo usuarios con `User.isSuperAdmin === true`.

## Qué muestra

| Dimensión | Fuente |
|-----------|--------|
| Verificación identidad (dashboard app) | `Influencer.identityVerificationStatus` (`pending` / `approved` / `rejected`) + evidencia `crm.verification` |
| Activación CRM | `Influencer.crm.activationStatus` + estado `Influencer.status` |
| Envío de datos | `crm.dataSubmissionStatus` + % completitud (bio, avatar, redes, categorías, userId) |
| Términos | `crm.terms.accepted`, `acceptedAt`, `version` |
| App DameCodigo (influencer) | `crm.apps.damecodigoInfluencer.installCount` + eventos |
| App BizneAI (negocios / shops) | `crm.apps.bizneaiMerchant.installCount` + eventos |
| Canjes / comisión | Enriquecimiento QR (`influencerProfileEnrichment`) |

## API (JWT super_admin)

| Método | Ruta |
|--------|------|
| GET | `/api/admin/crm/stats` |
| GET | `/api/admin/crm/pipeline/board?search` — tablero Kanban por `pipelineStage` |
| GET | `/api/admin/crm/influencers?...&identityVerificationStatus&hasVerificationScreenshot` |
| GET | `/api/admin/crm/influencers/:id` |
| PATCH | `/api/admin/crm/influencers/:id` |
| POST | `/api/admin/crm/influencers/:id/identity-verification` |

Filtro `app`: `damecodigo` | `bizneai` | `both` | `none`.

Filtro `identityVerificationStatus`: `pending` | `approved` | `rejected`.  
`hasVerificationScreenshot=true` — solo con screenshot subido (cola de revisión).

### Confirmar identidad (dashboard app)

En la ficha CRM, bloque **Verificación de identidad**:

- **Confirmar identidad** → `decision: approved` — pone `identityVerificationStatus: approved`, `status: active`, `crm.activationStatus: active`.
- **Rechazar** → `decision: rejected` — el perfil público sigue visible; la app no muestra campañas ni abonos.

```json
POST /api/admin/crm/influencers/:id/identity-verification
{ "decision": "approved", "adminNote": "Coincide Instagram @handle" }
```

Stats: `pendingIdentityVerification` — pendientes con screenshot subido.

## Tracking desde apps

**POST `/api/crm/track`** (auth opcional)

```json
{
  "appKey": "damecodigo_influencer",
  "eventType": "install",
  "platform": "android",
  "appVersion": "1.2.0",
  "deviceId": "uuid",
  "termsAccepted": true,
  "termsVersion": "2026-05-01"
}
```

`appKey` alternativos: `bizneai_merchant`, `bizneai`, `damecodigo`.

### Integraciones automáticas

1. **`POST /api/influencers/app/verify-session`** — registra `open` o `install` (si `isFirstLaunch` / `eventType: install`) para app influencer; `terms_accepted` si `termsAccepted: true`.
2. **`POST /api/app-downloads`** — cuenta global + evento BizneAI por defecto (`appKey` en body para forzar tipo).

## Colección de eventos

`influencer_crmevents`: historial install/open/terms/admin_update (últimos 80 en detalle CRM).

## Tablero pipeline (columnas / leads)

En **`/admin/crm`**, vista **Pipeline**: columnas según `influencer_crm_outreach.pipelineStage`.

| Columna | Etapa |
|---------|--------|
| Lead | `lead` |
| Contactado | `contacted` |
| … | `awaiting_contact_email`, `profile_link_sent`, `profile_confirmed`, `in_database`, `app_link_sent`, `terms_sent`, `materials_complete`, `onboarded`, `stalled`, `inactive` |

- **Arrastrar** una tarjeta entre columnas → `PATCH /api/admin/crm/influencers/:id/outreach` con `{ "pipelineStage": "..." }`.
- **Clic** en tarjeta → ficha lateral con detalle, verificación de identidad y selector de etapa.
- Influencers sin documento outreach aparecen en **Lead**.

## Modelo de outreach (envíos por influencer)

Colección **`influencer_crm_outreach`** — un documento por influencer.

| Campo | Uso |
|-------|-----|
| `pipelineStage` | `awaiting_contact_email`, `profile_link_sent`, `materials_complete`, etc. |
| `deliveries[]` | Cada envío: Spotify, enlace perfil, app, T&C (`type`, `status`, `sentAt`, `url`) |
| `contactEmail` / `contactEmailStatus` | Gmail solicitado o recibido |
| `profilePublicUrl` | `https://damecodigo.com/influencer/:slug` |
| `conversationSummary` | Resumen WhatsApp / notas |

API:

- `GET /api/admin/crm/influencers/:id/outreach`
- `PATCH /api/admin/crm/influencers/:id/outreach`

### Ejemplo: moris.fitnesscoach

```bash
node server/scripts/seed-influencer-crm-outreach-moris.js
```

JSON de referencia: `docs/examples/crm-outreach-moris.fitnesscoach.json`

## Campos editables (PATCH)

- `status` (perfil público)
- `activationStatus`, `dataSubmissionStatus`, `onboardingStep`
- `terms.accepted`, `terms.version`, `terms.summary`
- `adminNotes`, `lastContactAt`
