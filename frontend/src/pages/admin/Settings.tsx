import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { Settings, Save, RefreshCw, Shield, Bell, Globe } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <div>Please log in to access settings.</div>;
  }

  return (
    <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Configure platform settings and preferences</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Platform Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Platform Settings</span>
              </CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input id="platform-name" defaultValue="ChefSync" />
                </div>
                <div>
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input id="contact-email" defaultValue="admin@chefsync.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" defaultValue="UTC" />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" defaultValue="USD" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription>Platform security configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">Require 2FA for all admin users</p>
                </div>
                <Switch id="two-factor" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="session-timeout">Session Timeout</Label>
                  <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
                </div>
                <Switch id="session-timeout" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ip-whitelist">IP Whitelist</Label>
                  <p className="text-sm text-gray-500">Restrict admin access to specific IPs</p>
                </div>
                <Switch id="ip-whitelist" />
              </div>
              <div>
                <Label htmlFor="password-policy">Password Policy</Label>
                <Input 
                  id="password-policy" 
                  defaultValue="Minimum 8 characters, uppercase, lowercase, number, special character"
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription>Configure system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Send email alerts for important events</p>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <p className="text-sm text-gray-500">Send SMS alerts for critical issues</p>
                </div>
                <Switch id="sms-notifications" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="order-alerts">Order Alerts</Label>
                  <p className="text-sm text-gray-500">Notify admins of new orders</p>
                </div>
                <Switch id="order-alerts" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="system-alerts">System Alerts</Label>
                  <p className="text-sm text-gray-500">Notify admins of system issues</p>
                </div>
                <Switch id="system-alerts" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Order Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Order Settings</span>
              </CardTitle>
              <CardDescription>Configure order processing rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="auto-confirm">Auto-Confirm Orders</Label>
                  <Input id="auto-confirm" defaultValue="15 minutes" />
                  <p className="text-sm text-gray-500 mt-1">Time before auto-confirmation</p>
                </div>
                <div>
                  <Label htmlFor="preparation-time">Default Preparation Time</Label>
                  <Input id="preparation-time" defaultValue="30 minutes" />
                  <p className="text-sm text-gray-500 mt-1">Standard cooking time</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery-radius">Delivery Radius</Label>
                  <Input id="delivery-radius" defaultValue="10 km" />
                  <p className="text-sm text-gray-500 mt-1">Maximum delivery distance</p>
                </div>
                <div>
                  <Label htmlFor="min-order">Minimum Order Amount</Label>
                  <Input id="min-order" defaultValue="$10.00" />
                  <p className="text-sm text-gray-500 mt-1">Minimum order value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Save or reset your settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default AdminSettings;











