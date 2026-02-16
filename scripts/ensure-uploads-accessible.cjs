#!/usr/bin/env node
/**
 * Asegura que la carpeta uploads sea accesible:
 * - Crea server/uploads y subcarpetas (promotions, agencies, brands, influencers, users)
 * - Aplica permisos 755 para que el proceso Node y Nginx puedan leer
 * - Muestra el bloque Nginx necesario y cómo verificar
 *
 * Uso: node scripts/ensure-uploads-accessible.cjs
 *      Desde la raíz del proyecto (link4deal).
 */

const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SERVER_DIR = path.join(PROJECT_ROOT, 'server');

// Misma lógica que server/middleware/upload.js (resolución desde server/middleware)
function getUploadDir() {
  try {
    const envPath = path.join(SERVER_DIR, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const m = content.match(/^\s*UPLOAD_PATH\s*=\s*(.+)\s*$/m);
      if (m) {
        const raw = m[1].trim();
        if (path.isAbsolute(raw)) return raw;
        const middlewareDir = path.join(SERVER_DIR, 'middleware');
        return path.resolve(middlewareDir, raw);
      }
    }
  } catch (_) {}
  return path.join(SERVER_DIR, 'uploads');
}

const SUBDIRS = ['promotions', 'agencies', 'brands', 'influencers', 'users'];

function main() {
  console.log('==========================================');
  console.log('  Asegurar carpeta uploads accesible');
  console.log('==========================================\n');

  const uploadsPath = getUploadDir();
  console.log('Ruta de uploads:', uploadsPath);

  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('Creado:', uploadsPath);
  }

  for (const sub of SUBDIRS) {
    const dir = path.join(uploadsPath, sub);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('Creado:', dir);
    }
  }

  // Permisos 755 para que el servidor pueda servir los archivos
  try {
    fs.chmodSync(uploadsPath, 0o755);
    for (const sub of SUBDIRS) {
      const dir = path.join(uploadsPath, sub);
      if (fs.existsSync(dir)) fs.chmodSync(dir, 0o755);
    }
    console.log('Permisos 755 aplicados a la carpeta y subcarpetas.');
  } catch (e) {
    console.warn('No se pudieron cambiar permisos:', e.message);
  }

  console.log('\n--- Verificación local ---');
  console.log('Con el backend levantado (npm run dev o pm2), prueba:');
  console.log('  curl -I http://localhost:3000/uploads/promotions/');
  console.log('(Debe devolver 403 o listado; un 404 puede indicar ruta distinta.)');
  console.log('\nPara un archivo concreto (si existe):');
  console.log('  curl -I http://localhost:3000/uploads/promotions/<nombre-archivo>');

  console.log('\n--- En producción (Nginx) ---');
  console.log('Asegúrate de tener este bloque en tu server {} (puerto 80 y 443):\n');
  console.log(`    location /uploads/ {
        proxy_pass http://localhost:3000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
`);
  console.log('Archivo típico: /etc/nginx/sites-available/damecodigo.com');
  console.log('Después: sudo nginx -t && sudo systemctl reload nginx');

  console.log('\n==========================================');
  console.log('  Listo.');
  console.log('==========================================');
}

main();
