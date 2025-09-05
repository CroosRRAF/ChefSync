import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/userStore';
import { useOrderStore } from '@/store/orderStore';
import { Truck, MapPin, Clock, CheckCircle } from 'lucide-react';

const DeliveryDeliveries: React.FC = () => {
  const { user } = useUserStore();
  const { orders, getOrdersByDeliveryAgent } = useOrderStore();

  // Get delivery agent's assigned orders
  const deliveryOrders = user ? getOrdersByDeliveryAgent(user.user_id) : [];

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Deliveries</h1>
          <p className="text-gray-600 mt-2">Track all your delivery assignments</p>
        </div>

        {/* Deliveries List */}
        <div className="space-y-6">
          {deliveryOrders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries yet</h3>
                <p className="text-gray-500">You haven't been assigned any deliveries yet.</p>
              </CardContent>
            </Card>
          ) : (
            deliveryOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Truck className="h-5 w-5 text-primary" />
                        <span>Delivery #{order.id.slice(-6)}</span>
                      </CardTitle>
                      <CardDescription>
                        Assigned on {new Date(order.updated_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={
                      order.status === 'delivered' ? 'default' : 'secondary'
                    }>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Order Details */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Customer Information</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Name:</span> {order.customer_name}</p>
                          <p><span className="font-medium">Order Total:</span> ${order.total_amount}</p>
                          <p><span className="font-medium">Items:</span> {order.items.length} items</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Delivery Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                            <p>{order.delivery_address}</p>
                          </div>
                          {order.delivery_instructions && (
                            <p><span className="font-medium">Instructions:</span> {order.delivery_instructions}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium mb-2">Order Items</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">{item.quantity}</span>
                              </div>
                              <span className="text-sm">{item.name}</span>
                            </div>
                            <span className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Actions */}
                    {order.status === 'out_for_delivery' && (
                      <div className="pt-4 border-t">
                        <div className="flex space-x-3">
                          <Button className="flex-1">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Delivered
                          </Button>
                          <Button variant="outline" className="flex-1">
                            <MapPin className="h-4 w-4 mr-2" />
                            View on Map
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Delivery Timeline */}
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Delivery Timeline</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">
                            Order assigned to you - {new Date(order.updated_at).toLocaleString()}
                          </span>
                        </div>
                        {order.status === 'delivered' && (
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">
                              Delivery completed
                            </span>
                          </div>
                        )}
                      </div>
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

export default DeliveryDeliveries;

