import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, X, Plus, Check, CreditCard, Truck, AlertCircle, Clock, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { addressService, DeliveryAddress } from '@/services/addressService';
import GoogleMapLocationPicker from '@/components/maps/GoogleMapLocationPicker';
import { getFoodPlaceholder } from '@/utils/placeholderUtils';

interface CheckoutPopupProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  onOrderSuccess: () => void;
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

const CheckoutPopup: React.FC<CheckoutPopupProps> = ({
  isOpen,
  onClose,
  cartItems,
  onOrderSuccess
}) => {
  const [step, setStep] = useState<'address' | 'payment' | 'review'>('address');
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  
  // Delivery fee calculation
  const [deliveryFeeInfo, setDeliveryFeeInfo] = useState<DeliveryFeeInfo | null>(null);
  const [calculatingFee, setCalculatingFee] = useState(false);

  // Add address form state
  const [newAddress, setNewAddress] = useState({
    label: '',
    address_line1: '',
    address_line2: '',
    city: '',
    pincode: '',
    latitude: 0,
    longitude: 0,
    is_default: false
  });

  // Payment and notes
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderNotes, setOrderNotes] = useState('');
  const [phone, setPhone] = useState('');

  // Calculate cart totals
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (parseFloat(item.unit_price || 0) * item.quantity);
  }, 0);

  const taxAmount = subtotal * 0.10; // 10% tax
  const deliveryFee = deliveryFeeInfo?.totalFee || 0;
  const total = subtotal + taxAmount + deliveryFee;

  // Load addresses when popup opens
  useEffect(() => {
    if (isOpen) {
      loadAddresses();
      resetSteps();
    }
  }, [isOpen]);

  // Calculate delivery fee when address is selected
  useEffect(() => {
    if (selectedAddress && selectedAddress.latitude && selectedAddress.longitude) {
      calculateDeliveryFee(selectedAddress);
    }
  }, [selectedAddress]);

  const resetSteps = () => {
    setStep('address');
    setShowAddAddressForm(false);
    setOrderNotes('');
  };

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressService.getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
      
      // Auto-select default address
      const defaultAddr = data.find((addr: DeliveryAddress) => addr.is_default);
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
      toast.error('Address coordinates not available');
      return;
    }

    setCalculatingFee(true);
    try {
      // Get chef/kitchen location from first cart item
      const firstItem = cartItems[0];
      if (!firstItem?.chef_latitude || !firstItem?.chef_longitude) {
        toast.error('Chef location not available');
        setCalculatingFee(false);
        return;
      }

      // Call backend API for accurate delivery fee with surcharges (night/weather)
      try {
        const { CartService } = await import('../../services/cartService');
        
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
            chef_latitude: firstItem.chef_latitude,
            chef_longitude: firstItem.chef_longitude,
          }
        );

        const distance = calculation.delivery_fee_breakdown?.factors?.distance_km || 0;
        const totalFee = calculation.delivery_fee;
        const estimatedTime = Math.ceil(10 + (distance * 5));

        setDeliveryFeeInfo({
          distance: parseFloat(distance.toFixed(2)),
          baseFee: 50,
          perKmFee: 15,
          totalFee: parseFloat(totalFee.toFixed(2)),
          estimatedTime,
          nightSurcharge: calculation.delivery_fee_breakdown?.breakdown?.time_surcharge || 0,
          weatherSurcharge: calculation.delivery_fee_breakdown?.breakdown?.weather_surcharge || 0,
        });

        const surchargeText = 
          (calculation.delivery_fee_breakdown?.breakdown?.time_surcharge > 0 ? ' (includes night surcharge)' : '') +
          (calculation.delivery_fee_breakdown?.breakdown?.weather_surcharge > 0 ? ' (includes rain surcharge)' : '');
        
        toast.success(`Delivery fee calculated: LKR ${totalFee.toFixed(2)}${surchargeText}`);
        
      } catch (apiError) {
        console.error('API call failed, using fallback:', apiError);
        
        // Fallback to local calculation
        const distance = calculateDistance(
          address.latitude,
          address.longitude,
          firstItem.chef_latitude,
          firstItem.chef_longitude
        );

        const baseFee = 50.00;
        const freeDistanceKm = 5.0;
        const perKmFee = 15.00;
        
        let totalFee = baseFee;
        if (distance > freeDistanceKm) {
          const extraKm = distance - freeDistanceKm;
          totalFee = baseFee + (extraKm * perKmFee);
        }

        const estimatedTime = Math.ceil(10 + (distance * 5));

        setDeliveryFeeInfo({
          distance: parseFloat(distance.toFixed(2)),
          baseFee,
          perKmFee,
          totalFee: parseFloat(totalFee.toFixed(2)),
          estimatedTime
        });

        toast.success(`Delivery fee calculated: LKR ${totalFee.toFixed(2)} (fallback)`);
      }
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      toast.error('Failed to calculate delivery fee');
    } finally {
      setCalculatingFee(false);
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleAddressSelect = (address: DeliveryAddress) => {
    setSelectedAddress(address);
    toast.success(`Selected ${address.label} address`);
  };

  const handleSaveNewAddress = async () => {
    if (!newAddress.label || !newAddress.address_line1 || !newAddress.latitude) {
      toast.error('Please fill all required fields and select location on map');
      return;
    }

    try {
      setLoading(true);
      const savedAddress = await addressService.createAddress(newAddress);
      toast.success('Address saved successfully');
      
      await loadAddresses();
      setSelectedAddress(savedAddress);
      setShowAddAddressForm(false);
      resetAddressForm();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleMapLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setNewAddress(prev => ({
      ...prev,
      address_line1: location.address,
      latitude: location.lat,
      longitude: location.lng
    }));
    setShowMapPicker(false);
    toast.success('Location selected! Complete the address details.');
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get address
        try {
          const address = await reverseGeocode(latitude, longitude);
          setNewAddress(prev => ({
            ...prev,
            address_line1: address,
            latitude,
            longitude
          }));
          toast.success('Current location set!');
        } catch (error) {
          console.error('Geocoding error:', error);
          toast.error('Could not get address for location');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get current location');
        setLoading(false);
      }
    );
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const data = await response.json();
    
    if (data.results && data.results[0]) {
      return data.results[0].formatted_address;
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const resetAddressForm = () => {
    setNewAddress({
      label: '',
      address_line1: '',
      address_line2: '',
      city: '',
      pincode: '',
      latitude: 0,
      longitude: 0,
      is_default: false
    });
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

    if (!deliveryFeeInfo) {
      toast.error('Delivery fee not calculated. Please select an address.');
      return;
    }

    setProcessingOrder(true);
    try {
      // Import order service dynamically
      const { orderService } = await import('@/services/orderService');
      
      // Create order via API
      const orderData = {
        delivery_address_id: selectedAddress.id,
        delivery_instructions: orderNotes,
        payment_method: paymentMethod,
        phone: phone,
        delivery_fee: deliveryFee,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: total
      };

      const response = await orderService.placeOrder(orderData);
      
      toast.success(`Order #${response.order_number} placed successfully!`);
      onOrderSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setProcessingOrder(false);
    }
  };

  const renderAddressStep = () => {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-6 w-6 text-orange-500" />
          <h3 className="text-xl font-bold text-gray-900">Delivery Address</h3>
        </div>
        <p className="text-sm text-gray-600 -mt-2">
          Select a saved address or add a new one
        </p>

      {showAddAddressForm ? (
        <Card className="border-2 border-orange-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Plus className="h-5 w-5 text-orange-500" />
                Add New Address
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddAddressForm(false);
                  resetAddressForm();
                }}
                className="hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location Selection Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => setShowMapPicker(true)}
                variant="outline"
                className="h-12 border-2 border-blue-300 hover:bg-blue-50"
                disabled={loading}
              >
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                <span className="font-semibold text-gray-900">Choose on Map</span>
              </Button>
              <Button
                type="button"
                onClick={handleGetCurrentLocation}
                variant="outline"
                className="h-12 border-2 border-green-300 hover:bg-green-50"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent mr-2" />
                    <span className="font-semibold text-gray-900">Detecting...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="h-5 w-5 mr-2 text-green-600" />
                    <span className="font-semibold text-gray-900">Current Location</span>
                  </>
                )}
              </Button>
            </div>

            {/* Location Status */}
            {newAddress.latitude !== 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Location selected</p>
                  <p className="text-xs text-green-700">{newAddress.latitude.toFixed(4)}, {newAddress.longitude.toFixed(4)}</p>
                </div>
              </div>
            )}

            {/* Address Form */}
            <div className="space-y-4">
              <div>
                <Label>Address Label *</Label>
                <Input
                  placeholder="e.g. Home, Work, Office"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Street Address *</Label>
                <Textarea
                  placeholder="Street address, building name, etc."
                  value={newAddress.address_line1}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, address_line1: e.target.value }))}
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Apartment / Suite (Optional)</Label>
                <Input
                  placeholder="Apartment, suite, floor, etc."
                  value={newAddress.address_line2}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, address_line2: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>City</Label>
                  <Input
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input
                    placeholder="Postal code"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, pincode: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddAddressForm(false);
                  resetAddressForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNewAddress}
                disabled={loading || !newAddress.label || !newAddress.address_line1 || newAddress.latitude === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Address
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Saved Addresses */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading addresses...</p>
            </div>
          ) : addresses.length === 0 ? (
            <Card className="p-8 text-center border-2 border-dashed">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-900 font-medium mb-1">No saved addresses</p>
              <p className="text-sm text-gray-500 mb-4">Add your first delivery address to continue</p>
              <Button
                onClick={() => setShowAddAddressForm(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </Card>
          ) : (
            <>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {addresses.map((address) => (
                    <Card
                      key={address.id}
                      className={`cursor-pointer transition-all border-2 ${
                        selectedAddress?.id === address.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleAddressSelect(address)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${selectedAddress?.id === address.id ? 'text-orange-500' : 'text-gray-400'}`}>
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{address.label}</h4>
                              {address.is_default && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs">Default</Badge>
                              )}
                              {selectedAddress?.id === address.id && (
                                <Check className="h-4 w-4 text-orange-500 ml-auto" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-1">{address.address_line1}</p>
                            {address.address_line2 && (
                              <p className="text-sm text-gray-500 line-clamp-1">{address.address_line2}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">{address.city}, {address.pincode}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {/* Add New Address Button */}
              <Button
                variant="outline"
                onClick={() => setShowAddAddressForm(true)}
                className="w-full border-2 border-dashed border-orange-300 hover:border-orange-500 hover:bg-orange-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Address
              </Button>
            </>
          )}
        </>
      )}

      {/* Phone Number */}
      <div>
        <Label>Phone Number *</Label>
        <Input
          placeholder="Enter your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {/* Delivery Fee Info */}
      {deliveryFeeInfo && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-blue-900">Delivery Information</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Distance:</span>
                    <span className="font-medium text-blue-900">{deliveryFeeInfo.distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Base Delivery Fee:</span>
                    <span className="font-medium text-blue-900">LKR {(deliveryFeeInfo.totalFee - (deliveryFeeInfo.nightSurcharge || 0) - (deliveryFeeInfo.weatherSurcharge || 0)).toFixed(2)}</span>
                  </div>
                  {deliveryFeeInfo.nightSurcharge && deliveryFeeInfo.nightSurcharge > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>🌙 Night Surcharge (+10%):</span>
                      <span className="font-medium">+LKR {deliveryFeeInfo.nightSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                  {deliveryFeeInfo.weatherSurcharge && deliveryFeeInfo.weatherSurcharge > 0 && (
                    <div className="flex justify-between text-blue-700">
                      <span>🌧️ Rain Surcharge (+10%):</span>
                      <span className="font-medium">+LKR {deliveryFeeInfo.weatherSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator className="my-1" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-blue-800">Total Delivery Fee:</span>
                    <span className="text-blue-900">LKR {deliveryFeeInfo.totalFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Estimated Time:</span>
                    <span className="font-medium text-blue-900">~{deliveryFeeInfo.estimatedTime} mins</span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Base: LKR {deliveryFeeInfo.baseFee} + LKR {deliveryFeeInfo.perKmFee}/km after 5km
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedAddress && !showAddAddressForm && (
        <Button
          onClick={() => setStep('payment')}
          disabled={!phone || calculatingFee}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          Continue to Payment
        </Button>
      )}
    </div>
    );
  };

  const renderPaymentStep = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => setStep('address')}
        className="mb-2"
      >
        ← Back to Address
      </Button>

      <h3 className="text-lg font-semibold">Payment Method</h3>

      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
        <Card className={`cursor-pointer ${paymentMethod === 'cash' ? 'ring-2 ring-orange-500' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="h-5 w-5" />
                <div>
                  <p className="font-medium">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">Pay when you receive your order</p>
                </div>
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-not-allowed bg-gray-100 dark:bg-gray-900 opacity-60">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="card" id="card" disabled />
              <Label htmlFor="card" className="flex items-center gap-2 flex-1 opacity-60">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-500">Card Payment</p>
                  <p className="text-xs text-gray-400">Pay securely online</p>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  Coming Soon
                </Badge>
              </Label>
            </div>
          </CardContent>
        </Card>
      </RadioGroup>

      <div>
        <Label>Order Notes (Optional)</Label>
        <Textarea
          placeholder="Any special instructions for your order..."
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          rows={3}
        />
      </div>

      <Button
        onClick={() => setStep('review')}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
      >
        Review Order
      </Button>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => setStep('payment')}
        className="mb-2"
      >
        ← Back to Payment
      </Button>

      <h3 className="text-lg font-semibold">Review Your Order</h3>

      {/* Delivery Address Summary */}
      {selectedAddress && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{selectedAddress.label}</p>
            <p className="text-sm text-gray-600">{selectedAddress.address_line1}</p>
            {selectedAddress.address_line2 && (
              <p className="text-sm text-gray-600">{selectedAddress.address_line2}</p>
            )}
            <p className="text-sm text-gray-600">{selectedAddress.city}, {selectedAddress.pincode}</p>
            <p className="text-sm text-gray-500">Phone: {phone}</p>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Order Items ({cartItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-48">
            <div className="space-y-3">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.food_name}</p>
                    <p className="text-xs text-gray-500">
                      {item.cook_name} • {item.size}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">LKR {(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Price Summary */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>LKR {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Delivery Fee:</span>
            <span>LKR {deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax (10%):</span>
            <span>LKR {taxAmount.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span className="text-orange-600">LKR {total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardContent className="p-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium">
            Payment: {paymentMethod === 'cash' ? 'Cash on Delivery' : 'Card Payment'}
          </span>
        </CardContent>
      </Card>

      {orderNotes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-1">Order Notes:</p>
            <p className="text-sm text-gray-600">{orderNotes}</p>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handlePlaceOrder}
        disabled={processingOrder}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-lg py-6"
      >
        {processingOrder ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            Processing Order...
          </div>
        ) : (
          <>
            <Check className="h-5 w-5 mr-2" />
            Place Order • LKR {total.toFixed(2)}
          </>
        )}
      </Button>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <Truck className="h-5 w-5 text-orange-500" />
              Checkout
            </DialogTitle>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-lg">
            {['address', 'payment', 'review'].map((s, index) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  step === s ? 'bg-orange-500 text-white shadow-lg' : 
                  ['payment', 'review'].includes(step) && index < ['address', 'payment', 'review'].indexOf(step) ? 
                  'bg-green-500 text-white shadow-md' : 'bg-white border-2 border-gray-300 text-gray-600'
                }`}>
                  {['payment', 'review'].includes(step) && index < ['address', 'payment', 'review'].indexOf(step) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 2 && (
                  <div className={`flex-1 h-1.5 mx-3 rounded-full ${
                    ['payment', 'review'].includes(step) && index < ['address', 'payment', 'review'].indexOf(step) ?
                    'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {step === 'address' && renderAddressStep()}
          {step === 'payment' && renderPaymentStep()}
          {step === 'review' && renderReviewStep()}
        </DialogContent>
      </Dialog>

      {/* Map Picker Modal - High z-index to appear above dialog */}
      <GoogleMapLocationPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleMapLocationSelect}
        initialLocation={newAddress.latitude !== 0 ? {
          lat: newAddress.latitude,
          lng: newAddress.longitude
        } : undefined}
      />
    </>
  );
};

export default CheckoutPopup;
