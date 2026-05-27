import React, { useCallback, useState } from 'react';
import { Eye, ExternalLink, GripVertical, Loader2, Pencil } from 'lucide-react';
import { mediaUrl } from '../../utils/apiUrl';
import type { CrmPipelineBoardData, CrmPipelineCard } from '../../services/adminCrm';

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

function profileHref(card: CrmPipelineCard): string | null {
  if (card.profilePublicUrl?.trim()) return card.profilePublicUrl.trim();
  const slug = (card.publicSlug || card.username || '').replace(/^@/, '');
  if (!slug) return null;
  return `/influencer/${encodeURIComponent(slug)}`;
}

type Props = {
  board: CrmPipelineBoardData | null;
  loading: boolean;
  movingId: string | null;
  onSelectCard: (influencerId: string) => void;
  onMoveCard: (influencerId: string, pipelineStage: string) => Promise<void>;
};

export default function CrmPipelineBoard({
  board,
  loading,
  movingId,
  onSelectCard,
  onMoveCard,
}: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, card: CrmPipelineCard) => {
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
      if (card?.pipelineStage === stage) return;
      await onMoveCard(influencerId, stage);
      setDraggingId(null);
    },
    [board, onMoveCard],
  );

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
            const accent = STAGE_ACCENT[col.stage] || 'border-t-slate-300';
            const badgeCls = STAGE_BADGE[col.stage] || 'bg-slate-100 text-slate-800';
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
                    <span className="text-xs font-semibold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full min-w-[1.5rem] text-center">
                      {col.cards.length}
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
                    const href = profileHref(card);
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
                                className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mb-1.5 ${badgeCls}`}
                              >
                                {card.pipelineStageLabel}
                              </span>
                              <div className="flex items-center gap-2">
                                <img
                                  src={mediaUrl(card.avatar, card.name)}
                                  alt=""
                                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-100"
                                />
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
                            <span className="font-medium text-slate-800">
                              {ACTIVATION_LABELS[card.activationStatus] || card.activationStatus}
                            </span>
                            {' · '}
                            {DATA_LABELS[card.dataSubmissionStatus] || card.dataSubmissionStatus}
                            {' · '}
                            <span className="text-purple-700">{card.profileCompleteness ?? 0}%</span>
                            {card.redeemedCoupons > 0 && (
                              <>
                                {' · '}
                                <span>{card.redeemedCoupons} canje(s)</span>
                              </>
                            )}
                          </p>

                          <div className="flex flex-wrap gap-1 mb-2 pl-5">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                IDENTITY_BADGE[card.identityVerificationStatus] || IDENTITY_BADGE.pending
                              }`}
                            >
                              {IDENTITY_SHORT[card.identityVerificationStatus] || 'ID'}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-800">
                              DC {card.damecodigoInstalls ?? 0}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-900">
                              Biz {card.bizneaiInstalls ?? 0}
                            </span>
                            {card.termsAccepted && (
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
      <p className="text-[11px] text-gray-500 mt-1">
        {board.totalCards} cuenta(s) · Arrastra fichas entre columnas o usa Ver ficha / Editar para el detalle
      </p>
    </div>
  );
}
