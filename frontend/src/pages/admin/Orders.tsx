import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/utils/fetcher';
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
  RefreshCw
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

const AdminOrders: React.FC = () => {
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

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/admin/orders/list_orders/');
      // Backend returns { orders: [], pagination: {...} }
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
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
      await apiClient.patch(`/api/admin/orders/${orderId}/update_status/`, { 
        status: newStatus 
      });
      
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
    } catch (error) {
      console.error('Error updating order status:', error);
      // Show error message (you can add a toast notification here)
      alert('Failed to update order status. Please try again.');
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
      
      setAvailableChefs(chefsResponse.data.chefs || []);
      setAvailablePartners(partnersResponse.data.partners || []);
    } catch (error) {
      console.error('Error fetching available resources:', error);
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
      
      await apiClient.patch(`/api/admin/orders/${selectedOrder.id}/${endpoint}/`, data);
      
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
    } catch (error) {
      console.error('Error assigning resource:', error);
      alert('Failed to assign resource. Please try again.');
    }
  };

  const cancelAssignment = () => {
    setShowAssignmentModal(false);
    setSelectedOrder(null);
    setAssignmentType(null);
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
      <AdminLayout>
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
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Order Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Monitor and manage all system orders
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={fetchOrders} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{orders.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{getOrdersCount('delivered')}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{getOrdersCount('pending')}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Revenue</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">${getTotalRevenue().toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
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
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            {filteredOrders.length} orders found
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
                <TableRow key={order.id}>
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
                      <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-auto">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </AdminLayout>
);

};

export default AdminOrders;
