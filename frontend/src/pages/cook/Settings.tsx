import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Palette,
  Globe,
  Save,
  RefreshCw
} from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      newOrders: true,
      orderUpdates: true,
      bulkOrders: true,
      reviews: false,
      systemUpdates: true
    },
    privacy: {
      showOnlineStatus: true,
      allowDirectMessages: true,
      showProfileToCustomers: true
    },
    appearance: {
      theme: "light",
      language: "en",
      timezone: "UTC"
    },
    kitchen: {
      autoAcceptOrders: false,
      maxConcurrentOrders: 5,
      prepTimeBuffer: 15
    }
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value }
    }));
  };

  const handleAppearanceChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      appearance: { ...prev.appearance, [key]: value }
    }));
  };

  const handleKitchenChange = (key: string, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      kitchen: { ...prev.kitchen, [key]: value }
    }));
  };

  const handleSaveSettings = () => {
    // Save settings to backend/localStorage
    localStorage.setItem('chef-settings', JSON.stringify(settings));
    console.log('Settings saved:', settings);
  };

  const handleResetSettings = () => {
    // Reset to default settings
    setSettings({
      notifications: {
        newOrders: true,
        orderUpdates: true,
        bulkOrders: true,
        reviews: false,
        systemUpdates: true
      },
      privacy: {
        showOnlineStatus: true,
        allowDirectMessages: true,
        showProfileToCustomers: true
      },
      appearance: {
        theme: "light",
        language: "en",
        timezone: "UTC"
      },
      kitchen: {
        autoAcceptOrders: false,
        maxConcurrentOrders: 5,
        prepTimeBuffer: 15
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Customize your chef dashboard experience</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleResetSettings} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSaveSettings} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card className="chef-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="new-orders">New Orders</Label>
                <p className="text-sm text-muted-foreground">Get notified when new orders arrive</p>
              </div>
              <Switch
                id="new-orders"
                checked={settings.notifications.newOrders}
                onCheckedChange={(value) => handleNotificationChange('newOrders', value)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="order-updates">Order Updates</Label>
                <p className="text-sm text-muted-foreground">Notifications for order status changes</p>
              </div>
              <Switch
                id="order-updates"
                checked={settings.notifications.orderUpdates}
                onCheckedChange={(value) => handleNotificationChange('orderUpdates', value)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="bulk-orders">Bulk Orders</Label>
                <p className="text-sm text-muted-foreground">Large catering order notifications</p>
              </div>
              <Switch
                id="bulk-orders"
                checked={settings.notifications.bulkOrders}
                onCheckedChange={(value) => handleNotificationChange('bulkOrders', value)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reviews">Customer Reviews</Label>
                <p className="text-sm text-muted-foreground">New review notifications</p>
              </div>
              <Switch
                id="reviews"
                checked={settings.notifications.reviews}
                onCheckedChange={(value) => handleNotificationChange('reviews', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="chef-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="online-status">Show Online Status</Label>
                <p className="text-sm text-muted-foreground">Display when you're available</p>
              </div>
              <Switch
                id="online-status"
                checked={settings.privacy.showOnlineStatus}
                onCheckedChange={(value) => handlePrivacyChange('showOnlineStatus', value)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="direct-messages">Allow Direct Messages</Label>
                <p className="text-sm text-muted-foreground">Let customers message you directly</p>
              </div>
              <Switch
                id="direct-messages"
                checked={settings.privacy.allowDirectMessages}
                onCheckedChange={(value) => handlePrivacyChange('allowDirectMessages', value)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-profile">Show Profile to Customers</Label>
                <p className="text-sm text-muted-foreground">Make your profile visible to customers</p>
              </div>
              <Switch
                id="show-profile"
                checked={settings.privacy.showProfileToCustomers}
                onCheckedChange={(value) => handlePrivacyChange('showProfileToCustomers', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="chef-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={settings.appearance.theme} onValueChange={(value) => handleAppearanceChange('theme', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={settings.appearance.language} onValueChange={(value) => handleAppearanceChange('language', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={settings.appearance.timezone} onValueChange={(value) => handleAppearanceChange('timezone', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="EST">Eastern Time</SelectItem>
                  <SelectItem value="PST">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Kitchen Settings */}
        <Card className="chef-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              Kitchen Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-accept">Auto Accept Orders</Label>
                <p className="text-sm text-muted-foreground">Automatically accept incoming orders</p>
              </div>
              <Switch
                id="auto-accept"
                checked={settings.kitchen.autoAcceptOrders}
                onCheckedChange={(value) => handleKitchenChange('autoAcceptOrders', value)}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="max-orders">Max Concurrent Orders</Label>
              <Input
                id="max-orders"
                type="number"
                value={settings.kitchen.maxConcurrentOrders}
                onChange={(e) => handleKitchenChange('maxConcurrentOrders', parseInt(e.target.value))}
                min="1"
                max="20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prep-buffer">Prep Time Buffer (minutes)</Label>
              <Input
                id="prep-buffer"
                type="number"
                value={settings.kitchen.prepTimeBuffer}
                onChange={(e) => handleKitchenChange('prepTimeBuffer', parseInt(e.target.value))}
                min="0"
                max="60"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
