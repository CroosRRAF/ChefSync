import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { Bell, Send, Users, Package, AlertTriangle, CheckCircle, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { adminService, type AdminNotification } from '@/services/adminService';
import { toast } from 'sonner';

const AdminNotifications: React.FC = memo(() => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  console.log('AdminNotifications component rendered', { user, loading, error });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    notification_type: 'system_alert',
    priority: 'medium',
    target_audience: 'all',
    send_email: true,
    send_sms: false,
    is_urgent: false
  });

  // Load notifications when user becomes available and is admin
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadNotifications();
      loadUnreadCount();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading notifications...');
      const response = await adminService.getNotifications();
      console.log('Notifications response:', response);
      setNotifications(response.results || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await adminService.getUnreadNotificationCount();
      setUnreadCount(response.unread_count);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  const handleSendNotification = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }

    try {
      setSending(true);
      await adminService.createNotification({
        title: formData.title,
        message: formData.message,
        notification_type: formData.notification_type,
        priority: formData.priority,
        target_audience: formData.target_audience,
        send_email: formData.send_email,
        send_sms: formData.send_sms
      });

      toast.success('Notification sent successfully');

      // Reset form
      setFormData({
        title: '',
        message: '',
        notification_type: 'system_alert',
        priority: 'medium',
        target_audience: 'all',
        send_email: true,
        send_sms: false,
        is_urgent: false
      });

      // Reload notifications
      await loadNotifications();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send notification';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await adminService.markNotificationRead(notificationId);
      toast.success('Notification marked as read');

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );

      // Update unread count
      await loadUnreadCount();
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await adminService.markAllNotificationsRead();
      toast.success('All notifications marked as read');

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">Admin access required.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load notifications</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
          <Button
            variant="outline"
            onClick={() => loadNotifications()}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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
    <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Send and manage platform notifications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Send Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Compose Notification</span>
              </CardTitle>
              <CardDescription>Send notifications to users or groups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notification-type">Notification Type</Label>
                <select
                  id="notification-type"
                  className="w-full mt-2 p-2 border rounded-md"
                  value={formData.notification_type}
                  onChange={(e) => handleFormChange('notification_type', e.target.value)}
                >
                  <option value="system_alert">System Alert</option>
                  <option value="user_activity">User Activity</option>
                  <option value="order_update">Order Update</option>
                  <option value="payment_issue">Payment Issue</option>
                  <option value="security_event">Security Event</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="backup">Backup</option>
                  <option value="performance">Performance</option>
                </select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  className="w-full mt-2 p-2 border rounded-md"
                  value={formData.priority}
                  onChange={(e) => handleFormChange('priority', e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <Label htmlFor="target-audience">Target Audience</Label>
                <select
                  id="target-audience"
                  className="w-full mt-2 p-2 border rounded-md"
                  value={formData.target_audience}
                  onChange={(e) => handleFormChange('target_audience', e.target.value)}
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
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="notification-message">Message</Label>
                <Textarea
                  id="notification-message"
                  placeholder="Enter notification message"
                  className="mt-2"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => handleFormChange('message', e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="urgent"
                  className="rounded"
                  checked={formData.is_urgent}
                  onChange={(e) => handleFormChange('is_urgent', e.target.checked)}
                />
                <Label htmlFor="urgent">Mark as urgent</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="email"
                  className="rounded"
                  checked={formData.send_email}
                  onChange={(e) => handleFormChange('send_email', e.target.checked)}
                />
                <Label htmlFor="email">Send via email</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sms"
                  className="rounded"
                  checked={formData.send_sms}
                  onChange={(e) => handleFormChange('send_sms', e.target.checked)}
                />
                <Label htmlFor="sms">Send via SMS</Label>
              </div>

              <Button
                className="w-full"
                onClick={handleSendNotification}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </>
                )}
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
                      className={`p-4 border rounded-lg ${getNotificationColor(notification.notification_type)} ${
                        !notification.is_read ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.notification_type)}
                          <div>
                            <h4 className="font-medium">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
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
  );
});

export default AdminNotifications;











