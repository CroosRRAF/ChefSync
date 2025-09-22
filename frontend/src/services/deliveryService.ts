import apiClient from './apiClient'; // your centralized axios instance
import type { Order } from '../types/order';

// 🚚 Fetch available orders
export const getAvailableOrders = async (): Promise<Order[]> => {
  const res = await apiClient.get('/orders/orders/');
  return res.data.results;
};

// 🚚 Accept an order
export const acceptOrder = async (orderId: number) => {
  const res = await apiClient.post(`/orders/orders/${orderId}/accept/`);
  return res.data.results;
};

// 🚚 Update order status
export const updateOrderStatus = async (
  orderId: number,
  status: 'picked_up' | 'in_transit' | 'delivered'
) => {
  const res = await apiClient.patch(`/orders/orders/${orderId}/status/`, { status });
  return res.data.results;
};

// 🚚 Get delivery history
export const getDeliveryHistory = async (): Promise<Order[]> => {
  const res = await apiClient.get('/orders/orders/history/');
  return res.data.results;
};

// 🚚 Get dashboard summary
export const getDashboardSummary = async (): Promise<{
  active_deliveries: number;
  completed_today: number;
  todays_earnings: number;
  avg_delivery_time_min: number;
}> => {
  const res = await apiClient.get('/orders/orders/dashboard_summary/');
  return res.data.results;
};