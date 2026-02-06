# 🖼️ Optimización de Imágenes

Este módulo optimiza las imágenes subidas para mejorar la relación peso/calidad y reducir el tiempo de descarga.

## 📋 Características

- **Redimensionamiento automático**: Máximo 1920x1920px (configurable)
- **Compresión inteligente**: Mantiene calidad visual mientras reduce el tamaño
- **Conversión a WebP**: Mejor compresión que JPEG/PNG cuando es posible
- **Progressive JPEG**: Carga progresiva para mejor UX
- **Preservación de metadatos**: Mantiene información importante de la imagen

## ⚙️ Configuración

Variables de entorno en `.env`:

```env
# Dimensiones máximas
IMAGE_MAX_WIDTH=1920
IMAGE_MAX_HEIGHT=1920

# Calidad de compresión (1-100, recomendado: 85)
IMAGE_QUALITY=85

# Formato de salida: 'auto', 'jpeg', 'png', 'webp'
IMAGE_FORMAT=auto
```

## 📊 Resultados Esperados

- **Reducción de tamaño**: 40-70% típicamente
- **Calidad visual**: Mantiene excelente calidad (85% por defecto)
- **Tiempo de carga**: Significativamente más rápido
- **Ancho de banda**: Menor consumo

## 🔧 Uso

La optimización se aplica automáticamente cuando se suben imágenes a través de `/api/promotions`.

### Ejemplo de resultado:

```
📊 Imagen original: 4000x3000, 2450.50KB
✅ Imagen optimizada: 1920x1440, 450.25KB (81.6% reducción)
```

## 📝 Notas

- El OCR usa la imagen original (no optimizada) para mejor precisión
- Las imágenes optimizadas se guardan en formato WebP cuando es posible
- Si la optimización falla, se usa la imagen original
- Cloudinary también optimiza automáticamente si está configurado
