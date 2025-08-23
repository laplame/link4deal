// Configuración de Stripe para el paquete de inauguración
// Este archivo se implementará cuando se agreguen las API keys de Stripe

export interface StripeConfig {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
}

export interface PaymentIntent {
    id: string;
    amount: number;
    currency: string;
    status: string;
    client_secret: string;
}

export interface CheckoutSession {
    id: string;
    url: string;
    status: string;
}

// Configuración por defecto (se reemplazará con variables de entorno)
const defaultConfig: StripeConfig = {
    publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.REACT_APP_STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.REACT_APP_STRIPE_WEBHOOK_SECRET || ''
};

// Precios por moneda (en centavos para Stripe)
export const STRIPE_PRICES = {
    USD: {
        amount: 100, // $1.00 USD
        currency: 'usd',
        symbol: '$',
        flag: '🇺🇸',
        name: 'US Dollar'
    },
    MXN: {
        amount: 2000, // $20.00 MXN
        currency: 'mxn',
        symbol: '$',
        flag: '🇲🇽',
        name: 'Peso Mexicano'
    },
    EUR: {
        amount: 100, // €1.00 EUR
        currency: 'eur',
        symbol: '€',
        flag: '🇪🇺',
        name: 'Euro'
    }
};

// Función para crear una sesión de checkout
export const createCheckoutSession = async (
    currency: keyof typeof STRIPE_PRICES,
    businessData: {
        businessName: string;
        ownerName: string;
        email: string;
        phone: string;
        businessType: string;
        city: string;
        country: string;
        expectedOpening: string;
        description: string;
    }
): Promise<CheckoutSession> => {
    try {
        const response = await fetch('/api/stripe/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currency,
                businessData,
                priceId: getStripePriceId(currency)
            }),
        });

        if (!response.ok) {
            throw new Error('Error creando sesión de checkout');
        }

        const session = await response.json();
        return session;
    } catch (error) {
        console.error('Error en createCheckoutSession:', error);
        throw error;
    }
};

// Función para crear un payment intent
export const createPaymentIntent = async (
    currency: keyof typeof STRIPE_PRICES,
    businessData: any
): Promise<PaymentIntent> => {
    try {
        const response = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currency,
                businessData,
                amount: STRIPE_PRICES[currency].amount
            }),
        });

        if (!response.ok) {
            throw new Error('Error creando payment intent');
        }

        const paymentIntent = await response.json();
        return paymentIntent;
    } catch (error) {
        console.error('Error en createPaymentIntent:', error);
        throw error;
    }
};

// Función para confirmar un payment intent
export const confirmPayment = async (
    paymentIntentId: string,
    paymentMethodId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch('/api/stripe/confirm-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentIntentId,
                paymentMethodId
            }),
        });

        if (!response.ok) {
            throw new Error('Error confirmando pago');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error en confirmPayment:', error);
        throw error;
    }
};

// Función para obtener el ID del precio en Stripe
const getStripePriceId = (currency: keyof typeof STRIPE_PRICES): string => {
    // Estos IDs se configurarán en el dashboard de Stripe
    const priceIds: Record<keyof typeof STRIPE_PRICES, string> = {
        USD: process.env.REACT_APP_STRIPE_USD_PRICE_ID || 'price_usd_inauguration',
        MXN: process.env.REACT_APP_STRIPE_MXN_PRICE_ID || 'price_mxn_inauguration',
        EUR: process.env.REACT_APP_STRIPE_EUR_PRICE_ID || 'price_eur_inauguration'
    };

    return priceIds[currency];
};

// Función para verificar el estado de un pago
export const checkPaymentStatus = async (paymentIntentId: string): Promise<{ status: string; amount: number; currency: string }> => {
    try {
        const response = await fetch(`/api/stripe/payment-status/${paymentIntentId}`);
        
        if (!response.ok) {
            throw new Error('Error verificando estado del pago');
        }

        const status = await response.json();
        return status;
    } catch (error) {
        console.error('Error en checkPaymentStatus:', error);
        throw error;
    }
};

// Función para procesar webhook de Stripe
export const processStripeWebhook = async (event: any, signature: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch('/api/stripe/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Stripe-Signature': signature
            },
            body: JSON.stringify(event)
        });

        if (!response.ok) {
            throw new Error('Error procesando webhook');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error en processStripeWebhook:', error);
        throw error;
    }
};

