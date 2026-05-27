import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  page: number;
  totalPages: number;
  totalDocs: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  className?: string;
};

export default function CrmPagination({
  page,
  totalPages,
  totalDocs,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [25, 50, 100],
  className = '',
}: Props) {
  const from = totalDocs === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalDocs);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t text-sm bg-white/80 ${className}`}
    >
      <span className="text-gray-500">
        {totalDocs === 0 ? (
          'Sin resultados'
        ) : (
          <>
            Mostrando {from}–{to} de {totalDocs.toLocaleString()} · página {page}/{totalPages}
          </>
        )}
      </span>
      <div className="flex items-center gap-2">
        {onLimitChange && (
          <label className="flex items-center gap-1.5 text-gray-600 text-xs">
            Por página
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="border rounded-md px-2 py-1 text-sm bg-white"
            >
              {limitOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          className="px-2 py-1 rounded border text-xs disabled:opacity-40 hover:bg-gray-50"
          title="Primera página"
        >
          «
        </button>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-2 rounded border disabled:opacity-40 hover:bg-gray-50"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-2 rounded border disabled:opacity-40 hover:bg-gray-50"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="px-2 py-1 rounded border text-xs disabled:opacity-40 hover:bg-gray-50"
          title="Última página"
        >
          »
        </button>
      </div>
    </div>
  );
}
