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
npm install
npm run build
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
mkdir -p logs public/uploads server/public/uploads
```

---

## Parte 3: Rehacer PM2

### 3.1 Usar el ecosystem del repo

El repo incluye `ecosystem.config.cjs` (recomendado) o `ecosystem.config.js` con:

- **name:** `link4deal-backend`
- **cwd:** `/home/cto/project/link4deal`
- **script:** `./server/index.js`
- **PORT:** `5001`

Desde la raíz del proyecto:

```bash
cd ~/project/link4deal
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup   # si quieres que arranque al reiniciar el servidor (te dirá el comando a ejecutar)
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
npm install
npm run build
mkdir -p logs public/uploads server/public/uploads
cp server/.env.example server/.env
# Editar server/.env con tus valores

# 5. PM2
pm2 start ecosystem.config.cjs --env production
pm2 save

# 6. Nginx
sudo cp ~/project/link4deal/nginx.conf /etc/nginx/sites-available/link4deal
sudo ln -sf /etc/nginx/sites-available/link4deal /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl start nginx && sudo systemctl reload nginx
```

---

## Si algo falla

- **502 Bad Gateway:** Backend no responde. Revisar `pm2 list`, `pm2 logs link4deal-backend`, y que el backend escuche en `PORT=5001`.
- **404 en /api o /uploads:** Revisar que `proxy_pass` en Nginx apunte a `http://localhost:5001`.
- **Páginas en blanco / 404 en rutas del front:** Que `root` en Nginx sea la carpeta `dist` de link4deal y que tengas `try_files $uri $uri/ /index.html;`.
