# BizneAI shops en `/brands` – mensaje de error y diagnóstico

## Importante: son dos URLs distintas

| Dónde | URL | Qué comprueba |
|--------|-----|----------------|
| **Navegador** | `https://bizneai.com/api/shop` | Que la API pública de BizneAI responde (desde **tu PC**). |
| **Web DameCodigo** | `https://www.damecodigo.com/api/bizne-shops?all=1` | Que **tu servidor Node** tiene la ruta del proxy y puede llamar a BizneAI **desde el servidor**. |

Si la primera funciona y la segunda no (404, 502 o error en pantalla), el fallo está en **DameCodigo** (código no desplegado, PM2 sin reiniciar, firewall saliente del servidor, o el proxy no puede alcanzar `bizneai.com`). **No** es un fallo de “lectura” del JSON en el front si el backend no devuelve 200 con `success: true`.

El proxy en `server/routes/bizneShops.js` usa **axios** hacia `BIZNEAI_SHOP_API_URL` (por defecto `https://bizneai.com/api/shop`).

---

En la página **Marcas y Negocios** (`/brands`) el front llama a:

`GET /api/bizne-shops?all=1`

Si algo falla, puede mostrarse:

> *No se pudieron cargar las tiendas BizneAI. Las marcas registradas en DameCodigo siguen visibles.*  
> *(inglés: Could not load BizneAI shops. DameCodigo-registered brands are still shown.)*

Debajo, si el backend envía mensaje, verás una **línea gris pequeña** con el detalle (HTTP, mensaje del proxy, etc.).

---

## Cuándo se muestra ese aviso (`bizneError === true`)

El código en `BrandPage.tsx` marca error si **no** ocurre lo siguiente:

1. Respuesta **404** → se trata como “ruta no desplegada”: **no** se muestra este aviso (solo marcas locales).
2. Respuesta con `success: true` y `data.shops` siendo un **array** (puede estar vacío `[]` sin error).

En cualquier otro caso se muestra el aviso. Origen típico:

| Causa | Qué pasa |
|--------|-----------|
| **502** del proxy Node | El servidor intentó leer `https://bizneai.com/api/shop` y falló (red, timeout, HTTP error de BizneAI, TLS, etc.). El proxy responde `{ success: false, message: "No se pudo obtener el listado de tiendas BizneAI", data: { shops: [] } }`. |
| **Otro 4xx/5xx** con cuerpo sin `success: true` | Mensaje genérico o `HTTP <código>`. |
| **Respuesta 200 con JSON distinto** | Si BizneAI cambia el formato y `data.shops` no es array, se considera error. |
| **Fallo del `fetch` (`.catch`)** | Red caída, CORS raro, respuesta HTML en lugar de JSON, extensión bloqueando, etc. Mensaje: *Red o respuesta no JSON…*. |

**No** muestra este aviso: respuesta **404** (endpoint no existe en el Node desplegado).

---

## Dónde mirar en el servidor

1. **Logs del proceso Node** (PM2):
   ```bash
   pm2 logs --lines 80
   ```
   Busca: `Error proxy BizneAI shops:` — ahí suele estar el error real (ej. `BizneAI HTTP 503`).

2. **Probar el proxy a mano** (puerto local del backend, ej. 5001):
   ```bash
   curl -s "http://127.0.0.1:5001/api/bizne-shops?all=1" | head -c 500
   ```
   - **200** + `"success":true` → el proxy y BizneAI responden bien; el fallo sería solo en el cliente.
   - **502** → el Node **sí** tiene la ruta, pero **falló** la llamada saliente a `https://bizneai.com/api/shop`.

3. **Probar BizneAI sin tu servidor**:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" "https://bizneai.com/api/shop?page=1&limit=1"
   ```
   Debe ser **200**. Si no, el problema es externo (BizneAI caído, bloqueo, etc.).

4. **Firewall / outbound**: el servidor debe poder hacer **HTTPS saliente** a `bizneai.com` (puerto 443).

---

## Variables útiles

| Variable | Uso |
|----------|-----|
| `BIZNEAI_SHOP_API_URL` | Base del listado (por defecto `https://bizneai.com/api/shop`). |
| `VITE_ENABLE_BIZNE_SHOPS=false` | En el **build** del front: no llama a `/api/bizne-shops` (evita petición y mensaje hasta tener backend estable). |

---

## Resumen

- El texto **no** indica fallo de marcas DameCodigo: solo falló la **segunda fuente** (BizneAI vía tu proxy).
- Causa más frecuente con ruta ya desplegada: **502** porque el **Node no puede obtener** la API de BizneAI (red, API caída, error HTTP upstream).
- Revisa **PM2 logs** y el `curl` local a `/api/bizne-shops?all=1` para ver el mensaje exacto.
