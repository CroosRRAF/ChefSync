import { useState, useEffect } from 'react';
import { communicationService } from '@/services/communicationService';

export interface CommunicationStats {
  total: number;
  unread: number;
  unassigned: number;
  resolved: number;
  by_type: Array<{ communication_type: string; count: number }>;
  by_priority: Array<{ priority: string; count: number }>;
  by_status: Array<{ status: string; count: number }>;
}

export const useCommunicationStats = () => {
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await communicationService.getStats();
      setStats(data);
    } catch (err) {
      setError('Failed to fetch communication stats');
      console.error('Error fetching communication stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const refetch = () => {
    fetchStats();
  };

  return {
    stats,
    loading,
    error,
    refetch,
  };
};