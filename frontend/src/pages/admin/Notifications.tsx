import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUserStore } from '@/store/userStore';
import { Bell, Send, Users, Package, AlertTriangle, CheckCircle } from 'lucide-react';

const AdminNotifications: React.FC = () => {
  const { user } = useUserStore();

  if (!user) {
    return <div>Loading...</div>;
  }

  // Mock notification data
  const notifications = [
    {
      id: 1,
      type: 'order',
      title: 'New Order Received',
      message: 'Order #123456 has been placed by John Customer',
      timestamp: '2024-01-20T10:30:00Z',
      read: false
    },
    {
      id: 2,
      type: 'system',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight at 2 AM',
      timestamp: '2024-01-20T09:00:00Z',
      read: true
    },
    {
      id: 3,
      type: 'user',
      title: 'New User Registration',
      message: 'Chef Maria has registered as a cook',
      timestamp: '2024-01-20T08:45:00Z',
      read: false
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'system':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'user':
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-50 border-blue-200';
      case 'system':
        return 'bg-yellow-50 border-yellow-200';
      case 'user':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">Send and manage platform notifications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Send Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Send Notification</span>
              </CardTitle>
              <CardDescription>Send notifications to users or groups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notification-type">Notification Type</Label>
                <select 
                  id="notification-type" 
                  className="w-full mt-2 p-2 border rounded-md"
                  defaultValue="all"
                >
                  <option value="all">All Users</option>
                  <option value="customers">Customers Only</option>
                  <option value="cooks">Cooks Only</option>
                  <option value="delivery_agents">Delivery Agents Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </div>

              <div>
                <Label htmlFor="notification-title">Title</Label>
                <Input 
                  id="notification-title" 
                  placeholder="Enter notification title"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="notification-message">Message</Label>
                <Textarea 
                  id="notification-message" 
                  placeholder="Enter notification message"
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="urgent" className="rounded" />
                <Label htmlFor="urgent">Mark as urgent</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="email" className="rounded" defaultChecked />
                <Label htmlFor="email">Send via email</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="sms" className="rounded" />
                <Label htmlFor="sms">Send via SMS</Label>
              </div>

              <Button className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </CardContent>
          </Card>

          {/* Notification Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Quick Templates</span>
              </CardTitle>
              <CardDescription>Pre-defined notification templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                New Order Alert
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="h-4 w-4 mr-2" />
                System Maintenance
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="h-4 w-4 mr-2" />
                Order Delivered
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Welcome Message
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Bell className="h-4 w-4 mr-2" />
                Promotional Offer
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Notifications */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Notifications sent in the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No notifications sent yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border rounded-lg ${getNotificationColor(notification.type)} ${
                        !notification.read ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type)}
                          <div>
                            <h4 className="font-medium">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                          <Button size="sm" variant="outline">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Read
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;






