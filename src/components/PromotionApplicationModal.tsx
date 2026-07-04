import { useState, useEffect, useCallback } from 'react';
import { X, Upload, Calendar, Target, DollarSign, Clock, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';
import { apiUrl } from '../utils/apiUrl';
import { LAST_COPIED_INFLUENCER_ID_KEY } from '../config/influencerApply';
import {
  amazonCommissionRate,
  influencerNetCommissionRate,
  getAmazonCommissionCategory,
  formatCommissionPct,
  influencerCommissionAmount,
  convertAmount,
  formatMoney,
  PLATFORM_CUT_RATE,
  type Currency,
} from '../utils/amazonCommission';
import { isAmazonPromotion } from '../utils/amazonPromotion';
import { SITE_SHELL_CARD } from '../config/siteShell';

const MODAL_INPUT =
  'w-full px-4 py-3 border border-white/10 bg-gray-950/80 text-gray-100 placeholder:text-gray-500 rounded-lg focus:ring-2 focus:ring-violet-500/50 focus:border-transparent';
const MODAL_LABEL = 'block text-sm font-medium text-gray-300 mb-2';
const MODAL_CHECK =
  'rounded border-white/20 bg-gray-950/60 text-violet-500 focus:ring-violet-500/50';

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
  /** Categoría de comisión Amazon: define el % que se reparte (influencer recibe el neto tras el 20%). */
  amazonCommissionCategory?: string;
  /** Quick-promotion con redirección (ej. Amazon) en lugar de cupón QR. */
  redirectInsteadOfQr?: boolean;
  /** URL de redirección; vacío = Amazon por defecto. */
  redirectToUrl?: string;
}

