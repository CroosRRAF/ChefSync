import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  LayoutDashboard
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  cookId: string;
  cookName: string;
  cookRating: number;
  prepTime: number;
  cuisine: string;
  isVeg: boolean;
  isVegan?: boolean;
  discount?: number;
  tags: string[];
  quantity: number;
}

const CustomerCart: React.FC = () => {
  const navigate = useNavigate();
  
  // Mock cart data - in real app, this would come from context/state management
  const [cart, setCart] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Chicken Biryani',
      description: 'Aromatic basmati rice with tender chicken pieces and traditional spices',
      image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop',
      price: 250,
      cookId: 'cook1',
      cookName: 'Rajesh Kumar',
      cookRating: 4.8,
      prepTime: 30,
      cuisine: 'Indian',
      isVeg: false,
      tags: ['popular', 'spicy', 'traditional'],
      quantity: 2
    },
    {
      id: '2',
      name: 'Vegetable Fried Rice',
      description: 'Wok-fried rice with fresh vegetables and aromatic seasonings',
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
      price: 180,
      cookId: 'cook2',
      cookName: 'Priya Sharma',
      cookRating: 4.6,
      prepTime: 20,
      cuisine: 'Chinese',
      isVeg: true,
      tags: ['healthy', 'quick', 'vegetarian'],
      quantity: 1
    }
  ]);

  const subtotal = cart.reduce((sum, item) => {
    const discountedPrice = item.discount 
      ? item.price * (1 - item.discount / 100) 
      : item.price;
    return sum + (discountedPrice * item.quantity);
  }, 0);

  const deliveryFee = subtotal > 300 ? 0 : 40;
  const taxAmount = subtotal * 0.05; // 5% tax
  const total = subtotal + deliveryFee + taxAmount;

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== itemId));
    } else {
      setCart(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleCheckout = () => {
    // In a real app, this would navigate to payment
    alert('Checkout functionality will be implemented with backend integration!');
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
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, index) => {
              const discountedPrice = item.discount 
                ? item.price * (1 - item.discount / 100) 
                : item.price;

              return (
                <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-slideUp" style={{ animationDelay: `${index * 100}ms` }}>
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Item Image */}
                      <div className="relative w-32 h-32 flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {item.discount && (
                          <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                            {item.discount}% OFF
                          </Badge>
                        )}
                        <div className="absolute top-2 right-2">
                          {item.isVeg ? (
                            <div className="w-4 h-4 border border-green-500 bg-white rounded-sm flex items-center justify-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          ) : (
                            <div className="w-4 h-4 border border-red-500 bg-white rounded-sm flex items-center justify-center">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              by {item.cookName}
                            </p>
                            <div className="flex items-center space-x-4 mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                  ₹{Math.round(discountedPrice)}
                                </span>
                                {item.discount && (
                                  <span className="text-sm text-gray-500 line-through">
                                    ₹{item.price}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                {item.prepTime} min
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2 border rounded-lg">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-medium min-w-8 text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Item Total */}
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                              ₹{Math.round(discountedPrice * item.quantity)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        123 Anna Salai, T. Nagar<br />
                        Chennai - 600017
                      </p>
                    </div>
                  </div>
                  <Badge className="mt-2 bg-orange-100 text-orange-800">
                    Normal Order
                  </Badge>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium">₹{Math.round(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Delivery Fee
                      {subtotal > 300 && (
                        <span className="text-green-600 text-xs ml-1">(Free)</span>
                      )}
                    </span>
                    <span className="font-medium">
                      {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Taxes & Fees</span>
                    <span className="font-medium">₹{Math.round(taxAmount)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      ₹{Math.round(total)}
                    </span>
                  </div>
                </div>

                {/* Free Delivery Notice */}
                {subtotal < 300 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-6">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      Add ₹{300 - subtotal} more to get free delivery!
                    </p>
                  </div>
                )}

                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 transform hover:scale-105 transition-all duration-300"
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Proceed to Checkout
                </Button>

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
    </div>
  );
};

export default CustomerCart;
