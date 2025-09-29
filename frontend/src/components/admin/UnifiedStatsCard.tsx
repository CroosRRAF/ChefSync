import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Activity, Info, RefreshCw } from "lucide-react";
import React, { useState } from "react";

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
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "indigo";

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
  variant?: "basic" | "advanced"; // Controls feature set
}

// Color variants for consistent theming
const colorVariants = {
  blue: {
    bg: "bg-primary/10 dark:bg-primary/20",
    icon: "text-primary dark:text-primary-light",
    border: "border-primary/20 dark:border-primary/30",
    hoverBorder: "hover:border-primary/50",
    accent: "bg-primary",
    trend: "text-primary dark:text-primary-light",
  },
  green: {
    bg: "bg-success/10 dark:bg-success/20",
    icon: "text-success dark:text-success-light",
    border: "border-success/20 dark:border-success/30",
    hoverBorder: "hover:border-success/50",
    accent: "bg-success",
    trend: "text-success dark:text-success-light",
  },
  yellow: {
    bg: "bg-warning/10 dark:bg-warning/20",
    icon: "text-warning dark:text-warning-light",
    border: "border-warning/20 dark:border-warning/30",
    hoverBorder: "hover:border-warning/50",
    accent: "bg-warning",
    trend: "text-warning dark:text-warning-light",
  },
  red: {
    bg: "bg-error/10 dark:bg-error/20",
    icon: "text-error dark:text-error-light",
    border: "border-error/20 dark:border-error/30",
    hoverBorder: "hover:border-error/50",
    accent: "bg-error",
    trend: "text-error dark:text-error-light",
  },
  purple: {
    bg: "bg-accent/10 dark:bg-accent/20",
    icon: "text-accent dark:text-accent-light",
    border: "border-accent/20 dark:border-accent/30",
    hoverBorder: "hover:border-accent/50",
    accent: "bg-accent",
    trend: "text-accent dark:text-accent-light",
  },
  indigo: {
    bg: "bg-info/10 dark:bg-info/20",
    icon: "text-info dark:text-info-light",
    border: "border-info/20 dark:border-info/30",
    hoverBorder: "hover:border-info/50",
    accent: "bg-info",
    trend: "text-info dark:text-info-light",
  },
};

export const UnifiedStatsCard: React.FC<UnifiedStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = "text-gray-600",
  iconBgColor = "bg-gray-100",
  trend,
  color = "blue",
  isLoading = false,
  onRefresh,
  onViewDetails,
  onClick,
  showChart = false,
  chartData = [],
  className = "",
  variant = "advanced",
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
    if (typeof val === "number") {
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

    if (typeof icon === "string") {
      // Boxicon string
      return <i className={`${icon} text-xl ${iconColor}`} />;
    } else {
      // React component (Lucide)
      return React.cloneElement(icon as React.ReactElement, {
        className: `h-5 w-5 ${iconColor}`,
      });
    }
  };

  // Get trend display - REMOVED as per user request
  const getTrendDisplay = () => {
    return null; // No trend display
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
  if (variant === "basic") {
    return (
      <div
        className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow ${
          onClick ? "cursor-pointer" : ""
        } ${className}`}
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
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center`}
            >
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
      <Card
        className={`${className} hover:shadow-xl transition-all duration-300 group ${
          onClick
            ? "cursor-pointer hover:scale-[1.02] hover:-translate-y-1"
            : ""
        } border-2 ${colors.border} ${colors.hoverBorder} hover:shadow-lg`}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
                {title}
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-gray-400 hover:text-primary cursor-help opacity-0 group-hover:opacity-100 transition-opacity" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to navigate to detailed view</p>
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
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {icon && (
                <div
                  className={`p-3 rounded-xl ${colors.bg} ${colors.border} border-2 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  <div className={colors.icon}>{renderIcon()}</div>
                </div>
              )}
              <div className="space-y-1">
                <div className="text-3xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                  {formatValue(value)}
                </div>
                {subtitle && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
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
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Recent Trend
                </span>
                <Activity className="h-3 w-3 text-gray-400" />
              </div>
              <div className="flex items-end space-x-1 h-8">
                {chartData.map((item, index) => {
                  const maxValue = Math.max(...chartData.map((d) => d.value));
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
