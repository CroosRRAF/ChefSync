import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Download,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export type ChartType = 'line' | 'area' | 'bar' | 'pie';
export type TimeRange = '7d' | '30d' | '90d' | '1y';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface InteractiveChartProps {
  title: string;
  data: ChartData[];
  type?: ChartType;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  onChartTypeChange?: (type: ChartType) => void;
  onExport?: () => void;
  className?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
  isLoading?: boolean;
  error?: string;
}

const defaultColors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
];

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  title,
  data,
  type = 'line',
  timeRange = '30d',
  onTimeRangeChange,
  onChartTypeChange,
  onExport,
  className = '',
  height = 300,
  showLegend = true,
  showGrid = true,
  colors = defaultColors,
  isLoading = false,
  error
}) => {
  const [selectedChartType, setSelectedChartType] = useState<ChartType>(type);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(timeRange);

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  const chartTypeOptions = [
    { value: 'line', label: 'Line Chart', icon: LineChartIcon },
    { value: 'area', label: 'Area Chart', icon: BarChart3 },
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'pie', label: 'Pie Chart', icon: PieChartIcon }
  ];

  const handleTimeRangeChange = (value: TimeRange) => {
    setSelectedTimeRange(value);
    onTimeRangeChange?.(value);
  };

  const handleChartTypeChange = (value: ChartType) => {
    setSelectedChartType(value);
    onChartTypeChange?.(value);
  };

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          <div className="text-center">
            <div className="text-lg font-medium">Error loading chart</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-lg font-medium">No data available</div>
            <div className="text-sm">Try selecting a different time range</div>
          </div>
        </div>
      );
    }

    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (selectedChartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis dataKey="name" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }} 
            />
            {showLegend && <Legend />}
            {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis dataKey="name" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }} 
            />
            {showLegend && <Legend />}
            {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis dataKey="name" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }} 
            />
            {showLegend && <Legend />}
            {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        );

      default:
        return null;
    }
  };

  const getTrendInfo = () => {
    if (!data || data.length < 2) return null;
    
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const trend = ((lastValue - firstValue) / firstValue) * 100;
    
    return {
      value: Math.abs(trend),
      isPositive: trend >= 0,
      direction: trend >= 0 ? 'up' : 'down'
    };
  };

  const trendInfo = getTrendInfo();

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {trendInfo && (
              <Badge variant={trendInfo.isPositive ? 'default' : 'destructive'} className="text-xs">
                {trendInfo.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {trendInfo.value.toFixed(1)}%
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-32">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {chartTypeOptions.find(opt => opt.value === selectedChartType)?.icon && 
                    React.createElement(chartTypeOptions.find(opt => opt.value === selectedChartType)!.icon, {
                      className: "h-4 w-4"
                    })
                  }
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {chartTypeOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleChartTypeChange(option.value as ChartType)}
                    className={selectedChartType === option.value ? 'bg-accent' : ''}
                  >
                    <option.icon className="h-4 w-4 mr-2" />
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveChart;
