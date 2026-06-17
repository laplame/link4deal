const fs = require('fs');
const path = require('path');
const { resolvePromotionPublicUrl } = require('./promotionPublicSlug');
const {
    normalizeSlugInput,
    resolveCanonicalPublicSlug,
} = require('./influencerSlug');

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

function formatFollowers(n) {
    const num = Number(n);
    if (!Number.isFinite(num) || num <= 0) return '';
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return String(num);
}

function renderInfluencerCard(inf, baseUrl) {
    const slug =
        resolveCanonicalPublicSlug(inf) ||
        normalizeSlugInput(inf.username) ||
        String(inf._id || '');
    const href = `${baseUrl}/influencer/${encodeURIComponent(slug)}`;
    const name = escapeHtml(inf.name || inf.username || 'Influencer');
    const handle = inf.username ? escapeHtml(`@${String(inf.username).replace(/^@/, '')}`) : '';
    const cats = Array.isArray(inf.categories)
        ? inf.categories.filter(Boolean).slice(0, 3).map(escapeHtml).join(', ')
        : '';
    const followers = formatFollowers(inf.totalFollowers);
    const bio = inf.bio ? escapeHtml(String(inf.bio)).slice(0, 160) : '';
    return `<article class="seo-card">
  <h2><a href="${escapeHtml(href)}">${name}</a></h2>
  <p class="seo-meta">${handle}${followers ? ` · ${followers} seguidores` : ''}${cats ? ` · ${cats}` : ''}</p>
  ${bio ? `<p>${bio}</p>` : ''}
  <p><a href="${escapeHtml(href)}">Ver perfil</a></p>
</article>`;
}

