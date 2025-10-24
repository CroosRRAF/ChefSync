import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDatabaseCart, DatabaseCartItem } from '../context/DatabaseCartContext';
import { useAuth } from '../context/AuthContext';
import { addressService, DeliveryAddress } from '../services/addressService';
import { orderService } from '../services/orderService';
import { CartService } from '../services/cartService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';
import { 
  MapPin, 
  Store, 
  ArrowLeft, 
  CreditCard,
  Clock,
  Phone,
  Wallet,
  Truck,
  Check,
  Plus,
  Edit2,
  ChefHat,
  Package,
  AlertCircle,
  Trash2,
  Moon,
  CloudRain
} from 'lucide-react';
import GoogleMapsAddressPicker from '../components/checkout/GoogleMapsAddressPicker';

type OrderMode = 'delivery' | 'pickup';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, summary: cartSummary, loading: cartLoading, loadCart: refreshCart, getTotalByChef } = useDatabaseCart();
  const { user, isAuthenticated } = useAuth();

  // State
  const [orderMode, setOrderMode] = useState<OrderMode>('delivery');
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isAddressPickerOpen, setIsAddressPickerOpen] = useState(false);
  const [isLoadingDefaultAddress, setIsLoadingDefaultAddress] = useState(true);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [deliveryFeeBreakdown, setDeliveryFeeBreakdown] = useState<any>(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState(30);
  const [chefId, setChefId] = useState<number | null>(null);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);

  // Get chefId from router state
  useEffect(() => {
    if (location.state && location.state.chefId) {
      setChefId(location.state.chefId);
    } else if (items.length > 0) {
      // Get chef from first item
      setChefId(items[0].chef_id);
    } else {
      toast.error("No items in cart");
      navigate('/cart');
    }
  }, [location, navigate, items]);

  // Filter cart items for the selected chef
  const chefItems = items.filter(item => item.chef_id === chefId);
  const subtotal = chefId ? getTotalByChef(chefId) : 0;

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      navigate('/login');
      return;
    }

    if (user?.role !== 'customer') {
      toast.error('Only customers can place orders');
      navigate('/');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Check if cart has items for the selected chef
  useEffect(() => {
    if (!cartLoading && chefId && chefItems.length === 0) {
      toast.error('Your cart for this chef is empty');
      navigate('/menu');
    }
    
    // Validate that cart items have kitchen location for delivery calculation
    if (!cartLoading && chefItems.length > 0) {
      const firstItem = chefItems[0];
      if (!firstItem.kitchen_location || !firstItem.kitchen_location.lat || !firstItem.kitchen_location.lng) {
        console.error('Cart item missing kitchen_location:', firstItem);
        toast.warning('Chef location data is incomplete. Please contact support if delivery fee calculation fails.');
      }
    }
  }, [chefItems, cartLoading, navigate, chefId]);

  // Load addresses on mount
  useEffect(() => {
    const loadAddresses = async () => {
      if (orderMode !== 'delivery') {
        setIsLoadingDefaultAddress(false);
        return;
      }

      try {
        setIsLoadingDefaultAddress(true);
        setIsLoadingAddresses(true);
        
        // Load all addresses
        const fetchedAddresses = await addressService.getAddresses();
        setAddresses(fetchedAddresses);
        
        // Set default or first address
        const defaultAddr = fetchedAddresses.find(addr => addr.is_default) || fetchedAddresses[0] || null;
        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      } finally {
        setIsLoadingDefaultAddress(false);
        setIsLoadingAddresses(false);
      }
    };

    loadAddresses();
  }, [orderMode]);

  // Calculate delivery fee and taxes when address or mode changes
  useEffect(() => {
    const calculateFees = async () => {
      let calculatedDeliveryFee = 0;
      let calculatedDistance = 0;

      if (orderMode === 'delivery' && selectedAddress && chefItems.length > 0) {
        // Get chef's kitchen location from first cart item (all items are from same chef)
        const firstItem = chefItems[0];
        
        // Cart items always have kitchen_location from backend
        if (firstItem.kitchen_location && firstItem.kitchen_location.lat && firstItem.kitchen_location.lng) {
          setIsCalculatingFee(true);
          
          try {
            // Call backend API for accurate delivery fee with surcharges
            const calculation = await CartService.calculateCheckout(
              chefItems.map(item => ({
                price_id: item.price_id,
                quantity: item.quantity
              })),
              selectedAddress.id,
              {
                order_type: 'regular',
                delivery_latitude: selectedAddress.latitude,
                delivery_longitude: selectedAddress.longitude,
                chef_latitude: firstItem.kitchen_location.lat,
                chef_longitude: firstItem.kitchen_location.lng,
              }
            );

            // Use API response
            calculatedDeliveryFee = calculation.delivery_fee;
            calculatedDistance = calculation.delivery_fee_breakdown?.factors?.distance_km || 0;
            setDeliveryFeeBreakdown(calculation.delivery_fee_breakdown);

            // Estimate delivery time: 10 min base + 5 min per km
            const estimatedTime = Math.ceil(10 + (calculatedDistance * 5));
            setEstimatedDeliveryTime(estimatedTime);

            console.log('✅ Delivery Fee Calculation Success (API)!', {
              '📍 From (Chef Kitchen)': `(${firstItem.kitchen_location.lat}, ${firstItem.kitchen_location.lng})`,
              '📍 To (Customer)': `(${selectedAddress.latitude}, ${selectedAddress.longitude})`,
              '📏 Distance': calculatedDistance.toFixed(2) + ' km',
              '💳 Total Delivery Fee': 'LKR ' + calculatedDeliveryFee.toFixed(2),
              '⏱️ Estimated Time': estimatedTime + ' minutes',
              '🌙 Night Surcharge': 'LKR ' + (calculation.delivery_fee_breakdown?.breakdown?.time_surcharge || 0),
              '🌧️ Weather Surcharge': 'LKR ' + (calculation.delivery_fee_breakdown?.breakdown?.weather_surcharge || 0),
            });

          } catch (error) {
            console.error('❌ API call failed, using fallback calculation:', error);
            
            // Fallback to local calculation
            calculatedDistance = addressService.calculateDistance(
              Number(selectedAddress.latitude),
              Number(selectedAddress.longitude),
              Number(firstItem.kitchen_location.lat),
              Number(firstItem.kitchen_location.lng)
            );
            
            // Delivery fee calculation: Regular Order Formula
            const baseFee = 50;
            const freeDistanceKm = 5;
            const perKmFee = 15; // 30% of base = 50 × 0.30
            
            if (calculatedDistance > freeDistanceKm) {
              const extraKm = calculatedDistance - freeDistanceKm;
              calculatedDeliveryFee = baseFee + (extraKm * perKmFee);
            } else {
              calculatedDeliveryFee = baseFee;
            }

            const estimatedTime = Math.ceil(10 + (calculatedDistance * 5));
            setEstimatedDeliveryTime(estimatedTime);
            
            console.log('⚠️ Delivery Fee Calculation (Fallback):', {
              '📏 Distance': calculatedDistance.toFixed(2) + ' km',
              '💳 Total Delivery Fee': 'LKR ' + calculatedDeliveryFee.toFixed(2),
            });
          } finally {
            setIsCalculatingFee(false);
          }
        } else {
          console.error('❌ Kitchen location not available in cart item:', firstItem);
          toast.error('Unable to calculate delivery fee - kitchen location not available');
          return;
        }
      }

      setDeliveryFee(calculatedDeliveryFee);
      setDistance(calculatedDistance);

      // Calculate tax (10% of subtotal)
      const calculatedTax = subtotal * 0.10;
      setTaxAmount(calculatedTax);

      // Calculate total
      const calculatedTotal = subtotal + calculatedDeliveryFee + calculatedTax;
      setTotalAmount(calculatedTotal);
    };

    calculateFees();
  }, [subtotal, orderMode, selectedAddress, chefItems]);

  // Set phone number from user
  useEffect(() => {
    if (user?.phone) {
      setPhoneNumber(user.phone);
    }
  }, [user]);

  // Handle address picker - for new/edited addresses
  const handleAddressSaved = async (address: DeliveryAddress) => {
    // Refresh addresses list
    const fetchedAddresses = await addressService.getAddresses();
    setAddresses(fetchedAddresses);
    
    // Select the new/updated address
    setSelectedAddress(address);
    setIsAddressPickerOpen(false);
    setEditingAddress(null);
    
    toast.success(`Address ${editingAddress ? 'updated' : 'added'} successfully`, {
      description: `${address.label} - ${address.city}, ${address.pincode}`
    });
  };

  // Handle address selection from list
  const handleAddressSelect = (address: DeliveryAddress) => {
    setSelectedAddress(address);
  };

  // Handle delete address
  const handleDeleteAddress = async (addressId: number) => {
    try {
      await addressService.deleteAddress(addressId);
      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
      setAddresses(updatedAddresses);
      
      // If deleted address was selected, select another one
      if (selectedAddress?.id === addressId) {
        setSelectedAddress(updatedAddresses[0] || null);
      }
      
      toast.success('Address deleted');
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  // Handle set default address
  const handleSetDefault = async (addressId: number) => {
    try {
      await addressService.setDefaultAddress(addressId);
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        is_default: addr.id === addressId
      }));
      setAddresses(updatedAddresses);
      toast.success('Default address updated');
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default address');
    }
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    if (orderMode === 'delivery' && !selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }
    if (!chefId || chefItems.length === 0) {
      toast.error('No items in cart');
      return;
    }
    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    try {
      setIsPlacingOrder(true);

      // For delivery orders, address is required
      if (orderMode === 'delivery' && !selectedAddress) {
        toast.error('Please select a delivery address');
        return;
      }

      let orderData;

      if (orderMode === 'pickup') {
        // Pickup order - no delivery address, no delivery fee
        orderData = {
          order_type: 'pickup',
        payment_method: paymentMethod,
        phone: phoneNumber,
          delivery_fee: 0,
        subtotal: subtotal,
          tax_amount: taxAmount,
          total_amount: subtotal + taxAmount, // No delivery fee
          customer_notes: customerNotes || '',
        };
      } else {
        // Delivery order - requires address and has delivery fee
        orderData = {
          order_type: 'delivery',
          delivery_address_id: selectedAddress!.id,
          delivery_instructions: deliveryInstructions || '',
          payment_method: paymentMethod,
          phone: phoneNumber,
        delivery_fee: deliveryFee,
          subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
          customer_notes: customerNotes || '',
      };
      }

      const response = await orderService.createOrderFromCart(orderData);
      
      toast.success(`Order ${response.order_number} placed successfully!`);
      
      // Refresh the entire cart state
      await refreshCart();
      
      // Redirect to orders page or dashboard
      navigate(`/customer/orders`);
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/customer/cart')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Cart</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Secure Checkout</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {chefItems.length} items from Chef {chefItems.length > 0 ? chefItems[0].chef_name : ''}
                </p>
              </div>
          </div>
            <div className="w-24"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Mode Selection */}
            <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 border-b dark:border-gray-600">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Package className="w-5 h-5 text-orange-500" />
                  Order Type
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setOrderMode('delivery')}
                    className={`relative p-6 rounded-xl border-2 transition-all ${
                      orderMode === 'delivery'
                        ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 shadow-lg scale-105'
                        : 'border-gray-300 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 hover:shadow-md'
                    }`}
                  >
                    {orderMode === 'delivery' && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    <Truck className={`w-12 h-12 mx-auto mb-3 ${orderMode === 'delivery' ? 'text-orange-500' : 'text-gray-400'}`} />
                    <p className="font-semibold text-lg text-gray-900 dark:text-white">Delivery</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Get it delivered to your door</p>
                  </button>
                  
                  <button
                    onClick={() => setOrderMode('pickup')}
                    className={`relative p-6 rounded-xl border-2 transition-all ${
                      orderMode === 'pickup'
                        ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 shadow-lg scale-105'
                        : 'border-gray-300 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 hover:shadow-md'
                    }`}
                  >
                    {orderMode === 'pickup' && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    <Store className={`w-12 h-12 mx-auto mb-3 ${orderMode === 'pickup' ? 'text-orange-500' : 'text-gray-400'}`} />
                    <p className="font-semibold text-lg text-gray-900 dark:text-white">Pickup</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pick up from chef's kitchen</p>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address / Pickup Details */}
            {orderMode === 'delivery' ? (
              <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 border-b dark:border-gray-600">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {isLoadingDefaultAddress || isLoadingAddresses ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading addresses...</p>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-8 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-700">
                      <MapPin className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                      <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">No delivery addresses yet</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Add your first delivery address to continue
                      </p>
                      <Button
                        onClick={() => {
                          setEditingAddress(null);
                          setIsAddressPickerOpen(true);
                        }}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Delivery Address
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Saved Addresses List */}
                      <div className="space-y-3">
                        {addresses.map((address) => (
                          <Card
                            key={address.id}
                            className={`cursor-pointer transition-all ${
                              selectedAddress?.id === address.id
                                ? 'ring-2 ring-orange-500 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 shadow-md'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-md'
                            }`}
                            onClick={() => handleAddressSelect(address)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MapPin className={`w-4 h-4 ${selectedAddress?.id === address.id ? 'text-orange-600' : 'text-gray-500'}`} />
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{address.label}</h4>
                                    {address.is_default && (
                                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 text-xs">Default</Badge>
                                    )}
                                    {selectedAddress?.id === address.id && (
                                      <Badge className="bg-orange-500 text-white text-xs">Selected</Badge>
                                    )}
                                  </div>
                                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">{address.address_line1}</p>
                                  {address.address_line2 && (
                                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">{address.address_line2}</p>
                                  )}
                                  <p className="text-gray-500 dark:text-gray-500 text-xs">
                                    {address.city}, {address.pincode}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-1 ml-4">
                                  {!address.is_default && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSetDefault(address.id);
                                      }}
                                      title="Set as default"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingAddress(address);
                                      setIsAddressPickerOpen(true);
                                    }}
                                    title="Edit address"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('Are you sure you want to delete this address?')) {
                                        handleDeleteAddress(address.id);
                                      }
                                    }}
                                    title="Delete address"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Add New Address Button */}
                      <Button
                        onClick={() => {
                          setEditingAddress(null);
                          setIsAddressPickerOpen(true);
                        }}
                        variant="outline"
                        className="w-full border-2 border-dashed border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Address
                      </Button>
                    </div>
                  )}

                  {/* Delivery Info */}
                  {selectedAddress && distance > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-700">
                      <div className="grid grid-cols-3 gap-4 text-center mb-3">
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Distance</p>
                          <p className="font-bold text-blue-900 dark:text-blue-100">{distance.toFixed(2)} km</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Delivery Fee</p>
                          <p className="font-bold text-blue-900 dark:text-blue-100">LKR {deliveryFee.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Est. Time</p>
                          <p className="font-bold text-blue-900 dark:text-blue-100">~{estimatedDeliveryTime} min</p>
                        </div>
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300 text-center pt-3 border-t border-blue-200 dark:border-blue-700 space-y-2">
                        {/* Show breakdown if available from API */}
                        {deliveryFeeBreakdown ? (
                          <>
                            <p>💡 Base: LKR {deliveryFeeBreakdown.breakdown.distance_fee.toFixed(2)}</p>
                            {deliveryFeeBreakdown.breakdown.time_surcharge > 0 && (
                              <p className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                <Moon className="h-3 w-3" />
                                Night Surcharge (+10%): +LKR {deliveryFeeBreakdown.breakdown.time_surcharge.toFixed(2)}
                              </p>
                            )}
                            {deliveryFeeBreakdown.breakdown.weather_surcharge > 0 && (
                              <p className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                                <CloudRain className="h-3 w-3" />
                                Rain Surcharge (+10%): +LKR {deliveryFeeBreakdown.breakdown.weather_surcharge.toFixed(2)}
                              </p>
                            )}
                            <p className="font-bold text-blue-900 dark:text-blue-100">
                              Total: LKR {deliveryFee.toFixed(2)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p>💡 LKR 50 base fee + LKR 15 per km after first 5km</p>
                            {distance > 5 && (
                              <p className="mt-1 font-medium">
                                (LKR 50 + {(distance - 5).toFixed(2)} km × LKR 15 = LKR {deliveryFee.toFixed(2)})
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delivery Instructions */}
                  <div>
                    <Label htmlFor="delivery-instructions" className="text-gray-700 dark:text-gray-300 font-medium mb-2 block">
                      Delivery Instructions (Optional)
                    </Label>
                    <Textarea
                      id="delivery-instructions"
                      placeholder="E.g., Ring the doorbell, leave at the door, etc."
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      rows={3}
                      className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 border-b dark:border-gray-600">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Store className="w-5 h-5 text-orange-500" />
                    Pickup Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl border border-purple-200 dark:border-purple-700">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <ChefHat className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-1">
                          Chef {chefItems.length > 0 ? chefItems[0].chef_name : 'Unknown'}
                        </h4>
                        <p className="text-purple-700 dark:text-purple-300 mb-2">
                          {chefItems.length > 0 ? chefItems[0].kitchen_address : 'Location not available'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                          <Clock className="w-4 h-4" />
                          <span>Ready for pickup in ~{estimatedDeliveryTime} minutes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Section */}
            <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 border-b dark:border-gray-600">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Wallet className="w-5 h-5 text-orange-500" />
                  Payment & Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Phone Number */}
                <div>
                  <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300 font-medium mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium mb-3 block">Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                    <div 
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        paymentMethod === 'cash_on_delivery' 
                          ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500'
                      }`}
                      onClick={() => setPaymentMethod('cash_on_delivery')}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="cash_on_delivery" id="cash" />
                        <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Wallet className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Cash on {orderMode === 'delivery' ? 'Delivery' : 'Pickup'}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Pay when you receive your order</p>
                          </div>
                        </Label>
                      </div>
                    </div>

                    <div 
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        paymentMethod === 'card' 
                          ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500'
                      }`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Online Payment</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Pay securely with card</p>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Order Notes */}
                <div>
                  <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300 font-medium mb-2 block">
                    Order Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requests or allergies?"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={3}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="border-2 border-orange-200 dark:border-orange-700 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Items List */}
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {chefItems.map((item, index) => (
                      <div key={index} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{item.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{item.size}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600 dark:text-orange-400">
                            LKR {Number(item.subtotal).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="font-medium text-gray-900 dark:text-white">LKR {subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {orderMode === 'pickup' ? (
                          <span className="text-green-600 dark:text-green-400">FREE (Pickup)</span>
                        ) : (
                          `LKR ${deliveryFee.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tax (10%)</span>
                      <span className="font-medium text-gray-900 dark:text-white">LKR {taxAmount.toFixed(2)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900 dark:text-white">Total</span>
                      <span className="text-orange-600 dark:text-orange-400">
                        LKR {orderMode === 'pickup' ? (subtotal + taxAmount).toFixed(2) : totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Estimated Time */}
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1">
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {orderMode === 'delivery' ? 'Estimated Delivery' : 'Ready for Pickup'}
                      </p>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        ~{orderMode === 'delivery' ? estimatedDeliveryTime : 30} minutes
                      </p>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder || (orderMode === 'delivery' && !selectedAddress) || !phoneNumber}
                    className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                  >
                    {isPlacingOrder ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        Place {orderMode === 'pickup' ? 'Pickup' : 'Delivery'} Order • LKR {orderMode === 'pickup' ? (subtotal + taxAmount).toFixed(2) : totalAmount.toFixed(2)}
                      </div>
                    )}
                  </Button>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>Secure checkout with SSL encryption</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Address Picker Modal - Only for Add/Edit */}
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
    </div>
  );
};

export default CheckoutPage;
