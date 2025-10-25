import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import GoogleMapsAddressPicker from '@/components/checkout/GoogleMapsAddressPicker';
import DeliveryFeeBreakdown from '@/components/checkout/DeliveryFeeBreakdown';
import { DeliveryAddress, addressService } from '@/services/addressService';
import { 
  ArrowLeft,
  CreditCard,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  Truck,
  Phone,
  Mail,
  User,
  Home,
  LayoutDashboard,
  AlertCircle,
  Navigation,
  Edit2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { CartItem } from '@/services/menuService';
import { orderService } from '@/services/orderService';
import { paymentService } from '@/services/paymentService';
import { getFoodPlaceholder } from '@/utils/placeholderUtils';
import { CheckoutCalculation, CartService } from '@/services/cartService';
import { validateSriLankanPhone } from '@/utils/phoneValidation';
import PhoneInput from '@/components/ui/phone-input';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cartSummary, clearCart, refreshCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  // Form states
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: user?.address || '',
    city: 'Colombo',
    postalCode: '',
    phone: user?.phone || '',
    instructions: ''
  });

  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [existingAddresses, setExistingAddresses] = useState<DeliveryAddress[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderNotes, setOrderNotes] = useState('');
  
  // Payment form states
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([]);
  
  // Checkout calculation states
  const [checkoutCalculation, setCheckoutCalculation] = useState<CheckoutCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Redirect if not authenticated or no cart items
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'customer') {
      navigate('/auth/login');
      return;
    }
    if (!cartSummary || cartSummary.total_items === 0) {
      navigate('/customer/cart');
      return;
    }
  }, [isAuthenticated, user, cartSummary, navigate]);

  // Load available payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const methods = await paymentService.getAvailablePaymentMethods();
        setAvailablePaymentMethods(methods);
      } catch (error) {
        console.error('Error loading payment methods:', error);
        // Set default methods if API fails
        setAvailablePaymentMethods([
          { id: 'cash', name: 'Cash on Delivery', type: 'cash', enabled: true },
          { id: 'card', name: 'Credit/Debit Card', type: 'card', enabled: true },
          { id: 'online', name: 'Online Payment', type: 'online', enabled: false }
        ]);
      }
    };

    if (isAuthenticated) {
      loadPaymentMethods();
    }
  }, [isAuthenticated]);

  // Load addresses
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const addresses = await addressService.getAddresses();
        setExistingAddresses(addresses || []);
        if (addresses && addresses.length > 0) {
          const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
          setSelectedAddress(defaultAddress);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
        setExistingAddresses([]);
      }
    };

    if (isAuthenticated) {
      loadAddresses();
    }
  }, [isAuthenticated]);

  const cart = cartSummary?.cart_items || [];
  
  const subtotal = cart.reduce((sum, item) => {
    return sum + (parseFloat((item.unit_price || 0).toString()) * item.quantity);
  }, 0);

  // Use calculated values from backend or fallback to basic calculation
  const deliveryFee = checkoutCalculation?.delivery_fee || 50;
  const taxAmount = checkoutCalculation?.tax_amount || (subtotal * 0.10);
  const total = checkoutCalculation?.total_amount || (subtotal + deliveryFee + taxAmount);
  
  // Calculate checkout when address changes
  const calculateCheckout = async () => {
    if (!selectedAddress || cart.length === 0) return;
    
    setIsCalculating(true);
    try {
      // Get chef location from first cart item (assuming all items from same chef)
      const firstItem = cart[0];
      const chefLocation = firstItem?.kitchen_location;
      
      const calculation = await CartService.calculateCheckout(
        cart.map(item => ({
          price_id: item.price_id,
          quantity: item.quantity
        })),
        selectedAddress.id,
        {
          order_type: 'regular', // Can be changed based on order type
          delivery_latitude: selectedAddress.latitude,
          delivery_longitude: selectedAddress.longitude,
          chef_latitude: chefLocation?.lat,
          chef_longitude: chefLocation?.lng,
        }
      );
      
      setCheckoutCalculation(calculation);
      console.log('Checkout calculation:', calculation);
    } catch (error) {
      console.error('Failed to calculate checkout:', error);
      toast.error('Failed to calculate delivery fee. Using default values.');
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Recalculate when address changes
  useEffect(() => {
    if (selectedAddress && cart.length > 0) {
      calculateCheckout();
    }
  }, [selectedAddress?.id, cart.length]);

  const handleInputChange = (field: string, value: string) => {
    setDeliveryInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCardInputChange = (field: string, value: string) => {
    setCardDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateCardDetails = () => {
    if (paymentMethod !== 'card') return { isValid: true, errors: [] };
    
    const validation = paymentService.validatePaymentDetails({
      order_id: 0, // Will be set when order is created
      payment_method: 'card',
      amount: total.toString(),
      payment_details: cardDetails
    });
    
    return validation;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate delivery info
      if (!selectedAddress || !deliveryInfo.phone) {
        toast.error('Please select a delivery address and provide phone number');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = async () => {
    // Comprehensive validation before placing order
    
    // 1. Check if cart is not empty
    if (!cart || cart.length === 0) {
      toast.error('Your cart is empty. Please add items before placing an order.');
      navigate('/menu');
      return;
    }

    // 2. Validate delivery address
    if (!selectedAddress) {
      toast.error('Please select a delivery address before placing your order.');
      setCurrentStep(1); // Go back to delivery step
      return;
    }

    // 3. Validate phone number
    if (!deliveryInfo.phone || deliveryInfo.phone.trim() === '') {
      toast.error('Please provide a valid phone number for delivery contact.');
      setCurrentStep(1); // Go back to delivery step
      return;
    }

    // 4. Validate Sri Lankan phone number format
    const phoneValidation = validateSriLankanPhone(deliveryInfo.phone);
    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.error || 'Please provide a valid Sri Lankan phone number (e.g., +94 77 123 4567 or 0771234567)');
      setCurrentStep(1);
      return;
    }

    // 5. Validate payment method is selected
    if (!paymentMethod) {
      toast.error('Please select a payment method.');
      setCurrentStep(2); // Go back to payment step
      return;
    }

    // 6. Validate card details if card payment is selected
    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || cardDetails.cardNumber.trim() === '') {
        toast.error('Please enter your card number');
        setCurrentStep(2);
        return;
      }
      
      if (!cardDetails.cardHolder || cardDetails.cardHolder.trim() === '') {
        toast.error('Please enter the cardholder name');
        setCurrentStep(2);
        return;
      }
      
      if (!cardDetails.expiryMonth || !cardDetails.expiryYear) {
        toast.error('Please enter the card expiry date');
        setCurrentStep(2);
        return;
      }
      
      if (!cardDetails.cvv || cardDetails.cvv.trim() === '') {
        toast.error('Please enter the CVV code');
        setCurrentStep(2);
        return;
      }

      const validation = validateCardDetails();
      if (!validation.isValid) {
        toast.error(`Payment validation failed: ${validation.errors.join(', ')}`);
        setCurrentStep(2);
        return;
      }
    }

    // 7. Validate cart items have valid data
    const invalidItems = cart.filter(item => !item.price_id || item.quantity <= 0);
    if (invalidItems.length > 0) {
      toast.error('Some cart items are invalid. Please refresh your cart and try again.');
      await refreshCart();
      return;
    }

    // 8. Check minimum order amount (if applicable)
    if (subtotal < 100) {
      toast.error('Minimum order amount is LKR 100. Please add more items.');
      navigate('/menu');
      return;
    }

    // 9. Confirm user authentication
    if (!isAuthenticated || !user) {
      toast.error('Please log in to place an order.');
      navigate('/auth/login');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Refresh cart items to get updated chef_id field
      console.log('Refreshing cart items to get updated chef_id...');
      await refreshCart();
      
      // Get updated cart items
      const updatedCart = cartSummary?.cart_items || [];
      console.log('Updated cart items:', updatedCart);
      
      // Format order data
      const orderData = orderService.formatOrderData(
        selectedAddress,
        deliveryInfo.instructions,
        orderNotes,
        paymentMethod,
        updatedCart
      );

      // Create the order first
      const order = await orderService.createOrder(orderData);
      console.log('Order created:', order);
      
      // Process payment if not cash on delivery
      if (paymentMethod !== 'cash') {
        try {
          const paymentData = {
            order_id: order.id || order.order_id,
            payment_method: paymentMethod,
            amount: total.toString(),
            save_payment_method: savePaymentMethod,
            payment_details: paymentMethod === 'card' ? cardDetails : undefined
          };

          console.log('Processing payment:', paymentData);
          const payment = await paymentService.processPayment(paymentData);
          console.log('Payment processed:', payment);

          if (payment.status === 'completed') {
            toast.success('Payment successful! Order placed successfully! 🎉');
          } else if (payment.status === 'pending') {
            toast.success('Order placed! Payment is being processed. You will receive confirmation shortly. 🎉');
          } else {
            toast.error('Payment failed. Please try again.');
            return;
          }
        } catch (paymentError) {
          console.error('Payment processing error:', paymentError);
          toast.error('Payment failed. Please try again or use cash on delivery.');
          return;
        }
      } else {
        toast.success('Order placed successfully! Pay cash on delivery. 🎉');
      }
      
      // Clear cart after successful order
      await clearCart();
      
      // Navigate to success page
      navigate('/customer/orders', { 
        state: { 
          message: 'Your order has been placed successfully! You will receive a confirmation email shortly.',
          orderNumber: order.order_number
        }
      });
      
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!cartSummary || cartSummary.total_items === 0) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6 flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/customer/cart')}
            className="hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/customer/dashboard')}
            className="hover:bg-green-50"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Checkout
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete your order in a few simple steps
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Steps */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                        ${currentStep >= step 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                        }
                      `}>
                        {step}
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium">
                          {step === 1 && 'Delivery Info'}
                          {step === 2 && 'Payment'}
                          {step === 3 && 'Review'}
                        </div>
                      </div>
                      {step < 3 && (
                        <div className={`w-16 h-0.5 mx-4 ${
                          currentStep > step ? 'bg-orange-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 1: Delivery Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-orange-500" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Address Selection */}
                  <div>
                    <Label>Delivery Address *</Label>
                    {selectedAddress ? (
                      <Card className="mt-2 p-4 bg-green-50 border-green-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-900">{selectedAddress.label}</span>
                              {selectedAddress.is_default && (
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                              )}
                            </div>
                            <p className="text-sm text-green-700 mb-1">{selectedAddress.address_line1}</p>
                            {selectedAddress.address_line2 && (
                              <p className="text-sm text-green-600 mb-1">{selectedAddress.address_line2}</p>
                            )}
                            <p className="text-xs text-green-600">
                              {selectedAddress.city}, {selectedAddress.pincode}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddressPicker(true)}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Change
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      <div className="mt-2 space-y-3">
                        <Button
                          onClick={() => setShowAddressPicker(true)}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Choose Delivery Address
                        </Button>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Navigation className="h-4 w-4" />
                          <span>Use current location, search on map, or select from saved addresses</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phone Number */}
                  <PhoneInput
                    value={deliveryInfo.phone}
                    onChange={(value) => handleInputChange('phone', value)}
                    label="Phone Number (Sri Lanka)"
                    required={true}
                    showValidation={true}
                  />

                  {/* Delivery Instructions */}
                  <div>
                    <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Any special delivery instructions..."
                      value={deliveryInfo.instructions}
                      onChange={(e) => handleInputChange('instructions', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-orange-500" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-4">
                      {availablePaymentMethods.map((method) => (
                        <div 
                          key={method.id}
                          className={`flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            !method.enabled ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <RadioGroupItem 
                            value={method.id} 
                            id={method.id} 
                            disabled={!method.enabled}
                          />
                          <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{method.name}</div>
                                <div className="text-sm text-gray-500">
                                  {method.id === 'cash' && 'Pay when your order arrives'}
                                  {method.id === 'card' && 'Pay securely with your card'}
                                  {method.id === 'online' && 'PayPal, Stripe, or other online methods'}
                                </div>
                              </div>
                              {method.id === 'cash' && <Badge variant="secondary">Recommended</Badge>}
                              {!method.enabled && <Badge variant="outline">Coming Soon</Badge>}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  {/* Card Details Form */}
                  {paymentMethod === 'card' && (
                    <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <h4 className="font-medium mb-4">Card Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="cardNumber">Card Number *</Label>
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={cardDetails.cardNumber}
                            onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                            className="mt-1"
                            maxLength={19}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="cardHolder">Cardholder Name *</Label>
                          <Input
                            id="cardHolder"
                            placeholder="John Doe"
                            value={cardDetails.cardHolder}
                            onChange={(e) => handleCardInputChange('cardHolder', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="expiryMonth">Expiry Month *</Label>
                          <Select
                            value={cardDetails.expiryMonth}
                            onValueChange={(value) => handleCardInputChange('expiryMonth', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                                  {(i + 1).toString().padStart(2, '0')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="expiryYear">Expiry Year *</Label>
                          <Select
                            value={cardDetails.expiryYear}
                            onValueChange={(value) => handleCardInputChange('expiryYear', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="YYYY" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 10 }, (_, i) => {
                                const year = new Date().getFullYear() + i;
                                return (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV *</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={cardDetails.cvv}
                            onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                            className="mt-1"
                            maxLength={4}
                            type="password"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="saveCard"
                            checked={savePaymentMethod}
                            onChange={(e) => setSavePaymentMethod(e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor="saveCard" className="text-sm">
                            Save this card for future orders
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Security Notice */}
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Your payment information is encrypted and secure</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Order Review */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-orange-500" />
                    Review Your Order
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Delivery Info Summary */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Delivery Information</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedAddress ? (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="h-4 w-4" />
                              <span className="font-medium">{selectedAddress.label}</span>
                            </div>
                            <div className="ml-6 mb-2">
                              <p>{selectedAddress.address_line1}</p>
                              {selectedAddress.address_line2 && <p>{selectedAddress.address_line2}</p>}
                              <p>{selectedAddress.city}, {selectedAddress.pincode}</p>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <Phone className="h-4 w-4" />
                              {deliveryInfo.phone}
                            </div>
                            {deliveryInfo.instructions && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {deliveryInfo.instructions}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-red-500">No delivery address selected</div>
                        )}
                      </div>
                    </div>

                    {/* Payment Method Summary */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Payment Method</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {paymentMethod === 'cash' && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>Cash on Delivery - Pay when your order arrives</span>
                          </div>
                        )}
                        {paymentMethod === 'card' && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CreditCard className="h-4 w-4" />
                              <span>Credit/Debit Card</span>
                            </div>
                            <div className="ml-6 text-xs">
                              <p>Card ending in: {cardDetails.cardNumber.slice(-4) || '****'}</p>
                              <p>Expires: {cardDetails.expiryMonth || 'MM'}/{cardDetails.expiryYear || 'YYYY'}</p>
                              {savePaymentMethod && <p className="text-green-600">✓ Card will be saved for future orders</p>}
                            </div>
                          </div>
                        )}
                        {paymentMethod === 'online' && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>Online Payment (PayPal, Stripe, etc.)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Notes */}
                    <div>
                      <Label htmlFor="orderNotes">Order Notes (Optional)</Label>
                      <Textarea
                        id="orderNotes"
                        placeholder="Any special requests for your order..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  onClick={handleNextStep}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  {isProcessing ? 'Processing...' : 'Place Order'}
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-500" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Cart Items */}
                <ScrollArea className="max-h-64 mb-4">
                  <div className="space-y-3">
                    {cart.map((item: CartItem) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <div className="w-12 h-12 flex-shrink-0">
                          <img
                            src={item.food_image || getFoodPlaceholder(48, 48)}
                            alt={item.food_name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = getFoodPlaceholder(48, 48);
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.food_name}</h4>
                          <p className="text-xs text-gray-500">by {item.cook_name} - {item.size}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Qty: {item.quantity}</span>
                            <span className="text-sm font-semibold">LKR {parseFloat((item.total_price || 0).toString()).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>LKR {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span className={isCalculating ? 'text-muted-foreground' : ''}>
                      {isCalculating ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Calculating...
                        </span>
                      ) : (
                        deliveryFee === 0 ? 'Free' : `LKR ${deliveryFee.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxes & Fees</span>
                    <span>LKR {taxAmount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-orange-600">LKR {total.toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Delivery Fee Breakdown - Show detailed breakdown when available */}
                {checkoutCalculation?.delivery_fee_breakdown && (
                  <div className="mt-4">
                    <DeliveryFeeBreakdown breakdown={checkoutCalculation.delivery_fee_breakdown} />
                  </div>
                )}

                {/* Security Notice */}
                <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Secure checkout with SSL encryption</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Google Maps Address Picker Modal */}
      <GoogleMapsAddressPicker
        isOpen={showAddressPicker}
        onClose={() => setShowAddressPicker(false)}
        onAddressSaved={async (address) => {
          setSelectedAddress(address);
          setShowAddressPicker(false);
          toast.success(`Selected ${address.label} address`);
          // Refresh addresses list
          try {
            const addresses = await addressService.getAddresses();
            setExistingAddresses(addresses || []);
          } catch (error) {
            console.error('Error refreshing addresses:', error);
          }
        }}
        editingAddress={null}
        existingAddresses={existingAddresses}
      />
    </div>
  );
};

export default Checkout;