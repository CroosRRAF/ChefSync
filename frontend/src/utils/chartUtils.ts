// Utility functions for transforming chart data between different formats

export interface ChartJSData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }>;
}

export interface RechartsData {
  name: string;
  value?: number;
  [key: string]: any;
}

/**
 * Transforms Chart.js format data to Recharts format
 * @param chartJSData - Data in Chart.js format
 * @returns Data in Recharts format compatible with InteractiveChart
 */
export function transformChartJSDataToRecharts(
  chartJSData: ChartJSData
): RechartsData[] {
  const { labels, datasets } = chartJSData;

  if (!labels || !datasets || datasets.length === 0) {
    return [];
  }

  // For single dataset charts (line, bar, area)
  if (datasets.length === 1) {
    const dataset = datasets[0];
    const label = dataset.label || "value";
    return labels.map((labelText, index) => {
      const dataValue = dataset.data[index] || 0;
      return {
        name: labelText,
        value: dataValue, // Keep for trend calculation and pie charts
        [label]: dataValue,
      };
    });
  }

  // For multi-dataset charts, create objects with multiple value keys
  // Use the first dataset's data as the primary value
  return labels.map((label, index) => {
    const dataPoint: RechartsData = {
      name: label,
      value: datasets[0].data[index] || 0,
    };

    datasets.forEach((dataset, datasetIndex) => {
      dataPoint[dataset.label || `dataset_${datasetIndex}`] =
        dataset.data[index] || 0;
    });

    return dataPoint;
  });
}

/**
 * Transforms backend chart response to Recharts format
 * @param backendResponse - Response from backend chart API
 * @returns Data in Recharts format
 */
export function transformBackendChartData(backendResponse: {
  chart_type: string;
  title: string;
  data: ChartJSData;
  [key: string]: any;
}): RechartsData[] {
  if (!backendResponse.data) {
    return [];
  }

  return transformChartJSDataToRecharts(backendResponse.data);
}
