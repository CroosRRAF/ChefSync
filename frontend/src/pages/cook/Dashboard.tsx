import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/store/userStore';
import { useOrderStore } from '@/store/orderStore';
import { Link } from 'react-router-dom';
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  LogOut,
  Package
} from 'lucide-react';

const CookDashboard: React.FC = () => {
  const { user, logout } = useUserStore();
  const { orders, getOrdersByCook } = useOrderStore();

  // Get cook's assigned orders
  const cookOrders = user ? getOrdersByCook(user.user_id) : [];
  
  // Calculate statistics
  const totalOrders = cookOrders.length;
  const pendingOrders = cookOrders.filter(order => 
    ['pending', 'confirmed'].includes(order.status)
  ).length;
  const preparingOrders = cookOrders.filter(order => order.status === 'preparing').length;
  const readyOrders = cookOrders.filter(order => order.status === 'ready').length;

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
              <h1 className="text-3xl font-bold text-gray-900">Kitchen Dashboard 👨‍🍳</h1>
              <p className="text-gray-600 mt-2">Manage your cooking orders and kitchen operations</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Assigned to you
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting start
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preparing</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{preparingOrders}</div>
              <p className="text-xs text-muted-foreground">
                Currently cooking
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{readyOrders}</div>
              <p className="text-xs text-muted-foreground">
                Ready for pickup
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button asChild className="h-20 flex-col">
                         <Link to="/cook/kitchen">
               <ChefHat className="h-6 w-6 mb-2" />
               <span>Kitchen View</span>
             </Link>
          </Button>

          <Button asChild variant="outline" className="h-20 flex-col">
            <Link to="/cook/orders">
              <Package className="h-6 w-6 mb-2" />
              <span>All Orders</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-20 flex-col">
            <Link to="/cook/schedule">
              <Clock className="h-6 w-6 mb-2" />
              <span>Schedule</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-20 flex-col">
            <Link to="/cook/settings">
              <Settings className="h-6 w-6 mb-2" />
              <span>Settings</span>
            </Link>
          </Button>
        </div>

        {/* Current Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Current Orders</CardTitle>
              <CardDescription>Orders you're currently working on</CardDescription>
            </CardHeader>
            <CardContent>
              {cookOrders.filter(order => ['preparing', 'ready'].includes(order.status)).length === 0 ? (
                <div className="text-center py-8">
                  <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active orders</p>
                  <Button asChild className="mt-4">
                    <Link to="/cook/kitchen">Check Kitchen</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cookOrders
                    .filter(order => ['preparing', 'ready'].includes(order.status))
                    .slice(0, 5)
                    .map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Order #{order.id.slice(-6)}</p>
                          <p className="text-sm text-gray-500">
                            {order.customer_name} • {order.items.length} items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          order.status === 'ready' ? 'default' : 'secondary'
                        }>
                          {order.status}
                        </Badge>
                        <p className="text-sm font-medium mt-1">${order.total_amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kitchen Status and Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Kitchen Status & Profile</CardTitle>
              <CardDescription>Your current kitchen operations and profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Profile Section */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Kitchen Active</p>
                      <p className="text-sm text-green-600">Ready to cook</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button asChild className="w-full">
                    <Link to="/cook/kitchen">
                      <ChefHat className="h-4 w-4 mr-2" />
                      Go to Kitchen
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="w-full">
                    <Link to="/cook/orders">
                      <Package className="h-4 w-4 mr-2" />
                      View All Orders
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="w-full">
                    <Link to="/cook/profile">
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

export default CookDashboard;
