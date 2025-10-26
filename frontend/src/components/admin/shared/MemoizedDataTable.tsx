import { useVirtualScrolling } from "@/utils/performance";
import React, { memo, useCallback, useMemo } from "react";
import DataTable from "./tables/DataTable";

interface MemoizedDataTableProps {
  data: any[];
  columns: any[];
  title?: string;
  loading?: boolean;
  searchable?: boolean;
  selectable?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  bulkActions?: any[];
  onRowClick?: (row: any, index: number) => void;
  onRefresh?: () => void;
  onExport?: (data: any[]) => void;
  className?: string;
  virtualScrolling?: boolean;
  itemHeight?: number;
  containerHeight?: number;
  debounceMs?: number;
}

const MemoizedDataTable: React.FC<MemoizedDataTableProps> = memo(
  ({
    data,
    columns,
    title,
    loading = false,
    searchable = true,
    selectable = false,
    pagination,
    bulkActions = [],
    onRowClick,
    onRefresh,
    onExport,
    className,
    virtualScrolling = false,
    itemHeight = 60,
    containerHeight = 400,
    debounceMs = 300,
  }) => {
    // Memoize columns to prevent unnecessary re-renders
    const memoizedColumns = useMemo(() => columns, [columns]);

    // Memoize bulk actions
    const memoizedBulkActions = useMemo(() => bulkActions, [bulkActions]);

    // Memoized row click handler
    const handleRowClick = useCallback(
      (row: any, index: number) => {
        onRowClick?.(row, index);
      },
      [onRowClick]
    );

    // Memoized refresh handler
    const handleRefresh = useCallback(() => {
      onRefresh?.();
    }, [onRefresh]);

    // Memoized export handler
    const handleExport = useCallback(
      (data: any[]) => {
        onExport?.(data);
      },
      [onExport]
    );

    // Virtual scrolling for large datasets
    const virtualScrollProps = useVirtualScrolling(
      data,
      itemHeight,
      containerHeight
    );

    // Memoize the data to prevent unnecessary processing
    const processedData = useMemo(() => {
      if (virtualScrolling && data.length > 100) {
        return virtualScrollProps.visibleItems;
      }
      return data;
    }, [data, virtualScrolling, virtualScrollProps.visibleItems]);

    // Memoize pagination props
    const memoizedPagination = useMemo(() => pagination, [pagination]);

    // Performance monitoring
    const renderStartTime = useMemo(() => performance.now(), [data, columns]);

    React.useEffect(() => {
      const renderTime = performance.now() - renderStartTime;
      if (renderTime > 100) {
        // Log slow renders
        console.warn(
          `🐌 Slow DataTable render: ${renderTime.toFixed(2)}ms for ${
            data.length
          } items`
        );
      }
    }, [renderStartTime, data.length]);

    return (
      <div className="relative">
        {virtualScrolling && data.length > 100 && (
          <div
            style={{ height: virtualScrollProps.totalHeight }}
            className="relative"
          >
            <div
              style={{
                transform: `translateY(${virtualScrollProps.offsetY}px)`,
                height: containerHeight,
              }}
            >
              <DataTable
                data={processedData}
                columns={memoizedColumns}
                title={title}
                loading={loading}
                searchable={searchable}
                selectable={selectable}
                pagination={memoizedPagination}
                bulkActions={memoizedBulkActions}
                onRowClick={handleRowClick}
                onRefresh={handleRefresh}
                onExport={handleExport}
                className={className}
              />
            </div>
          </div>
        )}

        {(!virtualScrolling || data.length <= 100) && (
          <DataTable
            data={processedData}
            columns={memoizedColumns}
            title={title}
            loading={loading}
            searchable={searchable}
            selectable={selectable}
            pagination={memoizedPagination}
            bulkActions={memoizedBulkActions}
            onRowClick={handleRowClick}
            onRefresh={handleRefresh}
            onExport={handleExport}
            className={className}
          />
        )}
      </div>
    );
  }
);

MemoizedDataTable.displayName = "MemoizedDataTable";

// Custom comparison function for better memoization
export const areDataTablePropsEqual = (
  prevProps: MemoizedDataTableProps,
  nextProps: MemoizedDataTableProps
) => {
  // Compare data arrays by length and reference
  if (prevProps.data.length !== nextProps.data.length) {
    return false;
  }

  // For small arrays, do deep comparison
  if (prevProps.data.length < 10) {
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
  }

  // For large arrays, compare by reference (assumes immutable updates)
  if (prevProps.data !== nextProps.data) {
    return false;
  }

  // Compare other props
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.searchable === nextProps.searchable &&
    prevProps.selectable === nextProps.selectable &&
    JSON.stringify(prevProps.columns) === JSON.stringify(nextProps.columns) &&
    JSON.stringify(prevProps.pagination) ===
      JSON.stringify(nextProps.pagination) &&
    JSON.stringify(prevProps.bulkActions) ===
      JSON.stringify(nextProps.bulkActions)
  );
};

// Highly optimized version with custom comparison
export const HighlyOptimizedDataTable = memo(
  MemoizedDataTable,
  areDataTablePropsEqual
);

export default MemoizedDataTable;
