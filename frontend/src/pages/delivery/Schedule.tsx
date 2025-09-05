import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/store/userStore';
import { useOrderStore } from '@/store/orderStore';
import { Calendar, Clock, Truck, CheckCircle, MapPin } from 'lucide-react';

const DeliverySchedule: React.FC = () => {
  const { user } = useUserStore();
  const { orders, getOrdersByDeliveryAgent } = useOrderStore();

  // Get delivery agent's assigned orders
  const deliveryOrders = user ? getOrdersByDeliveryAgent(user.user_id) : [];

  if (!user) {
    return <div>Loading...</div>;
  }

  // Mock schedule data
  const scheduleData = [
    {
      time: '09:00 AM',
      type: 'shift_start',
      title: 'Delivery Shift Start',
      description: 'Begin daily delivery operations',
      status: 'completed'
    },
    {
      time: '10:30 AM',
      type: 'delivery',
      title: 'Delivery #123456',
      description: 'Deliver to John Customer - Downtown',
      status: 'in_progress'
    },
    {
      time: '11:15 AM',
      type: 'delivery',
      title: 'Delivery #123457',
      description: 'Deliver to Jane Smith - West Side',
      status: 'pending'
    },
    {
      time: '12:00 PM',
      type: 'break',
      title: 'Lunch Break',
      description: '30-minute break',
      status: 'upcoming'
    },
    {
      time: '02:00 PM',
      type: 'delivery',
      title: 'Delivery #123458',
      description: 'Deliver to Mike Johnson - East Side',
      status: 'pending'
    },
    {
      time: '05:00 PM',
      type: 'shift_end',
      title: 'Delivery Shift End',
      description: 'Complete delivery operations',
      status: 'upcoming'
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      in_progress: 'secondary',
      pending: 'outline',
      upcoming: 'outline'
    };
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
      {status.replace('_', ' ')}
    </Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'shift_start':
      case 'shift_end':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'delivery':
        return <MapPin className="h-4 w-4 text-green-500" />;
      case 'break':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Delivery Schedule</h1>
          <p className="text-gray-600 mt-2">Manage your daily delivery schedule and routes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Today's Schedule</span>
                </CardTitle>
                <CardDescription>Your delivery timeline for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduleData.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          {getTypeIcon(item.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{item.title}</h4>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-500">{item.time}</span>
                        </div>
                      </div>
                      {item.type === 'delivery' && item.status === 'pending' && (
                        <Button size="sm">
                          Start
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Stats */}
          <div className="space-y-6">
            {/* Today's Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Summary</CardTitle>
                <CardDescription>Your delivery performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Deliveries Completed</span>
                  <span className="font-medium">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Deliveries Pending</span>
                  <span className="font-medium text-orange-600">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Time</span>
                  <span className="font-medium">18 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Efficiency</span>
                  <span className="font-medium text-green-600">95%</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common delivery tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Break
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Extend Shift
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Truck className="h-4 w-4 mr-2" />
                  Request Help
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Deliveries */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deliveries</CardTitle>
                <CardDescription>Deliveries in your queue</CardDescription>
              </CardHeader>
              <CardContent>
                {deliveryOrders.filter(order => ['pending', 'confirmed'].includes(order.status)).length === 0 ? (
                  <div className="text-center py-4">
                    <Truck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No upcoming deliveries</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deliveryOrders
                      .filter(order => ['pending', 'confirmed'].includes(order.status))
                      .slice(0, 3)
                      .map((order) => (
                      <div key={order.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">#{order.id.slice(-6)}</span>
                          <Badge variant="outline" className="text-xs">
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">
                          {order.customer_name} • {order.delivery_address}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Route Information */}
            <Card>
              <CardHeader>
                <CardTitle>Route Information</CardTitle>
                <CardDescription>Current route details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Distance</span>
                  <span className="font-medium">12.5 km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estimated Time</span>
                  <span className="font-medium">45 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Fuel Cost</span>
                  <span className="font-medium">$8.50</span>
                </div>
                <Button variant="outline" className="w-full">
                  <MapPin className="h-4 w-4 mr-2" />
                  View Route
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliverySchedule;






