import React, { useState, useEffect, useCallback } from 'react';
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
  Banknote, 
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
  User,
  Filter,
  Leaf,
  TrendingUp,
  AlertTriangle,
  CheckCircle
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
  chef_profile_id?: number;
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
  delivery_fee?: number;
  distance_km?: number;
  kitchen_location?: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
  };
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
  
  // Advanced filters
  const [peopleCountFilter, setPeopleCountFilter] = useState<string>('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<string>('all');
  
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
    order_type: 'pickup', // Default to pickup (delivery coming soon)
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
    loadAddresses();
    fetchUserBulkOrders();
  }, []);

  // Fetch bulk menus when selected address changes
  useEffect(() => {
    fetchBulkMenus();
  }, [selectedAddress]);

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
    }
  };

  const fetchBulkMenus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Build URL with location parameters if available
      let url = '/api/food/bulk-menus/';
      if (selectedAddress && selectedAddress.latitude && selectedAddress.longitude) {
        url += `?user_lat=${selectedAddress.latitude}&user_lng=${selectedAddress.longitude}`;
        console.log('Fetching bulk menus with user location:', {
          lat: selectedAddress.latitude,
          lng: selectedAddress.longitude
        });
      } else {
        console.log('Fetching bulk menus without user location');
      }
      
      const response = await fetch(url, {
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
        
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching bulk menus:', error);
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
    // Comprehensive validation before placing bulk order
    console.log('📝 Starting order submission...');
    console.log('Order form data:', orderForm);
    console.log('Selected address:', selectedAddress);
    
    // 1. Validate menu selection
    if (!orderForm.menu_id || !selectedMenu) {
      toast.error('Please select a bulk menu before placing your order.');
      return;
    }

    // 2. Validate number of persons
    if (!orderForm.num_persons || orderForm.num_persons <= 0) {
      toast.error('Please enter the number of persons for the order.');
      return;
    }

    // 3. Validate minimum and maximum persons
    if (selectedMenu.min_persons && orderForm.num_persons < selectedMenu.min_persons) {
      toast.error(`Minimum ${selectedMenu.min_persons} persons required for this menu.`);
      return;
    }

    if (selectedMenu.max_persons && orderForm.num_persons > selectedMenu.max_persons) {
      toast.error(`Maximum ${selectedMenu.max_persons} persons allowed for this menu.`);
      return;
    }

    // 4. Validate event date
    if (!orderForm.event_date) {
      toast.error('Please select an event date.');
      return;
    }

    // 5. Validate event time
    if (!orderForm.event_time) {
      toast.error('Please select an event time.');
      return;
    }

    // 6. Validate event date is not in the past
    const eventDateTime = new Date(orderForm.event_date);
    const [hours, minutes] = orderForm.event_time.split(':');
    eventDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    if (eventDateTime <= new Date()) {
      toast.error('Event date and time must be in the future.');
      return;
    }

    // 7. Check advance notice requirement (use menu-specific or default to 24 hours)
    const hoursUntilEvent = (eventDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    const requiredAdvanceHours = selectedMenu.advance_notice_hours || 24; // Use menu requirement or default to 24 hours
    const requiredDays = Math.ceil(requiredAdvanceHours / 24);
    
    console.log(`⏰ Hours until event: ${hoursUntilEvent.toFixed(1)}, Required: ${requiredAdvanceHours} hours (${requiredDays} days)`);
    
    // Check if event meets the advance notice requirement
    if (hoursUntilEvent < requiredAdvanceHours) {
      toast.error(
        `This menu requires at least ${requiredAdvanceHours} hours (${requiredDays} ${requiredDays === 1 ? 'day' : 'days'}) advance notice. Please select a later date/time.`
      );
      return;
    }

    // 8. Validate order type (only pickup is available for bulk orders)
    if (orderForm.order_type !== 'pickup') {
      toast.error('Only pickup is available for bulk orders at this time.');
      return;
    }

    // 10. Use selected address if available, otherwise use manual entry
    const finalAddress = selectedAddress ? 
      [
        selectedAddress.address_line1,
        selectedAddress.address_line2,
        `${selectedAddress.city}, ${selectedAddress.pincode}`
      ].filter(Boolean).join(', ') : 
      orderForm.delivery_address;

    // 11. Validate total amount
    const totalAmount = calculateTotalCost();
    if (totalAmount <= 0) {
      toast.error('Invalid order total. Please review your order.');
      return;
    }

    // 12. Validate minimum order amount for bulk orders
    if (totalAmount < 5000) {
      toast.error('Minimum bulk order amount is LKR 5,000.');
      return;
    }

    // 13. Final confirmation
    const confirmMessage = `Confirm bulk order for ${orderForm.num_persons} persons on ${format(orderForm.event_date, 'PPP')} at ${orderForm.event_time} for LKR ${totalAmount.toFixed(2)}?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.error('❌ No authentication token found');
        navigate('/login');
        return;
      }
      
      const orderData = {
        bulk_menu_id: orderForm.menu_id,
        num_persons: orderForm.num_persons,
        event_date: format(orderForm.event_date, 'yyyy-MM-dd'),
        event_time: orderForm.event_time,
        order_type: 'pickup', // Only pickup is available for bulk orders
        delivery_address: 'Pickup',
        delivery_fee: 0,
        distance_km: 0,
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
        
        // Close dialog and navigate to orders page
        setIsOrderDialogOpen(false);
        navigate('/customer/orders');
      } else {
        const errorData = await response.json();
        console.error('❌ Order failed:', errorData);
        
        // Handle specific error types
        if (response.status === 401) {
          navigate('/login');
        }
      }
    } catch (error) {
      console.error('💥 Exception during order placement:', error);
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
    
    // Calculate delivery fee using backend API with night/weather surcharges
    let deliveryFee = 250; // Default base fee for bulk
    let distanceKm = 0;
    
    if (selectedMenu && address.latitude && address.longitude && selectedMenu.kitchen_location) {
      try {
        const { CartService } = await import('@/services/cartService');
        
        // Call backend API for accurate bulk order delivery fee
        const calculation = await CartService.calculateCheckout(
          [], // Empty cart items for bulk (calculated differently)
          address.id,
          {
            order_type: 'bulk', // ✅ BULK ORDER TYPE
            delivery_latitude: address.latitude,
            delivery_longitude: address.longitude,
            chef_latitude: selectedMenu.kitchen_location.lat,
            chef_longitude: selectedMenu.kitchen_location.lng,
          }
        );

        deliveryFee = calculation.delivery_fee;
        distanceKm = calculation.delivery_fee_breakdown?.factors?.distance_km || 0;
        
        console.log('✅ Bulk delivery fee calculated:', {
          totalFee: deliveryFee,
          distance: distanceKm,
          nightSurcharge: calculation.delivery_fee_breakdown?.breakdown?.time_surcharge,
          weatherSurcharge: calculation.delivery_fee_breakdown?.breakdown?.weather_surcharge,
        });
      } catch (error) {
        console.error('❌ Failed to calculate bulk delivery fee, using fallback:', error);
        // Fallback: Bulk Order Formula
        // First 5 km: 250 LKR, After 5 km: 15 LKR/km
        deliveryFee = 250;
        distanceKm = 5;
      }
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
  };

  const handleSelectExistingAddress = async (address: DeliveryAddress) => {
    setSelectedAddress(address);
    
    // Calculate bulk delivery fee using backend API
    let deliveryFee = 250; // Base fee for bulk
    let distanceKm = 0;
    
    if (selectedMenu && address.latitude && address.longitude && selectedMenu.kitchen_location) {
      try {
        const { CartService } = await import('@/services/cartService');
        
        const calculation = await CartService.calculateCheckout(
          [],
          address.id,
          {
            order_type: 'bulk', // ✅ BULK ORDER TYPE
            delivery_latitude: address.latitude,
            delivery_longitude: address.longitude,
            chef_latitude: selectedMenu.kitchen_location.lat,
            chef_longitude: selectedMenu.kitchen_location.lng,
          }
        );

        deliveryFee = calculation.delivery_fee;
        distanceKm = calculation.delivery_fee_breakdown?.factors?.distance_km || 0;
        
        console.log('✅ Bulk delivery fee for existing address:', deliveryFee);
      } catch (error) {
        console.error('❌ Failed to calculate bulk delivery fee:', error);
        deliveryFee = 250;
        distanceKm = 5;
      }
    }
    
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
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      await addressService.deleteAddress(addressId);
      await loadAddresses();
      if (selectedAddress?.id === addressId) {
        setSelectedAddress(null);
        setOrderForm(prev => ({ ...prev, delivery_address: '', delivery_fee: 0, distance_km: 0 }));
      }
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  // AI-powered search function with auto-search
  const handleAiSearch = async (query: string) => {
    if (!query.trim()) {
      // If empty, reset to normal view
      handleClearAiSearch();
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
          query: query,
          meal_type: selectedMealType !== 'all' ? selectedMealType : undefined,
          people_count: peopleCountFilter !== 'all' ? peopleCountFilter : undefined,
          price_range: priceRangeFilter !== 'all' ? priceRangeFilter : undefined,
          dietary: dietaryFilter !== 'all' ? dietaryFilter : undefined,
          include_menu_items: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setBulkMenus(data.menus);
        setIsAiSearchActive(true);
      }
    } catch (error) {
      console.error('AI search error:', error);
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

  // Debounced AI search - auto-search after user stops typing
  useEffect(() => {
    if (aiSearchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        handleAiSearch(aiSearchQuery);
      }, 800); // Wait 800ms after user stops typing
      
      return () => clearTimeout(timeoutId);
    } else if (isAiSearchActive) {
      // If query is cleared, reset to normal view
      handleClearAiSearch();
    }
  }, [aiSearchQuery]);

  const filteredMenus = bulkMenus
    .filter(menu => selectedMealType === 'all' || menu.meal_type === selectedMealType)
    .filter(menu => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        menu.menu_name.toLowerCase().includes(searchLower) ||
        menu.description.toLowerCase().includes(searchLower) ||
        menu.chef_name.toLowerCase().includes(searchLower) ||
        menu.menu_items_summary?.mandatory_items?.some(item => item.toLowerCase().includes(searchLower)) ||
        menu.menu_items_summary?.optional_items?.some(item => item.toLowerCase().includes(searchLower))
      );
    })
    // People count filter
    .filter(menu => {
      if (peopleCountFilter === 'all') return true;
      if (peopleCountFilter === 'small') return menu.min_persons <= 20;
      if (peopleCountFilter === 'medium') return menu.min_persons <= 50 && menu.max_persons >= 20;
      if (peopleCountFilter === 'large') return menu.max_persons >= 50;
      return true;
    })
    // Price range filter
    .filter(menu => {
      if (priceRangeFilter === 'all') return true;
      const price = menu.base_price_per_person;
      if (priceRangeFilter === 'budget') return price < 500;
      if (priceRangeFilter === 'mid') return price >= 500 && price < 1000;
      if (priceRangeFilter === 'premium') return price >= 1000;
      return true;
    })
    // Dietary filter
    .filter(menu => {
      if (dietaryFilter === 'all') return true;
      const items = menu.items || [];
      if (dietaryFilter === 'vegetarian') return items.some(item => item.is_vegetarian);
      if (dietaryFilter === 'vegan') return items.some(item => item.is_vegan);
      if (dietaryFilter === 'gluten_free') return items.some(item => item.is_gluten_free);
      return true;
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
        {/* Smart Search Section */}
        <Card className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Smart Search Input */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search menus... (e.g., 'vegetarian food for 100 guests', 'spicy Indian dinner menu')"
                    value={aiSearchQuery}
                    onChange={(e) => setAiSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-base"
                    disabled={aiSearching}
                  />
                  {aiSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent" />
                    </div>
                  )}
                </div>
                {(isAiSearchActive || aiSearchQuery.trim()) && (
                  <Button 
                    onClick={handleClearAiSearch}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
              
              {/* Search Status */}
              {isAiSearchActive && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  <span>Smart search active - showing {bulkMenus.length} results</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Traditional Text Search (kept for filtering AI results) */}
        {isAiSearchActive && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Filter results by name, chef, or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Smart Filters */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Smart Filters</h3>
              {(peopleCountFilter !== 'all' || priceRangeFilter !== 'all' || dietaryFilter !== 'all') && (
                <Badge className="bg-orange-500 text-white">Active</Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* People Count Filter */}
              <div>
                <Label className="text-xs mb-1.5 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  People Count
                </Label>
                <select
                  value={peopleCountFilter}
                  onChange={(e) => setPeopleCountFilter(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Sizes</option>
                  <option value="small">Small (1-20)</option>
                  <option value="medium">Medium (20-50)</option>
                  <option value="large">Large (50+)</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <Label className="text-xs mb-1.5 flex items-center gap-1">
                  <Banknote className="h-3.5 w-3.5" />
                  Price Range
                </Label>
                <select
                  value={priceRangeFilter}
                  onChange={(e) => setPriceRangeFilter(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Prices</option>
                  <option value="budget">Budget (&lt; LKR 500)</option>
                  <option value="mid">Mid-Range (LKR 500-1000)</option>
                  <option value="premium">Premium (LKR 1000+)</option>
                </select>
              </div>

              {/* Dietary Preferences Filter */}
              <div>
                <Label className="text-xs mb-1.5 flex items-center gap-1">
                  <Leaf className="h-3.5 w-3.5" />
                  Dietary
                </Label>
                <select
                  value={dietaryFilter}
                  onChange={(e) => setDietaryFilter(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Types</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="gluten_free">Gluten Free</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPeopleCountFilter('all');
                    setPriceRangeFilter('all');
                    setDietaryFilter('all');
                    setSearchTerm('');
                    if (isAiSearchActive) handleClearAiSearch();
                  }}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
                  <Banknote className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">Base Price</p>
                    <p className="font-semibold">LKR {selectedMenu.base_price_per_person}/person</p>
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
                              <p className="text-orange-600 font-semibold">+LKR {item.extra_cost}/person</p>
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

      {/* Order Dialog - Improved UI */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-orange-500" />
              Place Bulk Order
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-2">
              <ChefHat className="h-4 w-4 text-orange-500" />
              <span className="font-semibold">{selectedMenu?.menu_name}</span>
              <span className="mx-2">•</span>
              <Banknote className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-600">LKR {selectedMenu?.base_price_per_person}/person</span>
            </DialogDescription>
          </DialogHeader>

          {selectedMenu && (
            <div className="space-y-6 py-4">
              {/* Number of Persons with Visual Indicator */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <Label htmlFor="num_persons" className="text-base font-semibold">Number of Persons *</Label>
                </div>
                <Input
                  id="num_persons"
                  type="number"
                  min={selectedMenu.min_persons}
                  max={selectedMenu.max_persons}
                  value={orderForm.num_persons}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= selectedMenu.min_persons && value <= selectedMenu.max_persons) {
                      setOrderForm({ ...orderForm, num_persons: value });
                    }
                  }}
                  className="mt-2 text-lg font-semibold h-12"
                  placeholder={`Enter between ${selectedMenu.min_persons} and ${selectedMenu.max_persons}`}
                />
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Min: {selectedMenu.min_persons} | Max: {selectedMenu.max_persons}
                  </span>
                  <span className="font-semibold text-blue-600">
                    {orderForm.num_persons} {orderForm.num_persons === 1 ? 'person' : 'people'}
                  </span>
                </div>
              </div>

              {/* Event Date & Time - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Date with Calendar */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="h-5 w-5 text-purple-600" />
                    <Label className="text-base font-semibold">Event Date *</Label>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-medium mt-2 h-12 ${
                          !orderForm.event_date ? 'text-gray-500' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        {orderForm.event_date ? format(orderForm.event_date, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={orderForm.event_date}
                        onSelect={(date) => setOrderForm({ ...orderForm, event_date: date })}
                        disabled={(date) => {
                          // Get the required advance notice hours (default to 24 if not specified)
                          const requiredAdvanceHours = selectedMenu?.advance_notice_hours || 24;
                          
                          // Calculate the minimum allowed date based on advance notice requirement
                          const minDate = new Date();
                          minDate.setHours(minDate.getHours() + requiredAdvanceHours);
                          minDate.setHours(0, 0, 0, 0); // Reset to start of day for date comparison
                          
                          // Disable dates before the minimum required date
                          const dateToCheck = new Date(date);
                          dateToCheck.setHours(0, 0, 0, 0);
                          
                          return dateToCheck < minDate;
                        }}
                        initialFocus
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                  {!orderForm.event_date && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Please select an event date
                    </p>
                  )}
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {selectedMenu?.advance_notice_hours 
                      ? `This menu requires at least ${selectedMenu.advance_notice_hours} hours (${Math.ceil(selectedMenu.advance_notice_hours / 24)} ${Math.ceil(selectedMenu.advance_notice_hours / 24) === 1 ? 'day' : 'days'}) advance notice`
                      : 'Bulk orders require at least 24 hours advance notice'
                    }
                  </p>
                </div>

                {/* Event Time */}
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <Label htmlFor="event_time" className="text-base font-semibold">Event Time *</Label>
                  </div>
                  <Input
                    id="event_time"
                    type="time"
                    value={orderForm.event_time}
                    onChange={(e) => setOrderForm({ ...orderForm, event_time: e.target.value })}
                    className="mt-2 h-12 text-lg font-semibold"
                  />
                  {!orderForm.event_time && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Please select an event time
                    </p>
                  )}
                </div>
              </div>

              {/* Order Type Toggle - Pickup Only (Delivery Coming Soon) */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-gray-600" />
                  Order Type *
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Delivery - Disabled (Coming Soon) */}
                  <div
                    className="relative p-6 rounded-xl font-semibold bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 border-2 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-60"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl opacity-30">
                        🚚
                      </div>
                      <span className="text-lg">Delivery</span>
                      <Badge variant="secondary" className="text-xs mt-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Coming Soon
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Pickup - Active and Default */}
                  <button
                    type="button"
                    onClick={() => setOrderForm({ ...orderForm, order_type: 'pickup', delivery_fee: 0, delivery_address: '' })}
                    className="relative p-6 rounded-xl font-semibold transition-all transform hover:scale-105 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg ring-2 ring-green-400 ring-offset-2"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl">
                        📦
                      </div>
                      <span className="text-lg">Pickup</span>
                      <CheckCircle className="absolute top-2 right-2 h-6 w-6 text-white" />
                    </div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-2">
                  <Info className="h-3 w-3" />
                  Currently, bulk orders are only available for pickup. Delivery option coming soon!
                </p>
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

              {/* Optional Items - Enhanced */}
              {selectedMenu.items.some(item => item.is_optional) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <Label className="text-base font-semibold">Optional Add-ons</Label>
                    <Badge variant="outline" className="ml-2">
                      {orderForm.selected_optional_items.length} selected
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {selectedMenu.items.filter(item => item.is_optional).map((item) => (
                      <div 
                        key={item.id} 
                        className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          orderForm.selected_optional_items.includes(item.id)
                            ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                        }`}
                        onClick={() => toggleOptionalItem(item.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <Switch
                              checked={orderForm.selected_optional_items.includes(item.id)}
                              onCheckedChange={() => toggleOptionalItem(item.id)}
                              className="data-[state=checked]:bg-purple-600"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white">{item.item_name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                                <Banknote className="h-3 w-3" />
                                +LKR {item.extra_cost}/person
                              </p>
                            </div>
                          </div>
                          {orderForm.selected_optional_items.includes(item.id) && (
                            <Badge className="bg-purple-600 text-white px-3 py-1">
                              <Plus className="h-3 w-3 mr-1" />
                              LKR {item.extra_cost * orderForm.num_persons}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Instructions - Enhanced */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  <Label htmlFor="special_instructions" className="text-base font-semibold">
                    Special Instructions <span className="text-gray-500 font-normal">(Optional)</span>
                  </Label>
                </div>
                <Textarea
                  id="special_instructions"
                  value={orderForm.special_instructions}
                  onChange={(e) => setOrderForm({ ...orderForm, special_instructions: e.target.value })}
                  placeholder="Any special requests or dietary requirements... (e.g., extra spicy, no peanuts, vegetarian options)"
                  className="mt-2 min-h-[100px] resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Info className="h-3 w-3" />
                  Let us know about allergies, preferences, or any special requests
                </p>
              </div>

              {/* Total Cost - Enhanced Display */}
              <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 p-6 rounded-xl border-2 border-green-300 dark:border-green-700 shadow-sm">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-700">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Base Cost:</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">
                      LKR {(selectedMenu.base_price_per_person * orderForm.num_persons).toFixed(2)}
                    </span>
                  </div>
                  
                  {orderForm.selected_optional_items.length > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-700">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-orange-600" />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Optional Items:</span>
                      </div>
                      <span className="font-bold text-orange-600">
                        +LKR {selectedMenu.items
                          .filter(item => orderForm.selected_optional_items.includes(item.id))
                          .reduce((sum, item) => sum + (item.extra_cost * orderForm.num_persons), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {/* Delivery fee section removed - pickup only for bulk orders */}
                  
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-800/30 dark:to-emerald-800/30 p-4 rounded-lg mt-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-6 w-6 text-green-700 dark:text-green-400" />
                        <span className="text-xl font-bold text-green-900 dark:text-green-100">Total:</span>
                      </div>
                      <span className="text-3xl font-bold text-green-700 dark:text-green-400">
                        LKR {calculateTotalCost().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4 gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsOrderDialogOpen(false)}
              className="flex-1 h-12 text-base font-semibold"
            >
              <X className="mr-2 h-5 w-5" />
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitOrder}
              className="flex-1 h-12 text-base font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
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
              <Banknote className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="font-semibold text-orange-600">LKR {menu.base_price_per_person}/person</p>
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

          {/* Items Count & Dietary Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {menu.items_count} items included
              </Badge>
              {menu.menu_items_summary.optional_items.length > 0 && (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-900/20">
                  +{menu.menu_items_summary.optional_items.length} optional
                </Badge>
              )}
            </div>
            
            {/* Dietary & Food Type Tags */}
            {menu.items && menu.items.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {menu.items.some(item => item.is_vegetarian) && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 border-green-300">
                    <Leaf className="h-3 w-3 mr-0.5" />
                    Veg
                  </Badge>
                )}
                {menu.items.some(item => item.is_vegan) && (
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 border-emerald-300">
                    <Leaf className="h-3 w-3 mr-0.5" />
                    Vegan
                  </Badge>
                )}
                {menu.items.some(item => item.is_gluten_free) && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 border-blue-300">
                    GF
                  </Badge>
                )}
              </div>
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

