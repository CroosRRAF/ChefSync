import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { memo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface PieChartProps {
  title?: string;
  data: Array<{ name: string; value: number; [key: string]: any }>;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  showLabels?: boolean;
  innerRadius?: number;
  className?: string;
}

const defaultColors = [
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#06B6D4", // cyan-500
  "#84CC16", // lime-500
  "#F97316", // orange-500
];

const PieChart: React.FC<PieChartProps> = memo(
  ({
    title,
    data,
    height = 300,
    colors = defaultColors,
    showLegend = true,
    showLabels = false,
    innerRadius = 0,
    className = "",
  }) => {
    const renderCustomLabel = (entry: any) => {
      const percent = (
        (entry.value / data.reduce((sum, item) => sum + item.value, 0)) *
        100
      ).toFixed(1);
      return `${entry.name}: ${percent}%`;
    };

    return (
      <Card className={className}>
        {title && (
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={innerRadius}
                paddingAngle={2}
                dataKey="value"
                label={showLabels ? renderCustomLabel : false}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [value, "Value"]}
              />
              {showLegend && <Legend />}
            </RechartsPieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }
);

PieChart.displayName = "PieChart";

export default PieChart;
