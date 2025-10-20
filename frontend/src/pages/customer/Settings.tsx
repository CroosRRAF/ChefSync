import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { Settings, Save, User, Bell, Shield, MapPin, CreditCard, Home, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for form data
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  
  
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
  
  // State for payment settings
  const [paymentSettings, setPaymentSettings] = useState({
    savePayment: true,
    autoTip: false,
    defaultTip: '15'
  });

  // Save settings handler
  const handleSaveSettings = async () => {
    try {
      // Here you would typically call an API to save the settings
      // For now, we'll just show a success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="mb-6 flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/customer/dashboard')}
            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="hover:bg-green-50 dark:hover:bg-green-900/20 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your account preferences and information</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Settings</span>
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input 
                    id="full-name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={user?.email || ''} disabled />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Delivery Address</Label>
                  <Input 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
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
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="order-updates">Order Updates</Label>
                  <p className="text-sm text-gray-500">Notifications for order status changes</p>
                </div>
                <Switch 
                  id="order-updates" 
                  checked={notifications.orderUpdates}
                  onCheckedChange={(checked) => setNotifications({...notifications, orderUpdates: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="delivery-notifications">SMS Updates</Label>
                  <p className="text-sm text-gray-500">Text message updates about your order</p>
                </div>
                <Switch 
                  id="delivery-notifications" 
                  checked={notifications.smsUpdates}
                  onCheckedChange={(checked) => setNotifications({...notifications, smsUpdates: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="promotional-offers">Promotional Offers</Label>
                  <p className="text-sm text-gray-500">Deals and special offers</p>
                </div>
                <Switch 
                  id="promotional-offers" 
                  checked={notifications.promotions}
                  onCheckedChange={(checked) => setNotifications({...notifications, promotions: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newsletter">Newsletter</Label>
                  <p className="text-sm text-gray-500">Weekly food recommendations</p>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Delivery Preferences</span>
              </CardTitle>
              <CardDescription>Configure your delivery settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery-instructions">Delivery Instructions</Label>
                  <Input 
                    id="delivery-instructions" 
                    value={deliveryPrefs.instructions}
                    onChange={(e) => setDeliveryPrefs({...deliveryPrefs, instructions: e.target.value})}
                    placeholder="e.g., Leave at front door, call when arriving"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-preference">Contact Preference</Label>
                  <select 
                    id="contact-preference" 
                    value={deliveryPrefs.contactPreference}
                    onChange={(e) => setDeliveryPrefs({...deliveryPrefs, contactPreference: e.target.value})}
                    className="w-full mt-2 p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md text-gray-900 dark:text-white"
                  >
                    <option value="phone">Phone Call</option>
                    <option value="text">Text Message</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery-time">Preferred Delivery Time</Label>
                  <select 
                    id="delivery-time" 
                    value={deliveryPrefs.preferredTime}
                    onChange={(e) => setDeliveryPrefs({...deliveryPrefs, preferredTime: e.target.value})}
                    className="w-full mt-2 p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md text-gray-900 dark:text-white"
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

          {/* Payment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Payment Settings</span>
              </CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="save-payment">Save Payment Methods</Label>
                  <p className="text-sm text-gray-500">Securely store payment info for faster checkout</p>
                </div>
                <Switch 
                  id="save-payment" 
                  checked={paymentSettings.savePayment}
                  onCheckedChange={(checked) => setPaymentSettings({...paymentSettings, savePayment: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-tip">Auto-Tip</Label>
                  <p className="text-sm text-gray-500">Automatically add tip to orders</p>
                </div>
                <Switch 
                  id="auto-tip" 
                  checked={paymentSettings.autoTip}
                  onCheckedChange={(checked) => setPaymentSettings({...paymentSettings, autoTip: checked})}
                />
              </div>
              <div>
                <Label htmlFor="default-tip">Default Tip Amount</Label>
                <select 
                  id="default-tip" 
                  value={paymentSettings.defaultTip}
                  onChange={(e) => setPaymentSettings({...paymentSettings, defaultTip: e.target.value})}
                  className="w-full mt-2 p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md text-gray-900 dark:text-white"
                >
                  <option value="0">No tip</option>
                  <option value="10">10%</option>
                  <option value="15">15%</option>
                  <option value="18">18%</option>
                  <option value="20">20%</option>
                  <option value="custom">Custom amount</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Privacy Settings</span>
              </CardTitle>
              <CardDescription>Control your data and privacy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="data-sharing">Data Sharing</Label>
                  <p className="text-sm text-gray-500">Allow data sharing for improved service</p>
                </div>
                <Switch 
                  id="data-sharing" 
                  checked={privacySettings.dataSharing}
                  onCheckedChange={(checked) => setPrivacySettings({...privacySettings, dataSharing: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="location-tracking">Location Tracking</Label>
                  <p className="text-sm text-gray-500">Allow location access for better delivery</p>
                </div>
                <Switch 
                  id="location-tracking" 
                  checked={privacySettings.locationTracking}
                  onCheckedChange={(checked) => setPrivacySettings({...privacySettings, locationTracking: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="order-history">Order History</Label>
                  <p className="text-sm text-gray-500">Keep order history for recommendations</p>
                </div>
                <Switch 
                  id="order-history" 
                  checked={privacySettings.orderHistory}
                  onCheckedChange={(checked) => setPrivacySettings({...privacySettings, orderHistory: checked})}
                />
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
                  onClick={handleSaveSettings}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Reset to default values
                    setFormData({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
                    setNotifications({ orderUpdates: true, promotions: true, newsletter: false, smsUpdates: true });
                    setDeliveryPrefs({ instructions: '', contactPreference: 'phone', preferredTime: 'anytime' });
                    setPaymentSettings({ savePayment: true, autoTip: false, defaultTip: '15' });
                    setPrivacySettings({ dataSharing: false, locationTracking: true, orderHistory: true });
                  }}
                >
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerSettings;












