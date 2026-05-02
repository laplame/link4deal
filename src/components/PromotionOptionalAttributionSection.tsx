import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';
import type { RegisteredBrand } from './RegisteredBrandCard';
import { getBizneShopCoordinates, type BizneShop } from './BizneShopCard';

/** Campos opcionales alineados al payload del cupón QR y al modelo Promotion (sin ser obligatorios). */
export interface PromotionOptionalAttribution {
    brandId: string;
    shopId: string;
    externalProductId: string;
    gtmTag: string;
    campaignId: string;
    source: string;
    medium: string;
}

export const emptyPromotionOptionalAttribution = (): PromotionOptionalAttribution => ({
    brandId: '',
    shopId: '',
    externalProductId: '',
    gtmTag: '',
    campaignId: '',
    source: '',
    medium: ''
});

interface PromotionOptionalAttributionSectionProps {
    value: PromotionOptionalAttribution;
    onChange: (patch: Partial<PromotionOptionalAttribution>) => void;
    onShopSelect?: (shop: BizneShop, coordinates: { latitude: number; longitude: number } | null) => void;
    /** Prefijo para ids de inputs (accesibilidad en formularios con varias instancias). */
    idPrefix?: string;
    variant?: 'light' | 'dark';
}

const inputClassLight =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white';
const inputClassDark =
    'w-full px-3 py-2 text-sm border border-white/15 rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400/50 bg-gray-900/60 text-gray-100 placeholder:text-gray-500';

