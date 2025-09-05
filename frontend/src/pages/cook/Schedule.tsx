import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/store/userStore';
import { useOrderStore } from '@/store/orderStore';
import { Calendar, Clock, ChefHat, CheckCircle } from 'lucide-react';

const CookSchedule: React.FC = () => {
  const { user } = useUserStore();
  const { orders, getOrdersByCook } = useOrderStore();

  // Get cook's assigned orders
  const cookOrders = user ? getOrdersByCook(user.user_id) : [];

  if (!user) {
    return <div>Loading...</div>;
  }

  // Mock schedule data
  const scheduleData = [
    {
      time: '09:00 AM',
      type: 'shift_start',
      title: 'Kitchen Shift Start',
      description: 'Begin daily kitchen operations',
      status: 'completed'
    },
    {
      time: '10:30 AM',
      type: 'order',
      title: 'Order #123456',
      description: 'Prepare 2x Margherita Pizza, 1x Pasta Carbonara',
      status: 'in_progress'
    },
    {
      time: '11:15 AM',
      type: 'order',
      title: 'Order #123457',
      description: 'Prepare 1x Chicken Burger, 2x French Fries',
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
      type: 'order',
      title: 'Order #123458',
      description: 'Prepare 3x Caesar Salad, 1x Grilled Salmon',
      status: 'pending'
    },
    {
      time: '05:00 PM',
      type: 'shift_end',
      title: 'Kitchen Shift End',
      description: 'Complete kitchen cleanup',
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
        return <ChefHat className="h-4 w-4 text-blue-500" />;
      case 'order':
        return <Calendar className="h-4 w-4 text-green-500" />;
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
          <h1 className="text-3xl font-bold text-gray-900">Kitchen Schedule</h1>
          <p className="text-gray-600 mt-2">Manage your daily kitchen schedule and orders</p>
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
                <CardDescription>Your kitchen timeline for today</CardDescription>
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
                      {item.type === 'order' && item.status === 'pending' && (
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
                <CardDescription>Your kitchen performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Orders Completed</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Orders Pending</span>
                  <span className="font-medium text-orange-600">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Time</span>
                  <span className="font-medium">25 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Efficiency</span>
                  <span className="font-medium text-green-600">92%</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common kitchen tasks</CardDescription>
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
                  <ChefHat className="h-4 w-4 mr-2" />
                  Request Help
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Orders</CardTitle>
                <CardDescription>Orders in your queue</CardDescription>
              </CardHeader>
              <CardContent>
                {cookOrders.filter(order => ['pending', 'confirmed'].includes(order.status)).length === 0 ? (
                  <div className="text-center py-4">
                    <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No upcoming orders</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cookOrders
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
                          {order.items.length} items • ${order.total_amount}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookSchedule;








