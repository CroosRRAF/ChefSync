import React from 'react';
import { useAuth } from '@/context/AuthContext';
import AIChatBox from '@/components/ai/AIChatBox';

interface CustomerPageWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that adds AI chatbox to public pages when a customer is logged in
 */
const CustomerPageWrapper: React.FC<CustomerPageWrapperProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Only show AI chatbox for authenticated customers
  const showAIChatBox = isAuthenticated && user?.role?.toLowerCase() === 'customer';

  return (
    <>
      {children}
      {showAIChatBox && <AIChatBox />}
    </>
  );
};

export default CustomerPageWrapper;

