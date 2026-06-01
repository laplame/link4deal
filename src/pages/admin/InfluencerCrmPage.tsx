import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Loader2,
  Lock,
  Smartphone,
  Store,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Save,
  X,
  ShieldCheck,
  ShieldX,
  LayoutGrid,
  List,
  DollarSign,
  RefreshCw,
  Radio,
  Instagram,
  Inbox,
  CheckCircle,
  XCircle,
  Zap,
  Link2,
} from 'lucide-react';
import CrmPipelineBoard from '../../components/admin/CrmPipelineBoard';
import CrmPagination from '../../components/admin/CrmPagination';
import type { CrmPaginationMeta } from '../../services/adminCrm';
import { useAuth } from '../../context/AuthContext';
import {
  clearAdminPinUnlockSession,
  getAdminAccessPin,
  isAdminPinUnlockSession,
  setAdminPinUnlockSession,
} from '../../config/adminAccess';
import { apiUrl, mediaUrl } from '../../utils/apiUrl';
import {
  fetchCrmStats,
  fetchCrmInfluencers,
  fetchCrmInfluencerDetail,
  fetchCrmRedirectApplications,
  fetchCrmPromotionApplications,
  fetchCrmInfluencerCategories,
  bulkApplyCrmPromotion,
  searchPromotionsForBulk,
  approveCrmPromotionApplication,
  rejectCrmPromotionApplication,
  assignCrmRedirectPromotion,
  type CrmRedirectApplicationsPack,
  type CrmPromotionApplicationRow,
  type CrmApplicationsPagination,
  type PromotionPickItem,
  patchCrmInfluencer,
  patchCrmOutreach,
  reviewCrmIdentityVerification,
  fetchCrmPipelineBoard,
  fetchCrmMonetizationBoard,
  fetchCrmMonetization,
  fetchCrmInfluencerLiveActivity,
  moveCrmLeadStage,
  moveCrmMonetizationStage,
  patchCrmMonetization,
  CRM_PIPELINE_STAGES,
  CRM_MONETIZATION_STAGES,
  type CrmInfluencerRow,
  type CrmInfluencerDetail,
  type CrmRedirectPromotionApplication,
  type CrmStats,
  type CrmPipelineBoardData,
  type CrmInfluencerLiveActivity,
} from '../../services/adminCrm';

const ACTIVATION_LABELS: Record<string, string> = {
  not_started: 'Sin iniciar',
  onboarding: 'Onboarding',
  pending_review: 'Revisión',
  active: 'Activo',
  verified: 'Verificado',
  suspended: 'Suspendido',
  inactive: 'Inactivo',
};

const DATA_LABELS: Record<string, string> = {
  not_started: 'Sin datos',
  incomplete: 'Incompleto',
  partial: 'Parcial',
  complete: 'Completo',
};

const IDENTITY_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Confirmada',
  rejected: 'Rechazada',
};

function identityBadgeClass(status: string) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-800';
  if (status === 'rejected') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-900';
}

function AppBadges({ row }: { row: CrmInfluencerRow }) {
  const d = row.apps.damecodigoInfluencer.installCount;
  const b = row.apps.bizneaiMerchant.installCount;
  return (
    <div className="flex flex-wrap gap-1">
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
          d > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-500'
        }`}
        title={`DameCodigo influencer: ${d} instalación(es)`}
      >
        DC {d}
      </span>
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
          b > 0 ? 'bg-violet-100 text-violet-900' : 'bg-gray-100 text-gray-500'
        }`}
        title={`BizneAI negocios: ${b} instalación(es)`}
      >
        Biz {b}
      </span>
    </div>
  );
}

