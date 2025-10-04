import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Download,
  RefreshCw,
  Search,
} from "lucide-react";
import React, { memo, useMemo, useState } from "react";

export interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  action: (selectedRows: T[]) => void;
  variant?: "default" | "destructive";
  disabled?: (selectedRows: T[]) => boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  searchable?: boolean;
  selectable?: boolean;
  bulkActions?: BulkAction<T>[];
  onRowClick?: (row: T, index: number) => void;
  onRefresh?: () => void;
  onExport?: (data: T[]) => void;
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  className?: string;
}

type SortConfig<T> = {
  key: keyof T | string;
  direction: "asc" | "desc";
} | null;

const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  title,
  searchable = true,
  selectable = false,
  bulkActions = [],
  onRowClick,
  onRefresh,
  onExport,
  loading = false,
  pagination,
  className = "",
}: DataTableProps<T>) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(null);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginated data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, pagination]);

  // Handle sorting
  const handleSort = (key: keyof T | string) => {
    const column = columns.find((col) => col.key === key);
    if (!column?.sortable) return;

    setSortConfig((prevConfig) => {
      if (prevConfig?.key === key) {
        if (prevConfig.direction === "asc") {
          return { key, direction: "desc" };
        } else {
          return null; // Remove sorting
        }
      }
      return { key, direction: "asc" };
    });
  };

  // Handle row selection
  const handleRowSelect = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map((_, index) => index)));
    } else {
      setSelectedRows(new Set());
    }
  };

  // Get selected row data
  const getSelectedRowData = () => {
    return Array.from(selectedRows)
      .map((index) => paginatedData[index])
      .filter(Boolean);
  };

  // Render sort icon
  const renderSortIcon = (columnKey: keyof T | string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return null;

    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === "asc" ? (
        <ChevronUp size={16} />
      ) : (
        <ChevronDown size={16} />
      );
    }
    return <ChevronsUpDown size={16} className="opacity-50" />;
  };

  // Render cell content
  const renderCell = (column: Column<T>, row: T, rowIndex: number) => {
    // Safety check: ensure row exists
    if (!row) {
      return <span className="text-gray-400">N/A</span>;
    }

    const value = row[column.key as keyof T];

    if (column.render) {
      try {
        return column.render(value, row, rowIndex);
      } catch (error) {
        console.error("Error rendering cell:", error, {
          column: column.key,
          row,
          rowIndex,
        });
        return <span className="text-red-400">Error</span>;
      }
    }

    // Default rendering based on value type
    if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Yes" : "No"}
        </Badge>
      );
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    return String(value || "");
  };

  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {/* Header */}
      {(title ||
        searchable ||
        onRefresh ||
        onExport ||
        selectedRows.size > 0) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {title && <CardTitle>{title}</CardTitle>}
              {selectedRows.size > 0 && (
                <Badge variant="secondary">{selectedRows.size} selected</Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Bulk Actions */}
              {selectedRows.size > 0 && bulkActions.length > 0 && (
                <div className="flex items-center space-x-2">
                  {bulkActions.map((action, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant={action.variant || "default"}
                      onClick={() => action.action(getSelectedRowData())}
                      disabled={action.disabled?.(getSelectedRowData())}
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              {onRefresh && (
                <Button size="sm" variant="outline" onClick={onRefresh}>
                  <RefreshCw size={16} />
                </Button>
              )}
              {onExport && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onExport(data)}
                >
                  <Download size={16} />
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          {searchable && (
            <div className="relative w-full max-w-sm">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </CardHeader>
      )}

      {/* Table */}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedRows.size === paginatedData.length &&
                        paginatedData.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    style={{ width: column.width }}
                    className={cn(
                      "text-left",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      column.sortable &&
                        "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.title}</span>
                      {renderSortIcon(column.key)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  className={cn(
                    onRowClick &&
                      "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                    selectedRows.has(index) && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(index)}
                        onCheckedChange={(checked) =>
                          handleRowSelect(index, checked)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.key)}
                      className={cn(
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right"
                      )}
                    >
                      {renderCell(column, row, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="text-center py-8"
                  >
                    <div className="text-gray-500 dark:text-gray-400">
                      {searchQuery ? "No results found" : "No data available"}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)}{" "}
            of {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={
                pagination.page * pagination.pageSize >= pagination.total
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default memo(DataTable) as typeof DataTable;
