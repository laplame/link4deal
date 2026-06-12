# Product Requirements Document (PRD)
## Link4Deal - Plataforma de Promociones y Marketing de Influencers

**Versión:** 1.0  
**Fecha:** 2024  
**Estado:** En Desarrollo

---

## 1. Resumen Ejecutivo

### 1.1 Visión del Producto
Link4Deal es una plataforma integral que conecta marcas, influencers y agencias de publicidad para crear, gestionar y ejecutar campañas de marketing a través de promociones, cupones y contenido de influencers. La plataforma facilita la generación de leads, ventas y comisiones mediante un sistema de marketplaces, subastas y tracking de cupones.

### 1.2 Propuesta de Valor
- **Para Marcas**: Acceso a una red de influencers verificados, sistema de tracking de leads y ventas, y gestión completa de campañas promocionales.
- **Para Influencers**: Oportunidades de monetización a través de promociones, sistema de cupones con comisiones, y dashboard de analytics.
- **Para Agencias**: Herramientas para gestionar múltiples clientes, influencers y campañas desde un solo lugar.

### 1.3 Objetivos del Negocio
- Conectar marcas con influencers de manera eficiente
- Facilitar la creación y gestión de promociones
- Rastrear ROI y métricas de campañas en tiempo real
- Generar ingresos a través de comisiones y transacciones
- Escalar la base de usuarios (marcas, influencers, agencias)

---

## 2. Perfiles de Usuario

### 2.1 Influencer
**Descripción**: Creadores de contenido que promocionan productos y servicios.

**Necesidades**:
- Encontrar oportunidades de promoción
- Gestionar aplicaciones a campañas
- Crear y compartir cupones
- Rastrear ganancias y comisiones
- Ver analytics de rendimiento

**Flujos principales**:
1. Registro → Setup de perfil → Explorar marketplace → Aplicar a promociones
2. Crear cupones → Compartir en redes → Rastrear ventas → Recibir comisiones

### 2.2 Brand (Marca)
**Descripción**: Empresas que buscan promocionar sus productos a través de influencers.

**Necesidades**:
- Crear promociones y campañas
- Encontrar influencers adecuados
- Gestionar aplicaciones recibidas
- Rastrear leads y ventas generadas
- Ver ROI de campañas

**Flujos principales**:
1. Registro → Setup de marca → Crear promoción → Recibir aplicaciones → Seleccionar influencers
2. Explorar marketplace de influencers → Contactar influencers → Gestionar campañas

### 2.3 Agency (Agencia)
**Descripción**: Agencias de publicidad que gestionan múltiples clientes y campañas.

**Necesidades**:
- Gestionar múltiples clientes
- Coordinar campañas
- Acceder a red de influencers
- Reportes y analytics consolidados

### 2.4 Admin
**Descripción**: Administradores del sistema que gestionan usuarios, contenido y configuraciones.

**Necesidades**:
- Moderar contenido y usuarios
- Aprobar/rechazar verificaciones KYC
- Ver analytics del sistema
- Gestionar configuraciones

---

## 3. Funcionalidades Principales

### 3.1 Autenticación y Onboarding

#### 3.1.1 Registro e Inicio de Sesión
- Registro con email y contraseña
- Inicio de sesión con validación
- Sistema de recuperación de contraseña
- Bloqueo de cuenta por intentos fallidos
- Refresh tokens para sesiones persistentes

#### 3.1.2 Onboarding de Usuarios
- Selección de tipo de usuario (Influencer, Brand, Agency)
- Setup de perfil según tipo de usuario
- Configuración con OCR para influencers (extracción automática de datos)
- Verificación de email
- Tutorial guiado para nuevos usuarios

### 3.2 Marketplace de Promociones

#### 3.2.1 Exploración
- Lista de promociones disponibles
- Búsqueda por texto (título, marca, categoría)
- Filtros avanzados (categoría, ubicación, tipo de subasta, estado)
- Ordenamiento (popularidad, tiempo restante, precio, comisión)
- Vista de detalles de promoción

#### 3.2.2 Sistema de Subastas
- **Subastas Holandesas**: Precios que descienden automáticamente
- **Subastas Inglesas**: Pujas competitivas que ascienden
- Visualización de estado de subasta en tiempo real
- Notificaciones de cambios en subastas

