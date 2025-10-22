import React from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
} from "lucide-react";

import { GlassCard, AnimatedStats } from "@/components/admin/shared";

interface ForecastData {
  date: string;
  predicted_amount: number;
  confidence: number;
  day_of_week: string;
}

interface PredictiveAnalyticsWidgetProps {
  salesForecast: {
    forecast: ForecastData[];
    confidence: number;
    insights: string[];
    total_forecast: number;
    avg_daily_forecast: number;
  } | null;
  loading?: boolean;
  onRefresh?: () => void;
}

const PredictiveAnalyticsWidget: React.FC<PredictiveAnalyticsWidgetProps> = ({
  salesForecast,
  loading = false,
  onRefresh,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };

  const getDayColor = (day: string) => {
    const dayColors: { [key: string]: string } = {
      Monday: "bg-blue-100 text-blue-800",
      Tuesday: "bg-green-100 text-green-800",
      Wednesday: "bg-purple-100 text-purple-800",
      Thursday: "bg-orange-100 text-orange-800",
      Friday: "bg-red-100 text-red-800",
      Saturday: "bg-pink-100 text-pink-800",
      Sunday: "bg-gray-100 text-gray-800",
    };
    return dayColors[day] || "bg-gray-100 text-gray-800";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600 bg-green-50";
    if (confidence >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  if (loading) {
    return (
      <GlassCard gradient="green" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-600">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-1 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </GlassCard>
    );
  }

  if (!salesForecast) {
    return (
      <GlassCard gradient="green" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-600">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Predictive Analytics</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              AI-powered sales forecasting and trend analysis
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
            Forecast Data Unavailable
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Predictive analytics require historical data to generate accurate forecasts.
          </p>
        </div>
      </GlassCard>
    );
  }

  const { forecast, confidence, insights, total_forecast, avg_daily_forecast } = salesForecast;

  return (
    <GlassCard gradient="green" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-600"
          >
            <BarChart3 className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold">Predictive Analytics</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              AI-powered sales forecasting and trend analysis
            </p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(confidence)}`}>
          {confidence}% Confidence
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <AnimatedStats
          value={total_forecast}
          label="7-Day Forecast"
          icon={DollarSign}
          trend={12.5}
          gradient="green"
          prefix="LKR "
          compact
        />
        <AnimatedStats
          value={avg_daily_forecast}
          label="Avg Daily Sales"
          icon={TrendingUp}
          trend={8.3}
          gradient="blue"
          prefix="LKR "
          compact
        />
        <AnimatedStats
          value={forecast.length}
          label="Forecast Days"
          icon={Calendar}
          trend={0}
          gradient="purple"
          compact
        />
      </div>

      {/* Forecast Chart Preview */}
      <div className="mb-6">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          7-Day Sales Forecast
        </h4>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-end gap-2 h-32">
            {forecast.slice(0, 7).map((day, index) => (
              <motion.div
                key={day.date}
                initial={{ height: 0 }}
                animate={{ height: `${(day.predicted_amount / Math.max(...forecast.map(d => d.predicted_amount))) * 100}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex-1 bg-gradient-to-t from-green-500 to-green-400 rounded-t flex flex-col items-center justify-end p-2 min-w-0"
              >
                <div className="text-xs font-medium text-white mb-1">
                  {formatCurrency(day.predicted_amount)}
                </div>
                <div className={`text-xs px-1 py-0.5 rounded text-white font-medium ${getDayColor(day.day_of_week)}`}>
                  {day.day_of_week.slice(0, 3)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            AI Insights
          </h4>
          <div className="space-y-2">
            {insights.slice(0, 3).map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
              >
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{insight}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>AI Active</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default PredictiveAnalyticsWidget;
