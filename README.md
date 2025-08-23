# 🚀 Link4Deal - Sistema de Promociones con OCR

Sistema completo para crear y gestionar promociones con captura de cámara, OCR automático y almacenamiento en MongoDB y Cloudinary.

## ✨ Características Principales

- 📱 **Captura de cámara móvil** para subir imágenes de promociones
- 🔍 **OCR automático** con servidor Python y RapidAPI como fallback
- 🗄️ **Base de datos MongoDB** con fallback a Atlas
- ☁️ **Almacenamiento en la nube** con Cloudinary
- 💾 **Respaldo local** de imágenes en `/public/uploads`
- 🎯 **Sistema de ofertas calientes** con geolocalización
- 🔐 **Autenticación y autorización** con JWT
- 📊 **API RESTful** completa con rate limiting
- 🐍 **Servidor Python** para procesamiento OCR avanzado

## 🏗️ Arquitectura del Sistema

```
Link4Deal/
├── src/                    # Frontend React + TypeScript
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
- **Respaldo local**: Copia de seguridad en `/public/uploads`

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

### Producción

```bash
# Construir frontend
npm run build

# Iniciar servidores
npm run server:start
npm run python:start

# Usar PM2 para gestión de procesos
pm2 start ecosystem.config.js
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
# link4deal
