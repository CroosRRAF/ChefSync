import React, { useState, useEffect, FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { customerService, CustomerStats, Order } from '@/services/customerService';
import { 
  ShoppingCart, 
  Clock, 
  Package, 
  TrendingUp,
  DollarSign,
  ChefHat,
  Trophy,
  User,
  Loader2,
  AlertCircle,
  Users,
  Calendar
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [loadingBulkOrders, setLoadingBulkOrders] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        await Promise.all([
          fetchCustomerStats(),
          fetchBulkOrders()
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-6">Please log in to access your dashboard.</p>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customerLevel = getCustomerLevel(stats?.completed_orders || 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Welcome Header */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-primary to-destructive text-primary-foreground overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-background/20 shadow-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary-foreground text-primary font-bold text-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold">{getGreeting()}, {user.name.split(' ')[0]}!</h1>
                  <p className="text-primary-foreground/80">Here's your foodie snapshot today.</p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/customer/settings')}
                className="bg-background/20 hover:bg-background/30 text-primary-foreground border-0"
              >
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={ShoppingCart} title="Total Orders" value={stats?.total_orders || 0} color="blue" />
          <StatCard icon={DollarSign} title="Total Spent" value={`LKR ${Math.round(stats?.total_spent || 0).toLocaleString()}`} color="emerald" />
          <StatCard icon={Clock} title="Active Orders" value={stats?.pending_orders || 0} color="purple" />
          <StatCard icon={TrendingUp} title="Avg. Order Value" value={`LKR ${Math.round(stats?.average_order_value || 0).toLocaleString()}`} color="amber" />
        </div>

        {/* Level Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className={`h-5 w-5 ${customerLevel.textColor}`} />
              Loyalty Status: {customerLevel.level}
            </CardTitle>
            <CardDescription>You are {10 - ((stats?.completed_orders || 0) % 10)} orders away from the next reward!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={customerLevel.progress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{stats?.completed_orders || 0} orders completed</span>
              <span>Next reward at {(Math.floor((stats?.completed_orders || 0) / 10) + 1) * 10} orders</span>
            </div>
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
    </div>
  );
};

// Helper Components
const StatCard: FC<{ icon: React.ElementType; title: string; value: string | number; color: 'blue' | 'emerald' | 'purple' | 'amber' }> = ({ icon: Icon, title, value, color }) => {
  const colorClasses = {
    blue: 'text-blue-500 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    emerald: 'text-emerald-500 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30',
    purple: 'text-purple-500 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
    amber: 'text-amber-500 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
  };
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const OrderRow: FC<{ order: Order }> = ({ order }) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'delivered': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      'preparing': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      'out_for_delivery': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      'ready': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
        <ChefHat className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">Order #{order.order_number}</p>
        <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-foreground">LKR {Math.round(order.total_amount)}</p>
        <Badge className={`${getStatusColor(order.status)} text-xs font-medium`}>{order.status.replace('_', ' ')}</Badge>
      </div>
    </div>
  );
};

const BulkOrderRow: FC<{ order: BulkOrder }> = ({ order }) => (
  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
    <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
      <Users className="h-6 w-6 text-purple-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-foreground truncate">#{order.order_number}</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{order.num_persons}</span>
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(order.event_date).toLocaleDateString()}</span>
      </div>
    </div>
    <Badge className="text-xs font-medium capitalize">{order.status}</Badge>
  </div>
);

const EmptyState: FC<{ icon: React.ElementType, title: string, description: string, buttonText: string, onClick: () => void }> = ({ icon: Icon, title, description, buttonText, onClick }) => (
  <div className="text-center py-10">
    <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon className="h-10 w-10 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    <p className="text-muted-foreground mb-4">{description}</p>
    <Button onClick={onClick}>{buttonText}</Button>
  </div>
);

const getCustomerLevel = (orderCount: number) => {
  if (orderCount >= 50) return { level: 'Diamond', textColor: 'text-purple-500', progress: 100 };
  if (orderCount >= 25) return { level: 'Gold', textColor: 'text-yellow-500', progress: ((orderCount - 25) / 25) * 100 };
  if (orderCount >= 10) return { level: 'Silver', textColor: 'text-gray-500', progress: ((orderCount - 10) / 15) * 100 };
  return { level: 'Bronze', textColor: 'text-orange-500', progress: (orderCount / 10) * 100 };
};

export default CustomerDashboardNew;
