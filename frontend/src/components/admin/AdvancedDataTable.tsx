import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Settings,
  X
} from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface FilterOption {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  action: (selectedRows: T[]) => void;
  variant?: 'default' | 'destructive';
  disabled?: (selectedRows: T[]) => boolean;
}

interface AdvancedDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  selectable?: boolean;
  bulkActions?: BulkAction<T>[];
  filters?: FilterOption[];
  onRowClick?: (row: T) => void;
  onRefresh?: () => void;
  onExport?: (data: T[]) => void;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  className?: string;
  pageSize?: number;
  showPagination?: boolean;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
}

type SortDirection = 'asc' | 'desc' | null;

function AdvancedDataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  searchable = true,
  filterable = true,
  sortable = true,
  selectable = true,
  bulkActions = [],
  filters = [],
  onRowClick,
  onRefresh,
  onExport,
  loading = false,
  error,
  emptyMessage = 'No data available',
  className = '',
  pageSize = 10,
  showPagination = true,
  onPageChange,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0
}: AdvancedDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Get unique identifier for each row
  const getRowId = useCallback((row: T): string => {
    return row.id?.toString() || JSON.stringify(row);
  }, []);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(column => {
          const value = row[column.key as keyof T];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(row => {
          const rowValue = row[key];
          return rowValue?.toString().toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        const aValue = a[sortColumn as keyof T];
        const bValue = b[sortColumn as keyof T];
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, activeFilters, sortColumn, sortDirection, columns]);

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (!sortable) return;
    
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Handle row selection
  const handleSelectRow = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(processedData.map(row => getRowId(row))));
    } else {
      setSelectedRows(new Set());
    }
  };

  // Get selected rows data
  const selectedRowsData = useMemo(() => {
    return processedData.filter(row => selectedRows.has(getRowId(row)));
  }, [processedData, selectedRows, getRowId]);

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
  };

  // Get sort icon
  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className="h-4 w-4 text-blue-600" />;
    }
    if (sortDirection === 'desc') {
      return <ChevronDown className="h-4 w-4 text-blue-600" />;
    }
    return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
  };

  const isAllSelected = processedData.length > 0 && selectedRows.size === processedData.length;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < processedData.length;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title || 'Data Table'}</CardTitle>
            <RefreshCw className="h-4 w-4 animate-spin" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">{title || 'Data Table'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">Error loading data</div>
            <div className="text-sm text-gray-500">{error}</div>
            {onRefresh && (
              <Button onClick={onRefresh} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title || 'Data Table'}</CardTitle>
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={() => onExport(processedData)}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-4">
            {searchable && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            
            {filterable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-blue-50 border-blue-200' : ''}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {Object.values(activeFilters).filter(Boolean).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {Object.values(activeFilters).filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="text-sm font-medium mb-2 block">{filter.label}</label>
                  <Select
                    value={activeFilters[filter.key] || ''}
                    onValueChange={(value) => handleFilterChange(filter.key, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${filter.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="flex items-end">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedRows.size > 0 && bulkActions.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm font-medium">
                {selectedRows.size} item{selectedRows.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                {bulkActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={() => action.action(selectedRowsData)}
                    disabled={action.disabled?.(selectedRowsData)}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      ref={(el) => {
                        if (el && 'indeterminate' in el) {
                          (el as any).indeterminate = isIndeterminate;
                        }
                      }}
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead
                    key={column.key as string}
                    className={`${column.width || ''} ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.title}</span>
                      {sortable && column.sortable !== false && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleSort(column.key as string)}
                        >
                          {getSortIcon(column.key as string)}
                        </Button>
                      )}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (selectable ? 2 : 1)} className="text-center py-8">
                    <div className="text-gray-500">{emptyMessage}</div>
                  </TableCell>
                </TableRow>
              ) : (
                processedData.map((row, index) => (
                  <TableRow
                    key={getRowId(row)}
                    className={onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(getRowId(row))}
                          onCheckedChange={(checked) => handleSelectRow(getRowId(row), checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={column.key as string}
                        className={`${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                      >
                        {column.render
                          ? column.render(row[column.key as keyof T], row)
                          : row[column.key as keyof T]?.toString() || '-'
                        }
                      </TableCell>
                    ))}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AdvancedDataTable;
