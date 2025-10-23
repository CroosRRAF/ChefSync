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
  Navigation
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DeliveryAddressSelector from '@/components/delivery/DeliveryAddressSelector';
import { DeliveryAddress } from '@/services/addressService';

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
  delivery_address: string;
  special_instructions: string;
  selected_optional_items: number[];
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
  
  // Order form state
  const [orderForm, setOrderForm] = useState<OrderFormData>({
    menu_id: 0,
    num_persons: 10,
    event_date: undefined,
    event_time: '',
    delivery_address: '',
    special_instructions: '',
    selected_optional_items: [],
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
  }, []);

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
      delivery_address: addressText,
      special_instructions: '',
      selected_optional_items: [],
    });
    setIsOrderDialogOpen(true);
  };

  const calculateTotalCost = (): number => {
    if (!selectedMenu) return 0;
    
    let baseTotal = selectedMenu.base_price_per_person * orderForm.num_persons;
    
    // Add optional item costs
    const optionalCosts = selectedMenu.items
      .filter(item => orderForm.selected_optional_items.includes(item.id))
      .reduce((sum, item) => sum + (item.extra_cost * orderForm.num_persons), 0);
    
    return baseTotal + optionalCosts;
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

    // Check if we have either a selected address or manual entry
    const hasAddress = (selectedAddress && selectedAddress.address_line1) || 
                       (orderForm.delivery_address && orderForm.delivery_address.trim().length > 0);
    
    if (!hasAddress) {
      toast.error('Please select an address from the map or enter a delivery address manually');
      return;
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
        delivery_address: finalAddress, // Use the validated final address
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

  const handleAddressSelect = (address: DeliveryAddress) => {
    console.log('📍 Address selected:', address);
    setSelectedAddress(address);
    // Format address for the order form
    const fullAddress = [
      address.address_line1,
      address.address_line2,
      `${address.city}, ${address.pincode}`
    ].filter(Boolean).join(', ');
    
    setOrderForm(prev => ({
      ...prev,
      delivery_address: fullAddress
    }));
    setIsAddressPickerOpen(false);
    toast.success(`Address selected: ${address.label}`);
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
            Bulk Order Menus
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Perfect for events, parties, and large gatherings
          </p>
        </div>
      </div>

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

              {/* Delivery Address */}
              <div className="space-y-2">
                <Label>Delivery Address *</Label>
                {selectedAddress ? (
                  <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-900 dark:text-green-100">
                            {selectedAddress.label}
                          </span>
                          {selectedAddress.is_default && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {selectedAddress.address_line1}
                        </p>
                        {selectedAddress.address_line2 && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedAddress.address_line2}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {selectedAddress.city}, {selectedAddress.pincode}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsAddressPickerOpen(true)}
                          className="whitespace-nowrap"
                        >
                          Change
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedAddress(null);
                            setOrderForm(prev => ({ ...prev, delivery_address: '' }));
                            toast.info('Address cleared. You can enter manually below.');
                          }}
                          className="whitespace-nowrap text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start h-auto py-4"
                      onClick={() => setIsAddressPickerOpen(true)}
                    >
                      <MapPin className="h-5 w-5 mr-2 text-orange-500" />
                      <div className="text-left">
                        <div className="font-medium">Select Delivery Address</div>
                        <div className="text-xs text-gray-500">
                          Choose from saved addresses or add new with map
                        </div>
                      </div>
                    </Button>
                    <p className="text-xs text-gray-500">
                      Or enter manual address below
                    </p>
                    <Textarea
                      id="delivery_address"
                      value={orderForm.delivery_address}
                      onChange={(e) => setOrderForm({ ...orderForm, delivery_address: e.target.value })}
                      placeholder="Enter event venue address"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                )}
              </div>

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

      {/* Address Picker Dialog */}
      <DeliveryAddressSelector
        isOpen={isAddressPickerOpen}
        onClose={() => setIsAddressPickerOpen(false)}
        onAddressSelect={handleAddressSelect}
        selectedAddress={selectedAddress}
        showHeader={true}
      />
    </div>
  );
};

// Bulk Menu Card Component
interface BulkMenuCardProps {
  menu: BulkMenu;
  onViewDetails: (menu: BulkMenu) => void;
  onOrder: (menu: BulkMenu) => void;
}

const BulkMenuCard: React.FC<BulkMenuCardProps> = ({ menu, onViewDetails, onOrder }) => {
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
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <h3 className="text-white font-bold text-lg">{menu.menu_name}</h3>
          </div>
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/20 flex items-center justify-center">
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

