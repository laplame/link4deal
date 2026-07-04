import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Globe,
    TrendingUp,
    Users,
    Target,
    BarChart3,
    CheckCircle,
    Clock,
    AlertCircle,
    Zap,
    Plus,
    Settings,
    Handshake,
    Building2,
    Loader2,
    MapPin,
    Mail,
    Phone,
    ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/apiUrl';

interface AgencyData {
    _id: string;
    name: string;
    type?: string;
    status: 'active' | 'pending' | 'verified' | 'suspended';
    isVerified?: boolean;
    headquarters?: string;
    description?: string;
    website?: string;
    logo?: string;
    createdAt?: string;
    contact?: {
        email?: string;
        phone?: string;
        address?: { city?: string; country?: string };
    };
    metrics?: {
        views?: number;
        clients?: number;
        totalRevenue?: number;
    };
    members?: Array<{ user: { firstName?: string; lastName?: string; email?: string }; role: string }>;
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
        verified: { label: 'Verificada', cls: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="w-3.5 h-3.5" /> },
        active:   { label: 'Activa',    cls: 'bg-blue-100 text-blue-800',       icon: <Zap className="w-3.5 h-3.5" /> },
        pending:  { label: 'Pendiente', cls: 'bg-amber-100 text-amber-800',     icon: <Clock className="w-3.5 h-3.5" /> },
        suspended:{ label: 'Suspendida',cls: 'bg-red-100 text-red-800',         icon: <AlertCircle className="w-3.5 h-3.5" /> },
    };
    const s = map[status] ?? map.pending;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
            {s.icon}
            {s.label}
        </span>
    );
}

