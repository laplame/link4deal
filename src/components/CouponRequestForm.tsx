import React, { useState } from 'react';
import { 
    MessageCircle, 
    User, 
    Phone, 
    QrCode, 
    Download, 
    CheckCircle, 
    Info,
    ShoppingCart
} from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CouponRequestFormProps {
    productId: string;
    productName: string;
    productPrice: number;
    productCurrency: string;
    productImage: string;
    onClose: () => void;
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
    onClose 
}) => {
    const [step, setStep] = useState<'form' | 'qr' | 'success'>('form');
    const [formData, setFormData] = useState<FormData>({
        name: '',
        whatsapp: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [couponCode, setCouponCode] = useState<string>('');
    const { addItem } = useCart();

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Simular proceso de generación de cupón
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generar código de cupón único
            const generatedCouponCode = `L4D-${productId}-${Date.now().toString(36).toUpperCase()}`;
            setCouponCode(generatedCouponCode);

            // Simular envío por WhatsApp
            const whatsappMessage = `¡Hola! Tu cupón de Link4Deal está listo:\n\n🎫 Código: ${generatedCouponCode}\n🏷️ Producto: ${productName}\n\nEscanea el QR para activarlo. ¡Gracias por elegirnos!`;
            
            // En una implementación real, esto se enviaría a través de la API de WhatsApp Business
            console.log('Mensaje de WhatsApp:', whatsappMessage);

            setStep('qr');
        } catch (error) {
            console.error('Error al procesar la solicitud:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWhatsAppRedirect = () => {
        const message = `¡Hola! Necesito ayuda con mi cupón de Link4Deal:\n\n🎫 Código: ${couponCode}\n🏷️ Producto: ${productName}`;
        const whatsappUrl = `https://wa.me/+1234567890?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const generateQRCode = () => {
        // En una implementación real, esto generaría un QR real
        // Por ahora, mostramos un placeholder
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
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        ¡Cupón Generado!
                    </h3>
                    
                    <p className="text-gray-600 mb-6">
                        Tu cupón ha sido creado exitosamente. Escanea el código QR o usa el código manual.
                    </p>

                    {/* QR Code */}
                    <div className="mb-6">
                        {generateQRCode()}
                    </div>

                    {/* Coupon Code */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-600 mb-2">Código del Cupón:</p>
                        <p className="text-lg font-mono font-bold text-blue-600">{couponCode}</p>
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
                            onClick={() => setStep('success')}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Descargar Cupón
                        </button>
                    </div>

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

    if (step === 'success') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        ¡Proceso Completado!
                    </h3>
                    
                    <p className="text-gray-600 mb-6">
                        Tu cupón ha sido enviado por WhatsApp y está listo para usar. 
                        ¡Gracias por elegir Link4Deal!
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                // Agregar el producto al carrito (necesitamos precio, currency e image)
                                // Por ahora usamos valores por defecto, en una implementación real
                                // estos vendrían del producto
                                addItem({ 
                                    id: productId, 
                                    name: productName, 
                                    price: productPrice, 
                                    currency: productCurrency,
                                    image: productImage
                                });
                                onClose();
                            }}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Agregar al Carrito con Cupón
                        </button>
                        
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                        >
                            Continuar Comprando
                        </button>
                    </div>
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                </form>
            </div>
        </div>
    );
};

export default CouponRequestForm;
