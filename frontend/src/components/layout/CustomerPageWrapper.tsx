import React from 'react';
import { useAuth } from '@/context/AuthContext';
import AIChatBox from '@/components/ai/AIChatBox';
import OrderTrackingWrapper from '@/components/tracking/OrderTrackingWrapper';

interface CustomerPageWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that adds AI chatbox and order tracking to public pages when a customer is logged in
 */
const CustomerPageWrapper: React.FC<CustomerPageWrapperProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Only show features for authenticated customers
  const isCustomer = isAuthenticated && user?.role?.toLowerCase() === 'customer';

  return (
    <>
      {children}
      {isCustomer && (
        <>
          <AIChatBox />
          <OrderTrackingWrapper />
        </>
      )}
    </>
  );
};

export default CustomerPageWrapper;

