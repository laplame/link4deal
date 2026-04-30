import { useState, useEffect } from 'react';
import type { BizneShop } from '../components/BizneShopCard';

export function useBizneShops() {
  const [shops, setShops] = useState<BizneShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    if (import.meta.env.VITE_ENABLE_BIZNE_SHOPS === 'false') {
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetch('/api/bizne-shops?all=1')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 404) {
          setShops([]);
          setError(false);
          setErrorDetail(null);
          return;
        }
        if (data?.success && Array.isArray(data.data?.shops)) {
          setShops(data.data.shops);
          setError(false);
          setErrorDetail(null);
        } else {
          setShops([]);
          setError(true);
          setErrorDetail(
            typeof data?.message === 'string'
              ? data.message
              : res.status >= 400
                ? `HTTP ${res.status}`
                : 'Respuesta inválida (sin success ni shops)'
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setShops([]);
          setError(true);
          setErrorDetail('Red o respuesta no JSON (revisa consola / red)');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { shops, loading, error, errorDetail };
}
