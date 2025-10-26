import React, { useState, useEffect } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  Package, 
  CheckCircle, 
  X, 
  Trash2, 
  CheckCheck 
} from 'lucide-react';
import { notificationService, Notification } from '@/services/notificationService';
import { openOrderTracking } from '@/components/tracking/OrderTrackingWrapper';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getRecentNotifications();
      
      // Parse notifications to extract order info
      const parsedNotifications = data.results.map(notification => 
        notificationService.parseNotification(notification)
      );
      
      setNotifications(parsedNotifications);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when dropdown opens
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Refresh when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (notification.status === 'Unread') {
      await notificationService.markAsRead(notification.notification_id);
      fetchNotifications(); // Refresh to update UI
    }

    // If it's an order notification, try to open order tracking
    if (notification.order_id || notification.message.toLowerCase().includes('order')) {
      // Try to extract order ID from notification
      let orderId = notification.order_id;
      
      // If no order_id in notification, try to extract from message
      if (!orderId) {
        const orderMatch = notification.message.match(/\(ID:\s*(\d+)\)/i);
        if (orderMatch) {
          orderId = parseInt(orderMatch[1]);
        }
      }

      if (orderId) {
        // Close dropdown
        setIsOpen(false);
        
        // Open order tracking popup
        openOrderTracking(orderId);
      }
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await notificationService.markAllAsRead();
    
    if (success) {
      fetchNotifications();
    }
  };

  // Clear all notifications
  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      const success = await notificationService.clearAll();
      
      if (success) {
        fetchNotifications();
      }
    }
  };

  // Get notification icon based on content
  const getNotificationIcon = (notification: Notification) => {
    if (notification.message.toLowerCase().includes('order')) {
      return <Package className="h-4 w-4 text-orange-500" />;
    }
    if (notification.message.toLowerCase().includes('delivered')) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Bell className="h-4 w-4 text-blue-500" />;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative hover:bg-white/20 transition-all duration-200",
            className
          )}
        >
          <Bell className={cn("h-5 w-5", className ? className : "text-gray-600 dark:text-gray-400")} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse font-semibold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 max-h-[500px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-base font-semibold">Notifications</span>
          <div className="flex items-center space-x-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-7 px-2 text-xs hover:bg-green-50"
                title="Mark all as read"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-7 px-2 text-xs hover:bg-red-50"
                title="Clear all"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="py-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs text-gray-400">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.notification_id}
                className={cn(
                  "cursor-pointer p-3 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                  notification.status === 'Unread' && "bg-orange-50/50 dark:bg-orange-900/10"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className={cn(
                      "text-sm font-medium text-gray-900 dark:text-white",
                      notification.status === 'Unread' && "font-semibold"
                    )}>
                      {notification.subject}
                    </p>
                    {notification.status === 'Unread' && (
                      <Badge className="ml-2 h-2 w-2 rounded-full bg-orange-500 p-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {notification.time_ago || new Date(notification.time).toLocaleString()}
                  </p>
                  {notification.order_number && (
                    <Badge 
                      variant="outline" 
                      className="mt-2 text-xs bg-blue-50 border-blue-200 text-blue-700"
                    >
                      <Package className="h-3 w-3 mr-1" />
                      {notification.order_number}
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-center text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 cursor-pointer justify-center font-medium"
              onClick={() => {
                setIsOpen(false);
                navigate('/customer/notifications');
              }}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
