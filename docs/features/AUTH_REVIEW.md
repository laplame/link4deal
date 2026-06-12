# Revisión: Auth y Signup/Login

## Resumen

- **Backend (API):** Auth JWT completo en `server/routes/auth.js` (registro, login, refresh, logout, me, change-password). Solo está montado en **`server/index.js`** (no en `server/server.js`).
- **Frontend:** SignIn/SignUp son **mock**: no llaman a la API y AuthContext usa datos falsos (influencers) y localStorage sin token.

---

## 1. Backend – Rutas de auth (`server/routes/auth.js`)

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro (email, password, firstName, lastName, primaryRole) |
| POST | `/api/auth/login` | Login (email, password) → token + refreshToken |
| POST | `/api/auth/refresh` | Renovar access token con refreshToken |
| POST | `/api/auth/logout` | Invalidar refresh token (requiere Bearer token) |
| GET | `/api/auth/me` | Usuario autenticado (requiere Bearer token) |
| POST | `/api/auth/change-password` | Cambiar contraseña (requiere Bearer token) |

### Seguridad

- **Contraseñas:** bcrypt (12 rounds por defecto, `BCRYPT_ROUNDS`).
- **JWT:** access token (por defecto 24h, `JWT_EXPIRE`) y refresh token (7d).
- **Bloqueo:** tras 5 intentos fallidos, cuenta bloqueada 2h (`User.incLoginAttempts()`).
- **Validación:** express-validator en register (email, password 8+ con may/min/número, nombre/apellido, primaryRole) y login (email, password).
- **Middleware:** `authenticateToken` en auth.js valida Bearer, carga usuario y comprueba si está bloqueado.

### Dónde se usa auth

- **`server/index.js`:** monta `app.use('/api/auth', strictLimiter, authRoutes)`.
- **`server/server.js`:** **no** monta rutas de auth (solo `/api/promotions`). Si usas `npm run server`, no hay login/register.
- **Otras rutas:** `users.js` y `agencies.js` definen su propio `authenticateToken` (duplicado). Las rutas de auth exportan el router pero **no** exportan `authenticateToken` para reutilizar.

### Bug corregido (aplicado)

- En login y en `authenticateToken` se usaba `if (user.isLocked)` (referencia al método, siempre truthy). Corregido a `if (user.isLocked())` en las tres apariciones.

---

## 2. Middleware `server/middleware/auth.js`

- Es un **placeholder**: siempre hace `next()` y no valida JWT.
- Las rutas que requieren auth (users, agencies, y las propias rutas de auth para logout/me) usan un `authenticateToken` definido **localmente** en cada archivo (auth.js, users.js, agencies.js), no este middleware.
- **Recomendación:** unificar: exportar `authenticateToken` desde un solo sitio (p. ej. `middleware/auth.js` o desde `routes/auth.js`) y usarlo en todas las rutas protegidas; eliminar el placeholder actual o sustituirlo por la lógica JWT real.

---

## 3. Frontend – SignIn / SignUp

### SignInPage (`src/pages/SignInPage.tsx`)

- **handleSubmit:** solo `setTimeout(..., 2000)` y `console.log`; **no** llama a `POST /api/auth/login`.
- No usa `useAuth()` ni guarda token/usuario.

### SignUpPage (`src/pages/SignUpPage.tsx`)

- **handleSubmit:** igual, simula envío con `setTimeout`; **no** llama a `POST /api/auth/register`.
- Falta campo `primaryRole` (influencer | brand | agency) que exige la API.
- No usa `useAuth()` ni token/usuario.

### AuthContext (`src/context/AuthContext.tsx`)

- Tipo de usuario: `typeof influencers[0]` (dato de influencers), no el tipo que devuelve la API.
- **login(user):** guarda en `localStorage` como `currentUser`; no envía ni guarda token ni refreshToken.
- **logout:** solo borra `currentUser` de localStorage.
- No hay llamadas a `/api/auth/login`, `/api/auth/refresh` ni cabecera `Authorization` en peticiones.

Consecuencia: el frontend nunca usa la API de auth ni los tokens; la sesión “real” no existe en la app.

---

## 4. Qué falta para un flujo completo

1. **Backend**
   - Corregir uso de `isLocked` → `user.isLocked()` (hecho en esta revisión).
   - Decidir si `server/server.js` debe montar también `/api/auth` (o usar siempre `server/index.js` para desarrollo con auth).
   - Centralizar `authenticateToken` en un solo módulo y usarlo en auth, users y agencies.

2. **Frontend**
   - SignIn: `POST /api/auth/login` con email/password; guardar en contexto (y opcionalmente en localStorage) `user`, `token` y `refreshToken`.
   - SignUp: `POST /api/auth/register` con email, password, firstName, lastName, primaryRole; añadir selector de rol; después del 201, hacer login automático o guardar token/user como en login.
   - AuthContext: tipo de usuario alineado con la API; guardar token (y refreshToken); en peticiones autenticadas enviar `Authorization: Bearer <token>`; opcional: renovar token con `/api/auth/refresh` cuando el access token expire.
   - Logout: llamar `POST /api/auth/logout` (con Bearer) y limpiar token/user en contexto y localStorage.

---

## 5. Modelo User (resumen)

- Campos relevantes para auth: `email`, `password` (select: false), `roles`, `primaryRole`, `profileTypes`, `refreshToken`, `loginAttempts`, `lockUntil`, `stats` (lastLogin, loginCount).
- Métodos: `comparePassword`, `incLoginAttempts`, `resetLoginAttempts`, `updateLastLogin`, `isLocked()` (usa `lockUntil`).
- Registro asigna rol por defecto `Role.findOne({ name: 'user' })` y `primaryRole` del body (influencer | brand | agency).
