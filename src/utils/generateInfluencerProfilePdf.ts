import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { SITE_CONFIG } from '../config/site';
import { getApiBase, mediaUrl } from './apiUrl';
import { influencerProfilePath, resolveCanonicalPublicSlug } from './influencerPublicSlug';

export interface InfluencerPdfPromoCode {
  code: string;
  label?: string;
  promotionTitle?: string | null;
}

export interface InfluencerPdfInput {
  id: string;
  name: string;
  username?: string;
  publicSlug?: string;
  avatar?: string;
  status: string;
  location?: string;
  bio?: string;
  joinDate?: string;
  totalFollowers: number;
  engagement: number;
  followers: {
    instagram?: number;
    tiktok?: number;
    youtube?: number;
    twitter?: number;
  };
  socialMedia?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  };
  categories?: string[];
  profileShortCode?: string;
  couponStats?: {
    totalCoupons?: number;
    activeCoupons?: number;
    totalSales?: number;
    totalCommission?: number;
    averageConversion?: number;
  };
  totalEarnings?: number;
  completedPromotions?: number;
  activePromotions?: number;
  rating?: number;
  promoShortCodes?: InfluencerPdfPromoCode[];
  redeemedCoupons?: number;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  pending: 'Pendiente',
  verified: 'Verificado',
  suspended: 'Suspendido',
};

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function profileAbsoluteUrl(inf: InfluencerPdfInput): string {
  const base =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : SITE_CONFIG.website.replace(/\/$/, '');
  const path = influencerProfilePath({
    id: inf.id,
    name: inf.name,
    username: inf.username,
    socialMedia: inf.socialMedia,
    publicSlug: inf.publicSlug || resolveCanonicalPublicSlug(inf),
  });
  return `${base}${path}`;
}

function tryLoadImageAsDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!url?.trim()) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Genera y descarga un PDF carta (1 hoja) con stats, códigos cortos y QR al perfil.
 */
