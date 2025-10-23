/**
 * API-INTEGRATED ORDER MANAGEMENT SYSTEM
 * 
 * Features:
 * - Real API integration with Django backend
 * - Accept/Reject orders with backend synchronization
 * - Filtering by status, search terms, and dates
 * - Live dashboard statistics
 * - Customer communication system
 * - Professional UI with shadcn/ui components
 * 
 * Using real API calls to Django backend
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useOrderService } from '@/hooks/useOrderService';
import { ChefDashboardStats } from '@/hooks/useOrderService';
import type { Order } from '@/types/orderType';
import { 
  Search, Filter, RefreshCw, MoreVertical, Eye, Edit, Trash2, 
  Users, Clock, CheckCircle, AlertCircle, Package, TrendingUp,
  Calendar, DollarSign, User, MapPin, Phone, Mail, Bell,
  Check, X, MessageSquare
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Custom Notification Component
const Notification: React.FC<NotificationState & { onClose: () => void }> = ({
  show,
  message,
  type,
  onClose
}) => {
  useEffect(() => {
    if (show) {
      // Longer timeout for longer messages
      const timeout = message.length > 100 ? 8000 : 5000;
      const timer = setTimeout(onClose, timeout);
      return () => clearTimeout(timer);
    }
  }, [show, onClose, message]);

  if (!show) return null;

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }[type];

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in max-w-md`}>
      <div className="flex items-start justify-between">
        <span className="text-sm leading-relaxed pr-2">{message}</span>
        <button onClick={onClose} className="ml-2 text-white hover:text-gray-200 text-lg leading-none">
          ×
        </button>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700';
      case 'confirmed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700';
      case 'preparing': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700';
      case 'ready': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
      case 'out_for_delivery': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700';
      case 'delivered': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

// Rejection Modal Component
const RejectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  isSubmitting: boolean;
  orderNumber?: string;
  order?: Order;
}> = ({ isOpen, onClose, onSubmit, rejectionReason, setRejectionReason, isSubmitting, orderNumber, order }) => {
  
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  // Predefined rejection reasons
  const predefinedReasons = [
    {
      value: 'ingredients_unavailable',
      label: 'Ingredients Not Available',
      description: 'Required ingredients are out of stock',
      customerMessage: 'We apologize, but some ingredients for your order are currently unavailable. Your payment will be refunded within 3-5 business days.'
    },
    {
      value: 'kitchen_closed',
      label: 'Kitchen Temporarily Closed',
      description: 'Kitchen is closed due to maintenance or emergency',
      customerMessage: 'Our kitchen is temporarily closed due to unforeseen circumstances. We sincerely apologize for the inconvenience and will process your refund immediately.'
    },
    {
      value: 'high_order_volume',
      label: 'High Order Volume',
      description: 'Cannot fulfill due to overwhelming demand',
      customerMessage: 'We are experiencing exceptionally high demand and cannot fulfill your order within a reasonable time. Thank you for your understanding.'
    },
    {
      value: 'preparation_issues',
      label: 'Food Preparation Issues',
      description: 'Issues with food preparation or quality standards',
      customerMessage: 'We encountered issues that would affect the quality of your food. We maintain high standards and prefer to cancel rather than compromise quality.'
    },
    {
      value: 'delivery_area',
      label: 'Delivery Area Restriction',
      description: 'Cannot deliver to the specified location',
      customerMessage: 'Unfortunately, we cannot deliver to your location due to distance restrictions or delivery area limitations.'
    },
    {
      value: 'payment_issue',
      label: 'Payment Processing Issue',
      description: 'Problems with payment verification',
      customerMessage: 'There was an issue processing your payment. Please check with your bank or try a different payment method.'
    }
  ];

  const handleReasonSelect = (reasonValue: string) => {
    setSelectedReason(reasonValue);
    const reason = predefinedReasons.find(r => r.value === reasonValue);
    if (reason) {
      setRejectionReason(reason.customerMessage);
    }
    setCustomReason('');
  };

  const handleCustomReasonChange = (value: string) => {
    setCustomReason(value);
    setRejectionReason(value);
    setSelectedReason('custom');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReason('');
      setCustomReason('');
      setRejectionReason('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <X className="w-5 h-5 mr-2 text-red-500" />
            Reject Order {orderNumber}
          </DialogTitle>
          <DialogDescription>
            Please provide a clear reason for rejecting this order. The customer will receive this information along with automatic refund processing.
          </DialogDescription>
        </DialogHeader>

        {/* Order Summary */}
        {order && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-2">Order Summary</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Customer:</span> {order.customer_name}</p>
              <p><span className="font-medium">Total:</span> ${order.total_amount}</p>
              <p><span className="font-medium">Items:</span> {order.items?.length || 0} items</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Predefined Reasons */}
          <div>
            <Label className="text-base font-medium mb-3 block">Select Rejection Reason</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {predefinedReasons.map((reason) => (
                <div
                  key={reason.value}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedReason === reason.value
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleReasonSelect(reason.value)}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="rejection-reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={() => handleReasonSelect(reason.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{reason.label}</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{reason.description}</p>
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                        <strong>Customer will see:</strong> "{reason.customerMessage}"
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Custom Reason Option */}
              <div
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedReason === 'custom'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedReason('custom')}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="rejection-reason"
                    value="custom"
                    checked={selectedReason === 'custom'}
                    onChange={() => setSelectedReason('custom')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">Custom Reason</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Write your own personalized reason</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Reason Textarea */}
          {selectedReason === 'custom' && (
            <div>
              <Label htmlFor="custom-reason">Custom Rejection Reason *</Label>
              <Textarea
                id="custom-reason"
                placeholder="Please provide a clear, professional explanation for the customer. This message will be sent directly to them."
                value={customReason}
                onChange={(e) => handleCustomReasonChange(e.target.value)}
                required
                className="min-h-[100px] mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: Be specific and empathetic. Include what the customer should expect next (refund timeline, alternative suggestions, etc.)
              </p>
            </div>
          )}



          {/* Customer Communication Preview */}
          {rejectionReason && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Customer Notification Preview
              </h4>
              <div className="text-sm bg-white dark:bg-gray-800 rounded p-3 border">
                <p className="font-medium">Dear {order?.customer_name || '[Customer Name]'},</p>
                <p className="mt-2">We regret to inform you that we cannot fulfill order #{orderNumber}.</p>
                <p className="mt-2"><strong>Reason:</strong> {rejectionReason}</p>
                <p className="mt-2">Your payment will be automatically refunded to your original payment method within 3-5 business days.</p>
                <p className="mt-2">We sincerely apologize for any inconvenience caused.</p>
                <p className="mt-2">Best regards,<br/>ChefSync Team</p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="destructive" 
              disabled={!rejectionReason.trim() || isSubmitting}
            >
              {isSubmitting ? 'Processing Rejection...' : 'Reject Order & Notify Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Status Counts Component
const StatusCounts: React.FC<{ statusCounts: any; onStatusClick?: (status: string) => void }> = ({ 
  statusCounts, 
  onStatusClick = () => {} 
}) => {
  const statuses = [
    { key: 'pending_orders', label: 'Pending', color: 'text-yellow-600', icon: Clock },
    { key: 'preparing_orders', label: 'Preparing', color: 'text-orange-600', icon: Package },
    { key: 'ready_orders', label: 'Ready', color: 'text-green-600', icon: CheckCircle },
    { key: 'completed_orders', label: 'Completed', color: 'text-blue-600', icon: Users }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {statuses.map((status) => {
        const Icon = status.icon;
        const count = statusCounts?.[status.key] || 0;
        
        return (
          <div
            key={status.key}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onStatusClick(status.key.replace('_orders', ''))}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{status.label}</p>
                <p className={`text-2xl font-bold ${status.color}`}>{count}</p>
              </div>
              <Icon className={`h-8 w-8 ${status.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Dashboard Stats Component
const DashboardStats: React.FC<{ stats: ChefDashboardStats | null }> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const dashboardCards = [
    {
      title: 'Completed Orders',
      value: stats.completed_orders,
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Pending Orders',
      value: stats.pending_orders,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Total Revenue',
      value: `LKR ${(stats.total_revenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {dashboardCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
              <Icon className={`h-8 w-8 ${card.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Order Detail Modal Component
const OrderDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onAccept: (orderId: number) => void;
  onReject: (order: Order) => void;
  onUpdateStatus: (orderId: number, status: string) => void;
}> = ({ isOpen, onClose, order, onAccept, onReject, onUpdateStatus }) => {
  
  if (!order) return null;

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'preparing', 
      'preparing': 'ready',
      'ready': 'out_for_delivery',
      'out_for_delivery': 'delivered'
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const getStatusAction = (status: string) => {
    const actions = {
      'pending': 'Accept Order',
      'confirmed': 'Start Preparing',
      'preparing': 'Mark as Ready',
      'ready': 'Send for Delivery',
      'out_for_delivery': 'Mark as Delivered'
    };
    return actions[status as keyof typeof actions];
  };

  const nextStatus = getNextStatus(order.status);
  const statusAction = getStatusAction(order.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details - {order.order_number}</span>
            <StatusBadge status={order.status} />
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                <p className="font-medium">{order.customer?.full_name || order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                <p className="font-medium">{order.customer?.phone || 'Not provided'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                <p className="font-medium">{order.delivery_address}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Order Items ({order.items?.length || 0})
            </h3>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex-1">
                    <p className="font-medium">{item.price_details?.food_name || item.food_name || 'Unknown Item'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.price_details?.food_description || item.food_description || ''}</p>
                    <p className="text-xs text-gray-500">Size: {item.price_details?.size || item.size || 'Standard'}</p>
                    {item.special_instructions && (
                      <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                        Note: {item.special_instructions}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-medium">Qty: {item.quantity}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">${item.price_details?.price || item.price || '0.00'}</p>
                    <p className="font-bold">${item.item_total}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Order Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Items</span>
                <span>{order.total_items}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span>{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status</span>
                <span className={order.payment_status === 'Paid' ? 'text-green-600' : 'text-orange-600'}>
                  {order.payment_status}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount</span>
                  <span>${order.total_amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {order.special_instructions && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Special Instructions
              </h3>
              <p className="text-sm bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded">
                {order.special_instructions}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            
            {order.status === 'pending' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => onReject(order)}
                  className="flex items-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  onClick={() => onAccept(order.id)}
                  className="flex items-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Accept Order
                </Button>
              </>
            )}
            
            {nextStatus && (
              <Button 
                onClick={() => onUpdateStatus(order.id, nextStatus)}
                className="flex items-center"
              >
                <Package className="w-4 h-4 mr-2" />
                {statusAction}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main Order Component
const Order: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<ChefDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info'
  });

  // Rejection modal state
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  // Use the order service hook
  const {
    loadOrders,
    loadOrderDetails,
    acceptOrder,
    rejectOrder,
    updateStatus,
    loadDashboardStats
  } = useOrderService();

  const unreadCount = 0; // Placeholder for notifications
  const ordersPerPage = 10;

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ show: true, message, type });
  };

  // Hide notification
  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  // Fetch dashboard stats from API
  const fetchDashboardStats = async () => {
    try {
      const dashboardStats = await loadDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      showNotification('Failed to load dashboard stats', 'error');
      // Set default empty stats on error
      setStats({
        total_orders: 0,
        total_revenue: 0,
        pending_orders: 0,
        completed_orders: 0,
        average_rating: 0,
        recent_orders: []
      });
    }
  };

  // Fetch orders from API with filtering
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Load all orders from API (filtering will be done client-side)
      const fetchedOrders = await loadOrders();
      setOrders(fetchedOrders as any);
      showNotification(`Loaded ${fetchedOrders.length} orders`, 'success');
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      showNotification('Failed to load orders', 'error');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch order details from API
  const fetchOrderDetails = async (orderId: number) => {
    try {
      const order = await loadOrderDetails(orderId);
      setSelectedOrder(order as any);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      showNotification('Failed to load order details', 'error');
    }
  };

  // Update order status via API
  const updateOrderStatus = async (orderId: number, newStatus: string, notes?: string) => {
    try {
      await updateStatus(orderId, newStatus, notes);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: newStatus as Order['status'], 
                status_display: newStatus.charAt(0).toUpperCase() + newStatus.slice(1).replace('_', ' ')
              }
            : order
        )
      );
      
      showNotification('Order status updated successfully', 'success');
      await fetchDashboardStats(); // Refresh stats
      
    } catch (error) {
      console.error('Error updating order status:', error);
      showNotification('Failed to update order status', 'error');
    }
  };

  // Accept order function
  const handleAcceptOrder = async (orderId: number) => {
    try {
      await acceptOrder(orderId, 'Order accepted by chef');
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'confirmed', status_display: 'Confirmed' }
            : order
        )
      );
      
      showNotification('✅ Order accepted! Customer will receive confirmation message.', 'success');
      await fetchDashboardStats();
      
    } catch (error) {
      console.error('Error accepting order:', error);
      showNotification('Failed to accept order', 'error');
    }
  };

  // Reject order function
  const handleRejectOrder = (order: Order) => {
    setOrderToReject(order);
    setRejectionReason('');
    setIsRejectionModalOpen(true);
  };

  // Submit rejection with reason
  const submitRejection = async () => {
    if (!orderToReject || !rejectionReason.trim()) {
      showNotification('Please provide a reason for rejection', 'error');
      return;
    }

    try {
      setIsSubmittingRejection(true);
      await rejectOrder(orderToReject.id, rejectionReason.trim());
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderToReject.id 
            ? { ...order, status: 'cancelled', status_display: 'Cancelled' }
            : order
        )
      );
      
      // Close modal and reset state
      setIsRejectionModalOpen(false);
      setOrderToReject(null);
      setRejectionReason('');
      
      showNotification(
        `🚫 Order #${orderToReject.order_number} rejected successfully. Customer ${orderToReject.customer_name} has been notified with your reason and will receive an automatic refund within 3-5 business days.`,
        'success'
      );
      await fetchDashboardStats();
      
    } catch (error) {
      console.error('Error rejecting order:', error);
      showNotification('Failed to reject order', 'error');
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  // Pagination
  const ordersArray = Array.isArray(orders) ? orders : [];
  const totalPages = Math.ceil(ordersArray.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = ordersArray.slice(startIndex, endIndex);

  // Filter for status counts
  const statusCounts = useMemo(() => {
    return ordersArray.reduce((acc, order) => {
      const key = `${order.status}_orders`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [ordersArray]);

  // Effects
  useEffect(() => {
    fetchOrders();
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, statusFilter, dateFilter]);

  // Handle status filter from status counts
  const handleStatusCountClick = (status: string) => {
    setStatusFilter(status === statusFilter ? '' : status);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Notification */}
      <Notification {...notification} onClose={hideNotification} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage incoming orders and track kitchen operations
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {unreadCount > 0 && (
            <div className="relative">
              <Bell className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            </div>
          )}
          <Button onClick={() => { fetchOrders(); fetchDashboardStats(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats stats={stats} />
      
      {/* Status Counts */}
      <StatusCounts statusCounts={statusCounts} onStatusClick={handleStatusCountClick} />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by customer name, order number, or address..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading orders...</p>
          </div>
        ) : currentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">No orders found</p>
            <p className="text-gray-500">Try adjusting your filters or refresh the page.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.order_number}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {order.order_type}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {order.customer?.full_name || order.customer_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {order.customer?.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {order.total_items} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        ${order.total_amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {order.time_since_order}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchOrderDetails(order.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        {order.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptOrder(order.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectOrder(order)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {startIndex + 1} to {Math.min(endIndex, orders.length)} of {orders.length} orders
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        order={selectedOrder}
        onAccept={handleAcceptOrder}
        onReject={handleRejectOrder}
        onUpdateStatus={updateOrderStatus}
      />

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onSubmit={submitRejection}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        isSubmitting={isSubmittingRejection}
        orderNumber={orderToReject?.order_number}
        order={orderToReject}
      />
    </div>
  );
};

export default Order;