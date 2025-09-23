import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

interface OrderNotification {
  id: string;
  type: 'new_order' | 'status_change' | 'assignment' | 'bulk_operation';
  title: string;
  message: string;
  order_id?: number;
  order_number?: string;
  timestamp: string;
  read: boolean;
}

interface UseOrderNotificationsReturn {
  notifications: OrderNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  isPolling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
}

// Custom hook for order notifications
export const useOrderNotifications = (
  pollingInterval: number = 30000, // 30 seconds
  autoStart: boolean = true
): UseOrderNotificationsReturn => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<string>(new Date().toISOString());

  // Poll for new notifications
  const pollNotifications = useCallback(async () => {
    try {
      // Only check for new orders, don't fetch stats to reduce API calls
      const newOrdersResponse = await axios.get(
        `/api/orders/chef/dashboard/?created_at__gte=${lastCheckRef.current}`
      );
      
      const newOrders = Array.isArray(newOrdersResponse.data) ? newOrdersResponse.data : 
                       (newOrdersResponse.data?.results || []);
      
      // Only process if there are actually new orders
      if (Array.isArray(newOrders) && newOrders.length > 0) {
        // Create notifications for new orders
        const newNotifications: OrderNotification[] = newOrders.map((order: any) => ({
          id: `new-order-${order.id}-${Date.now()}`,
          type: 'new_order' as const,
          title: 'New Order Received',
          message: `Order #${order.order_number} from ${order.customer_name}`,
          order_id: order.id,
          order_number: order.order_number,
          timestamp: order.created_at,
          read: false
        }));
        
        setNotifications(prev => [...newNotifications, ...prev].slice(0, 50)); // Keep last 50 notifications
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          newNotifications.forEach(notification => {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon-delivery.ico',
              tag: notification.id
            });
          });
        }
      }
      
      lastCheckRef.current = new Date().toISOString();
    } catch (error) {
      console.error('Error polling notifications:', error);
      // Don't spam the console on network errors
    }
  }, []);

  // Start polling
  const startPolling = useCallback(() => {
    if (!isPolling && !intervalRef.current) {
      setIsPolling(true);
      // Don't do initial poll to prevent immediate spam
      intervalRef.current = setInterval(pollNotifications, pollingInterval);
    }
  }, [isPolling, pollingInterval, pollNotifications]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Clear notification
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  }, []);

  // Auto-start polling
  useEffect(() => {
    let mounted = true;
    
    if (autoStart && mounted) {
      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      // Delay initial polling to prevent immediate spam
      const timeoutId = setTimeout(() => {
        if (mounted) {
          startPolling();
        }
      }, 1000);
      
      return () => {
        mounted = false;
        clearTimeout(timeoutId);
        stopPolling();
      };
    }
    
    return () => {
      mounted = false;
    };
  }, [autoStart]); // Remove startPolling and stopPolling from deps

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    isPolling,
    startPolling,
    stopPolling
  };
};

// Real-time Order Notifications Component
interface OrderNotificationsProps {
  className?: string;
  maxHeight?: string;
  showUnreadOnly?: boolean;
}

export const OrderNotifications: React.FC<OrderNotificationsProps> = ({
  className = '',
  maxHeight = '400px',
  showUnreadOnly = false
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    isPolling
  } = useOrderNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const displayNotifications = showUnreadOnly 
    ? notifications.filter(n => !n.read)
    : notifications;

  const getNotificationIcon = (type: OrderNotification['type']) => {
    switch (type) {
      case 'new_order': return '🆕';
      case 'status_change': return '🔄';
      case 'assignment': return '👨‍🍳';
      case 'bulk_operation': return '📦';
      default: return '📢';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM7 7h10v6H7V7zm0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7H5a2 2 0 00-2 2v8a2 2 0 002 2h2" />
          </svg>
          
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          
          {/* Polling indicator */}
          {isPolling && (
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          )}
        </div>
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Status indicator */}
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <div className={`w-2 h-2 rounded-full mr-2 ${isPolling ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              {isPolling ? 'Real-time updates active' : 'Updates paused'}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {displayNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {showUnreadOnly ? 'No unread notifications' : 'No notifications'}
              </div>
            ) : (
              displayNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <h4 className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <span className="text-xs text-blue-600 font-medium">New</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {displayNotifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Compact notification badge for showing unread count
export const NotificationBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { unreadCount } = useOrderNotifications();

  if (unreadCount === 0) return null;

  return (
    <span className={`bg-red-500 text-white text-xs rounded-full px-2 py-1 ${className}`}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
};

export default OrderNotifications;