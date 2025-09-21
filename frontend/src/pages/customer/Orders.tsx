import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/userStore';
import { useOrderStore } from '@/store/orderStore';
import { Package, Clock, CheckCircle, XCircle, Home, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerOrders: React.FC = () => {
  const { user } = useUserStore();
  const { orders, getOrdersByCustomer } = useOrderStore();
  const navigate = useNavigate();

  // Get customer's orders
  const customerOrders = user ? getOrdersByCustomer(user.user_id) : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'preparing':
      case 'ready':
      case 'out_for_delivery':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track all your food orders</p>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {customerOrders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-500 mb-4">Start ordering delicious food to see your order history here.</p>
                <a href="/menu" className="text-primary hover:text-primary-dark font-medium">
                  Browse Menu →
                </a>
              </CardContent>
            </Card>
          ) : (
            customerOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span>Order #{order.id.slice(-6)}</span>
                      </CardTitle>
                      <CardDescription>
                        Placed on {new Date(order.created_at).toLocaleDateString()} at{' '}
                        {new Date(order.created_at).toLocaleTimeString()}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(order.status)}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">{item.quantity}</span>
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.special_instructions && (
                              <p className="text-sm text-gray-500">
                                Note: {item.special_instructions}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Delivery Address:</span>
                      <span className="text-gray-600">{order.delivery_address}</span>
                    </div>
                    {order.delivery_instructions && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Delivery Instructions:</span>
                        <span className="text-gray-600">{order.delivery_instructions}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-lg font-bold">${order.total_amount}</span>
                    </div>
                  </div>

                  {/* Order Timeline */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-3">Order Timeline</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">
                          Order placed - {new Date(order.created_at).toLocaleString()}
                        </span>
                      </div>
                      {order.status !== 'pending' && (
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">
                            Order confirmed - {new Date(order.updated_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {['preparing', 'ready', 'out_for_delivery', 'delivered'].includes(order.status) && (
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">
                            Order in preparation
                          </span>
                        </div>
                      )}
                      {['ready', 'out_for_delivery', 'delivered'].includes(order.status) && (
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">
                            Order ready for pickup
                          </span>
                        </div>
                      )}
                      {['out_for_delivery', 'delivered'].includes(order.status) && (
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">
                            Out for delivery
                          </span>
                        </div>
                      )}
                      {order.status === 'delivered' && (
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">
                            Order delivered
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerOrders;

