import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  Users, 
  Clock, 
  DollarSign, 
  Calendar as CalendarIcon, 
  ChefHat, 
  ShoppingCart,
  Info,
  Check,
  X,
  Sparkles,
  Package,
  MapPin,
  Navigation,
  Plus,
  Edit2,
  Trash2,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GoogleMapsAddressPicker from '@/components/checkout/GoogleMapsAddressPicker';
import { DeliveryAddress, addressService } from '@/services/addressService';
import FoodInfoPopup from '@/components/menu/FoodInfoPopup';

// Types
interface BulkMenu {
  id: number;
  chef: number;
  chef_name: string;
  meal_type: string;
  meal_type_display: string;
  menu_name: string;
  description: string;
  base_price_per_person: number;
  availability_status: boolean;
  approval_status: string;
  min_persons: number;
  max_persons: number;
  advance_notice_hours: number;
  image_url?: string;
  thumbnail_url?: string;
  items_count: number;
  menu_items_summary: {
    mandatory_items: string[];
    optional_items: string[];
    total_items: number;
  };
  items: BulkMenuItem[];
}

interface BulkMenuItem {
  id: number;
  item_name: string;
  description: string;
  is_optional: boolean;
  extra_cost: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  spice_level: string;
}

interface OrderFormData {
  menu_id: number;
  num_persons: number;
  event_date: Date | undefined;
  event_time: string;
  order_type: 'delivery' | 'pickup';
  delivery_address: string;
  special_instructions: string;
  selected_optional_items: number[];
  delivery_fee: number;
  distance_km?: number;
}

interface UserBulkOrder {
  bulk_order_id: string;
  order_number: string;
  status: string;
  total_amount: number;
  num_persons: number;
  event_date: string;
  event_time: string;
  menu_name?: string;
  created_at: string;
  
  // Customer info
  customer_id: number;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  
  // Chef info
  chef_id?: number;
  chef?: {
    id: number;
    name: string;
    email: string;
  };
  
  // Delivery agent info
  delivery_partner_id?: number;
  delivery_partner?: {
    id: number;
    name: string;
    email: string;
  };
  
  // Delivery location
  delivery_address?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  distance_km?: number;
  
  // Order details
  order_type: string;
  delivery_fee: number;
  
  // Full order details (kept for backward compatibility)
  order_details?: {
    id: number;
    order_number: string;
    delivery_address: string;
    delivery_fee: number;
    order_type: string;
    customer: {
      id: number;
      name: string;
      email: string;
    };
    chef: {
      id: number;
      name: string;
    };
  };
}

const CustomerBulkOrderDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [bulkMenus, setBulkMenus] = useState<BulkMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [isAiSearchActive, setIsAiSearchActive] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [selectedMenu, setSelectedMenu] = useState<BulkMenu | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isAddressPickerOpen, setIsAddressPickerOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  
  // User's bulk orders state
  const [userBulkOrders, setUserBulkOrders] = useState<UserBulkOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  
  // AI Food Info popup state
  const [showAIFoodInfo, setShowAIFoodInfo] = useState(false);
  const [aiFoodName, setAIFoodName] = useState('');
  const [aiFoodDescription, setAIFoodDescription] = useState('');
  const [aiFoodImage, setAIFoodImage] = useState('');
  
  // Order form state
  const [orderForm, setOrderForm] = useState<OrderFormData>({
    menu_id: 0,
    num_persons: 10,
    event_date: undefined,
    event_time: '',
    order_type: 'delivery',
    delivery_address: '',
    special_instructions: '',
    selected_optional_items: [],
    delivery_fee: 0,
    distance_km: 0,
  });

  const mealTypes = [
    { value: 'all', label: 'All Menus' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snacks', label: 'Snacks' },
  ];

  useEffect(() => {
    fetchBulkMenus();
    loadAddresses();
    fetchUserBulkOrders();
  }, []);

  const fetchUserBulkOrders = async () => {
    try {
      setLoadingOrders(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/orders/customer-bulk-orders/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserBulkOrders(data);
        console.log('User bulk orders loaded:', data);
      } else {
        console.error('Failed to fetch user bulk orders');
      }
    } catch (error) {
      console.error('Error fetching user bulk orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const fetchedAddresses = await addressService.getAddresses();
      setAddresses(fetchedAddresses);
      
      // Set default address if available
      const defaultAddr = fetchedAddresses.find(addr => addr.is_default) || fetchedAddresses[0] || null;
      if (defaultAddr) {
        setSelectedAddress(defaultAddr);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load saved addresses');
    }
  };

  const fetchBulkMenus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Debug: Log the request
      console.log('Fetching bulk menus from /api/food/bulk-menus/');
      
      const response = await fetch('/api/food/bulk-menus/', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      
      // Debug: Log response status
      console.log('Bulk menus response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Bulk menus raw data:', data);
        
        // Handle both paginated and non-paginated responses
        const allMenus = Array.isArray(data) ? data : (data.results || []);
        
        console.log('Total menus fetched:', allMenus.length);
        
        // Filter to only show approved and available menus
        const availableMenus = allMenus.filter(
          (menu: BulkMenu) => {
            console.log(`Menu "${menu.menu_name}": approved=${menu.approval_status}, available=${menu.availability_status}`);
            return menu.approval_status === 'approved' && menu.availability_status;
          }
        );
        
        console.log('Available menus after filtering:', availableMenus.length);
        setBulkMenus(availableMenus);
        
        if (availableMenus.length === 0 && allMenus.length > 0) {
          toast.info('Some menus are pending approval or unavailable');
        }
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        toast.error(`Failed to fetch bulk menus: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching bulk menus:', error);
      toast.error('Error loading bulk menus. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async (menuId: number): Promise<BulkMenuItem[]> => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/food/bulk-menu-items/?bulk_menu__id=${menuId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.results || data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }
  };

  const handleViewDetails = async (menu: BulkMenu) => {
    const items = await fetchMenuItems(menu.id);
    setSelectedMenu({ ...menu, items });
    setIsDetailsDialogOpen(true);
  };

  const handleOrderClick = async (menu: BulkMenu) => {
    if (!isAuthenticated) {
      toast.error('Please login to place a bulk order');
      navigate('/auth/login');
      return;
    }

    const items = await fetchMenuItems(menu.id);
    setSelectedMenu({ ...menu, items });
    
    // Use previously selected address if available, otherwise reset
    const address = selectedAddress ? selectedAddress : null;
    const addressText = address ? [
      address.address_line1,
      address.address_line2,
      `${address.city}, ${address.pincode}`
    ].filter(Boolean).join(', ') : '';
    
    setOrderForm({
      menu_id: menu.id,
      num_persons: menu.min_persons,
      event_date: undefined,
      event_time: '',
      order_type: 'delivery',
      delivery_address: addressText,
      special_instructions: '',
      selected_optional_items: [],
      delivery_fee: address ? 300 : 0, // Default base fee if address selected
      distance_km: address ? 5 : 0,
    });
    setIsOrderDialogOpen(true);
  };

  const handleAIInfoClick = (menu: BulkMenu) => {
    setAIFoodName(menu.menu_name);
    setAIFoodDescription(menu.description);
    setAIFoodImage(menu.image_url || menu.thumbnail_url || '');
    setShowAIFoodInfo(true);
  };

  const calculateTotalCost = (): number => {
    if (!selectedMenu) return 0;
    
    let baseTotal = selectedMenu.base_price_per_person * orderForm.num_persons;
    
    // Add optional item costs
    const optionalCosts = selectedMenu.items
      .filter(item => orderForm.selected_optional_items.includes(item.id))
      .reduce((sum, item) => sum + (item.extra_cost * orderForm.num_persons), 0);
    
    // Add delivery fee if delivery order
    const deliveryFee = orderForm.order_type === 'delivery' ? orderForm.delivery_fee : 0;
    
    return baseTotal + optionalCosts + deliveryFee;
  };

  const handleSubmitOrder = async () => {
    // Validation
    console.log('📝 Starting order submission...');
    console.log('Order form data:', orderForm);
    console.log('Selected address:', selectedAddress);
    
    if (!orderForm.event_date || !orderForm.event_time) {
      toast.error('Please fill in event date and time');
      return;
    }

    // Check if we have either a selected address or manual entry (only for delivery)
    if (orderForm.order_type === 'delivery') {
      const hasAddress = (selectedAddress && selectedAddress.address_line1) || 
                         (orderForm.delivery_address && orderForm.delivery_address.trim().length > 0);
      
      if (!hasAddress) {
        toast.error('Please select an address from the map or enter a delivery address manually');
        return;
      }
    }

    // Use selected address if available, otherwise use manual entry
    const finalAddress = selectedAddress ? 
      [
        selectedAddress.address_line1,
        selectedAddress.address_line2,
        `${selectedAddress.city}, ${selectedAddress.pincode}`
      ].filter(Boolean).join(', ') : 
      orderForm.delivery_address;

    // Check advance notice requirement
    if (selectedMenu) {
      const eventDateTime = new Date(orderForm.event_date);
      const [hours, minutes] = orderForm.event_time.split(':');
      eventDateTime.setHours(parseInt(hours), parseInt(minutes));
      
      const hoursUntilEvent = (eventDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
      
      console.log(`⏰ Hours until event: ${hoursUntilEvent.toFixed(1)}, Required: ${selectedMenu.advance_notice_hours}`);
      
      if (hoursUntilEvent < selectedMenu.advance_notice_hours) {
        toast.error(`This menu requires ${selectedMenu.advance_notice_hours} hours advance notice`);
        return;
      }
    }

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        toast.error('Please login to place an order');
        console.error('❌ No authentication token found');
        navigate('/login');
        return;
      }
      
      const orderData = {
        bulk_menu_id: orderForm.menu_id,
        num_persons: orderForm.num_persons,
        event_date: format(orderForm.event_date, 'yyyy-MM-dd'),
        event_time: orderForm.event_time,
        order_type: orderForm.order_type,
        delivery_address: orderForm.order_type === 'delivery' ? finalAddress : 'Pickup', // Use the validated final address
        delivery_address_id: selectedAddress?.id,
        delivery_latitude: selectedAddress?.latitude,
        delivery_longitude: selectedAddress?.longitude,
        delivery_fee: orderForm.order_type === 'delivery' ? orderForm.delivery_fee : 0,
        distance_km: orderForm.distance_km,
        special_instructions: orderForm.special_instructions || '',
        selected_optional_items: orderForm.selected_optional_items,
        total_amount: calculateTotalCost(),
      };

      console.log('📤 Sending order data:', orderData);
      console.log('🔑 Authorization token present:', !!token);

      const response = await fetch('/api/orders/customer-bulk-orders/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response OK:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Order placed successfully:', responseData);
        toast.success('Bulk order placed successfully!');
        setIsOrderDialogOpen(false);
        navigate('/customer/orders');
      } else {
        const errorData = await response.json();
        console.error('❌ Order failed:', errorData);
        
        // Handle specific error types
        if (response.status === 401) {
          toast.error('Please login to place an order');
          navigate('/login');
        } else if (response.status === 403) {
          toast.error('You do not have permission to place this order');
        } else if (response.status === 400) {
          // Validation errors
          const errorMessage = errorData.error || errorData.message || 'Invalid order data';
          if (typeof errorData === 'object' && !errorData.error && !errorData.message) {
            // Field-specific errors
            const errors = Object.entries(errorData)
              .map(([field, msg]) => `${field}: ${msg}`)
              .join(', ');
            toast.error(`Validation errors: ${errors}`);
          } else {
            toast.error(errorMessage);
          }
        } else {
          toast.error(errorData.error || errorData.message || 'Failed to place order');
        }
      }
    } catch (error) {
      console.error('💥 Exception during order placement:', error);
      toast.error('Network error. Please check your connection and try again.');
    }
  };

  const toggleOptionalItem = (itemId: number) => {
    setOrderForm(prev => ({
      ...prev,
      selected_optional_items: prev.selected_optional_items.includes(itemId)
        ? prev.selected_optional_items.filter(id => id !== itemId)
        : [...prev.selected_optional_items, itemId]
    }));
  };

  const handleAddressSaved = async (address: DeliveryAddress) => {
    console.log('📍 Address saved/updated:', address);
    
    // Reload addresses to get the updated list
    await loadAddresses();
    
    // Set the newly saved/edited address as selected
    setSelectedAddress(address);
    
    // Calculate delivery fee based on distance if we have chef's location
    let deliveryFee = 0;
    let distanceKm = 0;
    
    if (selectedMenu && address.latitude && address.longitude) {
      // For bulk orders, we need chef's kitchen location
      // This would need to be fetched from the menu/chef data
      // For now, we'll use a default calculation
      // You may need to update this based on where chef location is stored
      
      // Simple calculation: LKR 300 within 5 km, LKR 100 per km after
      // Since we don't have chef location here, we'll calculate when backend processes
      // For now, set a default
      deliveryFee = 300; // Base fee
      distanceKm = 5; // Assume within 5 km for now
    }
    
    // Format address for the order form
    const fullAddress = [
      address.address_line1,
      address.address_line2,
      `${address.city}, ${address.pincode}`
    ].filter(Boolean).join(', ');
    
    setOrderForm(prev => ({
      ...prev,
      delivery_address: fullAddress,
      delivery_fee: deliveryFee,
      distance_km: distanceKm
    }));
    
    setIsAddressPickerOpen(false);
    setEditingAddress(null);
    toast.success(`Address ${editingAddress ? 'updated' : 'added'} successfully!`);
  };

  const handleSelectExistingAddress = (address: DeliveryAddress) => {
    setSelectedAddress(address);
    
    // Calculate delivery fee
    const deliveryFee = 300; // Base fee
    const distanceKm = 5; // Default
    
    const fullAddress = [
      address.address_line1,
      address.address_line2,
      `${address.city}, ${address.pincode}`
    ].filter(Boolean).join(', ');
    
    setOrderForm(prev => ({
      ...prev,
      delivery_address: fullAddress,
      delivery_fee: deliveryFee,
      distance_km: distanceKm
    }));
    
    toast.success(`Selected: ${address.label}`);
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      await addressService.deleteAddress(addressId);
      await loadAddresses();
      if (selectedAddress?.id === addressId) {
        setSelectedAddress(null);
        setOrderForm(prev => ({ ...prev, delivery_address: '', delivery_fee: 0, distance_km: 0 }));
      }
      toast.success('Address deleted successfully');
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  // AI-powered search function
  const handleAiSearch = async () => {
    if (!aiSearchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    setAiSearching(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/orders/customer-bulk-orders/ai-search/', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: aiSearchQuery,
          meal_type: selectedMealType !== 'all' ? selectedMealType : undefined
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setBulkMenus(data.menus);
        setIsAiSearchActive(true);
        toast.success(`Found ${data.total_results} menu(s) ${data.ai_powered ? '✨ with AI' : ''}`);
      } else {
        toast.error('AI search failed');
      }
    } catch (error) {
      console.error('AI search error:', error);
      toast.error('Failed to perform AI search');
    } finally {
      setAiSearching(false);
    }
  };

  // Reset to normal view
  const handleClearAiSearch = () => {
    setAiSearchQuery('');
    setIsAiSearchActive(false);
    fetchBulkMenus();
  };

  const filteredMenus = bulkMenus
    .filter(menu => selectedMealType === 'all' || menu.meal_type === selectedMealType)
    .filter(menu => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        menu.menu_name.toLowerCase().includes(searchLower) ||
        menu.description.toLowerCase().includes(searchLower) ||
        menu.chef_name.toLowerCase().includes(searchLower)
      );
    });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="h-8 w-8 text-orange-500" />
            Bulk Orders
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Browse menus or view your bulk order history
          </p>
        </div>
      </div>

      {/* Main Tabs: Browse Menus vs My Orders */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Browse Menus
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            My Orders ({userBulkOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* Browse Menus Tab */}
        <TabsContent value="browse" className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="space-y-4">
        {/* AI Search Section */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">AI-Powered Smart Search</h3>
              {isAiSearchActive && (
                <Badge className="bg-purple-600 text-white">Active</Badge>
              )}
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
              Ask in natural language: "vegetarian food for wedding", "healthy breakfast for 50 people", "spicy dinner menu"
            </p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Try: 'healthy vegetarian food for corporate event'..."
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                  className="pl-9 border-purple-300 focus:border-purple-500"
                  disabled={aiSearching}
                />
              </div>
              <Button 
                onClick={handleAiSearch}
                disabled={aiSearching || !aiSearchQuery.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                {aiSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Search
                  </>
                )}
              </Button>
              {isAiSearchActive && (
                <Button 
                  onClick={handleClearAiSearch}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Traditional Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Or use traditional search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={isAiSearchActive}
            />
          </div>
        </div>
      </div>

      {/* Meal Type Tabs */}
      <Tabs value={selectedMealType} onValueChange={setSelectedMealType}>
        <TabsList className="grid w-full grid-cols-5">
          {mealTypes.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedMealType} className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading bulk menus...</p>
            </div>
          ) : filteredMenus.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No bulk menus available</p>
                <p className="text-gray-500 text-sm mt-2">
                  {searchTerm ? 'Try a different search term' : 'Check back later for new options'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenus.map((menu) => (
                <BulkMenuCard
                  key={menu.id}
                  menu={menu}
                  onViewDetails={handleViewDetails}
                  onOrder={handleOrderClick}
                  onAIInfo={handleAIInfoClick}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedMenu?.menu_name}</DialogTitle>
            <DialogDescription>
              {selectedMenu?.meal_type_display} by Chef {selectedMenu?.chef_name}
            </DialogDescription>
          </DialogHeader>

          {selectedMenu && (
            <div className="space-y-6">
              {/* Menu Image */}
              {selectedMenu.image_url && (
                <img
                  src={selectedMenu.image_url}
                  alt={selectedMenu.menu_name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              {/* Description */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedMenu.description}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">Base Price</p>
                    <p className="font-semibold">Rs.{selectedMenu.base_price_per_person}/person</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">Capacity</p>
                    <p className="font-semibold">{selectedMenu.min_persons}-{selectedMenu.max_persons} persons</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">Advance Notice</p>
                    <p className="font-semibold">{selectedMenu.advance_notice_hours} hours</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">Total Items</p>
                    <p className="font-semibold">{selectedMenu.items_count} items</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Menu Items</h3>
                
                {/* Mandatory Items */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Included Items</h4>
                  <div className="space-y-2">
                    {selectedMenu.items.filter(item => !item.is_optional).map((item) => (
                      <div key={item.id} className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium">{item.item_name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                          )}
                          <div className="flex gap-2 mt-1">
                            {item.is_vegetarian && (
                              <Badge variant="outline" className="text-xs">Vegetarian</Badge>
                            )}
                            {item.is_vegan && (
                              <Badge variant="outline" className="text-xs">Vegan</Badge>
                            )}
                            {item.is_gluten_free && (
                              <Badge variant="outline" className="text-xs">Gluten Free</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Items */}
                {selectedMenu.items.some(item => item.is_optional) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Optional Add-ons</h4>
                    <div className="space-y-2">
                      {selectedMenu.items.filter(item => item.is_optional).map((item) => (
                        <div key={item.id} className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <Sparkles className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{item.item_name}</p>
                              <p className="text-orange-600 font-semibold">+Rs.{item.extra_cost}/person</p>
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                setIsDetailsDialogOpen(false);
                if (selectedMenu) handleOrderClick(selectedMenu);
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Order Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Place Bulk Order</DialogTitle>
            <DialogDescription>
              {selectedMenu?.menu_name} - Rs.{selectedMenu?.base_price_per_person}/person
            </DialogDescription>
          </DialogHeader>

          {selectedMenu && (
            <div className="space-y-6">
              {/* Number of Persons */}
              <div>
                <Label htmlFor="num_persons">Number of Persons *</Label>
                <Input
                  id="num_persons"
                  type="number"
                  min={selectedMenu.min_persons}
                  max={selectedMenu.max_persons}
                  value={orderForm.num_persons}
                  onChange={(e) => setOrderForm({ ...orderForm, num_persons: parseInt(e.target.value) })}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Min: {selectedMenu.min_persons}, Max: {selectedMenu.max_persons}
                </p>
              </div>

              {/* Event Date */}
              <div>
                <Label>Event Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-1"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {orderForm.event_date ? format(orderForm.event_date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={orderForm.event_date}
                      onSelect={(date) => setOrderForm({ ...orderForm, event_date: date })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Event Time */}
              <div>
                <Label htmlFor="event_time">Event Time *</Label>
                <Input
                  id="event_time"
                  type="time"
                  value={orderForm.event_time}
                  onChange={(e) => setOrderForm({ ...orderForm, event_time: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Order Type Toggle */}
              <div className="space-y-2">
                <Label>Order Type *</Label>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setOrderForm({ ...orderForm, order_type: 'delivery', delivery_fee: selectedAddress ? 300 : 0 })}
                    className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                      orderForm.order_type === 'delivery'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border'
                    }`}
                  >
                    🚚 Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderForm({ ...orderForm, order_type: 'pickup', delivery_fee: 0, delivery_address: '' })}
                    className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                      orderForm.order_type === 'pickup'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border'
                    }`}
                  >
                    📦 Pickup
                  </button>
                </div>
              </div>

              {/* Delivery Address - Only show for delivery orders */}
              {orderForm.order_type === 'delivery' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Delivery Address *</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingAddress(null);
                      setIsAddressPickerOpen(true);
                    }}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add New Address
                  </Button>
                </div>

                {/* Saved Addresses List */}
                {addresses.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {addresses.map((address) => (
                      <Card 
                        key={address.id}
                        className={`cursor-pointer transition-all ${
                          selectedAddress?.id === address.id
                            ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => handleSelectExistingAddress(address)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="h-4 w-4 text-orange-500" />
                                <span className="font-medium text-sm">{address.label}</span>
                                {address.is_default && (
                                  <Badge variant="secondary" className="text-xs">Default</Badge>
                                )}
                                {selectedAddress?.id === address.id && (
                                  <Check className="h-4 w-4 text-green-600 ml-auto" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                {address.address_line1}
                              </p>
                              {address.address_line2 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {address.address_line2}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {address.city}, {address.pincode}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingAddress(address);
                                  setIsAddressPickerOpen(true);
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Delete this address?')) {
                                    handleDeleteAddress(address.id);
                                  }
                                }}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed rounded-lg">
                    <MapPin className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-3">No saved addresses yet</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setEditingAddress(null);
                        setIsAddressPickerOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Your First Address
                    </Button>
                  </div>
                )}
              </div>
              )}

              {/* Optional Items */}
              {selectedMenu.items.some(item => item.is_optional) && (
                <div>
                  <Label className="mb-3 block">Optional Add-ons</Label>
                  <div className="space-y-2">
                    {selectedMenu.items.filter(item => item.is_optional).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={orderForm.selected_optional_items.includes(item.id)}
                            onCheckedChange={() => toggleOptionalItem(item.id)}
                          />
                          <div>
                            <p className="font-medium">{item.item_name}</p>
                            <p className="text-sm text-gray-500">+Rs.{item.extra_cost}/person</p>
                          </div>
                        </div>
                        {orderForm.selected_optional_items.includes(item.id) && (
                          <Badge className="bg-orange-500">
                            +Rs.{item.extra_cost * orderForm.num_persons}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <Label htmlFor="special_instructions">Special Instructions (Optional)</Label>
                <Textarea
                  id="special_instructions"
                  value={orderForm.special_instructions}
                  onChange={(e) => setOrderForm({ ...orderForm, special_instructions: e.target.value })}
                  placeholder="Any special requests or dietary requirements"
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Total Cost */}
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Base Cost:</span>
                  <span className="font-semibold">
                    Rs.{(selectedMenu.base_price_per_person * orderForm.num_persons).toFixed(2)}
                  </span>
                </div>
                {orderForm.selected_optional_items.length > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Optional Items:</span>
                    <span className="font-semibold">
                      Rs.{selectedMenu.items
                        .filter(item => orderForm.selected_optional_items.includes(item.id))
                        .reduce((sum, item) => sum + (item.extra_cost * orderForm.num_persons), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                )}
                {orderForm.order_type === 'delivery' && orderForm.delivery_fee > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Delivery Fee {orderForm.distance_km ? `(~${orderForm.distance_km.toFixed(1)} km)` : ''}:
                    </span>
                    <span className="font-semibold">
                      Rs.{orderForm.delivery_fee.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-2xl font-bold text-orange-600">
                    Rs.{calculateTotalCost().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleSubmitOrder}
            >
              Place Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Address Picker Dialog - Google Maps */}
      <GoogleMapsAddressPicker
        isOpen={isAddressPickerOpen}
        onClose={() => {
          setIsAddressPickerOpen(false);
          setEditingAddress(null);
        }}
        onAddressSaved={handleAddressSaved}
        editingAddress={editingAddress}
        existingAddresses={addresses}
      />

      {/* AI Food Info Popup */}
      <FoodInfoPopup
        isOpen={showAIFoodInfo}
        onClose={() => {
          setShowAIFoodInfo(false);
          setAIFoodName('');
          setAIFoodDescription('');
          setAIFoodImage('');
        }}
        foodName={aiFoodName}
        foodDescription={aiFoodDescription}
        foodImage={aiFoodImage}
      />
        </TabsContent>

        {/* My Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          {loadingOrders ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : userBulkOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No Bulk Orders Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
                  You haven't placed any bulk orders yet. Browse our menus to get started!
                </p>
                <Button 
                  onClick={() => setActiveTab('browse')}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Browse Bulk Menus
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {userBulkOrders.map((order) => (
                <Card key={order.bulk_order_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="h-5 w-5 text-orange-500" />
                          <h3 className="font-bold text-lg">Order #{order.order_number}</h3>
                          <Badge 
                            className={
                              order.status === 'completed' ? 'bg-green-500' :
                              order.status === 'pending' ? 'bg-yellow-500' :
                              order.status === 'confirmed' ? 'bg-blue-500' :
                              order.status === 'preparing' ? 'bg-purple-500' :
                              order.status === 'cancelled' ? 'bg-red-500' :
                              'bg-gray-500'
                            }
                          >
                            {order.status.toUpperCase()}
                          </Badge>
                        </div>
                        {order.menu_name && (
                          <p className="text-gray-600 dark:text-gray-300 mb-2">
                            Menu: <span className="font-medium">{order.menu_name}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">
                          LKR {order.total_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Persons</p>
                          <p className="font-semibold">{order.num_persons}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Event Date</p>
                          <p className="font-semibold">
                            {order.event_date ? new Date(order.event_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Event Time</p>
                          <p className="font-semibold">{order.event_time || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Delivery Type</p>
                          <p className="font-semibold">
                            {order.order_type === 'pickup' ? 'Pickup' : 'Delivery'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {/* Delivery Address */}
                      {order.delivery_address && order.order_type !== 'pickup' && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Delivery Address</p>
                            <p className="text-sm font-medium">{order.delivery_address}</p>
                            {order.distance_km && (
                              <p className="text-xs text-gray-400">
                                Distance: {order.distance_km.toFixed(1)} km • Fee: LKR {order.delivery_fee.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Chef Info */}
                      {order.chef && (
                        <div className="flex items-start gap-2">
                          <ChefHat className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Chef</p>
                            <p className="text-sm font-medium">{order.chef.name}</p>
                            <p className="text-xs text-gray-400">{order.chef.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Delivery Agent Info */}
                      {order.delivery_partner && (
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Delivery Agent</p>
                            <p className="text-sm font-medium">{order.delivery_partner.name}</p>
                            <p className="text-xs text-gray-400">{order.delivery_partner.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Customer Info */}
                      {order.customer && (
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Ordered By</p>
                            <p className="text-sm font-medium">{order.customer.name}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Ordered on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/customer/orders`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Bulk Menu Card Component
interface BulkMenuCardProps {
  menu: BulkMenu;
  onViewDetails: (menu: BulkMenu) => void;
  onOrder: (menu: BulkMenu) => void;
  onAIInfo: (menu: BulkMenu) => void;
}

const BulkMenuCard: React.FC<BulkMenuCardProps> = ({ menu, onViewDetails, onOrder, onAIInfo }) => {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Image */}
      {menu.thumbnail_url ? (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={menu.thumbnail_url}
            alt={menu.menu_name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-orange-500 text-white">
              {menu.meal_type_display}
            </Badge>
          </div>
          {/* AI Info Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAIInfo(menu);
            }}
            className="absolute top-3 right-3 p-2 bg-gradient-to-r from-purple-500 to-pink-500 backdrop-blur-sm rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg group/ai"
            title="View AI Food Insights"
          >
            <Sparkles className="h-4 w-4 text-white group-hover/ai:scale-110 transition-transform" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <h3 className="text-white font-bold text-lg">{menu.menu_name}</h3>
          </div>
        </div>
      ) : (
        <div className="relative h-48 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/20 flex items-center justify-center">
          {/* AI Info Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAIInfo(menu);
            }}
            className="absolute top-3 right-3 p-2 bg-gradient-to-r from-purple-500 to-pink-500 backdrop-blur-sm rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg group/ai"
            title="View AI Food Insights"
          >
            <Sparkles className="h-4 w-4 text-white group-hover/ai:scale-110 transition-transform" />
          </button>
          <div className="text-center">
            <ChefHat className="h-12 w-12 text-orange-500 mx-auto mb-2" />
            <Badge className="bg-orange-500 text-white">{menu.meal_type_display}</Badge>
          </div>
        </div>
      )}

      <CardHeader>
        {!menu.thumbnail_url && (
          <CardTitle className="text-xl">{menu.menu_name}</CardTitle>
        )}
        <CardDescription className="line-clamp-2">{menu.description}</CardDescription>
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
          <ChefHat className="h-4 w-4" />
          <span>Chef {menu.chef_name}</span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Price and Capacity */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="font-semibold text-orange-600">Rs.{menu.base_price_per_person}/person</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Capacity</p>
                <p className="font-semibold">{menu.min_persons}-{menu.max_persons}</p>
              </div>
            </div>
          </div>

          {/* Advance Notice */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {menu.advance_notice_hours}h advance notice required
            </span>
          </div>

          {/* Items Count */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {menu.items_count} items included
            </Badge>
            {menu.menu_items_summary.optional_items.length > 0 && (
              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                +{menu.menu_items_summary.optional_items.length} optional
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onViewDetails(menu)}
            >
              <Info className="h-4 w-4 mr-1" />
              Details
            </Button>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => onOrder(menu)}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Order
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerBulkOrderDashboard;

