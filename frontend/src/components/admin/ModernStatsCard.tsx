import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  MoreHorizontal,
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
import { cn } from '@/lib/utils';

interface ModernStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'teal';
  isLoading?: boolean;
  onViewDetails?: () => void;
  className?: string;
  showSparkline?: boolean;
  sparklineData?: number[];
}

const colorVariants = {
  blue: {
    bg: 'from-blue-500/10 to-blue-600/10',
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    border: 'border-blue-200 dark:border-blue-800',
    accent: 'text-blue-600 dark:text-blue-400',
    sparkline: 'stroke-blue-500'
  },
  green: {
    bg: 'from-green-500/10 to-emerald-600/10',
    iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
    border: 'border-green-200 dark:border-green-800',
    accent: 'text-green-600 dark:text-green-400',
    sparkline: 'stroke-green-500'
  },
  yellow: {
    bg: 'from-yellow-500/10 to-amber-600/10',
    iconBg: 'bg-gradient-to-br from-yellow-500 to-amber-600',
    border: 'border-yellow-200 dark:border-yellow-800',
    accent: 'text-yellow-600 dark:text-yellow-400',
    sparkline: 'stroke-yellow-500'
  },
  red: {
    bg: 'from-red-500/10 to-rose-600/10',
    iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
    border: 'border-red-200 dark:border-red-800',
    accent: 'text-red-600 dark:text-red-400',
    sparkline: 'stroke-red-500'
  },
  purple: {
    bg: 'from-purple-500/10 to-violet-600/10',
    iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
    border: 'border-purple-200 dark:border-purple-800',
    accent: 'text-purple-600 dark:text-purple-400',
    sparkline: 'stroke-purple-500'
  },
  indigo: {
    bg: 'from-indigo-500/10 to-blue-600/10',
    iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600',
    border: 'border-indigo-200 dark:border-indigo-800',
    accent: 'text-indigo-600 dark:text-indigo-400',
    sparkline: 'stroke-indigo-500'
  },
  teal: {
    bg: 'from-teal-500/10 to-cyan-600/10',
    iconBg: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    border: 'border-teal-200 dark:border-teal-800',
    accent: 'text-teal-600 dark:text-teal-400',
    sparkline: 'stroke-teal-500'
  }
};

const ModernStatsCard: React.FC<ModernStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  isLoading = false,
  onViewDetails,
  className = '',
  showSparkline = false,
  sparklineData = []
}) => {
  const colors = colorVariants[color];

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

  const generateSparklinePath = (data: number[]): string => {
    if (data.length === 0) return '';
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 100;
    const height = 30;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden animate-pulse", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "group relative overflow-hidden hover:shadow-lg transition-all duration-300",
      "bg-gradient-to-br", colors.bg,
      className
    )}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg",
              colors.iconBg
            )}>
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {onViewDetails && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onViewDetails}>
                  <Activity className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Main Value */}
        <div className="mb-4">
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {formatValue(value)}
          </div>
          
          {trend && (
            <div className="flex items-center space-x-2">
              <div className={cn(
                "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                trend.isPositive 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
              )}>
                {trend.isPositive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {trend.period}
              </span>
            </div>
          )}
        </div>

        {/* Sparkline */}
        {showSparkline && sparklineData.length > 0 && (
          <div className="mt-4">
            <svg width="100" height="30" className="w-full h-8">
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={generateSparklinePath(sparklineData)}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={cn("transition-all", colors.accent)}
              />
              <path
                d={`${generateSparklinePath(sparklineData)} L 100,30 L 0,30 Z`}
                fill={`url(#gradient-${color})`}
                className={colors.accent}
              />
            </svg>
          </div>
        )}

        {/* Progress indicator (optional) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20"></div>
      </CardContent>
    </Card>
  );
};

export default ModernStatsCard;