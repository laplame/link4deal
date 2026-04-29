# Config Nginx para damecodigo.com (HTTPS 443)

Archivo en el servidor: `/etc/nginx/sites-available/damecodigo.com`

Editar: `sudo nano /etc/nginx/sites-available/damecodigo.com`

**Importante:** Backend en **puerto 3000** (`ecosystem.config.cjs`). Front en producción: Nginx sirve `dist` (no 5173). **Assets del front** (favicon, logo, etc.): están en `dist` y se sirven con `location /`. **Imágenes subidas** (promociones): el backend Express sirve `server/uploads` en la ruta `/uploads`; Nginx hace proxy con `location ^~ /uploads/` al backend (3000). Para actualizar el .conf en el servidor: `./scripts/update-nginx-conf.sh --install`.

---

## Config completa (server listen 443 ssl)

```nginx
# HTTPS Configuration for damecodigo.com
server {
    listen 443 ssl;
    server_name damecodigo.com www.damecodigo.com link4deal.com www.link4deal.com;

    ssl_certificate /etc/letsencrypt/live/damecodigo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/damecodigo.com/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Frontend (React/Vite build)
    location / {
        root /home/cto/project/link4deal/dist;
        try_files $uri $uri/ /index.html;
        index index.html;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend: mismo puerto que PM2 (ecosystem.config.cjs → 5001)
    set $backend "http://127.0.0.1:5001";

    # Uploads (^~ evita que location ~* \.(png|...) capture /uploads/*.png)
    location ^~ /uploads/ {
        proxy_pass $backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API proxy
    location /api/ {
        proxy_pass $backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;

        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Health check
    location /health {
        proxy_pass $backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Legacy image paths (if needed)
    location /image/ {
        proxy_pass $backend/image/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Después de editar

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Comprobar: `curl -s -o /dev/null -w "%{http_code}" "https://damecodigo.com/api/promotions?limit=1"` → debe devolver **200**.

### API Bizne shops (`/api/bizne-shops`)

Si en el navegador ves **404** en `GET /api/bizne-shops?all=1`, el **Node en el servidor no tiene desplegada** esa ruta (código antiguo o PM2 sin reiniciar). Nginx ya reenvía todo `/api/` al backend; no hace falta regla extra.

**En el servidor:**

```bash
cd ~/project/link4deal
git pull
npm install --prefix .  # si cambió package.json del server
pm2 restart all   # o el nombre del proceso del backend (ej. link4deal-backend)
```

**Comprobar backend directo (ajusta el puerto al de PM2, ej. 5001):**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:5001/api/bizne-shops?all=1"
```

Debe ser **200** con JSON `success: true`. Si sigue **404**, el `server/index.js` cargado no incluye `app.use('/api/bizne-shops', ...)`.

**Mientras tanto (solo front):** en el build de Vite puedes poner `VITE_ENABLE_BIZNE_SHOPS=false` para no llamar a ese endpoint (evita el 404 en consola hasta desplegar el backend).

---

## Si sigue 404: diagnóstico en el servidor

**1. Backend en 5001 (debe dar 200):**
```bash
curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:5001/api/promotions?limit=1"
```
Si da 000 o 502, el backend no está en 5001 o no está corriendo (`pm2 list`).

**2. Revisar que proxy_pass NO tenga barra final en `/api/`:**

Si está `proxy_pass $backend/;` (con `/` al final), Nginx puede enviar la URI mal. Para API usa `proxy_pass $backend;` (sin `/`).
```bash
sudo grep -A1 "location /api/" /etc/nginx/sites-available/damecodigo.com
```
Debe verse: `proxy_pass $backend;` (sin `/` después de 3000).

**3. Corregir a mano si hace falta:**
```bash
sudo nano /etc/nginx/sites-available/damecodigo.com
```
Dentro de `location /api/ {` la línea debe ser exactamente:
- `proxy_pass $backend;`
- No: `proxy_pass $backend/;` (la barra final cambia el comportamiento de la URI)

Luego: `sudo nginx -t && sudo systemctl reload nginx`

---

## Si la API devuelve "MongoDB no conectado - modo simulado"

El backend carga **ambos** `.env` si existen: primero la **raíz del repo** (`link4deal/.env`), luego **`server/.env`** (este sobrescribe claves duplicadas). Puedes dejar `MONGODB_URI_ATLAS` en cualquiera de los dos; si solo lo pones en `server/.env`, ahora sí se aplicará. PM2 puede arrancar desde la raíz (`cwd` del `ecosystem.config.cjs`).

1. **En el servidor:** Comprueba la URI (en **cualquiera** de los dos archivos):
   ```bash
   grep MONGODB_URI_ATLAS ~/project/link4deal/server/.env
   grep MONGODB_URI_ATLAS ~/project/link4deal/.env
   ```

2. **MongoDB Atlas → Network Access:** Añade la IP del servidor (o 0.0.0.0/0 para pruebas).

3. **Reinicia el backend** para que cargue la variable y conecte:
   ```bash
   pm2 restart link4deal-backend
   # o: pm2 restart all — según `pm2 list`
   ```

4. Comprueba: la respuesta de `/api/promotions?limit=1` no debe incluir `"message": "MongoDB no conectado..."` y `docs` debe tener datos si hay promociones activas en la BD.