#### 3.2.3 Aplicación a Promociones
- Modal de aplicación en 4 pasos:
  1. Propuesta de contenido
  2. Portfolio y precios
  3. Cronograma y entregables
  4. Resumen y envío
- Subida de archivos de portfolio
- Definición de tarifas (fija, comisión, híbrida)
- Notificaciones de estado de aplicación

### 3.3 Marketplace de Influencers

#### 3.3.1 Exploración
- Lista de influencers disponibles
- Búsqueda por texto (nombre, username, categorías)
- Filtros avanzados (categoría, ubicación, seguidores, engagement, estado)
- Vista de perfil detallado con 4 pestañas:
  - Overview: Resumen, biografía, estadísticas, redes sociales
  - Promociones: Historial de campañas
  - Pagos: Historial de transacciones
  - Analytics: Gráficos y métricas

#### 3.3.2 Evaluación de Influencers
- Estadísticas de seguidores por plataforma
- Engagement rate
- Rating de satisfacción
- Historial de promociones completadas
- Estadísticas de cupones y ventas generadas
- Sistema de contacto directo

### 3.4 Creación de Promociones

#### 3.4.1 Wizard de Creación
- Paso 1: Información básica (título, descripción, categoría, marca)
- Paso 2: Detalles del producto (precios, imágenes, stock)
- Paso 3: Configuración de campaña (tipo de subasta, presupuesto, fechas, requisitos)
- Paso 4: Revisión y publicación
- Guardado como borrador
- Edición de borradores

#### 3.4.2 OCR para Promociones
- Captura de imagen de folleto/promoción
- Procesamiento con OCR (servidor Python + RapidAPI fallback)
- Extracción automática de datos (precio, descuento, marca, producto)
- Prellenado de formulario con datos extraídos
- Validación y corrección manual

### 3.5 Sistema de Carrito y Checkout

#### 3.5.1 Carrito de Compras
- Agregar productos al carrito
- Ver contenido del carrito
- Actualizar cantidades
- Eliminar productos
- Aplicar cupones de descuento
- Persistencia entre sesiones

#### 3.5.2 Proceso de Checkout
- Información de envío
- Selección de método de envío
- Información de pago (integración con Stripe)
- Validación de tarjetas
- Procesamiento de pago
- Página de éxito con número de orden
- Email de confirmación

### 3.6 Sistema de Cupones

#### 3.6.1 Creación de Cupones
- Generación de códigos únicos
- Configuración de descuentos (porcentaje o monto fijo)
- Fechas de validez
- Límites de uso
- Asociación con productos/promociones

#### 3.6.2 Tracking de Cupones
- Rastreo de usos de cupones
- Estadísticas de ventas generadas
- Cálculo de comisiones
- Historial de cupones por influencer
- Métricas de conversión

#### 3.6.3 Compartir Cupones
- Links de compartir por redes sociales
- QR codes
- Links directos
- Tracking de referidos a través de cupones

### 3.7 Verificación KYC

#### 3.7.1 Proceso de Verificación
- Formulario de información personal
- Subida de documentos (INE/IFE, comprobante de domicilio)
- Procesamiento con OCR para extracción de datos
- Información bancaria para pagos
- Revisión y envío

#### 3.7.2 Gestión de KYC
- Estados: Pendiente, En Revisión, Aprobado, Rechazado
- Notificaciones de cambios de estado
- Proceso de corrección para rechazos
- Aprobación/rechazo por administradores

### 3.8 Dashboards

#### 3.8.1 Dashboard de Influencer
- Métricas principales (seguidores, engagement, ganancias)
- Promociones activas
- Aplicaciones y su estado
- Cupones creados y estadísticas
- Historial de pagos
- Analytics y gráficos

#### 3.8.2 Dashboard de Brand
- Métricas principales (leads, ventas, ROI)
- Promociones creadas
- Aplicaciones recibidas
- Influencers contratados
- Analytics de campañas

#### 3.8.3 Dashboard de Agency
- Métricas principales (clientes, campañas, ROI)
- Lista de clientes gestionados
- Campañas activas
- Red de influencers
- Reportes consolidados

### 3.9 Panel de Administración

