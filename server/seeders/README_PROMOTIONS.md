# Seeder de Promociones

Este seeder sincroniza las promociones mock del frontend a MongoDB Atlas.

## 📋 Promociones que se crearán

1. **Lanzamiento Nueva Colección Primavera 2024** - Zara (Moda)
2. **Review Producto Tecnológico Galaxy S24** - Samsung (Electrónica)
3. **Campaña Fitness & Wellness** - Nike (Deportes)
4. **Beauty Box Premium** - Sephora (Belleza)

## 🚀 Cómo ejecutar

### Prerrequisitos

1. **Configurar MongoDB Atlas**:
   - Agrega tu connection string en el archivo `.env` del servidor:
   ```env
   URI_mongo=mongodb+srv://usuario:password@cluster.mongodb.net/link4deal
   ```

2. **Verificar conexión**:
   - El servidor debe poder conectarse a MongoDB Atlas

### Ejecutar el seeder

Desde el directorio `server/`:

```bash
npm run seed:promotions
```

O directamente:

```bash
node seeders/promotionsSeeder.js
```

## ⚠️ Importante

- **El seeder elimina todas las promociones existentes** antes de crear las nuevas
- Si quieres mantener las promociones existentes, edita el archivo `promotionsSeeder.js` y comenta la sección de eliminación

## 📊 Resultado esperado

```
🔄 Conectando a MongoDB...
✅ Conectado a MongoDB
🌱 Iniciando seed de promociones...
📝 Creando 4 promociones...
✅ Promociones creadas exitosamente:
   1. Lanzamiento Nueva Colección Primavera 2024 (ID: ...)
   2. Review Producto Tecnológico Galaxy S24 (ID: ...)
   3. Campaña Fitness & Wellness (ID: ...)
   4. Beauty Box Premium (ID: ...)

🎉 Seed completado: 4 promociones creadas
🔌 Conexión cerrada
```

## 🔄 Sincronización

Después de ejecutar el seeder, las promociones estarán disponibles en:
- API: `GET /api/promotions`
- Frontend: Las promociones aparecerán automáticamente cuando el frontend llame a la API

## 📝 Notas

- Las fechas de expiración están configuradas para 2024 (ajusta según necesites)
- Las imágenes usan URLs de Unsplash (puedes cambiarlas por URLs de Cloudinary)
- Las coordenadas geográficas están configuradas para las ciudades mencionadas

