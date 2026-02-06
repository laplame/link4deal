# Features - Link4Deal

Esta carpeta contiene los archivos de especificación de features en formato Gherkin y el documento PRD (Product Requirements Document) de la plataforma Link4Deal.

## 📁 Estructura

```
features/
├── README.md                      # Este archivo
├── PRD.md                         # Product Requirements Document completo
├── authentication.feature         # Autenticación y sesión
├── user_onboarding.feature        # Onboarding y setup de perfiles
├── promotions_marketplace.feature # Marketplace de promociones
├── influencers_marketplace.feature# Marketplace de influencers
├── promotion_creation.feature     # Creación de promociones
├── shopping_cart.feature          # Carrito de compras
├── checkout.feature               # Proceso de checkout
├── coupons.feature                # Sistema de cupones
├── kyc.feature                    # Verificación KYC
├── dashboards.feature             # Dashboards por rol
├── admin.feature                  # Panel de administración
├── referral_system.feature       # Sistema de referidos
├── categories.feature             # Sistema de categorías
└── landing_pages.feature          # Landing pages
```

## 📋 Archivos Gherkin

Los archivos `.feature` están escritos en formato Gherkin usando el idioma español (`# language: es`). Cada archivo describe:

- **Feature**: La funcionalidad principal
- **Scenarios**: Casos de uso específicos con:
  - **Given**: Estado inicial
  - **When**: Acción del usuario
  - **Then**: Resultado esperado

### Relaciones entre Features

Los features están organizados por módulos funcionales y están relacionados entre sí:

1. **Autenticación** → **Onboarding** → **Dashboards**
2. **Marketplace de Promociones** ↔ **Marketplace de Influencers**
3. **Creación de Promociones** → **Marketplace de Promociones**
4. **Carrito** → **Checkout** → **Cupones**
5. **KYC** → **Dashboards** → **Admin**
6. **Referidos** → **Onboarding** → **Dashboards**

## 📄 PRD.md

El documento PRD contiene:

- Resumen ejecutivo y visión del producto
- Perfiles de usuario (Influencer, Brand, Agency, Admin)
- Funcionalidades principales detalladas
- Relaciones entre páginas y flujos
- Integraciones técnicas
- Requisitos no funcionales
- Métricas de éxito
- Roadmap

## 🔄 Flujos Principales

### Flujo de Influencer
```
Landing → Sign Up → Onboarding → Dashboard → 
Marketplace → Aplicar → Crear Cupón → Compartir → 
Rastrear → Recibir Comisiones
```

### Flujo de Marca
```
Landing → Sign Up → Onboarding → Dashboard → 
Crear Promoción → Recibir Aplicaciones → 
Seleccionar Influencer → Gestionar → Analytics
```

### Flujo de Compra
```
Landing/Marketplace → Producto → Carrito → 
Checkout → Pago → Confirmación
```

## 🛠️ Uso

Estos archivos pueden ser utilizados para:

1. **Desarrollo**: Guía para implementar funcionalidades
2. **Testing**: Base para pruebas automatizadas (Cucumber, etc.)
3. **Documentación**: Referencia para el equipo
4. **Producto**: Especificación de requerimientos

## 📝 Notas

- Todos los archivos están en español
- Los scenarios incluyen tablas de datos cuando es relevante
- Los flujos están documentados con sus relaciones
- El PRD incluye consideraciones técnicas y de negocio

## 🔗 Enlaces Relacionados

- Ver `PRD.md` para documentación completa del producto
- Ver README principal del proyecto para setup técnico
- Ver READMEs específicos (MARKETPLACE_README.md, etc.) para detalles de módulos

---

**Última actualización:** 2024

