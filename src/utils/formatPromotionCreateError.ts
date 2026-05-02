/** Mensaje legible cuando POST /api/promotions falla (validación, BD, etc.). */
export function formatPromotionCreateError(data: {
    message?: unknown;
    fieldErrors?: Record<string, unknown>;
}): string {
    let msg =
        typeof data.message === 'string' && data.message.trim()
            ? data.message.trim()
            : 'Error al crear la promoción';
    if (data.fieldErrors && typeof data.fieldErrors === 'object') {
        const lines = Object.entries(data.fieldErrors).filter(([, v]) => v != null && String(v).trim() !== '');
        if (lines.length) {
            msg += `\n${lines.map(([k, v]) => `${k}: ${String(v)}`).join('\n')}`;
        }
    }
    return msg;
}
