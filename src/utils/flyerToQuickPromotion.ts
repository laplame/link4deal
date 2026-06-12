type QuickOfferType = 'percentage' | 'bogo' | 'cashback_fixed' | 'cashback_percentage';

/** Datos del formulario de flyer (PromoFlyerStudio). */
export interface FlyerFormData {
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

export interface FlyerImageMeta {
    url: string;
    filename: string;
    mimeType: string;
}

export interface FlyerToPromotionInput {
    form: FlyerFormData;
    copy?: string;
    productImage?: File | null;
    flyerImage?: FlyerImageMeta | null;
}

export interface FlyerToPromotionResult {
    title: string;
    description: string;
    brand: string;
    originalPrice: number;
    currentPrice: number;
    currency: string;
    offerType: QuickOfferType;
    cashbackValue: number;
    imageFiles: File[];
}

function parseAmount(value: string): number {
    const n = Number(String(value).replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
}

function parseCashbackPercent(text: string): number {
    const m = String(text).match(/(\d+(?:\.\d+)?)\s*%/);
    if (!m) return 0;
    const n = Number(m[1]);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
}

function buildDescription(form: FlyerFormData, copy?: string): string {
    const parts: string[] = [];
    if (form.headline.trim()) parts.push(form.headline.trim());
    if (form.extraNotes.trim()) parts.push(form.extraNotes.trim());
    if (form.platform.trim()) parts.push(`Disponible en ${form.platform.trim()}.`);
    if (copy?.trim()) parts.push(copy.trim());
    if (parts.length === 0 && form.productName.trim()) {
        return `Promoción exclusiva: ${form.productName.trim()}.`;
    }
    return parts.join('\n\n');
}

function inferOfferType(
    form: FlyerFormData,
    originalPrice: number,
    currentPrice: number
): { offerType: QuickOfferType; cashbackValue: number } {
    const cashbackPct = parseCashbackPercent(form.cashbackText);
    if (cashbackPct > 0) {
        return { offerType: 'cashback_percentage', cashbackValue: cashbackPct };
    }
    if (originalPrice > 0 && currentPrice > 0 && currentPrice < originalPrice) {
        return { offerType: 'percentage', cashbackValue: 0 };
    }
    return { offerType: 'percentage', cashbackValue: 0 };
}

/** Convierte URL relativa del flyer en File para subir con la promoción. */
export async function flyerUrlToFile(meta: FlyerImageMeta): Promise<File | null> {
    const absolute =
        /^https?:\/\//i.test(meta.url)
            ? meta.url
            : `${typeof window !== 'undefined' ? window.location.origin : ''}${meta.url}`;
    try {
        const res = await fetch(absolute);
        if (!res.ok) return null;
        const blob = await res.blob();
        return new File([blob], meta.filename || 'flyer.png', {
            type: meta.mimeType || blob.type || 'image/png',
        });
    } catch {
        return null;
    }
}

/** Mapea datos del flyer al formulario de quick-promotion. */
export function mapFlyerToQuickPromotion(input: FlyerToPromotionInput): FlyerToPromotionResult {
    const { form, copy } = input;
    const originalPrice = parseAmount(form.originalPrice);
    const currentPrice = parseAmount(form.finalPrice);
    const currency = (form.currency || 'MXN').trim().toUpperCase().slice(0, 8) || 'MXN';
    const title =
        form.productName.trim() ||
        form.headline.trim() ||
        'Nueva promoción';
    const brand = form.platform.trim() || '';
    const { offerType, cashbackValue } = inferOfferType(form, originalPrice, currentPrice);

    const imageFiles: File[] = [];
    if (input.productImage) imageFiles.push(input.productImage);

    return {
        title,
        description: buildDescription(form, copy),
        brand,
        originalPrice,
        currentPrice,
        currency,
        offerType,
        cashbackValue,
        imageFiles,
    };
}

/** Añade el flyer generado y devuelve la lista final de imágenes (máx. 8). */
export async function collectFlyerPromotionImages(
    mapped: FlyerToPromotionResult,
    flyerImage?: FlyerImageMeta | null
): Promise<File[]> {
    const files = [...mapped.imageFiles];
    if (flyerImage?.url) {
        const flyerFile = await flyerUrlToFile(flyerImage);
        if (flyerFile) files.push(flyerFile);
    }
    return files.slice(0, 8);
}
