import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  X,
  MoreHorizontal,
  Settings,
  Filter,
  Archive,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { adminService, type AdminNotification } from '@/services/adminService';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface NotificationCenterProps {
  className?: string;
  maxNotifications?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

type NotificationFilter = 'all' | 'unread' | 'high' | 'medium' | 'low';

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = '',
  maxNotifications = 50,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getNotifications({
        is_active: true
      });
      
      // Handle paginated response
      if (response && typeof response === 'object' && 'results' in response) {
        const notificationsArray = response.results;
        
        if (Array.isArray(notificationsArray)) {
          // Sort by creation date (newest first) and limit to maxNotifications
          const sortedNotifications = [...notificationsArray].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ).slice(0, maxNotifications);
          
          setNotifications(sortedNotifications);
        } else {
          console.error('Results is not an array:', notificationsArray);
          setError('Failed to load notifications: Invalid data format');
          setNotifications([]);
        }
      } else {
        console.error('Unexpected API response format:', response);
        setError('Failed to load notifications: Invalid response format');
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user, maxNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await adminService.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await adminService.markAllNotificationsRead();
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  // Get notification icon
  const getNotificationIcon = (type: string, priority: string, theme: 'light' | 'dark') => {
    const iconClass = "h-4 w-4";
    
    if (priority === 'high') {
      return <AlertTriangle className={iconClass} style={{
        color: theme === 'light' ? '#EF4444' : '#F87171'
      }} />;
    }
    
    switch (type) {
      case 'system':
        return <Settings className={iconClass} style={{
          color: theme === 'light' ? '#3B82F6' : '#60A5FA'
        }} />;
      case 'user':
        return <Info className={iconClass} style={{
          color: theme === 'light' ? '#10B981' : '#34D399'
        }} />;
      case 'order':
        return <CheckCircle className={iconClass} style={{
          color: theme === 'light' ? '#7C3AED' : '#A78BFA'
        }} />;
      case 'error':
        return <XCircle className={iconClass} style={{
          color: theme === 'light' ? '#EF4444' : '#F87171'
        }} />;
      default:
        return <Info className={iconClass} style={{
          color: theme === 'light' ? '#6B7280' : '#9CA3AF'
        }} />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string, theme: 'light' | 'dark') => {
    switch (priority) {
      case 'high':
        return {
          backgroundColor: theme === 'light' ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)',
          color: theme === 'light' ? '#EF4444' : '#F87171'
        };
      case 'medium':
        return {
          backgroundColor: theme === 'light' ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)',
          color: theme === 'light' ? '#FACC15' : '#FCD34D'
        };
      case 'low':
        return {
          backgroundColor: theme === 'light' ? '#ECFDF5' : 'rgba(16, 185, 129, 0.15)',
          color: theme === 'light' ? '#10B981' : '#34D399'
        };
      default:
        return {
          backgroundColor: theme === 'light' ? '#F9FAFB' : 'rgba(107, 114, 128, 0.15)',
          color: theme === 'light' ? '#6B7280' : '#9CA3AF'
        };
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.is_read;
      case 'high':
        return notification.priority === 'high';
      case 'medium':
        return notification.priority === 'medium';
      case 'low':
        return notification.priority === 'low';
      default:
        return true;
    }
  });

  // Get unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh && user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchNotifications, user]);

  // Manual refresh
  const handleRefresh = () => {
    fetchNotifications();
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            {unreadCount > 0 ? (
              <BellRing className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80 p-0">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={markAllAsRead}>
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Mark all as read
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Filter Tabs */}
              <div className="flex space-x-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'unread', label: 'Unread' },
                  { key: 'high', label: 'High' },
                  { key: 'medium', label: 'Medium' },
                  { key: 'low', label: 'Low' }
                ].map((tab) => (
                  <Button
                    key={tab.key}
                    variant={filter === tab.key ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter(tab.key as NotificationFilter)}
                    className="text-xs"
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {error ? (
                <div className="p-4 text-center text-red-500">
                  <div className="text-sm">{error}</div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  {filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div className="text-sm">
                        {filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 border-b hover:opacity-90 transition-colors"
                          style={{
                            borderBottomColor: theme === 'light' ? '#E5E7EB' : '#374151',
                            backgroundColor: !notification.is_read 
                              ? (theme === 'light' ? '#EBF4FF' : 'rgba(59, 130, 246, 0.1)') 
                              : 'transparent'
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.notification_type, notification.priority, theme)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className={`text-sm font-medium ${
                                  !notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {notification.title}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs"
                                    style={getPriorityColor(notification.priority, theme)}
                                  >
                                    {notification.priority}
                                  </Badge>
                                  {!notification.is_read && (
                                    <div className="w-2 h-2 rounded-full" style={{
                                      backgroundColor: theme === 'light' ? '#2563EB' : '#3B82F6'
                                    }}></div>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {notification.time_ago}
                                </span>
                                
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Mark read
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NotificationCenter;
