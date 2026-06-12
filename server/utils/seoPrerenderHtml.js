const fs = require('fs');
const path = require('path');
const { resolvePromotionPublicUrl } = require('./promotionPublicSlug');

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function siteBaseUrl() {
    return (process.env.PUBLIC_SITE_URL || 'https://www.damecodigo.com').replace(/\/$/, '');
}

let cachedSpaAssets = null;

/** Lee dist/index.html para reutilizar hashes de Vite en el shell híbrido. */
function getSpaAssetTags() {
    if (cachedSpaAssets) return cachedSpaAssets;
    const distIndex = path.join(__dirname, '../../dist/index.html');
    try {
        const html = fs.readFileSync(distIndex, 'utf8');
        const headExtra = [];
        const scripts = [];
        const linkRe = /<link[^>]+rel="(?:modulepreload|stylesheet|icon|apple-touch-icon|manifest)"[^>]*>/gi;
        const scriptRe = /<script[^>]+type="module"[^>]*><\/script>/gi;
        let m;
        while ((m = linkRe.exec(html))) headExtra.push(m[0]);
        while ((m = scriptRe.exec(html))) scripts.push(m[0]);
        cachedSpaAssets = { headExtra: headExtra.join('\n    '), scripts: scripts.join('\n    ') };
    } catch {
        cachedSpaAssets = { headExtra: '', scripts: '' };
    }
    return cachedSpaAssets;
}

function promoPublicPath(promo) {
    const slug = promo.publicSlug || '';
    const id = promo._id ? String(promo._id) : promo.id ? String(promo.id) : '';
    if (slug) return `/promo/${encodeURIComponent(slug)}`;
    if (id) return `/promotion-details/${encodeURIComponent(id)}`;
    return '/marketplace';
}

function formatPrice(amount, currency) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return '';
    const cur = currency || 'MXN';
    try {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: cur }).format(n);
    } catch {
        return `$${n.toFixed(2)}`;
    }
}

function buildOfferJsonLd(promo, baseUrl) {
    const url = resolvePromotionPublicUrl(promo.publicSlug, promo._id || promo.id);
    const store = promo.storeLocation || {};
    const coords = store.coordinates || {};
    const business = {
        '@type': 'LocalBusiness',
        name: promo.storeName || promo.brand || 'Comercio',
        address: {
            '@type': 'PostalAddress',
            streetAddress: store.address || undefined,
            addressLocality: store.city || undefined,
            addressRegion: store.state || undefined,
            addressCountry: store.country || 'MX',
        },
    };
    if (typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
        business.geo = {
            '@type': 'GeoCoordinates',
            latitude: coords.latitude,
            longitude: coords.longitude,
        };
    }
    return {
        '@context': 'https://schema.org',
        '@type': 'Offer',
        name: promo.title || 'Promoción',
        description: promo.description || '',
        url,
        priceCurrency: promo.currency || 'MXN',
        price: promo.currentPrice,
        validThrough: promo.validUntil ? new Date(promo.validUntil).toISOString() : undefined,
        offeredBy: business,
        availability: 'https://schema.org/InStock',
    };
}

function renderPromotionCard(promo, baseUrl) {
    const href = `${baseUrl}${promoPublicPath(promo)}`;
    const discount =
        promo.discountPercentage > 0 ? `${Math.round(promo.discountPercentage)}%` : 'Oferta';
    const brand = escapeHtml(promo.brand || promo.storeName || '');
    const title = escapeHtml(promo.title || 'Promoción');
    const city = escapeHtml(promo.storeLocation?.city || '');
    const price = formatPrice(promo.currentPrice, promo.currency);
    return `<article class="seo-card">
  <h2><a href="${escapeHtml(href)}">${title}</a></h2>
  <p class="seo-meta">${brand}${city ? ` · ${city}` : ''} · <strong>${escapeHtml(discount)}</strong>${price ? ` · ${escapeHtml(price)}` : ''}</p>
  ${promo.description ? `<p>${escapeHtml(promo.description).slice(0, 220)}</p>` : ''}
  <p><a href="${escapeHtml(href)}">Ver promoción</a></p>
</article>`;
}