export default function AgencyDashboard() {
    const { user } = useAuth();
    const [agency, setAgency] = useState<AgencyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) { setError('Sesión no encontrada'); setLoading(false); return; }
        setLoading(true);
        setError(null);
        try {
            // 1. Get mine (returns basic fields: name, type, status, isVerified, headquarters, createdAt)
            const mineRes = await fetch(apiUrl('/api/agencies/mine'), {
                headers: { Authorization: `Bearer ${token}` },
            });
            const mineData = await mineRes.json();

            if (!mineData.agency) {
                setAgency(null);
                setLoading(false);
                return;
            }

            // 2. Get full detail including metrics, members, contact
            const id = mineData.agency._id;
            const detailRes = await fetch(apiUrl(`/api/agencies/${id}`), {
                headers: { Authorization: `Bearer ${token}` },
            });
            const detailData = await detailRes.json();
            setAgency(detailData.agency ?? mineData.agency);
        } catch {
            setError('Error al cargar la agencia');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!agency) {
        return (
            <div className="max-w-lg mx-auto px-4 py-16 text-center">
                <Building2 className="h-14 w-14 text-amber-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-gray-900 mb-2">Sin agencia registrada</h1>
                <p className="text-gray-600 mb-6">
                    Aún no tienes una agencia en Link4Deal. Regístrala para acceder a este panel.
                </p>
                <Link
                    to="/agency/setup"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Registrar mi agencia
                </Link>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-lg mx-auto px-4 py-12 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button type="button" onClick={load} className="text-blue-700 font-medium underline">
                    Reintentar
                </button>
            </div>
        );
    }

    const members = Array.isArray(agency.members) ? agency.members : [];
    const metrics = agency.metrics ?? {};

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <Link to="/marketplace" className="text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-gray-900 truncate">{agency.name}</h1>
                            <p className="text-gray-600 text-sm">
                                Panel de agencia · {user?.firstName} {user?.lastName}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <StatusBadge status={agency.isVerified ? 'verified' : agency.status} />
                        <Link
                            to="/agency/setup"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 text-gray-700 px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            <Settings className="w-4 h-4" />
                            Editar
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                {/* Métricas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Clientes</p>
                                <p className="text-2xl font-bold text-gray-900">{metrics.clients ?? members.length}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center text-xs text-emerald-600">
                            <TrendingUp className="w-3.5 h-3.5 mr-1" />
                            Activos en plataforma
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Miembros</p>
                                <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                            </div>
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Handshake className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center text-xs text-gray-500">
                            <Target className="w-3.5 h-3.5 mr-1" />
                            Equipo registrado
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vistas</p>
                                <p className="text-2xl font-bold text-gray-900">{metrics.views ?? 0}</p>
                            </div>
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Globe className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center text-xs text-gray-500">
                            <BarChart3 className="w-3.5 h-3.5 mr-1" />
                            Perfil público
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ingresos</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${((metrics.totalRevenue ?? 0) / 1000).toFixed(1)}k
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-orange-600" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center text-xs text-gray-500">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Estimado total
                        </div>
                    </div>
                </div>

                {/* Información de la agencia */}
                <div className="grid sm:grid-cols-2 gap-6">
                    <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-base font-semibold text-gray-900 mb-4">Datos de la agencia</h2>
                        <dl className="space-y-3 text-sm">
                            {agency.type && (
                                <div className="flex gap-2">
                                    <dt className="text-gray-500 min-w-[90px]">Tipo:</dt>
                                    <dd className="text-gray-900 capitalize">{agency.type.replace(/-/g, ' ')}</dd>
                                </div>
                            )}
                            {agency.headquarters && (
                                <div className="flex gap-2">
                                    <dt className="text-gray-500 min-w-[90px]">
                                        <MapPin className="inline h-3.5 w-3.5" /> Sede:
                                    </dt>
                                    <dd className="text-gray-900">{agency.headquarters}</dd>
                                </div>
                            )}
                            {agency.contact?.address?.city && (
                                <div className="flex gap-2">
                                    <dt className="text-gray-500 min-w-[90px]">Ciudad:</dt>
                                    <dd className="text-gray-900">
                                        {agency.contact.address.city}
                                        {agency.contact.address.country ? `, ${agency.contact.address.country}` : ''}
                                    </dd>
                                </div>
                            )}
                            {agency.contact?.email && (
                                <div className="flex gap-2">
                                    <dt className="text-gray-500 min-w-[90px]">
                                        <Mail className="inline h-3.5 w-3.5" /> Email:
                                    </dt>
                                    <dd className="text-gray-900">{agency.contact.email}</dd>
                                </div>
                            )}
                            {agency.contact?.phone && (
                                <div className="flex gap-2">
                                    <dt className="text-gray-500 min-w-[90px]">
                                        <Phone className="inline h-3.5 w-3.5" /> Tel:
                                    </dt>
                                    <dd className="text-gray-900">{agency.contact.phone}</dd>
                                </div>
                            )}
                            {agency.website && (
                                <div className="flex gap-2">
                                    <dt className="text-gray-500 min-w-[90px]">
                                        <Globe className="inline h-3.5 w-3.5" /> Web:
                                    </dt>
                                    <dd>
                                        <a
                                            href={agency.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                        >
                                            {agency.website.replace(/^https?:\/\//, '')}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </dd>
                                </div>
                            )}
                            {agency.createdAt && (
                                <div className="flex gap-2">
                                    <dt className="text-gray-500 min-w-[90px]">Creada:</dt>
                                    <dd className="text-gray-900">
                                        {new Date(agency.createdAt).toLocaleDateString('es', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </dd>
                                </div>
                            )}
                        </dl>
                        {agency.description && (
                            <p className="mt-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                                {agency.description}
                            </p>
                        )}
                    </section>

                    {/* Equipo */}
                    <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-900">Equipo</h2>
                            <span className="text-xs text-gray-500">{members.length} miembro(s)</span>
                        </div>
                        {members.length === 0 ? (
                            <p className="text-sm text-gray-500">Sin miembros registrados aún.</p>
                        ) : (
                            <ul className="space-y-3">
                                {members.map((m, i) => {
                                    const u = typeof m.user === 'object' ? m.user : null;
                                    return (
                                        <li key={i} className="flex items-center justify-between text-sm">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email : '—'}
                                                </p>
                                                {u?.email && <p className="text-xs text-gray-500">{u.email}</p>}
                                            </div>
                                            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 capitalize">
                                                {m.role}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                </div>

                {/* Acciones rápidas */}
                <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Link
                            to="/brands"
                            className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
                        >
                            <Building2 className="w-7 h-7 text-blue-600 mb-2" />
                            <span className="text-sm font-medium text-gray-900">Marcas</span>
                            <span className="text-xs text-gray-500">Directorio</span>
                        </Link>
                        <Link
                            to="/influencer"
                            className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all"
                        >
                            <Users className="w-7 h-7 text-purple-600 mb-2" />
                            <span className="text-sm font-medium text-gray-900">Influencers</span>
                            <span className="text-xs text-gray-500">Directorio</span>
                        </Link>
                        <Link
                            to="/marketplace"
                            className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all"
                        >
                            <Target className="w-7 h-7 text-green-600 mb-2" />
                            <span className="text-sm font-medium text-gray-900">Marketplace</span>
                            <span className="text-xs text-gray-500">Ofertas</span>
                        </Link>
                        <Link
                            to="/agency/setup"
                            className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all"
                        >
                            <Settings className="w-7 h-7 text-orange-600 mb-2" />
                            <span className="text-sm font-medium text-gray-900">Configurar</span>
                            <span className="text-xs text-gray-500">Perfil agencia</span>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
