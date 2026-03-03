# Promociones no cargan – Verificación

Cuando en la landing aparece **"El servicio de ofertas no está disponible"** (producción) o **"No se pudieron cargar las promociones"** (local), sigue esta guía.

## Local

### Mensaje: "No se pudieron cargar las promociones" o "Error interno del servidor"

1. **Backend en marcha en el puerto 3000**
   - Desde la raíz del repo: `cd server && npm run dev` (o `node index.js`).
   - El frontend (Vite) hace proxy de `/api` a `http://localhost:3000`.

2. **Probar la API directamente**
   ```bash
   curl -s "http://localhost:3000/api/promotions?limit=5&page=1&status=active"
   ```
   - Debe devolver JSON con `"success": true` y `"data": { "docs": [...] }`.
   - Si no hay MongoDB conectado, el backend puede devolver `docs: []` o promociones simuladas si están definidas.

3. **MongoDB (opcional)**
   - Si usas Atlas/local: `server/.env` con `MONGODB_URI` correcto.
   - Sin MongoDB el backend puede responder con lista vacía o modo simulado; no debería devolver HTML.

4. **Consola del navegador**
   - Si ves `[Promociones] Respuesta no JSON:` → la petición llegó a algo que no es el backend (o el backend devuelve HTML). Revisa que solo haya un proceso en el puerto 3000 y que sea el backend.

---

## Producción

### Mensaje: "El servicio de ofertas no está disponible (comprueba que el backend y Nginx estén configurados)"

Ese mensaje aparece cuando la respuesta de `/api/promotions` **no es JSON** (por ejemplo HTML de error de Nginx).

1. **Backend corriendo (PM2)**
   ```bash
   pm2 list
   pm2 logs link4deal-backend
   ```
   - Debe estar `link4deal-backend` en estado *online* y escuchando en el puerto configurado (p. ej. 3000 según `ecosystem.config.cjs`).

2. **Nginx hace proxy de `/api/` al backend**
   - En `nginx.conf`: `location /api/ { proxy_pass http://127.0.0.1:3000; ... }`
   - El puerto debe coincidir con el que usa el backend (por defecto 3000).
   - Tras cambios: `sudo nginx -t && sudo systemctl reload nginx`.

3. **Probar desde el propio servidor**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/api/promotions?limit=1&page=1&status=active"
   ```
   - Esperado: `200`. Si es 502/504, el backend no está escuchando o Nginx no puede conectar.

4. **Probar vía dominio (como el frontend)**
   ```bash
   curl -s -H "Host: damecodigo.com" "https://damecodigo.com/api/promotions?limit=1&page=1&status=active" | head -c 200
   ```
   - Debe verse JSON (`{"success":true,...`), no HTML.

5. **Consola del navegador (F12 → Network)**
   - Petición a `/api/promotions?limit=50&page=1&status=active`: revisar *Status* y *Response*.
   - Si el *Response* es HTML, Nginx está devolviendo una página de error (502/504) porque el backend no responde o no está arriba.

---

## Resumen

| Entorno   | Comprobar |
|----------|-----------|
| **Local** | Backend en `localhost:3000`, `curl http://localhost:3000/api/promotions?...` devuelve JSON. |
| **Producción** | PM2 con backend en el mismo puerto que usa Nginx en `proxy_pass`, y `curl` al dominio `/api/promotions` devuelve JSON. |

Si tras esto sigue fallando, el mensaje de error en pantalla (tras los cambios del frontend) mostrará el texto que envíe el backend cuando responda en JSON (p. ej. "Error interno del servidor"); revisa los logs del backend para el stack trace.
