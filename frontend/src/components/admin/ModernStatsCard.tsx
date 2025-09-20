import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/context/ThemeContext';
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
import { cn } from '@/libs/utils';

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

const getColorVariants = (theme: 'light' | 'dark') => ({
  blue: {
    bg: theme === 'light' ? 'linear-gradient(135deg, #EBF4FF 0%, #DBEAFE 100%)' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
    iconBg: theme === 'light' ? 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)' : 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
    border: theme === 'light' ? '#BFDBFE' : '#1E3A8A',
    accent: theme === 'light' ? '#2563EB' : '#3B82F6',
    sparkline: theme === 'light' ? '#2563EB' : '#3B82F6'
  },
  green: {
    bg: theme === 'light' ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
    iconBg: theme === 'light' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
    border: theme === 'light' ? '#A7F3D0' : '#047857',
    accent: theme === 'light' ? '#10B981' : '#34D399',
    sparkline: theme === 'light' ? '#10B981' : '#34D399'
  },
  yellow: {
    bg: theme === 'light' ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
    iconBg: theme === 'light' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
    border: theme === 'light' ? '#FCD34D' : '#92400E',
    accent: theme === 'light' ? '#F59E0B' : '#FBBF24',
    sparkline: theme === 'light' ? '#F59E0B' : '#FBBF24'
  },
  red: {
    bg: theme === 'light' ? 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
    iconBg: theme === 'light' ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)',
    border: theme === 'light' ? '#FCA5A5' : '#991B1B',
    accent: theme === 'light' ? '#EF4444' : '#F87171',
    sparkline: theme === 'light' ? '#EF4444' : '#F87171'
  },
  purple: {
    bg: theme === 'light' ? 'linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)' : 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(147, 51, 234, 0.05) 100%)',
    iconBg: theme === 'light' ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' : 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
    border: theme === 'light' ? '#C4B5FD' : '#5B21B6',
    accent: theme === 'light' ? '#7C3AED' : '#A78BFA',
    sparkline: theme === 'light' ? '#7C3AED' : '#A78BFA'
  },
  indigo: {
    bg: theme === 'light' ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)',
    iconBg: theme === 'light' ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' : 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
    border: theme === 'light' ? '#C7D2FE' : '#3730A3',
    accent: theme === 'light' ? '#6366F1' : '#818CF8',
    sparkline: theme === 'light' ? '#6366F1' : '#818CF8'
  },
  teal: {
    bg: theme === 'light' ? 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)' : 'linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(20, 184, 166, 0.05) 100%)',
    iconBg: theme === 'light' ? 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)' : 'linear-gradient(135deg, #5EEAD4 0%, #2DD4BF 100%)',
    border: theme === 'light' ? '#99F6E4' : '#134E4A',
    accent: theme === 'light' ? '#14B8A6' : '#5EEAD4',
    sparkline: theme === 'light' ? '#14B8A6' : '#5EEAD4'
  }
});

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
  const { theme } = useTheme();
  const colorVariants = getColorVariants(theme);
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
      <Card className={cn("overflow-hidden animate-pulse", className)} style={{
        background: theme === 'light' ? '#F9FAFB' : '#1F2937',
        borderColor: theme === 'light' ? '#E5E7EB' : '#374151'
      }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 rounded w-24" style={{
              backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563'
            }}></div>
            <div className="h-8 w-8 rounded-lg" style={{
              backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563'
            }}></div>
          </div>
          <div className="h-8 rounded w-16 mb-2" style={{
            backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563'
          }}></div>
          <div className="h-3 rounded w-20" style={{
            backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563'
          }}></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "group relative overflow-hidden hover:shadow-lg transition-all duration-300",
      className
    )} style={{
      background: colors.bg,
      borderColor: colors.border
    }}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg" style={{
              background: colors.iconBg
            }}>
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-medium" style={{
                color: theme === 'light' ? '#6B7280' : '#9CA3AF'
              }}>
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs mt-1" style={{
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                }}>
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
          <div className="text-3xl font-bold mb-1" style={{
            color: theme === 'light' ? '#111827' : '#F9FAFB'
          }}>
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
              <span className="text-xs" style={{
                color: theme === 'light' ? '#6B7280' : '#9CA3AF'
              }}>
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
                stroke={colors.sparkline}
                strokeWidth="2"
                className="transition-all"
              />
              <path
                d={`${generateSparklinePath(sparklineData)} L 100,30 L 0,30 Z`}
                fill={`url(#gradient-${color})`}
                style={{ color: colors.sparkline }}
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