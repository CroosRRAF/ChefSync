import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/utils/fetcher';
import { adminService } from '@/services/adminService';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Timer,
  ChefHat,
  User,
  MapPin,
  Phone,
  Calendar,
  Search,
  Filter,
  Package,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  X
} from 'lucide-react';

interface AdminOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: 'cart' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
  total_amount: number;
  created_at: string;
  updated_at: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refund';
  items_count: number;
}

const OrderManagement: React.FC = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [availableChefs, setAvailableChefs] = useState<any[]>([]);
  const [availablePartners, setAvailablePartners] = useState<any[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'chef' | 'partner' | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<AdminOrder['status'] | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [previewOrder, setPreviewOrder] = useState<AdminOrder | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  
  // Order details modal states
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching orders using adminService');

      // Use the adminService instead of direct API call
      const ordersResponse = await adminService.getOrders({
        page: 1,
        limit: 100 // You can adjust this or make it configurable
      });
      
      console.log('✅ API Response received:', {
        orders: ordersResponse.orders.length,
        pagination: ordersResponse.pagination
      });

      // Convert service AdminOrder type to component AdminOrder type
      const convertedOrders = ordersResponse.orders.map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        status: order.status as AdminOrder['status'], // Type assertion to handle the status enum
        total_amount: typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount,
        created_at: order.created_at,
        updated_at: order.updated_at,
        payment_status: order.payment_status as AdminOrder['payment_status'], // Type assertion for payment status
        items_count: typeof order.items_count === 'string' ? parseInt(order.items_count) : order.items_count
      }));

      // Set the converted orders
      setOrders(convertedOrders || []);
    } catch (error: any) {
      console.error('❌ Error fetching orders with adminService:', {
        message: error?.message,
        response: error?.response,
        request: error?.request,
        config: error?.config,
        stack: error?.stack
      });

      // Log detailed request information
      if (error?.config) {
        console.error('📡 Request Details:', {
          method: error.config.method,
          url: error.config.url,
          baseURL: error.config.baseURL,
          headers: error.config.headers,
          timeout: error.config.timeout
        });
      }

      // Handle different types of errors
      if (error?.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.detail || error.response.data?.message || 'Server error';

        console.error('🚨 Server Error Response:', {
          status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });

        if (status === 401) {
          alert('Authentication required. Please log in again.');
          window.location.href = '/auth/login';
        } else if (status === 403) {
          alert('You do not have permission to access this resource.');
        } else if (status === 404) {
          alert(`Orders endpoint not found. Please check if the backend server is running.`);
          console.error('🔍 404 Error - Possible causes:');
          console.error('  - Backend server not running');
          console.error('  - Wrong endpoint URL in adminService');
          console.error('  - Missing route in Django URLs');
          console.error('  - CORS issues');
          console.error('  - Proxy configuration problem');
        } else {
          alert(`Failed to fetch orders: ${message}`);
        }
      } else if (error?.request) {
        // Network error
        console.error('🌐 Network Error Details:', {
          request: error.request,
          code: error.code,
          errno: error.errno,
          syscall: error.syscall
        });
        alert('Network error. Please check your connection and try again.');
      } else {
        // Other error
        const errorMessage = error?.message || 'Unknown error occurred';
        console.error('❓ Unknown Error Details:', error);
        alert(`Error: ${errorMessage}`);
      }

      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === paymentFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: AdminOrder['status']) => {
    try {
      // Use the correct API endpoint for status updates
      const response = await apiClient.patch(`/api/admin/orders/${orderId}/update_status/`, { 
        status: newStatus 
      });

      if (response.status >= 200 && response.status < 300) {
        // Update local state
        setOrders(prev => 
          prev.map(order => 
            order.id === parseInt(orderId) ? { 
              ...order, 
              status: newStatus,
              updated_at: new Date().toISOString()
            } : order
          )
        );
        
        // Show success message (you can add a toast notification here)
        console.log(`Order ${orderId} status updated to ${newStatus}`);
        alert(`Order status updated successfully to ${newStatus.replace('_', ' ')}`);
      } else {
        throw new Error(response.data?.detail || 'Failed to update order status');
      }
    } catch (error: any) {
      console.error('Error updating order status:', {
        message: error?.message,
        response: error?.response,
        request: error?.request
      });

      if (error?.response?.status === 401) {
        alert('Authentication required. Please log in again.');
        window.location.href = '/auth/login';
      } else if (error?.response?.status === 403) {
        alert('You do not have permission to update order status.');
      } else if (error?.response?.status === 404) {
        alert('Order not found or update endpoint not available.');
      } else {
        const message = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Unknown error';
        alert(`Failed to update order status: ${message}`);
      }
    }
  };

  // Validate status transitions
  const getValidStatusTransitions = (currentStatus: AdminOrder['status']): AdminOrder['status'][] => {
    const transitions: Record<AdminOrder['status'], AdminOrder['status'][]> = {
      'cart': ['pending', 'cancelled'],
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['out_for_delivery', 'cancelled'],
      'out_for_delivery': ['delivered', 'cancelled'],
      'delivered': ['refunded'],
      'cancelled': [],
      'refunded': []
    };
    
    return transitions[currentStatus] || [];
  };

  // Get status transition label
  const getStatusTransitionLabel = (from: AdminOrder['status'], to: AdminOrder['status']): string => {
    const labels: Record<string, string> = {
      'cart-pending': 'Confirm Order',
      'pending-confirmed': 'Confirm Payment',
      'confirmed-preparing': 'Start Preparing',
      'preparing-ready': 'Mark as Ready',
      'ready-out_for_delivery': 'Send for Delivery',
      'out_for_delivery-delivered': 'Mark as Delivered',
      'delivered-refunded': 'Process Refund',
      '*-cancelled': 'Cancel Order'
    };
    
    return labels[`${from}-${to}`] || labels[`*-${to}`] || `Change to ${to.replace('_', ' ')}`;
  };

  const getStatusColor = (status: AdminOrder['status']) => {
    switch (status) {
      case 'cart': return 'bg-gray-500';
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-green-500';
      case 'out_for_delivery': return 'bg-purple-500';
      case 'delivered': return 'bg-emerald-500';
      case 'cancelled': return 'bg-red-500';
      case 'refunded': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentColor = (status: AdminOrder['payment_status']) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      case 'refunded': return 'bg-blue-500';
      case 'partial_refund': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: AdminOrder['status']) => {
    switch (status) {
      case 'cart': return <Clock className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <ChefHat className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'out_for_delivery': return <Package className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      case 'refunded': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Handle status change modal
  const handleStatusChange = (order: AdminOrder, newStatus: AdminOrder['status']) => {
    setSelectedOrder(order);
    setSelectedNewStatus(newStatus);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (selectedOrder && selectedNewStatus) {
      await updateOrderStatus(selectedOrder.id.toString(), selectedNewStatus);
      setShowStatusModal(false);
      setSelectedOrder(null);
      setSelectedNewStatus(null);
    }
  };

  const cancelStatusChange = () => {
    setShowStatusModal(false);
    setSelectedOrder(null);
    setSelectedNewStatus(null);
  };

  // Fetch available chefs and partners
  const fetchAvailableResources = async () => {
    try {
      const [chefsResponse, partnersResponse] = await Promise.all([
        apiClient.get('/api/admin/orders/available_chefs/'),
        apiClient.get('/api/admin/orders/available_delivery_partners/')
      ]);

      // Check responses
      if (chefsResponse.status >= 200 && chefsResponse.status < 300) {
        setAvailableChefs(chefsResponse.data.chefs || []);
      }
      if (partnersResponse.status >= 200 && partnersResponse.status < 300) {
        setAvailablePartners(partnersResponse.data.partners || []);
      }
    } catch (error: any) {
      console.error('Error fetching available resources:', {
        message: error?.message,
        response: error?.response
      });

      if (error?.response?.status === 401) {
        alert('Authentication required. Please log in again.');
        window.location.href = '/auth/login';
      } else {
        const message = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Unknown error';
        alert(`Failed to fetch available resources: ${message}`);
      }

      setAvailableChefs([]);
      setAvailablePartners([]);
    }
  };

  // Handle assignment
  const handleAssignment = (order: AdminOrder, type: 'chef' | 'partner') => {
    setSelectedOrder(order);
    setAssignmentType(type);
    setShowAssignmentModal(true);
  };

  const confirmAssignment = async (resourceId: number) => {
    if (!selectedOrder || !assignmentType) return;
    
    try {
      const endpoint = assignmentType === 'chef' ? 'assign_chef' : 'assign_delivery_partner';
      const data = assignmentType === 'chef' 
        ? { chef_id: resourceId } 
        : { partner_id: resourceId };
      
      const response = await apiClient.patch(`/api/admin/orders/${selectedOrder.id}/${endpoint}/`, data);

      if (response.status >= 200 && response.status < 300) {
        // Update local state
        setOrders(prev => 
          prev.map(order => 
            order.id === selectedOrder.id ? { 
              ...order, 
              [assignmentType === 'chef' ? 'chef' : 'delivery_partner']: {
                id: resourceId,
                name: assignmentType === 'chef' 
                  ? availableChefs.find(c => c.id === resourceId)?.name
                  : availablePartners.find(p => p.id === resourceId)?.name,
                email: assignmentType === 'chef'
                  ? availableChefs.find(c => c.id === resourceId)?.email
                  : availablePartners.find(p => p.id === resourceId)?.email
              }
            } : order
          )
        );
        
        setShowAssignmentModal(false);
        setSelectedOrder(null);
        setAssignmentType(null);
        alert(`${assignmentType === 'chef' ? 'Chef' : 'Delivery partner'} assigned successfully!`);
      } else {
        throw new Error(response.data?.detail || 'Failed to assign resource');
      }
    } catch (error: any) {
      console.error('Error assigning resource:', error);

      if (error.response?.status === 401) {
        alert('Authentication required. Please log in again.');
        window.location.href = '/auth/login';
      } else if (error.response?.status === 403) {
        alert('You do not have permission to assign resources.');
      } else if (error.response?.status === 404) {
        alert('Order or resource not found.');
      } else {
        const message = error.response?.data?.detail || error.response?.data?.message || error.message || 'Unknown error';
        alert(`Failed to assign resource: ${message}`);
      }
    }
  };

  const cancelAssignment = () => {
    setShowAssignmentModal(false);
    setSelectedOrder(null);
    setAssignmentType(null);
  };

  // Handle order preview on hover
  const handleOrderPreview = (order: AdminOrder, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    setPreviewOrder(order);
    setShowPreview(true);
    setPreviewPosition({
      x: rect.left + rect.width / 2 + scrollLeft,
      y: rect.top + scrollTop - 10
    });
  };

  const handlePreviewClose = () => {
    setShowPreview(false);
    setPreviewOrder(null);
  };

  // Handle order detail view
  const handleOrderDetail = async (order: AdminOrder) => {
    try {
      setSelectedOrder(order);
      setOrderDetailLoading(true);
      setShowOrderDetail(true);
      setOrderDetails(null); // Reset details while loading
      
      const details = await adminService.getOrderDetails(order.id);
      setOrderDetails(details);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      alert(err instanceof Error ? err.message : 'Failed to fetch order details');
      setOrderDetails(null); // Ensure orderDetails is null on error
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const getTotalRevenue = () => {
    return orders
      .filter(order => order.payment_status === 'paid')
      .reduce((total, order) => total + order.total_amount, 0);
  };

  const getOrdersCount = (status: AdminOrder['status']) => {
    return orders.filter(order => order.status === status).length;
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Order Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage all system orders
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-xs">
            {orders.length} total orders
          </Badge>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by order number, customer name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

      {/* Assignment Modal */}
      {showAssignmentModal && selectedOrder && assignmentType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <ChefHat className="h-6 w-6 text-blue-500 mr-3" />
                <h3 className="text-lg font-semibold">
                  Assign {assignmentType === 'chef' ? 'Chef' : 'Delivery Partner'}
                </h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-600 mb-3">
                  Select a {assignmentType === 'chef' ? 'chef' : 'delivery partner'} for order <strong>#{selectedOrder.order_number}</strong>
                </p>
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="text-sm text-gray-600">
                    <strong>Customer:</strong> {selectedOrder.customer_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Items:</strong> {selectedOrder.items_count} items
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Total:</strong> ${selectedOrder.total_amount.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Available {assignmentType === 'chef' ? 'Chefs' : 'Delivery Partners'}:
                  </label>
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    {(assignmentType === 'chef' ? availableChefs : availablePartners).map((resource: any) => (
                      <div
                        key={resource.id}
                        className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                        onClick={() => confirmAssignment(resource.id)}
                      >
                        <div className="font-medium">{resource.name}</div>
                        <div className="text-sm text-gray-600">{resource.email}</div>
                        {resource.phone && (
                          <div className="text-sm text-gray-600">{resource.phone}</div>
                        )}
                      </div>
                    ))}
                    {(assignmentType === 'chef' ? availableChefs : availablePartners).length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        No available {assignmentType === 'chef' ? 'chefs' : 'delivery partners'} found
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={cancelAssignment}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow 
                  key={order.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative group"
                  onMouseEnter={(e) => handleOrderPreview(order, e)}
                  onMouseLeave={handlePreviewClose}
                >
                  <TableCell className="font-medium">
                    #{order.order_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.items_count} items
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(order.status)} text-white`}
                    >
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status.replace('_', ' ')}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${getPaymentColor(order.payment_status)} text-white`}
                    >
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${order.total_amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="text-xs px-2 py-1 h-auto"
                        onClick={() => handleOrderDetail(order)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      {getValidStatusTransitions(order.status).map((newStatus) => (
                        <Button
                          key={newStatus}
                          size="sm"
                          variant="outline"
                          className="text-xs px-2 py-1 h-auto"
                          onClick={() => handleStatusChange(order, newStatus)}
                        >
                          {getStatusTransitionLabel(order.status, newStatus)}
                        </Button>
                      ))}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs px-2 py-1 h-auto"
                        onClick={() => handleAssignment(order, 'chef')}
                      >
                        <ChefHat className="h-3 w-3 mr-1" />
                        Assign Chef
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs px-2 py-1 h-auto"
                        onClick={() => handleAssignment(order, 'partner')}
                      >
                        <Package className="h-3 w-3 mr-1" />
                        Assign Partner
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Status Change Modal */}
      {showStatusModal && selectedOrder && selectedNewStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-yellow-500 mr-3" />
                <h3 className="text-lg font-semibold">Confirm Status Change</h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-600 mb-3">
                  Are you sure you want to change the status of order <strong>#{selectedOrder.order_number}</strong> to <strong>{selectedNewStatus.replace('_', ' ')}</strong>?
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Customer:</strong> {selectedOrder.customer_name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Current Status:</strong> {selectedOrder.status.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>New Status:</strong> {selectedNewStatus.replace('_', ' ')}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={cancelStatusChange}>
                  Cancel
                </Button>
                <Button onClick={confirmStatusChange}>
                  Confirm Change
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Preview Popup */}
      {showPreview && previewOrder && (
        <div 
          className="fixed z-50 pointer-events-none animate-in fade-in-0 zoom-in-95"
          style={{
            left: `${previewPosition.x}px`,
            top: `${previewPosition.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 w-80 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {previewOrder.order_number.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  Order #{previewOrder.order_number}
                </h3>
                <p className="text-sm text-gray-500 truncate">{previewOrder.customer_name}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                <Badge 
                  variant={
                    previewOrder.status === 'delivered' ? 'default' :
                    previewOrder.status === 'cancelled' ? 'destructive' :
                    previewOrder.status === 'pending' ? 'secondary' : 'outline'
                  }
                  className={`text-xs ${
                    previewOrder.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    previewOrder.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    previewOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}
                >
                  {previewOrder.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">Payment:</span>
                <Badge 
                  variant={previewOrder.payment_status === 'paid' ? 'default' : 'secondary'}
                  className={`text-xs ${
                    previewOrder.payment_status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}
                >
                  {previewOrder.payment_status}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Items:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-semibold">{previewOrder.items_count}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Total:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-semibold">${previewOrder.total_amount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Ordered: {new Date(previewOrder.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>Updated: {new Date(previewOrder.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 flex flex-col h-full max-h-[90vh]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {selectedOrder.order_number.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Order #{selectedOrder.order_number}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowOrderDetail(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {orderDetailLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full inline-block mb-2"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading order details...</p>
                  </div>
                </div>
              ) : orderDetails ? (
                <div className="flex-1 overflow-auto">
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <Card className="overflow-hidden">
                      <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-3">
                        <CardTitle className="text-lg">Customer Information</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {orderDetails.customer ? (
                          <div className="space-y-2">
                            <div className="flex">
                              <span className="font-medium w-24">Name:</span>
                              <span>{orderDetails.customer.name}</span>
                            </div>
                            <div className="flex">
                              <span className="font-medium w-24">Email:</span>
                              <span>{orderDetails.customer.email}</span>
                            </div>
                            {orderDetails.customer.phone && (
                              <div className="flex">
                                <span className="font-medium w-24">Phone:</span>
                                <span>{orderDetails.customer.phone}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">Customer information not available</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                      <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-3">
                        <CardTitle className="text-lg">Order Status</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex">
                            <span className="font-medium w-24">Status:</span>
                            <Badge 
                              variant="secondary" 
                              className={`${getStatusColor(orderDetails.status)} text-white`}
                            >
                              {getStatusIcon(orderDetails.status)}
                              <span className="ml-1">{orderDetails.status.replace('_', ' ')}</span>
                            </Badge>
                          </div>
                          <div className="flex">
                            <span className="font-medium w-24">Payment:</span>
                            <Badge 
                              variant="outline" 
                              className={`${getPaymentColor(orderDetails.payment_status)} text-white`}
                            >
                              {orderDetails.payment_status}
                            </Badge>
                          </div>
                          <div className="flex">
                            <span className="font-medium w-24">Method:</span>
                            <span>{orderDetails.payment_method || 'Not specified'}</span>
                          </div>
                          <div className="flex">
                            <span className="font-medium w-24">Created:</span>
                            <span>{new Date(orderDetails.created_at).toLocaleString()}</span>
                          </div>
                          <div className="flex">
                            <span className="font-medium w-24">Updated:</span>
                            <span>{new Date(orderDetails.updated_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="mb-6 overflow-hidden">
                    <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-3">
                      <CardTitle className="text-lg">Order Items</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderDetails.items && orderDetails.items.length > 0 ? (
                            orderDetails.items.map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{item.food_name}</div>
                                    {item.special_instructions && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        <span className="font-medium">Instructions:</span> {item.special_instructions}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">${parseFloat(item.unit_price).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-medium">${parseFloat(item.total_price).toFixed(2)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-gray-500 py-4">No items found</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <Card className="overflow-hidden">
                      <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-3">
                        <CardTitle className="text-lg">Delivery Information</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium">Delivery Address:</span>
                            <p className="mt-1 text-gray-700 dark:text-gray-300">{orderDetails.delivery_address || 'Not provided'}</p>
                          </div>
                          {orderDetails.delivery_instructions && (
                            <div className="mt-3">
                              <span className="font-medium">Delivery Instructions:</span>
                              <p className="mt-1 text-gray-700 dark:text-gray-300">{orderDetails.delivery_instructions}</p>
                            </div>
                          )}
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-medium">Estimated Delivery:</span>
                              <p className="text-gray-700 dark:text-gray-300">
                                {orderDetails.estimated_delivery_time ? new Date(orderDetails.estimated_delivery_time).toLocaleString() : 'Not set'}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Actual Delivery:</span>
                              <p className="text-gray-700 dark:text-gray-300">
                                {orderDetails.actual_delivery_time ? new Date(orderDetails.actual_delivery_time).toLocaleString() : 'Not delivered yet'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                      <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-3">
                        <CardTitle className="text-lg">Order Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${parseFloat(orderDetails.subtotal).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax:</span>
                            <span>${parseFloat(orderDetails.tax_amount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Delivery Fee:</span>
                            <span>${parseFloat(orderDetails.delivery_fee).toFixed(2)}</span>
                          </div>
                          {parseFloat(orderDetails.discount_amount) > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount:</span>
                              <span>-${parseFloat(orderDetails.discount_amount).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                            <span>Total:</span>
                            <span>${parseFloat(orderDetails.total_amount).toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Notes Section */}
                  {(orderDetails.customer_notes || orderDetails.chef_notes || orderDetails.admin_notes) && (
                    <Card className="mb-6 overflow-hidden">
                      <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-3">
                        <CardTitle className="text-lg">Notes</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          {orderDetails.customer_notes && (
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Customer Notes:</h4>
                              <p className="text-gray-700 dark:text-gray-300">{orderDetails.customer_notes}</p>
                            </div>
                          )}
                          {orderDetails.chef_notes && (
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Chef Notes:</h4>
                              <p className="text-gray-700 dark:text-gray-300">{orderDetails.chef_notes}</p>
                            </div>
                          )}
                          {orderDetails.admin_notes && (
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Admin Notes:</h4>
                              <p className="text-gray-700 dark:text-gray-300">{orderDetails.admin_notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Assignment Section */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {orderDetails.chef && (
                      <Card className="overflow-hidden">
                        <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-3">
                          <CardTitle className="text-lg">Assigned Chef</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mr-3">
                              <ChefHat className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{orderDetails.chef.name}</p>
                              <p className="text-sm text-gray-500">{orderDetails.chef.email}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {orderDetails.delivery_partner && (
                      <Card className="overflow-hidden">
                        <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-3">
                          <CardTitle className="text-lg">Delivery Partner</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                              <Package className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{orderDetails.delivery_partner.name}</p>
                              <p className="text-sm text-gray-500">{orderDetails.delivery_partner.email}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to load order details</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Please try again or contact support if the problem persists.</p>
                    <Button onClick={() => setShowOrderDetail(false)} variant="outline">
                      Close
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-4 mt-auto border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Last updated: {new Date(selectedOrder.updated_at).toLocaleString()}</span>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setShowOrderDetail(false)}>
                    Close
                  </Button>
                  {/* Add more action buttons here if needed */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

export default OrderManagement;
