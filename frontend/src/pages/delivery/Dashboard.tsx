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
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Navigation, 
  TrendingUp,
  Bell,
  LogOut,
  Calendar,
  Target,
  Award,
  Activity,
  Users,
  Star,
  AlertTriangle,
  Zap,
  Package,
  Route,
  Timer,
  DollarSign
} from 'lucide-react';

const DeliveryDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { orders, getOrdersByDeliveryAgent } = useOrderStore();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Get delivery agent's assigned orders
  const deliveryOrders = user ? getOrdersByDeliveryAgent(user.id) : [];
  
  // Calculate comprehensive statistics
  const totalDeliveries = deliveryOrders.length;
  const activeDeliveries = deliveryOrders.filter(order => 
    order.status === 'out_for_delivery'
  ).length;
  const pendingDeliveries = deliveryOrders.filter(order => 
    ['ready', 'pending'].includes(order.status)
  ).length;
  const completedToday = deliveryOrders.filter(order => 
    order.status === 'delivered' && 
    new Date(order.created_at).toDateString() === new Date().toDateString()
  ).length;
  const totalEarnings = deliveryOrders
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + (order.delivery_fee || 5), 0);
  const averageDeliveryTime = 18; // Mock data - would calculate from actual data
  const customerRating = 4.9; // Mock data

  // Recent activity
  const recentDeliveries = deliveryOrders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Delivery status
  const getDeliveryStatus = () => {
    if (activeDeliveries > 2) return { status: 'Busy', color: 'bg-red-500', icon: AlertTriangle };
    if (activeDeliveries > 0) return { status: 'Active', color: 'bg-blue-500', icon: Truck };
    return { status: 'Available', color: 'bg-green-500', icon: CheckCircle };
  };

  const deliveryStatus = getDeliveryStatus();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your delivery dashboard...</p>
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
      case 'out_for_delivery': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 ring-2 ring-blue-500/20">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-blue-500 text-white font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getGreeting()}, {user.name.split(' ')[0]}! 🚚
                </h1>
                <p className="text-gray-600 flex items-center">
                  <Badge className={`${deliveryStatus.color} text-white mr-2`}>
                    {deliveryStatus.status}
                  </Badge>
                  Delivery Expert since {new Date(user.createdAt).getFullYear()}
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-md bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Active Deliveries</p>
                  <p className="text-3xl font-bold">{activeDeliveries}</p>
                </div>
                <Truck className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed Today</p>
                  <p className="text-3xl font-bold">{completedToday}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Today's Earnings</p>
                  <p className="text-3xl font-bold">${totalEarnings.toFixed(2)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Avg Time</p>
                  <p className="text-3xl font-bold">{averageDeliveryTime}m</p>
                </div>
                <Timer className="h-10 w-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delivery Status */}
        <Card className="mb-8 border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <deliveryStatus.icon className="h-5 w-5 text-blue-500" />
              <span>Delivery Status</span>
            </CardTitle>
            <CardDescription>Current delivery operations overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Pending Pickups</h3>
                <p className="text-2xl font-bold text-yellow-600">{pendingDeliveries}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">In Transit</h3>
                <p className="text-2xl font-bold text-blue-600">{activeDeliveries}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Completed Today</h3>
                <p className="text-2xl font-bold text-green-600">{completedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button asChild className="h-24 flex-col space-y-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white border-none shadow-md">
            <Link to="/delivery/map">
              <MapPin className="h-8 w-8" />
              <span className="font-semibold">Live Map</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-24 flex-col space-y-2 border-2 hover:bg-blue-50">
            <Link to="/delivery/deliveries">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="font-semibold text-blue-600">Deliveries</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-24 flex-col space-y-2 border-2 hover:bg-green-50">
            <Link to="/delivery/schedule">
              <Calendar className="h-8 w-8 text-green-600" />
              <span className="font-semibold text-green-600">Schedule</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-24 flex-col space-y-2 border-2 hover:bg-purple-50">
            <Link to="/delivery/profile">
              <Users className="h-8 w-8 text-purple-600" />
              <span className="font-semibold text-purple-600">Profile</span>
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Deliveries */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>Recent Deliveries</span>
                </CardTitle>
                <CardDescription>Your latest delivery assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {recentDeliveries.length === 0 ? (
                  <div className="text-center py-12">
                    <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No deliveries yet</h3>
                    <p className="text-gray-500 mb-6">You're ready for new delivery assignments!</p>
                    <Button asChild className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                      <Link to="/delivery/map">View Map</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentDeliveries.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
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
                            <p className="text-lg font-bold text-gray-900 mt-1">${order.delivery_fee || 5}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4 text-blue-500" />
                              <span>2.3 km away</span>
                            </span>
                            {order.status === 'out_for_delivery' && (
                              <span className="flex items-center space-x-1">
                                <Navigation className="h-4 w-4 text-green-500" />
                                <span>En route</span>
                              </span>
                            )}
                            {order.status === 'delivered' && (
                              <span className="flex items-center space-x-1">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Delivered</span>
                              </span>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {deliveryOrders.length > 5 && (
                      <Button asChild variant="outline" className="w-full mt-4">
                        <Link to="/delivery/deliveries">View All Deliveries</Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Delivery Stats & Profile Sidebar */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Customer Rating</span>
                    <span className="text-sm font-semibold">{customerRating}/5.0</span>
                  </div>
                  <Progress value={customerRating * 20} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Delivery Time</span>
                    <span className="text-sm font-semibold">{averageDeliveryTime} min</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-sm font-semibold">98%</span>
                  </div>
                  <Progress value={98} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Profile Card */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Driver Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-16 w-16 ring-2 ring-blue-500/20">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-blue-500 text-white font-bold text-xl">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">Delivery Expert</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Vehicle: Honda Civic</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Star className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Rating: {customerRating}/5.0</span>
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
                  <Link to="/delivery/profile">
                    <Users className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Route Optimization */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Route className="h-5 w-5 text-green-600" />
                  <span>Route Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Navigation className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-blue-600">Distance</p>
                    <p className="text-xs text-blue-600">12.5 km</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Timer className="h-6 w-6 text-green-500 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-green-600">ETA</p>
                    <p className="text-xs text-green-600">25 min</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Route className="h-4 w-4 mr-2" />
                    Optimize Route
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <MapPin className="h-4 w-4 mr-2" />
                    View Traffic
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-none shadow-md bg-gradient-to-r from-blue-400 to-green-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="secondary" size="sm" className="w-full bg-white text-blue-600 hover:bg-blue-50">
                  <Truck className="h-4 w-4 mr-2" />
                  Start Delivery
                </Button>
                <Button variant="secondary" size="sm" className="w-full bg-white text-blue-600 hover:bg-blue-50">
                  <Clock className="h-4 w-4 mr-2" />
                  Take Break
                </Button>
                <Button variant="secondary" size="sm" className="w-full bg-white text-blue-600 hover:bg-blue-50">
                  <Bell className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;