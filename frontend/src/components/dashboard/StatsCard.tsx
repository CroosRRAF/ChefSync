import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  trend: {
    value: number;
    isPositive: boolean;
  };
  subtitle: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  iconColor,
  iconBgColor,
  trend,
  subtitle
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
          {trend.value !== 0 && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <i className={`bx ${trend.isPositive ? 'bx-trending-up' : 'bx-trending-down'} ml-1 text-xs ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}></i>
            </div>
          )}
        </div>
        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center`}>
          <i className={`${icon} text-xl ${iconColor}`}></i>
        </div>
      </div>
    </div>
  );
};
