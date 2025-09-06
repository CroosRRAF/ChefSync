import React from 'react';

export const PlatformOverview: React.FC = () => {
  const platformStats = [
    {
      label: 'System Health',
      value: '99.9%',
      status: 'excellent',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Active Sessions',
      value: '1,247',
      status: 'normal',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Server Load',
      value: '23%',
      status: 'low',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Response Time',
      value: '145ms',
      status: 'fast',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  return (
    <div className="space-y-4">
      {platformStats.map((stat, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${stat.bgColor}`}></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {stat.label}
            </span>
          </div>
          <span className={`text-sm font-bold ${stat.color}`}>
            {stat.value}
          </span>
        </div>
      ))}
      
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-center space-x-2">
          <i className="bx bx-info-circle text-blue-600"></i>
          <span className="text-sm text-blue-800 dark:text-blue-200">
            All systems operational
          </span>
        </div>
      </div>
    </div>
  );
};
