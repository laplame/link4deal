 # Registro de influencer – Ruta `/influencer-setup`

Guía para entender el flujo en web y replicarlo en la app móvil.

| | |
|--|--|
| **Ruta SPA** | `/influencer-setup` |
| **Componente** | `src/pages/InfluencerSetup.tsx` |
| **Título en layout** | “Registrar influencer” (`MainLayout`) |
| **API de creación** | `POST /api/influencers` |
| **API foto de perfil** | `POST /api/influencers/avatar` (opcional, antes del create) |

---

## 1. Resumen del flujo

1. El usuario entra por el menú (“Registrar influencer”), desde `/user-type-selector` o enlaces similares.
2. **Opcional:** sube una **captura de pantalla** de su perfil social y pulsa **“Analizar con IA”** → se llama a `POST /api/analyze-profile-image` y se rellenan campos (nombre, bio, ubicación, categorías, redes).
3. **Opcional:** en el paso 1 puede elegir **foto de perfil**; al enviar el formulario, el front primero llama a **`POST /api/influencers/avatar`** (Multer en memoria) y recibe `avatarUrl`; luego **`POST /api/influencers`** incluye `avatar` en el JSON.
4. Completa **3 pasos** del formulario.
5. Pulsa **“Crear perfil de Influencer”** → si hay foto, upload de avatar + `POST /api/influencers` con JSON.
6. Si la respuesta es correcta, redirige a **`/influencers`**.

**Sesión:** si hay `auth_token` en `localStorage`, se envía `Authorization: Bearer <token>` y el backend puede **vincular** el influencer al usuario (`userId`).

---

## 2. Foto de perfil: subida, almacenamiento y recuperación

### 2.1 Cómo se sube (flujo end-to-end)

1. **Cliente (web):** en `InfluencerSetup`, si el usuario eligió archivo, al pulsar **Crear perfil** se hace primero **`POST /api/influencers/avatar`** con `FormData` y el campo **`avatar`** (no se envía `Content-Type` manualmente: el navegador añade el `boundary` de `multipart`).
2. **Middleware:** `memoryUpload.single('avatar')` (`server/middleware/upload.js`) — el archivo **no** se escribe a disco todavía; solo existe **`req.file.buffer`** en RAM. Tipos MIME y extensión validados (JPEG, PNG, WEBP, GIF); límite de tamaño `MAX_FILE_SIZE` o 10 MB por defecto.
3. **Controlador `uploadAvatar`:**  
   - Si **Cloudinary está configurado** (`cloudinaryConfig.configure()` en el arranque de **`server/index.js`**) y `uploadImage` devuelve éxito → se guarda la URL **`secure_url`** (HTTPS) en la respuesta. Carpeta en Cloudinary: **`link4deal/influencers`** (sobrescribe el `CLOUDINARY_FOLDER` por defecto para esta ruta).  
   - Si Cloudinary no está configurado, falla la subida o la respuesta no trae `secure_url` → se escribe el buffer en **`getInfluencerUploadDir()`** (normalmente `server/uploads/influencers/`) y se devuelve una ruta **relativa al sitio**: **`/uploads/influencers/<filename>`**.
4. **Cliente:** el JSON de respuesta incluye **`data.avatarUrl`**. Ese mismo valor se envía en el siguiente paso como **`avatar`** en **`POST /api/influencers`** (JSON).
5. **Persistencia:** `influencerController.create` guarda **`avatar`** como string en el documento MongoDB (`Influencer`).

**Independiente:** la captura para **“Analizar con IA”** usa **`POST /api/analyze-profile-image`** (campo `image`), **no** persiste el archivo; no es la foto de perfil guardada.

---

### 2.2 Cómo se recupera y se muestra la imagen

