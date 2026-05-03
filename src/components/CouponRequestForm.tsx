import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    MessageCircle, 
    User, 
    Phone, 
    QrCode, 
    CheckCircle, 
    Info,
    Ticket,
    ExternalLink,
    Percent
} from 'lucide-react';
import QRCode from 'qrcode';
import { findNearestChainBranch, haversineDistanceMeters } from '../utils/geo';

interface CouponRequestFormProps {
    /** ID de la promoción (MongoDB _id). Se envía como promotionId al backend; debe ser el mismo en index y en promotion-details. */
    productId: string;
    productName: string;
    productPrice: number;
    productCurrency: string;
    productImage: string;
    /** Porcentaje de descuento 0-100. Se envía al backend para que el QR lleve el % en el string (mismo formato que app móvil). */
    discountPercentage?: number;
    onClose: () => void;
    autoGenerateOnOpen?: boolean;
    /** Si true, solo se emite el cupón si el usuario está dentro del radio GPS respecto al punto de la promoción */
    activateByGps?: boolean;
    gpsRadiusMeters?: number;
    promotionLat?: number;
    promotionLng?: number;
    /** Varias sucursales: válido si el usuario está dentro del radio de cualquiera que tenga coordenadas. */
    chainLocations?: Array<{
        branchName?: string;
        coordinates?: { latitude?: number; longitude?: number };
    }>;
    /** Opcionales: el backend los guarda en el payload del cupón sin validación estricta (atribución / GTM / UTM). */
    brandId?: string;
    shopId?: string;
    gtmTag?: string;
    campaignId?: string;
    source?: string;
    medium?: string;
    couponMetadata?: Record<string, string | number | boolean>;
}

interface FormData {
    name: string;
    whatsapp: string;
}

/** Token emitido por `/api/discount-qr/create` (incluye `.v1.` y prefijo `…-N` con el %). No aplica al QR local de respaldo (`.local.`). */
function isServerIssuerQrString(qr: string): boolean {
    return Boolean(qr && qr.includes('.v1.') && !qr.includes('.local.'));
}

