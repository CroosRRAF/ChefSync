import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartService, CartItem, CartSummary } from '@/services/cartService';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

// Types
export interface DatabaseCartItem extends CartItem {
  subtotal: number;
}

export interface DatabaseCartContextType {
  items: DatabaseCartItem[];
  summary: CartSummary | null;
  loading: boolean;
  error: string | null;
  addItem: (priceId: number, quantity?: number, specialInstructions?: string) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  getItemsByChef: () => Map<number, DatabaseCartItem[]>;
  getTotalByChef: (chefId: number) => number;
  getGrandTotal: () => number;
  getItemCount: () => number;
  getChefInfo: (chefId: number) => any;
  getAllChefs: () => any[];
}

// Initial state
const initialState = {
  items: [] as DatabaseCartItem[],
  summary: null as CartSummary | null,
  loading: false,
  error: null as string | null,
};

// Action types
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ITEMS'; payload: DatabaseCartItem[] }
  | { type: 'SET_SUMMARY'; payload: CartSummary }
  | { type: 'ADD_ITEM'; payload: DatabaseCartItem }
  | { type: 'UPDATE_ITEM'; payload: DatabaseCartItem }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'CLEAR_CART' };

// Reducer function
function cartReducer(state: typeof initialState, action: CartAction): typeof initialState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_ITEMS':
      return { ...state, items: action.payload, loading: false, error: null };
    
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload };
    
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item => 
          item.id === action.payload.id ? action.payload : item
        )
      };
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    
    case 'CLEAR_CART':
      return { ...state, items: [], summary: null };
    
    default:
      return state;
  }
}

// Create context
const DatabaseCartContext = createContext<DatabaseCartContextType | undefined>(undefined);

