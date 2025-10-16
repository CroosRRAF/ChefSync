import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Clock,
  DollarSign,
  Download,
  Eye,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShoppingCart,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// Helper functions
const getStatusBadge = (user: User) => {
  const status = user.approval_status || user.status;

  if (status === "pending") {
    return (
      <Badge
        variant="outline"
        className="bg-yellow-50 text-yellow-700 border-yellow-200"
      >
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  } else if (status === "approved" || status === "active") {
    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200"
      >
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    );
  } else if (status === "rejected") {
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200"
      >
        <XCircle className="h-3 w-3 mr-1" />
        Rejected
      </Badge>
    );
  } else if (!user.is_active) {
    return (
      <Badge
        variant="outline"
        className="bg-gray-50 text-gray-700 border-gray-200"
      >
        <AlertCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-blue-50 text-blue-700 border-blue-200"
    >
      <CheckCircle className="h-3 w-3 mr-1" />
      Active
    </Badge>
  );
};

const getRoleBadge = (role: string) => {
  const roleColors = {
    admin: "bg-purple-50 text-purple-700 border-purple-200",
    customer: "bg-blue-50 text-blue-700 border-blue-200",
    cook: "bg-orange-50 text-orange-700 border-orange-200",
    delivery_agent: "bg-green-50 text-green-700 border-green-200",
  };

  const colorClass =
    roleColors[role as keyof typeof roleColors] ||
    "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <Badge variant="outline" className={colorClass}>
      {role.charAt(0).toUpperCase() + role.slice(1).replace("_", " ")}
    </Badge>
  );
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString();
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// User Hover Preview Component
interface UserHoverPreviewProps {
  user: User;
  isVisible: boolean;
  position: { x: number; y: number };
}

