# Config Nginx para damecodigo.com (HTTPS 443)

Archivo en el servidor: `/etc/nginx/sites-available/damecodigo.com`

Editar: `sudo nano /etc/nginx/sites-available/damecodigo.com`

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

    # Uploads (imágenes del backend)
    location /uploads/ {
        proxy_pass http://localhost:3000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API proxy (puerto 3000; sin barra final en proxy_pass para conservar /api/)
    location /api/ {
        proxy_pass http://localhost:3000;
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
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Legacy image paths (if needed)
    location /image/ {
        proxy_pass http://localhost:3000/image/;
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

---

## Si sigue 404: diagnóstico en el servidor

**1. Backend en 3000 (debe dar 200):**
```bash
curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/api/promotions?limit=1"
```
Si da 000 o 502, el backend no está en 3000 o no está corriendo (`pm2 list`).

**2. Revisar que proxy_pass NO tenga barra final en `/api/`:**

Si está `proxy_pass http://localhost:3000/;` (con `/` al final), Nginx envía `/promotions` al backend y el backend devuelve 404. Tiene que ser **sin** barra:
```bash
sudo grep -A1 "location /api/" /etc/nginx/sites-available/damecodigo.com
```
Debe verse: `proxy_pass http://localhost:3000;` (sin `/` después de 3000).

**3. Corregir a mano si hace falta:**
```bash
sudo nano /etc/nginx/sites-available/damecodigo.com
```
Dentro de `location /api/ {` la línea debe ser exactamente:
- `proxy_pass http://localhost:3000;`
- No: `proxy_pass http://localhost:3000/;` ni `proxy_pass http://localhost:5001/;`

Luego: `sudo nginx -t && sudo systemctl reload nginx`

---

## Si la API devuelve "MongoDB no conectado - modo simulado"

El backend debe cargar `server/.env` con `MONGODB_URI_ATLAS`. En el repo ya se carga desde `server/.env` aunque PM2 arranque desde la raíz.

1. **En el servidor:** Comprueba que exista `server/.env` con la URI de Atlas:
   ```bash
   grep MONGODB_URI_ATLAS ~/project/link4deal/server/.env
   ```

2. **MongoDB Atlas → Network Access:** Añade la IP del servidor (o 0.0.0.0/0 para pruebas).

3. **Reinicia el backend** para que cargue la variable y conecte:
   ```bash
   pm2 restart server
   # o el nombre del proceso: pm2 list
   ```

4. Comprueba: la respuesta de `/api/promotions?limit=1` no debe incluir `"message": "MongoDB no conectado..."` y `docs` debe tener datos si hay promociones activas en la BD.