/** Comisión adicional por defecto: 0% en Amazon (ya define la comisión), el valor de la promo en otras. */
function defaultAdditionalCommission(p: Promotion): number {
  if (isAmazonPromotion(p)) return 0;
  return Number(p.commission) || 0;
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
            amount: defaultAdditionalCommission(promotion),
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
        amount: defaultAdditionalCommission(promotion),
        currency: promotion.currency || 'MXN',
      },
      timeline: {
        startDate: '',
        endDate: '',
        deliverables: [],
      },
      additionalNotes: '',
    });

    if (/^[a-f0-9]{24}$/i.test(stored)) {
      void loadProfileById(stored, { preserveProposal: false });
      return;
    }

    // Sin ID copiado: si hay sesión, recupera el perfil de influencer del usuario.
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch(apiUrl('/api/influencers/me'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        const meId = res.ok && data?.success && data?.data?.id ? String(data.data.id) : '';
        if (/^[a-f0-9]{24}$/i.test(meId)) {
          setInfluencerIdInput(meId);
          void loadProfileById(meId, { preserveProposal: false });
        }
      } catch {
        /* sin perfil vinculado: el usuario puede pegar su ID manualmente */
      }
    })();
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
        ...(prev[parent as keyof ApplicationData] as object),
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

  const amazonCategory = getAmazonCommissionCategory(promotion.amazonCommissionCategory);
  const amazonRate = amazonCommissionRate(promotion.amazonCommissionCategory);
  const influencerRate = influencerNetCommissionRate(promotion.amazonCommissionCategory);
  const platformPct = Math.round(PLATFORM_CUT_RATE * 100);

  const isAmazon = isAmazonPromotion(promotion);
  const baseCurrency: Currency = promotion.currency === 'USD' ? 'USD' : 'MXN';
  const basePrice = Number(promotion.currentPrice) || 0;
  const hasPrice = basePrice > 0;
  const commissionInBase = influencerCommissionAmount(promotion.amazonCommissionCategory, basePrice);
  const otherCurrency: Currency = baseCurrency === 'USD' ? 'MXN' : 'USD';
  const commissionInOther = convertAmount(commissionInBase, baseCurrency, otherCurrency);

  const earningsBox = (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4">
      <div className="flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-200">Lo que ganas con esta promoción</p>
          {hasPrice ? (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-3xl font-extrabold text-emerald-400">{formatMoney(commissionInBase, baseCurrency)}</span>
              <span className="text-sm text-emerald-300/90">por venta</span>
              <span className="text-xs text-emerald-400/70">(≈ {formatMoney(commissionInOther, otherCurrency)})</span>
            </div>
          ) : (
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400">{formatCommissionPct(influencerRate)}</span>
              <span className="text-sm text-emerald-300/90">de comisión para ti</span>
            </div>
          )}
          <p className="mt-2 text-xs leading-relaxed text-emerald-300/80">
            {hasPrice ? (
              <>
                {formatCommissionPct(influencerRate)} sobre el precio de {formatMoney(basePrice, baseCurrency)}.{' '}
              </>
            ) : null}
            Comisión Amazon de la categoría <span className="font-medium">{formatCommissionPct(amazonRate)}</span>; la
            plataforma retiene {platformPct}% y tú recibes el resto.
          </p>
          <p className="mt-1 text-[11px] text-emerald-400/70">Categoría: {amazonCategory.label}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${SITE_SHELL_CARD} max-w-4xl w-full max-h-[90vh] overflow-y-auto border-violet-500/20`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Aplicar a Promoción</h2>
            <p className="text-gray-400">{promotion.brand} - {promotion.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Progreso: {currentStep}/4</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-violet-600 to-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Propuesta de Contenido */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {earningsBox}
              <div className="rounded-xl border border-violet-500/30 bg-violet-950/30 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-violet-200">Datos desde tu perfil</p>
                    <p className="text-xs text-gray-400 mt-1">
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
                        className="flex-1 min-w-0 px-3 py-2.5 border border-white/10 rounded-lg text-sm font-mono bg-gray-950/80 text-gray-100 placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
                      />
                      <button
                        type="button"
                        disabled={prefillLoading}
                        onClick={() => loadProfileById(influencerIdInput, { preserveProposal: false })}
                        className="px-4 py-2.5 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-60 shrink-0"
                      >
                        {prefillLoading ? 'Cargando…' : 'Cargar datos'}
                      </button>
                    </div>
                    {prefillError ? (
                      <p className="text-xs text-red-300 mt-2" role="alert">
                        {prefillError}
                      </p>
                    ) : null}
                    {formData.influencerProfileId ? (
                      <p className="text-xs text-emerald-300 mt-2">
                        Listo: solicitud vinculada al perfil{' '}
                        <span className="font-mono text-emerald-200">{formData.influencerProfileId}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="text-center mb-6">
                <Target className="w-12 h-12 text-violet-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-white">Propuesta de Contenido</h3>
                <p className="text-gray-400">Describe tu idea para esta promoción</p>
              </div>

              <div>
                <label className={MODAL_LABEL}>
                  Descripción de tu propuesta
                </label>
                <textarea
                  value={formData.contentProposal}
                  onChange={(e) => handleInputChange('contentProposal', e.target.value)}
                  placeholder="Describe tu idea creativa, el tipo de contenido que planeas crear, y por qué sería efectivo para esta marca..."
                  className={MODAL_INPUT}
                  rows={4}
                />
              </div>

              <div>
                <label className={MODAL_LABEL}>
                  Plataformas donde publicarás
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {platforms.map((platform) => (
                    <label key={platform} className="flex items-center space-x-2 text-gray-300">
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
                        className={MODAL_CHECK}
                      />
                      <span className="text-sm">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={MODAL_LABEL}>
                  Alcance estimado (seguidores)
                </label>
                <input
                  type="number"
                  value={formData.estimatedReach}
                  onChange={(e) =>
                    handleInputChange('estimatedReach', Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  placeholder="Ej: 50000"
                  className={MODAL_INPUT}
                />
              </div>
            </div>
          )}

          {/* Step 2: Portfolio y Precios */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <DollarSign className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-white">Portfolio y Precios</h3>
                <p className="text-gray-400">Muestra tu trabajo y define tu tarifa</p>
              </div>

              <div>
                <label className={MODAL_LABEL}>
                  Subir portfolio (máximo 5 archivos)
                </label>
                <div className="border-2 border-dashed border-white/15 rounded-lg p-6 text-center bg-gray-950/40">
                  <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 mb-2">
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
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-500 cursor-pointer"
                  >
                    Seleccionar Archivos
                  </label>
                </div>

                {formData.portfolio.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.portfolio.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-800/60 border border-white/10 p-3 rounded-lg">
                        <span className="text-sm text-gray-300">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4">
                <p className="text-sm font-semibold text-emerald-200">Tu comisión por venta</p>
                {hasPrice ? (
                  <>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-2xl font-extrabold text-emerald-400">
                        {formatMoney(commissionInBase, baseCurrency)}
                      </span>
                      <span className="text-xs text-emerald-400/70">≈ {formatMoney(commissionInOther, otherCurrency)}</span>
                    </div>
                    <p className="mt-1 text-xs text-emerald-300/80">
                      {formatCommissionPct(influencerRate)} sobre el precio de {formatMoney(basePrice, baseCurrency)} (comisión
                      Amazon {formatCommissionPct(amazonRate)} − {platformPct}% plataforma).
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-emerald-300/80">
                    {formatCommissionPct(influencerRate)} de comisión (comisión Amazon {formatCommissionPct(amazonRate)} − {platformPct}% plataforma).
                    Esta promoción no tiene precio de referencia para calcular el monto.
                  </p>
                )}
                <p className="mt-1 text-[11px] text-emerald-400/60">
                  Conversión aproximada para referencia; el monto final depende del tipo de cambio real.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={MODAL_LABEL}>
                    Tipo de tarifa
                  </label>
                  <select
                    value={formData.pricing.type}
                    onChange={(e) => handleNestedChange('pricing', 'type', e.target.value)}
                    className={MODAL_INPUT}
                  >
                    <option value="commission">Solo comisión</option>
                    <option value="fixed">Tarifa fija</option>
                    <option value="hybrid">Híbrida (fija + comisión)</option>
                  </select>
                </div>

                <div>
                  <label className={MODAL_LABEL}>
                    {formData.pricing.type === 'commission' ? 'Comisión adicional (%)' : 'Monto (MXN)'}
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.amount}
                    onChange={(e) => handleNestedChange('pricing', 'amount', parseFloat(e.target.value) || 0)}
                    placeholder={formData.pricing.type === 'commission' ? 'Ej: 5' : 'Ej: 1000'}
                    className={MODAL_INPUT}
                  />
                  {isAmazon && formData.pricing.type === 'commission' ? (
                    <p className="mt-1 text-xs text-gray-500">
                      En promociones de Amazon la comisión la define la categoría; por eso inicia en 0%. Puedes cambiarla si pides un extra.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Calendar className="w-12 h-12 text-sky-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-white">Cronograma y Entregables</h3>
                <p className="text-gray-400">Define cuándo y qué entregarás</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={MODAL_LABEL}>
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={formData.timeline.startDate}
                    onChange={(e) => handleNestedChange('timeline', 'startDate', e.target.value)}
                    className={MODAL_INPUT}
                  />
                </div>

                <div>
                  <label className={MODAL_LABEL}>
                    Fecha de entrega
                  </label>
                  <input
                    type="date"
                    value={formData.timeline.endDate}
                    onChange={(e) => handleNestedChange('timeline', 'endDate', e.target.value)}
                    className={MODAL_INPUT}
                  />
                </div>
              </div>

              <div>
                <label className={MODAL_LABEL}>
                  Tipos de entregables
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {deliverableTypes.map((deliverable) => (
                    <label key={deliverable} className="flex items-center space-x-2 text-gray-300">
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
                        className={MODAL_CHECK}
                      />
                      <span className="text-sm">{deliverable}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-white">Resumen y Notas</h3>
                <p className="text-gray-400">Revisa tu aplicación antes de enviarla</p>
              </div>

              <div className={`${SITE_SHELL_CARD} p-4`}>
                <h4 className="font-medium text-white mb-2">Resumen de la Promoción</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Marca:</span>
                    <span className="ml-2 font-medium text-gray-200">{promotion.brand}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Categoría:</span>
                    <span className="ml-2 font-medium text-gray-200">{promotion.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Precio:</span>
                    <span className="ml-2 font-medium text-gray-200">${promotion.currentPrice.toLocaleString()} {promotion.currency}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Comisión Amazon:</span>
                    <span className="ml-2 font-medium text-gray-200">{formatCommissionPct(amazonRate)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Tu comisión (tras {platformPct}%):</span>
                    <span className="ml-2 font-semibold text-emerald-400">
                      {formatCommissionPct(influencerRate)}
                      {hasPrice ? ` · ${formatMoney(commissionInBase, baseCurrency)} (≈ ${formatMoney(commissionInOther, otherCurrency)})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-violet-500/30 bg-violet-950/30 p-4">
                <h4 className="font-medium text-violet-200 mb-2">Tu Aplicación</h4>
                <div className="space-y-2 text-sm">
                  {formData.influencerProfileId ? (
                    <div>
                      <span className="text-violet-400">ID influencer:</span>
                      <span className="ml-2 text-gray-200 font-mono text-xs">{formData.influencerProfileId}</span>
                    </div>
                  ) : null}
                  <div>
                    <span className="text-violet-400">Plataformas:</span>
                    <span className="ml-2 text-gray-200">{formData.platforms.join(', ') || '—'}</span>
                  </div>
                  <div>
                    <span className="text-violet-400">Alcance estimado:</span>
                    <span className="ml-2 text-gray-200">{formData.estimatedReach.toLocaleString()} seguidores</span>
                  </div>
                  <div>
                    <span className="text-violet-400">Archivos de portfolio:</span>
                    <span className="ml-2 text-gray-200">{formData.portfolio.length} archivos</span>
                  </div>
                  <div>
                    <span className="text-violet-400">Entregables:</span>
                    <span className="ml-2 text-gray-200">{formData.timeline.deliverables.join(', ') || '—'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={MODAL_LABEL}>
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  placeholder="Información adicional que quieras compartir con la marca..."
                  className={MODAL_INPUT}
                  rows={3}
                />
              </div>
            </div>
          )}

          {submitError ? (
            <div className="mb-4 rounded-lg bg-red-950/50 border border-red-500/30 text-red-200 text-sm px-4 py-3" role="alert">
              {submitError}
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-white/10'
              }`}
            >
              Anterior
            </button>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {promotion.totalApplications}/{promotion.maxApplications} aplicaciones
              </span>
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-400">{promotion.timeLeft}</span>
            </div>

            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-500 transition-all duration-200"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-all duration-200 flex items-center gap-2 disabled:opacity-60"
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
