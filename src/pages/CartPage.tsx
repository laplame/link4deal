import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartPage() {
    const { state, removeItem, removeOneItem, updateQuantity, clearCart } = useCart();

    const formatPrice = (price: number, currency: string) => {
        // Mapear símbolos de moneda a códigos ISO
        const currencyMap: Record<string, string> = {
            '€': 'EUR',
            '$': 'USD',
            'MXN': 'MXN',
            'EUR': 'EUR',
            'USD': 'USD',
            'PESO': 'MXN',
            'PESOS': 'MXN'
        };

        // Obtener el código de moneda válido
        const validCurrency = currencyMap[currency] || 'MXN';
        
        try {
            return new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: validCurrency,
            }).format(price);
        } catch (error) {
            // Fallback si hay algún error con el formateo
            return `${price.toFixed(2)} ${currency}`;
        }
    };

    const handleQuantityChange = (id: string, newQuantity: number) => {
        if (newQuantity > 0) {
            updateQuantity(id, newQuantity);
        }
    };

    const handleCheckout = () => {
        // Aquí iría la lógica para proceder al checkout
        console.log('Procediendo al checkout...');
    };

    if (state.items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Header */}
                    <div className="flex items-center mb-8">
                        <Link 
                            to="/" 
                            className="text-blue-600 hover:text-blue-700 transition-colors mr-4"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Carrito de Compras</h1>
                    </div>

                    {/* Empty Cart */}
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            Tu carrito está vacío
                        </h2>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            Parece que aún no has agregado ningún producto a tu carrito. 
                            Explora nuestras ofertas y encuentra algo que te guste.
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Explorar Productos
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        <Link 
                            to="/" 
                            className="text-blue-600 hover:text-blue-700 transition-colors mr-4"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Carrito de Compras</h1>
                        <span className="ml-4 text-gray-500">
                            ({state.itemCount} {state.itemCount === 1 ? 'producto' : 'productos'})
                        </span>
                    </div>
                    <button
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-700 font-medium transition-colors"
                    >
                        Vaciar Carrito
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Productos en el Carrito
                                </h2>
                            </div>
                            
                            <div className="divide-y divide-gray-200">
                                {state.items.map((item) => (
                                    <div key={item.id} className="p-6">
                                        <div className="flex items-center space-x-4">
                                            {/* Product Image */}
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-20 h-20 object-cover rounded-lg"
                                            />
                                            
                                            {/* Product Details */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                    {item.name}
                                                </h3>
                                                <p className="text-lg font-bold text-blue-600">
                                                    {formatPrice(item.price, item.currency)}
                                                </p>
                                            </div>
                                            
                                            {/* Quantity Controls */}
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={() => removeOneItem(item.id)}
                                                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="text-lg font-medium w-12 text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            
                                            {/* Subtotal */}
                                            <div className="text-right min-w-0">
                                                <p className="text-lg font-bold text-gray-900">
                                                    {formatPrice(item.price * item.quantity, item.currency)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {item.quantity} × {formatPrice(item.price, item.currency)}
                                                </p>
                                            </div>
                                            
                                            {/* Remove Button */}
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-red-500 hover:text-red-700 transition-colors p-2"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                Resumen del Pedido
                            </h2>
                            
                            {/* Summary Details */}
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal ({state.itemCount} {state.itemCount === 1 ? 'producto' : 'productos'})</span>
                                    <span>{formatPrice(state.total, 'MXN')}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Envío</span>
                                    <span className="text-green-600">Gratis</span>
                                </div>
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex justify-between text-xl font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>{formatPrice(state.total, 'MXN')}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Checkout Button */}
                            <button
                                onClick={handleCheckout}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                <span>Proceder al Checkout</span>
                            </button>
                            
                            {/* Continue Shopping */}
                            <Link
                                to="/"
                                className="block w-full text-center mt-4 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                                ← Continuar Comprando
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
