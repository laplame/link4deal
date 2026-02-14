# Pasos en producción (servidor damecode)

Ejecutar **en el servidor** después de cada despliegue o cambio que afecte al backend o Nginx.

---

## 1. Actualizar código

```bash
cd ~/project/link4deal
git pull
```

---

## 2. Revisar variables de entorno (MongoDB)

El backend carga `server/.env` (también con PM2 en la raíz del proyecto). Comprueba que exista y tenga Atlas:

```bash
grep MONGODB_URI_ATLAS ~/project/link4deal/server/.env
```

Si no existe, crea `server/.env` a partir de `server/.env.example` y configura `MONGODB_URI_ATLAS`. En MongoDB Atlas → Network Access, permite la IP del servidor.

---

## 3. Reiniciar el backend (PM2)

Para que tome el nuevo puerto, la carga de `server/.env` y la conexión a MongoDB:

```bash
pm2 list
pm2 restart server
# o el nombre del proceso que use el backend, ej.: pm2 restart index
pm2 save
```

---

## 4. (Opcional) Build del frontend

Si cambiaste código del frontend:

```bash
cd ~/project/link4deal
npm install
npm run build
```

---

## 5. Nginx

Si solo cambiaste backend: no hace falta tocar Nginx.  
Si actualizaste `nginx.conf` o `damecodigo.com`:

```bash
# Solo si usas el config del repo para damecodigo.com:
# sudo cp ~/project/link4deal/nginx-damecodigo-com.conf /etc/nginx/sites-available/damecodigo.com
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Comprobar

```bash
# Backend responde en 3000
curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/health"

# API por HTTPS (debe devolver 200 y JSON con docs si hay promociones)
curl -s "https://damecodigo.com/api/promotions?limit=1" | head -c 300
```

La respuesta no debe incluir `"MongoDB no conectado - modo simulado"` si Atlas está configurado y la IP permitida.

---

## Resumen (copiar/pegar)

```bash
cd ~/project/link4deal
git pull
grep MONGODB_URI_ATLAS server/.env || echo "Revisa server/.env"
pm2 restart server
pm2 save
curl -s -o /dev/null -w "%{http_code}" "https://damecodigo.com/api/promotions?limit=1"
```
