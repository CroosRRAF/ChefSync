import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import EnhancedUserManagement from './EnhancedUserManagement';

const ManageUsers: React.FC = () => {
  return (
    <AdminLayout>
      <EnhancedUserManagement />
    </AdminLayout>
  );
};

export default ManageUsers;