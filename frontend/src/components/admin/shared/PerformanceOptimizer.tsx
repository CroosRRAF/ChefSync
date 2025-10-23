import React, { memo, useMemo, useCallback, Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components
const LazyDataTable = lazy(() => import('./tables/DataTable'));
const LazyCharts = lazy(() => import('./charts/BarChart'));

// Memoized wrapper for expensive components
export const MemoizedDataTable = memo(({ data, columns, ...props }: any) => {
  // Memoize the data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => data, [data]);
  const memoizedColumns = useMemo(() => columns, [columns]);

  return (
    <Suspense fallback={<DataTableSkeleton />}>
      <LazyDataTable data={memoizedData} columns={memoizedColumns} {...props} />
    </Suspense>
  );
});

// Skeleton loader for data tables
const DataTableSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-8 w-24" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  </div>
);

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState({
    renderTime: 0,
    apiCallTime: 0,
    memoryUsage: 0,
  });

  const measureRenderTime = useCallback((componentName: string) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      const renderTime = end - start;
      setMetrics(prev => ({ ...prev, renderTime }));
      
      if (renderTime > 100) {
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, []);

  const measureApiCall = useCallback(async (apiCall: () => Promise<any>, endpoint: string) => {
    const start = performance.now();
    try {
      const result = await apiCall();
      const end = performance.now();
      const apiTime = end - start;
      setMetrics(prev => ({ ...prev, apiCallTime: apiTime }));
      
      if (apiTime > 2000) {
        console.warn(`Slow API call detected for ${endpoint}: ${apiTime.toFixed(2)}ms`);
      }
      return result;
    } catch (error) {
      const end = performance.now();
      const apiTime = end - start;
      console.error(`API call failed for ${endpoint} after ${apiTime.toFixed(2)}ms:`, error);
      throw error;
    }
  }, []);

  return { metrics, measureRenderTime, measureApiCall };
};

// Debounced search hook
export const useDebouncedSearch = (value: string, delay: number = 300) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Virtual scrolling hook for large datasets
export const useVirtualScrolling = (items: any[], itemHeight: number, containerHeight: number) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index,
    }));
  }, [items, itemHeight, containerHeight, scrollTop]);

  const totalHeight = items.length * itemHeight;
  const offsetY = Math.floor(scrollTop / itemHeight) * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
};

// Code splitting wrapper - simplified version
export const withCodeSplitting = (
  importFunc: () => Promise<{ default: React.ComponentType<any> }>,
  fallback?: React.ComponentType<any>
) => {
  const LazyComponent = lazy(importFunc);
  
  return memo((props: any) => (
    <Suspense fallback={fallback ? React.createElement(fallback, props) : <Skeleton className="h-32 w-full" />}>
      <LazyComponent {...props} />
    </Suspense>
  ));
};

// Memoized selector hook for Redux-like state
export const useMemoizedSelector = <T, R>(
  selector: (state: T) => R,
  dependencies: React.DependencyList
) => {
  return useMemo(() => selector, dependencies);
};

// Batch state updates hook
export const useBatchedUpdates = () => {
  const [updates, setUpdates] = React.useState<(() => void)[]>([]);
  const [isBatching, setIsBatching] = React.useState(false);

  const batchUpdate = useCallback((update: () => void) => {
    if (isBatching) {
      setUpdates(prev => [...prev, update]);
    } else {
      update();
    }
  }, [isBatching]);

  const startBatch = useCallback(() => {
    setIsBatching(true);
  }, []);

  const flushBatch = useCallback(() => {
    updates.forEach(update => update());
    setUpdates([]);
    setIsBatching(false);
  }, [updates]);

  return { batchUpdate, startBatch, flushBatch };
};

export default {
  MemoizedDataTable,
  usePerformanceMonitor,
  useDebouncedSearch,
  useVirtualScrolling,
  withCodeSplitting,
  useMemoizedSelector,
  useBatchedUpdates,
};