const UserHoverPreview: React.FC<UserHoverPreviewProps> = ({
  user,
  isVisible,
  position,
}) => {
  if (!isVisible || !user) return null;

  return (
    <div
      className="fixed z-50 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-w-sm w-full pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" />
            <AvatarFallback className="text-sm">
              {user.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {user.name}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getRoleBadge(user.role)}
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">
              {user.email}
            </span>
          </div>
          {user.phone_no && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">
                {user.phone_no}
              </span>
            </div>
          )}
          {user.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300 truncate">
                {user.address}
              </span>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
            <div className="mt-1">{getStatusBadge(user)}</div>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {formatDate(user.date_joined)}
              </span>
            </div>
          </div>
        </div>

        {/* Activity Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total Orders
            </p>
            <div className="flex items-center gap-1 mt-1">
              <ShoppingCart className="h-3 w-3 text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {user.total_orders || 0}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total Spent
            </p>
            <div className="flex items-center gap-1 mt-1">
              <DollarSign className="h-3 w-3 text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(user.total_spent || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Last Login */}
        {user.last_login && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last Login
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {formatDate(user.last_login)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  approval_status?: string;
  status?: string;
  last_login: string | null;
  date_joined: string;
  total_orders: number;
  total_spent: number;
  phone_no?: string;
  address?: string;
  documents?: Array<{
    id: number;
    file_name: string;
    document_type: string;
    status: string;
  }>;
}

interface EnhancedUserTableProps {
  data: User[];
  title?: string;
  searchable?: boolean;
  selectable?: boolean;
  onRowClick?: (user: User) => void;
  onRefresh?: () => void;
  onExport?: (data: User[]) => void;
  onApprove?: (user: User) => void;
  onReject?: (user: User) => void;
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

type SortConfig = {
  key: keyof User | string;
  direction: "asc" | "desc";
} | null;

const EnhancedUserTable: React.FC<EnhancedUserTableProps> = ({
  data,
  title,
  searchable = true,
  selectable = false,
  onRowClick,
  onRefresh,
  onExport,
  onApprove,
  onReject,
  loading = false,
  pagination,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Filter data based on search query
  const filteredData = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];

    if (!searchQuery.trim()) return safeData;

    return safeData.filter((user) =>
      Object.values(user).some((value) =>
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
  const handleSort = (key: keyof User | string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  // Handle row selection
  const handleRowSelect = (index: number, checked: boolean) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      return newSet;
    });
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
    return Array.from(selectedRows).map((index) => paginatedData[index]);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title || "Users"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading users...</span>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </CardHeader>
      )}

      <CardContent>
        {/* Table */}
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
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("name")}
                    className="h-auto p-0 font-semibold"
                  >
                    Name
                    {sortConfig?.key === "name" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                      ))}
                    {sortConfig?.key !== "name" && (
                      <ChevronsUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("email")}
                    className="h-auto p-0 font-semibold"
                  >
                    Email
                    {sortConfig?.key === "email" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                      ))}
                    {sortConfig?.key !== "email" && (
                      <ChevronsUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("role")}
                    className="h-auto p-0 font-semibold"
                  >
                    Role
                    {sortConfig?.key === "role" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                      ))}
                    {sortConfig?.key !== "role" && (
                      <ChevronsUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("approval_status")}
                    className="h-auto p-0 font-semibold"
                  >
                    Status
                    {sortConfig?.key === "approval_status" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                      ))}
                    {sortConfig?.key !== "approval_status" && (
                      <ChevronsUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("date_joined")}
                    className="h-auto p-0 font-semibold"
                  >
                    Joined
                    {sortConfig?.key === "date_joined" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                      ))}
                    {sortConfig?.key !== "date_joined" && (
                      <ChevronsUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((user, index) => (
                <TableRow
                  key={user.id}
                  className={cn(
                    "transition-all duration-200 relative",
                    onRowClick &&
                      "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                    selectedRows.has(index) && "bg-blue-50 dark:bg-blue-900/20",
                    hoveredRow === index &&
                      "bg-gray-50 dark:bg-gray-800 shadow-sm"
                  )}
                  onClick={() => onRowClick?.(user)}
                  onMouseEnter={(e) => {
                    setHoveredRow(index);
                    setHoveredUser(user);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltipPosition({
                      x: rect.left + rect.width / 2,
                      y: rect.top - 10,
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredRow(null);
                    setHoveredUser(null);
                  }}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(index)}
                        onCheckedChange={(checked) =>
                          handleRowSelect(index, Boolean(checked))
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">
                          {user.name
                            ? user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        {user.phone_no && (
                          <span className="text-sm text-gray-500">
                            {user.phone_no}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{user.email}</span>
                      {user.address && (
                        <span className="text-sm text-gray-500 truncate max-w-xs">
                          {user.address}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{formatDate(user.date_joined)}</span>
                      <span className="text-sm text-gray-500">
                        Last: {formatDate(user.last_login)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick?.(user);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {user.approval_status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              onApprove?.(user);
                            }}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReject?.(user);
                            }}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={selectable ? 7 : 6}
                    className="text-center py-8"
                  >
                    <div className="text-gray-500 dark:text-gray-400">
                      {searchQuery
                        ? "No users found matching your search"
                        : "No users available"}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* User Hover Preview Tooltip */}
        <UserHoverPreview
          user={hoveredUser!}
          isVisible={hoveredUser !== null}
          position={tooltipPosition}
        />

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
              {Math.min(
                pagination.page * pagination.pageSize,
                pagination.total
              )}{" "}
              of {pagination.total} users
            </div>
            <div className="flex items-center space-x-2">
              <Select
                value={pagination.pageSize.toString()}
                onValueChange={(value) =>
                  pagination.onPageSizeChange(Number(value))
                }
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm">
                  Page {pagination.page} of{" "}
                  {Math.ceil(pagination.total / pagination.pageSize)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  disabled={
                    pagination.page >=
                    Math.ceil(pagination.total / pagination.pageSize)
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedUserTable;
