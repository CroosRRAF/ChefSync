import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { customerService, Order } from '@/services/customerService';
import { openOrderTracking } from '@/components/tracking/OrderTrackingWrapper';
import { 
  Package, 
  Search,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  RotateCcw,
  Download,
  Navigation,
  ChefHat,
  MapPin,
  Loader2,
  Users,
  Calendar,
  Home,
  LayoutDashboard,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import OrderConfirmationPopup from '@/components/orders/OrderConfirmationPopup';

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

const CustomerOrdersNew: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkSearchTerm, setBulkSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('regular');
  const [orderFilter, setOrderFilter] = useState('recent'); // recent, completed, cancelled
  const [bulkOrderFilter, setBulkOrderFilter] = useState('recent');

  // Order confirmation popup state
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string>('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'customer') {
      navigate('/auth/login');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Set active tab from location state
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  // Fetch orders function
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await customerService.getOrders({ page_size: 100 });
      const ordersData = Array.isArray(response) ? response : response.results || [];
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders on mount
  useEffect(() => {
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
        }
      } catch (error) {
        console.error('Error fetching bulk orders:', error);
        toast.error('Failed to load bulk orders');
      } finally {
        setBulkLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'customer') {
      fetchBulkOrders();
    }
  }, [isAuthenticated, user]);

  // Filter functions
  const filterOrders = (orders: Order[], filter: string, search: string) => {
    let filtered = orders;
    
    // Apply status filter
    switch (filter) {
      case 'completed':
        filtered = orders.filter(o => ['delivered', 'completed'].includes(o.status));
        break;
      case 'cancelled':
        filtered = orders.filter(o => ['cancelled', 'refunded'].includes(o.status));
        break;
      case 'recent':
      default:
        filtered = orders.filter(o => !['delivered', 'completed', 'cancelled', 'refunded'].includes(o.status));
        break;
    }
    
    // Apply search filter
    if (search) {
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(search.toLowerCase()) ||
        (order.chef?.name || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filterBulkOrders = (orders: BulkOrder[], filter: string, search: string) => {
    let filtered = orders;
    
    // Apply status filter
    switch (filter) {
      case 'completed':
        filtered = orders.filter(o => ['delivered', 'completed'].includes(o.status));
        break;
      case 'cancelled':
        filtered = orders.filter(o => o.status === 'cancelled');
        break;
      case 'recent':
      default:
        filtered = orders.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.status));
        break;
    }
    
    // Apply search filter
    if (search) {
      filtered = filtered.filter(order => 
        order.order_number?.toLowerCase().includes(search.toLowerCase()) ||
        (order.chef?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (order.menu_name || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300';
      case 'ready':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300';
      case 'pending':
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
      case 'refunded':
        return <XCircle className="h-4 w-4" />;
      case 'preparing':
        return <ChefHat className="h-4 w-4" />;
      case 'pending':
      case 'confirmed':
        return <Clock className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const handleReorder = async (order: Order) => {
    try {
      toast.info('Adding items to cart...');
      
      // Add each item from the order to the cart
      for (const item of order.items || []) {
        try {
          await fetch('/api/orders/cart/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              price_id: item.price_details?.price_id || item.price?.price_id || item.price?.id,
              quantity: item.quantity,
              special_instructions: item.special_instructions || ''
            })
          });
        } catch (error) {
          console.error('Error adding item to cart:', error);
        }
      }
      
      toast.success('Items added to cart!');
      navigate('/cart');
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder. Please try again.');
    }
  };

  const handleReview = (orderId: number) => {
    navigate(`/customer/orders/${orderId}/review`);
  };

  const handleDownloadInvoice = async (orderId: number, orderNumber: string) => {
    try {
      toast.info('Generating invoice...');
      const response = await fetch(`/api/orders/orders/${orderId}/generate_invoice/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Invoice downloaded!');
      } else {
        throw new Error('Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Invoice generation coming soon!');
    }
  };

  const canCancelOrder = (order: Order) => {
    // Only pending orders can be cancelled
    if (order.status !== 'pending') return false;
    
    // Check if order is within 10-minute cancellation window
    const orderTime = new Date(order.created_at).getTime();
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - orderTime;
    const tenMinutesInMs = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    return timeDifference <= tenMinutesInMs;
  };

  const handleCancelOrder = async (orderId: number, orderNumber: string) => {
    if (!window.confirm(`Are you sure you want to cancel order ${orderNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      toast.info('Cancelling your order...');
      const response = await fetch(`/api/orders/orders/${orderId}/cancel_order/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'Customer requested cancellation'
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Order cancelled successfully! You will receive a refund shortly.');
        
        // Refresh the orders list
        await fetchOrders();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel order');
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast.error(error.message || 'Failed to cancel order. Please try again.');
    }
  };

  const filteredOrders = filterOrders(orders, orderFilter, searchTerm);
  const filteredBulkOrders = filterBulkOrders(bulkOrders, bulkOrderFilter, bulkSearchTerm);

  if (loading && bulkLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Navigation */}
        <div className="mb-6 flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/customer/dashboard')}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/menu')}
          >
            <Home className="h-4 w-4 mr-2" />
            Browse Menu
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

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 mb-6">
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
            {/* Horizontal Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by order number or chef name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Status Filter Buttons */}
              <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg border">
                <Button
                  variant={orderFilter === 'recent' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setOrderFilter('recent')}
                  className={orderFilter === 'recent' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Recent
                </Button>
                <Button
                  variant={orderFilter === 'completed' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setOrderFilter('completed')}
                  className={orderFilter === 'completed' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </Button>
                <Button
                  variant={orderFilter === 'cancelled' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setOrderFilter('cancelled')}
                  className={orderFilter === 'cancelled' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancelled
                </Button>
              </div>
            </div>

            {/* Orders List */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchTerm ? 'No orders match your search' : `No ${orderFilter} orders`}
                  </p>
                  <Button
                    onClick={() => navigate('/menu')}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    Browse Menu
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Order Info */}
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              Order #{order.order_number}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              by {order.chef?.name || 'Unknown Chef'} • {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            {order.delivery_address && (
                              <div className="flex items-center text-sm text-gray-500 mb-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span className="truncate">{order.delivery_address}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <Badge className={getStatusColor(order.status)}>
                                <span className="flex items-center space-x-1">
                                  {getStatusIcon(order.status)}
                                  <span>{order.status.replace('_', ' ')}</span>
                                </span>
                              </Badge>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                LKR {Math.round(order.total_amount)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {/* Completed orders: Review and Reorder */}
                          {['delivered', 'completed'].includes(order.status) && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleReview(order.id)}
                                className="bg-yellow-500 hover:bg-yellow-600"
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReorder(order)}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Reorder
                              </Button>
                            </>
                          )}
                          
                          {/* Active orders: Track */}
                          {!['delivered', 'completed', 'cancelled', 'refunded'].includes(order.status) && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openOrderTracking(order.id)}
                              className="bg-orange-500 hover:bg-orange-600"
                            >
                              <Navigation className="h-4 w-4 mr-1" />
                              Track
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/customer/orders/${order.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          {/* Invoice button - only show for confirmed, paid orders */}
                          {!['cart', 'pending'].includes(order.status) && order.payment_status === 'paid' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadInvoice(order.id, order.order_number)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Invoice
                            </Button>
                          )}

                          {/* Cancel button - only show for pending orders within cancellation window */}
                          {canCancelOrder(order) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelOrder(order.id, order.order_number)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          )}
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
            {/* Horizontal Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search bulk orders..."
                    value={bulkSearchTerm}
                    onChange={(e) => setBulkSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Status Filter Buttons */}
              <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg border">
                <Button
                  variant={bulkOrderFilter === 'recent' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBulkOrderFilter('recent')}
                  className={bulkOrderFilter === 'recent' ? 'bg-purple-500 hover:bg-purple-600' : ''}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Recent
                </Button>
                <Button
                  variant={bulkOrderFilter === 'completed' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBulkOrderFilter('completed')}
                  className={bulkOrderFilter === 'completed' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </Button>
                <Button
                  variant={bulkOrderFilter === 'cancelled' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBulkOrderFilter('cancelled')}
                  className={bulkOrderFilter === 'cancelled' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancelled
                </Button>
              </div>
            </div>

            {/* Bulk Orders List */}
            {bulkLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : filteredBulkOrders.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bulk orders found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {bulkSearchTerm ? 'No orders match your search' : `No ${bulkOrderFilter} bulk orders`}
                  </p>
                  <Button
                    onClick={() => navigate('/menu')}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    Browse Bulk Menus
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredBulkOrders.map((order) => (
                  <Card key={order.bulk_order_id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Order Info */}
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              Bulk Order #{order.order_number || `BULK-${order.bulk_order_id}`}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              by {order.chef?.name || 'Unknown Chef'} • {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                              {order.num_persons && (
                                <div className="flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  {order.num_persons} persons
                                </div>
                              )}
                              {order.event_date && (
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(order.event_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge className={getStatusColor(order.status)}>
                                <span className="flex items-center space-x-1">
                                  {getStatusIcon(order.status)}
                                  <span>{order.status}</span>
                                </span>
                              </Badge>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                LKR {Math.round(order.total_amount)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {/* Completed bulk orders: Review and Invoice */}
                          {['completed', 'delivered'].includes(order.status) && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => toast.info('Bulk order reviews coming soon!')}
                                className="bg-yellow-500 hover:bg-yellow-600"
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/customer/bulk-orders/${order.bulk_order_id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoice(order.bulk_order_id, order.order_number)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Invoice
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Confirmation Popup */}
      {showConfirmationPopup && confirmedOrderId && (
        <OrderConfirmationPopup
          isOpen={showConfirmationPopup}
          onClose={() => setShowConfirmationPopup(false)}
          orderId={confirmedOrderId}
          orderNumber={confirmedOrderNumber}
          orderType={activeTab === 'bulk' ? 'bulk' : 'regular'}
        />
      )}
    </div>
  );
};

export default CustomerOrdersNew;

