import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import {
    ShoppingCart, ArrowLeft, Lock, Loader2, AlertCircle,
    CheckCircle, Package, Truck, CreditCard, MapPin,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../services/productsApi';
import { apiUrl } from '../utils/apiUrl';
import { getAuthToken } from '../context/AuthContext';

// Initialize Stripe — key from env
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface Address {
    fullName: string;
    email: string;
    phone: string;
    street: string;
    colonia: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

interface OrderItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
}

// ─── Inner form (needs Stripe context) ─────────────────────────────────────
function StripePaymentForm({
    total,
    currency,
    address,
    items,
    onSuccess,
}: {
    total: number;
    currency: string;
    address: Address;
    items: OrderItem[];
    onSuccess: (orderId: string) => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [paying, setPaying] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setPaying(true);
        setPayError(null);

        try {
            // 1. Create order and get payment intent client secret
            const token = getAuthToken();
            const orderRes = await fetch(apiUrl('/api/orders'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
                    shippingAddress: address,
                }),
            });
            const orderData = await orderRes.json();
            if (!orderRes.ok || !orderData.success) {
                throw new Error(orderData.message || 'Error al crear el pedido');
            }

            // 2. Create payment intent
            const piRes = await fetch(apiUrl('/api/stripe/create-payment-intent'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    amount: total,
                    currency: currency.toLowerCase(),
                    metadata: { orderId: orderData.data._id },
                }),
            });
            const piData = await piRes.json();
            if (!piRes.ok || !piData.success) {
                throw new Error(piData.message || 'Error al crear el intento de pago');
            }

            // 3. Confirm Stripe payment
            const { error: stripeError } = await stripe.confirmPayment({
                elements,
                clientSecret: piData.data.clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/pedido/${orderData.data._id}?paid=1`,
                },
                redirect: 'if_required',
            });

            if (stripeError) {
                throw new Error(stripeError.message || 'Pago rechazado');
            }

            // 4. Update order with payment intent id
            await fetch(apiUrl(`/api/orders/${orderData.data._id}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            }).catch(() => {});

            onSuccess(orderData.data._id);
        } catch (err) {
            setPayError(err instanceof Error ? err.message : 'Error en el pago');
        } finally {
            setPaying(false);
        }
    };

    return (
        <form onSubmit={handlePay} className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Información de pago
                </h3>
                <PaymentElement options={{ layout: 'tabs' }} />
            </div>

            {payError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    {payError}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || paying}
                className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {paying ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Procesando…</>
                ) : (
                    <><Lock className="h-5 w-5" /> Pagar {formatPrice(total, currency)}</>
                )}
            </button>
            <p className="text-center text-xs text-gray-500">
                Pago procesado de forma segura con <strong>Stripe</strong>. Tus datos están encriptados.
            </p>
        </form>
    );
}

// ─── Fallback when Stripe is not configured ─────────────────────────────────
function PendingOrderForm({
    total,
    currency,
    address,
    items,
    onSuccess,
}: {
    total: number;
    currency: string;
    address: Address;
    items: OrderItem[];
    onSuccess: (orderId: string) => void;
}) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const token = getAuthToken();
            const res = await fetch(apiUrl('/api/orders'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
                    shippingAddress: address,
                    notes: 'Pendiente de pago — transferencia / efectivo',
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Error al crear el pedido');
            onSuccess(data.data._id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">Pago pendiente de configuración</p>
                <p>El procesador de pagos Stripe aún no está configurado. Tu pedido quedará en estado <strong>pendiente de pago</strong>. Nos pondremos en contacto contigo para coordinar el pago.</p>
            </div>
            {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    {error}
                </div>
            )}
            <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Package className="h-5 w-5" />}
                {submitting ? 'Creando pedido…' : `Confirmar pedido (${formatPrice(total, currency)})`}
            </button>
        </form>
    );
}

