import { create } from 'zustand';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  special_instructions?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  delivery_address: string;
  delivery_instructions?: string;
  created_at: string;
  updated_at: string;
  estimated_delivery_time?: string;
  assigned_cook_id?: string;
  assigned_delivery_agent_id?: string;
}

interface OrderState {
  // State
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  setCurrentOrder: (order: Order | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Computed
  getOrdersByStatus: (status: Order['status']) => Order[];
  getOrdersByCustomer: (customerId: string) => Order[];
  getOrdersByCook: (cookId: string) => Order[];
  getOrdersByDeliveryAgent: (agentId: string) => Order[];
}

export const useOrderStore = create<OrderState>((set, get) => ({
  // Initial state
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  // Actions
  setOrders: (orders) => set({ orders }),
  
  addOrder: (order) => set((state) => ({ 
    orders: [...state.orders, order] 
  })),
  
  updateOrder: (orderId, updates) => set((state) => ({
    orders: state.orders.map(order => 
      order.id === orderId ? { ...order, ...updates } : order
    ),
    currentOrder: state.currentOrder?.id === orderId 
      ? { ...state.currentOrder, ...updates }
      : state.currentOrder
  })),
  
  setCurrentOrder: (order) => set({ currentOrder: order }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  // Computed
  getOrdersByStatus: (status) => get().orders.filter(order => order.status === status),
  
  getOrdersByCustomer: (customerId) => get().orders.filter(order => order.customer_id === customerId),
  
  getOrdersByCook: (cookId) => get().orders.filter(order => order.assigned_cook_id === cookId),
  
  getOrdersByDeliveryAgent: (agentId) => get().orders.filter(order => order.assigned_delivery_agent_id === agentId),
}));

// Selectors for better performance
export const useOrders = () => useOrderStore((state) => state.orders);
export const useCurrentOrder = () => useOrderStore((state) => state.currentOrder);
export const useOrderLoading = () => useOrderStore((state) => state.isLoading);
export const useOrderError = () => useOrderStore((state) => state.error);