// Provider component
export function DatabaseCartProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Load cart from database on mount, but only if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      // If not authenticated, clear any existing cart data and set loading to false
      dispatch({ type: 'SET_ITEMS', payload: [] });
      dispatch({ type: 'SET_SUMMARY', payload: null });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: null });
    }
  }, [isAuthenticated]);

  const loadCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const [items, summary] = await Promise.all([
        CartService.getCartItems(),
        CartService.getCartSummary()
      ]);
      
      // Transform backend cart items to frontend format
      const transformedItems: DatabaseCartItem[] = items.map(item => ({
        ...item,
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
        subtotal: Number(item.quantity) * Number(item.unit_price),
      }));
      
      dispatch({ type: 'SET_ITEMS', payload: transformedItems });
      dispatch({ type: 'SET_SUMMARY', payload: summary });
    } catch (error: any) {
      console.error('Error loading cart:', error);
      
      // Handle 401 errors gracefully - user not authenticated
      if (error.response?.status === 401) {
        dispatch({ type: 'SET_ITEMS', payload: [] });
        dispatch({ type: 'SET_SUMMARY', payload: null });
        dispatch({ type: 'SET_ERROR', payload: null });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
        toast.error('Failed to load cart');
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addItem = async (priceId: number, quantity: number = 1, specialInstructions: string = '') => {
    try {
      // Validation
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      
      if (quantity > 20) {
        throw new Error('Maximum quantity per item is 20');
      }
      
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const newItem = await CartService.addToCart(priceId, quantity, specialInstructions);
      
      // Transform the response
      const transformedItem: DatabaseCartItem = {
        ...newItem,
        unit_price: Number(newItem.unit_price),
        quantity: Number(newItem.quantity),
        subtotal: Number(newItem.quantity) * Number(newItem.unit_price),
      };
      
      // Check if adding this item creates multiple chefs
      const currentChefIds = new Set(state.items.map(item => item.chef_id));
      const newChefId = transformedItem.chef_id;
      
      if (currentChefIds.size > 0 && !currentChefIds.has(newChefId)) {
        // Multiple chefs detected, but we won't show a toast.
        // The cart modal will handle the UI for multiple chefs.
        console.log(`Added item from a new chef. Total chefs in cart: ${currentChefIds.size + 1}`);
      } else {
        // Silent success - no toast needed for normal operations
      }
      
      dispatch({ type: 'ADD_ITEM', payload: transformedItem });
      
      // Reload cart summary
      const summary = await CartService.getCartSummary();
      dispatch({ type: 'SET_SUMMARY', payload: summary });
      
    } catch (error: any) {
      console.error('Error adding item to cart:', error);
      
      // Handle validation errors
      if (error.message && (error.message.includes('greater than 0') || error.message.includes('Maximum'))) {
        toast.error(error.message);
        return;
      }
      
      // Handle 401 errors gracefully - user not authenticated
      if (error.response?.status === 401) {
        toast.error('Please login to add items to cart');
        dispatch({ type: 'SET_ERROR', payload: null });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' });
        toast.error('Failed to add item to cart');
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      // Validation
      if (quantity < 0) {
        throw new Error('Quantity cannot be negative');
      }
      
      if (quantity > 20) {
        throw new Error('Maximum quantity per item is 20');
      }
      
      if (quantity === 0) {
        await removeItem(itemId);
        return;
      }
      
      const updatedItem = await CartService.updateCartItem(itemId, quantity);
      
      // Transform the response
      const transformedItem: DatabaseCartItem = {
        ...updatedItem,
        unit_price: Number(updatedItem.unit_price),
        quantity: Number(updatedItem.quantity),
        subtotal: Number(updatedItem.quantity) * Number(updatedItem.unit_price),
      };
      
      dispatch({ type: 'UPDATE_ITEM', payload: transformedItem });
      
      // Reload cart summary
      const summary = await CartService.getCartSummary();
      dispatch({ type: 'SET_SUMMARY', payload: summary });
      
    } catch (error: any) {
      console.error('Error updating cart item:', error);
      
      // Handle validation errors
      if (error.message && (error.message.includes('negative') || error.message.includes('Maximum'))) {
        toast.error(error.message);
        return;
      }
      
      // Handle 401 errors gracefully - user not authenticated
      if (error.response?.status === 401) {
        toast.error('Please login to update cart items');
        dispatch({ type: 'SET_ERROR', payload: null });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update item quantity' });
        toast.error('Failed to update item quantity');
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await CartService.removeFromCart(itemId);
      dispatch({ type: 'REMOVE_ITEM', payload: itemId });
      // Silent removal - no toast needed
      
      // Reload cart summary
      const summary = await CartService.getCartSummary();
      dispatch({ type: 'SET_SUMMARY', payload: summary });
      
    } catch (error: any) {
      console.error('Error removing cart item:', error);
      
      // Handle 401 errors gracefully - user not authenticated
      if (error.response?.status === 401) {
        toast.error('Please login to remove cart items');
        dispatch({ type: 'SET_ERROR', payload: null });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item' });
        toast.error('Failed to remove item');
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearCart = async () => {
    try {
      await CartService.clearCart();
      dispatch({ type: 'CLEAR_CART' });
      // Silent clear - no toast needed
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      
      // Handle 401 errors gracefully - user not authenticated
      if (error.response?.status === 401) {
        toast.error('Please login to clear cart');
        dispatch({ type: 'SET_ERROR', payload: null });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' });
        toast.error('Failed to clear cart');
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getItemsByChef = (): Map<number, DatabaseCartItem[]> => {
    const chefMap = new Map<number, DatabaseCartItem[]>();
    state.items.forEach(item => {
      const chefItems = chefMap.get(item.chef_id) || [];
      chefItems.push(item);
      chefMap.set(item.chef_id, chefItems);
    });
    return chefMap;
  };

  const getTotalByChef = (chefId: number): number => {
    return state.items
      .filter(item => item.chef_id === chefId)
      .reduce((total, item) => total + Number(item.subtotal), 0);
  };

  const getGrandTotal = (): number => {
    return state.items.reduce((total, item) => total + Number(item.subtotal), 0);
  };

  const getItemCount = (): number => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getChefInfo = (chefId: number) => {
    const chefItems = state.items.filter(item => item.chef_id === chefId);
    if (chefItems.length === 0) return null;
    
    return {
      chefId,
      chefName: chefItems[0].chef_name,
      itemCount: chefItems.length,
      total: chefItems.reduce((sum, item) => sum + item.subtotal, 0),
      items: chefItems
    };
  };

  const getAllChefs = () => {
    const chefIds = new Set(state.items.map(item => item.chef_id));
    return Array.from(chefIds).map(chefId => getChefInfo(chefId)).filter(Boolean);
  };

  const contextValue: DatabaseCartContextType = {
    items: state.items,
    summary: state.summary,
    loading: state.loading,
    error: state.error,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    loadCart,
    getItemsByChef,
    getTotalByChef,
    getGrandTotal,
    getItemCount,
    getChefInfo,
    getAllChefs,
  };

  return (
    <DatabaseCartContext.Provider value={contextValue}>
      {children}
    </DatabaseCartContext.Provider>
  );
}

// Hook to use the context
export function useDatabaseCart(): DatabaseCartContextType {
  const context = useContext(DatabaseCartContext);
  if (context === undefined) {
    throw new Error('useDatabaseCart must be used within a DatabaseCartProvider');
  }
  return context;
}
