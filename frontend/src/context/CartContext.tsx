import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { menuService, CartSummary } from '@/services/menuService';
import { useAuth } from '@/context/AuthContext';

// Define the shape of our context
export interface CartContextType {
  cartSummary: CartSummary | null;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (priceId: number, quantity?: number) => Promise<void>;
  updateCartItem: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

// Create the context with undefined as initial value
export const CartContext = createContext<CartContextType | undefined>(undefined);

// Define the cart hook
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Define action types
type CartAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART_SUMMARY'; payload: CartSummary | null }
  | { type: 'CLEAR_CART' };

// Initial state
const initialState = {
  cartSummary: null,
  isLoading: false,
};

// Reducer function
function cartReducer(state: typeof initialState, action: CartAction): typeof initialState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CART_SUMMARY':
      return { ...state, cartSummary: action.payload, isLoading: false };
    case 'CLEAR_CART':
      return { ...state, cartSummary: null };
    default:
      return state;
  }
}

// Provider component
export function CartProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  // Fetch cart summary when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      refreshCart();
    } else {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [isAuthenticated, user]);

  const refreshCart = async () => {
    if (!isAuthenticated || user?.role !== 'customer') {
      dispatch({ type: 'SET_CART_SUMMARY', payload: null });
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await menuService.getCartSummary();
      dispatch({ type: 'SET_CART_SUMMARY', payload: data });
    } catch (error) {
      console.error('Error fetching cart summary:', error);
      dispatch({ type: 'SET_CART_SUMMARY', payload: null });
    }
  };

  const addToCart = async (priceId: number, quantity: number = 1) => {
    if (!isAuthenticated || user?.role !== 'customer') {
      throw new Error('Please login to add items to cart');
    }

    try {
      await menuService.addToCart(priceId, quantity);
      await refreshCart();
    } catch (error) {
      throw error;
    }
  };

  const updateCartItem = async (itemId: number, quantity: number) => {
    if (!isAuthenticated || user?.role !== 'customer') {
      throw new Error('Please login to update cart');
    }

    try {
      await menuService.updateCartItem(itemId, quantity);
      await refreshCart();
    } catch (error) {
      throw error;
    }
  };

  const removeFromCart = async (itemId: number) => {
    if (!isAuthenticated || user?.role !== 'customer') {
      throw new Error('Please login to remove items from cart');
    }

    try {
      await menuService.removeFromCart(itemId);
      await refreshCart();
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated || user?.role !== 'customer') {
      throw new Error('Please login to clear cart');
    }

    try {
      await menuService.clearCart();
      dispatch({ type: 'CLEAR_CART' });
    } catch (error) {
      throw error;
    }
  };

  const value: CartContextType = {
    ...state,
    refreshCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
