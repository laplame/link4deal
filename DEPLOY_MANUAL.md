# Despliegue manual: borrar link4deal y rehacer PM2 + Nginx

Ejecutar **en el servidor** (ej. `cto@damecode`). Ajusta rutas si tu usuario o proyecto no es `cto`/`link4deal`.

---

## Actualización rápida (solo Nginx y verificación)

Si el proyecto ya está clonado y el backend corre (PM2 en puerto 3000), usa este script **en el servidor** para actualizar config de Nginx y verificar con curl:

```bash
cd ~/project/link4deal
git pull
bash scripts/deploy-server.sh
```

El script hace: `git pull` → copia `nginx.conf` a `/etc/nginx/sites-available/link4deal` → `nginx -t` → `systemctl reload nginx` → comprueba backend en 3000 y hace curls de verificación.

---

## Parte 1: Borrar todo (manual)

### 1.1 Parar y quitar PM2

```bash
pm2 stop link4deal-backend 2>/dev/null || true
pm2 delete link4deal-backend 2>/dev/null || true
pm2 save
```

### 1.2 Parar Nginx (opcional, para evitar 502 mientras borras)

```bash
sudo systemctl stop nginx
```

### 1.3 Borrar la carpeta del proyecto

```bash
cd ~/project
rm -rf link4deal
```

### 1.4 Quitar configuración de Nginx del sitio link4deal

```bash
sudo rm -f /etc/nginx/sites-enabled/link4deal
# Opcional: borrar también el archivo en sites-available
sudo rm -f /etc/nginx/sites-available/link4deal
```

Si quieres dejar el default de Nginx activo hasta reconfigurar:

```bash
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/
```

### 1.5 Crear directorio y logs (para que PM2 no falle al arrancar)

```bash
mkdir -p ~/project/link4deal
mkdir -p ~/project/link4deal/logs
```

(Después lo reemplazarás con el clone; esto es solo si quieres tener la ruta lista.)

---

## Parte 2: Clonar y construir el proyecto

### 2.1 Clonar

```bash
cd ~/project
git clone <URL_DEL_REPO> link4deal
cd link4deal
```

Sustituye `<URL_DEL_REPO>` por tu repo (ej. `git@github.com:tu-org/link4deal.git`).

### 2.2 Dependencias y build

```bash
corepack enable
pnpm install
pnpm run build
```

### 2.3 Variables de entorno (servidor)

Copia y edita el `.env` del servidor si lo tienes en otro sitio, o créalo:

```bash
cp server/.env.example server/.env
nano server/.env   # o vim / vi
```

Ajusta al menos: `MONGODB_URI_*`, `PORT=5001`, `FRONTEND_URL`, etc.

### 2.4 Crear directorios que usa la app

```bash
mkdir -p logs server/uploads server/uploads/promotions
```

---

## Parte 3: Rehacer PM2

### 3.1 Usar el ecosystem del repo

El repo incluye `ecosystem.config.cjs` (CommonJS; el raíz tiene `"type": "module"` y `.js` rompería PM2) con:

- **name:** `link4deal-backend`
- **cwd:** raíz del repo (detectada por `ecosystem.config.cjs`)
- **script:** `server/index.js` (no usar `server/server.js`)
- **PORT:** `5001`

Desde la raíz del proyecto:

```bash
cd ~/project/link4deal
bash scripts/ensure-backend-running.sh --setup-boot --with-cron
```

Ese script arranca `server/index.js` con PM2, ejecuta `pm2 save`, comprueba `/health`, instala un cron cada 2 min con `server-watchdog.sh` y muestra el comando `pm2 startup` para que el backend vuelva tras reiniciar el VPS.

Alternativa manual:

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

### 3.2 Comprobar

```bash
pm2 list
pm2 logs link4deal-backend --lines 30
curl -s http://localhost:5001/health
```

---

## Parte 4: Rehacer Nginx

### 4.1 Copiar configuración del repo

```bash
sudo cp ~/project/link4deal/nginx.conf /etc/nginx/sites-available/link4deal
```

### 4.2 Activar sitio y quitar default (si aplica)

```bash
sudo ln -sf /etc/nginx/sites-available/link4deal /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 4.3 Probar y recargar

```bash
sudo nginx -t
sudo systemctl start nginx
sudo systemctl reload nginx
sudo systemctl enable nginx
```

### 4.4 Comprobar

- Sitio: `http://damecodigo.com` o `http://<IP_SERVIDOR>`
- API: `http://damecodigo.com/api/...` o `http://<IP>/api/...`
- Health: `http://damecodigo.com/health`

---

## Resumen de comandos (copiar/pegar)

Ajusta `~/project` y la URL del repo si no usas `cto`/link4deal.

```bash
# 1. Parar y borrar PM2
pm2 stop link4deal-backend 2>/dev/null || true
pm2 delete link4deal-backend 2>/dev/null || true
pm2 save

# 2. Parar Nginx
sudo systemctl stop nginx

# 3. Borrar proyecto y config Nginx
cd ~/project
rm -rf link4deal
sudo rm -f /etc/nginx/sites-enabled/link4deal
sudo rm -f /etc/nginx/sites-available/link4deal

# 4. Clonar y build
git clone <URL_DEL_REPO> link4deal
cd link4deal
corepack enable
pnpm install
pnpm run build
mkdir -p logs server/uploads server/uploads/promotions
cp server/.env.example server/.env
# Editar server/.env con tus valores

# 5. PM2 (backend siempre arriba)
bash scripts/ensure-backend-running.sh --setup-boot --with-cron

# 6. Nginx
sudo cp ~/project/link4deal/nginx.conf /etc/nginx/sites-available/link4deal
sudo ln -sf /etc/nginx/sites-available/link4deal /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl start nginx && sudo systemctl reload nginx
```

---

## Espacio en disco (VPS)

Auditoría y limpieza de temporales (logs PM2, caché npm, `server/server` duplicado, etc.):

```bash
cd ~/project/link4deal
git pull
bash scripts/vps-disk-audit.sh              # solo ver qué ocupa
bash scripts/vps-disk-audit.sh --dry-run    # simular limpieza
bash scripts/vps-disk-audit.sh --clean --yes  # limpiar sin preguntar
```

**No borra** `server/uploads` (fotos de promos/influencers). Si el disco sigue lleno, revisar:

| Ruta | Suele pesar |
|------|-------------|
| `node_modules` + `server/node_modules` | ~300–600 MB c/u |
| `dist/` + `public/assets/*.apk` | APK ~100 MB+ |
| `logs/pm2-*.log` | Crece sin límite |
| `~/.npm/_cacache` | Cientos de MB |
| `/var/log/nginx`, `journalctl` | GB si no se rotan |

En producción solo hace falta `dist/`, `server/`, `node_modules` (raíz y server) y `ecosystem.config.cjs`. No necesitas `.git` en el VPS si despliegas con artefactos.

---

## Si algo falla

- **502 Bad Gateway:** Backend no responde. Revisar `pm2 list`, `pm2 logs link4deal-backend`, y que el backend escuche en `PORT=5001`.
- **404 en /api o /uploads:** Revisar que `proxy_pass` en Nginx apunte a `http://localhost:5001`.
- **Páginas en blanco / 404 en rutas del front:** Que `root` en Nginx sea la carpeta `dist` de link4deal y que tengas `try_files $uri $uri/ /index.html;`.
