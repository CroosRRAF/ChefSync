import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, MapPin, CreditCard, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCartService, CartItem, CartSummary, UserAddress } from '@/services/cartService';
import { toast } from 'sonner';
import LocationSelector from './LocationSelector';
import CheckoutModal from '@/components/checkout/CheckoutModal';

interface ShoppingCartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShoppingCartModal: React.FC<ShoppingCartModalProps> = ({
  isOpen,
  onClose
}) => {
  const [cartData, setCartData] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState<string>('25-35 min');
  
  const { 
    loadCartSummary, 
    updateCartItem, 
    removeFromCart,
    loadAddresses
  } = useCartService();

  useEffect(() => {
    if (isOpen) {
      loadCartData();
      loadDefaultAddress();
    }
  }, [isOpen]);

  const loadCartData = async () => {
    setLoading(true);
    try {
      const data = await loadCartSummary();
      setCartData(data);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Failed to load cart data');
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultAddress = async () => {
    try {
      const addresses = await loadAddresses();
      const defaultAddress = addresses.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      }
    } catch (error) {
      console.error('Error loading default address:', error);
    }
  };

  const handleQuantityUpdate = async (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    setUpdating(itemId);
    try {
      await updateCartItem(itemId, newQuantity, '');
      await loadCartData();
      toast.success('Cart updated');
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setUpdating(itemId);
    try {
      await removeFromCart(itemId);
      await loadCartData();
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const handleLocationSelect = (address: UserAddress) => {
    setSelectedAddress(address);
    setShowLocationSelector(false);
    
    // Update estimated delivery time based on distance (mock calculation)
    const distance = Math.random() * 10 + 2; // 2-12 km
    const baseTime = 20;
    const extraTime = Math.floor(distance * 2);
    const minTime = baseTime + extraTime;
    const maxTime = minTime + 10;
    setEstimatedDeliveryTime(`${minTime}-${maxTime} min`);
    
    toast.success('Delivery location updated');
  };

  const handleProceedToCheckout = () => {
    if (!selectedAddress) {
      setShowLocationSelector(true);
      return;
    }
    
    if (!cartData || cartData.cart_items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    setShowCheckout(true);
  };

  const formatPrice = (price: number) => {
    return `Rs. ${price.toFixed(2)}`;
  };

  const getItemTotal = (item: CartItem) => {
    return item.unit_price * item.quantity;
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden p-0">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-500" />
                Your Cart
                {cartData && cartData.total_items > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {cartData.total_items} item{cartData.total_items > 1 ? 's' : ''}
                  </Badge>
                )}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Cart Content */}
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
              </div>
            ) : !cartData || cartData.cart_items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-6">Add some delicious items to get started</p>
                <Button onClick={onClose} className="bg-orange-500 hover:bg-orange-600">
                  Continue Browsing
                </Button>
              </div>
            ) : (
              <>
                {/* Delivery Location */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {selectedAddress ? selectedAddress.label : 'Select delivery location'}
                        </p>
                        {selectedAddress && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {selectedAddress.address_line1}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLocationSelector(true)}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      {selectedAddress ? 'Change' : 'Select'}
                    </Button>
                  </div>
                  
                  {selectedAddress && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>Estimated delivery: {estimatedDeliveryTime}</span>
                    </div>
                  )}
                </div>

                {/* Cart Items */}
                <ScrollArea className="flex-1 max-h-[400px]">
                  <div className="p-4 space-y-4">
                    {cartData.cart_items.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            {/* Food Image */}
                            <div className="flex-shrink-0">
                              <img
                                src={item.food_image || '/api/placeholder/80/80'}
                                alt={item.food_name}
                                className="w-16 h-16 rounded-lg object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/api/placeholder/80/80';
                                }}
                              />
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900 line-clamp-1">
                                    {item.food_name}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    by {item.cook_name}
                                  </p>
                                  {item.size && item.size !== 'Regular' && (
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      {item.size}
                                    </Badge>
                                  )}
                                </div>

                                {/* Remove Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(item.id)}
                                  disabled={updating === item.id}
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Special Instructions */}
                              {item.special_instructions && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  Note: {item.special_instructions}
                                </p>
                              )}

                              {/* Quantity and Price */}
                              <div className="flex items-center justify-between mt-3">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)}
                                    disabled={updating === item.id || item.quantity <= 1}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  
                                  <span className="font-medium min-w-[20px] text-center">
                                    {updating === item.id ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border border-orange-500 border-t-transparent" />
                                    ) : (
                                      item.quantity
                                    )}
                                  </span>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                                    disabled={updating === item.id}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900">
                                    {formatPrice(getItemTotal(item))}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatPrice(item.unit_price)} each
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                {/* Cart Footer */}
                <div className="p-4 border-t bg-white">
                  {/* Total */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold text-gray-900">Subtotal</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(cartData.total_value)}
                    </span>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={handleProceedToCheckout}
                    disabled={!cartData || cartData.cart_items.length === 0}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                    <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                      {formatPrice(cartData.total_value)}
                    </span>
                  </Button>

                  {/* Additional Info */}
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Delivery fee will be calculated at checkout
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Selector Modal */}
      <LocationSelector
        isOpen={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onLocationSelect={handleLocationSelect}
        selectedAddress={selectedAddress}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        cartData={cartData}
        onOrderSuccess={() => {
          setShowCheckout(false);
          onClose();
          loadCartData(); // Reload cart after successful order
        }}
      />
    </>
  );
};

export default ShoppingCartModal;