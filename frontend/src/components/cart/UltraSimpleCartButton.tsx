import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/NewCartContext';
import { ShoppingCart } from 'lucide-react';

const UltraSimpleCartButton: React.FC = () => {
  const { getItemCount } = useCart();
  const [showPopup, setShowPopup] = useState(false);

  const itemCount = getItemCount();

  const handleClick = () => {
    console.log('Cart clicked!');
    setShowPopup(!showPopup);
  };

  return (
    <>
      {/* Ultra Simple Cart Button */}
      <div 
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999
        }}
      >
        <Button
          onClick={handleClick}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#f97316',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          <ShoppingCart style={{ color: 'white', width: '24px', height: '24px' }} />
          {itemCount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              {itemCount > 99 ? '99+' : itemCount}
            </div>
          )}
        </Button>
      </div>

      {/* Ultra Simple Popup */}
      {showPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowPopup(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '400px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Your Cart</h2>
              <button
                onClick={() => setShowPopup(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            {itemCount === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <ShoppingCart style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 16px' }} />
                <p style={{ color: '#6b7280', margin: 0 }}>Your cart is empty</p>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 16px', color: '#6b7280' }}>
                  {itemCount} item{itemCount !== 1 ? 's' : ''} in cart
                </p>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 'bold' }}>
                    Total: LKR 0.00
                  </p>
                  <button
                    style={{
                      backgroundColor: '#f97316',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UltraSimpleCartButton;