| Paso | Qué ocurre |
|------|-------------|
| **Lectura** | Listados y detalle (`GET /api/influencers`, `GET /api/influencers/:id`, etc.) devuelven el influencer con **`avatar`** tal cual está en MongoDB (string). |
| **Formato del valor** | Puede ser **URL absoluta HTTPS** (Cloudinary) o **ruta relativa** (`/uploads/influencers/...`) si se guardó en disco. |
| **Frontend** | Componentes como `InfluencersMarketplace`, `InfluencerProfilePage`, `InfluencerProfileModal` usan la URL en el atributo **`src`** de la imagen (p. ej. `src={influencer.avatar}`). |
| **Rutas relativas en el navegador** | El navegador pide la imagen al **mismo origen** que la SPA (ej. `http://localhost:5173/uploads/...`). En desarrollo, **Vite** (`vite.config.ts`) hace **proxy** de **`/uploads`** y **`/api`** hacia el backend (`http://localhost:3000`), así que el PNG/JPG se sirve bien. |
| **App móvil / otro dominio** | Si `avatar` es **`/uploads/...`**, hay que **prefijar la base del API** (ej. `https://tudominio.com`) para construir la URL absoluta antes de cargar la imagen. Con Cloudinary, la URL ya es absoluta y suele funcionar sin cambios. |

**Servir archivos locales:** en **`server/index.js`** (y `server/server.js` en el mini-servidor de promos) existe **`app.use('/uploads', express.static(uploadsPath))`**, donde `uploadsPath` = `path.resolve(getUploadDir())`. La carpeta física debe coincidir con la ruta que usa `getInfluencerUploadDir()` (variable **`UPLOAD_PATH`** en `.env` si está definida).

---

### 2.3 Verificación de la lógica (checklist técnico)

| Comprobación | Estado esperado |
|--------------|-----------------|
| Multer solo en memoria para `/avatar` | `memoryStorage()` + `single('avatar')`; disco solo si se escribe en `uploadAvatar` (fallback). |
| Cloudinary activo en el proceso principal | `cloudinaryConfig.configure()` se llama al arrancar **`server/index.js`**; sin eso `isConfigured` queda en false y **no** se usa Cloudinary (solo disco). |
| `uploadImage` devuelve error controlado | `cloudinary.js` devuelve `{ success: false }` sin lanzar; si no hay `secure_url`, `uploadAvatar` cae al fallback local. |
| URL guardada en MongoDB | Un solo string; el front no reescribe la URL. |
| Imagen local accesible | Mismo `getUploadDir()` para guardar y para `express.static('/uploads')`. |

---

### 2.4 Mejoras posibles (roadmap de subida de imágenes)

| Área | Idea |
|------|------|
| **Tamaño y peso** | Reducir en servidor con **Sharp** (resize máx. ej. 512×512, WebP) antes de Cloudinary/disco; o bajar el límite específico para `avatar` (hoy comparte `MAX_FILE_SIZE` global de Multer). |
| **Seguridad** | Rechazar dimensiones absurdas o validar “magic bytes” además del MIME (no solo extensión). |
| **Cloudinary** | Guardar **`public_id`** en `Influencer` para poder **borrar** la imagen anterior al cambiar avatar (evitar huérfanos en la nube). |
| **Disco local** | Mismo criterio: borrar archivo anterior si se implementa **PATCH** de perfil con nueva foto. |
| **UX** | Placeholder en `<img>` si `avatar` viene vacío (evitar `src=""`); estado de carga en la subida. |
| **API** | Endpoint **`PATCH /api/influencers/me/avatar`** (o similar) para usuarios ya registrados, reutilizando `uploadAvatar` o extrayendo un servicio compartido. |
| **CDN / caché** | Headers de caché en Nginx para `/uploads/influencers/*`; Cloudinary ya optimiza entrega. |
| **Portfolio paso 3** | Si se implementa, reutilizar el mismo patrón (multer memoria → Cloudinary o disco) y límites por tipo. |

---

### 2.5 Tabla rápida (resumen)

| Pregunta | Respuesta |
|----------|-----------|
| **¿Cómo se sube?** | `POST /api/influencers/avatar`, campo **`avatar`**, Multer en **memoria** → Cloudinary o disco. |
| **¿Cómo se guarda la referencia?** | `POST /api/influencers` con **`avatar: "<url>"`** → campo **`avatar`** en MongoDB. |
| **¿Cómo se recupera?** | `GET` de influencers; **`avatar`** en JSON → `img src` (relativo necesita mismo origen + proxy o base URL absoluta). |
| **Captura IA** | No persiste; solo `analyze-profile-image`. |
| **Portfolio** | Aún no sube al backend. |