#### 3.9.1 Gestión de Usuarios
- Lista de usuarios
- Edición de información
- Gestión de roles y permisos
- Activación/desactivación de cuentas
- Ver historial de actividad

#### 3.9.2 Moderación de Contenido
- Aprobar/rechazar promociones
- Moderar aplicaciones
- Gestionar reportes
- Bloquear usuarios

#### 3.9.3 Verificaciones KYC
- Revisar solicitudes pendientes
- Aprobar/rechazar verificaciones
- Ver documentos subidos
- Proporcionar feedback

#### 3.9.4 Analytics del Sistema
- Métricas generales (usuarios, promociones, transacciones)
- Gráficos de crecimiento
- Reportes de ingresos
- Actividad por tipo de usuario

### 3.10 Sistema de Referidos

#### 3.10.1 Códigos de Referido
- Generación de código único por usuario
- Links de referido personalizados
- QR codes para compartir
- Tracking de referidos

#### 3.10.2 Comisiones por Referidos
- Comisión por registro de referido
- Comisión por actividad del referido
- Comisión por primera venta del referido
- Historial de comisiones
- Sistema de retiro

### 3.11 Sistema de Categorías

#### 3.11.1 Exploración de Categorías
- Página de categorías principales
- Navegación por categoría específica
- Filtros dentro de categorías
- Categorías relacionadas
- Categorías populares

### 3.12 Landing Pages

#### 3.12.1 Landing Principal
- Hero section con CTAs
- Ofertas destacadas
- Categorías principales
- Mapa de ofertas geolocalizadas
- Sección de noticias
- Footer con información

#### 3.12.2 Landing para Negocios
- Propuesta de valor para marcas
- Cómo funciona
- Casos de éxito
- Precios y planes
- CTA de registro

#### 3.12.3 Landing de Comisionista Digital
- Propuesta de valor para influencers
- Explicación de leads y deals
- Tipos de comisiones
- Plataformas soportadas
- Proceso paso a paso
- Casos de éxito
- CTA de registro

---

## 4. Relaciones entre Páginas y Flujos

### 4.1 Flujo de Nuevo Usuario (Influencer)
```
Landing Page → Sign Up → User Type Selector → Influencer Setup → 
Dashboard → Marketplace → Aplicar a Promoción → Crear Cupón → 
Compartir → Rastrear Ventas → Recibir Comisiones
```

### 4.2 Flujo de Nueva Marca
```
Landing Page → Sign Up → User Type Selector → Brand Setup → 
Dashboard → Crear Promoción → Recibir Aplicaciones → 
Seleccionar Influencer → Gestionar Campaña → Ver Analytics
```

### 4.3 Flujo de Compra
```
Landing / Marketplace → Ver Producto → Agregar al Carrito → 
Carrito → Checkout → Información de Envío → Pago → 
Checkout Success → Email de Confirmación
```

### 4.4 Flujo de Verificación KYC
```
Dashboard → Notificación KYC → KYC Form → Subir Documentos → 
OCR Processing → Revisar Datos → Enviar → KYC Success → 
Admin Review → Aprobación/Rechazo → Notificación
```

### 4.5 Flujo de Referido
```
Usuario A → Referral System → Compartir Link → 
Usuario B (nuevo) → Sign Up con Link → Registrado como Referido → 
Usuario A recibe Comisión → Usuario B completa Setup → 
Usuario A recibe Comisión Adicional
```

---

## 5. Integraciones Técnicas

### 5.1 OCR (Optical Character Recognition)
- Servidor Python con Tesseract (procesamiento principal)
- RapidAPI como fallback
- Extracción de datos de documentos e imágenes
- Validación de datos extraídos

### 5.2 Pagos
- Integración con Stripe
- Procesamiento de tarjetas de crédito
- Manejo de reembolsos
- Historial de transacciones

### 5.3 Almacenamiento
- Cloudinary para imágenes
- MongoDB para datos estructurados
- Respaldo local de archivos

### 5.4 Geolocalización
- Detección de ubicación del usuario
- Filtrado de ofertas por ubicación
- Mapa de ofertas interactivo
- Cálculo de distancias

### 5.5 Notificaciones
- Email notifications
- Notificaciones en la plataforma
- Integración con servicios de email

---

## 6. Requisitos No Funcionales

