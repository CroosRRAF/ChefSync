import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  UserCheck,
  UserX,
  Download,
  FileText,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreVertical,
  Plus,
  Edit,
  Trash2,
  Ban,
  Unlock,
  Send,
  MessageSquare,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart,
  Download as DownloadIcon,
  Upload,
  Settings,
  Bell,
  Star,
  Award,
  Target,
  Zap,
  Globe,
  Database,
  Lock,
  Unlock as UnlockIcon,
  UserPlus,
  UserMinus,
  UserCog,
  UserEdit,
  UserSearch,
  UserShield,
  UserCheck as UserCheckIcon,
  UserX as UserXIcon,
  UserClock,
  UserAlert,
  UserStar,
  UserAward,
  UserTarget,
  UserZap,
  UserGlobe,
  UserDatabase,
  UserLock,
  UserUnlock,
  UserPlus as UserPlusIcon,
  UserMinus as UserMinusIcon,
  UserCog as UserCogIcon,
  UserEdit as UserEditIcon,
  UserSearch as UserSearchIcon,
  UserShield as UserShieldIcon,
  UserCheckIcon as UserCheckIconIcon,
  UserXIcon as UserXIconIcon,
  UserClock as UserClockIcon,
  UserAlert as UserAlertIcon,
  UserStar as UserStarIcon,
  UserAward as UserAwardIcon,
  UserTarget as UserTargetIcon,
  UserZap as UserZapIcon,
  UserGlobe as UserGlobeIcon,
  UserDatabase as UserDatabaseIcon,
  UserLock as UserLockIcon,
  UserUnlock as UserUnlockIcon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { adminService, type AdminUser, type PendingApprovalUser, type ApprovalDocument } from '@/services/adminService';
import AdvancedDataTable from '@/components/admin/AdvancedDataTable';
import AdvancedStatsCard from '@/components/admin/AdvancedStatsCard';

interface DocumentPreviewState {
  doc: ApprovalDocument;
  url: string;
  type: "image" | "pdf" | "other";
  displayName: string;
}

