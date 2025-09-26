import React, { useState, useEffect } from 'react';
import { ShoppingCart, MapPin } from 'lucide-react';
import CartPopup from './CartPopup';
import CheckoutModal from './checkout/CheckoutModal';
import OrderProgressPopup from './OrderProgressPopup';
import NotificationBadge from './NotificationBadge';
import { useCartService, CartSummary } from '../services/cartService';

interface CartCheckoutIntegrationProps {
  chefId: number;
  className?: string;
}

const CartCheckoutIntegration: React.FC<CartCheckoutIntegrationProps> = ({ 
  chefId, 
  className = '' 
}) => {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [orderData, setOrderData] = useState<any>(null);
  const [cartData, setCartData] = useState<CartSummary | null>(null);
  
  const { loadCartSummary } = useCartService();

  useEffect(() => {
    loadCartData();
  }, []);

  const loadCartData = async () => {
    try {
      const summary = await loadCartSummary();
      setCartItemCount(summary.total_items);
      setCartData(summary);
    } catch (error) {
      console.error('Error loading cart summary:', error);
    }
  };

  const handleCartOpen = () => {
    setCartOpen(true);
  };

  const handleCartClose = () => {
    setCartOpen(false);
  };

  const handleCheckout = async () => {
    setCartOpen(false);
    // Load fresh cart data before checkout
    await loadCartData();
    setCheckoutOpen(true);
  };

  const handleCheckoutClose = () => {
    setCheckoutOpen(false);
  };

  const handleOrderSuccess = () => {
    setCheckoutOpen(false);
    setProgressOpen(true);
    loadCartData(); // Refresh cart data
    
    // Show success notification
    console.log('Order placed successfully');
  };

  const handleProgressClose = () => {
    setProgressOpen(false);
    setOrderData(null);
  };

  return (
    <>
      {/* Cart Button */}
      <button
        onClick={handleCartOpen}
        className={`relative flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors ${className}`}
      >
        <ShoppingCart className="w-5 h-5" />
        <span>Cart</span>
        {cartItemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {cartItemCount}
          </span>
        )}
      </button>

      {/* Notification Badge */}
      <NotificationBadge className="ml-2" />

      {/* Cart Popup */}
      <CartPopup
        isOpen={cartOpen}
        onClose={handleCartClose}
        onCheckout={handleCheckout}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={handleCheckoutClose}
        cartData={cartData}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Progress Popup */}
      {orderData && (
        <OrderProgressPopup
          isOpen={progressOpen}
          onClose={handleProgressClose}
          orderId={orderData.order_id}
          orderNumber={orderData.order_number}
          initialStatus="pending"
        />
      )}
    </>
  );
};

export default CartCheckoutIntegration;
