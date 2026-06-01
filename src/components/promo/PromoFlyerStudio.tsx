import React, { useMemo, useRef, useState } from 'react';
import {
    Upload,
    Sparkles,
    Image as ImageIcon,
    Download,
    Copy,
    Check,
    X,
    Wand2,
    AlertTriangle,
} from 'lucide-react';

interface FlyerForm {
    productName: string;
    originalPrice: string;
    finalPrice: string;
    currency: string;
    discountPercentage: string;
    cashbackText: string;
    platform: string;
    headline: string;
    extraNotes: string;
}

interface FlyerImage {
    url: string;
    filename: string;
    mimeType: string;
    width: number;
    height: number;
}

interface FlyerResult {
    success: boolean;
    generated: boolean;
    image?: FlyerImage;
    copy?: string;
    prompt?: string;
    promptForClient?: string;
    model?: string;
    message?: string;
}

const emptyForm = (): FlyerForm => ({
    productName: '',
    originalPrice: '',
    finalPrice: '',
    currency: 'MXN',
    discountPercentage: '',
    cashbackText: '5% en tokens',
    platform: 'DameCodigo + Link4Deal',
    headline: '',
    extraNotes: '',
});

function toNumber(v: string): number {
    const n = Number(String(v).replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
}

/** Resuelve la URL absoluta del flyer servido por el backend. */
function resolveAssetUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    if (typeof window !== 'undefined' && window.location) {
        return `${window.location.origin}${url}`;
    }
    return url;
}

