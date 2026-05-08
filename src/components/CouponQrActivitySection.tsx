import React from 'react';
import { ExternalLink, MapPin, Ticket } from 'lucide-react';
import type { PublicCouponRedemption } from './SalesAndBidsRealtimeChart';

export type CouponActivityPack = {
  open: PublicCouponRedemption[];
  redeemed: PublicCouponRedemption[];
  expiredUnused: PublicCouponRedemption[];
};

export type CouponQrActivityTheme = 'profile' | 'live';

export type CouponQrActivitySectionProps = {
  theme: CouponQrActivityTheme;
  activity: CouponActivityPack | null;
  loading: boolean;
  /** Cuando hay datos cargados pero las tres listas están vacías. */
  emptyMessage: string;
  /** Columna Influencer en las tablas (panel global). */
  showInfluencerColumn?: boolean;
};

function formatIsoDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

function shortId(id: string | null | undefined, head = 8): string {
  if (!id) return '—';
  return id.length > head ? `${id.slice(0, head)}…` : id;
}

function formatReferral(code: string | null | undefined): string {
  if (!code) return '—';
  return code.length > 14 ? `${code.slice(0, 6)}…${code.slice(-4)}` : code;
}

function promoShop(row: PublicCouponRedemption): string | null {
  const s = row.promoShopId ?? row.shopId ?? null;
  return s && String(s).trim() !== '' ? String(s).trim() : null;
}

function ledgerTotal(act: CouponActivityPack | null): number {
  if (!act) return 0;
  return act.open.length + act.redeemed.length + act.expiredUnused.length;
}

function LocationMapLink(props: {
  theme: CouponQrActivityTheme;
  location: { lat: number; lng: number; accuracyM?: number | null } | null | undefined;
}) {
  if (!props.location) {
    return (
      <span
        className={
          props.theme === 'live' ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'
        }
      >
        Sin coordenadas
      </span>
    );
  }
  const { lat, lng, accuracyM } = props.location;
  const href = `https://www.google.com/maps?q=${lat},${lng}`;
  const acc =
    accuracyM != null && Number.isFinite(accuracyM)
      ? ` · ±${Math.round(accuracyM)} m`
      : '';
  const cls =
    props.theme === 'live'
      ? 'inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 text-xs font-medium'
      : 'inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 text-xs font-medium';
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      <MapPin className="w-3.5 h-3.5 shrink-0" />
      Mapa{acc}
      <ExternalLink className="w-3 h-3 opacity-70" />
    </a>
  );
}

