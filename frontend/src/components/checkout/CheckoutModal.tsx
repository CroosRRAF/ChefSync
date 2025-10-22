import React, { useState, useEffect } from 'react';
import { CreditCard, MapPin, Clock, Calculator, Gift, FileText, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCartService, CartSummary, CheckoutCalculation } from '@/services/cartService';
import SimpleDeliveryAddressSelector from '@/components/delivery/SimpleDeliveryAddressSelector';
import { DeliveryAddress } from '@/hooks/useSimpleDeliveryAddress';
import { toast } from 'sonner';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartData: CartSummary | null;
  onOrderSuccess: () => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartData,
  onOrderSuccess
}) => {
  const [checkoutData, setCheckoutData] = useState<CheckoutCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('cod');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedTip, setSelectedTip] = useState<number>(0);
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [showAddressSelector, setShowAddressSelector] = useState(false);

  const { calculateCheckout, placeOrder } = useCartService();

  // Load mock default address when modal opens
  useEffect(() => {
    if (isOpen && !selectedAddress) {
      const mockDefaultAddress: DeliveryAddress = {
        id: 1,
        label: "Home",
        address_line1: "123 Main Street, Apartment 4B",
        address_line2: "Near Central Park",
        city: "Colombo",
        pincode: "00100",
        latitude: 6.9271,
        longitude: 79.8612,
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setSelectedAddress(mockDefaultAddress);
    }
  }, [isOpen, selectedAddress]);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: <CreditCard className="h-4 w-4" />,
      description: 'Pay when your order arrives',
      available: true
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="h-4 w-4" />,
      description: 'Visa, Mastercard, Amex',
      available: false
    },
    {
      id: 'digital',
      name: 'Digital Wallet',
      icon: <CreditCard className="h-4 w-4" />,
      description: 'PayPal, Apple Pay, Google Pay',
      available: false
    }
  ];

  const tipOptions = [0, 50, 100, 150, 200];

  useEffect(() => {
    if (isOpen && selectedAddress && cartData) {
      calculateDeliveryFee();
    }
  }, [isOpen, selectedAddress, cartData]);

  const calculateDeliveryFee = async () => {
    if (!selectedAddress || !cartData) return;

    setLoading(true);
    try {
      const chefId = 1; // TODO: Get actual chef ID from cart items
      const calculation = await calculateCheckout(
        chefId,
        Number(selectedAddress.latitude) || 0,
        Number(selectedAddress.longitude) || 0
      );
      setCheckoutData(calculation);
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      toast.error('Failed to calculate delivery fee');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    const validPromoCodes = ['CHEF10', 'WELCOME', 'NEWUSER'];
    if (validPromoCodes.includes(promoCode.toUpperCase())) {
      setPromoApplied(true);
      toast.success('Promo code applied successfully!');
    } else {
      toast.error('Invalid promo code');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !cartData || !checkoutData) {
      toast.error('Missing order information');
      return;
    }

    if (paymentMethod === 'card' || paymentMethod === 'digital') {
      toast.error('This payment method is not yet available');
      return;
    }

    setPlacing(true);
    try {
      const orderData = {
        chef_id: 1,
        delivery_latitude: Number(selectedAddress.latitude),
        delivery_longitude: Number(selectedAddress.longitude),
        promo_code: promoApplied ? promoCode : undefined,
        customer_notes: customerNotes || undefined
      };

      const response = await placeOrder(orderData);
      toast.success('Order placed successfully!');
      console.log('Order placed:', response);
      onOrderSuccess();
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const formatPrice = (price: number) => `Rs. ${price.toFixed(2)}`;
  
  const getTotalWithTip = () => {
    if (!checkoutData) return 0;
    return checkoutData.total_amount + selectedTip;
  };

  const getPromoDiscount = () => {
    if (!promoApplied || !checkoutData) return 0;
    return checkoutData.subtotal * 0.1;
  };

  const getFinalTotal = () => getTotalWithTip() - getPromoDiscount();

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Checkout
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[70vh]">
            <div className="p-6 space-y-6">
              {/* Delivery Address */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {selectedAddress ? (
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{selectedAddress.label}</p>
                        <p className="text-sm text-gray-600 mt-1">{selectedAddress.address_line1}</p>
                        {selectedAddress.address_line2 && (
                          <p className="text-sm text-gray-600">{selectedAddress.address_line2}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {selectedAddress.city}, {selectedAddress.pincode}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddressSelector(true)}
                        className="text-orange-600 border-orange-200"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-2">No delivery address selected</p>
                      <Button onClick={() => setShowAddressSelector(true)} variant="outline">
                        Select Address
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {cartData && (
                    <div className="space-y-3">
                      {cartData.cart_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-medium">{item.food_name}</p>
                            <p className="text-sm text-gray-600">
                              {item.size !== 'Regular' && `${item.size} • `}
                              Qty: {item.quantity} • {formatPrice(item.unit_price)} each
                            </p>
                          </div>
                          <p className="font-medium">
                            {formatPrice(item.unit_price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Price Breakdown */}
              {checkoutData && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-purple-500" />
                      Price Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(checkoutData.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        Delivery Fee
                        <Badge variant="outline" className="text-xs">
                          {checkoutData.distance_km.toFixed(1)} km
                        </Badge>
                      </span>
                      <span>{formatPrice(checkoutData.delivery_fee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatPrice(checkoutData.tax_amount)}</span>
                    </div>
                    {selectedTip > 0 && (
                      <div className="flex justify-between">
                        <span>Tip</span>
                        <span>{formatPrice(selectedTip)}</span>
                      </div>
                    )}
                    {promoApplied && (
                      <div className="flex justify-between text-green-600">
                        <span>Promo Discount ({promoCode})</span>
                        <span>-{formatPrice(getPromoDiscount())}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(getFinalTotal())}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tip */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Add Tip (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {tipOptions.map((tip) => (
                      <Button
                        key={tip}
                        variant={selectedTip === tip ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTip(tip)}
                        className={selectedTip === tip ? "bg-orange-500 hover:bg-orange-600" : ""}
                      >
                        {tip === 0 ? "No Tip" : `Rs. ${tip}`}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Show your appreciation for great service</p>
                </CardContent>
              </Card>

              {/* Promo Code */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="h-4 w-4 text-green-500" />
                    Promo Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      disabled={promoApplied}
                      className={promoApplied ? "bg-green-50 border-green-200" : ""}
                    />
                    <Button
                      onClick={handleApplyPromo}
                      disabled={promoApplied}
                      variant={promoApplied ? "default" : "outline"}
                      className={promoApplied ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {promoApplied ? "Applied" : "Apply"}
                    </Button>
                  </div>
                  {promoApplied && (
                    <p className="text-sm text-green-600 mt-2">Promo code applied successfully!</p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-500" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border ${
                            !method.available ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <RadioGroupItem value={method.id} id={method.id} disabled={!method.available} />
                          <label htmlFor={method.id} className="flex-1 cursor-pointer flex items-center gap-3">
                            <div className="text-gray-600">{method.icon}</div>
                            <div>
                              <p className="font-medium">{method.name}</p>
                              <p className="text-sm text-gray-500">{method.description}</p>
                              {!method.available && (
                                <Badge variant="outline" className="text-xs mt-1">Coming Soon</Badge>
                              )}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Customer Notes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Special Instructions (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Textarea
                    placeholder="Any special requests or instructions for your order..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-6 border-t bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {checkoutData ? formatPrice(getFinalTotal()) : 'Calculating...'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Estimated delivery: 25-35 min
                </p>
              </div>
            </div>

            <Button
              onClick={handlePlaceOrder}
              disabled={!checkoutData || !selectedAddress || placing || loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {placing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Placing Order...
                </div>
              ) : loading ? (
                'Calculating...'
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Place Order • {checkoutData ? formatPrice(getFinalTotal()) : ''}
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-3">
              By placing this order, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delivery Address Selector Modal */}
      <SimpleDeliveryAddressSelector
        isOpen={showAddressSelector}
        onClose={() => setShowAddressSelector(false)}
        onAddressSelect={(address) => {
          setSelectedAddress(address);
          setShowAddressSelector(false);
        }}
        selectedAddress={selectedAddress}
      />
    </>
  );
};

export default CheckoutModal;