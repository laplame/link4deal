# Link4Deal Backend API

## Descripción

Link4Deal es una plataforma integral para agencias de publicidad y promociones que conecta marcas, influencers y agencias a través de un sistema de roles y permisos avanzado.

## Arquitectura del Sistema

### Modelos de Datos

#### 1. User (Usuario Base)
- **Propósito**: Modelo base para todos los usuarios del sistema
- **Características**:
  - Información personal básica (nombre, email, contraseña)
  - Sistema de roles múltiples
  - Tipos de perfil (influencer, brand, agency)
  - Integración con blockchain
  - Seguridad avanzada (2FA, bloqueo por intentos fallidos)

#### 2. Role (Rol)
- **Propósito**: Define los diferentes tipos de usuarios y sus capacidades
- **Tipos**:
  - `user`: Usuario básico
  - `influencer`: Creador de contenido
  - `brand`: Empresa que promociona productos
  - `agency`: Agencia de publicidad
  - `admin`: Administrador del sistema
  - `moderator`: Moderador de contenido
- **Características**:
  - Niveles jerárquicos (1-10)
  - Capacidades específicas por rol
  - Límites y restricciones
  - Acceso a funcionalidades premium

#### 3. Permission (Permiso)
- **Propósito**: Control granular de acceso a recursos del sistema
- **Categorías**:
  - `user-management`: Gestión de usuarios
  - `promotion-management`: Gestión de promociones
  - `agency-management`: Gestión de agencias
  - `influencer-management`: Gestión de influencers
  - `brand-management`: Gestión de marcas
  - `analytics`: Acceso a analytics
  - `admin`: Funciones administrativas
  - `blockchain`: Operaciones blockchain
  - `referral-system`: Sistema de referidos

#### 4. UserProfile (Perfil de Usuario)
- **Propósito**: Extiende las capacidades del usuario según su tipo
- **Tipos de Perfil**:
  - **Influencer**: Categorías de contenido, audiencia, portfolio
  - **Brand**: Información de empresa, audiencia objetivo, presupuesto
  - **Agency**: Servicios, equipo, clientes, portfolio
- **Características**:
  - Campos específicos por tipo de perfil
  - Verificación y aprobación
  - Analytics y métricas
  - Integración blockchain

#### 5. Agency (Agencia)
- **Propósito**: Gestión completa de agencias de publicidad
- **Características**:
  - Información corporativa
  - Servicios ofrecidos
  - Equipo y estructura
  - Portfolio de clientes
  - Métricas de rendimiento
  - Integración blockchain

### Sistema de Autenticación y Autorización

#### JWT (JSON Web Tokens)
- Autenticación stateless
- Refresh tokens para seguridad
- Expiración configurable

#### Middleware de Seguridad
- **Helmet**: Headers de seguridad HTTP
- **CORS**: Control de acceso cross-origin
- **Rate Limiting**: Protección contra ataques DDoS
- **Compression**: Optimización de respuesta
- **Morgan**: Logging de requests

### Base de Datos

#### MongoDB Atlas
- Base de datos NoSQL escalable
- Índices optimizados para consultas frecuentes
- Agregaciones para analytics complejos

#### Mongoose ODM
- Validación de esquemas
- Middleware pre/post save
- Métodos estáticos y de instancia
- Relaciones y referencias

### API Endpoints

#### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/refresh` - Renovación de token
- `POST /api/auth/logout` - Cierre de sesión

#### Usuarios
- `GET /api/users/profile` - Obtener perfil
- `PUT /api/users/profile` - Actualizar perfil
- `POST /api/users/change-role` - Cambiar tipo de usuario

#### Agencias
- `GET /api/agencies` - Listar agencias
- `POST /api/agencies` - Crear agencia
- `GET /api/agencies/:id` - Obtener agencia
- `PUT /api/agencies/:id` - Actualizar agencia

#### Promociones
- `GET /api/promotions` - Listar promociones
- `POST /api/promotions` - Crear promoción
- `GET /api/promotions/:id` - Obtener promoción
- `PUT /api/promotions/:id` - Actualizar promoción

## Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- MongoDB Atlas (cuenta gratuita)
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd server
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 4. Ejecutar el seeder inicial
```bash
npm run seed
```

### 5. Iniciar el servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## Estructura de Directorios

```
server/
├── config/           # Configuración de base de datos y app
├── models/           # Modelos de Mongoose
├── routes/           # Rutas de la API
├── controllers/      # Lógica de negocio
├── middleware/       # Middleware personalizado
├── utils/            # Utilidades y helpers
├── seeders/          # Datos iniciales del sistema
├── uploads/          # Archivos subidos por usuarios
├── index.js          # Punto de entrada del servidor
└── package.json      # Dependencias y scripts
```

## Scripts Disponibles

- `npm start` - Iniciar servidor en producción
- `npm run dev` - Iniciar servidor en desarrollo con nodemon
- `npm run seed` - Ejecutar seeder de datos iniciales
- `npm test` - Ejecutar tests

## Variables de Entorno

### Requeridas
- `MONGODB_URI` - URI de conexión a MongoDB
- `JWT_SECRET` - Clave secreta para JWT
- `PORT` - Puerto del servidor (default: 5000)

### Opcionales
- `NODE_ENV` - Entorno (development/production)
- `FRONTEND_URL` - URL del frontend para CORS
- `SESSION_SECRET` - Clave secreta para sesiones

## Seguridad

### Autenticación
- Contraseñas hasheadas con bcrypt
- JWT con expiración configurable
- Refresh tokens para renovación automática

### Autorización
- Sistema de roles y permisos granular
- Middleware de verificación de permisos
- Control de acceso basado en recursos

### Protección
- Rate limiting por IP
- Headers de seguridad con Helmet
- Validación de entrada con express-validator
- Sanitización de datos

## Escalabilidad

### Base de Datos
- Índices optimizados para consultas frecuentes
- Agregaciones para analytics complejos
- Sharding horizontal para grandes volúmenes

### API
- Rate limiting configurable
- Compresión de respuestas
- Logging estructurado
- Manejo de errores centralizado

## Monitoreo y Logging

### Logs
- Morgan para HTTP requests
- Winston para logs de aplicación
- Logs estructurados en JSON

### Métricas
- Endpoint de health check
- Métricas de rendimiento
- Monitoreo de errores

## Desarrollo

### Estándares de Código
- ESLint para linting
- Prettier para formateo
- Husky para pre-commit hooks

### Testing
- Jest como framework de testing
- Supertest para testing de API
- Coverage reports automáticos

## Despliegue

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Variables de Entorno de Producción
- `NODE_ENV=production`
- `MONGODB_URI` - URI de producción
- `JWT_SECRET` - Clave secreta fuerte
- `FRONTEND_URL` - URL de producción

## Contribución

1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Crea un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT.

## Soporte

Para soporte técnico o preguntas:
- Email: support@link4deal.com
- Documentación: [docs.link4deal.com](https://docs.link4deal.com)
- Issues: [GitHub Issues](https://github.com/link4deal/backend/issues)

