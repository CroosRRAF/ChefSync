import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';

interface DraggableWrapperProps {
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  storageKey?: string;
  className?: string;
  zIndex?: number;
}

export const DraggableWrapper: React.FC<DraggableWrapperProps> = ({
  children,
  initialPosition = { x: 0, y: 0 },
  storageKey,
  className = '',
  zIndex = 50,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  // Load saved position from localStorage
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const savedPos = JSON.parse(saved);
          setPosition(savedPos);
        } catch (e) {
          console.error('Failed to parse saved position:', e);
        }
      }
    }
  }, [storageKey]);

  // Save position to localStorage
  useEffect(() => {
    if (storageKey && (position.x !== initialPosition.x || position.y !== initialPosition.y)) {
      localStorage.setItem(storageKey, JSON.stringify(position));
    }
  }, [position, storageKey, initialPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the drag handle
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drag-handle]')) return;

    setIsDragging(true);
    startPosRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - startPosRef.current.x;
    const newY = e.clientY - startPosRef.current.y;

    // Constrain to viewport
    const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 0);
    const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 0);

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
  }, [isDragging]);

  return (
    <motion.div
      ref={dragRef}
      className={`fixed ${className}`}
      style={{
        left: position.x,
        top: position.y,
        zIndex,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      onMouseDown={handleMouseDown}
      drag={false} // We handle dragging manually for better control
    >
      {/* Drag Handle */}
      <div
        data-drag-handle
        className="absolute -top-2 left-1/2 transform -translate-x-1/2 cursor-grab active:cursor-grabbing opacity-0 hover:opacity-100 transition-opacity"
      >
        <div className="bg-gray-800 dark:bg-gray-700 text-white px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
          <GripVertical className="h-3 w-3" />
          <span className="text-xs">Drag</span>
        </div>
      </div>
      {children}
    </motion.div>
  );
};

export default DraggableWrapper;
