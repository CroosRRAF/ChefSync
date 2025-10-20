import React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  DollarSign,
  Eye,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

import { GlassCard, OptimisticButton } from "@/components/admin/shared";
import { aiService } from "@/services/aiService";

interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: "success" | "warning" | "info" | "error";
  confidence: number;
  action?: string;
  icon: React.ComponentType<any>;
}

interface AIInsightsWidgetProps {
  insights: AIInsight[];
  loading?: boolean;
  onRefresh?: () => void;
  onActionClick?: (insightId: string, action: string) => void;
}

const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({
  insights,
  loading = false,
  onRefresh,
  onActionClick,
}) => {
  const getInsightColor = (type: AIInsight["type"]) => {
    switch (type) {
      case "success":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20";
      case "warning":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20";
      case "error":
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20";
      case "info":
      default:
        return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600";
    if (confidence >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <GlassCard gradient="blue" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard gradient="blue" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600"
          >
            <Brain className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold">AI Insights</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Smart analytics and recommendations powered by AI
            </p>
          </div>
        </div>

        {onRefresh && (
          <OptimisticButton
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh AI
          </OptimisticButton>
        )}
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-8">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
            No AI Insights Available
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            AI services may be temporarily unavailable. Check back later for smart recommendations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <insight.icon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {insight.title}
                    </h4>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getConfidenceColor(
                        insight.confidence
                      )} bg-white dark:bg-gray-800`}
                    >
                      {insight.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {insight.description}
                  </p>
                  {insight.action && (
                    <button
                      onClick={() => onActionClick?.(insight.id, insight.action!)}
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {insight.action}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Powered by ChefSync AI Analytics</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Updates</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default AIInsightsWidget;
