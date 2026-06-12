import { useEffect } from 'react';

export interface PageSeoProps {
    title: string;
    description?: string;
    canonicalUrl?: string;
    ogImage?: string;
    ogType?: string;
    noindex?: boolean;
    jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
    if (typeof document === 'undefined') return;
    let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
    if (typeof document === 'undefined') return;
    let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
}

function removeJsonLdScript(id: string) {
    document.getElementById(id)?.remove();
}

function injectJsonLd(id: string, data: Record<string, unknown> | Record<string, unknown>[]) {
    removeJsonLdScript(id);
    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
}

/**
 * SEO básico para SPA: title, meta, Open Graph y JSON-LD opcional.
 */
export default function PageSeo({
    title,
    description,
    canonicalUrl,
    ogImage,
    ogType = 'website',
    noindex = false,
    jsonLd,
}: PageSeoProps) {
    useEffect(() => {
        const prevTitle = document.title;
        document.title = title;

        if (description) {
            upsertMeta('name', 'description', description);
            upsertMeta('property', 'og:description', description);
            upsertMeta('name', 'twitter:description', description);
        }

        upsertMeta('property', 'og:title', title);
        upsertMeta('name', 'twitter:title', title);
        upsertMeta('property', 'og:type', ogType);

        if (canonicalUrl) {
            upsertLink('canonical', canonicalUrl);
            upsertMeta('property', 'og:url', canonicalUrl);
        }

        if (ogImage) {
            upsertMeta('property', 'og:image', ogImage);
            upsertMeta('name', 'twitter:image', ogImage);
            upsertMeta('name', 'twitter:card', 'summary_large_image');
        }

        if (noindex) {
            upsertMeta('name', 'robots', 'noindex, follow');
        } else {
            const robots = document.head.querySelector('meta[name="robots"]');
            if (robots?.getAttribute('content')?.includes('noindex')) {
                robots.setAttribute('content', 'index, follow');
            }
        }

        if (jsonLd) {
            injectJsonLd('page-seo-jsonld', jsonLd);
        } else {
            removeJsonLdScript('page-seo-jsonld');
        }

        return () => {
            document.title = prevTitle;
            removeJsonLdScript('page-seo-jsonld');
        };
    }, [title, description, canonicalUrl, ogImage, ogType, noindex, jsonLd]);

    return null;
}
