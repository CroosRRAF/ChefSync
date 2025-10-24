import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '@/services/notificationService';
import { toast } from 'sonner';

interface UseUnreadNotificationsReturn {
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshUnreadCount: () => Promise<void>;
}

export const useUnreadNotifications = (pollingInterval: number = 30000): UseUnreadNotificationsReturn => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const previousCount = useRef<number>(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setError(null);
      const count = await notificationService.getUnreadCount();
      
      // Show toast for new notifications (only after initial load)
      if (!loading && count > previousCount.current && count > 0) {
        const newNotifications = count - previousCount.current;
        toast.success(
          `${newNotifications} new notification${newNotifications > 1 ? 's' : ''}`,
          {
            description: 'Click the bell icon to view your notifications',
            duration: 4000,
          }
        );
      }
      
      previousCount.current = count;
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread notifications count:', err);
      setError('Failed to load unread count');
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const refreshUnreadCount = useCallback(async () => {
    await fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();

    // Set up polling
    const interval = setInterval(fetchUnreadCount, pollingInterval);

    return () => {
      clearInterval(interval);
    };
  }, [fetchUnreadCount, pollingInterval]);

  return {
    unreadCount,
    loading,
    error,
    refreshUnreadCount,
  };
};