# 🏪 Marketplace de Promociones - Link4Deal

## Descripción

El Marketplace de Promociones es una plataforma donde los **influencers** pueden descubrir y aplicar a promociones exclusivas de marcas, utilizando un sistema de subastas tipo **Polymarket**.

## 🎯 Características Principales

### Sistema de Subastas
- **Subastas Holandesas**: Para promociones - los precios descienden automáticamente
- **Subastas Inglesas**: Para influencers - las pujas ascienden competitivamente

### Funcionalidades del Marketplace

#### 🔍 Búsqueda y Filtros
- Búsqueda por texto (título, marca, categoría)
- Filtros por:
  - Categoría (Moda, Tecnología, Deportes, Belleza, etc.)
  - Ubicación geográfica
  - Tipo de subasta (Holandesa/Inglesa)
  - Estado (Activa, Terminando, Cerrada)
- Ordenamiento por:
  - Más populares (vistas)
  - Terminando pronto
  - Precio (menor a mayor / mayor a menor)
  - Mayor comisión

#### 📊 Dashboard de Métricas
- Promociones activas
- Promociones terminando pronto
- Total de aplicaciones
- Comisión promedio

#### 🎨 Tarjetas de Promociones
- Imagen del producto
- Badges de estado (HOT, FEATURED)
- Información de la marca y categoría
- Precios (original y con descuento)
- Métricas (comisión, engagement, vistas)
- Tiempo restante
- Barra de progreso de aplicaciones
- Requisitos para influencers

## 🚀 Flujo de Aplicación

### 1. Propuesta de Contenido
- Descripción de la idea creativa
- Plataformas donde se publicará
- Alcance estimado de seguidores

### 2. Portfolio y Precios
- Subida de archivos de portfolio
- Definición de tarifas (fija, comisión, híbrida)

### 3. Cronograma y Entregables
- Fechas de inicio y entrega
- Tipos de contenido a entregar

### 4. Resumen y Envío
- Revisión de la aplicación
- Notas adicionales
- Envío final

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **Iconos**: Lucide React
- **Estado**: React Hooks (useState, useEffect)
- **Routing**: React Router

## 📁 Estructura de Archivos

```
src/
├── pages/
│   └── PromotionsMarketplace.tsx    # Página principal del marketplace
├── components/
│   └── PromotionApplicationModal.tsx # Modal de aplicación
└── App.tsx                          # Rutas (incluye /marketplace)
```

## 🎨 Diseño

### Inspiración
- **Polymarket**: Interfaz moderna para trading/predicciones
- **Cards responsivas**: Grid adaptativo para diferentes tamaños de pantalla
- **Gradientes**: Colores atractivos (purple-600 to blue-600)
- **Badges**: Indicadores visuales para estado y características

### Paleta de Colores
- **Primario**: Purple-600, Blue-600
- **Secundario**: Green-600, Orange-600
- **Neutro**: Gray-50, Gray-100, Gray-200
- **Estado**: Green (activo), Orange (terminando), Red (cerrado)

## 🔌 Integración

### Rutas
- **`/marketplace`**: Página principal del marketplace
- **`/promotion-details/:id`**: Detalles de promoción específica

### Navegación
- Enlace agregado al header principal
- Accesible desde la página de landing

## 📱 Responsividad

- **Mobile First**: Diseño optimizado para dispositivos móviles
- **Grid Adaptativo**: 1 columna (mobile) → 2 columnas (tablet) → 3 columnas (desktop)
- **Navegación Móvil**: Menú hamburguesa con enlaces al marketplace

## 🚧 Estado Actual

### ✅ Implementado
- [x] Página principal del marketplace
- [x] Sistema de filtros y búsqueda
- [x] Tarjetas de promociones con diseño Polymarket
- [x] Modal de aplicación en 4 pasos
- [x] Integración con navegación principal
- [x] Diseño responsivo
- [x] Mock data para pruebas

### 🔄 Próximos Pasos
- [ ] Integración con API real
- [ ] Sistema de notificaciones
- [ ] Dashboard de aplicaciones del influencer
- [ ] Sistema de pagos y comisiones
- [ ] Chat entre marca e influencer
- [ ] Sistema de reviews y ratings

## 🧪 Pruebas

### Acceso
1. Navegar a `http://localhost:5174/marketplace`
2. Explorar las promociones disponibles
3. Probar filtros y búsqueda
4. Hacer clic en "Aplicar Ahora" para ver el modal

### Funcionalidades a Probar
- ✅ Búsqueda por texto
- ✅ Filtros por categoría, ubicación, tipo de subasta
- ✅ Ordenamiento por diferentes criterios
- ✅ Modal de aplicación (4 pasos)
- ✅ Subida de archivos
- ✅ Validación de formularios
- ✅ Diseño responsivo

## 📊 Mock Data

El marketplace incluye datos de ejemplo para:
- **Zara**: Lanzamiento colección primavera
- **Samsung**: Review Galaxy S24
- **Nike**: Campaña fitness
- **Sephora**: Beauty box premium

## 🤝 Contribución

Para contribuir al marketplace:

1. Crear feature branch desde `main`
2. Implementar funcionalidad
3. Agregar tests si es necesario
4. Crear Pull Request con descripción detallada

## 📞 Soporte

Para dudas o problemas con el marketplace:
- Revisar este README
- Verificar la consola del navegador
- Revisar logs del servidor
- Contactar al equipo de desarrollo

---

**Desarrollado con ❤️ para Link4Deal**
