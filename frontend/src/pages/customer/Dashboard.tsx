import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
// Removed useUserStore import - using AuthContext instead
import { useOrderStore } from '@/store/orderStore';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Clock, 
  MapPin, 
  Star, 
  Package, 
  User,
  Settings,
  LogOut,
  TrendingUp,
  Heart,
  Gift,
  Bell,
  Calendar,
  DollarSign,
  ChefHat,
  Truck,
  CheckCircle,
  XCircle,
  Timer,
  Phone,
  Mail,
  CreditCard,
  Trophy,
  Target,
  Award,
  Activity
} from 'lucide-react';

const CustomerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { orders, getOrdersByCustomer } = useOrderStore();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Get customer's orders
  const customerOrders = user ? getOrdersByCustomer(user.id) : [];
  
  // Calculate comprehensive statistics
  const totalOrders = customerOrders.length;
  const pendingOrders = customerOrders.filter(order => 
    ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status)
  ).length;
  const completedOrders = customerOrders.filter(order => order.status === 'delivered').length;
  const cancelledOrders = customerOrders.filter(order => order.status === 'cancelled').length;
  const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  // Recent activity
  const recentOrders = customerOrders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  // Customer level calculation
  const getCustomerLevel = (orderCount: number) => {
    if (orderCount >= 50) return { level: 'Diamond', color: 'bg-purple-500', progress: 100 };
    if (orderCount >= 25) return { level: 'Gold', color: 'bg-yellow-500', progress: (orderCount - 25) / 25 * 100 };
    if (orderCount >= 10) return { level: 'Silver', color: 'bg-gray-400', progress: (orderCount - 10) / 15 * 100 };
    return { level: 'Bronze', color: 'bg-orange-400', progress: orderCount / 10 * 100 };
  };

  const customerLevel = getCustomerLevel(completedOrders);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
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
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ready': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16 overflow-x-hidden">
      {/* Welcome Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getGreeting()}, {user.name.split(' ')[0]}! 👋
              </h1>
              <p className="text-gray-600 flex items-center">
                <Badge className={`${customerLevel.color} text-white mr-2`}>
                  {customerLevel.level}
                </Badge>
                Member since {new Date(user.createdAt).getFullYear()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-md bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Orders</p>
                  <p className="text-3xl font-bold">{totalOrders}</p>
                </div>
                <ShoppingCart className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Spent</p>
                  <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Active Orders</p>
                  <p className="text-3xl font-bold">{pendingOrders}</p>
                </div>
                <Clock className="h-10 w-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Avg Order</p>
                  <p className="text-3xl font-bold">${averageOrderValue.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Level Progress */}
        <Card className="mb-8 border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>Customer Status</span>
            </CardTitle>
            <CardDescription>Your progress towards the next tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={`${customerLevel.color} text-white px-3 py-1`}>
                  {customerLevel.level} Member
                </Badge>
                <span className="text-sm text-gray-600">
                  {completedOrders} completed orders
                </span>
              </div>
              <Progress value={customerLevel.progress} className="h-2" />
              <p className="text-sm text-gray-600">
                {customerLevel.level === 'Diamond' 
                  ? 'You\'ve reached the highest tier! 🎉'
                  : `${customerLevel.level === 'Gold' ? 50 - completedOrders : 
                       customerLevel.level === 'Silver' ? 25 - completedOrders : 
                       10 - completedOrders} more orders to reach ${
                       customerLevel.level === 'Gold' ? 'Diamond' :
                       customerLevel.level === 'Silver' ? 'Gold' : 'Silver'} status`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button asChild className="h-24 flex-col space-y-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-none shadow-md">
            <Link to="/menu">
              <ChefHat className="h-8 w-8" />
              <span className="font-semibold">Order Food</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-24 flex-col space-y-2 border-2 hover:bg-blue-50">
            <Link to="/customer/orders">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="font-semibold text-blue-600">My Orders</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-24 flex-col space-y-2 border-2 hover:bg-green-50">
            <Link to="/customer/profile">
              <User className="h-8 w-8 text-green-600" />
              <span className="font-semibold text-green-600">Profile</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-24 flex-col space-y-2 border-2 hover:bg-purple-50">
            <Link to="/customer/settings">
              <Settings className="h-8 w-8 text-purple-600" />
              <span className="font-semibold text-purple-600">Settings</span>
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>Your latest orders and updates</CardDescription>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-500 mb-6">Start your culinary journey with ChefSync!</p>
                    <Button asChild className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
                      <Link to="/menu">Browse Menu</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Order #{order.id.slice(-6)}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={`${getStatusColor(order.status)} border`}>
                              {order.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <p className="text-lg font-bold text-gray-900 mt-1">${order.total_amount}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            {order.status === 'delivered' && (
                              <span className="flex items-center space-x-1">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Delivered</span>
                              </span>
                            )}
                            {order.status === 'out_for_delivery' && (
                              <span className="flex items-center space-x-1">
                                <Truck className="h-4 w-4 text-blue-500" />
                                <span>Out for delivery</span>
                              </span>
                            )}
                            {order.status === 'preparing' && (
                              <span className="flex items-center space-x-1">
                                <Timer className="h-4 w-4 text-orange-500" />
                                <span>Being prepared</span>
                              </span>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {customerOrders.length > 3 && (
                      <Button asChild variant="outline" className="w-full mt-4">
                        <Link to="/customer/orders">View All Orders</Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile & Stats Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {user.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{user.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{user.email}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <Button asChild variant="outline" className="w-full">
                  <Link to="/customer/profile">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Order Statistics */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <span>Order Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-600">{completedOrders}</p>
                    <p className="text-xs text-green-600">Completed</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-red-600">{cancelledOrders}</p>
                    <p className="text-xs text-red-600">Cancelled</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-sm font-semibold">
                      {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rewards Card */}
            <Card className="border-none shadow-md bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-5 w-5" />
                  <span>Rewards</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Award className="h-12 w-12 mx-auto mb-2 text-yellow-100" />
                  <p className="text-2xl font-bold mb-1">{completedOrders * 10}</p>
                  <p className="text-yellow-100 text-sm mb-4">Points Earned</p>
                  <Button variant="secondary" size="sm" className="bg-white text-orange-600 hover:bg-yellow-50">
                    Redeem Points
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;

