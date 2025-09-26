import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, MapPin } from 'lucide-react';
import { CartItem, CartSummary, useCartService } from '../services/cartService';

interface CartPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

const CartPopup: React.FC<CartPopupProps> = ({ isOpen, onClose, onCheckout }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  
  const {
    loadCartItems,
    loadCartSummary,
    updateCartItem,
    removeFromCart
  } = useCartService();

  useEffect(() => {
    if (isOpen) {
      loadCartData();
    }
  }, [isOpen]);

  const loadCartData = async () => {
    setLoading(true);
    try {
      const [items, summary] = await Promise.all([
        loadCartItems(),
        loadCartSummary()
      ]);
      setCartItems(items);
      setCartSummary(summary);
    } catch (error) {
      console.error('Error loading cart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdating(itemId);
    try {
      const updatedItem = await updateCartItem(itemId, newQuantity);
      setCartItems(prev => 
        prev.map(item => item.id === itemId ? updatedItem : item)
      );
      // Reload summary to get updated totals
      const summary = await loadCartSummary();
      setCartSummary(summary);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setUpdating(itemId);
    try {
      await removeFromCart(itemId);
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      // Reload summary to get updated totals
      const summary = await loadCartSummary();
      setCartSummary(summary);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setUpdating(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Cart Popup */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Your Cart</h2>
            {cartSummary && (
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                {cartSummary.total_items} items
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <ShoppingBag className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm">Add some delicious food to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {/* Food Image */}
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.food_image ? (
                      <img 
                        src={item.food_image} 
                        alt={item.food_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {item.food_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.size} • {item.cook_name}
                    </p>
                    {item.special_instructions && (
                      <p className="text-xs text-gray-600 mt-1">
                        Note: {item.special_instructions}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-primary">
                        LKR {item.total_price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={updating === item.id || item.quantity <= 1}
                      className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <span className="w-8 text-center font-medium">
                      {updating === item.id ? '...' : item.quantity}
                    </span>
                    
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={updating === item.id}
                      className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={updating === item.id}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartSummary && cartSummary.total_items > 0 && (
          <div className="border-t bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">
                LKR {cartSummary.total_value.toFixed(2)}
              </span>
            </div>
            
            <button
              onClick={onCheckout}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPopup;
