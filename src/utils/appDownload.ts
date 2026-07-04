import { SITE_CONFIG } from '../config/site';
import { trackDownload } from '../services/appDownloads';

export const APK_DOWNLOAD_FILENAME = 'damecodigo-link4deal.apk';

/** URL absoluta del APK (Expo EAS o redirect local legacy). */
export function getApkDownloadUrl(): string {
  const url = SITE_CONFIG.apkDownloadUrl.trim();
  if (/^https?:\/\//i.test(url)) return url;
  const base =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : SITE_CONFIG.website.replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

export function isExternalApkDownloadUrl(): boolean {
  return /^https?:\/\//i.test(SITE_CONFIG.apkDownloadUrl.trim());
}

/** Props para `<a>` de descarga (externo → nueva pestaña; local → download). */
export function apkDownloadAnchorProps(): {
  href: string;
  target?: '_blank';
  rel?: string;
  download?: string;
} {
  const href = getApkDownloadUrl();
  if (isExternalApkDownloadUrl()) {
    return { href, target: '_blank', rel: 'noopener noreferrer' };
  }
  return { href, download: APK_DOWNLOAD_FILENAME };
}

/** Abre la descarga y registra el clic en analytics interno si está disponible. */
export function openApkDownload(): void {
  void trackDownload();
  const url = getApkDownloadUrl();
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    window.location.href = url;
  }
}
