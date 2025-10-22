import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import React from "react";

// Stats Widget - For displaying key metrics
interface StatsWidgetProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
    period?: string;
  };
  icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "gray";
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({
  title,
  value,
  change,
  icon,
  color = "blue",
  loading = false,
  onClick,
  className = "",
}) => {
  const colorVariants = {
    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300",
    green: "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300",
    red: "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300",
    yellow:
      "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300",
    purple:
      "text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300",
    gray: "text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300",
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        className,
        onClick && "cursor-pointer hover:shadow-md transition-shadow"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-3xl font-bold">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {change && (
              <div className="flex items-center space-x-1">
                {change.type === "increase" ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    change.type === "increase"
                      ? "text-green-500"
                      : "text-red-500"
                  )}
                >
                  {Math.abs(change.value)}%
                </span>
                {change.period && (
                  <span className="text-sm text-gray-500">
                    from {change.period}
                  </span>
                )}
              </div>
            )}
          </div>

          {icon && (
            <div className={cn("p-3 rounded-full", colorVariants[color])}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Progress Widget - For showing progress towards goals
interface ProgressWidgetProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
  color?: "blue" | "green" | "red" | "yellow" | "purple";
  showPercentage?: boolean;
  loading?: boolean;
  className?: string;
}

export const ProgressWidget: React.FC<ProgressWidgetProps> = ({
  title,
  current,
  target,
  unit = "",
  color = "blue",
  showPercentage = true,
  loading = false,
  className = "",
}) => {
  const percentage = Math.min((current / target) * 100, 100);

  const colorVariants = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <h3 className="font-medium">{title}</h3>

          <div className="space-y-2">
            <Progress value={percentage} className="h-2" />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                {current.toLocaleString()}
                {unit} / {target.toLocaleString()}
                {unit}
              </span>
              {showPercentage && <span>{percentage.toFixed(1)}%</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Activity Widget - For showing recent activities/events
interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date;
  type?: "info" | "success" | "warning" | "error";
  icon?: React.ReactNode;
}

interface ActivityWidgetProps {
  title: string;
  activities: ActivityItem[];
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  loading?: boolean;
  className?: string;
}

export const ActivityWidget: React.FC<ActivityWidgetProps> = ({
  title,
  activities,
  maxItems = 5,
  showViewAll = true,
  onViewAll,
  loading = false,
  className = "",
}) => {
  const typeColors = {
    info: "text-blue-500",
    success: "text-green-500",
    warning: "text-yellow-500",
    error: "text-red-500",
  };

  const displayActivities = activities.slice(0, maxItems);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {showViewAll && onViewAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="text-blue-600 hover:text-blue-700"
            >
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {displayActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent activities
          </div>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div
                  className={cn(
                    "p-2 rounded-full bg-gray-100 dark:bg-gray-800",
                    activity.type && typeColors[activity.type]
                  )}
                >
                  {activity.icon || <Activity className="h-4 w-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.timestamp.toRelativeTimeString?.() ||
                      activity.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Quick Actions Widget - For common actions
interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "gray";
  disabled?: boolean;
  badge?: string | number;
}

interface QuickActionsWidgetProps {
  title: string;
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  title,
  actions,
  columns = 2,
  className = "",
}) => {
  const colorVariants = {
    blue: "hover:bg-blue-50 dark:hover:bg-blue-900 text-blue-600",
    green: "hover:bg-green-50 dark:hover:bg-green-900 text-green-600",
    red: "hover:bg-red-50 dark:hover:bg-red-900 text-red-600",
    yellow: "hover:bg-yellow-50 dark:hover:bg-yellow-900 text-yellow-600",
    purple: "hover:bg-purple-50 dark:hover:bg-purple-900 text-purple-600",
    gray: "hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-600",
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div
          className={cn(
            "grid gap-3",
            columns === 2 && "grid-cols-2",
            columns === 3 && "grid-cols-3",
            columns === 4 && "grid-cols-4"
          )}
        >
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                "h-auto p-4 flex-col space-y-2 relative",
                action.color && colorVariants[action.color]
              )}
            >
              {action.badge && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {action.badge}
                </Badge>
              )}

              <div className="h-8 w-8">{action.icon}</div>

              <span className="text-sm font-medium text-center">
                {action.label}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Summary Widget - For overview information
interface SummaryItem {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
}

interface SummaryWidgetProps {
  title: string;
  items: SummaryItem[];
  loading?: boolean;
  className?: string;
}

export const SummaryWidget: React.FC<SummaryWidgetProps> = ({
  title,
  items,
  loading = false,
  className = "",
}) => {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {item.label}
              </span>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold">
                  {typeof item.value === "number"
                    ? item.value.toLocaleString()
                    : item.value}
                </span>

                {item.change && (
                  <div className="flex items-center">
                    {item.change.type === "increase" ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={cn(
                        "text-xs",
                        item.change.type === "increase"
                          ? "text-green-500"
                          : "text-red-500"
                      )}
                    >
                      {Math.abs(item.change.value)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
