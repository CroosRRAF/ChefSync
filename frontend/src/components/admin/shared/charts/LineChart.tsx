import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import React, { memo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface LineChartProps {
  title?: string;
  data: Array<{ [key: string]: any }>;
  dataKeys: string[];
  xAxisDataKey: string;
  height?: number;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  showTrend?: boolean;
  className?: string;
}

const defaultColors = [
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#06B6D4", // cyan-500
];

const LineChart: React.FC<LineChartProps> = memo(
  ({
    title,
    data,
    dataKeys,
    xAxisDataKey,
    height = 300,
    colors = defaultColors,
    showGrid = true,
    showLegend = true,
    showTrend = false,
    className = "",
  }) => {
    // Calculate trend for the first data key
    const calculateTrend = () => {
      if (!showTrend || data.length < 2 || dataKeys.length === 0) return null;

      const firstValue = data[0][dataKeys[0]] || 0;
      const lastValue = data[data.length - 1][dataKeys[0]] || 0;
      const change = ((lastValue - firstValue) / firstValue) * 100;

      return {
        value: Math.abs(change).toFixed(1),
        isPositive: change >= 0,
      };
    };

    const trend = calculateTrend();

    return (
      <Card className={className}>
        {title && (
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">{title}</CardTitle>
              {trend && (
                <div
                  className={`flex items-center space-x-1 text-sm ${
                    trend.isPositive
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {trend.isPositive ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                  <span>{trend.value}%</span>
                </div>
              )}
            </div>
          </CardHeader>
        )}
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <RechartsLineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              )}
              <XAxis
                dataKey={xAxisDataKey}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }
);

LineChart.displayName = "LineChart";

export default LineChart;