---

## 3. API de subida de avatar (antes del alta)

| Método | URL | Body |
|--------|-----|------|
| POST | `/api/influencers/avatar` | `multipart/form-data`: campo **`avatar`** (archivo imagen). Opcional: `Authorization: Bearer <JWT>` |

Respuesta **200** típica:

```json
{ "success": true, "data": { "avatarUrl": "https://res.cloudinary.com/.../..." } }
```

o, en fallback local:

```json
{ "success": true, "data": { "avatarUrl": "/uploads/influencers/influencer-avatar-....jpg" } }
```

---


## 4. Paso opcional: análisis con IA (screenshot)

| Método | URL | Body |
|--------|-----|------|
| POST | `/api/analyze-profile-image` | `multipart/form-data`: campo **`image`** (archivo), **`type`** = `influencer` |

Respuesta esperada (`json.data`): campos como `displayName`, `bio`, `location`, `categories` (array), `socialMedia` (array de `{ platform, username, followers }`).

El front mapea eso al estado del formulario (incluye `collaborationPreferences` si vienen categorías desde la IA).

---

## 5. Pasos del formulario (wizard)

### Paso 1 – Información básica

| Campo en UI | Estado interno | Obligatorio para avanzar |
|-------------|----------------|---------------------------|
| Nombre de Influencer | `displayName` | Sí |
| Foto de perfil (opcional) | `profilePhotoFile` / preview | No (si hay archivo, se sube en `handleSubmit` antes del create) |
| Biografía | `bio` | Sí |
| Ubicación | `location` | No |
| Idiomas | `languages` (array de strings, ej. `["Español"]`) | No |
| Años de experiencia | `experience` (número; 1–10 o `10+` según valor del select) | No |

**Validación:** `canProceed()` en paso 1 exige `displayName` y `bio` no vacíos.

### Paso 2 – Redes y categorías

En la misma lista de estado `collaborationPreferences` se mezclan:

- **IDs de categorías de contenido** (ej. `lifestyle`, `fashion`, `beauty`, … ver lista en el componente).
- **Tipos de colaboración** (ej. `sponsored-posts`, `product-reviews`, `brand-ambassador`, …).

| Campo en UI | Estado interno |
|-------------|----------------|
| Categorías de contenido (botones) | se añaden/quitan IDs en `collaborationPreferences` |
| Tipos de colaboración (botones) | igual |
| Redes sociales (plataforma, usuario, seguidores) | `socialMedia[]`: `{ platform, username, followers, verified }` |

Plataformas en el select: Instagram, TikTok, YouTube, Twitter, Facebook, LinkedIn, Twitch.

**Validación:** para avanzar al paso 3 hace falta **al menos un elemento** en `collaborationPreferences` (categoría o tipo de colaboración).

### Paso 3 – Portfolio

- Permite adjuntar archivos (imágenes, PDF, etc.) en `formData.portfolio[]`.
- **Importante:** **`handleSubmit` no envía el portfolio** al servidor; no hay upload. El portfolio sigue siendo solo UI (limitación conocida).

---

## 6. Envío final: `POST /api/influencers`

### Headers

