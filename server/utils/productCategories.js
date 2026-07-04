const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../../src/data/productCategories.json');

let _catalog = null;
let _byId = null;
let _bySlugOrAlias = null;

function loadCatalogRaw() {
    if (!_catalog) {
        _catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    }
    return _catalog;
}

function rebuildIndexes() {
    const { categories } = loadCatalogRaw();
    _byId = Object.fromEntries(categories.map((c) => [c.id, c]));
    _bySlugOrAlias = {};
    for (const cat of categories) {
        _bySlugOrAlias[cat.id] = cat;
        _bySlugOrAlias[cat.slug] = cat;
        for (const alias of cat.slugAliases || []) {
            _bySlugOrAlias[String(alias).toLowerCase()] = cat;
        }
    }
}

function getProductCategories() {
    return loadCatalogRaw().categories;
}

function getProductCategoryIds() {
    return getProductCategories().map((c) => c.id);
}

function findProductCategory(input) {
    if (!_bySlugOrAlias) rebuildIndexes();
    const key = String(input || '').trim().toLowerCase();
    if (!key) return null;
    return _bySlugOrAlias[key] || null;
}

/** Normaliza categoría para guardar en BD: id del catálogo o slug custom sanitizado. */
function normalizeProductCategory(input) {
    const found = findProductCategory(input);
    if (found) return found.id;

    const raw = String(input || '').trim().toLowerCase();
    if (!raw) return 'other';

    const custom = raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48);

    return custom || 'other';
}

function getProductCategoryLabel(id) {
    const cat = findProductCategory(id);
    if (cat) return cat.name;
    if (!id) return 'Otros';
    return String(id)
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function getCategorySeoMeta(slug) {
    const cat = findProductCategory(slug);
    if (!cat) return null;
    return {
        name: cat.name,
        description: cat.description,
        slug: cat.slug,
        id: cat.id,
    };
}

function listCategorySeoSlugs() {
    return getProductCategories().flatMap((c) => [c.slug, ...(c.slugAliases || [])]);
}

module.exports = {
    getProductCategories,
    getProductCategoryIds,
    findProductCategory,
    normalizeProductCategory,
    getProductCategoryLabel,
    getCategorySeoMeta,
    listCategorySeoSlugs,
};
