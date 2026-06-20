import { useCallback, useEffect, useRef, useState } from 'react';
import { Link2, Loader2, ExternalLink } from 'lucide-react';
import { apiUrl } from '../../utils/apiUrl';
import { parseBizneShopUrl } from '../../utils/parseBizneShopUrl';
import { isValidBizneShopObjectId, normalizeBizneShopId } from '../../utils/bizneShopId';
import type { BizneShop } from '../BizneShopCard';
import { SITE_CONFIG } from '../../config/site';
import { BizneShopValidatedPanel } from './BizneShopValidatedPanel';

interface Props {
  shopId: string;
  onShopIdChange: (id: string) => void;
  onLinked?: (payload: { shopId: string; shop: BizneShop | null }) => void;
  /** Si true, llama PATCH /api/brands/me/bizne-shop al vincular */
  persistToAccount?: boolean;
  compact?: boolean;
  /** Con shopId en URL (?bizneShopId=), valida y muestra ficha al cargar */
  autoValidateOnMount?: boolean;
  /** Tienda ya validada (p. ej. al llegar desde el panel de marca) */
  initialShop?: BizneShop | null;
  initialValidated?: boolean;
}

export function BizneShopIdLinker({
  shopId,
  onShopIdChange,
  onLinked,
  persistToAccount = false,
  compact = false,
  autoValidateOnMount = false,
  initialShop = null,
  initialValidated = false,
}: Props) {
  const [urlInput, setUrlInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<BizneShop | null>(null);
  const [validated, setValidated] = useState(false);
  const autoRan = useRef(false);

  const loadPreview = useCallback(async (id: string): Promise<BizneShop | null> => {
    if (!isValidBizneShopObjectId(id)) return null;
    try {
      const res = await fetch(apiUrl(`/api/bizne-shops/${encodeURIComponent(id)}`), {
        headers: { Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success && data?.data) {
        const shop = data.data as BizneShop;
        setPreview(shop);
        return shop;
      }
      setPreview(null);
      return null;
    } catch {
      setPreview(null);
      return null;
    }
  }, []);

  const runValidate = useCallback(
    async (idInput?: string) => {
      const id = normalizeBizneShopId(idInput ?? shopId);
      if (!id) {
        setError('Indica un shopId o pega la URL de tu tienda en BizneAI.');
        setValidated(false);
        return null;
      }
      setLoading(true);
      setError(null);
      setMessage(null);
      setValidated(false);
      try {
        if (persistToAccount) {
          const token = localStorage.getItem('auth_token');
          const res = await fetch(apiUrl('/api/brands/me/bizne-shop'), {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              bizneShopId: id,
              bizneShopUrl: urlInput.trim() || undefined,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.success) {
            setError(typeof data?.message === 'string' ? data.message : 'No se pudo vincular');
            setPreview(null);
            return null;
          }
          const shop = (data.data?.bizneShop as BizneShop) || (await loadPreview(id));
          if (!shop) {
            setError('shopId guardado pero no se pudo cargar la ficha desde BizneAI.');
            return null;
          }
          setPreview(shop);
          setValidated(true);
          setMessage('Tienda vinculada correctamente');
          onLinked?.({ shopId: id, shop });
          return shop;
        }

        const shop = await loadPreview(id);
        if (!shop) {
          setError('No se encontró la tienda en BizneAI. Revisa el ID o la URL.');
          return null;
        }
        setValidated(true);
        setMessage('Tienda validada. Puedes continuar con el registro.');
        onLinked?.({ shopId: id, shop });
        return shop;
      } catch {
        setError('Error de conexión');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [shopId, urlInput, persistToAccount, loadPreview, onLinked],
  );

  useEffect(() => {
    if (initialShop && initialValidated) {
      setPreview(initialShop);
      setValidated(true);
      setMessage('Tienda cargada desde tu validación anterior.');
      autoRan.current = true;
      return;
    }
    const id = normalizeBizneShopId(shopId);
    if (!id) {
      setPreview(null);
      setValidated(false);
      return;
    }
    if (!autoValidateOnMount || autoRan.current) return;
    autoRan.current = true;
    void runValidate(id);
  }, [shopId, autoValidateOnMount, runValidate, initialShop, initialValidated]);

  useEffect(() => {
    if (initialShop && initialValidated) return;
    autoRan.current = false;
  }, [shopId, initialShop, initialValidated]);

  const extractFromUrl = () => {
    setError(null);
    setMessage(null);
    setValidated(false);
    setPreview(null);
    const parsed = parseBizneShopUrl(urlInput);
    if (!parsed) {
      setError(
        'No se encontró un shopId válido (24 caracteres hex). Prueba la URL de tu negocio en bizneai.com o /shop/bizne/… en DameCodigo.',
      );
      return;
    }
    onShopIdChange(parsed.shopId);
    setMessage(`ID detectado (${parsed.source}). Pulsa «Validar tienda» para cargar los datos.`);
  };

  const handleShopIdChange = (value: string) => {
    onShopIdChange(value);
    setError(null);
    setValidated(false);
    setPreview(null);
    if (message?.includes('detectado')) setMessage(null);
  };

  return (
    <div className={`space-y-4 ${compact ? '' : ''}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL de tu negocio en BizneAI
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://www.bizneai.com/shop/691a59f9529b1c88366b342c"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={extractFromUrl}
            className="rounded-lg border border-violet-300 bg-violet-50 text-violet-800 px-4 py-2.5 text-sm font-medium hover:bg-violet-100 whitespace-nowrap"
          >
            Extraer shopId
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Abre tu tienda en{' '}
          <a
            href={SITE_CONFIG.bizneAiWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-700 underline inline-flex items-center gap-0.5"
          >
            bizneai.com
            <ExternalLink className="h-3 w-3" />
          </a>{' '}
          y pega aquí la URL del navegador (o un enlace de DameCodigo /shop/bizne/…).
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">shopId (24 hex)</label>
        <input
          type="text"
          value={shopId}
          onChange={(e) => handleShopIdChange(e.target.value)}
          placeholder="691a59f9529b1c88366b342c"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm"
        />
      </div>

      <button
        type="button"
        onClick={() => void runValidate()}
        disabled={loading || !normalizeBizneShopId(shopId)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
        {persistToAccount ? 'Guardar vínculo' : 'Validar tienda'}
      </button>

      {message && !error && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {validated && preview && (
        <BizneShopValidatedPanel shop={preview} shopId={normalizeBizneShopId(shopId) || shopId} />
      )}
    </div>
  );
}