export async function generateInfluencerProfilePdf(inf: InfluencerPdfInput): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;

  const profileUrl = profileAbsoluteUrl(inf);
  const qrDataUrl = await QRCode.toDataURL(profileUrl, {
    width: 280,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  const purple: [number, number, number] = [124, 58, 237];
  const dark: [number, number, number] = [30, 27, 46];
  const muted: [number, number, number] = [100, 116, 139];

  // Header
  doc.setFillColor(...purple);
  doc.rect(0, 0, pageW, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(SITE_CONFIG.name, margin, 12);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(inf.name || 'Influencer', contentW - 50);
  doc.text(titleLines, margin, 22);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Ficha · ${new Date().toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    margin,
    33,
  );

  let y = 46;

  // Avatar + status row
  const avatarPath = mediaUrl(inf.avatar, inf.name);
  const apiBase = getApiBase();
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : SITE_CONFIG.website.replace(/\/$/, '');
  const avatarUrl = avatarPath.startsWith('http')
    ? avatarPath
    : apiBase
      ? `${apiBase.startsWith('http') ? apiBase : `${origin}${apiBase}`}${avatarPath}`
      : `${origin}${avatarPath}`;
  const avatarData = await tryLoadImageAsDataUrl(avatarUrl);
  if (avatarData) {
    doc.addImage(avatarData, 'JPEG', margin, y, 22, 22, undefined, 'FAST');
  } else {
    doc.setFillColor(236, 233, 254);
    doc.circle(margin + 11, y + 11, 11, 'F');
    doc.setTextColor(...purple);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const initials = (inf.name || '?')
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    doc.text(initials, margin + 11 - doc.getTextWidth(initials) / 2, y + 14);
  }

  const metaX = margin + 28;
  doc.setTextColor(...dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Estado: ${STATUS_LABELS[inf.status] || inf.status}`, metaX, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...muted);
  if (inf.location?.trim()) {
    doc.text(`Ubicación: ${inf.location.trim()}`, metaX, y + 12);
  }
  if (inf.joinDate) {
    doc.text(`Alta: ${inf.joinDate}`, metaX, y + 18);
  }
  const slug = resolveCanonicalPublicSlug(inf);
  if (slug) {
    doc.text(`Slug: @${slug}`, metaX, y + 24);
  }

  y += 30;

  // Código corto destacado
  if (inf.profileShortCode?.trim()) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(margin, y, contentW, 22, 3, 3, 'FD');
    doc.setTextColor(6, 95, 70);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CÓDIGO CORTO DE PERFIL', margin + 4, y + 8);
    doc.setFontSize(22);
    doc.setFont('courier', 'bold');
    doc.setTextColor(...dark);
    doc.text(inf.profileShortCode.trim().toUpperCase(), margin + 4, y + 18);
    y += 28;
  }

  // Stats grid (2 cols)
  const cs = inf.couponStats || {};
  const stats: [string, string][] = [
    ['Seguidores totales', formatFollowers(inf.totalFollowers || 0)],
    ['Engagement', `${inf.engagement || 0}%`],
    ['Cupones emitidos', String(cs.totalCoupons ?? 0)],
    ['Cupones vigentes', String(cs.activeCoupons ?? 0)],
    ['Canjes / redimidos', String(inf.redeemedCoupons ?? cs.totalSales ?? 0)],
    ['Comisión est. (USD)', `$${Number(inf.totalEarnings ?? cs.totalCommission ?? 0).toLocaleString('es')}`],
    ['Campañas activas', String(inf.activePromotions ?? 0)],
    ['Campañas completadas', String(inf.completedPromotions ?? 0)],
    ['Conversión QR', `${cs.averageConversion ?? 0}%`],
    ['Valoración', `${inf.rating ?? 0} / 5`],
  ];

  const colW = contentW / 2 - 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...purple);
  doc.text('Métricas', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  stats.forEach((row, i) => {
    const col = i % 2;
    const rowIdx = Math.floor(i / 2);
    const x = margin + col * (colW + 4);
    const lineY = y + rowIdx * 7;
    doc.setTextColor(...muted);
    doc.text(row[0], x, lineY);
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.text(row[1], x + colW - doc.getTextWidth(row[1]), lineY);
    doc.setFont('helvetica', 'normal');
  });
  y += Math.ceil(stats.length / 2) * 7 + 6;

  // Redes
  const networks: [string, string, number][] = [];
  if (inf.followers?.instagram || inf.socialMedia?.instagram) {
    networks.push(['Instagram', inf.socialMedia?.instagram || '—', inf.followers?.instagram || 0]);
  }
  if (inf.followers?.tiktok || inf.socialMedia?.tiktok) {
    networks.push(['TikTok', inf.socialMedia?.tiktok || '—', inf.followers?.tiktok || 0]);
  }
  if (inf.followers?.youtube || inf.socialMedia?.youtube) {
    networks.push(['YouTube', inf.socialMedia?.youtube || '—', inf.followers?.youtube || 0]);
  }
  if (networks.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...purple);
    doc.text('Redes sociales', margin, y);
    y += 5;
    doc.setFontSize(8);
    networks.forEach((n) => {
      doc.setTextColor(...dark);
      doc.text(`${n[0]}: @${String(n[1]).replace(/^@/, '')} · ${formatFollowers(n[2])}`, margin, y);
      y += 5;
    });
    y += 2;
  }

  // Códigos promo (máx 4)
  const promos = (inf.promoShortCodes || []).slice(0, 4);
  if (promos.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...purple);
    doc.text('Códigos de campaña (app)', margin, y);
    y += 5;
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    promos.forEach((p) => {
      doc.setTextColor(...dark);
      const line = `${p.code} — ${p.promotionTitle || p.label || 'Promoción'}`;
      doc.text(doc.splitTextToSize(line, contentW - 52)[0] as string, margin, y);
      y += 5;
    });
    y += 2;
  }

  // Bio (truncada)
  const bio = (inf.bio || '').trim();
  if (bio && y < pageH - 75) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...purple);
    doc.text('Bio', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    const bioLines = doc.splitTextToSize(bio, contentW - 52);
    doc.text(bioLines.slice(0, 3), margin, y);
    y += Math.min(bioLines.length, 3) * 4 + 4;
  }

  // QR + URL (derecha inferior)
  const qrSize = 42;
  const qrX = pageW - margin - qrSize;
  const qrY = pageH - margin - qrSize - 18;
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  doc.setFontSize(8);
  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Perfil público', qrX, qrY - 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...muted);
  const urlLines = doc.splitTextToSize(profileUrl, qrSize + 10);
  doc.text(urlLines.slice(0, 2), qrX, qrY + qrSize + 5);

  // Footer izquierdo
  doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.text(`ID: ${inf.id}`, margin, pageH - margin);
  if (inf.categories?.length) {
    const cats = inf.categories.slice(0, 5).join(' · ');
    doc.text(doc.splitTextToSize(cats, contentW - qrSize - 8)[0] as string, margin, pageH - margin - 5);
  }

  const safeName = (inf.name || 'influencer')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  doc.save(`${SITE_CONFIG.name}-influencer-${safeName}.pdf`);
}
