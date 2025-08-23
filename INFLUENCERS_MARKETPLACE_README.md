# 👥 Marketplace de Influencers - Link4Deal

## Descripción

El **Marketplace de Influencers** es una plataforma donde las **marcas** pueden descubrir, evaluar y contactar influencers talentosos para sus campañas de marketing. Incluye perfiles detallados, estadísticas de rendimiento, historial de promociones y sistema de seguimiento de cupones.

## 🎯 Características Principales

### 🔍 Búsqueda y Filtros Avanzados
- **Búsqueda por texto**: Nombre, username, categorías
- **Filtros por categoría**: Moda, Belleza, Tecnología, Gaming, Fitness, etc.
- **Filtros por ubicación**: Ciudades y países
- **Filtros por seguidores**: Rangos de 0-10K hasta 500K+
- **Filtros por engagement**: Rangos de 0-2% hasta 6%+
- **Filtros por estado**: Activos, Verificados, Pendientes

### 📊 Dashboard de Métricas
- Total de influencers disponibles
- Seguidores totales (en millones)
- Ganancias totales generadas
- Promociones activas en curso

### 🎨 Tarjetas de Influencer
- **Avatar y información básica**: Nombre, username, estado
- **Badges especiales**: HOT, FEATURED
- **Biografía**: Descripción del influencer
- **Categorías**: Tags de especialización
- **Ubicación**: Ciudad y país

### 📈 Estadísticas Principales
- **Total de seguidores** por plataforma
- **Engagement rate** promedio
- **Rating** de satisfacción
- **Ganancias totales** generadas

### 🌐 Redes Sociales
- **Instagram**: Seguidores y métricas
- **TikTok**: Audiencia y engagement
- **YouTube**: Suscriptores y vistas
- **Twitter**: Seguidores y alcance

### 💰 Estadísticas de Cupones
- **Total de cupones** creados
- **Cupones activos** actualmente
- **Ventas totales** generadas
- **Comisión total** ganada
- **Conversión promedio** de cupones

### 📋 Historial de Promociones
- **Marca** y título de la campaña
- **Estado**: Completada, Activa, Pendiente
- **Ganancias** por promoción
- **Código de cupón** utilizado
- **Usos del cupón** y ventas generadas

### 💳 Historial de Pagos
- **Tipo de pago**: Comisión, Bono, Referral
- **Estado**: Pagado, Pendiente, Procesando
- **Monto** y descripción
- **Fecha** de transacción

## 🚀 Modal de Perfil Detallado

### 📑 Pestañas de Información

#### 1. **Resumen (Overview)**
- Biografía completa
- Información de ubicación y fecha de registro
- Categorías de especialización
- Estadísticas principales en cards visuales
- Redes sociales con métricas detalladas
- Estadísticas completas de cupones

#### 2. **Promociones**
- Historial completo de campañas
- Estado de cada promoción
- Métricas de cupones y ventas
- Ganancias por campaña

#### 3. **Pagos**
- Historial de transacciones
- Tipos de pago y estados
- Montos y fechas
- Descripciones detalladas

#### 4. **Analytics**
- Rendimiento mensual
- Métricas de cupones
- Comparativa de redes sociales
- Gráficos de rendimiento

### 🎯 Acciones Disponibles
- **Contactar Influencer**: Botón principal para iniciar comunicación
- **Guardar Perfil**: Para revisión posterior
- **Compartir**: Enviar a otros usuarios
- **Descargar**: Información del perfil

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **Iconos**: Lucide React
- **Estado**: React Hooks (useState, useEffect)
- **Componentes**: Modales, Tabs, Cards responsivas

## 📁 Estructura de Archivos

```
src/
├── pages/
│   └── InfluencersMarketplace.tsx    # Página principal del marketplace
├── components/
│   └── InfluencerProfileModal.tsx    # Modal de perfil detallado
└── App.tsx                          # Rutas (incluye /influencers)
```

## 🎨 Diseño y UX

### Paleta de Colores
- **Primario**: Pink-600, Purple-600, Indigo-700
- **Secundario**: Blue-600, Green-600, Orange-600
- **Neutro**: Gray-50, Gray-100, Gray-200
- **Estado**: Green (activo), Blue (verificado), Yellow (pendiente)

