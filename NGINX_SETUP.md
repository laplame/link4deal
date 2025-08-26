# 🚀 Configuración de Nginx para Link4Deal

## 📋 Problema Resuelto

El error `Failed to lookup view "index" in views directory` indica que hay un servidor Express intentando renderizar vistas que no existen. Esto sucede porque:

1. **Frontend React/Vite** corre en el puerto 5173
2. **Backend Express** corre en el puerto 5001
3. **Nginx** debe servir el frontend estático y hacer proxy de las APIs

## 🛠️ Solución

### Opción 1: Script Automático (Recomendado)

```bash
# En el servidor (como root)
sudo ./setup-nginx.sh
```

### Opción 2: Configuración Manual

1. **Instalar Nginx**:
```bash
sudo apt update
sudo apt install nginx
```

2. **Crear configuración**:
```bash
sudo nano /etc/nginx/sites-available/link4deal
```

3. **Copiar la configuración** del archivo `nginx.conf`

4. **Habilitar el sitio**:
```bash
sudo ln -s /etc/nginx/sites-available/link4deal /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remover sitio por defecto
```

5. **Probar y recargar**:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🌐 Configuración

### Frontend (Puerto 5173)
- **Ruta**: `/home/cto/project/front_mongo/dist`
- **Puerto**: 5173 (y 80 para HTTP)
- **SPA**: Configurado para React Router

### Backend (Puerto 5001)
- **Proxy**: Todas las rutas `/api/*` van al puerto 5001
- **Health Check**: `/health` también va al backend

### Características
- ✅ **Gzip compression** para mejor rendimiento
- ✅ **Cache de assets estáticos** (1 año)
- ✅ **CORS headers** para desarrollo
- ✅ **Proxy inteligente** para APIs
- ✅ **Fallback a index.html** para SPA

## 🔧 Comandos Útiles

```bash
# Verificar estado de Nginx
sudo systemctl status nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Recargar configuración
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar configuración
sudo nginx -t
```

## 📁 Estructura de Archivos

```
/etc/nginx/sites-available/link4deal  # Configuración principal
/etc/nginx/sites-enabled/link4deal    # Enlace simbólico
/home/cto/project/front_mongo/dist    # Build del frontend
```

## 🚨 Troubleshooting

### Error: "Permission denied"
```bash
sudo chown -R www-data:www-data /home/cto/project/front_mongo/dist
```

### Error: "Port already in use"
```bash
sudo netstat -tlnp | grep :5173
sudo kill -9 <PID>
```

### Error: "Cannot bind to address"
```bash
sudo ufw allow 5173
sudo ufw allow 80
```

## 📝 Notas Importantes

1. **Build del Frontend**: Asegúrate de que `npm run build` se ejecute antes de configurar Nginx
2. **Permisos**: El usuario `www-data` debe tener acceso al directorio `dist`
3. **Firewall**: Abre los puertos 80 y 5173 en tu firewall
4. **SSL**: Para producción, considera agregar certificados SSL con Let's Encrypt

## 🎯 Resultado Esperado

- ✅ Frontend accesible en `http://damecodigo.com:5173`
- ✅ APIs funcionando en `/api/*`
- ✅ Sin errores de "view not found"
- ✅ Mejor rendimiento con compresión y cache
