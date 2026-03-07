# Influencer General (usuario de sistema)

## Qué es

**Influencer General** es un influencer de sistema usado solo para **lógica operativa**. No representa a una persona real ni debe mostrarse en la interfaz como un perfil más.

- **Username en BD:** `influencer-general`
- **Nombre:** "Influencer General"

## Uso en el sistema

Se usa para **atribución de conversiones** cuando una promoción no es reclamada por ningún influencer: las ventas/redenciones se registran como éxito y se asignan a "Influencer General" (modelo `PromotionConversion`, campo `influencer` apuntando a este documento). Así todas las conversiones quedan contabilizadas aunque no haya un influencer asociado.

- Script de creación y backfill: `server/scripts/seed-influencer-general-and-backfill-conversions.js`
- Backfill vía API: `POST /api/promotions/backfill-conversions`

## Regla: no mostrarlo en la app

Por defecto, **Influencer General no debe aparecer** en:

- Listado de influencers (marketplace, dashboards, selects).
- Perfil por ID o por slug (debe responderse 404).
- Cualquier vista pública o de usuario.

Es una **excepción de sistema**: existe en la base de datos para lógica y reportes, pero se oculta en la UI.

## Implementación

### Backend

En `server/controllers/influencerController.js`:

- Constante: `INFLUENCER_GENERAL_USERNAME = 'influencer-general'`.
- **GET /api/influencers:** la query excluye `username: 'influencer-general'` salvo que se envíe `?includeSystem=true` (uso admin/diagnóstico).
- **GET /api/influencers/:id:** si el documento es Influencer General, se responde **404** (Influencer no encontrado).
- **GET por slug:** la búsqueda excluye Influencer General (`username: { $ne: INFLUENCER_GENERAL_USERNAME }`), por lo que no se puede abrir por slug.

### Incluir en listados (solo admin/diagnóstico)

Para ver Influencer General en el listado (por ejemplo en herramientas internas):

```
GET /api/influencers?includeSystem=true
```

No usar este parámetro en el frontend público.

### Frontend

En el marketplace de influencers (`InfluencersMarketplace.tsx`) se aplica un filtro de seguridad: se excluye de la lista cualquier influencer con `username === 'influencer-general'`. Así, aunque la API devolviera ese registro (caché, otra ruta, etc.), no se mostraría en la UI.

## Resumen

| Aspecto              | Comportamiento                                      |
|----------------------|-----------------------------------------------------|
| Listado público      | No aparece (excluido en query).                     |
| Listado con `?includeSystem=true` | Sí aparece.                                 |
| Perfil por ID        | 404 si es Influencer General.                       |
| Perfil por slug      | No encontrado (excluido de la búsqueda).            |
| Atribución conversiones | Sí se usa (PromotionConversion → influencer General). |
| Documentación        | Este archivo forma parte de las reglas del sistema. |
