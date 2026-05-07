import React, { useState, useEffect, useCallback } from 'react';
import { X, Upload, Calendar, Target, DollarSign, Users, Clock, CheckCircle, Sparkles } from 'lucide-react';
import { apiUrl } from '../utils/apiUrl';
import { LAST_COPIED_INFLUENCER_ID_KEY } from '../config/influencerApply';

export interface ApplicationData {
  promotionId: string;
  /** ObjectId del documento Influencer (copiado desde el perfil). */
  influencerProfileId?: string;
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

type InfluencerApiPayload = {
  name?: string;
  username?: string;
  bio?: string;
  totalFollowers?: number;
  followers?: { instagram?: number; tiktok?: number; youtube?: number; twitter?: number };
  socialMedia?: { instagram?: string; tiktok?: string; youtube?: string; twitter?: string };
};

function platformsFromInfluencerApi(inv: InfluencerApiPayload): string[] {
  const keys: [string, 'instagram' | 'tiktok' | 'youtube' | 'twitter'][] = [
    ['Instagram', 'instagram'],
    ['TikTok', 'tiktok'],
    ['YouTube', 'youtube'],
    ['Twitter', 'twitter'],
  ];
  const out: string[] = [];
  for (const [label, key] of keys) {
    const f = Number(inv.followers?.[key]) || 0;
    const h = inv.socialMedia?.[key];
    const hasHandle = typeof h === 'string' && h.trim().length > 0;
    if (f > 0 || hasHandle) out.push(label);
  }
  return out;
}

function buildProposalDraft(inv: InfluencerApiPayload, promotion: Promotion): string {
  const name = (inv.name || inv.username || 'Creador de contenido').trim();
  const n = Math.max(0, Number(inv.totalFollowers) || 0);
  const bio = (inv.bio || '').trim();
  const bioLine = bio
    ? `\n\nSobre mí: ${bio.length > 320 ? `${bio.slice(0, 320)}…` : bio}`
    : '';
  return `Soy ${name} (≈${n.toLocaleString()} seguidores totales). Me interesa colaborar en la campaña «${promotion.title}» de ${promotion.brand}.${bioLine}\n\nPropongo contenido alineado con la marca y con engagement real con mi audiencia.`;
}

interface PromotionApplicationModalProps {
  promotion: Promotion | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (applicationData: ApplicationData) => void | Promise<void>;
}

export default function PromotionApplicationModal({ 
  promotion, 
  isOpen, 
  onClose, 
  onSubmit 
}: PromotionApplicationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [prefillError, setPrefillError] = useState('');
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [influencerIdInput, setInfluencerIdInput] = useState('');
  const [formData, setFormData] = useState<ApplicationData>({
    promotionId: promotion?.id || '',
    influencerProfileId: undefined,
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

  const loadProfileById = useCallback(
    async (rawId: string, options: { preserveProposal: boolean }) => {
      const id = rawId.trim();
      if (!promotion) return;
      if (!/^[a-f0-9]{24}$/i.test(id)) {
        setPrefillError('El ID debe ser un identificador de 24 caracteres (el de tu perfil público).');
        return;
      }
      setPrefillError('');
      setPrefillLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/influencers/${id}`));
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success || !data.data) {
          setPrefillError(
            typeof data.message === 'string' ? data.message : 'No se encontró un influencer con ese ID.'
          );
          return;
        }
        const inv = data.data as InfluencerApiPayload;
        try {
          sessionStorage.setItem(LAST_COPIED_INFLUENCER_ID_KEY, id);
        } catch {
          /* ignore */
        }
        setFormData((prev) => ({
          ...prev,
          influencerProfileId: id,
          platforms: platformsFromInfluencerApi(inv),
          estimatedReach: Math.max(0, Number(inv.totalFollowers) || 0),
          contentProposal:
            options.preserveProposal && prev.contentProposal.trim()
              ? prev.contentProposal
              : buildProposalDraft(inv, promotion),
          pricing: {
            ...prev.pricing,
            type: 'commission',
            amount:
              promotion.commission != null && promotion.commission !== undefined
                ? Number(promotion.commission)
                : prev.pricing.amount,
            currency: promotion.currency || prev.pricing.currency || 'MXN',
          },
        }));
      } catch {
        setPrefillError('Error de red al cargar el perfil.');
      } finally {
        setPrefillLoading(false);
      }
    },
    [promotion]
  );

  useEffect(() => {
    if (!isOpen || !promotion) return;

    setCurrentStep(1);
    setSubmitError('');
    setPrefillError('');
    setIsSubmitting(false);

    let stored = '';
    try {
      stored = (sessionStorage.getItem(LAST_COPIED_INFLUENCER_ID_KEY) || '').trim();
    } catch {
      /* ignore */
    }
    setInfluencerIdInput(stored);

    setFormData({
      promotionId: promotion.id,
      influencerProfileId: undefined,
      contentProposal: '',
      platforms: [],
      estimatedReach: 0,
      portfolio: [],
      pricing: {
        type: 'commission',
        amount: Number(promotion.commission) || 0,
        currency: promotion.currency || 'MXN',
      },
      timeline: {
        startDate: '',
        endDate: '',
        deliverables: [],
      },
      additionalNotes: '',
    });

    if (!/^[a-f0-9]{24}$/i.test(stored)) return;

    void loadProfileById(stored, { preserveProposal: false });
  }, [isOpen, promotion?.id, loadProfileById]);

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

  const handleSubmit = async () => {
    if (!promotion) return;
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const payload = { ...formData, promotionId: promotion.id };
      await Promise.resolve(onSubmit(payload));
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'No se pudo enviar la aplicación.');
    } finally {
      setIsSubmitting(false);
    }
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
              <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50/80 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-purple-900">Datos desde tu perfil</p>
                    <p className="text-xs text-purple-800/90 mt-1">
                      Pega el ID que copiaste en tu perfil de influencer. Si ya usaste &quot;Copiar mi ID&quot;
                      allí, intentamos cargarlo automáticamente al abrir este formulario.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        spellCheck={false}
                        value={influencerIdInput}
                        onChange={(e) => setInfluencerIdInput(e.target.value.trim())}
                        placeholder="Ej: 69d7dfc5fde91526607458d9"
                        className="flex-1 min-w-0 px-3 py-2.5 border border-purple-200 rounded-lg text-sm font-mono bg-white/90 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        disabled={prefillLoading}
                        onClick={() => loadProfileById(influencerIdInput, { preserveProposal: false })}
                        className="px-4 py-2.5 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 shrink-0"
                      >
                        {prefillLoading ? 'Cargando…' : 'Cargar datos'}
                      </button>
                    </div>
                    {prefillError ? (
                      <p className="text-xs text-red-600 mt-2" role="alert">
                        {prefillError}
                      </p>
                    ) : null}
                    {formData.influencerProfileId ? (
                      <p className="text-xs text-emerald-800 mt-2">
                        Listo: solicitud vinculada al perfil{' '}
                        <span className="font-mono">{formData.influencerProfileId}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

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
                  onChange={(e) =>
                    handleInputChange('estimatedReach', Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
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
                  {formData.influencerProfileId ? (
                    <div>
                      <span className="text-blue-600">ID influencer:</span>
                      <span className="ml-2 text-blue-900 font-mono text-xs">{formData.influencerProfileId}</span>
                    </div>
                  ) : null}
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

          {submitError ? (
            <div className="mb-4 rounded-lg bg-red-50 text-red-800 text-sm px-4 py-3" role="alert">
              {submitError}
            </div>
          ) : null}

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
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2 disabled:opacity-60"
              >
                <CheckCircle className="w-4 h-4" />
                {isSubmitting ? 'Enviando…' : 'Enviar Aplicación'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
