import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartIcon() {
    const { state } = useCart();

    return (
        <Link 
            to="/cart"
            className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
        >
            <ShoppingCart className="w-6 h-6" />
            {state.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {state.itemCount > 99 ? '99+' : state.itemCount}
                </span>
            )}
        </Link>
    );
}
