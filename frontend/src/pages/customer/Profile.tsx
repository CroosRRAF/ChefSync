import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { customerService, CustomerProfile } from '@/services/customerService';
import { 
  User, 
  Save, 
  Camera, 
  Star, 
  Award, 
  Clock, 
  Users, 
  MapPin,
  Phone,
  Mail,
  Calendar,
  Edit,
  CheckCircle,
  ShoppingCart,
  Heart,
  Gift,
  CreditCard,
  Bell,
  Shield,
  Settings,
  ArrowLeft,
  Home,
  LayoutDashboard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    total_orders: 0,
    completed_orders: 0,
    pending_orders: 0,
    total_spent: 0,
    average_order_value: 0
  });
  const navigate = useNavigate();
  
  // Fetch profile data and stats
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const [profileData, customerStats] = await Promise.all([
          customerService.getProfile(),
          customerService.getCustomerStats()
        ]);
        setProfile(profileData);
        setStats(customerStats);
        console.log('Profile loaded:', profileData);
        console.log('Stats loaded:', customerStats);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set default profile and stats on error
        setProfile({
          user_id: user.id,
          name: user.name || user.username,
          email: user.email,
          phone_no: user.phone_no || '',
          address: user.address || '',
          role: user.role,
          role_display: user.role_display || user.role,
          profile_image: user.profile_image || null,
          email_verified: user.email_verified || false,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString(),
          profile_data: null
        });
        setStats({
          total_orders: 0,
          completed_orders: 0,
          pending_orders: 0,
          total_spent: 0,
          average_order_value: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Update form data when profile is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone_no || '',
        address: profile.address || '',
        bio: 'Food enthusiast who loves exploring new cuisines and supporting local restaurants. Always looking for the next great meal!',
        preferences: {
          cuisine: ['Italian', 'Mexican', 'Asian', 'Mediterranean'],
          dietary: ['No restrictions'],
          spiceLevel: 'Medium',
          deliveryTime: '30-45 minutes'
        },
        loyaltyPoints: 1250,
        memberSince: new Date(profile.created_at).getFullYear(),
        favoriteRestaurants: ['Mario\'s Italian', 'Spice Garden', 'Sushi Zen'],
        paymentMethods: [
          { type: 'Credit Card', last4: '**** 1234', isDefault: true },
          { type: 'PayPal', email: profile.email, isDefault: false }
        ],
        notifications: {
          orderUpdates: true,
          promotions: true,
          newRestaurants: false,
          deliveryAlerts: true
        }
      });
    }
  }, [profile]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: 'Food enthusiast who loves exploring new cuisines and supporting local restaurants. Always looking for the next great meal!',
    preferences: {
      cuisine: ['Italian', 'Mexican', 'Asian', 'Mediterranean'],
      dietary: ['No restrictions'],
      spiceLevel: 'Medium',
      deliveryTime: '30-45 minutes'
    },
    loyaltyPoints: 1250,
    memberSince: new Date(user?.createdAt || Date.now()).getFullYear(),
    favoriteRestaurants: ['Mario\'s Italian', 'Spice Garden', 'Sushi Zen'],
    paymentMethods: [
      { type: 'Credit Card', last4: '**** 1234', isDefault: true },
      { type: 'PayPal', email: user?.email, isDefault: false }
    ],
    notifications: {
      orderUpdates: true,
      promotions: true,
      newRestaurants: false,
      deliveryAlerts: true
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as Record<string, any>),
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedProfile = await customerService.updateProfile({
        name: formData.name,
        phone_no: formData.phone,
        address: formData.address
      });
      
      // Update local profile state
      setProfile(updatedProfile);
      setIsEditing(false);
      alert('Profile updated successfully!');
      console.log('Profile updated:', updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const getCustomerLevel = (orderCount: number) => {
    if (orderCount >= 50) return { level: 'Diamond', color: 'bg-purple-500', progress: 100 };
    if (orderCount >= 25) return { level: 'Gold', color: 'bg-yellow-500', progress: (orderCount - 25) / 25 * 100 };
    if (orderCount >= 10) return { level: 'Silver', color: 'bg-gray-400', progress: (orderCount - 10) / 15 * 100 };
    return { level: 'Bronze', color: 'bg-orange-400', progress: orderCount / 10 * 100 };
  };

  const customerLevel = getCustomerLevel(stats.completed_orders);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-2">Manage your account and preferences</p>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="border-none shadow-md">
              <CardHeader className="text-center">
                <div className="relative inline-block">
                  <Avatar className="h-32 w-32 mx-auto ring-4 ring-blue-500/20">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-blue-500 text-white font-bold text-3xl">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CardTitle className="text-xl mt-4">{user.name}</CardTitle>
                <CardDescription className="text-blue-600 font-medium">Food Lover</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Badge className={`${customerLevel.color} text-white px-3 py-1`}>
                    {customerLevel.level} Member
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.total_orders}</p>
                    <p className="text-sm text-gray-600">Orders</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">LKR {Math.round(stats.total_spent)}</p>
                    <p className="text-sm text-gray-600">Spent</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{formData.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{formData.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Member since {formData.memberSince}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loyalty Points */}
            <Card className="border-none shadow-md bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-5 w-5" />
                  <span>Loyalty Points</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold mb-2">{formData.loyaltyPoints}</p>
                  <p className="text-yellow-100 text-sm mb-4">Points Available</p>
                  <Button variant="secondary" size="sm" className="bg-white text-orange-600 hover:bg-yellow-50">
                    Redeem Points
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  <span>Order Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Orders</span>
                    <span className="text-sm font-medium">{stats.total_orders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-green-600">{stats.completed_orders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-sm font-medium">
                      {stats.total_orders > 0 ? Math.round((stats.completed_orders / stats.total_orders) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Basic Information</span>
                </CardTitle>
                <CardDescription>Your personal and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Delivery Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Food Preferences */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-blue-600" />
                  <span>Food Preferences</span>
                </CardTitle>
                <CardDescription>Your culinary preferences and dietary requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Favorite Cuisines</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.preferences.cuisine.map((cuisine, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                        {cuisine}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dietary">Dietary Restrictions</Label>
                    <Input
                      id="dietary"
                      value={formData.preferences.dietary.join(', ')}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="spice-level">Spice Level</Label>
                    <select
                      id="spice-level"
                      value={formData.preferences.spiceLevel}
                      onChange={(e) => handleNestedInputChange('preferences', 'spiceLevel', e.target.value)}
                      disabled={!isEditing}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="Mild">Mild</option>
                      <option value="Medium">Medium</option>
                      <option value="Hot">Hot</option>
                      <option value="Extra Hot">Extra Hot</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Favorite Restaurants */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-blue-600" />
                  <span>Favorite Restaurants</span>
                </CardTitle>
                <CardDescription>Your go-to restaurants and dining spots</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.favoriteRestaurants.map((restaurant, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Star className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="font-medium">{restaurant}</span>
                      </div>
                      <Button size="sm" variant="outline">
                        View Menu
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span>Payment Methods</span>
                </CardTitle>
                <CardDescription>Your saved payment options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{method.type}</p>
                          <p className="text-sm text-gray-500">
                            {method.type === 'Credit Card' ? method.last4 : method.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {method.isDefault && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Default
                          </Badge>
                        )}
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="order-updates">Order Updates</Label>
                      <p className="text-sm text-gray-500">Get notified about order status changes</p>
                    </div>
                    <input
                      type="checkbox"
                      id="order-updates"
                      checked={formData.notifications.orderUpdates}
                      onChange={(e) => handleNestedInputChange('notifications', 'orderUpdates', e.target.checked)}
                      disabled={!isEditing}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="promotions">Promotions & Offers</Label>
                      <p className="text-sm text-gray-500">Receive special deals and discounts</p>
                    </div>
                    <input
                      type="checkbox"
                      id="promotions"
                      checked={formData.notifications.promotions}
                      onChange={(e) => handleNestedInputChange('notifications', 'promotions', e.target.checked)}
                      disabled={!isEditing}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="new-restaurants">New Restaurants</Label>
                      <p className="text-sm text-gray-500">Be notified when new restaurants join</p>
                    </div>
                    <input
                      type="checkbox"
                      id="new-restaurants"
                      checked={formData.notifications.newRestaurants}
                      onChange={(e) => handleNestedInputChange('notifications', 'newRestaurants', e.target.checked)}
                      disabled={!isEditing}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="delivery-alerts">Delivery Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified when your order is out for delivery</p>
                    </div>
                    <input
                      type="checkbox"
                      id="delivery-alerts"
                      checked={formData.notifications.deliveryAlerts}
                      onChange={(e) => handleNestedInputChange('notifications', 'deliveryAlerts', e.target.checked)}
                      disabled={!isEditing}
                      className="rounded"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            {isEditing && (
              <Card className="border-none shadow-md bg-gradient-to-r from-blue-50 to-purple-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Save Changes</h3>
                      <p className="text-sm text-gray-600">Update your profile information</p>
                    </div>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
