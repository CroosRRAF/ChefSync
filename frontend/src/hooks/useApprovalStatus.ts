import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/services/apiClient';

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
      const response = await apiClient.get('/auth/approval-status/');
      setApprovalStatus(response.data);
    } catch (error: any) {
      if (error.response?.status === 401 && user?.email) {
        // If unauthorized, try without token (for users who just registered)
        try {
          const responseWithoutAuth = await apiClient.get(`/auth/approval-status/?email=${encodeURIComponent(user.email)}`);
          setApprovalStatus(responseWithoutAuth.data);
        } catch (fallbackError) {
          setApprovalStatus({
            approval_status: 'unknown',
            can_login: false,
            message: 'Unable to verify approval status'
          });
        }
      } else {
        setApprovalStatus({
          approval_status: 'unknown',
          can_login: false,
          message: 'Unable to verify approval status'
        });
      }
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
