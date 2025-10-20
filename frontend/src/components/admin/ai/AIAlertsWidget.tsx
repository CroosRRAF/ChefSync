import React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Info,
  X,
} from "lucide-react";

import { GlassCard } from "@/components/admin/shared";

interface AIAlert {
  id: string;
  type: "anomaly" | "trend" | "opportunity" | "warning";
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  actionable?: boolean;
  actionText?: string;
  onAction?: () => void;
}

interface AIAlertsWidgetProps {
  alerts: AIAlert[];
  loading?: boolean;
  onDismiss?: (alertId: string) => void;
  onAction?: (alertId: string) => void;
}

const AIAlertsWidget: React.FC<AIAlertsWidgetProps> = ({
  alerts,
  loading = false,
  onDismiss,
  onAction,
}) => {
  const getAlertIcon = (type: AIAlert["type"]) => {
    switch (type) {
      case "anomaly":
        return AlertTriangle;
      case "trend":
        return CheckCircle;
      case "opportunity":
        return Info;
      case "warning":
        return Bell;
      default:
        return Info;
    }
  };

  const getSeverityColor = (severity: AIAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return "border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-900/20";
      case "high":
        return "border-orange-500 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20";
      case "medium":
        return "border-yellow-500 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20";
      case "low":
        return "border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20";
      default:
        return "border-gray-500 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20";
    }
  };

  const getSeverityIconColor = (severity: AIAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return "text-red-500";
      case "high":
        return "text-orange-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <GlassCard gradient="orange" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard gradient="orange" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600"
          >
            <Bell className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold">AI Smart Alerts</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Real-time alerts and notifications from AI analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
            All Clear
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            No critical alerts at this time. Your system is performing well.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, index) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 ${getSeverityIconColor(alert.severity)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {alert.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(alert.timestamp)}
                          </span>
                          <span className="capitalize">{alert.severity} priority</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onDismiss?.(alert.id)}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {alert.actionable && alert.actionText && (
                      <div className="mt-3">
                        <button
                          onClick={() => onAction?.(alert.id)}
                          className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          {alert.actionText}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};

export default AIAlertsWidget;
