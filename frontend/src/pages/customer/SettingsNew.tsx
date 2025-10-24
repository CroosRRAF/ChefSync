import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { Bell, Shield, MapPin, CreditCard, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const CustomerSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for notification preferences
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    newsletter: false,
    smsUpdates: true
  });
  
  // State for delivery preferences  
  const [deliveryPrefs, setDeliveryPrefs] = useState({
    instructions: '',
    contactPreference: 'phone',
    preferredTime: 'anytime'
  });

  // State for privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    dataSharing: false,
    locationTracking: true,
    orderHistory: true
  });

  // Save settings handler
  const handleSaveSettings = async () => {
    try {
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your account preferences</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/customer/dashboard')}
            className="border-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Notification Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              Notifications
            </CardTitle>
            <CardDescription>Choose what updates you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="order-updates" className="text-base font-medium">Order Updates</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about order status changes</p>
              </div>
              <Switch 
                id="order-updates" 
                checked={notifications.orderUpdates}
                onCheckedChange={(checked) => setNotifications({...notifications, orderUpdates: checked})}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-updates" className="text-base font-medium">SMS Updates</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive text messages about your orders</p>
              </div>
              <Switch 
                id="sms-updates" 
                checked={notifications.smsUpdates}
                onCheckedChange={(checked) => setNotifications({...notifications, smsUpdates: checked})}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="promotions" className="text-base font-medium">Promotional Offers</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Special deals and exclusive offers</p>
              </div>
              <Switch 
                id="promotions" 
                checked={notifications.promotions}
                onCheckedChange={(checked) => setNotifications({...notifications, promotions: checked})}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="newsletter" className="text-base font-medium">Newsletter</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Weekly food recommendations and news</p>
              </div>
              <Switch 
                id="newsletter" 
                checked={notifications.newsletter}
                onCheckedChange={(checked) => setNotifications({...notifications, newsletter: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Delivery Preferences */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-500" />
              Delivery Preferences
            </CardTitle>
            <CardDescription>Configure your delivery settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delivery-instructions">Delivery Instructions</Label>
              <Input 
                id="delivery-instructions" 
                value={deliveryPrefs.instructions}
                onChange={(e) => setDeliveryPrefs({...deliveryPrefs, instructions: e.target.value})}
                placeholder="e.g., Leave at front door, call when arriving"
                className="bg-gray-50 dark:bg-gray-800"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-preference">Contact Preference</Label>
                <select 
                  id="contact-preference" 
                  value={deliveryPrefs.contactPreference}
                  onChange={(e) => setDeliveryPrefs({...deliveryPrefs, contactPreference: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-md text-gray-900 dark:text-white"
                >
                  <option value="phone">Phone Call</option>
                  <option value="text">Text Message</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-time">Preferred Delivery Time</Label>
                <select 
                  id="delivery-time" 
                  value={deliveryPrefs.preferredTime}
                  onChange={(e) => setDeliveryPrefs({...deliveryPrefs, preferredTime: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-md text-gray-900 dark:text-white"
                >
                  <option value="anytime">Anytime</option>
                  <option value="morning">Morning (8 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                  <option value="evening">Evening (5 PM - 9 PM)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              Privacy & Security
            </CardTitle>
            <CardDescription>Control your data and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="location-tracking" className="text-base font-medium">Location Tracking</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allow location access for better delivery</p>
              </div>
              <Switch 
                id="location-tracking" 
                checked={privacySettings.locationTracking}
                onCheckedChange={(checked) => setPrivacySettings({...privacySettings, locationTracking: checked})}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="order-history" className="text-base font-medium">Order History</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Keep order history for recommendations</p>
              </div>
              <Switch 
                id="order-history" 
                checked={privacySettings.orderHistory}
                onCheckedChange={(checked) => setPrivacySettings({...privacySettings, orderHistory: checked})}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="data-sharing" className="text-base font-medium">Data Sharing</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Share data for improved service</p>
              </div>
              <Switch 
                id="data-sharing" 
                checked={privacySettings.dataSharing}
                onCheckedChange={(checked) => setPrivacySettings({...privacySettings, dataSharing: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button 
            variant="outline"
            onClick={() => {
              setNotifications({ orderUpdates: true, promotions: true, newsletter: false, smsUpdates: true });
              setDeliveryPrefs({ instructions: '', contactPreference: 'phone', preferredTime: 'anytime' });
              setPrivacySettings({ dataSharing: false, locationTracking: true, orderHistory: true });
              toast.info('Settings reset to defaults');
            }}
          >
            Reset to Defaults
          </Button>
          <Button 
            onClick={handleSaveSettings}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>

      </div>
    </div>
  );
};

export default CustomerSettings;
