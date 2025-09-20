import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  RefreshCw,
  Info,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Unified interface for stats cards
export interface UnifiedStatsCardProps {
  // Core props
  title: string;
  value: string | number;
  subtitle?: string;

  // Icon support (both string and React component)
  icon?: string | React.ReactNode; // Boxicon string or Lucide component
  iconColor?: string;
  iconBgColor?: string;

  // Trend data
  trend?: {
    value: number;
    isPositive: boolean;
    period?: string;
  };

  // Color variants for advanced styling
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';

  // Interactive features
  isLoading?: boolean;
  onRefresh?: () => void;
  onViewDetails?: () => void;
  onClick?: () => void;

  // Chart features
  showChart?: boolean;
  chartData?: Array<{ name: string; value: number }>;

  // Styling
  className?: string;
  variant?: 'basic' | 'advanced'; // Controls feature set
}

// Color variants for consistent theming
const colorVariants = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    accent: 'bg-blue-500',
    trend: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    accent: 'bg-green-500',
    trend: 'text-green-600 dark:text-green-400'
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    accent: 'bg-yellow-500',
    trend: 'text-yellow-600 dark:text-yellow-400'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    accent: 'bg-red-500',
    trend: 'text-red-600 dark:text-red-400'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    accent: 'bg-purple-500',
    trend: 'text-purple-600 dark:text-purple-400'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
    accent: 'bg-indigo-500',
    trend: 'text-indigo-600 dark:text-indigo-400'
  }
};

export const UnifiedStatsCard: React.FC<UnifiedStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = 'text-gray-600',
  iconBgColor = 'bg-gray-100',
  trend,
  color = 'blue',
  isLoading = false,
  onRefresh,
  onViewDetails,
  onClick,
  showChart = false,
  chartData = [],
  className = '',
  variant = 'advanced'
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const colors = colorVariants[color];

  // Handle refresh with loading state
  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setIsRefreshing(false), 1000);
      }
    }
  };

  // Format value for display
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  // Render icon (supports both string and React component)
  const renderIcon = () => {
    if (!icon) return null;

    if (typeof icon === 'string') {
      // Boxicon string
      return <i className={`${icon} text-xl ${iconColor}`} />;
    } else {
      // React component (Lucide)
      return React.cloneElement(icon as React.ReactElement, {
        className: `h-5 w-5 ${iconColor}`
      });
    }
  };

  // Get trend display
  const getTrendDisplay = () => {
    if (!trend) return null;

    const TrendIcon = trend.isPositive ? TrendingUp : TrendingDown;
    const ArrowIcon = trend.isPositive ? ArrowUpRight : ArrowDownRight;

    if (variant === 'basic') {
      return (
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
      );
    }

    return (
      <div className="flex items-center space-x-1">
        <TrendIcon className={`h-4 w-4 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`} />
        <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {Math.abs(trend.value)}%
        </span>
        {trend.period && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {trend.period}
          </span>
        )}
      </div>
    );
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </CardContent>
      </Card>
    );
  }

  // Basic variant (backward compatible)
  if (variant === 'basic') {
    return (
      <div
        className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatValue(value)}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
            {getTrendDisplay()}
          </div>
          {icon && (
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center`}>
              {renderIcon()}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Advanced variant
  return (
    <TooltipProvider>
      <Card className={`${className} hover:shadow-lg transition-all duration-200 group ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {title}
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to view detailed information</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center space-x-1">
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onViewDetails && (
                    <DropdownMenuItem onClick={onViewDetails}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                  )}
                  {onRefresh && (
                    <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {icon && (
                <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                  <div className={colors.icon}>
                    {renderIcon()}
                  </div>
                </div>
              )}
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatValue(value)}
                </div>
                {subtitle && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>
            {getTrendDisplay()}
          </div>

          {showChart && chartData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Recent Trend</span>
                <Activity className="h-3 w-3 text-gray-400" />
              </div>
              <div className="flex items-end space-x-1 h-8">
                {chartData.map((item, index) => {
                  const maxValue = Math.max(...chartData.map(d => d.value));
                  const height = (item.value / maxValue) * 100;
                  return (
                    <div
                      key={index}
                      className={`flex-1 ${colors.accent} rounded-t opacity-70 hover:opacity-100 transition-opacity`}
                      style={{ height: `${height}%` }}
                      title={`${item.name}: ${item.value}`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

// Export legacy StatsCard for backward compatibility
export const StatsCard = UnifiedStatsCard;

// Export AdvancedStatsCard as alias
export const AdvancedStatsCard = UnifiedStatsCard;

export default UnifiedStatsCard;