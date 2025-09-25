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
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
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
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { CartItem } from '@/services/menuService';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cartSummary, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: user?.address || '',
    city: 'Colombo',
    postalCode: '',
    phone: user?.phone_no || '',
    instructions: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderNotes, setOrderNotes] = useState('');

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

  const cart = cartSummary?.cart_items || [];
  
  const subtotal = cart.reduce((sum, item) => {
    return sum + (parseFloat((item.unit_price || 0).toString()) * item.quantity);
  }, 0);

  const deliveryFee = subtotal > 300 ? 0 : 40;
  const taxAmount = subtotal * 0.10; // 10% tax
  const total = subtotal + deliveryFee + taxAmount;

  const handleInputChange = (field: string, value: string) => {
    setDeliveryInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate delivery info
      if (!deliveryInfo.address || !deliveryInfo.phone) {
        toast.error('Please fill in all required delivery information');
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
    setIsProcessing(true);
    
    try {
      // Simulate order placement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear cart after successful order
      await clearCart();
      
      toast.success('Order placed successfully! 🎉');
      navigate('/customer/orders', { 
        state: { 
          message: 'Your order has been placed successfully! You will receive a confirmation email shortly.' 
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address">Delivery Address *</Label>
                      <Textarea
                        id="address"
                        placeholder="Enter your full address"
                        value={deliveryInfo.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={deliveryInfo.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+94 XX XXX XXXX"
                        value={deliveryInfo.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={deliveryInfo.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

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
                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Cash on Delivery</div>
                              <div className="text-sm text-gray-500">Pay when your order arrives</div>
                            </div>
                            <Badge variant="secondary">Recommended</Badge>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex-1 cursor-pointer">
                          <div>
                            <div className="font-medium">Credit/Debit Card</div>
                            <div className="text-sm text-gray-500">Pay securely with your card</div>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online" className="flex-1 cursor-pointer">
                          <div>
                            <div className="font-medium">Online Payment</div>
                            <div className="text-sm text-gray-500">PayPal, Stripe, or other online methods</div>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
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
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4" />
                          {deliveryInfo.address}
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
                      </div>
                    </div>

                    {/* Payment Method Summary */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Payment Method</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {paymentMethod === 'cash' && 'Cash on Delivery'}
                        {paymentMethod === 'card' && 'Credit/Debit Card'}
                        {paymentMethod === 'online' && 'Online Payment'}
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
                            src={item.food_image || 'https://via.placeholder.com/48x48?text=No+Image'}
                            alt={item.food_name}
                            className="w-full h-full object-cover rounded-lg"
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
                    <span>{deliveryFee === 0 ? 'Free' : `LKR ${deliveryFee.toFixed(2)}`}</span>
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
    </div>
  );
};

export default Checkout;