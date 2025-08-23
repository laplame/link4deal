import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Coupon } from '../components/CouponRedemption';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    currency: string;
    image: string;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    total: number;
    itemCount: number;
    appliedCoupon?: Coupon;
    appliedDiscount: number;
    subtotal: number;
}

type CartAction =
    | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
    | { type: 'REMOVE_ITEM'; payload: string }
    | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
    | { type: 'CLEAR_CART' }
    | { type: 'REMOVE_ONE_ITEM'; payload: string }
    | { type: 'LOAD_FROM_STORAGE'; payload: CartState }
    | { type: 'APPLY_COUPON'; payload: { coupon: Coupon; discountAmount: number } }
    | { type: 'REMOVE_COUPON' };

const initialState: CartState = {
    items: [],
    total: 0,
    itemCount: 0,
    appliedCoupon: undefined,
    appliedDiscount: 0,
    subtotal: 0,
};

// Función para cargar el carrito desde localStorage
const loadCartFromStorage = (): CartState => {
    try {
        const savedCart = localStorage.getItem('carrito');
        if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            // Validar que la estructura sea correcta
            if (parsedCart.items && Array.isArray(parsedCart.items)) {
                return parsedCart;
            }
        }
    } catch (error) {
        console.error('Error loading cart from localStorage:', error);
    }
    return initialState;
};

// Función para guardar el carrito en localStorage
const saveCartToStorage = (cartState: CartState) => {
    try {
        localStorage.setItem('carrito', JSON.stringify(cartState));
    } catch (error) {
        console.error('Error saving cart to localStorage:', error);
    }
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
    let newState: CartState;
    
    switch (action.type) {
        case 'LOAD_FROM_STORAGE':
            return action.payload;
            
        case 'ADD_ITEM': {
            const existingItem = state.items.find(item => item.id === action.payload.id);
            
            if (existingItem) {
                const updatedItems = state.items.map(item =>
                    item.id === action.payload.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
                
                const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
                const newTotal = newSubtotal - state.appliedDiscount;
                
                newState = {
                    ...state,
                    items: updatedItems,
                    subtotal: newSubtotal,
                    total: newTotal,
                    itemCount: newItemCount,
                };
            } else {
                const newItem = { ...action.payload, quantity: 1 };
                const newItems = [...state.items, newItem];
                const newSubtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
                const newTotal = newSubtotal - state.appliedDiscount;
                
                newState = {
                    ...state,
                    items: newItems,
                    subtotal: newSubtotal,
                    total: newTotal,
                    itemCount: newItemCount,
                };
            }
            break;
        }
        
        case 'REMOVE_ITEM': {
            const updatedItems = state.items.filter(item => item.id !== action.payload);
            const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
            const newTotal = newSubtotal - state.appliedDiscount;
            
            newState = {
                ...state,
                items: updatedItems,
                subtotal: newSubtotal,
                total: newTotal,
                itemCount: newItemCount,
            };
            break;
        }
        
        case 'UPDATE_QUANTITY': {
            const updatedItems = state.items.map(item =>
                item.id === action.payload.id
                    ? { ...item, quantity: Math.max(0, action.payload.quantity) }
                    : item
            ).filter(item => item.quantity > 0);
            
            const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
            const newTotal = newSubtotal - state.appliedDiscount;
            
            newState = {
                ...state,
                items: updatedItems,
                subtotal: newSubtotal,
                total: newTotal,
                itemCount: newItemCount,
            };
            break;
        }
        
        case 'REMOVE_ONE_ITEM': {
            const existingItem = state.items.find(item => item.id === action.payload);
            
            if (existingItem && existingItem.quantity > 1) {
                const updatedItems = state.items.map(item =>
                    item.id === action.payload
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                );
                
                const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
                const newTotal = newSubtotal - state.appliedDiscount;
                
                newState = {
                    ...state,
                    items: updatedItems,
                    subtotal: newSubtotal,
                    total: newTotal,
                    itemCount: newItemCount,
                };
            } else {
                newState = cartReducer(state, { type: 'REMOVE_ITEM', payload: action.payload });
            }
            break;
        }
        
        case 'APPLY_COUPON':
            newState = {
                ...state,
                appliedCoupon: action.payload.coupon,
                appliedDiscount: action.payload.discountAmount,
                total: state.subtotal - action.payload.discountAmount,
            };
            break;
            
        case 'REMOVE_COUPON':
            newState = {
                ...state,
                appliedCoupon: undefined,
                appliedDiscount: 0,
                total: state.subtotal,
            };
            break;
            
        case 'CLEAR_CART':
            newState = initialState;
            break;
        
        default:
            return state;
    }
    
    // Guardar en localStorage después de cada cambio
    saveCartToStorage(newState);
    return newState;
};

interface CartContextType {
    state: CartState;
    addItem: (item: Omit<CartItem, 'quantity'>) => void;
    removeItem: (id: string) => void;
    removeOneItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    applyCoupon: (coupon: Coupon, discountAmount: number) => void;
    removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(cartReducer, initialState);

    // Cargar el carrito desde localStorage al inicializar
    useEffect(() => {
        const loadedState = loadCartFromStorage();
        if (loadedState.items.length > 0) {
            dispatch({ type: 'LOAD_FROM_STORAGE', payload: loadedState });
        }
    }, []);

    const addItem = (item: Omit<CartItem, 'quantity'>) => {
        dispatch({ type: 'ADD_ITEM', payload: item });
    };

    const removeItem = (id: string) => {
        dispatch({ type: 'REMOVE_ITEM', payload: id });
    };

    const removeOneItem = (id: string) => {
        dispatch({ type: 'REMOVE_ONE_ITEM', payload: id });
    };

    const updateQuantity = (id: string, quantity: number) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    };

    const clearCart = () => {
        dispatch({ type: 'CLEAR_CART' });
    };

    const applyCoupon = (coupon: Coupon, discountAmount: number) => {
        dispatch({ type: 'APPLY_COUPON', payload: { coupon, discountAmount } });
    };

    const removeCoupon = () => {
        dispatch({ type: 'REMOVE_COUPON' });
    };

    return (
        <CartContext.Provider value={{
            state,
            addItem,
            removeItem,
            removeOneItem,
            updateQuantity,
            clearCart,
            applyCoupon,
            removeCoupon,
        }}>
            {children}
        </CartContext.Provider>
    );
};
