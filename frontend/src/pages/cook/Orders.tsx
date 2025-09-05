import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserStore } from '@/store/userStore';
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
  Filter
} from 'lucide-react';

interface CookOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    specialInstructions?: string;
  }>;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  actualTime: number;
  orderTime: string;
  assignedCookId: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid';
}

const CookOrders: React.FC = () => {
  const { user } = useUserStore();
  const [orders, setOrders] = useState<CookOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<CookOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, priorityFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/cook/orders/');
      setOrders(response.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(order => order.priority === priorityFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: CookOrder['status']) => {
    try {
      await apiClient.patch(`/cook/orders/${orderId}/`, { status: newStatus });
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status: CookOrder['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'preparing': return 'bg-blue-500';
      case 'ready': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: CookOrder['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: CookOrder['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'preparing': return <ChefHat className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <Timer className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient-primary mb-2">
          My Orders
        </h1>
        <p className="text-muted-foreground">
          Manage and track your assigned orders
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders or customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(order.orderTime).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(order.status)} text-white`}
                  >
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{order.status}</span>
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`${getPriorityColor(order.priority)} text-white`}
                  >
                    {order.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">{order.customerName}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2" />
                  {order.customerPhone}
                </div>
                <div className="flex items-start text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                  <span className="line-clamp-2">{order.customerAddress}</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Order Items:</h4>
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      {item.specialInstructions && (
                        <span className="text-muted-foreground text-xs">
                          ({item.specialInstructions})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Time and Payment */}
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {order.actualTime}/{order.estimatedTime} min
                </div>
                <div className="text-right">
                  <div className="font-medium">${order.totalAmount}</div>
                  <Badge 
                    variant={order.paymentStatus === 'paid' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {order.status === 'pending' && (
                  <Button 
                    size="sm" 
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="flex-1"
                  >
                    <ChefHat className="h-4 w-4 mr-1" />
                    Start Preparing
                  </Button>
                )}
                
                {order.status === 'preparing' && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Ready
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                    >
                      <Timer className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  </>
                )}
                
                {order.status === 'ready' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="w-full"
                  >
                    <Timer className="h-4 w-4 mr-1" />
                    Mark as Completed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {orders.length === 0 ? 'No Orders Assigned' : 'No Orders Match Filters'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {orders.length === 0 
                ? 'You don\'t have any orders assigned yet. New orders will appear here.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            <Button onClick={fetchOrders}>
              Refresh Orders
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CookOrders;
