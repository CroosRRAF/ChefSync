import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartItem, CartContextType } from '@/types/customer';
import { v4 as uuidv4 } from 'uuid';

// Create the context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart hook
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Action types
type CartAction = 
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id' | 'subtotal'> }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

// Initial state
const initialState: { items: CartItem[] } = {
  items: [],
};

// Reducer function
function cartReducer(state: typeof initialState, action: CartAction): typeof initialState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const newItem: CartItem = {
        ...action.payload,
        id: uuidv4(),
        subtotal: action.payload.unit_price * action.payload.quantity,
      };
      
      // Check if same food item with same size exists
      const existingItemIndex = state.items.findIndex(
        item => 
          item.food_id === newItem.food_id && 
          item.size === newItem.size
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...state.items];
        const existingItem = updatedItems[existingItemIndex];
        existingItem.quantity += newItem.quantity;
        existingItem.subtotal = existingItem.unit_price * existingItem.quantity;
        return { ...state, items: updatedItems };
      } else {
        // Add new item
        return { ...state, items: [...state.items, newItem] };
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload;
      if (quantity <= 0) {
        return { ...state, items: state.items.filter(item => item.id !== itemId) };
      }
      
      const updatedItems = state.items.map(item => 
        item.id === itemId 
          ? { ...item, quantity, subtotal: item.unit_price * quantity }
          : item
      );
      return { ...state, items: updatedItems };
    }
    
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => item.id !== action.payload) };
    
    case 'CLEAR_CART':
      return { ...state, items: [] };
    
    case 'LOAD_CART':
      return { ...state, items: action.payload };
    
    default:
      return state;
  }
}

// Provider component
export function CartProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    console.log('CartProvider: Loading cart from localStorage');
    const savedCart = localStorage.getItem('chefsync_cart');
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        console.log('CartProvider: Loaded cart items:', items);
        dispatch({ type: 'LOAD_CART', payload: items });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('chefsync_cart');
      }
    } else {
      console.log('CartProvider: No saved cart found');
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chefsync_cart', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (item: Omit<CartItem, 'id' | 'subtotal'>) => {
    console.log('CartProvider: Adding item to cart:', item);
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getItemsByChef = (): Map<number, CartItem[]> => {
    const chefMap = new Map<number, CartItem[]>();
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
      .reduce((total, item) => total + item.subtotal, 0);
  };

  const getGrandTotal = (): number => {
    return state.items.reduce((total, item) => total + item.subtotal, 0);
  };

  const getItemCount = (): number => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const contextValue: CartContextType = {
    items: state.items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemsByChef,
    getTotalByChef,
    getGrandTotal,
    getItemCount,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}