function renderPageShell({
    title,
    description,
    canonicalUrl,
    ogImage,
    noindex = false,
    jsonLd,
    bodyHtml,
    mainClass = 'seo-prerender',
}) {
    const baseUrl = siteBaseUrl();
    const assets = getSpaAssetTags();
    const robots = noindex ? '<meta name="robots" content="noindex, follow" />' : '';
    const ld =
        jsonLd != null
            ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
            : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description || '')}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl || baseUrl)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description || '')}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl || baseUrl)}" />
  ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ''}
  ${robots}
  ${ld}
  <style>
    body{font-family:system-ui,-apple-system,sans-serif;margin:0;background:#f9fafb;color:#111827}
    .seo-wrap{max-width:56rem;margin:0 auto;padding:1.5rem}
    .seo-card{background:#fff;border:1px solid #e5e7eb;border-radius:.75rem;padding:1rem;margin:.75rem 0}
    .seo-card h2{font-size:1.125rem;margin:0 0 .5rem}
    .seo-meta{color:#6b7280;font-size:.875rem;margin:0 0 .5rem}
    a{color:#4f46e5}
    .seo-cta{display:inline-block;margin-top:1rem;padding:.75rem 1.25rem;background:#16a34a;color:#fff;text-decoration:none;border-radius:.5rem;font-weight:600}
    noscript{padding:1rem;background:#fef3c7;display:block;margin:1rem 0}
  </style>
  ${assets.headExtra}
</head>
<body>
  <noscript>Esta página muestra promociones sin JavaScript. Activa JS para cupones interactivos.</noscript>
  <main class="${escapeHtml(mainClass)}">
    <div class="seo-wrap">
      ${bodyHtml}
    </div>
  </main>
  <div id="root"></div>
  ${assets.scripts}
</body>
</html>`;
}

function renderMarketplacePage(promotions) {
    const baseUrl = siteBaseUrl();
    const cards = promotions.map((p) => renderPromotionCard(p, baseUrl)).join('\n');
    const body = `<header>
  <h1>Marketplace de promociones</h1>
  <p>Descuentos y ofertas activas de marcas y comercios en México.</p>
</header>
<section aria-label="Promociones activas">
  ${cards || '<p>No hay promociones activas en este momento.</p>'}
</section>
<p><a href="${baseUrl}/marketplace">Abrir marketplace interactivo</a></p>`;

    return renderPageShell({
        title: 'Promociones y descuentos cerca de ti — DameCodigo',
        description:
            'Explora promociones activas de marcas y comercios. Cupones y descuentos según tu ubicación.',
        canonicalUrl: `${baseUrl}/marketplace`,
        bodyHtml: body,
    });
}

function renderPromoDetailPage(promo) {
    const baseUrl = siteBaseUrl();
    const url = resolvePromotionPublicUrl(promo.publicSlug, promo._id || promo.id);
    const expired =
        promo.status === 'expired' ||
        (promo.validUntil && new Date(promo.validUntil).getTime() < Date.now());
    const discount =
        promo.discountPercentage > 0 ? `${Math.round(promo.discountPercentage)}% de descuento` : 'Oferta especial';
    const price = formatPrice(promo.currentPrice, promo.currency);
    const original = promo.originalPrice > 0 ? formatPrice(promo.originalPrice, promo.currency) : '';
    const validThrough = promo.validUntil
        ? new Date(promo.validUntil).toLocaleDateString('es-MX')
        : '';
    const city = promo.storeLocation?.city || '';
    const brand = promo.brand || promo.storeName || '';
    const img =
        Array.isArray(promo.images) && promo.images[0]
            ? promo.images[0].cloudinaryUrl || promo.images[0].url
            : '';

    const body = `<article>
  <h1>${escapeHtml(promo.title || 'Promoción')}</h1>
  <p><strong>${escapeHtml(brand)}</strong>${city ? ` · ${escapeHtml(city)}` : ''}</p>
  <p>${escapeHtml(discount)}${price ? ` · Precio: <strong>${escapeHtml(price)}</strong>` : ''}${original ? ` <s>${escapeHtml(original)}</s>` : ''}</p>
  ${validThrough ? `<p>Vigente hasta: ${escapeHtml(validThrough)}</p>` : ''}
  ${expired ? '<p><strong>Esta promoción ya no está vigente.</strong></p>' : ''}
  ${promo.description ? `<p>${escapeHtml(promo.description)}</p>` : ''}
  ${!expired && promo.showRedeemButton !== false ? `<a class="seo-cta" href="${escapeHtml(url)}">Obtener cupón</a>` : ''}
  <p><a href="${baseUrl}/marketplace">Ver más promociones</a></p>
</article>`;

    return renderPageShell({
        title: `${promo.title || 'Promoción'} — ${brand}${city ? `, ${city}` : ''} | DameCodigo`,
        description: promo.description || `${discount} en ${brand}${city ? ` (${city})` : ''}.`,
        canonicalUrl: url,
        ogImage: img && img.startsWith('http') ? img : img ? `${baseUrl}${img}` : undefined,
        noindex: expired,
        jsonLd: buildOfferJsonLd(promo, baseUrl),
        bodyHtml: body,
        mainClass: 'seo-prerender seo-promo-detail',
    });
}

function renderAggregationPage(page, promotions) {
    const baseUrl = siteBaseUrl();
    const canonical = `${baseUrl}/promociones/${page.slug}`;
    const cards = promotions.map((p) => renderPromotionCard(p, baseUrl)).join('\n');
    const body = `<header>
  <h1>${escapeHtml(page.heading)}</h1>
  <p>${escapeHtml(page.metaDescription)}</p>
</header>
<section aria-label="Promociones">
  ${cards || '<p>No hay promociones activas para este criterio.</p>'}
</section>
<p><a href="${baseUrl}/marketplace">Ver todas las promociones</a></p>`;

    return renderPageShell({
        title: page.title,
        description: page.metaDescription,
        canonicalUrl: canonical,
        bodyHtml: body,
    });
}

function buildSitemapXml({ promotions, aggregations }) {
    const baseUrl = siteBaseUrl();
    const now = new Date().toISOString();
    const urls = [
        { loc: `${baseUrl}/`, priority: '1.0' },
        { loc: `${baseUrl}/marketplace`, priority: '0.9' },
        { loc: `${baseUrl}/influencer`, priority: '0.8' },
        { loc: `${baseUrl}/influencer/waitlist`, priority: '0.85' },
    ];

    for (const page of aggregations || []) {
        urls.push({ loc: `${baseUrl}/promociones/${page.slug}`, priority: '0.75' });
    }

    for (const promo of promotions || []) {
        const path = promoPublicPath(promo);
        if (path === '/marketplace') continue;
        urls.push({
            loc: `${baseUrl}${path}`,
            lastmod: promo.updatedAt ? new Date(promo.updatedAt).toISOString() : now,
            priority: '0.7',
        });
    }

    const body = urls
        .map(
            (u) => `  <url>
    <loc>${escapeHtml(u.loc)}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : `<lastmod>${now}</lastmod>`}
    <changefreq>daily</changefreq>
    <priority>${u.priority || '0.5'}</priority>
  </url>`
        )
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

function buildRobotsTxt() {
    const baseUrl = siteBaseUrl();
    return `User-agent: *
Allow: /
Allow: /marketplace
Allow: /influencer
Allow: /promo/
Allow: /promociones/
Disallow: /admin
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
}

module.exports = {
    escapeHtml,
    siteBaseUrl,
    promoPublicPath,
    renderMarketplacePage,
    renderPromoDetailPage,
    renderAggregationPage,
    buildSitemapXml,
    buildRobotsTxt,
    getSpaAssetTags,
};
