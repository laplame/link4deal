const express = require('express');
const seoPublicService = require('../services/seoPublicService');

const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
    try {
        const xml = await seoPublicService.renderSitemapXml();
        res.set('Content-Type', 'application/xml; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(xml);
    } catch (err) {
        console.error('sitemap.xml error:', err);
        res.status(500).type('text/plain').send('Error generating sitemap');
    }
});

router.get('/robots.txt', (req, res) => {
    res.type('text/plain; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(seoPublicService.renderRobotsTxt());
});

router.get('/marketplace', async (req, res) => {
    try {
        const html = await seoPublicService.renderMarketplaceHtml();
        res.type('text/html; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=300');
        res.send(html);
    } catch (err) {
        console.error('prerender /marketplace:', err);
        res.status(500).type('text/plain').send('Error');
    }
});

router.get('/promo/:slug', async (req, res) => {
    try {
        const html = await seoPublicService.renderPromoHtml(req.params.slug);
        if (!html) {
            return res.status(404).type('text/html').send('<!DOCTYPE html><html><body><h1>Promoción no encontrada</h1></body></html>');
        }
        res.type('text/html; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=300');
        res.send(html);
    } catch (err) {
        console.error('prerender /promo:', err);
        res.status(500).type('text/plain').send('Error');
    }
});

router.get('/promociones/:slug', async (req, res) => {
    try {
        const html = await seoPublicService.renderAggregationHtml(req.params.slug);
        if (!html) {
            return res.status(404).type('text/html').send('<!DOCTYPE html><html><body><h1>Página no encontrada</h1></body></html>');
        }
        res.type('text/html; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=300');
        res.send(html);
    } catch (err) {
        console.error('prerender /promociones:', err);
        res.status(500).type('text/plain').send('Error');
    }
});

/** API para la SPA de agregación */
router.get('/api/seo/aggregations', (req, res) => {
    res.json({
        success: true,
        data: seoPublicService.listAggregationPages().map((p) => ({
            slug: p.slug,
            title: p.title,
            heading: p.heading,
            metaDescription: p.metaDescription,
            keyword: p.keyword,
            type: p.type,
        })),
    });
});

router.get('/api/seo/aggregations/:slug', async (req, res) => {
    try {
        const payload = await seoPublicService.getAggregationApiPayload(req.params.slug);
        if (!payload) {
            return res.status(404).json({ success: false, message: 'Agregación no encontrada' });
        }
        res.json({ success: true, data: payload });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
