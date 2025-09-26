import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  ArrowRight,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle
} from 'lucide-react';
import { CartItem } from '@/services/menuService';

interface CartPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
}

const CartPopup: React.FC<CartPopupProps> = ({ 
  isOpen, 
  onClose, 
  onCheckout 
}) => {
  const navigate = useNavigate();
  const { cartSummary, updateCartItem, removeFromCart, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  if (!isOpen) return null;

  const cart = cartSummary?.cart_items || [];
  
  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = parseFloat((item.unit_price || 0).toString()) * item.quantity;
    console.log(`Item: ${item.food_name}, Unit Price: ${item.unit_price}, Quantity: ${item.quantity}, Total: ${itemPrice}`);
    return sum + itemPrice;
  }, 0);
  
  console.log('Cart subtotal:', subtotal);

  const deliveryFee = subtotal > 300 ? 0 : 40;
  const taxAmount = subtotal * 0.10; // 10% tax
  const total = subtotal + deliveryFee + taxAmount;

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(itemId);
    } else {
      setIsUpdating(itemId);
      try {
        await updateCartItem(itemId, newQuantity);
      } finally {
        setIsUpdating(null);
      }
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setIsUpdating(itemId);
    try {
      await removeFromCart(itemId);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleClearCart = async () => {
    await clearCart();
  };

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    } else {
      navigate('/customer/cart');
    }
    onClose();
  };

  const handleViewFullCart = () => {
    navigate('/customer/cart');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup Content */}
      <Card className="relative w-full max-w-md mx-4 max-h-[80vh] bg-white dark:bg-gray-900 shadow-2xl">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-lg">Your Cart</CardTitle>
            {cart.length > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {cart.length} item{cart.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {cart.length === 0 ? (
            // Empty Cart
            <div className="text-center py-8">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Your cart is empty
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add some delicious items to get started!
              </p>
              <Button
                onClick={() => {
                  navigate('/menu');
                  onClose();
                }}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                Browse Menu
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <ScrollArea className="max-h-64">
                <div className="space-y-3 p-4">
                  {cart.map((item: CartItem) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {/* Item Image */}
                      <div className="w-12 h-12 flex-shrink-0">
                        <img
                          src={item.food_image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjI0IiBjeT0iMjQiIHI9IjgiIGZpbGw9IiM5Q0E5QjAiLz4KPHR5cGU+Tm88L3RleHQ+Cjwvc3ZnPg=='}
                          alt={item.food_name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {item.food_name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          by {item.cook_name} - {item.size}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-semibold text-orange-600">
                            LKR {parseFloat((item.unit_price || 0).toString()).toFixed(2)}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={isUpdating === item.id}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium min-w-6 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={isUpdating === item.id}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isUpdating === item.id}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              {/* Order Summary */}
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium">LKR {subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Delivery Fee
                    {subtotal > 300 && (
                      <span className="text-green-600 text-xs ml-1">(Free)</span>
                    )}
                  </span>
                  <span className="font-medium">
                    {deliveryFee === 0 ? 'Free' : `LKR ${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Taxes & Fees</span>
                  <span className="font-medium">LKR {taxAmount.toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">LKR {total.toFixed(2)}</span>
                </div>

                {/* Free Delivery Notice */}
                {subtotal < 300 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2">
                    <p className="text-xs text-orange-800 dark:text-orange-200">
                      Add LKR {300 - subtotal} more for free delivery!
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 space-y-2">
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Checkout Now
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleViewFullCart}
                  className="w-full"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  View Full Cart
                </Button>

                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={handleClearCart}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CartPopup;