// Función para obtener métodos de pago guardados
export const getSavedPaymentMethods = async (customerId: string): Promise<any[]> => {
    try {
        const response = await fetch(`/api/stripe/customers/${customerId}/payment-methods`);
        
        if (!response.ok) {
            throw new Error('Error obteniendo métodos de pago');
        }

        const paymentMethods = await response.json();
        return paymentMethods;
    } catch (error) {
        console.error('Error en getSavedPaymentMethods:', error);
        throw error;
    }
};

// Función para guardar método de pago
export const savePaymentMethod = async (
    customerId: string,
    paymentMethodId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch('/api/stripe/save-payment-method', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerId,
                paymentMethodId
            }),
        });

        if (!response.ok) {
            throw new Error('Error guardando método de pago');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error en savePaymentMethod:', error);
        throw error;
    }
};

// Función para crear cliente en Stripe
export const createStripeCustomer = async (businessData: {
    email: string;
    name: string;
    phone: string;
    metadata: Record<string, string>;
}): Promise<{ customerId: string; error?: string }> => {
    try {
        const response = await fetch('/api/stripe/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(businessData),
        });

        if (!response.ok) {
            throw new Error('Error creando cliente en Stripe');
        }

        const customer = await response.json();
        return customer;
    } catch (error) {
        console.error('Error en createStripeCustomer:', error);
        throw error;
    }
};

// Función para obtener historial de pagos
export const getPaymentHistory = async (customerId: string): Promise<any[]> => {
    try {
        const response = await fetch(`/api/stripe/customers/${customerId}/payments`);
        
        if (!response.ok) {
            throw new Error('Error obteniendo historial de pagos');
        }

        const payments = await response.json();
        return payments;
    } catch (error) {
        console.error('Error en getPaymentHistory:', error);
        throw error;
    }
};

// Función para generar invoice
export const generateInvoice = async (
    paymentIntentId: string,
    businessData: any
): Promise<{ invoiceUrl: string; error?: string }> => {
    try {
        const response = await fetch('/api/stripe/generate-invoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentIntentId,
                businessData
            }),
        });

        if (!response.ok) {
            throw new Error('Error generando invoice');
        }

        const invoice = await response.json();
        return invoice;
    } catch (error) {
        console.error('Error en generateInvoice:', error);
        throw error;
    }
};

// Función para procesar reembolso
export const processRefund = async (
    paymentIntentId: string,
    amount?: number,
    reason?: string
): Promise<{ success: boolean; refundId?: string; error?: string }> => {
    try {
        const response = await fetch('/api/stripe/refunds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentIntentId,
                amount,
                reason
            }),
        });

        if (!response.ok) {
            throw new Error('Error procesando reembolso');
        }

        const refund = await response.json();
        return refund;
    } catch (error) {
        console.error('Error en processRefund:', error);
        throw error;
    }
};

// Función para validar tarjeta de crédito
export const validateCreditCard = (cardNumber: string, expiryMonth: string, expiryYear: string, cvc: string): boolean => {
    // Validación básica de tarjeta (en producción usar Stripe.js)
    const cardNumberRegex = /^\d{13,19}$/;
    const expiryMonthRegex = /^(0[1-9]|1[0-2])$/;
    const expiryYearRegex = /^(20[2-9][0-9]|20[3-9][0-9])$/;
    const cvcRegex = /^\d{3,4}$/;

    return (
        cardNumberRegex.test(cardNumber.replace(/\s/g, '')) &&
        expiryMonthRegex.test(expiryMonth) &&
        expiryYearRegex.test(expiryYear) &&
        cvcRegex.test(cvc)
    );
};

// Función para formatear número de tarjeta
export const formatCardNumber = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
};

// Función para obtener tipo de tarjeta
export const getCardType = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6/.test(cleaned)) return 'discover';
    
    return 'unknown';
};

// Función para calcular comisiones de Stripe
export const calculateStripeFees = (amount: number, currency: string): number => {
    // Comisiones estándar de Stripe (2.9% + 30 centavos para USD)
    const percentage = 0.029;
    const fixedFee = currency === 'usd' ? 30 : 0;
    
    return Math.round(amount * percentage + fixedFee);
};

// Función para obtener el monto neto después de comisiones
export const getNetAmount = (amount: number, currency: string): number => {
    const fees = calculateStripeFees(amount, currency);
    return amount - fees;
};

export default {
    createCheckoutSession,
    createPaymentIntent,
    confirmPayment,
    checkPaymentStatus,
    processStripeWebhook,
    getSavedPaymentMethods,
    savePaymentMethod,
    createStripeCustomer,
    getPaymentHistory,
    generateInvoice,
    processRefund,
    validateCreditCard,
    formatCardNumber,
    getCardType,
    calculateStripeFees,
    getNetAmount,
    STRIPE_PRICES
};
