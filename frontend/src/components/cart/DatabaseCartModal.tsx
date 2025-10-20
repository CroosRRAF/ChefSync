import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, ChefHat, MapPin, Clock, CreditCard, Trash2, Plus, Minus, AlertTriangle, Star } from 'lucide-react';
import { useDatabaseCart } from '@/context/DatabaseCartContext';
import { DatabaseCartItem } from '@/context/DatabaseCartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChefSectionProps {
  chefId: number;
  chefName: string;
  items: DatabaseCartItem[];
  subtotal: number;
  onQuantityChange: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
}

const ChefSection: React.FC<ChefSectionProps> = ({
  chefId,
  chefName,
  items,
  subtotal,
  onQuantityChange,
  onRemoveItem,
}) => {
  const navigate = useNavigate();

  return (
    <Card className="mb-6 border-2 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
      <CardContent className="p-0 overflow-hidden">
        {/* Enhanced Chef Header */}
        <div className="bg-gradient-to-r from-orange-50 via-orange-100 to-red-50 p-6 border-b border-orange-200 relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 right-4 w-20 h-20 bg-orange-500 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-red-400 rounded-full"></div>
          </div>
          
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-gray-900 text-2xl">{chefName}</h3>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-600">4.8</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{items[0]?.kitchen_address || 'Kitchen Address'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className="bg-orange-500 text-white font-semibold px-3 py-1">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate(`/chef-profile/${chefId}`);
                  }}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200 px-4 py-2"
                >
                  <ChefHat className="h-4 w-4 mr-2" />
                  Visit Kitchen
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Items Section */}
        <div className="p-6 space-y-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <h4 className="font-semibold text-gray-800">Your Items</h4>
          </div>
          
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <CartItemComponent
                item={item}
                onQuantityChange={onQuantityChange}
                onRemove={onRemoveItem}
              />
            </div>
          ))}
        </div>

        {/* Enhanced Chef Subtotal */}
        <div className="bg-gradient-to-r from-gray-50 to-orange-50 p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold text-gray-900 text-xl">Subtotal ({chefName})</span>
              <p className="text-sm text-gray-600 mt-1">{items.length} item{items.length !== 1 ? 's' : ''} • Free delivery</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-orange-600">
                LKR {subtotal.toFixed(2)}
              </span>
              <p className="text-sm text-gray-500 mt-1">+ delivery fee</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface CartItemComponentProps {
  item: DatabaseCartItem;
  onQuantityChange: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
}

