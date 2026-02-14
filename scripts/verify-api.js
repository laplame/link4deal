#!/usr/bin/env node
/**
 * Verifica el funcionamiento de la API de promociones:
 * - Conexión a MongoDB Atlas (vía /health)
 * - GET /api/promotions (listado)
 * - POST /api/promotions (crear promoción de prueba, con imagen mínima)
 *
 * Uso:
 *   node scripts/verify-api.js
 *   BASE_URL=https://damecodigo.com node scripts/verify-api.js
 *   BASE_URL=http://localhost:5001 node scripts/verify-api.js
 *
 * Requiere Node 18+ (fetch nativo) o instalar node-fetch.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Imagen PNG 1x1 mínima (base64) para cumplir "al menos una imagen"
const MINI_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDQAEhAEAwv3gBgAAAABJRU5ErkJggg==';

function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}

function buildFormData() {
  const formData = new FormData();
  const now = new Date();
  const validFrom = new Date(now);
  const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  formData.append('title', 'Oferta de prueba - Verificación API');
  formData.append('description', 'Promoción creada por script verify-api.js para verificar POST.');
  formData.append('productName', 'Producto prueba');
  formData.append('brand', 'Marca prueba');
  formData.append('category', 'other');
  formData.append('originalPrice', '100');
  formData.append('currentPrice', '50');
  formData.append('currency', 'MXN');
  formData.append('discountPercentage', '50');
  formData.append('storeName', 'Tienda prueba');
  formData.append('validFrom', validFrom.toISOString());
  formData.append('validUntil', validUntil.toISOString());

  const buf = Buffer.from(MINI_PNG_BASE64, 'base64');
  const blob = new Blob([buf], { type: 'image/png' });
  formData.append('images', blob, 'test-1x1.png');

  return formData;
}

async function main() {
  console.log('\n========================================');
  console.log('  Verificación API Promociones');
  console.log('  BASE_URL:', BASE_URL);
  console.log('========================================\n');

  let ok = true;

  // 1. Health (conexión Atlas)
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (!res.ok) {
      log('❌', `Health: ${res.status} - ${data.error || data.message || 'Error'}`);
      ok = false;
    } else {
      log('✅', 'Health OK');
      const db = data.services?.database;
      if (db) {
        log('  ', `DB connected: ${db.connected}`);
        log('  ', `DB state: ${db.state} (1 = connected)`);
        log('  ', `DB host: ${db.host || 'N/A'}`);
        if (!db.connected) {
          log('⚠️', 'MongoDB no está conectado - las ofertas pueden no persistir (modo simulado).');
        }
      }
    }
  } catch (err) {
    log('❌', `Health request failed: ${err.message}`);
    log('  ', '¿El servidor está levantado? (npm run server o pm2)');
    ok = false;
  }

  // 2. GET /api/promotions
  try {
    const res = await fetch(`${BASE_URL}/api/promotions?limit=5&page=1&status=active`);
    const data = await res.json();
    if (!res.ok) {
      log('❌', `GET /api/promotions: ${res.status}`);
      ok = false;
    } else {
      const total = data.data?.totalDocs ?? data.data?.docs?.length ?? 0;
      log('✅', `GET /api/promotions OK (promociones activas en respuesta: ${total})`);
      if (total === 0) {
        log('  ', 'No hay ofertas en la base. Crea una desde la web o con el POST de este script.');
      }
    }
  } catch (err) {
    log('❌', `GET /api/promotions failed: ${err.message}`);
    ok = false;
  }

  // 3. POST /api/promotions
  try {
    const formData = buildFormData();
    const res = await fetch(`${BASE_URL}/api/promotions`, {
      method: 'POST',
      body: formData
      // No set Content-Type; fetch sets multipart/form-data con boundary
    });
    const data = await res.json();
    if (res.status >= 200 && res.status < 300) {
      log('✅', 'POST /api/promotions OK - Promoción de prueba creada');
      log('  ', `ID: ${data.data?.id ?? data.data?._id ?? 'N/A'}`);
      log('  ', `Modo: ${data.mode || 'database'}`);
    } else {
      log('❌', `POST /api/promotions: ${res.status} - ${data.message || JSON.stringify(data)}`);
      ok = false;
    }
  } catch (err) {
    log('❌', `POST /api/promotions failed: ${err.message}`);
    ok = false;
  }

  console.log('\n========================================');
  if (ok) {
    log('✅', 'Verificación completada sin errores.');
  } else {
    log('❌', 'Algunas comprobaciones fallaron.');
    process.exit(1);
  }
  console.log('========================================\n');
}

main();
