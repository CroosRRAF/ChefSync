import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { notificationService, type Notification } from '@/services/notificationService';
import { toast } from 'sonner';

interface NotificationDropdownProps {
  onNotificationRead?: () => void;
  onClose?: () => void;
}

const NotificationDropdown = ({ onNotificationRead, onClose }: NotificationDropdownProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getRecentNotifications();
      setNotifications(data.results || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      if (notification.is_unread) {
        await notificationService.markAsRead(notification.notification_id);
        onNotificationRead?.();
        
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.notification_id === notification.notification_id
              ? { ...n, status: 'Read', is_unread: false }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Extract order number and navigate
      const orderNumber = notificationService.extractOrderNumber(notification);
      if (orderNumber) {
        // Close dropdown
        onClose?.();
        // Navigate to orders page
        navigate('/customer/orders');
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast.error('Failed to process notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      toast.success('All notifications marked as read');
      onNotificationRead?.();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAll();
      toast.success('All notifications cleared');
      onNotificationRead?.();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const getNotificationStyle = (notification: Notification) => {
    const baseStyle = "p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors";
    return notification.is_unread
      ? `${baseStyle} bg-blue-50/50 dark:bg-blue-950/20 border-l-2 border-l-blue-500`
      : baseStyle;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              title="Mark all as read"
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              title="Clear all"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No notifications yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              We'll notify you when something important happens
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={getNotificationStyle(notification)}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <span className="text-2xl">
                      {notificationService.getNotificationIcon(notification)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className={`text-sm font-medium ${notificationService.getNotificationColor(notification)}`}>
                        {notification.subject}
                      </p>
                      {notification.is_unread && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {notification.time_ago}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                onClose?.();
                navigate('/customer/orders');
              }}
            >
              View all orders
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;

