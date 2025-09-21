import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUserStore } from '@/store/userStore';
import { Settings, Save, RefreshCw, Shield, Bell, Globe, AlertCircle, CheckCircle } from 'lucide-react';
import { adminService, type SystemSetting } from '@/services/adminService';
import { toast } from 'sonner';

const AdminSettings: React.FC = () => {
  const { user } = useUserStore();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Local state for form values
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const settingsData = await adminService.getSystemSettings();
      setSettings(settingsData);

      // Initialize form values
      const initialValues: Record<string, any> = {};
      settingsData.forEach(setting => {
        initialValues[setting.key] = setting.typed_value || setting.value;
      });
      setFormValues(initialValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Save each changed setting
      const savePromises = Object.entries(formValues).map(async ([key, value]) => {
        const currentSetting = settings.find(s => s.key === key);
        if (currentSetting && currentSetting.typed_value !== value) {
          return adminService.updateSystemSetting(key, String(value));
        }
        return null;
      });

      const results = await Promise.all(savePromises.filter(Boolean));
      const savedCount = results.length;

      toast.success(`Successfully saved ${savedCount} settings`);
      setHasChanges(false);

      // Reload settings to get updated data
      await loadSettings();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Reset form values to original settings
    const resetValues: Record<string, any> = {};
    settings.forEach(setting => {
      resetValues[setting.key] = setting.typed_value || setting.value;
    });
    setFormValues(resetValues);
    setHasChanges(false);
    setError(null);
  };

  // Helper function to get setting value
  const getSettingValue = (key: string, defaultValue: any = '') => {
    return formValues[key] !== undefined ? formValues[key] : defaultValue;
  };

  // Helper function to get setting by key
  const getSetting = (key: string) => {
    return settings.find(s => s.key === key);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Please log in to access settings</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Configure platform settings and preferences</p>
          </div>
          <div className="flex items-center space-x-3">
            {error && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </div>
            )}
            <Button
              onClick={loadSettings}
              variant="outline"
              disabled={loading}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
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
                  <Input
                    id="platform-name"
                    value={getSettingValue('PLATFORM_NAME', 'ChefSync')}
                    onChange={(e) => handleInputChange('PLATFORM_NAME', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input
                    id="contact-email"
                    value={getSettingValue('CONTACT_EMAIL', 'admin@chefsync.com')}
                    onChange={(e) => handleInputChange('CONTACT_EMAIL', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={getSettingValue('TIMEZONE', 'UTC')}
                    onChange={(e) => handleInputChange('TIMEZONE', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={getSettingValue('CURRENCY', 'USD')}
                    onChange={(e) => handleInputChange('CURRENCY', e.target.value)}
                  />
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
                <Switch
                  id="two-factor"
                  checked={getSettingValue('REQUIRE_2FA', false)}
                  onCheckedChange={(checked) => handleInputChange('REQUIRE_2FA', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="session-timeout">Session Timeout</Label>
                  <p className="text-sm text-gray-500">Auto-logout after inactivity (minutes)</p>
                </div>
                <Input
                  id="session-timeout"
                  type="number"
                  value={getSettingValue('SESSION_TIMEOUT_MINUTES', 30)}
                  onChange={(e) => handleInputChange('SESSION_TIMEOUT_MINUTES', parseInt(e.target.value))}
                  className="w-24"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ip-whitelist">IP Whitelist</Label>
                  <p className="text-sm text-gray-500">Restrict admin access to specific IPs</p>
                </div>
                <Switch
                  id="ip-whitelist"
                  checked={getSettingValue('ENABLE_IP_WHITELIST', false)}
                  onCheckedChange={(checked) => handleInputChange('ENABLE_IP_WHITELIST', checked)}
                />
              </div>
              <div>
                <Label htmlFor="password-policy">Password Policy</Label>
                <Input
                  id="password-policy"
                  value={getSettingValue('PASSWORD_POLICY', 'Minimum 8 characters, uppercase, lowercase, number, special character')}
                  onChange={(e) => handleInputChange('PASSWORD_POLICY', e.target.value)}
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
                <Switch
                  id="email-notifications"
                  checked={getSettingValue('ENABLE_EMAIL_NOTIFICATIONS', true)}
                  onCheckedChange={(checked) => handleInputChange('ENABLE_EMAIL_NOTIFICATIONS', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <p className="text-sm text-gray-500">Send SMS alerts for critical issues</p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={getSettingValue('ENABLE_SMS_NOTIFICATIONS', false)}
                  onCheckedChange={(checked) => handleInputChange('ENABLE_SMS_NOTIFICATIONS', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="order-alerts">Order Alerts</Label>
                  <p className="text-sm text-gray-500">Notify admins of new orders</p>
                </div>
                <Switch
                  id="order-alerts"
                  checked={getSettingValue('ENABLE_ORDER_ALERTS', true)}
                  onCheckedChange={(checked) => handleInputChange('ENABLE_ORDER_ALERTS', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="system-alerts">System Alerts</Label>
                  <p className="text-sm text-gray-500">Notify admins of system issues</p>
                </div>
                <Switch
                  id="system-alerts"
                  checked={getSettingValue('ENABLE_SYSTEM_ALERTS', true)}
                  onCheckedChange={(checked) => handleInputChange('ENABLE_SYSTEM_ALERTS', checked)}
                />
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
                  <Input
                    id="auto-confirm"
                    value={getSettingValue('AUTO_CONFIRM_MINUTES', '15')}
                    onChange={(e) => handleInputChange('AUTO_CONFIRM_MINUTES', e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">Time before auto-confirmation (minutes)</p>
                </div>
                <div>
                  <Label htmlFor="preparation-time">Default Preparation Time</Label>
                  <Input
                    id="preparation-time"
                    value={getSettingValue('DEFAULT_PREPARATION_MINUTES', '30')}
                    onChange={(e) => handleInputChange('DEFAULT_PREPARATION_MINUTES', e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">Standard cooking time (minutes)</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery-radius">Delivery Radius</Label>
                  <Input
                    id="delivery-radius"
                    value={getSettingValue('DELIVERY_RADIUS_KM', '10')}
                    onChange={(e) => handleInputChange('DELIVERY_RADIUS_KM', e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">Maximum delivery distance (km)</p>
                </div>
                <div>
                  <Label htmlFor="min-order">Minimum Order Amount</Label>
                  <Input
                    id="min-order"
                    value={getSettingValue('MINIMUM_ORDER_AMOUNT', '$10.00')}
                    onChange={(e) => handleInputChange('MINIMUM_ORDER_AMOUNT', e.target.value)}
                  />
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
                <Button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Changes
                </Button>
              </div>
              {hasChanges && (
                <p className="text-sm text-amber-600 mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  You have unsaved changes
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default AdminSettings;











