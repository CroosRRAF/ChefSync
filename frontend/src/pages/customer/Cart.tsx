import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDatabaseCart } from '@/context/DatabaseCartContext';
import { useAuth } from '@/context/AuthContext';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  ArrowLeft,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle,
  Home,
  LayoutDashboard,
  ChefHat,
  LogIn
} from 'lucide-react';

import GoogleMapsAddressPicker from '@/components/checkout/GoogleMapsAddressPicker';
import CheckoutPopup from '@/components/checkout/CheckoutPopup';
import { DeliveryAddress, addressService } from '@/services/addressService';
import { toast } from 'sonner';

const CustomerCart: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, getGrandTotal, getItemCount } = useDatabaseCart();
  const { isAuthenticated, user } = useAuth();
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [isAddressPickerOpen, setIsAddressPickerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  
  // Allow access to cart without login, but show login prompt for checkout

  useEffect(() => {
    const fetchDefaultAddress = async () => {
      setIsLoadingAddress(true);
      setAddressError(null);
      try {
        const addresses = await addressService.getAddresses();
        if (Array.isArray(addresses) && addresses.length > 0) {
          const defaultAddress = addresses.find(address => address.is_default) || addresses[0];
          setSelectedAddress(defaultAddress);
        } else {
          setSelectedAddress(null);
        }
      } catch (error) {
        console.error('Failed to load delivery addresses:', error);
        setAddressError('Unable to load your saved addresses. You can add a new one.');
        setSelectedAddress(null);
      } finally {
        setIsLoadingAddress(false);
      }
    };

    fetchDefaultAddress();
  }, []);

  // Use cart data from context
  const cart = items || [];
  
  const subtotal = cart.reduce((sum, item) => {
    return sum + item.subtotal;
  }, 0);

  const taxAmount = subtotal * 0.10; // 10% tax
  const total = subtotal + taxAmount; // Delivery fee will be calculated in checkout

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    removeItem(itemId);
  };

  const handleClearCart = () => {
    // Clear all items from cart
    clearCart();
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.info('Please login to continue with checkout');
      navigate('/auth/login');
      return;
    }
    // Open checkout popup - address selection will happen there
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = () => {
    toast.success('Order placed successfully!');
    // Cart will be cleared by the checkout component
    navigate('/customer/dashboard');
  };

  const handleAddressSelect = (address: DeliveryAddress) => {
    setSelectedAddress(address);
    setIsAddressPickerOpen(false);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <ShoppingBag className="h-24 w-24 text-gray-400 mx-auto mb-6 animate-float" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 animate-slideUp">
              Your Cart is Empty
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 animate-slideUp animation-delay-200">
              Looks like you haven't added any delicious items to your cart yet.
            </p>
            <Button
              onClick={() => navigate('/menu')}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 transform hover:scale-105 transition-all duration-300 animate-scaleIn"
            >
              Browse Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6 flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/customer/dashboard')}
            className="hover:bg-blue-50"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="hover:bg-green-50"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/menu')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Continue Shopping</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white animate-slideUp">
                Your Cart
              </h1>
              <p className="text-gray-600 dark:text-gray-400 animate-slideUp animation-delay-200">
                {cart.length} item{cart.length !== 1 ? 's' : ''} in your cart
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleClearCart}
            className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50 animate-scaleIn"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Cart</span>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items Grouped by Chef */}
          <div className="lg:col-span-2 space-y-6">
            {(() => {
              const itemsByChef = cart.reduce((acc, item) => {
                if (!acc[item.chef_id]) {
                  acc[item.chef_id] = {
                    chef_name: item.chef_name,
                    items: []
                  };
                }
                acc[item.chef_id].items.push(item);
                return acc;
              }, {} as Record<number, { chef_name: string; items: typeof cart }>);

              return Object.entries(itemsByChef).map(([chefId, chefData], chefIndex) => {
                const chefTotal = chefData.items.reduce((sum, item) => sum + item.subtotal, 0);
                
                return (
                  <Card key={chefId} className="border-2 border-orange-100 dark:border-orange-900/20 animate-slideUp" style={{ animationDelay: `${chefIndex * 100}ms` }}>
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                            <ChefHat className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl text-gray-900 dark:text-white">
                              Chef {chefData.chef_name}
                            </CardTitle>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {chefData.items.length} item{chefData.items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200 text-lg px-3 py-1">
                          LKR {chefTotal.toFixed(2)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                      <div className="space-y-4 p-4">
                        {chefData.items.map((item, itemIndex) => (
                          <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            {/* Item Image */}
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={item.food_image || '/placeholder-food.jpg'}
                                alt={item.food_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {item.food_name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {item.size} • LKR {item.unit_price.toFixed(2)}
                              </p>
                              
                              {/* Quantity Controls */}
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2 border rounded-lg">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="font-medium min-w-6 text-center text-sm">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Item Total */}
                            <div className="text-right">
                              <div className="font-bold text-gray-900 dark:text-white">
                                LKR {item.subtotal.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 animate-scaleIn animation-delay-400">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Order Summary
                </h2>

                {/* Delivery Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        Delivery Address
                      </h3>
                      {isLoadingAddress ? (
                        <p className="text-sm text-gray-500">Loading your saved addresses...</p>
                      ) : selectedAddress ? (
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedAddress.label}
                          </p>
                          <p>{selectedAddress.address_line1}</p>
                          {selectedAddress.address_line2 && <p>{selectedAddress.address_line2}</p>}
                          <p>{selectedAddress.city}, {selectedAddress.pincode}</p>
                          <p className="text-xs text-muted-foreground">
                            Coordinates: {Number(selectedAddress.latitude).toFixed(5)}, {Number(selectedAddress.longitude).toFixed(5)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {addressError || 'No delivery address selected yet.'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className="bg-orange-100 text-orange-800">
                      Normal Order
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddressPickerOpen(true)}
                      className="border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                      Manage Addresses
                    </Button>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium">LKR {subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax (10%)</span>
                    <span className="font-medium">LKR {taxAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 my-2">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 Delivery fee will be calculated based on your location
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-gray-900 dark:text-white">Subtotal</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      LKR {total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Free Delivery Notice */}
                {subtotal < 300 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-6">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      Add LKR {300 - subtotal} more to get free delivery!
                    </p>
                  </div>
                )}

                {/* Checkout Button */}
                {isAuthenticated ? (
                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 transform hover:scale-105 transition-all duration-300"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Proceed to Checkout
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={() => navigate('/auth/login')}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 transform hover:scale-105 transition-all duration-300"
                    >
                      <LogIn className="mr-2 h-5 w-5" />
                      Login to Checkout
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Login required to place order
                    </p>
                  </div>
                )}

                {/* Security Notice */}
                <div className="flex items-center justify-center space-x-2 mt-4 text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Secure checkout with SSL encryption</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <GoogleMapsAddressPicker
        isOpen={isAddressPickerOpen}
        onClose={() => setIsAddressPickerOpen(false)}
        onAddressSelect={handleAddressSelect}
        selectedAddress={selectedAddress}
      />

      <CheckoutPopup
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        onOrderSuccess={handleOrderSuccess}
      />
    </div>
  );
};

export default CustomerCart;