function renderInfluencerIndexPage(influencers) {
    const baseUrl = siteBaseUrl();
    const cards = (influencers || []).map((i) => renderInfluencerCard(i, baseUrl)).join('\n');
    const body = `<header>
  <h1>Gana dinero como influencer en México</h1>
  <p>Únete a DameCodigo y monetiza tu audiencia con comisiones por venta. Conoce a los influencers de la comunidad.</p>
</header>
<section aria-label="Influencers">
  ${cards || '<p>Aún no hay influencers públicos para mostrar.</p>'}
</section>
<p><a class="seo-cta" href="${baseUrl}/influencer/waitlist">Quiero unirme como influencer</a></p>`;

    return renderPageShell({
        title: 'Gana dinero como influencer en México — comisiones por venta',
        description:
            'Conviértete en influencer con DameCodigo y gana comisiones por venta. Conoce a los influencers que ya monetizan su audiencia en México.',
        canonicalUrl: `${baseUrl}/influencer`,
        ogImage: `${baseUrl}/og-image.jpg`,
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

    for (const slug of listCategorySeoSlugs()) {
        urls.push({ loc: `${baseUrl}/category/${slug}`, priority: '0.7' });
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
Allow: /promotion-details/
Allow: /promociones/
Allow: /brand/
Allow: /category/
Disallow: /admin
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
}

// ===== SSR "head-only": sirve el shell real de la SPA (dist/index.html)
// reemplazando solo las meta del <head> por valores dinámicos por página.
// El body (#root + bundles) queda intacto: la SPA hidrata y renderiza el contenido.

let cachedSpaShell = null;

/** Lee dist/index.html completo (shell construido por Vite). Cacheado. */
function getSpaShellHtml() {
    if (cachedSpaShell != null) return cachedSpaShell;
    const distIndex = path.join(__dirname, '../../dist/index.html');
    try {
        cachedSpaShell = fs.readFileSync(distIndex, 'utf8');
    } catch {
        cachedSpaShell = '';
    }
    return cachedSpaShell;
}

/**
 * Inyecta un <head> dinámico en el shell de la SPA sin tocar el <body>.
 * @param {object} head { title, description, canonicalUrl, ogImage, ogType, noindex, jsonLd }
 */
function renderSpaWithHead(head = {}) {
    const baseUrl = siteBaseUrl();
    const title = head.title || 'DameCodigo';
    const description = head.description || '';
    const canonical = head.canonicalUrl || baseUrl;
    const ogImage = head.ogImage || `${baseUrl}/og-image.jpg`;
    const ogType = head.ogType || 'website';
    const robots = head.noindex
        ? '<meta name="robots" content="noindex, follow" />'
        : '<meta name="robots" content="index, follow" />';
    const ld =
        head.jsonLd != null
            ? `<script type="application/ld+json">${JSON.stringify(head.jsonLd)}</script>`
            : '';

    const metaBlock = `
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    ${robots}
    ${ld}
`;

    const shell = getSpaShellHtml();
    if (!shell) {
        // Sin dist/index.html (p. ej. dev): devolver un shell mínimo con head correcto.
        return renderPageShell({
            title,
            description,
            canonicalUrl: canonical,
            ogImage,
            noindex: head.noindex,
            jsonLd: head.jsonLd,
            bodyHtml: '',
        });
    }

    return shell
        .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
        .replace(/[ \t]*<meta\s+name=["']description["'][^>]*>\s*/gi, '')
        .replace(/[ \t]*<meta\s+property=["']og:[^"']*["'][^>]*>\s*/gi, '')
        .replace(/[ \t]*<meta\s+property=["']twitter:[^"']*["'][^>]*>\s*/gi, '')
        .replace(/[ \t]*<meta\s+name=["']twitter:[^"']*["'][^>]*>\s*/gi, '')
        .replace(/[ \t]*<link\s+rel=["']canonical["'][^>]*>\s*/gi, '')
        .replace(/[ \t]*<meta\s+name=["']robots["'][^>]*>\s*/gi, '')
        .replace(/<\/head>/i, `${metaBlock}  </head>`);
}

/** Construye el head dinámico para /promotion-details/:id y /promo/:slug (head-only). */
function buildPromoHead(promo) {
    const baseUrl = siteBaseUrl();
    const url = resolvePromotionPublicUrl(promo.publicSlug, promo._id || promo.id);
    const expired =
        promo.status === 'expired' ||
        (promo.validUntil && new Date(promo.validUntil).getTime() < Date.now());
    const discount =
        promo.discountPercentage > 0
            ? `${Math.round(promo.discountPercentage)}% de descuento`
            : 'Oferta especial';
    const city = promo.storeLocation?.city || '';
    const brand = promo.brand || promo.storeName || '';
    const img =
        Array.isArray(promo.images) && promo.images[0]
            ? promo.images[0].cloudinaryUrl || promo.images[0].url
            : '';
    return {
        title: `${promo.title || 'Promoción'} — ${brand}${city ? `, ${city}` : ''} | DameCodigo`,
        description: promo.description || `${discount} en ${brand}${city ? ` (${city})` : ''}.`,
        canonicalUrl: url,
        ogImage: img && img.startsWith('http') ? img : img ? `${baseUrl}${img}` : undefined,
        ogType: 'website',
        noindex: expired,
        jsonLd: buildOfferJsonLd(promo, baseUrl),
    };
}

/** Construye el head dinámico para /influencer/:slug (head-only). */
function buildInfluencerHead(doc) {
    const baseUrl = siteBaseUrl();
    const slug =
        resolveCanonicalPublicSlug(doc) ||
        normalizeSlugInput(doc.username) ||
        String(doc._id || '');
    const name = doc.name || doc.username || 'Influencer';
    const handle = doc.username ? `@${String(doc.username).replace(/^@/, '')}` : '';
    const cats = Array.isArray(doc.categories)
        ? doc.categories.filter(Boolean).slice(0, 3).join(', ')
        : '';
    const bio = String(doc.bio || '').trim();
    const description = (
        bio ||
        `Conoce a ${name}${handle ? ` (${handle})` : ''}${cats ? `, creador de contenido en ${cats}` : ''} y descubre sus promociones y cupones en DameCodigo.`
    ).slice(0, 300);
    const canonicalUrl = `${baseUrl}/influencer/${encodeURIComponent(slug)}`;
    const ogImage = doc.avatar && /^https?:\/\//i.test(doc.avatar) ? doc.avatar : undefined;
    return {
        title: `${name}${handle ? ` (${handle})` : ''} — Influencer | DameCodigo`,
        description,
        canonicalUrl,
        ogImage,
        ogType: 'profile',
        noindex: false,
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'ProfilePage',
            mainEntity: {
                '@type': 'Person',
                name,
                alternateName: handle || undefined,
                description,
                image: ogImage || undefined,
                url: canonicalUrl,
            },
        },
    };
}

/** Construye el head dinámico para /brand/:brandId (head-only). */
function buildBrandHead(doc) {
    const baseUrl = siteBaseUrl();
    const name = doc.companyName || 'Marca';
    const industry = doc.industry || '';
    const canonicalUrl = `${baseUrl}/brand/${encodeURIComponent(String(doc._id || ''))}`;
    const description = (
        String(doc.description || '').trim() ||
        `Promociones, cupones y ofertas de ${name}${industry ? ` en ${industry}` : ''} en DameCodigo.`
    ).slice(0, 300);
    return {
        title: `${name}${industry ? ` — ${industry}` : ''} | DameCodigo`,
        description,
        canonicalUrl,
        ogType: 'website',
        noindex: false,
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name,
            description,
            url: doc.website || canonicalUrl,
        },
    };
}

// Catálogo SEO de categorías (espejo de src/pages/CategoryPage.tsx).
const CATEGORY_SEO = Object.freeze({
    electronica: {
        name: 'Electrónica',
        description:
            'Ofertas y cupones en tecnología y dispositivos electrónicos: smartphones, laptops, audio y más.',
    },
    moda: {
        name: 'Moda',
        description:
            'Descuentos exclusivos en moda y accesorios: ropa, zapatos, bolsos y joyería de las mejores marcas.',
    },
    hogar: {
        name: 'Hogar',
        description:
            'Promociones en decoración y mobiliario para transformar tu hogar: muebles, cocina, jardín e iluminación.',
    },
    deportes: {
        name: 'Deportes',
        description:
            'Descuentos en equipamiento deportivo: fitness, running, fútbol, natación y ciclismo.',
    },
    fotografia: {
        name: 'Fotografía',
        description:
            'Ofertas en equipo fotográfico profesional: cámaras, lentes, trípodes e iluminación.',
    },
    comida: {
        name: 'Comida y Bebidas',
        description:
            'Cupones y promociones en restaurantes, delivery, bebidas, snacks y experiencias gastronómicas.',
    },
    servicios: {
        name: 'Servicios',
        description:
            'Servicios premium con descuentos exclusivos: educación, salud, belleza, transporte y entretenimiento.',
    },
    digital: {
        name: 'Productos Digitales',
        description: 'Ofertas en productos y servicios digitales con descuentos exclusivos.',
    },
});

function listCategorySeoSlugs() {
    return Object.keys(CATEGORY_SEO);
}

/** Construye el head dinámico para /category/:slug (catálogo estático). */
function buildCategoryHead(slug) {
    const key = String(slug || '').trim().toLowerCase();
    const cat = CATEGORY_SEO[key];
    if (!cat) return null;
    const baseUrl = siteBaseUrl();
    const canonicalUrl = `${baseUrl}/category/${encodeURIComponent(key)}`;
    return {
        title: `${cat.name} — Ofertas y descuentos | DameCodigo`,
        description: cat.description,
        canonicalUrl,
        ogType: 'website',
        noindex: false,
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: cat.name,
            description: cat.description,
            url: canonicalUrl,
        },
    };
}

module.exports = {
    escapeHtml,
    siteBaseUrl,
    promoPublicPath,
    renderMarketplacePage,
    renderInfluencerIndexPage,
    renderPromoDetailPage,
    renderAggregationPage,
    buildSitemapXml,
    buildRobotsTxt,
    getSpaAssetTags,
    getSpaShellHtml,
    renderSpaWithHead,
    buildPromoHead,
    buildInfluencerHead,
    buildBrandHead,
    buildCategoryHead,
    listCategorySeoSlugs,
};
