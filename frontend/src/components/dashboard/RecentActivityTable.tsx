import React from 'react';

export const RecentActivityTable: React.FC = () => {
  // Mock data for recent activity
  const recentActivity = [
    {
      id: 1,
      user: 'John Doe',
      action: 'Order Created',
      details: 'Order #ORD-001 for $45.99',
      time: '2 minutes ago',
      type: 'order'
    },
    {
      id: 2,
      user: 'Chef Maria',
      action: 'Food Item Added',
      details: 'Added "Spicy Pasta" to menu',
      time: '15 minutes ago',
      type: 'food'
    },
    {
      id: 3,
      user: 'Admin',
      action: 'User Approved',
      details: 'Approved chef application for Sarah',
      time: '1 hour ago',
      type: 'user'
    },
    {
      id: 4,
      user: 'Mike Johnson',
      action: 'Order Completed',
      details: 'Order #ORD-002 delivered successfully',
      time: '2 hours ago',
      type: 'order'
    },
    {
      id: 5,
      user: 'System',
      action: 'Backup Completed',
      details: 'Daily backup completed successfully',
      time: '3 hours ago',
      type: 'system'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return 'bx bx-package';
      case 'food':
        return 'bx bx-restaurant';
      case 'user':
        return 'bx bx-user';
      case 'system':
        return 'bx bx-cog';
      default:
        return 'bx bx-info-circle';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'text-blue-600 bg-blue-100';
      case 'food':
        return 'text-green-600 bg-green-100';
      case 'user':
        return 'text-purple-600 bg-purple-100';
      case 'system':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-4">
      {recentActivity.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center`}>
            <i className={`${getActivityIcon(activity.type)} text-lg`}></i>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.user}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activity.time}
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {activity.action}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {activity.details}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