const UltimateUserManagement: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // State management
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  });

  // Filters and search
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    approval_status: "",
  });

  // User details and modals
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedApprovalUser, setSelectedApprovalUser] = useState<PendingApprovalUser | null>(null);

  // Document preview
  const [documentPreview, setDocumentPreview] = useState<DocumentPreviewState | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    pending_approvals: 0,
    rejected_users: 0,
    new_users_today: 0,
    users_by_role: {
      customer: 0,
      cook: 0,
      delivery_agent: 0,
      admin: 0
    }
  });

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        role: filters.role,
        status: filters.status,
        approval_status: filters.approval_status,
      });

      setUsers(response.users);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        pages: Math.ceil(response.total / prev.limit)
      }));
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Load pending approvals
  const loadPendingApprovals = useCallback(async () => {
    try {
      const response = await adminService.getPendingApprovals();
      setPendingApprovals(response);
    } catch (err) {
      console.error('Error loading pending approvals:', err);
    }
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const response = await adminService.getUserStats();
      setStats(response);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadUsers();
    loadPendingApprovals();
    loadStats();
  }, [loadUsers, loadPendingApprovals, loadStats]);

  // Handle user approval
  const handleUserApproval = useCallback(async (userId: number, status: 'approved' | 'rejected', notes?: string) => {
    try {
      await adminService.approveUser(userId, status, notes);
      await loadUsers();
      await loadPendingApprovals();
      await loadStats();
      setShowApprovalModal(false);
      setSelectedApprovalUser(null);
    } catch (err) {
      console.error('Error approving user:', err);
      setError('Failed to approve user');
    }
  }, [loadUsers, loadPendingApprovals, loadStats]);

  // Handle user status change
  const handleUserStatusChange = useCallback(async (userId: number, status: 'active' | 'inactive') => {
    try {
      await adminService.updateUserStatus(userId, status);
      await loadUsers();
      await loadStats();
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Failed to update user status');
    }
  }, [loadUsers, loadStats]);

  // Handle document preview
  const handleDocumentPreview = useCallback(async (doc: ApprovalDocument) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewLoading(true);
    setDocumentPreview({
      doc,
      url: "",
      type: "other",
      displayName: doc.file_name || "Document"
    });

    try {
      const blob = await adminService.fetchDocumentBlob(doc.id);
      const objectUrl = URL.createObjectURL(blob);
      previewUrlRef.current = objectUrl;

      setDocumentPreview(prev => prev ? { ...prev, url: objectUrl } : null);
    } catch (error) {
      console.error('Failed to load document preview:', error);
      setDocumentPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // Handle document download
  const handleDocumentDownload = useCallback(async (doc: ApprovalDocument) => {
    try {
      const blob = await adminService.fetchDocumentBlob(doc.id);
      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = doc.file_name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  }, []);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'cook':
        return 'bg-orange-100 text-orange-800';
      case 'delivery_agent':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, permissions, and approvals
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats.new_users_today}</span> new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_users}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.active_users / stats.total_users) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_approvals}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Users</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected_users}</div>
            <p className="text-xs text-muted-foreground">
              Need review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="approvals">
            Pending Approvals
            {stats.pending_approvals > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.pending_approvals}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* All Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search users..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All roles</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="cook">Cook</SelectItem>
                      <SelectItem value="delivery_agent">Delivery Agent</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="approval_status">Approval Status</Label>
                  <Select value={filters.approval_status} onValueChange={(value) => setFilters(prev => ({ ...prev, approval_status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All approval statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All approval statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({pagination.total})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.profile_image} />
                        <AvatarFallback>
                          {user.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                          {user.approval_status && (
                            <Badge className={getStatusColor(user.approval_status)}>
                              {user.approval_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserStatusChange(user.id, user.status === 'active' ? 'inactive' : 'active')}>
                            {user.status === 'active' ? (
                              <>
                                <Ban className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Unlock className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals ({pendingApprovals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((approvalUser) => (
                  <div key={approvalUser.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={approvalUser.profile_image} />
                          <AvatarFallback>
                            {approvalUser.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{approvalUser.name}</h3>
                          <p className="text-sm text-muted-foreground">{approvalUser.email}</p>
                          <Badge className={getRoleColor(approvalUser.role)}>
                            {approvalUser.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedApprovalUser(approvalUser);
                            setShowApprovalModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleUserApproval(approvalUser.id, 'approved')}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleUserApproval(approvalUser.id, 'rejected')}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Users by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.users_by_role).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <span className="capitalize">{role.replace('_', ' ')}</span>
                      <Badge className={getRoleColor(role)}>
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>New Users Today</span>
                    <Badge variant="outline">{stats.new_users_today}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Users</span>
                    <Badge variant="outline">{stats.active_users}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pending Approvals</span>
                    <Badge variant="destructive">{stats.pending_approvals}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Detail Modal */}
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.profile_image} />
                  <AvatarFallback>
                    {selectedUser.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getRoleColor(selectedUser.role)}>
                      {selectedUser.role}
                    </Badge>
                    <Badge className={getStatusColor(selectedUser.status)}>
                      {selectedUser.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm">{selectedUser.phone_no || 'Not provided'}</p>
                </div>
                <div>
                  <Label>Address</Label>
                  <p className="text-sm">{selectedUser.address || 'Not provided'}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Last Login</Label>
                  <p className="text-sm">{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Review User Application</DialogTitle>
          </DialogHeader>
          {selectedApprovalUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedApprovalUser.profile_image} />
                  <AvatarFallback>
                    {selectedApprovalUser.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{selectedApprovalUser.name}</h3>
                  <p className="text-muted-foreground">{selectedApprovalUser.email}</p>
                  <Badge className={getRoleColor(selectedApprovalUser.role)}>
                    {selectedApprovalUser.role}
                  </Badge>
                </div>
              </div>

              {/* Documents */}
              {selectedApprovalUser.documents && selectedApprovalUser.documents.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedApprovalUser.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.document_type?.name || 'Document'}</p>
                            <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDocumentPreview(doc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDocumentDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowApprovalModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleUserApproval(selectedApprovalUser.id, 'rejected')}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  onClick={() => handleUserApproval(selectedApprovalUser.id, 'approved')}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UltimateUserManagement;
