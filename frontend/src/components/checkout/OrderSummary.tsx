import React from 'react';
import { Clock, Tag, Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { DatabaseCartItem, useDatabaseCart } from '@/context/DatabaseCartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderSummaryProps {
  items: DatabaseCartItem[];
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
  orderMode: 'delivery' | 'pickup';
  estimatedTime: number;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  onPlaceOrder: () => void;
  isPlacingOrder: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  deliveryFee,
  taxAmount,
  totalAmount,
  orderMode,
  estimatedTime,
  promoCode,
  onPromoCodeChange,
  onPlaceOrder,
  isPlacingOrder,
}) => {
  const { updateQuantity, removeItem } = useDatabaseCart();
  const [isApplyingPromo, setIsApplyingPromo] = React.useState(false);

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      return;
    }
    try {
      await updateQuantity(itemId, newQuantity);
      toast.success('Cart updated');
    } catch (error) {
      toast.error('Failed to update cart');
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeItem(itemId);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }
    setIsApplyingPromo(true);
    setTimeout(() => {
      setIsApplyingPromo(false);
      toast.error('Invalid promo code');
    }, 1000);
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <ShoppingBag className="w-12 h-12 mx-auto text-gray-400" />
        <p className="mt-4 text-gray-600">Your cart for this chef is empty.</p>
      </div>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <h3 className="text-xl font-bold text-gray-900">
          <ShoppingBag className="w-6 h-6 inline-block mr-2 text-green-600" />
          Order Summary
        </h3>
        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Estimated Time */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
        <Clock className="w-5 h-5 text-blue-600" />
        <div>
          <p className="text-sm text-gray-600">
            {orderMode === 'delivery' ? 'Estimated Delivery' : 'Estimated Pickup'}
          </p>
          <p className="font-semibold text-gray-900">{estimatedTime} minutes</p>
        </div>
      </div>

      {/* Cart Items */}
      <ScrollArea className="h-64">
        <div className="space-y-4 pr-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-4">
              <img
                src={item.image_url}
                alt={item.menu_item_name}
                className="w-16 h-16 rounded-md object-cover"
              />
              <div className="flex-grow">
                <p className="font-semibold text-sm text-gray-800">{item.menu_item_name}</p>
                <p className="text-xs text-gray-500">
                  {item.special_instructions}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-gray-200 text-gray-700"
                    >
                      -
                    </button>
                    <span className="font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-gray-200 text-gray-700"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-bold text-gray-900">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </p>
                </div>
              </div>
              <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      {/* Price Breakdown */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {orderMode === 'delivery' && (
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Tax</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <Separator />

      {/* Promo Code */}
      <div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Promo Code"
            value={promoCode}
            onChange={(e) => onPromoCodeChange(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={handleApplyPromo} disabled={isApplyingPromo}>
            {isApplyingPromo ? 'Applying...' : 'Apply'}
          </Button>
        </div>
      </div>

      {/* Place Order Button */}
      <Button
        onClick={onPlaceOrder}
        disabled={isPlacingOrder}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
      >
        {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
      </Button>
    </div>
  );
};


