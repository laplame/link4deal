import { Navigate, useParams, useLocation } from 'react-router-dom';

/** Compatibilidad: la ruta /influencer/:slug/tienda se renombró a /deals. */
export default function InfluencerTiendaRedirect() {
    const { influencerSlug } = useParams();
    const { search, hash } = useLocation();
    const slug = encodeURIComponent(influencerSlug || '');
    return <Navigate to={`/influencer/${slug}/deals${search}${hash}`} replace />;
}
