import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/store/userStore';
import { useOrderStore } from '@/store/orderStore';
import { MapPin, Navigation, Truck, Clock, CheckCircle } from 'lucide-react';

const DeliveryMap: React.FC = () => {
  const { user } = useUserStore();
  const { orders, getOrdersByDeliveryAgent } = useOrderStore();

  // Get delivery agent's assigned orders
  const deliveryOrders = user ? getOrdersByDeliveryAgent(user.user_id) : [];

  if (!user) {
    return <div>Loading...</div>;
  }

  // Mock map data - in real app this would be an actual map component
  const mockDeliveries = [
    {
      id: '1',
      orderId: '123456',
      customerName: 'John Customer',
      address: '123 Main St, Downtown',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      status: 'out_for_delivery',
      estimatedTime: '15 min',
      distance: '2.3 km'
    },
    {
      id: '2',
      orderId: '123457',
      customerName: 'Jane Smith',
      address: '456 Oak Ave, West Side',
      coordinates: { lat: 40.7589, lng: -73.9851 },
      status: 'pending',
      estimatedTime: '25 min',
      distance: '4.1 km'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Delivery Map</h1>
          <p className="text-gray-600 mt-2">Track your deliveries and optimize routes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map View */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Live Map</span>
                </CardTitle>
                <CardDescription>Real-time delivery tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">Interactive Map Component</p>
                    <p className="text-sm text-gray-400">
                      This would integrate with Google Maps, Mapbox, or similar service
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Your Location</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Delivery Points</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Completed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delivery List */}
          <div className="space-y-6">
            {/* Current Location */}
            <Card>
              <CardHeader>
                <CardTitle>Your Location</CardTitle>
                <CardDescription>Current position and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Downtown Area</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Last updated: 2 min ago</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Available for delivery</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Deliveries */}
            <Card>
              <CardHeader>
                <CardTitle>Active Deliveries</CardTitle>
                <CardDescription>Orders currently being delivered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockDeliveries.filter(d => d.status === 'out_for_delivery').length === 0 ? (
                    <div className="text-center py-4">
                      <Truck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No active deliveries</p>
                    </div>
                  ) : (
                    mockDeliveries
                      .filter(d => d.status === 'out_for_delivery')
                      .map((delivery) => (
                      <div key={delivery.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">#{delivery.orderId}</span>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{delivery.customerName}</p>
                        <p className="text-xs text-gray-500 mb-2">{delivery.address}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{delivery.distance}</span>
                          <span>{delivery.estimatedTime}</span>
                        </div>
                        <div className="mt-3 space-y-2">
                          <Button size="sm" className="w-full">
                            <Navigation className="h-3 w-3 mr-1" />
                            Navigate
                          </Button>
                          <Button size="sm" variant="outline" className="w-full">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Delivered
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pending Deliveries */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Deliveries</CardTitle>
                <CardDescription>Orders waiting to be picked up</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockDeliveries.filter(d => d.status === 'pending').length === 0 ? (
                    <div className="text-center py-4">
                      <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No pending deliveries</p>
                    </div>
                  ) : (
                    mockDeliveries
                      .filter(d => d.status === 'pending')
                      .map((delivery) => (
                      <div key={delivery.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">#{delivery.orderId}</span>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{delivery.customerName}</p>
                        <p className="text-xs text-gray-500 mb-2">{delivery.address}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{delivery.distance}</span>
                          <span>{delivery.estimatedTime}</span>
                        </div>
                        <div className="mt-3">
                          <Button size="sm" variant="outline" className="w-full">
                            <MapPin className="h-3 w-3 mr-1" />
                            View on Map
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Route Optimization */}
            <Card>
              <CardHeader>
                <CardTitle>Route Optimization</CardTitle>
                <CardDescription>Optimize your delivery route</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Navigation className="h-4 w-4 mr-2" />
                  Optimize Route
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Calculate ETA
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="h-4 w-4 mr-2" />
                  Show Traffic
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMap;