export default function PromotionOptionalAttributionSection({
    value,
    onChange,
    onShopSelect,
    idPrefix = 'opt-attr',
    variant = 'light'
}: PromotionOptionalAttributionSectionProps) {
    const [catalogBrands, setCatalogBrands] = useState<RegisteredBrand[]>([]);
    const [catalogShops, setCatalogShops] = useState<BizneShop[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setCatalogLoading(true);

        const brandsP = fetch('/api/brands')
            .then((res) => res.json())
            .then((data) => {
                if (!cancelled && data?.success && Array.isArray(data.data)) {
                    setCatalogBrands(data.data);
                }
            })
            .catch(() => {});

        const bizneEnabled = import.meta.env.VITE_ENABLE_BIZNE_SHOPS !== 'false';
        const shopsP = bizneEnabled
            ? fetch('/api/bizne-shops?all=1')
                  .then(async (res) => {
                      const data = await res.json().catch(() => ({}));
                      if (!cancelled && res.ok && data?.success && Array.isArray(data.data?.shops)) {
                          setCatalogShops(data.data.shops);
                      } else if (!cancelled) {
                          setCatalogShops([]);
                      }
                  })
                  .catch(() => {
                      if (!cancelled) setCatalogShops([]);
                  })
            : Promise.resolve();

        Promise.all([brandsP, shopsP]).finally(() => {
            if (!cancelled) setCatalogLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const inputClass = variant === 'dark' ? inputClassDark : inputClassLight;
    const detailsShell =
        variant === 'dark'
            ? 'group border border-white/10 rounded-xl bg-gray-900/40 backdrop-blur-sm open:bg-gray-900/55 open:shadow-lg open:shadow-black/20'
            : 'group border border-gray-200 rounded-xl bg-gray-50/80 open:bg-white open:shadow-sm';
    const summaryClass =
        variant === 'dark'
            ? 'cursor-pointer list-none flex flex-wrap items-center gap-2 px-4 py-3 text-sm font-medium text-gray-200 [&::-webkit-details-marker]:hidden'
            : 'cursor-pointer list-none flex flex-wrap items-center gap-2 px-4 py-3 text-sm font-medium text-gray-800 [&::-webkit-details-marker]:hidden';
    const innerBorder = variant === 'dark' ? 'border-t border-white/10' : 'border-t border-gray-100';
    const helpText = variant === 'dark' ? 'text-xs text-gray-400 pt-3 leading-relaxed' : 'text-xs text-gray-500 pt-3 leading-relaxed';
    const codeBg = variant === 'dark' ? 'text-indigo-200 bg-white/10 px-1 rounded' : 'text-gray-700 bg-gray-100 px-1 rounded';
    const labelClass = variant === 'dark' ? 'block text-xs font-medium text-gray-400' : 'block text-xs font-medium text-gray-600';
    const linkClass =
        variant === 'dark'
            ? 'text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline'
            : 'text-purple-600 hover:text-purple-800 underline-offset-2 hover:underline';
    const loadingText = variant === 'dark' ? 'text-xs text-gray-500' : 'text-xs text-gray-400';
    const gpsOk = variant === 'dark' ? 'text-xs text-emerald-400' : 'text-xs text-green-600';
    const gpsWarn = variant === 'dark' ? 'text-xs text-amber-400' : 'text-xs text-amber-600';

    const brandSelectValue = catalogBrands.some((b) => b._id === value.brandId) ? value.brandId : '';
    const shopOptions = catalogShops
        .map((s) => {
            const sid = s.id || s._id || '';
            const coords = getBizneShopCoordinates(s);
            return sid ? { sid, label: s.storeName || sid, hasGps: Boolean(coords) } : null;
        })
        .filter(Boolean) as { sid: string; label: string; hasGps: boolean }[];
    const shopSelectValue = shopOptions.some((o) => o.sid === value.shopId) ? value.shopId : '';
    const handleShopSelect = (shopId: string) => {
        onChange({ shopId });
        const selected = catalogShops.find((s) => (s.id || s._id || '') === shopId);
        if (selected) {
            onShopSelect?.(selected, getBizneShopCoordinates(selected));
        }
    };

    return (
        <details className={detailsShell}>
            <summary className={summaryClass}>
                <span className="flex items-center gap-2 min-w-0">
                    <Tag className={`w-4 h-4 shrink-0 ${variant === 'dark' ? 'text-violet-400' : 'text-purple-600'}`} aria-hidden />
                    Atribución e integración
                    <span className={`text-xs font-normal ${variant === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        (opcional)
                    </span>
                </span>
                <span
                    className={`text-xs font-normal w-full sm:w-auto sm:ml-0 ${variant === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}
                >
                    GTM, UTMs, ids de marca/tienda/producto
                </span>
            </summary>
            <div className={`px-4 pb-4 pt-0 space-y-4 ${innerBorder}`}>
                <p className={helpText}>
                    Todo es opcional. Se guardan en la promoción y encajan con los mismos nombres que el endpoint{' '}
                    <code className={codeBg}>/api/discount-qr/create</code> (
                    <code className={codeBg}>brandId</code>, <code className={codeBg}>shopId</code>, …). Puedes elegir
                    ids del catálogo de{' '}
                    <Link to="/brands" className={linkClass}>
                        Marcas y negocios
                    </Link>
                    .
                </p>
                {catalogLoading && <p className={loadingText}>Cargando marcas y tiendas del catálogo…</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label htmlFor={`${idPrefix}-brandId-pick`} className={labelClass}>
                            Marca registrada (mismo listado que en /brands)
                        </label>
                        <select
                            id={`${idPrefix}-brandId-pick`}
                            value={brandSelectValue}
                            onChange={(e) => onChange({ brandId: e.target.value })}
                            className={inputClass}
                            disabled={catalogLoading || catalogBrands.length === 0}
                        >
                            <option value="">
                                {catalogBrands.length === 0 && !catalogLoading
                                    ? 'No hay marcas en el catálogo'
                                    : '— Elegir marca (opcional) —'}
                            </option>
                            {catalogBrands.map((b) => (
                                <option key={b._id} value={b._id}>
                                    {b.companyName || b._id}
                                </option>
                            ))}
                        </select>
                        <label htmlFor={`${idPrefix}-brandId`} className={`${labelClass} mb-1 pt-1`}>
                            brandId (texto)
                        </label>
                        <input
                            id={`${idPrefix}-brandId`}
                            type="text"
                            value={value.brandId}
                            onChange={(e) => onChange({ brandId: e.target.value })}
                            className={inputClass}
                            placeholder="Id MongoDB de la marca o otro id manual"
                            autoComplete="off"
                        />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor={`${idPrefix}-shopId-pick`} className={labelClass}>
                            Tienda BizneAI (listado violeta en /brands)
                        </label>
                        <select
                            id={`${idPrefix}-shopId-pick`}
                            value={shopSelectValue}
                            onChange={(e) => handleShopSelect(e.target.value)}
                            className={inputClass}
                            disabled={shopOptions.length === 0}
                        >
                            <option value="">
                                {shopOptions.length === 0
                                    ? import.meta.env.VITE_ENABLE_BIZNE_SHOPS === 'false'
                                        ? 'Bizne desactivado (VITE_ENABLE_BIZNE_SHOPS=false)'
                                        : '— Sin tiendas Bizne o API no disponible —'
                                    : '— Elegir tienda Bizne (opcional) —'}
                            </option>
                            {shopOptions.map((o) => (
                                <option key={o.sid} value={o.sid}>
                                    {o.label}{o.hasGps ? ' (GPS)' : ''}
                                </option>
                            ))}
                        </select>
                        {shopSelectValue && (() => {
                            const selected = catalogShops.find((s) => (s.id || s._id || '') === shopSelectValue);
                            const coords = getBizneShopCoordinates(selected);
                            return coords ? (
                                <p className={gpsOk}>
                                    GPS detectado: {coords.latitude}, {coords.longitude}
                                </p>
                            ) : (
                                <p className={gpsWarn}>
                                    Esta tienda no trae GPS en el catálogo; puedes escribir latitud y longitud manualmente.
                                </p>
                            );
                        })()}
                        <label htmlFor={`${idPrefix}-shopId`} className={`${labelClass} mb-1 pt-1`}>
                            shopId (texto)
                        </label>
                        <input
                            id={`${idPrefix}-shopId`}
                            type="text"
                            value={value.shopId}
                            onChange={(e) => onChange({ shopId: e.target.value })}
                            className={inputClass}
                            placeholder="Id de tienda (Bizne u otro)"
                            autoComplete="off"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor={`${idPrefix}-externalProductId`} className={`${labelClass} mb-1`}>
                            Id producto (catálogo externo)
                        </label>
                        <input
                            id={`${idPrefix}-externalProductId`}
                            type="text"
                            value={value.externalProductId}
                            onChange={(e) => onChange({ externalProductId: e.target.value })}
                            className={inputClass}
                            placeholder="SKU / id en tu catálogo (se guarda como externalProductId)"
                            autoComplete="off"
                        />
                    </div>
                    <div>
                        <label htmlFor={`${idPrefix}-gtmTag`} className={`${labelClass} mb-1`}>
                            gtmTag
                        </label>
                        <input
                            id={`${idPrefix}-gtmTag`}
                            type="text"
                            value={value.gtmTag}
                            onChange={(e) => onChange({ gtmTag: e.target.value })}
                            className={inputClass}
                            placeholder="GTM-XXXX o etiqueta"
                            autoComplete="off"
                        />
                    </div>
                    <div>
                        <label htmlFor={`${idPrefix}-campaignId`} className={`${labelClass} mb-1`}>
                            campaignId
                        </label>
                        <input
                            id={`${idPrefix}-campaignId`}
                            type="text"
                            value={value.campaignId}
                            onChange={(e) => onChange({ campaignId: e.target.value })}
                            className={inputClass}
                            placeholder="Campaña"
                            autoComplete="off"
                        />
                    </div>
                    <div>
                        <label htmlFor={`${idPrefix}-source`} className={`${labelClass} mb-1`}>
                            source (UTM)
                        </label>
                        <input
                            id={`${idPrefix}-source`}
                            type="text"
                            value={value.source}
                            onChange={(e) => onChange({ source: e.target.value })}
                            className={inputClass}
                            placeholder="ej. instagram, google"
                            autoComplete="off"
                        />
                    </div>
                    <div>
                        <label htmlFor={`${idPrefix}-medium`} className={`${labelClass} mb-1`}>
                            medium (UTM)
                        </label>
                        <input
                            id={`${idPrefix}-medium`}
                            type="text"
                            value={value.medium}
                            onChange={(e) => onChange({ medium: e.target.value })}
                            className={inputClass}
                            placeholder="ej. cpc, social"
                            autoComplete="off"
                        />
                    </div>
                </div>
            </div>
        </details>
    );
}
