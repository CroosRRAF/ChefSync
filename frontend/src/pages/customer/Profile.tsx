import { useState, useEffect, FC } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Users,
  Home,
  Camera,
  Plus,
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Building,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import DeliveryAddressSelector from "@/components/delivery/DeliveryAddressSelector";
import { addressService, DeliveryAddress } from "@/services/addressService";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { customerService, CustomerStats, Order } from "@/services/customerService";

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

const ProfileSkeleton: FC = () => (
  <div className="min-h-screen bg-background p-4 md:p-8">
    <div className="max-w-7xl mx-auto space-y-8">
      <Card className="overflow-hidden">
        <Skeleton className="h-48 w-full bg-muted" />
        <CardContent className="p-6 pt-0">
          <div className="flex items-end -mt-16">
            <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
            <div className="ml-4 mb-4 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <Card key={i} className="p-6"><Skeleton className="h-20 w-full" /></Card>)}
      </div>
      <Card className="p-6">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Skeleton className="h-64 w-full" />
      </Card>
    </div>
  </div>
);

const CustomerProfileNew = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [regularOrders, setRegularOrders] = useState<Order[]>([]);
  const [loadingBulkOrders, setLoadingBulkOrders] = useState(false);
  const [loadingRegularOrders, setLoadingRegularOrders] = useState(false);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [profileData, setProfileData] = useState<UserData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    username: '',
    address: user?.address || '',
    avatar: user?.avatar || '',
    createdAt: new Date().toISOString(),
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchProfileData(),
          fetchCustomerStats(),
          fetchAddresses(),
          fetchBulkOrders(),
          fetchRegularOrders(),
        ]);
      } catch (error) {
        console.error("Failed to fetch profile data", error);
        toast.error("Could not load your profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchProfileData = async () => {
    try {
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
          createdAt: (response as any).created_at || prev.createdAt,
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
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
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) setBulkOrders(await response.json());
    } catch (error) {
      console.error('Error fetching bulk orders:', error);
    } finally {
      setLoadingBulkOrders(false);
    }
  };

  const fetchRegularOrders = async () => {
    try {
      setLoadingRegularOrders(true);
      const fetchedOrders = await customerService.getCustomerOrders();
      setRegularOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching regular orders:', error);
    } finally {
      setLoadingRegularOrders(false);
    }
  };

  const fetchCustomerStats = async () => {
    try {
      const stats = await customerService.getCustomerStats();
      setStats(stats);
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

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Profile Header */}
        <Card className="overflow-hidden shadow-lg">
          <div className="h-48 bg-gradient-to-r from-primary to-destructive" />
          <CardContent className="p-6 pt-0">
            <div className="flex items-end -mt-16">
              <div className="relative group">
                <Avatar className="h-32 w-32 rounded-full border-4 border-background shadow-lg">
                  <AvatarImage src={profileData.avatar} alt={profileData.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
                    {profileData.name?.charAt(0).toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-3 bg-background/80 rounded-full text-foreground hover:bg-background">
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="ml-4 mb-4 flex-1">
                <h1 className="text-3xl font-bold text-foreground">{profileData.name}</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profileData.email}
                </p>
              </div>

              <div className="flex gap-2 mb-4">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleCancelEdit} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={loading}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={ShoppingBag} title="Total Orders" value={stats?.total_orders || 0} color="blue" />
          <StatCard icon={Package} title="Completed" value={stats?.completed_orders || 0} color="emerald" />
          <StatCard icon={Users} title="Bulk Orders" value={bulkOrders.length} color="purple" />
          <StatCard icon={Calendar} title="Member Since" value={new Date(profileData.createdAt || Date.now()).getFullYear()} color="amber" />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="info"><User className="h-4 w-4 mr-2" />Personal Info</TabsTrigger>
            <TabsTrigger value="addresses"><MapPin className="h-4 w-4 mr-2" />Addresses</TabsTrigger>
            <TabsTrigger value="regular-orders"><ShoppingBag className="h-4 w-4 mr-2" />Regular Orders</TabsTrigger>
            <TabsTrigger value="bulk-orders"><Package className="h-4 w-4 mr-2" />Bulk Orders</TabsTrigger>
            <TabsTrigger value="security"><Shield className="h-4 w-4 mr-2" />Security</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Manage your personal details and contact information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field icon={User} label="Full Name" id="name" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} disabled={!isEditing} />
                  <Field icon={User} label="Username" id="username" value={profileData.username} onChange={(e) => setProfileData({ ...profileData, username: e.target.value })} disabled={!isEditing} />
                  <Field icon={Mail} label="Email Address" id="email" type="email" value={profileData.email} disabled={true} description="Email cannot be changed." />
                  <Field icon={Phone} label="Phone Number" id="phone" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} disabled={!isEditing} placeholder="+94 77 123 4567" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Delivery Addresses</CardTitle>
                  <CardDescription>Manage your saved delivery locations for faster checkout.</CardDescription>
                </div>
                <Button onClick={() => setIsAddressDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <EmptyState icon={MapPin} title="No Saved Addresses" description="Add a delivery address to get started." buttonText="Add Address" onClick={() => setIsAddressDialogOpen(true)} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => <AddressCard key={address.id} address={address} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Regular Orders Tab */}
          <TabsContent value="regular-orders">
            <Card>
              <CardHeader>
                <CardTitle>My Regular Orders</CardTitle>
                <CardDescription>View your history of individual meal orders.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRegularOrders ? (
                  <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
                ) : regularOrders.length === 0 ? (
                  <EmptyState icon={ShoppingBag} title="No Regular Orders Yet" description="Your food orders will appear here." buttonText="Browse Menu" onClick={() => navigate('/menu')} />
                ) : (
                  <div className="space-y-3">
                    {regularOrders.map((order) => <OrderRow key={order.id} order={order} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Orders Tab */}
          <TabsContent value="bulk-orders">
            <Card>
              <CardHeader>
                <CardTitle>My Bulk Orders</CardTitle>
                <CardDescription>View your history of orders for events and large gatherings.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBulkOrders ? <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
                : bulkOrders.length === 0 ? (
                  <EmptyState icon={Users} title="No Bulk Orders Yet" description="Planning an event? Place a bulk order with us!" buttonText="Browse Bulk Menus" onClick={() => navigate('/menu')} />
                ) : (
                  <div className="space-y-3">
                    {bulkOrders.map((order) => <BulkOrderRow key={order.bulk_order_id} order={order} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>For your security, we recommend using a strong, unique password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2 relative">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type={showPassword ? "text" : "password"} placeholder="••••••••" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" placeholder="••••••••" />
                </div>
                <Button>
                  <Key className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Delete Account
                </CardTitle>
                <CardDescription>Permanently delete your account and all associated data. This action cannot be undone.</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete My Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account, orders, and all other data. This action is irreversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <DeliveryAddressSelector
        isOpen={isAddressDialogOpen}
        onClose={() => { setIsAddressDialogOpen(false); fetchAddresses(); }}
        onAddressSelect={(address) => console.log('Address selected:', address)}
        showHeader={true}
      />
    </div>
  );
};

// Helper Components
const StatCard: FC<{ icon: React.ElementType; title: string; value: string | number; color: 'blue' | 'emerald' | 'purple' | 'amber' }> = ({ icon: Icon, title, value, color }) => {
  const colorClasses = {
    blue: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
    emerald: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30',
    purple: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
    amber: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
  };
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const Field: FC<{icon: React.ElementType, label: string, id: string, value?: string, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled?: boolean, type?: string, placeholder?: string, description?: string}> = 
({ icon: Icon, label, id, description, ...props }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      {label}
    </Label>
    <Input id={id} {...props} className="bg-background" />
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
  </div>
);

const AddressCard: FC<{ address: DeliveryAddress }> = ({ address }) => (
  <Card className={`${address.is_default ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'} transition-all`}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {address.label.toLowerCase() === 'home' ? <Home className="h-4 w-4 text-primary" /> : <Building className="h-4 w-4 text-primary" />}
            <h4 className="font-semibold">{address.label}</h4>
            {address.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{address.address_line1}, {address.city}, {address.pincode}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

const BulkOrderRow: FC<{ order: BulkOrder }> = ({ order }) => {
  const getStatusColor = (status: string) => ({
    'completed': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'confirmed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  }[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300');

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
        <Users className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">Order #{order.order_number}</p>
        <p className="text-sm text-muted-foreground">{new Date(order.event_date).toLocaleDateString()}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-foreground">LKR {Math.round(order.total_amount)}</p>
        <Badge className={`${getStatusColor(order.status)} text-xs font-medium`}>{order.status.replace('_', ' ')}</Badge>
      </div>
    </div>
  );
};

const EmptyState: FC<{ icon: React.ElementType, title: string, description: string, buttonText: string, onClick: () => void }> = ({ icon: Icon, title, description, buttonText, onClick }) => (
  <div className="text-center py-10 border-2 border-dashed rounded-lg">
    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    <p className="text-muted-foreground mb-4">{description}</p>
    <Button onClick={onClick} variant="outline">{buttonText}</Button>
  </div>
);

const OrderRow: FC<{ order: Order }> = ({ order }) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'delivered': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      'preparing': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      'out_for_delivery': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      'ready': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">Order #{order.order_number}</p>
        <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-foreground">LKR {Math.round(order.total_amount)}</p>
        <Badge className={`${getStatusColor(order.status)} text-xs font-medium`}>{order.status.replace(/_/g, ' ')}</Badge>
      </div>
    </div>
  );
};

export default CustomerProfileNew;
