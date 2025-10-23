import { useState, useCallback } from 'react';
import { orderService, CreateOrderData, ChefOrder } from '@/services/orderService';
import { toast } from 'sonner';

export interface ChefDashboardStats {
  orders_completed: number;
  orders_active: number;
  bulk_orders: number;
  total_reviews: number;
  average_rating: number;
  today_revenue: number;
  pending_orders: number;
  monthly_orders: number;
  customer_satisfaction: number;
  total_revenue: number;
  completed_orders: number;
  recent_orders: any[];
  total_orders: number;
}

export const useOrderService = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<ChefOrder[]>([]);
  const [dashboardStats, setDashboardStats] = useState<ChefDashboardStats | null>(null);

  const loadOrders = useCallback(async (filters?: any) => {
    setLoading(true);
    try {
      const userOrders = await orderService.getUserOrders();
      setOrders(userOrders);
      return userOrders;
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDashboardStats = useCallback(async () => {
    setLoading(true);
    try {
      const dashboardStats = await orderService.getChefDashboardStats();
      setDashboardStats(dashboardStats);
      return dashboardStats;
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (orderData: CreateOrderData) => {
    setLoading(true);
    try {
      const order = await orderService.createOrder(orderData);
      toast.success('Order created successfully');
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelOrder = useCallback(async (orderId: number) => {
    setLoading(true);
    try {
      await orderService.cancelOrder(orderId);
      toast.success('Order cancelled successfully');
      // Reload orders after cancellation
      await loadOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadOrders]);

  const getOrderStatus = useCallback(async (orderId: number) => {
    try {
      return await orderService.getOrderStatus(orderId);
    } catch (error) {
      console.error('Error getting order status:', error);
      toast.error('Failed to get order status');
      throw error;
    }
  }, []);

  const acceptOrder = useCallback(async (orderId: number, notes?: string) => {
    setLoading(true);
    try {
      const response = await orderService.acceptOrder(orderId, notes);
      toast.success('Order accepted successfully');
      return response;
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectOrder = useCallback(async (orderId: number, reason: string) => {
    setLoading(true);
    try {
      const response = await orderService.rejectOrder(orderId, reason);
      toast.success('Order rejected');
      return response;
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Failed to reject order');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (orderId: number, status: string, notes?: string) => {
    setLoading(true);
    try {
      const response = await orderService.updateOrderStatus(orderId, status, notes);
      toast.success('Order status updated');
      return response;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrderDetails = useCallback(async (orderId: number) => {
    setLoading(true);
    try {
      const order = await orderService.getOrder(orderId);
      return order;
    } catch (error) {
      console.error('Error loading order details:', error);
      toast.error('Failed to load order details');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    orders,
    dashboardStats,
    loadOrders,
    loadDashboardStats,
    loadOrderDetails,
    createOrder,
    cancelOrder,
    getOrderStatus,
    acceptOrder,
    rejectOrder,
    updateStatus,
    // Bulk order methods - bind to preserve 'this' context
    loadBulkOrders: orderService.loadBulkOrders.bind(orderService),
    loadBulkOrderStats: orderService.loadBulkOrderStats.bind(orderService),
    acceptBulkOrder: orderService.acceptBulkOrder.bind(orderService),
    declineBulkOrder: orderService.declineBulkOrder.bind(orderService),
    requestCollaboration: orderService.requestCollaboration.bind(orderService),
    loadAvailableChefs: orderService.loadAvailableChefs.bind(orderService),
    // Direct service methods - bind to preserve 'this' context
    calculateDeliveryFee: orderService.calculateDeliveryFee.bind(orderService),
    calculateTax: orderService.calculateTax.bind(orderService),
    calculateTotal: orderService.calculateTotal.bind(orderService),
    calculateDistance: orderService.calculateDistance.bind(orderService),
    formatOrderData: orderService.formatOrderData.bind(orderService)
  };
};

export default useOrderService;
