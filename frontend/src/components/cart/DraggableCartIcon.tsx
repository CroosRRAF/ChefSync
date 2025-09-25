import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, Move } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableCartIconProps {
  className?: string;
  onCartClick?: () => void;
}

const DraggableCartIcon: React.FC<DraggableCartIconProps> = ({ 
  className, 
  onCartClick 
}) => {
  const { cartSummary, isLoading } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const iconRef = useRef<HTMLDivElement>(null);

  // Show cart icon only for authenticated customers
  useEffect(() => {
    setIsVisible(isAuthenticated && user?.role === 'customer');
  }, [isAuthenticated, user]);

  // Animation when cart items change
  useEffect(() => {
    if (cartSummary?.total_items && cartSummary.total_items > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [cartSummary?.total_items]);

  // Initialize position to bottom-right corner
  useEffect(() => {
    if (isVisible) {
      setPosition({
        x: window.innerWidth - 80,
        y: window.innerHeight - 80
      });
    }
  }, [isVisible]);

  // Mouse move handler for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep icon within screen bounds
        const maxX = window.innerWidth - 56; // 56px is the icon width
        const maxY = window.innerHeight - 56; // 56px is the icon height
        
        setPosition({
          x: Math.max(0, Math.min(maxX, newX)),
          y: Math.max(0, Math.min(maxY, newY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleCartClick = (e: React.MouseEvent) => {
    // Only trigger cart click if not dragging
    if (!isDragging && onCartClick) {
      onCartClick();
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={iconRef}
      className={cn(
        "fixed z-50 transition-all duration-200 ease-out",
        isDragging && "cursor-grabbing",
        !isDragging && "cursor-grab",
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isAnimating ? 'scale(1.1)' : 'scale(1)'
      }}
      onMouseDown={handleMouseDown}
    >
      <Button
        onClick={handleCartClick}
        className={cn(
          "relative w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
          "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
          "border-2 border-white dark:border-gray-800",
          "select-none", // Prevent text selection while dragging
          isAnimating && "animate-bounce scale-110",
          isDragging && "shadow-2xl scale-105"
        )}
        size="lg"
      >
        <ShoppingCart className="h-6 w-6 text-white" />
        
        {/* Cart item count badge */}
        {cartSummary && cartSummary.total_items > 0 && (
          <Badge 
            className={cn(
              "absolute -top-2 -right-2 min-w-6 h-6 rounded-full",
              "bg-red-500 text-white text-xs font-bold",
              "flex items-center justify-center",
              "border-2 border-white dark:border-gray-800",
              isAnimating && "animate-pulse"
            )}
          >
            {cartSummary.total_items > 99 ? '99+' : cartSummary.total_items}
          </Badge>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
        )}

        {/* Drag handle indicator */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
          <Move className="h-2 w-2 text-white" />
        </div>
      </Button>

      {/* Tooltip */}
      {cartSummary && cartSummary.total_items > 0 && !isDragging && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity duration-200">
          <div className="text-center">
            <div className="font-semibold">{cartSummary.total_items} item{cartSummary.total_items !== 1 ? 's' : ''}</div>
            <div className="text-gray-300">LKR {cartSummary.total_value?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

export default DraggableCartIcon;
