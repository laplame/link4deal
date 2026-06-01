import React, { useCallback, useState } from 'react';
import { Eye, ExternalLink, FileCheck, GripVertical, Loader2, Pencil } from 'lucide-react';
import type { CrmPendingPromotionApplication } from '../../services/adminCrm';
import { mediaUrl } from '../../utils/apiUrl';
import type {
  CrmMonetizationCard,
  CrmPipelineBoardData,
  CrmPipelineCard,
} from '../../services/adminCrm';

export type CrmBoardKind = 'activation' | 'monetization';
type KanbanCard = CrmPipelineCard | CrmMonetizationCard;

function cardStage(card: KanbanCard, kind: CrmBoardKind): string {
  if (kind === 'monetization') return (card as CrmMonetizationCard).monetizationStage;
  return (card as CrmPipelineCard).pipelineStage;
}

function cardStageLabel(card: KanbanCard, kind: CrmBoardKind): string {
  if (kind === 'monetization') return (card as CrmMonetizationCard).monetizationStageLabel;
  return (card as CrmPipelineCard).pipelineStageLabel;
}

const IDENTITY_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

const IDENTITY_SHORT: Record<string, string> = {
  pending: 'ID pend.',
  approved: 'ID OK',
  rejected: 'ID no',
};

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

/** Color de acento por etapa (borde superior de columna y badge en ficha). */
const STAGE_ACCENT: Record<string, string> = {
  lead: 'border-t-blue-500',
  contacted: 'border-t-sky-500',
  awaiting_contact_email: 'border-t-cyan-600',
  profile_link_sent: 'border-t-indigo-500',
  profile_confirmed: 'border-t-violet-500',
  in_database: 'border-t-purple-600',
  app_link_sent: 'border-t-fuchsia-500',
  terms_sent: 'border-t-pink-500',
  materials_complete: 'border-t-emerald-500',
  onboarded: 'border-t-green-600',
  stalled: 'border-t-amber-500',
  inactive: 'border-t-slate-400',
};

const STAGE_BADGE: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-800',
  contacted: 'bg-sky-100 text-sky-900',
  awaiting_contact_email: 'bg-cyan-100 text-cyan-900',
  profile_link_sent: 'bg-indigo-100 text-indigo-900',
  profile_confirmed: 'bg-violet-100 text-violet-900',
  in_database: 'bg-purple-100 text-purple-900',
  app_link_sent: 'bg-fuchsia-100 text-fuchsia-900',
  terms_sent: 'bg-pink-100 text-pink-900',
  materials_complete: 'bg-emerald-100 text-emerald-900',
  onboarded: 'bg-green-100 text-green-900',
  stalled: 'bg-amber-100 text-amber-900',
  inactive: 'bg-slate-200 text-slate-700',
};

function formatRelativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 60) return 'hace un momento';
  if (sec < 3600) return `hace ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `hace ${Math.floor(sec / 3600)} h`;
  return `hace ${Math.floor(sec / 86400)} d`;
}

function profileHref(card: CrmPipelineCard): string | null {
  if (card.profilePublicUrl?.trim()) return card.profilePublicUrl.trim();
  const slug = (card.publicSlug || card.username || '').replace(/^@/, '');
  if (!slug) return null;
  return `/influencer/${encodeURIComponent(slug)}`;
}

const MONETIZATION_ACCENT: Record<string, string> = {
  ready: 'border-t-emerald-500',
  wallet_setup: 'border-t-yellow-500',
  seeking_campaigns: 'border-t-blue-500',
  coupons_live: 'border-t-indigo-500',
  first_redemption: 'border-t-violet-500',
  payout_pending: 'border-t-amber-500',
  payout_active: 'border-t-green-600',
  scaling: 'border-t-purple-600',
  stalled: 'border-t-orange-400',
  inactive: 'border-t-slate-400',
};

const MONETIZATION_BADGE: Record<string, string> = {
  ready: 'bg-emerald-100 text-emerald-900',
  wallet_setup: 'bg-yellow-100 text-yellow-900',
  seeking_campaigns: 'bg-blue-100 text-blue-800',
  coupons_live: 'bg-indigo-100 text-indigo-900',
  first_redemption: 'bg-violet-100 text-violet-900',
  payout_pending: 'bg-amber-100 text-amber-900',
  payout_active: 'bg-green-100 text-green-800',
  scaling: 'bg-purple-100 text-purple-900',
  stalled: 'bg-orange-100 text-orange-900',
  inactive: 'bg-slate-200 text-slate-700',
};

type Props = {
  board: CrmPipelineBoardData | null;
  loading: boolean;
  movingId: string | null;
  boardKind?: CrmBoardKind;
  onSelectCard: (influencerId: string) => void;
  onMoveCard: (influencerId: string, stage: string) => Promise<void>;
  onApplySuggestedStage?: (influencerId: string, stage: string) => Promise<void>;
  onApproveApplication?: (influencerId: string, applicationId: string) => Promise<void>;
  approvingApplicationId?: string | null;
};

export default function CrmPipelineBoard({
  board,
  loading,
  movingId,
  boardKind = 'activation',
  onSelectCard,
  onMoveCard,
  onApplySuggestedStage,
  onApproveApplication,
  approvingApplicationId,
}: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, card: KanbanCard) => {
    setDraggingId(card.influencerId);
    e.dataTransfer.setData('text/plain', card.influencerId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, stage: string) => {
      e.preventDefault();
      setDropTarget(null);
      const influencerId = e.dataTransfer.getData('text/plain');
      if (!influencerId) return;
      const card = board?.columns.flatMap((c) => c.cards).find((x) => x.influencerId === influencerId);
      if (card && cardStage(card, boardKind) === stage) return;
      await onMoveCard(influencerId, stage);
      setDraggingId(null);
    },
    [board, boardKind, onMoveCard],
  );

  const accentMap = boardKind === 'monetization' ? MONETIZATION_ACCENT : STAGE_ACCENT;
  const badgeMap = boardKind === 'monetization' ? MONETIZATION_BADGE : STAGE_BADGE;

  if (loading && !board) {
    return (
      <div className="py-20 flex justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!board) {
    return <p className="text-center py-12 text-gray-500">No se pudo cargar el tablero.</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto pb-4 -mx-1 px-1">
        <div className="flex gap-3 min-w-max items-start">
          {board.columns.map((col) => {
            const accent = accentMap[col.stage] || 'border-t-slate-300';
            const badgeCls = badgeMap[col.stage] || 'bg-slate-100 text-slate-800';
            return (
              <div
                key={col.stage}
                className={`w-[300px] shrink-0 rounded-xl border border-t-4 bg-slate-100/90 flex flex-col max-h-[calc(100vh-16rem)] ${accent} ${
                  dropTarget === col.stage ? 'border-purple-400 ring-2 ring-purple-200' : 'border-slate-200'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDropTarget(col.stage);
                }}
                onDragLeave={() => setDropTarget((s) => (s === col.stage ? null : s))}
                onDrop={(e) => handleDrop(e, col.stage)}
              >
                <div className="px-3 py-2.5 border-b border-slate-200 bg-white rounded-t-[10px] sticky top-0 z-10">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700 leading-tight">
                      {col.label}
                    </h3>
                <span
                  className="text-xs font-semibold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full min-w-[1.5rem] text-center"
                  title={
                    col.totalInStage != null && col.totalInStage !== col.cards.length
                      ? `${col.cards.length} en esta página · ${col.totalInStage} en total`
                      : undefined
                  }
                >
                  {col.totalInStage != null && col.totalInStage !== col.cards.length
                    ? `${col.cards.length}/${col.totalInStage}`
                    : col.cards.length}
                </span>
                  </div>
                </div>

                <div className="p-2 space-y-2 overflow-y-auto flex-1 min-h-[140px]">
                  {col.cards.length === 0 && (
                    <p className="text-[11px] text-slate-400 text-center py-8 px-2">
                      Sin cuentas en esta etapa
                    </p>
                  )}
                  {col.cards.map((card) => {
                    const isDragging = draggingId === card.influencerId;
                    const isMoving = movingId === card.influencerId;
                    const href = profileHref(card as CrmPipelineCard);
                    const mCard = card as CrmMonetizationCard;
                    const stageLabel = cardStageLabel(card, boardKind);
                    return (
                      <div
                        key={card.influencerId}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card)}
                        onDragEnd={handleDragEnd}
                        className={`rounded-lg border border-slate-200 bg-white shadow-sm transition-opacity ${
                          isDragging ? 'opacity-40' : ''
                        } ${isMoving ? 'opacity-60 pointer-events-none' : 'hover:shadow-md hover:border-purple-200'}`}
                      >
                        <div className="p-2.5">
                          <div className="flex items-start gap-1.5 mb-2">
                            <GripVertical
                              className="w-4 h-4 text-slate-300 shrink-0 mt-1 cursor-grab active:cursor-grabbing"
                              aria-hidden
                            />
                            <div className="flex-1 min-w-0">
                              <span
                                className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mb-1.5 ${badgeMap[cardStage(card, boardKind)] || badgeCls}`}
                              >
                                {stageLabel}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="relative shrink-0">
                                  <img
                                    src={mediaUrl(card.avatar, card.name)}
                                    alt=""
                                    className="w-9 h-9 rounded-full object-cover border border-slate-100"
                                  />
                                  {boardKind === 'monetization' && mCard.hasRecentActivity && (
                                    <span
                                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse"
                                      title="Canje en los últimos 5 min"
                                    />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                                    {card.name || card.username}
                                  </p>
                                  <p className="text-[11px] text-gray-500 truncate">{card.username}</p>
                                </div>
                                {isMoving && (
                                  <Loader2 className="w-4 h-4 animate-spin text-purple-500 shrink-0" />
                                )}
                              </div>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-600 mb-2 pl-5">
                            {boardKind === 'monetization' ? (
                              <>
                                <span className="font-medium text-slate-800">
                                  ${mCard.totalEarnings?.toFixed?.(2) ?? mCard.totalEarnings ?? 0}
                                </span>
                                {' · '}
                                {mCard.redeemedCoupons ?? 0} canje(s)
                                {(mCard.openCouponsCount ?? 0) > 0 && (
                                  <>
                                    {' · '}
                                    <span className="text-indigo-700">{mCard.openCouponsCount} cupón(es) abierto(s)</span>
                                  </>
                                )}
                                {' · '}
                                {mCard.activePromotions ?? 0} promo(s)
                                {mCard.hasWallet ? ' · Wallet OK' : ' · Sin wallet'}
                                {mCard.lastRedeemedAt && (
                                  <>
                                    {' · '}
                                    <span className="text-emerald-700">
                                      Últ. canje {formatRelativeTime(mCard.lastRedeemedAt)}
                                    </span>
                                  </>
                                )}
                                {(mCard.settlementPendingCount ?? 0) > 0 && (
                                  <>
                                    {' · '}
                                    <span className="text-amber-800">
                                      ${mCard.settlementPendingUsd?.toFixed?.(2)} pend.
                                    </span>
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="font-medium text-slate-800">
                                  {ACTIVATION_LABELS[card.activationStatus] || card.activationStatus}
                                </span>
                                {' · '}
                                {DATA_LABELS[(card as CrmPipelineCard).dataSubmissionStatus] ||
                                  (card as CrmPipelineCard).dataSubmissionStatus}
                                {' · '}
                                <span className="text-purple-700">{card.profileCompleteness ?? 0}%</span>
                                {(card as CrmPipelineCard).redeemedCoupons > 0 && (
                                  <>
                                    {' · '}
                                    <span>{(card as CrmPipelineCard).redeemedCoupons} canje(s)</span>
                                  </>
                                )}
                              </>
                            )}
                          </p>
                          {boardKind === 'monetization' && (
                            <p className="text-[10px] text-slate-500 pl-5 mb-1">
                              Activación: {mCard.outreachStageLabel || '—'}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1 mb-2 pl-5">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                IDENTITY_BADGE[card.identityVerificationStatus] || IDENTITY_BADGE.pending
                              }`}
                            >
                              {IDENTITY_SHORT[card.identityVerificationStatus] || 'ID'}
                            </span>
                            {boardKind === 'activation' && (
                              <>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-800">
                                  DC {(card as CrmPipelineCard).damecodigoInstalls ?? 0}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-900">
                                  Biz {(card as CrmPipelineCard).bizneaiInstalls ?? 0}
                                </span>
                              </>
                            )}
                            {boardKind === 'monetization' && (mCard.settlementPaidCount ?? 0) > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-800">
                                ${mCard.settlementPaidUsd?.toFixed?.(2)} pagado
                              </span>
                            )}
                            {boardKind === 'activation' && (card as CrmPipelineCard).termsAccepted && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800">
                                Términos OK
                              </span>
                            )}
                            {card.outreachPendingCount > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                                {card.outreachPendingCount} envío pend.
                              </span>
                            )}
                          </div>

                          {(card.contactEmail || card.contactPhone) && (
                            <p className="text-[10px] text-gray-500 truncate pl-5 mb-1">
                              {card.contactEmail || card.contactPhone}
                            </p>
                          )}
                          {card.nextAction && (
                            <p className="text-[10px] text-purple-900 bg-purple-50/80 rounded px-2 py-1 mb-2 line-clamp-2">
                              {card.nextAction}
                            </p>
                          )}
                          {(card as KanbanCard & { pendingApplications?: CrmPendingPromotionApplication[] })
                            .pendingApplications &&
                            (card as KanbanCard & { pendingApplications?: CrmPendingPromotionApplication[] })
                              .pendingApplications!.length > 0 &&
                            onApproveApplication && (
                              <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 space-y-1.5">
                                <p className="text-[10px] font-semibold text-amber-950 uppercase tracking-wide">
                                  Solicitud promo
                                </p>
                                {(
                                  card as KanbanCard & {
                                    pendingApplications?: CrmPendingPromotionApplication[];
                                  }
                                ).pendingApplications!.map((app) => (
                                  <div
                                    key={app.id}
                                    className="flex items-start justify-between gap-1.5"
                                  >
                                    <p className="text-[10px] text-amber-950 leading-snug min-w-0 flex-1 line-clamp-2">
                                      {app.promotionTitle}
                                      {app.redirectInsteadOfQr ? (
                                        <span className="text-amber-700"> · URL</span>
                                      ) : null}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (
                                          !window.confirm(
                                            `¿Aprobar la solicitud para «${app.promotionTitle}»?`,
                                          )
                                        ) {
                                          return;
                                        }
                                        void onApproveApplication(card.influencerId, app.id);
                                      }}
                                      disabled={approvingApplicationId === app.id}
                                      className="shrink-0 inline-flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                      {approvingApplicationId === app.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
                                      ) : (
                                        <FileCheck className="w-3 h-3" aria-hidden />
                                      )}
                                      Aceptar
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          {boardKind === 'monetization' &&
                            mCard.stageMismatch &&
                            mCard.suggestedMonetizationStage &&
                            onApplySuggestedStage && (
                              <div className="mb-2 rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5 text-[10px] text-sky-950">
                                <p>
                                  Según canjes en vivo, etapa sugerida:{' '}
                                  <strong>{mCard.suggestedMonetizationStageLabel}</strong>
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void onApplySuggestedStage(
                                      card.influencerId,
                                      mCard.suggestedMonetizationStage!,
                                    );
                                  }}
                                  className="mt-1 text-sky-800 font-medium underline hover:text-sky-950"
                                >
                                  Mover ficha aquí
                                </button>
                              </div>
                            )}

                          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => onSelectCard(card.influencerId)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="w-3 h-3" />
                              Ver ficha
                            </button>
                            <button
                              type="button"
                              onClick={() => onSelectCard(card.influencerId)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded bg-blue-600 text-white hover:bg-blue-700"
                            >
                              <Pencil className="w-3 h-3" />
                              Editar
                            </button>
                            {href && (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Perfil
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {board.eligibilityNote && boardKind === 'monetization' && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">
          {board.eligibilityNote}
        </p>
      )}
      <p className="text-[11px] text-gray-500 mt-1">
        {board.totalCards} cuenta(s) · Arrastra fichas entre columnas o usa Ver ficha / Editar para el detalle
        {boardKind === 'monetization' ? ' (monetización)' : ' (activación)'}
      </p>
    </div>
  );
}
