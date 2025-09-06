import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUserStore } from '@/store/userStore';
import { Settings, Save, User, Bell, Shield, MapPin, CreditCard } from 'lucide-react';

const CustomerSettings: React.FC = () => {
  const { user } = useUserStore();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and information</p>
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
                  <Input id="full-name" defaultValue={user.name} />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue={user.email} disabled />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue={user.phone_no || ''} />
                </div>
                <div>
                  <Label htmlFor="address">Delivery Address</Label>
                  <Input id="address" defaultValue={user.address || ''} />
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
                <Switch id="order-updates" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="delivery-notifications">Delivery Notifications</Label>
                  <p className="text-sm text-gray-500">Updates about your food delivery</p>
                </div>
                <Switch id="delivery-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="promotional-offers">Promotional Offers</Label>
                  <p className="text-sm text-gray-500">Deals and special offers</p>
                </div>
                <Switch id="promotional-offers" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newsletter">Newsletter</Label>
                  <p className="text-sm text-gray-500">Weekly food recommendations</p>
                </div>
                <Switch id="newsletter" />
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
                  <Label htmlFor="default-address">Default Delivery Address</Label>
                  <Input 
                    id="default-address" 
                    defaultValue={user.address || ''}
                    placeholder="Enter your default delivery address"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery-instructions">Delivery Instructions</Label>
                  <Input 
                    id="delivery-instructions" 
                    placeholder="e.g., Leave at front door, call when arriving"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact-preference">Contact Preference</Label>
                  <select id="contact-preference" className="w-full mt-2 p-2 border rounded-md">
                    <option value="phone">Phone Call</option>
                    <option value="text">Text Message</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="delivery-time">Preferred Delivery Time</Label>
                  <select id="delivery-time" className="w-full mt-2 p-2 border rounded-md">
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
                <Switch id="save-payment" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-tip">Auto-Tip</Label>
                  <p className="text-sm text-gray-500">Automatically add tip to orders</p>
                </div>
                <Switch id="auto-tip" />
              </div>
              <div>
                <Label htmlFor="default-tip">Default Tip Amount</Label>
                <select id="default-tip" className="w-full mt-2 p-2 border rounded-md">
                  <option value="0">No tip</option>
                  <option value="10">10%</option>
                  <option value="15" selected>15%</option>
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
                <Switch id="data-sharing" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="location-tracking">Location Tracking</Label>
                  <p className="text-sm text-gray-500">Allow location access for better delivery</p>
                </div>
                <Switch id="location-tracking" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="order-history">Order History</Label>
                  <p className="text-sm text-gray-500">Keep order history for recommendations</p>
                </div>
                <Switch id="order-history" defaultChecked />
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











