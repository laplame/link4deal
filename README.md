# 🚀 Link4Deal (DameCodigo) — Promociones, Marketplace e Influencers

Plataforma para crear promociones (OCR, quick-promotion), marketplace por categorías, tiendas de influencers, comisiones Amazon y checkout con Stripe. Frontend React + TypeScript; backend Node.js + MongoDB.

## ✨ Características Principales

- 📱 **Captura de cámara móvil** para subir imágenes de promociones
- 🔍 **OCR automático** con servidor Python y RapidAPI como fallback
- 🗄️ **Base de datos MongoDB** con fallback a Atlas
- ☁️ **Almacenamiento en la nube** con Cloudinary
- 💾 **Respaldo local** de imágenes en `server/uploads` (promociones en `server/uploads/promotions`)
- 🎯 **Marketplace y categorías** — catálogo de 31 categorías con slugs SEO (`/categories`, `/category/:slug`)
- 🛒 **Tienda propia** — `/tienda`, ficha de producto, checkout Stripe y pedidos (`Order`)
- 🤝 **Influencers y marcas** — aplicaciones a promociones, comisiones Amazon, tiendas por subdominio/slug
- 💰 **Comisiones Amazon** — cálculo neto influencer/plataforma compartido front + back (`amazonCommission`)
- 🎨 **Shell visual oscuro unificado** — tokens en `src/config/siteShell.ts` (referencia: `/quick-promotion`)
- 🔐 **Autenticación y autorización** con JWT (matriz de roles en `ROLES_ACCESS.md`)
- 📊 **API RESTful** completa con rate limiting
- 🐍 **Servidor Python** para procesamiento OCR avanzado

## 🆕 Cambios recientes (2026)

### UI / tema oscuro

- Shell centralizado (`siteShell.ts`): fondo `gray-950`, cards con borde `white/10`, resaltadores ámbar en landing.
- Páginas migradas: landing, categorías, mapa de ofertas, noticias, directorio de influencers, modal de aplicación a promoción, descarga de app, embed Spotify.
- Navbar: invitados ven **Descargar app** + carrito; login/registro en **SiteFooter**.
- Nueva ruta `/empezar` (`GetStartedPage`) y botón flotante de descarga en móvil.

### Categorías de producto

- Catálogo compartido: `src/data/productCategories.json` + `server/utils/productCategories.js`.
- `GET /api/categories` — listado completo para formularios y SEO prerender.
- `Promotion.category` deja de ser enum rígido; se normaliza contra el catálogo.

### Tienda y pagos

- Rutas: `/tienda`, `/producto/:id`, `/tienda/checkout`, `/pedido/:orderId`.
- API: `/api/products`, `/api/orders`, `/api/stripe` (checkout y webhooks).
- Modelo `Order` y script demo `server/scripts/seed-demo-products-promotions.js`.

### Admin / CRM

- `/admin/crm/open-promotions` — promociones abiertas sin aplicaciones cerradas.
- Aviso de cumplimiento Amazon (`AmazonAffiliateComplianceNotice`) en flujos de promo.

### Despliegue VPS (damecodigo.com)

El VPS **no tiene RAM** para compilar el front. Siempre build local + rsync:

```bash
pnpm run build:full              # tsc + vite (local)
pnpm run deploy:vps:dist         # solo dist/
pnpm run deploy:vps:build        # build + dist + server + pm2 restart
export DEPLOY_SSH="usuario@damecodigo.com"
```

Ver `.cursor/rules/deploy.mdc` para nginx y certbot.

## 🏗️ Arquitectura del Sistema

```
Link4Deal/
├── src/                    # Frontend React + TypeScript
│   ├── config/siteShell.ts # Tokens del tema oscuro global
│   └── data/               # Catálogo de categorías (JSON + TS)
├── server/                 # Backend Node.js + Express
│   ├── config/            # Configuraciones (DB, Cloudinary)
│   ├── controllers/       # Controladores de la API
│   ├── middleware/        # Middleware (auth, upload, etc.)
│   ├── models/            # Modelos de MongoDB
│   ├── routes/            # Rutas de la API
│   ├── services/          # Servicios (OCR, etc.)
│   └── utils/             # Utilidades
├── server_py/             # Servidor Python para OCR
├── public/                # Archivos estáticos y uploads
└── data/                  # Base de datos MongoDB local
```

## 🚀 Instalación Rápida

### 1. Clonar y configurar

```bash
# Clonar el repositorio
git clone <repository-url>
cd Link4Deal

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus credenciales
```

