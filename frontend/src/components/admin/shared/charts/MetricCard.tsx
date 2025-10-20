import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import React, { memo } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  loading?: boolean;
  prefix?: string;
  suffix?: string;
  size?: "sm" | "md" | "lg";
}

const MetricCard: React.FC<MetricCardProps> = memo(
  ({
    title,
    value,
    change,
    changeLabel,
    icon,
    description,
    className = "",
    loading = false,
    prefix = "",
    suffix = "",
    size = "md",
  }) => {
    const renderTrendIcon = () => {
      if (typeof change !== "number") return null;

      if (change > 0) {
        return (
          <TrendingUp
            size={16}
            className="text-green-600 dark:text-green-400"
          />
        );
      } else if (change < 0) {
        return (
          <TrendingDown size={16} className="text-red-600 dark:text-red-400" />
        );
      } else {
        return <Minus size={16} className="text-gray-500" />;
      }
    };

    const getTrendColor = () => {
      if (typeof change !== "number") return "text-gray-500";

      if (change > 0) {
        return "text-green-600 dark:text-green-400";
      } else if (change < 0) {
        return "text-red-600 dark:text-red-400";
      } else {
        return "text-gray-500";
      }
    };

    const getSizeClasses = () => {
      switch (size) {
        case "sm":
          return {
            card: "p-4",
            title: "text-xs",
            value: "text-lg",
            icon: "w-4 h-4",
          };
        case "lg":
          return {
            card: "p-6",
            title: "text-sm",
            value: "text-3xl",
            icon: "w-6 h-6",
          };
        default:
          return {
            card: "p-5",
            title: "text-sm",
            value: "text-2xl",
            icon: "w-5 h-5",
          };
      }
    };

    const sizeClasses = getSizeClasses();

    if (loading) {
      return (
        <Card className={cn("animate-pulse", className)}>
          <CardContent className={sizeClasses.card}>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={className}>
        <CardContent className={sizeClasses.card}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Title and Icon */}
              <div className="flex items-center space-x-2 mb-2">
                {icon && (
                  <div
                    className={cn(
                      "text-gray-500 dark:text-gray-400",
                      sizeClasses.icon
                    )}
                  >
                    {icon}
                  </div>
                )}
                <h3
                  className={cn(
                    "font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide",
                    sizeClasses.title
                  )}
                >
                  {title}
                </h3>
              </div>

              {/* Value */}
              <div
                className={cn(
                  "font-bold text-gray-900 dark:text-white mb-1",
                  sizeClasses.value
                )}
              >
                {prefix}
                {value}
                {suffix}
              </div>

              {/* Change and Description */}
              <div className="flex items-center space-x-2">
                {typeof change === "number" && (
                  <div
                    className={cn(
                      "flex items-center space-x-1 text-sm",
                      getTrendColor()
                    )}
                  >
                    {renderTrendIcon()}
                    <span className="font-medium">{Math.abs(change)}%</span>
                    {changeLabel && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {changeLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

MetricCard.displayName = "MetricCard";

export default MetricCard;
