import React, { useState, useEffect } from 'react';
import { 
  MapPin, X, ChevronRight, Clock, Truck, 
  CreditCard, Plus, Check, Edit2, Trash2,
  Navigation, AlertCircle, Home, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDatabaseCart } from '@/context/DatabaseCartContext';
import { orderService } from '@/services/orderService';
import GoogleMapLocationPicker from '@/components/maps/GoogleMapLocationPicker';
import { getFoodPlaceholder } from '@/utils/placeholderUtils';

interface ChefSyncCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: () => void;
  chefId?: number;
  chefName?: string;
}

interface DeliveryFeeInfo {
  distance: number;
  baseFee: number;
  perKmFee: number;
  totalFee: number;
  estimatedTime: number;
  nightSurcharge?: number;
  weatherSurcharge?: number;
}

interface CartItem {
  id: number;
  food_name: string;
  food_image: string | null;
  size?: string;
  quantity: number;
  unit_price: number | string;
  total_price?: number | string;
}

const ChefSyncCheckout: React.FC<ChefSyncCheckoutProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  chefId,
  chefName
}) => {
  const { items: cartItems, getGrandTotal, getItemCount, clearCart } = useDatabaseCart();
  // States
  const [currentStep, setCurrentStep] = useState<'delivery' | 'review' | 'processing'>('delivery');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);

  // New Address Form
  const [newAddress, setNewAddress] = useState({
    label: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: 'Western Province',
    pincode: '',
    latitude: 0,
    longitude: 0,
    is_default: false
  });

  // Order Details
  const [phone, setPhone] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [deliveryFeeInfo, setDeliveryFeeInfo] = useState<DeliveryFeeInfo | null>(null);
  const [calculatingFee, setCalculatingFee] = useState(false);

  // Calculations
  const subtotal = getGrandTotal();
  const taxAmount = subtotal * 0.10;
  const deliveryFee = deliveryFeeInfo?.totalFee || 50;
  const total = subtotal + taxAmount + deliveryFee;

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedAddress?.latitude && selectedAddress?.longitude) {
      calculateDeliveryFee(selectedAddress);
    }
  }, [selectedAddress]);

  const resetForm = () => {
    setCurrentStep('delivery');
    setShowAddressModal(false);
    setPhone('');
    setDeliveryInstructions('');
  };

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressService.getAddresses();

      // Normalize different response shapes: array | { results: [] } | { addresses: [] } | { data: [] }
      let addrArray: any[] = [];
      if (Array.isArray(data)) {
        addrArray = data;
      } else if (data && typeof data === 'object') {
        const d: any = data;
        addrArray = d.results || d.addresses || d.data || [];
      }

      setAddresses(addrArray);

      const defaultAddr = Array.isArray(addrArray) ? addrArray.find((addr: any) => addr.is_default) : undefined;
      if (defaultAddr) {
        setSelectedAddress(defaultAddr);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const calculateDeliveryFee = async (address: DeliveryAddress) => {
    if (!address.latitude || !address.longitude) {
      return;
    }

    try {
      setCalculatingFee(true);
      
      // Get chef location from first cart item
      const firstItem = cartItems[0];
      if (!firstItem?.kitchen_location) {
        console.warn('No kitchen location in cart item');
        // Fallback to mock calculation
        const distance = 3.2;
        setDeliveryFeeInfo({
          distance,
          baseFee: 50,
          perKmFee: 15,
          totalFee: 50,
          estimatedTime: Math.ceil(distance * 8)
        });
        return;
      }

      // Call backend API for accurate delivery fee with surcharges
      const { CartService } = await import('@/services/cartService');
      
      const calculation = await CartService.calculateCheckout(
        cartItems.map(item => ({
          price_id: item.price_id,
          quantity: item.quantity
        })),
        address.id,
        {
          order_type: 'regular',
          delivery_latitude: address.latitude,
          delivery_longitude: address.longitude,
          chef_latitude: firstItem.kitchen_location.lat,
          chef_longitude: firstItem.kitchen_location.lng,
        }
      );

      const distance = calculation.delivery_fee_breakdown?.factors?.distance_km || 0;
      const totalFee = calculation.delivery_fee;
      const estimatedTime = Math.ceil(distance * 8);

      setDeliveryFeeInfo({
        distance: parseFloat(distance.toFixed(2)),
        baseFee: 50,
        perKmFee: 15,
        totalFee: parseFloat(totalFee.toFixed(2)),
        estimatedTime,
        nightSurcharge: calculation.delivery_fee_breakdown?.breakdown?.time_surcharge || 0,
        weatherSurcharge: calculation.delivery_fee_breakdown?.breakdown?.weather_surcharge || 0,
      });

      console.log('✅ Delivery fee calculated with surcharges:', {
        totalFee,
        nightSurcharge: calculation.delivery_fee_breakdown?.breakdown?.time_surcharge,
        weatherSurcharge: calculation.delivery_fee_breakdown?.breakdown?.weather_surcharge,
      });
      
    } catch (error) {
      console.error('Error calculating fee:', error);
      toast.error('Failed to calculate delivery fee');
      // Fallback
      setDeliveryFeeInfo({
        distance: 3.2,
        baseFee: 50,
        perKmFee: 15,
        totalFee: 50,
        estimatedTime: 25
      });
    } finally {
      setCalculatingFee(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewAddress(prev => ({
          ...prev,
          latitude: parseFloat(position.coords.latitude.toFixed(6)),
          longitude: parseFloat(position.coords.longitude.toFixed(6))
        }));
        toast.success('Location detected successfully');
        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === error.TIMEOUT) {
          toast.error('[GEOLOCATION_TIMEOUT] Location request timed out. Please try again.');
        } else {
          toast.error('Failed to get location. Please select on map.');
        }
        setLoading(false);
      },
      { timeout: 15000 }
    );
  };

  const handleMapLocationSelect = (location: { lat: number; lng: number; address: string; city?: string; pincode?: string }) => {
    setNewAddress(prev => ({
      ...prev,
      latitude: parseFloat(location.lat.toFixed(6)),
      longitude: parseFloat(location.lng.toFixed(6)),
      address_line1: location.address || prev.address_line1,
      city: location.city || prev.city,
      pincode: location.pincode || prev.pincode
    }));
    setShowMapPicker(false);
    toast.success('Location selected successfully');
  };

  const handleSaveAddress = async () => {
    if (!newAddress.label || !newAddress.address_line1 || !newAddress.city || !newAddress.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!newAddress.latitude || !newAddress.longitude) {
      toast.error('Please select location on map or use current location');
      return;
    }

    try {
      setLoading(true);
      // Prevent saving more than 3 addresses (frontend safeguard)
      if (Array.isArray(addresses) && addresses.length >= 3) {
        toast.error('You can only save up to 3 addresses. Please delete an existing address to add a new one.');
        return;
      }

      // Format coordinates to match backend DecimalField max_digits limits
      const payload = {
        ...newAddress,
        latitude: newAddress.latitude ? parseFloat(newAddress.latitude.toFixed(6)) : newAddress.latitude,
        longitude: newAddress.longitude ? parseFloat(newAddress.longitude.toFixed(6)) : newAddress.longitude
      };

      const savedAddress = await addressService.createAddress(payload as any);
      await loadAddresses();
      setSelectedAddress(savedAddress);
      setShowAddressModal(false);
      toast.success('Address saved successfully');
      
      // Reset form
      setNewAddress({
        label: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: 'Western Province',
        pincode: '',
        latitude: 0,
        longitude: 0,
        is_default: false
      });
    } catch (error: any) {
      console.error('Error saving address:', error);
      // If error is from server with JSON message, try to parse and show it
      try {
        const msg = typeof error.message === 'string' ? error.message : String(error);
        // If server included an HTTP prefix (we added it), attempt to find JSON after the dash
        const markerIndex = msg.indexOf('-');
        let maybeJson = null;
        if (markerIndex !== -1) {
          maybeJson = msg.substring(markerIndex + 1).trim();
        } else {
          maybeJson = msg;
        }

        // Try parse JSON; if fails, just show the whole message
        try {
          const parsed = JSON.parse(maybeJson);
          const detail = parsed.detail || parsed.error || parsed.message || null;
          if (detail) {
            toast.error(String(detail));
          } else if (typeof parsed === 'object') {
            const fields = Object.keys(parsed).map(k => `${k}: ${parsed[k]}`).join('\n');
            toast.error(fields || 'Failed to save address');
          } else {
            toast.error(String(parsed));
          }
        } catch (inner) {
          // Not JSON - show raw message (useful for HTTP 401/400 strings)
          toast.error(msg || 'Failed to save address');
        }
      } catch (parseError) {
        toast.error('Failed to save address');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await addressService.deleteAddress(addressId);
      await loadAddresses();
      if (selectedAddress?.id === addressId) {
        setSelectedAddress(null);
      }
      toast.success('Address deleted successfully');
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }

    try {
      setProcessingOrder(true);
      setCurrentStep('processing');

      // Ensure all cart items belong to the same chef/cook before placing the order
      if (cartItems.length > 0) {
        const firstChefId = (cartItems[0] as any).chef_id || (cartItems[0] as any).chefId || null;
        const mixedChefs = cartItems.some((it: any) => ((it.chef_id || it.chefId || null) !== firstChefId));
        if (mixedChefs) {
          toast.error('Your cart contains items from multiple cooks. Please order items from one cook at a time.');
          setCurrentStep('review');
          setProcessingOrder(false);
          return;
        }
      }

      const orderData = {
        delivery_address_id: selectedAddress.id,
        delivery_instructions: deliveryInstructions,
        payment_method: 'cash',
        phone: phone,
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax_amount: parseFloat(taxAmount.toFixed(2)),
        delivery_fee: parseFloat(deliveryFee.toFixed(2)),
        total_amount: parseFloat(total.toFixed(2))
      };

      const result = await orderService.placeOrder(orderData);
      
      toast.success('🎉 Order placed successfully!');
      setTimeout(() => {
        onOrderSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.error || 'Failed to place order');
      setCurrentStep('review');
    } finally {
      setProcessingOrder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Checkout Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div className="relative w-full sm:max-w-2xl max-h-[90vh] bg-white sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white sm:rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold">ChefSync Checkout</h2>
              <p className="text-sm text-green-50">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 border-b">
            <div className={`flex items-center gap-2 ${currentStep === 'delivery' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'delivery' ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {currentStep !== 'delivery' ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <span className="text-sm font-medium">Delivery</span>
            </div>
            
            <div className="w-12 h-0.5 bg-gray-300" />
            
            <div className={`flex items-center gap-2 ${currentStep === 'review' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'review' ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {currentStep === 'processing' ? <Check className="h-4 w-4" /> : '2'}
              </div>
              <span className="text-sm font-medium">Review</span>
            </div>
            
            <div className="w-12 h-0.5 bg-gray-300" />
            
            <div className={`flex items-center gap-2 ${currentStep === 'processing' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'processing' ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Confirm</span>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            {currentStep === 'delivery' && (
              <div className="p-4 space-y-4">
                {/* Delivery Address Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Truck className="h-5 w-5 text-green-600" />
                      Delivery Address
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddressModal(true)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add New
                    </Button>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
                      <p className="text-sm text-gray-500 mt-2">Loading addresses...</p>
                    </div>
                  ) : !Array.isArray(addresses) || addresses.length === 0 ? (
                    <Card className="border-2 border-dashed border-gray-300">
                      <CardContent className="p-8 text-center">
                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-2">No saved addresses</p>
                        <Button
                          onClick={() => setShowAddressModal(true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Delivery Address
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {Array.isArray(addresses) && addresses.map((address: any) => (
                        <Card
                          key={address.id}
                          className={`cursor-pointer transition-all ${
                            selectedAddress?.id === address.id
                              ? 'border-2 border-green-600 bg-green-50 ring-2 ring-green-100'
                              : 'border-2 border-gray-200 hover:border-green-300'
                          }`}
                          onClick={() => setSelectedAddress(address)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${
                                selectedAddress?.id === address.id ? 'bg-green-600' : 'bg-gray-100'
                              }`}>
                                {address.label.toLowerCase() === 'home' ? (
                                  <Home className={`h-4 w-4 ${selectedAddress?.id === address.id ? 'text-white' : 'text-gray-600'}`} />
                                ) : address.label.toLowerCase() === 'work' || address.label.toLowerCase() === 'office' ? (
                                  <Briefcase className={`h-4 w-4 ${selectedAddress?.id === address.id ? 'text-white' : 'text-gray-600'}`} />
                                ) : (
                                  <MapPin className={`h-4 w-4 ${selectedAddress?.id === address.id ? 'text-white' : 'text-gray-600'}`} />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900">{address.label}</h4>
                                  {address.is_default && (
                                    <Badge variant="secondary" className="text-xs">Default</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{address.address_line1}</p>
                                {address.address_line2 && (
                                  <p className="text-sm text-gray-600">{address.address_line2}</p>
                                )}
                                <p className="text-sm text-gray-500">{address.city}, {address.pincode}</p>
                                
                                {selectedAddress?.id === address.id && deliveryFeeInfo && (
                                  <div className="flex items-center gap-4 mt-2 pt-2 border-t">
                                    <div className="flex items-center gap-1 text-xs text-green-600">
                                      <Truck className="h-3 w-3" />
                                      <span>LKR {deliveryFeeInfo.totalFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <Clock className="h-3 w-3" />
                                      <span>{deliveryFeeInfo.estimatedTime} mins</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <MapPin className="h-3 w-3" />
                                      <span>{deliveryFeeInfo.distance.toFixed(1)} km</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {selectedAddress?.id === address.id && (
                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                              )}
                            </div>
                            
                            {selectedAddress?.id === address.id && (
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAddress(address.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact Details */}
                {selectedAddress && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Contact Details</h3>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+94 XX XXX XXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                      <Textarea
                        id="instructions"
                        placeholder="Add any special instructions for delivery..."
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                        className="mt-1 resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'review' && (
              <div className="p-4 space-y-4">
                {/* Order Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
                  <ScrollArea className="max-h-64">
                    <div className="space-y-3">
                      {cartItems.map((item, index) => (
                        <div key={index} className="flex gap-3 pb-3 border-b last:border-0">
                          <img
                            src={item.food_image || '/food-placeholder.jpg'}
                            alt={item.food_name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.food_name}</h4>
                            <p className="text-xs text-gray-500">{item.size}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                              <span className="text-sm font-semibold">
                                LKR {(parseFloat(String(item.unit_price || '0')) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <Separator />

                {/* Delivery Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Delivery Details</h3>
                  <Card className="bg-gray-50 border-0">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{selectedAddress?.label}</p>
                          <p className="text-xs text-gray-600">{selectedAddress?.address_line1}</p>
                          <p className="text-xs text-gray-500">{selectedAddress?.city}, {selectedAddress?.pincode}</p>
                        </div>
                      </div>
                      {phone && (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4" />
                          <p className="text-sm text-gray-600">📞 {phone}</p>
                        </div>
                      )}
                      {deliveryInstructions && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                          <p className="text-xs text-gray-600">{deliveryInstructions}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Bill Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Bill Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Item Total</span>
                      <span>LKR {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span>LKR {deliveryFee.toFixed(2)}</span>
                    </div>
                    {deliveryFeeInfo && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 pl-4">
                        <MapPin className="h-3 w-3" />
                        <span>{deliveryFeeInfo.distance.toFixed(1)} km • {deliveryFeeInfo.estimatedTime} mins</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxes & Charges</span>
                      <span>LKR {taxAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total Amount</span>
                      <span className="text-green-600">LKR {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-3 flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-yellow-700" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Cash on Delivery</p>
                      <p className="text-xs text-yellow-700">Pay when you receive your order</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 'processing' && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Processing Your Order...</h3>
                <p className="text-gray-600">Please wait while we confirm your order</p>
              </div>
            )}
          </ScrollArea>

          {/* Footer Actions */}
          {currentStep !== 'processing' && (
            <div className="p-4 border-t bg-white sm:rounded-b-2xl">
              <div className="flex items-center justify-between gap-3">
                {currentStep === 'delivery' ? (
                  <>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Estimated Total</p>
                      <p className="text-lg font-bold text-green-600">LKR {total.toFixed(2)}</p>
                    </div>
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 px-8"
                      onClick={() => {
                        if (!selectedAddress) {
                          toast.error('Please select a delivery address');
                          return;
                        }
                        if (!phone) {
                          toast.error('Please enter your phone number');
                          return;
                        }
                        setCurrentStep('review');
                      }}
                      disabled={!selectedAddress || !phone || loading}
                    >
                      Continue
                      <ChevronRight className="h-5 w-5 ml-1" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setCurrentStep('delivery')}
                      disabled={processingOrder}
                    >
                      Back
                    </Button>
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 flex-1"
                      onClick={handlePlaceOrder}
                      disabled={processingOrder}
                    >
                      {processingOrder ? 'Processing...' : `Place Order • LKR ${total.toFixed(2)}`}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Address Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Add Delivery Address</h3>
              <p className="text-sm text-gray-500">Select your location and fill in the details</p>
            </div>

            {/* Location Selection */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-1"
                onClick={() => setShowMapPicker(true)}
              >
                <MapPin className="h-5 w-5 text-green-600" />
                <span className="text-xs">Choose on Map</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-1"
                onClick={handleGetCurrentLocation}
                disabled={loading}
              >
                <Navigation className="h-5 w-5 text-blue-600" />
                <span className="text-xs">Current Location</span>
              </Button>
            </div>

            {newAddress.latitude !== 0 && newAddress.longitude !== 0 && (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-700">Location selected</span>
                <span className="text-xs text-green-600 ml-auto">
                  {newAddress.latitude.toFixed(4)}, {newAddress.longitude.toFixed(4)}
                </span>
              </div>
            )}

            <Separator />

            {/* Address Form */}
            <ScrollArea className="max-h-80">
              <div className="space-y-3 pr-4">
                <div>
                  <Label htmlFor="label">Address Label *</Label>
                  <Input
                    id="label"
                    placeholder="e.g., Home, Work, Office"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address_line1">Street Address *</Label>
                  <Textarea
                    id="address_line1"
                    placeholder="Building name, street name, area"
                    value={newAddress.address_line1}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, address_line1: e.target.value }))}
                    className="mt-1 resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="address_line2">Apartment / Floor (Optional)</Label>
                  <Input
                    id="address_line2"
                    placeholder="Apartment, suite, floor"
                    value={newAddress.address_line2}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, address_line2: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Postal Code *</Label>
                    <Input
                      id="pincode"
                      placeholder="00000"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, pincode: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={newAddress.is_default}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_default" className="text-sm font-normal cursor-pointer">
                    Set as default address
                  </Label>
                </div>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowAddressModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAddress}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Saving...' : 'Save Address'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <GoogleMapLocationPicker
          isOpen={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onLocationSelect={handleMapLocationSelect}
          initialLocation={
            newAddress.latitude && newAddress.longitude
              ? { lat: newAddress.latitude, lng: newAddress.longitude }
              : undefined
          }
        />
      )}
    </>
  );
};

export default ChefSyncCheckout;