export default function PromoFlyerStudio() {
    const [form, setForm] = useState<FlyerForm>(() => emptyForm());
    const [productImage, setProductImage] = useState<File | null>(null);
    const [productPreview, setProductPreview] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<FlyerResult | null>(null);
    const [copied, setCopied] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const autoDiscount = useMemo(() => {
        const o = toNumber(form.originalPrice);
        const f = toNumber(form.finalPrice);
        if (o > 0 && f > 0 && f < o) return Math.round(((o - f) / o) * 100);
        return 0;
    }, [form.originalPrice, form.finalPrice]);

    const update = (field: keyof FlyerForm, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const onPickImage = (file: File | null) => {
        if (productPreview) URL.revokeObjectURL(productPreview);
        if (!file) {
            setProductImage(null);
            setProductPreview(null);
            return;
        }
        setProductImage(file);
        setProductPreview(URL.createObjectURL(file));
    };

    const handleGenerate = async () => {
        setError(null);
        if (!form.productName.trim()) {
            setError('Escribe al menos el nombre del producto.');
            return;
        }
        setIsGenerating(true);
        setResult(null);
        try {
            const fd = new FormData();
            fd.append('productName', form.productName.trim());
            fd.append('originalPrice', form.originalPrice);
            fd.append('finalPrice', form.finalPrice);
            fd.append('currency', form.currency);
            fd.append(
                'discountPercentage',
                form.discountPercentage || (autoDiscount ? String(autoDiscount) : ''),
            );
            fd.append('cashbackText', form.cashbackText);
            fd.append('platform', form.platform);
            fd.append('headline', form.headline);
            fd.append('extraNotes', form.extraNotes);
            if (productImage) fd.append('image', productImage);

            const res = await fetch('/api/promo-flyers/generate', { method: 'POST', body: fd });
            const json = (await res.json().catch(() => ({}))) as FlyerResult;
            if (!res.ok || json.success === false) {
                throw new Error(json.message || `Error ${res.status}`);
            }
            setResult(json);
            if (!json.generated && json.message) setError(json.message);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo generar el flyer.');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            /* ignore */
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulario */}
            <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 shadow-lg shadow-black/20">
                <div className="flex items-center gap-2 mb-1">
                    <Wand2 className="h-5 w-5 text-fuchsia-400 shrink-0" />
                    <h2 className="text-lg font-semibold text-white">Flyer con IA (Nano Banana)</h2>
                </div>
                <p className="text-sm text-gray-400 mb-5">
                    Sube el producto y completa los datos. Generamos un cartel vertical 9:16, ideal como{' '}
                    <strong>fondo de un video móvil</strong> (reel / TikTok / story).
                </p>

                {/* Imagen del producto */}
                <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Foto del producto (opcional)</label>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="flyer-product-image"
                        onChange={(e) => onPickImage(e.target.files?.[0] || null)}
                    />
                    {productPreview ? (
                        <div className="relative inline-block">
                            <img
                                src={productPreview}
                                alt="Producto"
                                className="h-40 rounded-xl border border-white/10 object-contain bg-black/30"
                            />
                            <button
                                type="button"
                                onClick={() => onPickImage(null)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                aria-label="Quitar imagen"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <label
                            htmlFor="flyer-product-image"
                            className="flex flex-col items-center justify-center border-2 border-dashed border-fuchsia-500/35 rounded-xl p-6 text-center hover:border-fuchsia-400/60 transition-colors bg-fuchsia-950/20 cursor-pointer"
                        >
                            <Upload className="h-10 w-10 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-400">Sube la foto del producto</p>
                        </label>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del producto *</label>
                        <input
                            type="text"
                            value={form.productName}
                            onChange={(e) => update('productName', e.target.value)}
                            placeholder="Echo Dot 5ta Generación"
                            className="w-full px-3 py-2 rounded-lg bg-gray-950/60 border border-white/10 text-gray-100 placeholder-gray-500 focus:border-fuchsia-400/60 focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Precio original</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={form.originalPrice}
                                onChange={(e) => update('originalPrice', e.target.value)}
                                placeholder="1299"
                                className="w-full px-3 py-2 rounded-lg bg-gray-950/60 border border-white/10 text-gray-100 placeholder-gray-500 focus:border-fuchsia-400/60 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Precio final</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={form.finalPrice}
                                onChange={(e) => update('finalPrice', e.target.value)}
                                placeholder="699"
                                className="w-full px-3 py-2 rounded-lg bg-gray-950/60 border border-white/10 text-gray-100 placeholder-gray-500 focus:border-fuchsia-400/60 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Moneda</label>
                            <input
                                type="text"
                                value={form.currency}
                                onChange={(e) => update('currency', e.target.value.toUpperCase())}
                                placeholder="MXN"
                                className="w-full px-3 py-2 rounded-lg bg-gray-950/60 border border-white/10 text-gray-100 placeholder-gray-500 focus:border-fuchsia-400/60 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Descuento %{autoDiscount ? ` (auto: ${autoDiscount}%)` : ''}
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={form.discountPercentage}
                                onChange={(e) => update('discountPercentage', e.target.value)}
                                placeholder={autoDiscount ? String(autoDiscount) : '46'}
                                className="w-full px-3 py-2 rounded-lg bg-gray-950/60 border border-white/10 text-gray-100 placeholder-gray-500 focus:border-fuchsia-400/60 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Cashback en tokens</label>
                            <input
                                type="text"
                                value={form.cashbackText}
                                onChange={(e) => update('cashbackText', e.target.value)}
                                placeholder="5% en tokens"
                                className="w-full px-3 py-2 rounded-lg bg-gray-950/60 border border-white/10 text-gray-100 placeholder-gray-500 focus:border-fuchsia-400/60 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Plataforma</label>
                            <input
                                type="text"
                                value={form.platform}
                                onChange={(e) => update('platform', e.target.value)}
                                placeholder="DameCodigo + Amazon"
                                className="w-full px-3 py-2 rounded-lg bg-gray-950/60 border border-white/10 text-gray-100 placeholder-gray-500 focus:border-fuchsia-400/60 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Titular (opcional)</label>
                            <input
                                type="text"
                                value={form.headline}
                                onChange={(e) => update('headline', e.target.value)}
                                placeholder="Paga Menos. Gana Más."
                                className="w-full px-3 py-2 rounded-lg bg-gray-950/60 border border-white/10 text-gray-100 placeholder-gray-500 focus:border-fuchsia-400/60 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Notas extra (opcional)</label>
                        <textarea
                            value={form.extraNotes}
                            onChange={(e) => update('extraNotes', e.target.value)}
                            rows={2}
                            placeholder="Detalles del beneficio, colores de marca, urgencia, etc."
                            className="w-full px-3 py-2 rounded-lg bg-gray-950/60 border border-white/10 text-gray-100 placeholder-gray-500 focus:border-fuchsia-400/60 focus:outline-none resize-none"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mt-4 bg-amber-950/40 border border-amber-500/35 rounded-xl p-3 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-100 flex-1">{error}</p>
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`mt-5 w-full px-6 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 ${
                        isGenerating
                            ? 'bg-fuchsia-700/60 text-white cursor-not-allowed'
                            : 'bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white hover:from-fuchsia-500 hover:to-purple-600 shadow-fuchsia-900/30'
                    }`}
                >
                    {isGenerating ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            Generando flyer...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            Generar flyer
                        </>
                    )}
                </button>
            </div>

            {/* Resultado */}
            <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 shadow-lg shadow-black/20">
                <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="h-5 w-5 text-violet-300 shrink-0" />
                    <h2 className="text-lg font-semibold text-white">Resultado (9:16)</h2>
                </div>

                {!result && !isGenerating && (
                    <div className="flex flex-col items-center justify-center text-center border border-dashed border-white/10 rounded-xl py-16 text-gray-500">
                        <ImageIcon className="h-12 w-12 mb-3 opacity-40" />
                        <p className="text-sm">El flyer aparecerá aquí.</p>
                    </div>
                )}

                {isGenerating && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fuchsia-400 mb-3" />
                        <p className="text-sm">Creando tu cartel con Nano Banana…</p>
                    </div>
                )}

                {result?.image?.url && (
                    <div className="space-y-4">
                        <div className="mx-auto max-w-[280px] rounded-xl overflow-hidden border border-white/10 bg-black/40">
                            <img
                                src={resolveAssetUrl(result.image.url)}
                                alt="Flyer generado"
                                className="w-full aspect-[9/16] object-cover"
                            />
                        </div>
                        <a
                            href={resolveAssetUrl(result.image.url)}
                            download={result.image.filename}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Descargar flyer
                        </a>
                    </div>
                )}

                {result && !result.image && (
                    <div className="rounded-xl border border-white/10 bg-gray-950/50 p-4 text-sm text-gray-300">
                        <p className="mb-2 text-amber-200">
                            No se generó la imagen en el servidor. Puedes copiar el prompt y generarla manualmente:
                        </p>
                        <pre className="whitespace-pre-wrap text-xs text-gray-400 max-h-48 overflow-auto">
                            {result.promptForClient || result.prompt}
                        </pre>
                    </div>
                )}

                {result?.copy && (
                    <div className="mt-5">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-200">Texto del anuncio</h3>
                            <button
                                type="button"
                                onClick={() => copyText(result.copy as string)}
                                className="inline-flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-200"
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copiado' : 'Copiar'}
                            </button>
                        </div>
                        <pre className="whitespace-pre-wrap text-xs text-gray-300 bg-gray-950/50 border border-white/10 rounded-xl p-3 max-h-64 overflow-auto">
                            {result.copy}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