### Características de Diseño
- **Gradientes atractivos**: Header con transiciones suaves
- **Cards responsivas**: Grid adaptativo (1→2→3 columnas)
- **Badges visuales**: Estados claros y badges especiales
- **Iconos contextuales**: Para redes sociales y métricas
- **Hover effects**: Transiciones suaves en interacciones

## 🔌 Integración

### Rutas
- **`/influencers`**: Página principal del marketplace
- **`/marketplace`**: Marketplace de promociones (complementario)

### Navegación
- Enlace agregado al header principal
- Accesible desde la página de landing
- Navegación móvil incluida

## 📱 Responsividad

- **Mobile First**: Diseño optimizado para dispositivos móviles
- **Grid Adaptativo**: 1 columna (mobile) → 2 columnas (tablet) → 3 columnas (desktop)
- **Navegación Móvil**: Menú hamburguesa con enlaces
- **Modal Responsivo**: Adaptable a diferentes tamaños de pantalla

## 🚧 Estado Actual

### ✅ Implementado
- [x] Página principal del marketplace
- [x] Sistema de filtros y búsqueda avanzada
- [x] Tarjetas de influencers con diseño atractivo
- [x] Modal de perfil detallado con 4 pestañas
- [x] Integración con navegación principal
- [x] Diseño responsivo completo
- [x] Mock data realista para pruebas
- [x] Sistema de badges y estados visuales

### 🔄 Próximos Pasos
- [ ] Integración con API real
- [ ] Sistema de chat en tiempo real
- [ ] Notificaciones de nuevos influencers
- [ ] Sistema de favoritos y listas personalizadas
- [ ] Filtros avanzados por métricas
- [ ] Sistema de reviews y ratings
- [ ] Analytics en tiempo real

## 🧪 Pruebas

### Acceso
1. Navegar a `http://localhost:5174/influencers`
2. Explorar los influencers disponibles
3. Probar filtros y búsqueda
4. Hacer clic en "Ver Perfil Completo" para ver el modal

### Funcionalidades a Probar
- ✅ Búsqueda por texto
- ✅ Filtros por categoría, ubicación, estado
- ✅ Ordenamiento por diferentes criterios
- ✅ Modal de perfil con 4 pestañas
- ✅ Visualización de estadísticas
- ✅ Historial de promociones y pagos
- ✅ Diseño responsivo
- ✅ Navegación entre pestañas

## 📊 Mock Data

El marketplace incluye datos de ejemplo para:

### **María García** (Moda & Belleza)
- **Seguidores**: 291K total
- **Engagement**: 4.8%
- **Ganancias**: $45K total
- **Cupones**: 15 total, 8 activos
- **Promociones**: Zara, Sephora

### **Carlos Rodríguez** (Tecnología & Gaming)
- **Seguidores**: 368K total
- **Engagement**: 4.6%
- **Ganancias**: $32K total
- **Cupones**: 12 total, 5 activos
- **Promociones**: Samsung

### **Ana Martínez** (Fitness & Bienestar)
- **Seguidores**: 546K total
- **Engagement**: 4.9%
- **Ganancias**: $67K total
- **Cupones**: 22 total, 12 activos
- **Promociones**: Nike

## 🔗 Relación con Otros Marketplaces

### Marketplace de Promociones (`/marketplace`)
- **Enfoque**: Promociones para influencers
- **Usuarios**: Influencers buscando campañas
- **Sistema**: Subastas holandesas/inglesas

### Marketplace de Influencers (`/influencers`)
- **Enfoque**: Influencers para marcas
- **Usuarios**: Marcas buscando influencers
- **Sistema**: Perfiles y métricas detalladas

## 🤝 Contribución

Para contribuir al marketplace de influencers:

1. Crear feature branch desde `main`
2. Implementar funcionalidad
3. Agregar tests si es necesario
4. Crear Pull Request con descripción detallada

## 📞 Soporte

Para dudas o problemas con el marketplace de influencers:
- Revisar este README
- Verificar la consola del navegador
- Revisar logs del servidor
- Contactar al equipo de desarrollo

---

**Desarrollado con ❤️ para Link4Deal**

*Marketplace de Influencers - Conectando marcas con talento digital*
