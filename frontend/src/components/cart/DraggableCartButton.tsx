import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, GripVertical } from 'lucide-react';
import { useDatabaseCart } from '@/context/DatabaseCartContext';

interface DraggableCartButtonProps {
  onCartClick: () => void;
}

const DraggableCartButton: React.FC<DraggableCartButtonProps> = ({ onCartClick }) => {
  const { getItemCount } = useDatabaseCart();
  const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const buttonRef = useRef<HTMLDivElement>(null);

  const itemCount = getItemCount();

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('chefsync_cart_position');
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setPosition({ x, y });
      } catch (error) {
        console.error('Error loading cart position:', error);
      }
    }
  }, []);

  // Save position to localStorage
  const savePosition = (x: number, y: number) => {
    localStorage.setItem('chefsync_cart_position', JSON.stringify({ x, y }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('[data-drag-handle]')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Constrain to viewport
      const constrainedX = Math.max(0, Math.min(window.innerWidth - 80, newX));
      const constrainedY = Math.max(0, Math.min(window.innerHeight - 80, newY));
      
      setPosition({ x: constrainedX, y: constrainedY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      savePosition(position.x, position.y);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position]);

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger cart click if not dragging
    if (!isDragging && !(e.target instanceof HTMLElement && e.target.closest('[data-drag-handle]'))) {
      onCartClick();
    }
  };

  const handleDoubleClick = () => {
    // Quick add without opening modal (future enhancement)
    console.log('Quick add to cart');
  };

  // Hide button if no items and not dragging
  useEffect(() => {
    if (itemCount === 0 && !isDragging) {
      const timer = setTimeout(() => setIsVisible(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [itemCount, isDragging]);

  if (!isVisible && itemCount === 0) {
    return null;
  }

  return (
    <div
      ref={buttonRef}
      className={`fixed z-50 transition-all duration-300 ${
        isDragging ? 'scale-110 shadow-2xl' : 'hover:scale-105'
      } ${!isVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className="relative">
        {/* Main Cart Button */}
        <Button
          className={`w-16 h-16 rounded-full shadow-lg border-2 transition-all duration-200 ${
            itemCount > 0 
              ? 'bg-orange-500 hover:bg-orange-600 border-orange-600' 
              : 'bg-gray-500 hover:bg-gray-600 border-gray-600'
          }`}
          style={{
            boxShadow: isDragging 
              ? '0 20px 40px rgba(0,0,0,0.3)' 
              : '0 8px 16px rgba(0,0,0,0.2)',
          }}
        >
          <ShoppingCart className="h-6 w-6 text-white" />
          
          {/* Item Count Badge */}
          {itemCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 flex items-center justify-center"
              style={{
                animation: itemCount > 0 ? 'pulse 0.5s ease-in-out' : 'none',
              }}
            >
              {itemCount > 99 ? '99+' : itemCount}
            </Badge>
          )}
        </Button>

        {/* Drag Handle */}
        <div
          data-drag-handle
          className="absolute -bottom-1 -right-1 bg-gray-600 hover:bg-gray-700 rounded-full p-1 cursor-grab active:cursor-grabbing"
          style={{ opacity: isDragging ? 1 : 0.7 }}
        >
          <GripVertical className="h-3 w-3 text-white" />
        </div>

        {/* Pulse Animation for Empty State */}
        {itemCount === 0 && (
          <div className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-20"></div>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {itemCount > 0 ? `${itemCount} items in cart` : 'Drag me around!'}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default DraggableCartButton;
