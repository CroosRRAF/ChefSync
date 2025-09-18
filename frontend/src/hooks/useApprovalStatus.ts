import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface ApprovalStatus {
  approval_status: string;
  can_login: boolean;
  message: string;
}

export const useApprovalStatus = () => {
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const checkApprovalStatus = async () => {
    if (!user || !isAuthenticated || (user.role !== 'cook' && user.role !== 'delivery_agent')) {
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('chefsync_token');
      
      const response = await fetch(`${apiUrl}/api/auth/approval-status/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApprovalStatus(data);
      } else {
        // If we can't check status, assume they can't login
        setApprovalStatus({
          approval_status: 'unknown',
          can_login: false,
          message: 'Unable to verify approval status'
        });
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
      setApprovalStatus({
        approval_status: 'unknown',
        can_login: false,
        message: 'Error checking approval status'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAuthenticated && (user.role === 'cook' || user.role === 'delivery_agent')) {
      checkApprovalStatus();
    }
  }, [user, isAuthenticated]);

  return {
    approvalStatus,
    isLoading,
    checkApprovalStatus,
    canAccessDashboard: approvalStatus?.can_login ?? false
  };
};
