import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/store/userStore';
import { useOrderStore } from '@/store/orderStore';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Clock, 
  MapPin, 
  Star, 
  Package, 
  User,
  Settings,
  LogOut
} from 'lucide-react';

const CustomerDashboard: React.FC = () => {
  const { user, logout } = useUserStore();
  const { orders, getOrdersByCustomer } = useOrderStore();

  // Get customer's orders
  const customerOrders = user ? getOrdersByCustomer(user.user_id) : [];
  
  // Calculate statistics
  const totalOrders = customerOrders.length;
  const pendingOrders = customerOrders.filter(order => 
    ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status)
  ).length;
  const completedOrders = customerOrders.filter(order => order.status === 'delivered').length;

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Profile */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}! 👋</h1>
              <p className="text-gray-600 mt-2">Here's what's happening with your orders today</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500 capitalize">{user.role}</p>
              </div>
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                All time orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                Currently processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedOrders}</div>
              <p className="text-xs text-muted-foreground">
                Successfully delivered
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button asChild className="h-20 flex-col">
            <Link to="/menu">
              <ShoppingCart className="h-6 w-6 mb-2" />
              <span>Order Food</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-20 flex-col">
            <Link to="/customer/orders">
              <Package className="h-6 w-6 mb-2" />
              <span>My Orders</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-20 flex-col">
            <Link to="/profile">
              <User className="h-6 w-6 mb-2" />
              <span>Profile</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-20 flex-col">
            <Link to="/settings">
              <Settings className="h-6 w-6 mb-2" />
              <span>Settings</span>
            </Link>
          </Button>
        </div>

        {/* Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your latest food orders</CardDescription>
            </CardHeader>
            <CardContent>
              {customerOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                  <Button asChild className="mt-4">
                    <Link to="/menu">Start Ordering</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Order #{order.id.slice(-6)}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          order.status === 'delivered' ? 'default' :
                          order.status === 'cancelled' ? 'destructive' : 'secondary'
                        }>
                          {order.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm font-medium mt-1">${order.total_amount}</p>
                      </div>
                    </div>
                  ))}
                  {customerOrders.length > 5 && (
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/customer/orders">View All Orders</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">Role:</span>
                    <Badge variant="default" className="capitalize">{user.role}</Badge>
                  </div>

                  {user.phone_no && (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">Phone:</span>
                      <span className="text-sm text-gray-500">{user.phone_no}</span>
                    </div>
                  )}

                  {user.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">Address:</span>
                      <span className="text-sm text-gray-500">{user.address}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">Member Since:</span>
                    <span className="text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/customer/profile">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;

