import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X,
  Trash2,
  ShoppingBag,
  Heart,
  Star,
  AlertTriangle,
  Home,
  Camera
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import { toast } from "sonner";

// Types for customer profile data
interface CustomerProfile {
  delivery_address?: string;
  delivery_instructions?: string;
  favorite_cuisines?: string[];
  dietary_preferences?: string[];
}

interface UserData {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  username?: string;
  address?: string;
  role?: string;
  avatar?: string;
  createdAt?: string;
  // Customer profile fields
  delivery_address?: string;
  delivery_instructions?: string;
  favorite_cuisines?: string[];
  dietary_preferences?: string[];
}

interface CustomerStats {
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  total_spent: number;
  favorite_count: number;
}

const CustomerProfile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CustomerStats>({
    total_orders: 0,
    completed_orders: 0,
    pending_orders: 0,
    total_spent: 0,
    favorite_count: 0
  });
  
  const [profileData, setProfileData] = useState<UserData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    username: '',
    address: user?.address || '',
    avatar: user?.avatar || '',
    delivery_address: '',
    delivery_instructions: '',
    favorite_cuisines: [],
    dietary_preferences: []
  });

  useEffect(() => {
    fetchProfileData();
    fetchCustomerStats();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await userService.getUserProfile();
      if (response) {
        setProfileData(prev => ({
          ...prev,
          name: response.name || prev.name,
          email: response.email || prev.email,
          phone: response.phone || prev.phone,
          username: response.username || prev.username,
          address: response.address || prev.address,
          avatar: (response as any).avatar || prev.avatar,
          delivery_address: (response as any).delivery_address || prev.delivery_address,
          delivery_instructions: (response as any).delivery_instructions || prev.delivery_instructions,
          favorite_cuisines: (response as any).favorite_cuisines || prev.favorite_cuisines,
          dietary_preferences: (response as any).dietary_preferences || prev.dietary_preferences
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerStats = async () => {
    try {
      // Placeholder for actual API call
      // const statsData = await customerService.getCustomerStats();
      // setStats(statsData);
      
      // Mock data for now
      setStats({
        total_orders: 25,
        completed_orders: 23,
        pending_orders: 2,
        total_spent: 12500,
        favorite_count: 15
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await userService.updateUserProfile(profileData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    fetchProfileData(); // Reset to original data
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    try {
      await userService.deleteUserAccount();
      toast.success('Account deleted successfully');
      logout();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  const getCustomerLevel = (orderCount: number) => {
    if (orderCount >= 50) return { level: 'Diamond', color: 'bg-purple-500', icon: '💎' };
    if (orderCount >= 25) return { level: 'Gold', color: 'bg-yellow-500', icon: '🥇' };
    if (orderCount >= 10) return { level: 'Silver', color: 'bg-gray-400', icon: '🥈' };
    return { level: 'Bronze', color: 'bg-orange-400', icon: '🥉' };
  };

  const customerLevel = getCustomerLevel(stats.completed_orders);

  if (loading && !profileData.name) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                {/* Avatar */}
                <div className="relative mb-4">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                    <AvatarImage src={profileData.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-500 text-white text-4xl font-bold">
                      {profileData.name?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 p-2 bg-orange-500 rounded-full text-white hover:bg-orange-600 transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Name and Email */}
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{profileData.name}</h2>
                <p className="text-gray-600 mb-2 flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {profileData.email}
                </p>

                {/* Customer Level Badge */}
                <Badge className={`${customerLevel.color} text-white px-4 py-2 text-sm font-bold mb-4`}>
                  {customerLevel.icon} {customerLevel.level} Member
                </Badge>

                {/* Member Since */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Member since {new Date(profileData.createdAt || Date.now()).getFullYear()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-orange-500" />
                Your Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Orders</span>
                <span className="text-2xl font-bold text-gray-900">{stats.total_orders}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed</span>
                <span className="text-lg font-semibold text-green-600">{stats.completed_orders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="text-lg font-semibold text-orange-600">{stats.pending_orders}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Spent</span>
                <span className="text-xl font-bold text-orange-600">LKR {stats.total_spent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  Favorites
                </span>
                <span className="text-lg font-semibold text-red-600">{stats.favorite_count}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-orange-500" />
                Personal Information
              </CardTitle>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleCancelEdit} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} size="sm" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="+94 77 123 4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Primary Address</Label>
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  disabled={!isEditing}
                  placeholder="123 Main Street, Colombo"
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-orange-500" />
                Delivery Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="delivery_address">Default Delivery Address</Label>
                <Input
                  id="delivery_address"
                  value={profileData.delivery_address}
                  onChange={(e) => setProfileData({ ...profileData, delivery_address: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter your preferred delivery address"
                />
              </div>

              <div>
                <Label htmlFor="delivery_instructions">Delivery Instructions</Label>
                <Textarea
                  id="delivery_instructions"
                  value={profileData.delivery_instructions}
                  onChange={(e) => setProfileData({ ...profileData, delivery_instructions: e.target.value })}
                  disabled={!isEditing}
                  placeholder="E.g., Ring the bell twice, leave at door, call when arriving..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone Card */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Delete Account</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers, including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Order history</li>
                          <li>Saved addresses</li>
                          <li>Favorites</li>
                          <li>Personal information</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;

