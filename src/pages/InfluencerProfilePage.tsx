import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  SalesAndBidsRealtimeChart,
  buildSalesAndBidsChartData,
  hasCouponRedemptionEvidence,
  chartShowsActivity,
  CHART_RANGE_OPTIONS,
  type ChartAnalyticsRange,
  type PublicCouponRedemption,
} from '../components/SalesAndBidsRealtimeChart';
import { CouponQrActivitySection } from '../components/CouponQrActivitySection';
import { 
  ArrowLeft,
  Instagram, 
  Youtube, 
  Twitter, 
  Globe, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Mail, 
  Heart, 
  Share2, 
  Eye, 
  BarChart3, 
  Target, 
  CreditCard, 
  Flame, 
  Star,
  Plus,
  XCircle,
  Eye as EyeIcon,
  Users as UsersIcon,
  TrendingUp as TrendingUpIcon,
  DollarSign as DollarSignIcon,
  FileCode2,
  ExternalLink,
  Copy,
  Check,
  Ticket,
  Megaphone,
  LayoutGrid,
  ImagePlus,
  Loader2,
  FileDown,
} from 'lucide-react';
import { getDisplayContractAddress, getPolygonscanAddressUrl, shortenAddress } from '../utils/polygonContract';
import { LAST_COPIED_INFLUENCER_ID_KEY } from '../config/influencerApply';
import { apiUrl, mediaUrl } from '../utils/apiUrl';
import { InfluencerUgcShowcase, type UgcProfilePublic } from '../components/influencer/InfluencerUgcShowcase';
import { generateInfluencerProfilePdf } from '../utils/generateInfluencerProfilePdf';
import { fetchInfluencerByPublicSlug } from '../utils/fetchInfluencerByPublicSlug';
import ProductCard from '../components/ProductCard';
import {
  mapInfluencerAvailableRowToProductCard,
  type InfluencerAvailableProductApiRow,
} from '../utils/mapPromotionToProductCard';
import { masonryTierFromId } from '../utils/masonryVariant';

interface Influencer {
  id: string;
  name: string;
  username: string;
  avatar: string;
  followers: {
    instagram: number;
    tiktok: number;
    youtube: number;
    twitter: number;
  };
  totalFollowers: number;
  engagement: number;
  categories: string[];
  status: 'active' | 'pending' | 'verified' | 'suspended';
  joinDate: string;
  totalEarnings: number;
  monthlyEarnings: number;
  completedPromotions: number;
  activePromotions: number;
  rating: number;
  location: string;
  bio: string;
  socialMedia: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  };
  recentPromotions: PromotionHistory[];
  recentPayments: PaymentHistory[];
  couponStats: CouponStats;
  hot: boolean;
  featured: boolean;
  ugcProfile?: UgcProfilePublic;
  /** Código corto único del influencer (asignado al alta; visible en perfil y buscador si hay promo por defecto). */
  profileShortCode?: string;
  publicSlug?: string;
}

interface PromotionHistory {
  id: string;
  brand: string;
  title: string;
  date: string;
  status: 'completed' | 'active' | 'pending';
  earnings: number;
  couponCode: string;
  couponUsage: number;
  totalSales: number;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  type: 'commission' | 'bonus' | 'referral';
  status: 'paid' | 'pending' | 'processing';
  description: string;
}

interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  totalSales: number;
  totalCommission: number;
  averageConversion: number;
}

interface QrPromotionSummaryRow {
  promotionId: string;
  title: string | null;
  brand: string | null;
  validFrom: string | null;
  validUntil: string | null;
  catalogActiveWindow: boolean;
  promotionStatus: string | null;
  bidStatus: string | null;
  bidAmountUsd: number | null;
  open: number;
  redeemed: number;
  expiredUnused: number;
  totalTokens: number;
  lastRedeemedAt: string | null;
  noQrActivityYet?: boolean;
}

interface InfluencerPromoShortCodeRow {
  code: string;
  label: string;
  referralPrefix: string;
  expiresAt: string | null;
  promotion: {
    id: string;
    title: string;
    brand: string;
    status: string | null;
  } | null;
}

const SAVED_INFLUENCERS_KEY = 'link4deal_saved_influencers';

function getSavedIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_INFLUENCERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function InfluencerProfilePage() {
  const { influencerSlug } = useParams();
  const { hasRole, isAuthenticated } = useAuth();
  const isInfluencer = hasRole('influencer');
  const isSuperAdmin = hasRole('super_admin') || hasRole('admin');
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>(() => getSavedIds());
  const [copiedInfluencerId, setCopiedInfluencerId] = useState(false);

  // Estado para el módulo de pujas
  const [showBidModal, setShowBidModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [couponsActivity, setCouponsActivity] = useState<{
    open: PublicCouponRedemption[];
    redeemed: PublicCouponRedemption[];
    expiredUnused: PublicCouponRedemption[];
  } | null>(null);
  const [couponsActivityLoading, setCouponsActivityLoading] = useState(false);
  const [chartRange, setChartRange] = useState<ChartAnalyticsRange>('7d');
  const [qrPromoSummary, setQrPromoSummary] = useState<{
    rows: QrPromotionSummaryRow[];
    tokensWithoutPromotionId: number;
  } | null>(null);
  const [qrPromoSummaryLoading, setQrPromoSummaryLoading] = useState(false);
  const [viewerInfluencerId, setViewerInfluencerId] = useState<string | null>(null);
  const [promoShortCodes, setPromoShortCodes] = useState<InfluencerPromoShortCodeRow[]>([]);
  const [promoShortCodesLoading, setPromoShortCodesLoading] = useState(false);
  const [copiedPromoCode, setCopiedPromoCode] = useState<string | null>(null);
  const [storyGeneratingKey, setStoryGeneratingKey] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [storyPreview, setStoryPreview] = useState<{
    url: string;
    shortCode: string;
    discountPercentage: number;
    title?: string | null;
  } | null>(null);
  const [storyError, setStoryError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSenderName, setContactSenderName] = useState('');
  const [contactSenderEmail, setContactSenderEmail] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [availableProductRows, setAvailableProductRows] = useState<InfluencerAvailableProductApiRow[]>([]);
  const [availableProductsLoading, setAvailableProductsLoading] = useState(false);

  const availableProducts = useMemo(
    () => availableProductRows.map(mapInfluencerAvailableRowToProductCard),
    [availableProductRows],
  );

  const isOwnProfile =
    Boolean(viewerInfluencerId && influencer?.id && viewerInfluencerId === influencer.id);

  const canCreateStory = (isOwnProfile || isSuperAdmin) && isAuthenticated;

  const displayHandle = useMemo(() => {
    if (!influencer) return '';
    const u = (influencer.username || '').trim().replace(/^@/, '');
    if (u) return u;
    const sm = influencer.socialMedia || {};
    const pick =
      (sm.tiktok || '').trim() ||
      (sm.instagram || '').trim() ||
      (sm.youtube || '').trim() ||
      (sm.twitter || '').trim();
    return pick.replace(/^@/, '');
  }, [influencer]);

  /** Códigos cortos de campaña; si no hay filas en BD, mostrar promos activas del resumen del perfil. */
  const { campaignRowsForDisplay, primaryPromotionIdForStory } = useMemo(() => {
    let rows: InfluencerPromoShortCodeRow[] = promoShortCodes;
    if (rows.length === 0) {
      rows = (influencer?.recentPromotions ?? [])
        .filter((p) => p.id && (p.status === 'active' || p.status === 'completed'))
        .map((p) => ({
          code: '',
          label: p.status === 'active' ? 'Promoción activa' : 'Promoción',
          referralPrefix: 'L4D',
          expiresAt: null,
          promotion: {
            id: p.id,
            title: p.title || '',
            brand: p.brand || '',
            status: p.status || null,
          },
        }));
    }
    const fromCampaign = rows.find((r) => r.promotion?.id)?.promotion?.id ?? null;
    const fromRecent =
      (influencer?.recentPromotions ?? []).find((p) => p.id && p.status === 'active')?.id ?? null;
    return {
      campaignRowsForDisplay: rows,
      primaryPromotionIdForStory: fromCampaign || fromRecent,
    };
  }, [promoShortCodes, influencer?.recentPromotions]);

  const followerPlatforms = useMemo(() => {
    if (!influencer?.followers) return [];
    const f = influencer.followers;
    return (
      [
        { key: 'instagram', label: 'Instagram', count: f.instagram, handle: influencer.socialMedia?.instagram },
        { key: 'tiktok', label: 'TikTok', count: f.tiktok, handle: influencer.socialMedia?.tiktok },
        { key: 'youtube', label: 'YouTube', count: f.youtube, handle: influencer.socialMedia?.youtube },
        { key: 'twitter', label: 'X', count: f.twitter, handle: influencer.socialMedia?.twitter },
      ] as const
    ).filter((row) => row.count > 0 || (row.handle && String(row.handle).trim()));
  }, [influencer]);

  const isSaved = influencer ? savedIds.includes(influencer.id) : false;

  const toggleSaveProfile = () => {
    if (!influencer) return;
    const next = isSaved ? savedIds.filter((id) => id !== influencer.id) : [...savedIds, influencer.id];
    setSavedIds(next);
    try {
      localStorage.setItem(SAVED_INFLUENCERS_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('localStorage setItem failed', e);
    }
  };

  const handleOpenContact = () => {
    setShowContactModal(true);
    setContactMessage('');
    setContactSenderName('');
    setContactSenderEmail('');
    setContactSuccess(false);
    setContactError(null);
  };

  const handleContactInfluencer = async () => {
    if (!influencer) return;
    const msg = contactMessage.trim();
    if (!msg) {
      setContactError('Escribe un mensaje.');
      return;
    }
    if (!isAuthenticated && !contactSenderEmail.trim()) {
      setContactError('Indica tu email para que el influencer pueda responderte.');
      return;
    }
    setContactSending(true);
    setContactError(null);
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const res = await fetch(apiUrl(`/api/influencers/${influencer.id}/contact`), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: msg,
          ...(isAuthenticated ? {} : { senderName: contactSenderName.trim() || undefined, senderEmail: contactSenderEmail.trim() || undefined }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setContactError(data.message || 'No se pudo enviar el mensaje.');
        return;
      }
      setContactSuccess(true);
      setContactMessage('');
      setTimeout(() => {
        setShowContactModal(false);
        setContactSuccess(false);
      }, 1800);
    } catch {
      setContactError('Error de conexión. Intenta de nuevo.');
    } finally {
      setContactSending(false);
    }
  };

  // Cargar influencer desde API por id (ObjectId) o por slug (ej. damecodigo)
  useEffect(() => {
    if (!influencerSlug) {
      setError('Influencer no encontrado');
      setLoading(false);
      return;
    }
    const slug = influencerSlug.trim();
    let cancelled = false;
    setLoading(true);
    setError(null);
    setInfluencer(null);

    (async () => {
      try {
        const result = await fetchInfluencerByPublicSlug(slug);
        if (cancelled) return;
        if (!result.ok) {
          setError(result.message);
          setInfluencer(null);
          return;
        }
        setInfluencer(result.data as Influencer);
        setError(null);
      } catch {
        if (!cancelled) {
          setError('No se pudo conectar con el API. En local ejecuta: npm run server:dev');
          setInfluencer(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [influencerSlug]);

  useEffect(() => {
    if (!isAuthenticated) {
      setViewerInfluencerId(null);
      return;
    }
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setViewerInfluencerId(null);
      return;
    }
    fetch(apiUrl('/api/influencers/me'), { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.id) setViewerInfluencerId(String(data.data.id));
        else setViewerInfluencerId(null);
      })
      .catch(() => setViewerInfluencerId(null));
  }, [isAuthenticated]);

  // Pujas y colaboraciones: GET /api/influencers/:id/bids (bids reales + aplicaciones aprobadas + cupones QR)
  useEffect(() => {
    if (!influencer?.id) {
      setBids([]);
      return;
    }
    fetch(apiUrl(`/api/influencers/${influencer.id}/bids`))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setBids(data.data);
        } else {
          setBids([]);
        }
      })
      .catch(() => setBids([]));
  }, [influencer?.id]);

  useEffect(() => {
    if (!influencer?.id) {
      setCouponsActivity(null);
      return;
    }
    setCouponsActivityLoading(true);
    fetch(apiUrl(`/api/influencers/${influencer.id}/coupons-activity?limit=500`))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.open && data.redeemed && data.expiredUnused) {
          setCouponsActivity({
            open: data.open,
            redeemed: data.redeemed,
            expiredUnused: data.expiredUnused,
          });
        } else {
          setCouponsActivity({ open: [], redeemed: [], expiredUnused: [] });
        }
      })
      .catch(() => setCouponsActivity({ open: [], redeemed: [], expiredUnused: [] }))
      .finally(() => setCouponsActivityLoading(false));
  }, [influencer?.id]);

  useEffect(() => {
    if (!influencer?.id) {
      setAvailableProductRows([]);
      return;
    }
    setAvailableProductsLoading(true);
    fetch(apiUrl(`/api/influencers/${influencer.id}/available-products`))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setAvailableProductRows(data.data as InfluencerAvailableProductApiRow[]);
        } else {
          setAvailableProductRows([]);
        }
      })
      .catch(() => setAvailableProductRows([]))
      .finally(() => setAvailableProductsLoading(false));
  }, [influencer?.id]);

  useEffect(() => {
    if (!influencer?.id) {
      setQrPromoSummary(null);
      return;
    }
    setQrPromoSummaryLoading(true);
    fetch(apiUrl(`/api/influencers/${influencer.id}/qr-promotions-summary`))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.rows)) {
          setQrPromoSummary({
            rows: data.rows as QrPromotionSummaryRow[],
            tokensWithoutPromotionId: Number(data.tokensWithoutPromotionId) || 0,
          });
        } else {
          setQrPromoSummary({ rows: [], tokensWithoutPromotionId: 0 });
        }
      })
      .catch(() => setQrPromoSummary({ rows: [], tokensWithoutPromotionId: 0 }))
      .finally(() => setQrPromoSummaryLoading(false));
  }, [influencer?.id]);

  useEffect(() => {
    if (!influencer?.id) {
      setPromoShortCodes([]);
      setPromoShortCodesLoading(false);
      return;
    }
    let cancelled = false;
    setPromoShortCodesLoading(true);
    fetch(apiUrl(`/api/influencers/${influencer.id}/promo-short-codes`))
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && Array.isArray(data.data)) {
          setPromoShortCodes(data.data as InfluencerPromoShortCodeRow[]);
          if (typeof data.influencerProfileShortCode === 'string' && data.influencerProfileShortCode.trim()) {
            setInfluencer((prev) =>
              prev ? { ...prev, profileShortCode: data.influencerProfileShortCode.trim() } : prev,
            );
          }
        } else {
          setPromoShortCodes([]);
        }
      })
      .catch(() => {
        if (!cancelled) setPromoShortCodes([]);
      })
      .finally(() => {
        if (!cancelled) setPromoShortCodesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [influencer?.id]);

  const redeemedForChart = couponsActivity?.redeemed ?? [];

  const chartRangeMeta = useMemo(
    () => CHART_RANGE_OPTIONS.find((o) => o.key === chartRange) ?? CHART_RANGE_OPTIONS[0],
    [chartRange],
  );

  const chartBuilt = useMemo(
    () => buildSalesAndBidsChartData(influencer, bids, redeemedForChart, chartRange),
    [influencer, bids, redeemedForChart, chartRange],
  );

  /** Hay canjes reales o uso por promoción: base para el gráfico y aviso de estimaciones. */
  const hasRedeemDataForCharts = useMemo(
    () => hasCouponRedemptionEvidence(redeemedForChart, influencer),
    [redeemedForChart, influencer],
  );

  const chartPeriodHasActivity = useMemo(() => chartShowsActivity(chartBuilt), [chartBuilt]);

  const chartForView = hasRedeemDataForCharts || chartPeriodHasActivity ? chartBuilt : [];

  // Funciones del módulo de pujas
  const handlePlaceBid = (bid: any) => {
    setSelectedBid(bid);
    setShowBidModal(true);
  };

  const handleViewHistory = (bid: any) => {
    setSelectedBid(bid);
    setShowHistoryModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'won': return 'text-blue-600 bg-blue-100';
      case 'lost': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'won': return 'Ganada';
      case 'lost': return 'Perdida';
      case 'expired': return 'Expirada';
      default: return 'Desconocido';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Expirada';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const copyMyIdForPromotions = async () => {
    if (!influencer) return;
    const id = influencer.id;
    try {
      await navigator.clipboard.writeText(id);
      try {
        sessionStorage.setItem(LAST_COPIED_INFLUENCER_ID_KEY, id);
      } catch {
        /* ignore */
      }
      setCopiedInfluencerId(true);
      window.setTimeout(() => setCopiedInfluencerId(false), 2000);
    } catch {
      try {
        sessionStorage.setItem(LAST_COPIED_INFLUENCER_ID_KEY, id);
      } catch {
        /* ignore */
      }
      window.prompt('Copia tu ID de influencer:', id);
    }
  };

  const copyPromoShortCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedPromoCode(code);
      window.setTimeout(() => setCopiedPromoCode((c) => (c === code ? null : c)), 2000);
    } catch {
      window.prompt('Copiar código de campaña:', code);
    }
  };

  const handleDownloadProfilePdf = async () => {
    if (!influencer) return;
    setPdfLoading(true);
    try {
      await generateInfluencerProfilePdf({
        id: influencer.id,
        name: influencer.name,
        username: influencer.username,
        publicSlug: influencer.publicSlug,
        avatar: influencer.avatar,
        status: influencer.status,
        location: influencer.location,
        bio: influencer.bio,
        joinDate: influencer.joinDate,
        totalFollowers: influencer.totalFollowers,
        engagement: influencer.engagement,
        followers: influencer.followers,
        socialMedia: influencer.socialMedia,
        categories: influencer.categories,
        profileShortCode: influencer.profileShortCode,
        couponStats: influencer.couponStats,
        totalEarnings: influencer.totalEarnings,
        completedPromotions: influencer.completedPromotions,
        activePromotions: influencer.activePromotions,
        rating: influencer.rating,
        redeemedCoupons: couponsActivity?.redeemed?.length ?? influencer.couponStats?.totalSales,
        promoShortCodes: promoShortCodes.map((row) => ({
          code: row.code,
          label: row.label,
          promotionTitle: row.promotion?.title ?? null,
        })),
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo generar el PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const generateStoryCard = async (opts: {
    shortCode?: string;
    promotionId?: string;
    promotionTitle?: string | null;
  }) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setStoryError('Inicia sesión con tu cuenta de influencer para generar la story.');
      return;
    }
    const busyKey = opts.shortCode || opts.promotionId || 'story';
    setStoryGeneratingKey(busyKey);
    setStoryError(null);
    const body: { shortCode?: string; promotionId?: string } = {};
    if (opts.shortCode?.trim()) body.shortCode = opts.shortCode.trim();
    if (opts.promotionId?.trim()) body.promotionId = opts.promotionId.trim();
    try {
      const res = await fetch(apiUrl('/api/influencers/app/story-cards'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(
          typeof data.message === 'string' ? data.message : `No se pudo generar la imagen (${res.status})`,
        );
      }
      const codeShown = String(data.shortCode || opts.shortCode || '');
      if (data.image?.url) {
        setStoryPreview({
          url: apiUrl(String(data.image.url)),
          shortCode: codeShown,
          discountPercentage: Number(data.discountPercentage) || 0,
          title: opts.promotionTitle ?? data.promotion?.title ?? null,
        });
        return;
      }
      const hint =
        data.nanoBanana?.message ||
        (data.promptForClient
          ? 'El servidor no generó archivo; revisa gemini-api-key en .env del API.'
          : null);
      throw new Error(hint || 'La API no devolvió imagen. Intenta de nuevo en unos segundos.');
    } catch (e) {
      setStoryError(e instanceof Error ? e.message : 'Error al generar story');
    } finally {
      setStoryGeneratingKey(null);
    }
  };

  const renderStoryButton = (
    key: string,
    opts: { shortCode?: string; promotionId?: string; promotionTitle?: string | null },
  ) => {
    if (!canCreateStory) return null;
    const busy = storyGeneratingKey === key;
    return (
      <button
        type="button"
        disabled={storyGeneratingKey !== null}
        onClick={() => generateStoryCard({ ...opts, promotionTitle: opts.promotionTitle })}
        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600/90 hover:bg-violet-500 disabled:opacity-60 px-2.5 py-1.5 text-xs font-medium text-white transition-colors"
        title="Generar story vertical 9:16 con código y descuento (Gemini Nano Banana)"
      >
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
            Generando…
          </>
        ) : (
          <>
            <ImagePlus className="w-4 h-4 shrink-0" aria-hidden />
            Story 9:16
          </>
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil del influencer...</p>
        </div>
      </div>
    );
  }

  if (error || !influencer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Influencer no encontrado</h2>
          <p className="text-gray-600 mb-6">{error || 'El perfil que buscas no existe'}</p>
          <Link
            to="/influencers"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Volver al Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del Perfil */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <Link
              to="/influencers"
              className="flex items-center gap-2 text-pink-100 hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al Marketplace
            </Link>
            <div className="flex flex-wrap items-stretch sm:items-center justify-stretch sm:justify-end gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={copyMyIdForPromotions}
                className="flex flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-white text-purple-800 hover:bg-pink-50 transition-all shadow-sm min-w-0"
                title="Copiar el ID técnico del influencer (MongoDB)"
              >
                {copiedInfluencerId ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 shrink-0" />
                    <span className="text-left leading-snug">Copiar ID técnico del perfil</span>
                  </>
                )}
              </button>
              <Link
                to={`/redenciones-en-vivo?influencerId=${encodeURIComponent(influencer.id)}`}
                className="flex flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-white/15 border border-white/25 text-white hover:bg-white/25 transition-all min-w-0"
                title="Cupones redimidos filtrados por tu influencerId"
              >
                <Ticket className="w-5 h-5 shrink-0" />
                <span className="text-left leading-snug">Redenciones en vivo (solo tú)</span>
              </Link>
              <Link
                to={`/influencer/${encodeURIComponent(influencerSlug || '')}/tienda`}
                className="flex flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-all min-w-0 shadow-sm"
                title="Ver tienda con cupones disponibles (aprobados por la marca)"
              >
                <LayoutGrid className="w-5 h-5 shrink-0" aria-hidden />
                <span className="text-left leading-snug">Ver tienda</span>
              </Link>
              {viewerInfluencerId === influencer.id ? (
                <Link
                  to="/dashboard/influencer?hub=ugc"
                  className="flex flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold bg-amber-300 text-gray-900 hover:bg-amber-200 transition-all min-w-0 shadow-md ring-2 ring-white/30"
                  title="Editar vitrina UGC: enlaces a piezas y frases públicas"
                >
                  <LayoutGrid className="w-5 h-5 shrink-0 text-gray-900" />
                  <span className="text-left leading-snug">Mi perfil UGC</span>
                </Link>
              ) : null}
              <button
                type="button"
                onClick={handleDownloadProfilePdf}
                disabled={pdfLoading}
                className="flex flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-white text-purple-800 hover:bg-pink-50 transition-all shadow-sm min-w-0 disabled:opacity-60"
                title="Descargar ficha PDF (carta): métricas, códigos y QR"
              >
                {pdfLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 shrink-0 animate-spin" aria-hidden />
                    Generando PDF…
                  </>
                ) : (
                  <>
                    <FileDown className="w-5 h-5 shrink-0" aria-hidden />
                    <span className="text-left leading-snug">Descargar ficha PDF</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={toggleSaveProfile}
                className={`flex flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  isSaved
                    ? 'bg-white/25 text-white'
                    : 'bg-white/15 text-pink-100 hover:bg-white/25 hover:text-white'
                }`}
                title={isSaved ? 'Quitar de guardados' : 'Guardar perfil'}
              >
                <Heart className={`w-5 h-5 shrink-0 ${isSaved ? 'fill-current' : ''}`} />
                Guardar perfil
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="relative">
              <img 
                src={mediaUrl(influencer.avatar, influencer.name)} 
                alt={influencer.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.onerror = null;
                  img.src = mediaUrl('', influencer.name);
                }}
              />
              <div className="absolute -bottom-2 -right-2 flex flex-col gap-2">
                {influencer.hot && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    HOT
                  </span>
                )}
                {influencer.featured && (
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    FEATURED
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3">{influencer.name}</h1>
              {influencer.profileShortCode ? (
                <div className="mb-4 max-w-2xl rounded-xl border border-emerald-400/35 bg-emerald-950/40 px-3 py-2.5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-emerald-200/95 text-xs font-semibold uppercase tracking-wide mb-1">
                    <FileCode2 className="w-3.5 h-3.5 shrink-0" aria-hidden />
                    Código corto de perfil
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <code className="text-lg md:text-xl font-mono font-bold tracking-wider text-white shrink-0">
                      {influencer.profileShortCode}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyPromoShortCode(influencer.profileShortCode!)}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 px-2.5 py-1.5 text-xs font-medium text-white transition-colors"
                      title="Copiar código"
                    >
                      {copiedPromoCode === influencer.profileShortCode ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 shrink-0" aria-hidden />
                          Copiar
                        </>
                      )}
                    </button>
                    {primaryPromotionIdForStory
                      ? renderStoryButton(`profile-${influencer.profileShortCode}`, {
                          shortCode: influencer.profileShortCode,
                          promotionId: primaryPromotionIdForStory,
                        })
                      : null}
                  </div>
                  <p className="text-xs text-emerald-100/85 mt-1.5 leading-relaxed">
                    Se asigna al registrarte. En la app, el buscador puede resolverlo si el servidor tiene configurada una
                    promoción por defecto (<code className="rounded bg-black/25 px-1 font-mono text-[11px]">INFLUENCER_PROFILE_SHORT_CODE_DEFAULT_PROMOTION_ID</code>).
                    Los códigos de campaña (debajo) enlazan una promoción concreta.
                  </p>
                </div>
              ) : null}
              <div className="mb-4 max-w-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 text-pink-200/95 text-xs font-semibold uppercase tracking-wide">
                    <Megaphone className="w-3.5 h-3.5 shrink-0" aria-hidden />
                    Códigos cortos para rastrear promociones (app)
                  </div>
                  {canCreateStory && primaryPromotionIdForStory ? (
                    <span className="text-[11px] text-violet-200/90 font-normal normal-case tracking-normal">
                      Story 9:16 (Nano Banana)
                    </span>
                  ) : null}
                </div>
                {!isAuthenticated ? (
                  <p className="text-xs text-amber-200/95 mb-2 rounded-lg border border-amber-400/30 bg-amber-950/30 px-2.5 py-2">
                    <Link to="/login" className="underline font-medium text-amber-50">
                      Inicia sesión
                    </Link>{' '}
                    con la cuenta vinculada a este influencer para ver el botón «Story 9:16».
                  </p>
                ) : isAuthenticated && !isOwnProfile && !isSuperAdmin ? (
                  <p className="text-xs text-amber-100/95 mb-2 rounded-lg border border-amber-300/20 bg-black/20 px-2.5 py-2">
                    Estás logueado, pero este perfil no es el tuyo. Solo el influencer dueño (o admin) puede generar
                    la story.
                  </p>
                ) : isAuthenticated && isOwnProfile === false && viewerInfluencerId === null ? (
                  <p className="text-xs text-amber-100/95 mb-2 rounded-lg border border-amber-300/20 bg-black/20 px-2.5 py-2">
                    Tu usuario no tiene perfil influencer vinculado en{' '}
                    <code className="font-mono text-[11px]">/api/influencers/me</code>.
                  </p>
                ) : null}
                {storyError ? (
                  <p className="text-xs text-red-200 mb-2 rounded-lg border border-red-400/35 bg-red-950/40 px-2.5 py-2">
                    {storyError}
                  </p>
                ) : null}
                {promoShortCodesLoading ? (
                  <p className="text-sm text-pink-100/95">Cargando códigos de campaña…</p>
                ) : campaignRowsForDisplay.length === 0 ? (
                  <p className="text-sm text-pink-100/90 leading-relaxed">
                    Aún no hay códigos alfanuméricos activos ni promociones recientes en este perfil. Cuando existan,
                    podrás copiarlos aquí e usarlos en el buscador de la app.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {promoShortCodes.length === 0 && campaignRowsForDisplay.length > 0 ? (
                      <li className="text-xs text-amber-100/95 rounded-lg border border-amber-300/25 bg-amber-950/25 px-3 py-2">
                        Promociones del perfil (aún sin código corto en BD). Ejecuta el backfill en servidor para
                        generar códigos por campaña.
                      </li>
                    ) : null}
                    {campaignRowsForDisplay.map((row) => (
                      <li
                        key={row.code || row.promotion?.id || row.label}
                        className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-black/25 border border-white/20 px-3 py-2.5 backdrop-blur-sm"
                      >
                        {row.code ? (
                          <code className="text-lg md:text-xl font-mono font-bold tracking-wider text-white shrink-0">
                            {row.code}
                          </code>
                        ) : (
                          <span className="text-sm font-semibold text-amber-100 shrink-0">Sin código corto</span>
                        )}
                        <div className="flex-1 min-w-[10rem] text-sm text-pink-50/95">
                          {row.promotion ? (
                            <>
                              <span className="font-medium text-white">
                                {[row.promotion.brand, row.promotion.title].filter(Boolean).join(' · ') ||
                                  'Promoción vinculada'}
                              </span>
                              {row.label ? (
                                <span className="block text-xs text-pink-100/80 mt-0.5">{row.label}</span>
                              ) : null}
                              {row.expiresAt ? (
                                <span className="block text-xs text-pink-100/75 mt-0.5">
                                  Válido hasta {formatDate(row.expiresAt)}
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-pink-100/85">Promoción asociada no disponible</span>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {row.promotion?.id ? (
                            <Link
                              to={`/promotion-details/${row.promotion.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-xs font-medium text-white"
                            >
                              Ver promo
                            </Link>
                          ) : null}
                          {row.promotion?.id
                            ? renderStoryButton(row.code || row.promotion.id, {
                                shortCode: row.code || influencer.profileShortCode || undefined,
                                promotionId: row.promotion.id,
                                promotionTitle: row.promotion?.title ?? row.label,
                              })
                            : null}
                          {row.code ? (
                          <button
                            type="button"
                            onClick={() => copyPromoShortCode(row.code)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 px-2.5 py-1.5 text-xs font-medium text-white transition-colors"
                            title={`Copiar ${row.code}`}
                          >
                            {copiedPromoCode === row.code ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 shrink-0" aria-hidden />
                                Copiar
                              </>
                            )}
                          </button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-pink-100/85 mt-2">
                  Equivale al flujo{' '}
                  <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">GET /api/discount-qr/codes/…</code>{' '}
                  — introdúcelo en el buscador de DameCodigo.
                </p>
              </div>
              <details className="mb-4 max-w-2xl text-pink-100/85 group">
                <summary className="cursor-pointer text-xs font-medium text-pink-100 hover:text-white list-none flex items-center gap-2 [&::-webkit-details-marker]:hidden">
                  <FileCode2 className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  <span className="underline-offset-2 group-open:underline">ID técnico del perfil (integraciones)</span>
                </summary>
                <div className="mt-2 rounded-lg bg-black/20 border border-white/15 px-3 py-2 flex flex-wrap items-center gap-2">
                  <code className="text-xs font-mono text-white break-all flex-1 min-w-[12rem]">
                    {influencer.id}
                  </code>
                  <button
                    type="button"
                    onClick={copyMyIdForPromotions}
                    className="shrink-0 text-xs font-medium underline hover:text-white"
                  >
                    {copiedInfluencerId ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </details>
              {displayHandle ? (
                <p className="text-2xl text-pink-100 mb-2">@{displayHandle}</p>
              ) : null}
              <p className="text-sm text-pink-100/90 mb-3 flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    influencer.status === 'active' || influencer.status === 'verified'
                      ? 'bg-emerald-500/30 text-emerald-100'
                      : 'bg-white/15 text-pink-100'
                  }`}
                >
                  {influencer.status}
                </span>
                {influencer.joinDate ? (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" aria-hidden />
                    Desde {formatDate(influencer.joinDate)}
                  </span>
                ) : null}
              </p>
              {followerPlatforms.length > 0 ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  {followerPlatforms.map((row) => (
                    <span
                      key={row.key}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-xs text-pink-50"
                    >
                      {row.label}
                      {row.count > 0 ? (
                        <span className="font-semibold text-white tabular-nums">
                          {row.count >= 1000 ? `${(row.count / 1000).toFixed(1)}K` : row.count}
                        </span>
                      ) : null}
                      {row.handle ? (
                        <span className="text-pink-100/90">@{String(row.handle).replace(/^@/, '')}</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="text-lg text-pink-100 leading-relaxed max-w-3xl">
                {influencer.bio?.trim() || 'Sin biografía publicada.'}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {influencer.categories.map((category, index) => (
                  <span key={index} className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 text-center">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">{(influencer.totalFollowers / 1000).toFixed(1)}K</div>
                <div className="text-sm text-pink-100">Seguidores</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">{influencer.engagement}%</div>
                <div className="text-sm text-pink-100">Engagement</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Resumen */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <EyeIcon className="w-5 h-5 text-purple-500" />
            Resumen del Perfil
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Promociones completadas</p>
              <p className="text-2xl font-bold text-gray-900">{influencer.completedPromotions}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Promociones activas</p>
              <p className="text-2xl font-bold text-gray-900">{influencer.activePromotions}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Ingresos totales (USD estimado)</p>
              <p className="text-2xl font-bold text-gray-900">${influencer.totalEarnings.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Canjes × comisión por venta (puja o tarifa de solicitud aprobada).</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Valoración</p>
              <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                {influencer.rating}
              </p>
            </div>
          </div>
          {influencer.location && (
            <p className="mt-4 text-gray-600 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {influencer.location}
            </p>
          )}
        </section>

        <InfluencerUgcShowcase
          influencerName={influencer.name}
          ugc={influencer.ugcProfile}
          ownerEditHref={viewerInfluencerId === influencer.id ? '/dashboard/influencer?hub=ugc' : undefined}
        />

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-purple-500" aria-hidden />
            Productos disponibles
          </h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Ofertas y productos del catálogo vinculados a campañas donde la marca ya aprobó la colaboración con este
            influencer. Solo se muestran promociones activas y vigentes.
          </p>
          {availableProductsLoading ? (
            <div className="flex items-center gap-2 text-gray-600 py-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" aria-hidden />
              Cargando productos…
            </div>
          ) : availableProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 py-10 px-4 text-center">
              <p className="text-gray-700 mb-1">Aún no hay productos publicados en este perfil.</p>
              <p className="text-sm text-gray-500">
                Cuando una marca apruebe una solicitud de campaña, las tarjetas aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 xl:columns-3 gap-6 [column-fill:_balance]">
              {availableProductRows.map((row, index) => {
                const product = availableProducts[index];
                if (!product) return null;
                return (
                  <div key={row.cardKey} className="break-inside-avoid mb-6">
                    <ProductCard product={product} masonryTier={masonryTierFromId(product.id, index)} />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pujas - justo después del resumen */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-500" />
            Sistema de Pujas
          </h2>
          <p className="text-gray-600 mb-6">
            Las pujas definen la comisión en USD que recibirá el influencer por cada venta (cupón redimido). Es una comisión por venta: en dólares estadounidenses (USD), con mínimo de $1 USD por venta. Participa en las subastas para contratar a este influencer.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pujas Activas</p>
                  <p className="text-2xl font-bold text-gray-900">{bids.filter(b => b.status === 'active').length}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Pujas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bids.reduce((sum, bid) => sum + (Number(bid.totalBids) || 0), 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{bids.length} campaña(s)</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comisión por venta promedio (USD)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${bids.length > 0 ? (bids.reduce((sum, bid) => sum + (Number(bid.currentBid) || 0), 0) / bids.length).toFixed(2) : '0.00'} USD
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Próximas a Expirar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bids.filter(b => {
                      const end = new Date(b.endDate).getTime();
                      const now = new Date().getTime();
                      const diff = end - now;
                      return diff > 0 && diff <= 24 * 60 * 60 * 1000;
                    }).length}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {bids.map((bid) => (
              <div key={bid.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{bid.campaignTitle}</h4>
                    <p className="text-gray-600">{bid.brandName}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bid.status)}`}>
                      {getStatusText(bid.status)}
                    </span>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Comisión por venta actual (USD):</span>
                      <div className="text-2xl font-bold text-green-600">${(Number(bid.currentBid) || 0).toFixed(2)} USD</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Requisitos</p>
                    <div className="space-y-1">
                      {(Array.isArray(bid.requirements) ? bid.requirements : []).slice(0, 3).map((req: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {req}
                        </div>
                      ))}
                      {Array.isArray(bid.requirements) && bid.requirements.length > 3 && (
                        <p className="text-sm text-gray-500">+{bid.requirements.length - 3} más</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Métricas Objetivo</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Alcance:</span>
                        <span className="font-medium">{((bid.targetMetrics?.reach ?? 0) / 1000).toFixed(1)}K</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Engagement:</span>
                        <span className="font-medium">{bid.targetMetrics?.engagement ?? 0}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Conversiones:</span>
                        <span className="font-medium">{bid.targetMetrics?.conversions ?? 0}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Comisión por venta (USD)</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Comisión inicial por venta:</span>
                        <span className="font-medium">${(Number(bid.initialBid) || 0).toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Incremento:</span>
                        <span className="font-medium">${(Number(bid.bidIncrement) || 0).toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total pujas:</span>
                        <span className="font-medium">{bid.totalBids ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tiempo restante:</span>
                        <span className={`font-medium ${getTimeRemaining(bid.endDate) === 'Expirada' ? 'text-red-600' : 'text-green-600'}`}>
                          {getTimeRemaining(bid.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Link
                      to={(bid as { smartContractPagePath?: string }).smartContractPagePath || `/promocion/${bid.promotionId}/smart-contract`}
                      className="inline-flex items-center gap-1.5 text-purple-600 hover:text-purple-800 font-medium"
                    >
                      <FileCode2 className="h-4 w-4" />
                      Smart contract (Polygon)
                    </Link>
                    <a
                      href={
                        (bid as { polygonscanUrl?: string }).polygonscanUrl ||
                        getPolygonscanAddressUrl(
                          (bid as { smartContractAddress?: string }).smartContractAddress ||
                            getDisplayContractAddress(String(bid.promotionId))
                        )
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
                    >
                      Ver en Polygonscan
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <span
                      className="text-xs text-gray-400 font-mono"
                      title={
                        (bid as { smartContractAddress?: string }).smartContractAddress ||
                        getDisplayContractAddress(String(bid.promotionId))
                      }
                    >
                      {shortenAddress(
                        (bid as { smartContractAddress?: string }).smartContractAddress ||
                          getDisplayContractAddress(String(bid.promotionId)),
                        5
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Inicia: {formatDate(bid.startDate)}</span>
                    <span>•</span>
                    <span>Termina: {formatDate(bid.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleViewHistory(bid)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Ver Historial
                    </button>
                    {bid.status === 'active' && (
                      <button
                        onClick={() => handlePlaceBid(bid)}
                        className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Pujar
                      </button>
                    )}
                  </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {bids.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <DollarSign className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin campañas que mostrar aquí</h3>
              <p className="text-gray-500">
                Cuando haya subastas registradas, solicitudes aprobadas vigentes o cupones QR de este perfil, aparecerán como tarjetas encima.
              </p>
            </div>
          )}
        </section>

        {/* Promociones */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            Promociones
          </h2>
          {influencer.recentPromotions?.length > 0 ? (
            <div className="space-y-3">
              {influencer.recentPromotions.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{p.title}</p>
                    <p className="text-sm text-gray-500">{p.brand} · {p.date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-sm ${p.status === 'completed' ? 'bg-green-100 text-green-800' : p.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                      {p.status}
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-1">${p.earnings?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-4">No hay promociones recientes.</p>
          )}
        </section>

        {isInfluencer && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-500" />
            Pagos
          </h2>
          {influencer.recentPayments?.length > 0 ? (
            <div className="space-y-3">
              {influencer.recentPayments.map((pay) => (
                <div key={pay.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{pay.description || pay.type}</p>
                    <p className="text-sm text-gray-500">{pay.date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-sm ${pay.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {pay.status}
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-1">${pay.amount?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-4">No hay pagos recientes.</p>
          )}
        </section>
        )}

        {/* Cupones QR por promoción (público) */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-600" />
            Promociones con cupones QR y redenciones
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Campañas donde este perfil tiene cupones emitidos (<code className="text-xs bg-gray-100 px-1 rounded">influencerId</code>{' '}
            en el payload) o puja vigente en fechas sin cupones aún registrados en MongoDB. Las cifras no tienen el límite del
            listado de actividad: son todas las fichas conocidas agrupadas por promoción.
          </p>
          {qrPromoSummaryLoading && (
            <p className="text-sm text-gray-500 py-6">Cargando resumen por promoción…</p>
          )}
          {!qrPromoSummaryLoading && qrPromoSummary && qrPromoSummary.rows.length === 0 && (
            <p className="text-gray-500 py-4">
              No hay campañas con cupones agrupados por <code className="text-xs bg-gray-100 px-1 rounded">promotionId</code>,
              ni puja vigente en fechas con campaña pendiente sin cupón.
            </p>
          )}
          {!qrPromoSummaryLoading && qrPromoSummary && qrPromoSummary.rows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Promoción</th>
                    <th className="px-3 py-2.5 font-medium">Estado catálogo</th>
                    <th className="px-3 py-2.5 font-medium whitespace-nowrap">Puja</th>
                    <th className="px-3 py-2.5 font-medium tabular-nums text-center">Abiertos</th>
                    <th className="px-3 py-2.5 font-medium tabular-nums text-center text-emerald-800">Canjeados</th>
                    <th className="px-3 py-2.5 font-medium tabular-nums text-center">Caducados</th>
                    <th className="px-3 py-2.5 font-medium tabular-nums text-center">Total</th>
                    <th className="px-3 py-2.5 font-medium">Último canje</th>
                    <th className="px-3 py-2.5 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {qrPromoSummary.rows.map((row) => {
                    const title = row.title || 'Sin título en catálogo';
                    const subtitle = row.brand ? row.brand : null;
                    return (
                      <tr key={row.promotionId} className="hover:bg-gray-50/80">
                        <td className="px-3 py-2.5 align-top min-w-[10rem]">
                          <p className="font-medium text-gray-900">{title}</p>
                          {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
                          <p className="text-[10px] text-gray-400 font-mono mt-1" title={row.promotionId}>
                            {row.promotionId.length > 18
                              ? `${row.promotionId.slice(0, 10)}…${row.promotionId.slice(-6)}`
                              : row.promotionId}
                          </p>
                          {row.noQrActivityYet ? (
                            <p className="text-[11px] text-amber-700 mt-1">Sin cupones emitidos aún en este ID</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 align-top whitespace-nowrap">
                          {row.catalogActiveWindow ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-900 px-2 py-0.5 text-xs font-medium">
                              Activa
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs">
                              No activa
                            </span>
                          )}
                          {row.promotionStatus ? (
                            <span className="block text-[10px] text-gray-500 mt-1">BD: {row.promotionStatus}</span>
                          ) : (
                            <span className="block text-[10px] text-gray-400 mt-1">Sin ficha Promotion</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 align-top text-xs text-gray-700">
                          {row.bidStatus ? <span>{row.bidStatus}</span> : <span className="text-gray-400">—</span>}
                          {row.bidAmountUsd != null && Number.isFinite(row.bidAmountUsd) ? (
                            <span className="block text-gray-600 tabular-nums">${row.bidAmountUsd.toFixed(2)} USD</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums">{row.open}</td>
                        <td className="px-3 py-2.5 text-center tabular-nums font-medium text-emerald-700">{row.redeemed}</td>
                        <td className="px-3 py-2.5 text-center tabular-nums text-gray-600">{row.expiredUnused}</td>
                        <td className="px-3 py-2.5 text-center tabular-nums font-medium">{row.totalTokens}</td>
                        <td className="px-3 py-2.5 align-top text-xs text-gray-600 whitespace-nowrap">
                          {row.lastRedeemedAt ? formatDate(row.lastRedeemedAt) : '—'}
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <div className="flex flex-col gap-1.5">
                            <Link
                              to={`/promotion-details/${row.promotionId}`}
                              className="text-purple-600 hover:text-purple-800 text-xs font-medium"
                            >
                              Ver campaña
                            </Link>
                            <Link
                              to={`/redenciones-en-vivo?influencerId=${encodeURIComponent(influencer.id)}&promotionId=${encodeURIComponent(row.promotionId)}`}
                              className="text-emerald-700 hover:text-emerald-900 text-xs font-medium"
                            >
                              Redenciones (filtro)
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!qrPromoSummaryLoading && qrPromoSummary && qrPromoSummary.tokensWithoutPromotionId > 0 ? (
            <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Hay <strong>{qrPromoSummary.tokensWithoutPromotionId}</strong> cupón(es) con{' '}
              <code className="text-[11px]">promotionId</code> vacío o no parseable en el payload; no aparecen en la tabla por
              campaña.
            </p>
          ) : null}
        </section>

        {/* Analytics */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Analytics
          </h2>

          {!couponsActivityLoading && couponsActivity && (
            <div className="mb-6 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white px-4 py-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight">Cupones QR descuentos (Mongo)</h3>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed max-w-xl">
                      <strong className="font-semibold text-green-700">{couponsActivity.redeemed.length}</strong> canjes con tu{' '}
                      <code className="bg-emerald-100/90 px-1 rounded text-emerald-900 text-[11px]">influencerId</code>;{' '}
                      <strong className="font-semibold">{couponsActivity.open.length}</strong> vigentes sin canje.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/redenciones-en-vivo?influencerId=${encodeURIComponent(influencer.id)}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 text-white px-3 py-2 text-xs font-medium hover:bg-emerald-800"
                  >
                    <TrendingUpIcon className="w-4 h-4 shrink-0" />
                    Panel en vivo (tu ID)
                  </Link>
                  {influencerSlug && !/^[a-f0-9]{24}$/i.test(influencerSlug) ? (
                    <Link
                      to={`/redenciones-en-vivo?influencerSlug=${encodeURIComponent(influencerSlug.trim())}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-emerald-900 hover:bg-emerald-50"
                    >
                      Por slug ({influencerSlug})
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {!hasRedeemDataForCharts && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-100 text-amber-950 px-4 py-3 text-sm leading-relaxed">
              <strong className="font-semibold">Aún no hay datos de cupones redimidos</strong>{' '}
              para hacer estimaciones fiables sobre ventas por canje. Las cifras resumidas pueden seguir en cero; el gráfico
              reflejará barras cuando existan <strong>redenciones registradas</strong> o métricas de pujas con fechas en la semana.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Cupones totales</p>
              <p className="text-xl font-bold text-gray-900">{influencer.couponStats?.totalCoupons ?? 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Cupones activos</p>
              <p className="text-xl font-bold text-gray-900">{influencer.couponStats?.activeCoupons ?? 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Ventas totales</p>
              <p className="text-xl font-bold text-gray-900">${(influencer.couponStats?.totalSales ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Comisión total</p>
              <p className="text-xl font-bold text-gray-900">${(influencer.couponStats?.totalCommission ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Conversión media</p>
              <p className="text-xl font-bold text-gray-900">{(influencer.couponStats?.averageConversion ?? 0)}%</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Evolución en el tiempo</h3>
              <div
                className="flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-1"
                role="group"
                aria-label="Rango del gráfico"
              >
                {CHART_RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setChartRange(opt.key)}
                    aria-pressed={chartRange === opt.key}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      chartRange === opt.key
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-white hover:text-gray-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {chartRangeMeta.description}: ventas por{' '}
              <strong>{chartBuilt[0]?.label.startsWith('Sem ') ? 'semana' : 'día'}</strong> de cupón redimido y comisión
              de pujas (USD). Sin redenciones reales no hay barras estimadas.
            </p>
            {couponsActivityLoading && (
              <p className="text-sm text-gray-500 mb-3">Cargando actividad de cupones…</p>
            )}
            {!couponsActivityLoading &&
              hasRedeemDataForCharts &&
              !chartPeriodHasActivity &&
              redeemedForChart.length > 0 && (
              <p className="text-sm text-gray-600 mb-3 rounded-md bg-slate-50 border border-slate-100 px-3 py-2">
                No hubo cupones redimidos en {chartRangeMeta.description.toLowerCase()}; revisa los listados de abajo (puede
                haber canjes en otras fechas).
              </p>
            )}
            <SalesAndBidsRealtimeChart data={chartForView} />
          </div>

          <CouponQrActivitySection
            theme="profile"
            activity={couponsActivity}
            loading={couponsActivityLoading}
            emptyMessage="Todavía no hay cupones vinculados a este influencer en el sistema de descuentos QR."
          />
        </section>

        {/* Footer con acciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleOpenContact}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 text-lg"
              >
                <Mail className="w-6 h-6" />
                Contactar Influencer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Contactar Influencer - mensaje para que lo lea al iniciar sesión */}
      {showContactModal && influencer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Dejar mensaje a {influencer.name}</h3>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Cerrar"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              El influencer verá tu mensaje cuando inicie sesión en su cuenta.
            </p>
            {!isAuthenticated && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre</label>
                  <input
                    type="text"
                    value={contactSenderName}
                    onChange={(e) => setContactSenderName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nombre o marca"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tu email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={contactSenderEmail}
                    onChange={(e) => setContactSenderEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje <span className="text-red-500">*</span></label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Escribe tu mensaje. El influencer lo leerá al iniciar sesión."
                disabled={contactSending}
              />
            </div>
            {contactError && (
              <p className="text-sm text-red-600 mb-3">{contactError}</p>
            )}
            {contactSuccess && (
              <p className="text-sm text-green-600 mb-3">Mensaje enviado. El influencer lo verá al iniciar sesión.</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={contactSending}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleContactInfluencer}
                disabled={contactSending}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {contactSending ? 'Enviando…' : 'Enviar mensaje'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story card preview (Nano Banana / Gemini) */}
      {storyPreview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-preview-title"
        >
          <div className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-2xl border border-violet-400/30 bg-gray-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <h3 id="story-preview-title" className="text-lg font-semibold text-white">
                  Story para redes
                </h3>
                <p className="text-xs text-violet-200/90 mt-0.5">
                  {storyPreview.shortCode} · −{storyPreview.discountPercentage}%
                  {storyPreview.title ? ` · ${storyPreview.title}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStoryPreview(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 flex flex-col items-center gap-4">
              <img
                src={storyPreview.url}
                alt={`Story promocional ${storyPreview.shortCode}`}
                className="w-full max-w-[280px] rounded-xl border border-white/15 shadow-lg object-contain"
              />
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <a
                  href={storyPreview.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
                >
                  <Download className="w-4 h-4 shrink-0" aria-hidden />
                  Descargar
                </a>
                <button
                  type="button"
                  onClick={() => setStoryPreview(null)}
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                >
                  Cerrar
                </button>
              </div>
              <p className="text-center text-[11px] text-gray-400 leading-relaxed">
                Formato 9:16 para Instagram, TikTok o WhatsApp Status. Generado con Gemini (Nano Banana).
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Bid Modal */}
      {showBidModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Realizar Puja</h3>
              <button
                onClick={() => setShowBidModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Campaña: <span className="font-semibold">{selectedBid.campaignTitle}</span></p>
              <p className="text-sm text-gray-600 mb-2">Comisión por venta actual: <span className="font-semibold">${selectedBid.currentBid.toFixed(2)} USD</span></p>
              <p className="text-sm text-gray-600 mb-4">Incremento mínimo: <span className="font-semibold">${selectedBid.bidIncrement.toFixed(2)} USD</span></p>
              <p className="text-xs text-gray-500 mb-2">La puja es la comisión por venta (por cada cupón redimido), en USD. Mínimo $1 USD por venta.</p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu comisión por venta (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  min={selectedBid.currentBid + selectedBid.bidIncrement}
                  step={selectedBid.bidIncrement}
                  defaultValue={selectedBid.currentBid + selectedBid.bidIncrement}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBidModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Confirmar Puja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Historial de Pujas - {selectedBid.campaignTitle}</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-3">
              {selectedBid.bidHistory.map((history: any, index: number) => (
                <div key={history.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      history.status === 'active' ? 'bg-green-500' : 
                      history.status === 'outbid' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{history.bidderName}</p>
                      <p className="text-sm text-gray-500 capitalize">{history.bidderType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg text-green-600">${history.amount.toFixed(2)} USD</p>
                    <p className="text-sm text-gray-500">{formatDate(history.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