### 2. Configurar MongoDB

```bash
# Opción A: MongoDB local
brew install mongodb-community
brew services start mongodb-community

# Opción B: MongoDB Atlas
# Configurar MONGODB_URI_ATLAS en .env
```

### 3. Configurar Python

```bash
# Instalar dependencias Python
npm run python:install

# Verificar instalación
python --version
pip --version
```

### 4. Iniciar servicios

```bash
# Iniciar todo (recomendado para desarrollo)
npm run start:all

# O iniciar por separado:
npm run server:dev      # Servidor Node.js
npm run python:dev      # Servidor Python OCR
npm run dev             # Frontend React
```

## ⚙️ Configuración de Variables de Entorno

Crear archivo `.env` basado en `env.example`:

```bash
# ===== CONFIGURACIÓN DEL SERVIDOR =====
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# ===== MONGODB =====
MONGODB_URI_LOCAL=mongodb://localhost:27017/link4deal
MONGODB_URI_ATLAS=mongodb+srv://username:password@cluster.mongodb.net/link4deal
MONGODB_URI_FALLBACK=true

# ===== CLOUDINARY =====
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=link4deal/promotions

# ===== OCR SERVICE =====
OCR_SERVICE_URL=http://localhost:8000
OCR_API_KEY=your_rapidapi_key

# ===== RAPIDAPI =====
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=ocr.space
```

## 🔧 Comandos Disponibles

### Desarrollo

```bash
npm run dev              # Frontend en modo desarrollo
npm run server:dev       # Servidor Node.js con nodemon
npm run python:dev       # Servidor Python con auto-reload
npm run start:all        # Iniciar todos los servicios
```

### Producción

```bash
npm run build            # Construir frontend
npm run server:start     # Servidor Node.js en producción
npm run python:start     # Servidor Python en producción
```

### Base de Datos

```bash
npm run db:start         # Iniciar MongoDB local
npm run db:stop          # Detener MongoDB local
```

### Utilidades

```bash
npm run setup            # Configuración inicial completa
npm run lint             # Linting del código
```

## 📱 Uso del Sistema

### 1. Crear Promoción

1. **Acceder a la página de creación** de promociones
2. **Tomar foto** con la cámara del móvil o subir imagen
3. **El sistema procesa automáticamente** la imagen con OCR
4. **Extrae información** como precios, descuentos, marcas
5. **Completar datos** faltantes manualmente si es necesario
6. **Guardar promoción** en la base de datos

### 2. Procesamiento OCR

- **Servidor Python**: Procesamiento principal con Tesseract
- **RapidAPI**: Fallback si falla el servidor Python
- **Extracción inteligente** de datos de promociones
- **Validación automática** de precios y descuentos

### 3. Almacenamiento

- **Cloudinary**: Almacenamiento principal en la nube
- **MongoDB**: Base de datos con modelo completo de promociones
- **Respaldo local**: Copia de seguridad en `server/uploads` (promociones en `server/uploads/promotions`)

## 🗄️ Modelo de Datos

### Promoción

```javascript
{
  title: String,           // Título de la promoción
  productName: String,     // Nombre del producto
  brand: String,           // Marca
  category: String,        // Categoría (electronics, fashion, etc.)
  originalPrice: Number,   // Precio original
  currentPrice: Number,    // Precio con descuento
  currency: String,        // Moneda (MXN, USD, EUR)
  discountPercentage: Number, // Porcentaje de descuento
  storeName: String,       // Nombre de la tienda
  storeLocation: {         // Ubicación de la tienda
    address: String,
    city: String,
    coordinates: { lat: Number, lng: Number }
  },
  images: [Image],         // Imágenes de la promoción
  ocrData: {              // Datos extraídos por OCR
    extractedText: String,
    confidence: Number,
    provider: String
  },
  isHotOffer: Boolean,     // Si es oferta caliente
  hotness: String,         // Nivel de "calor" (fire, hot, warm)
  validFrom: Date,         // Fecha de inicio
  validUntil: Date,        // Fecha de expiración
  status: String,          // Estado (draft, active, expired)
  tags: [String],          // Tags de la promoción
  features: [String],      // Características del producto
  specifications: Object,  // Especificaciones técnicas
  views: Number,           // Contador de vistas
  clicks: Number,          // Contador de clicks
  conversions: Number      // Contador de conversiones
}
```

## 🔌 API Endpoints

### Promociones

