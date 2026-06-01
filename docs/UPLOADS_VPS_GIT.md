# Imágenes: disco local, Cloudinary y Git

## Problema habitual

Las imágenes de promociones se guardaban en `server/uploads/` **y algunas estaban en Git**. Al hacer `git pull` en el VPS:

- Git puede **eliminar** archivos que no están en el remoto.
- Git puede **sobrescribir** el directorio con el del repositorio (casi vacío, solo `.gitkeep`).
- Las URLs en Mongo siguen siendo `/uploads/promotions/...` pero el archivo **ya no existe** en disco.

## Arquitectura correcta

| Capa | Rol |
|------|-----|
| **Disco (VPS)** | Servir rápido vía Nginx → Express `GET /uploads/...` |
| **Cloudinary** | Respaldo y URL pública que **no depende del git** |
| **MongoDB** | `images[].url` (preferir Cloudinary), `filename`, `cloudinaryUrl`, `cloudinaryPublicId` |

### Rutas

- **Guardado:** `UPLOAD_PATH` o por defecto `server/uploads/promotions/<archivo>`
- **URL pública local:** `/uploads/promotions/promotion-<timestamp>-<id>.webp`
- **URL en navegador:** mismo origen `https://www.damecodigo.com/uploads/...` (proxy Nginx al backend)

### Prioridad al mostrar (frontend)

`getPromotionImageUrl()` usa: **cloudinaryUrl** → **url** → **filename** local.

## Configuración en el VPS

1. **Carpeta fuera del repositorio** (recomendado):

```bash
sudo mkdir -p /var/data/link4deal/uploads/promotions
sudo chown -R cto:cto /var/data/link4deal
```

En `.env` del servidor:

```env
UPLOAD_PATH=/var/data/link4deal/uploads
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=link4deal/promotions
```

2. **No hacer commit de imágenes** — `.gitignore` ignora `server/uploads/**` (solo `.gitkeep`).

3. **No ejecutar** `cleanup-missing-promotion-images.js` justo después de un `git pull` sin revisar integridad.

## Comandos de diagnóstico (en el VPS)

```bash
cd /ruta/al/repo
node server/scripts/check-promotion-images-integrity.js
```

Muestra: archivos en disco, referencias en Mongo, cuántas tienen Cloudinary, faltantes.

## Recuperar imágenes en disco → Cloudinary

Si aún quedan archivos en el VPS pero Mongo solo tiene URL local:

```bash
node server/scripts/backfill-cloudinary-from-local.js        # simulación
node server/scripts/backfill-cloudinary-from-local.js --apply  # sube y actualiza Mongo
```

## Quitar imágenes ya trackeadas en Git (una vez)

En tu máquina de desarrollo, después de actualizar `.gitignore`:

```bash
git rm -r --cached server/uploads/
git add server/uploads/.gitkeep server/uploads/*/.gitkeep
git commit -m "Dejar de versionar uploads; usar UPLOAD_PATH y Cloudinary"
```

Los archivos **siguen en disco**; solo dejan de subirse al remoto.

## Avatares de influencers

- Carpeta local: `server/uploads/influencers/` (o bajo `UPLOAD_PATH`)
- Cloudinary: carpeta `link4deal/influencers`
- El campo `Influencer.avatar` guarda la URL de Cloudinary cuando la subida funciona (prioridad sobre `/uploads/...`)

## Health check

`GET /health` incluye `services.uploads.uploadDir` para confirmar la ruta activa del proceso PM2.
