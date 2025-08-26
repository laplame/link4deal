# 🍪 Banner de Cookies para DameCodigo

## 📋 Descripción

Sistema completo de gestión de cookies con explicación detallada sobre geolocalización para cupones personalizados. Cumple con las regulaciones de privacidad (GDPR, CCPA) y proporciona transparencia total sobre el uso de datos.

## 🚀 Características

### ✅ **Banner Principal**
- **Diseño responsive** y moderno
- **Explicación clara** sobre geolocalización
- **Botones de acción** intuitivos
- **Integración con SITE_CONFIG**
- **Frecuencia inteligente**: Una vez por día hasta aceptar

### ✅ **Configuración Detallada**
- **4 tipos de cookies** con explicaciones claras
- **Geolocalización destacada** con beneficios explicados
- **Preferencias personalizables** por categoría
- **Persistencia en localStorage**

### ✅ **Hook Personalizado**
- **Gestión de estado** centralizada
- **API completa** para preferencias
- **Integración con geolocalización**
- **Manejo de errores** robusto
- **Lógica diaria**: Banner aparece solo una vez por día

### ✅ **Componente de Configuración**
- **Panel completo** de preferencias
- **Visualización de ubicación** actual
- **Acciones masivas** (aceptar/rechazar todo)
- **Información educativa** sobre cada tipo

## 📁 Estructura de Archivos

```
src/
├── components/
│   ├── CookieBanner.tsx          # Banner principal
│   └── CookieSettings.tsx        # Panel de configuración
├── hooks/
│   └── useCookieConsent.ts       # Hook personalizado
└── config/
    └── site.ts                   # Configuración del sitio
```

## 🕐 Funcionalidad Diaria

### **Comportamiento del Banner:**
- **Primera visita**: El banner aparece automáticamente
- **Visitas posteriores**: No aparece si ya se aceptaron las cookies
- **Nuevo día**: Aparece nuevamente (una vez por día)
- **Persistencia**: Las preferencias se mantienen entre sesiones

### **Lógica de Frecuencia:**
```typescript
// El banner se muestra cuando:
const shouldShowBanner = 
  lastVisitDate !== today && // Es un día diferente
  !cookiesAccepted;          // No se han aceptado cookies
```

## 🛠️ Instalación y Uso

### **1. Importar en tu App principal**

```tsx
import CookieBanner from './components/CookieBanner';

function App() {
  return (
    <div>
      {/* Tu contenido principal */}
      <CookieBanner />
    </div>
  );
}
```

### **2. Usar el hook en componentes**

```tsx
import { useCookieConsent } from '../hooks/useCookieConsent';

function MyComponent() {
  const { preferences, hasConsented, enableGeolocation } = useCookieConsent();
  
  // Verificar si se aceptó geolocalización
  if (preferences.geolocation) {
    // Habilitar funcionalidades de ubicación
  }
  
  return (
    <div>
      {/* Tu componente */}
    </div>
  );
}
```

### **3. Agregar enlace a configuración**

```tsx
import { Link } from 'react-router-dom';

// En tu navbar o footer
<Link to="/cookie-settings" className="text-sm text-gray-500 hover:text-gray-700">
  Configuración de Cookies
</Link>
```

## 🎯 Tipos de Cookies

### **🍪 Necesarias (Siempre activas)**
- **Propósito**: Funcionalidad básica del sitio
- **Incluye**: Sesión, seguridad, carrito de compras
- **Control**: No se puede desactivar

### **📍 Geolocalización**
- **Propósito**: Cupones personalizados por ubicación
- **Beneficios**: 
  - Ofertas de tiendas cercanas
  - Promociones relevantes
  - Experiencia de compra optimizada
- **Control**: Opcional, con explicación detallada

### **📊 Analíticas**
- **Propósito**: Mejorar el sitio
- **Incluye**: Métricas de uso, páginas visitadas
- **Control**: Opcional

### **🎯 Marketing**
- **Propósito**: Promociones personalizadas
- **Incluye**: Publicidad, retargeting, cupones
- **Control**: Opcional

## 🔧 Configuración

### **Personalizar colores y estilos**

```tsx
// En CookieBanner.tsx, modificar las clases de Tailwind
className="bg-blue-600 hover:bg-blue-700" // Botón principal
className="bg-gray-100 hover:bg-gray-200" // Botón secundario
```

### **Modificar textos**

```tsx
// En src/config/site.ts
export const SITE_CONFIG = {
  name: 'DameCodigo',
  cookieBanner: {
    title: 'Tu título personalizado',
    description: 'Tu descripción personalizada',
    // ... más configuraciones
  }
};
```

### **Agregar nuevos tipos de cookies**

```tsx
// En useCookieConsent.ts
interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  geolocation: boolean;
  // Agregar nuevo tipo
  social: boolean;
}
```

## 📱 Responsive Design

- **Mobile First**: Optimizado para dispositivos móviles
- **Breakpoints**: Adaptable a todas las pantallas
- **Touch Friendly**: Botones y controles táctiles
- **Accesibilidad**: ARIA labels y navegación por teclado

## 🔒 Privacidad y Cumplimiento

### **GDPR Compliance**
- ✅ Consentimiento explícito
- ✅ Preferencias granulares
- ✅ Derecho de retiro
- ✅ Información transparente

### **CCPA Compliance**
- ✅ Notificación de cookies
- ✅ Opción de opt-out
- ✅ Información sobre venta de datos

### **Funcionalidades**
- ✅ Persistencia de preferencias
- ✅ Geolocalización opcional
- ✅ Explicación clara de beneficios
- ✅ Enlaces a políticas de privacidad

## 🧪 Testing

### **Verificar funcionalidad**

```bash
# 1. Limpiar localStorage
localStorage.clear();

# 2. Recargar página
# 3. Verificar que aparezca el banner
# 4. Probar todas las opciones
# 5. Verificar persistencia
```

### **Casos de prueba**

- ✅ Banner aparece en primera visita
- ✅ Preferencias se guardan correctamente
- ✅ Geolocalización funciona si se acepta
- ✅ Banner no aparece después de aceptar
- ✅ Configuración se puede cambiar después

## 🚀 Próximas Mejoras

- [ ] **Integración con Google Analytics** (si se aceptan cookies analíticas)
- [ ] **Sincronización con backend** para preferencias del usuario
- [ ] **A/B Testing** de diferentes mensajes
- [ ] **Analytics de consentimiento** para optimizar conversión
- [ ] **Integración con Google Tag Manager**

## 📞 Soporte

Para dudas o problemas con la implementación:

1. **Revisar logs** del navegador
2. **Verificar localStorage** en DevTools
3. **Comprobar permisos** de geolocalización
4. **Revisar consola** para errores

## 📄 Licencia

Este componente es parte del proyecto DameCodigo y está disponible bajo la misma licencia del proyecto principal.

---

**¡El banner de cookies está listo para usar! 🎉**