```
GET    /api/promotions           # Listar promociones
POST   /api/promotions           # Crear promoción
GET    /api/promotions/:id       # Obtener promoción
PUT    /api/promotions/:id       # Actualizar promoción
DELETE /api/promotions/:id       # Eliminar promoción
GET    /api/promotions/hot       # Ofertas calientes
GET    /api/promotions/search    # Buscar promociones
GET    /api/promotions/stats     # Estadísticas
```

### Categorías, productos y pedidos

```
GET    /api/categories           # Catálogo de categorías (31 departamentos)
GET    /api/products             # Productos de tienda
GET    /api/products/:id         # Detalle de producto
POST   /api/orders               # Crear pedido
GET    /api/orders/:id           # Estado del pedido
POST   /api/stripe/checkout      # Sesión Stripe Checkout
POST   /api/stripe/webhook       # Webhook de pago
```

### Rutas frontend destacadas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing principal (tema oscuro) |
| `/marketplace` | Promociones activas |
| `/categories` · `/category/:slug` | Explorar por departamento |
| `/tienda` · `/producto/:id` | Tienda y ficha de producto |
| `/quick-promotion` | Alta rápida de promoción |
| `/influencer/:slug/deals` | Tienda del influencer |
| `/empezar` | Selector de tipo de usuario |
| `/admin/crm/open-promotions` | CRM promociones abiertas |

Documentación de roles y accesos: [`ROLES_ACCESS.md`](ROLES_ACCESS.md).

### OCR

```
POST   /ocr/process              # Procesar imagen individual
POST   /ocr/batch                # Procesar lote de imágenes
GET    /health                   # Estado del servicio
```

## 🐍 Servidor Python OCR

### Características

- **FastAPI**: Framework moderno y rápido
- **Tesseract**: Motor de OCR principal
- **OpenCV**: Procesamiento de imágenes
- **Pillow**: Manipulación de imágenes
- **Batch processing**: Procesamiento de múltiples imágenes

### Instalación

```bash
cd server_py
pip install -r requirements.txt
python main.py
```

### Configuración

```bash
export OCR_HOST=0.0.0.0
export OCR_PORT=8000
export OCR_API_KEY=your-key
export OCR_ENGINE=tesseract
export OCR_LANGUAGE=spa+eng
```

## 🔒 Seguridad

- **Rate Limiting**: Protección contra spam
- **API Keys**: Autenticación para servicios OCR
- **CORS**: Configuración segura de orígenes
- **Validación**: Validación de archivos y datos
- **Sanitización**: Limpieza de datos de entrada

## 📊 Monitoreo y Logs

- **Health Checks**: Verificación de estado de servicios
- **Logging**: Logs detallados de operaciones
- **Métricas**: Estadísticas de uso y rendimiento
- **Error Handling**: Manejo robusto de errores

## 🚀 Despliegue

### Desarrollo Local

```bash
npm run start:all
```

### Producción (local o VPS con build previo)

```bash
pnpm run build:full        # tsc + vite → dist/
pnpm run server:start      # Backend Node (o pm2 restart link4deal-backend en VPS)
pnpm run deploy:vps:build  # Build local + rsync + pm2 (requiere DEPLOY_SSH)
```

## 🐛 Troubleshooting

### MongoDB no conecta

```bash
# Verificar estado del servicio
brew services list | grep mongodb

# Reiniciar servicio
brew services restart mongodb-community

# Verificar puerto
lsof -i :27017
```

### Servidor Python no inicia

```bash
# Verificar dependencias
pip list | grep fastapi

# Verificar Python
python --version

# Instalar dependencias
npm run python:install
```

### Cloudinary no funciona

```bash
# Verificar variables de entorno
echo $CLOUDINARY_CLOUD_NAME

# Verificar configuración
curl -X GET "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/resources/image"
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

- **Issues**: [GitHub Issues](link-to-issues)
- **Documentación**: [Wiki del proyecto](link-to-wiki)
- **Email**: support@link4deal.com

## 🔮 Roadmap

- [ ] **OCR con IA**: Integración con modelos de machine learning
- [ ] **Análisis de sentimientos**: Evaluación automática de promociones
- [ ] **Recomendaciones**: Sistema de recomendaciones personalizadas
- [ ] **Analytics avanzados**: Métricas detalladas y reportes
- [ ] **Integración con redes sociales**: Compartir promociones automáticamente
- [ ] **App móvil nativa**: Aplicación iOS/Android dedicada

---

**¡Gracias por usar Link4Deal! 🎉**

Sistema desarrollado con ❤️ para revolucionar el mundo de las promociones digitales.
