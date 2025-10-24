import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { customerService, Order } from '@/services/customerService';
import { openOrderTracking } from '@/components/tracking/OrderTrackingWrapper';
import { 
  Package, 
  Clock, 
  MapPin, 
  Phone, 
  Search, 
  Filter,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  Truck,
  ChefHat,
  Star,
  ArrowLeft,
  Home,
  LayoutDashboard,
  Loader2,
  Navigation,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

// Bulk Order interface 
interface BulkOrder {
  bulk_order_id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  delivery_address: string;
  created_at: string;
  updated_at: string;
  chef?: {
    id: number;
    name: string;
    profile_image: string | null;
  };
  num_persons?: number;
  event_date?: string;
  menu_name?: string;
}

const CustomerOrders: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bulkSearchTerm, setBulkSearchTerm] = useState('');
  const [bulkStatusFilter, setBulkStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedBulkOrder, setSelectedBulkOrder] = useState<BulkOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showBulkOrderDetails, setShowBulkOrderDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('regular');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'customer') {
      navigate('/auth/login');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await customerService.getOrders({ page_size: 50 });
        const ordersData = Array.isArray(response) ? response : response.results || [];
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'customer') {
      fetchOrders();
    }
  }, [isAuthenticated, user]);

  // Fetch bulk orders
  useEffect(() => {
    const fetchBulkOrders = async () => {
      try {
        setBulkLoading(true);
        const response = await fetch('/api/orders/customer-bulk-orders/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const bulkOrdersData = await response.json();
          setBulkOrders(Array.isArray(bulkOrdersData) ? bulkOrdersData : bulkOrdersData.results || []);
        } else {
          throw new Error('Failed to fetch bulk orders');
        }
      } catch (error) {
        console.error('Error fetching bulk orders:', error);
        toast.error('Failed to load bulk orders');
        setBulkOrders([]);
      } finally {
        setBulkLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'customer') {
      fetchBulkOrders();
    }
  }, [isAuthenticated, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      case 'ready': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      case 'preparing': return <ChefHat className="h-4 w-4" />;
      case 'out_for_delivery': return <Truck className="h-4 w-4" />;
      case 'ready': return <Package className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.chef?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredBulkOrders = bulkOrders.filter(order => {
    const matchesSearch = order.order_number?.toLowerCase().includes(bulkSearchTerm.toLowerCase()) ||
                         (order.chef?.name || '').toLowerCase().includes(bulkSearchTerm.toLowerCase()) ||
                         (order.menu_name || '').toLowerCase().includes(bulkSearchTerm.toLowerCase());
    const matchesStatus = bulkStatusFilter === 'all' || order.status === bulkStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleViewBulkOrder = (order: BulkOrder) => {
    setSelectedBulkOrder(order);
    setShowBulkOrderDetails(true);
  };

  const handleCancelOrder = async (orderId: number) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await customerService.cancelOrder(orderId, 'Cancelled by customer');
        toast.success('Order cancelled successfully');
        // Refresh orders
        const response = await customerService.getOrders({ page_size: 50 });
        const ordersData = Array.isArray(response) ? response : response.results || [];
        setOrders(ordersData);
      } catch (error) {
        console.error('Error cancelling order:', error);
        toast.error('Failed to cancel order');
      }
    }
  };

  const handleTrackOrder = (orderId: number) => {
    // Use global event to open tracking panel
    openOrderTracking(orderId);
  };

  const isActiveOrder = (status: string) => {
    return !['delivered', 'cancelled', 'refunded', 'cart', 'completed'].includes(status);
  };

  if (loading && bulkLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2 text-gray-600">Loading orders...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6 flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/customer/dashboard')}
            className="hover:bg-blue-50"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="hover:bg-green-50"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Orders
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage your food orders
          </p>
        </div>

        {/* Tabs for Regular vs Bulk Orders */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="regular" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Regular Orders ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Bulk Orders ({bulkOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* Regular Orders Tab */}
          <TabsContent value="regular" className="mt-6">
            {/* Regular Orders Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search orders by number or chef name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="md:w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regular Orders List */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="ml-2 text-gray-600">Loading regular orders...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No regular orders found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No orders match your current filters' 
                      : 'You haven\'t placed any regular orders yet'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button
                      onClick={() => navigate('/menu')}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      Browse Menu
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Order #{order.order_number}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          by {order.chef?.name || 'Unknown Chef'} • {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span>{order.delivery_address}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          LKR {Math.round(order.total_amount)}
                        </p>
                        <Badge className={getStatusColor(order.status)}>
                          <span className="flex items-center space-x-1">
                            {getStatusIcon(order.status)}
                            <span>{order.status.replace('_', ' ')}</span>
                          </span>
                        </Badge>
                      </div>
                      
                      <div className="flex space-x-2">
                        {/* Review button for delivered orders */}
                        {order.status === 'delivered' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => navigate(`/customer/orders/${order.id}/review`)}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        )}
                        
                        {/* Track button for active orders */}
                        {isActiveOrder(order.status) && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleTrackOrder(order.id)}
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                          >
                            <Navigation className="h-4 w-4 mr-1" />
                            Track
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        {order.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelOrder(order.id)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          {/* Bulk Orders Tab */}
          <TabsContent value="bulk" className="mt-6">
            {/* Bulk Orders Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search bulk orders by number, chef, or menu name..."
                        value={bulkSearchTerm}
                        onChange={(e) => setBulkSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="md:w-48">
                    <Select value={bulkStatusFilter} onValueChange={setBulkStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Orders List */}
            {bulkLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="ml-2 text-gray-600">Loading bulk orders...</span>
              </div>
            ) : filteredBulkOrders.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bulk orders found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {bulkSearchTerm || bulkStatusFilter !== 'all' 
                      ? 'No bulk orders match your current filters' 
                      : 'You haven\'t placed any bulk orders yet'
                    }
                  </p>
                  {!bulkSearchTerm && bulkStatusFilter === 'all' && (
                    <Button
                      onClick={() => navigate('/menu')}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    >
                      Browse Bulk Menus
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredBulkOrders.map((order) => (
                  <Card key={order.bulk_order_id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              Bulk Order #{order.order_number || `BULK-${order.bulk_order_id}`}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              by {order.chef?.name || 'Unknown Chef'} • {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Users className="h-3 w-3" />
                                <span>{order.num_persons || 'N/A'} persons</span>
                              </div>
                              {order.event_date && (
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(order.event_date).toLocaleDateString()}</span>
                                </div>
                              )}
                              {order.menu_name && (
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <ChefHat className="h-3 w-3" />
                                  <span>{order.menu_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              LKR {Math.round(order.total_amount)}
                            </p>
                            <Badge className={getStatusColor(order.status)}>
                              <span className="flex items-center space-x-1">
                                {getStatusIcon(order.status)}
                                <span>{order.status.replace('_', ' ')}</span>
                              </span>
                            </Badge>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewBulkOrder(order)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowOrderDetails(false)} />
            <Card className="relative w-full max-w-2xl mx-4 max-h-[80vh] bg-white dark:bg-gray-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order #{selectedOrder.order_number}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOrderDetails(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-96">
                  <div className="space-y-4">
                    {/* Order Status */}
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(selectedOrder.status)}
                          <span>{selectedOrder.status.replace('_', ' ')}</span>
                        </span>
                      </Badge>
                    </div>

                    {/* Chef Info */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Chef Information</h4>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                          <ChefHat className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">{selectedOrder.chef?.name || 'Unknown Chef'}</p>
                          <p className="text-sm text-gray-600">Chef</p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold mb-2">Order Items</h4>
                      <div className="space-y-2">
                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div>
                                <p className="font-medium">{item.food_name}</p>
                                <p className="text-sm text-gray-600">by {item.cook_name} - {item.size}</p>
                                {item.special_instructions && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Note: {item.special_instructions}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">LKR {Math.round(item.total_price)}</p>
                                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No items found in this order.</p>
                        )}
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Delivery Information</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{selectedOrder.delivery_address}</span>
                        </div>
                        {selectedOrder.delivery_instructions && (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{selectedOrder.delivery_instructions}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Subtotal</span>
                        <span>LKR {Math.round(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Delivery Fee</span>
                        <span>LKR {Math.round(selectedOrder.delivery_fee)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Tax</span>
                        <span>LKR {Math.round(selectedOrder.tax_amount)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total</span>
                        <span>LKR {Math.round(selectedOrder.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bulk Order Details Modal */}
        {showBulkOrderDetails && selectedBulkOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowBulkOrderDetails(false)} />
            <Card className="relative w-full max-w-2xl mx-4 max-h-[80vh] bg-white dark:bg-gray-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Bulk Order #{selectedBulkOrder.order_number || `BULK-${selectedBulkOrder.bulk_order_id}`}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBulkOrderDetails(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-96">
                  <div className="space-y-4">
                    {/* Order Status */}
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(selectedBulkOrder.status)}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(selectedBulkOrder.status)}
                          <span>{selectedBulkOrder.status.replace('_', ' ')}</span>
                        </span>
                      </Badge>
                    </div>

                    {/* Chef Info */}
                    {selectedBulkOrder.chef && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                          <ChefHat className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="font-semibold">{selectedBulkOrder.chef.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Chef</p>
                        </div>
                      </div>
                    )}

                    {/* Event Details */}
                    <div className="space-y-2">
                      <h4 className="font-semibold">Event Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Persons</p>
                          <p className="font-semibold">{selectedBulkOrder.num_persons || 'N/A'}</p>
                        </div>
                        {selectedBulkOrder.event_date && (
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Event Date</p>
                            <p className="font-semibold">{new Date(selectedBulkOrder.event_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        {selectedBulkOrder.menu_name && (
                          <div className="col-span-2">
                            <p className="text-gray-600 dark:text-gray-400">Menu</p>
                            <p className="font-semibold">{selectedBulkOrder.menu_name}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delivery Address */}
                    {selectedBulkOrder.delivery_address && (
                      <div>
                        <h4 className="font-semibold mb-2">Delivery Address</h4>
                        <div className="flex items-start space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <p>{selectedBulkOrder.delivery_address}</p>
                        </div>
                      </div>
                    )}

                    {/* Financial Summary */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Total Amount</span>
                        <span className="text-lg font-bold text-green-600">
                          LKR {Math.round(selectedBulkOrder.total_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Payment Status</span>
                        <Badge className={selectedBulkOrder.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {selectedBulkOrder.payment_status}
                        </Badge>
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="border-t pt-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Ordered On</span>
                        <span>{new Date(selectedBulkOrder.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Updated</span>
                        <span>{new Date(selectedBulkOrder.updated_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;