### 6.1 Rendimiento
- Tiempo de carga de páginas < 3 segundos
- Procesamiento de OCR < 10 segundos
- Búsquedas y filtros en tiempo real
- Optimización de imágenes

### 6.2 Seguridad
- Autenticación JWT
- Encriptación de datos sensibles
- Validación de entrada
- Rate limiting
- Protección CSRF

### 6.3 Escalabilidad
- Arquitectura modular
- Base de datos optimizada
- Caché de consultas frecuentes
- CDN para assets estáticos

### 6.4 Usabilidad
- Diseño responsive (mobile-first)
- Navegación intuitiva
- Feedback visual en todas las acciones
- Mensajes de error claros
- Tutoriales y ayuda contextual

### 6.5 Accesibilidad
- Cumplimiento WCAG 2.1 nivel AA
- Navegación por teclado
- Lectores de pantalla
- Contraste adecuado

---

## 7. Métricas de Éxito

### 7.1 Métricas de Usuario
- Tasa de registro
- Tasa de completación de onboarding
- Usuarios activos mensuales (MAU)
- Retención de usuarios (D1, D7, D30)

### 7.2 Métricas de Negocio
- Número de promociones creadas
- Número de aplicaciones recibidas
- Tasa de conversión de aplicaciones
- Ingresos por transacciones
- Comisiones pagadas

### 7.3 Métricas de Engagement
- Tiempo promedio en la plataforma
- Páginas vistas por sesión
- Tasa de rebote
- Interacciones con cupones
- Compartidos en redes sociales

---

## 8. Roadmap y Prioridades

### 8.1 Fase 1 (Actual)
- ✅ Autenticación y onboarding
- ✅ Marketplace de promociones
- ✅ Marketplace de influencers
- ✅ Creación de promociones
- ✅ Sistema de carrito y checkout
- ✅ Sistema de cupones básico
- ✅ Dashboards básicos

### 8.2 Fase 2 (Próximos 3 meses)
- Sistema de chat en tiempo real
- Notificaciones push
- Analytics avanzados
- Sistema de reviews y ratings
- Integración con más plataformas de pago

### 8.3 Fase 3 (Próximos 6 meses)
- App móvil nativa
- Integración con redes sociales (API)
- Sistema de recomendaciones con IA
- Marketplace de servicios adicionales
- Programa de afiliados avanzado

---

## 9. Consideraciones Técnicas

### 9.1 Stack Tecnológico
- **Frontend**: React + TypeScript, Tailwind CSS
- **Backend**: Node.js + Express
- **Base de Datos**: MongoDB
- **OCR**: Python + FastAPI, Tesseract
- **Pagos**: Stripe
- **Almacenamiento**: Cloudinary
- **Deployment**: PM2, Nginx

### 9.2 Arquitectura
- Frontend y backend separados
- API RESTful
- Microservicios para OCR
- Sistema de colas para tareas asíncronas

---

## 10. Riesgos y Mitigaciones

### 10.1 Riesgos Técnicos
- **Riesgo**: Fallo en servicio OCR
- **Mitigación**: Sistema de fallback con RapidAPI

- **Riesgo**: Problemas de escalabilidad
- **Mitigación**: Arquitectura modular, caché, CDN

### 10.2 Riesgos de Negocio
- **Riesgo**: Baja adopción de usuarios
- **Mitigación**: Programa de referidos, marketing, casos de éxito

- **Riesgo**: Fraude en cupones
- **Mitigación**: Verificación KYC, límites de uso, monitoreo

---

## 11. Glosario

- **Lead**: Cliente potencial generado a través de contenido de influencer
- **Deal**: Acuerdo entre marca e influencer para generar leads
- **KYC**: Know Your Customer - Verificación de identidad
- **OCR**: Optical Character Recognition - Reconocimiento óptico de caracteres
- **ROI**: Return on Investment - Retorno de inversión
- **Engagement Rate**: Porcentaje de interacción con el contenido

---

## 12. Contacto y Soporte

Para preguntas sobre este PRD o el producto:
- **Email**: support@link4deal.com
- **Documentación**: Ver archivos README en el repositorio
- **Issues**: GitHub Issues del proyecto

---

**Documento creado:** 2024  
**Última actualización:** 2024  
**Próxima revisión:** Trimestral

