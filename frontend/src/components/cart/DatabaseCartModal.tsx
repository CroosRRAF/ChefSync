import React, { useState, useEffect } from 'react';
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
  isMultiChef?: boolean;
  onCheckout: () => void;
}

const ChefSection: React.FC<ChefSectionProps> = ({
  chefId,
  chefName,
  items,
  subtotal,
  onQuantityChange,
  onRemoveItem,
  isMultiChef = false,
  onCheckout,
}) => {
  const navigate = useNavigate();

  if (isMultiChef) {
    return (
      <Card className="border-2 border-orange-200 shadow-lg bg-white transition-all duration-300 hover:shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{chefName}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span className="font-semibold">LKR {subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 mb-4">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-md">
                <img src={item.image_url} alt={item.menu_item_name} className="w-8 h-8 rounded-md object-cover" />
                <div className="flex-1">
                              <p className="font-semibold text-gray-800">{item.menu_item_name}</p>
                  <p className="text-xs text-gray-500">x{item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={onCheckout} className="w-full bg-orange-500 hover:bg-orange-600">
            <CreditCard className="h-4 w-4 mr-2" />
            Checkout with {chefName}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-2 border-orange-200 shadow-xl bg-white">
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
          src={item.image_url}
          alt={item.menu_item_name}
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
              {item.menu_item_name}
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
                LKR {Number(item.unit_price).toFixed(2)} each
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                {item.quantity} × LKR {Number(item.unit_price).toFixed(2)}
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
              LKR {Number(item.subtotal).toFixed(2)}
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

  const handleCheckout = (chefId: number) => {
    onClose();
    navigate('/checkout');
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

  const canCheckout = itemCount > 0;

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

        <div className="flex-1 overflow-y-auto p-2">
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
              {chefItems.size > 1 ? (
                <>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-orange-500" />
                      <div>
                        <h4 className="font-semibold text-orange-800">Multiple Chefs</h4>
                        <p className="text-sm text-orange-700">
                          You have items from {chefItems.size} different chefs. Please checkout with each chef separately.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from(chefItems.entries()).map(([chefId, chefItemsList]) => (
                      <ChefSection
                        key={chefId}
                        chefId={chefId}
                        chefName={chefItemsList[0]?.chef_name || 'Unknown Chef'}
                        items={chefItemsList}
                        subtotal={getTotalByChef(chefId)}
                        onQuantityChange={handleQuantityChange}
                        onRemoveItem={handleRemoveItem}
                        isMultiChef={true}
                        onCheckout={() => handleCheckout(chefId)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                Array.from(chefItems.entries()).map(([chefId, chefItemsList]) => (
                  <ChefSection
                    key={chefId}
                    chefId={chefId}
                    chefName={chefItemsList[0]?.chef_name || 'Unknown Chef'}
                    items={chefItemsList}
                    subtotal={getTotalByChef(chefId)}
                    onQuantityChange={handleQuantityChange}
                    onRemoveItem={handleRemoveItem}
                    onCheckout={() => handleCheckout(chefId)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {itemCount > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleContinueShopping}
                  className="w-full sm:w-auto"
                >
                  Continue Shopping
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearCart}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cart
                </Button>
              </div>

              <div className="w-full sm:w-auto flex flex-col items-end gap-2">
                <div className="text-right">
                  <span className="text-sm text-gray-600">Total</span>
                  <p className="text-2xl font-bold text-gray-900">
                    LKR {grandTotal.toFixed(2)}
                  </p>
                </div>
                {chefItems.size === 1 && (
                  <Button
                    onClick={() => handleCheckout(Array.from(chefItems.keys())[0])}
                    disabled={loading}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Checkout
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DatabaseCartModal;
