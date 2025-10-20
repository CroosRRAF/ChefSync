import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDatabaseCart } from '@/context/DatabaseCartContext';
import { ShoppingCart } from 'lucide-react';
import CartModal from './CartModal';

const UltraSimpleCartButton: React.FC = () => {
  const { getItemCount, getGrandTotal } = useDatabaseCart();
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  const itemCount = getItemCount();
  const grandTotal = getGrandTotal();

  const handleClick = () => {
    setIsCartModalOpen(true);
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

      {/* Use the proper CartModal */}
      <CartModal 
        isOpen={isCartModalOpen} 
        onClose={() => setIsCartModalOpen(false)} 
      />
    </>
  );
};

export default UltraSimpleCartButton;
