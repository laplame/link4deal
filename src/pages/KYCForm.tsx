import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Camera, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  User,
  CreditCard,
  Globe,
  Building2,
  Camera as CameraIcon,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';

interface KYCData {
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    passportNumber: string;
    passportExpiry: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  documents: {
    passportFront: File | null;
    passportBack: File | null;
    selfie: File | null;
    proofOfAddress: File | null;
  };
  wallet: {
    walletAddress: string;
    walletType: string;
    blockchain: string;
  };
  verification: {
    emailVerified: boolean;
    phoneVerified: boolean;
    identityVerified: boolean;
    walletVerified: boolean;
  };
}

export default function KYCForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [kycData, setKycData] = useState<KYCData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      nationality: '',
      passportNumber: '',
      passportExpiry: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    documents: {
      passportFront: null,
      passportBack: null,
      selfie: null,
      proofOfAddress: null
    },
    wallet: {
      walletAddress: '',
      walletType: '',
      blockchain: ''
    },
    verification: {
      emailVerified: false,
      phoneVerified: false,
      identityVerified: false,
      walletVerified: false
    }
  });

  const [errors, setErrors] = useState<Partial<KYCData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 1, title: 'Información Personal', icon: User },
    { id: 2, title: 'Dirección', icon: Globe },
    { id: 3, title: 'Documentos', icon: Camera },
    { id: 4, title: 'Wallet Blockchain', icon: CreditCard },
    { id: 5, title: 'Verificación', icon: Shield }
  ];

  const handleInputChange = (section: keyof KYCData, field: string, value: any) => {
    setKycData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Clear error when user starts typing
    if (errors[section] && (errors[section] as any)[field]) {
      setErrors(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: undefined
        }
      }));
    }
  };

  const handleFileUpload = (field: string, file: File) => {
    setKycData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<KYCData> = {};

    switch (step) {
      case 1:
        if (!kycData.personalInfo.firstName) newErrors.personalInfo = { ...newErrors.personalInfo, firstName: 'Nombre requerido' };
        if (!kycData.personalInfo.lastName) newErrors.personalInfo = { ...newErrors.personalInfo, lastName: 'Apellido requerido' };
        if (!kycData.personalInfo.dateOfBirth) newErrors.personalInfo = { ...newErrors.personalInfo, dateOfBirth: 'Fecha de nacimiento requerida' };
        if (!kycData.personalInfo.nationality) newErrors.personalInfo = { ...newErrors.personalInfo, nationality: 'Nacionalidad requerida' };
        break;
      case 2:
        if (!kycData.address.street) newErrors.address = { ...newErrors.address, street: 'Calle requerida' };
        if (!kycData.address.city) newErrors.address = { ...newErrors.address, city: 'Ciudad requerida' };
        if (!kycData.address.country) newErrors.address = { ...newErrors.address, country: 'País requerido' };
        break;
      case 3:
        if (!kycData.documents.passportFront) newErrors.documents = { ...newErrors.documents, passportFront: 'Foto frontal del pasaporte requerida' };
        if (!kycData.documents.selfie) newErrors.documents = { ...newErrors.documents, selfie: 'Selfie requerida' };
        break;
      case 4:
        if (!kycData.wallet.walletAddress) newErrors.wallet = { ...newErrors.wallet, walletAddress: 'Dirección de wallet requerida' };
        if (!kycData.wallet.blockchain) newErrors.wallet = { ...newErrors.wallet, blockchain: 'Blockchain requerida' };
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    navigate('/kyc-success');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={kycData.personalInfo.firstName}
                  onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.personalInfo?.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Tu nombre"
                />
                {errors.personalInfo?.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.personalInfo.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={kycData.personalInfo.lastName}
                  onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.personalInfo?.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Tu apellido"
                />
                {errors.personalInfo?.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.personalInfo.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  value={kycData.personalInfo.dateOfBirth}
                  onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.personalInfo?.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.personalInfo?.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.personalInfo.dateOfBirth}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nacionalidad *
                </label>
                <select
                  value={kycData.personalInfo.nationality}
                  onChange={(e) => handleInputChange('personalInfo', 'nationality', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.personalInfo?.nationality ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar nacionalidad</option>
                  <option value="MX">México</option>
                  <option value="US">Estados Unidos</option>
                  <option value="ES">España</option>
                  <option value="AR">Argentina</option>
                  <option value="CO">Colombia</option>
                </select>
                {errors.personalInfo?.nationality && (
                  <p className="mt-1 text-sm text-red-600">{errors.personalInfo.nationality}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Pasaporte
                </label>
                <input
                  type="text"
                  value={kycData.personalInfo.passportNumber}
                  onChange={(e) => handleInputChange('personalInfo', 'passportNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Número de pasaporte"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Expiración del Pasaporte
                </label>
                <input
                  type="date"
                  value={kycData.personalInfo.passportExpiry}
                  onChange={(e) => handleInputChange('personalInfo', 'passportExpiry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Dirección de Residencia</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calle y Número *
                </label>
                <input
                  type="text"
                  value={kycData.address.street}
                  onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.address?.street ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Calle, número, departamento"
                />
                {errors.address?.street && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.street}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    value={kycData.address.city}
                    onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.address?.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ciudad"
                  />
                  {errors.address?.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado/Provincia
                  </label>
                  <input
                    type="text"
                    value={kycData.address.state}
                    onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Estado"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={kycData.address.zipCode}
                    onChange={(e) => handleInputChange('address', 'zipCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Código postal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País *
                </label>
                <select
                  value={kycData.address.country}
                  onChange={(e) => handleInputChange('address', 'country', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.address?.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar país</option>
                  <option value="MX">México</option>
                  <option value="US">Estados Unidos</option>
                  <option value="ES">España</option>
                  <option value="AR">Argentina</option>
                  <option value="CO">Colombia</option>
                </select>
                {errors.address?.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.country}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Documentos de Identificación</h3>
            <p className="text-gray-600">Sube los documentos requeridos para la verificación de identidad.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto Frontal del Pasaporte *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload('passportFront', e.target.files?.[0] || null)}
                      className="hidden"
                      id="passportFront"
                    />
                    <label htmlFor="passportFront" className="cursor-pointer">
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {kycData.documents.passportFront ? 'Documento subido ✓' : 'Haz clic para subir'}
                      </p>
                    </label>
                  </div>
                  {errors.documents?.passportFront && (
                    <p className="mt-1 text-sm text-red-600">{errors.documents.passportFront}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto Trasera del Pasaporte
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload('passportBack', e.target.files?.[0] || null)}
                      className="hidden"
                      id="passportBack"
                    />
                    <label htmlFor="passportBack" className="cursor-pointer">
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {kycData.documents.passportBack ? 'Documento subido ✓' : 'Haz clic para subir'}
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selfie con Pasaporte *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload('selfie', e.target.files?.[0] || null)}
                      className="hidden"
                      id="selfie"
                    />
                    <label htmlFor="selfie" className="cursor-pointer">
                      <CameraIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {kycData.documents.selfie ? 'Selfie subida ✓' : 'Haz clic para subir'}
                      </p>
                    </label>
                  </div>
                  {errors.documents?.selfie && (
                    <p className="mt-1 text-sm text-red-600">{errors.documents.selfie}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comprobante de Domicilio
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('proofOfAddress', e.target.files?.[0] || null)}
                      className="hidden"
                      id="proofOfAddress"
                    />
                    <label htmlFor="proofOfAddress" className="cursor-pointer">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {kycData.documents.proofOfAddress ? 'Documento subido ✓' : 'Haz clic para subir'}
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Wallet Blockchain</h3>
            <p className="text-gray-600">Configura tu wallet para recibir pagos y comisiones.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección de Wallet *
                </label>
                <input
                  type="text"
                  value={kycData.wallet.walletAddress}
                  onChange={(e) => handleInputChange('wallet', 'walletAddress', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                    errors.wallet?.walletAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0x1234...5678"
                />
                {errors.wallet?.walletAddress && (
                  <p className="mt-1 text-sm text-red-600">{errors.wallet.walletAddress}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Wallet
                  </label>
                  <select
                    value={kycData.wallet.walletType}
                    onChange={(e) => handleInputChange('wallet', 'walletType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="metamask">MetaMask</option>
                    <option value="walletconnect">WalletConnect</option>
                    <option value="coinbase">Coinbase Wallet</option>
                    <option value="trust">Trust Wallet</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blockchain *
                  </label>
                  <select
                    value={kycData.wallet.blockchain}
                    onChange={(e) => handleInputChange('wallet', 'blockchain', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.wallet?.blockchain ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar blockchain</option>
                    <option value="ethereum">Ethereum</option>
                    <option value="polygon">Polygon</option>
                    <option value="binance">Binance Smart Chain</option>
                    <option value="arbitrum">Arbitrum</option>
                    <option value="optimism">Optimism</option>
                  </select>
                  {errors.wallet?.blockchain && (
                    <p className="mt-1 text-sm text-red-600">{errors.wallet.blockchain}</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Seguridad de Wallet</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Nunca compartas tu clave privada. Solo necesitamos tu dirección pública para procesar pagos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Verificación Final</h3>
            <p className="text-gray-600">Revisa toda la información antes de enviar tu solicitud KYC.</p>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Resumen de Información</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Nombre completo:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {kycData.personalInfo.firstName} {kycData.personalInfo.lastName}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Fecha de nacimiento:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {kycData.personalInfo.dateOfBirth}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Nacionalidad:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {kycData.personalInfo.nationality}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Dirección:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {kycData.address.street}, {kycData.address.city}, {kycData.address.country}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Wallet:</span>
                  <span className="text-sm font-medium text-gray-900 font-mono">
                    {kycData.wallet.walletAddress ? `${kycData.wallet.walletAddress.slice(0, 8)}...${kycData.wallet.walletAddress.slice(-6)}` : 'No configurada'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Documentos:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Object.values(kycData.documents).filter(Boolean).length}/4 subidos
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">Importante</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Al enviar esta solicitud, confirmas que toda la información proporcionada es verdadera y precisa. 
                    La verificación puede tomar de 24 a 48 horas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link 
              to="/admin" 
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Verificación KYC
              </h1>
              <p className="text-gray-600 mt-1">
                Know Your Customer - Verificación de identidad y wallet blockchain
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <span 
                key={step.id}
                className={`text-xs font-medium ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>

          <div className="flex items-center space-x-3">
            {currentStep < steps.length ? (
              <button
                onClick={nextStep}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Siguiente
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Enviar Solicitud KYC
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
