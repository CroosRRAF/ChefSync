import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Package, 
  CheckCircle, 
  Trash2, 
  CheckCheck,
  Loader2,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { notificationService, Notification } from '@/services/notificationService';
import { openOrderTracking } from '@/components/tracking/OrderTrackingWrapper';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const CustomerNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(100);
      
      // Parse notifications to extract order info
      const parsedNotifications = data.results.map(notification => 
        notificationService.parseNotification(notification)
      );
      
      setNotifications(parsedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (notification.status === 'Unread') {
      await notificationService.markAsRead(notification.notification_id);
      fetchNotifications();
    }

    // If it's an order notification, try to open order tracking
    if (notification.order_id || notification.message.toLowerCase().includes('order')) {
      let orderId = notification.order_id;
      
      if (!orderId) {
        const orderMatch = notification.message.match(/\(ID:\s*(\d+)\)/i);
        if (orderMatch) {
          orderId = parseInt(orderMatch[1]);
        }
      }

      if (orderId) {
        openOrderTracking(orderId);
      }
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const success = await notificationService.markAllAsRead();
    if (success) {
      fetchNotifications();
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      const success = await notificationService.clearAll();
      if (success) {
        fetchNotifications();
      }
    }
  };

  // Delete single notification
  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    // For now, just mark as read - you can implement delete later
    await notificationService.markAsRead(notificationId);
    fetchNotifications();
  };

  // Get notification icon
  const getNotificationIcon = (notification: Notification) => {
    if (notification.message.toLowerCase().includes('order')) {
      return <Package className="h-5 w-5 text-orange-500" />;
    }
    if (notification.message.toLowerCase().includes('delivered')) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <Bell className="h-5 w-5 text-blue-500" />;
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return notification.status === 'Unread';
    if (activeTab === 'read') return notification.status === 'Read';
    return true;
  });

  const unreadCount = notifications.filter(n => n.status === 'Unread').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/customer/dashboard')}
            className="mb-4 hover:bg-orange-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Notifications
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Stay updated with your order status and important updates
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleMarkAllAsRead}
                  className="hover:bg-green-50"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  className="hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="read" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Read ({notifications.length - unreadCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-16 text-center">
                <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No notifications
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {activeTab === 'unread' 
                    ? "You don't have any unread notifications"
                    : activeTab === 'read'
                    ? "You don't have any read notifications"
                    : "You're all caught up!"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.notification_id}
                      className={cn(
                        "p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group",
                        notification.status === 'Unread' && "bg-orange-50/50 dark:bg-orange-900/10"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className={cn(
                              "text-base font-medium text-gray-900 dark:text-white",
                              notification.status === 'Unread' && "font-semibold"
                            )}>
                              {notification.subject}
                            </h3>
                            {notification.status === 'Unread' && (
                              <Badge className="ml-2 h-2 w-2 rounded-full bg-orange-500 p-0" />
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {notification.time_ago || new Date(notification.time).toLocaleString()}
                              </span>
                              {notification.order_number && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs bg-blue-50 border-blue-200 text-blue-700"
                                >
                                  <Package className="h-3 w-3 mr-1" />
                                  {notification.order_number}
                                </Badge>
                              )}
                            </div>

                            {/* Delete button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteNotification(e, notification.notification_id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerNotifications;

