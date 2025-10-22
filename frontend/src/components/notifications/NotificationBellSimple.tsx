import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';
import NotificationDropdown from './NotificationDropdown.tsx';

const NotificationBellSimple = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = !isOpen;
    console.log('🔔 NOTIFICATION BELL CLICKED! Opening:', newState);
    console.log('🔔 Current user:', user?.email || 'No user');
    console.log('🔔 Unread count:', unreadCount);
    setIsOpen(newState);
  };

  const handleNotificationRead = () => {
    fetchUnreadCount();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        className={`relative inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-primary/10 active:scale-95 transition-all cursor-pointer ${
          isOpen ? 'bg-primary/10' : ''
        }`}
        aria-label="Notifications"
        onClick={handleToggle}
        onMouseDown={(e) => {
          console.log('🔔 Mouse down on bell button');
        }}
        style={{ zIndex: 10 }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white pointer-events-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="fixed mt-2 w-96 bg-background border border-border rounded-lg shadow-xl z-[9999]"
          style={{ 
            top: 'calc(4rem + 8px)',
            right: '1rem',
          }}
        >
          <NotificationDropdown 
            onNotificationRead={handleNotificationRead} 
            onClose={handleClose} 
          />
        </div>
      )}
    </div>
  );
};

export default NotificationBellSimple;

