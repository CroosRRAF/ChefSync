import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { customerService, CustomerStats } from '@/services/customerService';
import DashboardErrorBoundary from '@/components/dashboard/DashboardErrorBoundary';
import { 
  ShoppingCart, 
  Clock, 
  Package, 
  TrendingUp,
  Gift,
  DollarSign,
  ChefHat,
  Trophy,
  Target,
  Award,
  User,
  Loader2,
  AlertCircle,
  Users,
  Calendar
} from 'lucide-react';

interface BulkOrder {
  bulk_order_id: string;
  order_number: string;
  status: string;
  total_amount: number;
  num_persons: number;
  event_date: string;
  event_time: string;
  created_at: string;
  
  // Additional fields
  customer_id: number;
  chef_id?: number;
  delivery_partner_id?: number;
  delivery_address?: string;
  order_type: string;
  delivery_fee: number;
  distance_km?: number;
}

const CustomerDashboardContent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [loadingBulkOrders, setLoadingBulkOrders] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const customerStats = await customerService.getCustomerStats();
        setStats(customerStats);
        console.log('Customer stats loaded:', customerStats);
      } catch (error) {
        console.error('Error fetching customer stats:', error);
        // Set default stats on error
        setStats({
          total_orders: 0,
          completed_orders: 0,
          pending_orders: 0,
          total_spent: 0,
          average_order_value: 0,
          favorite_cuisines: [],
          recent_orders: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  useEffect(() => {
    const fetchBulkOrders = async () => {
      try {
        setLoadingBulkOrders(true);
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/orders/customer-bulk-orders/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Show only the 3 most recent bulk orders
          setBulkOrders(data.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching bulk orders:', error);
      } finally {
        setLoadingBulkOrders(false);
      }
    };

    if (user) {
      fetchBulkOrders();
    }
  }, [user]);

  const getCustomerLevel = (orderCount: number) => {
    if (orderCount >= 50) return { level: 'Diamond', color: 'bg-purple-500', progress: 100 };
    if (orderCount >= 25) return { level: 'Gold', color: 'bg-yellow-500', progress: (orderCount - 25) / 25 * 100 };
    if (orderCount >= 10) return { level: 'Silver', color: 'bg-gray-400', progress: (orderCount - 10) / 15 * 100 };
    return { level: 'Bronze', color: 'bg-orange-400', progress: orderCount / 10 * 100 };
  };

  const customerLevel = stats ? getCustomerLevel(stats.completed_orders) : { level: 'Bronze', color: 'bg-orange-500', progress: 0 };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Card className="border-none shadow-sm dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-none shadow-lg">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Card className="border-none shadow-lg bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <AlertCircle className="h-10 w-10 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Not Authenticated</h3>
                <p className="text-gray-600 dark:text-gray-400">Please log in to view your dashboard.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      case 'ready': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 ring-2 ring-orange-200 dark:ring-orange-700">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {getGreeting()}, {user.name.split(' ')[0]}! 👋
                </h1>
                <p className="text-gray-600 dark:text-gray-300 flex items-center mt-2">
                  <Badge className={`${customerLevel.color} text-white mr-2`}>
                    {customerLevel.level}
                  </Badge>
                  Member since {new Date(user.createdAt).getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Orders</p>
                <p className="text-3xl font-bold">{stats?.total_orders || 0}</p>
              </div>
              <ShoppingCart className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Spent</p>
                <p className="text-3xl font-bold">LKR {Math.round(stats?.total_spent || 0)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Active Orders</p>
                <p className="text-3xl font-bold">{stats?.pending_orders || 0}</p>
              </div>
              <Clock className="h-10 w-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Avg Order</p>
                <p className="text-3xl font-bold">LKR {Math.round(stats?.average_order_value || 0)}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>Customer Level Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${customerLevel.color} rounded-full flex items-center justify-center`}>
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{customerLevel.level} Level</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{stats?.completed_orders || 0} orders completed</p>
                </div>
              </div>
            </div>
            <Progress value={customerLevel.progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="border-none shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <Package className="h-5 w-5 text-orange-500" />
              <span>Recent Orders</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.recent_orders && stats.recent_orders.length > 0 ? (
              stats.recent_orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Order #{order.order_number}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">LKR {Math.round(order.total_amount)}</p>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No orders yet</p>
                <Button 
                  className="mt-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  onClick={() => navigate('/menu')}
                >
                  Browse Menu
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <Users className="h-5 w-5 text-purple-500" />
              <span>Bulk Orders</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingBulkOrders ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
              </div>
            ) : bulkOrders.length > 0 ? (
              <>
                {bulkOrders.map((bulkOrder) => (
                  <div key={bulkOrder.bulk_order_id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">#{bulkOrder.order_number}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {bulkOrder.num_persons} persons
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(bulkOrder.event_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">LKR {Math.round(bulkOrder.total_amount)}</p>
                      <Badge className={getStatusColor(bulkOrder.status)}>
                        {bulkOrder.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => navigate('/customer/profile')}
                >
                  View All Bulk Orders
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No bulk orders</p>
                <Button 
                  className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={() => navigate('/menu')}
                >
                  Browse Bulk Menus
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 md:gap-6">
        <Card className="border-none shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <Target className="h-5 w-5 text-blue-500" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              onClick={() => navigate('/menu')}
            >
              <ChefHat className="h-5 w-5 mr-2" />
              Order Food
            </Button>
            <Button 
              variant="outline" 
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => navigate('/customer/orders')}
            >
              <Package className="h-5 w-5 mr-2" />
              Track Orders
            </Button>
            <Button 
              variant="outline" 
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => navigate('/customer/profile')}
            >
              <User className="h-5 w-5 mr-2" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift className="h-5 w-5" />
            <span>Rewards</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <Award className="h-12 w-12 mx-auto mb-2 text-yellow-100" />
            <p className="text-2xl font-bold mb-1">{(stats?.completed_orders || 0) * 10}</p>
            <p className="text-yellow-100 text-sm mb-4">Points Earned</p>
            <Button variant="secondary" size="sm" className="bg-white text-orange-600 hover:bg-yellow-50">
              Redeem Points
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CustomerDashboard: React.FC = () => {
  return (
    <DashboardErrorBoundary>
      <CustomerDashboardContent />
    </DashboardErrorBoundary>
  );
};

export default CustomerDashboard;