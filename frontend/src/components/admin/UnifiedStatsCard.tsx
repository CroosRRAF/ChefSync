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
    bg: 'bg-primary/10 dark:bg-primary/20',
    icon: 'text-primary dark:text-primary-light',
    border: 'border-primary/20 dark:border-primary/30',
    accent: 'bg-primary',
    trend: 'text-primary dark:text-primary-light'
  },
  green: {
    bg: 'bg-success/10 dark:bg-success/20',
    icon: 'text-success dark:text-success-light',
    border: 'border-success/20 dark:border-success/30',
    accent: 'bg-success',
    trend: 'text-success dark:text-success-light'
  },
  yellow: {
    bg: 'bg-warning/10 dark:bg-warning/20',
    icon: 'text-warning dark:text-warning-light',
    border: 'border-warning/20 dark:border-warning/30',
    accent: 'bg-warning',
    trend: 'text-warning dark:text-warning-light'
  },
  red: {
    bg: 'bg-error/10 dark:bg-error/20',
    icon: 'text-error dark:text-error-light',
    border: 'border-error/20 dark:border-error/30',
    accent: 'bg-error',
    trend: 'text-error dark:text-error-light'
  },
  purple: {
    bg: 'bg-accent/10 dark:bg-accent/20',
    icon: 'text-accent dark:text-accent-light',
    border: 'border-accent/20 dark:border-accent/30',
    accent: 'bg-accent',
    trend: 'text-accent dark:text-accent-light'
  },
  indigo: {
    bg: 'bg-info/10 dark:bg-info/20',
    icon: 'text-info dark:text-info-light',
    border: 'border-info/20 dark:border-info/30',
    accent: 'bg-info',
    trend: 'text-info dark:text-info-light'
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