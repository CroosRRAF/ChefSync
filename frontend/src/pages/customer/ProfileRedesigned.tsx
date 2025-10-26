import { useState, useEffect, FC, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  ChevronRight,
  CreditCard,
  Bell
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import DeliveryAddressSelector from "@/components/delivery/DeliveryAddressSelector";
import { addressService, DeliveryAddress } from "@/services/addressService";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

// --- INTERFACES ---
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
}

// --- SKELETON LOADER ---
const ProfileSkeleton: FC = () => (
  <div className="min-h-screen bg-background p-4 md:p-8">
    <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-3 space-y-6">
        <Card><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
      <div className="lg:col-span-9 mt-6 lg:mt-0">
        <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
const CustomerProfileRedesigned = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  
  const [profileData, setProfileData] = useState<UserData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    username: '',
    avatar: user?.avatar || '',
    createdAt: new Date().toISOString(),
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await userService.getUserProfile();
        if (response) {
          setProfileData(prev => ({
            ...prev,
            name: response.name || prev.name,
            email: response.email || prev.email,
            phone: response.phone || prev.phone,
            username: response.username || prev.username,
            avatar: (response as any).avatar || prev.avatar,
            createdAt: (response as any).created_at || prev.createdAt,
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <ProfileSkeleton />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* --- LEFT SIDEBAR --- */}
          <div className="lg:col-span-3 space-y-6">
            <ProfileCard user={profileData} onLogout={handleLogout} />
            <NavigationMenu activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {/* --- RIGHT CONTENT --- */}
          <div className="lg:col-span-9 mt-6 lg:mt-0">
            <TabContent activeTab={activeTab} profileData={profileData} setProfileData={setProfileData} />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- CHILD COMPONENTS ---

const ProfileCard: FC<{ user: UserData, onLogout: () => void }> = ({ user, onLogout }) => (
  <Card className="shadow-sm">
    <CardContent className="p-6 flex flex-col items-center text-center">
      <Avatar className="h-24 w-24 mb-4 border-2 border-primary/50">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
          {user.name?.charAt(0).toUpperCase() || 'C'}
        </AvatarFallback>
      </Avatar>
      <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
      <p className="text-sm text-muted-foreground">{user.email}</p>
      <p className="text-xs text-muted-foreground mt-2">
        Member since {new Date(user.createdAt || Date.now()).getFullYear()}
      </p>
      <Button variant="ghost" size="sm" className="mt-4 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onLogout}>
        Log Out
      </Button>
    </CardContent>
  </Card>
);

const NavigationMenu: FC<{ activeTab: string, setActiveTab: (tab: string) => void }> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'profile', icon: User, label: 'My Profile' },
    { id: 'addresses', icon: MapPin, label: 'Addresses' },
    { id: 'orders', icon: Package, label: 'Bulk Orders' },
    { id: 'payments', icon: CreditCard, label: 'Payment Methods' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'security', icon: Shield, label: 'Security' },
  ];

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <nav className="space-y-1">
          {navItems.map(item => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
};

const TabContent: FC<{ activeTab: string, profileData: UserData, setProfileData: (data: UserData) => void }> = ({ activeTab, profileData, setProfileData }) => {
  switch (activeTab) {
    case 'profile': return <ProfileTab profileData={profileData} setProfileData={setProfileData} />;
    case 'addresses': return <AddressesTab />;
    case 'orders': return <BulkOrdersTab />;
    case 'security': return <SecurityTab />;
    case 'payments': return <ComingSoon title="Payment Methods" description="Manage your saved credit/debit cards and other payment options." />;
    case 'notifications': return <ComingSoon title="Notifications" description="Customize your email and push notification preferences." />;
    default: return null;
  }
};

const ProfileTab: FC<{ profileData: UserData, setProfileData: (data: UserData) => void }> = ({ profileData, setProfileData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await userService.updateUserProfile(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </div>
        {!isEditing ? (
          <Button variant="outline" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)}><X className="h-4 w-4 mr-2" />Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} disabled={!isEditing} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})} disabled={!isEditing} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profileData.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} disabled={!isEditing} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AddressesTab: FC = () => {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error("Failed to load addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Addresses</CardTitle>
            <CardDescription>Manage your saved delivery locations.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => setIsDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Add New</Button>
        </CardHeader>
        <CardContent>
          {loading ? <Loader2 className="mx-auto my-10 h-8 w-8 animate-spin text-primary" />
          : addresses.length === 0 ? (
            <EmptyState icon={MapPin} title="No Addresses Found" description="Add a new address to get started." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map(addr => (
                <Card key={addr.id} className={`relative ${addr.is_default ? 'border-primary' : ''}`}>
                  {addr.is_default && <Badge className="absolute -top-2 -right-2">Default</Badge>}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {addr.label.toLowerCase() === 'home' ? <Home className="h-4 w-4" /> : <Building className="h-4 w-4" />}
                      {addr.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{addr.address_line1}</p>
                    <p className="text-sm text-muted-foreground">{addr.city}, {addr.pincode}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <DeliveryAddressSelector
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); fetchAddresses(); }}
        onAddressSelect={() => {}}
        showHeader={true}
      />
    </>
  );
};

const BulkOrdersTab: FC = () => {
  const [orders, setOrders] = useState<BulkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/orders/customer-bulk-orders/', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) setOrders(await response.json());
      } catch (error) {
        console.error("Failed to load bulk orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Bulk Orders</CardTitle>
          <CardDescription>History of your orders for events and gatherings.</CardDescription>
        </div>
        <Button variant="outline" onClick={() => navigate('/menu')}><ShoppingBag className="h-4 w-4 mr-2" />Place New Order</Button>
      </CardHeader>
      <CardContent>
        {loading ? <Loader2 className="mx-auto my-10 h-8 w-8 animate-spin text-primary" />
        : orders.length === 0 ? (
          <EmptyState icon={Package} title="No Bulk Orders" description="Your placed bulk orders will appear here." />
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.bulk_order_id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-semibold">Order #{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.event_date).toLocaleDateString()} for {order.num_persons} people
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">LKR {order.total_amount.toLocaleString()}</p>
                  <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SecurityTab: FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { logout } = useAuth();

  const handleDeleteAccount = async () => {
    try {
      await userService.deleteUserAccount();
      logout();
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password for better security.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2 relative">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type={showPassword ? "text" : "password"} />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-muted-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          <Button><Key className="h-4 w-4 mr-2" />Update Password</Button>
        </CardContent>
      </Card>
      <Card className="shadow-sm border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>This action is permanent and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" />Delete My Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and remove your data from our servers.
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
    </div>
  );
};

const EmptyState: FC<{ icon: React.ElementType, title: string, description: string }> = ({ icon: Icon, title, description }) => (
  <div className="text-center py-12 border-2 border-dashed rounded-lg">
    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const ComingSoon: FC<{ title: string, description: string }> = ({ title, description }) => (
    <Card className="shadow-sm">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <EmptyState icon={Lock} title="Feature Coming Soon" description="We're working hard to bring this feature to you." />
        </CardContent>
    </Card>
);

export default CustomerProfileRedesigned;
