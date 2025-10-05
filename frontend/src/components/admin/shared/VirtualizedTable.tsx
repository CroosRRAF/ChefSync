import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  title: string;
  width?: number;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  height?: number;
  itemHeight?: number;
  searchable?: boolean;
  sortable?: boolean;
  loading?: boolean;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
}

// Custom virtual scrolling hook
const useVirtualScrolling = <T,>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    startIndex,
    totalHeight,
    offsetY,
    scrollElementRef,
    handleScroll,
  };
};

export default function VirtualizedTable<T>({
  data,
  columns,
  height = 400,
  itemHeight = 50,
  searchable = true,
  sortable = true,
  loading = false,
  onRowClick,
  className = '',
}: VirtualizedTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter((item) =>
      columns.some((column) => {
        const value = String((item as any)[column.key] || '').toLowerCase();
        return value.includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = useCallback((key: keyof T | string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // Use custom virtual scrolling
  const {
    visibleItems,
    startIndex,
    totalHeight,
    offsetY,
    scrollElementRef,
    handleScroll,
  } = useVirtualScrolling(sortedData, itemHeight, height);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden ${className}`}>
      {/* Search and Controls */}
      {searchable && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="flex items-center bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {columns.map((column, index) => {
          const width = column.width || 150;
          const isSorted = sortConfig?.key === column.key;
          const sortDirection = isSorted ? sortConfig.direction : null;

          return (
            <div
              key={`header-${column.key as string}-${index}`}
              className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                column.sortable && sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800' : ''
              }`}
              style={{ width, minWidth: width, maxWidth: width }}
              onClick={() => column.sortable && sortable && handleSort(column.key)}
            >
              <div className="flex items-center space-x-1">
                <span>{column.title}</span>
                {column.sortable && sortable && (
                  <ArrowUpDown 
                    className={`h-3 w-3 ${
                      isSorted 
                        ? sortDirection === 'asc' 
                          ? 'text-blue-600 rotate-180' 
                          : 'text-blue-600'
                        : 'text-gray-400'
                    }`} 
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Virtualized Table Body */}
      {sortedData.length > 0 ? (
        <div
          ref={scrollElementRef}
          className="overflow-auto"
          style={{ height }}
          onScroll={handleScroll}
        >
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleItems.map((item, index) => {
                const actualIndex = startIndex + index;
                return (
                  <div
                    key={actualIndex}
                    className={`flex items-center border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                    style={{ height: itemHeight }}
                    onClick={() => onRowClick?.(item, actualIndex)}
                  >
                    {columns.map((column, colIndex) => {
                      const width = column.width || 150;
                      const value = column.render 
                        ? column.render(item, actualIndex)
                        : String((item as any)[column.key] || '');

                      return (
                        <div
                          key={`${column.key as string}-${colIndex}`}
                          className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 truncate"
                          style={{ width, minWidth: width, maxWidth: width }}
                        >
                          {value}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No data found</p>
          <p className="text-sm">
            {searchTerm ? 'Try adjusting your search terms' : 'No items to display'}
          </p>
        </div>
      )}

      {/* Footer with count */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {visibleItems.length} of {sortedData.length} items
            {sortedData.length !== data.length && (
              <span className="ml-2 text-gray-500">
                ({data.length} total)
              </span>
            )}
            {searchTerm && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                (filtered by "{searchTerm}")
              </span>
            )}
          </div>
          {sortConfig && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Sorted by {String(sortConfig.key)} ({sortConfig.direction})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export types for external use
export type { Column as VirtualizedTableColumn };
