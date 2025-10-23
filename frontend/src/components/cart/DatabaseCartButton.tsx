import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useDatabaseCart } from '@/context/DatabaseCartContext';
import { useAuth } from '@/context/AuthContext';
import DatabaseCartModal from './DatabaseCartModal';

const DatabaseCartButton: React.FC = () => {
  const { getItemCount, getGrandTotal, loading } = useDatabaseCart();
  const { isAuthenticated } = useAuth();
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  const itemCount = getItemCount();
  const grandTotal = getGrandTotal();

  // Don't render cart button if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleClick = () => {
    setIsCartModalOpen(true);
  };

  return (
    <>
      {/* Enhanced Cart Button */}
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
          disabled={loading}
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            backgroundColor: '#f97316',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4)',
            transition: 'all 0.3s ease',
            opacity: loading ? 0.7 : 1,
          }}
          className="hover:scale-105 hover:shadow-xl"
        >
          <ShoppingCart style={{ color: 'white', width: '28px', height: '28px' }} />
          
          {/* Item Count Badge */}
          {itemCount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                animation: itemCount > 0 ? 'pulse 2s infinite' : 'none',
              }}
            >
              {itemCount > 99 ? '99+' : itemCount}
            </div>
          )}
          
          {/* Loading Indicator */}
          {loading && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
          )}
        </Button>
        
        {/* Total Amount Tooltip */}
        {itemCount > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '80px',
              right: '0',
              backgroundColor: 'white',
              padding: '8px 12px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#f97316',
              border: '1px solid #f97316',
              minWidth: '120px',
              textAlign: 'center',
            }}
          >
            Total: LKR {grandTotal.toFixed(2)}
          </div>
        )}
      </div>

      {/* Database Cart Modal */}
      <DatabaseCartModal 
        isOpen={isCartModalOpen} 
        onClose={() => setIsCartModalOpen(false)} 
      />
      
      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default DatabaseCartButton;
