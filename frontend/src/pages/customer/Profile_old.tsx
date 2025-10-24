import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Package,
  Clock,
  Users,
  Home,
  Camera,
  Plus,
  Trophy,
  TrendingUp,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import DeliveryAddressSelector from "@/components/delivery/DeliveryAddressSelector";
import { addressService, DeliveryAddress } from "@/services/addressService";
import { useNavigate } from "react-router-dom";

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
}

interface CustomerStats {
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  total_spent: number;
}

interface BulkOrder {
  bulk_order_id: string;
  order_number: string;
  status: string;
  total_amount: number;
  num_persons: number;
  event_date: string;
  event_time: string;
  created_at: string;
}

const CustomerProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [loadingBulkOrders, setLoadingBulkOrders] = useState(false);
  const [stats, setStats] = useState<CustomerStats>({
    total_orders: 0,
    completed_orders: 0,
    pending_orders: 0,
    total_spent: 0,
  });
  
  const [profileData, setProfileData] = useState<UserData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    username: '',
    address: user?.address || '',
    avatar: user?.avatar || '',
  });

  useEffect(() => {
    fetchProfileData();
    fetchCustomerStats();
    fetchAddresses();
    fetchBulkOrders();
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
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const fetchedAddresses = await addressService.getAddresses();
      setAddresses(fetchedAddresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const fetchBulkOrders = async () => {
    try {
      setLoadingBulkOrders(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/orders/customer-bulk-orders/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBulkOrders(data);
      }
    } catch (error) {
      console.error('Error fetching bulk orders:', error);
    } finally {
      setLoadingBulkOrders(false);
    }
  };

  const fetchCustomerStats = async () => {
    try {
      setStats({
        total_orders: 25,
        completed_orders: 23,
        pending_orders: 2,
        total_spent: 12500,
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
    fetchProfileData();
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
    if (orderCount >= 50) return { level: 'Diamond', color: 'from-purple-500 to-purple-600', icon: '💎' };
    if (orderCount >= 25) return { level: 'Gold', color: 'from-yellow-500 to-yellow-600', icon: '🥇' };
    if (orderCount >= 10) return { level: 'Silver', color: 'from-gray-400 to-gray-500', icon: '🥈' };
    return { level: 'Bronze', color: 'from-orange-400 to-orange-500', icon: '🥉' };
  };

  const customerLevel = getCustomerLevel(stats.completed_orders);

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      'completed': 'bg-emerald-100 text-emerald-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'confirmed': 'bg-blue-100 text-blue-700',
      'cancelled': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading && !profileData.name) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header with Avatar */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-red-500 text-white overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                  <AvatarImage src={profileData.avatar} />
                  <AvatarFallback className="bg-white text-orange-600 text-4xl font-bold">
                    {profileData.name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 p-3 bg-white rounded-full text-orange-600 hover:bg-orange-50 transition-colors shadow-lg">
                    <Camera className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{profileData.name}</h1>
                <p className="text-orange-100 flex items-center gap-2 justify-center md:justify-start mb-3">
                  <Mail className="h-4 w-4" />
                  {profileData.email}
                </p>
                <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap">
                  <Badge className={`bg-gradient-to-r ${customerLevel.color} text-white border-0 px-4 py-2`}>
                    {customerLevel.icon} {customerLevel.level} Member
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    <Calendar className="h-3 w-3 mr-1" />
                    Since {new Date(profileData.createdAt || Date.now()).getFullYear()}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleCancelEdit} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50" disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total_orders}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-emerald-600">{stats.completed_orders}</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.pending_orders}</p>
                </div>
                <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">LKR {stats.total_spent.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid bg-white dark:bg-gray-800 shadow-md">
            <TabsTrigger value="info" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <User className="h-4 w-4 mr-2" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="addresses" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <MapPin className="h-4 w-4 mr-2" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Package className="h-4 w-4 mr-2" />
              Bulk Orders
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="info" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      disabled={!isEditing}
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                      disabled={!isEditing}
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-gray-100 dark:bg-gray-900"
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="+94 77 123 4567"
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Primary Address</Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    disabled={!isEditing}
                    placeholder="123 Main Street, Colombo"
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-900 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Permanently delete your account and all data</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers.
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Addresses Tab */}
          <TabsContent value="addresses" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Delivery Addresses</CardTitle>
                    <CardDescription>Manage your saved delivery locations</CardDescription>
                  </div>
                  <Button 
                    onClick={() => setIsAddressDialogOpen(true)}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-2">No saved addresses</p>
                    <p className="text-sm text-gray-400 mb-4">Add your delivery addresses for faster checkout</p>
                    <Button 
                      onClick={() => setIsAddressDialogOpen(true)}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Address
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <Card 
                        key={address.id} 
                        className={`${address.is_default ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'hover:shadow-md'} transition-all`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Home className="h-4 w-4 text-orange-500" />
                                <h4 className="font-semibold">{address.label}</h4>
                                {address.is_default && (
                                  <Badge className="bg-orange-500 text-white text-xs">Default</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {address.address_line1}
                              </p>
                              {address.address_line2 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {address.address_line2}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {address.city}, {address.pincode}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>My Bulk Orders</CardTitle>
                <CardDescription>View all your bulk order history</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBulkOrders ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                  </div>
                ) : bulkOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-2">No bulk orders yet</p>
                    <p className="text-sm text-gray-400 mb-4">Place bulk orders for events and large gatherings</p>
                    <Button 
                      onClick={() => navigate('/menu')}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Browse Bulk Menus
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bulkOrders.map((bulkOrder) => (
                      <Card key={bulkOrder.bulk_order_id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4 flex-1">
                              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Users className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">Order #{bulkOrder.order_number}</h4>
                                  <Badge className={getStatusBadgeColor(bulkOrder.status)}>
                                    {bulkOrder.status.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{bulkOrder.num_persons} persons</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(bulkOrder.event_date).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{bulkOrder.event_time}</span>
                                  </div>
                                  <div className="font-semibold text-orange-600">
                                    LKR {bulkOrder.total_amount.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>

      {/* Address Management Dialog */}
      <DeliveryAddressSelector
        isOpen={isAddressDialogOpen}
        onClose={() => {
          setIsAddressDialogOpen(false);
          fetchAddresses();
        }}
        onAddressSelect={(address) => {
          console.log('Address selected:', address);
        }}
        showHeader={true}
      />
    </div>
  );
};

export default CustomerProfile;
