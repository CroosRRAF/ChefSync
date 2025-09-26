import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, Check, AlertCircle, Loader } from 'lucide-react';
import { UserAddress, CheckoutCalculation, useCartService } from '../services/cartService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (orderData: any) => void;
  chefId: number;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
  isOpen, 
  onClose, 
  onOrderPlaced, 
  chefId 
}) => {
  const [step, setStep] = useState<'address' | 'review' | 'placing'>('address');
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [calculation, setCalculation] = useState<CheckoutCalculation | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    loadAddresses,
    addAddress,
    calculateCheckout,
    placeOrder
  } = useCartService();

  useEffect(() => {
    if (isOpen) {
      loadUserAddresses();
    }
  }, [isOpen]);

  const loadUserAddresses = async () => {
    try {
      const userAddresses = await loadAddresses();
      setAddresses(userAddresses);
      // Set default address if available
      const defaultAddress = userAddresses.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setUseCurrentLocation(true);
        setSelectedAddress(null);
        setLoading(false);
      },
      (error) => {
        setError('Unable to get your location. Please try again or enter address manually.');
        setLoading(false);
      }
    );
  };

  const handleAddressSelect = (address: UserAddress) => {
    setSelectedAddress(address);
    setUseCurrentLocation(false);
    setCurrentLocation(null);
  };

  const handleCalculateTotals = async () => {
    if (!selectedAddress && !currentLocation) {
      setError('Please select a delivery address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let deliveryLat: number, deliveryLng: number;

      if (useCurrentLocation && currentLocation) {
        deliveryLat = currentLocation.lat;
        deliveryLng = currentLocation.lng;
      } else if (selectedAddress && selectedAddress.latitude && selectedAddress.longitude) {
        deliveryLat = selectedAddress.latitude;
        deliveryLng = selectedAddress.longitude;
      } else {
        setError('Selected address does not have coordinates. Please use current location or select another address.');
        setLoading(false);
        return;
      }

      const calculationResult = await calculateCheckout(chefId, deliveryLat, deliveryLng);
      setCalculation(calculationResult);
      setStep('review');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error calculating delivery fee');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!calculation) return;

    setStep('placing');
    setLoading(true);
    setError(null);

    try {
      let orderData: any = {
        chef_id: chefId,
        promo_code: promoCode || undefined,
        customer_notes: customerNotes || undefined
      };

      if (useCurrentLocation && currentLocation) {
        orderData.delivery_latitude = currentLocation.lat;
        orderData.delivery_longitude = currentLocation.lng;
      } else if (selectedAddress) {
        orderData.delivery_address_id = selectedAddress.id;
      }

      const orderResult = await placeOrder(orderData);
      onOrderPlaced(orderResult);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error placing order');
      setStep('review');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewAddress = () => {
    // This would open a modal to add new address
    // For now, we'll just show a placeholder
    alert('Add new address functionality will be implemented');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={step === 'placing' ? undefined : onClose}
      />
      
      {/* Checkout Modal */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Checkout
          </h2>
          <button
            onClick={onClose}
            disabled={step === 'placing'}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'address' && (
            <div className="p-4 space-y-4">
              {/* Current Location Option */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-medium">Use Current Location</h3>
                      <p className="text-sm text-gray-500">Get delivery to your current location</p>
                    </div>
                  </div>
                  <button
                    onClick={handleGetCurrentLocation}
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    Get Location
                  </button>
                </div>
                {currentLocation && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✓ Location found: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>

              {/* Saved Addresses */}
              <div>
                <h3 className="font-medium mb-3">Saved Addresses</h3>
                <div className="space-y-2">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedAddress?.id === address.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleAddressSelect(address)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{address.label}</span>
                            {address.is_default && (
                              <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {address.address_line1}, {address.city} {address.pincode}
                          </p>
                        </div>
                        {selectedAddress?.id === address.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={handleAddNewAddress}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Address
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {/* Continue Button */}
              <button
                onClick={handleCalculateTotals}
                disabled={(!selectedAddress && !currentLocation) || loading}
                className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Calculate Delivery Fee'}
              </button>
            </div>
          )}

          {step === 'review' && calculation && (
            <div className="p-4 space-y-4">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>LKR {calculation.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%)</span>
                    <span>LKR {calculation.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>LKR {calculation.delivery_fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>LKR {calculation.total_amount.toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Delivery Fee Breakdown */}
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Distance: {calculation.distance_km} km
                  </p>
                  <p className="text-xs text-blue-600">
                    Base fee: LKR {calculation.breakdown.base_delivery_fee} 
                    {calculation.breakdown.extra_km > 0 && (
                      <> + {calculation.breakdown.extra_km} km × LKR {calculation.breakdown.extra_km_rate}</>
                    )}
                  </p>
                </div>
              </div>

              {/* Promo Code */}
              <div>
                <label className="block text-sm font-medium mb-2">Promo Code (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter promo code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    Apply
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Promo system not active yet</p>
              </div>

              {/* Customer Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Special Instructions</label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any special instructions for your order..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Payment Method */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-800">Cash on Delivery (COD)</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Payment will be collected when your order is delivered
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('address')}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Place Order'}
                </button>
              </div>
            </div>
          )}

          {step === 'placing' && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-medium mb-2">Placing Your Order...</h3>
              <p className="text-gray-500">Please wait while we process your order</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
