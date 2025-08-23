import React, { useState } from 'react';
import { User, Building2, Wallet, Shield, CheckCircle, AlertCircle, Upload, Eye, EyeOff } from 'lucide-react';

export interface KYCData {
    // Información básica
    entityType: 'individual' | 'business';
    firstName: string;
    lastName?: string;
    businessName?: string;
    taxId: string;
    email: string;
    phone: string;
    
    // Dirección
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    
    // Wallet
    walletAddress: string;
    walletNetwork: string;
    
    // Documentos
    idDocument?: File;
    businessLicense?: File;
    taxCertificate?: File;
    
    // Verificación
    isVerified: boolean;
    verificationStatus: 'pending' | 'approved' | 'rejected';
    verificationNotes?: string;
}

interface KYCFormProps {
    userType: 'user' | 'influencer' | 'brand' | 'agency';
    onSubmit: (kycData: KYCData) => void;
    onCancel: () => void;
    initialData?: Partial<KYCData>;
}

const KYCForm: React.FC<KYCFormProps> = ({
    userType,
    onSubmit,
    onCancel,
    initialData
}) => {
    const [step, setStep] = useState(1);
    const [entityType, setEntityType] = useState<'individual' | 'business'>(initialData?.entityType || 'individual');
    const [formData, setFormData] = useState<Partial<KYCData>>(initialData || {});
    const [errors, setErrors] = useState<Partial<KYCData>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showWallet, setShowWallet] = useState(false);

    const userTypeLabels = {
        user: 'Usuario',
        influencer: 'Influencer',
        brand: 'Marca',
        agency: 'Agencia'
    };

    const validateStep = (currentStep: number): boolean => {
        const newErrors: Partial<KYCData> = {};

        if (currentStep === 1) {
            if (!formData.entityType) newErrors.entityType = 'Selecciona el tipo de entidad';
            if (!formData.firstName?.trim()) newErrors.firstName = 'El nombre es requerido';
            if (entityType === 'business' && !formData.businessName?.trim()) {
                newErrors.businessName = 'El nombre de la empresa es requerido';
            }
            if (!formData.taxId?.trim()) newErrors.taxId = 'El RFC/CURP es requerido';
            if (!formData.email?.trim()) newErrors.email = 'El email es requerido';
            if (!formData.phone?.trim()) newErrors.phone = 'El teléfono es requerido';
        }

        if (currentStep === 2) {
            if (!formData.address?.trim()) newErrors.address = 'La dirección es requerida';
            if (!formData.city?.trim()) newErrors.city = 'La ciudad es requerida';
            if (!formData.state?.trim()) newErrors.state = 'El estado es requerido';
            if (!formData.country?.trim()) newErrors.country = 'El país es requerido';
            if (!formData.postalCode?.trim()) newErrors.postalCode = 'El código postal es requerido';
        }

        if (currentStep === 3) {
            if (!formData.walletAddress?.trim()) newErrors.walletAddress = 'La dirección de wallet es requerida';
            if (!formData.walletNetwork?.trim()) newErrors.walletNetwork = 'La red de wallet es requerida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        }
    };

    const handlePrevious = () => {
        setStep(step - 1);
    };

    const handleSubmit = async () => {
        if (!validateStep(step)) return;

        setIsLoading(true);
        try {
            const completeData: KYCData = {
                ...formData,
                entityType,
                isVerified: false,
                verificationStatus: 'pending'
            } as KYCData;
            
            await onSubmit(completeData);
        } catch (error) {
            console.error('Error submitting KYC:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof KYCData, value: string | File) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleFileUpload = (field: keyof KYCData, file: File) => {
        handleInputChange(field, file);
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Identidad</h3>
                
                {/* Tipo de Entidad */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Tipo de Entidad *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setEntityType('individual')}
                            className={`p-4 border-2 rounded-lg text-center transition-colors ${
                                entityType === 'individual'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <User className="h-8 w-8 mx-auto mb-2" />
                            <div className="font-medium">Persona Física</div>
                            <div className="text-sm text-gray-600">CURP, INE, Pasaporte</div>
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setEntityType('business')}
                            className={`p-4 border-2 rounded-lg text-center transition-colors ${
                                entityType === 'business'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <Building2 className="h-8 w-8 mx-auto mb-2" />
                            <div className="font-medium">Empresa</div>
                            <div className="text-sm text-gray-600">RFC, Acta Constitutiva</div>
                        </button>
                    </div>
                </div>

                {/* Campos de Identidad */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {entityType === 'individual' ? 'Nombre(s) *' : 'Nombre de la Empresa *'}
                        </label>
                        <input
                            type="text"
                            value={formData.firstName || ''}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.firstName ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder={entityType === 'individual' ? 'Juan Carlos' : 'Tech Solutions S.A. de C.V.'}
                        />
                        {errors.firstName && (
                            <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                        )}
                    </div>

                    {entityType === 'individual' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Apellidos
                            </label>
                            <input
                                type="text"
                                value={formData.lastName || ''}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="García López"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {entityType === 'individual' ? 'CURP *' : 'RFC *'}
                        </label>
                        <input
                            type="text"
                            value={formData.taxId || ''}
                            onChange={(e) => handleInputChange('taxId', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.taxId ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder={entityType === 'individual' ? 'GALJ800101HDFXXX01' : 'TEC800101XXX'}
                        />
                        {errors.taxId && (
                            <p className="text-red-500 text-sm mt-1">{errors.taxId}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="usuario@email.com"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teléfono *
                        </label>
                        <input
                            type="tel"
                            value={formData.phone || ''}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.phone ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="+52 55 1234 5678"
                        />
                        {errors.phone && (
                            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dirección</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dirección Completa *
                        </label>
                        <input
                            type="text"
                            value={formData.address || ''}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.address ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Av. Insurgentes Sur 123, Col. Del Valle"
                        />
                        {errors.address && (
                            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ciudad *
                            </label>
                            <input
                                type="text"
                                value={formData.city || ''}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.city ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Ciudad de México"
                            />
                            {errors.city && (
                                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estado *
                            </label>
                            <input
                                type="text"
                                value={formData.state || ''}
                                onChange={(e) => handleInputChange('state', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.state ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="CDMX"
                            />
                            {errors.state && (
                                <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                País *
                            </label>
                            <input
                                type="text"
                                value={formData.country || ''}
                                onChange={(e) => handleInputChange('country', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.country ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="México"
                            />
                            {errors.country && (
                                <p className="text-red-500 text-sm mt-1">{errors.country}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Código Postal *
                            </label>
                            <input
                                type="text"
                                value={formData.postalCode || ''}
                                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.postalCode ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="03100"
                            />
                            {errors.postalCode && (
                                <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Blockchain</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Información de Seguridad</span>
                    </div>
                    <p className="text-sm text-blue-700">
                        Tu wallet será utilizada para recibir pagos, comisiones y tokens. 
                        Asegúrate de que sea la dirección correcta y que tengas acceso a las claves privadas.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dirección de Wallet *
                        </label>
                        <div className="relative">
                            <input
                                type={showWallet ? 'text' : 'password'}
                                value={formData.walletAddress || ''}
                                onChange={(e) => handleInputChange('walletAddress', e.target.value)}
                                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.walletAddress ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
                            />
                            <button
                                type="button"
                                onClick={() => setShowWallet(!showWallet)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showWallet ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.walletAddress && (
                            <p className="text-red-500 text-sm mt-1">{errors.walletAddress}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Red Blockchain *
                        </label>
                        <select
                            value={formData.walletNetwork || ''}
                            onChange={(e) => handleInputChange('walletNetwork', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.walletNetwork ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Selecciona una red</option>
                            <option value="ethereum">Ethereum Mainnet</option>
                            <option value="polygon">Polygon</option>
                            <option value="binance">Binance Smart Chain</option>
                            <option value="arbitrum">Arbitrum</option>
                            <option value="optimism">Optimism</option>
                        </select>
                        {errors.walletNetwork && (
                            <p className="text-red-500 text-sm mt-1">{errors.walletNetwork}</p>
                        )}
                    </div>

                    {/* Documentos de Verificación */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Documentos de Verificación
                        </label>
                        <div className="space-y-3">
                            {entityType === 'individual' ? (
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Identificación Oficial (INE, Pasaporte, CURP)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => e.target.files?.[0] && handleFileUpload('idDocument', e.target.files[0])}
                                            className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        {formData.idDocument && (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">
                                            Acta Constitutiva o Documento de Constitución
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => e.target.files?.[0] && handleFileUpload('businessLicense', e.target.files[0])}
                                                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                            {formData.businessLicense && (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">
                                            Constancia de Situación Fiscal
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => e.target.files?.[0] && handleFileUpload('taxCertificate', e.target.files[0])}
                                                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                            {formData.taxCertificate && (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderProgressBar = () => (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                    Paso {step} de 3
                </span>
                <span className="text-sm text-gray-500">
                    {Math.round((step / 3) * 100)}% completado
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                ></div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Shield className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Verificación KYC - {userTypeLabels[userType]}
                                </h2>
                                <p className="text-gray-600">
                                    Verifica tu identidad para acceder a todas las funcionalidades
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {renderProgressBar()}

                    {/* Step Content */}
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                        <button
                            onClick={handlePrevious}
                            disabled={step === 1}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Anterior
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onCancel}
                                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Cancelar
                            </button>

                            {step < 3 ? (
                                <button
                                    onClick={handleNext}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Siguiente
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4" />
                                            Enviar Verificación
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KYCForm;