/** Bloque «Cupones QR · actividad en tienda» (abiertos / redimidos / caducados). */
export function CouponQrActivitySection({
  theme,
  activity,
  loading,
  emptyMessage,
  showInfluencerColumn = false,
}: CouponQrActivitySectionProps): React.ReactElement {
  const t = theme;
  const h3 =
    t === 'live'
      ? 'text-lg font-semibold text-white mb-1 flex items-center gap-2'
      : 'text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2';
  const pLead =
    t === 'live' ? 'text-sm text-gray-400 mb-1' : 'text-sm text-gray-500 mb-1';
  const pSmall =
    t === 'live' ? 'text-xs text-gray-500 mb-4' : 'text-xs text-gray-500 mb-4';
  const codeCls =
    t === 'live'
      ? 'bg-black/35 text-emerald-200/95 px-1 rounded border border-white/10'
      : 'bg-gray-100 px-1 rounded';
  const loadingCls = t === 'live' ? 'text-sm text-gray-400 mb-3' : 'text-sm text-gray-500 mb-3';
  const emptyCls = t === 'live' ? 'text-sm text-gray-400 py-4' : 'text-sm text-gray-500 py-4';

  const tblOpenWrap =
    t === 'live'
      ? 'overflow-x-auto rounded-xl border border-emerald-500/25 bg-gray-950/40'
      : 'overflow-x-auto rounded-lg border border-green-100';
  const theadOpen =
    t === 'live'
      ? 'bg-emerald-950/55 text-left text-emerald-100/90 border-b border-emerald-500/20'
      : 'bg-green-50/80 text-left text-gray-700';
  const tbodyRowOpen =
    t === 'live'
      ? 'bg-transparent hover:bg-emerald-950/35 border-b border-white/5'
      : 'bg-white hover:bg-green-50/30';

  const tblRedWrap =
    t === 'live'
      ? 'overflow-x-auto rounded-xl border border-purple-500/25 bg-gray-950/40'
      : 'overflow-x-auto rounded-lg border border-purple-100';
  const theadRed =
    t === 'live'
      ? 'bg-violet-950/50 text-left text-violet-100/90 border-b border-violet-500/20'
      : 'bg-purple-50/80 text-left text-gray-700';
  const tbodyRowRed =
    t === 'live'
      ? 'bg-transparent hover:bg-violet-950/30 border-b border-white/5'
      : 'bg-white hover:bg-purple-50/30';

  const tblExpWrap =
    t === 'live'
      ? 'overflow-x-auto rounded-xl border border-white/10 bg-gray-950/35'
      : 'overflow-x-auto rounded-lg border border-gray-200';
  const theadExp =
    t === 'live'
      ? 'bg-gray-900/80 text-left text-gray-300 border-b border-white/10'
      : 'bg-gray-50 text-left text-gray-600';
  const tbodyRowExp =
    t === 'live'
      ? 'bg-transparent hover:bg-white/5 border-b border-white/5'
      : 'bg-white hover:bg-gray-50/80';

  const cellMuted = (live: string, prof: string) => (t === 'live' ? live : prof);
  const total = ledgerTotal(activity);
  const showEmpty = Boolean(activity && total === 0 && !loading);

  const strongGreen = t === 'live' ? 'font-medium text-emerald-300/95' : 'font-medium text-green-700';
  const strongPurple = t === 'live' ? 'font-medium text-violet-200' : 'font-medium text-purple-800';

  const badgeOpen =
    t === 'live'
      ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-600/25 text-emerald-200 border border-emerald-500/35'
      : 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800';
  const badgeRed =
    t === 'live'
      ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-600/25 text-violet-100 border border-violet-500/35'
      : 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-900';
  const badgeExp =
    t === 'live'
      ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-600/35 text-gray-200 border border-white/15'
      : 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800';

  const h4 = t === 'live' ? 'text-md font-semibold text-gray-100 mb-2 flex flex-wrap items-center gap-2' : 'text-md font-semibold text-gray-900 mb-2 flex items-center gap-2';

  const rootCls =
    theme === 'live' ? 'mt-6 pt-0 border-t border-white/10' : 'mt-8 pt-6 border-t border-gray-200';

  return (
    <div className={rootCls}>
      <h3 className={h3}>
        <Ticket className={t === 'live' ? 'w-5 h-5 text-emerald-400' : 'w-5 h-5 text-emerald-600'} />
        Cupones QR · actividad en tienda
      </h3>
      <p className={pLead}>
        Comparación explícita: cupones <span className={strongGreen}>abiertos</span> (sin canjear, aún válidos)
        frente a <span className={strongPurple}>canjeados</span> (fecha y hora de redención en negrita en la
        tabla).
      </p>
      <p className={pSmall}>
        <strong className={t === 'live' ? 'text-gray-200' : ''}>Última apertura / escaneo:</strong> última vez
        que el comercio validó el QR (<code className={codeCls}>GET/POST /api/discount-qr/verify</code>). Si el
        lector envía <code className={codeCls}>latitude</code>, <code className={codeCls}>longitude</code> y{' '}
        <code className={codeCls}>shopId</code>, verás ubicación en mapa y tienda donde se escaneó.
        <strong className={t === 'live' ? 'text-gray-200' : ''}> Ubicación al canjear</strong> corresponde a los
        datos del <code className={codeCls}>POST /api/discount-qr/redeem</code>.
      </p>

      {loading && <p className={loadingCls}>Cargando actividad de cupones…</p>}
      {showEmpty && <p className={emptyCls}>{emptyMessage}</p>}

      {/* Abiertos */}
      {activity && activity.open.length > 0 && (
        <div className="mb-8">
          <h4 className={h4}>
            <span className={badgeOpen}>Abiertos</span>
            <span className={t === 'live' ? 'text-gray-400 text-sm font-normal' : ''}>
              {activity.open.length} vigentes sin canje
            </span>
          </h4>
          <div className={tblOpenWrap}>
            <table className={t === 'live' ? 'min-w-full text-sm text-gray-200' : 'min-w-full text-sm'}>
              <thead className={theadOpen}>
                <tr>
                  <th className="px-3 py-2 font-medium">Referencia</th>
                  {showInfluencerColumn && (
                    <th className="px-3 py-2 font-medium">Influencer</th>
                  )}
                  <th className="px-3 py-2 font-medium">Válido hasta</th>
                  <th className="px-3 py-2 font-medium">Emitido</th>
                  <th className="px-3 py-2 font-medium">Últ. escaneo en tienda</th>
                  <th className="px-3 py-2 font-medium">Tienda (lector)</th>
                  <th className="px-3 py-2 font-medium">Mapa · escaneo</th>
                  <th className="px-3 py-2 font-medium">Promoción</th>
                  <th className="px-3 py-2 font-medium">Tienda (promo)</th>
                </tr>
              </thead>
              <tbody className={t === 'live' ? 'divide-y divide-white/5' : 'divide-y divide-gray-100'}>
                {activity.open.map((row) => (
                  <tr key={row.couponId} className={tbodyRowOpen}>
                    <td className="px-3 py-2 font-mono text-xs">{formatReferral(row.referralCode)}</td>
                    {showInfluencerColumn && (
                      <td className="px-3 py-2 font-mono text-xs">{shortId(row.influencerId, 10)}</td>
                    )}
                    <td
                      className={`px-3 py-2 whitespace-nowrap font-medium ${cellMuted('text-gray-100', 'text-gray-900')}`}
                    >
                      {formatIsoDateTime(row.expiresAt)}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${cellMuted('text-gray-400', 'text-gray-600')}`}>
                      {formatIsoDateTime(row.createdAt)}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${cellMuted('text-gray-100', 'text-gray-900')}`}>
                      {formatIsoDateTime(row.lastOpenedAt)}
                    </td>
                    <td className={`px-3 py-2 font-mono text-xs ${cellMuted('text-gray-300', 'text-gray-700')}`}>
                      {shortId(row.openedAtShopId, 14)}
                    </td>
                    <td className="px-3 py-2">
                      <LocationMapLink theme={theme} location={row.openLocation} />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{shortId(row.promotionId)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{shortId(promoShop(row), 12)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Redimidos */}
      {activity && activity.redeemed.length > 0 && (
        <div className="mb-8">
          <h4 className={h4}>
            <span className={badgeRed}>Redimidos</span>
            <span className={t === 'live' ? 'text-gray-400 text-sm font-normal' : ''}>
              {activity.redeemed.length} canjes completados
            </span>
          </h4>
          <div className={tblRedWrap}>
            <table className={t === 'live' ? 'min-w-full text-sm text-gray-200' : 'min-w-full text-sm'}>
              <thead className={theadRed}>
                <tr>
                  <th className="px-3 py-2 font-medium">Fecha y hora del canje</th>
                  {showInfluencerColumn && (
                    <th className="px-3 py-2 font-medium">Influencer</th>
                  )}
                  <th className="px-3 py-2 font-medium">Desc.</th>
                  <th className="px-3 py-2 font-medium">Promoción</th>
                  <th className="px-3 py-2 font-medium">Tienda (promo)</th>
                  <th className="px-3 py-2 font-medium">Últ. escaneo antes del canje</th>
                  <th className="px-3 py-2 font-medium">Tienda (lector)</th>
                  <th className="px-3 py-2 font-medium">Mapa · escaneo</th>
                  <th className="px-3 py-2 font-medium">Mapa · canje</th>
                  <th className="px-3 py-2 font-medium">Código</th>
                </tr>
              </thead>
              <tbody className={t === 'live' ? 'divide-y divide-white/5' : 'divide-y divide-gray-100'}>
                {activity.redeemed.map((row) => {
                  const redeemWhen = row.redeemedAt || row.usedAt;
                  return (
                    <tr key={`${row.couponId}-${redeemWhen ?? ''}`} className={tbodyRowRed}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`font-semibold ${cellMuted('text-white', 'text-gray-900')}`}>
                          {formatIsoDateTime(redeemWhen)}
                        </span>
                      </td>
                      {showInfluencerColumn && (
                        <td className="px-3 py-2 font-mono text-xs">{shortId(row.influencerId, 10)}</td>
                      )}
                      <td className="px-3 py-2">
                        {row.discountPercentage != null && !Number.isNaN(row.discountPercentage)
                          ? `${row.discountPercentage}%`
                          : '—'}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{shortId(row.promotionId)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{shortId(promoShop(row), 12)}</td>
                      <td className={`px-3 py-2 whitespace-nowrap ${cellMuted('text-gray-300', 'text-gray-800')}`}>
                        {formatIsoDateTime(row.lastOpenedAt)}
                      </td>
                      <td className={`px-3 py-2 font-mono text-xs ${cellMuted('text-gray-300', 'text-gray-800')}`}>
                        {shortId(row.openedAtShopId, 14)}
                      </td>
                      <td className="px-3 py-2">
                        <LocationMapLink theme={theme} location={row.openLocation} />
                      </td>
                      <td className="px-3 py-2">
                        <LocationMapLink theme={theme} location={row.redeemLocation} />
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{formatReferral(row.referralCode)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Caducados sin uso */}
      {activity && activity.expiredUnused.length > 0 && (
        <div>
          <h4 className={h4}>
            <span className={badgeExp}>Caducados (sin canje)</span>
            <span className={t === 'live' ? 'text-gray-400 text-sm font-normal' : ''}>{activity.expiredUnused.length}</span>
          </h4>
          <div className={tblExpWrap}>
            <table className={t === 'live' ? 'min-w-full text-sm text-gray-200' : 'min-w-full text-sm'}>
              <thead className={theadExp}>
                <tr>
                  <th className="px-3 py-2 font-medium">Referencia</th>
                  {showInfluencerColumn && (
                    <th className="px-3 py-2 font-medium">Influencer</th>
                  )}
                  <th className="px-3 py-2 font-medium">Expiró</th>
                  <th className="px-3 py-2 font-medium">Últ. escaneo</th>
                  <th className="px-3 py-2 font-medium">Tienda (lector)</th>
                  <th className="px-3 py-2 font-medium">Mapa · escaneo</th>
                  <th className="px-3 py-2 font-medium">Promoción</th>
                </tr>
              </thead>
              <tbody className={t === 'live' ? 'divide-y divide-white/5' : 'divide-y divide-gray-100'}>
                {activity.expiredUnused.map((row) => (
                  <tr key={row.couponId} className={tbodyRowExp}>
                    <td className="px-3 py-2 font-mono text-xs">{formatReferral(row.referralCode)}</td>
                    {showInfluencerColumn && (
                      <td className="px-3 py-2 font-mono text-xs">{shortId(row.influencerId, 10)}</td>
                    )}
                    <td className="px-3 py-2 whitespace-nowrap">{formatIsoDateTime(row.expiresAt)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatIsoDateTime(row.lastOpenedAt)}</td>
                    <td className={`px-3 py-2 font-mono text-xs ${cellMuted('text-gray-300', 'text-gray-800')}`}>
                      {shortId(row.openedAtShopId, 14)}
                    </td>
                    <td className="px-3 py-2">
                      <LocationMapLink theme={theme} location={row.openLocation} />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{shortId(row.promotionId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