| Header | Valor |
|--------|--------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` **solo si** existe sesión (`auth_token`) |

### Cuerpo JSON enviado por la web

```json
{
  "displayName": "string (trim)",
  "bio": "string opcional",
  "location": "string opcional",
  "languages": ["Español", "Inglés"],
  "experience": 1,
  "collaborationPreferences": ["fashion", "sponsored-posts"],
  "socialMedia": [
    { "platform": "Instagram", "username": "mi_usuario", "followers": 10000, "verified": false }
  ],
  "avatar": "https://... o /uploads/influencers/... (opcional; viene del POST /avatar)"
}
```

### Respuestas del backend

| HTTP | Significado |
|------|-------------|
| **201** | Creado. Cuerpo: `{ success: true, data: { ... } }` (formato frontend). |
| **400** | Falta `name`/`displayName` u otro error de validación. |
| **503** | MongoDB no disponible (`Base de datos no disponible`). |

En el controlador (`influencerController.create`):

- `displayName` → se guarda como **`name`** en MongoDB.
- `collaborationPreferences` → se guarda en **`categories`** (array).
- `socialMedia` se transforma a `followers` por plataforma (Instagram, TikTok, YouTube, Twitter/X) y a `socialMedia` con handles por red.
- `status` inicial: **`pending`**.
- Si hay usuario autenticado, se asigna **`userId`**.
- **`avatar`:** si el cliente envía `avatar` como URL (string), se guarda; el formulario web **sí** lo envía cuando el usuario eligió foto y el upload a `/api/influencers/avatar` tuvo éxito.

---

## 7. Comportamiento tras el éxito

- `navigate('/influencers')` — lista de influencers.
- Errores: `alert` con el mensaje del servidor.

---

## 8. Referencias de código

| Qué | Dónde |
|-----|--------|
| Ruta React | `App.tsx` → `<Route path="/influencer-setup" element={<InfluencerSetup />} />` |
| Formulario y envío | `src/pages/InfluencerSetup.tsx` |
| API crear | `server/routes/influencers.js` → `POST /` con `optionalAuth` |
| API avatar | `server/routes/influencers.js` → `POST /avatar` (`memoryUpload.single('avatar')`) |
| Lógica crear / upload avatar | `server/controllers/influencerController.js` → `create`, `uploadAvatar` |
| Multer memoria / carpeta influencers | `server/middleware/upload.js` (`memoryUpload`, `getInfluencerUploadDir`) |
| Arranque Cloudinary (`configure()`) | `server/index.js` → `startServer()` (necesario para usar Cloudinary en `uploadAvatar`) |
| Servir `/uploads` | `server/index.js` (`express.static` + `getUploadDir()`); proxy Vite `vite.config.ts` (`/uploads` → backend) |
| Modelo | `server/models/Influencer.js` |
| Análisis imagen (memoria, sin persistir) | `server/routes/analyzeProfile.js`, `server/services/geminiProfileAnalyzer.js` |

---

## 9. Checklist para implementar en la app móvil

- [ ] Pantalla equivalente a los 3 pasos + bloque opcional de captura + IA.
- [ ] Validaciones: paso 1 (`displayName` + `bio`); paso 2 (al menos una preferencia en `collaborationPreferences`).
- [ ] `POST /api/analyze-profile-image` con `image` + `type=influencer` (opcional).
- [ ] Si hay foto de perfil: `POST /api/influencers/avatar` con campo **`avatar`**, luego `POST /api/influencers` con `avatar` en el JSON.
- [ ] Si `avatar` es ruta relativa (`/uploads/...`), anteponer la **base URL del API** al mostrar la imagen (no aplica si Cloudinary devolvió URL HTTPS).
- [ ] `POST /api/influencers` con el JSON de la sección 6; incluir `Authorization` si hay sesión (también en `/avatar` si aplica).
- [ ] Manejar 201 → navegar a lista de influencers o pantalla de confirmación.
- [ ] Manejar 503/400 con mensaje claro.
- [ ] **Nota:** portfolio en paso 3 hoy **no** se sube por API.

---

## 10. Pruebas rápidas con `curl`

**Subir avatar (opcional):**

```bash
curl -s -X POST "http://localhost:3000/api/influencers/avatar" \
  -F "avatar=@/ruta/a/foto.jpg"
```

Respuesta: `data.avatarUrl` (Cloudinary o `/uploads/influencers/...`).

**Crear influencer (sin sesión):**

```bash
curl -s -X POST "http://localhost:3000/api/influencers" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Test Influencer","bio":"Bio de prueba","languages":["Español"],"experience":2,"collaborationPreferences":["fashion"],"socialMedia":[{"platform":"Instagram","username":"test","followers":1000,"verified":false}],"avatar":"https://ejemplo.com/o-ruta-local.jpg"}'
```

Esperado: HTTP **201** y `success: true`.

**Con sesión:** añadir `-H "Authorization: Bearer <JWT>"` al avatar y al create.