// ─── Address form ────────────────────────────────────────────────────────────
function AddressForm({ value, onChange }: { value: Address; onChange: (a: Address) => void }) {
    const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        onChange({ ...value, [k]: e.target.value });

    const fields: Array<{ key: keyof Address; label: string; placeholder: string; required?: boolean; type?: string; cols?: number }> = [
        { key: 'fullName', label: 'Nombre completo', placeholder: 'Juan García', required: true, cols: 2 },
        { key: 'email', label: 'Email', placeholder: 'juan@email.com', required: true, type: 'email' },
        { key: 'phone', label: 'Teléfono', placeholder: '+52 55 0000 0000', type: 'tel' },
        { key: 'street', label: 'Calle y número', placeholder: 'Av. Insurgentes 123', required: true, cols: 2 },
        { key: 'colonia', label: 'Colonia', placeholder: 'Roma Norte' },
        { key: 'city', label: 'Ciudad', placeholder: 'Ciudad de México', required: true },
        { key: 'state', label: 'Estado', placeholder: 'CDMX', required: true },
        { key: 'postalCode', label: 'Código postal', placeholder: '06600', required: true },
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Dirección de envío
            </h3>
            <div className="grid grid-cols-2 gap-4">
                {fields.map(f => (
                    <div key={f.key} className={f.cols === 2 ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        <input
                            type={f.type || 'text'}
                            value={value[f.key]}
                            onChange={set(f.key)}
                            required={f.required}
                            placeholder={f.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main checkout page ───────────────────────────────────────────────────────
export default function ShopCheckoutPage() {
    const navigate = useNavigate();
    const { state: cart, clearCart } = useCart();
    const { user, isAuthenticated } = useAuth();
    const [address, setAddress] = useState<Address>({
        fullName: user ? `${user.firstName} ${user.lastName}` : '',
        email: user?.email || '',
        phone: user?.phone || '',
        street: '', colonia: '', city: '', state: '', postalCode: '', country: 'México',
    });
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [piLoading, setPiLoading] = useState(false);
    const [addressValid, setAddressValid] = useState(false);
    const [step, setStep] = useState<'address' | 'payment'>('address');
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);

    const currency = cart.items[0]?.currency || 'MXN';
    const items: OrderItem[] = cart.items.map(i => ({
        productId: i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        image: i.image,
    }));

    useEffect(() => {
        const v = Boolean(address.fullName && address.email && address.street && address.city && address.state && address.postalCode);
        setAddressValid(v);
    }, [address]);

    const handleSuccess = useCallback((orderId: string) => {
        clearCart();
        navigate(`/pedido/${orderId}?paid=1`);
    }, [clearCart, navigate]);

    const prepareStripePayment = useCallback(async () => {
        if (!stripePromise) return;
        setPiLoading(true);
        try {
            const token = getAuthToken();
            const res = await fetch(apiUrl('/api/stripe/create-payment-intent'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ amount: cart.total, currency: currency.toLowerCase() }),
            });
            const data = await res.json();
            if (data.success) setClientSecret(data.data.clientSecret);
        } catch { /* ignore */ } finally {
            setPiLoading(false);
        }
    }, [cart.total, currency]);

    const handleContinueToPayment = async () => {
        if (!isAuthenticated) {
            setShowAuthPrompt(true);
            return;
        }
        setStep('payment');
        if (stripePromise) await prepareStripePayment();
    };

    if (cart.items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <ShoppingCart className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-700 mb-2">Tu carrito está vacío</h1>
                    <Link to="/tienda" className="text-blue-600 hover:underline">Explorar productos</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link to="/cart" className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Lock className="h-5 w-5 text-blue-600" />
                        Checkout seguro
                    </h1>
                    <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                        <Lock className="h-3.5 w-3.5 text-emerald-500" />
                        SSL · Stripe
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_360px] gap-8 items-start">
                {/* Left: form */}
                <div className="space-y-5">
                    {step === 'address' && (
                        <>
                            <AddressForm value={address} onChange={setAddress} />
                            <button
                                type="button"
                                onClick={handleContinueToPayment}
                                disabled={!addressValid}
                                className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Continuar al pago
                            </button>
                            {showAuthPrompt && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                                    <p className="font-semibold text-blue-900 mb-1">Inicia sesión para pagar</p>
                                    <p className="text-sm text-blue-700 mb-4">Necesitas una cuenta para procesar el pago de forma segura. Tu carrito se guardará.</p>
                                    <div className="flex gap-3">
                                        <Link to="/signin?from=/tienda/checkout" className="flex-1 text-center py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                                            Iniciar sesión
                                        </Link>
                                        <Link to="/signup?from=/tienda/checkout" className="flex-1 text-center py-2.5 border border-blue-300 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100">
                                            Crear cuenta
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {step === 'payment' && (
                        <div className="space-y-4">
                            <button type="button" onClick={() => setStep('address')} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                                <ArrowLeft className="h-4 w-4" /> Editar dirección
                            </button>

                            {/* Address summary */}
                            <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
                                <p className="font-semibold">{address.fullName}</p>
                                <p>{address.street}{address.colonia ? `, ${address.colonia}` : ''}</p>
                                <p>{address.city}, {address.state} {address.postalCode}</p>
                                <p>{address.email} · {address.phone}</p>
                            </div>

                            {piLoading && (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                </div>
                            )}

                            {!piLoading && stripePromise && clientSecret && (
                                <Elements stripe={stripePromise} options={{ clientSecret, locale: 'es' }}>
                                    <StripePaymentForm
                                        total={cart.total}
                                        currency={currency}
                                        address={address}
                                        items={items}
                                        onSuccess={handleSuccess}
                                    />
                                </Elements>
                            )}

                            {!piLoading && !stripePromise && (
                                <PendingOrderForm
                                    total={cart.total}
                                    currency={currency}
                                    address={address}
                                    items={items}
                                    onSuccess={handleSuccess}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Right: order summary */}
                <aside className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
                    <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                        Tu pedido
                    </h2>
                    <ul className="space-y-3 divide-y divide-gray-100">
                        {cart.items.map(item => (
                            <li key={item.id} className="flex items-center gap-3 pt-3 first:pt-0">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                    <img src={item.image || '/placeholder-product.png'} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                                    {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                                    <p className="text-xs text-gray-500">Cant: {item.quantity}</p>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 shrink-0">
                                    {formatPrice(item.price * item.quantity, item.currency)}
                                </p>
                            </li>
                        ))}
                    </ul>

                    <div className="border-t border-gray-200 mt-4 pt-4 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatPrice(cart.subtotal, currency)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Envío</span>
                            <span className="text-emerald-600 font-medium">Gratis</span>
                        </div>
                        {cart.appliedDiscount > 0 && (
                            <div className="flex justify-between text-emerald-600">
                                <span>Descuento</span>
                                <span>-{formatPrice(cart.appliedDiscount, currency)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-2">
                            <span>Total</span>
                            <span>{formatPrice(cart.total, currency)}</span>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 justify-center">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        Satisfacción garantizada
                    </div>
                </aside>
            </div>
        </div>
    );
}
