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
    ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';

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
}

interface FormData {
    name: string;
    whatsapp: string;
}

const CouponRequestForm: React.FC<CouponRequestFormProps> = ({ 
    productId, 
    productName, 
    productPrice, 
    productCurrency, 
    productImage,
    discountPercentage: discountPercentageProp,
    onClose,
    autoGenerateOnOpen = false
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
    const autoRequestedRef = useRef(false);

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

    const issueCouponQr = async () => {
        setIsLoading(true);
        setQrWarning(null);

        try {
            // Generar código de cupón único
            const generatedCouponCode = `L4D-${productId}-${Date.now().toString(36).toUpperCase()}`;
            setCouponCode(generatedCouponCode);
            const fallbackPrefixed = `LINK4DEAL-DISCOUNT.local.${generatedCouponCode}`;
            let nextQrValue = fallbackPrefixed;

            // Intentar generar token QR seguro desde backend (issuer)
            try {
                const response = await fetch('/api/discount-qr/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deviceId: getOrCreateDeviceId(),
                        influencerId: getAuthUserId() || 'guest',
                        promotionId: productId,
                        referralCode: generatedCouponCode,
                        discountPercentage: typeof discountPercentageProp === 'number' && discountPercentageProp >= 0 && discountPercentageProp <= 100 ? discountPercentageProp : 0,
                        walletAddress: 'not-provided'
                    })
                });
                const data = await response.json();
                if (response.ok && data?.ok && data?.noQr && data?.redirectToUrl) {
                    setRedirectToUrl(data.redirectToUrl);
                    setStep('qr');
                    setIsLoading(false);
                    return;
                }
                if (response.ok && data?.ok && data?.qrValue) {
                    nextQrValue = data.qrValue;
                } else {
                    const detail = data?.message ? ` (${data.message})` : '';
                    setQrWarning(`No se pudo emitir QR seguro desde backend${detail}. Se mostró un QR local de respaldo.`);
                }
            } catch {
                setQrWarning('Error conectando con backend QR. Se mostró un QR local de respaldo.');
            }

            setRedirectToUrl(null);
            setQrValue(nextQrValue);
            const dataUrl = await QRCode.toDataURL(nextQrValue, {
                width: 320,
                margin: 1,
                errorCorrectionLevel: 'L'
            });
            setQrImageDataUrl(dataUrl);

            // Simular envío por WhatsApp
            const whatsappMessage = `¡Hola! Tu cupón de Link4Deal está listo:\n\n🎫 Código: ${generatedCouponCode}\n🏷️ Producto: ${productName}\n\nEscanea el QR para activarlo. ¡Gracias por elegirnos!`;
            
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
        
        if (!validateForm()) {
            return;
        }

        await issueCouponQr();
    };

    // Mismo flujo en index y en promotion-details: al montar o cambiar promoción, solicitar cupón (o redirección) con el mismo promotionId
    useEffect(() => {
        setRedirectToUrl(null);
        autoRequestedRef.current = false;
    }, [productId]);

    useEffect(() => {
        if (!autoGenerateOnOpen || autoRequestedRef.current) return;
        autoRequestedRef.current = true;
        issueCouponQr();
    }, [autoGenerateOnOpen, productId]);

    const handleWhatsAppRedirect = () => {
        const message = `¡Hola! Necesito ayuda con mi cupón de Link4Deal:\n\n🎫 Código: ${couponCode}\n🏷️ Producto: ${productName}`;
        const whatsappUrl = `https://wa.me/+1234567890?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const generateQRCode = () => {
        if (qrImageDataUrl) {
            return (
                <div className="inline-flex items-center justify-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <img src={qrImageDataUrl} alt="QR del cupón" className="w-48 h-48" />
                </div>
            );
        }
        return (
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
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
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        {isRedirectMode ? redirectTitle : '¡Cupón Generado!'}
                    </h3>
                    
                    <p className="text-gray-600 mb-6">
                        {isRedirectMode
                            ? 'Haz clic en el botón para ir a la página de compra.'
                            : 'Tu cupón ha sido creado exitosamente. Escanea el código QR o usa el código manual.'}
                    </p>

                    {isRedirectMode ? (
                        <div className="mb-6">
                            <a
                                href={redirectToUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-lg transition-colors"
                            >
                                <ExternalLink className="w-5 h-5" />
                                {redirectButtonLabel}
                            </a>
                            <p className="text-xs text-gray-500 mt-3">Se abrirá en una nueva pestaña</p>
                        </div>
                    ) : (
                        <div className="mb-6">
                            {generateQRCode()}
                        </div>
                    )}
                    {qrWarning && !isRedirectMode && (
                        <p className="text-xs text-amber-600 mb-4">{qrWarning}</p>
                    )}

                    {!isRedirectMode && (
                        <>
                            {/* Contador 2 minutos */}
                            <div className="mb-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                                <span className="text-sm font-medium">
                                    {countdownSeconds > 0
                                        ? `Válido por ${Math.floor(countdownSeconds / 60)}:${String(countdownSeconds % 60).padStart(2, '0')}`
                                        : 'Cupón expirado'}
                                </span>
                            </div>

                            {/* Coupon Code */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-600 mb-2">Código del Cupón:</p>
                                <p className="text-lg font-mono font-bold text-blue-600">{couponCode}</p>
                                {qrValue && (
                                    <p className="text-[11px] text-gray-400 mt-2 break-all">
                                        Token QR: {qrValue}
                                    </p>
                                )}
                            </div>

                            {/* Smart contract mockup */}
                            <div className="bg-slate-100 rounded-lg p-4 mb-6 border border-slate-200">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Smart contract</p>
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

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleWhatsAppRedirect}
                                    className="w-full bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    Contactar por WhatsApp
                                </button>
                                
                                <button
                                    onClick={onClose}
                                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Ticket className="w-5 h-5" />
                                    Redimir cupón
                                </button>
                            </div>
                            <p className="mt-3 text-sm text-gray-600">
                                Envíame este cupón a mi app
                            </p>
                        </>
                    )}

                    <button
                        onClick={onClose}
                        className="mt-4 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