const CartItemComponent: React.FC<CartItemComponentProps> = ({
  item,
  onQuantityChange,
  onRemove,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onQuantityChange(item.id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onRemove(item.id);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-orange-300">
      {/* Enhanced Item Image */}
      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 shadow-md relative">
        <img
          src={item.food_image}
          alt={item.food_name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-food.jpg';
          }}
        />
        {/* Size Badge on Image */}
        <div className="absolute top-2 right-2">
          <Badge className="bg-orange-500 text-white text-xs font-semibold shadow-lg">
            {item.size}
          </Badge>
        </div>
      </div>

      {/* Enhanced Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-lg leading-tight mb-2">
              {item.food_name}
            </h4>
            
            {/* Chef Info with Icon */}
            <div className="flex items-center gap-2 mb-2">
              <ChefHat className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">{item.chef_name}</span>
              <div className="flex items-center gap-1 ml-2">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-500">4.5</span>
              </div>
            </div>
            
            {/* Price Info */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-semibold text-orange-600">
                LKR {item.unit_price.toFixed(2)} each
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                {item.quantity} × LKR {item.unit_price.toFixed(2)}
              </span>
            </div>
            
            {/* Special Instructions */}
            {item.special_instructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
                <p className="text-xs text-blue-700 font-medium">
                  <span className="font-semibold">Note:</span> {item.special_instructions}
                </p>
              </div>
            )}
          </div>
          
          {/* Subtotal */}
          <div className="text-right ml-4">
            <p className="text-xl font-bold text-gray-900">
              LKR {item.subtotal.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Subtotal
            </p>
          </div>
        </div>

        {/* Enhanced Quantity Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Quantity:</span>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={item.quantity <= 1 || isUpdating}
                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors duration-200 rounded-lg"
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <div className="w-12 text-center">
                <span className="text-lg font-bold text-gray-900">{item.quantity}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={item.quantity >= 20 || isUpdating}
                className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600 transition-colors duration-200 rounded-lg"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isUpdating}
            className="h-10 px-4 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 rounded-xl border border-red-200 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
};

const DatabaseCartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const {
    items,
    summary,
    loading,
    error,
    updateQuantity,
    removeItem,
    clearCart,
    getItemsByChef,
    getTotalByChef,
    getGrandTotal,
    getItemCount,
    canCheckout,
    getCheckoutChefId,
  } = useDatabaseCart();
  
  const navigate = useNavigate();
  const chefItems = getItemsByChef();
  const itemCount = getItemCount();
  const grandTotal = getGrandTotal();

  const handleQuantityChange = async (itemId: number, quantity: number) => {
    await updateQuantity(itemId, quantity);
  };

  const handleRemoveItem = async (itemId: number) => {
    await removeItem(itemId);
  };

  const handleCheckout = () => {
    const chefId = getCheckoutChefId();
    if (chefId) {
      onClose();
      navigate('/checkout', { state: { chefId } });
    }
  };

  const handleContinueShopping = () => {
    onClose();
    navigate('/menu');
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ShoppingCart className="h-7 w-7 text-orange-500" />
            Your Cart ({itemCount} item{itemCount !== 1 ? 's' : ''})
          </DialogTitle>
          <DialogDescription>
            Review your order and proceed to checkout
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="ml-2 text-gray-600">Loading cart...</span>
            </div>
          ) : itemCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600 mb-6">Add some delicious food to get started!</p>
              <Button onClick={handleContinueShopping} className="bg-orange-500 hover:bg-orange-600">
                Browse Menu
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Single Chef - Normal Display */}
              {chefItems.size === 1 && (
                <>
                  {Array.from(chefItems.entries()).map(([chefId, chefItems]) => (
                    <ChefSection
                      key={chefId}
                      chefId={chefId}
                      chefName={chefItems[0]?.chef_name || 'Unknown Chef'}
                      items={chefItems}
                      subtotal={getTotalByChef(chefId)}
                      onQuantityChange={handleQuantityChange}
                      onRemoveItem={handleRemoveItem}
                    />
                  ))}
                  
                  {/* Single Chef Success Message */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <ChefHat className="h-5 w-5" />
                      <span className="font-semibold">Ready for Checkout!</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      All items are from the same chef - you can proceed to checkout.
                    </p>
                  </div>
                </>
              )}

              {/* Multiple Chefs - Enhanced UI */}
              {chefItems.size > 1 && (
                <div className="space-y-6">
                  {/* Enhanced Multi-Chef Header */}
                  <div className="p-8 bg-gradient-to-r from-orange-50 via-orange-100 to-red-50 border-2 border-orange-200 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <ChefHat className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-orange-800 mb-2">Multiple Chefs Detected</h3>
                        <p className="text-orange-700 text-lg">You have items from {chefItems.size} different chefs</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-orange-600">Each chef offers unique flavors!</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl border border-orange-200 shadow-sm">
                      <div className="flex items-center gap-3 text-orange-800 mb-3">
                        <AlertTriangle className="h-6 w-6" />
                        <span className="font-bold text-lg">Important Notice</span>
                      </div>
                      <p className="text-orange-700 leading-relaxed">
                        You can only checkout with items from one chef at a time. Choose which chef you'd like to checkout with, 
                        or continue shopping to add more items from the same chef. Each chef will prepare and deliver your order separately.
                      </p>
                    </div>
                  </div>
                  
                  {/* Enhanced Individual Chef Checkout Cards */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {Array.from(chefItems.entries()).map(([chefId, chefItems]) => (
                      <Card key={chefId} className="border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 shadow-lg hover:shadow-xl bg-white">
                        <CardContent className="p-6">
                          {/* Enhanced Chef Header */}
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-md">
                              <ChefHat className="h-7 w-7 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-xl mb-1">{chefItems[0]?.chef_name}</h4>
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-medium text-gray-600">4.8</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-600">{chefItems.length} item{chefItems.length !== 1 ? 's' : ''}</span>
                              </div>
                              <p className="text-xs text-gray-500">{chefItems[0]?.kitchen_address}</p>
                            </div>
                            <Badge className="bg-orange-500 text-white font-semibold px-3 py-1">
                              {chefItems.length} items
                            </Badge>
                          </div>
                          
                          {/* Items Preview */}
                          <div className="space-y-2 mb-4">
                            {chefItems.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex items-center gap-2 text-sm">
                                <div className="w-6 h-6 rounded overflow-hidden bg-gray-100">
                                  <img
                                    src={item.food_image}
                                    alt={item.food_name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = '/placeholder-food.jpg';
                                    }}
                                  />
                                </div>
                                <span className="flex-1 truncate">{item.food_name}</span>
                                <span className="text-orange-600 font-medium">x{item.quantity}</span>
                              </div>
                            ))}
                            {chefItems.length > 3 && (
                              <p className="text-xs text-gray-500 text-center">
                                +{chefItems.length - 3} more item{chefItems.length - 3 !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                          
                          {/* Total and Actions */}
                          <div className="border-t border-gray-200 pt-4">
                            <div className="flex justify-between items-center mb-4">
                              <span className="font-semibold text-gray-900">Subtotal</span>
                              <span className="text-xl font-bold text-orange-600">
                                LKR {getTotalByChef(chefId).toFixed(2)}
                              </span>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  onClose();
                                  navigate(`/chef-profile/${chefId}`);
                                }}
                                className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                              >
                                <ChefHat className="h-4 w-4 mr-2" />
                                Visit Kitchen
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Show confirmation dialog for chef-specific checkout
                                  const confirmCheckout = window.confirm(
                                    `Checkout with ${chefItems[0]?.chef_name}?\n\nThis will:\n• Remove items from other chefs\n• Proceed to checkout with only ${chefItems[0]?.chef_name}'s items\n• Total: LKR ${getTotalByChef(chefId).toFixed(2)}\n\nContinue?`
                                  );
                                  
                                  if (confirmCheckout) {
                                    // Filter cart to only this chef's items
                                    const otherChefItems = items.filter(item => item.chef_id !== chefId);
                                    otherChefItems.forEach(item => removeItem(item.id));
                                    onClose();
                                    navigate('/checkout', { state: { chefId, chefName: chefItems[0]?.chef_name } });
                                  }
                                }}
                                className="flex-1 bg-orange-500 hover:bg-orange-600"
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Checkout This Chef
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Continue Shopping Option */}
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={handleContinueShopping}
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Summary & Actions */}
        {itemCount > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              {/* Grand Total */}
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total</span>
                <span className="text-orange-600">LKR {grandTotal.toFixed(2)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleContinueShopping}
                  className="flex-1"
                >
                  Continue Shopping
                </Button>
                
                {canCheckout() ? (
                  <Button
                    onClick={() => {
                      const chefName = items[0]?.chef_name || 'Unknown Chef';
                      const confirmCheckout = window.confirm(
                        `Proceed to checkout with ${chefName}?\n\nTotal: LKR ${grandTotal.toFixed(2)}\n\nContinue?`
                      );
                      
                      if (confirmCheckout) {
                        handleCheckout();
                      }
                    }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="flex-1 bg-gray-300 text-gray-500 cursor-not-allowed"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Multiple Chefs - Use Options Above
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  onClick={handleClearCart}
                  className="px-4"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DatabaseCartModal;
