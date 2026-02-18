import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Upload, 
    DollarSign, 
    Calendar, 
    Tag, 
    MapPin,
    CheckCircle,
    X,
    Zap,
    Gift,
    Sparkles
} from 'lucide-react';

interface QuickPromotionData {
    title: string;
    description: string;
    brand: string;
    category: string;
    originalPrice: number;
    currentPrice: number;
    currency: string;
    storeCity: string;
    validUntil: string;
    images: File[];
}

const QUICK_TEMPLATES = [
    {
        name: 'Electrónica',
        data: {
            title: 'Oferta Especial de Electrónica',
            description: 'Promoción exclusiva con descuento especial. Productos de alta calidad garantizados.',
            brand: 'Marca Premium',
            category: 'electronics',
            originalPrice: 5000,
            currentPrice: 3999,
            currency: 'MXN',
            storeCity: 'Ciudad de México',
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
    },
    {
        name: 'Moda',
        data: {
            title: 'Nueva Colección de Moda',
            description: 'Descubre las últimas tendencias en moda. Estilos únicos y exclusivos.',
            brand: 'Fashion Brand',
            category: 'fashion',
            originalPrice: 1500,
            currentPrice: 999,
            currency: 'MXN',
            storeCity: 'Monterrey',
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
    },
    {
        name: 'Deportes',
        data: {
            title: 'Equipamiento Deportivo',
            description: 'Todo lo que necesitas para tu entrenamiento. Calidad profesional.',
            brand: 'Sport Pro',
            category: 'sports',
            originalPrice: 2500,
            currentPrice: 1999,
            currency: 'MXN',
            storeCity: 'Guadalajara',
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
    },
    {
        name: 'Belleza',
        data: {
            title: 'Productos de Belleza',
            description: 'Cuidado personal y cosméticos de las mejores marcas.',
            brand: 'Beauty Care',
            category: 'beauty',
            originalPrice: 800,
            currentPrice: 599,
            currency: 'MXN',
            storeCity: 'Puebla',
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
    }
];

const CATEGORIES = [
    { value: 'electronics', label: 'Electrónica' },
    { value: 'fashion', label: 'Moda' },
    { value: 'sports', label: 'Deportes' },
    { value: 'beauty', label: 'Belleza' },
    { value: 'home', label: 'Hogar' },
    { value: 'food', label: 'Comida' },
    { value: 'books', label: 'Libros' },
    { value: 'other', label: 'Otros' }
];

export default function QuickPromotionPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<QuickPromotionData>({
        title: '',
        description: '',
        brand: '',
        category: 'electronics',
        originalPrice: 0,
        currentPrice: 0,
        currency: 'MXN',
        storeCity: 'Ciudad de México',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        images: []
    });
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showReward, setShowReward] = useState(false);

    const loadTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
        setFormData({
            ...formData,
            ...template.data,
            images: []
        });
        setImagePreviews([]);
    };

    const handleInputChange = (field: keyof QuickPromotionData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files).slice(0, 5);
            const newFiles = [...formData.images, ...fileArray].slice(0, 5);
            
            setFormData(prev => ({
                ...prev,
                images: newFiles
            }));

            // Crear previews
            const newPreviews = fileArray.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews].slice(0, 5));
        }
    };

    const removeImage = (index: number) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        
        // Revocar URL
        URL.revokeObjectURL(imagePreviews[index]);
        
        setFormData(prev => ({ ...prev, images: newImages }));
        setImagePreviews(newPreviews);
    };

    const calculateDiscount = () => {
        if (formData.originalPrice > 0 && formData.currentPrice > 0) {
            return Math.round(((formData.originalPrice - formData.currentPrice) / formData.originalPrice) * 100);
        }
        return 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Solo el título es obligatorio (el API acepta el resto opcional)
        if (!formData.title.trim()) {
            setSubmitError('El título es requerido');
            return;
        }
        if (formData.originalPrice < 0 || formData.currentPrice < 0) {
            setSubmitError('Los precios no pueden ser negativos');
            return;
        }
        if (formData.currentPrice > formData.originalPrice && formData.originalPrice > 0) {
            setSubmitError('El precio con oferta no puede ser mayor al precio original');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const formDataToSend = new FormData();
            
            // Información básica
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description || 'Promoción especial');
            formDataToSend.append('productName', formData.title);
            formDataToSend.append('brand', formData.brand);
            formDataToSend.append('category', formData.category);
            
            // Precios
            formDataToSend.append('originalPrice', formData.originalPrice.toString());
            formDataToSend.append('currentPrice', formData.currentPrice.toString());
            formDataToSend.append('currency', formData.currency);
            formDataToSend.append('discountPercentage', calculateDiscount().toString());
            
            // Ubicación y fechas
            formDataToSend.append('storeCity', formData.storeCity);
            formDataToSend.append('storeState', formData.storeCity);
            formDataToSend.append('validFrom', new Date().toISOString().split('T')[0]);
            formDataToSend.append('validUntil', formData.validUntil);
            
            // Inventario por defecto
            formDataToSend.append('stock', '100');
            formDataToSend.append('totalQuantity', '100');
            
            // Imágenes
            formData.images.forEach((file) => {
                formDataToSend.append('images', file);
            });

            const response = await fetch('/api/promotions', {
                method: 'POST',
                body: formDataToSend
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSubmitSuccess(true);
                setShowReward(true);
                
                // Limpiar formulario después de 3 segundos
                setTimeout(() => {
                    setFormData({
                        title: '',
                        description: '',
                        brand: '',
                        category: 'electronics',
                        originalPrice: 0,
                        currentPrice: 0,
                        currency: 'MXN',
                        storeCity: 'Ciudad de México',
                        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        images: []
                    });
                    setImagePreviews([]);
                    setSubmitSuccess(false);
                }, 5000);
            } else {
                throw new Error(data.message || 'Error al crear la promoción');
            }
        } catch (error: any) {
            console.error('Error creando promoción:', error);
            setSubmitError(error.message || 'Error al crear la promoción. Por favor, intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link 
                                to="/" 
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Agregar Promoción Rápida</h1>
                                <p className="text-sm text-gray-600">Crea una promoción en minutos</p>
                            </div>
                        </div>
                        <Link
                            to="/create-promotion"
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                            Modo Avanzado →
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Templates Rápidos */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Plantillas Rápidas</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Selecciona una plantilla para pre-llenar el formulario</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {QUICK_TEMPLATES.map((template) => (
                            <button
                                key={template.name}
                                onClick={() => loadTemplate(template)}
                                className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-blue-100 transition-all text-sm font-medium text-gray-700"
                            >
                                {template.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mensaje de Recompensa */}
                {showReward && (
                    <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg animate-pulse">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                    <Gift className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <Zap className="w-6 h-6 text-yellow-600" />
                                    ¡Promoción Creada Exitosamente!
                                </h3>
                                <p className="text-lg text-gray-800 mb-2">
                                    Has ganado <span className="font-bold text-orange-600">50 Tokens Luxae</span> de premio
                                </p>
                                <p className="text-sm text-gray-600 mb-4">
                                    Valida tu KYC para recibir tus tokens. Los tokens se acreditarán automáticamente una vez completada la verificación.
                                </p>
                                <Link
                                    to="/kyc-form"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-yellow-600 transition-all shadow-md"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Validar KYC Ahora
                                </Link>
                            </div>
                            <button
                                onClick={() => setShowReward(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {/* Mensajes de Error */}
                    {submitError && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <div className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5">⚠️</div>
                            <div className="flex-1">
                                <p className="text-sm text-red-800">{submitError}</p>
                            </div>
                            <button
                                onClick={() => setSubmitError(null)}
                                className="text-red-600 hover:text-red-800"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Información Básica */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Título de la Promoción *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Ej: Oferta Especial de Electrónica"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Describe tu promoción..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Marca *
                                </label>
                                <input
                                    type="text"
                                    value={formData.brand}
                                    onChange={(e) => handleInputChange('brand', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Ej: Apple, Nike, Samsung"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Categoría *
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => handleInputChange('category', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Precios */}
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <DollarSign className="h-5 w-5 text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Precios</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Precio Original *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            value={formData.originalPrice || ''}
                                            onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Precio con Oferta *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            value={formData.currentPrice || ''}
                                            onChange={(e) => handleInputChange('currentPrice', parseFloat(e.target.value) || 0)}
                                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descuento
                                    </label>
                                    <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                                        <span className="text-2xl font-bold text-green-600">
                                            {calculateDiscount()}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ubicación y Fecha */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <MapPin className="h-4 w-4 inline mr-1" />
                                    Ciudad *
                                </label>
                                <input
                                    type="text"
                                    value={formData.storeCity}
                                    onChange={(e) => handleInputChange('storeCity', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Ciudad de México"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="h-4 w-4 inline mr-1" />
                                    Válido Hasta *
                                </label>
                                <input
                                    type="date"
                                    value={formData.validUntil}
                                    onChange={(e) => handleInputChange('validUntil', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        {/* Imágenes */}
                        <div className="border-t border-gray-200 pt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Upload className="h-4 w-4 inline mr-1" />
                                Imágenes * (mínimo 1, máximo 5)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label htmlFor="image-upload" className="cursor-pointer">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600">Haz clic para seleccionar imágenes</p>
                                    <p className="text-xs text-gray-500 mt-1">Máximo 5 imágenes</p>
                                </label>
                            </div>
                            
                            {imagePreviews.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Botones */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                            <Link
                                to="/promotions-marketplace"
                                className="text-gray-600 hover:text-gray-900 font-medium"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting || submitSuccess}
                                className={`px-8 py-3 rounded-lg font-medium transition-all ${
                                    isSubmitting || submitSuccess
                                        ? 'bg-green-500 text-white cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg'
                                }`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Creando...
                                    </span>
                                ) : submitSuccess ? (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        ¡Creada!
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Zap className="w-5 h-5" />
                                        Crear Promoción
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
