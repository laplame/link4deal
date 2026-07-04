import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
    CheckCircle, Package, Truck, MapPin, Clock, Copy, Check,
    ArrowRight, ShoppingBag, Loader2, AlertCircle, XCircle,
} from 'lucide-react';
import { apiUrl } from '../utils/apiUrl';
import { getAuthToken } from '../context/AuthContext';
import { formatPrice } from '../services/productsApi';

interface OrderData {
    _id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    items: Array<{
        name: string;
        image: string;
        price: number;
        originalPrice?: number;
        currency: string;
        quantity: number;
        brand?: string;
    }>;
    shippingAddress: {
        fullName: string;
        email: string;
        phone: string;
        street: string;
        colonia?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    pricing: {
        subtotal: number;
        shipping: number;
        tax: number;
        discount: number;
        total: number;
        currency: string;
    };
    payment: {
        method: string;
        status: string;
    };
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending_payment: { label: 'Pendiente de pago', color: 'amber', icon: <Clock className="h-5 w-5" /> },
    paid: { label: 'Pago confirmado', color: 'green', icon: <CheckCircle className="h-5 w-5" /> },
    processing: { label: 'En preparación', color: 'blue', icon: <Package className="h-5 w-5" /> },
    shipped: { label: 'En camino', color: 'blue', icon: <Truck className="h-5 w-5" /> },
    delivered: { label: 'Entregado', color: 'green', icon: <CheckCircle className="h-5 w-5" /> },
    cancelled: { label: 'Cancelado', color: 'red', icon: <XCircle className="h-5 w-5" /> },
};

const colorClass = (color: string, type: 'bg' | 'text' | 'border') => {
    const map: Record<string, Record<string, string>> = {
        green: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    };
    return map[color]?.[type] ?? '';
};

export default function ShopOrderSuccessPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const [params] = useSearchParams();
    const paid = params.get('paid') === '1';
    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!orderId) return;
        const token = getAuthToken();
        fetch(apiUrl(`/api/orders/${orderId}`), {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) setOrder(d.data);
                else throw new Error(d.message || 'No encontrado');
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [orderId]);

    const copyOrderNumber = () => {
        if (!order) return;
        navigator.clipboard.writeText(order.orderNumber).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-800 mb-2">No encontramos este pedido</h1>
                    <p className="text-gray-600 mb-6">{error || 'Verifica que la URL sea correcta.'}</p>
                    <Link to="/tienda" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
                        Ir a la tienda
                    </Link>
                </div>
            </div>
        );
    }

    const statusInfo = STATUS_LABELS[order.status] ?? { label: order.status, color: 'amber', icon: <Clock className="h-5 w-5" /> };
    const currency = order.pricing.currency;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header banner */}
            <div className={`${paid || order.status === 'paid' ? 'bg-emerald-600' : 'bg-amber-500'} text-white py-12`}>
                <div className="max-w-2xl mx-auto px-4 text-center">
                    {paid || order.status === 'paid' ? (
                        <>
                            <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-90" />
                            <h1 className="text-3xl font-bold mb-2">¡Pedido confirmado!</h1>
                            <p className="text-emerald-100 text-lg">Tu pago fue procesado exitosamente.</p>
                        </>
                    ) : (
                        <>
                            <Package className="h-16 w-16 mx-auto mb-4 opacity-90" />
                            <h1 className="text-3xl font-bold mb-2">Pedido recibido</h1>
                            <p className="text-amber-100 text-lg">Tu pedido está pendiente de pago.</p>
                        </>
                    )}
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 -mt-6 pb-12 space-y-5">
                {/* Order number card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-500">Número de pedido</p>
                            <p className="text-2xl font-bold text-gray-900 font-mono">{order.orderNumber}</p>
                        </div>
                        <button
                            onClick={copyOrderNumber}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            {copied ? <><Check className="h-4 w-4 text-emerald-500" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar</>}
                        </button>
                    </div>

                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${colorClass(statusInfo.color, 'bg')} ${colorClass(statusInfo.color, 'text')} border ${colorClass(statusInfo.color, 'border')}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                    </div>

                    <p className="text-sm text-gray-500 mt-3">
                        Pedido realizado el {new Date(order.createdAt).toLocaleDateString('es-MX', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                    </p>
                </div>

                {/* Items */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-blue-600" />
                        Productos ({order.items.length})
                    </h2>
                    <ul className="divide-y divide-gray-100 space-y-3">
                        {order.items.map((item, i) => (
                            <li key={i} className="flex items-center gap-4 pt-3 first:pt-0">
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                    <img src={item.image || '/placeholder-product.png'} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm line-clamp-2">{item.name}</p>
                                    {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                                    <p className="text-xs text-gray-400">Cant: {item.quantity}</p>
                                </div>
                                <p className="font-semibold text-gray-900 text-sm shrink-0">
                                    {formatPrice(item.price * item.quantity, item.currency)}
                                </p>
                            </li>
                        ))}
                    </ul>

                    <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatPrice(order.pricing.subtotal, currency)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Envío</span>
                            <span className={order.pricing.shipping === 0 ? 'text-emerald-600 font-medium' : ''}>
                                {order.pricing.shipping === 0 ? 'Gratis' : formatPrice(order.pricing.shipping, currency)}
                            </span>
                        </div>
                        {order.pricing.discount > 0 && (
                            <div className="flex justify-between text-emerald-600">
                                <span>Descuento</span>
                                <span>-{formatPrice(order.pricing.discount, currency)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-2">
                            <span>Total pagado</span>
                            <span>{formatPrice(order.pricing.total, currency)}</span>
                        </div>
                    </div>
                </div>

                {/* Shipping address */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Dirección de envío
                    </h2>
                    <div className="text-sm text-gray-700 space-y-0.5">
                        <p className="font-semibold">{order.shippingAddress.fullName}</p>
                        <p>{order.shippingAddress.street}{order.shippingAddress.colonia ? `, ${order.shippingAddress.colonia}` : ''}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                        <p>{order.shippingAddress.country}</p>
                        <p className="text-gray-500 mt-1">{order.shippingAddress.email}</p>
                        {order.shippingAddress.phone && <p className="text-gray-500">{order.shippingAddress.phone}</p>}
                    </div>
                </div>

                {/* Status timeline */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Truck className="h-5 w-5 text-blue-600" />
                        Seguimiento
                    </h2>
                    {['paid', 'processing', 'shipped', 'delivered'].map((s, i, arr) => {
                        const statuses = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered'];
                        const currentIdx = statuses.indexOf(order.status);
                        const stepIdx = statuses.indexOf(s);
                        const done = currentIdx >= stepIdx;
                        return (
                            <div key={s} className="flex items-start gap-3 mb-3 last:mb-0">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {done ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {STATUS_LABELS[s]?.label ?? s}
                                    </p>
                                    {s === 'paid' && done && order.payment.status === 'paid' && (
                                        <p className="text-xs text-gray-500">Pago confirmado via {order.payment.method}</p>
                                    )}
                                </div>
                                {i < arr.length - 1 && (
                                    <div className={`absolute left-[calc(1rem+13px)] w-0.5 h-6 mt-7 ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} style={{ position: 'relative', left: '-2.4rem', top: '0.25rem', marginLeft: '1.45rem', width: '2px', height: '1.5rem' }} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* CTAs */}
                <div className="grid grid-cols-2 gap-3">
                    <Link
                        to="/tienda"
                        className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <ShoppingBag className="h-5 w-5" />
                        Seguir comprando
                    </Link>
                    <Link
                        to="/marketplace"
                        className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        Mis pedidos
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
