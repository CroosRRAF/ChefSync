import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Trash2, 
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  Utensils,
  ShoppingCart,
  Users,
  FileCheck,
  RefreshCw
} from "lucide-react";
import { notificationService, type Notification as NotificationResponse } from '@/services/notificationService';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "order" | "bulk_order" | "profile" | "menu";
  timestamp: string;
  read: boolean;
  notification_type?: string;
  order_number?: string;
}

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Convert backend notification to frontend format
  const convertBackendNotification = (backendNotif: NotificationResponse): Notification => {
    // Determine type based on notification content
    let type: Notification['type'] = 'info';
    let notificationType = 'general';
    
    const subject = backendNotif.subject.toLowerCase();
    const message = backendNotif.message.toLowerCase();
    
    // Enhanced type detection for creation and deletion notifications
    if (subject.includes('order') && !subject.includes('bulk')) {
      type = 'order';
      notificationType = 'order';
    } else if (subject.includes('bulk menu') || (subject.includes('bulk') && (subject.includes('menu') || subject.includes('order')))) {
      type = 'bulk_order';
      notificationType = 'bulk_order';
    } else if (
      subject.includes('menu item') || 
      subject.includes('food item') || 
      message.includes('menu item') || 
      message.includes('food item') ||
      subject.includes('🗑️ menu item') ||
      subject.includes('✅ food item') ||
      subject.includes('📝 menu item')
    ) {
      type = 'menu';
      notificationType = 'menu';
    } else if (
      subject.includes('profile updated') ||
      subject.includes('profile update') ||
      message.includes('profile updated') ||
      message.includes('profile update') ||
      subject.startsWith('profile:')
    ) {
      // Only treat as a profile notification when it explicitly mentions a profile update/change
      type = 'profile';
      notificationType = 'profile';
    } else if (subject.includes('error') || subject.includes('failed') || subject.includes('🗑️') || subject.includes('deleted') || subject.includes('removed')) {
      type = subject.includes('🗑️') || subject.includes('deleted') || subject.includes('removed') ? 'warning' : 'error';
    } else if (subject.includes('approved') || subject.includes('confirmed') || subject.includes('accepted') || subject.includes('✅') || subject.includes('created') || subject.includes('added')) {
      type = 'success';
    } else if (subject.includes('warning') || subject.includes('alert')) {
      type = 'warning';
    }
    
    // Override type based on specific notification patterns
    if (subject.includes('🍽️') || subject.includes('bulk menu created')) {
      type = 'bulk_order';
      notificationType = 'bulk_order';
    } else if (subject.includes('📝') || subject.includes('menu item added') || subject.includes('menu item removed')) {
      type = 'menu';
      notificationType = 'menu';
    }

    // Extract order number if present
    const orderMatch = backendNotif.subject.match(/#([A-Z0-9-]+)/);
    const orderNumber = orderMatch ? orderMatch[1] : undefined;

    return {
      id: backendNotif.notification_id.toString(),
      title: backendNotif.subject,
      message: backendNotif.message,
      type,
      timestamp: formatTimestamp(backendNotif.time),
      read: backendNotif.status === 'Read',
      notification_type: notificationType,
      order_number: orderNumber
    };
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timestamp;
    }
  };

  // Load notifications from backend
  const loadNotifications = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await notificationService.getRecentNotifications();
      const backendNotifications = response.results || [];
      
      // Convert backend notifications to frontend format
      const convertedNotifications = backendNotifications.map(convertBackendNotification);
      setNotifications(convertedNotifications);
      
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
      
      // Fallback to mock data if API fails
      setNotifications([
        {
          id: "1",
          title: "New Order Received",
          message: "You have received a new order from John Smith for Truffle Pasta.",
          type: "order",
          timestamp: "2024-01-10 10:30 AM",
          read: false,
          notification_type: "order",
          order_number: "ORD-001"
        },
        {
          id: "2",
          title: "Menu Item Approved",
          message: "Your Chocolate Soufflé has been approved by the admin and is now live.",
          type: "success",
          timestamp: "2024-01-10 09:15 AM",
          read: false,
          notification_type: "menu"
        },
        {
          id: "3",
          title: "Bulk Order Collaboration",
          message: "Chef Maria has accepted your collaboration request for the ABC Corporation event.",
          type: "success",
          timestamp: "2024-01-10 08:45 AM",
          read: true,
          notification_type: "bulk_order"
        },
        {
          id: "4",
          title: "Profile Update Successful",
          message: "Your profile has been updated successfully. Your new specialty cuisine and location are now visible to customers.",
          type: "success",
          timestamp: "2024-01-09 06:30 PM",
          read: false,
          notification_type: "profile"
        }
      ]);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  // Mark notifications as read when visiting the page
  const markNotificationsAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      // Update local state to mark all as read
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    loadNotifications();
    
    // Mark notifications as read after a brief delay to ensure they load first
    const markAsReadTimer = setTimeout(() => {
      markNotificationsAsRead();
    }, 1000);
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadNotifications(false); // Don't show loading spinner for auto-refresh
    }, 30000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(markAsReadTimer);
    };
  }, []);

  // Refresh notifications
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications(false);
    toast.success('Notifications refreshed');
  };

  const filteredNotifications = notifications.filter(notification => {
    // Apply type filter only
    const matchesType = selectedFilter ? notification.type === selectedFilter : true;
    
    return matchesType;
  });

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      // Try to delete from backend first (preferred)
      const deleted = await notificationService.deleteNotification(parseInt(notificationId));
      if (deleted) {
        toast.success('Notification removed');
      } else {
        // Fallback: if server delete failed, try marking it read to reduce noise
        const marked = await notificationService.markAsRead(parseInt(notificationId));
        if (marked) {
          toast('Notification marked as read', { icon: 'ℹ️' });
        } else {
          toast.error('Failed to remove notification');
        }
      }

      // Remove from local state regardless so UI updates immediately
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to remove notification');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Update backend
      await notificationService.markAsRead(parseInt(notificationId));
      
      // Update local state
      setNotifications(notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Still update local state even if backend fails
      setNotifications(notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      ));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="h-4 w-4 text-blue-600" />;
      case "bulk_order":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "menu":
        return <Utensils className="h-4 w-4 text-orange-600" />;
      case "profile":
        return <FileCheck className="h-4 w-4 text-indigo-600" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeBadge = (type: string, title: string = '') => {
    const lowerTitle = title.toLowerCase();
    
    // Determine action type from title for more specific badges
    let actionType = '';
    if (lowerTitle.includes('created') || lowerTitle.includes('added') || lowerTitle.includes('✅')) {
      actionType = ' Added';
    } else if (lowerTitle.includes('deleted') || lowerTitle.includes('removed') || lowerTitle.includes('🗑️')) {
      actionType = ' Deleted';
    } else if (lowerTitle.includes('approved')) {
      actionType = ' Approved';
    } else if (lowerTitle.includes('rejected')) {
      actionType = ' Rejected';
    } else if (lowerTitle.includes('updated') || lowerTitle.includes('changed')) {
      actionType = ' Updated';
    }
    
    switch (type) {
      case "order":
        return <Badge className="bg-blue-100 text-blue-800">New Order</Badge>;
      case "bulk_order":
        return <Badge className="bg-purple-100 text-purple-800">Bulk Menu{actionType}</Badge>;
      case "menu":
        return <Badge className="bg-orange-100 text-orange-800">Menu Item{actionType}</Badge>;
      case "profile":
        return <Badge className="bg-indigo-100 text-indigo-800">Profile{actionType}</Badge>;
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  // Helper functions for filter counts
  const getCountByType = (type: string) => {
    return notifications.filter(n => n.type === type).length;
  };

  const getUnreadCountByType = (type: string) => {
    return notifications.filter(n => n.type === type && !n.read).length;
  };

  const handleFilterByType = (type: string) => {
    setSelectedFilter(selectedFilter === type ? null : type);
  };

  const clearFilter = () => {
    setSelectedFilter(null);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated with your kitchen activities</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="text-center">
            <div className={`text-2xl font-bold relative ${unreadCount > 0 ? 'text-red-600 animate-pulse' : 'text-primary'}`}>
              {unreadCount}
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></div>
              )}
            </div>
            <div className={`text-sm ${unreadCount > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
              {unreadCount > 0 ? 'New Messages!' : 'Unread'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">{totalCount}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>
      </div>

      {/* Notification Types Legend */}
      <Card className="chef-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Notification Types</CardTitle>
            {selectedFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilter}
                className="text-xs"
              >
                Clear Filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              className={`flex items-center justify-between gap-2 p-3 rounded-lg cursor-pointer transition-all hover:bg-blue-50 ${
                selectedFilter === 'order' ? 'bg-blue-100 border-2 border-blue-200' : 'hover:shadow-sm'
              }`}
              onClick={() => handleFilterByType('order')}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
                <span className="text-sm">New Orders</span>
              </div>
              <div className="flex flex-col items-end">
                <Badge variant="secondary" className="text-xs">
                  {getCountByType('order')}
                </Badge>
                {getUnreadCountByType('order') > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      {getUnreadCountByType('order')} new
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            <div 
              className={`flex items-center justify-between gap-2 p-3 rounded-lg cursor-pointer transition-all hover:bg-purple-50 ${
                selectedFilter === 'bulk_order' ? 'bg-purple-100 border-2 border-purple-200' : 'hover:shadow-sm'
              }`}
              onClick={() => handleFilterByType('bulk_order')}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Bulk Orders</span>
              </div>
              <div className="flex flex-col items-end">
                <Badge variant="secondary" className="text-xs">
                  {getCountByType('bulk_order')}
                </Badge>
                {getUnreadCountByType('bulk_order') > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      {getUnreadCountByType('bulk_order')} new
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            <div 
              className={`flex items-center justify-between gap-2 p-3 rounded-lg cursor-pointer transition-all hover:bg-orange-50 ${
                selectedFilter === 'menu' ? 'bg-orange-100 border-2 border-orange-200' : 'hover:shadow-sm'
              }`}
              onClick={() => handleFilterByType('menu')}
            >
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Menu Updates</span>
              </div>
              <div className="flex flex-col items-end">
                <Badge variant="secondary" className="text-xs">
                  {getCountByType('menu')}
                </Badge>
                {getUnreadCountByType('menu') > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      {getUnreadCountByType('menu')} new
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            <div 
              className={`flex items-center justify-between gap-2 p-3 rounded-lg cursor-pointer transition-all hover:bg-indigo-50 ${
                selectedFilter === 'profile' ? 'bg-indigo-100 border-2 border-indigo-200' : 'hover:shadow-sm'
              }`}
              onClick={() => handleFilterByType('profile')}
            >
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-indigo-600" />
                <span className="text-sm">Profile Changes</span>
              </div>
              <div className="flex flex-col items-end">
                <Badge variant="secondary" className="text-xs">
                  {getCountByType('profile')}
                </Badge>
                {getUnreadCountByType('profile') > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      {getUnreadCountByType('profile')} new
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="chef-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            All Notifications
            {loading && <span className="text-sm text-muted-foreground">(Loading...)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading notifications...
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              No notifications yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow 
                    key={notification.id}
                    className={
                      !notification.read 
                        ? "bg-gradient-to-r from-blue-50/80 via-blue-50/40 to-transparent border-l-4 border-l-blue-500 hover:from-blue-50 hover:via-blue-50/60 hover:to-blue-50/20 transition-all duration-200" 
                        : "hover:bg-muted/20 transition-colors duration-200"
                    }
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2 relative">
                        {getNotificationIcon(notification.type)}
                        {!notification.read && (
                          <>
                            <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse shadow-lg border-2 border-white" />
                            <div className="absolute -top-1 -left-1 h-2 w-2 bg-red-600 rounded-full animate-ping" />
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        {getTypeBadge(notification.type, notification.title)}
                        {!notification.read && (
                          <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full border border-white" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={!notification.read ? "font-bold text-foreground" : "font-medium text-muted-foreground"}>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 animate-pulse">
                            NEW
                          </Badge>
                        )}
                        <div>
                          {notification.title}
                          {notification.order_number && (
                            <span className="text-xs text-muted-foreground block">
                              Order #{notification.order_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div 
                        className={`truncate ${!notification.read ? "font-medium text-foreground" : "text-muted-foreground"}`} 
                        title={notification.message}
                      >
                        {notification.message}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className={`h-3 w-3 ${!notification.read ? "text-blue-600" : "text-muted-foreground"}`} />
                        <span className={`text-sm ${!notification.read ? "text-blue-600 font-medium" : "text-muted-foreground"}`}>
                          {notification.timestamp}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs"
                          >
                            Mark Read
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification.id);
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
