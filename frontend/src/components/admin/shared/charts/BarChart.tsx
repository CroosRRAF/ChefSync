import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { memo } from "react";
import {
  Bar,
  CartesianGrid,
  Legend,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BarChartProps {
  title?: string;
  data: Array<{ [key: string]: any }>;
  dataKeys: string[];
  xAxisDataKey: string;
  height?: number;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;
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

const BarChart: React.FC<BarChartProps> = memo(
  ({
    title,
    data,
    dataKeys,
    xAxisDataKey,
    height = 300,
    colors = defaultColors,
    showGrid = true,
    showLegend = true,
    horizontal = false,
    className = "",
  }) => {
    return (
      <Card className={className}>
        {title && (
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              layout={horizontal ? "horizontal" : "vertical"}
            >
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              )}
              <XAxis
                type={horizontal ? "number" : "category"}
                dataKey={horizontal ? undefined : xAxisDataKey}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type={horizontal ? "category" : "number"}
                dataKey={horizontal ? xAxisDataKey : undefined}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={horizontal ? 80 : undefined}
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
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }
);

BarChart.displayName = "BarChart";

export default BarChart;
