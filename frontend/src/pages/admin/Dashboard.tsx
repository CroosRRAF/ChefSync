import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import ModernDashboard from './ModernDashboard';

const Dashboard: React.FC = () => {
  return (
    <AdminLayout>
      <ModernDashboard />
    </AdminLayout>
  );
};

export default Dashboard;