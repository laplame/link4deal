import React, { useState } from 'react';
import { X, Upload, Calendar, Target, DollarSign, Users, Clock, CheckCircle } from 'lucide-react';

interface Promotion {
  id: string;
  title: string;
  brand: string;
  category: string;
  currentPrice: number;
  currency: string;
  commission: number;
  timeLeft: string;
  maxApplications: number;
  totalApplications: number;
}

interface PromotionApplicationModalProps {
  promotion: Promotion | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (applicationData: ApplicationData) => void;
}

interface ApplicationData {
  promotionId: string;
  contentProposal: string;
  platforms: string[];
  estimatedReach: number;
  portfolio: File[];
  pricing: {
    type: 'fixed' | 'commission' | 'hybrid';
    amount: number;
    currency: string;
  };
  timeline: {
    startDate: string;
    endDate: string;
    deliverables: string[];
  };
  additionalNotes: string;
}

export default function PromotionApplicationModal({ 
  promotion, 
  isOpen, 
  onClose, 
  onSubmit 
}: PromotionApplicationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationData>({
    promotionId: promotion?.id || '',
    contentProposal: '',
    platforms: [],
    estimatedReach: 0,
    portfolio: [],
    pricing: {
      type: 'commission',
      amount: 0,
      currency: 'MXN'
    },
    timeline: {
      startDate: '',
      endDate: '',
      deliverables: []
    },
    additionalNotes: ''
  });

  const platforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook', 'LinkedIn'];
  const deliverableTypes = [
    'Post de Instagram',
    'Story de Instagram',
    'Video de TikTok',
    'Video de YouTube',
    'Post de Twitter',
    'Post de Facebook',
    'Reel de Instagram',
    'Video testimonial',
    'Unboxing',
    'Review detallado'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof ApplicationData],
        [field]: value
      }
    }));
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setFormData(prev => ({
        ...prev,
        portfolio: [...prev.portfolio, ...newFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index)
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  if (!isOpen || !promotion) return null;

  const progress = (currentStep / 4) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Aplicar a Promoción</h2>
            <p className="text-gray-600">{promotion.brand} - {promotion.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso: {currentStep}/4</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Propuesta de Contenido */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Target className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-gray-900">Propuesta de Contenido</h3>
                <p className="text-gray-600">Describe tu idea para esta promoción</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción de tu propuesta
                </label>
                <textarea
                  value={formData.contentProposal}
                  onChange={(e) => handleInputChange('contentProposal', e.target.value)}
                  placeholder="Describe tu idea creativa, el tipo de contenido que planeas crear, y por qué sería efectivo para esta marca..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plataformas donde publicarás
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {platforms.map((platform) => (
                    <label key={platform} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.platforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange('platforms', [...formData.platforms, platform]);
                          } else {
                            handleInputChange('platforms', formData.platforms.filter(p => p !== platform));
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alcance estimado (seguidores)
                </label>
                <input
                  type="number"
                  value={formData.estimatedReach}
                  onChange={(e) => handleInputChange('estimatedReach', parseInt(e.target.value))}
                  placeholder="Ej: 50000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 2: Portfolio y Precios */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-gray-900">Portfolio y Precios</h3>
                <p className="text-gray-600">Muestra tu trabajo y define tu tarifa</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subir portfolio (máximo 5 archivos)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Arrastra archivos aquí o haz clic para seleccionar
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="portfolio-upload"
                  />
                  <label
                    htmlFor="portfolio-upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 cursor-pointer"
                  >
                    Seleccionar Archivos
                  </label>
                </div>

                {/* Archivos subidos */}
                {formData.portfolio.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.portfolio.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de tarifa
                  </label>
                  <select
                    value={formData.pricing.type}
                    onChange={(e) => handleNestedChange('pricing', 'type', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="commission">Solo comisión</option>
                    <option value="fixed">Tarifa fija</option>
                    <option value="hybrid">Híbrida (fija + comisión)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.pricing.type === 'commission' ? 'Comisión adicional (%)' : 'Monto (MXN)'}
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.amount}
                    onChange={(e) => handleNestedChange('pricing', 'amount', parseFloat(e.target.value))}
                    placeholder={formData.pricing.type === 'commission' ? 'Ej: 5' : 'Ej: 1000'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Cronograma y Entregables */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-gray-900">Cronograma y Entregables</h3>
                <p className="text-gray-600">Define cuándo y qué entregarás</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={formData.timeline.startDate}
                    onChange={(e) => handleNestedChange('timeline', 'startDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de entrega
                  </label>
                  <input
                    type="date"
                    value={formData.timeline.endDate}
                    onChange={(e) => handleNestedChange('timeline', 'endDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipos de entregables
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {deliverableTypes.map((deliverable) => (
                    <label key={deliverable} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.timeline.deliverables.includes(deliverable)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleNestedChange('timeline', 'deliverables', [...formData.timeline.deliverables, deliverable]);
                          } else {
                            handleNestedChange('timeline', 'deliverables', formData.timeline.deliverables.filter(d => d !== deliverable));
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{deliverable}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Resumen y Notas */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-gray-900">Resumen y Notas</h3>
                <p className="text-gray-600">Revisa tu aplicación antes de enviarla</p>
              </div>

              {/* Resumen de la promoción */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Resumen de la Promoción</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Marca:</span>
                    <span className="ml-2 font-medium">{promotion.brand}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Categoría:</span>
                    <span className="ml-2 font-medium">{promotion.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Precio:</span>
                    <span className="ml-2 font-medium">${promotion.currentPrice.toLocaleString()} {promotion.currency}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Comisión:</span>
                    <span className="ml-2 font-medium">{promotion.commission}%</span>
                  </div>
                </div>
              </div>

              {/* Resumen de la aplicación */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Tu Aplicación</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-blue-600">Plataformas:</span>
                    <span className="ml-2 text-blue-900">{formData.platforms.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Alcance estimado:</span>
                    <span className="ml-2 text-blue-900">{formData.estimatedReach.toLocaleString()} seguidores</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Archivos de portfolio:</span>
                    <span className="ml-2 text-blue-900">{formData.portfolio.length} archivos</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Entregables:</span>
                    <span className="ml-2 text-blue-900">{formData.timeline.deliverables.join(', ')}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  placeholder="Información adicional que quieras compartir con la marca..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Anterior
            </button>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {promotion.totalApplications}/{promotion.maxApplications} aplicaciones
              </span>
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-orange-500">{promotion.timeLeft}</span>
            </div>

            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Enviar Aplicación
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