const CouponRequestForm: React.FC<CouponRequestFormProps> = ({ 
    productId, 
    productName, 
    productPrice, 
    productCurrency, 
    productImage,
    discountPercentage: discountPercentageProp,
    onClose,
    autoGenerateOnOpen = false,
    activateByGps = false,
    gpsRadiusMeters = 500,
    promotionLat,
    promotionLng,
    chainLocations,
    brandId,
    shopId,
    gtmTag,
    campaignId,
    source: sourceProp,
    medium: mediumProp,
    couponMetadata
}) => {
    const [step, setStep] = useState<'form' | 'qr' | 'success'>('form');
    const [formData, setFormData] = useState<FormData>({
        name: '',
        whatsapp: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [couponCode, setCouponCode] = useState<string>('');
    const [qrValue, setQrValue] = useState<string>('');
    const [qrImageDataUrl, setQrImageDataUrl] = useState<string>('');
    const [qrWarning, setQrWarning] = useState<string | null>(null);
    const [countdownSeconds, setCountdownSeconds] = useState(120); // 2 minutos para que el cupón sea único/válido
    const [redirectToUrl, setRedirectToUrl] = useState<string | null>(null); // Si la promoción redirige a Amazon (no QR)
    const [gpsError, setGpsError] = useState<string | null>(null);
    /** Mismo valor que discountPercentage del cupón; respuesta issuer: luxaesRedeemed + prefijo -N en el QR. */
    const [luxaesRedeemed, setLuxaesRedeemed] = useState<number | null>(null);
    const [tokenPrefix, setTokenPrefix] = useState<string | null>(null);
    const autoRequestedRef = useRef(false);

    const discountPctFromProp = (): number => {
        const p = discountPercentageProp;
        if (typeof p === 'number' && p >= 0 && p <= 100) return Math.round(p);
        return 0;
    };

    const getOrCreateDeviceId = () => {
        const key = 'link4deal_device_id';
        const existing = localStorage.getItem(key);
        if (existing) return existing;
        const generated = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(key, generated);
        return generated;
    };

    const getAuthUserId = () => {
        try {
            const raw = localStorage.getItem('auth_user');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed?.id || parsed?._id || null;
        } catch {
            return null;
        }
    };

    const validateForm = () => {
        const newErrors: Partial<FormData> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }

        if (!formData.whatsapp.trim()) {
            newErrors.whatsapp = 'El WhatsApp es requerido';
        } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.whatsapp.replace(/\s/g, ''))) {
            newErrors.whatsapp = 'Formato de WhatsApp inválido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const verifyGpsForCoupon = (): Promise<boolean> => {
        if (!activateByGps) return Promise.resolve(true);

        const branchesWithCoords =
            Array.isArray(chainLocations) && chainLocations.length > 0
                ? chainLocations.filter((b) => {
                      const c = b?.coordinates;
                      if (!c) return false;
                      const lat =
                          typeof c.latitude === 'number' ? c.latitude : parseFloat(String(c.latitude).replace(',', '.'));
                      const lng =
                          typeof c.longitude === 'number' ? c.longitude : parseFloat(String(c.longitude).replace(',', '.'));
                      return Number.isFinite(lat) && Number.isFinite(lng);
                  })
                : [];

        const hasSinglePoint =
            promotionLat != null &&
            promotionLng != null &&
            !Number.isNaN(promotionLat) &&
            !Number.isNaN(promotionLng);

        if (branchesWithCoords.length === 0 && !hasSinglePoint) {
            setGpsError(
                'Esta promoción requiere ubicación, pero no hay coordenadas de tienda o sucursales configuradas. Contacta al soporte.'
            );
            return Promise.resolve(false);
        }
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setGpsError('Tu navegador no permite geolocalización.');
            return Promise.resolve(false);
        }
        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const uLat = pos.coords.latitude;
                    const uLng = pos.coords.longitude;

                    if (branchesWithCoords.length > 0) {
                        const nearest = findNearestChainBranch(uLat, uLng, branchesWithCoords);
                        if (!nearest) {
                            setGpsError('No hay sucursales con ubicación válida para esta promoción.');
                            resolve(false);
                            return;
                        }
                        if (nearest.distanceMeters <= gpsRadiusMeters) {
                            setGpsError(null);
                            resolve(true);
                            return;
                        }
                        const label =
                            nearest.branch.branchName || nearest.branch.city || 'la sucursal más cercana';
                        setGpsError(
                            `Debes estar dentro de ${gpsRadiusMeters} m de alguna sucursal participante (${label}: ~${Math.round(
                                nearest.distanceMeters
                            )} m).`
                        );
                        resolve(false);
                        return;
                    }

                    const d = haversineDistanceMeters(uLat, uLng, promotionLat!, promotionLng!);
                    if (d <= gpsRadiusMeters) {
                        setGpsError(null);
                        resolve(true);
                    } else {
                        setGpsError(
                            `Debes estar dentro de ${gpsRadiusMeters} m del punto de la oferta. Distancia aproximada: ${Math.round(d)} m.`
                        );
                        resolve(false);
                    }
                },
                () => {
                    setGpsError('Activa el permiso de ubicación para validar que estás en la zona de la promoción.');
                    resolve(false);
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );
        });
    };

    const issueCouponQr = async () => {
        setIsLoading(true);
        setQrWarning(null);
        setLuxaesRedeemed(null);
        setTokenPrefix(null);

        const pctFallback = discountPctFromProp();

        try {
            // Generar código de cupón único
            const generatedCouponCode = `L4D-${productId}-${Date.now().toString(36).toUpperCase()}`;
            setCouponCode(generatedCouponCode);
            const fallbackPrefixed =
                pctFallback > 0
                    ? `LINK4DEAL-DISCOUNT-${pctFallback}.local.${generatedCouponCode}`
                    : `LINK4DEAL-DISCOUNT.local.${generatedCouponCode}`;
            let nextQrValue = fallbackPrefixed;
            let resolvedPct = pctFallback;
            let resolvedPrefix: string | null = null;

            // Intentar generar token QR seguro desde backend (issuer)
            try {
                const optionalPayload: Record<string, string | number | Record<string, string | number | boolean>> = {};
                if (brandId?.trim()) optionalPayload.brandId = brandId.trim();
                if (shopId?.trim()) optionalPayload.shopId = shopId.trim();
                if (gtmTag?.trim()) optionalPayload.gtmTag = gtmTag.trim();
                if (campaignId?.trim()) optionalPayload.campaignId = campaignId.trim();
                if (sourceProp?.trim()) optionalPayload.source = sourceProp.trim();
                if (mediumProp?.trim()) optionalPayload.medium = mediumProp.trim();
                if (couponMetadata && typeof couponMetadata === 'object' && Object.keys(couponMetadata).length > 0) {
                    optionalPayload.metadata = { ...couponMetadata };
                }

                const response = await fetch('/api/discount-qr/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deviceId: getOrCreateDeviceId(),
                        influencerId: getAuthUserId() || 'guest',
                        promotionId: productId,
                        referralCode: generatedCouponCode,
                        discountPercentage: typeof discountPercentageProp === 'number' && discountPercentageProp >= 0 && discountPercentageProp <= 100 ? discountPercentageProp : 0,
                        walletAddress: 'not-provided',
                        ...optionalPayload
                    })
                });
                const data = await response.json();
                if (response.ok && data?.ok && data?.noQr && data?.redirectToUrl) {
                    setRedirectToUrl(data.redirectToUrl);
                    resolvedPct = pctFallback;
                    setLuxaesRedeemed(resolvedPct);
                    setStep('qr');
                    setIsLoading(false);
                    return;
                }
                if (response.ok && data?.ok && data?.qrValue) {
                    nextQrValue = data.qrValue;
                    resolvedPct =
                        typeof data.luxaesRedeemed === 'number' && Number.isFinite(data.luxaesRedeemed)
                            ? Math.min(100, Math.max(0, Math.round(data.luxaesRedeemed)))
                            : pctFallback;
                    resolvedPrefix = typeof data.prefix === 'string' && data.prefix ? data.prefix : null;
                    setLuxaesRedeemed(resolvedPct);
                    setTokenPrefix(resolvedPrefix);
                } else {
                    const detail = data?.message ? ` (${data.message})` : '';
                    setQrWarning(`No se pudo emitir QR seguro desde backend${detail}. Se mostró un QR local de respaldo.`);
                    resolvedPct = pctFallback;
                    resolvedPrefix = null;
                    setLuxaesRedeemed(resolvedPct);
                    setTokenPrefix(null);
                }
            } catch {
                setQrWarning('Error conectando con backend QR. Se mostró un QR local de respaldo.');
                resolvedPct = pctFallback;
                resolvedPrefix = null;
                setLuxaesRedeemed(resolvedPct);
                setTokenPrefix(null);
            }

            setRedirectToUrl(null);
            setQrValue(nextQrValue);
            const dataUrl = await QRCode.toDataURL(nextQrValue, {
                width: 480,
                margin: 1,
                errorCorrectionLevel: 'L'
            });
            setQrImageDataUrl(dataUrl);

            // Simular envío por WhatsApp
            const whatsappMessage = `¡Hola! Tu cupón de Link4Deal está listo:\n\n🎫 Código: ${generatedCouponCode}\n🏷️ Producto: ${productName}\n📉 Descuento: ${resolvedPct}%\n\nEscanea el QR para activarlo. ¡Gracias por elegirnos!`;
            
            // En una implementación real, esto se enviaría a través de la API de WhatsApp Business
            console.log('Mensaje de WhatsApp:', whatsappMessage);

            setStep('qr');
            setCountdownSeconds(120); // reiniciar contador de 2 min al generar cupón
        } catch (error) {
            console.error('Error al procesar la solicitud:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Contador de 2 minutos en pantalla de cupón generado
    useEffect(() => {
        if (step !== 'qr' || countdownSeconds <= 0) return;
        const t = setInterval(() => setCountdownSeconds((s) => s - 1), 1000);
        return () => clearInterval(t);
    }, [step, countdownSeconds]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGpsError(null);

        if (!validateForm()) {
            return;
        }

        const gpsOk = await verifyGpsForCoupon();
        if (!gpsOk) {
            return;
        }

        await issueCouponQr();
    };

    // Mismo flujo en index y en promotion-details: al montar o cambiar promoción, solicitar cupón (o redirección) con el mismo promotionId
    useEffect(() => {
        setRedirectToUrl(null);
        setGpsError(null);
        setLuxaesRedeemed(null);
        setTokenPrefix(null);
        autoRequestedRef.current = false;
    }, [productId]);

    useEffect(() => {
        if (!autoGenerateOnOpen || activateByGps || autoRequestedRef.current) return;
        autoRequestedRef.current = true;
        issueCouponQr();
    }, [autoGenerateOnOpen, activateByGps, productId]);

    const handleWhatsAppRedirect = () => {
        const pct = luxaesRedeemed ?? discountPctFromProp();
        const message = `¡Hola! Necesito ayuda con mi cupón de Link4Deal:\n\n🎫 Código: ${couponCode}\n🏷️ Producto: ${productName}\n📉 Descuento: ${pct}%`;
        const whatsappUrl = `https://wa.me/+1234567890?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const generateQRCode = () => {
        if (qrImageDataUrl) {
            return (
                <div className="flex w-full max-w-sm mx-auto items-center justify-center p-2 sm:p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <img
                        src={qrImageDataUrl}
                        alt="QR del cupón"
                        className="w-[min(18rem,85vw)] h-[min(18rem,85vw)] sm:w-80 sm:h-80 max-w-full object-contain"
                    />
                </div>
            );
        }
        return (
            <div className="w-[min(18rem,85vw)] h-[min(18rem,85vw)] sm:w-80 sm:h-80 max-w-full mx-auto bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                    <QrCode className="w-20 h-20 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">QR Code</p>
                    <p className="text-xs text-gray-400">Código: {couponCode}</p>
                </div>
            </div>
        );
    };

    if (step === 'qr') {
        const isRedirectMode = !!redirectToUrl;
        const isAmazonRedirect = isRedirectMode && /amzn\.to|amazon\./i.test(redirectToUrl || '');
        const redirectButtonLabel = isAmazonRedirect ? 'Comprar en Amazon' : 'Ir a comprar';
        const redirectTitle = isAmazonRedirect ? '¡Comprar en Amazon!' : '¡Ir a comprar!';
        const displayDiscountPct = luxaesRedeemed ?? discountPctFromProp();
        const serverIssuerQr = qrValue ? isServerIssuerQrString(qrValue) : false;
        const qrPrefixFirstSegment = qrValue ? qrValue.split('.')[0] : '';
        const isLocalFallbackQr = Boolean(qrValue && qrValue.includes('.local.'));
        const localQrShowsPctInPrefix =
            isLocalFallbackQr && /-\d+$/.test(qrPrefixFirstSegment);
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
                <div className="bg-white rounded-2xl max-w-md w-full max-h-[min(92vh,100dvh)] overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5 sm:py-5 text-center shadow-xl ring-1 ring-black/5 touch-pan-y">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                        {isRedirectMode ? redirectTitle : '¡Cupón Generado!'}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-3 leading-snug">
                        {isRedirectMode
                            ? 'Haz clic en el botón para ir a la página de compra.'
                            : 'Tu cupón ha sido creado exitosamente. Escanea el código QR o usa el código manual.'}
                    </p>

                    {isRedirectMode ? (
                        <div className="mb-4">
                            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border border-emerald-100 mb-3">
                                <Percent className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                <span>{displayDiscountPct}% de descuento</span>
                            </div>
                            <a
                                href={redirectToUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-lg transition-colors"
                            >
                                <ExternalLink className="w-5 h-5" />
                                {redirectButtonLabel}
                            </a>
                            <p className="text-xs text-gray-500 mt-3">Se abrirá en una nueva pestaña</p>
                        </div>
                    ) : (
                        <article className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 text-left shadow-sm">
                            <div className="p-3 border-b border-gray-200">
                                {productImage && (
                                    <img
                                        src={productImage}
                                        alt={productName}
                                        className="w-full h-28 object-cover rounded-xl mb-3"
                                    />
                                )}
                                <p className="text-xs text-gray-500 mb-1">Promoción</p>
                                <h4 className="text-base font-bold text-gray-900 leading-snug">{productName}</h4>
                                <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border border-emerald-100">
                                    <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden />
                                    <span>{displayDiscountPct}% de descuento</span>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-2 leading-snug">
                                    Luxae a redimir:{' '}
                                    <strong className="text-gray-800">{displayDiscountPct}</strong>
                                    {' — '}
                                    mismo valor que el <strong>{displayDiscountPct}%</strong>.
                                </p>
                            </div>

                            <div className="bg-white px-3 py-3 text-center border-b border-gray-200">
                                {generateQRCode()}
                                <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
                                    <span className="text-xs sm:text-sm font-medium">
                                        {countdownSeconds > 0
                                            ? `Válido por ${Math.floor(countdownSeconds / 60)}:${String(countdownSeconds % 60).padStart(2, '0')}`
                                            : 'Cupón expirado'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 border-b border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">Código del cupón</p>
                                <p className="text-base sm:text-lg font-mono font-bold text-blue-600 break-all">{couponCode}</p>

                                {serverIssuerQr && qrValue && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-[11px] text-gray-600 mb-1">
                                            Texto codificado en el QR
                                            <span className="text-gray-400 font-normal"> — el prefijo incluye el {displayDiscountPct}%</span>
                                        </p>
                                        <div className="max-h-24 sm:max-h-28 overflow-y-auto overscroll-y-contain rounded border border-gray-200 bg-white px-2 py-1.5">
                                            <p className="text-[10px] text-gray-700 break-all font-mono leading-relaxed">{qrValue}</p>
                                        </div>
                                        {qrPrefixFirstSegment && (
                                            <p className="text-[10px] text-gray-500 mt-1.5">
                                                Primer segmento:{' '}
                                                <span className="font-mono text-gray-700">{qrPrefixFirstSegment}</span>
                                                {' '}(sufijo <span className="font-mono">-{displayDiscountPct}</span> = {displayDiscountPct}% de descuento).
                                            </p>
                                        )}
                                        {tokenPrefix && (
                                            <p className="text-[10px] text-gray-500 mt-1.5">
                                                Prefijo firmado:{' '}
                                                <span className="font-mono text-gray-700 break-all">{tokenPrefix}</span>
                                            </p>
                                        )}
                                    </div>
                                )}

                                {qrValue && !serverIssuerQr && (
                                    <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2 mt-3 leading-snug">
                                        <strong>QR de respaldo</strong> (sin firma del servidor).
                                        {localQrShowsPctInPrefix ? (
                                            <>
                                                {' '}
                                                El prefijo incluye <strong>-{displayDiscountPct}</strong> (= {displayDiscountPct}%) solo como referencia; para
                                                canjear usa el <strong>código alfanumérico</strong> o genera otro QR con conexión.
                                            </>
                                        ) : (
                                            <>
                                                {' '}
                                                El descuento vigente es el <strong>{displayDiscountPct}%</strong> indicado arriba; usa ese valor o el código
                                                alfanumérico.
                                            </>
                                        )}
                                    </p>
                                )}
                            </div>

                            <div className="p-3 border-b border-gray-200">
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">Smart contract</p>
                                <p className="text-[11px] font-mono text-slate-600 break-all mb-3">
                                    {qrValue ? `0x${Array.from(qrValue.slice(0, 20)).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('').padEnd(40, '0').slice(0, 42)}` : '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1'}
                                </p>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800">Solana</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-sky-100 text-sky-800">XRP</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-700">Ethereum</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800">Avalanche</span>
                                </div>
                                <Link
                                    to={`/promocion/${productId}/smart-contract`}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Ver smart contract
                                </Link>
                            </div>

                            <div className="bg-white p-3 text-center">
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={handleWhatsAppRedirect}
                                        className="w-full bg-green-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle className="w-4 h-4 shrink-0" />
                                        Contactar por WhatsApp
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Ticket className="w-4 h-4 shrink-0" />
                                        Redimir cupón
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-gray-600">
                                    Envíame este cupón a mi app
                                </p>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors pb-[max(0.25rem,env(safe-area-inset-bottom))]"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </article>
                    )}
                    {qrWarning && !isRedirectMode && (
                        <p className="text-[11px] text-amber-600 mb-3">{qrWarning}</p>
                    )}

                    {isRedirectMode && (
                        <button
                        type="button"
                        onClick={onClose}
                        className="mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors pb-[max(0.25rem,env(safe-area-inset-bottom))]"
                        >
                            Cerrar
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[min(92vh,100dvh)] overflow-y-auto overscroll-y-contain shadow-xl ring-1 ring-black/5 touch-pan-y">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">
                            Solicitar Cupón
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                    <p className="text-gray-600 mt-2">
                        Completa el formulario para recibir tu cupón por WhatsApp
                    </p>
                </div>

                {/* Form / Auto-generate */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {autoGenerateOnOpen ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <QrCode className="w-8 h-8 text-blue-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Generando tu cupón...</h4>
                            <p className="text-sm text-gray-600 mb-4">
                                Estamos preparando el QR para esta promoción.
                            </p>
                            {isLoading && (
                                <div className="inline-flex items-center gap-2 text-blue-600 text-sm">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    Procesando...
                                </div>
                            )}
                        </div>
                    ) : (
                    <>
                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre Completo *
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Tu nombre completo"
                            />
                        </div>
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                        )}
                    </div>

                    {/* WhatsApp Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de WhatsApp *
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="tel"
                                value={formData.whatsapp}
                                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors.whatsapp ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="+34 600 000 000"
                            />
                        </div>
                        {errors.whatsapp && (
                            <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>
                        )}
                    </div>

                    {activateByGps && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                            <p className="font-medium mb-1">Ubicación requerida</p>
                            <p>
                                Al continuar, el navegador pedirá tu ubicación. Debes estar dentro de{' '}
                                <strong>{gpsRadiusMeters} m</strong>{' '}
                                {Array.isArray(chainLocations) &&
                                chainLocations.some(
                                    (b) =>
                                        b?.coordinates &&
                                        Number.isFinite(Number(b.coordinates.latitude)) &&
                                        Number.isFinite(Number(b.coordinates.longitude))
                                )
                                    ? 'de alguna sucursal participante'
                                    : 'del punto de la oferta'}{' '}
                                para obtener el cupón.
                            </p>
                        </div>
                    )}

                    {gpsError && (
                        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">{gpsError}</p>
                    )}

                    {/* Info Text */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Info className="w-3 h-3 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-800 font-medium mb-1">
                                    Información Importante
                                </p>
                                <p className="text-sm text-blue-700">
                                    Algunos de nuestros socios pueden solicitar identificación para hacer efectivos los descuentos. 
                                    Esto es para garantizar la seguridad y autenticidad de las promociones.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Procesando...
                            </>
                        ) : (
                            <>
                                <MessageCircle className="w-5 h-5" />
                                Solicitar Cupón por WhatsApp
                            </>
                        )}
                    </button>

                    {/* Terms */}
                    <p className="text-xs text-gray-500 text-center">
                        Al continuar, aceptas nuestros{' '}
                        <a href="/terms" className="text-blue-600 hover:underline">
                            Términos y Condiciones
                        </a>{' '}
                        y{' '}
                        <a href="/privacy" className="text-blue-600 hover:underline">
                            Política de Privacidad
                        </a>
                    </p>
                    </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default CouponRequestForm;