export default function InfluencerCrmPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin === true;
  const [unlocked, setUnlocked] = useState(() => isAdminPinUnlockSession());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [stats, setStats] = useState<CrmStats | null>(null);
  const [rows, setRows] = useState<CrmInfluencerRow[]>([]);
  const [page, setPage] = useState(1);
  const [listLimit, setListLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [boardPage, setBoardPage] = useState(1);
  const [boardLimit, setBoardLimit] = useState(50);
  const [boardPagination, setBoardPagination] = useState<CrmPaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activationFilter, setActivationFilter] = useState('');
  const [dataFilter, setDataFilter] = useState('');
  const [termsFilter, setTermsFilter] = useState('');
  const [appFilter, setAppFilter] = useState('');
  const [identityFilter, setIdentityFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'pipeline' | 'applications'>(() => {
    try {
      const saved = localStorage.getItem('crm-influencer-view');
      return saved === 'list' || saved === 'pipeline' || saved === 'applications' ? saved : 'pipeline';
    } catch {
      return 'pipeline';
    }
  });

  const setViewModePersisted = (mode: 'list' | 'pipeline' | 'applications') => {
    setViewMode(mode);
    try {
      localStorage.setItem('crm-influencer-view', mode);
    } catch {
      /* ignore */
    }
  };
  const [pipelineTab, setPipelineTab] = useState<'activation' | 'monetization'>(() => {
    try {
      const saved = localStorage.getItem('crm-pipeline-tab');
      return saved === 'monetization' || saved === 'activation' ? saved : 'activation';
    } catch {
      return 'activation';
    }
  });
  const [pipelineBoard, setPipelineBoard] = useState<CrmPipelineBoardData | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineMovingId, setPipelineMovingId] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CrmInfluencerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editActivation, setEditActivation] = useState('');
  const [editDataStatus, setEditDataStatus] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editTerms, setEditTerms] = useState(false);
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editNextAction, setEditNextAction] = useState('');
  const [editPipelineStage, setEditPipelineStage] = useState('lead');
  const [editMonetizationStage, setEditMonetizationStage] = useState('ready');
  const [editMonetizationNextAction, setEditMonetizationNextAction] = useState('');
  const [editMonetizationNotes, setEditMonetizationNotes] = useState('');
  const [identityAdminNote, setIdentityAdminNote] = useState('');
  const [identityReviewing, setIdentityReviewing] = useState(false);
  const [liveActivity, setLiveActivity] = useState<CrmInfluencerLiveActivity | null>(null);
  const [liveActivityLoading, setLiveActivityLoading] = useState(false);
  const [liveAutoRefresh, setLiveAutoRefresh] = useState(true);
  const [boardLastRefreshedAt, setBoardLastRefreshedAt] = useState<Date | null>(null);

  const [redirectPack, setRedirectPack] = useState<CrmRedirectApplicationsPack | null>(null);
  const [redirectAppsLoading, setRedirectAppsLoading] = useState(false);
  const [redirectAppsApprovingId, setRedirectAppsApprovingId] = useState<string | null>(null);
  const [redirectAssigningId, setRedirectAssigningId] = useState<string | null>(null);
  const [redirectAssignPromotionId, setRedirectAssignPromotionId] = useState('');

  const [appsRows, setAppsRows] = useState<CrmPromotionApplicationRow[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsPendingCount, setAppsPendingCount] = useState(0);
  const [appsUnlinkedCount, setAppsUnlinkedCount] = useState(0);
  const [appsStatusFilter, setAppsStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>(
    'pending',
  );
  const [appsUnlinkedOnly, setAppsUnlinkedOnly] = useState(false);
  const [appsSearch, setAppsSearch] = useState('');
  const [appsSearchInput, setAppsSearchInput] = useState('');
  const [appsPage, setAppsPage] = useState(1);
  const [appsLimit, setAppsLimit] = useState(25);
  const [appsPagination, setAppsPagination] = useState<CrmApplicationsPagination | null>(null);
  const [appsActionId, setAppsActionId] = useState<string | null>(null);
  const [appsAssignInfluencerId, setAppsAssignInfluencerId] = useState<Record<string, string>>({});

  // Atajos de aplicación masiva
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPromoSearch, setBulkPromoSearch] = useState('');
  const [bulkPromoResults, setBulkPromoResults] = useState<PromotionPickItem[]>([]);
  const [bulkPromoSearching, setBulkPromoSearching] = useState(false);
  const [bulkPromo, setBulkPromo] = useState<PromotionPickItem | null>(null);
  const [bulkScope, setBulkScope] = useState<'all' | 'category'>('all');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkCategories, setBulkCategories] = useState<string[]>([]);
  const [bulkApprove, setBulkApprove] = useState(true);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setAppsLoading(true);
    setError(null);
    try {
      const { rows, pendingCount, unlinkedCount, pagination } = await fetchCrmPromotionApplications({
        status: appsStatusFilter,
        search: appsSearch,
        unlinkedOnly: appsUnlinkedOnly,
        page: appsPage,
        limit: appsLimit,
      });
      setAppsRows(rows);
      setAppsPendingCount(pendingCount);
      setAppsUnlinkedCount(unlinkedCount);
      setAppsPagination(pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar solicitudes');
      setAppsRows([]);
    } finally {
      setAppsLoading(false);
    }
  }, [appsStatusFilter, appsSearch, appsUnlinkedOnly, appsPage, appsLimit]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [st, list] = await Promise.all([
        fetchCrmStats(),
        fetchCrmInfluencers({
          page,
          limit: listLimit,
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          activationStatus: activationFilter || undefined,
          dataSubmissionStatus: dataFilter || undefined,
          termsAccepted: termsFilter === 'yes' ? 'true' : termsFilter === 'no' ? 'false' : undefined,
          app: (appFilter || undefined) as 'damecodigo' | 'bizneai' | 'both' | 'none' | undefined,
          identityVerificationStatus: (identityFilter || undefined) as
            | 'pending'
            | 'approved'
            | 'rejected'
            | undefined,
        }),
      ]);
      setStats(st);
      setRows(list.docs);
      setTotalPages(list.totalPages);
      setTotalDocs(list.totalDocs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error CRM');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, listLimit, search, statusFilter, activationFilter, dataFilter, termsFilter, appFilter, identityFilter]);

  const resetCrmPages = () => {
    setPage(1);
    setBoardPage(1);
  };

  const pipelineFilterParams = useCallback(
    () => ({
      page: boardPage,
      limit: boardLimit,
      search: search.trim() || undefined,
      status: statusFilter || undefined,
      activationStatus: activationFilter || undefined,
      dataSubmissionStatus: dataFilter || undefined,
      termsAccepted: termsFilter === 'yes' ? ('true' as const) : termsFilter === 'no' ? ('false' as const) : undefined,
      app: (appFilter || undefined) as 'damecodigo' | 'bizneai' | 'both' | 'none' | undefined,
      identityVerificationStatus: (identityFilter || undefined) as
        | 'pending'
        | 'approved'
        | 'rejected'
        | undefined,
    }),
    [boardPage, boardLimit, search, statusFilter, activationFilter, dataFilter, termsFilter, appFilter, identityFilter],
  );

  const loadPipeline = useCallback(async () => {
    setPipelineLoading(true);
    try {
      const [st, board] = await Promise.all([
        fetchCrmStats(),
        fetchCrmPipelineBoard(pipelineFilterParams()),
      ]);
      setStats(st);
      setPipelineBoard(board);
      setBoardPagination(board.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar pipeline');
      setPipelineBoard(null);
      setBoardPagination(null);
    } finally {
      setPipelineLoading(false);
    }
  }, [pipelineFilterParams]);

  const loadMonetizationBoard = useCallback(async (silent = false) => {
    if (!silent) setPipelineLoading(true);
    try {
      const [st, board] = await Promise.all([
        fetchCrmStats(),
        fetchCrmMonetizationBoard(pipelineFilterParams()),
      ]);
      setStats(st);
      setPipelineBoard(board);
      setBoardPagination(board.pagination);
      setBoardLastRefreshedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar tablero monetización');
      setPipelineBoard(null);
      setBoardPagination(null);
    } finally {
      setPipelineLoading(false);
    }
  }, [pipelineFilterParams]);

  const setPipelineTabPersisted = (tab: 'activation' | 'monetization') => {
    setBoardPage(1);
    setPipelineTab(tab);
    try {
      localStorage.setItem('crm-pipeline-tab', tab);
    } catch {
      /* ignore */
    }
  };

  const reloadActiveBoard = useCallback(async () => {
    if (pipelineTab === 'monetization') await loadMonetizationBoard();
    else await loadPipeline();
  }, [pipelineTab, loadMonetizationBoard, loadPipeline]);

  useEffect(() => {
    if (!isSuperAdmin || !unlocked) return;
    if (viewMode === 'applications') loadApplications();
    else if (viewMode === 'list') loadList();
    else if (pipelineTab === 'monetization') loadMonetizationBoard();
    else loadPipeline();
  }, [isSuperAdmin, unlocked, viewMode, pipelineTab, page, listLimit, boardPage, boardLimit, loadList, loadPipeline, loadMonetizationBoard, loadApplications]);

  // Contador de solicitudes pendientes para el badge (independiente de la vista activa).
  useEffect(() => {
    if (!isSuperAdmin || !unlocked) return;
    let cancelled = false;
    fetchCrmPromotionApplications({ status: 'pending', limit: 5 })
      .then(({ pendingCount, unlinkedCount }) => {
        if (!cancelled) {
          setAppsPendingCount(pendingCount);
          setAppsUnlinkedCount(unlinkedCount);
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, unlocked]);

  const handleMovePipelineCard = async (influencerId: string, pipelineStage: string) => {
    setPipelineMovingId(influencerId);
    setError(null);
    try {
      await moveCrmLeadStage(influencerId, pipelineStage);
      await reloadActiveBoard();
      if (selectedId === influencerId) {
        const d = await fetchCrmInfluencerDetail(influencerId);
        setDetail(d);
        setEditPipelineStage(d.outreach?.pipelineStage || pipelineStage);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al mover lead');
    } finally {
      setPipelineMovingId(null);
    }
  };

  const refreshLiveActivity = useCallback(async (influencerId: string) => {
    setLiveActivityLoading(true);
    try {
      const live = await fetchCrmInfluencerLiveActivity(influencerId);
      setLiveActivity(live);
    } catch {
      setLiveActivity(null);
    } finally {
      setLiveActivityLoading(false);
    }
  }, []);

  const handleApplySuggestedStage = async (influencerId: string, stage: string) => {
    setPipelineMovingId(influencerId);
    try {
      await moveCrmMonetizationStage(influencerId, stage);
      await reloadActiveBoard();
      if (selectedId === influencerId) {
        setEditMonetizationStage(stage);
        await refreshLiveActivity(influencerId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al aplicar etapa sugerida');
    } finally {
      setPipelineMovingId(null);
    }
  };

  const handleMoveMonetizationCard = async (influencerId: string, monetizationStage: string) => {
    setPipelineMovingId(influencerId);
    setError(null);
    try {
      await moveCrmMonetizationStage(influencerId, monetizationStage);
      await reloadActiveBoard();
      if (selectedId === influencerId) {
        const m = await fetchCrmMonetization(influencerId);
        setEditMonetizationStage(m.monetizationStage);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al mover ficha monetización');
    } finally {
      setPipelineMovingId(null);
    }
  };

  useEffect(() => {
    if (!selectedId || !unlocked) {
      setDetail(null);
      setLiveActivity(null);
      setRedirectPack(null);
      setRedirectAppsLoading(false);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setRedirectAppsLoading(true);
    setRedirectPack(null);
    void refreshLiveActivity(selectedId);
    Promise.all([fetchCrmInfluencerDetail(selectedId), fetchCrmMonetization(selectedId)])
      .then(([d, m]) => {
        if (cancelled) return;
        setDetail(d);
        setEditNotes(d.adminNotes || '');
        setEditActivation(d.activationStatus);
        setEditDataStatus(d.dataSubmissionStatus);
        setEditStatus(d.status);
        setEditTerms(d.terms.accepted);
        setEditContactEmail(d.outreach?.contactEmail || d.user?.email || '');
        setEditNextAction(d.outreach?.nextAction || '');
        setEditPipelineStage(d.outreach?.pipelineStage || 'lead');
        setEditMonetizationStage(m.monetizationStage || 'ready');
        setEditMonetizationNextAction(m.nextAction || '');
        setEditMonetizationNotes(m.notes || '');
        setIdentityAdminNote(d.verification?.adminDecisionNote || '');
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    fetchCrmRedirectApplications(selectedId)
      .then((pack) => {
        if (cancelled) return;
        setRedirectPack(pack);
        setRedirectAssignPromotionId(pack.assignable[0]?.id || '');
      })
      .catch(() => {
        if (!cancelled) setRedirectPack(null);
      })
      .finally(() => {
        if (!cancelled) setRedirectAppsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, unlocked, refreshLiveActivity]);

  const reloadRedirectPack = async (influencerId: string) => {
    const pack = await fetchCrmRedirectApplications(influencerId);
    setRedirectPack(pack);
    setRedirectAssignPromotionId((prev) => {
      if (prev && pack.assignable.some((p) => p.id === prev)) return prev;
      return pack.assignable[0]?.id || '';
    });
  };

  const handleApprovePromotionApplication = async (influencerId: string, appId: string) => {
    if (!influencerId || !appId) return;
    setRedirectAppsApprovingId(appId);
    setError(null);
    try {
      await approveCrmPromotionApplication(appId);
      await reloadActiveBoard();
      if (selectedId === influencerId) {
        await reloadRedirectPack(influencerId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo aceptar la solicitud');
    } finally {
      setRedirectAppsApprovingId(null);
    }
  };

  const handleApproveRedirectApp = async (appId: string) => {
    if (!selectedId) return;
    if (!window.confirm('¿Aceptar esta solicitud de promoción para el influencer?')) return;
    await handleApprovePromotionApplication(selectedId, appId);
  };

  const handleAcceptApplicationRow = async (row: CrmPromotionApplicationRow) => {
    const extraId = (appsAssignInfluencerId[row.id] || '').trim();
    if (!row.influencerApplicant && !/^[a-f0-9]{24}$/i.test(extraId)) {
      setError('Esta solicitud no tiene influencer vinculado. Pega el ID (24 caracteres) antes de aceptar.');
      return;
    }
    if (!window.confirm(`¿Aceptar la solicitud para «${row.promotion?.title || 'promoción'}»?`)) return;
    setAppsActionId(row.id);
    setError(null);
    try {
      await approveCrmPromotionApplication(row.id, extraId ? { influencerProfileId: extraId } : undefined);
      await loadApplications();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo aceptar');
    } finally {
      setAppsActionId(null);
    }
  };

  const handleRejectApplicationRow = async (row: CrmPromotionApplicationRow) => {
    if (!window.confirm('¿Rechazar esta solicitud?')) return;
    setAppsActionId(row.id);
    setError(null);
    try {
      await rejectCrmPromotionApplication(row.id);
      await loadApplications();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo rechazar');
    } finally {
      setAppsActionId(null);
    }
  };

  const submitAppsSearch = () => {
    setAppsPage(1);
    setAppsSearch(appsSearchInput.trim());
  };

  const openBulkPanel = async () => {
    setBulkOpen((prev) => !prev);
    setBulkResult(null);
    if (bulkCategories.length === 0) {
      try {
        const cats = await fetchCrmInfluencerCategories();
        setBulkCategories(cats);
      } catch {
        /* ignore */
      }
    }
  };

  const runBulkPromoSearch = async () => {
    setBulkPromoSearching(true);
    try {
      const results = await searchPromotionsForBulk(bulkPromoSearch);
      setBulkPromoResults(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo buscar promociones');
    } finally {
      setBulkPromoSearching(false);
    }
  };

  const handleRunBulkApply = async () => {
    if (!bulkPromo) {
      setError('Selecciona una promoción primero.');
      return;
    }
    if (bulkScope === 'category' && !bulkCategory) {
      setError('Selecciona una categoría.');
      return;
    }
    const scopeLabel = bulkScope === 'all' ? 'TODOS los influencers' : `la categoría «${bulkCategory}»`;
    if (
      !window.confirm(
        `¿Aplicar «${bulkPromo.title}» a ${scopeLabel}? Se crearán solicitudes ${
          bulkApprove ? 'ya aprobadas' : 'pendientes'
        }.`,
      )
    )
      return;
    setBulkRunning(true);
    setBulkResult(null);
    setError(null);
    try {
      const res = await bulkApplyCrmPromotion({
        promotionId: bulkPromo.id,
        scope: bulkScope,
        category: bulkScope === 'category' ? bulkCategory : undefined,
        approve: bulkApprove,
      });
      setBulkResult(
        `Listo: ${res.created} creada(s), ${res.skipped} ya existían (de ${res.matched} influencers).`,
      );
      await loadApplications();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo aplicar masivamente');
    } finally {
      setBulkRunning(false);
    }
  };

  const handleAssignRedirectPromotion = async () => {
    if (!selectedId || !redirectAssignPromotionId) return;
    if (!window.confirm('¿Asignar y aprobar esta promoción de redirección sin solicitud del influencer?')) return;
    setRedirectAssigningId(redirectAssignPromotionId);
    try {
      await assignCrmRedirectPromotion(selectedId, redirectAssignPromotionId);
      await reloadRedirectPack(selectedId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo asignar');
    } finally {
      setRedirectAssigningId(null);
    }
  };

  useEffect(() => {
    if (!unlocked || viewMode !== 'pipeline' || pipelineTab !== 'monetization' || !liveAutoRefresh) {
      return;
    }
    const id = window.setInterval(() => {
      void loadMonetizationBoard(true);
      if (selectedId) void refreshLiveActivity(selectedId);
    }, 20000);
    return () => window.clearInterval(id);
  }, [
    unlocked,
    viewMode,
    pipelineTab,
    liveAutoRefresh,
    selectedId,
    loadMonetizationBoard,
    refreshLiveActivity,
  ]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === getAdminAccessPin()) {
      setAdminPinUnlockSession();
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleIdentityReview = async (decision: 'approved' | 'rejected') => {
    if (!selectedId) return;
    const msg =
      decision === 'approved'
        ? '¿Confirmas que la cuenta User es el influencer de este perfil? Habilitará el dashboard en la app.'
        : '¿Rechazas la identidad de este solicitante?';
    if (!window.confirm(msg)) return;
    setIdentityReviewing(true);
    try {
      const updated = await reviewCrmIdentityVerification(selectedId, {
        decision,
        adminNote: identityAdminNote.trim() || undefined,
      });
      setDetail(updated);
      if (viewMode === 'pipeline') await reloadActiveBoard();
      else await loadList();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al revisar identidad');
    } finally {
      setIdentityReviewing(false);
    }
  };

  const handleSaveDetail = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await patchCrmInfluencer(selectedId, {
        status: editStatus,
        activationStatus: editActivation,
        dataSubmissionStatus: editDataStatus,
        adminNotes: editNotes,
        terms: { accepted: editTerms },
        lastContactAt: new Date().toISOString(),
      });
      await patchCrmOutreach(selectedId, {
        pipelineStage: editPipelineStage,
        contactEmail: editContactEmail,
        contactEmailStatus: editContactEmail ? 'received' : undefined,
        nextAction: editNextAction,
      });
      await patchCrmMonetization(selectedId, {
        monetizationStage: editMonetizationStage,
        nextAction: editMonetizationNextAction,
        notes: editMonetizationNotes,
      });
      if (viewMode === 'pipeline') await reloadActiveBoard();
      else await loadList();
      const d = await fetchCrmInfluencerDetail(selectedId);
      setDetail(d);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form
          onSubmit={handlePinSubmit}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full shadow-xl"
        >
          <Lock className="w-10 h-10 text-purple-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white text-center mb-2">CRM Influencers</h1>
          <p className="text-sm text-slate-400 text-center mb-6">PIN de super admin</p>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white mb-4"
            placeholder="PIN"
            autoFocus
          />
          {pinError && <p className="text-red-400 text-sm mb-3">PIN incorrecto</p>}
          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
          >
            Entrar
          </button>
          <Link to="/admin" className="block text-center text-sm text-slate-500 mt-4 hover:text-slate-300">
            Volver al admin
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin/crm" className="p-2 rounded-lg hover:bg-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">CRM · Pipeline</h1>
              <p className="text-xs text-slate-400">Activación, datos, términos y apps (DameCodigo + BizneAI)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/crm/applications?status=pending"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 hidden sm:inline-flex items-center gap-1"
            >
              <FileCheck className="w-3.5 h-3.5" />
              Solicitudes promo
            </a>
            <Link
              to="/admin/crm/influencers"
              className="text-xs px-3 py-1.5 rounded-lg bg-violet-600/90 hover:bg-violet-500 hidden sm:inline-flex"
            >
              Perfiles y fotos
            </Link>
            <Link
              to="/admin/crm/instagram-leads"
              className="text-xs px-3 py-1.5 rounded-lg bg-pink-600/90 hover:bg-pink-500 flex items-center gap-1"
            >
              <Instagram className="w-3.5 h-3.5" />
              Leads Instagram
            </Link>
            <button
              type="button"
              onClick={() => {
                clearAdminPinUnlockSession();
                setUnlocked(false);
              }}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cerrar sesión PIN
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Influencers</p>
              <p className="text-2xl font-bold">{stats.totalInfluencers}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Con cuenta</p>
              <p className="text-2xl font-bold text-blue-600">{stats.linkedToUser}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Términos OK</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.termsAccepted}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> App DC
              </p>
              <p className="text-2xl font-bold">{stats.withDamecodigoApp}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Store className="w-3 h-3" /> BizneAI
              </p>
              <p className="text-2xl font-bold">{stats.withBizneaiApp}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Ambas apps</p>
              <p className="text-2xl font-bold text-purple-600">{stats.withBothApps}</p>
            </div>
            <div className="bg-white rounded-xl border p-4 col-span-2 md:col-span-1">
              <p className="text-xs text-gray-500">Identidad pendiente</p>
              <p className="text-2xl font-bold text-amber-700">
                {stats.pendingIdentityVerification ?? 0}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewModePersisted('pipeline')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${
                  viewMode === 'pipeline' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Tablero de fichas
              </button>
              <button
                type="button"
                onClick={() => setViewModePersisted('list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${
                  viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
                Lista detallada
              </button>
              <button
                type="button"
                onClick={() => setViewModePersisted('applications')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${
                  viewMode === 'applications' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Inbox className="w-4 h-4" />
                Aplicaciones
                {appsPendingCount > 0 && (
                  <span
                    className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      viewMode === 'applications' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {appsPendingCount}
                  </span>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1.5 max-w-xl">
              {viewMode === 'pipeline'
                ? pipelineTab === 'monetization'
                  ? 'Post-onboarding: campañas, canjes y abonos — solo cuentas con activación completada.'
                  : 'Activación inicial: outreach, datos, app y términos — arrastra fichas entre columnas.'
                : viewMode === 'applications'
                  ? 'Solicitudes de promoción enviadas desde la tienda — acéptalas o recházalas aquí mismo.'
                  : 'Tabla con todas las columnas — clic en fila para abrir la ficha lateral.'}
            </p>
            {viewMode === 'pipeline' && (
              <div className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50/50 p-1 mt-2">
                <button
                  type="button"
                  onClick={() => setPipelineTabPersisted('activation')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium ${
                    pipelineTab === 'activation' ? 'bg-white shadow text-purple-800' : 'text-gray-600'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Activación
                </button>
                <button
                  type="button"
                  onClick={() => setPipelineTabPersisted('monetization')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium ${
                    pipelineTab === 'monetization' ? 'bg-white shadow text-emerald-800' : 'text-gray-600'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Monetización
                </button>
              </div>
            )}
          </div>
          {viewMode === 'pipeline' && (
            <button
              type="button"
              onClick={() => reloadActiveBoard()}
              disabled={pipelineLoading}
              className="text-sm text-purple-700 hover:underline disabled:opacity-50 shrink-0"
            >
              Actualizar tablero
            </button>
          )}
          {viewMode === 'applications' && (
            <button
              type="button"
              onClick={() => loadApplications()}
              disabled={appsLoading}
              className="text-sm text-emerald-700 hover:underline disabled:opacity-50 shrink-0"
            >
              Actualizar solicitudes
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetCrmPages();
              }}
              placeholder="Nombre, usuario, código…"
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              resetCrmPages();
            }}
            className="py-2 px-3 border rounded-lg text-sm"
          >
            <option value="">Estado perfil</option>
            <option value="pending">Pendiente</option>
            <option value="active">Activo</option>
            <option value="verified">Verificado</option>
            <option value="suspended">Suspendido</option>
          </select>
          <select
            value={activationFilter}
            onChange={(e) => {
              setActivationFilter(e.target.value);
              resetCrmPages();
            }}
            className="py-2 px-3 border rounded-lg text-sm"
          >
            <option value="">Activación CRM</option>
            {Object.entries(ACTIVATION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={dataFilter}
            onChange={(e) => {
              setDataFilter(e.target.value);
              resetCrmPages();
            }}
            className="py-2 px-3 border rounded-lg text-sm"
          >
            <option value="">Envío datos</option>
            {Object.entries(DATA_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={termsFilter}
            onChange={(e) => {
              setTermsFilter(e.target.value);
              resetCrmPages();
            }}
            className="py-2 px-3 border rounded-lg text-sm"
          >
            <option value="">Términos</option>
            <option value="yes">Aceptados</option>
            <option value="no">Pendientes</option>
          </select>
          <select
            value={identityFilter}
            onChange={(e) => {
              setIdentityFilter(e.target.value);
              resetCrmPages();
            }}
            className="py-2 px-3 border rounded-lg text-sm"
          >
            <option value="">Verificación identidad</option>
            <option value="pending">Pendiente</option>
            <option value="approved">Confirmada</option>
            <option value="rejected">Rechazada</option>
          </select>
          <select
            value={appFilter}
            onChange={(e) => {
              setAppFilter(e.target.value);
              resetCrmPages();
            }}
            className="py-2 px-3 border rounded-lg text-sm"
          >
            <option value="">Apps</option>
            <option value="damecodigo">Solo DameCodigo</option>
            <option value="bizneai">Solo BizneAI</option>
            <option value="both">Ambas</option>
            <option value="none">Ninguna</option>
          </select>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>
        )}

        <div className="flex gap-4">
          <div
            className={`flex-1 min-w-0 ${
              selectedId && viewMode === 'list' ? 'lg:max-w-[58%]' : viewMode === 'pipeline' && selectedId ? 'lg:max-w-[62%]' : ''
            }`}
          >
            {viewMode === 'pipeline' ? (
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-slate-800">
                    {pipelineTab === 'monetization'
                      ? 'Monetización por cuenta'
                      : 'Activación / outreach por cuenta'}
                  </h2>
                  {pipelineTab === 'monetization' && (
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={liveAutoRefresh}
                          onChange={(e) => setLiveAutoRefresh(e.target.checked)}
                          className="rounded border-gray-300 text-emerald-600"
                        />
                        <Radio className="w-3.5 h-3.5 text-emerald-600" />
                        Auto-actualizar (20s)
                      </label>
                      {boardLastRefreshedAt && (
                        <span>
                          Datos vivos ·{' '}
                          {boardLastRefreshedAt.toLocaleTimeString('es', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <CrmPipelineBoard
                  board={pipelineBoard}
                  loading={pipelineLoading}
                  movingId={pipelineMovingId}
                  boardKind={pipelineTab}
                  onSelectCard={(id) => setSelectedId(id)}
                  onMoveCard={
                    pipelineTab === 'monetization' ? handleMoveMonetizationCard : handleMovePipelineCard
                  }
                  onApplySuggestedStage={
                    pipelineTab === 'monetization' ? handleApplySuggestedStage : undefined
                  }
                  onApproveApplication={handleApprovePromotionApplication}
                  approvingApplicationId={redirectAppsApprovingId}
                />
                {boardPagination && (
                  <CrmPagination
                    page={boardPagination.page}
                    totalPages={boardPagination.totalPages}
                    totalDocs={boardPagination.totalDocs}
                    limit={boardPagination.limit}
                    onPageChange={setBoardPage}
                    onLimitChange={(n) => {
                      setBoardLimit(n);
                      setBoardPage(1);
                    }}
                    className="rounded-b-xl border -mt-1"
                  />
                )}
              </div>
            ) : loading ? (
              <div className="py-16 text-center text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando CRM…
              </div>
            ) : viewMode === 'list' ? (
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs text-gray-600 uppercase">
                      <tr>
                        <th className="px-3 py-3">Influencer</th>
                        <th className="px-3 py-3">Identidad</th>
                        <th className="px-3 py-3">Activación</th>
                        <th className="px-3 py-3">Datos</th>
                        <th className="px-3 py-3">Outreach</th>
                        <th className="px-3 py-3">Términos</th>
                        <th className="px-3 py-3">Apps</th>
                        <th className="px-3 py-3">Perfil %</th>
                        <th className="px-3 py-3">Canjes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {rows.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedId(row.id)}
                          className={`cursor-pointer hover:bg-purple-50/60 ${
                            selectedId === row.id ? 'bg-purple-50' : ''
                          }`}
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={mediaUrl(row.avatar, row.name)}
                                alt=""
                                className="w-9 h-9 rounded-full object-cover"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{row.name}</p>
                                <p className="text-xs text-gray-500">{row.username}</p>
                                {row.user?.email && (
                                  <p className="text-[11px] text-gray-400 truncate max-w-[140px]">{row.user.email}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${identityBadgeClass(
                                row.identityVerificationStatus,
                              )}`}
                            >
                              {IDENTITY_LABELS[row.identityVerificationStatus] ||
                                row.identityVerificationStatus}
                            </span>
                            {row.hasVerificationScreenshot && row.identityVerificationStatus === 'pending' && (
                              <span className="block text-[10px] text-amber-700 mt-0.5">📷 evidencia</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs font-medium">
                              {ACTIVATION_LABELS[row.activationStatus] || row.activationStatus}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs">{DATA_LABELS[row.dataSubmissionStatus] || row.dataSubmissionStatus}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-[11px] leading-tight block max-w-[120px]">
                              {row.outreachPipelineLabel || '—'}
                              {(row.outreachPendingCount ?? 0) > 0 && (
                                <span className="text-amber-700"> · {row.outreachPendingCount} pend.</span>
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {row.terms.accepted ? (
                              <FileCheck className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <AppBadges row={row} />
                          </td>
                          <td className="px-3 py-3">{row.profileCompleteness}%</td>
                          <td className="px-3 py-3 font-medium">{row.redeemedCoupons}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length === 0 && (
                  <p className="text-center py-10 text-gray-500">Sin resultados</p>
                )}
                <CrmPagination
                  page={page}
                  totalPages={totalPages}
                  totalDocs={totalDocs}
                  limit={listLimit}
                  onPageChange={setPage}
                  onLimitChange={(n) => {
                    setListLimit(n);
                    setPage(1);
                  }}
                />
              </div>
            ) : viewMode === 'applications' ? (
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Solicitudes de promoción
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-lg border border-slate-200 p-1 text-xs">
                      {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setAppsPage(1);
                            setAppsStatusFilter(s);
                          }}
                          className={`px-2.5 py-1 rounded-md font-medium capitalize ${
                            appsStatusFilter === s ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {s === 'pending'
                            ? 'Pendientes'
                            : s === 'approved'
                              ? 'Aceptadas'
                              : s === 'rejected'
                                ? 'Rechazadas'
                                : 'Todas'}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={openBulkPanel}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Aplicar a varios
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={appsSearchInput}
                      onChange={(e) => setAppsSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitAppsSearch();
                      }}
                      placeholder="Buscar por promoción, marca o influencer…"
                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={submitAppsSearch}
                    className="px-3 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Buscar
                  </button>
                  {appsSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setAppsSearchInput('');
                        setAppsSearch('');
                        setAppsPage(1);
                      }}
                      className="px-3 py-2 rounded-lg border text-sm text-gray-500 hover:bg-gray-50"
                    >
                      Limpiar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAppsPage(1);
                      setAppsUnlinkedOnly((v) => !v);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium ${
                      appsUnlinkedOnly
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'text-amber-700 border-amber-300 hover:bg-amber-50'
                    }`}
                    title="Mostrar solo solicitudes sin influencer vinculado"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Sin vincular
                    {appsUnlinkedCount > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          appsUnlinkedOnly ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {appsUnlinkedCount}
                      </span>
                    )}
                  </button>
                </div>

                {bulkOpen && (
                  <div className="mb-4 rounded-xl border-2 border-purple-200 bg-purple-50/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-purple-700" />
                      <p className="text-sm font-semibold text-purple-900">
                        Aplicar una promoción a varios influencers
                      </p>
                    </div>

                    {!bulkPromo ? (
                      <div>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={bulkPromoSearch}
                            onChange={(e) => setBulkPromoSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') runBulkPromoSearch();
                            }}
                            placeholder="Buscar promoción por título o marca…"
                            className="flex-1 border rounded-lg px-3 py-2 text-sm bg-white"
                          />
                          <button
                            type="button"
                            onClick={runBulkPromoSearch}
                            disabled={bulkPromoSearching}
                            className="px-3 py-2 rounded-lg bg-purple-600 text-white text-sm disabled:opacity-50"
                          >
                            {bulkPromoSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                          </button>
                        </div>
                        {bulkPromoResults.length > 0 && (
                          <ul className="max-h-48 overflow-y-auto rounded-lg border bg-white divide-y">
                            {bulkPromoResults.map((p) => (
                              <li key={p.id}>
                                <button
                                  type="button"
                                  onClick={() => setBulkPromo(p)}
                                  className="w-full text-left px-3 py-2 hover:bg-purple-50 text-sm"
                                >
                                  <span className="font-medium text-gray-900">{p.title}</span>
                                  {p.brand && <span className="text-gray-500"> · {p.brand}</span>}
                                  {p.category && (
                                    <span className="text-[11px] text-gray-400"> ({p.category})</span>
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 bg-white rounded-lg border px-3 py-2">
                          <span className="text-sm text-gray-800">
                            <span className="font-medium">{bulkPromo.title}</span>
                            {bulkPromo.brand && <span className="text-gray-500"> · {bulkPromo.brand}</span>}
                          </span>
                          <button
                            type="button"
                            onClick={() => setBulkPromo(null)}
                            className="text-xs text-purple-700 hover:underline"
                          >
                            Cambiar
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <label className="inline-flex items-center gap-1.5 text-sm">
                            <input
                              type="radio"
                              name="bulkScope"
                              checked={bulkScope === 'all'}
                              onChange={() => setBulkScope('all')}
                            />
                            Todos los influencers
                          </label>
                          <label className="inline-flex items-center gap-1.5 text-sm">
                            <input
                              type="radio"
                              name="bulkScope"
                              checked={bulkScope === 'category'}
                              onChange={() => setBulkScope('category')}
                            />
                            Por categoría
                          </label>
                          {bulkScope === 'category' && (
                            <select
                              value={bulkCategory}
                              onChange={(e) => setBulkCategory(e.target.value)}
                              className="border rounded-lg px-2 py-1.5 text-sm bg-white"
                            >
                              <option value="">Selecciona…</option>
                              {bulkCategories.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <label className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={bulkApprove}
                            onChange={(e) => setBulkApprove(e.target.checked)}
                            className="rounded border-gray-300 text-emerald-600"
                          />
                          Crear ya aprobadas (genera códigos). Si lo desmarcas, quedan pendientes.
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleRunBulkApply}
                            disabled={bulkRunning}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium disabled:opacity-50"
                          >
                            {bulkRunning ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4" />
                            )}
                            Aplicar ahora
                          </button>
                          <button
                            type="button"
                            onClick={() => setBulkOpen(false)}
                            className="px-3 py-2 rounded-lg border text-sm text-gray-600"
                          >
                            Cerrar
                          </button>
                        </div>
                      </div>
                    )}

                    {bulkResult && (
                      <p className="mt-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                        {bulkResult}
                      </p>
                    )}
                  </div>
                )}

                {appsLoading ? (
                  <div className="py-16 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Cargando solicitudes…
                  </div>
                ) : appsRows.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    No hay solicitudes {appsStatusFilter === 'all' ? '' : 'en este estado'}.
                  </div>
                ) : (
                  <ul className="divide-y">
                    {appsRows.map((row) => {
                      const busy = appsActionId === row.id;
                      const needsId = !row.influencerApplicant;
                      return (
                        <li key={row.id} className="py-3 flex flex-col gap-2">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {row.promotion?.title || 'Promoción'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {row.influencerApplicant
                                  ? row.influencerApplicant.name ||
                                    row.influencerApplicant.username ||
                                    'Influencer'
                                  : 'Solicitante sin perfil vinculado'}
                                {row.promotion?.brand && (
                                  <span className="text-gray-400"> · {row.promotion.brand}</span>
                                )}
                              </p>
                              {row.createdAt && (
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {new Date(row.createdAt).toLocaleString('es')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-semibold capitalize ${
                                  row.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : row.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {row.status}
                              </span>
                              {row.status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleAcceptApplicationRow(row)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium disabled:opacity-50"
                                  >
                                    {busy ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-3.5 h-3.5" />
                                    )}
                                    Aceptar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleRejectApplicationRow(row)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-medium disabled:opacity-50"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Rechazar
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {row.status === 'pending' && needsId && (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                              <span className="text-[11px] text-amber-800 shrink-0">
                                Sin influencer vinculado — pega ID:
                              </span>
                              <input
                                type="text"
                                value={appsAssignInfluencerId[row.id] || ''}
                                onChange={(e) =>
                                  setAppsAssignInfluencerId((prev) => ({ ...prev, [row.id]: e.target.value }))
                                }
                                placeholder="ID del perfil de influencer (24 car.)"
                                className="flex-1 text-xs border rounded px-2 py-1 bg-white"
                              />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {appsPagination && appsPagination.totalDocs > 0 && (
                  <CrmPagination
                    page={appsPagination.page}
                    totalPages={appsPagination.totalPages}
                    totalDocs={appsPagination.totalDocs}
                    limit={appsPagination.limit}
                    onPageChange={setAppsPage}
                    onLimitChange={(n) => {
                      setAppsLimit(n);
                      setAppsPage(1);
                    }}
                    className="rounded-b-xl border -mx-4 -mb-4 mt-3"
                  />
                )}
              </div>
            ) : null}
          </div>

          {selectedId && (
            <aside className="w-full lg:w-[42%] bg-white rounded-xl border shadow-lg p-4 sticky top-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-semibold text-gray-900">Ficha CRM</h2>
                <button type="button" onClick={() => setSelectedId(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {detailLoading || !detail ? (
                <Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto my-8" />
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={mediaUrl(detail.avatar, detail.name)}
                      alt=""
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold">{detail.name}</p>
                      <p className="text-sm text-gray-500">{detail.username}</p>
                      <Link
                        to={`/influencer/${detail.id}`}
                        className="text-xs text-purple-600 inline-flex items-center gap-1 mt-1"
                      >
                        Ver perfil <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  <div className="mb-4 rounded-xl border-2 border-purple-200 bg-purple-50/50 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-xs font-semibold text-purple-900 uppercase">
                        Verificación de identidad (dashboard app)
                      </p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${identityBadgeClass(
                          detail.identityVerificationStatus || 'pending',
                        )}`}
                      >
                        {IDENTITY_LABELS[detail.identityVerificationStatus || 'pending'] ||
                          detail.identityVerificationStatus}
                      </span>
                    </div>
                    <p className="text-xs text-purple-900/80 mb-3">
                      Confirma si la cuenta vinculada ({detail.user?.email || 'sin email'}) es quien
                      controla este perfil de influencer. El perfil público sigue visible; esto solo
                      habilita campañas y abonos en la app.
                    </p>
                    <label className="block text-[11px] text-gray-600 mb-1">Nota interna (opcional)</label>
                    <textarea
                      value={identityAdminNote}
                      onChange={(e) => setIdentityAdminNote(e.target.value)}
                      rows={2}
                      className="w-full text-xs border rounded-lg p-2 mb-2 bg-white"
                      placeholder="Motivo de rechazo o comentario para el equipo…"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={identityReviewing || detail.identityVerificationStatus === 'approved'}
                        onClick={() => handleIdentityReview('approved')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium disabled:opacity-50"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Confirmar identidad
                      </button>
                      <button
                        type="button"
                        disabled={identityReviewing || detail.identityVerificationStatus === 'rejected'}
                        onClick={() => handleIdentityReview('rejected')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-medium disabled:opacity-50 bg-white"
                      >
                        <ShieldX className="w-3.5 h-3.5" />
                        Rechazar
                      </button>
                    </div>
                    {detail.verification?.reviewedAt && (
                      <p className="text-[11px] text-gray-500 mt-2">
                        Revisado: {new Date(detail.verification.reviewedAt).toLocaleString('es')}
                        {detail.verification.adminDecisionNote && (
                          <> · {detail.verification.adminDecisionNote}</>
                        )}
                      </p>
                    )}
                  </div>

                  {detail.verification?.screenshotUrl ? (
                    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-gray-700 uppercase mb-2">
                        Evidencia (screenshot perfil)
                      </p>
                      <img
                        src={mediaUrl(detail.verification.screenshotUrl, detail.name)}
                        alt="Evidencia influencer"
                        className="w-full rounded-lg border bg-white object-contain max-h-[420px]"
                        loading="lazy"
                      />
                      <div className="mt-2 text-xs text-gray-600 space-y-1">
                        {detail.verification.screenshotUploadedAt && (
                          <p>
                            <span className="text-gray-500">Subido:</span>{' '}
                            {new Date(detail.verification.screenshotUploadedAt).toLocaleString('es')}
                          </p>
                        )}
                        {detail.verification.note && (
                          <p className="whitespace-pre-line">
                            <span className="text-gray-500">Nota:</span> {detail.verification.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-gray-600">
                      <p className="font-semibold text-gray-700 uppercase mb-1">
                        Evidencia (screenshot perfil)
                      </p>
                      <p>No hay evidencia subida aún.</p>
                    </div>
                  )}

                  <div className="space-y-3 text-sm mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-[10px] text-gray-500 uppercase">DameCodigo app</p>
                        <p className="font-bold">{detail.apps.damecodigoInfluencer.installCount} installs</p>
                        <p className="text-[11px] text-gray-500">
                          Últ. apertura:{' '}
                          {detail.apps.damecodigoInfluencer.lastOpenAt
                            ? new Date(detail.apps.damecodigoInfluencer.lastOpenAt).toLocaleString('es')
                            : '—'}
                        </p>
                      </div>
                      <div className="bg-violet-50 rounded-lg p-2">
                        <p className="text-[10px] text-violet-700 uppercase">BizneAI (shops)</p>
                        <p className="font-bold">{detail.apps.bizneaiMerchant.installCount} installs</p>
                        <p className="text-[11px] text-gray-500">
                          Últ. apertura:{' '}
                          {detail.apps.bizneaiMerchant.lastOpenAt
                            ? new Date(detail.apps.bizneaiMerchant.lastOpenAt).toLocaleString('es')
                            : '—'}
                        </p>
                      </div>
                    </div>
                    {detail.user && (
                      <p>
                        <span className="text-gray-500">Cuenta:</span> {detail.user.email || detail.user.phone || '—'}
                      </p>
                    )}
                    {detail.walletAddress && (
                      <p className="font-mono text-xs break-all">
                        <span className="text-gray-500">Wallet:</span> {detail.walletAddress}
                      </p>
                    )}
                    <p>
                      <span className="text-gray-500">Completitud perfil:</span> {detail.profileCompleteness}%
                    </p>
                    <p>
                      <span className="text-gray-500">Canjes / comisión:</span> {detail.redeemedCoupons} · $
                      {detail.totalEarnings?.toFixed?.(2) ?? detail.totalEarnings}
                    </p>
                  </div>

                  <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="text-xs font-semibold text-gray-700 uppercase">
                        Solicitudes de promoción (aplicar / aceptar)
                      </p>
                      <a
                        href={
                          selectedId
                            ? `/admin/crm/applications?status=pending&influencerId=${encodeURIComponent(selectedId)}`
                            : '/admin/crm/applications?status=pending'
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        Abrir panel completo (nueva pestaña)
                      </a>
                    </div>
                    {redirectAppsLoading ? (
                      <p className="text-xs text-gray-600 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                        Cargando…
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-purple-200 bg-white p-3">
                          <p className="text-[11px] font-semibold text-purple-900 uppercase mb-2">
                            Asignar unilateralmente
                          </p>
                          {redirectPack && redirectPack.assignable.length > 0 ? (
                            <div className="flex flex-wrap items-end gap-2">
                              <label className="flex-1 min-w-[180px] text-xs">
                                <span className="text-gray-600 block mb-1">Promoción activa (redirect)</span>
                                <select
                                  value={redirectAssignPromotionId}
                                  onChange={(e) => setRedirectAssignPromotionId(e.target.value)}
                                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                                >
                                  {redirectPack.assignable.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.title || p.brand || p.id}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <button
                                type="button"
                                onClick={() => void handleAssignRedirectPromotion()}
                                disabled={
                                  !redirectAssignPromotionId ||
                                  redirectAssigningId === redirectAssignPromotionId
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                              >
                                {redirectAssigningId ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                                ) : (
                                  <FileCheck className="w-3.5 h-3.5" aria-hidden />
                                )}
                                Asignar y aprobar
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-600">
                              No hay promos redirect activas sin asignar (o ya están todas aprobadas para este
                              influencer).
                            </p>
                          )}
                        </div>

                        {redirectPack && redirectPack.pending.length > 0 ? (
                          <div>
                            <p className="text-[11px] font-medium text-gray-700 mb-1">
                              Pendientes (cupón o redirección URL)
                            </p>
                            <ul className="space-y-2">
                              {redirectPack.pending.map((app) => (
                                <li
                                  key={app.id}
                                  className="rounded-lg border border-amber-200 bg-white px-3 py-2"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-gray-900 truncate">
                                        {app.promotion?.title || 'Promoción'}
                                      </p>
                                      {app.promotion?.redirectToUrl ? (
                                        <a
                                          href={app.promotion.redirectToUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[11px] text-purple-700 underline break-all mt-1 inline-block"
                                        >
                                          {app.promotion.redirectToUrl}
                                        </a>
                                      ) : null}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveRedirectApp(app.id)}
                                      disabled={redirectAppsApprovingId === app.id}
                                      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                      {redirectAppsApprovingId === app.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                                      ) : (
                                        <FileCheck className="w-3.5 h-3.5" aria-hidden />
                                      )}
                                      Aceptar
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {redirectPack && redirectPack.approved.length > 0 ? (
                          <div>
                            <p className="text-[11px] font-medium text-gray-700 mb-1">Ya asignadas (aprobadas)</p>
                            <ul className="space-y-1">
                              {redirectPack.approved.map((app) => (
                                <li
                                  key={app.id}
                                  className="text-xs text-gray-700 rounded border border-emerald-100 bg-emerald-50/80 px-2 py-1.5"
                                >
                                  ✓ {app.promotion?.title || 'Promoción'}
                                  {app.promotion?.brand ? ` · ${app.promotion.brand}` : ''}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {redirectPack &&
                        redirectPack.pending.length === 0 &&
                        redirectPack.approved.length === 0 &&
                        redirectPack.assignable.length === 0 ? (
                          <p className="text-xs text-gray-600">
                            No hay solicitudes redirect en esta ficha. Si el influencer aplicó desde el marketplace
                            (cupón normal), revísalas en el{' '}
                            <a
                              href={
                                selectedId
                                  ? `/admin/crm/applications?status=pending&influencerId=${encodeURIComponent(selectedId)}`
                                  : '/admin/crm/applications?status=pending'
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-emerald-800 underline"
                            >
                              panel de solicitudes
                            </a>
                            .
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {detail.outreach && (
                    <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-sm">
                      <p className="text-xs font-semibold text-amber-900 uppercase mb-1">Pipeline outreach</p>
                      <p className="font-medium text-amber-950">{detail.outreach.pipelineStageLabel}</p>
                      {detail.outreach.nextAction && (
                        <p className="text-xs text-amber-800 mt-2">
                          <span className="font-medium">Siguiente:</span> {detail.outreach.nextAction}
                        </p>
                      )}
                      {detail.outreach.profilePublicUrl && (
                        <a
                          href={detail.outreach.profilePublicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-700 underline mt-1 inline-block"
                        >
                          {detail.outreach.profilePublicUrl}
                        </a>
                      )}
                      <ul className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
                        {detail.outreach.deliveries.map((d) => (
                          <li
                            key={d.deliveryKey}
                            className="flex justify-between gap-2 text-xs border-b border-amber-100/80 pb-1"
                          >
                            <span>
                              <span
                                className={
                                  d.status === 'pending'
                                    ? 'text-amber-800 font-medium'
                                    : 'text-gray-700'
                                }
                              >
                                {d.typeLabel || d.type}
                              </span>
                              {d.title ? ` — ${d.title}` : ''}
                            </span>
                            <span className="shrink-0 text-gray-500">{d.statusLabel || d.status}</span>
                          </li>
                        ))}
                      </ul>
                      {detail.outreach.conversationSummary && (
                        <p className="text-[11px] text-gray-600 mt-2 whitespace-pre-line border-t border-amber-100 pt-2">
                          {detail.outreach.conversationSummary}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 border-t pt-4">
                    <label className="block text-xs font-medium text-gray-600">Correo (Gmail / app)</label>
                    <input
                      type="email"
                      value={editContactEmail}
                      onChange={(e) => setEditContactEmail(e.target.value)}
                      placeholder="correo@gmail.com"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                    <label className="block text-xs font-medium text-gray-600">Etapa pipeline (lead)</label>
                    <select
                      value={editPipelineStage}
                      onChange={(e) => setEditPipelineStage(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      {CRM_PIPELINE_STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <label className="block text-xs font-medium text-gray-600">Siguiente acción outreach</label>
                    <input
                      value={editNextAction}
                      onChange={(e) => setEditNextAction(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                    <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50/80 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-xs font-semibold text-sky-900 uppercase flex items-center gap-1">
                          <Radio className="w-3.5 h-3.5" />
                          Actividad en vivo (canjes)
                        </p>
                        <button
                          type="button"
                          onClick={() => selectedId && refreshLiveActivity(selectedId)}
                          disabled={liveActivityLoading}
                          className="text-xs text-sky-800 hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${liveActivityLoading ? 'animate-spin' : ''}`}
                          />
                          Actualizar
                        </button>
                      </div>
                      {liveActivityLoading && !liveActivity ? (
                        <p className="text-xs text-gray-500">Cargando canjes…</p>
                      ) : liveActivity ? (
                        <>
                          <p className="text-xs text-sky-950">
                            <strong>{liveActivity.redeemedCount}</strong> canje(s) ·{' '}
                            <strong>{liveActivity.openCouponsCount}</strong> cupón(es) abierto(s)
                            {liveActivity.settlementPendingCount > 0 && (
                              <>
                                {' '}
                                · <strong>${liveActivity.settlementPendingUsd.toFixed(2)}</strong>{' '}
                                abono pend.
                              </>
                            )}
                            {liveActivity.lastRedeemedAt && (
                              <>
                                {' '}
                                · Último:{' '}
                                {new Date(liveActivity.lastRedeemedAt).toLocaleString('es')}
                              </>
                            )}
                          </p>
                          {liveActivity.stageMismatch && (
                            <p className="text-xs text-amber-900 mt-1">
                              Etapa sugerida por actividad:{' '}
                              <strong>{liveActivity.suggestedMonetizationStageLabel}</strong>
                            </p>
                          )}
                          {liveActivity.recentRedemptions.length > 0 && (
                            <ul className="mt-2 max-h-32 overflow-y-auto space-y-1 border-t border-sky-100 pt-2">
                              {liveActivity.recentRedemptions.map((r) => (
                                <li key={r.couponId} className="text-[11px] text-gray-700 flex justify-between gap-2">
                                  <span className="truncate font-mono">{r.shortCode || r.couponId}</span>
                                  <span className="shrink-0 text-gray-500">
                                    {r.redeemedAt
                                      ? new Date(r.redeemedAt).toLocaleString('es', {
                                          dateStyle: 'short',
                                          timeStyle: 'short',
                                        })
                                      : '—'}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-gray-500">Sin datos de canjes en vivo.</p>
                      )}
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 space-y-3">
                      <p className="text-xs font-semibold text-emerald-900 uppercase">Pipeline monetización</p>
                      <label className="block text-xs font-medium text-gray-600">Etapa monetización</label>
                      <select
                        value={editMonetizationStage}
                        onChange={(e) => setEditMonetizationStage(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        {CRM_MONETIZATION_STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <label className="block text-xs font-medium text-gray-600">Siguiente acción monetización</label>
                      <input
                        value={editMonetizationNextAction}
                        onChange={(e) => setEditMonetizationNextAction(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                      <label className="block text-xs font-medium text-gray-600">Notas monetización</label>
                      <textarea
                        value={editMonetizationNotes}
                        onChange={(e) => setEditMonetizationNotes(e.target.value)}
                        rows={2}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <label className="block text-xs font-medium text-gray-600">Estado perfil (Mongo)</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="active">Activo</option>
                      <option value="verified">Verificado</option>
                      <option value="suspended">Suspendido</option>
                    </select>
                    <label className="block text-xs font-medium text-gray-600">Activación CRM</label>
                    <select
                      value={editActivation}
                      onChange={(e) => setEditActivation(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      {Object.entries(ACTIVATION_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <label className="block text-xs font-medium text-gray-600">Envío de datos</label>
                    <select
                      value={editDataStatus}
                      onChange={(e) => setEditDataStatus(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      {Object.entries(DATA_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editTerms} onChange={(e) => setEditTerms(e.target.checked)} />
                      Términos y condiciones aceptados
                    </label>
                    <label className="block text-xs font-medium text-gray-600">Notas internas</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={4}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleSaveDetail}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Guardar CRM
                    </button>
                  </div>

                  {detail.events.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Eventos recientes</p>
                      <ul className="space-y-1 max-h-40 overflow-y-auto text-xs">
                        {detail.events.map((ev) => (
                          <li key={ev.id} className="flex justify-between gap-2 text-gray-600">
                            <span>
                              {ev.eventType} · {ev.appKey}
                            </span>
                            <span>{ev.createdAt ? new Date(ev.createdAt).toLocaleString('es') : ''}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
