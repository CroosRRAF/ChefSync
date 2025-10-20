import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ChefHat, MapPin, Clock, CreditCard } from 'lucide-react';
import { useDatabaseCart } from '@/context/DatabaseCartContext';
import { CartItem } from '@/types/customer';
import ItemComponent from './ItemComponent';
import { useNavigate } from 'react-router-dom';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CookSectionProps {
  chefId: number;
  chefName: string;
  items: CartItem[];
  subtotal: number;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

const CookSection: React.FC<CookSectionProps> = ({
  chefId,
  chefName,
  items,
  subtotal,
  onQuantityChange,
  onRemoveItem,
}) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      {/* Cook Header */}
      <div className="flex items-center gap-3 mb-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
          <ChefHat className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{chefName}</h3>
          <p className="text-sm text-gray-600">{items[0]?.kitchen_address}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="bg-orange-200 text-orange-800">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/chef-profile/${chefId}`)}
              className="text-orange-600 border-orange-300 hover:bg-orange-50 text-xs px-2 py-1 h-6"
            >
              Visit Kitchen
            </Button>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <ItemComponent
            key={item.id}
            item={item}
            onQuantityChange={onQuantityChange}
            onRemove={onRemoveItem}
          />
        ))}
      </div>

      {/* Cook Subtotal */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-semibold text-gray-900">Subtotal ({chefName})</span>
            <p className="text-sm text-gray-600">{items.length} item{items.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-orange-600">
              LKR {subtotal.toFixed(2)}
            </span>
            <p className="text-xs text-gray-500">+ delivery fee</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
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

  const handleQuantityChange = (itemId: string, quantity: number) => {
    updateQuantity(itemId, quantity);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    onClose();
    navigate('/menu');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="h-6 w-6 text-orange-500" />
            Your Cart ({itemCount} item{itemCount !== 1 ? 's' : ''})
          </DialogTitle>
          <DialogDescription>
            Review your order and proceed to checkout
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {itemCount === 0 ? (
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
              {/* Show items directly if chefItems is empty but items exist */}
              {chefItems.size === 0 && items.length > 0 ? (
                <div className="space-y-2">
                  {items.map((item) => (
                    <ItemComponent
                      key={item.id}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>
              ) : (
                <>
                  {/* Cook Sections */}
                  {Array.from(chefItems.entries()).map(([chefId, chefItems]) => (
                    <CookSection
                      key={chefId}
                      chefId={chefId}
                      chefName={chefItems[0]?.chef_name || 'Unknown Cook'}
                      items={chefItems}
                      subtotal={getTotalByChef(chefId)}
                      onQuantityChange={handleQuantityChange}
                      onRemoveItem={handleRemoveItem}
                    />
                  ))}

                  {/* Single Cook Policy Notice */}
                  {chefItems.size === 1 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <ChefHat className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          All items are from the same cook - ready for checkout!
                        </span>
                      </div>
                    </div>
                  )}
                </>
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
              <div className="flex justify-between items-center text-lg font-bold">
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
                {chefItems.size === 1 ? (
                  <Button
                    onClick={handleCheckout}
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
              </div>

              {/* Multi-Cook Options */}
              {chefItems.size > 1 && (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800 mb-3">
                      <ChefHat className="h-5 w-5" />
                      <span className="font-semibold">Multiple Chefs Detected</span>
                    </div>
                    <p className="text-sm text-orange-700 mb-4">
                      You have items from {chefItems.size} different chefs. Choose how you'd like to proceed:
                    </p>
                    
                    {/* Individual Chef Checkout Options */}
                    <div className="space-y-3">
                      {Array.from(chefItems.entries()).map(([chefId, chefItems]) => (
                        <div key={chefId} className="bg-white p-3 rounded-lg border border-orange-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{chefItems[0]?.chef_name}</h4>
                              <p className="text-sm text-gray-600">{chefItems.length} item{chefItems.length !== 1 ? 's' : ''}</p>
                              <p className="text-sm font-medium text-orange-600">
                                LKR {getTotalByChef(chefId).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  onClose();
                                  navigate(`/chef-profile/${chefId}`);
                                }}
                                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                              >
                                Visit Kitchen
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Filter cart to only this chef's items
                                  const otherChefItems = items.filter(item => item.chef_id !== chefId);
                                  otherChefItems.forEach(item => removeItem(item.id));
                                  onClose();
                                  navigate('/checkout');
                                }}
                                className="bg-orange-500 hover:bg-orange-600"
                              >
                                Checkout
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CartModal;
