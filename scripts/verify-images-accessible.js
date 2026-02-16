#!/usr/bin/env node
/**
 * Verifica si las fotos de las promociones son accesibles en damecodigo.com.
 * Obtiene promociones de la API, extrae URLs de imágenes y hace GET a cada una.
 *
 * Uso: node scripts/verify-images-accessible.js
 *      BASE_URL=https://damecodigo.com node scripts/verify-images-accessible.js
 */

const BASE_URL = process.env.BASE_URL || 'https://damecodigo.com';

function getImageUrls(promo) {
  const urls = [];
  if (!promo.images || !Array.isArray(promo.images)) return urls;
  for (const img of promo.images) {
    if (img.cloudinaryUrl) urls.push(img.cloudinaryUrl);
    else if (img.url) urls.push(img.url.startsWith('http') ? img.url : `${BASE_URL}${img.url}`);
    else if (img.filename) urls.push(`${BASE_URL}/uploads/promotions/${img.filename}`);
  }
  return urls;
}

async function main() {
  console.log('==========================================');
  console.log('  Verificar acceso a imágenes (damecodigo.com)');
  console.log('  BASE_URL:', BASE_URL);
  console.log('========================================\n');

  let response;
  try {
    response = await fetch(`${BASE_URL}/api/promotions?limit=10&page=1&status=active`);
  } catch (e) {
    console.error('Error obteniendo promociones:', e.message);
    process.exit(1);
  }

  const data = await response.json();
  if (!data.success || !data.data?.docs?.length) {
    console.log('No hay promociones activas o la API no devolvió docs.');
    process.exit(0);
  }

  const allUrls = [];
  for (const promo of data.data.docs) {
    const urls = getImageUrls(promo);
    for (const u of urls) allUrls.push({ url: u, title: promo.title });
  }

  if (allUrls.length === 0) {
    console.log('Ninguna promoción tiene imágenes con url/filename.');
    process.exit(0);
  }

  console.log(`Comprobando ${allUrls.length} imagen(es)...\n`);

  let ok = 0;
  let fail = 0;
  for (const { url, title } of allUrls) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      const code = r.status;
      const contentType = r.headers.get('content-type') || '';
      const isImage = contentType.startsWith('image/');
      if (code === 200 && isImage) {
        console.log(`  OK  200  ${url}`);
        ok++;
      } else {
        console.log(`  FALLO  ${code}  (${contentType.slice(0, 30)})  ${url}`);
        fail++;
      }
    } catch (e) {
      console.log(`  ERROR  ${e.message}  ${url}`);
      fail++;
    }
  }

  console.log('\n==========================================');
  console.log(`  Resumen: ${ok} accesibles, ${fail} fallos (total: ${allUrls.length})`);
  console.log('==========================================');

  if (fail > 0) {
    console.log('\nSi fallan: en el servidor revisa que Nginx haga proxy de /uploads/ a localhost:3000');
    console.log('y que existan los archivos en server/uploads/promotions/');
    process.exit(1);
  }
}

main();
