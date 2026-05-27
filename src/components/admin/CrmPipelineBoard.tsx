import React, { useCallback, useState } from 'react';
import { GripVertical, Loader2 } from 'lucide-react';
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
    <div className="overflow-x-auto pb-4 -mx-1 px-1">
      <div className="flex gap-3 min-w-max items-start">
        {board.columns.map((col) => (
          <div
            key={col.stage}
            className={`w-[272px] shrink-0 rounded-xl border bg-slate-100/80 flex flex-col max-h-[calc(100vh-14rem)] ${
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
            <div className="px-3 py-2.5 border-b border-slate-200 bg-white/90 rounded-t-xl sticky top-0 z-10">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-800 leading-tight">{col.label}</h3>
                <span className="text-xs font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                  {col.cards.length}
                </span>
              </div>
            </div>

            <div className="p-2 space-y-2 overflow-y-auto flex-1 min-h-[120px]">
              {col.cards.length === 0 && (
                <p className="text-[11px] text-slate-400 text-center py-6 px-2">
                  Arrastra un lead aquí
                </p>
              )}
              {col.cards.map((card) => {
                const isDragging = draggingId === card.influencerId;
                const isMoving = movingId === card.influencerId;
                return (
                  <div
                    key={card.influencerId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card)}
                    onDragEnd={handleDragEnd}
                    className={`rounded-lg border bg-white shadow-sm cursor-grab active:cursor-grabbing transition-opacity ${
                      isDragging ? 'opacity-40' : ''
                    } ${isMoving ? 'opacity-60 pointer-events-none' : 'hover:border-purple-300'}`}
                  >
                    <div className="flex gap-2 p-2">
                      <GripVertical className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" aria-hidden />
                      <button
                        type="button"
                        onClick={() => onSelectCard(card.influencerId)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <img
                            src={mediaUrl(card.avatar, card.name)}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{card.name}</p>
                            <p className="text-[11px] text-gray-500 truncate">{card.username}</p>
                          </div>
                          {isMoving && (
                            <Loader2 className="w-4 h-4 animate-spin text-purple-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              IDENTITY_BADGE[card.identityVerificationStatus] || IDENTITY_BADGE.pending
                            }`}
                          >
                            {IDENTITY_SHORT[card.identityVerificationStatus] || 'ID'}
                          </span>
                          {card.outreachPendingCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                              {card.outreachPendingCount} envío pend.
                            </span>
                          )}
                        </div>
                        {(card.contactEmail || card.contactPhone) && (
                          <p className="text-[10px] text-gray-500 truncate">
                            {card.contactEmail || card.contactPhone}
                          </p>
                        )}
                        {card.nextAction && (
                          <p className="text-[10px] text-purple-800 mt-1 line-clamp-2">{card.nextAction}</p>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-500 mt-3">
        {board.totalCards} lead(s) · Arrastra entre columnas o abre la ficha para editar detalle
      </p>
    </div>
  );
}
